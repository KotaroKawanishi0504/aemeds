# Marubeni EDS スキル – 解説（日本語）

「**どのスキルが使えるか**」と「**スキル外で行う必要があること**」を整理します。

---

## 前提：スキルが「使える」とは

- EDS スキルは **Adobe の GitHub リポジトリ** [adobe/skills](https://github.com/adobe/skills) にあります。
- **このプロジェクトにコピーするまで Cursor では参照できません。**  
  → [SETUP_EDS_SKILLS.md](./SETUP_EDS_SKILLS.md) の手順で、`adobe-skills` をクローンし、必要なスキルフォルダを **`.cursor/skills/`** にコピーしてください。
- コピー後、チャットやエージェントで「**content-driven-development に従って**」のようにスキル名を指定すると、AI がそのスキルの `SKILL.md` や `resources/` を読んで手順に沿って動きます。

---

## 使えるスキル（コピー後に Cursor で利用可能）

いずれも **手順・ガイドとして** AI が参照し、コード修正・ドキュメント作成・分析の進め方を案内するものです。

| スキル名 | 役割 | 備考 |
|----------|------|------|
| **content-driven-development** | スタイル合わせ・新ブロック・ブロック変更の「全体の進め方」のオーケストレータ | 最初に使う基準フロー |
| **analyze-and-plan** | 要件分析・受け入れ条件・**ビジュアル分析**（レイアウト・色・余白・タイポの文書化） | 丸紅 TOP などの分析結果を `drafts/tmp/marubeni-style-analysis.md` に出力する想定 |
| **building-blocks** | ブロック実装（JS/CSS）・**CSS ガイドライン**（変数・スコープ・レスポンシブ） | Step 4 で CSS カスタムプロパティを丸紅用に上書き |
| **block-collection-and-party** | Block Collection / Block Party の**ブロック構造・参考実装の確認** | 「正しい HTML 構造」の参照。スクリプト実行は別（後述） |
| **testing-blocks** | リント・ブラウザ検証・スクショ・単体テストの**手順** | 受け入れ条件の検証 |
| **content-modeling** | ブロックの**テーブル構造（コンテンツモデル）設計** | 新規ブロック・拡張時の設計参照 |
| **page-import** | **1 ページ単位のインポート**のオーケストレータ（手順のまとめ） | 下記 scrape → identify → authoring → generate → preview の流れ |
| **scrape-webpage** | ページのスクレープ・メタデータ・画像・cleaned HTML 取得の**手順** | 実際の取得はスクリプト実行が別（後述） |
| **identify-page-structure** | セクション境界・コンテンツシーケンスの**同定手順** | page-import の Step 2 |
| **page-decomposition** | セクション内のコンテンツシーケンスを**中立的に記述する手順** | ブロック候補の整理用 |
| **authoring-analysis** | 各シーケンスを「デフォルトコンテンツ」か「ブロック」か**判定する手順** | Hero/Cards/Tabs 等の割り当て |
| **generate-import-html** | 作者分析に基づく**EDS 用 HTML 生成の手順** | セクション・ブロックテーブル・メタデータ付き |
| **preview-import** | 生成 HTML の**ローカルプレビュー・検証手順** | 見た目・ブロック表示の確認 |
| **find-test-content** | 既存コンテンツから**ブロックを含むページを検索する手順** | テスト用 URL 探し |
| **block-inventory** | **利用可能ブロック一覧の取得手順** | インポート時・新ブロック検討時 |
| **docs-search** | aem.live 等の**公式ドキュメント検索の参照** | 仕様・ベストプラクティス確認 |
| **code-review** | **コードレビュー観点のガイド** | PR 前の自己チェック |

→ これらは「**AI が手順に沿って設計・実装・ドキュメントを進めるために使うスキル**」です。コピーすれば Cursor 上で参照できます。

---

## スキル外で行う必要があること

スキルは「やり方」を教えるもので、次のことは**スキルに含まれず、手動または別の実行環境で行う必要**があります。

### 1. スキルの導入そのもの

- **adobe/skills のクローン**と、**必要なスキルフォルダの `.cursor/skills/` へのコピー**  
  → 一度だけ実施。 [SETUP_EDS_SKILLS.md](./SETUP_EDS_SKILLS.md) の PowerShell 例を利用可能。

### 2. スクリプトの実行（Node / Playwright など）

一部スキルは **Node スクリプト** を参照しています。スクリプトの**実行**は Cursor のスキルではなく、**ローカルまたは CI で自分で実行**する必要があります。

| スキル | 依存スクリプト | スキル外で行うこと |
|--------|----------------|---------------------|
| **block-collection-and-party** | `get-block-structure.js` | プロジェクトに依存関係を入れ、スクリプトを実行してブロック構造を取得する。 |
| **scrape-webpage** | `analyze-webpage.js`（Playwright 等） | Playwright 等をインストールし、丸紅の URL を指定してスクレープを実行する。 |

→ スキルは「いつ・何のためにそのスクリプトを使うか」を案内し、**実際の `node xxx.js` や Playwright の実行はプロジェクト側で行う**形です。

### 3. 実データ・実環境に依存する作業

- **ビジュアル分析のインプット**  
  スクショ・Figma・対象 URL を**用意する**のは人間。AI はその素材を見て `marubeni-style-analysis.md` を埋める手順に沿って動く。
- **AEM 側の設定**  
  コンテンツソース、公開 URL、デフォルトページ、ナビ・フッターの公開などは **AEM/EDM の設定**であり、スキルでは行いません。
- **本番 URL での確認**  
  本番やプレビュー URL で最終確認する作業は、**ブラウザや担当者による確認**としてスキル外です。

### 4. ページインポートの「実行」のうち自動化されない部分

- **scrape-webpage**  
  手順はスキルで参照できるが、実際の HTTP 取得・画像保存は **スクリプト実行**（上記 2）。
- **identify-page-structure / authoring-analysis**  
  「どこをブロックにするか」の**判断・割り当て**は、AI が手順に沿って提案することはできても、最終決定は人間が行う運用が一般的です。
- **generate-import-html / preview-import**  
  手順に沿った HTML 生成やプレビューは、**AI がコードやファイルを編集する形**でスキル内で行える。プレビュー用のローカルサーバー起動は、必要なら手動または npm スクリプトで実施。

---

## まとめ

| 分類 | 内容 |
|------|------|
| **スキルでできること** | 手順に沿った設計・分析・実装・ドキュメント作成（analyze-and-plan, building-blocks, content-driven-development, page-import の流れなど）。スキルを `.cursor/skills/` にコピーした上で、Cursor のチャットでスキル名を指定して利用。 |
| **スキル外で行うこと** | ① スキルのクローン・コピー ② get-block-structure.js / analyze-webpage.js などの Node スクリプトの実行と依存関係の用意 ③ スクショ・Figma・URL の準備 ④ AEM の設定 ⑤ 本番での最終確認 |

運用のイメージとしては、「**進め方と手順はスキルに任せ、実行環境の準備・スクリプト実行・最終判断は人間が行う**」形になります。

詳細な利用順序は [MARUBENI_EDS_SKILLS.md](./MARUBENI_EDS_SKILLS.md) を参照してください。
