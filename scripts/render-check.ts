/**
 * Renders every page with react-dom/server to catch runtime errors that a build
 * cannot detect. Run with:
 *   npx esbuild scripts/render-check.ts --bundle --format=esm --platform=node --outfile=/tmp/render.mjs --loader:.css=empty && node /tmp/render.mjs
 */
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '../src/state/AppState';
import { AppShell } from '../src/components/layout/AppShell';
import { PlannerPage } from '../src/pages/PlannerPage';
import { ResultsPage } from '../src/pages/ResultsPage';
import { JourneyDetailPage } from '../src/pages/JourneyDetailPage';
import { MapPage } from '../src/pages/MapPage';
import { StopsPage } from '../src/pages/StopsPage';
import { StopDetailPage } from '../src/pages/StopDetailPage';
import { DeparturesPage } from '../src/pages/DeparturesPage';
import { DisruptionsPage } from '../src/pages/DisruptionsPage';
import { DisruptionDetailPage } from '../src/pages/DisruptionDetailPage';
import { FavouritesPage } from '../src/pages/FavouritesPage';
import { SavedJourneysPage } from '../src/pages/SavedJourneysPage';
import { RecentSearchesPage } from '../src/pages/RecentSearchesPage';
import { PreferencesPage } from '../src/pages/PreferencesPage';
import { SettingsPage } from '../src/pages/SettingsPage';
import { NotFoundPage } from '../src/pages/NotFoundPage';

const cases: [string, () => JSX.Element][] = [
  ['/', PlannerPage],
  ['/results', ResultsPage],
  ['/journey/nonexistent', JourneyDetailPage],
  ['/map', MapPage],
  ['/stops', StopsPage],
  ['/stops/utrecht-centraal', StopDetailPage],
  ['/departures', DeparturesPage],
  ['/disruptions', DisruptionsPage],
  ['/disruptions/d-signal-utrecht', DisruptionDetailPage],
  ['/favourites', FavouritesPage],
  ['/journeys', SavedJourneysPage],
  ['/recent', RecentSearchesPage],
  ['/preferences', PreferencesPage],
  ['/settings', SettingsPage],
  ['/does-not-exist', NotFoundPage],
];

let failures = 0;
for (const [path, Page] of cases) {
  try {
    const html = renderToString(
      createElement(
        AppProvider,
        null,
        createElement(
          MemoryRouter,
          { initialEntries: [path] },
          createElement(
            AppShell,
            null,
            createElement(Routes, null, createElement(Route, { path: '*', element: createElement(Page) })),
          ),
        ),
      ),
    );
    console.log(`OK   ${path} (${html.length} chars)`);
  } catch (error) {
    failures += 1;
    console.log(`FAIL ${path}: ${(error as Error).message}`);
  }
}
console.log(failures === 0 ? '\nAll pages rendered without runtime errors.' : `\n${failures} page(s) failed to render.`);
process.exit(failures === 0 ? 0 : 1);
