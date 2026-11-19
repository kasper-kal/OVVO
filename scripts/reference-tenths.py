"""
**Every tenth of a second of the reference, sharp.**

The first version of this sheet tiled 1,344 frames at 34 by 76 pixels to fit one image. It was
unreadable, and the steerer was right to call it blurry. This cuts the film at a quarter of its size,
100 frames per sheet (ten seconds), with the time printed on each frame, so every tenth of a second can
be looked at at full size.

    python3 scripts/reference-tenths.py [video] [outdir]
"""
import sys
import cv2
import numpy as np

VIDEO = sys.argv[1] if len(sys.argv) > 1 else 'VID_20261102_013903_1.mp4'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'artifacts/reference-tenths'
TW, TH = 215, 480
COLS, ROWS = 10, 10

cap = cv2.VideoCapture(VIDEO)
step = round(cap.get(cv2.CAP_PROP_FPS) * 0.1)
frames, index = [], 0
while True:
    ok, frame = cap.read()
    if not ok:
        break
    if index % step == 0:
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
print(f'{len(frames)} frames on {len(range(0, len(frames), per))} sheets')
