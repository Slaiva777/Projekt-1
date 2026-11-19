import sys; sys.path.insert(0, "tools")
from soundlib import *
V = "videos/gesundheit"; N = int(2360 / FPS * SR)
PROG = ["C", "G7", "G7", "C", "C", "F", "G7", "C", "Am", "Dm", "G7", "C", "F", "C", "G7", "C"]
MEL = [[(0, 76, 2), (2, 79, 1)], [(0, 79, 2), (2, 77, 1)], [(0, 74, 2), (2, 77, 1)], [(0, 76, 3)], [(0, 72, 1), (1, 76, 1), (2, 79, 1)], [(0, 81, 2), (2, 77, 1)],
       [(0, 79, 2), (2, 74, 1)], [(0, 72, 3)], [(0, 76, 2), (2, 72, 1)], [(0, 77, 2), (2, 74, 1)], [(0, 79, 1), (1, 77, 1), (2, 74, 1)], [(0, 76, 3)],
       [(0, 81, 2), (2, 77, 1)], [(0, 79, 2), (2, 76, 1)], [(0, 74, 1), (1, 76, 1), (2, 74, 1)], [(0, 72, 3)]]
mus = music(N, [(0, fr(240), 0.9, {"inst": "strings"}), (fr(240), fr(865), 0.85, {"inst": "fife"}), (fr(865), fr(1140), 0.55, {"inst": "piano", "leadGain": 0.7}),
                (fr(1140), fr(1675), 0.9, {"inst": "strings"}), (fr(1675), fr(1885), 0.7, {"inst": "fife"}), (fr(1885), fr(2075), 0.5, {"inst": "piano"}),
                (fr(2075), fr(2360), 0.9, {"inst": "glock"})], "waltz", PROG, MEL, bpm=150, meter=3)
sfx = np.zeros(N); amb = np.zeros(N)
for f in (240, 445, 675, 865, 1140, 1515, 1885, 2075): place(sfx, whoosh(0.7), fr(f) - 0.35, 0.45)
place(sfx, water_pour(2.0), fr(10), 0.6); place(sfx, laughter(2.0), fr(186), 0.7)
place(sfx, chime(), fr(238), 0.5); place(sfx, chime(), fr(759), 0.4); place(sfx, chime(), fr(1170), 0.6); place(sfx, chime(), fr(2297), 0.6)
place(sfx, knock(0.8), fr(1015), 0.6); place(sfx, water_pour(2.0), fr(1440), 0.7); place(sfx, water_pour(2.5), fr(2085), 0.7)
for k in range(20): place(sfx, knock(0.3), fr(2210) + k * 0.075 * 2.2, 0.3)
place(sfx, bassdrum(0.8, 0.5), fr(1845), 0.8); place(sfx, trombone(52, 0.5), fr(1551), 0.3); place(sfx, trombone(48, 0.9, -0.05), fr(1580), 0.3)
footsteps(sfx, 1189, 1273, 2.4, 0.6); footsteps(sfx, 1885, 1961, 1.6, 0.5)
place(amb, birds(fr(205), 8), fr(240), 1.0); place(amb, birds(fr(190), 10), fr(675), 0.8); place(amb, wind(fr(190)), fr(1885), 0.5)
finish(V, N, mus, sfx, amb, music_db=-15, sfx_db=-12, amb_db=-21)
