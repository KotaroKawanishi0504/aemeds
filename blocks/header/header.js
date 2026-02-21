import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Injects skip link to main content (Marubeni-style). Ensures main has id="main" for target.
 */
function ensureSkipLink() {
  if (document.querySelector('.skip-link')) return;
  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main';
  const a = document.createElement('a');
  a.href = '#main';
  a.className = 'skip-link';
  a.textContent = 'メインコンテンツへスキップ';
  a.setAttribute('tabindex', '0');
  document.body.insertBefore(a, document.body.firstChild);
}

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    if (!nav) return;
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections?.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('.nav-hamburger button')?.focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections?.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Detects if an element is an image block (nav authoring: image after a text block).
 * @param {Element} el element to check
 * @returns {boolean}
 */
function isNavImageBlock(el) {
  return (el.tagName === 'P' && el.querySelector('picture'))
    || (el.classList?.contains('image') && el.classList?.contains('block'));
}

/**
 * Nav authoring: same section has multiple blocks — each Text block (ul) = one
 * first-level item; Image block(s) immediately after a Text block = images for
 * that item's dropdown. Rebuilds one ul from multiple uls + images.
 * @param {Element} navSections .nav-sections element
 */
function normalizeNavSectionsFromBlocks(navSections) {
  const wrapper = navSections.querySelector(':scope .default-content-wrapper');
  if (!wrapper) return;
  const children = [...wrapper.children];
  if (children.length <= 1) return;
  const items = [];
  let lastNav = null;
  children.forEach((el) => {
    if (el.tagName === 'UL') {
      const firstLi = el.querySelector(':scope > li');
      if (firstLi) {
        lastNav = { li: firstLi, images: [] };
        items.push(lastNav);
      }
    } else if (lastNav && isNavImageBlock(el)) {
      lastNav.images.push(el);
    }
  });
  if (items.length <= 0) return;
  const singleUl = document.createElement('ul');
  items.forEach(({ li, images }) => {
    const newLi = document.createElement('li');
    const labelLink = li.querySelector(':scope > a');
    const nestedUl = li.querySelector(':scope > ul');
    const cloneForLabel = li.cloneNode(true);
    cloneForLabel.querySelector(':scope > ul')?.remove();
    const labelText = cloneForLabel.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (labelLink) {
      const clonedLink = labelLink.cloneNode(true);
      clonedLink.textContent = labelText;
      newLi.appendChild(clonedLink);
    } else {
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = labelText;
      newLi.appendChild(a);
    }
    const hasDropdown = nestedUl || images.length > 0;
    if (hasDropdown) {
      const panel = document.createElement('div');
      panel.className = 'nav-dropdown-panel';
      const content = document.createElement('div');
      content.className = 'nav-dropdown-content';
      if (nestedUl) {
        const headerEl = document.createElement('div');
        headerEl.className = 'nav-dropdown-header';
        headerEl.textContent = labelText;
        content.appendChild(headerEl);
        const listWrap = document.createElement('div');
        listWrap.className = 'nav-dropdown-list';
        const clonedUl = nestedUl.cloneNode(true);
        /* With images: 3 columns (e.g. 事業紹介). Without images: 4 columns (e.g. ニュース) */
        listWrap.dataset.columns = images.length > 0 ? '3' : '4';
        listWrap.appendChild(clonedUl);
        const listItems = clonedUl.querySelectorAll(':scope > li');
        const cols = parseInt(listWrap.dataset.columns, 10);
        const rows = Math.ceil(listItems.length / cols);
        for (let j = 0; j < cols; j += 1) {
          const lastIndex = Math.min((j + 1) * rows, listItems.length) - 1;
          if (lastIndex >= 0) listItems[lastIndex].classList.add('nav-dropdown-item-last-in-column');
        }
        listWrap.querySelectorAll('a').forEach((a) => a.classList.add('nav-dropdown-link'));
        content.appendChild(listWrap);
      }
      panel.appendChild(content);
      if (images.length > 0) {
        const imgWrap = document.createElement('div');
        imgWrap.className = 'nav-dropdown-images';
        images.forEach((imgEl) => imgWrap.appendChild(imgEl.cloneNode(true)));
        panel.appendChild(imgWrap);
      }
      newLi.appendChild(panel);
    }
    singleUl.appendChild(newLi);
  });
  wrapper.textContent = '';
  wrapper.appendChild(singleUl);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  if (button) button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections ? navSections.querySelectorAll('.nav-drop') : [];
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  ensureSkipLink();

  // load nav fragment: prefer meta 'nav'; else content-path nav first, then /nav fallback
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : null;
  const basePath = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '';
  const parentPath = basePath.replace(/\/[^/]+$/, '') || '';
  const candidates = navPath
    ? [navPath]
    : [
      `${parentPath}/nav`,
      `${basePath}/nav`,
      '/nav',
      `${basePath}/Header/nav`,
    ];
  const fragment = await candidates.reduce(
    async (prev, path) => (await prev) || loadFragment(path),
    Promise.resolve(null),
  );
  if (!fragment) return;

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand?.querySelector('.button')
    || navBrand?.querySelector('a[href] img')?.closest('a')
    || navBrand?.querySelector('a[href] picture')?.closest('a')
    || navBrand?.querySelector('.image.block a[href]');
  if (brandLink) {
    if (brandLink.classList.contains('button')) {
      brandLink.className = '';
      const btnContainer = brandLink.closest('.button-container');
      if (btnContainer) btnContainer.className = '';
    }
  } else if (navBrand && !navBrand.querySelector('.image.block')) {
    const fallbackLink = document.createElement('a');
    fallbackLink.href = '/';
    fallbackLink.textContent = 'Home';
    fallbackLink.className = 'nav-brand-fallback';
    navBrand.prepend(fallbackLink);
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    normalizeNavSectionsFromBlocks(navSections);
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      const hasDropdown = navSection.querySelector('ul') || navSection.querySelector('.nav-dropdown-panel');
      if (hasDropdown) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', (e) => {
        if (isDesktop.matches) {
          if (e.target.closest('.nav-dropdown-panel')) return;
          const isLabelLink = e.target.closest('a[href="#"]');
          if (isLabelLink) e.preventDefault();
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
      if (hasDropdown) {
        navSection.addEventListener('mouseenter', () => {
          if (!isDesktop.matches) return;
          toggleAllNavSections(navSections, false);
          navSection.setAttribute('aria-expanded', 'true');
        });
      }
    });
    navSections.addEventListener('mouseleave', () => {
      if (!isDesktop.matches) return;
      toggleAllNavSections(navSections, false);
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
