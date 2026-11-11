import { MOCK_SAMPLES } from "./samples.js";

const PATTERNS = [
  {
    type: "private key",
    re: /-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+ PRIVATE KEY-----/g,
  },
  {
    type: "database URL",
    re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:[^\s@/]+@[^\s]+/gi,
  },
  {
    type: "bearer token",
    re: /\bBearer\s+[A-Za-z0-9._\-+/=]{10,}/gi,
  },
  {
    type: "JWT",
    re: /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
  },
  {
    type: "AWS access key",
    re: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
  },
  {
    type: "GitHub token",
    re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
  },
  {
    type: "Slack token",
    re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g,
  },
  {
    type: "Stripe key",
    re: /\b(?:sk|rk)_(?:live|test|demo)_[0-9A-Za-z]{16,}\b/g,
  },
  {
    type: "API key",
    re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    type: "Google API key",
    re: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    type: "email",
    re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  },
  {
    type: "tracking number",
    re: /\b1Z[0-9A-Z]{16}\b/g,
  },
  {
    type: "order ID",
    re: /\bORD-\d{4}-\d{4}\b/g,
  },
  {
    type: "IBAN",
    re: /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}[ ]?[A-Z0-9]{0,4}\b/g,
  },
  {
    type: "credit card",
    re: /\b(?:\d[ -]?){13,19}\b/g,
    validate: luhn,
  },
  {
    type: "SSN",
    re: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  {
    type: "phone",
    re: /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{3}[\s.-]\d{3}[\s.-]\d{3,4}\b/g,
  },
  {
    type: "password",
    re: /\b(?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|secret[_-]?key)\s*[:=]\s*(?!\[REDACTED)[^\s,;]+/gi,
  },
  {
    type: "IP address",
    re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  },
  {
    type: "MAC address",
    re: /\b(?:[0-9A-F]{2}[:-]){5}[0-9A-F]{2}\b/gi,
  },
];

export { MOCK_SAMPLES };
export const DEFAULT_SAMPLE = "sample.png";
export const MOCK_SAMPLE_BOXES = MOCK_SAMPLES[DEFAULT_SAMPLE].boxes;

export function luhn(value) {
  const digits = String(value).replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

export function redactText(text) {
  let output = String(text ?? "");
  const findings = [];
  const seen = new Set();
  for (const { type, re, validate } of PATTERNS) {
    output = output.replace(re, (match) => {
      if (validate && !validate(match)) return match;
      const key = `${type}:${match}`;
      if (!seen.has(key)) {
        seen.add(key);
        findings.push({ type, value: match });
      }
      return `[REDACTED:${type.toUpperCase()}]`;
    });
  }
  return { text: output, findings };
}

export function redactValues(text, values = []) {
  let output = String(text ?? "");
  const findings = [];
  const seen = new Set();
  for (const item of values) {
    const value = typeof item === "string" ? item : item?.value;
    const type = typeof item === "string" ? "sensitive value" : item?.type || "sensitive value";
    if (!value || String(value).length < 4) continue;
    const key = `${type}:${value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (output.includes(value)) {
      output = output.split(value).join(`[REDACTED:${String(type).toUpperCase()}]`);
      findings.push({ type, value });
    }
  }
  return { text: output, findings };
}

export function mergeFindings(...lists) {
  const out = [];
  const seen = new Set();
  for (const list of lists) {
    for (const item of list || []) {
      const value = typeof item === "string" ? item : item?.value;
      const type = typeof item === "string" ? "sensitive value" : item?.type || "sensitive value";
      if (!value) continue;
      const key = `${type}:${value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ type, value });
    }
  }
  return out;
}

export function parseJsonLoose(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return null;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function readBox(raw, width, height) {
  if (!raw) return null;
  const source = Array.isArray(raw) ? raw : raw.box || raw;
  let x;
  let y;
  let w;
  let h;
  if (Array.isArray(source)) {
    if (source.length !== 4) return null;
    [x, y, w, h] = source;
  } else {
    x = source.x ?? source.left ?? source.x1 ?? source.xmin;
    y = source.y ?? source.top ?? source.y1 ?? source.ymin;
    if (source.w != null || source.width != null) {
      w = source.w ?? source.width;
      h = source.h ?? source.height;
    } else {
      const x2 = source.x2 ?? source.xmax;
      const y2 = source.y2 ?? source.ymax;
      if (x2 == null || y2 == null) return null;
      w = x2 - x;
      h = y2 - y;
    }
  }
  if (![x, y, w, h].every(Number.isFinite)) return null;
  if (x > 1 || y > 1 || w > 1 || h > 1) {
    x /= width || 1;
    y /= height || 1;
    w /= width || 1;
    h /= height || 1;
  }
  x = Math.max(0, Math.min(1, x));
  y = Math.max(0, Math.min(1, y));
  w = Math.max(0, Math.min(1 - x, w));
  h = Math.max(0, Math.min(1 - y, h));
  if (w < 0.005 || h < 0.005) return null;
  return { x, y, w, h };
}

export function normalizeBoxes(boxes = [], width = 1, height = 1) {
  const out = [];
  for (const item of boxes || []) {
    const box = readBox(item?.box || item, width, height);
    if (!box) continue;
    out.push({
      type: item?.type || item?.label || "sensitive",
      value: item?.value || "",
      ...box,
    });
  }
  return out;
}

export function sanitizeModelResult(result, dimensions = {}) {
  const description = result?.description || "";
  const visibleText = result?.visible_text || "";
  const base = [description, visibleText].filter(Boolean).join("\n\n");
  const first = redactText(base);
  const second = redactValues(first.text, result?.sensitive || []);
  const findings = mergeFindings(first.findings, second.findings, result?.sensitive || []);
  const boxes = normalizeBoxes(
    result?.boxes || result?.sensitive || [],
    dimensions.width,
    dimensions.height
  );
  return { sanitized: second.text, findings, boxes };
}

export function findLeaks(text, findings) {
  const source = String(text ?? "");
  const leaks = [];
  const seen = new Set();
  for (const item of findings || []) {
    const value = typeof item === "string" ? item : item?.value;
    if (!value || String(value).length < 4) continue;
    if (seen.has(value)) continue;
    if (source.includes(value)) {
      seen.add(value);
      leaks.push(item);
    }
  }
  return leaks;
}

export function mockModelResult(sample = MOCK_SAMPLES[DEFAULT_SAMPLE]) {
  const isArray = Array.isArray(sample);
  const boxes = isArray ? sample : sample?.boxes || [];
  const text = isArray ? "" : sample?.text || "";
  const label = isArray ? "the sample screenshot" : sample?.label || "the sample screenshot";
  return {
    description: `Mock analysis of ${label}: a realistic screenshot with fake secrets and a cloud API error.`,
    visible_text: text,
    sensitive: boxes.map(({ type, value }) => ({ type, value })),
    boxes: boxes.map((box) => ({ ...box })),
  };
}

export function countByType(findings) {
  const counts = {};
  for (const finding of findings || []) {
    const type = finding.type || "sensitive value";
    counts[type] = (counts[type] || 0) + 1;
  }
  return counts;
}
