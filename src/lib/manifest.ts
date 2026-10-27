import manifestFile from '../../public/manifest.json';
/* Bundled, not fetched: see below. `?inline` gives the bytes as a data URL at build time. */
import icon192 from '../../public/icons/icon-192.png?inline';
import icon512 from '../../public/icons/icon-512.png?inline';

/**
 * **The home-screen manifest, handed to the browser from inside the page.**
 *
 * `public/manifest.json` is the manifest, and on a host that serves files honestly it is all that
 * is needed: `index.html` links it, Chrome reads it, and the site becomes installable. The trouble
 * is the hosts that do not. A preview proxy, a static host with a catch-all page, a security
 * challenge in front of the domain: any of them can answer `/manifest.json` with HTML, and Chrome
 * then has a manifest it cannot parse. It does not say so on the page. It says it in its own menu,
 * under Install, as **"this app cannot be installed"**, and the traveller is left with a site that
 * refuses to install while every other site on the phone installs fine.
 *
 * So the same manifest can be built here, in the page, and linked as a `blob:` URL. Two things make
 * that one work anywhere:
 *
 *   - the addresses inside it are **absolute** (`id`, `start_url`, `scope`), because a relative
 *     `start_url` would be resolved against a `blob:` address and point at nothing;
 *   - the icons are **inlined as data URLs**, so installability does not depend on the icon files
 *     being reachable either.
 *
 * **But it is the fallback, not the rule.** Chrome installs a web app properly, as an Android app
 * with its own entry in the launcher and in screen time, only when it can fetch a manifest and its
 * icons over the network; everything else it installs is a *shortcut*, with a small Chrome mark on
 * the icon and no app of its own. So the site's own file is used whenever it arrives intact, and
 * this rebuilt manifest only takes over when it does not. A built manifest is better than an app
 * nobody can install, and worse than a real install, and that order is the whole design here.
 *
 * The file stays the source of truth: the values come from `public/manifest.json` at build time,
 * so there is one manifest to edit, not two.
 */

let started = false;

/**
 * Does the site's own manifest arrive, and is it a manifest?
 *
 * Asked before anything is replaced, because a host that serves the file properly gives the
 * traveller a real install, and nothing here should stand between them and it. Anything that is not
 * JSON with a name and at least one icon is not a manifest, whatever status code came with it.
 */
async function servedManifestIsUsable(): Promise<boolean> {
  try {
    const response = await fetch('/manifest.json', { cache: 'no-cache' });
    if (!response.ok) return false;
    const manifest: unknown = JSON.parse(await response.text());
    if (!manifest || typeof manifest !== 'object') return false;
    const candidate = manifest as { name?: unknown; icons?: unknown };
    return typeof candidate.name === 'string' && Array.isArray(candidate.icons) && candidate.icons.length > 0;
  } catch {
    /* A page, a challenge, an empty body, a broken connection: none of them is a manifest. */
    return false;
  }
}


export async function installManifest(): Promise<void> {
  if (started || typeof document === 'undefined') return;
  started = true;

  if (await servedManifestIsUsable()) return;

  const root = new URL('/', window.location.href).href;
  /*
   * The two PNGs are **in the bundle**, as data URLs, rather than fetched from the site when the
   * page starts. Fetching was the first version and it was not enough: on a host that answers
   * `/icons/*.png` with a page, the fetch succeeds and inlines the page as the icon, which is an
   * icon Chrome cannot draw and an app it will not install. Anything that comes over the network
   * can be answered with the wrong thing, so the icon bytes do not come over the network.
   *
   * Matched by position, which is safe because `manifest.json` lists 192 first and 512 second;
   * a third icon needs a line here as well as a line there.
   */
  const bundled = [icon192, icon512];
  const icons = (manifestFile.icons ?? []).map((icon, index) => ({
    ...icon,
    src: bundled[index] ?? new URL(icon.src, root).href,
  }));

  const manifest = { ...manifestFile, id: root, start_url: root, scope: root, icons };
  const href = URL.createObjectURL(
    new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }),
  );

  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'manifest';
    document.head.appendChild(link);
  }
  link.href = href;
}
