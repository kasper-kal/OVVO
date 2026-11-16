import type { Chapter } from '../../lib/wrappedDeck';
import { WrappedMotion, type MotionMode } from './WrappedMotion';

/*
 * **The year as a film, not a spread.**
 *
 * The reference in the video is full-bleed motion: one sentence, one figure, a saturated moving
 * ground, and nothing else competing for the eye. This renderer follows that grammar. The transit
 * facts are the same ones the app can honestly know; the presentation is no longer a printed page.
 *
 * Navigation is outside this file. The tap halves, arrows, close, sound and Begin stay in
 * `WrappedPage`.
 */

type Palette = [string, string, string];

const EMBER: Palette = ['#ff2d75', '#ff4b2b', '#ff9d00'];
const ACID: Palette = ['#ff3b1f', '#7dff00', '#00b34a'];
const VIOLET: Palette = ['#5a2bff', '#0066ff', '#00d9ff'];
const GOLD: Palette = ['#ffb000', '#ff4b2b', '#ff2d75'];
const ICE: Palette = ['#0057ff', '#00c2ff', '#6b2bff'];

const NUMBER = new Intl.NumberFormat('en-GB');
const KILOMETRES = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
const SHORT_DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

function hours(value: number): string {
  return `${String(value).padStart(2, '0')}:00`;
}

function Scene({
  chapter,
  mode,
  palette,
  still,
  children,
  photo,
  align = 'center',
}: {
  chapter: Chapter;
  mode: MotionMode;
  palette: Palette;
  still: boolean;
  children: React.ReactNode;
  photo?: string;
  align?: 'center' | 'bottom';
}) {
  return (
    <div className={`scene-page scene-page--${chapter.id} scene-page--align-${align}`} data-motion={photo ? 'photo' : mode}>
      {photo ? (
        <>
          <img className="scene-photo" src={photo} alt="" aria-hidden="true" />
          <span className="scene-photo__shade" aria-hidden="true" />
        </>
      ) : (
        <WrappedMotion mode={mode} palette={palette} still={still} />
      )}
      <span className="scene-shade" aria-hidden="true" />
      <div className="scene-copy">{children}</div>
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
  if (chapter.kind === 'cover') {
    return (
      <div className="scene-page scene-page--cover" data-motion="ribbons">
        <WrappedMotion mode="ribbons" palette={EMBER} still={still} />
        <span className="scene-shade" aria-hidden="true" />
        <div className="scene-copy scene-cover">
          <span className="scene-kicker">OVVO YEARBOOK</span>
          <p className="scene-year">{year}</p>
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
      <Scene chapter={chapter} mode="ribbons" palette={EMBER} still={still}>
        <span className="scene-kicker">This year, you planned</span>
        <p className="scene-big scene-big--number">{count}</p>
        <p className="scene-sub">journeys. Every one started somewhere.</p>
      </Scene>
    );
  }

  if (chapter.kind === 'name') {
    return (
      <Scene chapter={chapter} mode="ribbons" palette={EMBER} still={still}>
        <span className="scene-kicker">Your year was called</span>
        <p className="scene-big scene-big--name">{chapter.big}</p>
        <p className="scene-sub">{chapter.line}</p>
      </Scene>
    );
  }

  if (chapter.kind === 'map') {
    return (
      <Scene chapter={chapter} mode="stairs" palette={ACID} still={still}>
        <span className="scene-kicker">You moved through</span>
        <p className="scene-big">{chapter.map?.places ?? chapter.big}</p>
        <p className="scene-sub">places across the year.</p>
        {chapter.map?.topLine ? (
          <p className="scene-foot">Most used line: {chapter.map.topLine}</p>
        ) : null}
      </Scene>
    );
  }

  if (chapter.kind === 'distance' && chapter.distance) {
    return (
      <Scene chapter={chapter} mode="wave" palette={VIOLET} still={still}>
        <span className="scene-kicker">You planned</span>
        <p className="scene-big">{KILOMETRES.format(chapter.distance.km)}</p>
        <p className="scene-sub">kilometres, straight line.</p>
        <p className="scene-foot">
          About {NUMBER.format(chapter.distance.avoidedKg)} kg CO₂e less than driving.
        </p>
      </Scene>
    );
  }

  if (chapter.kind === 'route' && chapter.route) {
    return (
      <Scene chapter={chapter} mode="ribbons" palette={EMBER} still={still}>
        <span className="scene-kicker">The route you kept taking</span>
        <p className="scene-big scene-big--number">{chapter.count ?? chapter.route.count}</p>
        <p className="scene-sub">times between</p>
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
      <Scene chapter={chapter} mode="stairs" palette={ACID} still={still}>
        <span className="scene-kicker">Where it all started</span>
        <p className="scene-big scene-big--station">{chapter.big}</p>
        <p className="scene-sub">{chapter.line}</p>
      </Scene>
    );
  }

  if (chapter.kind === 'bars') {
    return (
      <Scene chapter={chapter} mode="wave" palette={GOLD} still={still}>
        <span className="scene-kicker">The hour that owns you</span>
        <p className="scene-big">{chapter.big}</p>
        <p className="scene-sub">was your busiest hour to leave.</p>
      </Scene>
    );
  }

  if (chapter.kind === 'arc') {
    const pct = Math.round((chapter.arc ?? 0) * 100);
    return (
      <Scene chapter={chapter} mode="tunnel" palette={ICE} still={still}>
        <span className="scene-kicker">Straight through</span>
        <p className="scene-big">{pct}%</p>
        <p className="scene-sub">of journeys had no changes at all.</p>
      </Scene>
    );
  }

  if (chapter.kind === 'stretch') {
    return (
      <Scene chapter={chapter} mode="ribbons" palette={EMBER} still={still}>
        <span className="scene-kicker">The long way round</span>
        <p className="scene-big scene-big--duration">{chapter.big}</p>
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
      <Scene chapter={chapter} photo={chapter.photo} mode="bloom" palette={GOLD} still={still} align="bottom">
        <span className="scene-kicker">The look you wore</span>
        <p className="scene-big scene-big--look">{chapter.big}</p>
        <p className="scene-sub">{chapter.count} days in this look.</p>
      </Scene>
    );
  }

  if (chapter.kind === 'eras') {
    const eras = chapter.eras ?? [];
    return (
      <Scene chapter={chapter} mode="stairs" palette={GOLD} still={still}>
        <span className="scene-kicker">Your year had</span>
        <p className="scene-big">{eras.length} eras</p>
        <div className="scene-list scene-list--tight">
          {eras.map((era, index) => (
            <div className="scene-row" key={`${era.id}-${era.start}`}>
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
      <Scene chapter={chapter} mode="wave" palette={ACID} still={still}>
        <span className="scene-kicker">The line that knows you</span>
        <p className="scene-big">{chapter.big}</p>
        <p className="scene-sub">{chapter.count} journeys on this line.</p>
        <p className="scene-foot">
          {chapter.hearts ?? 0} stops hearted. {chapter.boards ?? 0} boards pinned.
        </p>
      </Scene>
    );
  }

  if (chapter.kind === 'awards') {
    return (
      <Scene chapter={chapter} mode="stairs" palette={EMBER} still={still}>
        <span className="scene-kicker">The year, according to you</span>
        <p className="scene-big scene-big--list">Your top moments</p>
        <div className="scene-list">
          {chapter.awards?.slice(0, 4).map((award, index) => (
            <div className="scene-row" key={award.id}>
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
      <Scene chapter={chapter} mode="ribbons" palette={ICE} still={still}>
        <span className="scene-kicker">First out. Last home.</span>
        <p className="scene-big scene-big--bookends">The year, in two journeys.</p>
        <div className="scene-list scene-list--tight">
          {[
            { label: 'First', data: chapter.bookends.first },
            { label: 'Last', data: chapter.bookends.last },
          ].map(({ label, data }) => (
            <div className="scene-row" key={label}>
              <span className="scene-row__rank">{label}</span>
              <span className="scene-row__title">
                {data.from} → {data.to}
              </span>
              <span className="scene-row__stat">{SHORT_DATE.format(new Date(data.at))}</span>
            </div>
          ))}
        </div>
        <p className="scene-foot">Wanted to leave at {hours(chapter.bookends.first.hour)} and {hours(chapter.bookends.last.hour)}.</p>
      </Scene>
    );
  }

  if (chapter.kind === 'comparison' && chapter.comparison) {
    const data = chapter.comparison;
    const diff = data.journeys - data.previousJourneys;
    return (
      <Scene chapter={chapter} mode="bloom" palette={ACID} still={still}>
        <span className="scene-kicker">Compared with {data.previousYear}</span>
        <p className="scene-big">{diff >= 0 ? '+' : ''}{diff}</p>
        <p className="scene-sub">
          {diff === 0
            ? 'journeys. Exactly the same.'
            : diff > 0
              ? 'more journeys than last year.'
              : 'fewer journeys than last year.'}
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
      <Scene chapter={chapter} mode="tunnel" palette={VIOLET} still={still}>
        <span className="scene-kicker">Your travel crew</span>
        <p className="scene-big scene-big--crew">Bring someone</p>
        <p className="scene-sub">next year. The year is better shared.</p>
        <p className="scene-code">OVVO-{year}-{String(chapter.crew.journeys).padStart(3, '0')}</p>
      </Scene>
    );
  }

  return (
    <Scene chapter={chapter} mode="wave" palette={ICE} still={still}>
      <span className="scene-kicker">End of issue</span>
      <p className="scene-big scene-big--close">{chapter.big}</p>
      <p className="scene-sub">{chapter.line}</p>
      {chapter.note ? <p className="scene-foot">{chapter.note}</p> : null}
    </Scene>
  );
}
