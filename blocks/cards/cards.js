import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/** Card body icon: from scraped 01-common.min.css .c-icon-link__icon. */
/** Circle: fill transparent, stroke #e60012 (original: stroke currentColor). Arrow: white fill. */
function createCardBodyIconSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'cards-card-body-icon-svg');
  svg.innerHTML = '<circle cx="12" cy="12" r="10" fill="none" stroke="#e60012" stroke-width="1.5"/>'
    + '<path d="M10 6 L10 18 L18 12 Z" fill="#fff"/>';
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
