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

/**
 * Fires a Meta event on the browser pixel and mirrors it to the
 * Conversions API with the same event_id (deduplication).
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
    },
  }).catch(() => {});
}
