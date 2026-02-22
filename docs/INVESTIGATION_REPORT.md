# デザイン崩れ 調査レポート（Cursor 実行分）

## 実行した調査

| 項目 | 内容 |
|------|------|
| 狭い幅の inspection | オリジナルサイトを **viewport 800px** で取得（headless）※800px はモバイルブレークポイント以下 |
| 出力 | `docs/inspection-original-800.json` |
| 分析 | `docs/inspection-aem.json`（AEM 1536px）と `docs/inspection-original-800.json`（オリジナル 800px）を分析 |

**PC ビューで狭い幅を調査する場合**: ブレークポイントは 900px（`width >= 900px` が PC）。viewport は **900 以上**（例: 900 や 1000）にすること。800 だとモバイルレイアウトになる。  
例: `node scripts/inspect-header-launch.cjs "https://author-.../cards.html" docs/inspection-aem-1000.json 1000` → ログイン後 Enter。

---

## 結果サマリ

### オリジナル（800px 時）

| 項目 | 値 |
|------|-----|
| viewport | 800 x 730 |
| :root --rem | `calc(8 * 100 / 393 * 10)`（本家のモバイル用スケール） |
| body fontSize | **32.57px** |
| ヘッダーまわり fontSize | 0px, 10px, 16px, 22〜48px など複数（viewport に応じてスケール） |

→ 狭い幅では本家は **body が 32.57px** と大きめにスケールしている。ヘッダーは Shadow DOM のため、この JSON の root は body。

### AEM（1536px 時・既存データ）

| 項目 | 値 |
|------|-----|
| viewport | 1536 x 730 |
| :root --rem | `clamp(6, 100vw / 1280 * 10, 10)`（テーマの式が効いている） |
| テーマ・header・cards CSS | いずれも **読み込みあり** |
| ヘッダーまわり fontSize | **15px, 18px, 20px, 24px**（15px = ナビに header.css が効いている可能性） |

→ 広い幅では AEM に必要な CSS は読み込まれており、--rem も設定されている。ナビに 15px が含まれるため、header.css は効いている。

---

## 原因分析

1. **「CSS が読まれていない」は原因ではない**  
   diagnostic でテーマ・header・cards はいずれも読み込み済み。codeBasePath も設定されている。

2. **ヘッダーの「狭い幅で見切れる／大きく見える」**  
   - 本家は 800px で body 32.57px と大きくスケールしている。  
   - AEM は 1536px のデータのみのため、**狭い幅での AEM の --rem やレイアウト**は未取得。  
   - 対処案: **AEM を PC ビューの狭い幅（900 または 1000）で inspect して比較**するか、ヘッダーのメディアクエリ・flex（縮小・折り返し）を確認する。

3. **カードの「円が大きい／テキストと重なる」**  
   - cards.css は読み込み済み。  
   - **詳細度・読み込み順**（lazy-styles.css 等の上書き）や **DOM の違い**（セレクタが当たっていない）の可能性。  
   - 対処案: AEM で inspect を**再実行**すると、今回追加した **cardsSample**（1件の .cards-card-body の paddingLeft / fontSize / アイコン幅高さ）が JSON に含まれる。その値で当リポジトリの想定と一致するか確認できる。

---

## 次のアクション

| 目的 | 手順 |
|------|------|
| AEM を **PC ビュー**の狭い幅で比較 | viewport は **900 以上**（900 未満はモバイルになる）。例: `node scripts/inspect-header-launch.cjs "https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni/jp/cards.html" docs/inspection-aem-1000.json 1000` → ログイン・表示後 Enter。その後 `node scripts/analyze-inspection-diagnostic.cjs docs/inspection-aem-1000.json` |
| カードの computed を取得 | 上記と同じ AEM の inspect を再実行すると、**cardsSample** が JSON に含まれる（スクリプトに追加済み）。analyze で「カード（1件サンプル）」がレポートに出る。 |
| スタイルの上書き確認 | AEM の cards ページで DevTools の Elements から .cards-card-body を選択し、Styles で cards.css / marubeni-theme.css のルールが効いているか、後続のスタイルで打ち消されていないかを確認する。 |

---

## 変更したスクリプト（今回の調査用）

- **inspect-header-launch.cjs**: 第4引数で **viewport 幅**を指定可能。**PC ビュー**で狭い幅を調べる場合は **900 以上**（例: `1000`）を指定すること（900 未満でモバイルになる）。指定時はオリジナルでは headless で実行。**cardsSample**（.cards-card-body 1件の paddingLeft / fontSize / アイコン寸法）を取得して JSON に含めるようにした。
- **analyze-inspection-diagnostic.cjs**: **cardsSample** があれば「カード（1件サンプル）」をレポートに出力。**判定**は AEM の JSON のときのみ表示（オリジナルでは表示しない）。
