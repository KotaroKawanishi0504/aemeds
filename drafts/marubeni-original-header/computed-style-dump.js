/**
 * 本家 https://www.marubeni.com/jp/ でドロップダウンを開いた状態で、
 * ブラウザの DevTools コンソールに貼り付けて実行すると、
 * 主要ノードの getComputedStyle を JSON でダンプします。
 * 結果をコピーして EDS の数値合わせに利用してください。
 *
 * 手順:
 * 1. 本家サイトを開く（デスクトップ幅 900px 以上推奨）
 * 2. 任意のナビ（例: 会社情報）にホバーしてドロップダウンを表示
 * 3. F12 → Console にこのスクリプト全体を貼り付けて Enter
 * 4. 出力をコピーして computed-styles.json 等に保存
 */
(function () {
  const host = document.querySelector('marubeni-header');
  if (!host || !host.shadowRoot) {
    console.warn('marubeni-header or shadowRoot not found.');
    return;
  }
  const root = host.shadowRoot;
  const props = [
    'font-size', 'line-height', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'padding-block', 'padding-inline', 'margin-top', 'margin-bottom', 'gap', 'column-gap',
    'width', 'min-width', 'max-width', 'height', 'block-size',
    'color', 'background-color', 'border-top', 'border-top-width', 'border-top-color',
    'grid-template-columns', 'grid-area', 'display', 'position', 'top', 'left'
  ];
  const pick = (el, label) => {
    if (!el) return null;
    const s = window.getComputedStyle(el);
    const o = { _selector: label, _tag: el.tagName, _class: el.className };
    props.forEach(p => { try { o[p] = s.getPropertyValue(p.replace(/([A-Z])/g, '-$1').toLowerCase()); } catch (e) {} });
    return o;
  };
  const dropdown = root.querySelector('.l-header__dropdown-content');
  const header = root.querySelector('.l-header__dropdown-header');
  const list = root.querySelector('.l-header__dropdown-list');
  const ul = root.querySelector('.l-header__dropdown-list .c-underline-list');
  const firstInner = root.querySelector('.l-header__dropdown-list .c-underline-list__inner');
  const firstLink = root.querySelector('.l-header__dropdown-list .c-underline-list__link');
  const out = {
    viewport: { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight },
    cssVars: {
      '--rem': getComputedStyle(host).getPropertyValue('--rem').trim(),
      '--vw': getComputedStyle(document.documentElement).getPropertyValue('--vw').trim()
    },
    nodes: {
      dropdownContent: pick(dropdown, '.l-header__dropdown-content'),
      dropdownHeader: pick(header, '.l-header__dropdown-header'),
      dropdownList: pick(list, '.l-header__dropdown-list'),
      underlineList: pick(ul, '.c-underline-list'),
      underlineInner: pick(firstInner, '.c-underline-list__inner'),
      underlineLink: pick(firstLink, '.c-underline-list__link')
    }
  };
  console.log(JSON.stringify(out, null, 2));
  return out;
})();
