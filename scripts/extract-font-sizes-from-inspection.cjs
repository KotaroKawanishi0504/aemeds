/**
 * inspection JSON から全ノードの fontSize を収集し、フォントサイズ別に要素（tag/class）をまとめる。
 * 使用: node scripts/extract-font-sizes-from-inspection.cjs docs/inspection-original-900.json
 * 出力: コンソール + docs/ORIGINAL_FONT_SIZES_900.md（ファイル名に 900 が含まれる場合）
 */

const fs = require('fs');
const path = require('path');

const inp = process.argv[2] || 'docs/inspection-original-900.json';
const jsonPath = path.resolve(process.cwd(), inp);
const is900 = /900/i.test(inp);

if (!fs.existsSync(jsonPath)) {
  console.error('File not found:', jsonPath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

/** @type {Map<string, Array<{tag:string, class:string}>>} */
const bySize = new Map();

function walk(node, depth) {
  if (!node || depth > 25) return;
  const fsVal = node.style && node.style.fontSize;
  if (fsVal) {
    const tag = (node.tag || node._tag || '').toLowerCase();
    const cls = (node.class || node._class || '').trim().slice(0, 100);
    if (!bySize.has(fsVal)) bySize.set(fsVal, []);
    const arr = bySize.get(fsVal);
    const key = `${tag}.${cls}`;
    if (!arr.some((e) => e.tag === tag && e.class === cls)) arr.push({ tag, class: cls });
  }
  (node.children || []).forEach((c) => walk(c, depth + 1));
}

if (data.header) walk(data.header, 0);

// Sort by numeric px
const sortedSizes = [...bySize.keys()].sort((a, b) => {
  const na = parseFloat(a);
  const nb = parseFloat(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return String(a).localeCompare(String(b));
});

const lines = [];
lines.push('# オリジナルサイト（丸紅本家）フォントサイズ一覧（900px）');
lines.push('');
lines.push('ビューポート **900px**（モバイルブレーク直前）で取得した computed font-size を要素ごとに集計。');
lines.push(`取得元: \`${path.basename(inp)}\` (viewport ${data.viewport && data.viewport.width ? data.viewport.width + 'px' : '?'})`);
if (data.diagnostic && data.diagnostic.rem) {
  lines.push(`本家 :root --rem（900px 時）: \`${data.diagnostic.rem}\``);
  if (data.diagnostic.computed && data.diagnostic.computed.body) {
    lines.push(`computed body: ${data.diagnostic.computed.body}`);
  }
}
lines.push('');
lines.push('---');
lines.push('');
lines.push('## フォントサイズ別（出現要素）');
lines.push('');
lines.push('| フォントサイズ | 主な使用要素（tag / class） |');
lines.push('|----------------|----------------------------|');

sortedSizes.forEach((fontSize) => {
  const entries = bySize.get(fontSize);
  const examples = entries
    .slice(0, 8)
    .map((e) => (e.class ? `${e.tag}.${e.class}` : e.tag))
    .join('; ');
  const more = entries.length > 8 ? ` …他${entries.length - 8}件` : '';
  lines.push(`| ${fontSize} | ${examples}${more} |`);
});

lines.push('');
lines.push('---');
lines.push('');
lines.push('## サマリ（900px で使われている主なフォントサイズ）');
lines.push('');
const summary = sortedSizes.map((s) => s).join(', ');
lines.push(summary);
lines.push('');

const out = lines.join('\n');
console.log(out);

if (is900) {
  const outPath = path.resolve(process.cwd(), 'docs/ORIGINAL_FONT_SIZES_900.md');
  fs.writeFileSync(outPath, out, 'utf8');
  console.log('\n---\nWritten:', outPath);
}
