# Hero Video リンクラベルが "More" のままになる原因の特定手順

修正を入れずに、**Console や保存した HTML を使って原因だけを特定**する手順です。

---

## 前提

- リンクは表示されるが、Author が指定した「Link label」（例: `#44 | SmartestEnergy`）ではなく **"More"** と表示される。
- 原因候補: (1) AEM が渡す HTML に Link label の行が無い／空、(2) 行の順序や構造が想定と違う、(3) `readBlockConfig` のキーと合っていない。

---

## 方法: 保存した HTML を診断スクリプトで解析する（推奨・コード変更なし）

**重要:** 解析に使う HTML は **JavaScript がブロックを decorate する前**の、サーバーから返ってきた **初回のドキュメント**です。  
（decorate 後は `block.textContent = ''` で中身が消えるため、その時点の DOM では原因が分かりません。）

### 手順

1. **AEM の該当ページを開く**
   - ヒーロー動画で「Link label」に `#44 | SmartestEnergy` などを指定したページ。

2. **初回の HTML レスポンスを保存**
   - DevTools を開く (F12) → **Network** タブ。
   - ページを **再読み込み** (Ctrl+R / Cmd+R)。
   - 一覧の先頭付近にある **ドキュメント**（URL がページそのもの、Type が `document` のもの）をクリック。
   - 右側の **Response** タブで内容を確認。
   - 右クリック → **Save as...** で `aem-page.html` などに保存。  
     （または Response の内容を全選択 → コピー → テキストエディタに貼り付けて `aem-page.html` として保存。）

3. **診断スクリプトを実行**
   ```bash
   cd aemeds
   node scripts/debug-hero-video-from-html.cjs aem-page.html
   ```
   （`aem-page.html` は保存したファイルへのパス。相対パスでも絶対パスでも可。）  
   動作確認用: `scripts/sample-hero-for-debug.html` を渡すと、正しく構造がある場合の出力例が得られます。

4. **出力の見方**
   - **1) readBlockConfig(block)**  
     `config['link-label']` や `config.linklabel` に値があるか、何というキーで何が入っているか。
   - **2) Rows**  
     `rows[2]` = Link URL、`rows[3]` = Link label として使われる行。  
     各行的に「header」と「value」がどうなっているか（4 行目にラベルが入っているか）。
   - **3) Derived values**  
     ここで `linkLabel` が空なら、画面上は "More" にフォールバックされる。
   - **4) Why linkLabel might be empty**  
     スクリプトが推測する理由（config に無い／行が無い／4 行目が空など）。

この結果を共有してもらえれば、**どこをどう直すか**を、トライ＆エラーではなく特定した上で提案できます。

---

## 別案: 一時的に Console にだけログを出す（1 回だけコード変更）

HTML の保存が難しい場合は、`decorate` の**先頭**でブロックの状態を `console.log` し、**一度だけ**プレビューを開いて Console の出力をコピーする方法もあります。

1. `blocks/hero-video/hero-video.js` で、`const rows = [...block.querySelectorAll(...)].filter(...);` の行の**直後**に、次の 2 行だけ一時追加する:

   ```javascript
   console.log('hero-video DEBUG config', JSON.stringify(config, null, 2));
   console.log('hero-video DEBUG rows', rows.length, rows.map((r, i) => ({
     i, header: r.children[0]?.textContent?.trim(), value: (r.children[1]?.textContent || '').trim(),
   })));
   ```

2. 保存して AEM プレビューを再読み込みし、Console の `hero-video DEBUG config` と `hero-video DEBUG rows` の出力をコピーして保存。
3. **追加した 2 行を削除して元に戻す**（原因が分かったら消す）。

このログから、`config['link-label']` の有無と、4 行目（Link label 行）の `header` / `value` を確認できます。

---

## 次のステップ

- 診断スクリプトの出力、または Console のログを共有してもらえれば、  
  **なぜ linkLabel が空になっているか**を特定し、必要な修正（どのキーを見るか・行の取り方・AEM 側の要否）を提案します。
- トライ＆エラーでいじる前に、上記のどちらかで「実際に渡っているデータ」を一度確認することを推奨します。
