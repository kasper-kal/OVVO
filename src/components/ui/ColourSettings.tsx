import { useEffect, useRef, useState } from 'react';
import { Button, Card, Dialog, Segmented } from './primitives';
import { FullScreen } from './FullScreen';
import { ColourScreen } from './ColourScreen';
import { PhotoScreen } from './PhotoScreen';
import { PhotoCropScreen } from './PhotoCropScreen';
import { Icon } from './Icons';
import { useApp } from '../../state/AppState';
import { useT } from '../../lib/useT';
import {
  BACKGROUND_IMAGE_MAX_EDGE,
  BACKGROUND_SOURCE_MAX_EDGE,
  BACKGROUND_SWATCHES,
  buttonPaintFor,
  readImageFile,
  type BackgroundChoice,
  type CardTreatment,
} from '../../lib/background';
import { FULL_CROP, bakeCrop, type CropRect } from '../../lib/photoCrop';
import { SELECTION_SWATCHES, selectionColor } from '../../lib/selection';
import { PALETTE_CANVAS, paletteFor, palettePatch, type PaletteMode } from '../../lib/palette';
import { DEFAULT_SETTINGS } from '../../state/types';
import { readHex } from '../../lib/colour';

/**
 * **Three rows, each opening the screen that answers it.**
 *
 * This replaces the inline Colours card, which had grown to eleven controls and 288 characters of
 * hint text in its simplest state (fourteen controls in photo mode), with a paragraph under every
 * control. The pattern is Apple's: Settings is a hierarchy of lists, a row names the setting, shows
 * its current value, and a disclosure indicator opens the next level (HIG, *Lists and tables*;
 * *Layout* on progressive disclosure). The choices were never the problem — the full-screen
 * pickers stay exactly as they were. The problem was putting every choice on the parent.
 */

/* ---------------------------------------------------------------------- the row */

function Row({
  label,
  value,
  swatch,
  swatchImage,
  onClick,
}: {
  label: string;
  value: string;
  /** A solid colour for the left-hand chip, when the setting is a colour. */
  swatch?: string;
  /** A photograph instead of a colour, for the Background row in photo mode. */
  swatchImage?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="settings-row" onClick={onClick}>
      {swatch || swatchImage ? (
        <span
          className="settings-row__swatch"
          style={
            swatchImage
              ? { backgroundImage: `url("${swatchImage}")` }
              : { background: swatch }
          }
          aria-hidden="true"
        />
      ) : null}
      <span className="settings-row__label">{label}</span>
      <span className="settings-row__value">{value}</span>
      <Icon name="chevronRight" size={16} />
    </button>
  );
}

/* --------------------------------------------------------------- photo plumbing */

/**
 * The photograph's two writes, shared by the two screens that can make them: choosing a file (from
 * Background) and baking a frame (from either screen's Crop).
 *
 * Two copies, deliberately (`state/types.ts`): the whole picture at 2048px so a crop can be redone
 * without cropping a crop, and the baked image the page draws. A failure leaves the current
 * background alone — a refused file must not clear a picture that was working.
 */
function usePhotoActions() {
  const { settings, updateSettings } = useApp();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const take = async (file: File) => {
    setBusy(true);
    try {
      const source = await readImageFile(file, BACKGROUND_SOURCE_MAX_EDGE);
      const baked = await bakeCrop(source, FULL_CROP, BACKGROUND_IMAGE_MAX_EDGE);
      updateSettings({
        background: 'photo',
        backgroundImage: baked,
        backgroundImageSource: source,
        backgroundCrop: null,
      });
      setError('');
    } catch (caught) {
      setError(t(caught instanceof Error ? caught.message : 'That image could not be read.'));
    } finally {
      setBusy(false);
    }
  };

  const saveCrop = async (rect: CropRect) => {
    const source = settings.backgroundImageSource || settings.backgroundImage;
    if (!source) return;
    setBusy(true);
    try {
      const baked = await bakeCrop(source, rect, BACKGROUND_IMAGE_MAX_EDGE);
      updateSettings({ background: 'photo', backgroundImage: baked, backgroundCrop: rect });
      setError('');
    } catch (caught) {
      setError(t(caught instanceof Error ? caught.message : 'That image could not be read.'));
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, take, saveCrop };
}

/* ------------------------------------------------------------------- the screens */

function BackgroundScreen({
  open,
  onClose,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  /** The appearance being edited — its own page colour (`lib/palette.ts`). */
  mode: PaletteMode;
}) {
  const { settings, appearance, updateSettings } = useApp();
  const t = useT();
  const palette = paletteFor(settings, mode);
  const { busy, error, take, saveCrop } = usePhotoActions();
  const [picker, setPicker] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const hint =
    settings.background === 'cream'
      ? t(appearance === 'dark' ? 'The app’s own black canvas.' : 'The app’s own cream canvas.')
      : settings.background === 'colour'
        ? t('The page’s own colour. The widgets keep theirs. See Primary colour.')
        : t('Your photo, kept on this device under a wash of the canvas colour.');

  return (
    <>
      <FullScreen
        title={t('Background')}
        /*
         * Escape closes the screen that is on top, not both: the picker and the crop screen are
         * stacked over this one, and every `FullScreen` listens on `window`, so without the guard
         * one Escape closed the picker *and* the screen behind it.
         */
        onClose={() => {
          if (picker || cropOpen) return;
          onClose();
        }}
        right={
          <Button variant="surface" size="sm" onClick={onClose}>
            {t('Done')}
          </Button>
        }
      >
        <div className="stack-4 colour-settings-screen">
          <div className="field">
            <span className="field__label">{t('Background')}</span>
            <Segmented
              ariaLabel={t('Background')}
              value={settings.background}
              onChange={(value) => {
                /*
                 * **Cream is the whole app's canvas, not half of it.** With a widgets' colour
                 * still set, choosing Cream repainted only the strips between the cards, which is
                 * exactly "pressing cream doesn't give me a cream background" (reported). Cream
                 * therefore returns the widgets to following it; anyone who wants cream behind a
                 * coloured widget can set that again on the Widgets screen, where it is stated.
                 */
                if (value === 'cream') {
                  updateSettings({
                    background: 'cream',
                    ...palettePatch(mode, { primaryColour: '' }),
                  });
                  return;
                }
                updateSettings({ background: value as BackgroundChoice });
              }}
              options={[
                /*
                 * **Default, in both appearances — and the hint names the colour it paints.**
                 *
                 * The segment, the row's value and the swatch all said *Cream* while the dark
                 * appearance drew `#121211` under them, so the one control that promises what the
                 * page will be stated something false (reported with a screenshot of a black swatch
                 * beside the word "Cream"). The swatch was always right — it is `--canvas-base` —
                 * and the answer is not a second name for the same value: *Cream* in light and
                 * *Black* in dark renames the setting whenever the theme flips, including on its own
                 * at sunset under **System**, which reads as a control that changed itself. The list
                 * is really *whose* it is — the app's, yours, yours — and the app's own is
                 * **Default** in every appearance. What colour that is lives in the hint below
                 * (*the app's own cream canvas* / *black canvas*) and in the swatch, which show the
                 * truth without the label moving.
                 */
                { value: 'cream', label: t('Default') },
                { value: 'colour', label: t('Colour') },
                { value: 'photo', label: t('Photo') },
              ]}
            />
            <p className="field__hint">{hint}</p>
          </div>

          {settings.background === 'colour' ? (
            <div className="field">
              <span className="field__label">{t('Page colour')}</span>
              <Row
                label={t('Colour')}
                value={palette.backgroundColour.toUpperCase()}
                swatch={palette.backgroundColour}
                onClick={() => setPicker(true)}
              />
            </div>
          ) : null}

          {settings.background === 'photo' ? (
            <>
              <div className="field">
                <span className="field__label">{t('Photo')}</span>
                <div className="row-wrap">
                  <Button icon="plus" onClick={() => fileRef.current?.click()} disabled={busy}>
                    {settings.backgroundImage ? t('Replace the photo') : t('Choose a photo')}
                  </Button>
                  {settings.backgroundImage ? (
                    <Button icon="crop" onClick={() => setCropOpen(true)} disabled={busy}>
                      {t('Crop')}
                    </Button>
                  ) : null}
                  {settings.backgroundImage ? (
                    <Button
                      variant="ghost"
                      icon="trash"
                      onClick={() =>
                        updateSettings({
                          backgroundImage: '',
                          backgroundImageSource: '',
                          backgroundCrop: null,
                        })
                      }
                    >
                      {t('Remove the photo')}
                    </Button>
                  ) : null}
                </div>
                <p className="field__hint">{t('Crop it to choose what the page shows.')}</p>
                {error ? <p className="field__error">{error}</p> : null}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  tabIndex={-1}
                  aria-label={t('Choose a background photo')}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) void take(file);
                  }}
                />
              </div>

              <div className="field">
                <span className="field__label">{t('Cards')}</span>
                <Segmented
                  ariaLabel={t('Cards')}
                  value={settings.cardTreatment}
                  onChange={(value) => updateSettings({ cardTreatment: value as CardTreatment })}
                  options={[
                    { value: 'glass', label: t('Glass') },
                    { value: 'colour', label: t('Colour') },
                  ]}
                />
                <p className="field__hint">
                  {settings.cardTreatment === 'glass'
                    ? t('Translucent cards that show the photo through, blurred and saturated.')
                    : t('Solid cards in the widgets’ colour.')}
                </p>
              </div>
            </>
          ) : null}
          {/*
            **Only the background.** Default page, its colour back to the app's own, the photo gone
            — the three things this screen decides, and nothing the other two rows decide.
          */}
          <Button
            variant="ghost"
            icon="refresh"
            onClick={() =>
              updateSettings({
                background: 'cream',
                backgroundImage: '',
                backgroundImageSource: '',
                backgroundCrop: null,
                ...palettePatch(mode, {
                  backgroundColour:
                    mode === 'dark'
                      ? DEFAULT_SETTINGS.backgroundColourDark
                      : DEFAULT_SETTINGS.backgroundColour,
                }),
              })
            }
          >
            {t('Reset the background')}
          </Button>
        </div>
      </FullScreen>

      <ColourScreen
        open={picker}
        title={t('Background colour')}
        value={palette.backgroundColour}
        swatches={BACKGROUND_SWATCHES}
        onChange={(hex) => updateSettings(palettePatch(mode, { backgroundColour: hex }))}
        onClose={() => setPicker(false)}
      />
      <PhotoCropScreen
        open={cropOpen && Boolean(settings.backgroundImage)}
        source={settings.backgroundImageSource || settings.backgroundImage}
        crop={settings.backgroundCrop}
        onSave={(rect) => {
          setCropOpen(false);
          void saveCrop(rect);
        }}
        onClose={() => setCropOpen(false)}
      />
    </>
  );
}

function WidgetsScreen({
  open,
  onClose,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  /** The appearance being edited — its own widgets' colour (`lib/palette.ts`). */
  mode: PaletteMode;
}) {
  const { settings, updateSettings } = useApp();
  const t = useT();
  const palette = paletteFor(settings, mode);
  const { error, saveCrop } = usePhotoActions();
  const [picker, setPicker] = useState(false);
  const [photoScreen, setPhotoScreen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);

  if (!open) return null;

  const primaryInForce =
    palette.primaryColour ||
    (settings.background === 'colour' ? palette.backgroundColour : '') ||
    '#ff7e67';
  /*
   * Short values on purpose: the row is 44px and the label is long ("Follow the background"), so
   * the full sentence lives in the hint below. Measured at 320px, the long value clipped by 6px.
   */
  const follow = settings.background === 'colour' ? t('Page colour') : t('App default');
  const followHint =
    settings.background === 'colour'
      ? t('The widgets take the page’s colour.')
      : settings.background === 'photo'
        ? t('A photo has no colour of its own, so this uses the app’s own surfaces and coral. Choose a colour, or take one from the photo.')
        : t('The page is the app’s own canvas, so this uses the app’s own surfaces and coral.');

  return (
    <>
      <FullScreen
        title={t('Primary colour')}
        onClose={() => {
          if (picker || photoScreen || cropOpen) return;
          onClose();
        }}
        right={
          <Button variant="surface" size="sm" onClick={onClose}>
            {t('Done')}
          </Button>
        }
      >
        <div className="stack-4 colour-settings-screen">
          <div className="settings-group">
            <button
              type="button"
              className="settings-row"
              aria-pressed={!palette.primaryColour}
              onClick={() => updateSettings(palettePatch(mode, { primaryColour: '' }))}
            >
              <span className="settings-row__label">{t('Follow the background')}</span>
              <span className="settings-row__value">{follow}</span>
              {!palette.primaryColour ? <Icon name="check" size={16} /> : null}
            </button>
            <Row
              label={t('Choose a colour')}
              value={palette.primaryColour ? hexLabel(palette.primaryColour) : ''}
              swatch={primaryInForce}
              onClick={() => setPicker(true)}
            />
          </div>
          <p className="field__hint">{followHint}</p>
          {error ? <p className="field__error">{error}</p> : null}
          {/*
            **Only this colour.** The card's *Reset colours* puts all three back; a traveller who
            has just tried a primary colour should not have to lose the page and the selection with
            it to undo one decision.
          */}
          <Button
            variant="ghost"
            icon="refresh"
            onClick={() => updateSettings(palettePatch(mode, { primaryColour: '' }))}
          >
            {t('Reset the primary colour')}
          </Button>
        </div>
      </FullScreen>

      <ColourScreen
        open={picker}
        title={t('Primary colour')}
        value={primaryInForce}
        swatches={BACKGROUND_SWATCHES}
        image={settings.backgroundImage || undefined}
        onPickFromPhoto={
          settings.backgroundImage
            ? () => {
                setPicker(false);
                setPhotoScreen(true);
              }
            : undefined
        }
        onChange={(hex) => updateSettings(palettePatch(mode, { primaryColour: hex }))}
        onClose={() => setPicker(false)}
      />

      {settings.backgroundImage ? (
        <PhotoScreen
          open={photoScreen}
          image={settings.backgroundImage}
          value={primaryInForce}
          onCommit={(hex) => {
            updateSettings(palettePatch(mode, { primaryColour: hex }));
            setPhotoScreen(false);
          }}
          onClose={() => {
            if (cropOpen) return;
            setPhotoScreen(false);
          }}
          onCrop={() => setCropOpen(true)}
        />
      ) : null}

      <PhotoCropScreen
        open={cropOpen && Boolean(settings.backgroundImage)}
        source={settings.backgroundImageSource || settings.backgroundImage}
        crop={settings.backgroundCrop}
        onSave={(rect) => {
          setCropOpen(false);
          void saveCrop(rect);
        }}
        onClose={() => setCropOpen(false)}
      />
    </>
  );
}

/** A hex as this app writes it. The stored value is already lower case; the row shows upper. */
function hexLabel(hex: string): string {
  return hex.toUpperCase();
}

function SelectionScreen({
  open,
  onClose,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  /** The appearance being edited — its own selection colour (`lib/palette.ts`). */
  mode: PaletteMode;
}) {
  const { settings, updateSettings } = useApp();
  const t = useT();
  const palette = paletteFor(settings, mode);
  const current = selectionColor(palette.selectionColor, palette.selectionCustom) || '#ff7e67';
  /*
   * **Custom opens this app's own picker now, not the device's.**
   *
   * The row used to hand the traveller straight to the platform dialog, which is a fine picker and
   * a strange thing to be the *only* one: the five named colours were a list you could only leave
   * by going to a different operating system's idea of a colour picker, with no spectrum, no hex
   * field and no sight of what the app would do with the value. The screen the other two colour
   * rows open — grid, spectrum, typed value — opens here instead, and its own **Pick your own**
   * button is the way on to the device's picker for anyone who prefers it.
   */
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!open) return null;

  return (
    <>
    <FullScreen
      title={t('Text selection')}
      onClose={onClose}
      right={
        <Button variant="surface" size="sm" onClick={onClose}>
          {t('Done')}
        </Button>
      }
    >
      <div className="stack-4">
        <div className="settings-group">
          {SELECTION_SWATCHES.map((swatch) => (
            <button
              key={swatch.key}
              type="button"
              className="settings-row"
              aria-pressed={palette.selectionColor === swatch.key}
              onClick={() => updateSettings(palettePatch(mode, { selectionColor: swatch.key }))}
            >
              <span
                className="settings-row__swatch"
                style={{ background: selectionColor(swatch.key, '') }}
                aria-hidden="true"
              />
              <span className="settings-row__label">{t(swatch.label)}</span>
              {palette.selectionColor === swatch.key ? <Icon name="check" size={16} /> : null}
            </button>
          ))}
          <button
            type="button"
            className="settings-row"
            aria-pressed={palette.selectionColor === 'custom'}
            onClick={() => setPickerOpen(true)}
          >
            <span
              className="settings-row__swatch"
              style={{ background: current }}
              aria-hidden="true"
            />
            <span className="settings-row__label">{t('Custom')}</span>
            {palette.selectionColor === 'custom' ? <Icon name="check" size={16} /> : null}
          </button>
        </div>
        <p className="field__hint">
          {t('The colour behind selected text. The ink on it is chosen for contrast, so a dark colour gets light text.')}
        </p>
        {/* Only this colour — see the note on the primary colour's own reset. */}
        <Button
          variant="ghost"
          icon="refresh"
          onClick={() =>
            updateSettings(palettePatch(mode, { selectionColor: 'coral', selectionCustom: '' }))
          }
        >
          {t('Reset the selected-text colour')}
        </Button>
      </div>
    </FullScreen>
    {/*
      The app's own picker, over this screen rather than instead of it — the same way the photo
      sampler opens over the widgets dialog. Closing it brings the five colours back.
    */}
    <ColourScreen
      open={pickerOpen}
      title={t('Custom colour')}
      value={current}
      swatches={SELECTION_SWATCHES.map((swatch) => selectionColor(swatch.key, '')).filter(Boolean)}
      onChange={(hex) =>
        updateSettings(palettePatch(mode, { selectionColor: 'custom', selectionCustom: hex }))
      }
      onClose={() => setPickerOpen(false)}
    />
    </>
  );
}

/* -------------------------------------------------------------- match colours */

/**
 * **One colour for every button, chosen in a pop-up.**
 *
 * The pop-up is the dialog rather than the full-screen picker the other colour rows open: this is a
 * decision about one family of controls, and the page it is about is still visible behind it. The
 * swatches are the picker's own row, the device's colour picker is one button away for anything not
 * on it, and the sentence under the preview is *measured* by `buttonPaintFor` — the same function
 * the buttons are painted from — so the pop-up cannot promise a readable label that the buttons then
 * draw differently.
 */
/**
 * **Match colours — one colour for the page, the widgets and every button.**
 *
 * The order was in two parts: *"Match colours is supposed to match all 3 of these colour to the
 * exact same HEX"*, and *"there's no clear way to confirm a colour matching, the only button is
 * stop matching"*. This control did one of the three (the buttons), and it applied the moment a
 * swatch was touched — so every button in the app changed before the traveller could see what they
 * had chosen, and the only action offered was an undo.
 *
 * Now the draft colour is held here and painted in the preview, the three surfaces it will paint
 * are shown side by side, and **Match all three** is the confirmation. Nothing is written until it
 * is pressed, and *Cancel* leaves every colour as it was. The hex goes into all three slots of the
 * palette being edited (page, widgets, buttons), which is what "the exact same HEX" means.
 */
function MatchColoursDialog({
  open,
  onClose,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  mode: PaletteMode;
}) {
  const { settings, updateSettings } = useApp();
  const t = useT();
  const palette = paletteFor(settings, mode);
  const pageNow = (settings.background === 'colour' ? palette.backgroundColour : '').trim().toLowerCase();
  const primaryNow = (palette.primaryColour || pageNow).trim().toLowerCase();
  const selectionNow =
    palette.selectionColor === 'custom' ? palette.selectionCustom.trim().toLowerCase() : '';
  /* All three holding one hex — the only state in which "Matched" is true. */
  const everythingMatched =
    Boolean(pageNow) && pageNow === primaryNow && selectionNow === pageNow;
  const initial = (pageNow || primaryNow || '#ff7e67').toUpperCase();
  const [draft, setDraft] = useState(initial);
  const colorRef = useRef<HTMLInputElement | null>(null);

  /* Opening the dialog starts from the colour in force; nothing is applied until the confirmation. */
  useEffect(() => {
    if (open) setDraft(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const hex = draft.toLowerCase();
  const valid = /^#[0-9a-f]{6}$/i.test(draft) && Boolean(readHex(draft));
  const paint = buttonPaintFor(valid ? hex : '#ff7e67');

  const confirm = () => {
    if (!valid) return;
    updateSettings({
      /*
       * **One write, three slots: the page, the primary colour and the selected text.** Buttons
       * are not among them — painting every `.btn` filled the ones that had no fill of their own
       * ("it gives button that never HAD backdrop, BACKDROP"), which is a different control and
       * not what this button is for.
       */
      ...palettePatch(mode, {
        backgroundColour: hex,
        primaryColour: hex,
        selectionColor: 'custom',
        selectionCustom: hex,
      }),
      background: 'colour',
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      title={t('Match colours')}
      description={t('One colour for the page, the primary colour and the selected text: the same HEX in all three.')}
      onClose={onClose}
      footer={
        <>
          <Button variant="primary" icon="check" onClick={confirm} disabled={!valid}>
            {t('Match all three')}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t('Cancel')}
          </Button>
        </>
      }
    >
      <div className="stack-4">
        {/*
          **One sample, not three.**
          *
          * The dialog drew three boxes — a page, a card and a pill — to show that one colour would
          * paint three surfaces. They were three sizes, three corner radii and three heights of
          * label in one row, which read as three different things rather than one colour repeated
          * (reported with a screenshot: *"why are these all different heights and stuff, its ugly,
          * its unnecessary to even have examples because you already have an example here"* — the
          * swatch, which the picker already shows the chosen colour in). The colour is shown the
          * way a colour is shown in this app: one square swatch, ringed when it is the one held.
          */}
        <div className="row-wrap">
          <span
            className="colour-screen__swatch is-selected"
            style={{ background: paint.bg, width: 'var(--target-min)', height: 'var(--target-min)' }}
            aria-hidden="true"
          />
          <span className="t-strong t-mono-num">{paint.bg.toUpperCase()}</span>
          <span className="t-sm t-faint grow">
            {t('The labels take {ink} ink, {ratio}:1', {
              ink: paint.light ? t('light') : t('dark'),
              ratio: paint.ratio.toFixed(1),
            })}
          </span>
          {everythingMatched ? (
            <span className="t-sm t-strong">{t('Matched')}</span>
          ) : (
            <span className="t-sm t-muted">{t('Not matched yet')}</span>
          )}
        </div>

        <div className="stack-2">
          <span className="field__label">{t('Colours')}</span>
          <div className="colour-screen__grid">
            {BACKGROUND_SWATCHES.map((swatch) => {
              const colour = swatch.toLowerCase();
              return (
                <button
                  key={swatch}
                  type="button"
                  className={`colour-screen__swatch${colour === paint.bg ? ' is-selected' : ''}`}
                  style={{ background: swatch }}
                  aria-label={colour.toUpperCase()}
                  aria-pressed={colour === paint.bg}
                  onClick={() => setDraft(colour.toUpperCase())}
                />
              );
            })}
          </div>
        </div>

        <div className="row-wrap">
          <Button
            onClick={() => {
              const input = colorRef.current;
              if (!input) return;
              input.value = hex;
              input.click();
            }}
          >
            {t('Pick your own')}
          </Button>
          <span className="t-sm t-faint grow">{t('Opens the colour picker of this device.')}</span>
          <input
            ref={colorRef}
            type="color"
            className="sr-only"
            tabIndex={-1}
            aria-label={t('The colour all three take')}
            value={hex}
            onChange={(event) => setDraft(event.target.value.toUpperCase())}
          />
        </div>

        <label className="field">
          <span className="field__label">{t('Hex value')}</span>
          <input
            className="input t-mono-num"
            value={draft}
            autoComplete="off"
            spellCheck={false}
            maxLength={7}
            onChange={(event) => setDraft(event.target.value.toUpperCase())}
          />
          <span className="field__hint">
            {valid ? t('Press “Match all three” to apply it.') : t('Enter a whole colour, like #1B4D3E.')}
          </span>
        </label>
      </div>
    </Dialog>
  );
}

/* ---------------------------------------------------------------------- the card */

export function ColourSettings() {
  const { settings, appearance, updateSettings } = useApp();
  const t = useT();
  const [screen, setScreen] = useState<'background' | 'widgets' | 'selection' | 'match' | null>(
    null,
  );
  /*
   * **Which palette this card is editing — not which appearance is on.**
   *
   * These are two different questions and the control below answers only the first. It never
   * writes `settings.theme`: the app keeps the appearance it was in, and choosing *dark* while the
   * app is in light mode changes three stored colours that nothing on this screen is currently
   * drawn in. The copy under the control says that outright, because a segmented control with two
   * appearance names on it looks exactly like the appearance switch and is not one (reported).
   *
   * `null` means nothing has been picked here yet, and the card follows the appearance being drawn
   * — which is the palette the traveller is looking at, and stays right when **System** flips the
   * app at sunset. Once they choose, the card stays where they put it, so a device changing its
   * mind cannot move the thing under their finger.
   */
  const [pickedMode, setPickedMode] = useState<PaletteMode | null>(null);
  const mode: PaletteMode = pickedMode ?? appearance;
  const palette = paletteFor(settings, mode);
  /* The two names, so the sentence below cannot say "light" where the switch says "Licht". */
  const modeName = mode === 'dark' ? t('Dark') : t('Light');
  const appearanceName = appearance === 'dark' ? t('Dark') : t('Light');
  /* Editing the palette the app is not wearing: the one case that needs saying out loud. */
  const pickedOther = mode !== appearance;

  const primaryInForce =
    palette.primaryColour ||
    (settings.background === 'colour' ? palette.backgroundColour : '') ||
    '#ff7e67';
  /* All three slots holding one hex — the only state that may say "Everything". */
  const pageHex = (settings.background === 'colour' ? palette.backgroundColour : '').trim().toLowerCase();
  const primaryHex = (palette.primaryColour || pageHex).trim().toLowerCase();
  const selectionHex =
    palette.selectionColor === 'custom' ? palette.selectionCustom.trim().toLowerCase() : '';
  const everythingMatched = Boolean(pageHex) && pageHex === primaryHex && selectionHex === pageHex;
  const currentSelection =
    selectionColor(palette.selectionColor, palette.selectionCustom) || '#ff7e67';
  const selectionLabel =
    palette.selectionColor === 'custom'
      ? t('Custom')
      : t(
          SELECTION_SWATCHES.find((swatch) => swatch.key === palette.selectionColor)?.label ??
            'Coral',
        );
  const backgroundLabel =
    settings.background === 'cream'
      ? t('Default')
      : settings.background === 'colour'
        ? t('Colour')
        : t('Photo');

  return (
    <>
      <Card className="stack-3">
        <h2 className="t-section">{t('Colours')}</h2>
        {/*
          **Which palette, and an explicit statement that it is not the appearance switch.**

          The app has an appearance control of its own, a few cards up. This one wears the same
          two words and does something else entirely — it chooses whose colours the three rows
          below are — so the hint says what it is, what it is not, and (when the two disagree)
          where the change will be seen. Without that last part, choosing dark colours while the
          app is light looks like a control that did nothing at all.
        */}
        <div className="field">
          <span className="field__label">{t('Colours for')}</span>
          <Segmented
            ariaLabel={t('Colours for')}
            value={mode}
            onChange={(value) => setPickedMode(value as PaletteMode)}
            options={[
              { value: 'light', label: t('Light') },
              { value: 'dark', label: t('Dark') },
            ]}
          />
          <p className="field__hint">
            {t('This only picks which palette you are editing. It does not change the app’s appearance. Use Appearance for that.')}
          </p>
          {pickedOther ? (
            <p className="field__hint">
              {t('The app is {appearance} right now, so you will see these colours when it is {mode}.', {
                appearance: appearanceName,
                mode: modeName,
              })}
            </p>
          ) : null}
        </div>
        <div className="settings-group">
          <Row
            label={t('Background')}
            /*
             * **The same kind of value as Widgets.** The row used to say "Colour" while the
             * widgets' row said `#63E6E2`, so two colours that the traveller believed matched could
             * not be compared: the page's swatch was the untouched default `#dfe8f2` and there was
             * nothing on screen to say so (reported with a screenshot). Both rows now print the hex
             * they hold, upper case.
             */
            value={
              settings.background === 'colour' ? hexLabel(palette.backgroundColour) : backgroundLabel
            }
            swatch={
              settings.background === 'cream'
                ? PALETTE_CANVAS[mode]
                : settings.background === 'colour'
                  ? palette.backgroundColour
                  : undefined
            }
            swatchImage={
              settings.background === 'photo' ? settings.backgroundImage || undefined : undefined
            }
            onClick={() => setScreen('background')}
          />
          <Row
            label={t('Primary colour')}
            value={
              palette.primaryColour
                ? hexLabel(palette.primaryColour)
                : settings.background === 'colour'
                  ? t('Page colour')
                  : t('App default')
            }
            swatch={primaryInForce}
            onClick={() => setScreen('widgets')}
          />
          <Row
            label={t('Text selection')}
            value={selectionLabel}
            swatch={currentSelection}
            onClick={() => setScreen('selection')}
          />
        </div>
        {/*
         * **Two actions, both about the three rows above.** *Match colours* takes one HEX into all
         * three; *Reset colours* puts all three back the way the app ships — the answer a traveller
         * needs after trying something, and the one the pop-up used to imply with an undo that only
         * ever covered buttons.
         */}
        <div className="stack-2">
          <div className="row-wrap">
            <Button onClick={() => setScreen('match')}>{t('Match colours')}</Button>
            <Button
              variant="ghost"
              icon="refresh"
              onClick={() =>
                updateSettings({
                  background: 'cream',
                  ...palettePatch('light', {
                    backgroundColour: DEFAULT_SETTINGS.backgroundColour,
                    primaryColour: DEFAULT_SETTINGS.primaryColour,
                    selectionColor: DEFAULT_SETTINGS.selectionColor,
                    selectionCustom: DEFAULT_SETTINGS.selectionCustom,
                  }),
                  ...palettePatch('dark', {
                    backgroundColour: DEFAULT_SETTINGS.backgroundColourDark,
                    primaryColour: DEFAULT_SETTINGS.primaryColourDark,
                    selectionColor: DEFAULT_SETTINGS.selectionColorDark,
                    selectionCustom: DEFAULT_SETTINGS.selectionCustomDark,
                  }),
                })
              }
            >
              {t('Reset colours')}
            </Button>
            {everythingMatched ? (
              <span className="t-sm t-muted t-mono-num">
                {t('Everything · {colour}', { colour: hexLabel(palette.selectionCustom) })}
              </span>
            ) : null}
          </div>
          <p className="field__hint">
            {everythingMatched
              ? t('The page, the primary colour and the selected text are the same colour.')
              : t('Give the page, the primary colour and the selected text one colour, confirmed in a pop-up.')}
          </p>
        </div>
      </Card>

      <BackgroundScreen
        open={screen === 'background'}
        onClose={() => setScreen(null)}
        mode={mode}
      />
      <WidgetsScreen open={screen === 'widgets'} onClose={() => setScreen(null)} mode={mode} />
      <SelectionScreen
        open={screen === 'selection'}
        onClose={() => setScreen(null)}
        mode={mode}
      />
      <MatchColoursDialog
        open={screen === 'match'}
        onClose={() => setScreen(null)}
        mode={mode}
      />
    </>
  );
}
