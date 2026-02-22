# ヘッダーレイアウト情報レポート

Playwright および既存 inspection JSON から取得した「ロゴ左・メニュー中央・言語/虫眼鏡右」の実現に必要な情報をまとめました。

---

## 1. 取得方法

| 対象 | 取得元 | ファイル |
|------|--------|----------|
| 本家（オリジナル） | Playwright `get-header-layout-info.cjs` で marubeni.com/jp を取得 | `docs/header-layout-original.json` |
| AEM | 既存 `inspection-aem.json` から抽出 | `docs/header-layout-aem.json` |

- 本家は Shadow DOM 内のバーを取得（`source: "original-shadow"`）。
- AEM は inspection 取得時点のスナップショット（`source: "inspection-json"`）。CSS 修正後の再取得は手動で可能（後述）。

---

## 2. 本家（オリジナル）の結果

**ファイル**: `docs/header-layout-original.json`

| 項目 | 値 |
|------|-----|
| viewport | 1536 × 730 |
| **bar（Shadow 内のナビバー）** | |
| rect | left: -0.1, width: **1521**, height: 72 |
| width | 1521px |
| **maxWidth** | **none** |
| marginLeft / marginRight | -0.1px（実質 0） |
| display | flex |
| justifyContent | normal |
| **barParent** | |
| rect | left: 0, width: **1520.8**, height: 72 |
| display | block |
| justifyContent | normal |

**結論**: 本家のヘッダー**バー**は **フル幅（maxWidth: none, width ≈ viewport）** です。1344px 制限はバー自体にはかかっておらず、おそらくバー**内側**のコンテンツ用ラッパーにかかっていると推測されます。

---

## 3. AEM（inspection 時点）の結果

**ファイル**: `docs/header-layout-aem.json`（inspection-aem.json から抽出）

| 項目 | 値 |
|------|-----|
| viewport | 1536 × 730 |
| **nav** | |
| rect | left: 0, width: **1520.8**, height: 72 |
| width | 1520.8px |
| **maxWidth** | **100%** |
| marginLeft / marginRight | 0px |
| display | flex |
| justifyContent | **flex-start** |
| **navWrapper** | |
| rect | left: 0, width: 1520.8, height: 72 |
| width | 1520.8px |
| maxWidth | none |
| display | block |
| justifyContent | normal |

**結論**: inspection 時点では **nav もフル幅（maxWidth: 100%）** で、親 .nav-wrapper もフル幅。ロゴ左・メニュー中央・ツール右は、この状態では `justify-content: flex-start` と `nav-tools { margin-left: auto }` で実現されていたと考えられます。

---

## 4. 修正後の問題の整理

- **前回の修正**: `@media (width >= 900px)` で nav の `max-width: 100%` と `margin: 0` を削除し、デフォルトの **max-width: min(1344px, 100vw - 192px)** と **margin: 0 auto** を効かせた。
- **本家の事実**: バー自体は **フル幅**（1344px 制限なし）。1344px は本家では「バー内のコンテンツ幅」の可能性が高い。
- **想定される現象**: nav を 1344px で中央寄せにしたことで、
  - ナビ全体が 1344px のブロックとして中央に寄り、
  - そのブロック内で flex が正しく効いていない、または
  - nav の幅が中身で縮んで「1344px 未満」になり、`margin: 0 auto` でブロックごと中央寄せになっている（ロゴ・ツールが中央寄せに見える）。

---

## 5. 推奨する対応

1. **バーはフル幅のままにする（本家に合わせる）**
   - `@media (width >= 900px)` で nav の **max-width と margin の上書きを復活**させる（`max-width: 100%`, `margin: 0`）。
   - これで「ロゴ左・メニュー中央・言語/虫眼鏡右」は、修正前と同じくフル幅バー内の flex で実現されます。

2. **1344px を効かせる場合は「バー内のラッパー」で行う**
   - 本家と完全に揃えるなら、**nav-wrapper はフル幅**のままにし、**その子**（nav の外側に 1 段ラッパーを入れるか、または nav の外側に max-width: 1344px の div を置く）で max-width: min(1344px, 100vw - 192px) と margin: 0 auto をかける。
   - 現状の DOM では「nav = フル幅のバー内コンテンツ」なので、1344px を nav に直接かけると、本家の「バーはフル幅」という挙動とずれます。

3. **修正後に再計測する**
   - 上記いずれかの対応後、次のコマンドで AEM のレイアウト情報を再取得し、nav の width / maxWidth / margin を確認することを推奨します。
   ```bash
   node scripts/get-header-layout-info.cjs "https://author-.../content/marubeni/jp/cards.html" docs/header-layout-aem.json
   ```
   - AEM の場合はログイン後に Enter を押すか、`WAIT_SECONDS=45` で 45 秒待ってから取得します。
   ```bash
   set WAIT_SECONDS=45
   node scripts/get-header-layout-info.cjs "https://author-.../cards.html" docs/header-layout-aem-after-fix.json
   ```

---

## 6. メニュー部分の開始位置・幅（追加計測）

`scripts/get-menu-metrics.cjs` で本家のトップレベルナビのみ計測（viewport 1536）:

| 項目 | 本家 | AEM（inspection 時点） |
|------|------|------------------------|
| ロゴ右端 | 216.5px | 204px (40+164) |
| 1本目左端 | 288.08px | 276.41px |
| ロゴ〜メニュー開始 | **71.58px** | **72.41px** |
| メニューブロック幅 | **944.84px** | **1032.84px** |
| メニュー項目間 | 0px（計測） | 24px（ul gap） |

- 開始位置はほぼ同一。差をなくすにはメニュー幅の調整が有効。
- 本家はメニュー幅が約 89px 短いため、**ul の column-gap を 24px → 16px** に変更し、ブロック幅を本家に近づけた（ロゴ・右端は変更なし）。

---

## 7. スクリプト一覧

| スクリプト | 役割 |
|------------|------|
| `scripts/get-header-layout-info.cjs <URL> [out.json]` | Playwright で指定 URL を開き、ヘッダーバー/nav の幅・margin・rect を取得。本家は Shadow DOM 対応。AEM は Enter 待ちまたは `WAIT_SECONDS`。 |
| `scripts/extract-layout-from-inspection.cjs [inspection.json] [out.json]` | inspection-aem.json から nav / navWrapper の rect と style を抽出し、上記と同じ形式で保存。 |

---

## 8. まとめ

- **本家**: ヘッダー**バー**は **フル幅（maxWidth: none）**。1344px はバー外側ではなく内側のコンテンツ幅の可能性が高い。
- **AEM**: inspection 時は nav もフル幅で、flex-start + margin-left: auto で「ロゴ左・メニュー中央・ツール右」が成立していた。
- **推奨**: 一旦、デスクトップで nav を再びフル幅（max-width: 100%, margin: 0）に戻し、見た目を本家に合わせる。1344px をかけたい場合は、バー（nav-wrapper）はフル幅のまま、その内側に 1344px のラッパーを設けて対応する。
