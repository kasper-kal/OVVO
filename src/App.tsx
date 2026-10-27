import { Suspense, lazy, type ComponentType } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './state/AppState';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SkeletonDemoPage } from './pages/SkeletonDemoPage';
import { ReviewLayer } from './review/ReviewLayer';

/**
 * **One screen is downloaded, the rest when they are asked for.**
 *
 * The build shipped every screen in one file — measured at **700 kB** before this, on every
 * visit, whatever the traveller opened. On a cheap phone that is the expensive part of starting:
 * the bytes come over the radio and then have to be parsed and compiled before the first card can
 * be drawn, and none of it is the home screen's business. Results, a journey, the map, the stop
 * list, the board, the alerts, preferences and settings each live in their own chunk now, fetched
 * the first time they are opened and kept afterwards.
 *
 * The home screen stays in the first file on purpose: it is the screen the app opens on, and a
 * chunk boundary in front of it would put a wait between the traveller and the planner for no
 * saving at all.
 *
 * Nothing about the shape of the app changes. `pages/*` still export the same named components;
 * this is a `.then` to turn one into the default export `lazy` asks for.
 *
 * **The fallback is nothing at all, on purpose.** A held-place card here would flash for one frame
 * on a fast connection and lie about the shape of the screen — the board, the map and the settings
 * list are not a journey result. The chunk is a local file, the header and the dock are already
 * drawn, and a screen that is a beat late should look like a beat, not like a skeleton of the wrong
 * thing.
 */
const page = <Name extends string>(load: () => Promise<Record<Name, ComponentType>>, name: Name) =>
  lazy(() => load().then((module) => ({ default: module[name] })));

const ResultsPage = page(() => import('./pages/ResultsPage'), 'ResultsPage');
const JourneyDetailPage = page(() => import('./pages/JourneyDetailPage'), 'JourneyDetailPage');
const MapPage = page(() => import('./pages/MapPage'), 'MapPage');
const StopsPage = page(() => import('./pages/StopsPage'), 'StopsPage');
const StopDetailPage = page(() => import('./pages/StopDetailPage'), 'StopDetailPage');
const DeparturesPage = page(() => import('./pages/DeparturesPage'), 'DeparturesPage');
const DisruptionsPage = page(() => import('./pages/DisruptionsPage'), 'DisruptionsPage');
const DisruptionDetailPage = page(() => import('./pages/DisruptionDetailPage'), 'DisruptionDetailPage');
const PreferencesPage = page(() => import('./pages/PreferencesPage'), 'PreferencesPage');
const SettingsPage = page(() => import('./pages/SettingsPage'), 'SettingsPage');

/**
 * **Settings is closed at 10% or below.**
 *
 * Super energy saving leaves the app answering one question — when does the bus go — and
 * Settings is the screen that costs the most to draw and answers that question least. It is also
 * missing from the navigation (`AppShell`'s `useNavigation`), so this route is the second half of
 * the same rule rather than a separate one: a link that is not drawn and a URL that still works
 * would mean the screen is only hidden, not closed. Anything typed or bookmarked lands here, so
 * it goes home, where the note at the top of the screen says why the app is thin and that a
 * charger brings it all back. Nothing is lost, because nothing here is stored: the mode is a
 * subtraction from the interface and leaving it restores the screen exactly.
 */
function SettingsRoute() {
  const { power } = useApp();
  if (power.mode === 'super') return <Navigate to="/" replace />;
  return <SettingsPage />;
}

/**
 * OVVO — application entry point and route table.
 * Every screen is reachable from the sidebar (desktop) and the floating dock
 * plus "All sections" sheet (mobile).
 *
 * **Clean addresses, no `#`.** The router was `HashRouter`, which keeps the route after a `#` so a
 * static host never has to answer for it. The traveller asked for `/stops/utrecht-centraal` instead
 * of `/#/stops/utrecht-centraal`, and the trade is the host's: a real path is a request the host
 * must answer, so every unknown address has to come back as `index.html` rather than a 404 (Vite's
 * SPA fallback, `appType: 'spa'` in `vite.config.ts`, which both the dev server and `vite preview`
 * honour — that pair is how this site is served). Addresses that still carry a `#/` are translated
 * on the way in (`main.tsx`), so an old bookmark or a link already shared does not break.
 */
export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/**
            * **The skeleton lab, development only.**
            *
            * `/skeleton` is the app's held place on a bare page, on its own, so it can be judged
            * without a header, a dock or a real search around it (`pages/SkeletonDemoPage.tsx`).
            * It sits *outside* the shell because that is the point: the placeholder is the whole
            * screen. `import.meta.env.DEV` is `false` in a build, so this route never ships, and
            * it is reached by the hash alone — a bare visit opens the home screen, as it should.
            * It used to be the other way round: `main.tsx` sent any hashless visit here, which
            * meant the preview opened on a lab rather than on the app.
            */}
          {import.meta.env.DEV ? <Route path="/skeleton" element={<SkeletonDemoPage />} /> : null}

          <Route
            path="*"
            element={
              <AppShell>
                <Suspense fallback={null}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/results" element={<ResultsPage />} />
                  {/* One search, in full: everything a reload or a pasted link must put back —
                      see `lib/searchLink`. `/results` alone still works and says there is nothing
                      to show yet. */}
                  <Route path="/results/:searchId" element={<ResultsPage />} />
                  <Route path="/journey/:journeyId" element={<JourneyDetailPage />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/stops" element={<StopsPage />} />
                  <Route path="/stops/:stopId" element={<StopDetailPage />} />
                  <Route path="/departures" element={<DeparturesPage />} />
                  <Route path="/disruptions" element={<DisruptionsPage />} />
                  <Route path="/disruptions/:disruptionId" element={<DisruptionDetailPage />} />
                  <Route path="/preferences" element={<PreferencesPage />} />
                  <Route path="/settings" element={<SettingsRoute />} />
                  <Route path="/planner" element={<Navigate to="/" replace />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
                </Suspense>
              </AppShell>
            }
          />
        </Routes>
        {/*
          The review layer — a dev-only annotation tool, deleted with `review/` and this line.

          `import.meta.env.DEV` is replaced with `false` by Vite at build time, so the import is
          tree-shaken out of the bundle: no traveller ever downloads it, and no reviewer sees it in
          a deployed site.
        */}
        {import.meta.env.DEV ? <ReviewLayer /> : null}
      </BrowserRouter>
    </AppProvider>
  );
}
