/**
 * Playwright で AEM ページを開き、ヒーロー動画ブロックの HTML を取得して保存する。
 * AEM の場合はログイン後 Enter でキャプチャ。
 *
 * 使用: node scripts/get-aem-hero-video-html.cjs [AEMのURL] [出力ディレクトリ]
 * 例:   node scripts/get-aem-hero-video-html.cjs "https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni/jp/cards.html" docs
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const targetUrl = process.argv[2] || 'https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni/jp/cards.html';
const outDir = process.argv[3] || 'docs';
const isAem = /adobeaemcloud\.com/i.test(targetUrl);

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: ['--start-maximized'],
  });
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  console.log('Opening:', targetUrl);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});

  if (isAem) {
    console.log('\nAEM: ブラウザでログインし、cards ページが表示されたら Enter を押してください。');
    await new Promise((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question('', () => { rl.close(); resolve(); });
    });
  }

  await page.waitForSelector('main, .hero-video, .section', { timeout: 15000 }).catch(() => {});

  const result = await page.evaluate(() => {
    const heroBlock = document.querySelector('.hero-video') || document.querySelector('main .hero-video');
    const mainEl = document.querySelector('main');
    return {
      url: window.location.href,
      heroVideoBlockHTML: heroBlock ? heroBlock.outerHTML : null,
      heroVideoBlockExists: !!heroBlock,
      hasHeroVideoLink: heroBlock ? !!heroBlock.querySelector('.hero-video-link') : false,
      mainHTML: mainEl ? mainEl.innerHTML : null,
      firstSectionHTML: mainEl && mainEl.firstElementChild ? mainEl.firstElementChild.outerHTML : null,
    };
  });

  const prefix = outDir.replace(/[/\\]+$/, '');
  const blockPath = path.join(prefix, 'aem-hero-video-block.html');
  const mainPath = path.join(prefix, 'aem-main-first-section.html');
  const metaPath = path.join(prefix, 'aem-html-capture-meta.json');

  if (result.heroVideoBlockHTML) {
    fs.writeFileSync(blockPath, `<!-- URL: ${result.url} -->\n<!-- .hero-video-link present: ${result.hasHeroVideoLink} -->\n\n${result.heroVideoBlockHTML}`, 'utf8');
    console.log('Saved:', blockPath);
  } else {
    fs.writeFileSync(blockPath, `<!-- No .hero-video block found on ${result.url} -->\n`, 'utf8');
    console.log('No .hero-video block found. Wrote placeholder to', blockPath);
  }

  if (result.firstSectionHTML) {
    fs.writeFileSync(mainPath, `<!-- URL: ${result.url} -->\n<!-- First section of main -->\n\n${result.firstSectionHTML}`, 'utf8');
    console.log('Saved:', mainPath);
  }

  fs.writeFileSync(metaPath, JSON.stringify({
    url: result.url,
    heroVideoBlockExists: result.heroVideoBlockExists,
    hasHeroVideoLink: result.hasHeroVideoLink,
    capturedAt: new Date().toISOString(),
  }, null, 2), 'utf8');
  console.log('Saved:', metaPath);

  await browser.close();
})();
