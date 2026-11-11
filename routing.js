export const ROUTE = Object.freeze({
  ON_DEVICE: "on-device",
  CLOUD: "cloud",
});

const COMPLEX_RE =
  /\b(why|explain|debug|root cause|compare|architecture|refactor|design|trade-?off|analy[sz]e|summar|legal|security review|step by step|in detail)\b/i;

export function isComplexQuestion(question) {
  const text = String(question || "").trim();
  if (!text) return false;
  if (text.length > 90) return true;
  return COMPLEX_RE.test(text);
}

export function chooseRoute(
  question,
  { availability = "unavailable", mode = "auto" } = {}
) {
  if (mode === "on-device") return ROUTE.ON_DEVICE;
  if (mode === "cloud") return ROUTE.CLOUD;
  if (availability !== "available") return ROUTE.CLOUD;
  return isComplexQuestion(question) ? ROUTE.CLOUD : ROUTE.ON_DEVICE;
}

export function routeLabel(route) {
  return route === ROUTE.ON_DEVICE ? "on-device" : "cloud";
}

export function formatLatency(ms) {
  const value = Number(ms) || 0;
  return value < 1000 ? `${Math.round(value)} ms` : `${(value / 1000).toFixed(1)} s`;
}

export function routeBadge(route, latencyMs) {
  const icon = route === ROUTE.ON_DEVICE ? "⚡" : "☁";
  const latency = latencyMs == null ? "" : ` · ${formatLatency(latencyMs)}`;
  return `${icon} ${routeLabel(route)}${latency}`;
}
