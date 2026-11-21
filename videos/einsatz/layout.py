# Lays the narration (n*) and German police radio (r*) clips onto the timeline shot by shot, trims silences,
# writes voice/timeline.json (shot boundaries in frames + every spoken word with absolute times) and
# voice/voice.wav (48 kHz stereo: narration centred, radio band-limited with squelch clicks).
import json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly
V = "videos/einsatz/voice"; SR = 48000; FPS = 30
SHOTS = [
    ("heli", [("n1", 0.6)]), ("walk", [("n2", 0.45)]), ("look", [("r1", 0.3)]), ("ghost", [("n3", 0.35)]),
    ("tommy", [("n4", 0.35)]), ("wait", [("r2", 0.3), ("n5", 0.35)]), ("dialog", [("n6", 0.4)]),
    ("move", [("r3", 0.25), ("n7", 0.3)]), ("thermal", [("n8", 0.35), ("r4", 0.4)]), ("final", [("n9", 0.5), ("n10", 0.9)]),
]
TAIL = {"final": 2.6}
clips = {}
for k in {c for _, cs in SHOTS for c, _ in cs}:
    a, sr = sf.read(f"{V}/{k}.wav"); a = resample_poly(a, SR, sr) if sr != SR else a
    clips[k] = (a.astype(np.float32), json.load(open(f"{V}/{k}.json"))["words"])
t = 0.0; shots = []; words = []; events = []
for name, cs in SHOTS:
    a = t
    for k, gap in cs:
        w = clips[k][1]; s0 = w[0]["s"]; at = t + gap - s0          # clip placed so its first word starts at t+gap
        events.append({"clip": k, "at": round(at, 3)})
        for x in w: words.append({"w": x["w"], "s": round(at + x["s"], 3), "e": round(at + x["e"], 3), "radio": k[0] == "r"})
        t = at + w[-1]["e"]
    t += TAIL.get(name, 0.45)
    shots.append({"name": name, "a": a, "b": t})
# split "wait" at the word "Stattdessen" into wait + arrive
wi = [i for i, s in enumerate(shots) if s["name"] == "wait"][0]
cut = [x["s"] for x in words if x["w"] == "Stattdessen"][0] - 0.15
shots.insert(wi + 1, {"name": "arrive", "a": cut, "b": shots[wi]["b"]}); shots[wi]["b"] = cut
total = int(round(t * FPS))
fr = [{"name": s["name"], "a": int(round(s["a"] * FPS)), "b": int(round(s["b"] * FPS))} for s in shots]
for i in range(1, len(fr)): fr[i]["a"] = fr[i - 1]["b"]
fr[0]["a"] = 0; fr[-1]["b"] = total
json.dump({"total": total, "shots": fr, "words": words, "events": events}, open(f"{V}/timeline.json", "w"), ensure_ascii=False, indent=1)
# voice track
N = int(t * SR) + SR; L = np.zeros(N, np.float32); R = np.zeros(N, np.float32)
band = butter(4, [380, 3200], btype="band", fs=SR, output="sos")
rng = np.random.default_rng(3)
for e in events:
    a, _ = clips[e["clip"]]; i = int(e["at"] * SR)
    if i < 0: a = a[-i:]; i = 0
    if e["clip"][0] == "r":
        x = sosfilt(band, a) * 2.2; x = np.tanh(x * 2.5) * 0.42 + rng.standard_normal(len(x)).astype(np.float32) * 0.012
        clk = sosfilt(band, rng.standard_normal(int(0.06 * SR))) * 0.5
        i0 = max(0, i - len(clk)); L[i0:i0 + len(clk)] += clk; R[i0:i0 + len(clk)] += clk
        L[i:i + len(x)] += x * 0.9; R[i:i + len(x)] += x * 0.75
        j = i + len(x); L[j:j + len(clk)] += clk; R[j:j + len(clk)] += clk
    else:
        L[i:i + len(a)] += a * 0.9; R[i:i + len(a)] += a * 0.9
sf.write(f"{V}/voice.wav", np.stack([L, R], 1)[: int(t * SR)], SR)
print("total", round(t, 2), "s,", total, "frames"); [print(s) for s in fr]
