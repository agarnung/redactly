import { countByType } from "./redaction.js";

export function dataUrlToBase64(dataUrl) {
  return String(dataUrl || "").split(",")[1] || "";
}

export function base64ToBytes(base64) {
  const binary = atob(String(base64 || ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function sha256Hex(input) {
  if (!globalThis.crypto?.subtle) return "";
  const data =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function buildReceipt({
  sanitized = "",
  redactedDataUrl = "",
  findings = [],
  manualBoxes = 0,
  payloadMode = "text",
  route = "on-device-redaction",
  latencyMs = 0,
  model = "mock",
  appCheck = false,
  rawImageBytes = 0,
  cloudCalls = 0,
  onDeviceCalls = 0,
} = {}) {
  const imageBase64 = dataUrlToBase64(redactedDataUrl);
  const imageBytes = imageBase64 ? base64ToBytes(imageBase64) : new Uint8Array();
  const [textSha256, imageSha256] = await Promise.all([
    sha256Hex(sanitized),
    imageBytes.length ? sha256Hex(imageBytes) : Promise.resolve(""),
  ]);

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    route,
    payloadMode,
    rawImageUploaded: false,
    rawImageBytes,
    secretsSent: 0,
    redactions: findings.length + manualBoxes,
    redactionTypes: countByType(findings),
    manualBoxes,
    textChars: sanitized.length,
    textSha256,
    imageBytes: imageBytes.length,
    imageSha256,
    latencyMs: Math.round(latencyMs),
    model,
    appCheck: Boolean(appCheck),
    cloudCalls,
    onDeviceCalls,
  };
}

export function receiptShortHash(receipt) {
  const hash = receipt?.imageSha256 || receipt?.textSha256 || "";
  return hash ? `sha256:${hash.slice(0, 12)}…` : "sha256:—";
}

export function receiptJson(receipt) {
  return JSON.stringify(receipt, null, 2);
}
