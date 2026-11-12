// Copy this file to firebase-config.js and fill it with your Firebase web app
// configuration. Never commit firebase-config.js with real keys.
window.FIREBASE_CONFIG = {
  apiKey: "<your-web-api-key>",
  authDomain: "<project-id>.firebaseapp.com",
  projectId: "<project-id>",
  appId: "<app-id>",
  storageBucket: "<project-id>.firebasestorage.app",
  messagingSenderId: "<sender-id>",
  // Optional: override the default cloud model for the cloud leg.
  // cloudModel: "gemini-3.5-flash-lite",
  // For App Check, set a reCAPTCHA site key and add the hosting domain
  // (and localhost) to the reCAPTCHA allowed domains.
  // Use "v3" for reCAPTCHA v3 or "enterprise" for reCAPTCHA Enterprise
  // (Google Cloud Fraud Defense).
  recaptchaSiteKey: "<recaptcha-site-key>",
  appCheckProvider: "v3",
  // Local development: true prints a random debug token; a string uses a fixed
  // debug token that you register in Firebase Console -> App Check -> Manage
  // debug tokens. Keep false for the hosted reCAPTCHA demo.
  appCheckDebugToken: false
};
