#!/usr/bin/env node
/**
 * Compare Cards block: capture reference (Marubeni TOP) vs AEM preview, optionally produce diff.
 * Output: drafts/tmp/screenshot-compare/reference-cards.png, aem-cards.png, [diff.png]
 *
 * Prerequisites:
 *   npm run preview:import  (or serve on port 3001) so AEM preview is available.
 *   npm install playwright
 *   npx playwright install chromium
 *
 * Run from aemeds root: node scripts/compare-cards-screenshots.js [--list] [--diff] [--preview-url URL]
 *   --list       Clip the full card list instead of the first card only (both reference and AEM).
 *   --diff       Generate diff.png with pixelmatch (requires pixelmatch + pngjs).
 *   --preview-url  Override AEM preview URL (default: http://localhost:3001/drafts/jp/preview.html).
 */

const path = require('path');
const fs = require('fs');

const VIEWPORT = { width: 1280, height: 800 };
const REFERENCE_URL = 'https://www.marubeni.com/jp/';
const DEFAULT_PREVIEW_URL = 'http://localhost:3001/drafts/jp/preview.html';

const REFERENCE_SELECTOR_FIRST = '.p-home__about ul.c-card-list li.c-card-list__item:first-child';
const REFERENCE_SELECTOR_LIST = '.p-home__about ul.c-card-list';
const AEM_SELECTOR_FIRST = '.cards > ul > li'; // first card (decorated: ul/li; fallback for static: .cards > div)
const AEM_SELECTOR_BLOCK = '.cards > ul, .cards';

function parseArgs() {
  const args = process.argv.slice(2);
  let list = false;
  let diff = false;
  let previewUrl = process.env.PREVIEW_URL || DEFAULT_PREVIEW_URL;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--list') list = true;
    else if (args[i] === '--diff') diff = true;
    else if (args[i] === '--preview-url' && args[i + 1]) {
      previewUrl = args[i + 1];
      i += 1;
    }
  }
  return { list, diff, previewUrl };
}

async function main() {
  const { list, diff, previewUrl } = parseArgs();

  // eslint-disable-next-line global-require, import/no-unresolved
  const { chromium } = require('playwright');

  const outDir = path.resolve(__dirname, '..', 'drafts', 'tmp', 'screenshot-compare');
  fs.mkdirSync(outDir, { recursive: true });

  const refSelector = list ? REFERENCE_SELECTOR_LIST : REFERENCE_SELECTOR_FIRST;
  const aemSelector = list ? AEM_SELECTOR_BLOCK : AEM_SELECTOR_FIRST;

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewportSize: VIEWPORT });
    const page = await context.newPage();

    // Reference: Marubeni TOP
    await page.goto(REFERENCE_URL, { waitUntil: 'networkidle' });
    const refEl = page.locator(refSelector).first();
    await refEl.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await refEl.scrollIntoViewIfNeeded();
    const refBox = await refEl.boundingBox();
    if (!refBox) {
      throw new Error(`Reference selector not found or not visible: ${refSelector}`);
    }
    const refPath = path.join(outDir, 'reference-cards.png');
    await page.screenshot({ path: refPath, clip: refBox });
    console.log('Saved:', refPath);

    // AEM preview
    await page.goto(previewUrl, { waitUntil: 'networkidle' });
    const aemEl = page.locator(aemSelector).first();
    await aemEl.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await aemEl.scrollIntoViewIfNeeded();
    const aemBox = await aemEl.boundingBox();
    if (!aemBox) {
      throw new Error(`AEM selector not found or not visible: ${aemSelector}. Is preview running? (npm run preview:import)`);
    }
    const aemPath = path.join(outDir, 'aem-cards.png');
    await page.screenshot({ path: aemPath, clip: aemBox });
    console.log('Saved:', aemPath);

    if (diff) {
      try {
        const pixelmatch = require('pixelmatch');
        const { PNG } = require('pngjs');
        const imgRef = PNG.sync.read(fs.readFileSync(refPath));
        const imgAem = PNG.sync.read(fs.readFileSync(aemPath));
        if (imgRef.width !== imgAem.width || imgRef.height !== imgAem.height) {
          console.warn('Skipping diff: image dimensions differ (ref %dx%d vs aem %dx%d). Use --list for same-area comparison.', imgRef.width, imgRef.height, imgAem.width, imgAem.height);
        } else {
          const diffImg = new PNG({ width: imgRef.width, height: imgRef.height });
          const numDiff = pixelmatch(imgRef.data, imgAem.data, diffImg.data, imgRef.width, imgRef.height, {
            threshold: 0.1,
            includeAA: false,
          });
          const diffPath = path.join(outDir, 'diff.png');
          fs.writeFileSync(diffPath, PNG.sync.write(diffImg));
          console.log('Saved:', diffPath, `(${numDiff} differing pixels)`);
          if (numDiff > 0) process.exitCode = 1;
        }
      } catch (e) {
        console.warn('Skipping diff (install pixelmatch and pngjs for --diff):', e.message);
      }
    }

    console.log('Output directory:', outDir);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
