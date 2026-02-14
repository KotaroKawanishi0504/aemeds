# AEM で Cards のスタイルが直らない原因調査

対象 URL: `https://author-p159816-e1708144.adobeaemcloud.com/content/marubeni/jp.html`

## 想定される原因（優先度順）

### 1. **cards.css が AEM プレビューに読み込まれていない（最有力）**

- **head.html には `styles.css` と `marubeni-theme.css` しかない。**
- **blocks/cards/cards.css** は head に含まれておらず、**aem.js の `loadBlock()` が実行されたときだけ** 動的に `loadCSS(.../blocks/cards/cards.css)` で読み込まれる。
- AEM Author のプレビューでは次のどれかで **cards.css が一度も読み込まれていない** 可能性が高いです。
  - プレビュー用 document（iframe など）で aem.js が動いていない、または別バンドルになっている
  - `loadSection` → `loadBlock` が実行される前に表示が固定されている
  - DOM が `div.section` / `div.block` 構造になっておらず、`loadBlock(blocks[i])` が Cards に対して呼ばれていない
  - `window.hlx.codeBasePath` が空や別パスになっており、`/blocks/cards/cards.css` の URL が 404 になっている

**結果:** アイコン縦揃え・ホバー下線は **すべて cards.css 側のルール** のため、cards.css が読まれていなければ **一切反映されない**。

---

### 2. プレビューが iframe で、その document に私たちの CSS が無い

- Author の「プレビュー」が **iframe 内の別 document** の場合、親ページではなく **iframe の中の head** に link が入る。
- 配信や Code Sync の設定で、**プレビュー用 HTML** の head に `head.html` の内容（および block CSS）が入っていないと、iframe 内には cards.css も marubeni-theme.css も存在しない。

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
  → 対処: 下記「推奨対処」のとおり **head.html に cards.css を追加** する。

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

## 推奨対処

### 対処 A: head.html に cards.css を追加（推奨）

**cards.css を head から常に読み込む**ようにすると、aem.js の `loadBlock()` が動かなくても、プレビュー用 HTML で head が正しく使われていればスタイルが当たります。

- **変更:** `head.html` に  
  `<link rel="stylesheet" href="/blocks/cards/cards.css"/>`  
  を追加する（**本リポジトリでは追加済み**。Code Sync の対象に含めて push する）。
- **注意:** 配信のベース URL がルートでない場合（例: プレビューが `https://.../content/marubeni/...` で静的ファイルが `https://.../content/marubeni/blocks/...` にある場合）は、href をそのパスに合わせる必要がある場合があります。その場合は fstab や AEM のプレビュー設定・metadata でベースパスを確認してください。

### 対処 B: 配信・プレビュー設定の確認

- Code Sync で **head.html** が AEM に反映されているか。
- プレビュー用 HTML が **head.html を参照しているか**（body フラグメントだけ返していないか）。
- プレビューが iframe の場合、**iframe 内の document** の head に上記 link が含まれるようにする。

### 対処 C: DevTools で原因の切り分け

- 上記 Step 1〜5 の結果をメモし、  
  - cards.css が読み込まれているか  
  - セレクタがマッチしているか  
  - 他スタイルで上書きされていないか  
  を確認する。  
  「読み込まれていない」が解消されれば、多くの場合は見た目が直ります。

---

## まとめ

| 確認結果 | 想定原因 | 対処 |
|----------|----------|------|
| styleSheets に cards.css が無い | **cards.css がプレビュー用 document に読み込まれていない** | head.html に cards.css を追加（対処 A）。配信・Code Sync を確認。 |
| DOM のマッチ数が 0 | 別コンポーネント or 別構造 | Universal Editor で Cards ブロックを確認。 |
| cards.css はあるがスタイルが付かない | 詳細度・読み込み順で上書き | 既に !important 済み。cards.css の読み込み順を確認。 |

まず **Step 3**（プレビュー内要素の `ownerDocument.styleSheets`）で **cards.css の有無** を確認することを推奨します。
