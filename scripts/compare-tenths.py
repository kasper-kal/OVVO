"""
**Measure our film against the reference at a tenth of a second.**

The eye is the judge, but the numbers keep it honest: how much the picture changes every 0.1 s, how
saturated it is, how bright, and how much edge detail it carries. Printed side by side, so a claim that
"it looks closer now" has something behind it.

    python3 scripts/compare-tenths.py <reference.mp4> <ours.webm>
"""
import sys
import cv2
import numpy as np


def metrics(path):
    cap = cv2.VideoCapture(path)
    step = max(1, round((cap.get(cv2.CAP_PROP_FPS) or 25) * 0.1))
    prev, motion, sat, lum, edge = None, [], [], [], []
    index = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if index % step == 0:
            small = cv2.resize(frame, (160, 356), interpolation=cv2.INTER_AREA)
            grey = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
            hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
            if prev is not None:
                motion.append(float(np.abs(grey.astype(np.int16) - prev.astype(np.int16)).mean()))
            prev = grey
            sat.append(float(hsv[:, :, 1].mean()))
            lum.append(float(grey.mean()))
            edge.append(float((cv2.Canny(grey, 70, 160) > 0).mean() * 100))
        index += 1
    cap.release()
    return {
        'motion': float(np.mean(motion)),
        'big': float(np.mean([m > 8 for m in motion]) * 100),
        'sat': float(np.mean(sat)),
        'lum': float(np.mean(lum)),
        'edge': float(np.mean(edge)),
    }


ref = metrics(sys.argv[1])
ours = metrics(sys.argv[2])
print(f"{'':10}{'reference':>10}{'ours':>10}")
for key in ('motion', 'big', 'sat', 'lum', 'edge'):
    print(f'{key:10}{ref[key]:10.2f}{ours[key]:10.2f}')
