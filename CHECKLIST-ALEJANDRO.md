# Checklist Redactly — #BuildHybridAI 2026

> **Última sesión:** acceso a Firebase Console (`redactly-dbb56`) y app probándose en `http://localhost:8093/`.
> **Estado:** repo publicado en GitHub (`agarnung/redactly`, GPL-3.0). Pendiente: deploy, Gemini Nano real, vídeo y Devpost. Firebase CLI no está instalado en este equipo.
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
- [x] Crea la key con dominios `localhost`, `agarnung.github.io`, `redactly-dbb56.web.app`, `redactly-dbb56.firebaseapp.com`.
- [x] Copia la **site key** (`6L...`), no la secret key.
- [x] Pégala en App Check, TTL `1 hour`, y pulsa **Save**.
- [x] `firebase-config.js` con `appCheckProvider: "enterprise"`.
- [x] Debug token fijo registrado y puesto en `appCheckDebugToken`.
- [ ] Confirma que App Check no da error tras una llamada real.
- [x] **Nota:** para Firebase AI Logic no se añade `enterprise.js`; App Check usa `ReCaptchaEnterpriseProvider` y refresca solo.

### 1.4 Config local

- [x] `cd /opt/proyectos_personales/concursos/programacion/02-firebase-buildhybridai/redactly`
- [x] `firebase-config.js` tiene project ID, site key y `appCheckProvider: "enterprise"`.
- [x] `git check-ignore -v firebase-config.js` → ignorado.
- [x] `python3 -m http.server 8093` → abre `http://localhost:8093` (8080 puede estar ocupado).
- [x] Abre `http://localhost:8093/` y comprueba que la app carga.
- [ ] Debe aparecer `config: Firebase AI Logic + App Check`.
- [ ] Si usas debug token, cópialo de DevTools → Console y regístralo en App Check → Manage debug tokens.
- [ ] Recarga y comprueba que las llamadas llevan `X-Firebase-AppCheck` y no hay errores.
- [x] Comprueba el toggle claro/oscuro en la cabecera.

## 2. Gemini Nano real

- [ ] Chrome 139+ en escritorio.
- [ ] `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` → **Enabled** → reinicia Chrome.
- [ ] DevTools → Console: `await LanguageModel.availability()`.
- [ ] Si devuelve `downloadable`: `await LanguageModel.create()` y espera la descarga.
- [ ] En la app: **Check on-device** → debe decir `on-device: available`.
- [ ] Si falla: `chrome://components` → actualiza **Optimization Guide On Device Model**; revisa espacio libre, GPU/VRAM y RAM; reinicia Chrome.

## 3. Probar el flujo real

- [ ] **API 401 (.env)**: **Load sample** → **Redact on-device** → revisa cajas, etiquetas y texto sanitizado.
- [ ] **Support ticket**: revisa email, teléfono, pedido, tracking y tarjeta.
- [ ] **Bank statement**: revisa IBAN, importe y nombre.
- [ ] **Payload text** + **Deep answer**: en Network solo debe salir texto sanitizado.
- [ ] **Payload image** + **Deep answer**: solo debe salir la imagen redactada.
- [ ] **Payload both**: revisa receipt, `rawImageUploaded:false`, `secretsSent:0` y descarga el JSON.
- [ ] **Quick answer**: debe quedarse on-device, badge `⚡ on-device`, sin llamada cloud.
- [ ] **Editor de cajas**: arrastra para añadir, clic para quitar; receipt y risk card deben actualizarse.
- [ ] **Leak check**: si queda un valor original, la llamada cloud debe bloquearse.
- [ ] En Network no debe aparecer la imagen original subida.

## 4. Hosting

### Opción A — Firebase Hosting (recomendada)

- [ ] `npm i -g firebase-tools`
- [ ] `firebase login`
- [x] `cd /opt/proyectos_personales/concursos/programacion/02-firebase-buildhybridai/redactly`
- [ ] `firebase use --add` → elige `redactly-dbb56` → alias `default`.
- [ ] No ejecutes `firebase init` si te ofrece sobrescribir `firebase.json`; ya existe con `"public": "."`.
- [ ] Pon `appCheckDebugToken: false` en `firebase-config.js` antes de desplegar.
- [ ] `firebase deploy --only hosting`
- [ ] Abre `https://redactly-dbb56.web.app`.
- [ ] Añade `redactly-dbb56.web.app` y `redactly-dbb56.firebaseapp.com` a reCAPTCHA.
- [ ] Verifica que el deploy incluye `firebase-config.js` pero git sigue sin verlo.
- [ ] Prueba `?autodemo=1&payload=both`.
- [ ] Prueba `?autodemo=quick&sample=sample-support.png&payload=text`.
- [ ] Prueba `?autodemo=1&sample=sample-bank.png&payload=image`.

### Opción B — GitHub Pages (solo fallback manual)

> **Decisión:** usar **Firebase Hosting**, no GitHub Pages. Pages queda solo como emergencia. El workflow ya no se lanza en cada push: ahora es `workflow_dispatch`.

- [x] Workflow `pages.yml` cambiado a disparo manual.
- [ ] No activar Pages salvo que Firebase Hosting falle.
- [ ] Si se activa: GitHub → repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
- [ ] Actions → **Deploy to GitHub Pages** → **Run workflow**.
- [ ] Verificar `https://agarnung.github.io/redactly/` → **200**.
- [ ] **Settings → Secrets and variables → Actions → New repository secret**: `FIREBASE_CONFIG_JS`, valor = contenido completo de `firebase-config.js`.
- [ ] **Actions → Deploy to GitHub Pages → Run workflow**.
- [ ] Abre `https://agarnung.github.io/redactly/` y comprueba que carga.
- [ ] Añade `agarnung.github.io` a los dominios de reCAPTCHA y recarga.
- [ ] Si App Check falla, revisa consola, site key y dominios autorizados.

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
