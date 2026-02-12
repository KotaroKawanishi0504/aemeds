# Author でスタイルが当たらないときの原因切り分け

Push・ハードリロードしても見た目が変わらない場合、**次の3点を順に確認**してください。DevTools は F12 で開き、対象ページは Author のプレビュー（jp.html 等）を開いた状態にします。

---

## 1. コンテンツは `<main>` の中にあるか（最重要）

ブロックの CSS は `main .cards-wrapper` のように **`main` を前提**にしています。Author のキャンバスで配信される HTML に `<main>` が無いと、すべてのブロックスタイルが**一切マッチしません**。

**確認（DevTools の Console で実行）:**

```js
document.querySelector('main')
```

- **`<main>...</main>` が表示される** → main はある。次の「2」へ。
- **`null`** → **原因: main が無い。** このリポジトリでは、main が無い環境（AEM Author キャンバスなど）向けに、`main` を付けないフォールバックセレクタ（例: `.cards-wrapper > ul > li`）を `blocks/cards/cards.css` と `styles/marubeni-theme.css` に追加済みです。push と Code Sync 後に再度ハードリロードし、まだ当たらない場合は「2」「3」を確認してください。

---

## 2. 読み込んでいる CSS の URL は正しいか

Author が参照している CSS が**このリポジトリの最新**か、別ブランチ・キャッシュで古いものになっていないかを確認します。

**確認手順:**

1. DevTools の **Network** タブを開く。
2. フィルタに `marubeni-theme` または `cards` と入れる。
3. `marubeni-theme.css` および `cards.css` をクリックし、**Request URL**（とできれば **Response Headers** の `last-modified` や `etag`）を確認する。

- **Request URL** が想定している配信元（例: あなたの GitHub Pages / Franklin の URL）と一致しているか。
- 一致していない、または 404 になっている → **原因: 配信設定・Code Sync・ブランチのどれかがずれている。** `AUTHOR_STYLE_TROUBLESHOOTING.md` の「3. 読み込まれない場合」を確認してください。

---

## 3. セレクタは実際の DOM にマッチしているか

「1」で main が無いことが分かった場合、`main .cards-wrapper` は**どの環境でもマッチしない**ので、スタイルは当たりません。

**確認（DevTools の Console で実行）:**

```js
// main ありの場合にマッチする数（main が無いと 0）
document.querySelectorAll('main .cards-wrapper > ul > li').length

// main なしでもマッチするセレクタの数（フォールバック追加後は 3 など）
document.querySelectorAll('.cards-wrapper > ul > li').length
```

- 1つ目の結果が **0** で、2つ目が **0 より大きい** → **原因: DOM に main が無い。** フォールバック（`main` を付けないセレクタ）が CSS に含まれていれば、2つ目は 0 より大きくなり、その要素にスタイルが当たります。
- 両方 0 → Cards ブロックの DOM が `.cards-wrapper > ul > li` ではない可能性があります。**プレビュー側の document**（Elements で Cards を選んでから `$0.ownerDocument`）で `.cards-wrapper > div > ul > li` を試してください。1 以上なら、リポジトリでその構造用のセレクタ（`.cards-wrapper > div > ul > li`）を追加済みなので、push と Code Sync 後に反映されます。

---

## まとめ（原因と対処）

| 確認結果 | 想定原因 | 対処 |
|----------|----------|------|
| `document.querySelector('main')` が null | Author の HTML に `<main>` が無い | CSS に `.cards-wrapper …` など main なしのフォールバックを追加する（本リポジトリで対応済みの場合は push と Code Sync を再確認） |
| marubeni-theme.css / cards.css の URL が違う・404 | 配信元・ブランチ・Code Sync のずれ | `fstab.yaml`・配信設定・Code Sync のログを確認 |
| セレクタのマッチ数が 0 | DOM 構造が想定と違う、または main なしでフォールバックも無い | 上記の両方に対応 |

まず **「1. main の有無」** を必ず確認してください。ここで null なら、それ以降の修正（例: フォールバック追加）が効いているかどうかも、push 後に再度「1」と「3」で確認するとよいです。
