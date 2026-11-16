#!/usr/bin/env python3
"""
Make the Yearbook's sound effects.

These are deliberately small, dry, synthesized stand-ins. They exist so the deck has a complete
sound cue before the AI-generated files arrive; a file dropped into public/sfx with the same name
replaces the stand-in without changing any code.

Run from the project root:

    python3 scripts/make-yearbook-sfx.py
"""
from pathlib import Path
import math

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 44100
OUT = Path("public/sfx")
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(17)


def tt(duration: float) -> np.ndarray:
    return np.arange(max(1, int(SR * duration)), dtype=np.float64) / SR


def lowpass(x: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    cutoff = min(cutoff, SR * 0.45)
    b, a = butter(order, cutoff / (SR / 2), btype="low")
    return lfilter(b, a, x)


def highpass(x: np.ndarray, cutoff: float, order: int = 2) -> np.ndarray:
    b, a = butter(order, max(20, cutoff) / (SR / 2), btype="high")
    return lfilter(b, a, x)


def bandpass(x: np.ndarray, lo: float, hi: float, order: int = 2) -> np.ndarray:
    b, a = butter(order, [max(20, lo) / (SR / 2), min(SR * 0.45, hi) / (SR / 2)], btype="band")
    return lfilter(b, a, x)


def noise(duration: float) -> np.ndarray:
    return rng.standard_normal(max(1, int(SR * duration)))


def env_ad(n: int, attack: float, decay: float) -> np.ndarray:
    t = np.arange(n) / SR
    a = 1 - np.exp(-t / max(attack, 1e-5))
    d = np.exp(-t / max(decay, 1e-5))
    return a * d


def bell(freq: float, duration: float = 1.0, gain: float = 1.0) -> np.ndarray:
    t = tt(duration)
    tone = (
        np.sin(2 * math.pi * freq * t)
        + 0.34 * np.sin(2 * math.pi * freq * 2.01 * t)
        + 0.14 * np.sin(2 * math.pi * freq * 3.03 * t)
    )
    e = env_ad(len(t), 0.004, 0.28) * np.minimum(1, t / 0.003)
    return gain * tone * e


def thump(freq: float, duration: float = 0.25, gain: float = 1.0) -> np.ndarray:
    t = tt(duration)
    tone = np.sin(2 * math.pi * freq * t) * np.exp(-t / 0.07)
    return gain * tone


def mix(total: np.ndarray, sound: np.ndarray, at: float, gain: float = 1.0) -> None:
    start = int(at * SR)
    end = min(len(total), start + len(sound))
    if end > start:
        total[start:end] += sound[: end - start] * gain


def save(name: str, sound: np.ndarray, duration: float, peak: float) -> None:
    n = int(SR * duration)
    if len(sound) < n:
        sound = np.pad(sound, (0, n - len(sound)))
    sound = sound[:n]
    sound = highpass(sound, 25)
    sound = sound / max(1e-9, np.max(np.abs(sound))) * peak
    fade = min(len(sound), int(SR * 0.008))
    sound[:fade] *= np.linspace(0, 1, fade)
    sound[-fade:] *= np.linspace(1, 0, fade)
    wavfile.write(OUT / name, SR, (sound * 32767).astype(np.int16))
    print(f"{name:28} {duration:4.2f}s  peak {peak:.2f}")


# 1. Begin: warm low swell with a glassy edge.
d = 0.8
t = tt(d)
f = 180 + 70 * (t / d)
tone = np.sin(2 * math.pi * np.cumsum(f) / SR)
shimmer = 0.14 * np.sin(2 * math.pi * 1620 * t)
x = (tone + shimmer) * env_ad(len(t), 0.06, 0.34)
save("begin.wav", x, d, 0.42)

# 2. Page turn: paper noise and one quiet tick.
d = 0.35
t = tt(d)
x = bandpass(noise(d), 900, 7200) * env_ad(len(t), 0.004, 0.095)
mix(x, bell(2800, 0.06, 0.22), 0.25, 0.6)
save("page-turn.wav", x, d, 0.34)

# 3. Share confirmation: a low tap, then one bright ping.
d = 0.5
x = np.zeros(int(SR * d))
mix(x, thump(92, 0.18, 0.9), 0.0)
mix(x, bell(1560, 0.3, 0.7), 0.12)
save("share-confirmation.wav", x, d, 0.38)

# 4. Sound toggle: one dry switch.
d = 0.12
t = tt(d)
x = highpass(noise(d), 1800) * env_ad(len(t), 0.001, 0.012)
mix(x, thump(190, 0.05, 0.8), 0.0)
save("sound-toggle.wav", x, d, 0.22)

# 5. Stat tick: one short wooden tick.
d = 0.07
t = tt(d)
x = highpass(noise(d), 2400) * env_ad(len(t), 0.001, 0.012)
mix(x, bell(720, 0.055, 0.55), 0.0)
save("stat-tick.wav", x, d, 0.2)

# 6. Name reveal: a filtered rise that lands on one bell.
d = 0.7
t = tt(d)
rise = bandpass(noise(d), 600, 3400) * (t / d) ** 1.7 * env_ad(len(t), 0.12, 0.5)
x = rise * 0.75
mix(x, bell(880, 0.45, 0.8), 0.3)
save("name-reveal.wav", x, d, 0.3)

# 7. Map pin: a soft impact and a tiny metallic ping.
d = 0.3
x = np.zeros(int(SR * d))
mix(x, thump(118, 0.16, 1.0), 0.0)
mix(x, bell(2050, 0.12, 0.45), 0.012)
save("map-pin.wav", x, d, 0.3)

# 8. Rail chime: two clean platform bells.
d = 0.9
x = np.zeros(int(SR * d))
mix(x, bell(660, 0.7, 0.9), 0.0)
mix(x, bell(880, 0.65, 0.8), 0.3)
save("rail-chime.wav", x, d, 0.34)

# 9. Distance whoosh: filtered air moving once.
d = 1.2
t = tt(d)
body = bandpass(noise(d), 320, 4200) * np.sin(math.pi * t / d) ** 1.2
body += 0.15 * np.sin(2 * math.pi * 82 * t) * np.sin(math.pi * t / d) ** 2
save("distance-whoosh.wav", body, d, 0.28)

# 10. Clock chime: one warm bell.
d = 0.8
x = bell(520, 0.75, 1.0)
save("clock-chime.wav", x, d, 0.3)

# 11. Camera shutter: two mechanical clicks.
d = 0.25
t = tt(d)
x = highpass(noise(d), 1600) * env_ad(len(t), 0.001, 0.012)
mix(x, highpass(noise(d), 1200) * env_ad(len(t), 0.001, 0.01), 0.07)
mix(x, thump(1750, 0.04, 0.35), 0.07)
save("camera-shutter.wav", x, d, 0.28)

# 12. Era advance: one short film-advance ratchet, then a stop.
d = 0.8
t = tt(d)
click = highpass(noise(d), 1800) * env_ad(len(t), 0.001, 0.018)
wind = bandpass(noise(d), 500, 3800) * env_ad(len(t), 0.02, 0.28) * 0.55
x = click * 0.8 + wind
mix(x, highpass(noise(d), 1200) * env_ad(len(t), 0.001, 0.012), 0.62)
mix(x, thump(180, 0.06, 0.35), 0.62)
save("era-advance.wav", x, d, 0.25)

# 13. Board stamp: one solid impact with paper texture.
d = 0.3
t = tt(d)
x = bandpass(noise(d), 250, 4800) * env_ad(len(t), 0.002, 0.07)
mix(x, thump(100, 0.2, 1.0), 0.0)
save("board-stamp.wav", x, d, 0.4)

# 14. Comparison two-tone: two neutral bell notes.
d = 0.8
x = np.zeros(int(SR * d))
mix(x, bell(440, 0.55, 0.8), 0.0)
mix(x, bell(550, 0.5, 0.75), 0.3)
save("comparison-two-tone.wav", x, d, 0.3)

# 15. Crew connect: two overlapping chimes.
d = 0.7
x = np.zeros(int(SR * d))
mix(x, bell(600, 0.55, 0.8), 0.0)
mix(x, bell(800, 0.5, 0.7), 0.18)
save("crew-connect.wav", x, d, 0.32)

# 16. Yearbook close: low cover thud and paper settling.
d = 1.0
t = tt(d)
x = thump(82, 0.3, 1.0)
paper = bandpass(noise(d), 300, 4800) * env_ad(len(t), 0.03, 0.3) * 0.35
mix(x, paper, 0.16)
save("yearbook-close.wav", x, d, 0.34)

# 17. Trophy triumph: a warm major chord and shimmer.
d = 1.5
t = tt(d)
chord = np.zeros(len(t))
for freq, gain in ((261.63, 0.55), (329.63, 0.45), (392.00, 0.4), (523.25, 0.22)):
    tone = np.sin(2 * math.pi * freq * t)
    tone += 0.22 * np.sin(2 * math.pi * freq * 2 * t)
    tone += 0.08 * np.sin(2 * math.pi * freq * 3 * t)
    chord += gain * tone
e = env_ad(len(t), 0.12, 0.9)
shimmer = 0.08 * np.sin(2 * math.pi * 2093 * t) * env_ad(len(t), 0.2, 0.5)
x = (chord + shimmer) * e
save("trophy-triumph.wav", x, d, 0.42)
