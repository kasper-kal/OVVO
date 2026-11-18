import { useState } from 'react';
import { Icon } from '../ui/Icons';
import { playYearbookEffect } from '../../lib/yearbookEffects';
import {
  POSTER_COLOURWAYS,
  dataUrlToFile,
  drawPoster,
  posterStyle,
  saveBlob,
  type PosterColourway,
  type PosterData,
} from '../../lib/wrappedPoster';

/*
 * **The end is the card you send.**
 *
 * Every other chapter ends on a sentence. This one ends on the poster: the year's number, the five
 * places, the busiest day and the longest streak, in a frame you can page through three colourways
 * and send as it stands. It is not a sheet fetched from a pill any more - the pill is gone from this
 * card - and Replay sits underneath it, because the last thing a film should offer is the start.
 *
 * Theming is the palette table in `lib/wrappedPoster`, so the card on screen and the picture in the
 * share sheet are the same card.
 */

type PosterProps = {
  poster: PosterData;
  onReplay: () => void;
};

export function WrappedPoster({ poster, onReplay }: PosterProps) {
  const [colour, setColour] = useState<PosterColourway>('ember');
  const [sent, setSent] = useState('');

  const step = (direction: number) => {
    const at = POSTER_COLOURWAYS.indexOf(colour);
    const next = POSTER_COLOURWAYS[(at + direction + POSTER_COLOURWAYS.length) % POSTER_COLOURWAYS.length];
    setColour(next);
    playYearbookEffect('board-stamp');
  };

  const share = async () => {
    let dataUrl = '';
    try {
      dataUrl = drawPoster(poster, colour);
    } catch {
      return;
    }
    const file = dataUrlToFile(dataUrl, `ovvo-yearbook-${poster.year}-${colour}.png`);
    try {
      if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `My OVVO Yearbook ${poster.year}`,
          text: 'My year in journeys with OVVO.',
        });
      } else {
        saveBlob(file);
      }
      playYearbookEffect('share-confirmation');
      setSent('Saved');
    } catch (error) {
      /* A dismissed share sheet is not a failed share. */
      if ((error as Error)?.name !== 'AbortError') {
        saveBlob(file);
        playYearbookEffect('share-confirmation');
        setSent('Saved');
      }
    }
  };

  const facts: Array<{ label: string; value: string }> = [
    { label: 'Busiest day', value: poster.day ? poster.day.date : '—' },
    { label: 'Journeys that day', value: poster.day ? String(poster.day.count) : '—' },
    {
      label: 'Longest streak',
      value: poster.streakDays ? `${poster.streakDays} ${poster.streakDays === 1 ? 'day' : 'days'}` : '—',
    },
  ];

  return (
    <div className={`w-poster w-poster--${colour}`} data-poster={colour} style={posterStyle(colour)}>
      <div className="w-poster__head">
        <span>OVVO Yearbook</span>
        <span>{poster.year}</span>
      </div>

      <div className="w-poster__count">
        <span className="w-poster__big">{poster.journeys}</span>
        <span className="w-poster__unit">journeys planned</span>
      </div>

      <div className="w-poster__cols">
        <div className="w-poster__col">
          <span className="w-poster__label">Your places</span>
          {poster.places.map((place) => (
            <span className="w-poster__row" key={place.name}>
              <span className="w-poster__name">{place.name}</span>
              <span className="w-poster__value">{place.count}</span>
            </span>
          ))}
        </div>
        <div className="w-poster__col">
          <span className="w-poster__label">Your year</span>
          {facts.map((fact) => (
            <span className="w-poster__fact" key={fact.label}>
              <span className="w-poster__label">{fact.label}</span>
              <span className="w-poster__factValue">{fact.value}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="w-poster__actions">
        <button type="button" className="w-poster__share" onClick={() => void share()}>
          <Icon name="share" size={14} /> {sent || 'Share this card'}
        </button>
        <button type="button" className="w-poster__replay" onClick={onReplay}>
          Replay from beginning
        </button>
      </div>

      {/* The colourways, paged with two arrows: three cards, the same card. */}
      <div className="w-poster__pager">
        <button
          type="button"
          className="w-poster__arrow"
          aria-label="Previous colour"
          onClick={() => step(-1)}
        >
          ‹
        </button>
        <span className="w-poster__dots" aria-hidden="true">
          {POSTER_COLOURWAYS.map((name) => (
            <i key={name} className={name === colour ? 'is-now' : ''} />
          ))}
        </span>
        <button type="button" className="w-poster__arrow" aria-label="Next colour" onClick={() => step(1)}>
          ›
        </button>
      </div>
    </div>
  );
}
