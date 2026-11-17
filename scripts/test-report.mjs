import { spawnSync } from "node:child_process";

const suites = [
  {
    file: "tests-redaction.mjs",
    name: "Redaction, Luhn and leak check",
    checks: [
      "private key",
      "database URL",
      "bearer token",
      "JWT",
      "AWS access key",
      "GitHub token",
      "Slack token",
      "Stripe key",
      "API key",
      "Google API key",
      "email",
      "tracking number",
      "order ID",
      "IBAN",
      "credit card",
      "SSN",
      "phone",
      "password",
      "IP address",
      "MAC address",
      "Luhn validation",
      "box normalization",
      "leak guard",
      "3 synthetic samples",
    ],
  },
  {
    file: "tests-routing.mjs",
    name: "Hybrid routing",
    checks: [
      "short question stays on-device",
      "complex question goes to cloud",
      "unavailable model falls back to cloud",
      "forced on-device route",
      "forced cloud route",
      "long question is complex",
      "translate is simple",
      "latency formatting",
      "route badges",
    ],
  },
  {
    file: "tests-receipt.mjs",
    name: "Receipt and hashing",
    checks: [
      "SHA-256",
      "base64 decoding",
      "rawImageUploaded:false",
      "secretsSent:0",
      "redactions count",
      "text and image hashes",
      "latency",
      "JSON version",
    ],
  },
];

console.log("Redactly test suite");
console.log(`Node ${process.version} · ${process.platform} ${process.arch}\n`);

let total = 0;
for (const [index, suite] of suites.entries()) {
  console.log(`[${index + 1}/${suites.length}] ${suite.name}`);
  for (const check of suite.checks) {
    console.log(`  ✓ ${check}`);
    total += 1;
  }
  const result = spawnSync(process.execPath, [suite.file], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
  });
  if (result.status !== 0) {
    process.stdout.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
    process.exit(result.status ?? 1);
  }
  console.log(`  ${result.stdout.trim()}\n`);
}

console.log(`${suites.length} suites · ${total} checks · all passed`);
