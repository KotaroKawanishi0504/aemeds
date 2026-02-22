# ヘッダのテキストがブラウザ幅と連動しない原因

## 現象

- **カード・タイトル:** ブラウザ幅に連動してテキストサイズが変わる
- **ヘッダ:** ブラウザ幅を変えてもテキストサイズが変わらない

## 切り分け結果

| 対象 | テーマでの指定 | 依存している値 | 幅連動するか |
|------|----------------|----------------|--------------|
| body / 見出し | `var(--body-font-size-m)` 等 | **--global-text-scale のみ**（JS で更新） | ✅ する |
| .cards-carousel-title | `calc(14 * var(--global-text-scale) * 1px)` | **--global-text-scale のみ**（JS で更新） | ✅ する |
| ヘッダ nav a 等 | `calc(clamp(6, 100vw / 1280 * 10, 10) * 1.5 * var(--global-text-scale) * 1px)` | **100vw** と --global-text-scale | ❌ しない |

## 原因

- **カード・タイトル:** 式に **100vw を含んでいない**。`--global-text-scale` だけに依存しており、この値は `applyGlobalTextScale()` でリサイズのたびに JS で更新されるため、幅に連動する。
- **ヘッダ:** 式に **`clamp(6, 100vw / 1280 * 10, 10)`** が含まれている。AEM プレビュー等では CSS の `100vw` がリサイズ時に再計算されないため、この部分が実質固定になり、全体の calc も更新されず、ヘッダだけ幅に連動しない。

## 対応方針

ヘッダの font-size から 100vw をやめ、**JS で更新する変数のみ**で計算する。

- `applyGlobalTextScale()` で **--rem** も更新する（`baseRem * scale`、baseRem = 幅に応じた 6〜10）。
- テーマのヘッダ用 font-size を **`calc(var(--rem, 10) * 1.5 * 1px) !important`** に変更し、`--rem` にだけ依存させる。

これでヘッダもカード・タイトルと同様に幅連動する。
