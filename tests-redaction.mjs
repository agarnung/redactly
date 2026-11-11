import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  redactText,
  redactValues,
  parseJsonLoose,
  sanitizeModelResult,
  mockModelResult,
  countByType,
  findLeaks,
  normalizeBoxes,
  mergeFindings,
  luhn,
  MOCK_SAMPLE_BOXES,
  MOCK_SAMPLES,
} from "./redaction.js";

for (const [name, sample] of Object.entries(MOCK_SAMPLES)) {
  const file = name.replace(/\.png$/, "-boxes.json");
  const json = JSON.parse(
    readFileSync(new URL(`./${file}`, import.meta.url), "utf8")
  );
  assert.deepEqual(sample.boxes, json.boxes, name);
}
assert.equal(MOCK_SAMPLE_BOXES.length, MOCK_SAMPLES["sample.png"].boxes.length);

const secrets =
  "mail ana@example.com " +
  "stripe sk_demo_51NxFAKE1234567890abcdef " +
  "openai sk-proj-FAKE1234567890abcdefghijklmnop " +
  "github ghp_FAKE1234567890abcdefghijklmn " +
  "aws AKIAIOSFODNN7EXAMPLE " +
  "slack xoxb-1234567890-abcdefghij " +
  "google AIzaSyFAKE1234567890abcdefghijklmnopqrs " +
  "jwt eyJhbGciOiJIUzI1NiJ9.FAKE.signature " +
  "iban ES91 2100 0418 4502 0005 1332 " +
  "card 4111 1111 1111 1111 " +
  "ssn 123-45-6789 " +
  "phone +34 612 345 678 " +
  "db postgres://admin:hunter2@db.internal:5432/payments " +
  "password=hunter2";

const first = redactText(secrets);
for (const type of [
  "EMAIL",
  "STRIPE KEY",
  "API KEY",
  "GITHUB TOKEN",
  "AWS ACCESS KEY",
  "SLACK TOKEN",
  "GOOGLE API KEY",
  "JWT",
  "IBAN",
  "CREDIT CARD",
  "SSN",
  "PHONE",
  "DATABASE URL",
  "PASSWORD",
]) {
  assert.match(first.text, new RegExp(`\\[REDACTED:${type}\\]`), type);
}
assert.ok(first.findings.length >= 14);

assert.equal(luhn("4111 1111 1111 1111"), true);
assert.equal(luhn("4111 1111 1111 1112"), false);
assert.equal(luhn("1234"), false);
assert.doesNotMatch(redactText("order 1234 5678 9012 3456").text, /REDACTED:CREDIT CARD/);

const second = redactValues("Alejandro and ana@example.com", [
  "Alejandro",
  { type: "email", value: "ana@example.com" },
]);
assert.match(second.text, /\[REDACTED:SENSITIVE VALUE\]/);
assert.match(second.text, /\[REDACTED:EMAIL\]/);

assert.equal(parseJsonLoose("```json\n{\"a\":1}\n```").a, 1);
assert.equal(parseJsonLoose("not json"), null);

const clean = sanitizeModelResult(mockModelResult(MOCK_SAMPLES["sample.png"]), {
  width: 1600,
  height: 900,
});
assert.match(clean.sanitized, /\[REDACTED:EMAIL\]/);
assert.match(clean.sanitized, /\[REDACTED:STRIPE KEY\]/);
assert.match(clean.sanitized, /\[REDACTED:IBAN\]/);
assert.match(clean.sanitized, /\[REDACTED:DATABASE URL\]/);
assert.ok(clean.findings.some((finding) => finding.type === "name"));
assert.ok(clean.findings.length >= 10);
assert.ok(clean.boxes.length >= 12);
for (const box of clean.boxes) {
  assert.ok(box.x >= 0 && box.x <= 1, "x normalized");
  assert.ok(box.y >= 0 && box.y <= 1, "y normalized");
  assert.ok(box.w > 0 && box.x + box.w <= 1.00001, "w normalized");
  assert.ok(box.h > 0 && box.y + box.h <= 1.00001, "h normalized");
}
assert.deepEqual(findLeaks(clean.sanitized, clean.findings), []);

for (const name of ["sample-support.png", "sample-bank.png"]) {
  const result = sanitizeModelResult(mockModelResult(MOCK_SAMPLES[name]), {
    width: 1600,
    height: 900,
  });
  assert.ok(result.sanitized.length > 100, name);
  assert.ok(result.boxes.length >= 5, name);
  assert.deepEqual(findLeaks(result.sanitized, result.findings), [], name);
}

const support = sanitizeModelResult(mockModelResult(MOCK_SAMPLES["sample-support.png"]), {
  width: 1600,
  height: 900,
});
assert.ok(support.findings.some((finding) => finding.type === "order ID"));
assert.ok(support.findings.some((finding) => finding.type === "tracking number"));
assert.ok(support.findings.some((finding) => finding.type === "address"));
assert.ok(support.findings.some((finding) => finding.type === "phone"));

const counts = countByType(clean.findings);
assert.ok(counts.email >= 1);
assert.ok(counts["API key"] >= 2);
assert.ok(counts.IBAN >= 1);

const pixelBoxes = normalizeBoxes(
  [
    { type: "email", value: "a@b.co", box: { x: 160, y: 90, w: 320, h: 36 } },
    { type: "name", value: "Ana", box: [0.1, 0.2, 0.3, 0.05] },
    { type: "phone", value: "123", box: { x1: 0.1, y1: 0.2, x2: 0.3, y2: 0.25 } },
    { type: "bad", value: "x", box: { x: 2, y: 2, w: 0.1, h: 0.1 } },
  ],
  1600,
  900
);
assert.equal(pixelBoxes.length, 3);
assert.ok(Math.abs(pixelBoxes[0].x - 0.1) < 1e-9);
assert.ok(Math.abs(pixelBoxes[1].w - 0.3) < 1e-9);
assert.ok(Math.abs(pixelBoxes[2].w - 0.2) < 1e-9);
assert.equal(pixelBoxes[3], undefined);

const merged = mergeFindings(
  [{ type: "email", value: "ana@example.com" }],
  [{ type: "email", value: "ana@example.com" }, { type: "name", value: "Ana" }]
);
assert.equal(merged.length, 2);

const leak = findLeaks("contact ana@example.com / Ana García now", [
  { type: "email", value: "ana@example.com" },
  { type: "name", value: "Ana García" },
]);
assert.equal(leak.length, 2);

console.log("OK: redaction tests passed");
