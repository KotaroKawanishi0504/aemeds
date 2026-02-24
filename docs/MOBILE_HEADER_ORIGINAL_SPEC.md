# オリジナル モバイルヘッダー仕様

本家（marubeni.com）header.min.css および header-beautified.css より抽出。

## ブレークポイント

- **モバイル**: `width < 900px`
- **デスクトップ**: `width >= 900px`

## --rem（モバイル）

本家: `--rem: calc(var(--vw) * 100 / 393 * 10)`（キャップなし）
- 393px 幅で 10 相当
- 899px 幅で約 22.9（ロゴ 275px、バー高さ 121px）
- EDS: 本家式をそのまま使用（キャップしない）

## モバイル .l-header__bar

| プロパティ | 値 | 換算（rem=10） |
|-----------|-----|----------------|
| height | calc(var(--rem) * 5.3 * 1px) | 53px |
| padding-inline | calc(var(--rem) * 2 * 1px) | 20px |
| justify-content | space-between | ロゴ左・メニュー右 |
| display | flex | - |

## モバイル .l-header__logo

| プロパティ | 値 | 換算（rem=10） |
|-----------|-----|----------------|
| height | calc(var(--rem) * 5.3 * 1px) | 53px |
| margin-inline | calc(var(--rem) * -2 * 1px) | -20px |
| padding-inline | calc(var(--rem) * 2 * 1px) | 20px |
| img width | calc(var(--rem) * 12 * 1px) | 120px |

## モバイル .l-header__menu（ハンバーガー）

| プロパティ | 値 | 換算（rem=10） |
|-----------|-----|----------------|
| height | calc(var(--rem) * 5.3 * 1px) | 53px |
| padding-inline | calc(var(--rem) * 2 * 1px) | 20px |
| margin-right | calc(var(--rem) * -2 * 1px) | -20px |
| icon width | calc(var(--rem) * 2.8 * 1px) | 28px |
| icon height | calc(var(--rem) * 1.35 * 1px) | 13.5px |
| line height | max(2px, var(--rem) * 2 * 1px * .1) | 2px |
| ::before top | calc(var(--rem) * -.575 * 1px) | -5.75px |
| ::after top | calc(var(--rem) * .425 * 1px) | 4.25px |

## モバイル ハンバーガー → ×（閉じる）アニメーション

メニュー展開時（`[aria-expanded=true]`）にハンバーガー3本線が×に変形する。

| プロパティ | 値 | 備考 |
|-----------|-----|------|
| transition | .3s all | 本家 l-header__menu-line |
| .menu-line | background: transparent | 中央線を非表示 |
| ::before | transform: translateY(0.59rem) rotate(-35deg) | 上線が中央で交差 |
| ::after | transform: translateY(-0.59rem) rotate(35deg) | 下線が中央で交差 |

**重要**: 非対称の top（-0.575rem / 0.425rem）により、translateY(±0.59rem) で中央で交差して×になる。**top を 0 や対称値に変更すると×の交差位置がずれる。** 展開時も top は変更しない。

## レスポンシブ挙動

- 393px: rem=10 → 基準サイズ
- 320px: rem≈8.14（本家式）→ ロゴ 98px、高さ 43px
- 835px: rem≈21.25（本家式）→ ロゴ 255px（巨大化）
- 本家はキャップなし。899px で rem≈22.9、ロゴ 12rem≈275px、バー高さ 5.3rem≈121px
