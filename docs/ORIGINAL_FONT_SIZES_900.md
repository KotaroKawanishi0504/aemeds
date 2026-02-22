# オリジナルサイト（丸紅本家）フォントサイズ一覧（900px）

ビューポート **900px**（モバイルブレーク直前）で取得した computed font-size を要素ごとに集計。
取得元: `inspection-original-900.json` (viewport 900px)
本家 :root --rem（900px 時）: `min(10, 9 * 100 / 1280 * 10)`
computed body: 11.25px

---

## フォントサイズ別（出現要素）

| フォントサイズ | 主な使用要素（tag / class） |
|----------------|----------------------------|
| 0px | div.swiper-pagination swiper-pagination-clickable swiper-pagination-bullets swiper-pagination-horizontal; span.swiper-pagination-bullet swiper-pagination-bullet-active; i |
| 7.73438px | div.c-news__category |
| 8.4375px | small; span.u-visually-hidden |
| 9.84375px | a.c-icon-link; i.c-icon-link__icon; svg; circle; div.c-card-list__title; span |
| 10px | button.ot-sdk-show-settings |
| 10.5469px | div.c-card-list__title; span; div.c-tabs__list; button.c-tabs__tab; div.c-news__date; h2.p-home__important-heading |
| 11.25px | body.p-home; a.u-visually-hidden; link; marubeni-header; script; div.l-content; main.l-main; div.p-home__hero swiper swiper-initialized swiper-horizontal swiper-backface-hidden …他49件 |
| 12.6562px | a.c-icon-link; i.c-icon-link__icon; svg; circle; span.c-icon-link__label; p.p-home__message-description; br.u-none-desktop-no-full; br.u-none-desktop-full u-none-mobile …他5件 |
| 16px | template; source |
| 22.5px | h2.p-home__news-heading; h2.p-home__about-heading |

---

## 本家との対応（900px で --rem ≈ 7.03）

| 実測値 | 本家の式（--rem 倍率） | 用途 |
|--------|------------------------|------|
| 11.25px | 1.6 × --rem | body / メイン本文 |
| 10.5469px | 1.5 × --rem | ナビ、.c-card-list__title、.c-news__date、タブ |
| 12.6562px | 1.8 × --rem | カードタイトル・.c-icon-link__label |
| 22.5px | 3.2 × --rem | セクション見出し .p-home__news-heading, .p-home__about-heading |
| 7.73438px | 約 1.1 × --rem | .c-news__category |
| 8.4375px | 1.2 × --rem | small 等 |
| 9.84375px | 1.4 × --rem | .c-icon-link 等 |

本家は 900px で **--rem のみ** 幅連動（`(900/1280)*10 ≈ 7.03`）で、別の「スケール係数」はかけていない。EDS で 900px 時に 0.65 をかけていると全体が小さくなるため、900–1279px は **rem = (w/1280)*10** と **scale = (w/1280)*(16/18)** で本家に合わせる。

---

## サマリ（900px で使われている主なフォントサイズ）

0px, 7.73438px, 8.4375px, 9.84375px, 10px, 10.5469px, 11.25px, 12.6562px, 16px, 22.5px
