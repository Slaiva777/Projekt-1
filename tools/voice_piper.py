"""Narration with Piper voices (CC0 / free licences) + word timings from forced alignment with a German wav2vec2 CTC model.
usage: python3 tools/voice_piper.py <script.json> <out_dir> <piper_dir> <w2v_dir>
script.json: [{"id": "n1", "voice": "de_DE-thorsten-high", "speaker": null, "speed": 1.06, "text": "Satz eins. Satz zwei. | Nach langer Pause."}, ...]
Sentences are synthesised one by one (natural sentence melody), joined with pauses: 0.42 s after a full stop,
0.85 s for a "|" marker. Writes <out_dir>/<id>.wav (48 kHz mono) and <out_dir>/<id>.json ({"words": [{w, s, e}]})."""
import json, re, sys, wave, io
import numpy as np, soundfile as sf, torch, torchaudio.functional as AF
from scipy.signal import resample_poly
from piper import PiperVoice, SynthesisConfig
from transformers import Wav2Vec2ForCTC

script, out, pdir, wdir = sys.argv[1:5]
clips = json.load(open(script, encoding="utf-8"))
voices = {}
w2v = Wav2Vec2ForCTC.from_pretrained(wdir).eval()
vocab = json.load(open(f"{wdir}/vocab.json"))
WORD = r"[\wÄÖÜäöüß]+(?:[-'][\wÄÖÜäöüß]+)*"
SR = 22050

def synth(v, text, cfg):
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w: v.synthesize_wav(text, w, syn_config=cfg)
    buf.seek(0); a, sr = sf.read(buf, dtype="float32"); return a, sr

def trim(a, thr=0.012):
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0: return a
    return a[max(0, idx[0] - 600): idx[-1] + 1800]

def norm(w): return w.lower().replace("ß", "ss")

for c in clips:
    if c["voice"] not in voices: voices[c["voice"]] = PiperVoice.load(f"{pdir}/{c['voice']}.onnx")
    v = voices[c["voice"]]
    cfg = SynthesisConfig(speaker_id=c.get("speaker"), length_scale=c.get("speed", 1.0), noise_scale=c.get("noise", 0.62), noise_w_scale=c.get("noise_w", 0.85))
    parts = []
    for block_i, block in enumerate(c["text"].split("|")):
        sents = [s.strip() for s in re.split(r"(?<=[.!?…])\s+", block.strip()) if s.strip()]
        for si, s in enumerate(sents):
            a, sr = synth(v, s, cfg); a = trim(a)
            if sr != SR: a = resample_poly(a, SR, sr).astype(np.float32)
            parts.append(a)
            parts.append(np.zeros(int(SR * (0.42 if si < len(sents) - 1 else 0.05)), np.float32))
        if block_i < len(c["text"].split("|")) - 1: parts.append(np.zeros(int(SR * 0.7), np.float32))
    lead = np.zeros(int(SR * 0.05), np.float32)
    audio = np.concatenate([lead] + parts)
    audio = audio / max(1e-6, np.abs(audio).max()) * 0.9
    # forced alignment
    words = re.findall(WORD, c["text"])
    a16 = resample_poly(audio, 16000, SR).astype(np.float32)
    x = torch.from_numpy((a16 - a16.mean()) / (a16.std() + 1e-7)).unsqueeze(0)
    with torch.no_grad(): em = torch.log_softmax(w2v(x).logits, -1)
    toks, owner = [], []
    for wi, w in enumerate(words):
        for ch in norm(w):
            if ch in vocab: toks.append(vocab[ch]); owner.append(wi)
    ali, _ = AF.forced_align(em, torch.tensor([toks], dtype=torch.int32), blank=0)
    ali = ali[0].tolist()
    fdur = len(a16) / 16000 / em.shape[1]
    spans = [[None, None] for _ in words]
    ti, prev = 0, 0
    for fi, lab in enumerate(ali):
        if lab != 0 and (lab != prev or (fi > 0 and ali[fi - 1] == 0)):
            if ti < len(toks):
                wi = owner[ti]
                if spans[wi][0] is None: spans[wi][0] = fi * fdur
                spans[wi][1] = (fi + 1) * fdur; ti += 1
        elif lab != 0 and ti > 0:
            spans[owner[ti - 1]][1] = (fi + 1) * fdur
        prev = lab
    res = []
    for w, (s, e) in zip(words, spans):
        if s is None: s = res[-1]["e"] if res else 0.0; e = s + 0.2
        res.append({"w": w, "s": round(s, 3), "e": round(max(e, s + 0.08), 3)})
    sf.write(f"{out}/{c['id']}.wav", resample_poly(audio, 48000, SR).astype(np.float32), 48000)
    json.dump({"words": res}, open(f"{out}/{c['id']}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(c["id"], round(len(audio) / SR, 2), "s", len(res), "words")
