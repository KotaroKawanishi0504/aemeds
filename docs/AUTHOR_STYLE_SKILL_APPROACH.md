# Skill に基づくスタイル適用の考え方（Editor / Preview）

Author の Editor モードと Preview モードでタグ構造が変わる可能性がある中で、**building-blocks スキルで定義されている情報だけを頼りに**スタイルを当てるための方針です。

---

## 1. Skill で保証されていること

`.cursor/skills/building-blocks/resources/css-guidelines.md` より:

| 内容 | 意味 |
|------|------|
| **プラットフォームが `.{block-name}-wrapper` と `.{block-name}-container` をブロックの外側に追加する** | Cards なら **`.cards-wrapper`** は常に「ブロックの外側」に存在する。Editor / Preview どちらでもここは変えない。 |
| **セレクタは `main .{block-name}` で始める** | ブロック本体はクラス **`.cards`**（および `block`）を持つ要素。スタイルのスコープは **`.cards`** と **`.cards-wrapper`** を基準にするのが正しい。 |

つまり **「どのモードでも使ってよい」とみなせるのは次の2つです。**

- **`.cards-wrapper`** … プラットフォームが付与（ブロックの外側）
- **`.cards`**（`div.cards.block`）… ブロック本体

**ブロックの中身**（`ul` / `li` / `.cards-card-image` など）は、このプロジェクトの `blocks/cards/cards.js` の decorate で決まります。Author の配信が ** decorate 済みの HTML** を返すなら同じ構造になり、**生のドキュメント**だけ返すと構造が変わる可能性があります。

---

## 2. このリポジトリでのアプローチ

Skill の「保証されているもの」だけを前提にしつつ、**実際の DOM のバリエーション**に対応するため、次のようにしています。

1. **基準にするクラス**  
   - `.cards-wrapper`（プラットフォーム）  
   - `.cards`（ブロック本体）  
   → Skill で定義されたラップとブロック名のみを頼りにする。

2. **main の有無**  
   - Skill は `main .{block-name}` を推奨。  
   - Author のプレビューでは `main` が無いことがあるため、**`main` あり・なしの両方**のセレクタを用意している（例: `main .cards-wrapper .cards > ul > li` と `.cards-wrapper .cards > ul > li`）。

3. **wrapper 直下の構造**  
   - Editor では `.cards-wrapper` の直下が **`div`（.cards.block）** で、その中が `ul > li`。  
   - 場合によっては直下が `ul` のこともある。  
   → 両方に当たるように、次のようなセレクタを併用している。  
   - `.cards-wrapper .cards > ul > li`（ブロック直下が ul）  
   - `.cards-wrapper > div > ul > li`（wrapper 直下が div、その中が ul）

**結論:** 「見ている Class」は **Skill で定義された `.cards-wrapper` と `.cards`** を軸にしており、Editor / Preview の違いは **main の有無**と **wrapper 直下が div か ul か**のフォールバックで吸収する形にしています。

---

## 3. セレクタは合っているのにスタイルが変わらない場合（最重要）

**「3 にはなったがスタイルは変わらない」** 場合は、**プレビュー用の document（多くの場合 iframe 内）に、私たちの CSS が読み込まれていない**可能性が高いです。

- セレクタがマッチしている（例: `$0.ownerDocument.querySelectorAll('.cards-wrapper > div > ul > li').length === 3`）＝ **DOM は想定どおり**。
- その document に **`marubeni-theme.css` や `cards.css` が読み込まれていない**と、スタイルは一切当たりません。

### 確認手順（プレビュー側の document で CSS が読まれているか）

1. **Elements** で、**プレビュー内の Cards の要素**（例: カードの画像やテキスト）をクリックして選択する。
2. **Styles** パネルで、その要素に適用されている **スタイルの出どころ（ファイル名）** を確認する。
   - **`marubeni-theme.css`** や **`blocks/cards/cards.css`**（または同じ内容の URL）が一覧に **無い**  
     → **原因: その document には私たちの CSS が読み込まれていない。**
3. **Network** タブで、**対象がプレビュー用の frame** になっているか確認する。
   - 上部の **Frame** ドロップダウンで、プレビュー用の iframe（jp.html など）を選ぶ。
   - フィルタで `marubeni-theme` や `cards.css` を検索し、**その frame のリクエストとして** 200 で読み込まれているかを見る。
   - 一覧に無い、または 404 → プレビュー用 HTML の `<head>` に私たちの CSS への `<link>` が含まれていない、または配信 URL が違う。

### 対処の方向性

- **プレビュー用の HTML が、このリポジトリの `head.html`（および block 用 CSS の読み込み）を含んだ形で返っているか** を確認する。
- AEM / Franklin の「プレビュー用 URL」が、**full page（head + body）** を返す設定になっているか、**body フラグメントだけ**を返していないかを確認する。
- プレビューが **別オリジン** になっている場合、配信側で CORS や参照先 URL が正しいかも確認する。

### CSS は読まれているがスタイルが当たらない場合（詳細度で負けている）

プレビュー用 document の `styleSheets` に `marubeni-theme.css` と `cards.css` が含まれているのに見た目が変わらない場合は、**読み込み順で後に来るスタイル**（例: `lazy-styles.css` や AEM の `ib.lc-....min.css`）に同じプロパティが上書きされている可能性があります。このリポジトリでは、Author 向けのセレクタで **詳細度を上げて** 後続のスタイルより優先されるようにしています（例: `.cards-wrapper.cards-wrapper > div > ul > li`）。push と Code Sync 後にハードリロードして確認してください。

---

## 4. まとめ

| 観点 | 対応 |
|------|------|
| **どの Class を見るか** | Skill どおり **`.cards-wrapper`** と **`.cards`** を基準にする。妥当。 |
| **Editor と Preview の違い** | main の有無と「wrapper 直下が div か ul か」の違いを、複数セレクタで吸収している。 |
| **スタイルがまだ当たらない** | セレクタがマッチしているなら、**プレビュー用 document に CSS が読み込まれているか** を上記手順で確認する。読み込まれていなければ、配信・プレビュー設定側の対応が必要。 |
