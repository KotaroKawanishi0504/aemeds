/**
 * inspection JSON（AEM またはオリジナル）を読み、diagnostic があれば詳細分析、
 * なければ header の fontSize などから分かる範囲でレポートを出力する。
 *
 * 使用: node scripts/analyze-inspection-diagnostic.cjs [docs/inspection-aem.json]
 * 注意: aemeds ディレクトリで実行してください。（cd aemeds のうえで実行）
 * 出力: コンソール + docs/INSPECTION_AEM_ANALYSIS_RESULT.md（AEM の JSON の場合）
 */

const fs = require('fs');
const path = require('path');

const inp = process.argv[2] || 'docs/inspection-aem.json';
const jsonPath = path.resolve(process.cwd(), inp);
const isAem = /inspection-aem|aem\.json/i.test(inp);

if (!fs.existsSync(jsonPath)) {
  console.error('File not found:', jsonPath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const lines = [];

function collectFontSizes(node, out, depth = 0) {
  if (!node || depth > 15) return;
  if (node.style && node.style.fontSize) out.push({ depth, fontSize: node.style.fontSize, class: node.class || node._class || '' });
  (node.children || []).forEach((c) => collectFontSizes(c, out, depth + 1));
}

// ---- 共通: URL / viewport
lines.push('# Inspection 分析レポート');
lines.push('');
lines.push('## 基本情報');
lines.push('');
lines.push(`| 項目 | 値 |`);
lines.push(`|------|-----|`);
lines.push(`| URL | ${data.url || '(なし)'} |`);
lines.push(`| viewport | ${data.viewport ? `${data.viewport.width} x ${data.viewport.height}` : '(なし)'} |`);
lines.push('');

if (data.diagnostic) {
  const d = data.diagnostic;
  lines.push('## Diagnostic（診断情報）');
  lines.push('');
  lines.push('| 項目 | 値 |');
  lines.push('|------|-----|');
  lines.push(`| codeBasePath | ${d.codeBasePath ?? '(空)'} |`);
  lines.push(`| :root --rem | ${d.rem ?? '(未設定)'} |`);
  lines.push(`| main あり | ${d.hasMain ? 'はい' : 'いいえ'} |`);
  lines.push(`| header block status | ${d.headerBlockStatus ?? '(なし)'} |`);
  lines.push(`| .cards-wrapper 数 | ${d.cardsWrapperCount ?? '-'} |`);
  lines.push(`| marubeni-theme.css 読み込み | ${d.linkMarubeniTheme ? '**あり**' : '**なし**'} |`);
  lines.push(`| header.css 読み込み | ${d.linkHeaderCss ? '**あり**' : '**なし**'} |`);
  lines.push(`| cards.css 読み込み | ${d.linkCardsCss ? '**あり**' : '**なし**'} |`);
  lines.push('');
  lines.push('### 読み込まれているスタイルシート');
  lines.push('');
  (d.styleSheets || []).forEach((href) => lines.push(`- ${href}`));
  lines.push('');

  if (d.globalTextScale != null || d.bodyFontSizeM != null || (d.computed && Object.keys(d.computed).length)) {
    lines.push('### テキストスケール（幅連動）');
    lines.push('');
    lines.push('| 項目 | 値 |');
    lines.push('|------|-----|');
    if (d.globalTextScale != null) lines.push(`| :root --global-text-scale | ${d.globalTextScale} |`);
    if (d.bodyFontSizeM != null) lines.push(`| :root --body-font-size-m | ${d.bodyFontSizeM} |`);
    if (d.headingFontSizeXl != null) lines.push(`| :root --heading-font-size-xl | ${d.headingFontSizeXl} |`);
    if (data.viewport) lines.push(`| viewport width | ${data.viewport.width}px |`);
    if (d.computed) {
      if (d.computed.body) lines.push(`| computed body font-size | ${d.computed.body} |`);
      if (d.computed.headerNav) lines.push(`| computed header nav a | ${d.computed.headerNav} |`);
      if (d.computed.cardsCardBody) lines.push(`| computed .cards-card-body | ${d.computed.cardsCardBody} |`);
      if (d.computed.cardsCarouselTitle) lines.push(`| computed .cards-carousel-title | ${d.computed.cardsCarouselTitle} |`);
    }
    lines.push('');
    const vw = data.viewport && data.viewport.width;
    if (vw != null && vw >= 900 && !d.globalTextScale) {
      lines.push('※ viewport 900px 以上で --global-text-scale が未設定の場合は、marubeni-theme.css の @media (width >= 900px) が効いていない可能性があります。');
      lines.push('');
    }
  }

  // 判定（AEM のときのみ）
  if (isAem) {
  lines.push('## 判定');
  lines.push('');
  const issues = [];
  if (!d.linkMarubeniTheme) issues.push('**marubeni-theme.css が読み込まれていません** → head.html がプレビューに反映されていない、または Code Sync のずれが考えられます。');
  if (!d.linkHeaderCss) issues.push('**header.css が読み込まれていません** → loadBlock("header") が動いていない、または codeBasePath による URL が 404 の可能性があります。');
  if (!d.linkCardsCss && (d.cardsWrapperCount || 0) > 0) issues.push('**cards.css が読み込まれていません** → loadBlock("cards") が動いていない、または codeBasePath による URL が 404 の可能性があります。');
  if (!d.codeBasePath || d.codeBasePath === '') issues.push('**codeBasePath が空** → ブロック CSS の URL が正しく組めていません。script[src$="/scripts/scripts.js"] の読み込み元を確認してください。');
  if (!d.rem || d.rem === '(not set)' || d.rem === '') issues.push('**:root --rem が未設定** → marubeni-theme.css が読まれていないか、:root のルールが適用されていません。');

  if (issues.length) {
    lines.push('以下の問題が検出されました:');
    lines.push('');
    issues.forEach((i) => lines.push(`- ${i}`));
  } else {
    lines.push('必要な CSS は読み込まれており、codeBasePath も設定されています。別要因（詳細度・読み込み順の上書きなど）を確認してください。');
  }
  lines.push('');
  }
} else {
  lines.push('## Diagnostic について');
  lines.push('');
  lines.push('**この JSON には diagnostic が含まれていません。**');
  lines.push('');
  lines.push('診断情報（styleSheets, codeBasePath, --rem, 各 CSS の読み込み有無）を得るには、検査スクリプトを**診断付きの最新版**で再実行してください:');
  lines.push('');
  lines.push('```');
  lines.push('node scripts/inspect-header-launch.cjs "https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni/jp/cards.html" docs/inspection-aem.json');
  lines.push('```');
  lines.push('');
  lines.push('ログイン後、ページ表示で Enter を押すと、保存される JSON に `diagnostic` が含まれます。');
  lines.push('');
}

// ---- cardsSample
if (data.cardsSample) {
  lines.push('## カード（1件サンプル）');
  lines.push('');
  lines.push('| 要素 | プロパティ | 値 |');
  lines.push('|------|------------|-----|');
  const b = data.cardsSample.body;
  if (b) {
    lines.push(`| .cards-card-body | paddingLeft | ${b.paddingLeft || '-'} |`);
    lines.push(`| .cards-card-body | fontSize | ${b.fontSize || '-'} |`);
    lines.push(`| .cards-card-body | minHeight | ${b.minHeight || '-'} |`);
  }
  const icon = data.cardsSample.icon;
  if (icon) {
    lines.push(`| .cards-card-body-icon | width | ${icon.width || '-'} |`);
    lines.push(`| .cards-card-body-icon | height | ${icon.height || '-'} |`);
  }
  lines.push('');
}
// ---- header の fontSize 集計
const fontSizes = [];
if (data.header) collectFontSizes(data.header, fontSizes);
const unique = [...new Set(fontSizes.map((f) => f.fontSize))].sort();

lines.push('## ヘッダーまわりの computed fontSize');
lines.push('');
lines.push('| 出現した fontSize |');
lines.push('|------------------|');
unique.forEach((s) => lines.push(`| ${s} |`));
lines.push('');

if (isAem) {
  if (unique.length === 1 && unique[0] === '18px') {
    lines.push('→ **18px のみ** = body の `--body-font-size-m: 18px` を継承しています。header.css の `calc(var(--rem)*1.5*1px)`（15px 想定）が効いておらず、**テーマまたは header.css が適用されていません。**');
  } else if (unique.includes('15px')) {
    lines.push('→ **15px が含まれる** = ナビリンク等に header.css の `calc(var(--rem)*1.5*1px)` が効いている可能性があります。18px は body 継承、20px/24px はドロップダウン・ロゴ等の別指定です。');
  } else {
    lines.push('→ 複数の fontSize が混在しています。diagnostic で styleSheets を確認すると、テーマ・header.css の読み込み有無を確定できます。');
  }
  lines.push('');
}

const out = lines.join('\n');
console.log(out);

if (isAem) {
  const outPath = path.resolve(process.cwd(), 'docs/INSPECTION_AEM_ANALYSIS_RESULT.md');
  fs.writeFileSync(outPath, out, 'utf8');
  console.log('\n---\nWritten:', outPath);
}
