# オリジナルサイト（marubeni.com/jp）ヘッダー用クロール成果物

https://www.marubeni.com/jp/ から取得した CSS と SVG です。EDS ヘッダーを本家に忠実に再現する際の参照用です。

## 取得日

手動クロールで取得（スクリプト実行日を記録してください）。

## ファイル一覧

| ファイル | 元URL | 説明 |
|----------|--------|------|
| **header.min.css** | https://www.marubeni.com/common/stylesheets/header.min.css | 本家ヘッダー専用スタイル（.l-header 一式・ドロップダウン・検索・言語）。**Shadow DOM 内で header.min.js が動的に読み込む**ため、メイン HTML の link には出てこない。 |
| **common.min.css** | https://www.marubeni.com/common/stylesheets/common.min.css | サイト共通 CSS（リセット・c-underline-list・f-search・u-visually-hidden 等）。 |
| **font.min.css** | https://www.marubeni.com/common/stylesheets/font.min.css | フォント（YakuhanJP, Inter, Noto Sans JP, Ben アイコンフォント）。 |
| **logo-01.svg** | https://www.marubeni.com/common/images/logo-01.svg | ヘッダー用ロゴ（164×16、#E60012）。コピー先: `blocks/header/assets/logo-01.svg`。 |
| **header.min.js** | https://www.marubeni.com/common/scripts/header.min.js | 本家ヘッダー Web コンポーネント（`<marubeni-header>`）。header.min.css の URL を組み立てて読み込む。 |
| **viewport-unit.min.js** | https://www.marubeni.com/common/scripts/viewport-unit.min.js | --vw / --vh 等の viewport 用 CSS 変数を documentElement に設定。--rem は設定しない（header.min.css の :host で定義）。 |
| **megamenu.min.js** | https://www.marubeni.com/common/scripts/megamenu.min.js | ドロップダウン開閉（aria-expanded, delay, アニメーション）。本家は delay: 100 で使用。 |
| **accordion.min.js** | https://www.marubeni.com/common/scripts/accordion.min.js | モバイル用ハンバーガーメニュー開閉。参照用。 |
| **header-extract.css** | （生成） | common.min.css からヘッダー／c-underline-list／f-search／utility 関連ルールのみ抽出したもの。 |
| **header-dropdown-extract.css** | （生成） | header.min.css からドロップダウン・メガメニュー関連（.l-header__dropdown, .l-header__navigation-sub 等）のみ抽出・整形したもの。 |
| **header-beautified.css** | （生成） | header.min.css を改行挿入して整形したもの。ルール一覧確認用。 |
| **HEADER_DROPDOWN_MAPPING.md** | （生成） | 本家のドロップダウン用クラスと EDS の header ブロック用セレクタの対応表。--rem 換算メモ付き。 |
| **JS_BEHAVIOR.md** | （生成） | viewport-unit / megamenu / accordion の挙動と --rem 定義元（header.min.css :host）のメモ。 |
| **DOM_STRUCTURE.md** | （生成） | 本家テンプレートのドロップダウン DOM 構造と data-columns、EDS との差分。 |
| **computed-style-dump.js** | （生成） | 本家サイトでドロップダウンを開いた状態でコンソール実行すると、主要ノードの getComputedStyle を JSON 出力。EDS の数値合わせ用。 |
| **marubeni-jp-index.html** | https://www.marubeni.com/jp/ | トップページ HTML（`drafts/` に保存）。ヘッダーは `<marubeni-header><template>` 内にあり、header.min.js が Shadow DOM に clone し、header.min.css を読み込む。 |

## 本家ヘッダーの構造（クラス名）

- `.l-header` … ヘッダー全体（fixed、背景 #fff、下線 #dfdfdf）
- `.l-header__bar` … 1 行目（ロゴ＋ハンバーガー）。コンテンツ幅: `margin-inline: calc(50% - var(--vw) * 50px); width: calc(var(--vw) * 100px)` 相当
- `.l-header__logo` … ロゴリンク。`img` は 164px（desktop）/ 12rem 相当（mobile）
- `.l-header__menu` … ハンバーガーボタン（900px 未満のみ表示）
- `.l-header__content` … 2 行目（ナビ＋utility）。desktop では bar と重ねて absolute
- `.l-header__navigation` … メインナビ
- `.l-header__navigation-list` … ul
- `.l-header__navigation-item` … li（ドロップダウンあり）
- `.l-header__navigation-link` … リンク
- `.l-header__navigation-sub` … ドロップダウン領域
- `.l-header__dropdown` / `.l-header__dropdown-content` … メガメニュー内容
- `.l-header__utility` … Ja/En・検索
- `.l-header__language` / `.l-header__search` … 言語・検索

## EDS での利用

- **header.min.css** を参照し、EDS の DOM（`.nav-wrapper`, `.nav-brand`, `.nav-sections`, `.nav-tools` 等）に合わせてセレクタを書き換え、`blocks/header/header.css` または `styles/marubeni-theme.css` に取り込む。
- コンテンツ幅・色（#282828, #e60012, #dfdfdf）、フォントサイズ（--rem ベース）、ドロップダウンの見た目は header.min.css の値を流用する。
- **ドロップダウン（メガメニュー）** 用スタイルは **header-dropdown-extract.css** に抽出済み。クラス対応は **HEADER_DROPDOWN_MAPPING.md** を参照し、`.nav-dropdown-panel` / `.nav-dropdown-list` / `.nav-dropdown-images` にマッピングして適用する。
- ロゴは `blocks/header/assets/logo-01.svg` を利用可能（nav の 1 セクション目で Image ブロックの画像として指定するか、CSS で background に指定する）。

## 注意

- 本家は Web コンポーネントと Shadow DOM を使用しているため、EDS の平坦な DOM とは構造が異なります。
- `:host` や `var(--vw)`, `var(--rem)` は本家の viewport-unit 等に依存しているため、EDS では必要に応じて CSS 変数を定義し直してください。
- **--rem** は viewport-unit.min.js では設定されず、**header.min.css** の `:host` 内で定義されています（デスクトップ: `min(10, var(--vw)*100/1280*10)`、モバイル: `var(--vw)*100/393*10`）。詳細は **JS_BEHAVIOR.md** を参照。
- header.min.js が import する **language-link.min.js** は未取得（言語リンク用。ドロップダウン見た目には不要）。
