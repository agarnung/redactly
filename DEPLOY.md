# Deploy the web demo

The app is static: no build step. Firebase Hosting is optional; GitHub Pages or
Netlify Drop also work.

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
- For local App Check, set `appCheckDebugToken: true` in `firebase-config.js` and register the debug token printed by Chrome.
- For production, keep `appCheckDebugToken: false`, use a real reCAPTCHA v3 site key, and add `redactly-dbb56.web.app` and `redactly-dbb56.firebaseapp.com` to the reCAPTCHA allowed domains.
- On-device inference needs Chrome 139+ and the Prompt API flag.
- The raw screenshot is never uploaded; only the selected sanitized payload leaves
  the device.

## GitHub Pages (fallback)

The repository includes `.github/workflows/pages.yml`. In GitHub:
**Settings → Pages → Source: GitHub Actions**. The workflow publishes the
repository root on every push to `main`.

The Pages URL is `https://agarnung.github.io/redactly/`. Add
`agarnung.github.io` to the reCAPTCHA allowed domains for App Check.

For the real config on Pages, add a repository secret named
`FIREBASE_CONFIG_JS` whose value is the full contents of your local
`firebase-config.js`. The workflow writes it into the artifact at deploy time;
the file is never committed. If the secret is empty, the app runs in mock mode.

The app loads `firebase-config.js` with a 404 fallback, so it still runs in mock
mode if the config is not published.
