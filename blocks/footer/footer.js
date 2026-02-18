import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer fragment: prefer meta 'footer'; else /footer, parent path, then page path
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : null;
  const basePath = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '';
  const parentPath = basePath.replace(/\/[^/]+$/, '') || '';
  const candidates = footerPath
    ? [footerPath]
    : [
      '/footer',
      `${parentPath}/footer`,
      `${basePath}/footer`,
      `${basePath}/Footer/footer`,
    ];
  const fragment = await candidates.reduce(
    async (prev, path) => (await prev) || loadFragment(path),
    Promise.resolve(null),
  );
  if (!fragment) return;

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
