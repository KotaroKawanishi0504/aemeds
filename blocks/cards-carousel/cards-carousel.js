import { createOptimizedPicture } from '../../scripts/aem.js';
import { getHrefFromLinkCell, isOpenInNewWindow } from '../../scripts/card-utils.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/** Breakpoint (px): must match media queries in cards-carousel.css (900px). */
const BREAKPOINT_PX = 900;
/** Gap (px) between carousel items; match CSS --card-list-gap default (24px). */
const PAGINATION_GAP_PX = 24;
const LIST_CLASS = 'cards-carousel-list';
const ITEM_CLASS = 'cards-carousel-item';
const LINK_CLASS = 'cards-carousel-link';
const IMAGE_CLASS = 'cards-carousel-image';
const TITLE_CLASS = 'cards-carousel-title';
const PAGINATION_CLASS = 'cards-carousel-pagination';
const PAGINATION_BULLET_CLASS = 'cards-carousel-pagination-bullet';
const MODE_CAROUSEL = 'cards-carousel-mode-carousel';
const MODE_GRID = 'cards-carousel-mode-grid';

/**
 * @returns {boolean} true when viewport is below breakpoint (carousel mode)
 */
function isCarouselView() {
  return window.innerWidth < BREAKPOINT_PX;
}

/**
 * Updates pagination bullets to reflect current scroll position.
 * @param {Element} block - block element
 * @param {Element} list - .cards-carousel-list
 * @param {Element} pagination - .cards-carousel-pagination
 */
function updatePagination(block, list, pagination) {
  if (!list || !pagination) return;
  const items = [...list.querySelectorAll(`.${ITEM_CLASS}`)];
  if (items.length === 0) return;
  const { scrollLeft } = list;
  const [firstItem] = items;
  const itemWidth = firstItem?.offsetWidth ?? 0;
  const totalWidth = itemWidth + PAGINATION_GAP_PX;
  let slideIndex = totalWidth > 0 ? Math.round(scrollLeft / totalWidth) : 0;
  slideIndex = Math.max(0, Math.min(slideIndex, items.length - 1));
  pagination.querySelectorAll(`.${PAGINATION_BULLET_CLASS}`).forEach((bullet, i) => {
    bullet.classList.toggle('active', i === slideIndex);
    bullet.setAttribute('aria-current', i === slideIndex ? 'true' : null);
  });
}

/**
 * Scrolls the list so the item at index is in view.
 * @param {Element} list - .cards-carousel-list
 * @param {number} index - item index
 */
function goToSlide(list, index) {
  const items = [...list.querySelectorAll(`.${ITEM_CLASS}`)];
  if (index < 0 || index >= items.length) return;
  const el = items[index];
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }
}

/**
 * Switches block to carousel mode: horizontal scroll + pagination.
 * @param {Element} block - block element
 * @param {Element} list - .cards-carousel-list
 * @param {Element} pagination - .cards-carousel-pagination
 */
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

/**
 * Switches block to grid mode: 3-column grid, pagination hidden.
 * @param {Element} block - block element
 * @param {Element} pagination - .cards-carousel-pagination
 */
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

/**
 * Applies carousel or grid mode based on viewport width.
 * @param {Element} block - block element
 */
function applyMode(block) {
  const list = block.querySelector(`.${LIST_CLASS}`);
  const pagination = block.querySelector(`.${PAGINATION_CLASS}`);
  if (isCarouselView()) {
    setupCarouselMode(block, list, pagination);
  } else {
    setupGridMode(block, pagination);
  }
}

/**
 * Decorates the block: supports both class="card-carousel" (AEM alias) and class="cards-carousel".
 * Adds canonical class so CSS applies; builds list + pagination and applies grid/carousel mode.
 * @param {Element} block - block element
 */
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
  mq.addEventListener('change', () => applyMode(block));
}
