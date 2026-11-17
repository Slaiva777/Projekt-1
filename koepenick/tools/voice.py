"""Synthesise voice/lines.txt with Piper (German 'thorsten') -> voice/voice.wav (48 kHz) + voice/words.json.
Word times come from Piper's phoneme alignments (word boundaries = ' ' phonemes). Lines are joined with fixed pauses.
usage: python3 tools/voice.py <model.onnx> [length_scale]"""
import json, re, sys, wave
import numpy as np
from piper import PiperVoice, SynthesisConfig

model = sys.argv[1]; ls = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
voice = PiperVoice.load(model, include_alignments=True)
cfg = SynthesisConfig(length_scale=ls, noise_scale=0.5, noise_w_scale=0.6)
lines = [l.strip() for l in open("voice/lines.txt", encoding="utf-8") if l.strip()]
PAUSE = 0.42      # between lines (s)
LEAD = 0.25       # silence at the start
sr = voice.config.sample_rate
out = [np.zeros(int(LEAD * sr), np.float32)]
t = LEAD; words = []
for li, line in enumerate(lines):
    toks = re.findall(r"[\wÄÖÜäöüß]+(?:[-'][\wÄÖÜäöüß]+)*", line)
    chunks = list(voice.synthesize(line, cfg, include_alignments=True))
    al = []  # (phoneme, seconds) over the whole line
    for c in chunks:
        if c.phoneme_alignments: al += [(a.phoneme, a.num_samples / sr) for a in c.phoneme_alignments]
        else:  # alignment missing (unknown phoneme): spread the chunk evenly over its phonemes, stress marks weightless
            ph = c.phonemes; wts = [0.0 if x in ("ˈ", "ˌ", "̧", "ː") else 1.0 for x in ph]; tot = sum(wts) or 1
            cd = len(c.audio_float_array) / sr
            al += [("^", 0.06)] + [(x, (cd - 0.12) * w_ / tot) for x, w_ in zip(ph, wts)] + [("$", 0.06)]
        out.append(c.audio_float_array.astype(np.float32))
    # group phonemes into words: split on spaces and punctuation phonemes
    cur = None; spans = []; pos = t
    for ph, d in al:
        is_word = bool(re.match(r"[^\s.,!?;:^_$]", ph)) and ph not in ("^", "$", "_")
        if is_word:
            if cur is None: cur = [pos, pos + d]
            else: cur[1] = pos + d
        elif cur is not None and ph.strip() in ("", ".", ",", "!", "?", ";", ":"):
            spans.append(cur); cur = None
        pos += d
    if cur is not None: spans.append(cur)
    dur = sum(len(c.audio_float_array) for c in chunks) / sr
    if len(spans) != len(toks):
        print(f"line {li+1}: {len(spans)} spans vs {len(toks)} words -> proportional fallback", file=sys.stderr)
        w = [len(x) + 2 for x in toks]; s = sum(w); a = t + 0.05
        spans = []
        for x in w: b = a + (dur - 0.15) * x / s; spans.append([a, b]); a = b
    for tok, (a, b) in zip(toks, spans): words.append({"w": tok, "s": round(a, 3), "e": round(b, 3), "line": li + 1})
    t += dur
    out.append(np.zeros(int(PAUSE * sr), np.float32)); t += PAUSE
audio = np.concatenate(out)
pcm = (np.clip(audio, -1, 1) * 32767).astype(np.int16)
with wave.open("voice/voice_raw.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())
json.dump({"duration": round(len(audio) / sr, 3), "words": words}, open("voice/words.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("duration", round(len(audio) / sr, 2), "s, words", len(words))
