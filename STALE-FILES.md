# The text files we don't need

> **EXECUTED — 2026-10-15.** Everything below was deleted, **including the four keepers** in the
> table under *Before you delete*, the non-text pile in the appendix (`.shots/`, `dist/`, the `r9`
> screenshots, the loose `.logs` PNGs) and the three `.logs/r9*` folders. The tree went 260 MB →
> 134 MB. What survives is the *What stays* column — `src/`, `scripts/`, the configs, `index.html`,
> `.gitignore`, the six live documents, and the 27 gate instruments. **Full backup:**
> `/workspace/homes/d06ec682935a0dae4f349744/ov-restore-point/after-round3-20261015-202735.tar.gz`,
> which holds nearly all of it (the round-12/13-era outputs, the two newest probes and `dist/` are
> not in any snapshot and are gone). The citations below in `USER-FIXES.md` and
> `DESIGN_DECISIONS.md` now point at files that no longer exist; the numbers they name are still in
> those documents' prose.

**Historical — do not read this as the current list.** Since that deletion the tree moved again:
`FOOTERS.md` was removed once its last footer was decided; `.logs/` was pruned a second time on
2026-10-18 to the 14 gate scripts, the 50 cited instruments and `widget-audit-2/` — the unpacked
browser libraries went too, and `.logs/playwright-libs.sh` re-fetches them — and two dead scripts
were found in `scripts/` (the README and the gate never name `comprehensive-audit.mjs` or
`simple-header-audit.mjs`). The counts below describe the tree before
those two passes, not the 4.8 MB it is now.

An inventory, not a deletion — until the note above. Every file below was where it said it was when
this was written. This is the text-only version of the list (the earlier one also counted pictures
and build output; those are in the appendix, since they are not text).

Counted by walking the tree (excluding `node_modules`, `dist` and `.git`) and classifying every file
that is not an image or a font:

    in scope      209 text files, 1.8 MB
    keep           58 text files, 745 KB   ← config, the live documents, the instruments, and the four keepers named below
    unnecessary   151 text files, 1.1 MB   ← everything below

The 57 files under `src/` are application code and are not in scope; they were checked separately
and **none** is unreferenced.

**Where the earlier numbers went.** This file used to read *47 keep / 161 unnecessary*. That split is
what you get before the keepers found in the second pass are taken out — the four items in the table
under *Before you delete* (whose fifth row is a document I would still let go) — and it also missed
`.git` — in this worktree a **file**, 63 bytes of pointer,
not a directory — so the two columns did not quite add up: 47 + 161 = 208 of 209. Both are fixed
here, and every number below is measured from the tree, not estimated.

**Being quoted is not a reason to keep one — but the count matters.** An earlier version of this
file said six of the files below were quoted in a live document and that *nothing else* was cited.
That was wrong, in both directions. Wrong one way: the four root documents are each named in
`USER-FIXES.md` and `DESIGN_DECISIONS.md` (R76 names all four) — which is how two of them ended up in
the keep column above. Wrong the other way, the files still in the delete column that a live document
does name are: `CAPS-AUDIT.md` (`USER-FIXES.md` order 29), `.logs/audit-probe2.out`
(`OVERWHELMING_FIX.md`), `.logs/caps-audit.json` (written by the kept `scripts/caps-audit.mjs`), and
the two `.shots/*/icon-set.html` sheets (`README.md` line 373 and `DESIGN_DECISIONS.md` R58 — the
README prints the command that regenerates the `r57` one). Each of those is either the raw output
behind a number already written in prose or a file a kept script rewrites on its next run, which is
what makes it disposable.

## Before you delete — the five with a real claim

Everything else in this file can go without losing anything a check, a script or a document needs.
These five are the exception, and each reason is a fact about the tree, not a preference:

| File | Why it has a claim |
|---|---|
| `OVERWHELMING_FIX.md` | **It is not only a plan — it is the manual audit's deliverable and an unfinished to-do list.** `USER-FIXES.md` order 41: *"the audit was delivered later, as the file ordered for it: `OVERWHELMING_FIX.md`"*, and its other half says the stat-cluster findings *"are listed with their locations, their findings and a fix each in `OVERWHELMING_FIX.md` … and were left alone: the order was to list them and ask."* Deleting it deletes the list you have not answered yet, and orphans citations in `USER-FIXES.md`, `DESIGN_DECISIONS.md` (R76), two kept instruments (`fix-verify.cjs`, `scripts/caps-audit.mjs`) and one source comment (`HomePage.tsx:101`) |
| `.logs/reveal-check.cjs` | **The only instrument for the scroll-up refresh row, and the source of R64/R65's numbers.** It holds exactly **24 checks** — the "24 browser checks, 0 failures" quoted in `USER-FIXES.md` (15b) and `DESIGN_DECISIONS.md` (R65) — and no kept instrument tests that behaviour at all (the only `inert` in the kept set is about board rows). Its caveat is shared with every round check: the browser path inside it is this workspace's absolute path |
| `.logs/r9/` (the folder, not its siblings) | **It is the audit's evidence.** `OVERWHELMING_FIX.md` line 21: *"**70 screenshots**, in `.logs/r9/`: 17 screen states × English and Nederlands × 390px and 1440px"*, with the measurement behind it in `r9/audit-measure.json` (line 25, a 68-state walk) and `r9/float-check.json` / `r9/float-check.txt` (line 28) — those four paths exist **only** in `r9/`
(that quoted 70 is the audit's own count; the folder holds **105** `.png`s — those 70 and 35 more
under its `top/` sub-folder). Its two siblings are **not copies**: all three folders are separate runs of the same 68-state measurement, and their numbers differ (`r9/audit-measure.json` against the two others: 34 fields and 6 fields respectively, mostly `pageHeight` and `board-empty.controlLabels` — the font-wait variants the document itself flags at line 39). Dropping the two siblings loses those two runs, which no document quotes |
| `PLAN-round9.md` | It is where the three questions were left open (the round-9 block in `USER-FIXES.md`, orders 34–39: *"Planned in `PLAN-round9.md` before a line was written … with three questions left open there and answered here"*), and its open question 2 — whether the compact stop card reaches the pinned-stops widget and the board picker's rows — is recorded as *"this round only"*: the one written statement of a decision that may want revisiting |
| `CAPS-AUDIT.md` | Cited (order 29) but **superseded**: R71 fixed all three findings, and the living instrument `scripts/caps-audit.mjs` rewrites `.logs/caps-audit-report.md` on every run. This is the one of the five I would still delete — it leaves one dangling citation and loses no facts |

Two more judgment calls, both of which I would delete:

- `.logs/revert-round.md` — the procedure is already in `FIXES-APPLIED.md` (*Going back*). Its only
  unique line is the archive's `sha256` and file count, which is now also in `FIXES-APPLIED.md`, so
  the duplication is complete and the file is disposable.
- `.logs/prune-i18n.py` — a *tool* rather than evidence (a documented `--apply` pruner for dead NL
  dictionary entries) and no document points at it. Worth keeping in mind because the ~80 hard-coded
  English interface strings R71 reported are still waiting for an order, but it is ten lines to
  rewrite and nothing here depends on it.

### Safe to delete even though it looks load-bearing

- `empty-ring.json` + `empty-ring.png` — written by the kept `empty-ring-check.cjs` at the start of
  every run and handed straight to the kept `empty-ring-analyse.py`;
- `.shots/r57/icon-set.html` — written by the kept `scripts/icon-sheet.mjs` to exactly that path
  (`r55/icon-set.html` is the older sheet, not regenerated);
- `.logs/caps-audit.json` and `.logs/caps-audit-report.md` — both rewritten by every `caps-audit`
  run (`scripts/caps-audit.mjs`, lines 464–465);
- `.logs/r7-*.png` and `.logs/r8-cancelled-*.png` — screenshots taken by the kept round-7 and
  round-8 checks;
- `.logs/before.json` and `.logs/after.json` — nothing reads them: the only mention anywhere in the
  tree is this file;
- every `.out`, `.txt`, `.log` transcript;
- `.logs/noleak-check.cjs` — its seven assertions are all re-asserted by the kept `round6-check.cjs`
  (empty picker, nothing invented, nothing remembered on reload, and a walk of
  `/departures?stop=rotterdam-centraal`), plus the `?stop=` walks in rounds 4, 5, 8 and 10.

## 1. Root documents — 2 files, 15 KB

Plans and reports of rounds that are already built. `OVERWHELMING_FIX.md` and `PLAN-round9.md` are
**not** here — see the table above.

| File | Size | Why it is unnecessary |
|---|---|---|
| `CAPS-AUDIT.md` | 10.7 KB | the capitalisation audit's report — its findings were fixed in R71, and the living version is `scripts/caps-audit.mjs`, which rewrites `.logs/caps-audit-report.md` |
| `OVERWHELMING_FIX_SIMPLIFIED.md` | 4.4 KB | a shortened copy of the same batch list — **nothing in the repo links to it at all** |

Stay: `README.md`, `USER-FIXES.md`, `DESIGN_DECISIONS.md`, `MATCHING_PLAN.md`, `STALE-FILES.md`,
`OVERWHELMING_FIX.md`, `PLAN-round9.md`, `FIXES-APPLIED.md` (its *Going back* section is the written
record of how to revert, and it now carries the archive's hash), plus the four configs, `index.html`,
`.gitignore` and `.git`.

## 2. `.logs` transcripts — 93 files, 554 KB

Output of runs whose numbers are already quoted in the live documents, and state files from
finishing one. Nothing re-reads any of them.

**`.out` — 41 files, 283 KB**

    acceptance.out · audit-probe2.out · audit-shots.out · caps-audit-canfail.out · caps-audit.out
    class.out · fix-verify.out · gate10.out · gate11.out · gate12.out · gate12-tail.out · gate13.out
    icon.out · noleak.out · noleak-check.out · plant.out · r4.out · r5.out · r6.out · r7.out · r8.out
    r9.out · r9-shots.out · r10.out · render.out · ring.out · round4.out · round4-check.out
    round5.out · round5-check.out · round6.out · round6-check.out · round7.out · round8.out
    round9.out · round9-rerun.out · round12.out · round13.out · ui-light.out · ui-dark.out · ui-darknl.out

**`.txt` — 25 files, 72 KB** (each is one run's transcript, kept in a second and third copy)

    acceptance-after.txt · acceptance-r2.txt · caps-after.txt · caps-r2.txt · fix-verify-after.txt
    fix-verify-round2.txt · ring-after.txt · ring-r2.txt · round4-after.txt · round4-r2.txt
    round5-after.txt · round5-r2.txt · round6-after.txt · round6-r2.txt · round7-after.txt
    round7-r2.txt · round8-after.txt · round8-r2.txt · round9-after.txt · round9-r2.txt
    round10-after.txt · round10-r2.txt · ui-light-r2.txt · ui-dark-r2.txt · ui-darknl-r2.txt

**`.log` — 11 files, 174 KB**

    gate7.log · gate8.log · gate9.log · gate9b.log · gate9c.log · gate9d.log · gate9e.log
    extra-gate.log · dev.log · r8-verify.log · pw-install.log

**`.json` and `.pid` — 10 files, 8 KB**

    before.json · after.json · caps-audit.json · empty-ring.json
    caps-audit.pid · dev.pid · dev.pid.new · gate7.pid · gate8.pid · gate9.pid · gate9b.pid

**Round notes — 4 files, 15 KB**

    dd-r67.md · dd-r72.md · uf-order23.md · revert-round.md

**Two odds and ends — 2 KB**

    prune-i18n.py (a one-off dictionary pruner) · dev.pid.new

## 3. `.logs` one-off probes — 33 files, 98 KB

Interactive debugging scripts, each written to answer one question whose answer is now in the
documents. The keepers below them are the ones the gate actually runs; `reveal-check.cjs` is not
among them, and is argued for above.

    alert-title-probe.cjs · alerts-row-probe.cjs · audit-probe2.cjs · audit-probe3.cjs · audit-shots.cjs
    badge-probe.cjs · batch-measure.cjs · before-after.cjs · diag-round4.cjs · diag-round5.cjs
    disruptions-probe.cjs · i18n-probe.cjs · measure-picker.cjs · measure-row.cjs · net-probe.cjs
    net-probe2.cjs · noleak-check.cjs · overlay-probe.cjs · probe-btn.cjs · probe-btn2.cjs
    probe-svg-rx.cjs · r9-float-check.cjs · r9-audit-shots.cjs · r9-shots.cjs · r11-foot.cjs
    r11-shots.cjs · r12-probe.cjs · round12-shots.cjs · shot.cjs · shots-empty.cjs
    shots-picker.cjs · shots-round5.cjs · wheel-diag.cjs

Two of those are mine, from this week, and belong in the same group: `alerts-row-probe.cjs` and
`round12-shots.cjs`.

## 4. `.logs` sub-folder transcripts — 8 files, 98 KB

Three folders hold the same measurement run three times, with different numbers (34 fields and 6
fields apart — the font-wait variants). **`r9/` itself is kept**: it is the manual audit's evidence,
cited three times in `OVERWHELMING_FIX.md`, and it is the only one of the three holding
`float-check.json` and `float-check.txt`. Each folder also carries **105 screenshots** — 70 at its top
level and 35 under `top/`.

    r9-round9-snapshot/{audit-measure.json, audit-measure-round9.json, float-check-run.txt, audit-probe2.done}
    r9-run-without-font-wait/{audit-measure.json, audit-measure-round9.json, float-check-run.txt, audit-probe2.done}

Kept in the working copy: `r9/audit-measure.json`, `r9/audit-measure-round9.json`,
`r9/audit-measure-dejavu-only.json`, `r9/float-check.json`, `r9/float-check.txt`,
`r9/float-check-run.txt`, `r9/audit-probe2.done`.

## 5. `.shots` text files — 15 files, 311 KB

The screenshots folder is from before the redesign, and it also kept the scripts that took those
shots and two generated icon sheets (92 KB and 179 KB of HTML).

    .shots/r55/icon-set.html · .shots/r57/icon-set.html
    .shots/r60/checks.cjs · sweep.cjs · auto.cjs · tick.cjs · map.cjs · picker.cjs · dark.cjs
              · final.cjs · dev.log
    .shots/audit/log.json · log-routes-d.json · log-routes-m.json · inter-log.json

## What stays, and why — 58 files, 745 KB

- `scripts/` — all eight, each cited in `README.md` as the way to run its check;
- `src/` — application code (not in scope; no unreferenced module found);
- the four configs, `.gitignore`, `.git`, `index.html`, and the eight live documents;
- **the instruments the gate runs, 27 of them**: `round4…round13-check.cjs`, `round8-measure.cjs`,
  `round8-cancelled-probe.cjs`, `empty-ring-check.cjs` + `empty-ring-analyse.py`, `fix-verify.cjs`,
  `pw-offline-hosts.cjs` (the gate loads it through `NODE_OPTIONS`), `gate7/8/9/9d/10/12/12-tail/13.sh`,
  `revert-round3.sh`, `make-pre-round3.cjs`, and `caps-audit-report.md`, which every caps-audit run
  rewrites;
- plus the four keepers named in the first table: `OVERWHELMING_FIX.md`, `PLAN-round9.md`,
  `.logs/reveal-check.cjs` and the seven `.logs/r9/` measurement files.

## If you want them gone

Text files only — nothing here is needed to run the app, to build it, or to run any check:

    # 1. the transcripts, stale state and the two other r9 runs (101 files, 655 KB;
    #    those two folders also carry 210 screenshots: 105 each). NOT .logs/r9 itself — see above.
    rm .logs/*.out .logs/*.txt .logs/*.log .logs/*.json .logs/*.pid .logs/dev.pid.new
    rm .logs/dd-r67.md .logs/dd-r72.md .logs/uf-order23.md .logs/revert-round.md .logs/prune-i18n.py
    rm -r .logs/r9-round9-snapshot .logs/r9-run-without-font-wait

    # 2. the one-off probes (33 files, 98 KB) — the previous list, less reveal-check.cjs
    rm .logs/{alert-title-probe,alerts-row-probe,audit-probe2,audit-probe3,audit-shots,badge-probe,batch-measure,before-after,diag-round4,diag-round5,disruptions-probe,i18n-probe,measure-picker,measure-row,net-probe,net-probe2,noleak-check,overlay-probe,probe-btn,probe-btn2,probe-svg-rx,r9-float-check,r9-audit-shots,r9-shots,r11-foot,r11-shots,r12-probe,round12-shots,shot,shots-empty,shots-picker,shots-round5,wheel-diag}.cjs

    # 3. the pre-redesign folder's own text files (15 files, 311 KB)
    rm .shots/r55/icon-set.html .shots/r57/icon-set.html .shots/r60/*.cjs .shots/r60/dev.log .shots/audit/*.json

    # 4. the two executed documents nothing else needs (2 files, 15 KB)
    rm CAPS-AUDIT.md OVERWHELMING_FIX_SIMPLIFIED.md

The four steps add up to exactly the **151 files** listed above. Steps 1 and 2 are the ones I would
do first — **134 files of pure noise**, none of which any document's number depends on.

## Appendix — what is *not* text

No step above touches any of it; the commands are text-only. There is a much larger pile next to
this one: **210 screenshots** inside the two `r9` folders going (and **105 more** in the `r9` folder
that is kept), **37 loose `.png`s** directly in `.logs` (2.4 MB), the `.logs/shots/` and
`.logs/before-after/` folders, **74 MB of pre-redesign screenshots** in `.shots/`, and `dist/`
(556 KB of build output). Together with the text above, about **125 MB** of the tree is evidence
nobody re-reads.
