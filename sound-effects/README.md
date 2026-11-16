# Drop the Yearbook sounds here

Drag your generated files into this folder. The watcher imports each one into the Yearbook slot and
moves it to `imported/`. You do not need to rename anything if the file already uses one of the exact
names below.

Accepted: **WAV** and **MP3**. WAV is best if you want the length fitted. The watcher trims leading
and trailing silence, pads a short cue, cuts an overlong cue at its maximum, and normalizes the peak.
MP3 files are copied without processing; the player has an MP3 fallback, but their length stays as
generated.

| Drop this file | Yearbook moment | Target | Hard maximum |
| --- | --- | ---: | ---: |
| `begin.wav` | Begin / first chapter | 0.80s | 1.10s |
| `page-turn.wav` | Moving between chapters | 0.35s | 0.55s |
| `share-confirmation.wav` | Shared or downloaded | 0.50s | 0.75s |
| `sound-toggle.wav` | Sound switch | 0.12s | 0.20s |
| `stat-tick.wav` | Number counting up | 0.07s | 0.12s |
| `name-reveal.wav` | The traveller name | 0.70s | 0.95s |
| `map-pin.wav` | The map pin lands | 0.30s | 0.45s |
| `rail-chime.wav` | Era rail / route | 0.90s | 1.10s |
| `distance-whoosh.wav` | Distance bars | 1.20s | 1.45s |
| `clock-chime.wav` | Hour bars | 0.80s | 1.00s |
| `camera-shutter.wav` | The look / photo | 0.25s | 0.40s |
| `era-advance.wav` | Your OVVO era | 0.80s | 1.00s |
| `board-stamp.wav` | Lines / bookends | 0.30s | 0.45s |
| `trophy-triumph.wav` | The trophy case | 1.50s | 2.10s |
| `comparison-two-tone.wav` | Year over year | 0.80s | 1.00s |
| `crew-connect.wav` | Travel crew | 0.70s | 0.90s |
| `yearbook-close.wav` | The close | 1.00s | 1.30s |

The watcher also accepts `film-advance` or the old `tape-reel` name for `era-advance`.

Leave no other audio in this folder. Unknown names are skipped so a stray file does not land in the
wrong moment.
