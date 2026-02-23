# ヘッダー ローカル修正の分析

## 問題

1. **ロゴとメニュー（会社情報）の間隔がブラウザ幅に応じて変わらない**
2. **メニューが左寄せ（オリジナルは中央寄せ）**

---

## オリジナルサイト（本家）の分析

### 1. メニューの中央寄せ

`header-beautified.css` より:

```css
.l-header__navigation {
  justify-self: center;  /* ナビゲーション全体を中央に配置 */
  left: calc((1 - var(--liquid-fr)) * var(--rem) * 3.2 * 1px);
  position: relative;
}
```

本家は **grid** で `.l-header__navigation` に `justify-self: center` を指定し、メニュー全体を中央に配置している。

### 2. ロゴ〜メニュー間のスペース

本家の構造:
- `.l-header__bar`: `display: flex`, `padding-inline: calc(var(--rem) * 4 * 1px)`
- `.l-header__logo`: `margin-inline: calc(var(--rem) * -2 * 1px)`, `padding-inline: calc(var(--rem) * 2 * 1px)`
- `.l-header__navigation`: `justify-self: center` で中央配置
- ロゴとメニュー間のスペースは、**中央寄せによって左右均等に生じる余白**として自然に決まる

### 3. --rem のスケール

- 900〜1279px: `--rem = (viewport/1280) * 10` で線形に変化
- 1280px 以上: `--rem = 10` で固定
- **1280px 未満でないと、ロゴ〜メニュー間のスケールは見えない**

### 4. --liquid-fr

本家は `--liquid-fr: clamp(0, (var(--vw)*100 - 1280)/256, 1)` を使用。
- viewport < 1280: 0
- viewport >= 1536: 1
- 1280〜1536: 線形補間

---

## 現在の EDS 実装の問題点

### 1. メニュー左寄せの原因

```css
header nav .nav-sections > * {
  margin-left: calc(var(--rem, 10) * 4.4 * 1px);  /* ← これが左寄せの原因 */
}
```

`nav-sections` は `justify-content: center` だが、子要素に `margin-left` があるため、中央から右にずれて左寄せに見える。

### 2. ロゴ〜メニュー間隔が変わらない可能性

- **1280px 以上の幅で確認している** → `--rem` が 10 固定のため変化しない
- **JS の `applyGlobalTextScale` が効いていない** → `marubeni-theme.css` の `@media (width >= 1280px)` で `--rem: 10` が指定され、JS の inline 設定が上書きされていない可能性

---

## 修正方針

### 1. メニューを中央寄せにする

- `nav-sections > *` の `margin-left` を削除
- ロゴ〜メニュー間のスペースは、**nav の gap** と **中央寄せによる余白** で確保

### 2. ロゴ〜メニュー間のスペース

- 本家と同じく、**gap を `--rem` ベース** に維持
- 中央寄せにすることで、左右の余白が均等になり、本家に近い見た目になる

### 3. --rem のスケール確認

- 900〜1280px の幅で確認すると、ロゴ・メニュー間隔が変わることが分かる
- 1280px 以上では本家と同様に固定になる

---

## 実施した修正（2025-02）

### 1. メニュー中央寄せ

**原因**: `default-content-wrapper` が `display: block` で親幅いっぱいに広がり、`ul` もそれを継承して左寄せに見えていた。

**対応**:
- `nav-sections > *` を `display: flex` + `justify-content: center` に変更
- `default-content-wrapper > ul` に `width: fit-content` を追加（メニュー幅をコンテンツに合わせる）
- `max-width: 100%` でオーバーフロー防止

メニュー項目が少なく親幅に収まる場合は中央寄せされる。8項目など多い場合は親幅いっぱいになり、見た目は左寄せに近くなる。

### 2. ロゴ〜メニュー間隔のスケール

- `--rem` は `applyGlobalTextScale()` で正しく設定されている（1000px: 7.8125、1200px: 9.375、1400px: 10）
- `gap: calc(var(--rem) * 3.2 * 1px)` により、ロゴとメニュー間の間隔はビューポート幅に応じて変化
