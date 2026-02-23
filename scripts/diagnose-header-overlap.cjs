/**
 * ヘッダー重なり診断: 950px で overflow の計算値と rect を取得し、重なりを検出する。
 * 使用: node scripts/diagnose-header-overlap.cjs [URL] [viewport幅]
 */
const { chromium } = require('playwright');

const targetUrl = process.argv[2] || 'http://localhost:3001/';
const viewportWidth = process.argv[3] ? parseInt(process.argv[3], 10) : 950;

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: viewportWidth, height: 730 } });

  console.log('Opening:', targetUrl, 'at', viewportWidth, 'px');
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await page.waitForSelector('#nav .nav-sections ul, #nav .default-content-wrapper ul', { timeout: 10000 }).catch(() => {});

  const result = await page.evaluate(() => {
    const nav = document.querySelector('#nav');
    if (!nav) return { error: 'No #nav' };

    const navSections = nav.querySelector('.nav-sections');
    const navTools = nav.querySelector('.nav-tools');
    const wrapper = navSections?.querySelector('.default-content-wrapper');
    const ul = wrapper?.querySelector(':scope > ul');
    const lastLi = ul?.querySelector(':scope > li:last-child');

    const getInfo = (el, name) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        name,
        rect: { left: r.left, right: r.right, width: r.width },
        overflow: s.overflow,
        overflowX: s.overflowX,
        overflowY: s.overflowY,
      };
    };

    const sectionsRight = navSections ? navSections.getBoundingClientRect().right : 0;
    const lastLiRight = lastLi ? lastLi.getBoundingClientRect().right : 0;
    const toolsLeft = navTools ? navTools.getBoundingClientRect().left : 0;

    return {
      viewportWidth: window.innerWidth,
      overlap: lastLiRight > sectionsRight,
      lastLiOverlapsTools: lastLiRight > toolsLeft,
      sectionsRight,
      lastLiRight,
      toolsLeft,
      elements: [
        getInfo(navSections, 'nav-sections'),
        getInfo(wrapper, 'default-content-wrapper'),
        getInfo(ul, 'ul'),
        getInfo(lastLi, 'last-li'),
        getInfo(navTools, 'nav-tools'),
      ].filter(Boolean),
    };
  });

  console.log(JSON.stringify(result, null, 2));

  if (result.overlap) {
    console.log('\n[!] 重なり検出: lastLi が nav-sections の右端を超えています');
  }
  if (result.lastLiOverlapsTools) {
    console.log('[!] 重なり検出: lastLi が nav-tools と重なっています');
  }

  await browser.close();
})();
