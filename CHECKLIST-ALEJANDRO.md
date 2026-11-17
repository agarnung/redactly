# Checklist Redactly — #BuildHybridAI 2026

> **Última sesión:** acceso a Firebase Console (`redactly-dbb56`) y app probándose en `http://localhost:8093/`.
> **Estado:** código local listo y `npm test` en verde. Pendiente: push, deploy, Gemini Nano real, vídeo y Devpost.
> **Cierre:** **30-nov-2026, 14:00 PT = 23:00 CET**.
> **Regla:** no enviar hasta que repo, demo y vídeo respondan **200** en incógnito.

## 0. Publicar el repo en GitHub

- [ ] GitHub → **New repository** → nombre `redactly` → **Public** → sin README, sin LICENSE, sin `.gitignore`.
- [x] `cd /opt/proyectos_personales/concursos/programacion/02-firebase-buildhybridai/redactly`
- [x] `git remote add origin https://github.com/agarnung/redactly.git` (ya configurado)
- [ ] `git status` → revisar los 3 archivos modificados: `app.js`, `index.html`, `styles.css`
- [ ] `npm test` → los 3 tests en verde
- [ ] `git add app.js index.html styles.css`
- [ ] `git commit -m "Polish tooltips and light theme"`
- [ ] `git push -u origin main`
- [ ] Abrir `https://github.com/agarnung/redactly` → **200**
- [ ] Verificar que se ven `README.md`, `LICENSE`, `index.html`, `app.js` y `.github/workflows/`
- [ ] En **About**, comprobar que GitHub detecta **GPL-3.0**
- [ ] Comprobar que `firebase-config.js` no está en el repo
- [ ] `git grep -n "sk_live_\|AIza\|-----BEGIN"` → sin claves reales

## 1. Firebase: AI Logic, App Check y Hosting

### 1.1 Abrir el proyecto correcto

- [x] Entrar en `https://console.firebase.google.com/u/0/project/redactly-dbb56/overview`
- [x] Seleccionar el proyecto **`redactly-dbb56`**
- [x] Confirmar acceso a **AI Logic**, **App Check**, **Hosting** y **Project settings**

### 1.2 Activar AI Logic

- [x] Abrir **AI Logic**
- [x] Pulsar **Get started**
- [x] Elegir **Gemini Developer API** (free tier)
- [x] Habilitar la API para `redactly-dbb56`
- [x] Comprobar que la app web `redactly` aparece en la lista de apps

### 1.3 Activar App Check

- [x] Abrir **App Check**
- [x] Seleccionar la app web `redactly`
- [x] Elegir **Fraud Defense (reCAPTCHA Enterprise)**
- [x] Crear la key con dominios `localhost`, `agarnung.github.io`, `redactly-dbb56.web.app`, `redactly-dbb56.firebaseapp.com`
- [x] Copiar la **site key** (`6L...`), no la secret key
- [x] Pegarla en App Check, TTL `1 hour`, y pulsar **Save**
- [x] `firebase-config.js` con `appCheckProvider: "enterprise"`
- [x] Debug token fijo registrado y puesto en `appCheckDebugToken`
- [ ] Confirmar en App Check que no hay errores de verificación tras una llamada real

### 1.4 Config local y prueba en localhost

- [x] `firebase-config.js` tiene project ID, site key, `appCheckProvider` y debug token
- [x] `git check-ignore -v firebase-config.js` → ignorado
- [x] Arrancar servidor: `python3 -m http.server 8093` o `./scripts/serve.sh`
- [x] Abrir `http://localhost:8093/`
- [x] Comprobar que la app carga y se puede usar el flujo mock
- [ ] Comprobar que aparece `config: Firebase AI Logic + App Check`
- [ ] Comprobar en DevTools → Network que las llamadas llevan `X-Firebase-AppCheck`
- [x] Comprobar el toggle claro/oscuro y su persistencia

## 2. Probar Gemini Nano real

- [ ] Chrome 139+ en escritorio
- [ ] `chrome://settings/ai` → **On-device AI** activado
- [ ] `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` → **Enabled**
- [ ] Reiniciar Chrome
- [ ] DevTools → Console: `await LanguageModel.availability()`
- [ ] Si devuelve `downloadable`: `await LanguageModel.create()` y esperar la descarga
- [ ] En la app: **Check on-device** → `on-device: available`
- [ ] Si falla: `chrome://components` → actualizar **Optimization Guide On Device Model**
- [ ] Revisar espacio libre, GPU/VRAM y RAM; reiniciar Chrome

## 3. Probar el flujo real completo

- [ ] **API 401 (.env)**: **Load sample** → **Redact on-device** → revisar cajas, etiquetas y texto
- [ ] **Support ticket**: revisar email, teléfono, pedido, tracking y tarjeta
- [ ] **Bank statement**: revisar IBAN, importe y nombre
- [ ] **Payload text** + **Deep answer**: en Network solo sale texto sanitizado
- [ ] **Payload image** + **Deep answer**: solo sale la imagen redactada
- [ ] **Payload both**: revisar receipt, `rawImageUploaded:false`, `secretsSent:0` y descarga JSON
- [ ] **Quick answer**: se queda on-device, badge `⚡ on-device`, sin llamada cloud
- [ ] **Editor de cajas**: arrastrar para añadir, clic para quitar; receipt y risk card se actualizan
- [ ] **Leak check**: si queda un valor original, la llamada cloud se bloquea
- [ ] En Network no aparece la imagen original subida

## 4. Desplegar Firebase Hosting

- [ ] `npm i -g firebase-tools`
- [ ] `firebase login`
- [ ] `cd /opt/proyectos_personales/concursos/programacion/02-firebase-buildhybridai/redactly`
- [ ] `firebase use --add` → `redactly-dbb56` → alias `default`
- [ ] No ejecutar `firebase init` si ofrece sobrescribir `firebase.json`
- [ ] Poner `appCheckDebugToken: false` en `firebase-config.js`
- [ ] `firebase deploy --only hosting`
- [ ] Abrir `https://redactly-dbb56.web.app` → **200**
- [ ] Añadir `redactly-dbb56.web.app` y `redactly-dbb56.firebaseapp.com` a reCAPTCHA
- [ ] Verificar que el deploy incluye `firebase-config.js` pero git sigue sin verlo
- [ ] Probar `?autodemo=1&payload=both`
- [ ] Probar `?autodemo=quick&sample=sample-support.png&payload=text`
- [ ] Probar `?autodemo=1&sample=sample-bank.png&payload=image`

### Fallback GitHub Pages

- [ ] GitHub → repo → **Settings → Pages → Source: GitHub Actions**
- [ ] **Settings → Secrets and variables → Actions → New repository secret**: `FIREBASE_CONFIG_JS`
- [ ] **Actions → Deploy to GitHub Pages → Run workflow**
- [ ] Abrir `https://agarnung.github.io/redactly/` y comprobar que carga
- [ ] Añadir `agarnung.github.io` a reCAPTCHA
- [ ] Si App Check falla, revisar consola, site key y dominios

## 5. Grabar el vídeo

- [ ] Leer `VIDEO-SCRIPT.md`
- [ ] Preparar los tres samples y cerrar pestañas personales
- [ ] Grabar 1920×1080, 30 fps, sin config, debug token ni PII real
- [ ] Seguir los 8 planos; duración objetivo 2:25–2:40, máximo 3:00
- [ ] Comprobar duración: `ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 video.mp4`
- [ ] Subir a YouTube: **Público**, no “made for kids”, título y descripción en inglés
- [ ] Añadir subtítulos `video/subtitles.srt` en inglés
- [ ] Copiar la URL en `SUBMISSION.md` y `README.md`
- [ ] Probar el vídeo en incógnito

## 6. Enviar Devpost

- [ ] Abrir el challenge → **Submit project**
- [ ] Nombre: **Redactly**
- [ ] Elevator pitch
- [ ] Thumbnail: `screenshot.png`
- [ ] Vídeo de YouTube
- [ ] Repo: `https://github.com/agarnung/redactly`
- [ ] Demo: `https://redactly-dbb56.web.app`
- [ ] **Built with:** Firebase AI Logic, Gemini Nano 4, App Check, JavaScript, HTML, CSS, Node.js, GitHub Actions
- [ ] Descripción: pegar el texto inglés de `SUBMISSION.md`
- [ ] **Pre-existing code disclosure:** repo nuevo, sin código preexistente
- [ ] **What was built during the submission period:** demo Web/Chrome completa
- [ ] Plataforma **Web/Chrome**, país España, individual
- [ ] Testing instructions: repo, hosted URL, `npm test`, Chrome 139+, flag de Gemini Nano y debug token solo local
- [ ] Guardar borrador → previsualizar todos los enlaces en incógnito
- [ ] Enviar antes del **30-nov-2026 14:00 PT**
- [ ] Guardar confirmación y captura

## 7. Opcional

- [ ] Sprint de quota antes del **18-nov 10:00 PT** o **25-nov 10:00 PT**, solo si el cloud falla
- [ ] Build session del 12-nov
- [ ] Android/iOS para reforzar el Grand Prize, solo si sobra tiempo

## 8. Comprobación final

- [ ] `npm test` en verde
- [ ] `git status` limpio
- [ ] Repo **200** y licencia visible en About
- [ ] Hosted **200**
- [ ] Vídeo **200** y público
- [ ] Sin claves, secretos ni PII en repo/formulario
- [ ] Devpost enviado
- [ ] Confirmación guardada

## Referencia

- Reglas y envío: <https://firebasehybridaihackathon.devpost.com/>
- Deploy: [`DEPLOY.md`](DEPLOY.md)
- Guion de vídeo: [`VIDEO-SCRIPT.md`](VIDEO-SCRIPT.md)
- Texto Devpost: [`SUBMISSION.md`](SUBMISSION.md)
