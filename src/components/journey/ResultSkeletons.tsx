import type { CSSProperties } from 'react';

/**
 * The shape of a result, while the result is being worked out.
 *
 * The old held place was a spinner in an empty card: it said *wait* and nothing about what was
 * coming, so the list then arrived as a change of subject. This draws three cards of the size and
 * shape the journeys have — the two times, the chain of services, the meta line — so the answer
 * lands where the eye is already resting and the screen never jumps.
 *
 * Decorative on purpose: the region that holds it is `aria-busy` and carries one spoken label, and
 * every bar inside is `aria-hidden`. The bars are not buttons, so nothing here can be tabbed to or
 * pressed while the real list is still one tick away.
 */
function Bar({ width, height = 12, round = false }: { width: number | string; height?: number; round?: boolean }) {
  const style: CSSProperties = { width: typeof width === 'number' ? `${width}px` : width, height };
  return <span className={`skeleton${round ? ' skeleton--round' : ''}`} style={style} aria-hidden="true" />;
}

function SkeletonCard() {
  return (
    <div className="card skeleton-card" aria-hidden="true">
      <div className="between wrap">
        <div className="journey-card__times">
          <Bar width={66} height={26} />
          <Bar width={18} height={12} />
          <Bar width={66} height={26} />
          <Bar width={62} height={24} round />
        </div>
        <div className="row-wrap">
          <Bar width={54} height={24} round />
          <Bar width={44} height={24} round />
        </div>
      </div>
      <div className="journey-card__chain">
        <Bar width={52} height={24} round />
        <Bar width={46} height={24} round />
        <Bar width={52} height={24} round />
      </div>
      <div className="journey-card__meta">
        <Bar width="42%" height={12} />
        <Bar width="26%" height={12} />
      </div>
    </div>
  );
}

export function ResultSkeletons() {
  return (
    <div className="stack-2">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
