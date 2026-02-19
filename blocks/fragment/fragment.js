/*
 * Fragment Block
 * Include content on a page as a fragment.
 * https://www.aem.live/developer/block-collection/fragment
 */

// eslint-disable-next-line import/no-cycle
import {
  decorateMain,
} from '../../scripts/scripts.js';

import {
  loadSections,
} from '../../scripts/aem.js';

/**
 * Normalizes AEM Franklin Image prose output (div > p > picture > img) in the first
 * section into EDS Image block structure so decorateBlocks + image block run correctly.
 * @param {Element} main Fragment root (main element)
 */
function normalizeFragmentFirstSectionImage(main) {
  const firstSection = main.querySelector(':scope > div');
  if (!firstSection) return;
  const firstChild = firstSection.firstElementChild;
  if (!firstChild || firstChild.tagName !== 'P') return;
  const picture = firstChild.querySelector('picture');
  const img = picture?.querySelector('img');
  if (!picture || !img) return;
  const imageAlt = img.getAttribute('alt') || '';
  const row1 = document.createElement('div');
  const cell1 = document.createElement('div');
  cell1.appendChild(picture);
  row1.appendChild(cell1);
  const row2 = document.createElement('div');
  const cell2 = document.createElement('div');
  cell2.textContent = imageAlt;
  row2.appendChild(cell2);
  const block = document.createElement('div');
  block.className = 'image';
  block.appendChild(row1);
  block.appendChild(row2);
  firstSection.textContent = '';
  firstSection.appendChild(block);
}

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {HTMLElement} The root element of the fragment
 */
export async function loadFragment(path) {
  if (path && path.startsWith('/')) {
    // eslint-disable-next-line no-param-reassign
    path = path.replace(/(\.plain)?\.html/, '');
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
      const main = document.createElement('main');
      main.innerHTML = await resp.text();

      // reset base path for media to fragment base
      const resetAttributeBase = (tag, attr) => {
        main.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
          elem[attr] = new URL(elem.getAttribute(attr), new URL(path, window.location)).href;
        });
      };
      resetAttributeBase('img', 'src');
      resetAttributeBase('source', 'srcset');

      normalizeFragmentFirstSectionImage(main);
      decorateMain(main);
      await loadSections(main);
      return main;
    }
  }
  return null;
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  const fragment = await loadFragment(path);
  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope .section');
    if (fragmentSection) {
      block.classList.add(...fragmentSection.classList);
      block.classList.remove('section');
      block.replaceChildren(...fragmentSection.childNodes);
    }
  }
}
