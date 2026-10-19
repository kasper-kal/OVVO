import { useRef, useState } from 'react';
import { Button, Card, Segmented } from './primitives';
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
  readImageFile,
  type BackgroundChoice,
  type CardTreatment,
} from '../../lib/background';
import { FULL_CROP, bakeCrop, type CropRect } from '../../lib/photoCrop';
import { SELECTION_SWATCHES, selectionColor } from '../../lib/selection';

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

function BackgroundScreen({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, updateSettings } = useApp();
  const t = useT();
  const { busy, error, take, saveCrop } = usePhotoActions();
  const [picker, setPicker] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const hint =
    settings.background === 'cream'
      ? t('The app’s own warm canvas.')
      : settings.background === 'colour'
        ? t('The page’s own colour. The widgets keep theirs — see Widgets.')
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
                  updateSettings({ background: 'cream', primaryColour: '' });
                  return;
                }
                updateSettings({ background: value as BackgroundChoice });
              }}
              options={[
                { value: 'cream', label: t('Cream') },
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
                value={settings.backgroundColour.toUpperCase()}
                swatch={settings.backgroundColour}
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
                <span className="field__label">{t('Widgets')}</span>
                <Segmented
                  ariaLabel={t('Widgets')}
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
        </div>
      </FullScreen>

      <ColourScreen
        open={picker}
        title={t('Background colour')}
        value={settings.backgroundColour}
        swatches={BACKGROUND_SWATCHES}
        onChange={(hex) => updateSettings({ backgroundColour: hex })}
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

function WidgetsScreen({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, updateSettings } = useApp();
  const t = useT();
  const { error, saveCrop } = usePhotoActions();
  const [picker, setPicker] = useState(false);
  const [photoScreen, setPhotoScreen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);

  if (!open) return null;

  const primaryInForce =
    settings.primaryColour ||
    (settings.background === 'colour' ? settings.backgroundColour : '') ||
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
        : t('The page is cream, so this uses the app’s own surfaces and coral.');

  return (
    <>
      <FullScreen
        title={t('Widgets')}
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
              aria-pressed={!settings.primaryColour}
              onClick={() => updateSettings({ primaryColour: '' })}
            >
              <span className="settings-row__label">{t('Follow the background')}</span>
              <span className="settings-row__value">{follow}</span>
              {!settings.primaryColour ? <Icon name="check" size={16} /> : null}
            </button>
            <Row
              label={t('Choose a colour')}
              value={settings.primaryColour ? hexLabel(settings.primaryColour) : ''}
              swatch={primaryInForce}
              onClick={() => setPicker(true)}
            />
          </div>
          <p className="field__hint">{followHint}</p>
          {error ? <p className="field__error">{error}</p> : null}
        </div>
      </FullScreen>

      <ColourScreen
        open={picker}
        title={t('Widgets’ colour')}
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
        onChange={(hex) => updateSettings({ primaryColour: hex })}
        onClose={() => setPicker(false)}
      />

      {settings.backgroundImage ? (
        <PhotoScreen
          open={photoScreen}
          image={settings.backgroundImage}
          value={primaryInForce}
          onCommit={(hex) => {
            updateSettings({ primaryColour: hex });
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

function SelectionScreen({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, updateSettings } = useApp();
  const t = useT();
  const customRef = useRef<HTMLInputElement | null>(null);
  const current = selectionColor(settings.selectionColor, settings.selectionCustom) || '#ff7e67';

  if (!open) return null;

  return (
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
              aria-pressed={settings.selectionColor === swatch.key}
              onClick={() => updateSettings({ selectionColor: swatch.key })}
            >
              <span
                className="settings-row__swatch"
                style={{ background: selectionColor(swatch.key, '') }}
                aria-hidden="true"
              />
              <span className="settings-row__label">{t(swatch.label)}</span>
              {settings.selectionColor === swatch.key ? <Icon name="check" size={16} /> : null}
            </button>
          ))}
          <button
            type="button"
            className="settings-row"
            aria-pressed={settings.selectionColor === 'custom'}
            onClick={() => {
              const input = customRef.current;
              if (!input) return;
              input.value = current;
              input.click();
            }}
          >
            <span
              className="settings-row__swatch"
              style={{ background: current }}
              aria-hidden="true"
            />
            <span className="settings-row__label">{t('Custom')}</span>
            {settings.selectionColor === 'custom' ? <Icon name="check" size={16} /> : null}
          </button>
        </div>
        <p className="field__hint">
          {t('The colour behind selected text. The ink on it is chosen for contrast, so a dark colour gets light text.')}
        </p>
        {/* The device's own dialog, opened from inside the row's gesture. */}
        <input
          ref={customRef}
          type="color"
          className="sr-only"
          tabIndex={-1}
          aria-label={t('Custom colour')}
          value={current}
          onChange={(event) =>
            updateSettings({ selectionColor: 'custom', selectionCustom: event.target.value })
          }
        />
      </div>
    </FullScreen>
  );
}

/* ---------------------------------------------------------------------- the card */

export function ColourSettings() {
  const { settings } = useApp();
  const t = useT();
  const [screen, setScreen] = useState<'background' | 'widgets' | 'selection' | null>(null);

  const primaryInForce =
    settings.primaryColour ||
    (settings.background === 'colour' ? settings.backgroundColour : '') ||
    '#ff7e67';
  const currentSelection =
    selectionColor(settings.selectionColor, settings.selectionCustom) || '#ff7e67';
  const selectionLabel =
    settings.selectionColor === 'custom'
      ? t('Custom')
      : t(
          SELECTION_SWATCHES.find((swatch) => swatch.key === settings.selectionColor)?.label ??
            'Coral',
        );
  const backgroundLabel =
    settings.background === 'cream'
      ? t('Cream')
      : settings.background === 'colour'
        ? t('Colour')
        : t('Photo');

  return (
    <>
      <Card className="stack-3">
        <h2 className="t-section">{t('Colours')}</h2>
        <div className="settings-group">
          <Row
            label={t('Background')}
            value={backgroundLabel}
            swatch={
              settings.background === 'cream'
                ? 'var(--canvas-base)'
                : settings.background === 'colour'
                  ? settings.backgroundColour
                  : undefined
            }
            swatchImage={
              settings.background === 'photo' ? settings.backgroundImage || undefined : undefined
            }
            onClick={() => setScreen('background')}
          />
          <Row
            label={t('Widgets')}
            value={
              settings.primaryColour
                ? hexLabel(settings.primaryColour)
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
      </Card>

      <BackgroundScreen open={screen === 'background'} onClose={() => setScreen(null)} />
      <WidgetsScreen open={screen === 'widgets'} onClose={() => setScreen(null)} />
      <SelectionScreen open={screen === 'selection'} onClose={() => setScreen(null)} />
    </>
  );
}
