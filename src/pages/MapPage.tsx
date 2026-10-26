import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { Card } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icons';
import { NetworkMap } from '../widgets/registry';
import { StopLink } from '../components/stops/StopLink';
import { getStop, stopLabel } from '../data/stops';
import { useT } from '../lib/useT';

/**
 * The map as a screen of its own.
 *
 * It was reachable only as a home-screen widget: `Show on map` on a journey, on a stop, on an
 * alert and on the results screen all pointed at `/?widget=map&journey=…`, which dropped the
 * traveller on their own home screen with a widget somewhere in it and no way back to the journey
 * they had been reading (reported as such). The map is a screen: it has a name, it draws the same
 * `NetworkMap` the widget draws — one map, so highlighting cannot disagree with itself — and the
 * way out is the screen you came from rather than a fixed route, because there are four ways in
 * and only one of them is home.
 *
 * The widget is untouched and still on the home screen: a widget is a glimpse you can add, and
 * this is the place you go to look properly.
 */
export function MapPage() {
  const t = useT();
  const [params] = useSearchParams();
  const { findJourney } = useApp();
  const journey = findJourney(params.get('journey') ?? undefined);
  const stop = getStop(params.get('stop') ?? undefined);
  const last = journey?.legs[journey.legs.length - 1];

  return (
    <div className="stack-6">
      <PageHeader
        title={t('Network map')}
        description={t('Every route, filtered by mode.')}
        showTitle
      />

      {journey || stop ? (
        <Card className="stack-2">
          <span className="field__label">{t(journey ? 'Showing your journey' : 'Showing this stop')}</span>
          <div className="between wrap">
            <span className="row t-strong">
              <Icon name={journey ? 'route' : 'station'} size={16} />
              {/*
                The name itself is the way to the page — a stop's own name, underlined.

                There used to be a **Stop page** button here as well, which said the same thing
                twice: the card named one station and then offered a button to reach it. A journey
                keeps its button, because a journey's two ends are words and the page they lead to
                is not either of them.
              */}
              {journey ? (
                `${stopLabel(journey.legs[0].fromStopId)} → ${stopLabel(last?.toStopId ?? journey.legs[0].toStopId)}`
              ) : (
                <StopLink stopId={stop?.id} label={stop?.name} />
              )}
            </span>
            {journey ? (
              <Link to={`/journey/${journey.id}`} className="btn btn--sm">
                <Icon name="route" size={15} />
                {t('Journey details')}
              </Link>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/*
        `map-card` is what tells the stylesheet this is the map **screen** rather than the home
        widget: the drawing is one square canvas shared by both, and a page for looking at the map
        should not be sized like a glimpse of it in a grid (see `.map-card .map-canvas`).
      */}
      <Card className="stack map-card">
        {/* `variant="screen"`: the widget's 16:9 plate letterboxed a square drawing into 37% of its
            own width on this screen, the one place the map is meant to be looked at (3.1). The
            screen also gets the list of stops under the drawing (3.3). */}
        <NetworkMap variant="screen" />
      </Card>
    </div>
  );
}
