import type { CSSProperties } from 'react';
import type { Chapter } from '../../lib/wrappedDeck';
import { useT } from '../../lib/useT';

/*
 * **The yearbook as an issue, not a dashboard.**
 *
 * The old deck was a set of chapters that all spoke the same way: a small label, a large figure and
 * a paragraph on a coloured sheet. This is a different object. It is a printed transit annual, with
 * a masthead, a page number, a hard grid, editorial headlines, stamps, tickets and colour fields.
 * The pages still tell the same year because that is the only honest source; the words and the
 * shapes around it are new.
 *
 * Navigation is deliberately outside this file. The tap halves, arrow keys, close, sound and Begin
 * belong to `WrappedPage`; this only draws the page the traveller is standing on.
 */

const NUMBER = new Intl.NumberFormat('en-GB');
const KILOMETRES = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
const SHORT_DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

const COPY: Record<string, { eyebrow: string; headline: string }> = {
  cover: { eyebrow: 'OVVO YEARBOOK', headline: 'THE TRANSIT ISSUE' },
  total: { eyebrow: 'THE YEAR IN NUMBERS', headline: 'A year measured in departures.' },
  name: { eyebrow: 'THE LOOK YOU WORE', headline: 'You gave the year a face.' },
  map: { eyebrow: 'THE COUNTRY YOU MADE', headline: 'Every journey left a mark.' },
  distance: { eyebrow: 'DISTANCE & CARBON', headline: 'Kilometres of intention.' },
  pair: { eyebrow: 'THE LINE THAT KEPT COMING BACK', headline: 'Somewhere you keep returning to.' },
  origin: { eyebrow: 'WHERE YOU SET OFF', headline: 'The station that started it all.' },
  hour: { eyebrow: 'THE HOUR THAT OWNS YOU', headline: 'The clock knows your name.' },
  direct: { eyebrow: 'STRAIGHT THROUGH', headline: 'No changes. No detours.' },
  longest: { eyebrow: 'THE LONG WAY ROUND', headline: 'One trip took the scenic route.' },
  look: { eyebrow: 'THE LOOK YOU WORE', headline: 'You called it a feeling.' },
  eras: { eyebrow: 'THE SHAPE OF THE YEAR', headline: 'Three seasons, one wardrobe.' },
  lines: { eyebrow: 'THE LINE THAT KNOWS YOU', headline: 'A number you can recognise.' },
  awards: { eyebrow: 'THE YEAR, ACCORDING TO YOU', headline: 'The trophies you did not ask for.' },
  bookends: { eyebrow: 'FIRST OUT. LAST HOME.', headline: 'The year, in two tickets.' },
  comparison: { eyebrow: 'YEAR OVER YEAR', headline: 'More, and differently.' },
  crew: { eyebrow: 'TRAVEL CREW', headline: 'Bring someone next year.' },
  close: { eyebrow: 'END OF ISSUE', headline: 'That was the year.' },
};

function hours(value: number): string {
  return `${String(value).padStart(2, '0')}:00`;
}

function barHeights(values?: number[]): number[] {
  const bars = values && values.length === 24 ? values : new Array<number>(24).fill(0);
  const max = Math.max(1, ...bars);
  return bars.map((value) => (value ? Math.max(0.06, value / max) : 0.06));
}

function months(values?: number[]): number[] {
  const list = values && values.length === 12 ? values : new Array<number>(12).fill(0);
  const max = Math.max(1, ...list);
  return list.map((value) => (value ? Math.max(0.08, value / max) : 0.08));
}

function MapPoster({ chapter }: { chapter: Chapter }) {
  const t = useT();
  const map = chapter.map;
  if (!map) return null;
  const labels = [...map.stops].sort((a, b) => b.count - a.count).slice(0, 3);

  return (
    <div className="issue-map">
      <div className="issue-map__figure">
        <svg viewBox="0 0 100 100" role="img" aria-label={t('Map of your year')} preserveAspectRatio="none">
          {map.routes.map((route) => {
            const dx = route.to.x - route.from.x;
            const dy = route.to.y - route.from.y;
            const length = Math.max(1, Math.hypot(dx, dy));
            const bend = Math.min(6, length * 0.14);
            const mx = (route.from.x + route.to.x) / 2 - (dy / length) * bend;
            const my = (route.from.y + route.to.y) / 2 + (dx / length) * bend;
            return (
              <path
                key={`${route.from.id}-${route.to.id}-${route.count}`}
                d={`M ${route.from.x} ${route.from.y} Q ${mx} ${my} ${route.to.x} ${route.to.y}`}
                className={route.top ? 'is-top' : undefined}
                style={{ '--w': route.top ? 1.3 : 0.28 + Math.min(0.6, route.count / 22) } as CSSProperties}
              />
            );
          })}
          {map.stops.map((stop) => (
            <circle
              key={stop.id}
              cx={stop.x}
              cy={stop.y}
              r={stop.id === map.topStopId ? 2.2 : 0.65 + Math.min(1.1, stop.count * 0.11)}
              className={stop.id === map.topStopId ? 'is-top' : undefined}
            />
          ))}
          {labels.map((stop) => {
            const right = stop.x < 62;
            return (
              <text
                key={stop.id}
                x={stop.x + (right ? 2.4 : -2.4)}
                y={stop.y - 2}
                textAnchor={right ? 'start' : 'end'}
                className={stop.id === map.topStopId ? 'is-top' : undefined}
              >
                {stop.name.replace(/ Station$/, '')}
              </text>
            );
          })}
        </svg>
        <span className="issue-map__stamp">THE NETHERLANDS<br />ACCORDING TO YOU</span>
      </div>
      <div className="issue-map__side">
        <p className="issue-map__big">{chapter.big}</p>
        <p className="issue-map__line">{chapter.line}</p>
        <dl className="issue-map__legend">
          <div>
            <dt>Most used line</dt>
            <dd>{map.topLine ?? 'not enough journeys'}</dd>
          </div>
          <div>
            <dt>Top station</dt>
            <dd>{map.stops.find((stop) => stop.id === map.topStopId)?.name ?? 'not enough journeys'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function DistancePoster({ chapter }: { chapter: Chapter }) {
  const distance = chapter.distance;
  if (!distance) return null;
  const carWidth = 100;
  const transitWidth = Math.max(2, Math.min(100, (distance.transitKg / Math.max(1, distance.carKg)) * 100));

  return (
    <div className="issue-distance">
      <p className="issue-distance__figure">
        {KILOMETRES.format(distance.km)}
        <span>KM</span>
      </p>
      <p className="issue-distance__lead">
        Straight-line distance between the stops OVVO could place. Illustration, not a measurement.
      </p>
      <div className="issue-distance__bars">
        <div className="issue-distance__row">
          <span>BY CAR</span>
          <strong>{NUMBER.format(distance.carKg)} kg CO₂e</strong>
          <i style={{ width: `${carWidth}%` }} />
        </div>
        <div className="issue-distance__row issue-distance__row--transit">
          <span>BY PUBLIC TRANSPORT</span>
          <strong>{NUMBER.format(distance.transitKg)} kg CO₂e</strong>
          <i style={{ width: `${transitWidth}%` }} />
        </div>
      </div>
      <p className="issue-distance__saved">
        <strong>{NUMBER.format(distance.avoidedKg)} kg</strong> less than driving, if these trips replaced car journeys.
      </p>
      <p className="issue-distance__note">
        Counted {distance.knownRuns} of {distance.totalRuns} journeys. Petrol car at 170 g CO₂e per km; public
        transport at 50 g per passenger-km, straight-line. OVVO did not see you travel.
      </p>
    </div>
  );
}

function RoutePoster({ chapter }: { chapter: Chapter }) {
  const route = chapter.route;
  if (!route) return null;
  return (
    <div className="issue-pair">
      <div className="issue-pair__stations">
        <span>{route.from}</span>
        <i aria-hidden="true" />
        <span>{route.to}</span>
      </div>
      <div className="issue-pair__count">
        <strong>{chapter.count ?? route.count}</strong>
        <em>times</em>
      </div>
      <p>{chapter.line}</p>
    </div>
  );
}

function OriginPoster({ chapter }: { chapter: Chapter }) {
  return (
    <div className="issue-origin">
      <div className="issue-origin__left">
        <p className="issue-origin__station">{chapter.big}</p>
        <p className="issue-origin__line">{chapter.line}</p>
      </div>
      <div className="issue-origin__board">
        <span className="issue-origin__board-head">DEPARTURES / ORIGIN</span>
        {chapter.chips?.map((chip, index) => (
          <div className="issue-origin__row" key={chip.label}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{chip.label}</strong>
            <em>{chip.detail}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function HourPoster({ chapter }: { chapter: Chapter }) {
  const bars = barHeights(chapter.bars);
  return (
    <div className="issue-hour">
      <div className="issue-hour__hero">
        <p className="issue-hour__time">{chapter.big}</p>
        <p>{chapter.line}</p>
      </div>
      <div className="issue-hour__chart" aria-hidden="true">
        {bars.map((height, hour) => (
          <span
            key={hour}
            className={hour === chapter.peak ? 'is-peak' : undefined}
            style={{ '--h': height } as CSSProperties}
          >
            <i />
            {hour % 3 === 0 ? <em>{String(hour).padStart(2, '0')}</em> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

function DirectPoster({ chapter }: { chapter: Chapter }) {
  const share = Math.round((chapter.arc ?? 0) * 100);
  return (
    <div className="issue-direct">
      <p className="issue-direct__figure">{share}<span>%</span></p>
      <div className="issue-direct__bar" aria-hidden="true">
        <i style={{ width: `${share}%` }} />
      </div>
      <p className="issue-direct__lead">{chapter.line}</p>
      <span className="issue-direct__stamp">STRAIGHT<br />THROUGH</span>
    </div>
  );
}

function LongestPoster({ chapter }: { chapter: Chapter }) {
  const route = chapter.route;
  return (
    <div className="issue-longest">
      <p className="issue-longest__figure">{chapter.big}</p>
      <div className="issue-longest__rail" aria-hidden="true">
        <i />
        <b />
        <b />
      </div>
      {route ? (
        <div className="issue-longest__ends">
          <span>{route.from}</span>
          <span>{route.to}</span>
        </div>
      ) : null}
      <p className="issue-longest__lead">{chapter.line}</p>
    </div>
  );
}

function LookPoster({ chapter, year }: { chapter: Chapter; year: number }) {
  return (
    <div className={`issue-look${chapter.photo ? '' : ' issue-look--no-photo'}`}>
      {chapter.photo ? <img src={chapter.photo} alt="" /> : null}
      <div className="issue-look__caption">
        <span>THE LOOK / {year}</span>
        <strong>{chapter.big}</strong>
        <em>{chapter.count} days</em>
      </div>
    </div>
  );
}

function ErasPoster({ chapter }: { chapter: Chapter }) {
  const eras = chapter.eras ?? [];
  return (
    <div className="issue-eras">
      <div className="issue-eras__head">
        <p className="issue-eras__count">{eras.length}</p>
        <p className="issue-eras__lead">{chapter.line}</p>
      </div>
      <div className="issue-eras__rows">
        {eras.map((era, index) => (
          <div className="issue-eras__row" key={`${era.id}-${era.start}`} style={{ '--n': index } as CSSProperties}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{era.name}</strong>
            <em>{SHORT_DATE.format(new Date(era.start))} to {SHORT_DATE.format(new Date(era.end))}</em>
            <b>{era.days} days</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinesPoster({ chapter }: { chapter: Chapter }) {
  return (
    <div className="issue-lines">
      <div className="issue-lines__hero">
        <p className="issue-lines__name">{chapter.big}</p>
        <p className="issue-lines__count">
          <strong>{chapter.count ?? 0}</strong>
          <span>journeys on this line</span>
        </p>
      </div>
      <div className="issue-lines__ledger">
        {chapter.chips?.map((chip) => (
          <div key={chip.label}>
            <strong>{chip.label}</strong>
            <span>{chip.detail}</span>
          </div>
        ))}
        <div>
          <span>Stops hearted</span>
          <strong>{chapter.hearts ?? 0}</strong>
        </div>
        <div>
          <span>Boards pinned</span>
          <strong>{chapter.boards ?? 0}</strong>
        </div>
      </div>
    </div>
  );
}

function AwardsPoster({ chapter }: { chapter: Chapter }) {
  return (
    <div className="issue-awards">
      {chapter.awards?.slice(0, 4).map((award, index) => (
        <article className="issue-award" key={award.id} style={{ '--n': index } as CSSProperties}>
          <span className="issue-award__number">{String(index + 1).padStart(2, '0')}</span>
          <p className="issue-award__stat">{award.stat}</p>
          <h2>{award.title}</h2>
          <p>{award.line}</p>
          <span className="issue-award__label">{award.statLabel}</span>
        </article>
      ))}
    </div>
  );
}

function BookendsPoster({ chapter }: { chapter: Chapter }) {
  const bookends = chapter.bookends;
  if (!bookends) return null;
  return (
    <div className="issue-bookends">
      {[
        { label: 'FIRST JOURNEY', data: bookends.first },
        { label: 'LAST JOURNEY', data: bookends.last },
      ].map(({ label, data }, index) => (
        <article className="issue-bookend" key={label} style={{ '--n': index } as CSSProperties}>
          <span>{label}</span>
          <time>{SHORT_DATE.format(new Date(data.at))}</time>
          <div className="issue-bookend__route">
            <strong>{data.from}</strong>
            <b aria-hidden="true">→</b>
            <strong>{data.to}</strong>
          </div>
          <em>Wanted to leave at {hours(data.hour)}</em>
        </article>
      ))}
    </div>
  );
}

function ComparisonPoster({ chapter }: { chapter: Chapter }) {
  const data = chapter.comparison;
  if (!data) return null;
  const diff = data.journeys - data.previousJourneys;
  return (
    <div className="issue-comparison">
      <div className="issue-comparison__hero">
        <p className="issue-comparison__diff">{diff >= 0 ? '+' : ''}{diff} <span>journeys</span></p>
        <p>{chapter.line}</p>
      </div>
      <div className="issue-comparison__score">
        <div>
          <span>{data.journeys}</span>
          <em>{data.previousYear + 1}</em>
        </div>
        <div>
          <span>{data.previousJourneys}</span>
          <em>{data.previousYear}</em>
        </div>
      </div>
      <div className="issue-comparison__stats">
        <div><span>New stations</span><strong>{data.newStationCount}</strong></div>
        <div><span>Old favourites</span><strong>{data.returningStations}</strong></div>
        <div><span>Looks that survived</span><strong>{data.survivedThemes.length}</strong></div>
      </div>
    </div>
  );
}

function CrewPoster({ chapter, year }: { chapter: Chapter; year: number }) {
  const crew = chapter.crew;
  if (!crew) return null;
  return (
    <div className="issue-crew">
      <div className="issue-crew__passport">
        <span className="issue-crew__type">OVVO / TRAVEL CREW</span>
        <strong className="issue-crew__year">{year}</strong>
        <p className="issue-crew__code">OVVO-{year}-{String(crew.journeys).padStart(3, '0')}</p>
        <dl>
          <div><dt>Journeys</dt><dd>{crew.journeys}</dd></div>
          <div><dt>Top line</dt><dd>{crew.topLine ?? 'not enough journeys'}</dd></div>
          <div><dt>Season</dt><dd>{crew.era ?? 'no era stood out'}</dd></div>
        </dl>
        <span className="issue-crew__stamp">ADMIT ONE</span>
      </div>
      <div className="issue-crew__copy">
        <p>{chapter.line}</p>
        <span>Share the issue with someone who was there.</span>
      </div>
    </div>
  );
}

export function WrappedIssue({
  chapter,
  index,
  total,
  year,
  count,
  demo,
  yearOver,
  onBegin,
}: {
  chapter: Chapter;
  index: number;
  total: number;
  year: number;
  count: number;
  demo: boolean;
  yearOver: boolean;
  onBegin: () => void;
}) {
  const copy = COPY[chapter.id] ?? { eyebrow: chapter.kicker, headline: chapter.line };
  const meta = (
    <div className="issue-meta">
      <span>OVVO YEARBOOK</span>
      <span>ISSUE {String(year).slice(2)}</span>
      <span>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
    </div>
  );

  if (chapter.kind === 'cover') {
    return (
      <div className="issue-page issue-page--cover">
        <div className="issue-cover__top">
          <span>OVVO YEARBOOK</span>
          <span>ISSUE {String(year).slice(2)}</span>
          <span>THE YEAR IN TRANSIT</span>
        </div>
        <div className="issue-cover__title" aria-label={String(year)}>
          <span>{year}</span>
        </div>
        <p className="issue-cover__issue">THE TRANSIT ISSUE</p>
        <div className="issue-cover__bottom">
          <p>
            Every journey you planned, printed once.
            {!yearOver ? ' This is the year so far.' : ''}
            {demo ? ' Demo year: none of this is real, and none of it is stored.' : ''}
          </p>
          <button type="button" className="issue-begin" onClick={onBegin}>
            <span>OPEN THE ISSUE</span>
            <b aria-hidden="true">→</b>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`issue-page issue-page--${chapter.id} issue-page--kind-${chapter.kind}`}>
      {meta}
      {chapter.kind === 'close' ? <span className="issue-close__tag">END OF ISSUE / {year}</span> : null}
      {chapter.kind !== 'close' ? (
        <header className="issue-head">
          <span>{copy.eyebrow}</span>
          <h1>{copy.headline}</h1>
        </header>
      ) : null}

      {chapter.kind === 'number' ? (
        <div className="issue-total">
          <p className="issue-total__figure">{count}</p>
          <p className="issue-total__line">{chapter.line}</p>
          <div className="issue-total__chart" aria-hidden="true">
            {months(chapter.months).map((height, month) => (
              <span key={month} style={{ '--h': height } as CSSProperties}>
                <i />
                <em>{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][month]}</em>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {chapter.kind === 'name' ? (
        <div className="issue-name">
          <p className="issue-name__figure">{chapter.big}</p>
          <p className="issue-name__line">{chapter.line}</p>
          <div className="issue-name__stamps">
            {chapter.chips?.map((chip) => (
              <span key={chip.label}><b>{chip.label}</b>{chip.detail}</span>
            ))}
          </div>
        </div>
      ) : null}

      {chapter.kind === 'map' ? <MapPoster chapter={chapter} /> : null}
      {chapter.kind === 'distance' ? <DistancePoster chapter={chapter} /> : null}
      {chapter.kind === 'route' && chapter.id === 'pair' ? <RoutePoster chapter={chapter} /> : null}
      {chapter.kind === 'chips' && chapter.id === 'origin' ? <OriginPoster chapter={chapter} /> : null}
      {chapter.kind === 'bars' ? <HourPoster chapter={chapter} /> : null}
      {chapter.kind === 'arc' ? <DirectPoster chapter={chapter} /> : null}
      {chapter.kind === 'stretch' ? <LongestPoster chapter={chapter} /> : null}
      {chapter.kind === 'word' ? <LookPoster chapter={chapter} year={year} /> : null}
      {chapter.kind === 'eras' ? <ErasPoster chapter={chapter} /> : null}
      {chapter.kind === 'chips' && chapter.id === 'lines' ? <LinesPoster chapter={chapter} /> : null}
      {chapter.kind === 'awards' ? <AwardsPoster chapter={chapter} /> : null}
      {chapter.kind === 'bookends' ? <BookendsPoster chapter={chapter} /> : null}
      {chapter.kind === 'comparison' ? <ComparisonPoster chapter={chapter} /> : null}
      {chapter.kind === 'crew' ? <CrewPoster chapter={chapter} year={year} /> : null}
      {chapter.kind === 'close' ? (
        <div className="issue-close">
          <p>{chapter.big}</p>
          <p>{chapter.line}</p>
          {chapter.note ? <span>{chapter.note}</span> : null}
        </div>
      ) : null}

      {chapter.note && chapter.kind !== 'close' ? <p className="issue-note">{chapter.note}</p> : null}
    </div>
  );
}
