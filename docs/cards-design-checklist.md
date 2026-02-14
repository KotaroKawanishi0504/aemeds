# Cards block – デザイン差異の確認と修正チェックリスト

デザイン差異を直すときのツールと修正箇所の一覧。仕様の詳細は [cards-icon-spec.md](cards-icon-spec.md) を参照。

---

## 1. 確認用ツール

| ツール | 用途 | 手順 |
|--------|------|------|
| **単体テストページ** | ブロックだけを確実に表示して確認 | `npm run preview:import` のあと `http://localhost:3001/drafts/jp/cards-test.html` を開く。画像＋赤丸矢印＋ラベルが 1 枚のカードとして表示されるか確認。 |
| **スクリーンショット比較** | 参照サイトと AEM の見た目差分 | プレビュー起動後、aemeds で `node scripts/compare-cards-screenshots.js`。出力は `drafts/tmp/screenshot-compare/`。 |
| **仕様書** | 数値・色の唯一の参照 | [docs/cards-icon-spec.md](cards-icon-spec.md)。 |

---

## 2. 修正時に触るファイル

| 差異の種類 | 修正するファイル |
|------------|------------------|
| アイコン（円・矢印の色・太さ・サイズ） | `styles/marubeni-theme.css`（`:root` の `--card-icon-*`）、`blocks/cards/cards.css`（circle stroke / arrow fill） |
| ラベル色・ホバー色 | `styles/marubeni-theme.css`（`--card-text-color`, `--card-text-hover-color` と `.cards-card-body a`） |
| カード本文の余白・フォント | `styles/marubeni-theme.css`（`--card-body-margin`, `--card-body-font-size`, `--card-body-line-height`） |
| アイコン＋ラベル間の余白 | `styles/marubeni-theme.css`（`--card-icon-gap`）、`blocks/cards/cards.css`（`padding-left: calc(...)`） |
| リストのグリッド・カード間余白 | `styles/marubeni-theme.css`（`--card-list-gap`, `--card-list-item-min-width`） |
| アイコン SVG の形・viewBox | `blocks/cards/cards.js`（`createCardBodyIconSVG`） |
| 画像セルと本文セルの判定 | `blocks/cards/cards.js`（`decorate` 内の `isImageCell`） |

---

## 3. よくある差異と対応

| 現象 | 確認・修正 |
|------|------------|
| 赤丸が画像の横にも出る | 画像セルに `img` または `picture` が含まれるように HTML を合わせる。デコレータは「セル内に img/picture あり → 画像セル」で判定。 |
| ラベルが青い・下線が付く | `marubeni-theme.css` の `.cards-card-body a` で `color: var(--card-text-color)` と `text-decoration: none` を確認。 |
| アイコンが小さく見える / 大きい | `:root` の `--card-icon-size`（2.6rem / 2.4rem）と `blocks/cards/cards.css` の `.cards-card-body-icon` の width/height を確認。 |
| 円の線が細い / 太い | `--card-icon-stroke-width`（1.5）と `cards.css` の `.cards-card-body-icon-svg circle` を確認。 |
| 900px 以下でアイコン・余白が違う | `marubeni-theme.css` の `@media (width < 900px)` で `--card-icon-size: 2.4rem`, `--card-icon-gap: 0.8rem` を確認。 |

---

## 4. 作業の流れ（例）

1. **単体テストで挙動確認**  
   `cards-test.html` で「1 行 = 画像 + 本文（アイコン + ラベル）」になっているか確認。
2. **仕様で数値・色を確認**  
   [cards-icon-spec.md](cards-icon-spec.md) の表と現状の CSS 変数・スタイルを照合。
3. **上記の表で該当ファイルを修正。**
4. （任意）**スクリーンショット比較**で参照サイトと並べて目視または diff で確認。
