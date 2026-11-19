"""
**Every tenth of a second of our film, sharp, in a folder of its own.**

The same tactic as `scripts/reference-tenths.py`: cut the recording every 0.1 s, write each frame to a
folder, then tile 100 of them (ten seconds) per labelled sheet at the reference's own cell size, so the
two sets can be laid beside each other.

    python3 scripts/ours-tenths.py [video] [outdir]
"""
import os
import sys
import cv2
import numpy as np

VIDEO = sys.argv[1] if len(sys.argv) > 1 else 'artifacts/wrapped-recording/yearbook-portrait.webm'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'artifacts/ours-tenths'
TW, TH = 215, 480
COLS, ROWS = 10, 10

FRAMES = os.path.join(OUT, 'frames')
os.makedirs(FRAMES, exist_ok=True)
for stale in os.listdir(FRAMES):
    if stale.endswith('.png'):
        os.remove(os.path.join(FRAMES, stale))
for stale in os.listdir(OUT):
    if stale.endswith('.png'):
        os.remove(os.path.join(OUT, stale))

# **Cut by the clock, not by a frame count.** At 25 fps every second frame is 0.08 s, not 0.1 s, and
# the first version of this sheet labelled 0.08 s steps as tenths, which overstated the film by a quarter.
# Each frame is taken when its own timestamp reaches the next tenth.
cap = cv2.VideoCapture(VIDEO)
frames, index = [], 0
while True:
    ok, frame = cap.read()
    if not ok:
        break
    stamp = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000
    if stamp + 1e-6 >= len(frames) * 0.1:
        tenth = len(frames)
        big = cv2.resize(frame, (390, 844), interpolation=cv2.INTER_AREA)
        cv2.imwrite(f'{FRAMES}/{tenth // 10:03d}-{tenth % 10}d.png', big)
        frames.append(cv2.resize(frame, (TW, TH), interpolation=cv2.INTER_AREA))
    index += 1
cap.release()

per = COLS * ROWS
for start in range(0, len(frames), per):
    cells = []
    for offset, frame in enumerate(frames[start:start + per]):
        label = np.full((22, TW, 3), 255, np.uint8)
        cv2.putText(label, f'{(start + offset) / 10:5.1f}s', (4, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
        cells.append(np.vstack([label, frame]))
    while len(cells) < per:
        cells.append(np.full_like(cells[0], 255))
    rows = [np.hstack(cells[r * COLS:(r + 1) * COLS]) for r in range(ROWS)]
    cv2.imwrite(f'{OUT}/{start // 10:03d}-{(start + per) // 10:03d}s.png', np.vstack(rows))
print(f'{len(frames)} frames at 0.1s, {len(range(0, len(frames), per))} sheets in {OUT}')
