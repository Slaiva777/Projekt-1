"""Shared synthesized sound for the shorts: instruments, a style-driven music generator, sound effects, the mix.
Each video has videos/<name>/sound.py that builds a score + sfx list with these helpers and calls finish()."""
import json, os, wave
import numpy as np
from scipy import signal

SR = 48000
FPS = 30
rng = np.random.default_rng(7)

def t_(d): return np.arange(max(1, int(d * SR))) / SR
def env(n, a=0.005, r=0.1):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:min(na, n)] = np.linspace(0, 1, min(na, n))
    if nr < n: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def lp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, "low", fs=SR, output="sos"), x)
def hp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, "high", fs=SR, output="sos"), x)
def bp(x, lo, hi, o=2): return signal.sosfilt(signal.butter(o, [lo, hi], "band", fs=SR, output="sos"), x)
def m2f(m): return 440.0 * 2 ** ((m - 69) / 12)
def fr(f): return f / FPS
def place(buf, x, at, g=1.0):
    i = int(at * SR)
    if i >= len(buf) or i + len(x) <= 0: return
    j = min(len(buf), i + len(x)); buf[max(0, i):j] += g * x[max(0, -i):j - i]

# ---------------- instruments ----------------
def tuba(m, d):
    t = t_(d); f = m2f(m)
    return lp(sum((0.9 / k ** 1.3) * np.sin(2 * np.pi * f * k * t) for k in range(1, 7)), 900) * env(len(t), 0.02, 0.08) * np.exp(-t * 1.2)
def pluckbass(m, d):
    t = t_(d); f = m2f(m)
    return lp(sum((1 / k) * np.sin(2 * np.pi * f * k * t) for k in range(1, 5)), 700) * np.exp(-t * 3.5) * env(len(t), 0.003, 0.05)
def horn(ms, d):
    t = t_(d)
    return lp(sum(sum((0.6 / k ** 1.6) * np.sin(2 * np.pi * m2f(m) * k * t + k) for k in range(1, 6)) for m in ms) / len(ms), 2200) * env(len(t), 0.015, 0.06)
from functools import lru_cache
@lru_cache(maxsize=512)
def _pluck(m, d, bright):
    f = m2f(m); n = int(d * SR); p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = (0.5 + 0.49 * bright) * buf[i % p] + (0.5 - 0.49 * bright) * buf[(i + 1) % p] * 0.996
    return out * env(n, 0.001, 0.08)
def pluck(m, d=0.6, bright=0.6):
    """Karplus-Strong string (ukulele / banjo / guitar), cached per note"""
    return _pluck(int(m), round(d, 2), round(bright, 2)).copy()
def marimba(m, d=0.7):
    t = t_(d); f = m2f(m)
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 20)) * np.exp(-t * 6) * env(len(t), 0.002, 0.05)
def piano(m, d=1.2):
    t = t_(d); f = m2f(m)
    x = sum((0.7 / k ** 1.1) * np.sin(2 * np.pi * f * k * t * (1 + 0.0004 * k * k)) * np.exp(-t * (1.5 + 0.8 * k)) for k in range(1, 8))
    return x * env(len(t), 0.002, 0.15)
def glock(m, d=0.9):
    t = t_(d); f = m2f(m)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 8)) * np.exp(-t * 4.5) * env(len(t), 0.001, 0.05)
def fife(m, d, breath=0.04):
    t = t_(d); f = m2f(m)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t * 4, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    x = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph) + breath * bp(rng.standard_normal(len(t)), f * 0.8, min(f * 3, 20000))
    return x * env(len(t), 0.03, 0.08)
def organ(ms, d):
    t = t_(d)
    x = sum(sum(a * np.sin(2 * np.pi * m2f(m) * k * t) for k, a in [(0.5, 0.5), (1, 1), (2, 0.5), (3, 0.25), (4, 0.2)]) for m in ms) / len(ms)
    return lp(x, 3000) * env(len(t), 0.12, 0.3)
def strings(ms, d, bright=1800):
    t = t_(d)
    x = sum(sum((0.7 / k) * np.sin(2 * np.pi * m2f(m) * (1 + 0.003 * np.sin(2 * np.pi * 5 * t + m)) * k * t) for k in range(1, 7)) for m in ms) / len(ms)
    return lp(x, bright) * env(len(t), 0.25, 0.35)
def snare(g=1.0):
    t = t_(0.22)
    return g * (0.7 * hp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 22) + 0.5 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30))
def shaker(g=1.0):
    t = t_(0.09); return g * bp(rng.standard_normal(len(t)), 4000, 12000) * env(len(t), 0.02, 0.05) * 0.5
def bassdrum(g=1.0, d=0.5):
    t = t_(d); f = 55 + 70 * np.exp(-t * 30)
    return g * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
def cymbal(d=1.2):
    t = t_(d); return hp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 3.5) * 0.5
def trombone(m, d, bend=0.0):
    t = t_(d); f = m2f(m) * (1 + bend * t / d)
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.03 * np.sin(2 * np.pi * 6 * t) * np.clip(t * 3, 0, 1))) / SR
    return lp(sum((0.8 / k) * np.sin(k * ph) for k in range(1, 8)), 1600) * env(len(t), 0.03, 0.12)

# ---------------- music ----------------
CH = {  # chord name -> (bass midi, chord tones), C major family
    "C": (36, [60, 64, 67]), "F": (41, [60, 65, 69]), "G": (43, [59, 62, 67]), "G7": (43, [59, 62, 65]), "Am": (45, [60, 64, 69]),
    "Dm": (38, [62, 65, 69]), "Em": (40, [59, 64, 67]), "E": (40, [59, 64, 68]), "A7": (45, [61, 64, 67]), "D7": (38, [60, 62, 66]),
}
def music(N, sections, style, prog, mel=None, bpm=110, meter=4, key=0):
    """sections: [(start_s, end_s, gain, opts)] opts: drums, lead, comp. style: island / waltz / march / soft / country / hymn"""
    out = np.zeros(N); beat = 60 / bpm
    for (s0, s1, gain, opts) in sections:
        bar = meter * beat; b = 0
        while True:
            t0 = s0 + b * bar
            if t0 >= s1: break
            root, tones = CH[prog[b % len(prog)]]
            root += key; tones = [m + key for m in tones]
            for bt in range(meter):
                tb = t0 + bt * beat
                if tb >= s1: break
                if style in ("march", "country"):
                    if bt % 2 == 0: place(out, (tuba if style == "march" else pluckbass)(root + (7 if bt == 2 else 0), beat * 0.9), tb, 0.5 * gain)
                    else: place(out, horn(tones, beat * 0.45) if style == "march" else sum(pluck(m, beat * 0.8, 0.9) for m in tones) / 3, tb, 0.3 * gain)
                    if opts.get("drums", True): place(out, snare(0.3 if bt % 2 else 0.15), tb, gain * 0.8)
                elif style == "waltz":
                    if bt == 0: place(out, pluckbass(root, beat * 1.5), tb, 0.6 * gain)
                    else: place(out, sum(pluck(m + 12, beat * 0.5, 0.7) for m in tones) / 3, tb, 0.35 * gain)
                elif style == "island":
                    if bt % 2 == 0: place(out, pluckbass(root + (7 if bt == 2 else 0), beat * 1.6), tb, 0.55 * gain)
                    for half in (0, 0.5):
                        place(out, sum(pluck(m + 12, 0.5, 0.75) for m in tones) / 3, tb + half * beat, (0.35 if half == 0 else 0.22) * gain)
                    if opts.get("drums", True): place(out, shaker(0.8 if bt % 2 else 0.5), tb, gain); place(out, shaker(0.4), tb + beat / 2, gain)
                elif style == "soft":
                    if bt == 0: place(out, piano(root + 12, bar * 0.95), tb, 0.45 * gain)
                    place(out, piano(tones[bt % 3] + 12, beat * 2), tb, 0.22 * gain)
                elif style == "hymn":
                    if bt == 0: place(out, organ([root + 12] + tones, bar * 1.02), tb, 0.45 * gain)
            if mel and opts.get("lead", True):
                inst = opts.get("inst", "fife")
                for off, m, ln in mel[b % len(mel)]:
                    if t0 + off * beat >= s1: continue
                    x = {"fife": lambda: fife(m + key, ln * beat * 0.95), "marimba": lambda: marimba(m + key, ln * beat + 0.3),
                         "glock": lambda: glock(m + key, 1.0), "piano": lambda: piano(m + key, ln * beat + 0.4),
                         "strings": lambda: strings([m + key], ln * beat * 1.05, 2600), "pluck": lambda: pluck(m + key, ln * beat + 0.3, 0.85)}[inst]()
                    place(out, x, t0 + off * beat, 0.24 * gain * opts.get("leadGain", 1.0))
            b += 1
        i0, i1 = int(s0 * SR), min(N, int(s1 * SR)); fl = int(0.3 * SR)
        if i1 - fl > i0: out[i1 - fl:i1] *= np.linspace(1, 0, fl)
    return out

# ---------------- sound effects ----------------
def whoosh(d=0.6):
    t = t_(d); n = rng.standard_normal(len(t)); e = np.sin(np.pi * t / d) ** 2; x = np.zeros(len(t))
    for k in range(6):
        sl = slice(k * len(t) // 6, (k + 1) * len(t) // 6); x[sl] = bp(n, 400 + 500 * k, 900 + 900 * k)[sl]
    return x * e * 0.6
def step(g=1.0):
    t = t_(0.12); return g * (lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 40) + 0.4 * np.sin(2 * np.pi * 80 * t) * np.exp(-t * 50))
def chime():
    out = np.zeros(int(1.5 * SR))
    for k, m in enumerate([84, 88, 91, 96]): place(out, glock(m, 1.0), k * 0.05, 0.35)
    return out
def coins():
    out = np.zeros(int(1.2 * SR))
    for k in range(14):
        t = t_(0.25); f = rng.uniform(3000, 6500)
        place(out, (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.48 * t)) * np.exp(-t * 25), rng.uniform(0, 0.8), 0.3)
    return out
def splash(d=1.2):
    t = t_(d); return bp(rng.standard_normal(len(t)), 300, 6000) * np.exp(-t * 3) * env(len(t), 0.01, 0.3) * 0.8
def waves(d):
    t = t_(d); n = lp(rng.standard_normal(len(t)), 1200); m = 0.55 + 0.45 * np.sin(2 * np.pi * t / 5.5) ** 2
    return n * m * 0.5
def rain(d):
    t = t_(d); return hp(rng.standard_normal(len(t)), 2500) * 0.25 * env(len(t), 0.5, 0.5)
def thunder(d=2.5):
    t = t_(d); return lp(rng.standard_normal(len(t)), 220) * np.exp(-t * 1.4) * (1 + 0.6 * np.sin(2 * np.pi * 3 * t)) * env(len(t), 0.02, 0.4) * 1.6
def wind(d):
    t = t_(d); x = bp(rng.standard_normal(len(t)), 300, 1400); return x * (0.5 + 0.5 * np.sin(2 * np.pi * 0.3 * t) ** 2) * env(len(t), 0.5, 0.5) * 0.5
def birds(d, n=8):
    out = np.zeros(int(d * SR))
    for k in range(n):
        t = t_(0.18); f0 = rng.uniform(2500, 4200)
        tw = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.3 * np.sin(2 * np.pi * 18 * t))) / SR) * env(len(t), 0.01, 0.05)
        place(out, tw, rng.uniform(0, max(0.1, d - 0.2)), 0.15)
    return out
def bubbles(d):
    out = np.zeros(int(d * SR))
    for k in range(int(d * 6)):
        t = t_(0.08); f = rng.uniform(400, 1200) * (1 + 3 * t)
        place(out, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 40), rng.uniform(0, d), 0.25)
    return out
def knock(g=1.0):
    t = t_(0.15); return g * (np.sin(2 * np.pi * 180 * t) * np.exp(-t * 35) + 0.3 * bp(rng.standard_normal(len(t)), 800, 3000) * np.exp(-t * 50))
def hammer(g=1.0):
    t = t_(0.3); x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in [(1850, 18), (2900, 22), (4100, 30)])
    return g * (0.4 * x + 0.5 * hp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 60))
def paper():
    t = t_(0.35); return bp(rng.standard_normal(len(t)), 2000, 8000) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * t) ** 2) * env(len(t), 0.01, 0.1) * 0.35
def laughter(d, voices=8):
    out = np.zeros(int(d * SR))
    for v in range(voices):
        f0 = rng.uniform(110, 260); rate = rng.uniform(4.2, 6.0); t0 = rng.uniform(0, 0.4); k = 0
        while t0 + k / rate < d - 0.2:
            t = t_(0.13); f = f0 * (1 - 0.15 * t / 0.13)
            src = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) + 0.3 * rng.standard_normal(len(t))
            place(out, (bp(src, 650, 1300) + 0.6 * bp(src, 1100, 1800)) * env(len(t), 0.01, 0.06), t0 + k / rate, 0.12); k += 1
    return out
def gunburst(n=6, rate=9):
    out = np.zeros(int((n / rate + 0.5) * SR))
    for k in range(n):
        t = t_(0.2); place(out, (bp(rng.standard_normal(len(t)), 200, 4000) * np.exp(-t * 25) + 0.6 * np.sin(2 * np.pi * 90 * t) * np.exp(-t * 30)), k / rate, 0.7)
    return out
def engine(d):
    t = t_(d); f = 38 + 4 * np.sin(2 * np.pi * 0.7 * t)
    return lp(signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) + 0.3 * rng.standard_normal(len(t)), 500) * 0.35 * env(len(t), 0.3, 0.3)
def emu_boom(g=1.0):
    t = t_(0.5); return g * np.sin(2 * np.pi * np.cumsum(70 + 25 * np.exp(-t * 6)) / SR) * env(len(t), 0.05, 0.2) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t))
def bell(m=55, d=4.0):
    t = t_(d); f = m2f(m)
    return sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * dd) for k, a, dd in [(1, 1, 0.8), (2.0, 0.6, 1.2), (2.4, 0.4, 1.6), (3.0, 0.3, 2), (4.2, 0.2, 3)]) * env(len(t), 0.003, 0.5)
def water_pour(d=1.5):
    t = t_(d); return bp(rng.standard_normal(len(t)), 500, 4000) * (0.6 + 0.4 * np.sin(2 * np.pi * 13 * t)) * env(len(t), 0.1, 0.3) * 0.6
def scribble(d=1.0):
    t = t_(d); return bp(rng.standard_normal(len(t)), 1500, 6000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 7 * t))) * env(len(t), 0.02, 0.1) * 0.4

def footsteps(buf, a, b, rate=2.0, g=1.0):
    k = 0
    while fr(a) + k / rate < fr(b): place(buf, step(g), fr(a) + k / rate + rng.uniform(0, 0.01), 0.55); k += 1

# ---------------- mix ----------------
def read_wav(p):
    with wave.open(p) as w:
        assert w.getframerate() == SR
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
        return x.reshape(-1, w.getnchannels()).mean(1)
def finish(vdir, N, mus, sfx, amb=None, music_db=-15, sfx_db=-11, amb_db=-20):
    voice = np.zeros(N); v = read_wav(f"{vdir}/voice/voice.wav"); voice[:min(N, len(v))] = v[:N]
    ev = lp(np.abs(voice), 4, 1); ev /= ev.max() + 1e-9
    duck = lp(1 - 0.65 * np.clip(ev * 6, 0, 1), 3, 1)
    def rms_db(x): return 20 * np.log10(np.sqrt(np.mean(x[np.abs(x) > 1e-5] ** 2)) + 1e-12)
    vr = rms_db(voice); parts = voice.copy(); bed = np.zeros(N)
    for x, db, dk in [(mus, music_db, True), (sfx, sfx_db, False), (amb, amb_db, True)]:
        if x is None or not np.any(x): continue
        xn = x / (np.abs(x).max() + 1e-9); g = 10 ** ((vr + db - rms_db(xn)) / 20)
        bed += g * xn * (duck if dk else 1)
    d = int(0.012 * SR); L = voice + bed; Rr = voice.copy(); Rr[d:] += bed[:-d]
    mix = np.stack([L, Rr], 1); mix /= max(1.0, np.abs(mix).max() / 0.95)
    os.makedirs(f"{vdir}/audio", exist_ok=True)
    with wave.open(f"{vdir}/audio/mix_pre.wav", "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
    os.system(f"ffmpeg -v error -y -i {vdir}/audio/mix_pre.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 {vdir}/audio/mix.wav")
    print("mixed", N / SR, "s")
