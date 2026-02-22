# AEM でヘッダー・カードのスタイルが直らない原因分析

## 概要

- **現象**: 同じウィンドウ幅で見たとき、AEM はオリジナルよりヘッダーのフォントが大きくメニューが見切れる。カードはアイコン円が大きく、テキストと重なる。
- **結論**: **テーマ／ブロック CSS が AEM のプレビュー document に読み込まれていない**（または 404）可能性が最も高い。修正した CSS が「届いていない」ため、見た目が変わらない。

---

## 1. 根拠（既存 inspection データ）

### 1.1 ヘッダー: 18px の正体

| 項目 | 値 |
|------|-----|
| **inspection-aem.json** (viewport 1536px) | header / nav および子要素の **computed fontSize がすべて 18px** |
| **当リポジトリの指定** | `header.css`: `header nav .nav-sections .default-content-wrapper > ul > li > a { font-size: calc(var(--rem, 10) * 1.5 * 1px); }` → **--rem=10 なら 15px** |
| **18px の由来** | `styles.css` の body 用 `--body-font-size-m: 18px`（メディア内）を**継承**した値と一致 |

→ ナビリンクに「15px を指定するルール」が効いておらず、body の 18px をそのまま継承している。  
→ **`marubeni-theme.css` の `--rem` または `header.css` の font-size のどちらか（または両方）が AEM で適用されていない。**

### 1.2 オリジナルとの比較（inspection-original-new.json）

- **本家**（viewport 1536px）:
  - body の **fontSize: 16px**
  - **--rem**: `min(10, 15.21 * 100 / 1280 * 10)`（computed 値・viewport 連動）
  - ナビは Shadow DOM 内のため、この JSON では本家ヘッダーの直接の fontSize は取得していない。
- **AEM**（既存 inspection-aem.json）: header/nav が **18px** = body 継承。
- 結論: AEM 側でテーマの viewport 連動（`--rem`）が効いておらず、かつナビ用 font-size 指定（header.css）も効いていない。

### 1.3 カード

- inspection-aem.json にはカードブロック配下の card-body / icon の computed 値は含まれていない。
- ヘッダーと同様に、**`marubeni-theme.css`（`--card-icon-size`, `--card-icon-gap`）や `blocks/cards/cards.css` が読まれていない**と、アイコンサイズ・余白の指定が効かず、「円が大きい」「テキストと重なる」となる。

---

## 2. CSS の読み込みフロー（当リポジトリ）

### 2.1 テーマ（marubeni-theme.css）

- **head.html** に `<link rel="stylesheet" href="/styles/marubeni-theme.css"/>` が記載されている。
- 初期 HTML の一部として読み込まれるため、**head がリポジトリの head.html になっていないと、このファイルは一切読まれない。**

### 2.2 ブロック CSS（header.css, cards.css）

- **head には含めず**、EDS 標準どおり **loadBlock() 実行時に動的に** `loadCSS(codeBasePath + '/blocks/{blockName}/{blockName}.css')` で読み込む。
- **codeBasePath** は `aem.js` の `setup()` で、`document.querySelector('script[src$="/scripts/scripts.js"]')` の `src` から `'/scripts/scripts.js'` より前のパスとして設定される。
- **ヘッダー**: `loadLazy()` で `loadHeader(doc.querySelector('header'))` が呼ばれ、`loadBlock(headerBlock)` により **header.css** が読み込まれる（`<header>` が存在すれば実行される）。
- **カード**: `main` がある場合は `loadSections(main)` → 各 section 内の block で `loadBlock`。**main が無い**場合は `loadOrphanBlocks(doc)` で `div.cards` を検出し `loadBlock` → **cards.css** が読み込まれる。
- いずれも **codeBasePath** が空や別パスだと、`/blocks/header/header.css` や `/blocks/cards/cards.css` の URL がずれ、**404** になり得る。

### 2.3 まとめ

| ファイル | 読み込み元 | AEM で読まれない主な要因 |
|----------|------------|---------------------------|
| styles.css | head.html | プレビュー用 HTML の head が head.html でない |
| marubeni-theme.css | head.html | 同上 |
| header.css | loadBlock('header') | codeBasePath のずれで 404、または loadHeader が動く前にエラー |
| cards.css | loadBlock('cards') | main が無いときに loadOrphanBlocks が動いていない、または codeBasePath で 404 |

---

## 3. 想定される原因（優先度順）

### 3.1 プレビュー用 HTML の head が head.html になっていない

- AEM Author のプレビューが、リポジトリの **head.html** を参照していない場合、`styles.css` と **marubeni-theme.css** が link されず、`--rem` やカード用変数が定義されない。
- その結果、body の 18px がそのまま継承され、ヘッダーが「大きく」見える。

### 3.2 codeBasePath が空または別パス

- スクリプトの読み込み元（AEM 側の URL）によっては、`script[src$="/scripts/scripts.js"]` の `src` から取り出した codeBasePath が空や別パスになる。
- その場合、`loadBlock` が要求する `codeBasePath + '/blocks/header/header.css'` 等が 404 になり、**header.css / cards.css が読み込まれない。**

### 3.3 main が無く、かつ loadOrphanBlocks の対象外

- AEM Author では **main が無い**ことがある。その場合、cards は **loadOrphanBlocks** で `div.cards` を探して loadBlock する。
- もし DOM 構造が `div.cards-wrapper > div > ...` のみで `div.cards` が無いなど、検出条件に合わないと、cards の loadBlock が一度も呼ばれず、**cards.css が読み込まれない。**

### 3.4 読み込み順・詳細度での上書き

- 上記が解消されていても、AEM の後続スタイル（例: `ib.lc-....min.css`）が同じプロパティを上書きしている可能性はある。ただし、**現状は「18px＝body 継承」なので、まずは「テーマ／ブロック CSS が読まれていない」を疑うのが妥当。**

---

## 4. 確認手順（AEM で実施）

### 4.1 検査スクリプトで診断情報を取得（推奨）

AEM の cards ページを表示した状態で、以下を実行する。

```powershell
cd aemeds
node scripts/inspect-header-launch.cjs "https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni/jp/cards.html" docs/inspection-aem.json
```

- ブラウザでログインし、ページ表示後に **Enter を押す**。
- 保存される `docs/inspection-aem.json` に **`diagnostic`** が含まれる（※既存の inspection-aem.json は診断追加前に取得したため `diagnostic` なし。AEM で再実行すると含まれる）：
  - `styleSheets`: 読み込まれている CSS の URL 一覧
  - `codeBasePath`: `window.hlx.codeBasePath` の値
  - `rem`: `:root` の `--rem`
  - `linkMarubeniTheme` / `linkHeaderCss` / `linkCardsCss`: 該当 CSS が styleSheets に含まれるか

**診断の見方:**

- `linkMarubeniTheme === false` → テーマが読まれていない（head の問題）。
- `linkHeaderCss === false` または `linkCardsCss === false` → ブロック CSS が読まれていない（codeBasePath または loadBlock の実行有無を確認）。
- `codeBasePath === ""` または `null` → ブロック CSS の URL が正しく組めていない。

### 4.2 ブラウザ Console で手動確認

AEM のプレビューを表示した **同じ document**（iframe の場合は iframe 内）で Console に貼り付けて実行する。

```javascript
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
```

- `hasMarubeniTheme` / `hasHeaderCss` / `hasCardsCss` が false なら、その CSS は読まれていない。
- Network タブで該当 CSS のリクエスト URL とステータス（200 / 404）を確認する。

---

## 5. 推奨対応

1. **Code Sync と head の確認**  
   - GitHub に push したうえで、AEM Code Sync が成功しているか確認する。  
   - プレビュー用 HTML の head が、このリポジトリの **head.html**（`styles.css` + `marubeni-theme.css`）を参照しているか確認する。

2. **codeBasePath と 404 の確認**  
   - 上記 Console で `codeBasePath` を確認する。  
   - Network で `marubeni-theme.css` / `header.css` / `cards.css` のリクエスト URL とステータスを確認し、404 の場合は配信設定（fstab、Franklin 配信 URL）を見直す。

3. **main が無い場合の loadOrphanBlocks**  
   - `scripts/scripts.js` の `loadOrphanBlocks` は現在 `div.cards` のみ対象。  
   - AEM 側の DOM が `div.cards-wrapper > …` のみで `div.cards` が無い場合は、検出条件の見直しが必要。

4. **再検査**  
   - 上記対応後、再度 `inspect-header-launch.cjs` で AEM を取得し、`diagnostic` と header の `fontSize` が 15px 付近になっているか、`--rem` が設定されているかを確認する。

---

## 6. 参照ドキュメント

- **AEM でスタイルが当たらない一般的な診断**: `docs/AUTHOR_STYLE_TROUBLESHOOTING.md`
- **Cards が直らない分析**: `docs/AEM_CARDS_NOT_FIXED_ANALYSIS.md`
- **ヘッダー検査手順**: `docs/header-inspection-steps.md`
