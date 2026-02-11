import { readBlockConfig } from '../../scripts/aem.js';

/**
 * Notice banner: one line of text + optional date. Config table: message, date.
 * @param {Element} block The notice-banner block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const message = config.message ?? block.querySelector('div')?.textContent?.trim() ?? '';
  const date = config.date ?? '';

  block.textContent = '';
  const wrap = document.createElement('div');
  wrap.className = 'notice-banner-inner';
  if (date) {
    const dateEl = document.createElement('span');
    dateEl.className = 'notice-banner-date';
    dateEl.textContent = date;
    wrap.append(dateEl);
  }
  const msgEl = document.createElement('span');
  msgEl.className = 'notice-banner-message';
  msgEl.textContent = message;
  wrap.append(msgEl);
  block.append(wrap);
}
