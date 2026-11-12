import {
  MOCK_SAMPLES,
  DEFAULT_SAMPLE,
  sanitizeModelResult,
  parseJsonLoose,
  mockModelResult,
  countByType,
  findLeaks,
} from "./redaction.js";
import {
  ROUTE,
  chooseRoute,
  routeBadge as routeBadgeText,
  formatLatency,
} from "./routing.js";
import {
  buildReceipt,
  receiptShortHash,
  receiptJson,
  dataUrlToBase64,
  base64ToBytes,
} from "./receipt.js";

const $ = (id) => document.getElementById(id);
const imageInput = $("imageInput");
const dropzone = $("dropzone");
const preview = $("preview");
const previewEmpty = $("previewEmpty");
const previewInner = $("previewInner");
const previewImg = $("previewImg");
const boxCanvas = $("boxCanvas");
const redactedPreview = $("redactedPreview");
const promptEl = $("prompt");
const payloadEl = $("payload");
const routeModeEl = $("routeMode");
const output = $("output");
const sanitizedEl = $("sanitized");
const findingsEl = $("findings");
const ledgerEl = $("ledger");
const statusEl = $("status");
const dot = $("dot");
const configBadge = $("configBadge");
const deviceBadge = $("deviceBadge");
const privacyBadge = $("privacyBadge");
const routeBadgeEl = $("routeBadge");
const downloadBtn = $("downloadBtn");
const resetBoxesBtn = $("resetBoxesBtn");
const receiptHashEl = $("receiptHash");
const receiptBtn = $("receiptBtn");
const sampleSelect = $("sampleSelect");
const compareWrap = $("compareWrap");
const compareInner = $("compareInner");
const compareRaw = $("compareRaw");
const compareRedacted = $("compareRedacted");
const compareRange = $("compareRange");
const riskRedactions = $("riskRedactions");
const riskSent = $("riskSent");
const riskRaw = $("riskRaw");
const riskPayload = $("riskPayload");
const riskDevice = $("riskDevice");
const riskCloud = $("riskCloud");
const riskNote = $("riskNote");
const progressEl = $("progress");
const snackbarEl = $("snackbar");
const receiptDialog = $("receiptDialog");
const receiptJsonEl = $("receiptJson");
const viewReceiptBtn = $("viewReceiptBtn");
const copyReceiptBtn = $("copyReceiptBtn");
const closeReceiptBtn = $("closeReceiptBtn");
const downloadReceiptBtn = $("downloadReceiptBtn");
const payloadGroup = $("payloadGroup");
const routeModeGroup = $("routeModeGroup");
const themeToggle = $("themeToggle");

const THEME_KEY = "redactly-theme";
function applyTheme(theme) {
  const dark = theme !== "light";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  if (!themeToggle) return;
  themeToggle.textContent = dark ? "☀" : "☾";
  themeToggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  themeToggle.setAttribute("aria-pressed", String(!dark));
  themeToggle.title = dark ? "Switch to light theme" : "Switch to dark theme";
}
function initialTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}
applyTheme(initialTheme());
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch {}
  });
}

const cfg = window.FIREBASE_CONFIG || {};
const configured =
  cfg.apiKey && !String(cfg.apiKey).includes("<") &&
  cfg.projectId && !String(cfg.projectId).includes("<") &&
  cfg.appId && !String(cfg.appId).includes("<");

const REDACTION_SCHEMA = {
  type: "object",
  properties: {
    description: { type: "string", nullable: false },
    visible_text: { type: "string", nullable: false },
    sensitive: {
      type: "array",
      nullable: false,
      items: {
        type: "object",
        properties: {
          type: { type: "string", nullable: false },
          value: { type: "string", nullable: false },
          box: {
            type: "object",
            nullable: true,
            properties: {
              x: { type: "number", nullable: false },
              y: { type: "number", nullable: false },
              w: { type: "number", nullable: false },
              h: { type: "number", nullable: false },
            },
            required: ["x", "y", "w", "h"],
          },
        },
        required: ["type", "value"],
      },
    },
  },
  required: ["description", "visible_text", "sensitive"],
};

const REDACTION_PROMPT = `You are a privacy redaction assistant running on-device.
Analyze the screenshot locally and return ONLY valid JSON:
{
  "description": "a useful description of the screenshot with every sensitive value replaced by [REDACTED]",
  "visible_text": "the visible text with every sensitive value replaced by [REDACTED]",
  "sensitive": [
    {
      "type": "email|API key|bearer token|JWT|password|IBAN|credit card|phone|name|address|database URL|GitHub token|AWS access key|order ID|tracking number|other",
      "value": "the exact sensitive text",
      "box": {"x": 0.0, "y": 0.0, "w": 0.0, "h": 0.0}
    }
  ]
}
Rules:
- Find emails, API keys, bearer tokens, JWTs, passwords, IBANs, card numbers, phone numbers, personal names, addresses, order IDs, database URLs, cloud keys and any other secret.
- Never repeat a sensitive value in description or visible_text; use [REDACTED].
- The sensitive array is the only place where the exact value may appear.
- box is normalized 0..1 relative to image width/height, origin at top-left. Omit box if you cannot locate the value.
- Return JSON only.`;

let firebaseApp = null;
let firebaseModules = null;
let appCheckReady = false;
let deviceRedactionModel = null;
let deviceAnswerModel = null;
let cloudModel = null;
const initializedModels = new WeakSet();
let sampleFile = null;
let sampleName = DEFAULT_SAMPLE;
let droppedFile = null;
let currentImage = null;
let currentFileSize = 0;
let originalDataUrl = "";
let modelBoxes = [];
let manualBoxes = [];
let lastSanitized = "";
let lastFindings = [];
let lastBoxes = [];
let redactedDataUrl = "";
let lastReceipt = null;
let lastRoute = "";
let lastLatencyMs = 0;
let ledger = [];
let counters = { cloudCalls: 0, onDeviceCalls: 0 };
let previewUrl = "";
let boxDrag = null;

function setStatus(text, kind = "") {
  statusEl.textContent = text;
  dot.className = "dot" + (kind ? " " + kind : "");
}

function setBusy(busy) {
  if (progressEl) progressEl.hidden = !busy;
  for (const id of [
    "redactBtn",
    "askBtn",
    "translateBtn",
    "explainBtn",
    "quickBtn",
    "deepBtn",
    "availabilityBtn",
  ]) {
    const el = $(id);
    if (el) el.disabled = busy;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let snackbarTimer = 0;

function showSnackbar(text, kind = "") {
  snackbarEl.textContent = text;
  snackbarEl.className = "snackbar show" + (kind ? " " + kind : "");
  clearTimeout(snackbarTimer);
  snackbarTimer = setTimeout(() => {
    snackbarEl.className = "snackbar";
  }, 4200);
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode the image."));
    };
    img.src = url;
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fileToBase64(file) {
  return fileToDataUrl(file).then((dataUrl) => dataUrl.split(",")[1]);
}

function imageType(file) {
  const type = String(file?.type || "").toLowerCase();
  if (type) return type;
  const name = String(file?.name || "").toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return "";
}

function dataUrlKB(dataUrl) {
  return Math.round(base64ToBytes(dataUrlToBase64(dataUrl)).length / 1024);
}

function payloadBytes() {
  const mode = payloadEl.value;
  const textBytes = mode === "image" ? 0 : new TextEncoder().encode(lastSanitized).length;
  const imageBytes = mode === "text" ? 0 : base64ToBytes(dataUrlToBase64(redactedDataUrl)).length;
  return textBytes + imageBytes;
}

function updatePrivacyBadge() {
  const mode = payloadEl.value;
  if (mode === "text") {
    privacyBadge.textContent = "privacy: image stays local";
  } else if (mode === "image") {
    privacyBadge.textContent = redactedDataUrl
      ? "privacy: only redacted image sent"
      : "privacy: redact first";
  } else {
    privacyBadge.textContent = redactedDataUrl
      ? "privacy: redacted image + text sent"
      : "privacy: redact first";
  }
}

function syncSegmented(group, value) {
  if (!group) return;
  group.querySelectorAll(".seg-btn").forEach((button) => {
    const selected = button.dataset.value === value;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-checked", String(selected));
  });
}

function bindSegmented(group, selectEl) {
  if (!group || !selectEl) return;
  group.addEventListener("click", (event) => {
    const button = event.target.closest(".seg-btn");
    if (!button) return;
    selectEl.value = button.dataset.value;
    selectEl.dispatchEvent(new Event("change", { bubbles: true }));
    syncSegmented(group, selectEl.value);
  });
}

function setStep(step) {
  document.querySelectorAll("#stepper li").forEach((item, index) => {
    const current = index + 1;
    item.classList.toggle("active", current === step);
    item.classList.toggle("complete", current < step);
    if (current === step) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  });
}

function setRouteBadge(route, latencyMs) {
  routeBadgeEl.className =
    "route-badge " + (route === ROUTE.ON_DEVICE ? "route-on-device" : "route-cloud");
  routeBadgeEl.textContent = routeBadgeText(route, latencyMs);
}

function clearRouteBadge() {
  routeBadgeEl.className = "route-badge";
  routeBadgeEl.textContent = "route: —";
}

function maskValue(value) {
  const text = String(value || "");
  if (text.length <= 8) return "•".repeat(text.length);
  return `${text.slice(0, 4)}…${text.slice(-4)}`;
}

function renderFindings(findings) {
  findingsEl.innerHTML = "";
  if (!findings?.length) {
    const li = document.createElement("li");
    li.textContent = "No sensitive values found.";
    findingsEl.appendChild(li);
    return;
  }
  for (const finding of findings) {
    const li = document.createElement("li");
    const type = document.createElement("span");
    type.className = "type";
    type.textContent = `${finding.type}: `;
    li.appendChild(type);
    li.appendChild(document.createTextNode(maskValue(finding.value)));
    findingsEl.appendChild(li);
  }
}

function renderLedger() {
  ledgerEl.innerHTML = "";
  if (!ledger.length) {
    const li = document.createElement("li");
    li.textContent = "No cloud calls yet.";
    ledgerEl.appendChild(li);
    return;
  }
  for (const item of ledger) {
    const li = document.createElement("li");
    const mock = item.mock ? "mock " : "";
    li.textContent =
      `${mock}${item.payload} · ${item.route} · ${formatLatency(item.latencyMs)} · ` +
      `raw image: no · text ${item.textChars} chars · image ${item.imageKB} KB · ` +
      `${item.redactions} redactions · ${item.at}`;
    ledgerEl.appendChild(li);
  }
}

function addLedger(entry) {
  ledger.unshift({
    ...entry,
    mock: !configured,
    at: new Date().toLocaleTimeString(),
  });
  if (ledger.length > 8) ledger.pop();
  renderLedger();
}

function updateRiskCard() {
  riskRedactions.textContent = String(lastFindings.length + manualBoxes.length);
  riskSent.textContent = "0";
  riskRaw.textContent = "0 B";
  riskPayload.textContent = formatBytes(payloadBytes());
  riskNote.textContent = `Raw screenshot on device: ${formatBytes(currentFileSize)}.`;
  riskDevice.textContent = String(counters.onDeviceCalls);
  riskCloud.textContent = String(counters.cloudCalls);
}

function showPreview(file) {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = "";
  previewEmpty.hidden = true;
  previewInner.hidden = true;
  previewImg.removeAttribute("src");
  boxCanvas.hidden = true;
  if (!file) {
    previewEmpty.hidden = false;
    previewEmpty.textContent = "No image selected";
    currentImage = null;
    currentFileSize = 0;
    originalDataUrl = "";
    updateRiskCard();
    return;
  }
  currentFileSize = file.size || 0;
  previewUrl = URL.createObjectURL(file);
  previewInner.hidden = false;
  previewImg.onload = () => {
    currentImage = previewImg;
    boxCanvas.hidden = false;
    syncCanvas();
    drawBoxes();
  };
  previewImg.src = previewUrl;
  fileToDataUrl(file)
    .then((dataUrl) => {
      originalDataUrl = dataUrl;
      updateRiskCard();
    })
    .catch(() => {});
}

function syncCanvas() {
  if (previewInner.hidden || !previewImg.clientWidth) return;
  boxCanvas.width = Math.round(previewImg.clientWidth);
  boxCanvas.height = Math.round(previewImg.clientHeight);
  drawBoxes();
}

function drawBoxes() {
  if (!boxCanvas.width || !boxCanvas.height) return;
  const ctx = boxCanvas.getContext("2d");
  const width = boxCanvas.width;
  const height = boxCanvas.height;
  ctx.clearRect(0, 0, width, height);

  const paint = (box, color, label) => {
    const x = Math.max(0, Math.min(width, box.x * width));
    const y = Math.max(0, Math.min(height, box.y * height));
    const w = Math.max(1, Math.min(width - x, box.w * width));
    const h = Math.max(1, Math.min(height - y, box.h * height));
    ctx.fillStyle = `rgba(${color},.22)`;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = `rgba(${color},.95)`;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, Math.max(0, w - 2), Math.max(0, h - 2));
    const text = String(label || "REDACTED").toUpperCase().slice(0, 18);
    const fontSize = Math.max(9, Math.min(14, Math.floor(h * 0.55)));
    ctx.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    const textWidth = ctx.measureText(text).width;
    const chipHeight = fontSize + 5;
    const chipY = y - chipHeight >= 0 ? y - chipHeight : y;
    ctx.fillStyle = `rgb(${color})`;
    ctx.fillRect(x, chipY, textWidth + 8, chipHeight);
    ctx.fillStyle = "#052e16";
    ctx.fillText(text, x + 4, chipY + chipHeight - 4);
  };

  for (const box of modelBoxes) paint(box, "248,113,113", box.type);
  for (const box of manualBoxes) paint(box, "34,197,94", "manual");

  if (boxDrag?.mode === "add") {
    const x = Math.min(boxDrag.startX, boxDrag.currentX) * width;
    const y = Math.min(boxDrag.startY, boxDrag.currentY) * height;
    const w = Math.abs(boxDrag.currentX - boxDrag.startX) * width;
    const h = Math.abs(boxDrag.currentY - boxDrag.startY) * height;
    ctx.strokeStyle = "rgba(34,197,94,.95)";
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  }
}

function drawRedactions(ctx, boxes, width, height) {
  for (const box of boxes) {
    const x = Math.max(0, Math.min(width, box.x * width));
    const y = Math.max(0, Math.min(height, box.y * height));
    const w = Math.max(1, Math.min(width - x, box.w * width));
    const h = Math.max(1, Math.min(height - y, box.h * height));
    ctx.fillStyle = "#000";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(34,197,94,.95)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, Math.max(0, w - 2), Math.max(0, h - 2));
    const label = String(box.type || "REDACTED").toUpperCase().slice(0, 18);
    const fontSize = Math.max(11, Math.min(20, Math.floor(h * 0.55)));
    ctx.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    const textWidth = ctx.measureText(label).width;
    const padX = 5;
    const chipHeight = fontSize + 6;
    const chipY = y - chipHeight >= 0 ? y - chipHeight : y;
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(x, chipY, textWidth + padX * 2, chipHeight);
    ctx.fillStyle = "#052e16";
    ctx.fillText(label, x + padX, chipY + chipHeight - 5);
  }
}

function drawRedactedImage(img, boxes) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  drawRedactions(ctx, boxes, canvas.width, canvas.height);
  redactedDataUrl = canvas.toDataURL("image/png");
  redactedPreview.innerHTML = "";
  const out = document.createElement("img");
  out.alt = "Redacted screenshot";
  out.src = redactedDataUrl;
  redactedPreview.appendChild(out);
  compareRaw.src = originalDataUrl || img.src;
  compareRedacted.src = redactedDataUrl;
  compareWrap.hidden = false;
  compareInner.style.setProperty("--pos", `${compareRange.value}%`);
  downloadBtn.disabled = false;
  updatePrivacyBadge();
  updateRiskCard();
}

function pointFromEvent(event) {
  const rect = boxCanvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
    y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
  };
}

function findBoxAt(x, y) {
  const boxes = [...modelBoxes, ...manualBoxes];
  for (let i = boxes.length - 1; i >= 0; i -= 1) {
    const box = boxes[i];
    if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) {
      return box;
    }
  }
  return null;
}

function removeBox(box) {
  modelBoxes = modelBoxes.filter((item) => item !== box);
  manualBoxes = manualBoxes.filter((item) => item !== box);
}

async function refreshRedaction(route = lastRoute || "on-device-redaction", latencyMs = lastLatencyMs) {
  if (!currentImage || !lastSanitized) return;
  lastBoxes = [...modelBoxes, ...manualBoxes];
  drawRedactedImage(currentImage, lastBoxes);
  drawBoxes();
  resetBoxesBtn.disabled = manualBoxes.length === 0;
  updateRiskCard();
  await refreshReceipt(route, latencyMs);
}

async function refreshReceipt(route, latencyMs) {
  lastReceipt = await buildReceipt({
    sanitized: lastSanitized,
    redactedDataUrl,
    findings: lastFindings,
    manualBoxes: manualBoxes.length,
    payloadMode: payloadEl.value,
    route,
    latencyMs,
    model: configured ? cfg.cloudModel || "firebase-ai-logic" : "mock",
    appCheck: appCheckReady,
    rawImageBytes: currentFileSize,
    cloudCalls: counters.cloudCalls,
    onDeviceCalls: counters.onDeviceCalls,
  });
  receiptHashEl.textContent = receiptShortHash(lastReceipt);
  receiptBtn.disabled = false;
  viewReceiptBtn.disabled = false;
}

function resetRedactionState() {
  modelBoxes = [];
  manualBoxes = [];
  lastBoxes = [];
  lastSanitized = "";
  lastFindings = [];
  redactedDataUrl = "";
  lastReceipt = null;
  lastRoute = "";
  lastLatencyMs = 0;
  counters = { cloudCalls: 0, onDeviceCalls: 0 };
  ledger = [];
  renderLedger();
  sanitizedEl.textContent = "Redact the screenshot first.";
  findingsEl.innerHTML = "<li>No redactions yet.</li>";
  redactedPreview.textContent = "Redact the screenshot first.";
  downloadBtn.disabled = true;
  receiptHashEl.textContent = "sha256:—";
  receiptBtn.disabled = true;
  viewReceiptBtn.disabled = true;
  if (receiptDialog.open) receiptDialog.close();
  receiptJsonEl.textContent = "";
  compareWrap.hidden = true;
  compareRaw.removeAttribute("src");
  compareRedacted.removeAttribute("src");
  resetBoxesBtn.disabled = true;
  output.textContent = "The answer will appear here.";
  clearRouteBadge();
  setStep(1);
  updateRiskCard();
  updatePrivacyBadge();
  drawBoxes();
}

async function checkOnDevice() {
  if (!window.LanguageModel?.availability) {
    deviceBadge.textContent = "on-device: unavailable (Chrome Prompt API not found)";
    return "unavailable";
  }
  try {
    const availability = await LanguageModel.availability();
    deviceBadge.textContent = `on-device: ${availability}`;
    return availability;
  } catch {
    deviceBadge.textContent = "on-device: error";
    return "error";
  }
}

async function loadFirebaseModules() {
  if (firebaseModules) return firebaseModules;
  const [appModule, appCheckModule, aiModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/13.2.0/firebase-app-check.js"),
    import("https://www.gstatic.com/firebasejs/13.2.0/firebase-ai.js"),
  ]);
  firebaseModules = { ...appModule, ...appCheckModule, ...aiModule };
  return firebaseModules;
}

async function ensureFirebase(mode) {
  if (!configured) {
    configBadge.textContent = "config: mock mode";
    configBadge.style.color = "var(--amber)";
    return null;
  }
  const modules = await loadFirebaseModules();
  if (!firebaseApp) {
    firebaseApp = modules.initializeApp(cfg);
    if (cfg.recaptchaSiteKey && !String(cfg.recaptchaSiteKey).includes("<")) {
      if (cfg.appCheckDebugToken === true) {
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      } else if (typeof cfg.appCheckDebugToken === "string" && cfg.appCheckDebugToken.length > 0) {
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = cfg.appCheckDebugToken;
      }
      const provider = cfg.appCheckProvider === "enterprise"
        ? new modules.ReCaptchaEnterpriseProvider(cfg.recaptchaSiteKey)
        : new modules.ReCaptchaV3Provider(cfg.recaptchaSiteKey);
      modules.initializeAppCheck(firebaseApp, {
        provider,
        isTokenAutoRefreshEnabled: true,
      });
      appCheckReady = true;
    }
    configBadge.textContent = appCheckReady
      ? "config: Firebase AI Logic + App Check"
      : "config: Firebase AI Logic";
    configBadge.style.color = "var(--green)";
  }

  const ai = modules.getAI(firebaseApp, { backend: new modules.GoogleAIBackend() });

  if (mode === "on-device-redaction") {
    if (!deviceRedactionModel) {
      try {
        deviceRedactionModel = modules.getGenerativeModel(ai, {
          mode: modules.InferenceMode.ONLY_ON_DEVICE,
          onDeviceParams: {
            promptOptions: { responseConstraint: REDACTION_SCHEMA },
          },
        });
      } catch {
        deviceRedactionModel = modules.getGenerativeModel(ai, {
          mode: modules.InferenceMode.ONLY_ON_DEVICE,
        });
      }
    }
    return deviceRedactionModel;
  }

  if (mode === "on-device-answer") {
    if (!deviceAnswerModel) {
      deviceAnswerModel = modules.getGenerativeModel(ai, {
        mode: modules.InferenceMode.ONLY_ON_DEVICE,
      });
    }
    return deviceAnswerModel;
  }

  if (!cloudModel) {
    const params = { mode: modules.InferenceMode.ONLY_IN_CLOUD };
    if (cfg.cloudModel && !String(cfg.cloudModel).includes("<")) {
      params.model = cfg.cloudModel;
    }
    cloudModel = modules.getGenerativeModel(ai, params);
  }
  return cloudModel;
}

async function initializeDevice(model) {
  if (initializedModels.has(model)) return;
  setStatus("Initializing the on-device model (Chrome may download it)…");
  await model.initializeDeviceModel((progress) => {
    const pct = Math.round(progress * 10000) / 100;
    setStatus(`Downloading on-device model: ${pct}%`);
  });
  initializedModels.add(model);
}

async function loadSample(name) {
  const sample = MOCK_SAMPLES[name];
  if (!sample) {
    setStatus(`Unknown sample: ${name}`, "err");
    return;
  }
  try {
    const response = await fetch(name);
    const blob = await response.blob();
    imageInput.value = "";
    sampleFile = new File([blob], name, { type: "image/png" });
    sampleName = name;
    droppedFile = null;
    sampleSelect.value = name;
    resetRedactionState();
    showPreview(sampleFile);
    setStep(1);
    setStatus(`Sample loaded: ${sample.label}. Click Redact on-device.`, "");
  } catch {
    setStatus("Could not load the sample. Serve the folder over HTTP.", "err");
  }
}

async function redactOnDevice() {
  const selected = imageInput.files?.[0] || droppedFile || sampleFile;
  if (!selected) {
    setStatus("Choose a PNG/JPEG screenshot or load a sample.", "err");
    return;
  }
  if (!/^image\/(png|jpeg)$/.test(imageType(selected))) {
    setStatus("Use a PNG or JPEG screenshot: those are the on-device input types.", "err");
    return;
  }
  if (selected.size > 12 * 1024 * 1024) {
    setStatus("The screenshot is larger than 12 MB. Resize it before redacting.", "err");
    return;
  }

  setBusy(true);
  output.textContent = "Reading the screenshot on-device…";
  setStatus("On-device: analyzing the screenshot. The image is not uploaded.");
  try {
    const start = performance.now();
    const img = await loadImage(selected);
    currentImage = img;
    currentFileSize = selected.size || 0;
    if (!originalDataUrl) originalDataUrl = await fileToDataUrl(selected);

    let result;
    let mock = false;
    if (!configured) {
      mock = true;
      await sleep(700);
      const isSample = selected === sampleFile && MOCK_SAMPLES[sampleName];
      const sample = isSample
        ? MOCK_SAMPLES[sampleName]
        : {
            label: "the bundled sample",
            text: MOCK_SAMPLES[DEFAULT_SAMPLE].text,
            boxes: [],
          };
      result = mockModelResult(sample);
    } else {
      const model = await ensureFirebase("on-device-redaction");
      await initializeDevice(model);
      const data = await fileToBase64(selected);
      const imagePart = {
        inlineData: { data, mimeType: imageType(selected) },
      };
      const response = await model.generateContent([REDACTION_PROMPT, imagePart]);
      const raw = response.response.text();
      result = parseJsonLoose(raw) || { description: raw };
    }

    const clean = sanitizeModelResult(result, {
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    modelBoxes = clean.boxes;
    manualBoxes = [];
    lastSanitized = clean.sanitized;
    lastFindings = clean.findings;
    lastBoxes = [...modelBoxes];
    sanitizedEl.textContent = clean.sanitized || "(empty)";
    renderFindings(clean.findings);

    const latency = performance.now() - start;
    lastRoute = ROUTE.ON_DEVICE;
    lastLatencyMs = latency;
    counters.onDeviceCalls += 1;
    setRouteBadge(ROUTE.ON_DEVICE, latency);
    drawRedactedImage(img, lastBoxes);
    drawBoxes();
    updateRiskCard();
    await refreshReceipt(ROUTE.ON_DEVICE, latency);
    setStep(2);

    const counts = countByType(clean.findings);
    const summary =
      Object.entries(counts)
        .map(([type, count]) => `${count} ${type}`)
        .join(", ") || "no secrets";
    setStatus(
      `On-device: ${summary} redacted. ${lastBoxes.length} boxes drawn. ` +
        "The raw screenshot never left the device.",
      "ok"
    );
    output.textContent = mock
      ? "Mock mode analyzed the bundled sample. Click Quick answer, Deep answer, Explain or Translate."
      : "Screenshot processed locally. Click Quick answer, Deep answer, Explain or Translate.";
    showSnackbar("On-device redaction ready. Raw image never uploaded.", "ok");
  } catch (error) {
    output.textContent = `On-device error: ${error?.message || error}`;
    setStatus(
      "The on-device model is unavailable. For privacy, the image is not sent to the cloud. " +
        "Use Chrome 139+ with the Prompt API flag.",
      "err"
    );
    showSnackbar("On-device model unavailable. The image was not uploaded.", "err");
  } finally {
    setBusy(false);
  }
}

function instructionFor(kind, question) {
  if (kind === "translate") {
    return "Translate the following sanitized screenshot content to the user's language. Return only the translation.";
  }
  if (kind === "explain") {
    return "Explain the following sanitized screenshot content. Do not invent secrets.";
  }
  return `Answer this question using only the sanitized screenshot content: ${
    question || "(describe the screenshot)"
  }`;
}

function buildCloudParts(kind, question, payloadMode) {
  const parts = [instructionFor(kind, question)];
  if (payloadMode === "image" || payloadMode === "both") {
    parts.push({
      inlineData: {
        data: dataUrlToBase64(redactedDataUrl),
        mimeType: "image/png",
      },
    });
  }
  if (payloadMode === "text" || payloadMode === "both") {
    parts.push(`Sanitized text:\n${lastSanitized}`);
  }
  return parts;
}

function quickPrompt(question) {
  return (
    "Answer briefly using only this sanitized screenshot content. Do not invent secrets.\n\n" +
    `Question: ${question}\n\nSanitized text:\n${lastSanitized}`
  );
}

function mockQuickAnswer(kind, question, latency) {
  const text = lastSanitized || "(nothing sanitized yet)";
  const intro =
    `[mock on-device · ${formatLatency(latency)}] Answered locally from the sanitized text. ` +
    "The raw image never left the device.\n\n";
  if (kind === "translate") return `${intro}Translation:\n${text}`;
  if (kind === "explain") return `${intro}Explanation:\n${text}`;
  return `${intro}Question: ${question}\n\n${text}`;
}

function mockCloudAnswer(kind, question, payloadMode, latency) {
  const text = lastSanitized || "(nothing sanitized yet)";
  const payload =
    payloadMode === "text"
      ? "sanitized text"
      : payloadMode === "image"
        ? "redacted image"
        : "redacted image + sanitized text";
  const intro =
    `[mock cloud · ${payload} · ${formatLatency(latency)}] ` +
    "The cloud received only the sanitized payload. The raw image never left the device.\n\n";
  if (kind === "translate") return `${intro}Translation:\n${text}`;
  if (kind === "explain") return `${intro}Explanation:\n${text}`;
  return `${intro}Question: ${question}\n\n${text}`;
}

async function quickAnswer(kind, question) {
  const start = performance.now();
  setBusy(true);
  output.textContent = "Asking the on-device model…";
  setStatus("On-device: answering from the sanitized text. No raw image is sent.");
  try {
    let latency = 0;
    if (!configured) {
      await sleep(420);
      latency = performance.now() - start;
      output.textContent = mockQuickAnswer(kind, question, latency);
    } else {
      const model = await ensureFirebase("on-device-answer");
      await initializeDevice(model);
      const parts = [quickPrompt(question)];
      if (redactedDataUrl) {
        parts.push({
          inlineData: {
            data: dataUrlToBase64(redactedDataUrl),
            mimeType: "image/png",
          },
        });
      }
      const result = await model.generateContent(parts);
      output.textContent = result.response.text();
      latency = performance.now() - start;
    }
    counters.onDeviceCalls += 1;
    lastRoute = ROUTE.ON_DEVICE;
    lastLatencyMs = latency;
    setRouteBadge(ROUTE.ON_DEVICE, latency);
    addLedger({
      payload: "quick answer",
      route: "on-device",
      latencyMs: latency,
      textChars: lastSanitized.length,
      imageKB: redactedDataUrl ? dataUrlKB(redactedDataUrl) : 0,
      redactions: lastFindings.length + manualBoxes.length,
    });
    updateRiskCard();
    await refreshReceipt(ROUTE.ON_DEVICE, latency);
    setStep(3);
    setStatus(
      `On-device answer in ${formatLatency(latency)}. Raw image never left the device.`,
      "ok"
    );
    showSnackbar("On-device answer received. Raw image never left the device.", "ok");
  } finally {
    setBusy(false);
  }
}

async function cloudAnswer(kind, question) {
  const payloadMode = payloadEl.value;
  if (payloadMode !== "text" && !redactedDataUrl) {
    setStatus(
      "This payload needs the redacted image. Redact a screenshot first or use sanitized text only.",
      "err"
    );
    return;
  }
  const leaks = findLeaks(lastSanitized, lastFindings);
  if (leaks.length) {
    setStatus(
      `Privacy guard blocked the cloud call: ${leaks.length} sensitive value(s) still appear in the sanitized text.`,
      "err"
    );
    output.textContent = "Cloud call blocked by the on-device leak check.";
    showSnackbar("Cloud call blocked: a secret remained in the sanitized text.", "err");
    return;
  }

  const start = performance.now();
  setBusy(true);
  output.textContent = "Asking the cloud model with the sanitized payload…";
  setStatus(`Cloud: sending ${payloadMode}. The raw screenshot stays on this device.`);
  try {
    let latency = 0;
    if (!configured) {
      await sleep(1200);
      latency = performance.now() - start;
      output.textContent = mockCloudAnswer(kind, question, payloadMode, latency);
    } else {
      const model = await ensureFirebase("cloud");
      const parts = buildCloudParts(kind, question, payloadMode);
      const result = await model.generateContentStream(parts);
      let text = "";
      for await (const chunk of result.stream) {
        text += chunk.text();
        output.textContent = text;
      }
      if (!text) output.textContent = result.response.text();
      latency = performance.now() - start;
    }
    counters.cloudCalls += 1;
    lastRoute = ROUTE.CLOUD;
    lastLatencyMs = latency;
    setRouteBadge(ROUTE.CLOUD, latency);
    addLedger({
      payload: payloadMode,
      route: "cloud",
      latencyMs: latency,
      textChars: payloadMode === "image" ? 0 : lastSanitized.length,
      imageKB: payloadMode === "text" ? 0 : dataUrlKB(redactedDataUrl),
      redactions: lastFindings.length + manualBoxes.length,
    });
    updateRiskCard();
    await refreshReceipt(ROUTE.CLOUD, latency);
    setStep(3);
    setStatus(
      `Cloud answer in ${formatLatency(latency)} from the sanitized payload. Raw image never left the device.`,
      "ok"
    );
    showSnackbar("Cloud answer received from the sanitized payload.", "ok");
  } catch (error) {
    output.textContent = `Cloud error: ${error?.message || error}`;
    setStatus("Cloud request failed. Check Firebase config and App Check.", "err");
    showSnackbar("Cloud request failed. Check Firebase config and App Check.", "err");
  } finally {
    setBusy(false);
  }
}

async function answer(kind) {
  if (!lastSanitized) {
    setStatus("Click Redact on-device first. The cloud only receives sanitized data.", "err");
    return;
  }
  const question =
    kind === "translate"
      ? "Translate the visible text"
      : kind === "explain"
        ? "Explain the visible content and the error"
        : promptEl.value.trim() || "Describe the screenshot";
  const availability = configured ? await checkOnDevice() : "available";
  const route = chooseRoute(question, {
    availability,
    mode: routeModeEl.value,
  });
  if (route === ROUTE.ON_DEVICE) {
    try {
      await quickAnswer(kind, question);
      return;
    } catch {
      setStatus(
        "On-device unavailable; falling back to cloud with the sanitized payload.",
        ""
      );
      showSnackbar("On-device unavailable; using cloud with sanitized payload.", "warn");
    }
  }
  await cloudAnswer(kind, question);
}

function handlePointerDown(event) {
  if (!currentImage) return;
  const point = pointFromEvent(event);
  const hit = findBoxAt(point.x, point.y);
  boxDrag = {
    mode: hit ? "remove" : "add",
    box: hit,
    startX: point.x,
    startY: point.y,
    currentX: point.x,
    currentY: point.y,
    moved: false,
    pointerId: event.pointerId,
  };
  try {
    boxCanvas.setPointerCapture(event.pointerId);
  } catch {
    /* synthetic pointer events in tests */
  }
  drawBoxes();
}

function handlePointerMove(event) {
  if (!boxDrag) return;
  const point = pointFromEvent(event);
  boxDrag.currentX = point.x;
  boxDrag.currentY = point.y;
  if (
    Math.abs(point.x - boxDrag.startX) > 0.005 ||
    Math.abs(point.y - boxDrag.startY) > 0.005
  ) {
    boxDrag.moved = true;
  }
  drawBoxes();
}

async function handlePointerUp(event) {
  if (!boxDrag) return;
  const point = pointFromEvent(event);
  const drag = boxDrag;
  boxDrag = null;
  if (drag.mode === "add") {
    if (drag.moved) {
      const x = Math.min(drag.startX, point.x);
      const y = Math.min(drag.startY, point.y);
      const w = Math.abs(point.x - drag.startX);
      const h = Math.abs(point.y - drag.startY);
      if (w > 0.005 && h > 0.005) {
        manualBoxes.push({ type: "manual", value: "", x, y, w, h });
        await refreshRedaction("on-device-redaction", 0);
        setStatus("Manual box added. Redacted image, receipt and risk card updated.", "ok");
        showSnackbar("Manual box added. Redacted image and receipt updated.", "ok");
      }
    }
  } else if (drag.box && !drag.moved) {
    removeBox(drag.box);
    await refreshRedaction("on-device-redaction", 0);
    setStatus("Box removed. Redacted image, receipt and risk card updated.", "ok");
    showSnackbar("Box removed. Redacted image and receipt updated.", "ok");
  }
  drawBoxes();
}

function downloadReceipt() {
  if (!lastReceipt) return;
  downloadBlob(receiptJson(lastReceipt), "application/json", "privacy-receipt.json");
  showSnackbar("Privacy receipt downloaded.", "ok");
}

function downloadBlob(content, type, name) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

imageInput.addEventListener("change", () => {
  sampleFile = null;
  sampleName = "";
  droppedFile = null;
  resetRedactionState();
  showPreview(imageInput.files?.[0] || null);
  setStep(1);
});

if (dropzone) {
  const setDrag = (on) => dropzone.classList.toggle("dragover", on);
  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      setDrag(true);
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      setDrag(false);
    });
  });
  dropzone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg)$/.test(imageType(file))) {
      setStatus("Drop a PNG or JPEG screenshot.", "err");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setStatus("The screenshot is larger than 12 MB. Resize it before redacting.", "err");
      return;
    }
    droppedFile = file;
    sampleFile = null;
    sampleName = "";
    imageInput.value = "";
    resetRedactionState();
    showPreview(file);
    setStep(1);
    setStatus(`Dropped ${file.name}. Click Redact on-device.`, "");
  });
  dropzone.addEventListener("click", (event) => {
    if (event.target !== imageInput) imageInput.click();
  });
  dropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      imageInput.click();
    }
  });
}

sampleSelect.addEventListener("change", () => {
  loadSample(sampleSelect.value);
});
$("sampleBtn").addEventListener("click", () => loadSample(sampleSelect.value));
bindSegmented(payloadGroup, payloadEl);
bindSegmented(routeModeGroup, routeModeEl);

payloadEl.addEventListener("change", () => {
  syncSegmented(payloadGroup, payloadEl.value);
  updatePrivacyBadge();
  updateRiskCard();
  if (lastSanitized) refreshReceipt(lastRoute || "on-device-redaction", lastLatencyMs);
});
routeModeEl.addEventListener("change", () => {
  syncSegmented(routeModeGroup, routeModeEl.value);
  setStatus(`Route mode: ${routeModeEl.options[routeModeEl.selectedIndex].text}.`, "");
});
$("redactBtn").addEventListener("click", redactOnDevice);
$("quickBtn").addEventListener("click", async () => {
  if (!lastSanitized) {
    setStatus("Click Redact on-device first.", "err");
    return;
  }
  const question = promptEl.value.trim() || "Describe the screenshot";
  try {
    await quickAnswer("ask", question);
  } catch {
    setStatus("On-device unavailable; falling back to cloud with the sanitized payload.", "");
    await cloudAnswer("ask", question);
  }
});
$("deepBtn").addEventListener("click", () => {
  if (!lastSanitized) {
    setStatus("Click Redact on-device first.", "err");
    return;
  }
  cloudAnswer("ask", promptEl.value.trim() || "Describe the screenshot");
});
$("askBtn").addEventListener("click", () => answer("ask"));
$("translateBtn").addEventListener("click", () => answer("translate"));
$("explainBtn").addEventListener("click", () => answer("explain"));
$("availabilityBtn").addEventListener("click", async () => {
  setBusy(true);
  const availability = await checkOnDevice();
  setStatus(
    `On-device model availability: ${availability}`,
    availability === "available" ? "ok" : ""
  );
  setBusy(false);
});
downloadBtn.addEventListener("click", () => {
  if (!redactedDataUrl) return;
  const link = document.createElement("a");
  link.href = redactedDataUrl;
  link.download = "screenshot-redacted.png";
  link.click();
});
receiptBtn.addEventListener("click", downloadReceipt);
downloadReceiptBtn.addEventListener("click", downloadReceipt);
viewReceiptBtn.addEventListener("click", () => {
  if (!lastReceipt) return;
  receiptJsonEl.textContent = receiptJson(lastReceipt);
  receiptDialog.showModal();
});
closeReceiptBtn.addEventListener("click", () => receiptDialog.close());
receiptDialog.addEventListener("click", (event) => {
  if (event.target === receiptDialog) receiptDialog.close();
});
copyReceiptBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(receiptJsonEl.textContent || "");
    showSnackbar("Receipt JSON copied.", "ok");
  } catch {
    showSnackbar("Could not copy the receipt.", "err");
  }
});
document.addEventListener("pointerdown", (event) => {
  const button = event.target.closest("button");
  if (!button || button.disabled) return;
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
  button.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});
resetBoxesBtn.addEventListener("click", async () => {
  manualBoxes = [];
  await refreshRedaction("on-device-redaction", 0);
  setStatus("Manual boxes cleared. Model boxes restored.", "");
});
compareRange.addEventListener("input", () => {
  compareInner.style.setProperty("--pos", `${compareRange.value}%`);
});
boxCanvas.addEventListener("pointerdown", handlePointerDown);
boxCanvas.addEventListener("pointermove", handlePointerMove);
boxCanvas.addEventListener("pointerup", handlePointerUp);
boxCanvas.addEventListener("pointercancel", () => {
  boxDrag = null;
  drawBoxes();
});
window.addEventListener("resize", syncCanvas);

configBadge.textContent = configured ? "config: Firebase AI Logic" : "config: mock mode";
configBadge.style.color = configured ? "var(--green)" : "var(--amber)";
if (!configured) {
  deviceBadge.textContent = "on-device: mock demo";
}
const params = new URLSearchParams(location.search);
if (params.get("theme") === "light" || params.get("theme") === "dark") {
  applyTheme(params.get("theme"));
}
if (["text", "image", "both"].includes(params.get("payload"))) {
  payloadEl.value = params.get("payload");
}
if (["auto", "on-device", "cloud"].includes(params.get("route"))) {
  routeModeEl.value = params.get("route");
}
syncSegmented(payloadGroup, payloadEl.value);
syncSegmented(routeModeGroup, routeModeEl.value);
if (MOCK_SAMPLES[params.get("sample")]) {
  sampleSelect.value = params.get("sample");
}
updatePrivacyBadge();
updateRiskCard();
renderLedger();
setStep(1);
if (configured) {
  checkOnDevice();
}

if (params.has("autodemo")) {
  const quick = params.get("autodemo") === "quick";
  $("sampleBtn").click();
  setTimeout(() => $("redactBtn").click(), 700);
  setTimeout(() => (quick ? $("quickBtn") : $("explainBtn")).click(), 2400);
  if (params.has("receipt")) {
    setTimeout(() => {
      const btn = $("viewReceiptBtn");
      if (btn && !btn.disabled) btn.click();
    }, 4300);
  }
}
