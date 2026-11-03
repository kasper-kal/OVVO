"""Read the rail's pixels and fail on any page-coloured row inside a ride's connector."""
import json
import re
from PIL import Image

runs = json.load(open('artifacts/rail-joins/geometry.json'))
failures = 0


def colour(text):
    nums = [int(float(n)) for n in re.findall(r"[\d.]+", text)[:3]]
    return tuple(nums) if len(nums) == 3 else (255, 255, 255)


for run in runs:
    im = Image.open(run['name']).convert('RGB')
    px = im.load()
    bg = colour(run['bg'])
    scale = 3
    for row in run['rows']:
        if 'timeline__rail--ride' not in row['cls'] or row['nodeCol'] is None:
            continue
        if 'timeline__rail--stop' in row['cls']:
            continue
        col = round(row['nodeCol'] * scale)
        top = round(row['top'] * scale)
        bottom = round((row['bottom'] + run['gap']) * scale)
        holes = []
        for y in range(top, min(bottom, im.size[1] - 1)):
            r, g, b = px[col, y]
            if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) < 24:
                holes.append(y)
        if holes:
            failures += 1
            firsts = ', '.join('%.1f' % (y / scale) for y in holes[:4])
            print('GAP  %s %s  col=%d  rows=%d  first at y=%s'
                  % (run['width'], run['theme'], col, len(holes), firsts))
print('rail joins: %d connector(s) with a gap' % failures)
raise SystemExit(1 if failures else 0)
