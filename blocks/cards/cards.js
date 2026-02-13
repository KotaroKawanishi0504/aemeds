import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/** Card body icon: same asset as reference (circle r=12), stroke/arrow from CSS vars. */
function createCardBodyIconSVG() {
  const r = Number(
    getComputedStyle(document.documentElement).getPropertyValue('--card-icon-circle-r')?.trim(),
    10,
  ) || 12;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'cards-card-body-icon-svg');
  svg.innerHTML = `<circle cx="12" cy="12" r="${r}" fill="none" stroke="currentColor"/>`
    + '<path class="cards-card-body-icon-arrow" d="M10 6 L10 18 L18 12 Z"/>';
  return svg;
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-card-image';
      } else {
        div.className = 'cards-card-body';
        const icon = document.createElement('span');
        icon.className = 'cards-card-body-icon';
        icon.append(createCardBodyIconSVG());
        div.prepend(icon);
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
