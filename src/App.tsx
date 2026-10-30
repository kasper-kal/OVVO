import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './state/AppState';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SkeletonDemoPage } from './pages/SkeletonDemoPage';
import { ResultsPage } from './pages/ResultsPage';
import { JourneyDetailPage } from './pages/JourneyDetailPage';
import { MapPage } from './pages/MapPage';
import { StopsPage } from './pages/StopsPage';
import { StopDetailPage } from './pages/StopDetailPage';
import { DeparturesPage } from './pages/DeparturesPage';
import { DisruptionsPage } from './pages/DisruptionsPage';
import { DisruptionDetailPage } from './pages/DisruptionDetailPage';
import { PreferencesPage } from './pages/PreferencesPage';
import { SettingsPage } from './pages/SettingsPage';
import { StylesPage } from './pages/StylesPage';
import { ReviewLayer } from './review/ReviewLayer';

/**
 * **Every screen is in this one file, and that is the fix for the half second.**
 *
 * Each screen used to live in a file of its own, requested at startup and unwrapped on the tap.
 * That put a promise between the traveller and the screen they had just asked for: the address
 * changed, the old screen was still on display, then the content area was empty while the file
 * was read, and only then did the new screen appear. Measured on the built site at phone size:
 * about three tenths of a second where the middle of the page had nothing in it, and the new
 * screen's words at about four tenths. A tap should not be a wait.
 *
 * All ten were already being downloaded at startup (`warmEveryPage`), so the split was buying
 * nothing and cost that wait on every screen. They are one script now: the browser reads it once,
 * at the start, behind the mark in `index.html`, and every tap after that is a render rather than
 * a request. The cost is the same bytes the app was already fetching.
 *
 * The per-screen recovery went with it, because it answered a failure that can no longer happen:
 * a screen cannot fail to load on its own when it is part of the same file as the screen you are
 * looking at. If the whole script does not arrive, there is nothing yet to show a card on, and
 * `index.html`'s own note is what answers that (see `too-old` there). A screen that throws while
 * drawing is still caught by the boundary in the shell, which is untouched.
 */

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
 * **And at 10%, the map is closed with it, along with every way in.**
 *
 * A map is the most expensive screen in the app: tiles arriving over the radio, a drawing on top of
 * them, and panning that repaints the lot. "When does the bus go" is answerable without it, so it
 * leaves with Settings: not in the navigation (`AppShell`), not linked from a stop or a journey,
 * not on the page-not-found screen, and not reachable by typing `/map` either. A charger brings it
 * back, because the mode stores nothing.
 */
function MapRoute() {
  const { power } = useApp();
  if (power.mode === 'super') return <Navigate to="/" replace />;
  return <MapPage />;
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
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/results" element={<ResultsPage />} />
                  {/* One search, in full: everything a reload or a pasted link must put back —
                      see `lib/searchLink`. `/results` alone still works and says there is nothing
                      to show yet. */}
                  <Route path="/results/:searchId" element={<ResultsPage />} />
                  <Route path="/journey/:journeyId" element={<JourneyDetailPage />} />
                  <Route path="/map" element={<MapRoute />} />
                  <Route path="/stops" element={<StopsPage />} />
                  <Route path="/stops/:stopId" element={<StopDetailPage />} />
                  <Route path="/departures" element={<DeparturesPage />} />
                  <Route path="/disruptions" element={<DisruptionsPage />} />
                  <Route path="/disruptions/:disruptionId" element={<DisruptionDetailPage />} />
                  <Route path="/preferences" element={<PreferencesPage />} />
                  <Route path="/settings" element={<SettingsRoute />} />
                  {/* The look, one level in from Settings: fifty previews do not belong in a
                      list of settings (`pages/StylesPage.tsx`). */}
                  <Route path="/styles" element={<StylesPage />} />
                  <Route path="/planner" element={<Navigate to="/" replace />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
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
