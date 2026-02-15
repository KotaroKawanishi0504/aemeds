# 丸紅TOP ページインポート手順

## ゴールと現在のステップの位置づけ

**ゴール:** AEM 上で、開発したブロック（Hero, Cards, Tabs, News list, Notice banner 等）を使った**オーサリング**で Marubeni TOP を再現すること。編集は Universal Editor 等で行い、コンテンツは AEM（または EDS のコンテンツソース）に保持される。

**現在のステップの位置づけ:**

| 段階 | 状態 | 意味 |
|------|------|------|
| ブロック実装 | 済 | TOP 再現に使うブロックはコードとして用意済み。 |
| スタイル合わせ | 済 | 丸紅テーマ（色・フォント）を適用済み。 |
| コンテンツの「下書き」 | 済 | 現行 TOP を scrape → セクション／ブロック割り当て → EDS 形式 HTML として生成。**レポジトリ内のファイル**（`drafts/jp/index.plain.html` + 画像）として保持。 |
| プレビュー | 済 | 上記 HTML を静的配信で表示し、見た目・構造を確認可能。 |
| **AEM でオーサリング可能な形で再現** | **未** | TOP の内容が **AEM のページ／コンテンツとして**存在し、ブロック単位で編集できる状態にはまだなっていない。 |

**ゴールとの差異:**  
いまあるのは「TOP を EDS ブロック構造に落とした**参照用の 1 ページ分の HTML**」であり、**AEM 上で編集できるコンテンツ**ではない。  
本番の配信は `fstab.yaml` のとおり AEM Author の Franklin 配信（`/content/marubeni/jp/`）を参照しているため、ゴールに到達するには、**このインポート結果を AEM 上に「オーサリング可能な TOP ページ」として用意する**ステップが残っている。

**次のステップ（ゴールに向けて）:**

1. **手動オーサリング:** AEM で TOP 用ページ（例: `/content/marubeni/jp`）を作成し、`drafts/jp/index.plain.html` と `authoring-analysis.md` を**設計書・参照**として使い、同じセクション／ブロック構成・テキスト・画像を Universal Editor 上でブロックを並べて再現する。画像は AEM のアセットとしてアップロードし、ブロックで参照する。
2. **インポート機能の利用（ある場合）:** プロジェクトで「HTML やシートから AEM ページ／ブロックを生成する」インポートや移行ツールがある場合は、`index.plain.html`（とメタデータ・画像）をその入力として渡し、AEM 上に編集可能な TOP ページを一括で作成する。

いずれにしても、**「インポート成果物」＝ ゴール達成のための設計・参照であり、その先の「AEM 上でのオーサリング再現」がゴール**という位置づけになる。

---

以下は page-import フロー（scrape → identify → authoring → generate → preview）の手順です。

## 1. スクレープ（完了済み）

- **実行:** `node scripts/run-marubeni-scrape.js`（aemeds ルートで）
- **出力:** `drafts/tmp/import-work/`（metadata.json, cleaned.html, screenshot.png, images/）

## 2. セクション同定・作者分析（完了済み）

- **authoring-analysis:** [drafts/tmp/import-work/authoring-analysis.md](drafts/tmp/import-work/authoring-analysis.md) にセクション→ブロック割り当てを記載済み。

## 3. EDS 用 HTML 生成（完了済み）

- **ファイル:** [drafts/tmp/import-work/jp/index.plain.html](drafts/tmp/import-work/jp/index.plain.html)
- **画像:** `drafts/tmp/import-work/jp/images/` にコピー済み。
- **メタデータ:** 最終セクションに metadata ブロック（title, description）を追加済み。

## 4. プレビュー（preview-import）

**確実にプレビューする方法（推奨）:** `aem up --html-folder` が 404 になる環境では、**静的サーバー**でプレビューしてください。

1. 次のいずれかで実行する。
   - **aemeds フォルダで実行（推奨）:** ターミナルのカレントを `aemeds` にしてから `npm run preview:import`。  
     （ワークスペース直下 `eds` で実行すると `package.json` がないためエラーになります。）
   - **ワークスペース直下（eds）から実行:** ルートに `package.json` がある場合は `npm run preview:import` で aemeds のプレビューを起動します。

   ```bash
   cd aemeds
   npm run preview:import
   ```

2. **ブラウザで開く**

   - **URL:** `http://localhost:3001/drafts/jp/preview.html`
   - 丸紅TOPのインポート内容がスタイル付きで表示されます（ブロックの JS は動きませんが、レイアウト・画像・テキストは確認できます）。

---

**別案（aem up で試す場合）**

- `aem up --html-folder drafts` のあと、`http://localhost:3000/drafts/jp` または `http://localhost:3000/jp` を開く方法もありますが、環境によっては 404 になります。その場合は上記の `npm run preview:import` を使ってください。

3. **確認項目**

   - ヒーロー・カード・お知らせバナー・社長メッセージ・丸紅について・最新情報（タブ＋ニュースリスト）・バナーが表示されること。
   - 画像が読み込まれること（`./images/` は `jp/images/` を参照）。
   - スタイルは [styles/marubeni-theme.css](styles/marubeni-theme.css) が [head.html](head.html) で読み込まれているため、丸紅テーマが適用される。

4. **デザインギャップ確認（任意）**  
   参照サイトとプレビューのカードをスクリーンショット比較する手順は [DESIGN_ALIGNMENT.md](../DESIGN_ALIGNMENT.md) の「デザインギャップ確認（スクリーンショット比較）」を参照。`node scripts/compare-cards-screenshots.js` で `drafts/tmp/screenshot-compare/` に reference / aem / diff を出力できる。

## 5. コードを Git にコミットし、Author でスタイル確認

**次のアクションとして推奨:**

1. **作成したコードを Git にコミット・プッシュする**
   - ブロック（`blocks/`）、スタイル（`styles/`）、`component-definition.json` 等をコミットする。
   - リポジトリに AEM Code Sync が連携されていれば、プッシュ後に Author 側で最新のブロック・スタイルが利用可能になる。

2. **Author 画面で各ブロックのスタイルを確認する**
   - AEM のプレビュー環境（`fstab.yaml` の Franklin 配信先）で、ブロックを含むページを開く。
   - 各ブロック（Hero, Cards, Tabs, News list, Notice banner, Alert 等）が、丸紅テーマ（`marubeni-theme.css`）を含め想定どおりのスタイルで表示されるか確認する。
   - 必要に応じて Universal Editor でブロックを追加・編集し、見た目と挙動を確認する。

**Marubeni スタイルが Author で当たらない場合:** [AUTHOR_STYLE_TROUBLESHOOTING.md](AUTHOR_STYLE_TROUBLESHOOTING.md) で、`marubeni-theme.css` の読み込み確認や Code Sync・参照ブランチの確認を行ってください。

これで「コードはリポジトリにあり、Author 上でブロックが正しくスタイルを再現できる」状態を確認できる。そのうえで、TOP ページのコンテンツをオーサリングで再現する（セクション 6）。

---

## 6. 配置（スキル外）

- **AEM に反映する場合:** `/content/marubeni/jp` の TOP ページに、`jp/index.plain.html` の内容（セクション・ブロック・メタデータ）をオーサリングで再現するか、インポートツールで取り込む。画像は AEM アセットとして登録し、ブロックで参照する。
- **リポジトリでプレーンページとして使う場合:** `drafts/tmp/import-work/jp/` を、AEM のコンテンツソースが参照するパスにコピーし、`paths.json` 等に合わせる。

詳細は [MARUBENI_EDS_SKILLS.md](MARUBENI_EDS_SKILLS.md) を参照。
