"""Cuts two `frame-review.py` sample tables into cards and prints them side by side.

    python3 scripts/frame-compare.py reference/samples.csv ours/samples.csv

A card is a run of samples with little movement; a cut or a colour jump starts the next one. For each
card it prints its length, brightness, saturation, colour, motion, ink and how often the words changed,
then the medians, which is how the review of 18 November 2026 put "one picture every 3.4 s" against
"one every 15.6 s". Needs nothing but python3.
"""
import csv
import sys

def load(path):
    with open(path) as handle:
        return list(csv.DictReader(handle))

def num(row, key):
    return float(row[key])

def segments(rows, cut=6.0, colour_jump=26.0):
    """A card is a run of samples with little frame change; a cut or a colour jump starts a new one."""
    out = []
    start = rows[0]
    acc = [rows[0]]
    for prev, row in zip(rows, rows[1:]):
        moved = num(row, 'diff') > cut
        swung = abs(num(row, 'r') - num(prev, 'r')) + abs(num(row, 'g') - num(prev, 'g')) + abs(num(row, 'b') - num(prev, 'b')) > colour_jump
        if moved or swung:
            out.append(acc)
            acc = []
        acc.append(row)
    out.append(acc)
    merged = []
    for run in out:
        if merged and len(run) < 4:
            merged[-1].extend(run)
        else:
            merged.append(list(run))
    return merged

def describe(run):
    n = len(run)
    avg = lambda key: sum(num(r, key) for r in run) / n
    motion = sum(num(r, 'diff') for r in run[1:]) / max(1, n - 1)
    ink = avg('light') + avg('dark')
    swaps = 0
    for a, b in zip(run, run[1:]):
        if abs(num(a, 'light') - num(b, 'light')) > 0.01 or abs(num(a, 'dark') - num(b, 'dark')) > 0.01:
            swaps += 1
    return {
        'start': num(run[0], 't'),
        'end': num(run[-1], 't'),
        'len': round(num(run[-1], 't') - num(run[0], 't') + 0.1, 1),
        'luma': round(avg('luma'), 0),
        'sat': round(avg('sat'), 0),
        'rgb': tuple(round(avg(k)) for k in ('r', 'g', 'b')),
        'motion': round(motion, 1),
        'ink': round(ink / 2, 3),
        'swaps': swaps,
    }

for name, path in (('reference', sys.argv[1]), ('ours', sys.argv[2])):
    rows = load(path)
    runs = [run for run in segments(rows) if len(run) >= 8]
    total = num(rows[-1], 't') + 0.1
    print(f'\n== {name}: {len(rows)} samples over {total:.1f}s, {len(runs)} cards')
    print('   start   end   len  luma  sat  rgb              motion  ink   swaps')
    for run in runs:
        d = describe(run)
        print(f"   {d['start']:6.1f} {d['end']:5.1f} {d['len']:5.1f} {d['luma']:5.0f} {d['sat']:4.0f}"
              f"  {str(d['rgb']):16s} {d['motion']:6.1f} {d['ink']:5.3f} {d['swaps']:4d}")
    lens = sorted(d['len'] for d in (describe(r) for r in runs))
    print('   median card', lens[len(lens) // 2], 's; longest', lens[-1], 's; shortest', lens[0], 's')
    print('   mean motion', round(sum(num(r, "diff") for r in rows) / len(rows), 2))
    print('   mean sat', round(sum(num(r, "sat") for r in rows) / len(rows), 0),
          'mean luma', round(sum(num(r, "luma") for r in rows) / len(rows), 0))
