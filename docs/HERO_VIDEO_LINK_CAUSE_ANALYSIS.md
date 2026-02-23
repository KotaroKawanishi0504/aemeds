# Hero Video リンク非表示の原因分析

## 原因（ブラウザ取得ソースで確定）

AEM が出力する Hero Video ブロックの HTML では、**4 行目（Link label）のセルが空**だった。

```html
<div class="hero-video">
  <div><div><a href="...video.mp4">...</a></div></div>   <!-- 1: Video -->
  <div><div><picture>...</picture></div></div>           <!-- 2: Poster -->
  <div><div><a href="https://www.marubeni.com/jp/brand_media/scope/smartestenergy2/">...</a></div></div>  <!-- 3: Link URL ✓ -->
  <div><div></div></div>   <!-- 4: Link label → 空 -->
</div>
```

- 行 3 からは **linkUrl** が取れる（`getVal(rows[2], true)` で `<a href>` を取得）。
- 行 4 は **中身が空**のため `rows[3].textContent` が `''` となり、**linkLabel** が空のまま。
- コードは `if (linkUrl && linkLabel)` のときだけリンクを生成するため、**linkLabel が空だとリンクが作られない**。

**結論:** AEM が「Link label」の値を HTML の 4 行目に出力していない（またはオーサリング値が反映されていない）。  
**対応:** linkUrl のみある場合はラベルを `"More"` にフォールバックするようにブロックを修正済み。根本対応は AEM 側で Link label を 4 行目に出力すること。

---

## 以下は分析の前提メモ（参考）

---

## 1. ブロックがリンクを出す条件

`hero-video.js` では次の両方が満たされたときだけ `.hero-video-link` を生成する。

```javascript
if (linkUrl && linkLabel) {
  // リンク要素を作成
}
```

- **linkUrl**: `config.link` または `config['link-url']` から取得（67行目）
- **linkLabel**: `config.linkLabel` または `config['link-label']` または `config.linklabel` から取得（68行目）

`config` は **readBlockConfig(block)** の戻り値。  
`aem.js` の readBlockConfig は **ブロック直下の `div`（行）** を走査し、**各行の 1 列目を toClassName したキー**、**2 列目を値** として config に詰める。

---

## 2. linkUrl / linkLabel がどこから入るか

- **config から（67–68行目）**  
  - ブロックの「テーブル」が readBlockConfig でパースされ、  
    - 1 列目が "Link URL" → `config['link-url']`  
    - 1 列目が "Link label" → `config['link-label']`  
    - 1 列目が "link" → `config.link`  
    - 1 列目が "linkLabel" → `config.linklabel`  
  になる想定。いずれもコード側で参照済み。

- **行フォールバック（78–93行目）**  
  - こちらが動くのは **videoUrl または posterUrl がまだ無いときだけ**。  
  - その場合のみ `block.querySelectorAll(':scope > div')` で行を取得し、  
    - rows[2] から linkUrl  
    - rows[3] から linkLabel  
  を補完する。  
  - **video と poster がすでに config から取れていると、このブロックには一切入らない。**

つまり、**video / poster が config に入っていると、リンク用の値は config にしか依存しない**。

---

## 3. 想定される原因（AEM の HTML 構造）

### 3.1 ブロックに「Link URL」「Link label」の行が無い

- AEM がヒーロー動画ブロックを出力するとき、  
  **Video (900px+)** と **Poster image (<900px)** の行だけ出力し、  
  **Link URL** と **Link label** の行を HTML に含めていない**可能性が高い。
- その場合、readBlockConfig の結果に `link` / `link-url` / `link-label` / `linklabel` が一切入らず、linkUrl または linkLabel が空のまま → リンクは作られない。
- モデル（`_hero-video.json`）では `name: "link"`, `name: "linkLabel"` と `label: "Link URL"`, `label: "Link label"` が定義されているが、**AEM のレンダリング（ブロック → HTML）が「リンク用の 2 行」を出力していない**と、フロントの修正だけでは解決しない。

### 3.2 行はあるが 1 列目の文字列が想定と違う

- 1 列目が "Link URL" / "Link label" でも "link" / "linkLabel" でも、現状のコードはすべてカバーしている。
- 別の文言（例: "リンクURL" や "Link URL " など）だと toClassName の結果が変わり、config のキーがずれる可能性はあるが、通常はラベルか name のどちらかで出る想定。

### 3.3 2 列目の値が空

- オーサリングでは「Link URL」「Link label」を入力していても、  
  出力 HTML の 2 列目が空だと、config にはキーはあっても値が空 → linkUrl または linkLabel が空 → リンクは作られない。

---

## 4. 結論と次のアクション

| 想定原因 | 内容 |
|----------|------|
| **最もありそうなもの** | AEM がブロックの HTML に **Link URL / Link label の 2 行を出力していない**（video / poster の 2 行だけ）。そのため readBlockConfig に link 系のキーが入らず、リンクが作られない。 |
| 次点 | 行はあるが 2 列目が空、または 1 列目の文言が想定外で config のキーがずれている。 |

**推奨アクション:**

1. **AEM のブロック HTML を取得する**  
   - `npm run get-aem-html` を実行し、ログイン → Enter で保存。  
   - **注意:** この時点ではすでに decorate 済みのため、保存されるのは **decorate 後**の HTML（`.hero-video-media` や `.hero-video-link` の有無は分かるが、**元のテーブル構造は消えている**）。
2. **decorate 前の config を確認する**  
   - `blocks/hero-video/hero-video.js` の decorate 内、`block.textContent = ''` の直前に次を一時追加する:  
     `console.log('hero-video config', JSON.stringify(config));`  
   - AEM プレビューでページを開き、コンソールに出力された config を確認する。  
   - ここに `link` / `link-url` や `linkLabel` / `link-label` / `linklabel` が **無い** → AEM がブロックにリンク用の行を出していない（または別のキーで出している）。
3. **AEM 側の確認**  
   - Universal Editor やブロックテンプレートで、Hero Video の「Link URL」「Link label」が **HTML のブロックテーブル（div の行）に出力されるか**を確認する。  
   - 出ていない場合は、AEM のコンポーネント定義・テンプレート・BYOM 等で「リンク用の 2 行をマークアップに含める」ようにする必要がある。

---

## 5. 参考: readBlockConfig が期待するブロック構造

```
<div class="hero-video block">
  <div>  <!-- 行1 -->
    <div>Video (900px+)</div>
    <div><a href="...">またはテキスト</a></div>
  </div>
  <div>  <!-- 行2 -->
    <div>Poster image (<900px)</div>
    <div>...</div>
  </div>
  <div>  <!-- 行3: 必須でないとリンクが出ない -->
    <div>Link URL</div>   <!-- または "link" -->
    <div><a href="...">またはURL文字列</a></div>
  </div>
  <div>  <!-- 行4: 必須でないとリンクが出ない -->
    <div>Link label</div> <!-- または "linkLabel" -->
    <div>#44 | SmartestEnergy</div>
  </div>
</div>
```

AEM が上記の **行3・行4 を出力していない**場合、フロントの修正だけではリンクは表示されない。
