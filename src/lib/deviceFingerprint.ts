const STORAGE_KEY = "talktocas_device_fingerprint";

function randomPart() {
  return Math.random().toString(36).slice(2, 10);
}

export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") {
    return "server-side-device";
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const fingerprint = [
    "ttc",
    navigator.platform || "platform",
    navigator.language || "lang",
    String(window.screen?.width || 0),
    String(window.screen?.height || 0),
    randomPart(),
    randomPart(),
  ].join("-");

  window.localStorage.setItem(STORAGE_KEY, fingerprint);
  return fingerprint;
}
