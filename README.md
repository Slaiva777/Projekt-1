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

---

# Serie 2: fünf weitere Shorts (Engine v2)

| Video | Thema | Ordner |
|---|---|---|
| „Das Geld auf dem Meeresgrund“ | Geld: das Steingeld von Yap | `videos/geld`, `src/videos/geld` |
| „Der Mann, der alles vergaß“ | Gedächtnis: Henry Molaison (H.M.) | `videos/gedaechtnis`, `src/videos/gedaechtnis` |
| „Der Arzt, der Hände wusch“ | Gesundheit: Ignaz Semmelweis | `videos/gesundheit`, `src/videos/gesundheit` |
| „Der Kran, der 300 Jahre wartete“ | Glaube: der Kölner Dom | `videos/glaube`, `src/videos/glaube` |
| „Der Emu-Krieg“ | frei gewählt: Australien 1932 | `videos/emu`, `src/videos/emu` |

Fakten und Quellen stehen jeweils in `videos/<name>/SCRIPT.md`, das fertige Video in `videos/<name>/<name>.mp4`.

**Was neu ist (`src/engine/`):**
- Stimme: Coqui „Thorsten VITS“ (22 kHz) statt Piper-low, Wort-Zeitstempel aus der Dauer-Ausrichtung des Modells (`tools/voice_vits.py`).
- Mehr Leben: Passanten laufen im Hintergrund hin und her, Gruppen unterhalten sich, Vogelschwärme, Rauch, ziehende Wolken (`world.ts` → `life`).
- Mehr Figuren-Vielfalt: Frisuren (Dutt, Zopf, lange Haare, Glatze), Hüte (Stroh, Melone, Schlapphut, Kopftuch, Schwesternhaube), Bärte, Brillen, Schürzen, Requisiten; Massen-Generator pro Epoche (`people.ts`); Emus.
- Texturfehler behoben: keine Löcher mehr durch Ausblenden ferner Häuser, keine Z-Konflikte bei Boden/Belägen, 16× anisotrope Filterung, Gras/Sand/Weizen als eigene Maltexturen, Render-Puffer 0.8 statt 0.67.
- Innenräume (`interior.ts`), Wasser (`world.ts`), Sturm/Unterwasser-Stimmungen pro Einstellung, Blitze.
- Sound: gemeinsame Bibliothek mit Stilen (Insel, Walzer, Marsch, Country, Choral, ruhig) und vielen Effekten (`tools/soundlib.py`).

Rendern: `scripts/render_video.sh <Composition> <name> <Frames>` (in Abschnitten, fortsetzbar).
