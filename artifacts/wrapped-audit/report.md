# OVVO Wrapped: after the fixes

**SCREEN: WRAPPED AUDIT - 144 shots, 4 states, 18 chapters, 2 moments. No page painted through the header or footer. One page needs a scroll at 320: the yearbook.**

## What was captured

The same matrix as the first audit: 360 x 800, 320 x 568, 768 x 1024 and 1440 x 900, with an entrance frame and a late frame at 1.45 s for every chapter. All 18 chapters exist in the regular demo year. The pre-fix report is [report-before.md](report-before.md).

## The blockers are fixed

- **The yearbook has a real title column at every width.** The four text share buttons are now 44 px icon buttons. Award titles measure 156 px at 768 (was 19), 279 px at 1440 (was 61-96) and 161 px at 360. All four awards fit at 360; the tablet and desktop cards are one even grid.
- **Short-phone pages no longer paint through the chrome.** The body is the scroll container, starts below the top controls and ends above the foot. Map, bookends, lines and the close page fit 320 x 568 outright. The yearbook is the only page that needs a scroll at 320 (592 px of content in 440 px); all four cards are reachable and there is no footer overlap.
- **All four line totals are present.** 700 and 800 now sit beside stops hearted and boards pinned, with their captions visible.
- **The demo badge inherits the chapter ink.** It is legible on the dark chapters and on the paper chapters, and is a 44 px target.
- **The cover's first frame is the cover.** Wrapped skips the app splash, so the OVVO tile no longer sits over 2025 at 90 ms.
- **The close page is finished.** The page wash no longer dims the coral Share cards button. Start again has its own icon, and the 320 footer uses two rows so the note and every action fit.

## The smaller faults

- The chapter counter is 14 px at 80% instead of 13 px at 62%.
- The distance notes rule spans the full column and the notes are 11.5 px.
- The pair's "times" sits beside its number.
- The map uses two labels at 320; the third no longer collides.
- The long-haul endpoint keeps "UTRECHT CENTRAAL" instead of an ellipsis.
- The bookends connector hairline is gone; both cards fit at 320.
- The crew code is 11-12 px, not 9, and its privacy note is visible at 320.
- The look's title is solid warm ink, not roof-coloured cut-out type, so it reads against the photograph.
- The lines ticker is one centred watermark, not text cut at both edges.
- The close actions use 12 px labels and the coral accent.

## What remains

At 320 x 568 the yearbook still scrolls. Four awards plus the page title cannot fit a 440 px body without cutting the sentences; scrolling is the honest layout. Nothing is hidden behind the footer. The crew page scrolls by 3 px, less than one line, and all of its text is visible.

There are no clipped-text faults, page-overflow faults or under-footer faults at 360, 768 or 1440. The console still shows only the local analytics CORS/429 messages.

## See it

- [All 144 captures](index.html)
- [Phone contact sheets](contact-phone-settled-1.jpg) · [second half](contact-phone-settled-2.jpg)
- [320 contact sheets](contact-small-settled-1.jpg) · [second half](contact-small-settled-2.jpg)
- [Tablet contact sheets](contact-tablet-settled-1.jpg) · [second half](contact-tablet-settled-2.jpg)
- [Desktop contact sheets](contact-desktop-settled-1.jpg) · [second half](contact-desktop-settled-2.jpg)
