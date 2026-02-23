/**
 * Diagnose why hero-video link label shows "More" instead of Author value.
 * Parses a saved HTML file (AEM page source before or as delivered) and reports
 * what readBlockConfig and the block would see for linkUrl/linkLabel.
 *
 * Usage:
 *   1. In browser: open AEM page → DevTools → Network → reload → select the
 *      document request (HTML) → Right-click → Copy response / Save to file.
 *   2. Save as e.g. aem-page.html
 *   3. node scripts/debug-hero-video-from-html.cjs aem-page.html
 *
 * No changes to hero-video.js or deploy needed.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function toClassName(name) {
  return typeof name === 'string'
    ? name
      .toLowerCase()
      .replace(/[^0-9a-z]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    : '';
}

function readBlockConfig(block) {
  const config = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    if (row.children && row.children.length >= 2) {
      const cols = [...row.children];
      const col = cols[1];
      const name = toClassName(cols[0].textContent);
      let value = '';
      if (col.querySelector('a')) {
        const as = [...col.querySelectorAll('a')];
        value = as.length === 1 ? as[0].href : as.map((a) => a.href);
      } else if (col.querySelector('img')) {
        const imgs = [...col.querySelectorAll('img')];
        value = imgs.length === 1 ? imgs[0].src : imgs.map((img) => img.src);
      } else if (col.querySelector('p')) {
        const ps = [...col.querySelectorAll('p')];
        value = ps.length === 1 ? ps[0].textContent : ps.map((p) => p.textContent);
      } else {
        value = row.children[1].textContent;
      }
      config[name] = value;
    }
  });
  return config;
}

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.error('Usage: node scripts/debug-hero-video-from-html.cjs <path-to-saved-page.html>');
  process.exit(1);
}
const fullPath = path.isAbsolute(htmlPath) ? htmlPath : path.join(process.cwd(), htmlPath);
if (!fs.existsSync(fullPath)) {
  console.error('File not found:', fullPath);
  process.exit(1);
}

const html = fs.readFileSync(fullPath, 'utf8');
const dom = new JSDOM(html);
const doc = dom.window.document;

const block = doc.querySelector('.hero-video');
if (!block) {
  console.error('No .hero-video block found in the HTML. Ensure the saved HTML contains the block.');
  process.exit(1);
}

const config = readBlockConfig(block);
const rows = [...block.querySelectorAll(':scope > div')].filter((r) => r.children.length > 0);

const first = (v) => (Array.isArray(v) ? v[0] : v);
const toSingleUrl = (v) => (Array.isArray(v) ? v[0] || '' : typeof v === 'string' ? v : '');
let linkUrl = toSingleUrl(config.link) || toSingleUrl(config['link-url']);
let linkLabel = first(config.linkLabel) || first(config['link-label']) || first(config.linklabel) || '';

function getVal(row, preferLink) {
  const col = row.querySelector('div:last-child') || row.children[row.children.length - 1];
  if (!col) return '';
  if (preferLink) {
    const a = col.querySelector('a[href]');
    if (a?.href) return a.href.trim();
  }
  return (col.textContent || '').trim();
}
if (!linkUrl && rows[2]) linkUrl = getVal(rows[2], true);
if (!linkLabel && rows[3]) linkLabel = getVal(rows[3], false) || (rows[3].textContent || '').trim();

console.log('=== hero-video diagnostic (from saved HTML) ===\n');

console.log('1) readBlockConfig(block) keys and values:');
Object.keys(config).forEach((k) => {
  const v = config[k];
  const str = Array.isArray(v) ? v.join(', ') : String(v);
  const preview = str.length > 80 ? str.slice(0, 77) + '...' : str;
  console.log(`   config["${k}"] = ${JSON.stringify(preview)}`);
});

console.log('\n2) Rows (block > div) — what would be used for rows[2]=linkUrl, rows[3]=linkLabel:');
rows.forEach((row, i) => {
  const col0 = row.children[0];
  const col1 = row.children[1];
  const header = col0 ? col0.textContent.trim() : '(no col0)';
  let value = '';
  if (col1) {
    if (col1.querySelector('a')) value = col1.querySelector('a').href || '(link)';
    else if (col1.querySelector('img')) value = col1.querySelector('img').src || '(img)';
    else value = (col1.textContent || '').trim();
  }
  const preview = value.length > 60 ? value.slice(0, 57) + '...' : value;
  const note = i === 2 ? ' → linkUrl' : i === 3 ? ' → linkLabel' : '';
  console.log(`   rows[${i}] header="${header}" value="${preview}"${note}`);
});

console.log('\n3) Derived values (what hero-video.js would use):');
console.log(`   linkUrl  = ${JSON.stringify(linkUrl || '(empty)')}`);
console.log(`   linkLabel = ${JSON.stringify(linkLabel || '(empty)')}`);
if (!linkLabel && linkUrl) {
  console.log('   → Because linkLabel is empty, the UI falls back to "More".');
}

console.log('\n4) Why linkLabel might be empty:');
if (config['link-label'] !== undefined && config['link-label'] !== '') {
  console.log('   config["link-label"] is set; linkLabel should not be empty (check rows[3] override).');
} else if (rows[3] && (rows[3].textContent || '').trim()) {
  console.log('   rows[3] has text; linkLabel should have been set from row fallback.');
} else if (rows.length < 4) {
  console.log('   Fewer than 4 rows: no row for Link label.');
} else {
  console.log('   Either config["link-label"] is missing/empty and rows[3] is empty or not used.');
  if (rows[3]) {
    const raw = rows[3].innerHTML || '';
    console.log(`   rows[3].innerHTML length = ${raw.length}; .textContent = ${JSON.stringify((rows[3].textContent || '').trim())}`);
  }
}
console.log('');
