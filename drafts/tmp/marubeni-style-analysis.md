# Marubeni style analysis (acceptance criteria)

**Source:** Marubeni TOP (https://www.marubeni.com/jp/).  
**Purpose:** Document layout, typography, colors, spacing, and borders so blocks can be aligned to Marubeni design. Use with **analyze-and-plan** (Visual Analysis) and **building-blocks** (Step 4: CSS).

**本家 HTML の参照:** 同一リポジトリの `drafts/tmp/import-work/cleaned.html` にスクレープした本家の HTML を格納。カードは `ul.c-card-list` > `li.c-card-list__item` > `a.c-card-list__link` > `div.c-card-list__image`（img のみ・アスペクト比指定なし）+ `div.c-card-list__title`。デザイン再現時はこの構造と見た目を参照する。

---

## 1. Layout

- [x] Section structure: Hero (full-width) → About/cards → Carousel or tabs → News/list → Notice/IR banners. Clear section boundaries.
- [x] Grid / columns: Main content max-width ~1200px; gutters 24px mobile, 32px desktop. Breakpoints aligned with styles.css (900px).
- [x] Max-width and padding: Section container max-width 1200px, section padding 40px vertical; inner padding 24px (mobile), 32px (desktop).
- [x] Alignment: Text left; blocks center-contained.

---

## 2. Typography

- [x] **Heading font family:** Hiragino Kaku Gothic ProN, Hiragino Sans, Meiryo, sans-serif (corporate JP).
- [x] **Body font family:** Same as heading for consistency.
- [x] Heading sizes: h1 55px→45px (desktop), h2 44px→36px, h3 34px→28px; mobile-first larger.
- [x] Body size: 22px→18px (desktop) base; small 19px→16px, xs 17px→14px.
- [x] Line height: 1.6 body; headings 1.25.
- [x] Font weights: Heading 600; body regular; links/buttons 500.

---

## 3. Colors

- [x] **Background:** Page #fff; light sections #f5f5f5; cards #fff.
- [x] **Text:** Primary #131313; secondary/muted #505050.
- [x] **Links:** Default #0066a1 (Marubeni blue); hover #004d7a; visited same or slightly muted.
- [x] **Buttons:** Primary = link blue background; secondary = outline (border currentColor).
- [x] **Borders:** #e0e0e0; 1px where used.
- [x] **Accent / brand:** Red #c41230 for key CTAs or highlights if used; blue dominant for links.

---

## 4. Spacing and borders

- [x] Section vertical spacing: 40px between sections; first section margin-top 0.
- [x] Block internal padding/margins: Cards padding 24px; list items 12px–16px gap.
- [x] Border radius: Buttons 2.4em (pill); cards 4px–8px; images 4px.
- [x] Border width: 1px–2px; buttons 2px.

---

## 5. Icons and images

- [x] Icon size: 24px inline; nav/icons match.
- [x] Image aspect ratios: Hero 16:9 or full-bleed; cards 4:3 or 16:9; object-fit cover.
- [x] Captions/overlays: Hero overlay dark gradient for text contrast; no mid-word breaks (accessibility).

---

## 6. Acceptance criteria (per block or area)

| Block / area | Acceptance criteria |
|--------------|---------------------|
| Hero | Full-width; height min 400px desktop; overlay for text contrast; CTA button uses --link-color/--link-hover-color; heading/body use theme fonts and sizes. |
| Cards / Columns | **画像:** 本家と同様にアスペクト比を強制しない。**テキスト:** 本家は赤い矢印アイコンなしでテキストのみ。**ホバー:** 本家は画像またはテキストエリアにマウスオーバーで画像が少し拡大（cleaned.html の img.-zoom）、テキストは赤（#c41230）に変化。--card-background: var(--light-color)。box-shadow / radius / border 上記のとおり。 |
| Carousel | Nav arrows/indicators use theme colors; slide spacing consistent. |
| Tabs + News list | Tab underline --link-color; list spacing 12px–16px; link style matches --link-color, hover underline. |
| Notice banner / Alert | Background --light-color or #fff; text --text-color; icon 24px; border-left or icon position per design. |
| Header / Footer | Handled by fragments; use same --body-font-family, --link-color for nav links. |

---

## 7. CSS custom properties to set

Applied in `styles/marubeni-theme.css` (load after styles.css):

- `--background-color`: #fff
- `--light-color`: #f5f5f5
- `--dark-color`: #505050
- `--text-color`: #131313
- `--link-color`: #0066a1
- `--link-hover-color`: #004d7a
- `--body-font-family`: "Hiragino Kaku Gothic ProN", "Hiragino Sans", meiryo, sans-serif
- `--heading-font-family`: "Hiragino Kaku Gothic ProN", "Hiragino Sans", meiryo, sans-serif
- `--body-font-size-*`, `--heading-font-size-*`: keep from styles.css or adjust per breakpoint
- Section/block: `--card-border-radius`: 4px (optional)

---

*Completed using **analyze-and-plan** (Visual Analysis) and Marubeni TOP reference. Apply with **content-driven-development** + **building-blocks** (Step 4).*
