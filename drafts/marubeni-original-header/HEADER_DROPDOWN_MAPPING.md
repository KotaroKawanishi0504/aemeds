# 本家ヘッダー ドロップダウン → EDS マッピング

本家（marubeni.com/jp）の `header.min.css` から抽出したドロップダウン関連スタイルを、EDS の `blocks/header/header.css` に適用する際のクラス対応と換算メモです。

## 本家の変数（EDS での置き換え目安）

| 本家 | 説明 | EDS での目安 |
|------|------|----------------|
| `var(--rem)` | 本家は viewport に応じて 10 前後。desktop 1280px で 10 | `10` または `1rem`（10px ベース） |
| `var(--rem) * 7.2 * 1px` | ナビバー高さ | `72px` |
| `var(--rem) * 2 * 1px` | フォントサイズ | `20px` または `2rem` |
| `var(--rem) * 1.5 * 1px` | ドロップダウン内フォント | `15px` |
| `var(--rem) * 1.9 * 1px` / `var(--rem) * 2 * 1px` | リスト行パディング | `19px` / `20px` |
| `var(--rem) * 2.4 * 1px` | 余白・アイコン幅 | `24px` |
| `var(--rem) * 3.2 * 1px` | ブロック余白 | `32px` |

## クラス対応表

| 本家（header.min.css） | EDS（header.css） | 備考 |
|------------------------|-------------------|------|
| `.l-header__navigation-sub` | ドロップダウン全体のラッパー。EDS では `li[aria-expanded]` の直下のパネル | 本家は `position: fixed; top: 72px; width: 100%` で全幅。EDS は `li` 直下の絶対配置で 560px 幅 |
| `.l-header__dropdown` | メガメニュー外枠。EDS には同名なし | バナーあり時 `background: linear-gradient(90deg,#fff 50%,#ecefee 50%)` |
| `.l-header__dropdown-content` | `header nav .nav-sections .default-content-wrapper > ul > li > .nav-dropdown-panel` または `> ul` | 本家はコンテンツ幅中央＋padding。EDS は `min(560px, 90vw)` |
| `.l-header__dropdown-header` | ドロップダウン内の見出し（EDS では未使用の場合はスキップ） | `font-size: 20px`, `font-weight: 500`, `padding-block: 32px` |
| `.l-header__dropdown-list` | `.nav-dropdown-list` | `padding-block: 3.2rem`（32px）、`grid-area: list` |
| `.l-header__dropdown-list .c-underline-list` | `.nav-dropdown-list ul` | `font-size: 15px` |
| `.l-header__dropdown-list .c-underline-list__item` | `.nav-dropdown-list li` | `border-top-color: #dfdfdf` |
| `.l-header__dropdown-list .c-underline-list__inner` | リスト 1 行のパディング | `padding-block: 19px 20px`, `padding-right: 24px` → EDS の `li a` の padding で再現 |
| `.l-header__dropdown-banner` | `.nav-dropdown-images` | `background-color: #ecefee`, `border-left: 24px solid #fff`, `gap: 16px`, `padding-block: 32px`, `padding-left: 40px` |
| `.l-header__navigation-sub-link::before` | 右矢印アイコン（Ben \e902） | EDS で矢印を出す場合は `.nav-dropdown-list li a::after` 等で `content: "\e902"` + Ben フォント |
| `.l-header__background` | ドロップダウン背面の白いパネル | 本家は開いたときだけ高さ付与。EDS ではパネル自体に `background: #fff` を付けているので省略可 |

## 本家のドロップダウン構造（desktop）

- ドロップダウンは **全幅 fixed**（`top: 72px`）で、**中央のコンテンツ幅**（`margin-inline: calc(50% - var(--vw)*50px)` 相当）内に `.l-header__dropdown-content` が入る。
- リストのみのとき: グリッド `"header . list"`（見出し 12.36%、4rem ギャップ、リスト 1fr）。
- バナーあり: `"header . list banner"`（リスト 1fr、バナー 21.57%）。
- リスト内は **c-underline-list**（本家共通コンポーネント）で、各項目に下線・右矢印（\e902）あり。

## EDS で足すと本家に近づく主な値

- **ドロップダウンパネル**
  - リストのみの場合の余白: `padding-block: 3.2rem`（32px）をリストラッパーに。
  - フォント: `.nav-dropdown-list` 内 `font-size: 15px`（本家 1.5rem 相当）。
- **リスト項目**
  - 行パディング: `padding-block: 19px 20px`, `padding-right: 24px`（本家 .c-underline-list__inner 相当）。
  - 区切り線: `border-top: 1px solid #dfdfdf`（先頭以外）。
- **バナー領域（.nav-dropdown-images）**
  - `background-color: #ecefee`, `border-left: 24px solid #fff`, `padding: 32px 0 32px 40px`, `gap: 16px`。
- **矢印**
  - Ben フォントの `\e902` を `.nav-dropdown-list li a::after` で表示（font.min.css または Ben アイコンフォント読み込みが必要）。

## 参照ファイル

- 抽出スタイル: `header-dropdown-extract.css`
- 本家 minify 元: `header.min.css`
- EDS ヘッダー: `blocks/header/header.css`
