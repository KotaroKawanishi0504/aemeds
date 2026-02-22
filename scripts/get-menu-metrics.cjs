/**
 * 本家 marubeni.com の Shadow DOM 内でロゴ右端・メニュー先頭/末尾の位置を取得し、
 * 「ロゴ〜メニュー開始のギャップ」と「メニュー項目間のギャップ」を算出する。
 * 使用: node scripts/get-menu-metrics.cjs [output.json]
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outFile = process.argv[2] || 'docs/menu-metrics-original.json';
const url = 'https://www.marubeni.com/jp/';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1536, height: 730 });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});

  const metrics = await page.evaluate(() => {
    const host = document.querySelector('marubeni-header') || document.querySelector('[id="header"]');
    if (!host || !host.shadowRoot) return { error: 'no shadow', viewport: { w: window.innerWidth, h: window.innerHeight } };
    const root = host.shadowRoot;
    const bar = root.querySelector('.l-header__bar') || root.querySelector('nav') || root.querySelector('[class*="bar"]');
    if (!bar) return { error: 'no bar', viewport: { w: window.innerWidth, h: window.innerHeight } };

    const logo = root.querySelector('.l-header__logo') || root.querySelector('[class*="logo"]') || bar.querySelector('a[href*="marubeni"]');
    const navList = root.querySelector('.l-header__navigation ul') || root.querySelector('[class*="navigation"] ul') || bar.querySelector('ul');
    const links = navList ? Array.from(navList.querySelectorAll(':scope > li > a')).slice(0, 12) : [];

    const rect = (el) => el ? el.getBoundingClientRect() : null;
    const logoR = rect(logo);
    const firstLink = links[0];
    const lastLink = links[links.length - 1];
    const firstR = firstLink ? rect(firstLink) : null;
    const lastR = lastLink ? rect(lastLink) : null;

    let gapBetweenItems = null;
    if (links.length >= 2) {
      const r0 = rect(links[0]);
      const r1 = rect(links[1]);
      if (r0 && r1) gapBetweenItems = r1.left - (r0.left + r0.width);
    }

    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      logoRight: logoR ? logoR.left + logoR.width : null,
      firstLinkLeft: firstR ? firstR.left : null,
      lastLinkRight: lastR ? lastR.left + lastR.width : null,
      gapLogoToMenu: (logoR && firstR) ? firstR.left - (logoR.left + logoR.width) : null,
      menuBlockWidth: (firstR && lastR) ? (lastR.left + lastR.width) - firstR.left : null,
      gapBetweenItems,
      linkCount: links.length,
    };
  });

  await browser.close();

  const dir = path.dirname(outFile);
  if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(metrics, null, 2), 'utf8');
  console.log('Saved:', outFile);
})();
