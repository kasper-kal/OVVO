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
 * So the same manifest is built here, in the page, and linked as a `blob:` URL. Chrome reads it,
 * and the check it runs on it is the one it runs on the file. Two things make it work anywhere:
 *
 *   - the addresses inside it are **absolute** (`id`, `start_url`, `scope`), because a relative
 *     `start_url` would be resolved against a `blob:` address and point at nothing;
 *   - the icons are **inlined as data URLs**, so installability does not depend on the icon files
 *     being reachable either. They are the same two PNGs the file names, read from the site itself.
 *
 * The file stays the source of truth: the values come from `public/manifest.json` at build time,
 * so there is one manifest to edit, not two. This only changes where the browser is handed it.
 */

let started = false;


export async function installManifest(): Promise<void> {
  if (started || typeof document === 'undefined') return;
  started = true;

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
