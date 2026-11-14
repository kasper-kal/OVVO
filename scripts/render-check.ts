/**
 * Renders every page with react-dom/server to catch runtime errors that a build
 * cannot detect. Run with:
 *
 *   npx esbuild scripts/render-check.ts --bundle --format=cjs --platform=node \
 *     --outfile=/tmp/render.cjs --loader:.css=empty --loader:.png=dataurl \
 *     --define:import.meta.env='{}' && node /tmp/render.cjs
 *
 * `--loader:.png=dataurl` is not decoration: the install banner imports its icon as
 * `../../../public/icons/icon-192.png?inline`, and without a loader for `.png` esbuild stops before
 * this file is even bundled. `--define:import.meta.env='{}'` gives the handful of `import.meta.env`
 * reads a value in a CommonJS bundle, where there is no `import.meta` to read.
 *
 * **Why the pages are split into two lists.** Most screens sit inside `AppShell`; `/signin` and
 * `/auth/finish` are doors outside it on purpose (see `App.tsx`), and rendering them *inside* the
 * shell would test a screen the app never shows. `bare` renders them as they are.
 *
 * **What this cannot see:** a page that renders and then breaks on mount (the provider's effects,
 * `window` reads, timers). This catches the errors that happen while the markup is built, which is
 * where an undefined field or a bad `.map()` throws. The browser audits are the other half.
 */
import { createElement, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '../src/state/AppState';
import { AppShell } from '../src/components/layout/AppShell';
import { HomePage } from '../src/pages/HomePage';
import { ResultsPage } from '../src/pages/ResultsPage';
import { JourneyDetailPage } from '../src/pages/JourneyDetailPage';
import { StopsPage } from '../src/pages/StopsPage';
import { MapPage } from '../src/pages/MapPage';
import { StopDetailPage } from '../src/pages/StopDetailPage';
import { DeparturesPage } from '../src/pages/DeparturesPage';
import { DisruptionsPage } from '../src/pages/DisruptionsPage';
import { DisruptionDetailPage } from '../src/pages/DisruptionDetailPage';
import { PreferencesPage } from '../src/pages/PreferencesPage';
import { SettingsPage } from '../src/pages/SettingsPage';
import { StylesPage } from '../src/pages/StylesPage';
import { WrappedPage } from '../src/pages/WrappedPage';
import { SignInPage } from '../src/pages/SignInPage';
import { AuthFinishPage } from '../src/pages/AuthFinishPage';
import { NotFoundPage } from '../src/pages/NotFoundPage';

type Page = () => ReactElement;

/* Inside the shell: the navigation, the header and the page's own frame are part of the test. */
const shelled: [string, Page][] = [
  ['/', HomePage],
  ['/results', ResultsPage],
  ['/journey/nonexistent', JourneyDetailPage],
  ['/stops', StopsPage],
  ['/map', MapPage],
  ['/stops/utrecht-centraal', StopDetailPage],
  ['/departures', DeparturesPage],
  ['/disruptions', DisruptionsPage],
  ['/disruptions/d-crowding-utrecht', DisruptionDetailPage],
  ['/preferences', PreferencesPage],
  ['/settings', SettingsPage],
  ['/themes', StylesPage],
  ['/wrapped', WrappedPage],
  ['/does-not-exist', NotFoundPage],
];

/* Outside the shell: the two doors of the sign-in flow. */
const bare: [string, Page][] = [
  ['/signin', SignInPage],
  ['/auth/finish', AuthFinishPage],
];

let failures = 0;

function check(path: string, page: Page, inShell: boolean): void {
  try {
    const content = createElement(page);
    const html = renderToString(
      createElement(
        AppProvider,
        null,
        createElement(
          MemoryRouter,
          { initialEntries: [path] },
          inShell
            ? createElement(
                AppShell,
                null,
                createElement(
                  Routes,
                  null,
                  createElement(Route, { path: '*', element: createElement(page) }),
                ),
              )
            : content,
        ),
      ),
    );
    console.log(`OK   ${path} (${html.length} chars)`);
  } catch (error) {
    failures += 1;
    console.log(`FAIL ${path}: ${(error as Error).message}`);
  }
}

for (const [path, page] of shelled) check(path, page, true);
for (const [path, page] of bare) check(path, page, false);

console.log(
  failures === 0
    ? `\nAll ${shelled.length + bare.length} pages rendered without runtime errors.`
    : `\n${failures} page(s) failed to render.`,
);
process.exit(failures === 0 ? 0 : 1);
