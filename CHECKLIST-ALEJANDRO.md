# Checklist Redactly — #BuildHybridAI 2026

> **Última sesión:** repo publicado, historial de autoría corregido y **Firebase Hosting desplegado** en `https://redactly-dbb56.web.app` (200).
> **Estado:** Gemini Nano real y App Check verificados (debug local + reCAPTCHA alojado). Pendiente: grabar vídeo y enviar Devpost. Firebase CLI se usa con `npx --yes firebase-tools` (sin instalación global).
> **Historial completo:** [`HISTORIAL.md`](HISTORIAL.md).
> **Vídeo:** [`VIDEO-RECORDING-GUIDE.md`](VIDEO-RECORDING-GUIDE.md) y voz en `video/audio/full-voiceover-timed.mp3`.
> **Cierre:** **30-nov-2026, 14:00 PT = 23:00 CET**.
> **Regla:** no enviar hasta que repo, demo y vídeo respondan **200** en incógnito.

## 0. Subir el repo nuevo

- [x] GitHub → **New repository** → nombre `redactly` → **Public** → sin README, sin LICENSE, sin `.gitignore`.
- [x] `cd /opt/proyectos_personales/concursos/programacion/02-firebase-buildhybridai/redactly`
- [x] `git remote add origin https://github.com/agarnung/redactly.git` (ya configurado)
- [x] `git status` → revisar `app.js`, `index.html`, `styles.css`
- [x] `npm test` → los 3 tests en verde
- [x] `git add app.js index.html styles.css`
- [x] `git commit -m "Polish tooltips and light theme"`
- [x] `git push -u origin main`
- [x] Verifica que se ven `README.md`, `LICENSE` GPL-3.0, `index.html`, `app.js` y `.github/workflows/`.
- [x] En **About**, comprueba que GitHub detecta **GPL-3.0**.
- [x] Comprueba que `firebase-config.js` no está en el repo.
- [x] `git grep -n "sk_live_\|AIza\|-----BEGIN"` → sin claves reales.

## 1. Firebase: AI Logic, App Check y Hosting

### 1.1 Abrir el proyecto correcto

- [x] Entra en <https://console.firebase.google.com>.
- [x] Selecciona el proyecto **`redactly-dbb56`**.
- [x] Si no ves **Build**, usa los enlaces directos:
  - [x] AI Logic: <https://console.firebase.google.com/project/redactly-dbb56/ailogic>
  - [x] App Check: <https://console.firebase.google.com/project/redactly-dbb56/appcheck>
  - [x] Hosting: <https://console.firebase.google.com/project/redactly-dbb56/hosting>
  - [x] Project settings: <https://console.firebase.google.com/project/redactly-dbb56/settings/general>

### 1.2 Activar AI Logic

- [x] Abre **AI Logic**.
- [x] Pulsa **Get started**.
- [x] Elige **Gemini Developer API** (free tier).
- [x] Habilita la API para el proyecto `redactly-dbb56`.
- [x] Comprueba que la app web `redactly` aparece en la lista de apps.

### 1.3 Activar App Check

- [x] Abre **App Check**.
- [x] En **Apps**, selecciona la app web `redactly`.
- [x] Elige **Fraud Defense (reCAPTCHA Enterprise)**.
- [x] Crea la key con dominios `localhost`, `redactly-dbb56.web.app`, `redactly-dbb56.firebaseapp.com`.
- [x] Copia la **site key** (`6L...`), no la secret key.
- [x] Pégala en App Check, TTL `1 hour`, y pulsa **Save**.
- [x] `firebase-config.js` con `appCheckProvider: "enterprise"`.
- [x] Debug token fijo registrado y puesto en `appCheckDebugToken`.
- [x] Confirma que App Check no da error tras una llamada real (debug local y reCAPTCHA alojado).
- [x] **Nota:** para Firebase AI Logic no se añade `enterprise.js`; App Check usa `ReCaptchaEnterpriseProvider` y refresca solo.

### 1.4 Config local

- [x] `cd /opt/proyectos_personales/concursos/programacion/02-firebase-buildhybridai/redactly`
- [x] `firebase-config.js` tiene project ID, site key y `appCheckProvider: "enterprise"`.
- [x] `git check-ignore -v firebase-config.js` → ignorado.
- [x] `python3 -m http.server 8093` → abre `http://localhost:8093` (8080 puede estar ocupado).
- [x] Abre `http://localhost:8093/` y comprueba que la app carga.
- [x] Debe aparecer `config: Firebase AI Logic + App Check`.
- [x] Debug token registrado en App Check → Manage debug tokens.
- [x] Recarga y comprueba que las llamadas llevan `X-Firebase-AppCheck` y no hay errores.
- [x] Comprueba el toggle claro/oscuro en la cabecera.

## 2. Gemini Nano real

- [x] Chrome 157+ en escritorio.
- [x] `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` → **Enabled**.
- [x] DevTools → Console: `await LanguageModel.availability()` → `available`.
- [x] `await LanguageModel.create()` probado para texto e imagen.
- [x] En la app: **Check on-device** → `on-device: available`.
- [x] Modelo `2025.8.8.1141` instalado; si hay OOM, cerrar otra ventana de Chrome.

## 3. Probar el flujo real

- [x] **API 401 (.env)**: 14 cajas y 12 hallazgos; texto sanitizado correcto.
- [x] **Support ticket**: 10 cajas y 10 hallazgos.
- [x] **Bank statement**: 8 cajas y 7 hallazgos.
- [x] **Payload text** + **Deep answer**: solo texto sanitizado, 200.
- [x] **Payload image** + **Deep answer**: solo imagen redactada, 200.
- [x] **Payload both**: receipt con `rawImageUploaded:false`, `secretsSent:0`, `appCheck:true`.
- [x] **Quick answer**: on-device, sin llamada cloud.
- [ ] **Editor de cajas**: pendiente de grabar el gesto manual.
- [x] **Leak check**: bloquea la llamada cloud si queda un valor sensible.
- [x] En Network no aparece la imagen original subida.

## 4. Hosting

### Firebase Hosting

- [x] `npx --yes firebase-tools` (sin instalación global)
- [x] `npx firebase-tools login` como `agarnungm@gmail.com`
- [x] `cd /opt/proyectos_personales/concursos/programacion/02-firebase-buildhybridai/redactly`
- [x] `npx firebase-tools use redactly-dbb56`
- [x] No ejecutar `firebase init`; `firebase.json` ya existe con `"public": "."`.
- [x] `appCheckDebugToken: false` durante el deploy (restaurado después para local).
- [x] `npx firebase-tools deploy --only hosting`
- [x] Abre `https://redactly-dbb56.web.app` → **200**.
- [x] Dominios `redactly-dbb56.web.app` y `.firebaseapp.com` en reCAPTCHA.
- [x] Verifica que el deploy incluye `firebase-config.js` pero git sigue sin verlo.
- [x] Prueba `?autodemo=1&payload=both` → **200**.
- [x] Prueba `?autodemo=quick&sample=sample-support.png&payload=text`.
- [x] Prueba `?autodemo=1&sample=sample-bank.png&payload=image`.

## 5. Vídeo

- [ ] Lee `redactly/VIDEO-SCRIPT.md`; prepara los tres samples y cierra pestañas personales.
- [ ] Graba 1920×1080, 30 fps, sin mostrar config, debug token ni PII real.
- [ ] Sigue los 8 planos; duración objetivo 2:25–2:40.
- [ ] Comprueba duración con `ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 video.mp4`.
- [ ] Sube a YouTube: **Público**, no “made for kids”, título y descripción en inglés.
- [ ] Añade subtítulos `redactly/video/subtitles.srt`; idioma inglés.
- [ ] Copia la URL y pégala en `redactly/SUBMISSION.md` y en el README.
- [ ] Prueba el enlace en incógnito.

## 6. Devpost

- [ ] Abre el challenge → **Submit project**.
- [ ] Rellena nombre **Redactly**, elevator pitch, thumbnail (`redactly/screenshot.png`), vídeo, repo y hosted URL.
- [ ] **Built with:** Firebase AI Logic, Gemini Nano 4, App Check, JavaScript, HTML, CSS, Node.js.
- [ ] Descripción: pega el texto inglés de `redactly/SUBMISSION.md`.
- [ ] Añade **Pre-existing code disclosure** (repo nuevo, sin código preexistente) y **What was built during the submission period**.
- [ ] Selecciona plataforma **Web/Chrome**, país España, individual.
- [ ] Testing instructions: repo, hosted URL, `npm test`, `python3 -m http.server 8080`, Chrome 139+, flag de Gemini Nano y debug token solo local.
- [ ] Guarda borrador → previsualiza → revisa enlaces en incógnito.
- [ ] Envía antes del **30-nov 2:00 PM PT** y guarda confirmación.

## 7. Opcional

- [ ] **Quota:** solo si el cloud o la generación de imágenes falla; formulario <https://forms.gle/uPcDhaYW3iVo2AYw5>. Sprint 2 antes del **18-nov 10:00 AM PT**; Sprint 3 antes del **25-nov 10:00 AM PT**.
- [ ] **Build session:** 12-nov 10:00 AM PT; enlace Luma.
- [ ] **Multiplataforma:** Android/iOS daría consideración fuerte al Grand Prize, pero no es obligatorio.

## 8. Comprobación final

- [ ] `npm test` en verde.
- [ ] `git status` limpio; sin C++; `LICENSE` visible en About.
- [ ] `git grep -n "sk_live_\\|AIza\\|-----BEGIN"` sin claves reales.
- [ ] Hosted URL y vídeo funcionan en incógnito.
- [ ] Devpost enviado y plataforma **Web/Chrome** marcada.
