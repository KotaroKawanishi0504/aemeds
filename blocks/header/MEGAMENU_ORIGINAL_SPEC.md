# オリジナルメニュー（marubeni.com）仕様メモ

## 1. 添付画像から取得したオリジナル仕様

### HTML 構造（オリジナル）
- **親**: `div.l-header_dropdown-content`
  - **子1**: `div.l-header_dropdown-header` … タイトル（例: 事業紹介）
  - **子2**: `div.l-header_dropdown-list` … メニューリンク
  - **子3**: `ul.l-header_dropdown-banner` … 右の画像／バナー

→ **タイトル・メニュー・画像はすべて同一の content の直下**（画像は content の子）。

### Grid（オリジナル・Computed）
- **display**: `grid`
- **grid-template-areas**: `"header . list banner"`
  - 4 エリア: タイトル / **`.`**（空き＝ガター） / メニュー / バナー
- **grid-template-columns**: `178.137px 40px 912.088px 310.775px`
  - 列1: **178.137px** … タイトル（header）
  - 列2: **40px** … ガター（`.` に相当）
  - 列3: **912.088px** … メニュー部分（list）
  - 列4: **310.775px** … 右の画像（banner）
- **grid-template-rows**: `333.3px`（実質 1 行利用）
- **width**: 1521px（コンテンツ幅 1441px + padding 左右 40px×2）
- **padding**: `padding-inline-start: 40px`, `padding-inline-end: 40px`（上下は 0 想定）

### 幅の比率（参考・コンテンツ幅 1441px 時）
- 178.137 + 40 + 912.088 + 310.775 ≈ 1441
- タイトル : gutter : メニュー : 画像 ≈ **178 : 40 : 912 : 311**
- 比率（fr 換算）: **178fr 40fr 912fr 311fr** で同じ割合を再現可能

---

## 2. 現在の AEM 実装

### HTML 構造（現状）
- **panel** (`.nav-dropdown-panel`)
  - **content** (`.nav-dropdown-content`) … タイトル + メニューのみ
    - `.nav-dropdown-header`
    - `.nav-dropdown-list`
  - **images** (`.nav-dropdown-images`) … **content の兄弟**（panel の直下）

→ オリジナルは「content 内で 3 エリア」、現状は「content（2 エリア）+ images を兄弟」。

### Grid（現状・画像あり）
- **panel**: `grid-template-columns: 21fr minmax(240px, 8fr)`（content | images）
- **content**: `grid-template-columns: 3fr 18fr`（タイトル | メニュー）、`gap: 32px 56px`
- **padding**: content は `38px` 左右、`30.4px` 上

→ タイトルは「content の 3/21」＝全体の 3/29 程度。オリジナルは 178/1441 でやや広め。

---

## 3. オリジナルに近づけるための対応案

1. **構造**
   - 画像を再度 **content の子**にし、オリジナルと同じ「content 内に header / list / banner」にする。
2. **Grid**
   - content を **4 列**にし、オリジナルの幅比率を fr で再現する。
   - 例: `grid-template-columns: 178fr 40fr 912fr 311fr;`
   - 必要なら `grid-template-areas: "header list list banner"` のように list を 2 列占有する形も可（オリジナルが 4 列なら 4 セルに割り当て）。
3. **Gap**
   - オリジナルは列2が 40px の gutter。`178fr 40fr 912fr 311fr` にすれば、同じ比率でレスポンシブに伸縮する。
4. **Padding**
   - オリジナルは左右 40px。現状 38px のため、40px に合わせるかどうかは要確認。

---

## 4. ブラウザで追加取得するとよい情報

1. **別ビューポート幅での列幅**
   - ウィンドウ幅を変え、その都度 `l-header_dropdown-content` の **Computed** で `grid-template-columns` をメモする。
   - 固定 px か、% や fr に変わるかが分かればレスポンシブ仕様が明確になる。

2. **取得手順**
   - 該当メニューを開く（例: 事業紹介）。
   - F12 → Elements で `l-header_dropdown-content`（または同等の content 用 div）を選択。
   - Computed で以下を記録:
     - `grid-template-columns`
     - `padding`
     - `gap`（あれば）
   - ビューポートを 1200px / 1440px / 1600px など数パターンで繰り返す。

3. **スタイルの確認**
   - Elements の **Styles** で、`.l-header_dropdown-content` に指定されている `grid-template-columns` の**元の指定**（px / fr / % / minmax など）を確認すると、レスポンシブの意図が分かる。

---

## 5. 実装時の参照

- オリジナル幅比率: **178 : 40 : 912 : 311**
- 再現用: `grid-template-areas: "header . list banner";` + `grid-template-columns: 178fr 40fr 912fr 311fr;`（content 内に header / list / banner の 3 要素を配置し、各要素を対応する area に `grid-area` で割り当て）。
