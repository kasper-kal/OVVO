import type { ResultsFilter, SearchQuery } from '../data/journeyEngine';
import type { Journey, SortMode, TimeMode } from '../data/types';
import {
  DEFAULT_BACKGROUND_COLOUR,
  DEFAULT_CARD_TREATMENT,
  type BackgroundChoice,
  type CardTreatment,
} from '../lib/background';
import type { SelectionChoice } from '../lib/selection';
import type { CropRect } from '../lib/photoCrop';
import { DEFAULT_STYLE_ID, nearestStyleId } from '../lib/styles';

/** Light, dark, or whatever the device is set to. */
export type ThemeChoice = 'system' | 'light' | 'dark';

/** The languages the interface is written in. */
export type Language = 'en' | 'nl';

export interface Settings {
  /** The shape of this object when it was last written, so a changed default can reach a
      browser that already stored the old one. See `migrateSettings`. */
  version: number;
  /** Which appearance to draw: the two the app ships, or whatever the device asks for. */
  theme: ThemeChoice;
  /** The language the interface is written in. */
  language: Language;
  /** 24-hour ("14:05") or 12-hour ("2:05 pm") clock. */
  timeFormat: '24h' | '12h';
  /** Fixed dd-mm-yyyy dates or descriptive dates ("Tuesday 14 October"). */
  dateFormat: 'short' | 'long';
  /** Row and card spacing. */
  density: 'comfortable' | 'compact';
  /** Strengthens ink and hairline contrast. */
  highContrast: boolean;
  /** Disables spring and tactile movement. One switch, and it is the whole answer. */
  reduceMotion: boolean;
  /**
   * **The look.** One of the fifty in `lib/styles.ts`, and the whole of the interface's colour and
   * lettering: the page, the cards, the ink ramp, the accent, the selection and the two fonts.
   *
   * It replaced the three colour settings below, which are kept in storage for one version so a
   * rollback loses nothing — nothing reads them now (`STYLES_PLAN.md` §3.4). A style is a finished
   * answer rather than a colour, which is what ended the contrast problem: every ink is authored
   * against the surface it is drawn on instead of being derived from somebody's hex.
   */
  styleId: string;
  /**
   * The photo styles whose **photograph** is switched off, worn as their own colour instead.
   *
   * A list rather than a boolean because the answer belongs to each style: Marble set to Colour
   * stays colour when the traveller visits Arches and comes back. The saving modes ignore it — at
   * 10% of a battery no picture is drawn whatever this says — and the Styles card says so.
   */
  photoColourOnly: string[];
  /**
   * The colour selected text is painted with: one of the palette's five, or `custom`.
   *
   * Stored here rather than in its own slot because it is a setting like any other — one object,
   * one write, one reset. The ink is *not* stored: it is derived from this colour
   * (`lib/selection.ts`), so a colour cannot be saved with a stale ink beside it.
   */
  selectionColor: SelectionChoice;
  /** The traveller's own colour, `#rrggbb`, when `selectionColor` is `custom`; `''` otherwise. */
  selectionCustom: string;
  /*
   * The same two answers **for the dark appearance** — see `lib/palette.ts` for why there are two
   * sets at all. The light pair above is the one that existed first, so a stored object from before
   * this split already carries the light choice; `migrateSettings` copies it into the dark pair, so
   * the page nobody has customised since keeps the colour it had.
   */
  selectionColorDark: SelectionChoice;
  selectionCustomDark: string;
  /**
   * What the page is made of: the app's cream, the traveller's colour, or a photo.
   *
   * Three answers rather than one, and `cream` is a *choice* rather than the absence of one, so the
   * canvas a traveller has looked at since the first round is still there to choose and is still
   * what a fresh browser gets. See `lib/background.ts`.
   *
   * This is the **page** and nothing else since version 5: it used to decide the widgets and the
   * accent as well, which is what made "Background" the wrong home for the colour that paints
   * every widget on the screen. `primaryColour` is that colour now.
   */
  background: BackgroundChoice;
  /** The page's own colour, `#rrggbb`. Paints the page in `colour` mode; ignored on cream. */
  backgroundColour: string;
  /** The page's colour **in the dark appearance** (`lib/palette.ts`). */
  backgroundColourDark: string;
  /**
   * The **baked** photo the page draws: the traveller's crop, at most 1600px on its long edge.
   *
   * This is what `--app-bg-image` points at, so it is the one copy every screen has to be able to
   * draw. It is derived from the source below and the crop below, and rewritten whenever either
   * changes.
   */
  backgroundImage: string;
  /**
   * The **whole** picture, as the traveller gave it, downscaled to 2048px and kept as well.
   *
   * Kept so a crop can be redone without the quality loss of cropping a crop (asked for directly:
   * "Original kept"). It is never drawn on the page; only the crop screen reads it. Empty for a
   * browser that chose a photo before version 6 — there the baked image is the only copy, and the
   * crop screen opens on it as if it were the source.
   */
  backgroundImageSource: string;
  /**
   * Which part of the source is in the baked image, as fractions of the source (`lib/photoCrop.ts`).
   *
   * `null` means the whole picture — what choosing a photo does, since cropping is offered rather
   * than automatic. The crop screen restores its frame from these four numbers, so reopening it
   * shows exactly the frame that was left.
   */
  backgroundCrop: CropRect | null;
  /** Over a photo: cards that show it through glass, or cards in the tint. */
  cardTreatment: CardTreatment;
  /**
   * The colour the widgets are painted with — the cards, the panels, the sidebar and the accent —
   * so it can be a different colour from the page, which is the whole point of it being a setting
   * of its own (`Settings → Colours → Primary colour`).
   *
   * `''` means **follow the background**: the widgets take the page's colour when the page has one
   * and the app's own surfaces and coral when it does not. That is exactly the behaviour before
   * this setting existed, which is why it is the default — a browser that never opens the control
   * keeps the interface it already had. Over a photo, which has no page colour, `''` resolves to
   * the stored page colour, so the solid card treatment still remembers what was chosen.
   */
  primaryColour: string;
  /** The widgets' colour **in the dark appearance** (`lib/palette.ts`). */
  primaryColourDark: string;
  /** Which option the planner starts with. */
  defaultTimeMode: TimeMode;
  /** Prefilled origin for the planner. */
  defaultOriginStopId: string | null;
}

export const SETTINGS_VERSION = 10;

export const DEFAULT_SETTINGS: Settings = {
  version: SETTINGS_VERSION,
  theme: 'system',
  /* The app's own look: the cream page, white cards, obsidian ink and the coral accent. */
  styleId: DEFAULT_STYLE_ID,
  photoColourOnly: [],
  language: 'en',
  timeFormat: '24h',
  dateFormat: 'long',
  density: 'comfortable',
  highContrast: false,
  reduceMotion: false,
  /* The coral the app has always selected with — the same colour the dock's active entry is
     painted with, and the one that measured 7.1:1 in R98. */
  selectionColor: 'coral',
  selectionCustom: '',
  /* A new browser gets the same three colours in both appearances: the palette is *available* to
     differ, not different by default, so nothing here is a second design. */
  selectionColorDark: 'coral',
  selectionCustomDark: '',
  /*
   * The canvas the app has always drawn — `--canvas-base`, the warm cream — is the default, not a
   * fallback: a fresh browser and a browser that has been here since the beginning get the same
   * page until somebody chooses otherwise.
   */
  background: 'cream',
  backgroundColour: DEFAULT_BACKGROUND_COLOUR,
  backgroundColourDark: DEFAULT_BACKGROUND_COLOUR,
  backgroundImage: '',
  backgroundImageSource: '',
  backgroundCrop: null,
  cardTreatment: DEFAULT_CARD_TREATMENT,
  /* Follow the background — see the field's note: this is the interface the app already had. */
  primaryColour: '',
  primaryColourDark: '',
  defaultTimeMode: 'depart',
  defaultOriginStopId: null,
};

/**
 * How stored settings are brought forward.
 *
 * One step per version, and the stamp that makes a changed default reach a browser that already
 * stored the old one.
 *
 * Version 5 gave the widgets a colour of their own. Through version 4 `backgroundColour` was the
 * app's **tint** — one choice that painted the page, the widgets and the accent together, which
 * made "Background" the home of the colour used everywhere. The page keeps that job and
 * `primaryColour` takes the rest; it is absent from older objects and the merge with
 * `DEFAULT_SETTINGS` supplies `''`, i.e. *follow the background*, so a browser that stored version
 * 4 or earlier loads the interface it had before this setting existed. Nothing is rewritten here.
 *
 * Version 4 made the one colour one decision. `backgroundColour` used to paint the page only,
 * with every card keeping its own surface; it is now the app's **tint**, so a browser that had
 * chosen a page colour finds that same colour on its widgets, its cards and its accent when it
 * next loads. `cardTreatment` is also absent from older objects, and is supplied the same way.
 * Earlier,
 * `boardAutoRefresh` was moved from its old default of `0` (off) up to `5` and has since been
 * **removed** — the board is a live screen at a fixed 5 seconds (see `BOARD_REFRESH_SECONDS` in
 * `DeparturesPage`) — so a stale value is simply ignored.
 */
export function migrateSettings(stored: Partial<Settings>): Partial<Settings> {
  /*
   * **Version 8 mirrors the three colours into the dark appearance.** They were one value each
   * drawn in both appearances, so the honest translation is "the colour you chose is now the
   * colour in *both*" — the page keeps exactly what it had, and the two palettes start equal and
   * drift only when the traveller says so. Anything else (a dark default, an empty slot) would
   * repaint the page of somebody who never opened Settings.
   */
  return {
    ...stored,
    /*
     * **Version 9 replaces the three colours with a style.** A browser that never chose a colour
     * keeps the app's own look, which is the style `tram` — the exact page, cards and coral it has
     * been drawing. A browser that *did* customise gets the style nearest to what it chose, worked
     * out once by colour distance (`nearestStyleId`), so nobody's page changes shape on the way in.
     * The old fields stay untouched for one version; nothing reads them.
     */
    styleId:
      stored.styleId ??
      nearestStyleId({
        page: stored.background === 'colour' ? stored.backgroundColour : undefined,
        accent: stored.primaryColour || undefined,
      }),
    photoColourOnly: stored.photoColourOnly ?? [],
    /*
     * **Version 10 keeps motion a single switch.** It spent part of one build as three answers
     * (`system` / `full` / `reduced`), which was a control nobody asked for. A browser that answered
     * that control while it existed keeps the only part that mattered, whether movement is reduced;
     * `system` and `full` both mean "not reduced".
     */
    reduceMotion:
      stored.reduceMotion ?? ((stored as { motion?: string }).motion === 'reduced'),
    backgroundColourDark:
      stored.backgroundColourDark ?? stored.backgroundColour ?? DEFAULT_SETTINGS.backgroundColourDark,
    primaryColourDark: stored.primaryColourDark ?? stored.primaryColour ?? DEFAULT_SETTINGS.primaryColourDark,
    selectionColorDark: stored.selectionColorDark ?? stored.selectionColor ?? DEFAULT_SETTINGS.selectionColorDark,
    selectionCustomDark: stored.selectionCustomDark ?? stored.selectionCustom ?? DEFAULT_SETTINGS.selectionCustomDark,
    version: SETTINGS_VERSION,
  };
}

/*
 * Version 6 keeps the whole photograph beside the crop (`backgroundImageSource`), and remembers the
 * frame (`backgroundCrop`) so the crop screen can be reopened on the same part of the picture.
 * Neither needs rewriting here: a browser that stored version 5 has no source, and the merge with
 * `DEFAULT_SETTINGS` supplies `''` and `null` — which the crop screen reads as "the baked image is
 * the whole picture", exactly the centre crop that browser already has. Nothing about the page it
 * draws changes on the way in.
 *
 * Version 7 added `buttonColour` (*Match colours* painting every button), and it has been
 * **removed** again: the control was reported as repainting buttons that had no fill of their own
 * ("it gives button that never HAD backdrop, BACKDROP"), and what *Match colours* is for is the
 * three colours of the palette — the page, the primary colour and the selected text. A stored
 * `buttonColour` is simply ignored, and every button returns to its own variant.
 */

export interface SavedJourney {
  id: string;
  signature: string;
  title: string;
  savedAt: number;
  query: SearchQuery;
  journey: Journey;
  windowOffsetMinutes: number;
}

export interface RecentSearch {
  id: string;
  query: SearchQuery;
  at: number;
}

/**
 * One search this browser ran.
 *
 * Kept apart from `RecentSearch` on purpose, even though the two objects have the same shape: a
 * **kept** search is a pair the traveller decided to keep ("Home → Work") and is written only by
 * the results screen's Save control, while a **history** entry is written by running a search and
 * is never a decision. Merging the two lists is what made "Recent searches" and "Saved searches"
 * read as the same card.
 */
export interface SearchHistoryEntry {
  id: string;
  query: SearchQuery;
  at: number;
}

export interface PlannerSearchState {
  query: SearchQuery;
  windowOffsetMinutes: number;
  sortMode: SortMode;
  filter: ResultsFilter;
}

/**
 * A widget's width, in columns of the home screen's 12-column grid: 4 is a third, 6 a half, 8
 * two-thirds, 12 the full width.
 *
 * It is the whole of a widget's size — there is nothing else to choose. A card is the width its
 * widget declares and as tall as its own content, and the home screen draws it that way at every
 * device width.
 */
export type WidgetWidth = 4 | 6 | 8 | 12;

/** Whether the traveller has answered the location prompt (asked once, on first open). */
export type LocationConsent = 'unknown' | 'granted' | 'denied';

export interface UserLocation {
  lat: number;
  lon: number;
  /** Reported accuracy of the fix, in metres. */
  accuracy: number;
  /** Epoch milliseconds when the fix was taken. */
  at: number;
}
