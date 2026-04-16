// src/services/invalidationChannel.ts
// Provides a lightweight cross-tab/channel invalidation mechanism for permissions & navigation caches.
// Uses BroadcastChannel when available with a localStorage fallback for older browsers.

interface InvalidationMessage {
  type: "permissions-invalidated" | "navigation-invalidated";
  clinicId: string;
  userIds?: string[]; // Optional: target specific users
  ts: number;
}

const CHANNEL_NAME = "procaresoft-invalidations";
let bc: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined")
    return null;
  if (!bc) bc = new BroadcastChannel(CHANNEL_NAME);

  return bc;
}

export type InvalidationListener = (msg: InvalidationMessage) => void;

const listeners = new Set<InvalidationListener>();

function handleStorageEvent(ev: StorageEvent) {
  if (ev.key !== CHANNEL_NAME || !ev.newValue) return;
  try {
    const msg: InvalidationMessage = JSON.parse(ev.newValue);

    listeners.forEach((l) => l(msg));
  } catch {}
}

function wireChannelOnce() {
  const channel = getChannel();

  if (channel) {
    channel.onmessage = (e) => {
      const msg = e.data as InvalidationMessage;

      listeners.forEach((l) => l(msg));
    };
  } else if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent);
  }
}

wireChannelOnce();

export function broadcastPermissionsInvalidated(
  clinicId: string,
  userIds?: string[],
) {
  const message: InvalidationMessage = {
    type: "permissions-invalidated",
    clinicId,
    userIds,
    ts: Date.now(),
  };
  const channel = getChannel();

  if (channel) {
    channel.postMessage(message);
  } else if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CHANNEL_NAME, JSON.stringify(message));
      // Clean up to avoid accumulation
      setTimeout(() => {
        try {
          window.localStorage.removeItem(CHANNEL_NAME);
        } catch {}
      }, 50);
    } catch {}
  }
}

export function onInvalidation(listener: InvalidationListener) {
  listeners.add(listener);

  return () => listeners.delete(listener);
}
