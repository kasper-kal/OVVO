import { Fragment } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Chapter } from '../../lib/wrappedDeck';
import { WrappedMotion, type MotionMode } from './WrappedMotion';

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

type Palette = [string, string, string];

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
  total: { kicker: 'It started with one journey', bridge: 'But a number is only the beginning.' },
  name: { kicker: 'The year noticed something', bridge: 'That name came from somewhere.' },
  map: { kicker: 'Your year happened here', bridge: 'This is where it happened.' },
  distance: { kicker: 'You went a long way', bridge: 'The map only tells half the story.' },
  pair: { kicker: 'The route that became a reflex', bridge: 'Some journeys become a habit.' },
  origin: { kicker: 'Every habit has a front door', bridge: 'And one station kept pulling you back.' },
  hour: { kicker: 'And a time it likes best', bridge: 'One hour kept winning.' },
  direct: { kicker: 'The straight-through', bridge: 'You usually took the straight line.' },
  longest: { kicker: 'The one that took its time', bridge: 'Except once.' },
  look: { kicker: 'You had a look', bridge: 'You also had a look.' },
  eras: { kicker: 'The look moved with the seasons', bridge: 'The look did not stay still.' },
  lines: { kicker: 'One line saw most of it', bridge: 'One line knew you best.' },
  awards: { kicker: 'The year handed out awards', bridge: 'So the year handed out awards.' },
  bookends: { kicker: 'The first. The last.', bridge: 'It began and ended with a journey.' },
  comparison: { kicker: 'One more question', bridge: 'And how did it compare?' },
  crew: { kicker: 'One last thing', bridge: 'The year is better shared.' },
  close: { kicker: 'End of the year', bridge: 'See you next year.' },
};

const MODES: Record<string, MotionMode> = {
  cover: 'ribbons',
  total: 'ribbons',
  name: 'stairs',
  map: 'stairs',
  distance: 'wave',
  pair: 'ribbons',
  origin: 'stairs',
  hour: 'wave',
  direct: 'tunnel',
  longest: 'ribbons',
  look: 'bloom',
  eras: 'stairs',
  lines: 'wave',
  awards: 'stairs',
  bookends: 'ribbons',
  comparison: 'bloom',
  crew: 'tunnel',
  close: 'wave',
};

const PALETTES: Record<string, Palette> = {
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

function Scene({
  chapter,
  mode,
  palette,
  still,
  children,
  bridge,
  photo,
  align = 'center',
}: {
  chapter: Chapter;
  mode: MotionMode;
  palette: Palette;
  still: boolean;
  children: ReactNode;
  bridge?: string;
  photo?: string;
  align?: 'center' | 'bottom';
}) {
  return (
    <div
      className={`scene-page scene-page--${chapter.id} scene-page--align-${align}`}
      data-motion={photo ? 'photo' : mode}
    >
      {photo ? (
        <>
          <img className="scene-photo" src={photo} alt="" aria-hidden="true" />
          <span className="scene-photo__shade" aria-hidden="true" />
        </>
      ) : (
        <WrappedMotion mode={mode} palette={palette} still={still} />
      )}
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

export function WrappedScenes({
  chapter,
  year,
  count,
  demo,
  yearOver,
  still,
  onBegin,
}: {
  chapter: Chapter;
  year: number;
  count: number;
  demo: boolean;
  yearOver: boolean;
  still: boolean;
  onBegin: () => void;
}) {
  const story = STORY[chapter.id] ?? { kicker: chapter.kicker, bridge: '' };
  const palette = PALETTES[chapter.id] ?? EMBER;
  const mode = MODES[chapter.id] ?? 'ribbons';

  if (chapter.kind === 'cover') {
    return (
      <div className="scene-page scene-page--cover" data-motion="ribbons">
        <WrappedMotion mode="ribbons" palette={EMBER} still={still} />
        <span
          className="scene-cut"
          style={{ background: `linear-gradient(150deg, ${EMBER[0]}, ${EMBER[1]} 55%, ${EMBER[2]})` }}
          aria-hidden="true"
        />
        <span className="scene-shade" aria-hidden="true" />
        <div className="scene-copy scene-cover">
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
        mode={mode}
        palette={palette}
        still={still}
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
      <Scene chapter={chapter} mode={mode} palette={palette} still={still} bridge={story.bridge}>
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
      <Scene chapter={chapter} mode={mode} palette={palette} still={still} bridge={story.bridge}>
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
      <Scene chapter={chapter} mode={mode} palette={palette} still={still} bridge={story.bridge}>
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
      <Scene chapter={chapter} mode={mode} palette={palette} still={still} bridge={story.bridge}>
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
      <Scene chapter={chapter} mode={mode} palette={palette} still={still} bridge={story.bridge}>
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
      <Scene chapter={chapter} mode={mode} palette={palette} still={still} bridge={story.bridge}>
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
      <Scene chapter={chapter} mode={mode} palette={palette} still={still} bridge={story.bridge}>
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
      <Scene chapter={chapter} mode={mode} palette={palette} still={still} bridge={story.bridge}>
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
        mode={mode}
        palette={palette}
        still={still}
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
      <Scene chapter={chapter} mode={mode} palette={palette} still={still} bridge={story.bridge}>
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
      <Scene chapter={chapter} mode={mode} palette={palette} still={still} bridge={story.bridge}>
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
      <Scene chapter={chapter} mode={mode} palette={palette} still={still} bridge={story.bridge}>
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
      <Scene chapter={chapter} mode={mode} palette={palette} still={still} bridge={story.bridge}>
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
      <Scene chapter={chapter} mode={mode} palette={palette} still={still} bridge={story.bridge}>
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
      <Scene chapter={chapter} mode={mode} palette={palette} still={still} bridge={story.bridge}>
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
    <Scene chapter={chapter} mode={mode} palette={palette} still={still} bridge={story.bridge}>
      <span className="scene-kicker">{story.kicker}</span>
      <p className="scene-big scene-big--close">
        <Words text="That was the year." />
      </p>
      <p className="scene-sub">
        <Words text="Every number here comes from journeys you planned in this app, and nothing else." />
      </p>
      {chapter.note ? <p className="scene-foot">{chapter.note}</p> : null}
    </Scene>
  );
}
