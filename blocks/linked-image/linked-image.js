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
 * Image block with optional link (EDS approach: image first, link as wrapper).
 * Content: config (image, imageAlt, link) or 3 rows: image, alt, link.
 * @param {Element} block The linked-image block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  let imageUrl = '';
  let imageAlt = '';
  let link = '';

  if (config.image || config.imagealt || config.link) {
    imageUrl = Array.isArray(config.image) ? config.image[0] : (config.image || '');
    imageAlt = Array.isArray(config.imagealt) ? config.imagealt[0] : (config.imagealt || '');
    link = Array.isArray(config.link) ? config.link[0] : (config.link || '');
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
      const linkCell = rows[2].querySelector('div');
      const linkAnchor = linkCell?.querySelector('a');
      link = linkAnchor?.href?.trim() || linkCell?.textContent?.trim() || '';
    }
  }

  block.textContent = '';
  if (!imageUrl) return;

  const picture = createOptimizedPicture(imageUrl, imageAlt, true, [
    { media: '(min-width: 600px)', width: '2000' },
    { width: '750' },
  ]);

  if (link) {
    const a = document.createElement('a');
    a.href = link;
    a.append(picture);
    block.append(a);
  } else {
    block.append(picture);
  }
}
