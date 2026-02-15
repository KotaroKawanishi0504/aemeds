import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const BREAKPOINT_PX = 900;
const LIST_CLASS = 'cards-carousel-list';
const ITEM_CLASS = 'cards-carousel-item';
const LINK_CLASS = 'cards-carousel-link';
const IMAGE_CLASS = 'cards-carousel-image';
const TITLE_CLASS = 'cards-carousel-title';
const PAGINATION_CLASS = 'cards-carousel-pagination';
const PAGINATION_BULLET_CLASS = 'cards-carousel-pagination-bullet';
const MODE_CAROUSEL = 'cards-carousel-mode-carousel';
const MODE_GRID = 'cards-carousel-mode-grid';

function getHrefFromLinkCell(cell) {
  if (!cell) return '';
  const a = cell.querySelector('a[href]');
  if (a) return a.getAttribute('href')?.trim() || '';
  const text = cell.textContent?.trim() || '';
  if (text && (text.startsWith('/') || text.startsWith('http://') || text.startsWith('https://'))) return text;
  return '';
}

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

function isCarouselView() {
  return window.innerWidth < BREAKPOINT_PX;
}

function updatePagination(block, list, pagination) {
  if (!list || !pagination) return;
  const items = [...list.querySelectorAll(`.${ITEM_CLASS}`)];
  if (items.length === 0) return;
  const { scrollLeft } = list;
  const [firstItem] = items;
  const itemWidth = firstItem?.offsetWidth ?? 0;
  const gap = 16;
  const totalWidth = itemWidth + gap;
  let slideIndex = Math.round(scrollLeft / totalWidth);
  slideIndex = Math.max(0, Math.min(slideIndex, items.length - 1));
  pagination.querySelectorAll(`.${PAGINATION_BULLET_CLASS}`).forEach((bullet, i) => {
    bullet.classList.toggle('active', i === slideIndex);
    bullet.setAttribute('aria-current', i === slideIndex ? 'true' : null);
  });
}

function goToSlide(list, index) {
  const items = [...list.querySelectorAll(`.${ITEM_CLASS}`)];
  if (index < 0 || index >= items.length) return;
  const el = items[index];
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }
}

function setupCarouselMode(block, list, pagination) {
  block.classList.remove(MODE_GRID);
  block.classList.add(MODE_CAROUSEL);
  if (pagination) pagination.hidden = false;

  if (block.cardsCarouselScrollHandler) {
    list.removeEventListener('scroll', block.cardsCarouselScrollHandler);
  }
  const onScroll = () => updatePagination(block, list, pagination);
  list.addEventListener('scroll', onScroll);
  block.cardsCarouselScrollHandler = onScroll;
  updatePagination(block, list, pagination);

  pagination?.querySelectorAll(`.${PAGINATION_BULLET_CLASS}`).forEach((bullet) => {
    bullet.replaceWith(bullet.cloneNode(true));
  });
  pagination?.querySelectorAll(`.${PAGINATION_BULLET_CLASS}`).forEach((bullet, idx) => {
    bullet.addEventListener('click', () => goToSlide(list, idx));
  });
}

function setupGridMode(block, pagination) {
  block.classList.remove(MODE_CAROUSEL);
  block.classList.add(MODE_GRID);
  if (pagination) pagination.hidden = true;

  const list = block.querySelector(`.${LIST_CLASS}`);
  if (list && block.cardsCarouselScrollHandler) {
    list.removeEventListener('scroll', block.cardsCarouselScrollHandler);
    block.cardsCarouselScrollHandler = null;
  }
}

function applyMode(block) {
  const list = block.querySelector(`.${LIST_CLASS}`);
  const pagination = block.querySelector(`.${PAGINATION_CLASS}`);
  if (isCarouselView()) {
    setupCarouselMode(block, list, pagination);
  } else {
    setupGridMode(block, pagination);
  }
}

export default function decorate(block) {
  if (block.classList.contains('card-carousel') && !block.classList.contains('cards-carousel')) {
    block.classList.add('cards-carousel');
  }
  const allRows = [...block.querySelectorAll(':scope > div')];
  const cardRows = allRows.filter((row) => row.children.length >= 2);
  if (cardRows.length === 0) return;

  const list = document.createElement('ul');
  list.className = LIST_CLASS;
  list.setAttribute('role', 'list');

  cardRows.forEach((row) => {
    const li = document.createElement('li');
    li.className = ITEM_CLASS;
    moveInstrumentation(row, li);

    const cells = [...row.children];
    const linkCell = cells.length >= 3 ? cells[2] : null;
    const openInNewWindowCell = cells.length >= 4 ? cells[3] : null;
    const rowHref = getHrefFromLinkCell(linkCell) || row.dataset?.link || '';
    const href = (typeof rowHref === 'string' && rowHref.trim() && rowHref !== '#') ? rowHref.trim() : '#';
    const openInNewWindow = isOpenInNewWindow(openInNewWindowCell, row);

    const a = document.createElement('a');
    a.className = LINK_CLASS;
    a.href = href;
    if (openInNewWindow) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }

    const imageCell = cells[0];
    const imageDiv = document.createElement('div');
    imageDiv.className = IMAGE_CLASS;
    const img = imageCell?.querySelector('img');
    if (img?.src) {
      const picture = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]);
      moveInstrumentation(img, picture.querySelector('img'));
      imageDiv.append(picture);
    } else if (imageCell) {
      const pic = imageCell.querySelector('picture');
      if (pic) {
        imageDiv.append(pic.cloneNode(true));
      }
    }
    a.append(imageDiv);

    const titleDiv = document.createElement('div');
    titleDiv.className = TITLE_CLASS;
    const textCell = cells[1];
    if (textCell) {
      titleDiv.textContent = textCell.textContent?.trim() || '';
    }
    a.append(titleDiv);

    li.append(a);
    list.append(li);
  });

  block.textContent = '';
  block.append(list);

  const pagination = document.createElement('div');
  pagination.className = PAGINATION_CLASS;
  pagination.setAttribute('role', 'tablist');
  pagination.setAttribute('aria-label', 'スライド');
  cardRows.forEach((_, i) => {
    const bullet = document.createElement('button');
    bullet.type = 'button';
    bullet.className = PAGINATION_BULLET_CLASS;
    bullet.setAttribute('aria-label', `${i + 1}枚目のスライドへ`);
    bullet.setAttribute('role', 'tab');
    if (i === 0) bullet.setAttribute('aria-current', 'true');
    bullet.innerHTML = '<i></i>';
    pagination.append(bullet);
  });
  block.append(pagination);

  applyMode(block);

  const mq = window.matchMedia(`(max-width: ${BREAKPOINT_PX - 1}px)`);
  const onResize = () => applyMode(block);
  mq.addEventListener('change', onResize);
  window.addEventListener('resize', onResize);
  block.cardsCarouselCleanup = () => {
    mq.removeEventListener('change', onResize);
    window.removeEventListener('resize', onResize);
    if (block.cardsCarouselScrollHandler) {
      const listEl = block.querySelector(`.${LIST_CLASS}`);
      if (listEl) listEl.removeEventListener('scroll', block.cardsCarouselScrollHandler);
    }
  };
}
