# Yearbook sound effects

These are the short cues under the Yearbook score. The files checked in here are synthesized
stand-ins, not the final AI-generated sounds.

To replace one, drop a WAV or MP3 with the same base name into this folder. The player tries the WAV
first and falls back to the MP3, so an export can be dropped in without changing code.

| File | Moment |
| --- | --- |
| `begin.wav` | Begin on the cover |
| `page-turn.wav` | Any chapter change |
| `share-confirmation.wav` | A card is shared, copied or downloaded |
| `sound-toggle.wav` | Sound on or off |
| `stat-tick.wav` | Counting numbers |
| `name-reveal.wav` | The traveller name lands |
| `map-pin.wav` | The top station is pinned |
| `rail-chime.wav` | The route and where you set off |
| `distance-whoosh.wav` | Distance and the long haul |
| `clock-chime.wav` | Your hour |
| `camera-shutter.wav` | The look |
| `tape-reel.wav` | Your OVVO era |
| `board-stamp.wav` | Your lines and first and last |
| `trophy-triumph.wav` | The trophy case |
| `comparison-two-tone.wav` | Year over year |
| `crew-connect.wav` | Travel crew |
| `yearbook-close.wav` | The close |

`scripts/make-yearbook-sfx.py` regenerates the stand-ins.
