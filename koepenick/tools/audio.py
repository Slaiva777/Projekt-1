"""Original synthesized sound for the Köpenick short: a Prussian-style oom-pah march (tuba, off-beat horns, snare,
fife melody), sound effects timed to picture events (frames at 30 fps) and the mix with the voice.
Writes audio/music.wav, audio/sfx.wav, audio/mix.wav (48 kHz stereo, exact picture length).
usage: python3 tools/audio.py   (run from koepenick/)"""
import json, wave
import numpy as np
from scipy import signal

SR = 48000
FPS = 30
TOTAL_F = 1700
N = int(TOTAL_F / FPS * SR)
rng = np.random.default_rng(7)

def t_(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.005, r=0.1, hold=None):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na)
    if nr < n: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def lp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, "low", fs=SR, output="sos"), x)
def hp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, "high", fs=SR, output="sos"), x)
def bp(x, lo, hi, o=2): return signal.sosfilt(signal.butter(o, [lo, hi], "band", fs=SR, output="sos"), x)
def m2f(m): return 440.0 * 2 ** ((m - 69) / 12)
def place(buf, x, at, g=1.0):
    i = int(at * SR)
    if i >= len(buf) or i + len(x) <= 0: return
    j = min(len(buf), i + len(x)); buf[max(0, i):j] += g * x[max(0, -i):j - i]
def fr(f): return f / FPS

# ---------------- instruments ----------------
def tuba(m, d):
    t = t_(d); f = m2f(m)
    x = sum((0.9 / k ** 1.3) * np.sin(2 * np.pi * f * k * t) for k in range(1, 7))
    return lp(x, 900) * env(len(t), 0.02, 0.08) * np.exp(-t * 1.2)
def horn(ms, d):
    t = t_(d)
    x = sum(sum((0.6 / k ** 1.6) * np.sin(2 * np.pi * m2f(m) * k * t + k) for k in range(1, 6)) for m in ms) / len(ms)
    return lp(x, 2200) * env(len(t), 0.015, 0.06)
def fife(m, d):
    t = t_(d); f = m2f(m)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t * 4, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    x = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    x += 0.04 * bp(rng.standard_normal(len(t)), f * 0.8, min(f * 3, 20000)) # breath
    return x * env(len(t), 0.02, 0.06)
def glock(m, d=0.9):
    t = t_(d); f = m2f(m)
    x = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 8)
    return x * np.exp(-t * 4.5) * env(len(t), 0.001, 0.05)
def snare(g=1.0):
    t = t_(0.22)
    n = hp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 22)
    b = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    return g * (0.7 * n + 0.5 * b)
def bassdrum(g=1.0, d=0.5):
    t = t_(d); f = 55 + 70 * np.exp(-t * 30)
    return g * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
def cymbal(d=1.2):
    t = t_(d)
    return hp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 3.5) * 0.5

# ---------------- music ----------------
BPM = 116; BEAT = 60 / BPM
# B-flat major march: 16 bars of chords (root midi of the bass, chord tones for the horns)
CH = {"I": (46, [62, 65, 70]), "IV": (51, [63, 67, 70]), "V": (53, [62, 65, 69]), "V7": (53, [63, 65, 69]), "vi": (55, [62, 67, 70])}
PROG = ["I", "I", "IV", "I", "V", "V7", "I", "I", "I", "vi", "IV", "I", "V", "V7", "I", "I"]
# fife melody per bar: (beat offset, midi, beats)
MEL = [
    [(0, 70, 1), (1, 74, 1), (2, 77, 1.5), (3.5, 74, 0.5)], [(0, 72, 1), (1, 70, 1), (2, 70, 2)],
    [(0, 75, 1), (1, 77, 1), (2, 79, 1.5), (3.5, 77, 0.5)], [(0, 74, 1), (1, 72, 1), (2, 70, 2)],
    [(0, 72, 1), (1, 74, 1), (2, 77, 1), (3, 72, 1)], [(0, 75, 1.5), (1.5, 74, 0.5), (2, 72, 2)],
    [(0, 74, 0.5), (0.5, 72, 0.5), (1, 70, 1), (2, 77, 1), (3, 74, 1)], [(0, 70, 3)],
    [(0, 77, 1), (1, 74, 1), (2, 70, 1), (3, 74, 1)], [(0, 79, 1.5), (1.5, 77, 0.5), (2, 74, 2)],
    [(0, 75, 1), (1, 79, 1), (2, 82, 1.5), (3.5, 79, 0.5)], [(0, 77, 1), (1, 74, 1), (2, 70, 2)],
    [(0, 72, 1), (1, 74, 1), (2, 75, 1), (3, 77, 1)], [(0, 79, 1), (1, 77, 1), (2, 75, 1), (3, 72, 1)],
    [(0, 74, 1), (1, 77, 1), (2, 70, 2)], [(0, 70, 2)],
]

def march(start, end, gain=1.0, drums=True, fifeOn=True, soft=False):
    out = np.zeros(N)
    bar = 4 * BEAT; nb = int((end - start) / bar) + 1
    for b in range(nb):
        t0 = start + b * bar
        if t0 >= end: break
        root, tones = CH[PROG[b % 16]]
        for beat in range(4):
            tb = t0 + beat * BEAT
            if tb >= end: break
            if beat in (0, 2): place(out, tuba(root + (7 if beat == 2 else 0), BEAT * 0.9), tb, 0.55 * gain)
            else: place(out, horn(tones, BEAT * 0.45), tb, 0.32 * gain)
            if drums:
                place(out, snare(0.35 if beat % 2 else 0.22), tb, gain * (0.6 if soft else 1))
                if beat == 3 and b % 2 == 1:
                    for k in range(4): place(out, snare(0.18), tb + 0.5 * BEAT + k * BEAT / 8, gain)
                if beat == 0: place(out, bassdrum(0.45), tb, gain)
        if fifeOn:
            for off, m, ln in MEL[b % 16]:
                if t0 + off * BEAT < end: place(out, fife(m, ln * BEAT * 0.95), t0 + off * BEAT, 0.22 * gain)
    # fade out at the end
    i0, i1 = int(start * SR), min(N, int(end * SR))
    k = np.ones(N); fl = int(0.25 * SR)
    k[i1 - fl:i1] = np.linspace(1, 0, fl); k[i1:] = 0; k[:i0] = 0
    return out * k

music = np.zeros(N)
music += march(0.0, fr(172), 1.0)                          # hook: full band
music += march(fr(178), fr(650), 0.9)                      # story
music += march(fr(726), fr(966), 0.85)                     # Köpenick
music += march(fr(968), fr(1150), 0.75, fifeOn=False)      # "Niemand fragt" (drums + oom-pah, sparse)
music += march(fr(1155), fr(1335), 0.6, drums=False)       # the traffic light analogy (gentle)
music += march(fr(1338), fr(1490), 0.9)                    # caught, laughter, Kaiser
music += march(fr(1492), fr(1598), 0.55, drums=False, soft=True)
# sad trombone "wah wah wah waaah" on the shrug, then a final glockenspiel button
def trombone(m, d, bend=0.0):
    t = t_(d); f = m2f(m) * (1 + bend * t / d)
    wob = 1 + 0.03 * np.sin(2 * np.pi * 6 * t) * np.clip(t * 3, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * wob) / SR
    x = sum((0.8 / k) * np.sin(k * ph) for k in range(1, 8))
    return lp(x, 1600) * env(len(t), 0.03, 0.12)
for k, (m, d) in enumerate([(55, 0.42), (54, 0.42), (53, 0.42), (52, 1.3)]):
    place(music, trombone(m, d, -0.03 if k == 3 else 0), fr(1600) + k * 0.46, 0.5)
place(music, glock(82, 1.6), fr(1665), 0.35); place(music, glock(77, 1.6), fr(1665), 0.25); place(music, glock(70, 1.6), fr(1665), 0.25)
place(music, cymbal(1.5), fr(176), 0.25)

# ---------------- sound effects ----------------
sfx = np.zeros(N)
def whoosh(d=0.6):
    t = t_(d); n = rng.standard_normal(len(t))
    e = np.sin(np.pi * t / d) ** 2
    x = np.zeros(len(t))
    for k in range(6):  # sweeping band
        sl = slice(k * len(t) // 6, (k + 1) * len(t) // 6)
        x[sl] = bp(n, 400 + 500 * k, 900 + 900 * k)[sl]
    return x * e * 0.6
def step(g=1.0):
    t = t_(0.12)
    return g * (lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 40) + 0.4 * np.sin(2 * np.pi * 80 * t) * np.exp(-t * 50))
def shing():
    t = t_(1.0)
    x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * dd) for f, dd in [(2310, 5), (3480, 6), (4790, 7), (6120, 9)])
    x += hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 18) * 0.6
    return x * 0.35
def coins():
    out = np.zeros(int(1.2 * SR))
    for k in range(14):
        t = t_(0.25); f = rng.uniform(3000, 6500)
        c = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.48 * t)) * np.exp(-t * 25)
        place(out, c, rng.uniform(0, 0.8), 0.3)
    return out
def chime():
    out = np.zeros(int(1.5 * SR))
    for k, m in enumerate([84, 88, 91, 96]): place(out, glock(m, 1.0), k * 0.05, 0.35)
    return out
def chug(d):
    out = np.zeros(int(d * SR))
    for k in range(int(d * 5.2)):
        t = t_(0.18)
        place(out, bp(rng.standard_normal(len(t)), 150, 1400) * np.exp(-t * 18) * (1.0 if k % 2 else 0.6), k / 5.2)
    return out
def whistle(d=1.1):
    t = t_(d)
    x = sum(np.sin(2 * np.pi * f * t * (1 + 0.004 * np.sin(2 * np.pi * 5 * t))) for f in (740, 932, 1108))
    x += 0.3 * bp(rng.standard_normal(len(t)), 600, 2500)
    return x * env(len(t), 0.06, 0.25) * 0.25
def paper():
    t = t_(0.35)
    return bp(rng.standard_normal(len(t)), 2000, 8000) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * t) ** 2) * env(len(t), 0.01, 0.1) * 0.35
def stamp():
    return bassdrum(0.6, 0.25) + 0.3 * hp(rng.standard_normal(int(0.05 * SR)), 2000).tolist().__len__() * 0
def beep():
    t = t_(0.25)
    return np.sign(np.sin(2 * np.pi * 880 * t)) * 0.12 * env(len(t), 0.005, 0.05)
def laughter(d):
    """a crowd of short formant 'ha' syllables at varied pitches"""
    out = np.zeros(int(d * SR))
    for v in range(10):
        f0 = rng.uniform(110, 260); rate = rng.uniform(4.2, 6.0); t0 = rng.uniform(0, 0.4)
        k = 0
        while t0 + k / rate < d - 0.2:
            t = t_(0.13); f = f0 * (1 - 0.15 * t / 0.13)
            src = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) + 0.3 * rng.standard_normal(len(t))
            ha = bp(src, 650, 1300) + 0.6 * bp(src, 1100, 1800) + 0.05 * hp(rng.standard_normal(len(t)), 2500)
            place(out, ha * env(len(t), 0.01, 0.06), t0 + k / rate, 0.12 * (1 - 0.5 * (k * 0.02)))
            k += 1
    return out

for f in (178, 328, 658, 726, 1155, 1338, 1492, 1640): place(sfx, whoosh(0.7 if f != 1640 else 1.4), fr(f) - 0.35, 0.5)
# boots: two steps per second while columns march (heavier for the squad)
for a, b, g in [(0, 138, 1.0), (178, 262, 0.45), (438, 500, 1.0), (570, 658, 1.0), (726, 772, 0.8), (968, 1155, 0.4), (1338, 1397, 0.6)]:
    k = 0
    while fr(a) + k * 0.5 < fr(b):
        place(sfx, step(g), fr(a) + k * 0.5 + rng.uniform(0, 0.01), 0.55)
        if g >= 0.8: place(sfx, step(g * 0.6), fr(a) + k * 0.5 + 0.03, 0.4)  # the squad behind, a hair late
        k += 1
for f in (150, 542): place(sfx, shing(), fr(f), 0.8)
for f, g in ((150, 0.9), (542, 1.0), (829, 0.6), (873, 0.5), (1382, 0.9)): place(sfx, bassdrum(g, 0.6), fr(f), 0.8)
place(sfx, coins(), fr(873), 1.0)
for f in (401, 829, 919): place(sfx, chime(), fr(f), 0.6)
place(sfx, chug(fr(726 - 652)), fr(652), 0.5); place(sfx, whistle(), fr(668), 0.9)
place(sfx, paper(), fr(918), 1.0)
place(sfx, beep(), fr(1213), 1.0)
place(sfx, laughter(1.6), fr(1399), 0.45)
place(sfx, laughter(1.0), fr(1428), 0.3)
place(sfx, chime(), fr(176), 0.5)  # the white flash

# ---------------- mix ----------------
def read_wav(p):
    with wave.open(p) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
        assert w.getframerate() == SR
    return x
voice = np.zeros(N); v = read_wav("voice/voice.wav"); voice[:min(N, len(v))] = v[:N]
# duck the music under the voice: smoothed voice envelope -> up to -9 dB
ev = np.abs(voice); ev = lp(ev, 4, 1); ev = ev / (ev.max() + 1e-9)
duck = 1 - 0.65 * np.clip(ev * 6, 0, 1)
duck = lp(duck, 3, 1)
def rms_db(x): return 20 * np.log10(np.sqrt(np.mean(x[np.abs(x) > 1e-5] ** 2)) + 1e-12)
music_n = music / (np.abs(music).max() + 1e-9); sfx_n = sfx / (np.abs(sfx).max() + 1e-9)
# levels relative to the voice: music bed ~-16 dB, SFX ~-12 dB under the voice RMS
gm = 10 ** ((rms_db(voice) - 15 - rms_db(music_n)) / 20); gs = 10 ** ((rms_db(voice) - 11 - rms_db(sfx_n)) / 20)
L = voice + gm * music_n * duck + gs * sfx_n
mixL = L.copy(); mixR = L.copy()
# a little stereo width for music/sfx (Haas on the right)
d = int(0.012 * SR)
mixR[d:] = voice[d:] + (gm * music_n * duck + gs * sfx_n)[:-d]
mix = np.stack([mixL, mixR], 1)
mix /= max(1.0, np.abs(mix).max() / 0.95)
def write(p, x):
    x = np.clip(x, -1, 1); x = x if x.ndim == 2 else np.stack([x, x], 1)
    with wave.open(p, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
import os; os.makedirs("audio", exist_ok=True)
write("audio/music.wav", 0.8 * music_n); write("audio/sfx.wav", 0.8 * sfx_n); write("audio/mix_pre.wav", mix)
print("ok", N / SR, "s")
