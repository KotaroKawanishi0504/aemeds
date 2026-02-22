/**
 * Dev モード調査用: ブラウザの Console に貼り付けて実行してください。
 * （AEM プレビューの iframe 内で見ている場合は、その iframe の document で実行）
 *
 * 出力:
 * - 読み込み済み CSS 一覧、codeBasePath、--rem / --global-text-scale
 * - 本文・見出し・ヘッダ・カードの computed font-size
 * - 幅を変えて再実行するとスケールの有無を確認できます
 *
 * 戻り値の diagnostic を inspection JSON の "diagnostic" にマージすると、
 * node scripts/analyze-inspection-diagnostic.cjs でテキストスケールもレポートされます。
 */
(function () {
  const doc = document;
  const root = doc.documentElement;
  const rootStyle = root ? getComputedStyle(root) : null;
  const sheets = Array.from(doc.styleSheets).map((s) => s.href).filter(Boolean);

  function getVar(name) {
    if (!rootStyle) return null;
    const v = rootStyle.getPropertyValue(name).trim();
    return v || null;
  }

  function getElFontSize(selector, desc) {
    const el = doc.querySelector(selector);
    if (!el) return null;
    return getComputedStyle(el).fontSize;
  }

  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const diagnostic = {
    codeBasePath: (window.hlx && window.hlx.codeBasePath) || null,
    hasMain: !!doc.querySelector('main'),
    styleSheets: sheets,
    hasMarubeniTheme: sheets.some((u) => u && u.includes('marubeni-theme')),
    hasHeaderCss: sheets.some((u) => u && (u.includes('header.css') || u.includes('blocks/header'))),
    hasCardsCss: sheets.some((u) => u && (u.includes('cards.css') || u.includes('blocks/cards'))),
    rem: getVar('--rem'),
    globalTextScale: getVar('--global-text-scale'),
    bodyFontSizeM: getVar('--body-font-size-m'),
    headingFontSizeXl: getVar('--heading-font-size-xl'),
    viewport,
    computed: {
      body: getElFontSize('body'),
      headerNav: getElFontSize('header nav a'),
      cardsCardBody: getElFontSize('.cards-card-body') || getElFontSize('.cards .cards-card-body'),
      cardsCarouselTitle: getElFontSize('.cards-carousel-title'),
    },
    headerBlockStatus: (() => {
      const el = doc.querySelector('header [data-block-status]');
      return (el && el.dataset && el.dataset.blockStatus) || null;
    })(),
    cardsWrapperCount: doc.querySelectorAll('.cards-wrapper').length,
    linkMarubeniTheme: sheets.some((u) => u && u.includes('marubeni-theme')),
    linkHeaderCss: sheets.some((u) => u && (u.includes('header.css') || u.includes('blocks/header'))),
    linkCardsCss: sheets.some((u) => u && (u.includes('cards.css') || u.includes('blocks/cards'))),
  };

  console.log('=== Dev 調査: テキストスケール・CSS 読み込み ===');
  console.log('viewport (width x height):', viewport.width, 'x', viewport.height);
  console.log('900px 以上で --global-text-scale が 0.65〜0.85 で変動する想定です。幅を変えて再実行すると確認できます。');
  console.table({
    '--rem': diagnostic.rem,
    '--global-text-scale': diagnostic.globalTextScale,
    '--body-font-size-m': diagnostic.bodyFontSizeM,
    '--heading-font-size-xl': diagnostic.headingFontSizeXl,
    marubeniTheme: diagnostic.hasMarubeniTheme,
    headerCss: diagnostic.hasHeaderCss,
    cardsCss: diagnostic.hasCardsCss,
  });
  console.log('computed font-size:', diagnostic.computed);
  console.log('styleSheets:', sheets);
  console.log('---');
  console.log('このオブジェクトを inspection JSON の diagnostic にマージする場合: copy(JSON.stringify(diagnostic, null, 2))');
  return diagnostic;
})();
