/**
 * **One walk, or one ride, on a real street map.**
 *
 * Items 13 and 14 both land here. Item 13 asks every walk for a link that opens it on the map *with
 * the dashed line drawn along the real streets*; item 14 asks every ride for a glyph that opens that
 * leg alone, with the route drawn, a **Navigeer** button and the leg's two times under it.
 *
 * So this is one sheet with two subjects. A walk draws the foot router's own line, dashes it, and
 * can be stepped through street by street. A ride draws the line the service takes through the
 * stations it calls at, and steps station by station. Both say the two times at the foot, because a
 * leg on a map without its times is a picture of a journey rather than the journey.
 *
 * The tiles are OpenStreetMap's, credited in the corner as their licence asks, and the drawing is
 * Leaflet: a map library is not something to write by hand for two views.
 */
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Dialog } from '../ui/primitives';
import { Icon } from '../ui/Icons';
import { useT } from '../../lib/useT';
import { useFormat } from '../../lib/useFormat';
import { stopLabel, stopStreet } from '../../data/stops';
import { rideLine, walkingRoute, type Point } from '../../lib/streetMap';
import type { Leg } from '../../data/types';

export interface MapTarget {
  kind: 'walk' | 'ride';
  leg: Leg;
}

interface Step {
  label: string;
  metres: number;
}

export function StreetMapSheet({ target, onClose }: { target: MapTarget | null; onClose: () => void }) {
  const t = useT();
  const format = useFormat();
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const lineRef = useRef<L.Polyline | null>(null);
  const dotRef = useRef<L.CircleMarker | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [sketched, setSketched] = useState(false);
  const [walked, setWalked] = useState<{ metres: number; seconds: number } | null>(null);
  const [stepping, setStepping] = useState(false);
  const [step, setStep] = useState(0);

  const leg = target?.leg;
  const isWalk = target?.kind === 'walk';

  /* The line, fetched when the sheet opens: the router for a walk, the called stations for a ride. */
  useEffect(() => {
    setPoints([]);
    setSteps([]);
    setSketched(false);
    setWalked(null);
    setStepping(false);
    setStep(0);
    if (!leg) return undefined;
    let live = true;
    if (isWalk) {
      void walkingRoute(leg.fromStopId, leg.toStopId).then((route) => {
        if (!live) return;
        setPoints(route.points);
        setSketched(route.fallback);
        setWalked(route.fallback ? null : { metres: route.metres, seconds: route.seconds });
        setSteps(route.steps.map((item) => ({ label: item.street, metres: item.metres })));
      });
    } else {
      setPoints(rideLine(leg));
      /*
       * A ride's steps are its stations, both ends included: a leg with one call in between used to
       * offer a single step, so Navigeer opened and could not move.
       */
      setSteps([
        { label: stopLabel(leg.fromStopId), metres: 0 },
        ...(leg.intermediateStops ?? []).map((stop) => ({ label: stopLabel(stop.stopId), metres: 0 })),
        { label: stopLabel(leg.toStopId), metres: 0 },
      ]);
    }
    return () => {
      live = false;
    };
  }, [leg, isWalk]);

  /* The drawing itself: tiles, the line, and the dot that Navigeer moves along it. */
  useEffect(() => {
    if (!target || !holder.current || points.length === 0) return undefined;
    const map = L.map(holder.current, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
    });
    mapRef.current = map;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    const line = L.polyline(points, {
      color: isWalk ? '#3f3f45' : '#1a4fd6',
      weight: 4,
      dashArray: isWalk ? '7 7' : undefined,
      lineCap: 'round',
    }).addTo(map);
    lineRef.current = line;
    L.circleMarker(points[0], { radius: 6, color: '#1a4fd6', fillColor: '#fff', fillOpacity: 1, weight: 3 }).addTo(map);
    L.circleMarker(points[points.length - 1], {
      radius: 6,
      color: '#1a4fd6',
      fillColor: '#1a4fd6',
      fillOpacity: 1,
      weight: 2,
    }).addTo(map);
    map.fitBounds(line.getBounds(), { padding: [24, 24] });
    return () => {
      map.remove();
      mapRef.current = null;
      lineRef.current = null;
      dotRef.current = null;
    };
  }, [target, points, isWalk]);

  /* Navigeer: a dot on the line where the traveller is, moved one street at a time. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !stepping || points.length === 0) {
      dotRef.current?.remove();
      dotRef.current = null;
      return;
    }
    const share = steps.length ? (step + 1) / (steps.length + 1) : 1;
    const index = Math.min(points.length - 1, Math.round(share * (points.length - 1)));
    const at = points[index];
    if (!dotRef.current) {
      dotRef.current = L.circleMarker(at, {
        radius: 8,
        color: '#fff',
        weight: 3,
        fillColor: '#1a4fd6',
        fillOpacity: 1,
      }).addTo(map);
    } else {
      dotRef.current.setLatLng(at);
    }
    dotRef.current.bringToFront();
    map.panTo(at, { animate: true });
  }, [stepping, step, points, steps.length]);

  if (!target || !leg) return null;

  const from = leg.fromLabel ?? stopLabel(leg.fromStopId);
  const to = leg.toLabel ?? stopLabel(leg.toStopId);
  const fromStreet = stopStreet(leg.fromStopId);
  const toStreet = stopStreet(leg.toStopId);
  const walkSteps = steps.filter((item) => item.label);
  const current = walkSteps[Math.min(step, Math.max(0, walkSteps.length - 1))];

  return (
    <Dialog
      open
      title={isWalk ? t('Walk from {from} to {to}', { from, to }) : t('{from} to {to}', { from, to })}
      description={
        isWalk
          ? t('The walk drawn along the real streets.')
          : t('The route this service takes, station by station.')
      }
      onClose={onClose}
      panelClassName="street-map-panel"
    >
      <div className="street-map">
        <div ref={holder} className="street-map__canvas" role="img" aria-label={t('Street map')} />
        {sketched ? (
          <p className="street-map__notice t-sm" role="status">
            {t('The straight line is shown; the real route could not be fetched just now.')}
          </p>
        ) : null}

        <div className="street-map__ends">
          <span className="street-map__end">
            <span className="t-strong">{from}</span>
            {fromStreet ? <span className="t-sm t-muted">{fromStreet}</span> : null}
          </span>
          <span className="street-map__end street-map__end--right">
            <span className="t-strong">{to}</span>
            {toStreet ? <span className="t-sm t-muted">{toStreet}</span> : null}
          </span>
        </div>

        <div className="street-map__times">
          <span className="row t-strong">
            <Icon name="clock" size={15} />
            {format.time(leg.departure)} → {format.time(leg.arrival)}
          </span>
          <span className="t-sm t-muted">
            {isWalk
              ? walked
                ? `${walked.metres} m · ${format.duration(Math.max(1, Math.round(walked.seconds / 60)))}`
                : t('Walk')
              : `${leg.lineName ?? ''}`.trim()}
          </span>
        </div>

        <div className="street-map__navigate">
          <button
            type="button"
            className="btn btn--primary"
            aria-pressed={stepping}
            onClick={() => {
              setStepping((on) => !on);
              setStep(0);
            }}
          >
            <Icon name="route" size={16} />
            {stepping ? t('Stop navigating') : t('Navigeer')}
          </button>
          {stepping ? (
            <div className="street-map__step" role="status">
              <span className="t-strong">
                {t('Step {index} of {count}', { index: Math.min(step + 1, walkSteps.length), count: walkSteps.length })}
              </span>
              <span className="t-sm">{current?.label ?? t('On the way')}</span>
              <span className="row gap-2">
                <button
                  type="button"
                  className="btn btn--sm"
                  aria-label={t('Previous step')}
                  disabled={step === 0}
                  onClick={() => setStep((value) => Math.max(0, value - 1))}
                >
                  <Icon name="chevronLeft" size={15} />
                </button>
                <button
                  type="button"
                  className="btn btn--sm"
                  aria-label={t('Next step')}
                  disabled={step >= walkSteps.length - 1}
                  onClick={() => setStep((value) => Math.min(walkSteps.length - 1, value + 1))}
                >
                  <Icon name="chevronRight" size={15} />
                </button>
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
}
