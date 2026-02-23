import {
  loadHeader,
  loadFooter,
  decorateBlock,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadBlock,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
/**
 * Sets --global-text-scale and --rem on :root from window width.
 * 1280px+: 本家 --rem=10, body 16px, h2 32px のため scale=16/18.
 * 900–1279px: 本家に合わせ rem=(w/1280)*10, scale=(w/1280)*(16/18) で body=1.6*rem, h2=3.2*rem 相当に。
 * 900px 未満: scale 0.65, rem 6.
 * Used when CSS 100vw does not re-evaluate on resize (e.g. AEM preview).
 */
function applyGlobalTextScale() {
  const w = window.innerWidth;
  let scale;
  let rem;
  if (w < 900) {
    scale = 0.65;
    rem = 6;
  } else if (w >= 1280) {
    scale = 16 / 18;
    rem = 10;
  } else {
    rem = (w / 1280) * 10;
    scale = (w / 1280) * (16 / 18);
  }
  document.documentElement.style.setProperty('--vw', String(w / 100));
  document.documentElement.style.setProperty('--global-text-scale', String(scale));
  document.documentElement.style.setProperty('--rem', String(rem));
}

async function loadEager(doc) {
  applyGlobalTextScale();
  window.addEventListener('resize', applyGlobalTextScale);
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  } else {
    document.body.classList.add('appear');
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Block names that may appear in the DOM without the standard section structure
 * (e.g. AEM Author when main is missing). Each gets decorateBlock + loadBlock
 * so block CSS/JS load via EDS loadBlock().
 */
const ORPHAN_BLOCK_NAMES = ['cards'];

/**
 * Loads blocks that exist in the DOM but were not decorated via decorateBlocks(main)
 * (e.g. when main is missing). Ensures block CSS is loaded via loadBlock().
 * @param {Document} doc The document
 */
async function loadOrphanBlocks(doc) {
  const promises = ORPHAN_BLOCK_NAMES.flatMap((blockName) => {
    const candidates = doc.querySelectorAll(`div.${blockName}:not(.block)`);
    return [...candidates].map((el) => {
      decorateBlock(el);
      return loadBlock(el);
    });
  });
  await Promise.all(promises);
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  if (main) {
    await loadSections(main);
    document.dispatchEvent(new CustomEvent('main-sections-loaded', { detail: { main } }));
  } else {
    await loadOrphanBlocks(doc);
  }

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
