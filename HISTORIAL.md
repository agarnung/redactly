# Historial del proyecto — Redactly

Bitácora completa y resumida de todo lo hecho para **#BuildHybridAI 2026**, desde
el primer commit hasta el estado actual. Sirve como constancia de decisiones,
comandos, incidencias y pendientes.

- **Repositorio:** <https://github.com/agarnung/redactly>
- **Demo:** <https://redactly-dbb56.web.app>
- **Proyecto Firebase:** `redactly-dbb56`
- **Licencia:** GPL-3.0
- **Cierre del concurso:** 30-nov-2026, 14:00 PT = 23:00 CET

---

## 1. Origen y planteamiento

Redactly nace como proyecto nuevo para el reto **Firebase AI Logic / #BuildHybridAI
2026**. La idea central es una app web de privacidad:

> **Redact locally, ask globally.**

Una captura de pantalla se procesa **en el dispositivo** con Gemini Nano. El modelo
local detecta correos, claves API, tokens, IBAN, tarjetas y otros secretos, y dibuja
cajas negras sobre ellos. Solo después el usuario decide si envía a la nube el texto
sanitizado, la imagen redactada o ambos. La imagen original nunca sale del navegador.

**Decisión clave:** no se reutilizó código previo. Todo el proyecto se construyó
durante el periodo de submission, lo que se declara en `SUBMISSION.md`.

---

## 2. Línea temporal de commits

El historial se reescribió el 17-nov-2026 para que **todos** los commits tuvieran
como autor/committer la cuenta correcta (`agarnung`). Los hashes actuales son:

| Fecha | Commit | Qué se hizo |
|---|---|---|
| 2026-11-12 | `7663f72` | Commit inicial: app web de inferencia híbrida con privacidad. |
| 2026-11-12 | `1061ba2` | Corregido el ID real del proyecto Firebase en la documentación. |
| 2026-11-12 | `8fd0005` | Soporte de reCAPTCHA Enterprise y tokens fijos de App Check. |
| 2026-11-12 | `1d0adfc` | Toggle claro/oscuro y capturas actualizadas. |
| 2026-11-12 | `aa1c2d3` | Paleta del tema claro suavizada. |
| 2026-11-12 | `3aff086` | Footer oficial y tarjeta de riesgo más suave en tema claro. |
| 2026-11-12 | `448c4e5` | Documentado el fallback directo de reCAPTCHA Enterprise. |
| 2026-11-12 | `701d3f8` | Subtítulo del hero acortado. |
| 2026-11-12 | `a5dc7c7` | Fondos y degradados suaves. |
| 2026-11-12 | `d812ba5` | Script de servidor estático en segundo plano. |
| 2026-11-12 | `b3ca5cf` | Degradado de fondo reforzado. |
| 2026-11-12 | `9705e17` | Documentado el flujo local completo en el README. |
| 2026-11-12 | `dbef2af` | Selector drag-and-drop de capturas y tooltips. |
| 2026-11-12 | `a62840e` | Flujo de acciones mejorado y controles agrupados. |
| 2026-11-12 | `37ec81f` | Acción de redactar colocada antes de los controles de pregunta. |
| 2026-11-12 | `bb3cdc1` | Corregidos preview oculto y tooltips en botones deshabilitados. |
| 2026-11-17 | `90b7092` | Pulido de tooltips, tema claro y checklist de submission. |
| 2026-11-17 | `494f823` | Ignorar vídeos en cualquier carpeta. |
| 2026-11-17 | `9a5c373` | Documentado el paso de activación de GitHub Pages. |
| 2026-11-17 | `c64ad58` | Firebase Hosting pasa a ser la demo principal. |
| 2026-11-17 | `92cb2c6` | **Deploy de Firebase Hosting** y checklist actualizada. |

---

## 3. Qué se construyó

### 3.1 Funcionalidad principal

- Redacción **on-device** con Gemini Nano y salida estructurada.
- Cajas visuales de redacción + editor manual de cajas.
- Sanitización de texto y **leak check** antes de cualquier llamada cloud.
- Enrutado **Quick/Deep** entre `ONLY_ON_DEVICE` y `ONLY_ON_CLOUD`.
- Payload seleccionable: texto sanitizado, imagen redactada o ambos.
- **Recibo de privacidad SHA-256**, tarjeta de riesgo y ledger de privacidad.
- Tres escenarios sintéticos: error API 401, ticket de soporte y extracto bancario.
- **Mock mode** sin Firebase para demos offline.
- Tests Node para la lógica pura.
- Entrada PNG/JPEG por drag-and-drop con selector estilizado.
- Tooltips en todas las acciones.
- Toggle claro/oscuro persistido en `localStorage`.
- Diseño responsive con footer y enlaces oficiales.

### 3.2 Archivos principales

- `index.html`, `styles.css`, `app.js`
- `redaction.js` (detección/redacción), `routing.js` (Quick/Deep)
- `receipt.js` (recibo SHA-256), `samples.js` (escenarios)
- `tests-redaction.mjs`, `tests-routing.mjs`, `tests-receipt.mjs`
- `firebase-config.example.js` (plantilla) y `firebase-config.js` (local, ignorado)
- `scripts/serve.sh`, `scripts/stop.sh`
- `README.md`, `PRIVACY.md`, `DEPLOY.md`, `SUBMISSION.md`, `VIDEO-SCRIPT.md`
- `CHECKLIST-ALEJANDRO.md`, `video/subtitles.srt`

---

## 4. Repositorio y seguridad

1. Se creó el repositorio público **`agarnung/redactly`** sin README, LICENSE ni
   `.gitignore` iniciales.
2. Se añadió **GPL-3.0** y se comprobó que GitHub la detecta en **About**.
3. Se verificó que `firebase-config.js` **no** está en el repo.
4. Se buscaron secretos con:
   ```bash
   git grep -n "sk_live_\|AIza\|-----BEGIN"
   ```
   sin encontrar claves reales.
5. Se confirmó que todas las muestras son sintéticas: no hay PII real, claves de
   API ni secretos de Google Cloud.
6. El 17-nov se reescribió todo el historial con `git filter-branch` para eliminar
   un correo corporativo y dejar `agarnung` como autor/committer. Después se hizo
   `git push --force-with-lease`.
7. `.gitignore` cubre `firebase-config.js`, `node_modules/`, `__pycache__/`,
   `*.pyc`, `.DS_Store`, `.run/`, `.firebase/` y vídeos (`*.mp4`, `*.mov`,
   `*.webm`, `*.mkv`, `*.avi`) en cualquier carpeta.
8. `SUBMISSION.md` sí se publica: es texto público y no contiene secretos.

---

## 5. Firebase: AI Logic, App Check y configuración local

1. Se abrió <https://console.firebase.google.com> y se seleccionó el proyecto
   **`redactly-dbb56`**.
2. En **AI Logic** se pulsó **Get started**, se eligió **Gemini Developer API**
   (free tier) y se habilitó la API.
3. Se comprobó que la app web `redactly` aparece en la lista de apps.
4. En **App Check** se eligió **Fraud Defense (reCAPTCHA Enterprise)** y se creó
   una key para `localhost`, `agarnung.github.io`, `redactly-dbb56.web.app` y
   `redactly-dbb56.firebaseapp.com`.
5. Se copió solo la **site key** (`6L...`), nunca la secret key, y se configuró
   TTL de 1 hora.
6. `firebase-config.js` local quedó con:
   - project ID `redactly-dbb56`
   - `recaptchaSiteKey`
   - `appCheckProvider: "enterprise"`
   - debug token fijo para desarrollo local
7. Se registró el debug token en **App Check → Manage debug tokens**.
8. Se verificó que el archivo está ignorado:
   ```bash
   git check-ignore -v firebase-config.js
   ```
9. Se sirvió la app en local con `python3 -m http.server 8093` y con
   `./scripts/serve.sh` (elige el siguiente puerto libre desde 8093 y escribe
   `.run/server.pid` + `.run/server.log`).

**Nota técnica:** para Firebase AI Logic no se añade `enterprise.js`; App Check usa
`ReCaptchaEnterpriseProvider` y refresca solo.

---

## 6. Tests y verificación local

- `npm test` ejecuta los tests de `receipt`, `redaction` y `routing`: **3 tests en
  verde**.
- Mock mode permite recorrer todo el flujo sin red, sin proyecto Firebase y sin
  secretos.
- Se comprobó el toggle claro/oscuro y la carga de la app en `localhost:8093`.
- Se documentó el flujo real en Chrome 139+:
  1. Activar **On-device AI** en `chrome://settings/ai`.
  2. Activar `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`.
  3. Ejecutar `await LanguageModel.availability()`.
  4. Si devuelve `downloadable`, ejecutar `await LanguageModel.create()`.
  5. Abrir la app, pulsar **Check on-device** y **Redact on-device**.
  6. En Network, las llamadas Firebase deben llevar `X-Firebase-AppCheck`; la
     imagen original nunca debe aparecer subida.

---

## 7. GitHub Pages: incidencia y decisión

- Se añadió un workflow de GitHub Pages, pero los runs fallaban porque Pages no
  estaba habilitado (`/repos/.../pages` devolvía 404 y fallaba
  `actions/configure-pages@v5`).
- Para no romper cada push, `pages.yml` se cambió a **`workflow_dispatch`**.
- **Decisión:** usar **Firebase Hosting** como demo principal. GitHub Pages queda
  solo como fallback manual y no se activa por defecto.
- El workflow manual sigue documentado en `CHECKLIST-ALEJANDRO.md` por si Firebase
  Hosting fallara.

---

## 8. Deploy de Firebase Hosting

1. Firebase CLI se usó sin instalación global:
   ```bash
   npx --yes firebase-tools
   ```
2. Login con la cuenta correcta: **`agarnungm@gmail.com`**. La cuenta
   `garnungalejandro@gmail.com` no veía el proyecto.
3. Selección del proyecto:
   ```bash
   npx firebase-tools use redactly-dbb56
   ```
4. No se ejecutó `firebase init`: `firebase.json` ya existía con `"public": "."`
   y rewrites a `index.html`.
5. Antes del deploy se puso `appCheckDebugToken: false` para que la demo pública
   use reCAPTCHA Enterprise.
6. Deploy:
   ```bash
   npx firebase-tools deploy --only hosting
   ```
7. Verificación:
   - `https://redactly-dbb56.web.app` → **200**
   - `https://redactly-dbb56.web.app/?autodemo=1&payload=both` → **200**
8. Después del deploy se restauró el debug token **solo en local** para seguir
   probando en `localhost`.
9. `.firebase/` se añadió al `.gitignore` porque el deploy lo crea como directorio
   de trabajo no versionado.

**Estado:** demo desplegada y verificada. Firebase Hosting es la URL principal.

---

## 9. Documentación y entregables

- `README.md`: descripción, demo, modo mock, modo real, troubleshooting y alcance.
- `PRIVACY.md`: modelo de privacidad y garantías.
- `DEPLOY.md`: despliegue en Firebase Hosting y fallback de Pages.
- `SUBMISSION.md`: texto de Devpost, pitch, built with, disclosure de código
  preexistente y qué se construyó durante el periodo.
- `VIDEO-SCRIPT.md`: guion de 8 planos, objetivo 2:25–2:40.
- `video/subtitles.srt`: subtítulos en inglés.
- `CHECKLIST-ALEJANDRO.md`: checklist operativa con checkbox por paso, fases 0–8.
- Capturas: `screenshot.png`, `screenshot-light.png`, `screenshot-quick.png`,
  `screenshot-bank.png`, `screenshot-receipt.png`.

---

## 10. Estado actual y pendientes

### Hecho

- [x] Repo público, GPL-3.0 y autoría corregida en todo el historial.
- [x] App funcional en mock mode y tests en verde.
- [x] Firebase AI Logic y App Check configurados.
- [x] Config local separada y gitignored.
- [x] Firebase Hosting desplegado y verificado 200.
- [x] Autodemo verificada con payloads `both`, `text` e `image`.
- [x] GitHub Pages degradado a fallback manual.
- [x] `.firebase/` y vídeos ignorados por git.

### Pendiente antes del envío

- [ ] Probar **Gemini Nano real** en Chrome 139+ y confirmar
  `on-device: available`.
- [ ] Confirmar que App Check no da error tras una llamada real.
- [ ] Recorrer los tres escenarios y los payloads text/image/both; revisar receipt,
  `rawImageUploaded:false`, `secretsSent:0` y leak check.
- [ ] Grabar vídeo ≤3 min en inglés, 1920×1080, 30 fps, sin secretos ni PII.
- [ ] Subir a YouTube como público, añadir subtítulos y probar en incógnito.
- [ ] Enviar Devpost antes del **30-nov-2026 14:00 PT** y guardar confirmación.
- [ ] Opcional: quota form (sprints 2/3) y clientes Android/iOS para
  consideración multiplataforma.

---

## 11. Comandos de referencia

```bash
# Tests
npm test

# Servidor local
./scripts/serve.sh
./scripts/stop.sh

# Estado del repo
git status
git log --oneline --decorate -10

# Comprobar secretos
git grep -n "sk_live_\|AIza\|-----BEGIN"

# Deploy (con appCheckDebugToken: false)
npx --yes firebase-tools use redactly-dbb56
npx --yes firebase-tools deploy --only hosting

# Verificar demo
curl -s -o /dev/null -w '%{http_code}\n' https://redactly-dbb56.web.app
```

---

_Última actualización: 17-nov-2026._
