# 本家ヘッダー関連 JS の挙動メモ

## viewport-unit.min.js

- **役割**: ルート要素に viewport ベースの CSS 変数を設定する。
- **設定する変数**（`--rem` は含まない）:
  - `--vw` = `documentElement.clientWidth / 100`
  - `--vh` = `documentElement.clientHeight / 100`
  - `--vi` / `--vb` = writing-mode に応じたインライン/ブロック方向の 1v* 相当
  - `--vmin` = min(--vw, --vh), `--vmax` = max(--vw, --vh)
- **呼び出し**: `header.min.js` の `MarubeniHeader` で `updateViewportUnit(this)` を `resize` 時と `connectedCallback` 時に実行。Shadow host に渡しているが、実装では `t.style.setProperty` で `document.documentElement` を渡しているので、実質 `:root` に設定される。

## --rem の定義（viewport-unit にはない）

- **定義場所**: **header.min.css** の `:host` 内。
- **式**:
  - デスクトップ (width >= 900px): `--rem: min(10, var(--vw) * 100 / 1280 * 10)` → 1280px 幅で 10、それ以上は 10 でキャップ。
  - モバイル (width < 900px): `--rem: calc(var(--vw) * 100 / 393 * 10)` → 393px 幅で 10 相当。
- EDS で固定値で合わせる場合は `--rem: 10` または `10px` ベースの rem 換算でよい。

## megamenu.min.js

- **役割**: ヘッダー内のドロップダウン（サブメニュー）の開閉。
- **セレクタ**:
  - link: `.l-header__navigation-item > a`
  - trigger: `.l-header__navigation-item > button, button.l-header__search`
  - submenu: `.l-header__navigation-sub`
  - background: `.l-header__background`
- **デフォルト**: `delay: 300`（ホバーで開くまでの遅延）。本家 header.min.js では `delay: 100` で上書き。
- **挙動**:
  - トリガーに `aria-controls` / `aria-expanded` を付与。サブメニューに `role="region"`, `aria-labelledby` を付与。
  - 開閉は `toggle(trigger, true|false)`。アニメーションは `blockSize` の Web Animations API。`hidden="until-found"` で非表示時は until-found。
  - ホバー: link の `pointerenter` で delay 後に open、`pointerleave` で delay 後に close。サブメニュー内にポインタが入るとタイマーは clear。
  - フォーカスがヘッダー外に出たら `focusout` で全閉じ。
  - Escape でサブメニューを閉じ、トリガーにフォーカス。
- **アニメーション**: `duration: 300`, `easing: ease`。`prefers-reduced-motion: reduce` の場合は duration 0。

## accordion.min.js

- モバイル用ハンバーガーメニュー（`.l-header__menu`）の開閉に使用。トリガーは `[data-accordion-trigger]` 相当で、header では `.l-header__menu` が content の前に来る構造で Accordion が初期化されている。
- ドロップダウンの見た目合わせには不要。参照用に保存済み。

## 本家スクリプト URL（取得済み）

| ファイル | URL |
|----------|-----|
| viewport-unit.min.js | https://www.marubeni.com/common/scripts/viewport-unit.min.js |
| megamenu.min.js | https://www.marubeni.com/common/scripts/megamenu.min.js |
| accordion.min.js | https://www.marubeni.com/common/scripts/accordion.min.js |
| header.min.js | ローカル保存済み（import 上記） |
