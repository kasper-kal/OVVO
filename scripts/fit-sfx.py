#!/usr/bin/env python3
"""
Fit one imported sound effect to the Yearbook cue it belongs to.

This only trims and pads WAV files. It removes leading and trailing silence, keeps the natural body,
cuts an overlong tail at a safe maximum, and normalizes the peak so one AI-generated file does not
arrive twice as loud as the next.

    python3 scripts/fit-sfx.py /path/to/source.wav trophy-triumph

The output is public/sfx/<effect>.wav. MP3 files are copied by the watcher instead; the browser
player already has an MP3 fallback.
"""
from pathlib import Path
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

SR = 44100

# effect: (target seconds, hard maximum, peak)
EFFECTS = {
    "begin": (0.80, 1.10, 0.42),
    "page-turn": (0.35, 0.55, 0.34),
    "share-confirmation": (0.50, 0.75, 0.38),
    "sound-toggle": (0.12, 0.20, 0.22),
    "stat-tick": (0.07, 0.12, 0.20),
    "name-reveal": (0.70, 0.95, 0.30),
    "map-pin": (0.30, 0.45, 0.30),
    "rail-chime": (0.90, 1.10, 0.34),
    "distance-whoosh": (1.20, 1.45, 0.28),
    "clock-chime": (0.80, 1.00, 0.30),
    "camera-shutter": (0.25, 0.40, 0.28),
    "era-advance": (0.80, 1.00, 0.25),
    "board-stamp": (0.30, 0.45, 0.40),
    "trophy-triumph": (1.50, 2.10, 0.42),
    "comparison-two-tone": (0.80, 1.00, 0.30),
    "crew-connect": (0.70, 0.90, 0.32),
    "yearbook-close": (1.00, 1.30, 0.34),
}


def read_audio(path: Path) -> tuple[np.ndarray, int]:
    rate, data = wavfile.read(path)
    if data.ndim > 1:
        data = data.mean(axis=1)
    if np.issubdtype(data.dtype, np.integer):
        info = np.iinfo(data.dtype)
        if np.issubdtype(data.dtype, np.unsignedinteger):
            data = data.astype(np.float64) - info.max / 2
        else:
            data = data.astype(np.float64)
        scale = max(abs(info.min), info.max)
        data = data / scale
    else:
        data = data.astype(np.float64)
    return data, rate


def resample(data: np.ndarray, rate: int) -> np.ndarray:
    if rate == SR:
        return data
    gcd = np.gcd(rate, SR)
    return resample_poly(data, SR // gcd, rate // gcd)


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: fit-sfx.py <source.wav> <effect>", file=sys.stderr)
        return 2
    source = Path(sys.argv[1])
    effect = sys.argv[2]
    if effect not in EFFECTS:
        print(f"unknown effect: {effect}", file=sys.stderr)
        return 2
    if not source.exists():
        print(f"missing source: {source}", file=sys.stderr)
        return 2

    target, maximum, peak = EFFECTS[effect]
    data, rate = read_audio(source)
    data = resample(data, rate)
    if not np.any(np.isfinite(data)):
        print("audio is not finite", file=sys.stderr)
        return 2
    data = np.nan_to_num(data)
    data = data - np.mean(data)

    # Trim only silence, leaving a little air at both ends.
    amplitude = np.max(np.abs(data))
    if amplitude <= 1e-8:
        print("audio is silent", file=sys.stderr)
        return 2
    threshold = amplitude * 0.004
    above = np.flatnonzero(np.abs(data) > threshold)
    if len(above):
        start = max(0, above[0] - int(0.008 * SR))
        end = min(len(data), above[-1] + int(0.02 * SR))
        data = data[start:end]

    # Fit to the cue's length. A long natural tail is cut at the hard maximum; the target keeps the
    # page's timing stable even when a generator returns a very short one-shot.
    limit = int(maximum * SR)
    if len(data) > limit:
        data = data[:limit].copy()
        fade = min(len(data), int(0.012 * SR))
        data[-fade:] *= np.linspace(1, 0, fade)
    wanted = int(target * SR)
    if len(data) < wanted:
        data = np.pad(data, (0, wanted - len(data)))

    # A clean edge on every file, then normalize to the table's peak.
    edge = min(len(data), int(0.006 * SR))
    data[:edge] *= np.linspace(0, 1, edge)
    data[-edge:] *= np.linspace(1, 0, edge)
    data = data / max(1e-9, np.max(np.abs(data))) * peak

    out = Path("public/sfx") / f"{effect}.wav"
    out.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(out, SR, (data * 32767).astype(np.int16))
    print(f"{effect}: {len(data) / SR:.2f}s / {maximum:.2f}s max, peak {peak:.2f} -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
