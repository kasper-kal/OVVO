import type { CSSProperties, ReactNode } from 'react';
import type { Chapter } from '../../lib/wrappedDeck';

/*
 * **The object is the chapter, not a line through it.**
 *
 * The old film had one ribbon and changed its path. That is a motion study, not a Wrapped story.
 * These are real scene props: a ticket stack, a station totem, a clock, a train, a seat, medals,
 * a map constellation, a photo. They are built from the same palette and the same grain, but each
 * one has its own silhouette, so the eye gets a new object on every beat.
 */

type ArtProps = {
  chapter: Chapter;
  count: number;
  year: number;
};

function shortStop(name: string): string {
  return name.replace(/ (Centraal|Station)$/i, '');
}

function Ticket({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`art-ticket ${className}`}>{children}</span>;
}

export function WrappedArt({ chapter, count, year }: ArtProps) {
  const id = chapter.id;
  const stops = chapter.map?.stops ?? [];
  const awards = Math.min(4, Math.max(3, chapter.awards?.length ?? 3));
  const eras = Math.min(3, Math.max(2, chapter.eras?.length ?? 3));

  let art: ReactNode;

  switch (id) {
    case 'cover':
      art = (
        <div className="art-cover">
          <span className="art-orbit" />
          <span className="art-orbit art-orbit--two" />
          <span className="art-sun" />
          <Ticket className="art-ticket--one">
            <b>OVVO</b>
            <small>YEARBOOK</small>
          </Ticket>
          <Ticket className="art-ticket--two">
            <b>{year}</b>
            <small>ONE YEAR</small>
          </Ticket>
        </div>
      );
      break;

    case 'total':
      art = (
        <div className="art-stack">
          {Array.from({ length: 9 }, (_, i) => (
            <span className="art-stub" style={{ '--i': i } as CSSProperties} key={i} />
          ))}
          <span className="art-stack-number">{count}</span>
        </div>
      );
      break;

    case 'name':
      art = (
        <div className="art-badge">
          <span className="art-badge-ring" />
          <span className="art-badge-star">★</span>
          <span className="art-badge-dot" />
          <span className="art-badge-ribbon art-badge-ribbon--one" />
          <span className="art-badge-ribbon art-badge-ribbon--two" />
        </div>
      );
      break;

    case 'map':
      art = (
        <div className="art-map">
          <span className="art-map-glow" />
          {(stops.length ? stops.slice(0, 12) : Array.from({ length: 9 }, (_, i) => ({ x: 18 + ((i * 23) % 68), y: 20 + ((i * 31) % 62) }))).map(
            (stop, i) => (
              <span
                className="art-pin"
                style={{ left: `${stop.x}%`, top: `${stop.y}%`, '--i': i } as CSSProperties}
                key={`${stop.x}-${stop.y}-${i}`}
              />
            ),
          )}
        </div>
      );
      break;

    case 'distance':
      art = (
        <div className="art-mile">
          <span className="art-mile-sun" />
          <span className="art-mile-board">
            <b>{chapter.big}</b>
            <small>THE LONG WAY</small>
          </span>
          <span className="art-mile-post" />
          <span className="art-mile-ground" />
        </div>
      );
      break;

    case 'pair':
      art = (
        <div className="art-pair">
          <span className="art-sign art-sign--a">
            <b>{shortStop(chapter.route?.from ?? 'A')}</b>
            <small>FROM</small>
          </span>
          <span className="art-pair-arrow">↔</span>
          <span className="art-sign art-sign--b">
            <b>{shortStop(chapter.route?.to ?? 'B')}</b>
            <small>TO</small>
          </span>
        </div>
      );
      break;

    case 'origin':
      art = (
        <div className="art-totem">
          <span className="art-totem-sign">
            <b>{chapter.big}</b>
            <small>ALWAYS HERE</small>
          </span>
          <span className="art-totem-pole" />
        </div>
      );
      break;

    case 'hour':
      art = (
        <div className="art-clock">
          <span className="art-clock-face" />
          <span className="art-clock-hand art-clock-hand--hour" />
          <span className="art-clock-hand art-clock-hand--minute" />
          <span className="art-clock-pin" />
          <span className="art-clock-time">{chapter.big}</span>
        </div>
      );
      break;

    case 'direct':
      art = (
        <div className="art-train">
          <span className="art-train-window" />
          <span className="art-train-window art-train-window--two" />
          <span className="art-train-door" />
          <span className="art-train-nose" />
          <span className="art-train-light" />
          <span className="art-train-light art-train-light--two" />
          <span className="art-train-rail" />
        </div>
      );
      break;

    case 'longest':
      art = (
        <div className="art-window">
          <span className="art-window-view" />
          <span className="art-window-seat" />
          <span className="art-window-table" />
        </div>
      );
      break;

    case 'look':
      art = (
        <div className="art-filmstrip">
          {Array.from({ length: 7 }, (_, i) => (
            <span className="art-sprocket" style={{ '--i': i } as CSSProperties} key={i} />
          ))}
        </div>
      );
      break;

    case 'eras':
      art = (
        <div className="art-eras">
          {Array.from({ length: eras }, (_, i) => (
            <span className="art-era" style={{ '--i': i } as CSSProperties} key={i} />
          ))}
        </div>
      );
      break;

    case 'lines':
      art = (
        <div className="art-board">
          <span className="art-board-row">
            <b>{chapter.big}</b>
          </span>
          <span className="art-board-row art-board-row--small">YOUR LINE</span>
        </div>
      );
      break;

    case 'awards':
      art = (
        <div className="art-medals">
          {Array.from({ length: awards }, (_, i) => (
            <span className="art-medal" style={{ '--i': i } as CSSProperties} key={i}>
              <i />
            </span>
          ))}
        </div>
      );
      break;

    case 'bookends':
      art = (
        <div className="art-bookends">
          <span className="art-rays" />
          <span className="art-sunrise" />
          <span className="art-sunset" />
          <span className="art-horizon" />
        </div>
      );
      break;

    case 'comparison':
      art = (
        <div className="art-postcards">
          <span className="art-postcard">
            <span className="art-postcard-image" />
            <small>THIS YEAR</small>
          </span>
          <span className="art-postcard art-postcard--b">
            <span className="art-postcard-image" />
            <small>LAST YEAR</small>
          </span>
        </div>
      );
      break;

    case 'crew':
      art = (
        <div className="art-crew">
          {Array.from({ length: 5 }, (_, i) => (
            <span
              className="art-person"
              style={{ '--i': i, '--h': [0.44, 0.58, 0.5, 0.64, 0.53][i] } as CSSProperties}
              key={i}
            />
          ))}
        </div>
      );
      break;

    case 'close':
    default:
      art = (
        <div className="art-final">
          <span className="art-final-ring" />
          <span className="art-final-stub">
            <b>{year}</b>
            <small>ADMIT ONE</small>
          </span>
        </div>
      );
      break;
  }

  return (
    <div className={`film2-art film2-art--${id}`} data-art={id} aria-hidden="true">
      {art}
    </div>
  );
}
