import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const schema = z.object({
  eventName: z.string().min(1).max(64),
  eventId: z.string().min(1).max(120),
  eventSourceUrl: z.string().max(500).optional(),
  value: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  userData: z
    .object({
      name: z.string().max(120).optional(),
      phone: z.string().max(40).optional(),
    })
    .optional(),
  fbp: z.string().max(120).optional(),
  fbc: z.string().max(200).optional(),
  userAgent: z.string().max(400).optional(),
  anonId: z.string().max(80).optional(),
});

async function sha256(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** lowercase, strip accents/diacritics and extra spaces, per Meta's normalization rules. */
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

// Common Brazilian first names that break the "ends in -a is female / -o is male" rule.
const FEMALE_NAME_EXCEPTIONS = new Set([
  "beatriz", "ingrid", "isis", "carmen", "raquel", "noemi", "miriam", "ester",
  "isabel", "raiane", "yasmin", "nicole", "rayssa", "iris", "elisabete",
]);
const MALE_NAME_EXCEPTIONS = new Set([
  "luca", "joshua", "matheus", "davi", "rafael", "gabriel", "miguel", "daniel",
  "samuel", "guilherme", "andre", "felipe", "igor", "ravi", "heitor",
]);

/** Best-effort guess only — never a substitute for real data, harmless if wrong. */
function guessGender(firstName: string): "f" | "m" | undefined {
  const n = normalize(firstName);
  if (!n) return undefined;
  if (FEMALE_NAME_EXCEPTIONS.has(n)) return "f";
  if (MALE_NAME_EXCEPTIONS.has(n)) return "m";
  if (n.endsWith("a")) return "f";
  if (/[oeril]$/.test(n)) return "m";
  return undefined;
}

export const sendMetaEvent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const token = process.env["META_CAPI_ACCESS_TOKEN"];
    const pixelId = process.env["META_PIXEL_ID"];
    if (!token || !pixelId) return { ok: false as const };

    const user_data: Record<string, string[] | string> = {};
    const rawName = data.userData?.name?.trim().toLowerCase();
    if (rawName) {
      const parts = rawName.split(/\s+/);
      user_data.fn = [await sha256(parts[0]!)];
      if (parts.length > 1) user_data.ln = [await sha256(parts[parts.length - 1]!)];
      const genderGuess = guessGender(parts[0]!);
      if (genderGuess) user_data.ge = [await sha256(genderGuess)];
    }
    const digits = data.userData?.phone?.replace(/\D/g, "");
    let normalizedPhone: string | undefined;
    if (digits && digits.length >= 10) {
      normalizedPhone = digits.startsWith("55") ? digits : `55${digits}`;
      user_data.ph = [await sha256(normalizedPhone)];
    }
    if (data.fbp) user_data.fbp = data.fbp;
    if (data.fbc) user_data.fbc = data.fbc;

    // external_id: persistent anonymous browser id (always) + phone hash (once known).
    const externalIds: string[] = [];
    if (data.anonId) externalIds.push(await sha256(data.anonId));
    if (normalizedPhone) externalIds.push(await sha256(normalizedPhone));
    if (externalIds.length) user_data.external_id = externalIds;

    const request = getRequest();
    const headers = request?.headers;
    const forwardedFor = headers?.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || headers?.get("x-real-ip") || undefined;
    if (clientIp) user_data.client_ip_address = clientIp;
    const clientUserAgent = data.userAgent || headers?.get("user-agent") || undefined;
    if (clientUserAgent) user_data.client_user_agent = clientUserAgent;

    // Geolocation from Vercel's edge-provided IP geo headers — no extra API call, no form fields.
    const geoCity = headers?.get("x-vercel-ip-city");
    const geoRegion = headers?.get("x-vercel-ip-country-region");
    const geoCountry = headers?.get("x-vercel-ip-country");
    const geoZip = headers?.get("x-vercel-ip-postal-code");
    if (geoCity) user_data.ct = [await sha256(normalize(decodeURIComponent(geoCity)))];
    if (geoRegion) user_data.st = [await sha256(normalize(geoRegion))];
    if (geoZip) user_data.zp = [await sha256(geoZip.replace(/\D/g, ""))];
    user_data.country = [await sha256(normalize(geoCountry || "br"))];

    const body = {
      data: [
        {
          event_name: data.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: data.eventId,
          event_source_url: data.eventSourceUrl,
          action_source: "website",
          user_data,
          custom_data:
            data.value !== undefined
              ? { value: data.value, currency: data.currency ?? "BRL" }
              : undefined,
        },
      ],
    };

    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      return { ok: res.ok };
    } catch {
      return { ok: false as const };
    }
  });
