# AEM で Cards のスタイルが直らない原因調査

対象 URL: `https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni/jp.html`

## 想定される原因（優先度順）

### 1. **cards.css が AEM プレビューに読み込まれていない（最有力）**

- **EDS 標準:** block CSS は head に載せず、**aem.js の `loadBlock()` が実行されたときだけ** 動的に `loadCSS(.../blocks/cards/cards.css)` で読み込む。
- **head.html** には `styles.css` と `marubeni-theme.css` のみ（block CSS は含めない）。
- AEM Author のプレビューでは次のどれかで **cards.css が一度も読み込まれていない** 可能性が高いです。
  - **&lt;main&gt; が無く** `loadSections(main)` が実行されず、従来は `loadBlock` が呼ばれていなかった（本リポジトリでは main が無いときに **loadOrphanBlocks** で `div.cards` を検出し loadBlock するフォールバックを追加済み）。
  - プレビュー用 document で scripts.js / aem.js が動いていない、または別バンドルになっている
  - `window.hlx.codeBasePath` が空や別パスになっており、`blocks/cards/cards.css` の URL が **404** になっている

**結果:** アイコン縦揃え・ホバー下線は **すべて cards.css 側のルール** のため、cards.css が読まれていなければ **一切反映されない**。

---

### 2. プレビューが iframe で、その document に私たちの CSS が無い

- Author の「プレビュー」が **iframe 内の別 document** の場合、親ページではなく **iframe の中の head** に link が入る。
- 配信や Code Sync の設定で、**プレビュー用 HTML** の head に `head.html` の内容が入っておらず、かつ scripts が動いていないと、iframe 内では loadBlock も動かず cards.css が読み込まれない。

---

### 3. DOM 構造が想定と違う（セレクタがマッチしていない）

- スタイルは `.cards-wrapper` / `.cards` / `.cards-card-body` などを前提にしている。
- AEM 側で **別コンポーネント**（例: コアコンポーネントの List など）で出力されていると、クラス名が `cmp-list` など別になり、私たちのセレクタは一切マッチしない。

---

### 4. 他のスタイルが詳細度・読み込み順で上書きしている

- cards.css は読み込まれているが、**その後に読み込まれる AEM のスタイル**（例: `ib.lc-....min.css` や lazy-styles）に同じプロパティが上書きされている可能性。
- こちらでは `!important` を付与済みだが、**cards.css 自体が読まれていなければ** 効果なし。

---

## 確認手順（AEM ページで DevTools を開いた状態で実行）

ログインし、**jp.html のプレビューを表示した状態**で、以下を順に実行してください。

### Step 1: main の有無

```js
document.querySelector('main')
```

- **null** → この document には `<main>` がない（フォールバック用セレクタで当たる想定）。
- 要素が返る → main はある。

### Step 2: Cards ブロックの DOM が私たちの想定どおりか

```js
// いずれかが 1 以上なら、想定どおりの Cards ブロックがある
document.querySelectorAll('.cards-wrapper > ul > li').length
document.querySelectorAll('.cards-wrapper > div > ul > li').length
document.querySelectorAll('.cards-wrapper .cards .cards-card-body').length
```

- **すべて 0** → 別コンポーネントか別構造。Universal Editor で「Cards」ブロックがこのリポジトリのブロックとして配置されているか確認する。

### Step 3: プレビュー用 document のスタイルシート一覧（最重要）

**プレビュー内の Cards の要素**（例: 「会社概要」のテキスト）を **Elements で選択** してから、Console で:

```js
Array.from($0.ownerDocument.styleSheets).map(s => s.href).filter(Boolean)
```

- **`cards.css` または `blocks/cards/cards.css` に相当する URL が一覧に無い**  
  → **原因: この document に cards.css が読み込まれていない。**  
  → 対処: 下記「推奨対処」のとおり **loadBlock が動く条件**（main または orphan フォールバック、codeBasePath・配信）を確認する。

### Step 4: codeBasePath と cards.css のリクエスト

Console で:

```js
window.hlx && window.hlx.codeBasePath
```

- 空や undefined → スクリプトの読み込み元によっては block CSS の URL が正しく組めていない可能性。

**Network タブ:**

- フィルタに `cards.css` と入れる。
- **Frame** を「プレビュー用の frame」（jp.html など）に切り替えて確認。
- `cards.css` が **一覧に無い** または **404** → cards.css はこの document に読み込まれていない。

### Step 5: 適用されているスタイルの出どころ

**Elements** で「会社概要」などのリンク（`a`）を選択し、**Styles** パネルで:

- `marubeni-theme.css` や `cards.css` が **一切表示されていない**  
  → その document には私たちの CSS が読み込まれていない、またはセレクタがマッチしていない。

---

## 推奨対処（EDS 標準: block CSS は loadBlock のみ）

### 対処 A: loadBlock が動くようにする（本リポジトリでの対応済み）

- **main が無い環境:** `scripts/scripts.js` で **loadOrphanBlocks(doc)** を実行し、DOM 上の `div.cards` 等を検出して `decorateBlock` + `loadBlock` を呼ぶ。これで block CSS が EDS 標準どおり動的に読み込まれる。
- **codeBasePath:** `loadBlock` は `window.hlx.codeBasePath` で CSS/JS の URL を組み立てる。AEM でスクリプトの読み込み元が違うと codeBasePath が空や別パスになり、**blocks/cards/cards.css が 404** になる。DevTools の Console で `window.hlx?.codeBasePath` を確認し、Network で `cards.css` のリクエスト URL とステータスを確認する。
- まだスタイルが当たらない場合は、**配信・Code Sync** で codeBasePath から正しく `blocks/cards/cards.css` が 200 で返るようにする。

### 対処 B: 配信・プレビュー設定の確認

- Code Sync で **scripts/scripts.js** と **head.html**（styles.css, marubeni-theme.css）が AEM に反映されているか。
- プレビュー用 HTML が **head + body の full page** を返しているか（body フラグメントだけだとスクリプトが動かない）。
- プレビューが iframe の場合、**iframe 内の document** で scripts.js が実行され、loadOrphanBlocks または loadSections が動いているか確認する。

### 対処 C: DevTools で原因の切り分け

- 上記 Step 1〜5 の結果をメモし、  
  - cards.css が読み込まれているか（Step 3）  
  - codeBasePath と cards.css のリクエスト URL/ステータス（Step 4）  
  - セレクタがマッチしているか、他スタイルで上書きされていないか  
  を確認する。  
  「読み込まれていない」が解消されれば、多くの場合は見た目が直ります。

---

## まとめ

| 確認結果 | 想定原因 | 対処 |
|----------|----------|------|
| styleSheets に cards.css が無い | **loadBlock が実行されていない、または codeBasePath で 404** | loadOrphanBlocks が動くか・main の有無を確認。codeBasePath と配信 URL を確認（対処 A・B）。 |
| DOM のマッチ数が 0 | 別コンポーネント or 別構造 | Universal Editor で Cards ブロックを確認。`div.cards` が存在するか確認。 |
| cards.css はあるがスタイルが付かない | 詳細度・読み込み順で上書き | 既に !important 済み。cards.css の読み込み順を確認。 |

まず **Step 3**（プレビュー内要素の `ownerDocument.styleSheets`）で **cards.css の有無** を、**Step 4** で **codeBasePath と cards.css のリクエスト URL/ステータス** を確認することを推奨します。
