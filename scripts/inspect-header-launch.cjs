/**
 * Playwright でブラウザを起動し、指定 URL のヘッダー要素の
 * 計算済みスタイル・レクトを JSON で出力する。
 * CDP 接続が使えない環境向け。AEM の場合は表示されたブラウザでログイン可能。
 *
 * 使用: node scripts/inspect-header-launch.cjs <URL> [出力ファイル名] [viewport幅]
 * 例: node scripts/inspect-header-launch.cjs "https://www.marubeni.com/jp/" docs/inspection-original.json
 *     node scripts/inspect-header-launch.cjs "https://author-.../cards.html" docs/inspection-aem.json
 * PC ビューで狭い幅を調査する場合: viewport は 900 以上にすること（900未満でモバイルレイアウトになる）。
 *     例: ... docs/inspection-aem-1000.json 1000
 */

const { chromium } = require('playwright');
const readline = require('readline');

const targetUrl = process.argv[2];
const outFile = process.argv[3] || 'docs/inspection-output.json';
const viewportWidth = process.argv[4] ? parseInt(process.argv[4], 10) : null;

if (!targetUrl) {
  console.error('Usage: node inspect-header-launch.cjs <URL> [output.json] [viewportWidth]');
  process.exit(1);
}

const isAem = /adobeaemcloud\.com/i.test(targetUrl);
const useNarrowViewport = Number.isFinite(viewportWidth) && viewportWidth > 0;
const headlessForNarrow = useNarrowViewport && !isAem;

(async () => {
  const browser = await chromium.launch({
    headless: headlessForNarrow,
    channel: 'chrome',
    args: useNarrowViewport ? [] : ['--start-maximized'],
  });

  const context = await browser.newContext(
    useNarrowViewport ? { viewport: { width: viewportWidth, height: 730 } } : { viewport: null }
  );
  const page = await context.newPage();

  console.log('Opening:', targetUrl);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});

  if (isAem) {
    console.log('\nAEM の場合はブラウザでログインし、対象ページが表示されたら Enter を押してください。');
    await new Promise((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question('', () => { rl.close(); resolve(); });
    });
  }

  // ヘッダーらしい要素が表示されるまで待つ（ログイン後など）
  await page.waitForSelector('header, #nav, [role="banner"]', { timeout: 30000 }).catch(() => {});

  const data = await page.evaluate(() => {
    function getClassString(el) {
      if (!el) return '';
      const c = el.className;
      if (typeof c === 'string') return c;
      if (c && typeof c.baseVal === 'string') return c.baseVal;
      return '';
    }
    const header = document.querySelector('header') || document.querySelector('#nav')?.closest('header') || document.querySelector('#nav');
    const root = header || document.querySelector('#nav') || document.body;
    function extractHeaderData(node) {
      if (!node) return null;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      const props = ['paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft','width','height','minWidth','maxWidth','fontSize','fontWeight','lineHeight','gap','display','flexGrow','flexShrink','flexBasis','justifyContent','alignItems','boxSizing'];
      const styleObj = {};
      props.forEach(p => { styleObj[p] = style[p]; });
      const children = [];
      Array.from(node.children).forEach((el, i) => {
        const child = extractHeaderData(el);
        if (child) { child._index = i; child._tag = el.tagName; child._class = getClassString(el).slice(0, 80); }
        children.push(child);
      });
      return { tag: node.tagName, id: node.id || undefined, class: getClassString(node).slice(0, 120), rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, top: rect.top, left: rect.left }, style: styleObj, children: children.length ? children : undefined };
    }
    const rootStyle = document.documentElement ? getComputedStyle(document.documentElement) : null;
    function getVar(name) {
      if (!rootStyle) return null;
      const v = rootStyle.getPropertyValue(name).trim();
      return v || null;
    }
    function getElFontSize(sel) {
      var el = document.querySelector(sel);
      return el ? getComputedStyle(el).fontSize : null;
    }
    const diagnostic = {
      styleSheets: Array.from(document.styleSheets).map(s => s.href || null).filter(Boolean),
      codeBasePath: (window.hlx && window.hlx.codeBasePath) || null,
      rem: rootStyle ? (rootStyle.getPropertyValue('--rem').trim() || null) : null,
      globalTextScale: getVar('--global-text-scale'),
      bodyFontSizeM: getVar('--body-font-size-m'),
      headingFontSizeXl: getVar('--heading-font-size-xl'),
      hasMain: !!document.querySelector('main'),
      headerBlockStatus: (function(){ var el = document.querySelector('header [data-block-status]'); return el && el.dataset && el.dataset.blockStatus; })() || null,
      cardsWrapperCount: document.querySelectorAll('.cards-wrapper').length,
      linkHeaderCss: !!Array.from(document.styleSheets).some(s => s.href && (s.href.includes('header.css') || s.href.includes('blocks/header'))),
      linkMarubeniTheme: !!Array.from(document.styleSheets).some(s => s.href && s.href.includes('marubeni-theme')),
      linkCardsCss: !!Array.from(document.styleSheets).some(s => s.href && (s.href.includes('cards.css') || s.href.includes('blocks/cards'))),
      computed: {
        body: getElFontSize('body'),
        headerNav: getElFontSize('header nav a'),
        cardsCardBody: getElFontSize('.cards-card-body') || getElFontSize('.cards .cards-card-body'),
        cardsCarouselTitle: getElFontSize('.cards-carousel-title'),
      },
    };
    var cardsSample = null;
    var cardBody = document.querySelector('.cards-card-body') || document.querySelector('.cards .cards-card-body') || document.querySelector('[class*="cards-card-body"]');
    if (cardBody) {
      var cs = getComputedStyle(cardBody);
      cardsSample = { body: { paddingLeft: cs.paddingLeft, fontSize: cs.fontSize, minHeight: cs.minHeight } };
      var icon = cardBody.querySelector('.cards-card-body-icon') || cardBody.previousElementSibling;
      if (icon) { var is_ = getComputedStyle(icon); cardsSample.icon = { width: is_.width, height: is_.height }; }
    }
    return { url: window.location.href, viewport: { width: window.innerWidth, height: window.innerHeight }, diagnostic, header: extractHeaderData(root), cardsSample: cardsSample };
  });

  const fs = require('fs');
  const path = require('path');
  const dir = path.dirname(outFile);
  if (dir) {
    const parts = dir.split(path.sep);
    let acc = parts[0] === '' ? path.sep : '';
    for (let i = parts[0] === '' ? 1 : 0; i < parts.length; i++) {
      const d = parts[i];
      if (!d) continue;
      const p = path.join(acc, d);
      if (!fs.existsSync(p)) fs.mkdirSync(p);
      acc = p;
    }
  }
  fs.writeFileSync(outFile, JSON.stringify(data, null, 2), 'utf8');
  console.log('Saved:', outFile);

  await browser.close();
})();
