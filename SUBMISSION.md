# Devpost submission text (English)

**Project name:** Redactly — privacy-first hybrid inference

**Devpost project:** <https://devpost.com/software/redactly-wk1dtn>

**Elevator pitch:** Redact locally, ask globally. A screenshot assistant that redacts secrets on-device with Gemini Nano and sends only a sanitized payload to the cloud. The raw screenshot never leaves your device.

**Inspiration:** Most screenshot AI tools upload the whole screen to the cloud. We wanted the opposite: use the local model for the sensitive first pass, then let the cloud answer only what is left. The privacy receipt makes that claim auditable.

**What it does:** Load a screenshot, let Gemini Nano find and redact emails, API keys, tokens, IBANs, card numbers and other secrets, then choose a sanitized payload: text only, redacted image only, or both. Quick questions stay on-device; complex questions use the cloud. A leak check blocks any original value before a cloud call. The app shows a risk card, a local privacy ledger and a downloadable SHA-256 receipt.

**How we built it:** Vanilla JavaScript and Firebase AI Logic hybrid inference. On-device calls use `ONLY_ON_DEVICE` with a structured-output constraint; cloud calls use `ONLY_IN_CLOUD` and streaming. The app uses App Check and lazy SDK imports so the mock mode works offline. The UI is a zero-build Material Design 3-inspired interface with a 3-step stepper, visual boxes, a manual box editor, a redacted/original toggle and a lightbox.

**Challenges we ran into:** Firebase AI Logic on-device inference is only supported on Web/Android/iOS, so the demo targets Web (Chrome). Keeping the raw image off the network required a strict separation between the on-device redaction model and the cloud answer model, plus a leak check and a deterministic mock for offline testing.

**Accomplishments that we're proud of:** A complete privacy flow with visual and text redaction, a leak check, selectable cloud payloads, Quick/Deep routing, a SHA-256 receipt, a risk card and a privacy ledger. Three synthetic scenarios, Node tests and CI keep the logic verifiable.

**What we learned:** Hybrid inference is not just a routing trick. The interesting part is deciding what must stay local, proving it, and making the cloud boundary explicit.

**What's next:** Android and iOS clients for multi-platform consideration.

**Built with:** Firebase AI Logic, Gemini Nano 4, App Check, JavaScript, HTML, CSS, Node.js, GitHub Actions.

**Try it out:** <https://github.com/agarnung/redactly> (the app is at the repository root). Hosted demo: <https://redactly-dbb56.web.app> (Firebase Hosting). Video: <https://youtu.be/RZJKePZXAxw>.

**Pre-existing code disclosure:** This is a new repository for the hackathon. The web app is new and does not use any pre-existing code. All sample data is synthetic.

**What was built during the submission period:** The Web (Chrome) demo: on-device Gemini Nano redaction with structured output, visual boxes, manual box editor, text sanitization, leak check, Quick/Deep routing, selectable sanitized payload, SHA-256 privacy receipt, risk card, privacy ledger, three synthetic scenarios, Node tests and CI.

**Testing instructions:** Run `npm test && python3 -m http.server 8080`, open <http://localhost:8080> in Chrome 139+, then use the mock flow or add a Firebase config and App Check debug token for the real flow.
