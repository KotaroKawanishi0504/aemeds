# Author で Marubeni スタイルが当たらないとき

Git に push したあと、AEM Author のプレビューで丸紅用スタイル（色・フォント）が反映されない場合の確認手順です。

## 1. marubeni-theme.css が読み込まれているか

**確認方法:**

1. Author でプレビューしているページを開いた状態で、ブラウザの **開発者ツール**（F12）を開く。
2. **Network（ネットワーク）** タブで `marubeni-theme` でフィルタする。
3. **`marubeni-theme.css`** が一覧に出て、ステータスが **200** か確認する。

- **200 で読み込まれている** → 次の「2. 読み込まれているのに効かない場合」へ。
- **404 や一覧に出てこない** → 次の「3. 読み込まれない場合」へ。

## 2. 読み込まれているのに見た目が変わらない場合

- ブラウザの **キャッシュ** の影響のことがあります。**スーパーリロード**（Ctrl+Shift+R / Cmd+Shift+R）して再表示してみてください。
- 表示しているコンポーネントが **AEM のデフォルト（Text, Title, Image, Button 等）** の場合、それら用のスタイルが別にあると、丸紅テーマより強く当たっていることがあります。  
  **開発したブロック**（Hero, Cards, Tabs, News list, Notice banner 等）を配置したページでも同じか確認してください。

### 2.1 ブロックごとのタグ構造はどこで決まるか

**AEM のスキルで定義されています。** プラットフォームがブロックの**外側**に自動でラップを追加します。

- **参照:** `.cursor/skills/building-blocks/resources/css-guidelines.md`  
  - 「**Special note on `-wrapper` and `-container` classes**」に記載あり。  
  - **プラットフォームが `.{block-name}-wrapper` と `.{block-name}-container` の div をブロックの外側に自動追加する**と定義されています。  
  - 例: Cards ブロック → `div.cards-wrapper`（と `div.cards-container`）が外側に付く。
- **スコープ:** 同スキルでは「**セレクタは必ず `main .{block-name}` で始める**」とあります。このリポジトリのブロック CSS（`blocks/*/*.css`）と `styles/marubeni-theme.css` の Cards 部分は、このルールに合わせて `main .cards` / `main .cards-wrapper` などでスコープしています。
- ブロック**内側**の構造（例: Cards の `ul` / `li` / `.cards-card-image`）は、各ブロックの `blocks/<name>/<name>.js` の decorate で決まります。`component-definition.json` は Universal Editor 用のコンポーネント名・リソースタイプなどで、**HTML のラップ構造は定義していません**。

### 2.2 Cards が「同じまま」の場合（DOM の確認）

丸紅テーマは、**ローカル**では `div.cards > ul > li`、**Author** ではプラットフォームのラップも含めた複数パターンを想定してスタイルを当てています。

**確認手順:**

1. Author で該当ページを開き、**開発者ツール**（F12）→ **Elements（要素）** を開く。
2. 画面上の「Cards」のエリアを **右クリック → 検証** で選択する。
3. 要素ツリーで、Cards の親が次のどれか確認する。
   - **`<div class="cards-wrapper">` の直下に `<ul>` → `<li>`**（`div.cards` なし）  
     → プラットフォームのラップのみ。このプロジェクトでは `.cards-wrapper > ul > li` にスタイルを当てています。
   - **`<div class="cards-wrapper">` の内側に `<div class="cards block">` → `<ul>` → `<li>`**  
     → ラップ＋ブロック div。`.cards-wrapper .cards` にもスタイルを当てています。
   - **`<div class="block cards">` の直下に `<ul>` → `<li>`**（ラップなし）  
     → ローカルプレビューと同じ。push と Code Sync 後は丸紅テーマが当たります。
   - **別のクラス名（例: `cmp-list` など）や構造**  
     → AEM の別コンポーネントの可能性があります。Universal Editor で「Cards」をこのリポジトリのブロックとして配置し直す必要がある場合があります。

リポジトリ側では、`blocks/cards/cards.css` でテーマ変数を使い、`styles/marubeni-theme.css` で上記の各パターンに色・フォントを指定しています。変更を push して Code Sync 後に再度プレビューしてください。

## 3. 読み込まれない場合（404 など）

**考えられる原因と対処:**

| 原因 | 対処 |
|------|------|
| **Code Sync がまだ実行されていない / 失敗している** | GitHub に push したあと、AEM Code Sync がそのリポジトリを同期しているか確認する。同期が成功していないと、Author が参照するコードに `head.html` や `styles/marubeni-theme.css` が含まれない。 |
| **参照ブランチが違う** | `fstab.yaml` の Franklin 配信 URL が指しているブランチ（例: `main`）に、最新の `head.html` と `styles/marubeni-theme.css` が含まれているか確認する。 |
| **head がリポジトリの head.html になっていない** | 配信設定で、ページの head がこのプロジェクトの `head.html` を参照しているか確認する。`head.html` に `<link rel="stylesheet" href="/styles/marubeni-theme.css"/>` が含まれている必要がある。 |

**リポジトリ側の確認:**

- 最新の `head.html` に次の行があるか確認する。  
  `<link rel="stylesheet" href="/styles/marubeni-theme.css"/>`
- `styles/marubeni-theme.css` がリポジトリに存在し、同じブランチに push されているか確認する。

## 4. ローカルでは効くが Author では効かない場合

- ローカルは `npm run preview:import` などで **このリポジトリの静的ファイル** をそのまま配信している。
- Author のプレビューは **Franklin 配信**（`fstab.yaml` の URL）経由で、**AEM とリポジトリを組み合わせた結果**を表示している。
- そのため、「リポジトリのどのブランチを配信が参照しているか」「Code Sync でそのブランチが AEM に反映されているか」の両方を確認する必要がある。

## 5. セクションの「Style」が「なし」の場合

Author のプロパティで **Section の Style: なし** のままでも、**ページ全体**には `head.html` で読み込んだ `styles.css` と `marubeni-theme.css` が当たります。  
セクションの「Style」は、セクション単位の背景やレイアウト用です。丸紅の**基本の色・フォント**は、`marubeni-theme.css` の `:root` と `styles.css` の body/見出し/リンクで適用されるため、「なし」のままで問題ありません。

---

上記でも解消しない場合は、開発者ツールの Network で `styles.css` と `marubeni-theme.css` の **リクエスト URL** と **ステータスコード** を確認し、配信のベース URL やパスのずれがないか確認すると原因を切り分けやすくなります。
