# Every address OVVO has

Host: `https://ovvo.onrender.com` — generated from the route table in `src/App.tsx` and the ids in
`src/data/stops.ts` and `src/data/disruptions.ts`, so it lists what the app actually
answers rather than what it once did. Regenerate it after adding a stop or an alert.

## The screens of the app

| Address | What it is |
| --- | --- |
| `/` | Home — the planner, the next departures at your station, your pinned stops |
| `/results` | The results screen, before it has a search in it |
| `/results/<search id>` | One search, in full — the list, the sort and the filters (below) |
| `/map` | The network map |
| `/stops` | Every station and stop, with filters and sorting |
| `/departures` | Live departure boards |
| `/disruptions` | All delays, cancellations and planned works |
| `/preferences` | Travel preferences — walking, transfers, luggage |
| `/settings` | Settings — language, appearance, colour, background, storage |
| `/planner` | Not a screen: sends you to Home |
| `/journey/<journey id>` | One journey, opened from the results list (see below) |
| `/stops/<stop id>` | One stop (61 of them, listed below) |
| `/disruptions/<alert id>` | One alert (14 of them, listed below) |

Any other address shows the app's own "Page not found" screen. It answers with the
app rather than a server error, which matters for anything typed by hand.

## A stop — 61 addresses

`{host}/stops/<stop id>`

- `https://ovvo.onrender.com/stops/amsterdam-centraal` — Amsterdam Centraal
- `https://ovvo.onrender.com/stops/amsterdam-sloterdijk` — Amsterdam Sloterdijk
- `https://ovvo.onrender.com/stops/amsterdam-zuid` — Amsterdam Zuid
- `https://ovvo.onrender.com/stops/amsterdam-bijlmer-arena` — Amsterdam Bijlmer ArenA
- `https://ovvo.onrender.com/stops/amsterdam-muiderpoort` — Amsterdam Muiderpoort
- `https://ovvo.onrender.com/stops/amsterdam-amstel` — Amsterdam Amstel
- `https://ovvo.onrender.com/stops/amsterdam-noord` — Amsterdam Noord (metro)
- `https://ovvo.onrender.com/stops/amsterdam-leidseplein` — Amsterdam, Leidseplein
- `https://ovvo.onrender.com/stops/amsterdam-museumplein` — Amsterdam, Museumplein
- `https://ovvo.onrender.com/stops/amsterdam-dam` — Amsterdam, Dam
- `https://ovvo.onrender.com/stops/amsterdam-buiksloterweg` — Amsterdam, Buiksloterweg ferry
- `https://ovvo.onrender.com/stops/amsterdam-raijhuis` — Rijksmuseum
- `https://ovvo.onrender.com/stops/amsterdam-vondelpark` — Amsterdam, Vondelpark
- `https://ovvo.onrender.com/stops/amsterdam-annefrank` — Amsterdam, Anne Frank House
- `https://ovvo.onrender.com/stops/zaandam` — Zaandam Station
- `https://ovvo.onrender.com/stops/zaanse-schans` — Zaanse Schans
- `https://ovvo.onrender.com/stops/volendam` — Volendam, Centrum
- `https://ovvo.onrender.com/stops/haarlem` — Haarlem Station
- `https://ovvo.onrender.com/stops/hilversum` — Hilversum Station
- `https://ovvo.onrender.com/stops/almere-centrum` — Almere Centrum
- `https://ovvo.onrender.com/stops/alkmaar` — Alkmaar Station
- `https://ovvo.onrender.com/stops/hoofddorp` — Hoofddorp Station
- `https://ovvo.onrender.com/stops/amstelveen-busstation` — Amstelveen, Busstation
- `https://ovvo.onrender.com/stops/schiphol-airport` — Schiphol Airport
- `https://ovvo.onrender.com/stops/leiden-centraal` — Leiden Centraal
- `https://ovvo.onrender.com/stops/den-haag-centraal` — Den Haag Centraal
- `https://ovvo.onrender.com/stops/den-haag-hs` — Den Haag HS
- `https://ovvo.onrender.com/stops/den-haag-binnenhof` — Den Haag, Binnenhof
- `https://ovvo.onrender.com/stops/delft` — Delft Station
- `https://ovvo.onrender.com/stops/rotterdam-centraal` — Rotterdam Centraal
- `https://ovvo.onrender.com/stops/rotterdam-blaak` — Rotterdam Blaak
- `https://ovvo.onrender.com/stops/rotterdam-alexander` — Rotterdam Alexander
- `https://ovvo.onrender.com/stops/rotterdam-erasmusbrug` — Rotterdam, Erasmusbrug waterbus
- `https://ovvo.onrender.com/stops/rotterdam-markthal` — Rotterdam, Markthal
- `https://ovvo.onrender.com/stops/schiedam-centrum` — Schiedam Centrum
- `https://ovvo.onrender.com/stops/gouda` — Gouda Station
- `https://ovvo.onrender.com/stops/dordrecht` — Dordrecht Station
- `https://ovvo.onrender.com/stops/zoetermeer` — Zoetermeer Station
- `https://ovvo.onrender.com/stops/utrecht-centraal` — Utrecht Centraal
- `https://ovvo.onrender.com/stops/utrecht-vaartsche-rijn` — Utrecht Vaartsche Rijn
- `https://ovvo.onrender.com/stops/utrecht-lunetten` — Utrecht Lunetten
- `https://ovvo.onrender.com/stops/utrecht-overvecht` — Utrecht Overvecht
- `https://ovvo.onrender.com/stops/utrecht-domtoren` — Utrecht, Domtoren
- `https://ovvo.onrender.com/stops/amersfoort-centraal` — Amersfoort Centraal
- `https://ovvo.onrender.com/stops/arnhem-centraal` — Arnhem Centraal
- `https://ovvo.onrender.com/stops/nijmegen` — Nijmegen Station
- `https://ovvo.onrender.com/stops/apeldoorn` — Apeldoorn Station
- `https://ovvo.onrender.com/stops/deventer` — Deventer Station
- `https://ovvo.onrender.com/stops/zwolle` — Zwolle Station
- `https://ovvo.onrender.com/stops/enschede` — Enschede Station
- `https://ovvo.onrender.com/stops/tilburg` — Tilburg Station
- `https://ovvo.onrender.com/stops/den-bosch` — 's-Hertogenbosch
- `https://ovvo.onrender.com/stops/breda` — Breda Station
- `https://ovvo.onrender.com/stops/eindhoven-centraal` — Eindhoven Centraal
- `https://ovvo.onrender.com/stops/eindhoven-strijp-s` — Eindhoven Strijp-S
- `https://ovvo.onrender.com/stops/helmond` — Helmond Station
- `https://ovvo.onrender.com/stops/maastricht` — Maastricht Station
- `https://ovvo.onrender.com/stops/groningen` — Groningen Station
- `https://ovvo.onrender.com/stops/groningen-noord` — Groningen Noord
- `https://ovvo.onrender.com/stops/leeuwarden` — Leeuwarden Station
- `https://ovvo.onrender.com/stops/vlissingen` — Vlissingen Station

## An alert — 14 addresses

`{host}/disruptions/<alert id>`

- `https://ovvo.onrender.com/disruptions/d-signal-utrecht` — Signalling fault — delays around Utrecht Centraal
- `https://ovvo.onrender.com/disruptions/d-platform-amsterdam` — Platform changes at Amsterdam Centraal
- `https://ovvo.onrender.com/disruptions/d-works-rotterdam` — Engineering works — Rotterdam Blaak closed to trams
- `https://ovvo.onrender.com/disruptions/d-cancel-schiphol` — Cancelled services — Schiphol Airport to Haarlem
- `https://ovvo.onrender.com/disruptions/d-ferry-buiksloterweg` — Ferry F3 — longer waiting times
- `https://ovvo.onrender.com/disruptions/d-crowding-utrecht` — Busy trains towards Amsterdam
- `https://ovvo.onrender.com/disruptions/d-weather-groningen` — Strong wind — reduced speed in the north
- `https://ovvo.onrender.com/disruptions/d-metro-noord-zuid` — Metro 52 — longer journey times
- `https://ovvo.onrender.com/disruptions/d-works-denhaag` — Planned works — fewer trains to Den Haag HS
- `https://ovvo.onrender.com/disruptions/d-cancel-maastricht` — Cancelled night bus N851 to Utrecht
- `https://ovvo.onrender.com/disruptions/d-platform-eindhoven` — Platform change at Eindhoven Centraal
- `https://ovvo.onrender.com/disruptions/d-waterbus-dordrecht` — Waterbus 20 — timetable adjusted
- `https://ovvo.onrender.com/disruptions/d-crowding-brabantliner` — Brabantliner 300 very busy in the morning
- `https://ovvo.onrender.com/disruptions/d-lift-almere` — Lift out of service at Almere Centrum

## A journey

`{host}/journey/<journey id>`

A journey only exists for the search that made it: its id is built from the date, the
two ends and the departure time, and the journey itself lives in the session that
searched. So this address is opened by the results list and by the journey's own
refresh — it is not a link to send to somebody else. Opened cold, it says the journey
is not here rather than showing somebody else's.

## A search — one address per search

`{host}/results/<search id>`

Every search writes its own address, so **a reload puts the same list back** — same journeys, same
order, same sort, same filters. The id carries the whole question: both ends, the date and time
(whether that is a departure or an arrival), how far the window was paged with Earlier/Later, the
sort, and the result filters. Nothing is stored in the browser to make this work; the journeys are
planned again from the same question and come out the same, which is why the address can be
bookmarked or sent and still be honest.

Sorting is in the address too: choosing **Fastest** changes the id, and a reload (or a link) opens
on Fastest rather than reverting to Best.

One thing a shared link does **not** carry: another person's travel preferences. A link plans the
same search under the rules of whoever opens it, so a friend's walking limit is never overruled by
yours — the list can differ by a journey or two for that reason.

`/results` on its own still works and says there is nothing to show yet, and an id the app cannot
read says *that* instead — an address that names a stop the network does not have is refused rather
than drawn as an empty list.

Example (a real one, from an Utrecht Centraal → Haarlem search leaving at 13:20):

`https://ovvo.onrender.com/results/eyJ2IjoxLCJmIjoidXRyZWNodC1jZW50cmFhbCIsInQiOiJoYWFybGVtIiwiZCI6IjIwMjYtMTAtMjQiLCJtIjo3OTUsInRtIjoiZGVwYXJ0In0`

## The extras a screen accepts after the `?`

These are not pages of their own — they change what a page opens on.

| Address | What it opens |
| --- | --- |
| `https://ovvo.onrender.com/?pick=from` | Home, with the "from" picker already open |
| `https://ovvo.onrender.com/?pick=to` | Home, with the "to" picker already open |
| `https://ovvo.onrender.com/?from=utrecht-centraal&to=haarlem` | Home, with the planner filled in |
| `https://ovvo.onrender.com/?widget=next-departures` | Home, scrolled to that card |
| `https://ovvo.onrender.com/stops?sort=city` | The stop list in city order (`name`, `connections`, `nearest`) |
| `https://ovvo.onrender.com/stops?type=station` | The stop list filtered by type |
| `https://ovvo.onrender.com/stops?modes=train,bus` | The stop list filtered by which transport calls there |
| `https://ovvo.onrender.com/stops?favourites=1` | Only your pinned stops |
| `https://ovvo.onrender.com/departures?stop=utrecht-centraal` | The board for one stop |
| `https://ovvo.onrender.com/disruptions?stop=utrecht-centraal` | Only the alerts touching one stop |
| `https://ovvo.onrender.com/map?stop=utrecht-centraal` | The map, on one stop |

## The old addresses

Before the router read real paths, every address carried a `#`: `/stops` was
`/#/stops`. Those still work — the app rewrites the `#` form to the plain address
before it draws anything, so a bookmark or a link already shared keeps opening the
screen it named. Nothing needs to be re-shared.
