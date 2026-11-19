import sys; sys.path.insert(0, "tools")
from soundlib import *
V = "videos/emu"; N = int(2025 / FPS * SR)
PROG = ["C", "C", "F", "C", "G", "G7", "C", "C", "F", "F", "C", "Am", "D7", "G7", "C", "C"]
MEL = [[(0, 72, 1), (1, 76, 1), (2, 79, 1), (3, 76, 1)], [(0, 74, 2), (2, 72, 2)], [(0, 77, 1), (1, 81, 1), (2, 79, 2)], [(0, 76, 4)],
       [(0, 74, 1), (1, 76, 1), (2, 77, 1), (3, 79, 1)], [(0, 77, 2), (2, 74, 2)], [(0, 72, 1), (1, 76, 1), (2, 72, 2)], [(0, 72, 4)]]
mus = music(N, [(0, fr(176), 0.9, {"inst": "pluck"}), (fr(176), fr(888), 0.9, {"inst": "pluck"}), (fr(888), fr(1332), 1.0, {"inst": "fife"}),
                (fr(1332), fr(1472), 0.5, {"inst": "piano", "drums": False}), (fr(1472), fr(2025), 0.9, {"inst": "pluck"})], "country", PROG, MEL, bpm=128)
sfx = np.zeros(N); amb = np.zeros(N)
for f in (176, 395, 534, 674, 888, 1135, 1332, 1472, 1699, 1807): place(sfx, whoosh(0.7), fr(f) - 0.35, 0.45)
for f in (138, 304, 768, 1415, 1930): place(sfx, emu_boom(1.0), fr(f), 0.7)
place(sfx, engine(fr(534 - 457)), fr(457), 0.8); place(sfx, engine(fr(1135 - 888)), fr(888), 1.0); place(sfx, engine(fr(1472 - 1332)), fr(1332), 0.6)
for k in range(9): place(sfx, gunburst(5, 10), fr(905) + k * 0.85, 0.5)
for f in (1062, 1075, 1092): place(sfx, bassdrum(0.8, 0.4), fr(f), 0.7)
for f in (572, 612, 1769, 1930): place(sfx, chime(), fr(f), 0.5)
footsteps(sfx, 825, 888, 9, 0.4); footsteps(sfx, 1135, 1253, 10, 0.4); footsteps(sfx, 1290, 1332, 9, 0.4)
place(sfx, trombone(52, 0.45), fr(1397), 0.35); place(sfx, trombone(51, 0.45), fr(1412), 0.35); place(sfx, trombone(50, 1.2, -0.05), fr(1427), 0.35)
for f in (1500, 1600, 1660): place(sfx, cymbal(0.4), fr(f), 0.3)
for k in range(12): place(sfx, hammer(0.6), fr(1705) + k * 0.67, 0.4)
place(amb, wind(fr(2025)), 0, 0.5); place(amb, birds(fr(2025), 40), 0, 0.7)
finish(V, N, mus, sfx, amb, music_db=-15, sfx_db=-12, amb_db=-22)
