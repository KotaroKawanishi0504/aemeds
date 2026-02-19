/**
 * Extract header-related rules from common.min.css (single line).
 * Keeps rules whose selector contains any of: l-header, c-underline-list, f-search, f-input, u-visually-hidden, u-none-desktop.
 */
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, 'common.min.css'), 'utf8');
const keywords = ['l-header', 'header__', 'c-underline-list', 'f-search', 'f-input', 'u-visually-hidden', 'u-none-desktop'];

const out = [];
let depth = 0;
let start = 0;
let inRule = false;
let braceStart = -1;

for (let i = 0; i < css.length; i += 1) {
  const c = css[i];
  if (c === '{') {
    if (depth === 0) {
      braceStart = i;
      const selector = css.slice(start, i).trim();
      if (keywords.some((k) => selector.includes(k))) {
        inRule = true;
      }
    }
    depth += 1;
  } else if (c === '}') {
    depth -= 1;
    if (depth === 0) {
      if (inRule) {
        out.push(css.slice(start, i + 1));
        inRule = false;
      }
      start = i + 1;
    }
  }
}

const extracted = `/* Extracted from www.marubeni.com/common/stylesheets/common.min.css - header/nav/search/utility only */\n${out.join('\n')}`;
fs.writeFileSync(path.join(__dirname, 'header-extract.css'), extracted, 'utf8');
console.log('Extracted', out.length, 'rules to header-extract.css');
