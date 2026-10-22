import type { Settings } from '../state/types';
import type { SelectionChoice } from './selection';

/**
 * **The colours, per appearance.**
 *
 * Three settings — the page's colour, the widgets' colour and the selection's colour — used to be
 * one value each, drawn in both appearances. That is the wrong shape and it always was: the ink,
 * the cards and the map's cut are derived *against the appearance* (`applyBackground` measures the
 * same tint twice for exactly this reason), so a navy chosen to sit under cream ink in light mode
 * was then force-fitted onto near-black, and a pale selection colour picked against the dark canvas
 * turned to a smear over the cream one. One colour cannot be tuned for two ink systems.
 *
 * So each appearance keeps its own three. `light` uses the fields that existed before this split, so
 * a browser that has never seen the new ones keeps the interface it has — `migrateSettings` copies
 * the old value into `dark` on the way in, which is what stops anyone's page changing on this
 * version.
 *
 * Nothing derived is stored: the ink on a selection colour, and the palette a tint produces, are
 * still computed from the appearance in force, so a colour cannot be saved beside an ink that has
 * since stopped matching it.
 */

export type PaletteMode = 'light' | 'dark';

/**
 * **The canvas each palette is made of.**
 *
 * `Default` means the app's own canvas, and that canvas is a different colour in each appearance —
 * cream (`#FCFBFA`, `--canvas-base`) in light, near-black (`#121211`) in dark. The row used to
 * paint its swatch from `--canvas-base`, which is the canvas of the appearance **in force**: with
 * the app in dark, the LIGHT tab showed a black `Default` beside the word, so the one row that
 * says what the light page will be was painted with the dark one (reported). The swatch follows
 * the tab being edited now.
 */
export const PALETTE_CANVAS: Record<PaletteMode, string> = {
  light: '#FCFBFA',
  dark: '#121211',
};

export interface Palette {
  /** The page's own colour, `#rrggbb`. Paints the page in `colour` mode. */
  backgroundColour: string;
  /** The widgets' colour; `''` means follow the background. */
  primaryColour: string;
  /** Which colour selected text is painted with. */
  selectionColor: SelectionChoice;
  /** The traveller's own selection colour, when `selectionColor` is `custom`. */
  selectionCustom: string;
}

/** The three colours **in force** in `mode`. */
export function paletteFor(settings: Settings, mode: PaletteMode): Palette {
  if (mode === 'light') {
    return {
      backgroundColour: settings.backgroundColour,
      primaryColour: settings.primaryColour,
      selectionColor: settings.selectionColor,
      selectionCustom: settings.selectionCustom,
    };
  }
  return {
    backgroundColour: settings.backgroundColourDark,
    primaryColour: settings.primaryColourDark,
    selectionColor: settings.selectionColorDark,
    selectionCustom: settings.selectionCustomDark,
  };
}

/**
 * A palette change, as a settings patch for `mode`.
 *
 * Written out key by key rather than by renaming strings: these two sets of field names are the one
 * place a typo would be silent — the row would show a colour it had not just stored — so the
 * mapping is explicit and the compiler checks both halves.
 */
export function palettePatch(mode: PaletteMode, patch: Partial<Palette>): Partial<Settings> {
  if (mode === 'light') {
    return {
      ...(patch.backgroundColour !== undefined ? { backgroundColour: patch.backgroundColour } : {}),
      ...(patch.primaryColour !== undefined ? { primaryColour: patch.primaryColour } : {}),
      ...(patch.selectionColor !== undefined ? { selectionColor: patch.selectionColor } : {}),
      ...(patch.selectionCustom !== undefined ? { selectionCustom: patch.selectionCustom } : {}),
    };
  }
  return {
    ...(patch.backgroundColour !== undefined
      ? { backgroundColourDark: patch.backgroundColour }
      : {}),
    ...(patch.primaryColour !== undefined ? { primaryColourDark: patch.primaryColour } : {}),
    ...(patch.selectionColor !== undefined ? { selectionColorDark: patch.selectionColor } : {}),
    ...(patch.selectionCustom !== undefined ? { selectionCustomDark: patch.selectionCustom } : {}),
  };
}
