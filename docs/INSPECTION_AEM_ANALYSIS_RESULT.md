# Inspection 分析レポート（AEM PC 狭い幅 1000px）

## 基本情報

| 項目 | 値 |
|------|-----|
| URL | https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni/jp/cards.html |
| viewport | 1000 x 730 |

## Diagnostic（診断情報）

| 項目 | 値 |
|------|-----|
| codeBasePath | /content/marubeni.resource |
| :root --rem | clamp(6, 100vw / 1280 * 10, 10) |
| main あり | はい |
| header block status | loaded |
| .cards-wrapper 数 | 2 |
| marubeni-theme.css 読み込み | **あり** |
| header.css 読み込み | **あり** |
| cards.css 読み込み | **あり** |

### 読み込まれているスタイルシート

- https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni.resource/styles/styles.css
- https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni.resource/styles/marubeni-theme.css
- https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni.resource/blocks/hero-video/hero-video.css
- https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni.resource/styles/fonts.css
- https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni.resource/blocks/header/header.css
- https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni.resource/blocks/cards-carousel/cards-carousel.css
- https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni.resource/blocks/cards/cards.css
- https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni.resource/blocks/image/image.css
- https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni.resource/blocks/footer/footer.css
- https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni.resource/styles/lazy-styles.css

## 判定

必要な CSS は読み込まれており、codeBasePath も設定されています。別要因（詳細度・読み込み順の上書きなど）を確認してください。

## カード（1件サンプル）

| 要素 | プロパティ | 値 |
|------|------------|-----|
| .cards-card-body | paddingLeft | 0px |
| .cards-card-body | fontSize | 18px |
| .cards-card-body | minHeight | auto |
| .cards-card-body-icon | width | 170.4px |
| .cards-card-body-icon | height | 170.4px |

### カードの解釈（PC 狭い幅 1000px）

- **paddingLeft: 0px** → 当リポジトリの指定は `calc(var(--rem)*(icon-size+gap)*1px)`（1000px 時は約 30px 想定）。**0px のため、cards.css の該当ルールがこの要素に効いていない可能性が高い。**
- **fontSize: 18px, minHeight: auto** → 同様に、カード用の font-size / min-height が効かず body 継承になっている。
- **icon 170.4px** → 赤丸矢印アイコンは約 24px 想定。170px は**カード画像などの別要素**を取得している可能性が高い（スクリプトのフォールバックで previousElementSibling を参照しているため）。

**結論**: いずれかの **.cards-card-body** には、`main .cards .cards-card-body` や `.cards-wrapper ... .cards-card-body` などのセレクタが**当たっていない**可能性がある（DOM の入れ子や AEM 側のクラス違い）。または **cards-carousel** 内のカードなど、別ブロックの要素を取得している。

**対応済み**: `blocks/cards/cards.css` に、**.cards-wrapper** 直下の `.cards-card-body` / `.cards-card-body-icon` にも当たるフォールバックセレクタを追加した（.cards が祖先にない AEM 構造でもスタイルが効くように）。Code Sync 後に AEM で再確認してください。

## ヘッダーまわりの computed fontSize

| 出現した fontSize |
|------------------|
| 15px |
| 18px |
| 20px |
| 24px |

→ **15px が含まれる** = ナビリンク等に header.css の `calc(var(--rem)*1.5*1px)` が効いている可能性があります。18px は body 継承、20px/24px はドロップダウン・ロゴ等の別指定です。
