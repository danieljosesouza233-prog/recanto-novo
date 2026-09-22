import { sendMetaEvent } from "./meta-capi.functions";

type TrackOptions = {
  value?: number;
  currency?: string;
  userData?: { name?: string; phone?: string };
};

function newEventId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** _fbc: reads the existing cookie or derives it from a fresh ?fbclid= click. */
function getFbc(): string | undefined {
  const existing = getCookie("_fbc");
  if (existing) return existing;
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  if (!fbclid) return undefined;
  return `fb.1.${Date.now()}.${fbclid}`;
}

/** Persistent anonymous id for this browser, used as external_id before we know the donor. */
function getAnonId(): string | undefined {
  try {
    const key = "_anon_id";
    let id = localStorage.getItem(key);
    if (!id) {
      id = newEventId();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

/**
 * Fires a Meta event on the browser pixel and mirrors it to the
 * Conversions API with the same event_id (deduplication), attaching every
 * browser-side signal available (fbp/fbc/user agent) to maximize Event
 * Match Quality even before the donor has entered name/phone.
 */
export function trackMeta(eventName: string, options: TrackOptions = {}) {
  if (typeof window === "undefined") return;
  const eventId = newEventId();
  const custom: Record<string, unknown> = {};
  if (options.value !== undefined) {
    custom.value = options.value;
    custom.currency = options.currency ?? "BRL";
  }

  try {
    (window as any).fbq?.("track", eventName, custom, { eventID: eventId });
  } catch {
    /* noop */
  }

  void sendMetaEvent({
    data: {
      eventName,
      eventId,
      eventSourceUrl: window.location.href,
      value: options.value,
      currency: options.value !== undefined ? (options.currency ?? "BRL") : undefined,
      userData: options.userData,
      fbp: getCookie("_fbp"),
      fbc: getFbc(),
      userAgent: navigator.userAgent,
      anonId: getAnonId(),
    },
  }).catch(() => {});
}
