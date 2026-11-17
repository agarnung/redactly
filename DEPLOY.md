# Deploy the web demo

The app is static: no build step. Firebase Hosting is optional; any static host works.

## Firebase Hosting

```bash
cd /opt/proyectos_personales/concursos/programacion/02-firebase-buildhybridai/redactly
cp firebase-config.example.js firebase-config.js
# fill firebase-config.js with your Firebase web app config
firebase login
firebase use --add          # select redactly-dbb56
firebase deploy --only hosting
```

The CLI prints `https://redactly-dbb56.web.app`. Add it to the Devpost submission.

## Demo URL for judges

After deploying, use the automatic demo URLs:

```text
https://redactly-dbb56.web.app/?autodemo=1&payload=both
https://redactly-dbb56.web.app/?autodemo=quick&sample=sample-support.png&payload=text
https://redactly-dbb56.web.app/?autodemo=1&sample=sample-bank.png&payload=image
```

They load a sample screenshot, redact it on-device (mock mode without config),
run the Quick or Deep route and fill the receipt, risk card and privacy ledger.

## Important

- `firebase-config.js` is gitignored. Do not commit it with real keys.
- For local App Check, set `appCheckDebugToken: true` in `firebase-config.js` and register the debug token printed by Chrome; or set it to a fixed UUID and register that value.
- `appCheckProvider` can be `"v3"` or `"enterprise"`. The console may warn that reCAPTCHA Classic is deprecated; v3 still works for the hackathon. If only reCAPTCHA Enterprise (Fraud Defense) is offered, create an Enterprise key and set `appCheckProvider: "enterprise"`.
- For production, keep `appCheckDebugToken: false`, use a real reCAPTCHA v3/Enterprise site key, and add `redactly-dbb56.web.app` and `redactly-dbb56.firebaseapp.com` to the allowed domains.
- On-device inference needs Chrome 139+ and the Prompt API flag.
- The raw screenshot is never uploaded; only the selected sanitized payload leaves
  the device.

## reCAPTCHA Enterprise direct integration (fallback only)

The Google Cloud key page shows the direct integration:

```html
<script src="https://www.google.com/recaptcha/enterprise.js?render=<SITE_KEY>"></script>
```

```js
grecaptcha.enterprise.execute("<SITE_KEY>", { action: "LOGIN" })
```

The token expires after **2 minutes** and must be sent to your backend for
assessment.

For this project, do **not** add that script or call `grecaptcha.enterprise.execute`
manually: Firebase App Check uses `ReCaptchaEnterpriseProvider` and obtains/refreshes
the token automatically. Keep `isTokenAutoRefreshEnabled: true`.
