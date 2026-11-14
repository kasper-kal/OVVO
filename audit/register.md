# Visual defect register

Written by `scripts/look.mjs`. Every line was measured in a real browser, not reported by a person.
**Do not edit by hand.** Fix the defect and re-run the same command: a finding that is no longer
reproduced stops appearing. A finding that is wanted gets `status: deliberate` and a reason.

Open findings: **12** across 2 kinds.

## a control has no 44px tap area — 8

- wrapped · tram · en · 390px · Disruptions: 14 69x36 narrow short
- wrapped · tram · en · 390px · Sound on 84x34 wide short
- wrapped · tram · en · 1440px · Disruptions: 14 69x36 narrow short
- wrapped · tram · en · 1440px · Sound off 85x34 wide short
- wrapped · tram · nl · 390px · Storingen: 14 69x36 narrow short
- wrapped · tram · nl · 390px · Sound off 85x34 wide short
- wrapped · tram · nl · 1440px · Storingen: 14 69x36 narrow short
- wrapped · tram · nl · 1440px · Sound off 85x34 wide short

## an icon is off its text line — 4

- map · tram · en · 390px · 3.3px beside "Amsterdam Sloterdijk"
- map · tram · en · 390px · 3.3px beside "Amsterdam, Leidseplein"
- map · tram · nl · 390px · 3.3px beside "Amsterdam Sloterdijk"
- map · tram · nl · 390px · 3.3px beside "Amsterdam, Leidseplein"
