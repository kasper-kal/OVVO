"""Reads a film every 0.1 s: one line of measurements per sample, the scene cuts, and contact sheets.

    python3 scripts/frame-review.py <film> <outdir> [tiles_per_sheet] [step_seconds] [sheets 0|1]

Written for the frame review of 18 November 2026 (`design/wrapped-comparison/REVIEW-2026-11-18.md`),
which had to look at every frame of the Wrapped recording rather than a sample of it. It measures a
downscaled copy, so it is quick on a phone-sized film: brightness, saturation, colour, edge energy, how
much ink is in the lower half, and how far the frame has moved since the last sample. The sheets are
the frames themselves, in reading order, so the numbers and the pictures come out of one pass.

Needs python3 and OpenCV. It touches nothing in the app.
"""
import csv
import os
import sys

import cv2
import numpy as np

if len(sys.argv) < 3:
    raise SystemExit(__doc__)
path, outdir = sys.argv[1], sys.argv[2]
per_sheet = int(sys.argv[3]) if len(sys.argv) > 3 else 120
step = float(sys.argv[4]) if len(sys.argv) > 4 else 0.1
want_sheets = (sys.argv[5] if len(sys.argv) > 5 else '1') != '0'
os.makedirs(outdir, exist_ok=True)

cap = cv2.VideoCapture(path)
fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
print(f'{path}: {int(cap.get(3))}x{int(cap.get(4))} {fps:.2f}fps ~{total} frames')

TILE = (int(round(86)), int(round(192)))
rows = []
tiles = []
prev_small = None
next_sample = 0.0
index = 0

while True:
    ok, frame = cap.read()
    if not ok:
        break
    t = index / fps
    index += 1
    if t + 1e-9 < next_sample:
        continue
    next_sample += step

    small = cv2.resize(frame, (216, 480), interpolation=cv2.INTER_AREA)
    hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    b, g, r = (float(x) for x in cv2.mean(small)[:3])
    luma = float(gray.mean())
    sat = float(hsv[:, :, 1].mean())
    edges = float(cv2.Laplacian(gray, cv2.CV_32F).var() ** 0.5)
    lower = small[int(480 * 0.55):, :]
    lg = cv2.cvtColor(lower, cv2.COLOR_BGR2GRAY)
    dark = float((lg < 60).mean())
    light = float((lg > 235).mean())
    grid = [float(cv2.mean(small[y0:y0 + 160, x0:x0 + 72])[0] / 255)
            for y0 in (0, 160, 320) for x0 in (0, 72, 144)]
    diff = 0.0 if prev_small is None else float(np.abs(gray.astype(np.int16) - prev_small).mean())
    prev_small = gray.astype(np.int16)
    rows.append([round(t, 2), round(r, 1), round(g, 1), round(b, 1), round(luma, 1),
                 round(sat, 1), round(edges, 1), round(dark, 3), round(light, 3), round(diff, 1)]
                 + [round(v, 2) for v in grid])
    tiles.append(cv2.resize(frame, TILE, interpolation=cv2.INTER_AREA))

cap.release()

with open(os.path.join(outdir, 'samples.csv'), 'w', newline='') as handle:
    writer = csv.writer(handle)
    writer.writerow(['t', 'r', 'g', 'b', 'luma', 'sat', 'edges', 'dark', 'light', 'diff']
                    + [f'g{i}' for i in range(9)])
    writer.writerows(rows)

cuts = [(rows[i][0], rows[i][9]) for i in range(len(rows)) if rows[i][9] > 9]
print('samples', len(rows), 'seconds', round(rows[-1][0], 1) if rows else 0)
print('cuts', len(cuts), [f'{t}s/{d}' for t, d in cuts[:40]])

if not want_sheets:
    print('samples', len(rows), 'seconds', round(rows[-1][0], 1) if rows else 0)
    raise SystemExit(0)

cols = 12
per_sheet = max(cols, per_sheet)
for start in range(0, len(tiles), per_sheet):
    chunk = tiles[start:start + per_sheet]
    lines = []
    for row_start in range(0, len(chunk), cols):
        strip = chunk[row_start:row_start + cols]
        while len(strip) < cols:
            strip.append(np.zeros((TILE[1], TILE[0], 3), np.uint8))
        line = np.hstack(strip)
        for i, tile in enumerate(strip):
            pass
        lines.append(line)
    sheet = np.vstack(lines)
    first = rows[start][0]
    name = f'sheet-{start // per_sheet + 1:02d}-{first:06.1f}s.png'
    cv2.imwrite(os.path.join(outdir, name), sheet)
print('sheets', (len(tiles) + per_sheet - 1) // per_sheet)
