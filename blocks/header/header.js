import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

/** Nav link suffix for "open in new window". Strip from display; set target="_blank" and icon. */
const NEW_WINDOW_SUFFIX = '|NewWindow';

/**
 * If text ends with |NewWindow, returns display label (suffix stripped) and isNewWindow true.
 * @param {string} text - Raw label text from nav list
 * @returns {{ displayLabel: string, isNewWindow: boolean }}
 */
function parseNewWindowLabel(text) {
  const t = (text || '').trim();
  const isNewWindow = t.endsWith(NEW_WINDOW_SUFFIX);
  const displayLabel = isNewWindow
    ? t.slice(0, -NEW_WINDOW_SUFFIX.length).trim()
    : t;
  return { displayLabel, isNewWindow };
}

/**
 * Apply "open in new window" to an anchor: set attributes and wrap text in span for icon.
 * @param {HTMLAnchorElement} a - Link element
 * @param {string} displayLabel - Visible text (without |NewWindow)
 * @param {string} labelSpanClass - Wrapper span class for icon (e.g. nav-link-label)
 */
function applyNewWindowToLink(a, displayLabel, labelSpanClass) {
  a.setAttribute('target', '_blank');
  a.setAttribute('rel', 'noopener noreferrer');
  a.setAttribute('data-open-in-new-window', 'true');
  a.textContent = '';
  const span = document.createElement('span');
  span.className = labelSpanClass;
  span.textContent = displayLabel;
  a.appendChild(span);
}

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

/**
 * When the first block in main is hero-video: add body.has-hero-video, set up scroll-based
 * header opacity, and ensure the hero section can overlap the header. Call after main content
 * is ready (e.g. on main-sections-loaded) so the first block is present.
 */
export function applyHeroVideoOverlap() {
  if (document.body.classList.contains('has-hero-video')) return;
  const main = document.querySelector('main');
  const firstBlock = main?.querySelector(':scope .block');
  if (!firstBlock?.classList.contains('hero-video')) return;

  document.body.classList.add('has-hero-video');
  const heroSection = firstBlock.closest('main > div.section') || firstBlock.closest('main > div') || firstBlock.parentElement;
  const navHeightPx = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'), 10) || 72;

  const updateHeaderScrolled = () => {
    const rect = heroSection.getBoundingClientRect();
    if (rect.bottom <= navHeightPx) {
      document.body.classList.add('header-scrolled');
    } else {
      document.body.classList.remove('header-scrolled');
    }
  };

  window.addEventListener('scroll', updateHeaderScrolled, { passive: true });
  updateHeaderScrolled();
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
    const topParsed = parseNewWindowLabel(labelText);
    if (labelLink) {
      const clonedLink = labelLink.cloneNode(true);
      if (topParsed.isNewWindow) {
        applyNewWindowToLink(clonedLink, topParsed.displayLabel, 'nav-link-label');
      } else {
        clonedLink.textContent = topParsed.displayLabel;
      }
      newLi.appendChild(clonedLink);
    } else {
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = topParsed.displayLabel;
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
        headerEl.textContent = topParsed.displayLabel;
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
        listWrap.querySelectorAll('a').forEach((a) => {
          const itemLi = a.closest('li');
          const raw = itemLi
            ? (itemLi.textContent?.replace(/\s+/g, ' ').trim() ?? '')
            : (a.textContent?.replace(/\s+/g, ' ').trim() ?? '');
          const dropParsed = parseNewWindowLabel(raw);
          if (dropParsed.isNewWindow) {
            applyNewWindowToLink(a, dropParsed.displayLabel, 'nav-dropdown-link-label');
            if (itemLi) {
              [...itemLi.childNodes].forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE
                  && node.nodeValue?.trim() === NEW_WINDOW_SUFFIX) {
                  node.remove();
                }
                if (node.nodeType === Node.ELEMENT_NODE
                  && node.textContent?.trim() === NEW_WINDOW_SUFFIX) {
                  node.remove();
                }
              });
            }
          } else {
            a.textContent = dropParsed.displayLabel;
          }
          a.classList.add('nav-dropdown-link');
        });
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

  // Ensure nav-tools exists and prepend language + search (original: l-header__utility)
  let navTools = nav.querySelector('.nav-tools');
  if (!navTools) {
    navTools = document.createElement('div');
    navTools.className = 'section nav-tools';
    navTools.dataset.sectionStatus = 'loaded';
    nav.appendChild(navTools);
  }
  /* Path-based lang: /jp/ => Ja selected, En link to /en/; /en/ => En selected, Ja link to /jp/ */
  const pathname = window.location.pathname || '';
  const isEn = pathname.includes('/en');
  const enLinkHref = pathname.replace(/\/(jp)(\/|$)/g, '/en$2') || '/en/';
  const jaLinkHref = pathname.replace(/\/(en)(\/|$)/g, '/jp$2') || '/jp/';
  const utility = document.createElement('div');
  utility.className = 'nav-utility';
  const langUl = document.createElement('ul');
  langUl.className = 'nav-language';
  const jaLi = document.createElement('li');
  jaLi.className = 'nav-language-item';
  const enLi = document.createElement('li');
  enLi.className = 'nav-language-item';
  if (isEn) {
    jaLi.innerHTML = `<a href="${jaLinkHref}">Ja</a>`;
    enLi.setAttribute('data-current', '');
    enLi.textContent = 'En';
  } else {
    jaLi.setAttribute('data-current', '');
    jaLi.textContent = 'Ja';
    enLi.innerHTML = `<a href="${enLinkHref}">En</a>`;
  }
  langUl.append(jaLi, enLi);
  const searchAction = isEn ? 'https://search.marubeni.com/en/' : 'https://search.marubeni.com/ja/';
  const searchPlaceholder = isEn ? 'Enter search keywords' : 'お探しのキーワードを入力してください';
  const searchButton = document.createElement('button');
  searchButton.type = 'button';
  searchButton.className = 'nav-search';
  searchButton.setAttribute('aria-label', isEn ? 'Search' : '検索');
  searchButton.setAttribute('aria-expanded', 'false');
  searchButton.setAttribute('aria-controls', 'nav-search-bar');
  searchButton.innerHTML = `<span class="u-visually-hidden">${isEn ? 'Search' : '検索'}</span>`;
  utility.append(langUl, searchButton);
  navTools.prepend(utility);

  /* Search bar: expandable below header (original Marubeni behavior) */
  const searchBar = document.createElement('div');
  searchBar.id = 'nav-search-bar';
  searchBar.className = 'nav-search-bar';
  searchBar.setAttribute('hidden', '');
  const searchForm = document.createElement('form');
  searchForm.action = searchAction;
  searchForm.method = 'get';
  searchForm.className = 'nav-search-form';
  searchForm.innerHTML = `
    <input type="search" name="kw" class="nav-search-input" placeholder="${searchPlaceholder}" autocomplete="off">
    <button type="submit" class="nav-search-submit" aria-label="${isEn ? 'Search' : '検索'}">
      <span class="u-visually-hidden">${isEn ? 'Search' : '検索'}</span>
    </button>
  `;
  searchBar.appendChild(searchForm);

  /* Remove redundant search button from nav fragment; keep only nav-utility */
  Array.from(navTools.children).forEach((child) => {
    if (!child.classList.contains('nav-utility')) {
      child.remove();
    }
  });

  /* Logo locale from page path (not document.lang) to avoid Universal Editor /en/ mismatch */
  const pathForLogo = basePath || window.location.pathname || '';
  const logoHref = pathForLogo.includes('/en') ? '/en/' : '/jp/';

  const navBrand = nav.querySelector('.nav-brand');
  let brandLink = navBrand?.querySelector('.button')
    || navBrand?.querySelector('a[href] img')?.closest('a')
    || navBrand?.querySelector('a[href] picture')?.closest('a')
    || navBrand?.querySelector('.image.block a[href]');

  /* If image block has logo but no link (e.g. AEM nav link not applied), wrap in anchor */
  if (!brandLink) {
    const imageBlock = navBrand?.querySelector('.image.block, .image');
    const logoMedia = imageBlock?.querySelector('picture, img');
    if (logoMedia && !logoMedia.closest('a[href]')) {
      const a = document.createElement('a');
      a.href = logoHref;
      logoMedia.parentNode.insertBefore(a, logoMedia);
      a.appendChild(logoMedia);
      brandLink = a;
    }
  }

  /* Fix logo href when AEM/Universal Editor outputs wrong locale (e.g. /en/ for jp nav) */
  if (brandLink && brandLink.href) {
    const hrefPath = new URL(brandLink.href, window.location.origin).pathname;
    const wrongEn = logoHref === '/jp/' && (hrefPath.startsWith('/en') || hrefPath === '/en');
    const wrongJp = logoHref === '/en/' && (hrefPath.startsWith('/jp') || hrefPath === '/jp');
    if (wrongEn || wrongJp) brandLink.setAttribute('href', logoHref);
  }

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
    let dropdownCloseTimer = 0;
    const DROPDOWN_CLOSE_DELAY = 150;

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
          window.clearTimeout(dropdownCloseTimer);
          dropdownCloseTimer = 0;
          toggleAllNavSections(navSections, false);
          navSection.setAttribute('aria-expanded', 'true');
        });
        /* Panel below header: mouseenter cancels close when moving from link to panel */
        const panel = navSection.querySelector('.nav-dropdown-panel') || navSection.querySelector('ul');
        if (panel) {
          panel.addEventListener('mouseenter', () => {
            if (!isDesktop.matches) return;
            window.clearTimeout(dropdownCloseTimer);
            dropdownCloseTimer = 0;
          });
          panel.addEventListener('mouseleave', () => {
            if (!isDesktop.matches) return;
            dropdownCloseTimer = window.setTimeout(() => {
              toggleAllNavSections(navSections, false);
              dropdownCloseTimer = 0;
            }, DROPDOWN_CLOSE_DELAY);
          });
        }
      }
    });
    navSections.addEventListener('mouseleave', () => {
      if (!isDesktop.matches) return;
      dropdownCloseTimer = window.setTimeout(() => {
        toggleAllNavSections(navSections, false);
        dropdownCloseTimer = 0;
      }, DROPDOWN_CLOSE_DELAY);
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

  /* Background element: original .l-header__background - white overlay with transition */
  const searchBackground = document.createElement('div');
  searchBackground.className = 'nav-search-background';
  searchBackground.setAttribute('aria-hidden', 'true');

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav, searchBar, searchBackground);
  block.append(navWrapper);

  /* Search toggle: match original megamenu - aria-expanded at start, blockSize animation */
  const SEARCH_CLOSE_DELAY = 150;
  const SEARCH_ANIMATION_DURATION = 200;
  let searchCloseTimer = 0;
  let searchAnimation = null;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toggleSearch = (open) => {
    const isOpen = open ?? !navWrapper.classList.contains('search-open');
    window.clearTimeout(searchCloseTimer);
    searchCloseTimer = 0;
    searchAnimation?.cancel();
    searchBar.removeAttribute('hidden');
    const duration = prefersReducedMotion ? 0 : SEARCH_ANIMATION_DURATION;
    searchButton.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      navWrapper.classList.add('search-open');
      searchBar.style.overflow = 'clip';
      searchBar.style.blockSize = '0';
      requestAnimationFrame(() => {
        const targetHeight = searchBar.scrollHeight;
        searchBackground.style.height = `${targetHeight}px`;
        searchAnimation = searchBar.animate(
          { blockSize: ['0px', `${targetHeight}px`] },
          { duration, easing: 'ease' },
        );
        searchAnimation.onfinish = () => {
          searchBar.style.removeProperty('overflow');
          searchBar.style.removeProperty('block-size');
          searchAnimation = null;
        };
      });
    } else {
      /* Keep search-open until animation finishes so search bar stays display:block during close */
      searchBackground.style.height = '0';
      const cs = getComputedStyle(searchBar);
      const startBlockSize = parseInt(cs.blockSize, 10) || searchBar.offsetHeight;
      searchBar.style.overflow = 'clip';
      searchAnimation = searchBar.animate(
        { blockSize: [`${startBlockSize}px`, '0px'] },
        { duration, easing: 'ease' },
      );
      searchAnimation.onfinish = () => {
        navWrapper.classList.remove('search-open');
        searchBar.setAttribute('hidden', '');
        searchBar.style.removeProperty('overflow');
        searchBar.style.removeProperty('block-size');
        searchAnimation = null;
      };
    }
  };
  const closeSearch = () => toggleSearch(false);
  searchButton.addEventListener('click', () => toggleSearch());
  /* Mouse leave: close when pointer leaves search bar + button (original: pointerleave + delay) */
  if (isDesktop.matches) {
    const cancelSearchClose = () => {
      window.clearTimeout(searchCloseTimer);
      searchCloseTimer = 0;
    };
    const scheduleSearchClose = () => {
      if (!navWrapper.classList.contains('search-open')) return;
      searchCloseTimer = window.setTimeout(() => {
        closeSearch();
        searchCloseTimer = 0;
      }, SEARCH_CLOSE_DELAY);
    };
    searchBar.addEventListener('pointerleave', (e) => {
      if (searchButton.contains(e.relatedTarget)) return;
      scheduleSearchClose();
    });
    searchButton.addEventListener('pointerleave', (e) => {
      if (searchBar.contains(e.relatedTarget)) return;
      scheduleSearchClose();
    });
    searchBar.addEventListener('pointerenter', cancelSearchClose);
    searchButton.addEventListener('pointerenter', cancelSearchClose);
  }
  const onSearchEscape = (e) => {
    if (e.code === 'Escape' && navWrapper.classList.contains('search-open')) {
      closeSearch();
      searchButton.focus();
    }
  };
  searchBar.querySelector('.nav-search-input')?.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') closeSearch();
  });
  document.addEventListener('keydown', onSearchEscape);

  const main = document.querySelector('main');
  const runOverlap = () => {
    applyHeroVideoOverlap();
    // Retry once after a tick (AEM authoring may decorate blocks slightly later)
    requestAnimationFrame(() => applyHeroVideoOverlap());
  };
  if (main?.querySelector(':scope .block')) {
    runOverlap();
  } else {
    document.addEventListener('main-sections-loaded', runOverlap, { once: true });
  }
}
