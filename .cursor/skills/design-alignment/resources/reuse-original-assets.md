# 本家資産の流用ルール

本家の CSS・SVG・フォントを**可能な限りそのまま流用**し、出典を明示する。独自に「似た値」を決めない。

## 原則

- 色・余白・フォント・レイアウトの数値は、**本家の Computed または本家 CSS の値**をそのまま使う。
- テーマやブロックのコメントに「本家 〇〇 (01-common.min.css の …)」「Source: design-extract/cards-computed-styles.json」のように**どのファイル・どのセレクタから取ったか**を書く。
- 仕様書（例: docs/cards-icon-spec.md）では、各項目に **Source files** 列を設け、参照元を記載する。

## フォントの流用

- **本家の *-font*.css**（例: 02-font.min.css）を開き、`@import` と `font-family` を確認する。
- テーマで同じ @import URL を使う（必要なら https: に統一）。font-family は本家の並びをそのまま使う（stylelint 等で小文字化する場合は inter, yakuhanjp, "Noto Sans JP", sans-serif など）。
- アイコンフォント（例: Ben）は本家の woff URL をフォールバックにしてもよい。

## レイアウトの流用

- **計測結果の数値**をそのまま CSS に書く。例: gap 40px 56px なら `--card-list-gap: 56px 40px;`。
- 複数ビューポートで「幅がビューポートに応じて変わる」場合は、計測結果から式を導く。例: 1280 で 1088px、1387 で 1195px、1920 で 1344px なら `min(1344px, calc(100vw - 192px))`。
- セクションの padding は、本家でデスクトップ時に 0 ならテーマでも 0 にする（左右余白は margin: auto で生じる）。

## 色・アイコンの流用

- 本家の 01-common.min.css 等の該当ルールから色（例: #e60012）を写す。テーマの変数に設定し、コメントで「本家 01-common.min.css の … をそのまま使用」と書く。
- アイコンは cleaned.html の data URL SVG（circle r, stroke）と design-extract のサイズを仕様書に写し、実装はその仕様書のみ参照する。SVG を自前で描く場合は、本家の viewBox・r・stroke-width をそのまま使う。

## サイト別テーマ 1 ファイルの構成

- 1 つのテーマ CSS で: (1) @import でフォントを先に読み込む、(2) :root で --max-content-width, --inline-section-padding, --body-font-family, --heading-font-family とブロック用変数を上書き、(3) メディアクエリでブレイクポイントごとに上書き。base の後に 1 ファイルだけ読み込む。
