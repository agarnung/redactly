# Firebase #BuildHybridAI — video script (<3 min)

> Recommended: English narration or English subtitles. Record 1920×1080, 30 fps.
> Never show `.env`, API keys, project ID, debug tokens, emails or personal data.
> **Record the app in Chrome**: Firebase AI Logic. Use the hosted URL
> `https://redactly-dbb56.web.app/?sample=sample.png&theme=dark` so the cloud leg
> uses real App Check (reCAPTCHA Enterprise) and the on-device leg uses Gemini Nano.
> The flow has been tested end-to-end on Chrome 157; see `HISTORIAL.md`.

## Shot 01 — 0:00–0:15 — The problem

**On screen:** title card: “Share the screen, not your secrets.”
**Say:**

> Every screenshot AI tool asks you to upload your whole screen. But screenshots are
> full of API keys, customer emails, IBANs and tokens. This one does the opposite.

## Shot 02 — 0:15–0:35 — Three risky screenshots

**On screen:** the app open in Chrome.
**Do:** use the sample selector: **API 401 (.env)**, **Support ticket**,
**Bank statement**. Show the fake secrets in each.
**Say:**

> A developer debugging a 401, a support agent with a customer ticket, a bank
> statement. Three very common screenshots, all full of secrets.

## Shot 03 — 0:35–1:05 — On-device redaction

**On screen:** click **Redact on-device**; wait 20–30 s; 14 boxes appear on the API 401 sample.
**Do:** point at the black boxes and the masked findings list. Show the
**on-device** badge and “raw screenshot never left the device”.
**Say:**

> Gemini Nano reads the image locally. It finds emails, API keys, tokens, IBANs,
> card numbers, addresses and names, replaces them with placeholders and paints black
> boxes over the pixels. The labels show only the type, never the value.

## Shot 04 — 1:05–1:25 — Human-in-the-loop box editor

**On screen:** drag a new box over a value; click an existing box to remove it.
**Do:** show the redacted image and the receipt hash update.
**Say:**

> The model can miss something. I can drag a manual box, or click one to remove it,
> and the redacted image, the receipt and the risk card update immediately.

## Shot 05 — 1:25–1:45 — Quick on-device vs Deep cloud

**On screen:** click **⚡ Quick answer**; badge `⚡ on-device · 420 ms`.
Then click **☁ Deep answer**; badge `☁ cloud · 1.5–4 s`.
**Say:**

> A short question stays on-device in about two seconds, with no raw image sent. A
> complex question goes to the cloud with only the sanitized payload, streamed back in
> a few seconds. That is real hybrid inference, with a privacy guard.

## Shot 06 — 1:45–2:05 — Payload choice and receipt

**On screen:** switch **Cloud payload** between text, redacted image and both.
**Do:** show the risk card: **12 redactions, 0 secrets sent, 0 B raw image
uploaded**, payload size. Open the **Privacy receipt** JSON and show
`rawImageUploaded:false`, `secretsSent:0`, `appCheck:true`.
**Say:**

> The cloud only gets what I explicitly choose: text, redacted image, or both. The
> risk card shows zero secrets sent. The receipt hashes the sanitized text and the
> redacted image, so the claim is auditable.

## Shot 07 — 2:05–2:25 — Tests and implementation

**On screen:** terminal: `npm test` → three green suites; README architecture.
**Say:**

> Detectors, Luhn, box normalization, leak check, routing policy and receipt hashing
> are covered by Node tests. The on-device model uses structured JSON output through
> Firebase AI Logic; the cloud leg is a separate, explicit step.

## Shot 08 — 2:25–2:40 — Close

**On screen:** final card with repo, branch and license.
**Say:**

> Redact locally, ask globally. The code is open source under GPL-3.0. Thanks for
> watching.

## Recording commands

```bash
cd /opt/proyectos_personales/concursos/programacion/02-firebase-buildhybridai/redactly
npm test
cp firebase-config.example.js firebase-config.js
# fill firebase-config.js (or leave it for mock mode)
python3 -m http.server 8080
```

Open <http://localhost:8080> in Chrome 139+.

Automatic demos:

```text
http://localhost:8080/?autodemo=1&payload=both
http://localhost:8080/?autodemo=quick&sample=sample-support.png&payload=text
http://localhost:8080/?autodemo=1&sample=sample-bank.png&payload=image
```

For on-device inference:

1. Enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`.
2. Restart Chrome.
3. Open DevTools → Console and run `await LanguageModel.availability()`.
4. If `downloadable`, run `await LanguageModel.create()`.
5. Click the **on-device** badge to recheck Gemini Nano.

For the optional real Firebase mode, fill `firebase-config.js` and register the
App Check debug token. Do not show the config or debug token on camera.

The branch contains only the Web (Chrome) demo.
