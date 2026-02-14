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
 */
function ensureBodyLink(body) {
  const icon = body.querySelector('.cards-card-body-icon');
  const rest = [...body.children].filter((el) => el !== icon);
  if (rest.length === 0) return;
  const first = rest[0];
  if (first.tagName === 'A' && first.getAttribute('href')) return;
  const existingLink = body.querySelector('a[href]');
  const href = existingLink?.getAttribute('href')?.trim() || '#';
  const a = document.createElement('a');
  a.setAttribute('href', href);
  rest.forEach((el) => a.append(el));
  body.append(a);
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
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
        ensureBodyLink(div);
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
