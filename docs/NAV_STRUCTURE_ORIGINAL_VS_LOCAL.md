# ナビデザインの違い：オリジナル vs ローカル

## 原因

**はい、ローカルの HTML 構造（nav.plain.html）の問題です。**

| 項目 | オリジナル（marubeni.com / AEM） | ローカル（nav.plain.html） |
|------|----------------------------------|---------------------------|
| 構造 | 各トップ項目が**別ブロック**（ul が複数） | 1つの ul に全項目が入る |
| トリガー | `normalizeNavSectionsFromBlocks` が実行される | 実行されない（children.length <= 1） |
| 表示 | **メガメニューパネル**（.nav-dropdown-panel） | **シンプルドロップダウン**（li > ul） |
| 幅 | 全幅 fixed、4列グリッド | 中央寄せ、560px 幅、column-count: 3 |
| 見出し | 左に「会社情報」等の見出し | なし |
| 矢印 | 赤い右矢印（›） | なし |

## 必要な構造

オリジナルと同じメガメニューを表示するには、**default-content-wrapper の直下に複数の ul が並ぶ**必要があります。

**AEM の想定**: 各トップ項目が別のテーブル/リストブロック → 各ブロックが 1 つの ul になる。

**ローカル nav.plain.html の修正例**:
```html
<div>
  <ul>
    <li>
      <a href="/jp/company/">会社情報</a>
      <ul>
        <li><a href="/jp/company/">会社情報トップ</a></li>
        <li><a href="/jp/company/history/">沿革</a></li>
        <li><a href="/jp/company/locations/">国内・海外拠点</a></li>
        <li><a href="/jp/company/message/">社長メッセージ</a></li>
        <li><a href="/jp/company/governance/">コーポレート・ガバナンス</a></li>
        <li><a href="/jp/company/subsidiaries/">主要グループ会社一覧</a></li>
        <li><a href="/jp/company/philosophy/">経営理念・丸紅グループの在り姿</a></li>
        <li><a href="/jp/company/officers/">役員紹介</a></li>
        <li><a href="/jp/company/strategy/">中期経営戦略</a></li>
        <li><a href="/jp/company/overview/">会社概要</a></li>
        <li><a href="/jp/company/organization/">組織図</a></li>
      </ul>
    </li>
  </ul>
  <ul>
    <li>
      <a href="/jp/news/">ニュース</a>
      <ul>
        <li><a href="/jp/news/release/">リリース</a></li>
        <li><a href="/jp/news/info/">お知らせ</a></li>
      </ul>
    </li>
  </ul>
  <!-- 以下、事業紹介、IRなど 1 ul ずつ -->
</div>
```

このように **1 トップ項目 = 1 ul** にすると、`normalizeNavSectionsFromBlocks` が実行され、メガメニューパネル（.nav-dropdown-panel）が生成されます。
