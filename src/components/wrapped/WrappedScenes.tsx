import { Fragment } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Chapter } from '../../lib/wrappedDeck';

/*
 * **The year as a film, not a spread.**
 *
 * The reference is full-bleed motion: one sentence, one figure, a saturated moving ground, and a
 * story that only makes sense in order. This renderer follows that grammar. Each chapter is a beat
 * with its own choreography: the kicker arrives, the words land one at a time, the number counts,
 * the sentence explains, and a quiet bridge hands the viewer to the next beat.
 *
 * The old deck put every line on screen at once. That is why it read as a slideshow even when the
 * backgrounds moved. Here the copy has a pulse, and the pulse is the story.
 *
 * Navigation is outside this file. The tap halves, arrows, Escape, close, sound and Begin stay in
 * `WrappedPage`.
 */

export type Palette = [string, string, string];

const EMBER: Palette = ['#ff2d75', '#ff4b2b', '#ff9d00'];
const ACID: Palette = ['#ff3b1f', '#7dff00', '#00b34a'];
const VIOLET: Palette = ['#5a2bff', '#0066ff', '#00d9ff'];
const GOLD: Palette = ['#ffb000', '#ff4b2b', '#ff2d75'];
const ICE: Palette = ['#0057ff', '#00c2ff', '#6b2bff'];
const LIME: Palette = ['#003b1f', '#00e676', '#b6ff00'];
const HOT: Palette = ['#ff1744', '#ff6d00', '#ffea00'];
const SKY: Palette = ['#0066ff', '#00d4ff', '#b8ff00'];

const NUMBER = new Intl.NumberFormat('en-GB');
const KILOMETRES = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
const SHORT_DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

/*
 * **The bridge is the thread.**
 *
 * A chapter on its own is a fact. The line at the bottom is what turns eighteen facts into a year:
 * it looks back at what just landed, then leans into the next beat. This is the part the last
 * version did not have at all.
 */
const STORY: Record<string, { kicker: string; bridge: string }> = {
  total: { kicker: 'A year of leaving', bridge: 'It began with one journey. Then another.' },
  name: { kicker: 'The pattern has a name', bridge: 'The year gave the pattern a name.' },
  map: { kicker: 'The shape of the year', bridge: 'And the pattern had a shape.' },
  distance: { kicker: 'The long way round', bridge: 'A shape that kept getting bigger.' },
  pair: { kicker: 'The line you wore out', bridge: 'But it kept folding back to the same line.' },
  origin: { kicker: 'The door you kept returning to', bridge: 'Every loop passed through the same door.' },
  hour: { kicker: 'The hour that owned you', bridge: 'At almost the same time each morning.' },
  direct: { kicker: 'The straight-through', bridge: 'You learned which changes to avoid.' },
  longest: { kicker: 'The one that took its time', bridge: 'Then one day, the usual route let go.' },
  look: { kicker: 'The year had a look', bridge: 'The year changed its clothes as it went.' },
  eras: { kicker: 'It changed with the seasons', bridge: 'Underneath, though, the same traveller.' },
  lines: { kicker: 'One line saw most of it', bridge: 'One line carried most of it.' },
  awards: { kicker: "The year's small trophies", bridge: 'The year noticed the details.' },
  bookends: { kicker: 'First out. Last home.', bridge: 'It opened in one place. It closed in another.' },
  comparison: { kicker: 'Against last year', bridge: 'And the next year is already different.' },
  crew: { kicker: 'The other seat', bridge: 'A year is better with someone beside you.' },
  close: { kicker: 'End of the year', bridge: 'That was the year.' },
};

export const PALETTES: Record<string, Palette> = {
  cover: EMBER,
  total: LIME,
  name: ACID,
  map: HOT,
  distance: SKY,
  pair: EMBER,
  origin: ACID,
  hour: GOLD,
  direct: VIOLET,
  longest: HOT,
  look: GOLD,
  eras: GOLD,
  lines: LIME,
  awards: HOT,
  bookends: ICE,
  comparison: LIME,
  crew: VIOLET,
  close: SKY,
};

function hours(value: number): string {
  return `${String(value).padStart(2, '0')}:00`;
}

/* Every word is its own little actor, so the sentence lands rather than appears. */
function Words({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="scene-word" style={{ '--i': index } as CSSProperties}>
            {word}
          </span>
          {index < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  );
}

function MapAtlas({ map }: { map: NonNullable<Chapter['map']> }) {
  const topStop = map.stops.find((stop) => stop.id === map.topStopId);
  return (
    <div className="scene-atlas" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <filter id="atlas-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="0.45" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {map.routes.map((route, index) => (
          <line
            key={`${route.from.id}-${route.to.id}-${index}`}
            className={route.top ? 'scene-atlas__route is-top' : 'scene-atlas__route'}
            pathLength="100"
            style={{ '--i': index } as CSSProperties}
            x1={route.from.x}
            y1={route.from.y}
            x2={route.to.x}
            y2={route.to.y}
          />
        ))}
        {map.stops.map((stop) => (
          <g className={stop.id === map.topStopId ? 'scene-atlas__stop is-top' : 'scene-atlas__stop'} style={{ '--i': map.stops.indexOf(stop) } as CSSProperties} key={stop.id}>
            <circle cx={stop.x} cy={stop.y} r={stop.id === map.topStopId ? 1.25 : 0.62} />
            <circle className="scene-atlas__ring" cx={stop.x} cy={stop.y} r={stop.id === map.topStopId ? 2.5 : 1.25} />
          </g>
        ))}
        {topStop ? (
          <text className="scene-atlas__label" x={topStop.x + 2.6} y={topStop.y + 0.5}>
            {topStop.name}
          </text>
        ) : null}
      </svg>
    </div>
  );
}

function SceneArt({ chapter }: { chapter: Chapter }) {
  if (chapter.kind === 'map' || (chapter.kind === 'word' && chapter.photo)) return null;

  if (chapter.kind === 'number') {
    const months = chapter.months?.length ? chapter.months : Array.from({ length: 12 }, () => 0);
    const max = Math.max(1, ...months);
    return (
      <div className="scene-art scene-art--total" aria-hidden="true">
        <div className="scene-art__panel">
          <div className="art-months">
            {months.map((value, index) => (
              <span
                className={`art-months__bar${value === max ? ' is-peak' : ''}`}
                style={{ '--h': `${Math.max(4, (value / max) * 100)}%`, '--i': index } as CSSProperties}
                key={index}
              >
                <em>{'JFMAMJJASOND'[index]}</em>
              </span>
            ))}
          </div>
          <p className="art-caption">A month at a time</p>
        </div>
      </div>
    );
  }

  if (chapter.kind === 'distance' && chapter.distance) {
    return (
      <div className="scene-art scene-art--distance" aria-hidden="true">
        <div className="scene-art__panel">
          <p className="art-caption">{KILOMETRES.format(chapter.distance.km)} km, as the crow flies</p>
        </div>
      </div>
    );
  }

  if (chapter.kind === 'route' && chapter.route) {
    return (
      <div className="scene-art scene-art--pair" aria-hidden="true">
        <div className="scene-art__panel">
          <div className="art-rail">
            <span className="art-rail__node" />
            <span className="art-rail__line"><i /></span>
            <span className="art-rail__node" />
          </div>
          <p className="art-caption">{chapter.route.from} <span>to</span> {chapter.route.to}</p>
        </div>
      </div>
    );
  }

  if (chapter.kind === 'chips' && chapter.id === 'origin') {
    return (
      <div className="scene-art scene-art--origin" aria-hidden="true">
        <div className="scene-art__panel">
          <div className="art-origins">
            {chapter.chips?.slice(0, 4).map((chip, index) => (
              <span className="art-origins__row" style={{ '--i': index } as CSSProperties} key={chip.label}>
                <b>{chip.label}</b><em>{chip.detail}</em>
              </span>
            ))}
          </div>
          <p className="art-caption">The other doors</p>
        </div>
      </div>
    );
  }

  if (chapter.kind === 'bars') {
    const bars = chapter.bars ?? Array.from({ length: 24 }, () => 0);
    const peak = chapter.peak ?? 0;
    const max = Math.max(1, ...bars);
    return (
      <div className="scene-art scene-art--hour" aria-hidden="true">
        <div className="scene-art__panel">
          <svg className="art-svg art-dial" viewBox="0 0 200 200">
            {bars.map((value, index) => {
              const angle = ((index / 24) * 360 - 90) * (Math.PI / 180);
              const inner = 53;
              const outer = 53 + 36 * (value / max);
              return (
                <line
                  className={index === peak ? 'art-dial__line is-peak' : 'art-dial__line'}
                  style={{ '--i': index } as CSSProperties}
                  key={index}
                  x1={100 + Math.cos(angle) * inner}
                  y1={100 + Math.sin(angle) * inner}
                  x2={100 + Math.cos(angle) * outer}
                  y2={100 + Math.sin(angle) * outer}
                />
              );
            })}
            <circle className="art-dial__ring" cx="100" cy="100" r="43" />
            <text className="art-dial__label" x="100" y="97" textAnchor="middle">24 HOURS</text>
            <text className="art-dial__value" x="100" y="113" textAnchor="middle">{chapter.big}</text>
          </svg>
          <p className="art-caption">When the year left</p>
        </div>
      </div>
    );
  }

  if (chapter.kind === 'arc') {
    const pct = Math.round((chapter.arc ?? 0) * 100);
    return (
      <div className="scene-art scene-art--arc" aria-hidden="true">
        <div className="scene-art__panel">
          <svg className="art-svg art-gauge" viewBox="0 0 120 120">
            <circle className="art-gauge__track" cx="60" cy="60" r="50" />
            <circle className="art-gauge__value" pathLength="100" cx="60" cy="60" r="50" style={{ strokeDasharray: `${pct} 100`, strokeDashoffset: 100 }} />
            <text className="art-gauge__label" x="60" y="57" textAnchor="middle">NO</text>
            <text className="art-gauge__value-text" x="60" y="70" textAnchor="middle">CHANGES</text>
          </svg>
          <p className="art-caption">No changes, no detours</p>
        </div>
      </div>
    );
  }

  if (chapter.kind === 'stretch' && chapter.route) {
    return (
      <div className="scene-art scene-art--longest" aria-hidden="true">
        <div className="scene-art__panel">
          <svg className="art-svg art-long" viewBox="0 0 100 60" preserveAspectRatio="none">
            <path className="art-long__path" d="M 3 47 C 26 21, 42 3, 55 29 S 81 47, 97 17" />
            <circle className="art-long__node" cx="3" cy="47" r="1.7" />
            <circle className="art-long__node" cx="97" cy="17" r="1.7" />
          </svg>
          <p className="art-caption">{chapter.big} on one route</p>
        </div>
      </div>
    );
  }

  if (chapter.kind === 'eras') {
    const eras = chapter.eras ?? [];
    const maxDays = Math.max(1, ...eras.map((era) => era.days));
    return (
      <div className="scene-art scene-art--eras" aria-hidden="true">
        <div className="scene-art__panel">
          <div className="art-eras">
            {eras.slice(0, 8).map((era, index) => (
              <span className="art-eras__block" style={{ '--i': index, flexGrow: Math.max(1, era.days), height: `${Math.max(18, (era.days / maxDays) * 100)}%` } as CSSProperties} key={`${era.id}-${era.start}`}>
                <em>{era.days}</em>
              </span>
            ))}
          </div>
          <p className="art-caption">A year in seasons</p>
        </div>
      </div>
    );
  }

  if (chapter.kind === 'chips' && chapter.id === 'lines') {
    return (
      <div className="scene-art scene-art--lines" aria-hidden="true">
        <div className="scene-art__panel">
          <div className="art-lines">
            {chapter.chips?.slice(0, 4).map((chip, index) => (
              <span className="art-lines__row" style={{ '--i': index } as CSSProperties} key={chip.label}>
                <b>{chip.label}</b><em>{chip.detail}</em>
              </span>
            ))}
          </div>
          <p className="art-caption">The rest of the board</p>
        </div>
      </div>
    );
  }

  if (chapter.kind === 'awards') {
    return (
      <div className="scene-art scene-art--awards" aria-hidden="true">
        <div className="scene-art__panel">
          <p className="art-caption">For the record</p>
        </div>
      </div>
    );
  }

  if (chapter.kind === 'bookends' && chapter.bookends) {
    return (
      <div className="scene-art scene-art--bookends" aria-hidden="true">
        <div className="scene-art__panel">
          <div className="art-bookend">
            <span className="art-bookend__line" />
            <span className="art-bookend__dot is-first" />
            <span className="art-bookend__dot is-last" />
            <em>{SHORT_DATE.format(new Date(chapter.bookends.first.at))}</em>
            <em>{SHORT_DATE.format(new Date(chapter.bookends.last.at))}</em>
          </div>
          <p className="art-caption">The first and the last</p>
        </div>
      </div>
    );
  }

  if (chapter.kind === 'comparison' && chapter.comparison) {
    return (
      <div className="scene-art scene-art--comparison" aria-hidden="true">
        <div className="scene-art__panel">
          <p className="art-caption">Two years, side by side</p>
        </div>
      </div>
    );
  }

  if (chapter.kind === 'crew' && chapter.crew) {
    return (
      <div className="scene-art scene-art--crew" aria-hidden="true">
        <div className="scene-art__panel">
          <div className="art-crew">
            <span className="art-crew__ring is-you">YOU</span>
            <span className="art-crew__line" />
            <span className="art-crew__ring is-them">THEM</span>
          </div>
          <p className="art-caption">A year is better shared</p>
        </div>
      </div>
    );
  }

  if (chapter.kind === 'close') {
    return (
      <div className="scene-art scene-art--close" aria-hidden="true">
        <div className="scene-art__panel">
          <div className="art-year-ring">
            {Array.from({ length: 12 }, (_, index) => (
              <span className="art-year-ring__tick" style={{ '--i': index } as CSSProperties} key={index} />
            ))}
            <span className="art-year-ring__dot" />
            <em>ONE YEAR</em>
          </div>
          <p className="art-caption">See you next year</p>
        </div>
      </div>
    );
  }

  return null;
}

function Scene({
  chapter,
  palette,
  children,
  bridge,
  photo,
  atlas,
  align = 'center',
}: {
  chapter: Chapter;
  palette: Palette;
  children: ReactNode;
  bridge?: string;
  photo?: string;
  atlas?: ReactNode;
  align?: 'center' | 'bottom';
}) {
  return (
    <div
      className={`scene-page scene-page--${chapter.id} scene-page--align-${align}`}
      data-motion={photo ? 'photo' : 'world'}
    >
      {photo ? (
        <>
          <img className="scene-photo" src={photo} alt="" aria-hidden="true" />
          <span className="scene-photo__shade" aria-hidden="true" />
        </>
      ) : null}
      {atlas ?? <SceneArt chapter={chapter} />}
      <span
        className="scene-cut"
        style={{ background: `linear-gradient(150deg, ${palette[0]}, ${palette[1]} 55%, ${palette[2]})` }}
        aria-hidden="true"
      />
      <span className="scene-shade" aria-hidden="true" />
      <div className="scene-copy">
        {children}
        {bridge ? (
          <p className="scene-bridge">
            <Words text={bridge} />
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SceneView({
  chapter,
  year,
  count,
  journeys,
  demo,
  yearOver,
  onBegin,
}: {
  chapter: Chapter;
  year: number;
  count: number;
  journeys: number;
  demo: boolean;
  yearOver: boolean;
  onBegin: () => void;
}) {
  const story = STORY[chapter.id] ?? { kicker: chapter.kicker, bridge: '' };
  const palette = PALETTES[chapter.id] ?? EMBER;

  if (chapter.kind === 'cover') {
    return (
      <div className="scene-page scene-page--cover" data-motion="world">
        <span
          className="scene-cut"
          style={{ background: `linear-gradient(150deg, ${EMBER[0]}, ${EMBER[1]} 55%, ${EMBER[2]})` }}
          aria-hidden="true"
        />
        <span className="scene-shade" aria-hidden="true" />
        <div className="scene-copy scene-cover">
          <span className="scene-presents">OVVO PRESENTS</span>
          <p className="scene-hello">Hi there.</p>
          <span className="scene-kicker">OVVO YEARBOOK</span>
          <p className="scene-year" aria-label={String(year)}>
            {String(year)
              .split('')
              .map((letter, index) => (
                <span className="scene-char" style={{ '--i': index } as CSSProperties} key={`${letter}-${index}`}>
                  {letter}
                </span>
              ))}
          </p>
          <p className="scene-sub">Your year, in motion.</p>
          <button type="button" className="scene-begin" onClick={onBegin}>
            Begin
          </button>
          <p className="scene-small">
            {!yearOver ? 'This is the year so far. ' : ''}
            {demo ? 'Demo year. None of this is stored.' : ''}
          </p>
        </div>
      </div>
    );
  }

  if (chapter.kind === 'number') {
    return (
      <Scene
        chapter={chapter}
        palette={palette}
       
        bridge={story.bridge}
      >
        <span className="scene-kicker">{story.kicker}</span>
        <p className="scene-big scene-big--number" aria-label={`${count} journeys`}>
          <span className="scene-count">{count}</span>
        </p>
        <p className="scene-sub">
          <Words text={count === 1 ? 'journey, planned one at a time.' : 'journeys, planned one at a time.'} />
        </p>
      </Scene>
    );
  }

  if (chapter.kind === 'name') {
    return (
      <Scene chapter={chapter} palette={palette} bridge={story.bridge}>
        <span className="scene-kicker">{story.kicker}</span>
        <p className="scene-big scene-big--name">
          <Words text={chapter.big} />
        </p>
        <p className="scene-sub">
          <Words text={chapter.line} />
        </p>
      </Scene>
    );
  }

  if (chapter.kind === 'map') {
    return (
      <Scene chapter={chapter} palette={palette} bridge={story.bridge} atlas={chapter.map ? <MapAtlas map={chapter.map} /> : null}>
        <span className="scene-kicker">{story.kicker}</span>
        <p className="scene-big scene-big--number">
          <Words text={String(chapter.map?.places ?? chapter.big)} />
        </p>
        <p className="scene-sub">
          <Words text="places, connected by your year." />
        </p>
        {chapter.map?.topLine ? (
          <p className="scene-foot">Most used line: {chapter.map.topLine}</p>
        ) : null}
      </Scene>
    );
  }

  if (chapter.kind === 'distance' && chapter.distance) {
    return (
      <Scene chapter={chapter} palette={palette} bridge={story.bridge}>
        <span className="scene-kicker">{story.kicker}</span>
        <p className="scene-big">
          <Words text={KILOMETRES.format(chapter.distance.km)} />
        </p>
        <p className="scene-sub">
          <Words text="kilometres, as the crow flies." />
        </p>
        <p className="scene-foot">About {NUMBER.format(chapter.distance.avoidedKg)} kg CO₂e less than driving.</p>
      </Scene>
    );
  }

  if (chapter.kind === 'route' && chapter.route) {
    return (
      <Scene chapter={chapter} palette={palette} bridge={story.bridge}>
        <span className="scene-kicker">{story.kicker}</span>
        <p className="scene-big scene-big--number" aria-label={`${count} times`}>
          <span className="scene-count">{count}</span>
        </p>
        <p className="scene-sub">
          <Words text={chapter.line} />
        </p>
        <p className="scene-route">
          {chapter.route.from}
          <span aria-hidden="true">↔</span>
          {chapter.route.to}
        </p>
      </Scene>
    );
  }

  if (chapter.kind === 'chips' && chapter.id === 'origin') {
    return (
      <Scene chapter={chapter} palette={palette} bridge={story.bridge}>
        <span className="scene-kicker">{story.kicker}</span>
        <p className="scene-big scene-big--station">
          <Words text={chapter.big} />
        </p>
        <p className="scene-sub">
          <Words text={chapter.line} />
        </p>
      </Scene>
    );
  }

  if (chapter.kind === 'bars') {
    return (
      <Scene chapter={chapter} palette={palette} bridge={story.bridge}>
        <span className="scene-kicker">{story.kicker}</span>
        <p className="scene-big">
          <Words text={chapter.big} />
        </p>
        <p className="scene-sub">
          <Words text="was your busiest hour to leave." />
        </p>
      </Scene>
    );
  }

  if (chapter.kind === 'arc') {
    const pct = Math.round((chapter.arc ?? 0) * 100);
    return (
      <Scene chapter={chapter} palette={palette} bridge={story.bridge}>
        <span className="scene-kicker">{story.kicker}</span>
        <p className="scene-big" aria-label={`${pct} percent`}>
          <Words text={`${pct}%`} />
        </p>
        <p className="scene-sub">
          <Words text="of your journeys had no changes at all." />
        </p>
      </Scene>
    );
  }

  if (chapter.kind === 'stretch') {
    return (
      <Scene chapter={chapter} palette={palette} bridge={story.bridge}>
        <span className="scene-kicker">{story.kicker}</span>
        <p className="scene-big scene-big--duration">
          <Words text={chapter.big} />
        </p>
        <p className="scene-sub">
          <Words text="the longest journey you planned." />
        </p>
        {chapter.route ? (
          <p className="scene-route">
            {chapter.route.from}
            <span aria-hidden="true">↓</span>
            {chapter.route.to}
          </p>
        ) : null}
      </Scene>
    );
  }

  if (chapter.kind === 'word') {
    return (
      <Scene
        chapter={chapter}
        photo={chapter.photo}
        palette={palette}
       
        align="bottom"
        bridge={story.bridge}
      >
        <span className="scene-kicker">{story.kicker}</span>
        <p className="scene-big scene-big--look">
          <Words text={chapter.big} />
        </p>
        <p className="scene-sub">
          <Words text={`${chapter.count ?? count} days in this look.`} />
        </p>
      </Scene>
    );
  }

  if (chapter.kind === 'eras') {
    const eras = chapter.eras ?? [];
    return (
      <Scene chapter={chapter} palette={palette} bridge={story.bridge}>
        <span className="scene-kicker">{story.kicker}</span>
        <p className="scene-big">
          <Words text={String(chapter.big)} />
        </p>
        <p className="scene-sub">
          <Words text="one look after another." />
        </p>
        <div className="scene-list scene-list--tight">
          {eras.map((era, index) => (
            <div className="scene-row" style={{ '--i': index } as CSSProperties} key={`${era.id}-${era.start}`}>
              <span className="scene-row__rank">{String(index + 1).padStart(2, '0')}</span>
              <span className="scene-row__title">{era.name}</span>
              <span className="scene-row__stat">{era.days}d</span>
            </div>
          ))}
        </div>
      </Scene>
    );
  }

  if (chapter.kind === 'chips' && chapter.id === 'lines') {
    return (
      <Scene chapter={chapter} palette={palette} bridge={story.bridge}>
        <span className="scene-kicker">{story.kicker}</span>
        <p className="scene-big">
          <Words text={chapter.big} />
        </p>
        <p className="scene-sub">
          <Words text={`${chapter.count ?? count} journeys on this line.`} />
        </p>
        <p className="scene-foot">
          {chapter.hearts ?? 0} stops hearted. {chapter.boards ?? 0} boards pinned.
        </p>
      </Scene>
    );
  }

  if (chapter.kind === 'awards') {
    return (
      <Scene chapter={chapter} palette={palette} bridge={story.bridge}>
        <span className="scene-kicker">{story.kicker}</span>
        <p className="scene-big scene-big--list">
          <Words text="Your top moments" />
        </p>
        <p className="scene-sub">
          <Words text={`${chapter.awards?.length ?? 0} awards your journeys earned.`} />
        </p>
        <div className="scene-list">
          {chapter.awards?.slice(0, 4).map((award, index) => (
            <div className="scene-row" style={{ '--i': index } as CSSProperties} key={award.id}>
              <span className="scene-row__rank">{index + 1}</span>
              <span className="scene-row__title">{award.title}</span>
              <span className="scene-row__stat">{award.stat}</span>
            </div>
          ))}
        </div>
      </Scene>
    );
  }

  if (chapter.kind === 'bookends' && chapter.bookends) {
    return (
      <Scene chapter={chapter} palette={palette} bridge={story.bridge}>
        <span className="scene-kicker">{story.kicker}</span>
        <p className="scene-big scene-big--bookends">
          <Words text="First out. Last home." />
        </p>
        <p className="scene-sub">
          <Words text="The year, in two journeys." />
        </p>
        <div className="scene-list scene-list--tight">
          {[
            { label: 'First', data: chapter.bookends.first },
            { label: 'Last', data: chapter.bookends.last },
          ].map(({ label, data }, index) => (
            <div className="scene-row" style={{ '--i': index } as CSSProperties} key={label}>
              <span className="scene-row__rank">{label}</span>
              <span className="scene-row__title">
                {data.from} → {data.to}
              </span>
              <span className="scene-row__stat">{SHORT_DATE.format(new Date(data.at))}</span>
            </div>
          ))}
        </div>
        <p className="scene-foot">
          Wanted to leave at {hours(chapter.bookends.first.hour)} and {hours(chapter.bookends.last.hour)}.
        </p>
      </Scene>
    );
  }

  if (chapter.kind === 'comparison' && chapter.comparison) {
    const data = chapter.comparison;
    const diff = data.journeys - data.previousJourneys;
    return (
      <Scene chapter={chapter} palette={palette} bridge={story.bridge}>
        <span className="scene-kicker">{story.kicker}</span>
        <p className="scene-big">
          <Words text={diff >= 0 ? `+${diff}` : String(diff)} />
        </p>
        <p className="scene-sub">
          <Words
            text={
              diff === 0
                ? 'journeys. Exactly the same.'
                : diff > 0
                  ? 'more journeys than last year.'
                  : 'fewer journeys than last year.'
            }
          />
        </p>
        <div className="scene-versus">
          <span>{data.journeys}</span>
          <span>{data.previousJourneys}</span>
        </div>
      </Scene>
    );
  }

  if (chapter.kind === 'crew' && chapter.crew) {
    return (
      <Scene chapter={chapter} palette={palette} bridge={story.bridge}>
        <span className="scene-kicker">{story.kicker}</span>
        <p className="scene-big scene-big--crew">
          <Words text="Bring someone" />
        </p>
        <p className="scene-sub">
          <Words text="next year. The year is better shared." />
        </p>
        <p className="scene-code">
          OVVO-{year}-{String(chapter.crew.journeys).padStart(3, '0')}
        </p>
      </Scene>
    );
  }

  return (
    <Scene chapter={chapter} palette={palette} bridge={story.bridge}>
      <span className="scene-kicker">{story.kicker}</span>
      <p className="scene-big scene-big--close">
        <Words text="That was the year." />
      </p>
      <p className="scene-sub">
        <Words text="Every number here comes from journeys you planned in this app, and nothing else." />
      </p>
      {chapter.note ? <p className="scene-foot">{chapter.note}</p> : null}
      <div className="scene-credits">
        <span>PLANNED BY YOU</span>
        <span>{journeys} journeys</span>
        <span>MADE BY OVVO</span>
        <span>Your year, in motion</span>
      </div>
    </Scene>
  );
}


type SceneProps = {
  chapter: Chapter;
  year: number;
  count: number;
  journeys: number;
  demo: boolean;
  yearOver: boolean;
  onBegin: () => void;
};

/*
 * **The scene that is leaving stays under the scene that is arriving.**
 *
 * A cut to black between every chapter is what made the last version feel like a presentation.
 * Here the outgoing picture keeps breathing for less than a second while the new one grows through
 * it, so the film changes scene instead of changing slide.
 */
export function WrappedScenes({ previous, ...scene }: SceneProps & { previous?: Chapter | null }) {
  return (
    <div className="film-stage">
      {previous ? (
        <div className="film-scene film-scene--out" key={`out-${previous.id}`} aria-hidden="true">
          <SceneView {...scene} chapter={previous} />
        </div>
      ) : null}
      <div className="film-scene film-scene--in" key={`in-${scene.chapter.id}`}>
        <SceneView {...scene} />
      </div>
    </div>
  );
}
