#!/usr/bin/env node
/**
 * Collect layout data from live Marubeni TOP for faithful replication.
 * Output: drafts/tmp/layout-collect-marubeni.json and .md
 *
 * Run from aemeds root: node scripts/collect-marubeni-layout.js
 * Requires: npx playwright install chromium (if not already).
 */

const path = require('path');
const fs = require('fs');

const URL = 'https://www.marubeni.com/jp/';
const CARD_LIST_SELECTOR = '.p-home__about ul.c-card-list';

const VIEWPORTS = [
  { width: 1920, height: 1080, label: 'desktop' },
  { width: 1280, height: 800, label: 'laptop' },
  { width: 900, height: 800, label: 'breakpoint_900' },
  { width: 899, height: 800, label: 'below_900' },
  { width: 600, height: 900, label: 'breakpoint_600' },
  { width: 375, height: 812, label: 'mobile' },
];

function pickStyles(computed) {
  return {
    width: computed.width,
    maxWidth: computed.maxWidth,
    paddingLeft: computed.paddingLeft,
    paddingRight: computed.paddingRight,
    paddingTop: computed.paddingTop,
    paddingBottom: computed.paddingBottom,
    marginLeft: computed.marginLeft,
    marginRight: computed.marginRight,
    marginTop: computed.marginTop,
    marginBottom: computed.marginBottom,
    gap: computed.gap,
    columnGap: computed.columnGap,
    rowGap: computed.rowGap,
    display: computed.display,
    gridTemplateColumns: computed.gridTemplateColumns,
    boxSizing: computed.boxSizing,
  };
}

function pickRect(rect) {
  return {
    width: rect.width,
    height: rect.height,
    top: rect.top,
    left: rect.left,
  };
}

async function collectAtViewport(page, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.waitForTimeout(500);

  const data = await page.evaluate((selector) => {
    const ul = document.querySelector(selector);
    if (!ul) return { error: `Selector not found: ${selector}` };

    const firstLi = ul.querySelector('li');
    const getStyles = (el) => {
      const s = window.getComputedStyle(el);
      return {
        width: s.width,
        maxWidth: s.maxWidth,
        paddingLeft: s.paddingLeft,
        paddingRight: s.paddingRight,
        paddingTop: s.paddingTop,
        paddingBottom: s.paddingBottom,
        marginLeft: s.marginLeft,
        marginRight: s.marginRight,
        marginTop: s.marginTop,
        marginBottom: s.marginBottom,
        gap: s.gap,
        columnGap: s.columnGap,
        rowGap: s.rowGap,
        display: s.display,
        gridTemplateColumns: s.gridTemplateColumns,
        boxSizing: s.boxSizing,
      };
    };
    const getRect = (el) => {
      const r = el.getBoundingClientRect();
      return { width: r.width, height: r.height, top: r.top, left: r.left };
    };

    const listStyles = getStyles(ul);
    const listRect = getRect(ul);
    const liCount = ul.children.length;
    const liStyles = firstLi ? getStyles(firstLi) : null;
    const liRect = firstLi ? getRect(firstLi) : null;

    // Ancestors: from ul parent up to body (max 15 levels)
    const ancestors = [];
    let node = ul.parentElement;
    let level = 0;
    while (node && node !== document.body && level < 15) {
      const s = window.getComputedStyle(node);
      const r = node.getBoundingClientRect();
      ancestors.push({
        tag: node.tagName.toLowerCase(),
        class: node.className || '',
        id: node.id || '',
        styles: {
          width: s.width,
          maxWidth: s.maxWidth,
          paddingLeft: s.paddingLeft,
          paddingRight: s.paddingRight,
          marginLeft: s.marginLeft,
          marginRight: s.marginRight,
          boxSizing: s.boxSizing,
        },
        rect: { width: r.width, height: r.height, left: r.left },
      });
      node = node.parentElement;
      level += 1;
    }

    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      cardList: {
        styles: listStyles,
        rect: listRect,
        childCount: liCount,
      },
      firstCard: firstLi ? { styles: liStyles, rect: liRect } : null,
      ancestors,
    };
  }, CARD_LIST_SELECTOR);

  return { viewport: viewport.label, viewportSize: { width: viewport.width, height: viewport.height }, ...data };
}

async function main() {
  const { chromium } = require('playwright');
  const outDir = path.resolve(__dirname, '..', 'drafts', 'tmp');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const results = { url: URL, selector: CARD_LIST_SELECTOR, collectedAt: new Date().toISOString(), viewports: [] };

  try {
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    const list = page.locator(CARD_LIST_SELECTOR);
    await list.first().waitFor({ state: 'visible', timeout: 10000 });
    await list.first().scrollIntoViewIfNeeded();

    for (const vp of VIEWPORTS) {
      const data = await collectAtViewport(page, vp);
      results.viewports.push(data);
      if (data.error) console.warn(`[${vp.label}] ${data.error}`);
      else console.log(`[${vp.label}] ul.width=${data.cardList?.styles?.width} gap=${data.cardList?.styles?.gap} li.width=${data.firstCard?.styles?.width}`);
    }
  } finally {
    await browser.close();
  }

  const jsonPath = path.join(outDir, 'layout-collect-marubeni.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');
  console.log('Saved:', jsonPath);

  // Summary markdown
  const md = buildMarkdown(results);
  const mdPath = path.join(outDir, 'layout-collect-marubeni.md');
  fs.writeFileSync(mdPath, md, 'utf8');
  console.log('Saved:', mdPath);

  return results;
}

function val(x) {
  return x != null ? x : '-';
}

function buildMarkdown(results) {
  const lines = [
    '# Marubeni TOP レイアウト計測結果',
    '',
    '- **URL:** ' + results.url,
    '- **セレクタ:** ' + results.selector,
    '- **取得日時:** ' + results.collectedAt,
    '',
    '## デスクトップ (1920px) 要約',
    '',
  ];
  const desktop = results.viewports.find((v) => v.viewport === 'desktop');
  if (desktop && desktop.cardList) {
    const c = desktop.cardList;
    const li = desktop.firstCard;
    lines.push('| 項目 | 値 |');
    lines.push('|------|-----|');
    lines.push('| ul width (computed) | ' + val(c.styles && c.styles.width) + ' |');
    lines.push('| ul gap | ' + val(c.styles && c.styles.gap) + ' |');
    lines.push('| ul column-gap | ' + val(c.styles && c.styles.columnGap) + ' |');
    lines.push('| ul row-gap | ' + val(c.styles && c.styles.rowGap) + ' |');
    lines.push('| ul margin-top | ' + val(c.styles && c.styles.marginTop) + ' |');
    lines.push('| li width (computed) | ' + val(li && li.styles && li.styles.width) + ' |');
    lines.push('| カード数 | ' + val(c.childCount) + ' |');
    lines.push('');
    lines.push('### 祖先要素 (コンテンツ幅・余白の特定用)');
    lines.push('');
    lines.push('| レベル | tag | class | width | max-width | padding-left | padding-right |');
    lines.push('|--------|------|-------|--------|-----------|--------------|---------------|');
    (desktop.ancestors || []).forEach((a, i) => {
      const s = a.styles || {};
      lines.push('| ' + (i + 1) + ' | ' + a.tag + ' | ' + (a.class || '').slice(0, 40) + ' | ' + val(s.width) + ' | ' + val(s.maxWidth) + ' | ' + val(s.paddingLeft) + ' | ' + val(s.paddingRight) + ' |');
    });
  }
  lines.push('');
  lines.push('## 全ビューポート');
  lines.push('');
  lines.push('| viewport | ul.width | gap | li.width |');
  lines.push('|----------|----------|-----|----------|');
  results.viewports.forEach((v) => {
    if (v.error) {
      lines.push('| ' + v.viewport + ' | - | ' + v.error + ' |');
      return;
    }
    const c = v.cardList;
    const li = v.firstCard;
    lines.push('| ' + v.viewport + ' | ' + val(c && c.styles && c.styles.width) + ' | ' + val(c && c.styles && c.styles.gap) + ' | ' + val(li && li.styles && li.styles.width) + ' |');
  });
  lines.push('');
  return lines.join('\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
