import sys; sys.path.insert(0, "tools")
from soundlib import *
V = "videos/gedaechtnis"; N = int(2310 / FPS * SR)
PROG = ["C", "Am", "Dm", "G7", "C", "Em", "F", "G"]
MEL = [[(0, 76, 2), (2, 74, 1), (3, 72, 1)], [(0, 72, 3), (3, 69, 1)], [(0, 74, 2), (2, 77, 2)], [(0, 76, 3), (3, 74, 1)],
       [(0, 79, 2), (2, 76, 2)], [(0, 76, 2), (2, 71, 2)], [(0, 72, 2), (2, 77, 1), (3, 76, 1)], [(0, 74, 4)]]
mus = music(N, [(0, fr(158), 0.7, {"inst": "glock"}), (fr(158), fr(552), 0.75, {"inst": "piano", "leadGain": 0.8}), (fr(552), fr(1366), 0.8, {"inst": "glock"}),
                (fr(1366), fr(1882), 0.75, {"inst": "piano", "leadGain": 0.8}), (fr(1882), fr(2310), 0.85, {"inst": "pluck"})], "soft", PROG, MEL, bpm=84)
sfx = np.zeros(N); amb = np.zeros(N)
for f in (158, 231, 382, 477, 552, 760, 1882, 2075): place(sfx, whoosh(0.7), fr(f) - 0.35, 0.45)
for f in (119, 499, 1336, 1767, 1824): place(sfx, chime(), fr(f), 0.5)
for k in range(30): place(sfx, paper(), fr(80) + k * 7 / FPS, 0.25)
for f in (865, 899, 929): place(sfx, paper(), fr(f), 0.6); place(sfx, chime(), fr(f), 0.25)
place(sfx, bassdrum(0.6, 0.8), fr(287), 0.7)
for f in (679, 709, 739): place(sfx, knock(0.8), fr(f), 0.5)
for f0, d in ((1131, 1.7), (1213, 1.7), (1281, 1.7)): place(sfx, scribble(d), fr(f0) + 0.1, 0.7)
for f in (760 + k * 15 for k in range(7)): place(sfx, step(0.6), fr(f), 0.5)
place(amb, birds(fr(73), 6), fr(158), 1.0); place(amb, birds(fr(428), 16), fr(1882), 1.0); place(amb, wind(fr(428)), fr(1882), 0.4)
finish(V, N, mus, sfx, amb, music_db=-15, sfx_db=-12, amb_db=-21)
