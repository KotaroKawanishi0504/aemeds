# ナビ：AEM の HTML 構造とローカル HTML の対応

## 結論

**header.js は AEM の 2 つのオーサリングパターンを想定しています。** ローカル `nav.plain.html` は、どちらのパターンでも動くように設計されていますが、**メガメニュー（全幅パネル）を出すには「複数ブロック」パターン**が必要です。

---

## AEM の想定構造（header.js のコメントより）

`blocks/header/header.js` の `normalizeNavSectionsFromBlocks` には次のコメントがあります：

> Nav authoring: **same section has multiple blocks** — each Text block (ul) = one first-level item; Image block(s) immediately after a Text block = images for that item's dropdown.

つまり、**1 セクション内に複数ブロック**がある場合を想定しています。

---

## 2 つのオーサリングパターン

| パターン | AEM の構成 | .plain.html の構造 | 結果 |
|----------|------------|---------------------|------|
| **単一ブロック** | 1 つの List/Table ブロック | 1 つの `ul`（ネストした `ul` あり） | シンプルドロップダウン（560px 幅） |
| **複数ブロック** | トップ項目ごとに List/Table ブロック | 複数の `ul`（各 `ul` に 1 トップ項目） | メガメニューパネル（全幅・4列） |

### パターン 1：単一ブロック（NAV_AND_FOOTER_SETUP.md の例）

```html
<div>
  <ul>
    <li><a href="/jp/company/">会社情報</a></li>
    <li>
      <a href="/jp/news/">ニュース</a>
      <ul>
        <li><a href="/jp/news/release/">リリース</a></li>
        <li><a href="/jp/news/info/">お知らせ</a></li>
      </ul>
    </li>
  </ul>
</div>
```

- `decorateSections` → `default-content-wrapper` の子は 1 つ（`ul`）
- `normalizeNavSectionsFromBlocks` は **実行されない**（`children.length <= 1`）
- ネストした `ul` がそのまま使われ、シンプルドロップダウンになる

### パターン 2：複数ブロック（メガメニュー用）

```html
<div>
  <ul>
    <li>
      <a href="/jp/company/">会社情報</a>
      <ul>
        <li><a href="/jp/company/">会社情報トップ</a></li>
        <li><a href="/jp/company/history/">沿革</a></li>
        <!-- ... -->
      </ul>
    </li>
  </ul>
  <ul>
    <li>
      <a href="/jp/news/">ニュース</a>
      <ul>...</ul>
    </li>
  </ul>
  <ul><li><a href="/jp/ir/">IR投資家情報</a></li></ul>
  <!-- 1 トップ項目 = 1 ul -->
</div>
```

- `decorateSections` → `default-content-wrapper` の子は複数（`ul`, `ul`, `ul`, ...）
- `normalizeNavSectionsFromBlocks` が **実行される**
- `.nav-dropdown-panel` が生成され、メガメニューになる

---

## ローカル nav.plain.html の設計

| 項目 | 対応 |
|------|------|
| 構造 | 上記「複数ブロック」パターンで作成（メガメニュー表示用） |
| 根拠 | `header.js` の `normalizeNavSectionsFromBlocks` の仕様 |
| AEM との整合 | AEM が「1 トップ項目 = 1 ブロック」で出力する場合と一致 |

---

## 動作確認の推奨

AEM の実際の出力を確認するには、次の URL をブラウザで開き、**本文部分の HTML 構造**を確認してください。

```
https://{AEMオーサー}/content/marubeni/jp/nav.plain.html
```

- **1 つの `ul` のみ** → 単一ブロックパターン（シンプルドロップダウン）
- **複数の `ul` が並ぶ** → 複数ブロックパターン（メガメニュー）

ローカル `nav.plain.html` は、この AEM の出力構造に合わせて調整してください。
