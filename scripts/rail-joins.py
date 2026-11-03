"""Read the rail's pixels: fail on a page-coloured row inside a connector, and draw a contact sheet of
every join at four times size, so the picture that gets looked at is the picture that was judged.

The scan starts under the mark's own box (its centre is page-coloured by design) and stops at the next
row's top, so a bead or a station ring cannot be mistaken for a gap."""
import json
import re
from PIL import Image, ImageDraw

runs = json.load(open('artifacts/rail-joins/geometry.json'))
failures = 0


def colour(text):
    nums = [float(n) for n in re.findall(r"[\d.]+", text)[:3]]
    return tuple(int(n) for n in nums) if len(nums) == 3 else (252, 251, 250)


SCALE = 3
ZOOM = 4

for run in runs:
    im = Image.open(run['name']).convert('RGB')
    px = im.load()
    bg = colour(run['bg'])
    rows = run['rows']
    crops = []
    for index, row in enumerate(rows):
        if 'timeline__rail--ride' not in row['cls'] or row['nodeCol'] is None:
            continue
        if 'timeline__rail--stop' in row['cls']:
            continue
        col = round(row['nodeCol'] * SCALE)
        start = row.get('nodeBottom') or row['top']
        following = rows[index + 1]['top'] if index + 1 < len(rows) else row['bottom'] + run['gap']
        end = min(row['bottom'] + run['gap'], following)
        holes = []
        for y in range(round(start * SCALE), min(round(end * SCALE), im.size[1] - 1)):
            r, g, b = px[col, y]
            if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) < 30:
                holes.append(y)
        if holes:
            failures += 1
            firsts = ', '.join('%.1f' % (y / SCALE) for y in holes[:4])
            print('GAP  %s %s  col=%d  rows=%d  first at y=%s'
                  % (run['width'], run['theme'], col, len(holes), firsts))
        box = (
            max(0, col - 18 * SCALE),
            max(0, round((start - 14) * SCALE)),
            min(im.size[0], col + 18 * SCALE),
            min(im.size[1], round((start + 16) * SCALE)),
        )
        crop = im.crop(box).resize(
            ((box[2] - box[0]) * ZOOM // SCALE, (box[3] - box[1]) * ZOOM // SCALE), Image.NEAREST
        )
        crops.append(crop)
    if crops:
        sheet = Image.new('RGB', (max(c.width for c in crops) + 16, sum(c.height + 16 for c in crops) + 8), (245, 244, 240))
        draw = ImageDraw.Draw(sheet)
        y = 4
        for index, crop in enumerate(crops):
            sheet.paste(crop, (8, y))
            draw.rectangle([8, y, 8 + crop.width - 1, y + crop.height - 1], outline=(200, 198, 192))
            draw.text((8, y + crop.height + 2), 'join %d' % (index + 1), fill=(60, 58, 54))
            y += crop.height + 16
        out = 'artifacts/rail-joins/joins-%d-%s.png' % (run['width'], run['theme'])
        sheet.save(out)
        print('sheet: %s (%d joins)' % (out, len(crops)))

print('rail joins: %d connector(s) with a gap' % failures)
raise SystemExit(1 if failures else 0)
