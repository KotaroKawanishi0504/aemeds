/**
 * Shared utilities for card-style blocks (Cards, Cards Carousel).
 * Used by blocks/cards/cards.js and blocks/cards-carousel/cards-carousel.js.
 */

/**
 * Get href from a cell that may contain the link field (AEM or 3rd column).
 * @param {Element} cell - div that may contain <a href="..."> or link URL text
 * @returns {string} href or empty string
 */
export function getHrefFromLinkCell(cell) {
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
export function isOpenInNewWindow(cell, row) {
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
