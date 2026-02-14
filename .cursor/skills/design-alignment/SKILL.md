---
name: design-alignment
description: Align EDS blocks and styles with an existing reference site by collecting all obtainable data first, reusing original CSS/SVG/fonts, and verifying with numeric and screenshot comparison. Use when migrating or matching design from a live site (e.g. Marubeni) to avoid "guessing" with vague numbers.
---

# Design Alignment (既存サイトの見た目合わせ)

参照サイト（既存の本家サイト）の見た目を EDS で再現するとき、**分析せずに「なんとなくの数字」で似せない**。取得可能な情報を洗い出してすべて取得し、**本家の CSS・SVG・フォントを可能な限りそのまま流用**する。結果を目視で並べて確認しづらい環境でも、**数値比較とスクリーンショット比較で精度を上げる**。

## When to Use This Skill

- 既存サイトを AEM EDS に移行し、ブロックやスタイルを本家に合わせるとき
- 「レイアウト・余白・フォントが本家と違う」と指摘されたとき
- 参照サイトの HTML/CSS/JS を分析する前に、見た目や数値を決めようとしているとき（→ まずこのスキルに従い収集から行う）

**関連スキル:** scrape-webpage（HTML/CSS/画像取得）、analyze-and-plan（受け入れ基準）、building-blocks（実装）。本スキルは「収集・流用・検証」の手順を担当する。

---

## 原則（Principle）

1. **推測で数値を決めない**  
   本家の HTML/CSS/JS を分析する前に、余白・幅・フォントなどを「なんとなく」で決めない。

2. **取得可能な情報を洗い出し、すべて取得してから実装する**  
   収集物一覧（下記 `resources/collectable-information.md`）に沿って、参照サイトから取得できるものをすべて取得する。

3. **本家の CSS・SVG・フォントをそのまま流用する**  
   本家の @import・font-family・色・Computed 値をテーマやブロックに写す。出典（どのファイル・どのセレクタから取ったか）をコメントや仕様書に残す。

4. **画面を並べて確認できないときは数値とスクショで検証する**  
   本家と自実装を同じビューポートで並べて見られない場合でも、計測結果の数値比較とスクリーンショット比較（reference / aem / diff）で差分を特定し、1 変更ごとに比較して精度を上げる。詳細は `resources/accuracy-without-live-compare.md`。

---

## Workflow

### Step 1: 収集（Collect）

- **収集物一覧**に従い、参照サイトから以下を取得する。  
  一覧と取得方法・成果物の対応: **`resources/collectable-information.md`**

  - 参照 HTML（cleaned.html）・クラス名・セレクタ
  - 本家の CSS（*-font*.css, common*.css）の @import と該当ブロックのルール
  - Computed スタイル（design-extract または layout-collect）
  - **複数ビューポート**でのレイアウト計測（幅・gap・祖先の padding）。単一ビューポートだけでは fluid と固定の判断ができない
  - アイコン: 本家の SVG / data URL と design-extract のサイズ・色

- スクレープ済みでない場合は、先に **scrape-webpage** を実行する。レイアウトを厳密に合わせる場合は、複数ビューポート用のレイアウト計測スクリプト（例: `scripts/collect-marubeni-layout.js` を汎用化したもの）を実行する。

### Step 2: 流用（Reuse）

- **本家資産の流用ルール**に従い、テーマ・ブロックに反映する。  
  詳細: **`resources/reuse-original-assets.md`**

  - フォント: 本家の @import と font-family をテーマにそのまま記述（CDN URL をフォールバックにしてもよい）
  - レイアウト: 計測結果の数値または式（例: `min(1344px, calc(100vw - 192px))`）をそのまま CSS に書く
  - アイコン・色: 本家の SVG/CSS の値を仕様書（例: docs/cards-icon-spec.md）に写し、実装はその仕様書のみ参照する
  - すべての値に「本家のどの成果物から取ったか」を紐付ける（Source files 表など）

### Step 3: 検証（Verify）

- **画面を並べて確認できない場合の精度向上**手順に従う。  
  詳細: **`resources/accuracy-without-live-compare.md`**

  - 数値の正解を先に取る（layout-collect, design-extract）
  - 実装はその数値・式だけで合わせる
  - 同じビューポートで参照サイトと自実装をスクリーンショットし、reference / aem / diff で比較する（例: `node scripts/compare-cards-screenshots.js`）
  - 差分が出たら数値に戻って原因を特定し、1 変更 → 1 比較を繰り返す
  - 1 ビューポートだけを信じず、複数幅で計測して固定 vs fluid を判断する。フォントは分析ドキュメントだけでなく本家 CSS と Computed で確認する

### Step 4: ドキュメント化

- ブロックごとに「仕様書」（例: cards-icon-spec.md）を作成し、各値の **Source files** を記載する。
- レイアウト計測結果は `drafts/tmp/layout-collect-*.json` と要約 `.md` に残し、後から「なぜこの式か」を追えるようにする。

---

## Resources

| ファイル | 内容 |
|----------|------|
| `resources/collectable-information.md` | 収集可能な情報の一覧、取得方法、成果物・利用箇所の対応 |
| `resources/reuse-original-assets.md` | 本家 CSS・フォント・SVG の流用ルールと具体例 |
| `resources/accuracy-without-live-compare.md` | 画面を並べて確認できない中で精度を上げる手順とよくある落とし穴 |

---

## よくある落とし穴（Pitfalls）

- **単一ビューポートの design-extract だけを信じる** → 本家が中間幅で fluid になっているとずれる。必ず複数ビューポートで計測する。
- **スタイル分析ドキュメントのフォントをそのまま使う** → 本家が差し替えていることがある。本家の *-font*.css と Computed で必ず確認する。
- **Author 用の DOM を忘れる** → `.block > ul` だけでなく `.block-wrapper > div > ul` など、Publish と Author の全セレクタに同じレイアウトを当てる。
- **「一度教えた」だけでスキルを頼りにしない** → 重要なタスクでは「design-alignment スキルに従って」と明示するか、.cursorrules で参照する。
