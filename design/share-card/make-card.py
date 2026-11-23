#!/usr/bin/env python3
"""
OVVO share card generator (1200x630, the WhatsApp / SMS link preview).

The card is a photograph with a route, a mark and a few labels on top. This
script re-creates it from its own ingredients, so the small type can be changed
without repainting the picture:

  1. The background is the Sprinter photograph, cropped and scaled exactly as
     the live card does it (measured: x1.7771, offset -0.77 / -751.04), so any
     text can be lifted off without guessing -- the real pixels underneath are
     in the photograph itself.
  2. The five small texts are re-set 15% larger on the same baselines.
  3. Everything else -- headline, times, mark, route, dots -- keeps the pixels
     the live card already has.

Environment (all optional):
  OVVO_REPO   repository root (default: two levels above this file)
  OVVO_CARD   source card      (default: $OVVO_REPO/public/og-image.jpg)
  OVVO_PHOTO  photograph       (default: $OVVO_REPO/public/style-photos/sprinter.jpg)
  OVVO_OUT    output image     (default: $OVVO_REPO/public/og-image.jpg)
  OVVO_PREVIEW  also write a lossless PNG here, for inspection
  OVVO_GROW   scale for the five texts (default: 1.15)

Needs Pillow, numpy, opencv-python and fonttools:
  python3 -m pip install pillow numpy opencv-python fonttools brotli

Run: python3 design/share-card/make-card.py
"""

import os
import sys
import tempfile
from functools import lru_cache

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.environ.get("OVVO_REPO") or os.path.abspath(os.path.join(HERE, "..", ".."))
CARD = os.environ.get("OVVO_CARD") or os.path.join(REPO, "public", "og-image.jpg")
PHOTO = os.environ.get("OVVO_PHOTO") or os.path.join(REPO, "public", "style-photos", "sprinter.jpg")
FONT = os.path.join(REPO, "public", "fonts", "jakarta-400-latin.woff2")
OUT = os.environ.get("OVVO_OUT") or os.path.join(REPO, "public", "og-image.jpg")
GROW = float(os.environ.get("OVVO_GROW", "1.15"))

W, H = 1200, 630

# How the photograph sits on the card, measured from the live card.
PHOTO_AFFINE = np.array(
    [[1.77709729, 0.00155739, -0.76907753],
     [-0.00155739, 1.77709729, -751.04192991]],
    dtype=np.float32,
)

CORAL = (255, 126, 105)   # #FF7E69
ROUTE = (195, 210, 191)   # pale route line
INK = (255, 255, 255)
PILL_INK = (110, 50, 36)  # the pill's words are a deep coral, not white


@lru_cache(maxsize=None)
def weight_file(weight):
    """A static Plus Jakarta Sans instance for one weight, built from the app's own variable font."""
    path = os.path.join(tempfile.gettempdir(), "ovvo-card-jakarta-%d.ttf" % weight)
    if not os.path.exists(path):
        from fontTools.ttLib import TTFont
        from fontTools.varLib.instancer import instantiateVariableFont

        f = TTFont(FONT)
        f.flavor = None
        inst = instantiateVariableFont(f, {"wght": weight}, inplace=False, updateFontNames=False)
        inst.save(path)
    return path


@lru_cache(maxsize=None)
def font_at(weight, size):
    return ImageFont.truetype(weight_file(weight), max(1, int(size)))


def text_layer(text, font, track, colour=INK):
    """Tracked text on a transparent layer."""
    widths = [font.getlength(ch) for ch in text]
    total = int(sum(widths) + track * max(len(text) - 1, 0)) + 12
    asc, desc = font.getmetrics()
    img = Image.new("RGBA", (total, int(asc + desc) + 12), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = 6.0
    for ch, adv in zip(text, widths):
        d.text((x, 6), ch, font=font, fill=colour + (255,))
        x += adv + track
    return img


def fit(text, weight, target_h, target_w):
    """Size that gives the measured ink height, and tracking that gives its width."""
    lo, hi = 4.0, 90.0
    for _ in range(40):
        mid = (lo + hi) / 2
        lay = text_layer(text, font_at(weight, round(mid)), 0)
        b = lay.getbbox()
        if b is None or (b[3] - b[1]) < target_h:
            lo = mid
        else:
            hi = mid
    size = int(round((lo + hi) / 2))
    lay = text_layer(text, font_at(weight, size), 0)
    b = lay.getbbox()
    track = (target_w - (b[2] - b[0])) / max(len(text) - 1, 1)
    return size, track


# The five texts, with the box each fills on the live card.
TEXTS = {
    "utrecht":   dict(text="UTRECHT", weight=500, bbox=(44, 539, 117, 551), anchor=0.5, cx=80.5),
    "schiphol":  dict(text="SCHIPHOL", weight=500, bbox=(657, 449, 742, 461), anchor=0.5, cx=699.5),
    "amsterdam": dict(text="AMSTERDAM", weight=500, bbox=(1039, 539, 1139, 551), anchor=0.5, cx=1089.0),
    "subtitle":  dict(text="Utrecht Centraal \u00b7 Amsterdam Centraal \u00b7 26 min", weight=400,
                      bbox=(66, 322, 513, 336), anchor=0.0, cx=66),
}
PILL = dict(text="26 MIN \u00b7 INTERCITY", weight=600, bbox=(724, 565, 845, 574),
            box=(681, 551, 889, 587))


def patch(out, background, box, pad=2, feather=5):
    """Replace a rectangle with the photograph underneath it, softened at the edge."""
    x0, y0, x1, y1 = box
    x0 -= pad + feather
    y0 -= pad + feather
    x1 += pad + feather
    y1 += pad + feather
    mh, mw = y1 - y0, x1 - x0
    mask = np.ones((mh, mw), np.float32)
    ramp = np.linspace(0, 1, feather + 1)[1:]
    mask[:feather, :] *= ramp[:, None]
    mask[-feather:, :] *= ramp[::-1][:, None]
    mask[:, :feather] *= ramp[None, :]
    mask[:, -feather:] *= ramp[::-1][None, :]
    out[y0:y1, x0:x1] = (background[y0:y1, x0:x1].astype(np.float32) * mask[:, :, None]
                         + out[y0:y1, x0:x1] * (1 - mask[:, :, None]))
    return out


def draw_route_in(out, rect):
    """Put back the stretch of route that runs under the SCHIPHOL label.

    Drawn four times larger and scaled down, so the strokes land on the same
    pixels and with the same softness as the rest of the card.
    """
    x0, y0, x1, y1 = rect
    ss = 4
    w, h = (x1 - x0) * ss, (y1 - y0) * ss
    paint = np.zeros((h, w, 3), np.uint8)
    cover = np.zeros((h, w), np.uint8)

    def line(p, q, colour, thick):
        a = (int(round((p[0] - x0) * ss)), int(round((p[1] - y0) * ss)))
        b = (int(round((q[0] - x0) * ss)), int(round((q[1] - y0) * ss)))
        t = max(1, int(round(thick * ss)))
        cv2.line(paint, a, b, colour[::-1], t, cv2.LINE_AA)
        cv2.line(cover, a, b, 255, t, cv2.LINE_AA)

    # the pale line first: flat under the label, then rising away to the right
    line((660, 470), (740, 470), ROUTE, 4.2)
    line((740, 470), (868, 420), ROUTE, 4.2)
    # the coral diagonal lies over it, from its dot down to the interchange dot
    line((703, 432), (820, 520), CORAL, 4.7)
    # the small stop at the bend sits on top of both
    c = (int(round((740 - x0) * ss)), int(round((470 - y0) * ss)))
    for r, colour in ((5.2, (18, 18, 18)), (2.4, (255, 255, 255))):
        cv2.circle(paint, c, int(round(r * ss)), colour[::-1], -1, cv2.LINE_AA)
        cv2.circle(cover, c, int(round(r * ss)), 255, -1, cv2.LINE_AA)

    paint = cv2.resize(paint, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA).astype(np.float32)
    cover = cv2.resize(cover, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    out[y0:y1, x0:x1] = paint * cover[:, :, None] + out[y0:y1, x0:x1] * (1 - cover[:, :, None])
    return out


def paste(out, layer, x, y):
    """Paste an RGBA layer onto the BGR card."""
    x, y = int(round(x)), int(round(y))
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(W, x + layer.size[0]), min(H, y + layer.size[1])
    if x1 <= x0 or y1 <= y0:
        return out
    sub = np.array(layer.crop((x0 - x, y0 - y, x1 - x, y1 - y)))
    a = sub[:, :, 3:4].astype(np.float32) / 255.0
    rgb = sub[:, :, :3][:, :, ::-1].astype(np.float32)
    out[y0:y1, x0:x1] = rgb * a + out[y0:y1, x0:x1] * (1 - a)
    return out


def build():
    card = cv2.imread(CARD)
    photo = cv2.imread(PHOTO)
    if card is None or photo is None:
        sys.exit("cannot read %s or %s" % (CARD, PHOTO))
    background = cv2.warpAffine(photo, PHOTO_AFFINE, (W, H), flags=cv2.INTER_LANCZOS4)
    out = card.astype(np.float32)

    # 1. lift the old text off, using the photograph underneath
    for key in ("utrecht", "amsterdam", "subtitle"):
        patch(out, background, TEXTS[key]["bbox"])
    patch(out, background, PILL["box"], pad=1, feather=4)
    patch(out, background, TEXTS["schiphol"]["bbox"])
    out = draw_route_in(out, (648, 438, 754, 476))

    # 2. the four texts that are not in the pill, 15% larger
    for key, spec in TEXTS.items():
        x0, y0, x1, y1 = spec["bbox"]
        size, track = fit(spec["text"], spec["weight"], y1 - y0 + 1, x1 - x0 + 1)
        layer = text_layer(spec["text"], font_at(spec["weight"], round(size * GROW)), track * GROW)
        layer = layer.crop(layer.getbbox())
        x = spec["cx"] - layer.size[0] * spec["anchor"]
        out = paste(out, layer, x, y0)

    # 3. the pill: same centre, 15% bigger, its words 15% bigger inside
    x0, y0, x1, y1 = PILL["box"]
    cx, cy = (x0 + x1 + 1) / 2.0, (y0 + y1 + 1) / 2.0
    pw, ph = (x1 - x0 + 1) * GROW, (y1 - y0 + 1) * GROW
    ss = 4
    pill = Image.new("RGBA", (int(round(pw * ss)), int(round(ph * ss))), (0, 0, 0, 0))
    ImageDraw.Draw(pill).rounded_rectangle(
        [0, 0, pill.size[0] - 1, pill.size[1] - 1], radius=pill.size[1] / 2.0, fill=CORAL + (255,))
    pill = pill.resize((int(round(pw)), int(round(ph))), Image.LANCZOS)
    px, py = cx - pw / 2.0, cy - ph / 2.0
    out = paste(out, pill, px, py)

    size, track = fit(PILL["text"], PILL["weight"], PILL["bbox"][3] - PILL["bbox"][1] + 1,
                      PILL["bbox"][2] - PILL["bbox"][0] + 1)
    layer = text_layer(PILL["text"], font_at(PILL["weight"], round(size * GROW)), track * GROW, PILL_INK)
    layer = layer.crop(layer.getbbox())
    out = paste(out, layer, px + (pw - layer.size[0]) / 2.0, py + (ph - layer.size[1]) / 2.0)

    return np.clip(out, 0, 255).astype(np.uint8)


def main():
    img = build()
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    Image.fromarray(rgb).save(OUT, "JPEG", quality=92, subsampling=0, optimize=True)
    print("wrote", OUT, "(%.1f KB)" % (os.path.getsize(OUT) / 1024.0))
    preview = os.environ.get("OVVO_PREVIEW")
    if preview:
        cv2.imwrite(preview, img)
        print("wrote", preview)


if __name__ == "__main__":
    main()
