# Projekt-1 – „Der Hauptmann von Köpenick“ (animierter Short)

Ein ~57 s langer vertikaler Cartoon-Short (1080×1920, 30 fps) auf Deutsch: flache 2D-Figuren in einer bunten
3D-Welt mit Tusche-Konturen, Tiefenunschärfe, gleitenden Kameras, Marschmusik und Soundeffekten.
Gebaut nach der Pipeline des Skills [claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts)
(three.js in Remotion, kein KI-Videogenerator). Geschichte, Figuren, Musik und Stimme sind eigene.

| Pfad | Inhalt |
|---|---|
| `koepenick/SCRIPT.md` | Fakten mit Quellen + Sprechertext |
| `koepenick/tools/voice.py` | Erzählstimme (Piper TTS, Stimme „thorsten“) + Wort-Zeitstempel `voice/words.json` |
| `koepenick/tools/audio.py` | synthetisierte Marschmusik, Soundeffekte, Mix mit Ducking |
| `src/videos/koepenick/story.ts` | Einstellungen, Kamerafahrten, Unschärfe – getaktet auf die Wörter |
| `src/videos/koepenick/world.ts` | Straße, Rathaus mit Turm, Trödelstand, Zug, Ampel, Kaiser-Podest |
| `src/videos/koepenick/cast.ts` + `toon.ts` | Figuren (Voigt, Grenadiere, Bürgermeister, Schutzleute, Kaiser) und ihre Inszenierung |
| `scripts/stills.mjs`, `scripts/sheet.sh` | Einzelbilder rendern, Kontaktbögen bauen |

## Neu bauen
```bash
npm install
cd koepenick && python3 tools/voice.py <de-thorsten-low.onnx> && python3 tools/audio.py && \
  ffmpeg -i audio/mix_pre.wav -af loudnorm=I=-14:TP=-1.5 -ar 48000 audio/mix.wav && cd ..
npx remotion render src/index.ts KoepenickShort out/final/video_silent.mp4 --props='{"post":{"dpr":0.6667}}' \
  --concurrency=4 --gl=angle --browser-executable=<chrome-headless-shell> --codec=h264 --crf=18
ffmpeg -i out/final/video_silent.mp4 -i koepenick/audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest koepenick/Hauptmann_von_Koepenick.mp4
```
