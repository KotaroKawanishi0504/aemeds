/**
 * Test hero-video against AEM fixture HTML (actual DOM structure).
 * Run: npm run test:hero-video:aem
 * Use for fix→test loop without deploying to AEM.
 */
/* eslint-disable import/no-extraneous-dependencies, no-console, max-len */

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(dirname, '..', 'test', 'fixtures', 'hero-video');

async function runFixture(name, expectedLabel) {
  const htmlPath = path.join(fixturesDir, `${name}.html`);
  if (!fs.existsSync(htmlPath)) {
    console.error(`Fixture not found: ${htmlPath}`);
    process.exit(1);
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const fixtureDom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`, { url: 'http://localhost' });
  global.window = fixtureDom.window;
  global.document = fixtureDom.window.document;
  if (!global.window.hlx) global.window.hlx = { codeBasePath: '/' };
  const block = fixtureDom.window.document.querySelector('.hero-video');
  if (!block) {
    console.error(`No .hero-video in fixture ${name}`);
    process.exit(1);
  }
  const { default: decorate } = await import('../blocks/hero-video/hero-video.js');
  await decorate(block);
  const link = block.querySelector('.hero-video-link');
  const labelEl = link ? link.querySelector('.hero-video-link-label') : null;
  const actualLabel = labelEl ? labelEl.textContent.trim() : '';
  if (actualLabel !== expectedLabel) {
    console.error(`FAIL ${name}: expected label "${expectedLabel}", got "${actualLabel}"`);
    process.exit(1);
  }
  console.log(`PASS ${name}: label="${actualLabel}"`);
}

async function run() {
  await runFixture('aem-actual', 'More');
  await runFixture('aem-with-label', '#44 | SmartestEnergy');
  await runFixture('aem-with-label-split-pipe', '#44 | SmartestEnergy');
  console.log('All AEM fixture tests passed.');
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
