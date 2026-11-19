"""
**Ours and the reference on one clock, side by side.**

Samples both films at the same timestamps and prints each pair across a row, ours above the reference's
own frame, with the time on the left. The tenth-of-a-second sheets are for detail; this is the sheet that
shows where the two films stop agreeing.

    python3 scripts/tenths-compare.py [ours] [reference] [outdir] [step]
"""
import os
import sys
import cv2
import numpy as np

OURS = sys.argv[1] if len(sys.argv) > 1 else '/tmp/now.webm'
REF = sys.argv[2] if len(sys.argv) > 2 else 'VID_20261102_013903_1.mp4'
OUT = sys.argv[3] if len(sys.argv) > 3 else 'artifacts/tenths-compare'
STEP = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
TW, TH = 215, 480

os.makedirs(OUT, exist_ok=True)


def grab(path, seconds):
    cap = cv2.VideoCapture(path)
    cap.set(cv2.CAP_PROP_POS_MSEC, seconds * 1000)
    ok, frame = cap.read()
    cap.release()
    if not ok:
        return np.full((TH, TW, 3), 255, np.uint8)
    return cv2.resize(frame, (TW, TH), interpolation=cv2.INTER_AREA)


ours = cv2.VideoCapture(OURS)
our_len = ours.get(cv2.CAP_PROP_FRAME_COUNT) / (ours.get(cv2.CAP_PROP_FPS) or 25)
ours.release()
ref = cv2.VideoCapture(REF)
ref_len = ref.get(cv2.CAP_PROP_FRAME_COUNT) / (ref.get(cv2.CAP_PROP_FPS) or 60)
ref.release()
length = min(our_len, ref_len)
print(f'ours {our_len:.1f}s, reference {ref_len:.1f}s, compared to {length:.1f}s')

times = []
t = 0.0
while t < length:
    times.append(t)
    t += STEP

pairs = []
for t in times:
    a, b = grab(OURS, t), grab(REF, t)
    block = np.hstack([a, np.full((TH, 6, 3), 255, np.uint8), b])
    pairs.append(block)

per_sheet = 10
for start in range(0, len(pairs), per_sheet):
    cells = []
    for offset, block in enumerate(pairs[start:start + per_sheet]):
        t = times[start + offset]
        row = np.vstack([np.full((26, block.shape[1], 3), 255, np.uint8), block])
        cv2.putText(row, f'{t:5.0f}s  ours | reference', (5, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
        cells.append(row)
    while len(cells) < per_sheet:
        cells.append(np.full_like(cells[0], 255))
    cv2.imwrite(f'{OUT}/{times[start]:03.0f}-{times[min(start + per_sheet, len(times) - 1)]:03.0f}s.png', np.vstack(cells))
print(f'{len(pairs)} pairs on {len(range(0, len(pairs), per_sheet))} sheets in {OUT}')
