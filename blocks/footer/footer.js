import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment (resolve path relative to current page for AEM /content/.../jp.html)
  const footerMeta = getMetadata('footer');
  let footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : null;
  const basePath = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '';
  const candidates = footerPath ? [footerPath] : [`${basePath}/footer`, `${basePath}/Footer/footer`];
  let fragment = null;
  for (const path of candidates) {
    fragment = await loadFragment(path);
    if (fragment) break;
  }
  if (!fragment) return;

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
