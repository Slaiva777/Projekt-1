# Sound design for "Nachteinsatz – Teil 1" driven by voice/timeline.json: night city bed, helicopter rotor,
# German two-tone siren (from the moment the blue lights go on), vans braking, sliding door, boots, footsteps,
# tension drone with a hit on Tommy's turn, whooshes on whip pans, thermal-camera static + lock beeps, end sting.
# Effects are ducked under the voice track (voice/voice.wav) and the result is written to audio/mix_pre.wav.
import json, sys, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
SR = 48000
TL = json.load(open("videos/einsatz/voice/timeline.json"))
T = TL["total"] / 30; N = int(T * SR); t = np.arange(N) / SR
sh = {s["name"]: (s["a"] / 30, s["b"] / 30) for s in TL["shots"]}
W = TL["words"]; wat = lambda w: next(x["s"] for x in W if x["w"] == w)
T_LIGHTS, T_DOOR, T_TURN = wat("Blaulichter"), wat("Schiebetür") + 0.2, wat("fährt")
rng = np.random.default_rng(7)
noise = lambda n: rng.standard_normal(n)
filt = lambda x, lo, hi: sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)
lowp = lambda x, fc: sosfilt(butter(2, fc, btype="low", fs=SR, output="sos"), x)
def place(dst, src, at, g=1.0):
    i = int(at * SR); 
    if i < 0: src = src[-i:]; i = 0
    j = min(N, i + len(src)); dst[i:j] += g * src[: j - i]
L = np.zeros(N); R = np.zeros(N)
def both(x, g=1.0, pan=0.0): global L, R; L += x * g * (1 - max(0, pan)); R += x * g * (1 + min(0, pan))
both(lowp(noise(N), 500) * 0.05 + lowp(noise(N), 110) * 0.08)                     # night bed
# rotor (closer in heli / look / thermal shots)
puls = (0.5 + 0.5 * np.cos(2 * np.pi * 21.0 * t)) ** 6
near = np.full(N, 0.45)
for name, g in [("heli", 1.0), ("look", 1.0), ("thermal", 1.1), ("final", 0.8)]:
    a, b = sh[name]; near = np.maximum(near, g * np.clip((t - a + 0.3) / 0.3, 0, 1) * np.clip((b - t + 0.3) / 0.3, 0, 1))
both(filt(noise(N), 50, 420) * (0.25 + 0.9 * puls) * near * 0.8)
a, b = sh["thermal"]; both(np.sin(2 * np.pi * 2480 * t) * 0.012 * ((t > a) & (t < b)))
# German two-tone siren from the blue lights on (A4/D5), distant, low-passed
f = np.where((t % 1.4) < 0.7, 440.0, 587.0); ph = 2 * np.pi * np.cumsum(f) / SR
sir = lowp(np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph), 1800) * np.clip((t - T_LIGHTS + 0.3) / 1.5, 0, 1) * 0.07
d = int(0.09 * SR); L += sir; R[d:] += sir[:-d] * 0.8
# footsteps while the two walk in
for k in range(40):
    at = 2.2 + k * 0.29
    if at > sh["walk"][1] - 0.6: break
    n = int(0.08 * SR); st = lowp(noise(n), 700) * np.exp(-np.linspace(0, 9, n)) * 0.45
    place(L, st, at, 0.9 if k % 2 else 0.6); place(R, st, at, 0.6 if k % 2 else 0.9)
# vans roll in: engine swell + tyre hiss + brake squeal
a0 = sh["arrive"][0] - 0.8; n = int(4.2 * SR); e = np.linspace(0, 1, n)
eng = (filt(noise(n), 60, 300) * 0.5 + np.sin(2 * np.pi * (48 + 20 * e) * np.arange(n) / SR) * 0.25) * np.sin(np.pi * np.clip(e * 1.2, 0, 1)) * 0.8
place(L, eng, a0); place(R, eng, a0 + 0.05, 0.9)
n = int(0.6 * SR); sq = np.sin(2 * np.pi * 2900 * np.arange(n) / SR) * np.hanning(n) * 0.05; place(L, sq, a0 + 2.6); place(R, sq, a0 + 2.8)
# whooshes on the whip pans
for s in TL["shots"][1:]:
    if s["name"] in ("thermal", "final"): continue
    n = int(0.4 * SR); w = filt(noise(n), 300, 3500) * np.sin(np.linspace(0, np.pi, n)) ** 2 * 0.4
    place(L, w, s["a"] / 30 - 0.2); place(R, w[::-1], s["a"] / 30 - 0.2)
# sliding door + boots
n = int(0.5 * SR); sl = filt(noise(n), 200, 1500) * np.linspace(1, 0.2, n) * 0.35
cl = lowp(noise(int(0.12 * SR)), 300) * np.exp(-np.linspace(0, 8, int(0.12 * SR))) * 1.4
place(L, sl, T_DOOR - 0.1); place(R, sl, T_DOOR - 0.1, 0.7); place(L, cl, T_DOOR + 0.4); place(R, cl, T_DOOR + 0.4)
for k in range(4):
    for s_ in range(7):
        at = T_DOOR + 0.5 + k * 0.38 + s_ * 0.31
        if at > sh["move"][1] - 0.2: break
        n = int(0.09 * SR); st = lowp(noise(n), 500) * np.exp(-np.linspace(0, 9, n)) * 0.6
        place(L, st, at, 0.8 if k % 2 else 0.55); place(R, st, at, 0.55 if k % 2 else 0.8)
# tension drone, hits on lights-on and on the turn
dr = np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 82.4 * t) + 0.3 * np.sin(2 * np.pi * 110.3 * t)
dr *= np.interp(t, [0, 4, sh["wait"][0], T_LIGHTS, T_TURN, T_TURN + 0.1, T - 3, T], [0, 0.03, 0.05, 0.09, 0.11, 0.05, 0.08, 0.0])
both(dr)
def hit(at, g):
    n = int(1.6 * SR); h = (np.sin(2 * np.pi * 42 * np.arange(n) / SR) * 1.2 + lowp(noise(n), 200) * 0.8) * np.exp(-np.linspace(0, 5, n))
    place(L, h, at, g); place(R, h, at, g)
hit(T_LIGHTS, 0.8); hit(T_TURN, 1.0); hit(T - 2.6, 1.1)
# thermal: static on the cut, lock beeps
a, b = sh["thermal"]
n = int(0.25 * SR); stc = filt(noise(n), 800, 7000) * np.linspace(1, 0, n) * 0.4; place(L, stc, a); place(R, stc, a)
for at in [a + 0.6, a + 0.75]:
    n = int(0.08 * SR); bp_ = np.sin(2 * np.pi * 1760 * np.arange(n) / SR) * 0.18 * np.hanning(n); place(L, bp_, at); place(R, bp_, at)
# end sting: low strings-like chord swell
n = int(2.6 * SR); e = np.arange(n) / SR
ch = sum(np.sin(2 * np.pi * fr * e) for fr in (55, 82.4, 110, 130.8)) * np.sin(np.pi * np.clip(e / 2.6, 0, 1)) ** 1.5 * 0.08
place(L, ch, T - 2.6); place(R, ch, T - 2.6)
# duck effects under the voice, add voice, master
v, vsr = sf.read("videos/einsatz/voice/voice.wav"); v = v[:N]; v = np.pad(v, ((0, N - len(v)), (0, 0)))
env = lowp(np.abs(v).mean(1), 6); duck = 1 - 0.55 * np.clip(env / 0.05, 0, 1)
fade = np.clip(t / 0.3, 0, 1) * np.clip((T - t) / 0.6, 0, 1)
L = (L * duck + v[:, 0] * 1.4) * fade; R = (R * duck + v[:, 1] * 1.4) * fade
out = np.tanh(np.stack([L, R], 1) * 1.05); out /= max(1e-6, np.abs(out).max()) / 0.9
sf.write(sys.argv[1], out.astype(np.float32), SR)
print("mix", round(T, 2), "s")
