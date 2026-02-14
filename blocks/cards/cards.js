import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Card body icon: 円のみ SVG（本家 .c-icon-link__icon 同様）. 矢印は CSS ::before (Ben \e902) で表示。 */
function createCardBodyIconSVG() {
  const r = Number(
    getComputedStyle(document.documentElement).getPropertyValue('--card-icon-circle-r')?.trim(),
    10,
  ) || 12;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'cards-card-body-icon-svg');

  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', String(r));
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', 'currentColor');
  svg.appendChild(circle);

  return svg;
}

/**
 * Ensures the card body has a single link wrapper for the label so block CSS applies.
 * If content is already an <a>, leave it. If not (e.g. AEM richtext div/p), wrap in <a>.
 * @param {Element} body - .cards-card-body element (icon already prepended)
 * @param {string} [hrefOverride] - Optional href (e.g. from card link field or 3rd column)
 */
function ensureBodyLink(body, hrefOverride) {
  const icon = body.querySelector('.cards-card-body-icon');
  const rest = [...body.children].filter((el) => el !== icon);
  if (rest.length === 0) return;
  const first = rest[0];
  if (first.tagName === 'A' && first.getAttribute('href')) return;
  const existingLink = body.querySelector('a[href]');
  const href = (typeof hrefOverride === 'string' && hrefOverride.trim()) ? hrefOverride.trim()
    : existingLink?.getAttribute('href')?.trim() || '#';
  const a = document.createElement('a');
  a.setAttribute('href', href);
  rest.forEach((el) => a.append(el));
  body.append(a);
}

/**
 * Get href from a cell that may contain the link field (AEM or 3rd column).
 * @param {Element} cell - div that may contain <a href="..."> or link URL text
 * @returns {string} href or empty string
 */
function getHrefFromLinkCell(cell) {
  if (!cell) return '';
  const a = cell.querySelector('a[href]');
  if (a) return a.getAttribute('href')?.trim() || '';
  const text = cell.textContent?.trim() || '';
  if (text && (text.startsWith('/') || text.startsWith('http://') || text.startsWith('https://'))) return text;
  return '';
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const cells = [...row.children];
    const linkCell = cells.length >= 3 ? cells[2] : null;
    const rowHref = getHrefFromLinkCell(linkCell) || row.dataset.link || '';
    cells.forEach((cell, i) => {
      if (i === 2 && linkCell) return;
      li.append(cell);
    });
    [...li.children].forEach((div) => {
      const isImageCell = div.querySelector('picture') || div.querySelector('img');
      if (isImageCell) {
        div.className = 'cards-card-image';
      } else {
        div.className = 'cards-card-body';
        const icon = document.createElement('span');
        icon.className = 'cards-card-body-icon';
        icon.append(createCardBodyIconSVG());
        div.prepend(icon);
        ensureBodyLink(div, rowHref);
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.replaceChildren(ul);
}
