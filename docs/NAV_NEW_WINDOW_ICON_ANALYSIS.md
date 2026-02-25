# ナビ「別Windowで開く」アイコン非表示の原因分析

## 1. 現状の仕様

- **トリガー**: リンクの表示テキスト末尾に `|NewWindow` を付ける（例: `丸紅経済研究所|NewWindow`）
- **処理**: `applyNewWindowToLink()` が `data-open-in-new-window="true"` を付与し、テキストを `<span class="nav-link-label">` または `<span class="nav-dropdown-link-label">` でラップ
- **アイコン**: CSS の `::after` で Ben フォント `\e901` を表示

## 2. 想定される原因（優先度順）

### 2.1 【最有力】ナビコンテンツに `|NewWindow` が含まれていない

**現状**: `nav.plain.html` を確認すると、**すべてのリンクに `|NewWindow` が付いていない**。

```
例: <a href="/jp/mri/">丸紅経済研究所</a>  ← このままで、|NewWindow なし
```

アイコンが表示されるには、リンクテキストが `丸紅経済研究所|NewWindow` のように末尾に `|NewWindow` を付ける必要がある。

**確認方法**:
- 使用中の nav フラグメント（`/nav.plain.html` または AEM の nav ページ）のソースを確認
- 別ウィンドウで開くリンクに `|NewWindow` が付いているか確認

**対応**: 該当リンクの**表示テキスト末尾**に `|NewWindow` を追加する。

---

### 2.2 本家（marubeni.com）との仕様の違い

**本家の動作**: リンクに `target="_blank"` が付いている場合にアイコンを表示。`data-link-label` の span の `::after` で描画。

**EDS の実装**: `|NewWindow` サフィックスのみをトリガーとする。`target="_blank"` だけではアイコンは表示されない。

**想定**: AEM で「別ウィンドウで開く」チェックボックスをオンにすると、HTML に `target="_blank"` が出力される可能性がある。その場合、現行の EDS 実装ではアイコンが表示されない。

**対応案**: `target="_blank"` を持つリンクにもアイコンを表示するよう、JS と CSS を拡張する。

---

### 2.3 ナビ構造（単一ブロック vs 複数ブロック）の違い

| パターン | default-content-wrapper の子 | normalizeNavSectionsFromBlocks | processAllNavLinksForNewWindow |
|----------|------------------------------|--------------------------------|--------------------------------|
| **単一ブロック** | 1 つ（div > ul） | 実行されない（早期 return） | 実行される |
| **複数ブロック** | 複数（ul, ul, ul...） | 実行される | 既処理のためスキップ |

**現状の nav.plain.html**: 各セクションが独立した div のため、nav-sections には 1 セクション分のみが入る。結果として**単一ブロック相当**になり、`processAllNavLinksForNewWindow` が処理を担当する。

**確認**: `processAllNavLinksForNewWindow` は `wrapper.querySelectorAll('a[href]')` で全リンクを走査するため、単一ブロックでもリンクは取得できる。問題は「`|NewWindow` を持つリンクが存在するか」である。

---

### 2.4 Ben フォントの読み込み

アイコンは Ben フォントの `\e901` で描画される。フォントが読み込まれていないと、文字化けまたは非表示になる。

**確認方法** (DevTools):
1. Elements で `data-open-in-new-window="true"` のリンクを選択
2. Computed で `.nav-link-label::after` の `font-family` が `Ben` か確認
3. Network で `ben.woff` が 200 で読み込まれているか確認

**参照**: `marubeni-theme.css` の `@font-face` で Ben を定義。

---

### 2.5 CSS の詳細度・上書き

`marubeni-theme.css` の以下が `header nav a` に `font-size: !important` を指定している:

```css
header nav a,
header nav .nav-sections .default-content-wrapper > ul > li > a,
...
{
  font-size: calc(var(--rem, 10) * 1.5 * 1px) !important;
}
```

`::after` 疑似要素は別要素のため、この指定が直接アイコンを消す可能性は低い。ただし、親の `font-size` が 0 や極端に小さい場合は影響する可能性がある。

---

### 2.6 DOM 構造の不一致

アイコン用 CSS セレクタ:

- トップレベル: `header nav .nav-sections .default-content-wrapper > ul > li > a[data-open-in-new-window='true'] .nav-link-label::after`
- ドロップダウン（単一ブロック）: `... > ul > li > ul > li > a[data-open-in-new-window='true'] .nav-dropdown-link-label::after`
- ドロップダウン（メガメニュー）: `... .nav-dropdown-list .nav-dropdown-link[data-open-in-new-window='true'] .nav-dropdown-link-label::after`

AEM やフラグメントの構造が上記と異なる場合、セレクタがマッチしない。

**確認方法** (DevTools):
1. `data-open-in-new-window="true"` のリンクが存在するか
2. そのリンク内に `.nav-link-label` または `.nav-dropdown-link-label` の span があるか
3. 該当 span の Computed で `::after` の `content` が `'\e901'` か

---

## 3. 診断手順（推奨）

### Step 1: コンテンツ確認

1. ブラウザで `/nav.plain.html` を開き、ソースを表示
2. 別ウィンドウで開くべきリンクに `|NewWindow` が付いているか確認
3. 付いていなければ、該当リンクのテキスト末尾に `|NewWindow` を追加して再テスト

### Step 2: DOM 確認（DevTools）

1. ページを開き、ヘッダーのナビを表示
2. `document.querySelectorAll('a[data-open-in-new-window="true"]')` を実行
3. 結果が 0 件 → `|NewWindow` の付いたリンクがないか、JS が処理していない
4. 結果が 1 件以上 → その要素を選択し、子に `.nav-link-label` または `.nav-dropdown-link-label` があるか確認

### Step 3: CSS 確認

1. 上記リンク内の span を選択
2. Styles パネルで `::after` のルールが適用されているか確認
3. Computed で `content`, `font-family`, `display`, `font-size` を確認

### Step 4: フォント確認

1. Network で `ben.woff` を検索
2. ステータスが 200 か、404 になっていないか確認

---

## 4. テスト用の nav.plain.html 修正例

`|NewWindow` の動作確認のため、1 件だけサフィックスを付与してテストする例:

```html
<!-- 例: 丸紅経済研究所を別ウィンドウで開く場合 -->
<li>
  <a href="/jp/mri/">丸紅経済研究所|NewWindow</a>
  <ul>
    <li><a href="/jp/mri/">丸紅経済研究所トップ</a></li>
  </ul>
</li>
```

この状態で PC・モバイル両方でアイコンが表示されるか確認する。

---

## 5. 実施した修正（2025-02）

### 5.1 原因の特定

- **欠損タイミング**: ナビフラグメント読み込み後、`normalizeNavSectionsFromBlocks` / `processAllNavLinksForNewWindow` 実行時に、リンクに `|NewWindow` も `target="_blank"` もないため、`data-open-in-new-window` が付与されず、アイコン用の label span も作成されない。
- **トリガー不足**: AEM で「別ウィンドウで開く」をオンにすると `target="_blank"` が出力されるが、EDS は `|NewWindow` サフィックスのみをトリガーとしていた。

### 5.2 修正内容

- **header.js**: `target="_blank"` を持つリンクにも `applyNewWindowToLink()` を適用するよう拡張。
  - `normalizeNavSectionsFromBlocks`: トップレベル・ドロップダウン両方で `a.getAttribute('target') === '_blank'` をチェック。
  - `processAllNavLinksForNewWindow`: 同様に `target="_blank"` をトリガーに追加。
- **nav.plain.html**: 外部リンク（サステナビリティ）に `target="_blank"` を追加し、動作確認用にアイコン表示を有効化。

### 5.3 今後のトリガー

| トリガー | アイコン表示 |
|----------|--------------|
| リンクテキスト末尾の NewWindow サフィックス | ○ |
| リンクの target="_blank" 属性 | ○ |

---

## 6. 次のアクション候補（参考）

| 優先度 | アクション |
|--------|------------|
| 1 | nav コンテンツに NewWindow サフィックスが含まれているか確認 |
| 2 | ~~`target="_blank"` を持つリンクにもアイコンを表示するよう拡張を検討~~ → **実施済み** |
| 3 | DevTools で DOM・CSS・フォントを上記手順で確認し、原因を特定 |
