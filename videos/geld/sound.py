import sys; sys.path.insert(0, "tools")
from soundlib import *
V = "videos/geld"; N = int(2140 / FPS * SR)
PROG = ["C", "Am", "F", "G", "C", "Em", "F", "G7"]
MEL = [[(0, 72, 1), (1, 76, 1), (2, 79, 2)], [(0, 81, 1.5), (1.5, 79, 0.5), (2, 76, 2)], [(0, 77, 1), (1, 76, 1), (2, 74, 2)], [(0, 74, 1), (1, 76, 1), (2, 79, 2)],
       [(0, 79, 1), (1, 81, 0.5), (1.5, 79, 0.5), (2, 76, 2)], [(0, 76, 1), (1, 79, 1), (2, 83, 2)], [(0, 81, 1), (1, 79, 1), (2, 77, 2)], [(0, 74, 2), (2, 72, 2)]]
mus = music(N, [(0, fr(127), 0.5, {"drums": False, "inst": "glock"}), (fr(127), fr(584), 1.0, {"inst": "marimba"}),
                (fr(778), fr(1520), 0.85, {"inst": "marimba"}), (fr(1520), fr(1965), 0.8, {"inst": "pluck"}), (fr(1965), fr(2140), 0.45, {"drums": False, "inst": "glock"})],
            "island", PROG, MEL, bpm=100)
mus += music(N, [(fr(584), fr(743), 0.6, {"lead": False})], "soft", ["Am", "Em", "F", "E"], None, bpm=70)
sfx = np.zeros(N); amb = np.zeros(N)
for f in (127, 216, 584, 743, 778, 1520, 1965): place(sfx, whoosh(0.8), fr(f) - 0.4, 0.5)
place(sfx, chime(), fr(214), 0.5); place(sfx, chime(), fr(179), 0.4)
for k in range(10): place(sfx, hammer(0.6), fr(388) + 0.15 + k * 0.625 + (k % 3) * 0.2, 0.6)
place(sfx, thunder(), fr(598), 1.0); place(sfx, thunder(), fr(690), 0.9)
place(sfx, splash(1.5), fr(733), 1.0); place(sfx, splash(0.8), fr(600), 0.4); place(sfx, splash(0.8), fr(645), 0.4)
place(sfx, coins(), fr(1215), 0.6); place(sfx, coins(), fr(1836), 0.8)
for f in (906, 1695, 1880): place(sfx, chime(), fr(f), 0.5)
place(sfx, laughter(1.8), fr(1080), 0.5)
place(amb, bubbles(fr(127)), 0, 1.0); place(amb, bubbles(fr(35)), fr(743), 1.3); place(amb, bubbles(fr(175)), fr(1965), 1.0)
place(amb, waves(fr(584 - 127)), fr(127), 0.8); place(amb, birds(fr(457), 18), fr(127), 1.0)
place(amb, wind(fr(160)), fr(584), 1.4); place(amb, rain(fr(160)), fr(584), 1.0)
place(amb, waves(fr(1520 - 778)), fr(778), 0.6); place(amb, birds(fr(742), 22), fr(778), 0.8)
place(amb, waves(fr(445)), fr(1520), 0.9); place(amb, birds(fr(445), 12), fr(1520), 0.8)
finish(V, N, mus, sfx, amb, music_db=-16, sfx_db=-12, amb_db=-19)
