import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './state/AppState';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
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
import { NotFoundPage } from './pages/NotFoundPage';
import { SkeletonDemoPage } from './pages/SkeletonDemoPage';
import { ReviewLayer } from './review/ReviewLayer';

/**
 * OVVO — application entry point and route table.
 * Every screen is reachable from the sidebar (desktop) and the floating dock
 * plus "All sections" sheet (mobile).
 */
export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          {/**
            * **The skeleton lab, development only.**
            *
            * `#/skeleton` is the app's held place on a bare page, on its own, so it can be judged
            * without a header, a dock or a real search around it (`pages/SkeletonDemoPage.tsx`).
            * It sits *outside* the shell because that is the point: the placeholder is the whole
            * screen. `import.meta.env.DEV` is `false` in a build, so this route never ships, and
            * a dev preview opens on it because `main.tsx` sets that hash when there is none.
            */}
          {import.meta.env.DEV ? <Route path="/skeleton" element={<SkeletonDemoPage />} /> : null}

          <Route
            path="*"
            element={
              <AppShell>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/results" element={<ResultsPage />} />
                  <Route path="/journey/:journeyId" element={<JourneyDetailPage />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/stops" element={<StopsPage />} />
                  <Route path="/stops/:stopId" element={<StopDetailPage />} />
                  <Route path="/departures" element={<DeparturesPage />} />
                  <Route path="/disruptions" element={<DisruptionsPage />} />
                  <Route path="/disruptions/:disruptionId" element={<DisruptionDetailPage />} />
                  <Route path="/preferences" element={<PreferencesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
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
      </HashRouter>
    </AppProvider>
  );
}
