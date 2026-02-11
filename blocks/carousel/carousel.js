import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Get image URL from a cell (link href or img src).
 * @param {Element} cell Cell element
 * @returns {{ url: string, alt: string }}
 */
function getImageFromCell(cell) {
  if (!cell) return { url: '', alt: '' };
  const a = cell.querySelector('a');
  const img = cell.querySelector('img');
  const url = a?.href || img?.src || '';
  const alt = img?.alt || cell.textContent?.trim() || '';
  return { url, alt };
}

/**
 * Decorates the carousel block: each row is a slide (image + optional content).
 * @param {Element} block The carousel block element
 */
export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')].filter((row) => row.children.length > 0);
  if (rows.length === 0) return;

  const slidesContainer = document.createElement('div');
  slidesContainer.className = 'carousel-slides-container';

  const slidesList = document.createElement('ul');
  slidesList.className = 'carousel-slides';

  rows.forEach((row) => {
    const cells = [...row.children];
    const firstCell = cells[0]?.querySelector('div') || cells[0];
    const secondCell = cells[1]?.querySelector('div') || cells[1];
    const { url, alt } = getImageFromCell(firstCell);
    const contentHtml = secondCell?.innerHTML?.trim() || '';

    const li = document.createElement('li');
    li.className = 'carousel-slide';

    const slideImage = document.createElement('div');
    slideImage.className = 'carousel-slide-image';
    if (url) {
      const picture = createOptimizedPicture(url, alt, false, [
        { media: '(min-width: 600px)', width: '2000' },
        { width: '750' },
      ]);
      const link = row.querySelector('a');
      if (link?.href && link.href !== url) {
        const wrap = document.createElement('a');
        wrap.href = link.href;
        wrap.append(picture);
        slideImage.append(wrap);
      } else {
        slideImage.append(picture);
      }
    }
    li.append(slideImage);

    if (contentHtml) {
      const content = document.createElement('div');
      content.className = 'carousel-slide-content';
      content.innerHTML = contentHtml;
      li.append(content);
    }

    slidesList.append(li);
  });

  slidesContainer.append(slidesList);

  const indicators = document.createElement('ul');
  indicators.className = 'carousel-slide-indicators';
  rows.forEach((_, i) => {
    const ind = document.createElement('li');
    ind.className = 'carousel-slide-indicator';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Slide ${i + 1}`);
    btn.dataset.index = String(i);
    ind.append(btn);
    indicators.append(ind);
  });

  const nav = document.createElement('div');
  nav.className = 'carousel-navigation-buttons';
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'slide-prev';
  prevBtn.setAttribute('aria-label', 'Previous slide');
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'slide-next';
  nextBtn.setAttribute('aria-label', 'Next slide');
  nav.append(prevBtn, nextBtn);

  block.textContent = '';
  block.append(nav);
  block.append(slidesContainer);
  block.append(indicators);

  const slides = block.querySelectorAll('.carousel-slide');
  const updateIndicator = (index) => {
    block.querySelectorAll('.carousel-slide-indicator button').forEach((b, i) => {
      b.disabled = i === index;
    });
  };
  const goTo = (index) => {
    const i = Math.max(0, Math.min(index, slides.length - 1));
    slides[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    updateIndicator(i);
  };

  prevBtn.addEventListener('click', () => {
    const current = Math.round(slidesList.scrollLeft / slidesList.clientWidth);
    goTo(current - 1);
  });
  nextBtn.addEventListener('click', () => {
    const current = Math.round(slidesList.scrollLeft / slidesList.clientWidth);
    goTo(current + 1);
  });
  block.querySelectorAll('.carousel-slide-indicator button').forEach((btn, i) => {
    btn.addEventListener('click', () => goTo(i));
  });

  slidesList.addEventListener('scroll', () => {
    const index = Math.round(slidesList.scrollLeft / slidesList.clientWidth);
    updateIndicator(index);
  });
  updateIndicator(0);
}
