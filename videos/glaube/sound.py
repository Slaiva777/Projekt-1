import sys; sys.path.insert(0, "tools")
from soundlib import *
V = "videos/glaube"; N = int(2220 / FPS * SR)
PROG = ["C", "Am", "F", "G", "Am", "Em", "F", "C", "F", "G", "Em", "Am", "F", "G", "C", "C"]
MEL = [[(0, 72, 2), (2, 76, 2)], [(0, 76, 2), (2, 72, 2)], [(0, 77, 2), (2, 76, 1), (3, 74, 1)], [(0, 74, 4)], [(0, 72, 2), (2, 71, 2)], [(0, 71, 2), (2, 67, 2)], [(0, 69, 2), (2, 72, 2)], [(0, 72, 4)],
       [(0, 77, 2), (2, 76, 2)], [(0, 74, 2), (2, 79, 2)], [(0, 79, 2), (2, 76, 2)], [(0, 76, 4)], [(0, 81, 2), (2, 79, 2)], [(0, 77, 2), (2, 74, 2)], [(0, 76, 2), (2, 74, 2)], [(0, 72, 4)]]
mus = music(N, [(0, fr(645), 0.85, {"inst": "strings"}), (fr(645), fr(1218), 0.6, {"inst": "glock"}), (fr(1218), fr(1547), 0.55, {"inst": "piano"}),
                (fr(1547), fr(2220), 1.0, {"inst": "strings", "leadGain": 1.2})], "hymn", PROG, MEL, bpm=72)
sfx = np.zeros(N); amb = np.zeros(N)
for f in (232, 416, 645, 825, 970, 1034, 1218, 1431, 1547, 1748, 2023): place(sfx, whoosh(0.8), fr(f) - 0.4, 0.4)
for k in range(24): place(sfx, hammer(0.7), fr(416) + 0.2 + k * 0.33 + (k % 3) * 0.05, 0.5)
for k in range(16): place(sfx, hammer(0.5), fr(1645) + 0.2 + k * 0.3, 0.4)
place(sfx, coins(), fr(684), 0.3); place(sfx, trombone(50, 0.5), fr(696), 0.3); place(sfx, trombone(47, 1.0, -0.04), fr(712), 0.3)
for f in (1340, 1517, 1805): place(sfx, chime(), fr(f), 0.6)
place(sfx, paper(), fr(1322), 0.8); place(sfx, paper(), fr(1505), 0.8)
for k in range(6): place(sfx, bell(43 + (k % 3) * 5, 5.0), fr(1748) + k * 1.4, 0.5)
place(sfx, bell(43, 6.0), fr(2023), 0.5); place(sfx, bell(48, 6.0), fr(2150), 0.4)
place(sfx, laughter(3.0, 14), fr(1835), 0.6)
place(amb, birds(fr(1218), 30), 0, 0.8); place(amb, wind(fr(400)), fr(825), 0.6); place(amb, birds(fr(670), 20), fr(1547), 0.8)
finish(V, N, mus, sfx, amb, music_db=-15, sfx_db=-12, amb_db=-21)
