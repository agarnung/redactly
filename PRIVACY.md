# Privacy model

## Data flow

```text
 raw screenshot
      │
      ▼
┌─────────────────────────────┐
│ Chrome / Gemini Nano        │  on-device only
│ (Firebase AI Logic)         │  no network
│                             │
│ 1. read image               │
│ 2. find secrets              │
│ 3. return text + boxes       │
│ 4. draw boxes on canvas      │
└─────────────┬───────────────┘
              │ sanitized text + normalized boxes
              ▼
┌─────────────────────────────┐
│ Browser canvas               │  local
│ draw opaque black boxes      │
│ labels = type only           │
└─────────────┬───────────────┘
              │ redacted PNG + sanitized text
              ▼
┌─────────────────────────────┐
│ Leak check + payload choice  │  local
│ receipt: SHA-256 + ledger    │
│ block if a value remains     │
└─────────────┬───────────────┘
              │ only the chosen payload
              ▼
┌─────────────────────────────┐
│ Gemini cloud                 │  Firebase AI Logic
│ explain / translate / ask     │  no raw image
└─────────────────────────────┘

 Quick/Deep routing: on-device for short questions, cloud for complex ones.
 The cloud fallback always receives the sanitized payload, never the raw image.
```

## Guarantees

1. **No raw screenshot upload.** The redaction model is created with
   `InferenceMode.ONLY_ON_DEVICE`. If Gemini Nano is unavailable, the app shows
   an error and does not send the image to the cloud.
2. **Visual redaction is local.** The canvas is created in the browser. The model
   returns normalized boxes; the app paints opaque black rectangles and labels them
   with the secret type only.
3. **Text redaction is defense-in-depth.** Regex detectors plus model-reported
   values remove secrets from the description and visible text. A leak check runs
   before every cloud call and blocks it if any original value remains.
4. **Explicit payload.** The user chooses sanitized text only (default), redacted
   image only, or both. The raw image is never one of the options.
5. **Local ledger and receipt.** Every cloud call is recorded in memory with payload
   type, route, latency, text size, image size and redaction count. The receipt adds
   SHA-256 hashes of the sanitized text and redacted image. Nothing is sent to
   analytics.
6. **No server.** The app is static HTML/CSS/JS. The only network calls are the
   Firebase AI Logic cloud calls the user explicitly triggers, plus the lazy SDK
   import from `gstatic.com`.

## Limitations

- On-device detection is model-dependent. A secret the model does not report and
  the regex detectors do not recognize can remain in the sanitized text. Review the
  sanitized text before choosing a cloud payload.
- Bounding boxes are model estimates. If the model cannot locate a value, the app
  falls back to text-only redaction for the cloud payload. The manual box editor lets
  the user add or remove boxes before sharing.
- Names and other context-dependent identifiers are harder than structured secrets;
  the on-device prompt asks for them, but coverage is not perfect.
- The findings list masks values (`post…ents`) but the sanitized text and the
  redacted image are the authoritative artifacts.
- Mock mode analyzes the selected bundled sample (API 401, support ticket or bank
  statement); custom images have no ground-truth boxes, so mock mode falls back to
  text-only redaction.

## What is never collected

- No cookies, analytics, fingerprinting or telemetry.
- No raw screenshots, original secret values or Firebase debug tokens in the repo.
- No server-side storage: the ledger lives in page memory and disappears on
  reload.
