/**
 * Hero-video link visibility test: verifies that hero-video.js reads all AEM config keys
 * so the overlay link is created when AEM sends "Link URL" / "Link label" (or field names).
 * Run: node scripts/test-hero-video-link.cjs
 * Exit 0 = pass, non-zero = fail.
 */

const fs = require('fs');
const path = require('path');

const blockPath = path.join(__dirname, '..', 'blocks', 'hero-video', 'hero-video.js');
const source = fs.readFileSync(blockPath, 'utf8');

const errors = [];

// linkUrl must read both config.link (sheet) and config['link-url'] (AEM label "Link URL")
if (!source.includes("config['link-url']") && !source.includes('config["link-url"]')) {
  errors.push('hero-video.js must read config["link-url"] for AEM Link URL (e.g. linkUrl = ... config["link-url"])');
}
if (!source.includes('config.link') && !source.includes('toSingleUrl(config.link)')) {
  errors.push('hero-video.js should read config.link for sheet/source compatibility');
}

// linkLabel must read config.linkLabel, config['link-label'], and config.linklabel (AEM field name → toClassName gives lowercase)
if (!source.includes("config['link-label']") && !source.includes('config["link-label"]')) {
  errors.push('hero-video.js must read config["link-label"] for AEM Link label');
}
if (!source.includes('config.linklabel')) {
  errors.push('hero-video.js must read config.linklabel (AEM field name "linkLabel" → toClassName gives "linklabel")');
}

if (errors.length > 0) {
  console.error('Hero-video link test FAILED:');
  errors.forEach((e) => console.error('  -', e));
  process.exit(1);
}

console.log('Hero-video link test passed: block reads link-url, link-label, linklabel.');
process.exit(0);
