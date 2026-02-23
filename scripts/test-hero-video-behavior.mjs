/**
 * Behavioral test: run hero-video decorate() with a mock block (table structure)
 * and assert the link overlay is created.
 * - Case 1: row headers "Link URL" / "Link label" (AEM → config['link-url'], config['link-label']).
 * - Case 2: row headers "link" / "linkLabel" (field names → config.link, config.linklabel).
 * If the link still does not show in AEM, the block HTML may not have these rows when delivered.
 * Run: npm run test:hero-video
 */
/* eslint-disable import/no-extraneous-dependencies, no-console, max-len -- test script */

import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost' });
global.window = dom.window;
global.document = dom.window.document;
if (!global.window.hlx) global.window.hlx = { codeBasePath: '/' };

async function run() {
  const { default: decorate } = await import('../blocks/hero-video/hero-video.js');
  const doc = dom.window.document;

  function makeRow(label, valueHtml) {
    const row = doc.createElement('div');
    const col0 = doc.createElement('div');
    col0.textContent = label;
    const col1 = doc.createElement('div');
    col1.innerHTML = valueHtml;
    row.appendChild(col0);
    row.appendChild(col1);
    return row;
  }

  const block = doc.createElement('div');
  block.className = 'hero-video';
  block.appendChild(makeRow('Video (900px+)', '<a href="https://example.com/video.mp4">video.mp4</a>'));
  block.appendChild(makeRow('Poster image (<900px)', '<img src="https://example.com/poster.jpg" alt="">'));
  block.appendChild(makeRow('Link URL', '<a href="https://www.marubeni.com/jp/brand_media/scope/smartestenergy2/">'));
  block.appendChild(makeRow('Link label', '#44 | SmartestEnergy'));
  doc.body.appendChild(block);

  await decorate(block);

  let link = block.querySelector('.hero-video-link');
  let labelEl = block && link ? link.querySelector('.hero-video-link-label') : null;
  if (!link) {
    console.error('FAIL (label-based): .hero-video-link not found (rows: Link URL, Link label)');
    process.exit(1);
  }
  if (link.getAttribute('href') !== 'https://www.marubeni.com/jp/brand_media/scope/smartestenergy2/') {
    console.error('FAIL: .hero-video-link href mismatch:', link.getAttribute('href'));
    process.exit(1);
  }
  if (!labelEl || !labelEl.textContent.includes('SmartestEnergy')) {
    console.error('FAIL: .hero-video-link-label missing or wrong text:', labelEl?.textContent);
    process.exit(1);
  }
  console.log('Case 1 passed: rows "Link URL" / "Link label" → link created.');

  // Case 2: AEM may use field names as row headers (link, linkLabel → toClassName: link, linklabel)
  const block2 = doc.createElement('div');
  block2.className = 'hero-video';
  block2.appendChild(makeRow('Video (900px+)', '<a href="https://example.com/v.mp4">v.mp4</a>'));
  block2.appendChild(makeRow('Poster image (<900px)', '<img src="https://example.com/p.jpg" alt="">'));
  block2.appendChild(makeRow('link', 'https://example.com/page'));
  block2.appendChild(makeRow('linkLabel', 'Test Label'));
  doc.body.appendChild(block2);
  await decorate(block2);
  link = block2.querySelector('.hero-video-link');
  labelEl = link ? link.querySelector('.hero-video-link-label') : null;
  if (!link) {
    console.error('FAIL (name-based): .hero-video-link not found (rows: link, linkLabel)');
    process.exit(1);
  }
  if (link.getAttribute('href') !== 'https://example.com/page') {
    console.error('FAIL: block2 link href mismatch:', link.getAttribute('href'));
    process.exit(1);
  }
  if (!labelEl || labelEl.textContent.trim() !== 'Test Label') {
    console.error('FAIL: block2 label mismatch:', labelEl?.textContent);
    process.exit(1);
  }
  console.log('Case 2 passed: rows "link" / "linkLabel" → link created.');
  console.log('Behavioral test passed: both label-based and name-based config create .hero-video-link.');
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
