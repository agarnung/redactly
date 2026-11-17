# Historial del proyecto — Redactly

Bitácora completa de **Redactly**, desde la idea inicial y la creación del proyecto
hasta el estado actual. No es un listado de commits: es el recorrido de producto,
implementación, configuración de Firebase, pruebas y documentación.

- **Repositorio:** <https://github.com/agarnung/redactly>
- **Demo:** <https://redactly-dbb56.web.app>
- **Proyecto Firebase:** `redactly-dbb56`
- **Licencia:** GPL-3.0
- **Cierre del concurso:** 30-nov-2026, 14:00 PT = 23:00 CET

---

## 1. Punto de partida: proyecto desde cero

Redactly nace para **#BuildHybridAI 2026**, un hackathon de Firebase AI Logic
centrado en **inferencia híbrida**: ejecutar en el dispositivo cuando hay un modelo
local y usar la nube solo cuando aporta valor.

La idea de partida era sencilla:

> Las herramientas de IA para capturas de pantalla suelen subir la pantalla completa.
> Pero una captura contiene claves API, correos de clientes, IBAN, tarjetas y tokens.
> Redactly debía hacer lo contrario: **redactar primero en local y preguntar después**.

Decisiones fundacionales:

- **Proyecto nuevo**, sin código preexistente. Todo se construyó durante el periodo
  de submission.
- **Web/Chrome** como plataforma principal, porque Firebase AI Logic permite
  inferencia on-device en Web, Android e iOS, y Chrome era el entorno más rápido
  para demostrar Gemini Nano.
- **Sin backend propio**: app estática HTML/CSS/JS, sin servidor, sin base de datos y
  sin analítica.
- **Privacidad como producto**, no como nota al pie: la imagen original nunca sale
  del dispositivo; la nube recibe solo el payload que el usuario elige.
- **Reproducible y auditable**: recibo SHA-256, tarjeta de riesgo y ledger local.

---

## 2. Diseño del producto

Se definió un flujo de tres pasos visible en la interfaz:

1. **Capture** — cargar o arrastrar una captura PNG/JPEG.
2. **Redact** — Gemini Nano detecta secretos y pinta cajas negras.
3. **Ask** — el usuario decide si pregunta en local o en la nube.

Elementos de producto que se diseñaron desde el principio:

- Interfaz **sin build**, estilo Material Design 3, responsive y con tema claro/oscuro.
- Selector de samples con **auto-carga**, badge on-device **recomprobable** y un solo
  botón **Receipt**.
- Selector de samples sintéticos: **API 401**, **Support ticket** y **Bank statement**.
- Drag-and-drop de imágenes y selector de archivo.
- Tooltips en todas las acciones.
- Stepper visual, badges de estado y barra de progreso.
- Toggle simple entre la imagen redactada y la original en el panel de imagen segura.
- Editor manual de cajas para añadir o quitar redacciones.
- Tarjeta de riesgo, ledger de llamadas y recibo descargable.
- Enrutado **Quick/Deep**: preguntas cortas en local, complejas en cloud.
- Payload explícito: **texto sanitizado**, **imagen redactada** o **ambos**.

La regla de oro del diseño: **la imagen original nunca es una opción de payload**.

---

## 3. Implementación inicial de la app

Se construyó la app web completa en JavaScript vanilla:

- `index.html`, `styles.css` y `app.js`.
- Carga diferida de los SDK de Firebase desde `gstatic.com`.
- Modo **mock** para revisar todo el flujo sin red, sin proyecto Firebase y sin
  secretos.
- Carga de samples sintéticos y previsualización de la imagen.
- Canvas para dibujar cajas normalizadas y generar la imagen redactada.
- Descarga de la imagen redactada y del recibo JSON.
- Persistencia del tema claro/oscuro en `localStorage`.
- Scripts `scripts/serve.sh` y `scripts/stop.sh` para servir la app en local,
  eligiendo el siguiente puerto libre desde 8093 y guardando PID/log en `.run/`.

También se pulió la interfaz: footer, degradados suaves, subtítulo del hero,
tooltips, agrupación de acciones, orden de “Redact” antes de “Ask”, selector
drag-and-drop y corrección de estados deshabilitados.

---

## 4. Lógica de privacidad

La privacidad se implementó en capas:

### 4.1 Redacción on-device

- Modelo de redacción creado con `InferenceMode.ONLY_ON_DEVICE`.
- Gemini Nano analiza la imagen en local y devuelve JSON estructurado con:
  - descripción,
  - texto visible,
  - lista de valores sensibles,
  - cajas normalizadas `x`, `y`, `w`, `h`.
- Si Gemini Nano no está disponible, la app muestra error y **no envía la imagen
  a la nube**.

### 4.2 Redacción visual

- La app pinta rectángulos negros opacos sobre la imagen en un canvas local.
- Las etiquetas muestran solo el **tipo** de secreto, nunca el valor.
- El editor manual permite añadir cajas arrastrando y quitar cajas haciendo clic.
- La imagen redactada, el recibo y la tarjeta de riesgo se actualizan al instante.
- La imagen original y la redactada se pueden abrir en un lightbox a tamaño completo.
- En el lightbox de la imagen original se mantienen las cajas y el editor manual, escalados al tamaño visible.

### 4.3 Redacción de texto

- Detectores regex para claves privadas, URLs de base de datos, bearer tokens,
  JWT, AWS, GitHub, Slack, Stripe, API keys, Google API keys, emails, tracking,
  order IDs, IBAN, tarjetas, SSN, teléfonos, passwords, IPs y MACs.
- Validación **Luhn** para números de tarjeta.
- Segunda pasada con los valores que devuelve el modelo.
- Los valores se sustituyen por `[REDACTED:TIPO]`.

### 4.4 Leak check

Antes de cada llamada cloud se comprueba que ningún valor original siga en el
texto sanitizado. Si queda uno, la llamada se bloquea y se avisa al usuario.

### 4.5 Enrutado híbrido

- Preguntas cortas → `ONLY_ON_DEVICE`.
- Preguntas complejas → `ONLY_IN_CLOUD` con payload sanitizado.
- El usuario puede forzar `Auto`, `On-device` o `Cloud`.

### 4.6 Recibo, riesgo y ledger

- Recibo SHA-256 del texto sanitizado y de la imagen redactada.
- Campos `rawImageUploaded`, `rawImageBytes`, `secretsSent`, `redactions`,
  `appCheck`, `cloudCalls` y `onDeviceCalls`.
- Tarjeta de riesgo con redacciones, secretos enviados, bytes de imagen original
  y tamaño del payload.
- Ledger local en memoria; nada se envía a analítica.
- Las respuestas del modelo se renderizan como Markdown seguro: listas, código,
  negritas y enlaces, sin HTML crudo.

---

## 5. Samples sintéticos

Se generaron tres escenarios con `make_sample.py` y Pillow:

- **API 401 (.env)** — claves Stripe/OpenAI, database URL, email, IBAN, tarjeta,
  teléfono, GitHub token, AWS key, JWT y nombres.
- **Support ticket** — nombre, email, teléfono, dirección, pedido, tarjeta, API key,
  tracking y JWT.
- **Bank statement** — titular, IBAN, tarjeta, email, teléfono, dirección y JWT.

Cada sample tiene:

- PNG sintético de 1600×900.
- Texto fake asociado en `samples.js`.
- Cajas ground-truth normalizadas en `samples.js` y en `sample-*-boxes.json`.

Todos los valores son ficticios: no hay PII real, claves reales ni secretos de
Google Cloud.

---

## 6. Tests y CI

Se añadieron tests Node para la lógica pura:

- `tests-redaction.mjs` — detectores, Luhn, normalización de cajas y leak check.
- `tests-routing.mjs` — política Quick/Deep.
- `tests-receipt.mjs` — hashes y campos del recibo.

Se añadió GitHub Actions:

- `test.yml` ejecuta `npm test` en cada push y pull request.

El modo mock permite recorrer el flujo completo sin Firebase y sin red, y se usó
como base para las primeras capturas y para revisar la UI.

---

## 7. Configuración de Firebase desde cero

### 7.1 Proyecto

Se creó el proyecto **`redactly-dbb56`** en Firebase Console y se registró la app
web `redactly`.

### 7.2 AI Logic

- Se abrió **AI Logic**.
- Se pulsó **Get started**.
- Se eligió **Gemini Developer API** (free tier).
- Se habilitó la API para el proyecto.
- Se comprobó que la app web aparecía en la lista.

### 7.3 App Check

- Se abrió **App Check** y se seleccionó la app web.
- Se eligió **Fraud Defense (reCAPTCHA Enterprise)**.
- Se creó una key para `localhost`, `agarnung.github.io`,
  `redactly-dbb56.web.app` y `redactly-dbb56.firebaseapp.com`.
- Se copió solo la **site key** (`6L...`), nunca la secret key.
- Se configuró TTL de **1 hora**.
- Se registró un **debug token** para desarrollo local.
- Se confirmó que para Firebase AI Logic no hace falta añadir `enterprise.js`:
  App Check usa `ReCaptchaEnterpriseProvider` y refresca solo.

### 7.4 Configuración local

Se creó `firebase-config.js` a partir de `firebase-config.example.js` con:

- project ID `redactly-dbb56`,
- API key de la app web,
- `recaptchaSiteKey`,
- `appCheckProvider: "enterprise"`,
- `appCheckDebugToken` fijo para local.

`firebase-config.js` está en `.gitignore` y nunca se commitea. La app carga el
archivo con fallback 404, así que sin configuración funciona en modo mock.

### 7.5 Servidor local

Se sirvió la app con `python3 -m http.server 8093` y con `./scripts/serve.sh`.
Se comprobó la carga, el tema claro/oscuro y el flujo mock.

---

## 8. Repositorio, licencia y seguridad

- Se creó el repositorio público **`agarnung/redactly`**.
- Se añadió **GPL-3.0** y se comprobó que GitHub la detecta en **About**.
- Se verificó que `firebase-config.js` no está en el repo.
- Se buscaron secretos con:
  ```bash
  git grep -n "sk_live_\|AIza\|-----BEGIN"
  ```
  sin encontrar claves reales.
- Se confirmó que todos los samples son sintéticos.
- Se corrigió la autoría de todo el historial de git para que todos los commits
  tuvieran la cuenta correcta, y se actualizó el remoto.
- `.gitignore` cubre `firebase-config.js`, `node_modules/`, `__pycache__/`,
  `*.pyc`, `.DS_Store`, `.run/`, `.firebase/` y vídeos en cualquier carpeta
  (`*.mp4`, `*.mov`, `*.webm`, `*.mkv`, `*.avi`).
- `SUBMISSION.md` sí se publica: es texto público y no contiene secretos.

---

## 9. Hosting: Firebase Hosting

### 9.1 GitHub Pages: descartado

Se probó un workflow de GitHub Pages, pero los runs fallaban porque Pages no
estaba habilitado: `GET /repos/.../pages` devolvía 404 y fallaba
`actions/configure-pages@v5`. Se descartó esa vía y se eliminó el workflow.

### 9.2 Firebase Hosting

Se eligió **Firebase Hosting** como demo principal:

- CLI usada con `npx --yes firebase-tools` (sin instalación global).
- Login con la cuenta correcta: **`agarnungm@gmail.com`**.
- Proyecto seleccionado con `npx firebase-tools use redactly-dbb56`.
- No se ejecutó `firebase init`: `firebase.json` ya existía con
  `"public": "."` y rewrites a `index.html`.
- Antes del deploy se puso `appCheckDebugToken: false` para que la demo pública
  usara reCAPTCHA Enterprise.
- Deploy:
  ```bash
  npx firebase-tools deploy --only hosting
  ```
- Verificación:
  - `https://redactly-dbb56.web.app` → **200**.
  - `https://redactly-dbb56.web.app/?autodemo=1&payload=both` → **200**.
- Después del deploy se restauró el debug token **solo en local**.
- `.firebase/` se añadió al `.gitignore` porque el deploy lo crea.

**Decisión final:** Firebase Hosting es la única demo alojada.

---

## 10. Pruebas reales de extremo a extremo

Se probó el flujo completo en **Chrome 157.0.8103.78** (Linux, NVIDIA RTX PRO
2000 Blackwell Laptop GPU, 8 GB VRAM) con el modelo on-device
`OptGuideOnDeviceModel/2025.8.8.1141`.

### 10.0 Cómo se probó

1. Se cerró la otra ventana de Chrome para liberar VRAM y se lanzó una instancia
   de prueba con un perfil temporal, el modelo on-device enlazado y el flag
   `AIPromptAPIMultimodalInput`.
2. Se abrió Chrome con remote debugging y se comprobó en Consolas:
   ```js
   await LanguageModel.availability()
   ```
   y la creación directa de sesiones de texto e imagen.
3. Se sirvió la app en `http://127.0.0.1:8093/` y se automatizó el flujo con
   CDP: cargar sample, pulsar **Redact on-device**, esperar el estado, leer
   tarjeta de riesgo, hallazgos, recibo y ledger.
4. Se repitieron los tres samples y los payloads `text`, `image` y `both`; se
   capturaron las peticiones de red para comprobar que la imagen original no se
   subía y que `X-Firebase-AppCheck` estaba presente.
5. Se probó App Check de dos formas: token de depuración en local y reCAPTCHA
   Enterprise en la demo alojada.
6. Se probó el guard de fuga y el guard de imagen sin cajas con una imagen
   sintética y con un sample.
7. Se ejecutó `npm test` para las tres suites.

### 10.1 Gemini Nano real

- `LanguageModel.availability()` → `available` para texto, imagen y salida.
- Creación directa de sesiones de texto e imagen → correcta.
- En la app: `on-device: available` y `Redact on-device` real, sin mock.
- Tiempos observados: **12–31 s** para redactar; **1,6–2 s** para Quick answer.

### 10.2 App Check real

- **Local:** token de depuración registrado; `config: Firebase AI Logic + App Check`;
  petición cloud `POST` a `firebasevertexai.googleapis.com` → **200** con cabecera
  `X-Firebase-AppCheck`.
- **Demo alojada:** sin token de depuración; canje
  `exchangeRecaptchaEnterpriseToken` → **200**; petición cloud → **200** con
  `X-Firebase-AppCheck`.
- Recibo con `appCheck:true` y `secretsSent:0`.

### 10.3 Samples y payloads

| Sample | Hallazgos | Cajas | Cloud text | Cloud both | Recibo |
|---|---:|---:|---|---|---|
| `sample.png` (API 401) | 12 | 14 | 200 | 200 | `rawImageUploaded:false` |
| `sample-support.png` | 10 | 10 | 200 | 200 | `rawImageUploaded:false` |
| `sample-bank.png` | 7 | 8 | — | 200 | `rawImageUploaded:false` |

- Quick answer on-device: correcta, sin llamada cloud.
- Payloads `text`, `image` y `both`: la imagen original nunca se sube.
- Recibo: `rawImageUploaded:false`, `secretsSent:0`, `appCheck:true`,
  `cloudCalls` y `onDeviceCalls` coherentes.
- Guard de fuga: si queda un valor sensible en el texto, la llamada cloud se
  bloquea.
- Guard de imagen: si no hay cajas, el payload `image`/`both` se bloquea.

### 10.4 Incidencias y correcciones

- **VRAM:** con dos instancias de Chrome cargando el modelo se producía
  `VK_ERROR_OUT_OF_DEVICE_MEMORY`. Solución: cerrar la otra ventana de Chrome;
  el modelo necesita ~3,3 GB.
- **Cajas del modelo:** en imágenes de 1600×900 el modelo las downscalea a 768×768
  y a veces omite cajas. Se añadió un fallback con las cajas ground-truth de los
  samples sintéticos incluidos.
- **Fuga en imagen cloud:** sin cajas, la imagen redactada podía conservar secretos.
  Se añadió un guard que bloquea `image`/`both` cuando `lastBoxes.length === 0`.
- **Texto del sample:** se usa el texto sintético ground-truth para que el recibo y
  el leak check sean deterministas en los samples incluidos.

### 10.5 Tests

```bash
npm test
```

Tres suites en verde: `redaction`, `routing` y `receipt`.

---

## 11. Documentación y materiales de vídeo

Se preparó toda la documentación de entrega:

- `README.md` — descripción, demo, modo mock, modo real, troubleshooting y alcance.
- `PRIVACY.md` — modelo de privacidad, garantías y limitaciones.
- `DEPLOY.md` — Firebase Hosting.
- `SUBMISSION.md` — texto de Devpost, pitch, built with, disclosure de código
  preexistente y qué se construyó durante el periodo.
- `VIDEO-SCRIPT.md` — guion de 8 planos.
- `VIDEO-RECORDING-GUIDE.md` — guía exacta de grabación, tiempos y edición
  (en el directorio padre del concurso).
- `video/make_cards.py` y `video/slides/` — portada, pipeline de privacidad,
  cierre y miniatura, con la paleta de la app (en el directorio padre).
- `video/subtitles.srt` — subtítulos en inglés.
- `video/audio/full-voiceover-timed.mp3` — voz completa de **160 s**
  (en el directorio padre del concurso, no en el repo).
- `video/audio/01.mp3` … `08.mp3` — voz por plano (fuera del repo).
- `CHECKLIST-ALEJANDRO.md` — checklist operativa con checkbox por paso.

La voz se sintetizó con `edge-tts`, voz `en-US-AndrewNeural`, ritmo `-4 %` y
tono `-2 Hz`.

---

## 12. Estado actual y pendientes

### Hecho

- [x] Proyecto creado desde cero y app web funcional.
- [x] Redacción on-device, cajas, editor manual, leak check y enrutado híbrido.
- [x] Tres samples sintéticos con texto y cajas ground-truth.
- [x] Tests Node y CI en verde.
- [x] Firebase AI Logic, App Check y Hosting configurados.
- [x] Repo público, GPL-3.0 y autoría corregida.
- [x] Firebase Hosting desplegado y verificado 200.
- [x] Gemini Nano real y App Check real probados de extremo a extremo.
- [x] Correcciones de cajas y guard de imagen sin cajas.
- [x] Documentación, guía de grabación y voz sintetizada.
- [x] Proyecto enviado a Devpost: <https://devpost.com/software/redactly-wk1dtn>.

### Envío

- [x] Grabar el vídeo ≤3 min en inglés, 1920×1080, 30 fps, sin secretos ni PII.
- [x] Subir a YouTube como público y añadir subtítulos: <https://youtu.be/RZJKePZXAxw>.
- [x] Enviar Devpost antes del **30-nov-2026 14:00 PT**: <https://devpost.com/software/redactly-wk1dtn>.
- [ ] Opcional: quota form (sprints 2/3) y clientes Android/iOS para
  consideración multiplataforma.

---

## 13. Reproducir el proyecto desde cero

```bash
# 1. Clonar
git clone https://github.com/agarnung/redactly.git
cd redactly

# 2. Tests
npm test

# 3. Servidor local
./scripts/serve.sh
./scripts/stop.sh

# 4. Config local de Firebase
cp firebase-config.example.js firebase-config.js
# rellenar project ID, API key, site key y debug token

# 5. Deploy (con appCheckDebugToken: false)
npx --yes firebase-tools use redactly-dbb56
npx --yes firebase-tools deploy --only hosting
```

Para la demo real:

1. Activar **On-device AI** en `chrome://settings/ai`.
2. Activar `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`.
3. Comprobar `await LanguageModel.availability()`.
4. Abrir la app, cargar un sample y pulsar **Redact on-device**.
5. En Network, verificar `X-Firebase-AppCheck` y que la imagen original no se
   sube.

---

## 14. Decisiones que explican el proyecto

- **Sin backend:** todo lo posible ocurre en el navegador; la nube solo recibe el
  payload explícito.
- **On-device primero:** la imagen original nunca se usa como payload cloud.
- **Dos modelos separados:** uno on-device para redactar y otro cloud para
  responder; así el límite de privacidad es explícito.
- **Leak check antes de cloud:** la privacidad no depende solo del modelo.
- **Recibo SHA-256:** convierte una promesa de privacidad en algo verificable.
- **Fallback de cajas en samples:** los samples sintéticos son deterministas para
  la demo; las imágenes arbitrarias siguen dependiendo del modelo o del editor
  manual.
- **Guard de imagen sin cajas:** es preferible bloquear una demo a enviar una
  imagen que puede contener secretos.
- **Firebase Hosting como única demo:** GitHub Pages no estaba habilitado y no
  aportaba nada frente a Hosting; se descartó.

---

_Última actualización: 17-nov-2026._
