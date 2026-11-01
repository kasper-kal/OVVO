import type { SelectHTMLAttributes } from 'react';
import { Icon } from './Icons';

/**
 * **A dropdown, wearing the app's own chevron.**
 *
 * A native `<select>` draws its own arrow — a filled triangle on some engines, on the field's edge,
 * wherever the engine decides — which is why the app showed three different chevrons in three
 * different places: a filled triangle on a dropdown, a thin one on a row, and the app's own mark on
 * the clock field. The field is now the box and the arrow is ours: the platform's furniture is
 * switched off and an 18px chevron is set in the same lane every other mark in the app uses.
 */
export function Select({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="select-wrap">
      <select className={`select ${className}`.trim()} {...rest}>
        {children}
      </select>
      <span className="select-wrap__mark" aria-hidden="true">
        <Icon name="chevronDown" size={18} />
      </span>
    </span>
  );
}
