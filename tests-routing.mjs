import assert from "node:assert/strict";
import {
  ROUTE,
  chooseRoute,
  isComplexQuestion,
  formatLatency,
  routeBadge,
} from "./routing.js";

assert.equal(chooseRoute("what does this button say?", { availability: "available" }), ROUTE.ON_DEVICE);
assert.equal(chooseRoute("why did this 401 happen and how do I fix it?", { availability: "available" }), ROUTE.CLOUD);
assert.equal(chooseRoute("short", { availability: "unavailable" }), ROUTE.CLOUD);
assert.equal(chooseRoute("short", { availability: "available", mode: "on-device" }), ROUTE.ON_DEVICE);
assert.equal(chooseRoute("explain this in detail", { availability: "available", mode: "cloud" }), ROUTE.CLOUD);
assert.equal(isComplexQuestion("x".repeat(120)), true);
assert.equal(isComplexQuestion("translate this"), false);
assert.equal(formatLatency(412), "412 ms");
assert.equal(formatLatency(1840), "1.8 s");
assert.match(routeBadge(ROUTE.ON_DEVICE, 412), /⚡ on-device · 412 ms/);
assert.match(routeBadge(ROUTE.CLOUD, 1840), /☁ cloud · 1.8 s/);

console.log("OK: routing tests passed");
