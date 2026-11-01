import { UserRound } from 'lucide-react';
import { avatarColour } from '../../lib/avatar';

/**
 * **The circle a traveller is shown as.**
 *
 * A photograph when there is one, and otherwise lucide's `user` glyph on the account's own colour.
 * It is `aria-hidden`: the name or address is always written beside it, so a screen reader has no
 * reason to read the picture out as well.
 */
export function Avatar({
  seed,
  photo,
  size = 56,
}: {
  seed: string | null;
  photo: string | null;
  size?: number;
}) {
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        background: photo ? 'transparent' : avatarColour(seed),
      }}
    >
      {photo ? (
        <img className="avatar__photo" src={photo} alt="" />
      ) : (
        <UserRound size={Math.round(size * 0.55)} strokeWidth={1.75} color="#ffffff" />
      )}
    </span>
  );
}
