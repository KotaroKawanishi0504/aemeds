# 収集可能な情報一覧

参照サイトの見た目を再現する前に、取得可能な情報を洗い出し、**すべて取得してから実装**する。推測で数値を決めない。

## 一覧と取得方法・成果物

| 収集対象 | 取得方法 | 成果物・利用箇所 |
|----------|----------|------------------|
| **HTML 構造・クラス名** | scrape-webpage（analyze-webpage.js） | `drafts/tmp/import-work/cleaned.html`。ブロックの DOM 構造・セレクタの参照。仕様書の「Reference implementation」。 |
| **ブロックの Computed スタイル（1ビューポート）** | scrape 内の design-extract | `design-extract/cards-computed-styles.json`, `cards-icon-computed.json`, `root-font.json`。アイコン・余白・フォントサイズの数値の出典。テーマの --rem ベースの計算。 |
| **本家の CSS ファイル** | scrape で取得したスタイル | `import-work/styles/01-common.min.css`, `02-font.min.css`。色・フォント・アイコン（例: Ben \e902）の参照。テーマの @import や変数の「本家 〇〇 をそのまま」の根拠。 |
| **複数ビューポートのレイアウト数値** | 専用 Playwright スクリプト（例: collect-marubeni-layout.js） | `layout-collect-*.json` / `.md`。コンテンツ幅・グリッド幅・gap・祖先の padding。fluid の式（例: min(1344px, 100vw - 192px)）の根拠。**単一ビューポートでは不十分。** |
| **フォントスタック** | 02-font.min.css の @import + 必要なら Computed | テーマの @import と --body-font-family。分析ドキュメントではなく本家 CSS を優先する。 |
| **アイコン SVG の仕様** | cleaned.html の data URL SVG + design-extract | 仕様書（例: docs/cards-icon-spec.md）。circle r, stroke, viewBox。ブロックの createIcon 等の実装。 |

## 取得の順序

1. **scrape-webpage** を実行 → cleaned.html, metadata.json, images/, styles/（本家 CSS）, design-extract/（1ビューポートの Computed）を得る。
2. レイアウトを厳密に合わせる場合: **複数ビューポート用レイアウト計測スクリプト**を実行 → layout-collect-*.json / .md を得る。ビューポートは少なくとも 375, 600, 900, 1280, 1920 など複数。
3. フォント: 本家の *-font*.css を開き @import と font-family をメモ。必要なら 1 ビューポートで Computed の font-family を取得。
4. アイコンがあるブロック: design-extract と cleaned.html の SVG から仕様書を作成し、Source files を記載する。

## 注意

- **単一ビューポートの design-extract だけを信じない**。本家が中間幅で fluid（例: viewport - 192）になっていると、固定値で実装するとずれる。
- 収集物は「なぜこの数値か」を後から追えるよう、ファイル名・セレクタ・ビューポートを記録する。
