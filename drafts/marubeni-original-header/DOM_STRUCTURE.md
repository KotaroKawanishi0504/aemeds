# 本家ヘッダー・ドロップダウン DOM 構造

`marubeni-jp-index.html` 内の `<marubeni-header>` > `<template>` に含まれる構造の要約。EDS の header ブロックで DOM を合わせる際の参照用。

## デスクトップ用ドロップダウン（1 ナビ項目あたり）

- `.l-header__navigation-item`
  - `.l-header__navigation-link` > `.l-header__navigation-label`
  - `button.l-header__navigation-menu` (aria-label, data-megamenu-*-label, aria-expanded, aria-controls)
  - `.l-header__navigation-sub` (hidden="until-found", role="region", aria-labelledby)
    - `.l-header__navigation-sub-dropdown.l-header__dropdown`
      - `.l-header__dropdown-content`
        - `.l-header__dropdown-header` （見出しテキスト 1 行）
        - `.l-header__dropdown-list`
          - `ul.c-underline-list[data-columns="3"|"4"]`
            - `li.c-underline-list__item` （繰り返し）
              - `div.c-underline-list__inner`
                - `a.c-underline-list__link`
    - `ul.l-header__navigation-sub-list` （モバイル用、desktop では非表示）

## data-columns の例（本家テンプレート）

- 会社情報: data-columns="4"
- ニュース: data-columns="4"
- 事業紹介: data-columns="3"

## バナー付きドロップダウン

`.l-header__dropdown-content` が `.l-header__dropdown-banner` を持つ場合、グリッドは "header . list banner"。`.l-header__dropdown-list` の右側に `.l-header__dropdown-banner` が並ぶ。

## EDS との主な差分

- 本家: .l-header__dropdown-header（見出し） / .c-underline-list__inner ラッパー / ul[data-columns] / Ben フォント矢印
- EDS: 見出しなし / li > a の単純構造 / column-count 固定 / 別アイコン

## フォント・アイコン（本家）

Ben（font.min.css）: /common/fonts/ben.woff。矢印 \e902、検索 \e90d、メニュー \e90c。EDS で同じ見た目にするには Ben を読み込むか同等のアイコンに差し替える。
