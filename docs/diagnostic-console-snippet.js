/**
 * AEM プレビュー画面でスタイルが当たらない原因を切り分けるため、
 * プレビューを表示した状態でブラウザの Console に貼り付けて実行してください。
 * （iframe の場合は、プレビューが表示されている iframe 内の document で実行）
 *
 * 出力: 読み込み済み CSS 一覧、codeBasePath、--rem、該当 CSS の有無
 */
(function () {
  const doc = document;
  const sheets = Array.from(doc.styleSheets).map(s => s.href).filter(Boolean);
  const root = doc.documentElement;
  const rem = root ? getComputedStyle(root).getPropertyValue('--rem').trim() : '';
  const out = {
    codeBasePath: (window.hlx && window.hlx.codeBasePath) || '(empty or undefined)',
    hasMain: !!doc.querySelector('main'),
    styleSheets: sheets,
    hasMarubeniTheme: sheets.some(u => u && u.includes('marubeni-theme')),
    hasHeaderCss: sheets.some(u => u && (u.includes('header.css') || u.includes('blocks/header'))),
    hasCardsCss: sheets.some(u => u && (u.includes('cards.css') || u.includes('blocks/cards'))),
    rootRem: rem || '(not set)',
  };
  console.table(out);
  console.log('All styleSheets:', sheets);
  return out;
})();
