import assert from "node:assert/strict";
import {
  sha256Hex,
  base64ToBytes,
  buildReceipt,
  receiptShortHash,
  receiptJson,
} from "./receipt.js";

assert.equal(
  await sha256Hex("abc"),
  "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
);
assert.equal(base64ToBytes("YWJj").length, 3);

const receipt = await buildReceipt({
  sanitized: "contact [REDACTED:EMAIL] now",
  findings: [
    { type: "email", value: "ana@example.com" },
    { type: "API key", value: "sk-test-123" },
  ],
  manualBoxes: 1,
  payloadMode: "text",
  route: "on-device",
  latencyMs: 412.4,
  rawImageBytes: 1200000,
  cloudCalls: 0,
  onDeviceCalls: 2,
});
assert.equal(receipt.rawImageUploaded, false);
assert.equal(receipt.secretsSent, 0);
assert.equal(receipt.redactions, 3);
assert.equal(receipt.textSha256.length, 64);
assert.equal(receipt.latencyMs, 412);
assert.equal(receipt.rawImageBytes, 1200000);
assert.match(receiptShortHash(receipt), /^sha256:[0-9a-f]{12}…$/);
assert.equal(JSON.parse(receiptJson(receipt)).version, 1);

console.log("OK: receipt tests passed");
