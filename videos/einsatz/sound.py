# Sound design for "Nachteinsatz" (25 s, no narration): night city bed, helicopter rotor, distant two-tone siren,
# radio chatter, sliding door, boots, tension drone with a hit on the turn, whooshes on whip pans, HUD beeps.
import numpy as np, wave, sys
SR = 48000; T = 25.0; N = int(SR * T); t = np.arange(N) / SR
rng = np.random.default_rng(7)
def noise(n): return rng.standard_normal(n)
def lp(x, fc):  # one-pole low-pass
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y
def bp(x, lo, hi): return lp(x, hi) - lp(x, lo)
def env(a, b, fa=0.3, fb=0.3):
    e = np.zeros(N); e += np.clip((t - a) / fa, 0, 1) * np.clip((b - t) / fb, 0, 1); return np.clip(e, 0, 1)
def place(dst, src, at, g=1.0):
    i = int(at * SR); j = min(N, i + len(src)); dst[i:j] += g * src[: j - i]
L = np.zeros(N); R = np.zeros(N)
# night bed
bed = lp(noise(N), 600) * 0.05 + lp(noise(N), 120) * 0.08
L += bed; R += bed * 0.95
# rotor: band noise amplitude-modulated at blade-pass frequency, distance gain over time
bpf = 21.0
puls = (0.5 + 0.5 * np.cos(2 * np.pi * bpf * t)) ** 6
body = bp(noise(N), 50, 420)
near = np.interp(t, [0, 7, 14, 15, 19, 20, 25], [1.0, 0.7, 0.6, 0.6, 0.12, 1.0, 1.0])
rot = body * (0.25 + 0.9 * puls) * near * 0.9
whine = np.sin(2 * np.pi * 2480 * t + 0.3 * np.sin(2 * np.pi * 0.5 * t)) * 0.012 * np.interp(t, [0, 19.9, 20, 25], [0.3, 0.3, 1, 1])
L += rot + whine; R += rot * 0.9 + whine
# distant German two-tone siren (A4 / D5), low-passed, slow fade-in, louder in shot 3
f = np.where((t % 1.4) < 0.7, 440.0, 587.0)
ph = 2 * np.pi * np.cumsum(f) / SR
sir = (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph))
sir = lp(sir, 1800) * np.interp(t, [0, 2, 12, 15, 19.9, 20, 25], [0, 0.03, 0.05, 0.09, 0.08, 0.02, 0.02])
dl = int(0.09 * SR); L += sir; R[dl:] += sir[:-dl] * 0.8
# radio chatter bursts with squelch clicks
def radio(dur):
    n = int(dur * SR); x = bp(noise(n), 350, 2800)
    syl = (0.5 + 0.5 * np.sin(2 * np.pi * 5.5 * np.arange(n) / SR + rng.random() * 6)) ** 2
    x = x * syl * 0.35; x = np.tanh(x * 3) * 0.25
    clk = bp(noise(int(0.05 * SR)), 1000, 6000) * 0.4
    return np.concatenate([clk, x, clk])
for at, d, g in [(3.0, 1.4, 0.9), (9.6, 1.1, 0.6), (13.4, 0.9, 1.0), (20.3, 1.6, 1.3), (22.9, 1.0, 1.1)]:
    r = radio(d); place(L, r, at, g); place(R, r, at, g * 0.85)
# whooshes on the two whip pans
for at in [6.85, 13.85]:
    n = int(0.45 * SR); w = bp(noise(n), 300, 3500) * np.sin(np.linspace(0, np.pi, n)) ** 2 * 0.5
    place(L, w, at, 0.9); place(R, w[::-1], at, 0.9)
# sliding door (whoosh + clunk) at 14.0
n = int(0.5 * SR); sl = bp(noise(n), 200, 1500) * np.linspace(1, 0.2, n) * 0.35
cl = lp(noise(int(0.12 * SR)), 300) * np.exp(-np.linspace(0, 8, int(0.12 * SR))) * 1.4
place(L, sl, 14.0); place(R, sl, 14.0, 0.7); place(L, cl, 14.45); place(R, cl, 14.45)
# boots of the unit
for k in range(4):
    for s in range(7):
        at = 14.5 + k * 0.38 + s * 0.31
        if at > 19.8: break
        n = int(0.09 * SR); st = lp(noise(n), 500) * np.exp(-np.linspace(0, 9, n)) * (0.55 + 0.2 * rng.random())
        place(L, st, at, 0.8 if k % 2 else 0.55); place(R, st, at, 0.55 if k % 2 else 0.8)
# tension drone + hit on Tommy's turn
dr = (np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 82.4 * t + 0.4 * np.sin(2 * np.pi * 0.2 * t)) + 0.3 * np.sin(2 * np.pi * 110.3 * t)) 
dr *= np.interp(t, [0, 3, 7, 14.3, 14.4, 20, 25], [0.0, 0.04, 0.07, 0.11, 0.05, 0.06, 0.08])
L += dr; R += dr
n = int(1.6 * SR); hit = (np.sin(2 * np.pi * 42 * np.arange(n) / SR) * 1.2 + lp(noise(n), 200) * 0.8) * np.exp(-np.linspace(0, 5, n))
place(L, hit, 14.4); place(R, hit, 14.4)
# HUD: static burst on the cut, lock beeps
n = int(0.25 * SR); stc = bp(noise(n), 800, 7000) * np.linspace(1, 0, n) * 0.4; place(L, stc, 20.0); place(R, stc, 20.0)
for at in [20.6, 20.75]:
    n = int(0.08 * SR); bpp = np.sin(2 * np.pi * 1760 * np.arange(n) / SR) * 0.18 * np.hanning(n); place(L, bpp, at); place(R, bpp, at)
# master: gentle fades, soft clip
fade = np.clip(t / 0.3, 0, 1) * np.clip((T - t) / 0.8, 0, 1)
L = np.tanh(L * fade * 1.1); R = np.tanh(R * fade * 1.1)
out = np.stack([L, R], 1); out /= max(1e-6, np.abs(out).max()) / 0.9
w = wave.open(sys.argv[1], "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes()); w.close()
