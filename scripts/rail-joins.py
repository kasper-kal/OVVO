"""Read the rail's pixels: fail on a page-coloured row inside a connector, and draw a contact sheet of
every join at four times size, so the picture that gets looked at is the picture that was judged."""
import json
import re
from PIL import Image, ImageDraw

runs = json.load(open('artifacts/rail-joins/geometry.json'))
failures = 0


def colour(text):
    nums = [int(float(n)) for n in re.findall(r"[\d.]+", text)[:3]]
    return tuple(nums) if len(nums) == 3 else (255, 255, 255)


SCALE = 3
ZOOM = 4

for run in runs:
    im = Image.open(run['name']).convert('RGB')
    px = im.load()
    bg = colour(run['bg'])
    crops = []
    for row in run['rows']:
        if 'timeline__rail--ride' not in row['cls'] or row['nodeCol'] is None:
            continue
        if 'timeline__rail--stop' in row['cls']:
            continue
        col = round(row['nodeCol'] * SCALE)
        top = round(row['top'] * SCALE)
        bottom = round((row['bottom'] + run['gap']) * SCALE)
        holes = []
        for y in range(top, min(bottom, im.size[1] - 1)):
            r, g, b = px[col, y]
            if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) < 24:
                holes.append(y)
        if holes:
            failures += 1
            firsts = ', '.join('%.1f' % (y / SCALE) for y in holes[:4])
            print('GAP  %s %s  col=%d  rows=%d  first at y=%s'
                  % (run['width'], run['theme'], col, len(holes), firsts))
        box = (
            max(0, col - 18 * SCALE),
            max(0, top - 6 * SCALE),
            min(im.size[0], col + 18 * SCALE),
            min(im.size[1], top + 26 * SCALE),
        )
        crop = im.crop(box).resize(
            ((box[2] - box[0]) * ZOOM // SCALE, (box[3] - box[1]) * ZOOM // SCALE), Image.NEAREST
        )
        crops.append(crop)
    if crops:
        width = max(c.width for c in crops) + 16
        sheet = Image.new('RGB', (width, sum(c.height + 16 for c in crops) + 8), (245, 244, 240))
        draw = ImageDraw.Draw(sheet)
        y = 4
        for index, crop in enumerate(crops):
            sheet.paste(crop, (8, y))
            draw.rectangle([8, y, 8 + crop.width - 1, y + crop.height - 1], outline=(200, 198, 192))
            draw.text((8, y + crop.height + 2), 'join %d, x%d' % (index + 1, ZOOM), fill=(60, 58, 54))
            y += crop.height + 16
        out = 'artifacts/rail-joins/joins-%d-%s.png' % (run['width'], run['theme'])
        sheet.save(out)
        print('sheet written: %s (%d joins)' % (out, len(crops)))

print('rail joins: %d connector(s) with a gap' % failures)
raise SystemExit(1 if failures else 0)
