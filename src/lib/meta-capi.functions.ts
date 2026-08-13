import { createServerFn } from "@tanstack/react-start";
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
});

async function sha256(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
    }
    const digits = data.userData?.phone?.replace(/\D/g, "");
    if (digits && digits.length >= 10) {
      user_data.ph = [await sha256(digits.startsWith("55") ? digits : `55${digits}`)];
    }

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
