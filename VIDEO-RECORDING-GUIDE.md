# Guía de grabación — Redactly (#BuildHybridAI 2026)

> **Objetivo:** grabar un vídeo de **2:40** (≤3 min) en inglés, con voz sintetizada
> y sin enseñar secretos, configuración, tokens de depuración ni datos personales.
> **Estado:** flujo probado end-to-end el **17-nov-2026** con Chrome 157, Gemini Nano
> real y App Check real (reCAPTCHA Enterprise en la demo alojada).
>
> Los audios ya están sintetizados en [`video/audio/`](video/audio/):
> `full-voiceover-timed.mp3` (2:40 exactos) y un MP3 por plano.

---

## 1. Antes de grabar

### 1.1 Chrome y Gemini Nano

1. Usa **Chrome 157+** de escritorio.
2. Comprueba que el modelo está instalado:
   - `chrome://settings/ai` → **On-device AI** activado.
   - `chrome://components` → **Optimization Guide On Device Model** actualizado.
3. Abre DevTools → Console y ejecuta:
   ```js
   await LanguageModel.availability()
   ```
   Debe devolver `"available"`. Si devuelve `"downloadable"`:
   ```js
   await LanguageModel.create()
   ```
4. Si tienes otra ventana de Chrome con el modelo cargado, ciérrala: en GPUs de
   8 GB el modelo de 3,3 GB puede agotar la VRAM y fallar con
   `VK_ERROR_OUT_OF_DEVICE_MEMORY`.

### 1.2 Demo correcta

Usa la demo alojada, no `localhost`, para que App Check use reCAPTCHA real:

```text
https://redactly-dbb56.web.app/?sample=sample.png&theme=dark
```

Ventajas:
- `config: Firebase AI Logic + App Check`
- `on-device: available`
- sin token de depuración en pantalla
- las llamadas cloud llevan `X-Firebase-AppCheck`

### 1.3 Limpieza visual

- Cierra pestañas personales, correo, Slack y notificaciones.
- Oculta la barra de marcadores: `Ctrl+Shift+B`.
- Zoom del navegador al **100 %**.
- Tema **oscuro** (se ve mejor en vídeo).
- No abras `firebase-config.js`, DevTools, la consola de Firebase ni el token de
  depuración.
- No uses datos reales: los tres samples son sintéticos.

### 1.4 OBS

- **1920×1080**, **30 fps**, H.264, MP4.
- Captura de **ventana de Chrome**; escala la ventana para que ocupe el lienzo.
- Micrófono **desactivado**: la voz va aparte con `full-voiceover-timed.mp3`.
- Si el texto se ve pequeño, graba a 1600×900 y escala a 1080p en el editor; no
  cambies la relación de aspecto.

---

## 2. Guion exacto de grabación

> Graba cada plano por separado. Luego colócalos en la línea de tiempo con estos
> tiempos. La voz sintetizada ya está cortada a estos mismos tiempos.

| Plano | Tiempo | Acción exacta en pantalla | Audio |
|---|---|---|---|
| 01 | 0:00–0:15 | Tarjeta título: “Share the screen, not your secrets.” | `01.mp3` |
| 02 | 0:15–0:35 | App abierta. Selector de samples: **API 401 (.env)**, **Support ticket**, **Bank statement**. Enseña los secretos falsos, sin redactar todavía. | `02.mp3` |
| 03 | 0:35–1:05 | Vuelve a **API 401**. Clic en **Redact on-device**. Espera 20–30 s. Se dibujan **14 cajas**. Enseña el badge `on-device: available`, el `config: Firebase AI Logic + App Check` y la lista de hallazgos. | `03.mp3` |
| 04 | 1:05–1:25 | Arrastra una caja manual sobre un valor visible; luego haz clic en una caja para quitarla. Enseña cómo cambian la imagen redactada, el hash del recibo y la tarjeta de riesgo. | `04.mp3` |
| 05 | 1:25–1:45 | Clic en **⚡ Quick answer**; enseña `⚡ on-device`. Luego elige **Text** y clic en **☁ Deep answer**; enseña `☁ cloud` y la respuesta. | `05.mp3` |
| 06 | 1:45–2:05 | Cambia **Cloud payload** entre **Text**, **Redacted image** y **Both**. Enseña la tarjeta de riesgo: **12 redactions, 0 secrets sent, 0 B raw image uploaded**. Abre **View receipt** y enseña `rawImageUploaded:false`, `secretsSent:0`, `appCheck:true`. | `06.mp3` |
| 07 | 2:05–2:25 | Terminal: `npm test` → tres suites en verde. Enseña el README o la arquitectura: Gemini Nano on-device + Firebase AI Logic + App Check. | `07.mp3` |
| 08 | 2:25–2:40 | Tarjeta final: repo, GPL-3.0, `redact locally, ask globally`. | `08.mp3` |

### Notas de montaje

- El primer `Redact on-device` tarda **20–30 s** con el modelo ya cargado. En el
  montaje, acelera esa espera a **3–4 s** y mantén visible el badge y el progreso.
- No cortes la transición de `⚡ on-device` a `☁ cloud`: es la prueba de la
  inferencia híbrida.
- Si el modelo tarda más, corta el silencio; no cambies la voz.
- No muestres la pestaña Network con la API key ni el `firebase-config.js`.

---

## 3. Voz sintetizada

- Archivo completo: `video/audio/full-voiceover-timed.mp3` (**160,0 s**).
- Voz: `en-US-AndrewNeural`, ritmo `-4 %`, tono `-2 Hz`.
- Por plano: `video/audio/01.mp3` … `08.mp3`.
- Si quieres regenerarla:
  ```bash
  cd video/audio
  for i in 01 02 03 04 05 06 07 08; do
    edge-tts --voice en-US-AndrewNeural --rate=-4% --pitch=-2Hz \
      --file "$i.txt" --write-media "$i.mp3"
  done
  ```
- Para mezclar: voz a **−16 LUFS**, picos por debajo de **−1 dBTP**; sin música
  o con música muy suave por debajo de **−28 LUFS**.

---

## 4. Exportar y subir

1. Exporta **H.264, 1920×1080, 30 fps, AAC 192 kbps**.
2. Comprueba duración:
   ```bash
   ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 redactly-demo.mp4
   ```
   Debe ser **≤ 180 s**.
3. Sube a YouTube como **público**, no “made for kids”.
4. Añade subtítulos `video/subtitles.srt` en inglés.
5. Copia la URL en `SUBMISSION.md` y en Devpost.
6. Prueba la URL en una ventana de incógnito.

---

## 5. Checklist rápida

- [ ] Chrome 157+ y `LanguageModel.availability()` = `available`.
- [ ] Demo alojada: `config: Firebase AI Logic + App Check`.
- [ ] Tres samples cargan y redactan.
- [ ] `npm test` en verde.
- [ ] Audio `full-voiceover-timed.mp3` importado.
- [ ] Vídeo ≤ 3 min, 1080p, inglés.
- [ ] Sin secretos, sin PII, sin DevTools.
- [ ] YouTube público + subtítulos.
