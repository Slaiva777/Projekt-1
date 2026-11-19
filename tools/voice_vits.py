"""Narration with Coqui 'thorsten' VITS (22 kHz) + word timings from the model's own duration alignment.
usage: python3 tools/voice_vits.py <model_dir> <video_dir> [speed]
reads <video_dir>/voice/lines.txt (one sentence group per line), writes voice/voice.wav (48 kHz) and voice/words.json."""
import json, re, sys
import numpy as np, soundfile as sf, torch
from TTS.api import TTS

mdir, vdir = sys.argv[1], sys.argv[2]
speed = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
tts = TTS(model_path=mdir + "/model_file.pth", config_path=mdir + "/config.json", progress_bar=False)
model = tts.synthesizer.tts_model; tok = model.tokenizer
sr = tts.synthesizer.output_sample_rate; hop = model.config.audio.hop_length
model.length_scale = 1.0 / speed
lines = [l.strip() for l in open(f"{vdir}/voice/lines.txt", encoding="utf-8") if l.strip()]
LEAD, PAUSE, SPAUSE = 0.3, 0.45, 0.22
out = [np.zeros(int(LEAD * sr), np.float32)]; t = LEAD; words = []
WORD = r"[\wÄÖÜäöüß]+(?:[-'][\wÄÖÜäöüß]+)*"
for li, line in enumerate(lines):
    for sent in [s for s in re.split(r"(?<=[.!?])\s+", line) if s.strip()]:
        toks = re.findall(WORD, sent)
        ids = tok.text_to_ids(sent, language=None)
        x = torch.LongTensor(ids).unsqueeze(0)
        with torch.no_grad():
            o = model.inference(x, aux_input={"x_lengths": torch.LongTensor([x.shape[1]])})
        wav = o["model_outputs"].squeeze().cpu().numpy().astype(np.float32)
        al = o["alignments"].squeeze().cpu().numpy()  # [T_spec, T_text] or [T_text, T_spec]
        if al.shape[0] != len(ids): al = al.T
        dur = al.sum(1) * hop / sr  # seconds per input token
        chars = [tok.characters.id_to_char(i) for i in ids]
        # group tokens into words: separators are spaces / punctuation (blank tokens belong to their neighbours)
        spans, cur, pos = [], None, t
        for ch, d in zip(chars, dur):
            blank = ch == tok.characters.blank
            sep = (not blank) and (ch.strip() == "" or ch in ".,!?;:—-\"'")
            if sep:
                if cur is not None: spans.append(cur); cur = None
            elif not blank:
                cur = [pos, pos + d] if cur is None else [cur[0], pos + d]
            elif cur is not None: cur[1] = pos + d
            pos += d
        if cur is not None: spans.append(cur)
        sd = len(wav) / sr
        if len(spans) != len(toks):
            print(f"line {li+1}: {len(spans)} spans vs {len(toks)} words -> proportional", file=sys.stderr)
            w = [len(x_) + 2 for x_ in toks]; s_ = sum(w); a = t + 0.06; spans = []
            for x_ in w: b = a + (sd - 0.12) * x_ / s_; spans.append([a, b]); a = b
        for tk, (a, b) in zip(toks, spans): words.append({"w": tk, "s": round(float(a), 3), "e": round(float(b), 3), "line": li + 1})
        out.append(wav); t += sd
        out.append(np.zeros(int(SPAUSE * sr), np.float32)); t += SPAUSE
    out.append(np.zeros(int((PAUSE - SPAUSE) * sr), np.float32)); t += PAUSE - SPAUSE
audio = np.concatenate(out); audio /= max(1e-6, np.abs(audio).max() / 0.9)
sf.write(f"{vdir}/voice/voice_raw.wav", audio, sr)
json.dump({"duration": round(len(audio) / sr, 3), "words": words}, open(f"{vdir}/voice/words.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("duration", round(len(audio) / sr, 2), "words", len(words))
