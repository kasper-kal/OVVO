import { useEffect, useId, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { Icon, ModeIcon, type IconName } from './Icons';
import { useApp } from '../../state/AppState';
import { MODE_LABELS } from '../../lib/format';
import type { TravelMode } from '../../data/types';

/* --------------------------------------------------------------- L1 / L2 shell */

export function Card({
  children,
  variant = 'raised',
  hero = false,
  className = '',
  style,
  as: Tag = 'section',
}: {
  children: ReactNode;
  variant?: 'raised' | 'flat' | 'obsidian';
  hero?: boolean;
  className?: string;
  style?: CSSProperties;
  as?: 'section' | 'div' | 'article' | 'li' | 'form';
}) {
  const classes = [
    'card',
    variant === 'flat' ? 'card--flat' : '',
    variant === 'obsidian' ? 'card--obsidian' : '',
    hero ? 'card--hero' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <Tag className={classes} style={style}>{children}</Tag>;
}

export function Panel({
  children,
  variant = 'default',
  className = '',
}: {
  children: ReactNode;
  variant?: 'default' | 'raised' | 'accent' | 'coral' | 'sage' | 'obsidian';
  className?: string;
}) {
  const classes = ['panel', variant !== 'default' ? `panel--${variant}` : '', className].filter(Boolean).join(' ');
  return <div className={classes}>{children}</div>;
}

export function SectionHeading({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: IconName;
  action?: ReactNode;
}) {
  return (
    <div className="between">
      <div className="row-3">
        {icon ? (
          <span className="empty__icon" style={{ width: 40, height: 40, borderRadius: 'var(--r-compact)' }}>
            <Icon name={icon} size={20} />
          </span>
        ) : null}
        <div className="stack-1">
          <h2 className="t-section">{title}</h2>
          {description ? <p className="t-sm t-muted">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

/* --------------------------------------------------------------------- actions */

type ButtonVariant = 'primary' | 'accent' | 'ghost' | 'sage' | 'butter' | 'surface';

export function Button({
  children,
  variant = 'surface',
  size = 'md',
  block = false,
  icon,
  iconAfter,
  square = false,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  block?: boolean;
  icon?: IconName;
  iconAfter?: IconName;
  square?: boolean;
}) {
  const classes = [
    'btn',
    variant !== 'surface' ? `btn--${variant}` : '',
    size === 'sm' ? 'btn--sm' : '',
    block ? 'btn--block' : '',
    square ? 'btn--square' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={classes} {...rest}>
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
      {iconAfter ? <Icon name={iconAfter} size={16} /> : null}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  active = false,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName;
  label: string;
  variant?: ButtonVariant;
  active?: boolean;
}) {
  const classes = ['btn', 'btn--icon-circle', variant !== 'surface' ? `btn--${variant}` : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type="button"
      className={classes}
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      {...rest}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}

/* ----------------------------------------------------------------- pills/chips */

export function Pill({
  children,
  tone = 'default',
  dot = false,
  dotTone = 'green',
  className = '',
}: {
  children: ReactNode;
  tone?: 'default' | 'coral' | 'sage' | 'butter' | 'obsidian' | 'outline';
  dot?: boolean;
  dotTone?: 'green' | 'coral' | 'butter';
  className?: string;
}) {
  return (
    <span className={['pill', tone !== 'default' ? `pill--${tone}` : '', className].filter(Boolean).join(' ')}>
      {dot ? <span className={`pill__dot${dotTone === 'green' ? '' : ` pill__dot--${dotTone}`}`} /> : null}
      {children}
    </span>
  );
}

export function Chip({
  children,
  selected = false,
  onClick,
  icon,
  tone = 'default',
  className = '',
  title,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick: () => void;
  icon?: IconName;
  tone?: 'default' | 'danger' | 'butter' | 'sage';
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      className={['chip', tone !== 'default' ? `chip--${tone}` : '', className].filter(Boolean).join(' ')}
      aria-pressed={selected}
      onClick={onClick}
      title={title}
    >
      {icon ? <Icon name={icon} size={15} /> : null}
      {children}
    </button>
  );
}

export function ModeBadge({
  mode,
  label,
  ghost = false,
}: {
  mode: TravelMode;
  label?: string;
  ghost?: boolean;
}) {
  return (
    <span className={`mode-badge mode-badge--${mode}${ghost ? ' mode-badge--ghost' : ''}`}>
      <ModeIcon mode={mode} size={14} />
      {label ?? MODE_LABELS[mode]}
    </span>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className="segmented__btn"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.icon ? <Icon name={option.icon} size={15} /> : null}
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------- form bits */

export function Field({
  label,
  hint,
  error,
  children,
  id,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="field__error" role="alert">
          <Icon name="alert" size={14} />
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button type="button" className="switch" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
      <span className="switch__track" aria-hidden="true">
        <span className="switch__thumb" />
      </span>
      <span className="switch__text">
        <span className="t-strong t-sm">{label}</span>
        {description ? <span className="t-sm t-muted">{description}</span> : null}
      </span>
    </button>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button type="button" className="checkbox" role="checkbox" aria-checked={checked} onClick={() => onChange(!checked)}>
      <span className="checkbox__box" aria-hidden="true">
        <Icon name="check" size={16} strokeWidth={2.5} />
      </span>
      <span className="switch__text">
        <span className="t-strong t-sm">{label}</span>
        {description ? <span className="t-sm t-muted">{description}</span> : null}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ disclosure */

export function Disclosure({
  title,
  summary,
  children,
  defaultOpen = false,
  id,
}: {
  title: string;
  summary?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const generated = useId();
  const panelId = `${id ?? 'disclosure'}-${generated}`;
  return (
    <div className="disclosure">
      <button
        type="button"
        className="disclosure__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        <span>{title}</span>
        {summary ? (
          <span className="t-sm t-muted" style={{ textTransform: 'none', letterSpacing: 0 }}>
            {summary}
          </span>
        ) : null}
        <Icon name="chevronDown" size={18} className="disclosure__chevron" />
      </button>
      {open ? (
        <div className="disclosure__body" id={panelId}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ feedback UI */

export function EmptyState({
  title,
  description,
  icon = 'info',
  children,
}: {
  title: string;
  description?: string;
  icon?: IconName;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty__icon">
        <Icon name={icon} size={26} />
      </span>
      <div className="stack-1">
        <h3 className="t-h2">{title}</h3>
        {description ? <p className="t-sm t-muted">{description}</p> : null}
      </div>
      {children ? <div className="row-wrap" style={{ justifyContent: 'center' }}>{children}</div> : null}
    </div>
  );
}

export function Banner({
  title,
  children,
  tone = 'butter',
  icon = 'info',
  action,
}: {
  title?: string;
  children?: ReactNode;
  tone?: 'butter' | 'coral' | 'sage' | 'hairline';
  icon?: IconName;
  action?: ReactNode;
}) {
  return (
    <div className={`banner${tone === 'butter' ? '' : ` banner--${tone}`}`}>
      <Icon name={icon} size={18} />
      <div className="stack-1 grow">
        {title ? <p className="t-strong t-sm">{title}</p> : null}
        {children ? <div className="t-sm">{children}</div> : null}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="stat">
      <span className="field__label">{label}</span>
      <span className="stat__value">{value}</span>
      {hint ? <span className="t-sm t-muted">{hint}</span> : null}
    </div>
  );
}

export function Meter({ value, tone = 'coral' }: { value: number; tone?: 'coral' | 'sage' | 'butter' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div className="meter" role="img" aria-label={`Occupancy ${pct}%`}>
      <div className={`meter__fill${tone === 'coral' ? '' : ` meter__fill--${tone}`}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** SVG data sparkline: organic bezier with Sunset Coral stroke and Butter focal point. */
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const width = 200;
  const height = 44;
  const max = Math.max(...values, 0.001);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => ({
    x: index * step,
    y: height - 4 - (value / max) * (height - 12),
  }));
  const path = points
    .map((point, index) => {
      if (index === 0) return `M${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
      const prev = points[index - 1];
      const cx = (prev.x + point.x) / 2;
      return `C${cx.toFixed(1)} ${prev.y.toFixed(1)} ${cx.toFixed(1)} ${point.y.toFixed(1)} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    })
    .join(' ');
  const peak = points.reduce((best, point) => (point.y < best.y ? point : best), points[0]);
  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} preserveAspectRatio="none">
      <path className="sparkline__baseline" d={`M0 ${height - 3} H${width}`} />
      <path d={path} />
      <circle cx={peak.x} cy={peak.y} r={4} />
    </svg>
  );
}

export function AvatarStack({ people, extra }: { people: { initials: string; tone?: 'sage' | 'butter' | 'coral' }[]; extra?: number }) {
  return (
    <span className="avatar-stack" aria-label={`${people.length + (extra ?? 0)} travellers`}>
      {people.map((person) => (
        <span key={person.initials} className={`avatar${person.tone ? ` avatar--${person.tone}` : ''}`} aria-hidden="true">
          {person.initials}
        </span>
      ))}
      {extra ? <span className="avatar avatar--butter">+{extra}</span> : null}
    </span>
  );
}

export function DemoBadge({ label = 'Simulated data' }: { label?: string }) {
  const { settings } = useApp();
  if (!settings.showDemoBadges) return null;
  return (
    <Pill tone="butter" className="pill--outline">
      {label}
    </Pill>
  );
}

export function DemoNotice({ children }: { children?: ReactNode }) {
  const { settings } = useApp();
  if (!settings.showDemoBadges) return null;
  return (
    <Banner title="Prototype with simulated data" icon="info">
      {children ?? 'All times, delays, platforms and alerts in this app are generated demo data. Nothing here reflects the real timetable.'}
    </Banner>
  );
}

/* ---------------------------------------------------------------------- modal */

export function Dialog({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  panelClassName = '',
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  panelClassName?: string;
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`modal ${panelClassName}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__head">
          <div className="stack-1 grow">
            <h2 className="t-h2">{title}</h2>
            {description ? <p className="t-sm t-muted">{description}</p> : null}
          </div>
          <IconButton icon="close" label="Close" onClick={onClose} />
        </div>
        {children}
        {footer ? <div className="row-wrap" style={{ marginTop: 'var(--s-4)' }}>{footer}</div> : null}
      </div>
    </div>
  );
}

export function Toaster() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          <span className={`status-dot${toast.tone === 'warning' ? ' status-dot--coral' : ''}`} />
          <span className="t-sm grow">{toast.message}</span>
          <IconButton icon="close" label="Dismiss message" onClick={() => dismissToast(toast.id)} />
        </div>
      ))}
    </div>
  );
}
