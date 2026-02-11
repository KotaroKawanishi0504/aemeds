import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';

/**
 * Resolves image URL from a block cell (link or img).
 * @param {Element} cell Cell element
 * @returns {string} Image URL or empty
 */
function getImageUrlFromCell(cell) {
  if (!cell) return '';
  const a = cell.querySelector('a');
  if (a?.href) return a.href;
  const img = cell.querySelector('img');
  if (img?.src) return img.src;
  return cell.textContent?.trim() || '';
}

/**
 * Resolves text from a block cell.
 * @param {Element} cell Cell element
 * @returns {string} Text content or innerHTML for rich text
 */
function getTextFromCell(cell) {
  if (!cell) return '';
  return cell.innerHTML?.trim() || cell.textContent?.trim() || '';
}

/**
 * Decorates the hero block: background image and overlaid heading/text.
 * Content: config table (image, imageAlt, text) or 3 rows (image, alt, text).
 * @param {Element} block The hero block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  let imageUrl = '';
  let imageAlt = '';
  let text = '';

  if (config.image || config.imagealt || config.text) {
    imageUrl = Array.isArray(config.image) ? config.image[0] : (config.image || '');
    imageAlt = Array.isArray(config.imagealt) ? config.imagealt[0] : (config.imagealt || '');
    text = Array.isArray(config.text) ? config.text[0] : (config.text || '');
  } else {
    const rows = [...block.querySelectorAll(':scope > div')];
    if (rows.length > 0) {
      const firstCell = rows[0].querySelector('div');
      imageUrl = getImageUrlFromCell(firstCell);
    }
    if (rows.length > 1) {
      const altCell = rows[1].querySelector('div');
      imageAlt = altCell?.textContent?.trim() || '';
    }
    if (rows.length > 2) {
      const textCell = rows[2].querySelector('div');
      text = getTextFromCell(textCell);
    }
  }

  block.textContent = '';
  if (imageUrl) {
    const picture = createOptimizedPicture(imageUrl, imageAlt, true, [
      { media: '(min-width: 600px)', width: '2000' },
      { width: '750' },
    ]);
    block.append(picture);
  }
  if (text) {
    const heading = document.createElement('h1');
    heading.innerHTML = text;
    block.append(heading);
  }
}
