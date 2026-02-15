import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Block options (columns, arrow, text size) come from the reserved "classes" field on the block.
 * No config rows; layer shows only Card items.
 */
function ensureDefaultBlockClasses(block) {
  const hasCols = block.classList.contains('cards-cols-3')
    || block.classList.contains('cards-cols-4')
    || block.classList.contains('cards-cols-5');
  if (!hasCols) block.classList.add('cards-cols-4');
  const hasTextSize = block.classList.contains('cards-text-s')
    || block.classList.contains('cards-text-m')
    || block.classList.contains('cards-text-l');
  if (!hasTextSize) block.classList.add('cards-text-m');
}

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
 * Ensures the card body has only icon + content (no inner <a>).
 * Used when the whole card is wrapped in one link.
 * @param {Element} body - .cards-card-body element (icon already prepended)
 */
function ensureBodyContentOnly(body) {
  const icon = body.querySelector('.cards-card-body-icon');
  const rest = [...body.children].filter((el) => el !== icon);
  const existingLink = body.querySelector('a[href]');
  if (existingLink && rest.length === 1 && rest[0] === existingLink) {
    while (existingLink.firstChild) body.insertBefore(existingLink.firstChild, existingLink);
    existingLink.remove();
  }
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

/**
 * Whether the card link should open in a new window (checkbox on = true).
 * Supports: 4th cell input[type=checkbox]:checked, data-openinnewwindow, or legacy text (x/yes).
 * @param {Element} cell - optional 4th cell (openInNewWindow checkbox)
 * @param {Element} row - card row (for data-openinnewwindow)
 * @returns {boolean}
 */
function isOpenInNewWindow(cell, row) {
  const fromRow = (row?.dataset?.openinnewwindow ?? row?.dataset?.openInNewWindow ?? '').trim().toLowerCase();
  if (fromRow === 'true' || fromRow === '1') return true;
  if (fromRow === 'false' || fromRow === '0') return false;
  if (cell) {
    const checked = cell.querySelector('input[type="checkbox"]:checked');
    if (checked) return true;
    const t = cell.textContent?.trim().toLowerCase() || '';
    if (t === 'x' || t === 'yes' || t === 'true' || t === '1' || t === '○') return true;
  }
  return false;
}

export default function decorate(block) {
  ensureDefaultBlockClasses(block);

  /* All block children are card rows (Block Options store style on block class, no config rows) */
  const cardRows = [...block.querySelectorAll(':scope > div')];
  const ul = document.createElement('ul');
  cardRows.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const cells = [...row.children];
    const linkCell = cells.length >= 3 ? cells[2] : null;
    const openInNewWindowCell = cells.length >= 4 ? cells[3] : null;
    const rowHref = getHrefFromLinkCell(linkCell) || row.dataset.link || '';
    const openInNewWindow = isOpenInNewWindow(openInNewWindowCell, row);
    cells.forEach((cell, i) => {
      if ((i === 2 && linkCell) || (i === 3 && openInNewWindowCell)) return;
      li.append(cell);
    });
    const hasCardLink = typeof rowHref === 'string' && rowHref.trim() && rowHref !== '#';
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
        if (hasCardLink) {
          ensureBodyContentOnly(div);
          const labelEl = div.querySelector(':scope > *:not(.cards-card-body-icon)');
          if (labelEl) {
            labelEl.setAttribute('data-link-label', '');
            const labelText = document.createElement('span');
            labelText.className = 'cards-card-body-label-text';
            while (labelEl.firstChild) labelText.appendChild(labelEl.firstChild);
            labelEl.appendChild(labelText);
          }
        } else {
          ensureBodyLink(div, rowHref);
        }
      }
    });
    if (hasCardLink && li.children.length) {
      const a = document.createElement('a');
      a.className = 'cards-card-link';
      a.setAttribute('href', rowHref.trim());
      if (openInNewWindow) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
      while (li.firstChild) a.appendChild(li.firstChild);
      li.appendChild(a);
    }
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.replaceChildren(ul);
}
