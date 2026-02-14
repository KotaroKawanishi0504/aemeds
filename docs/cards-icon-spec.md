# Cards block icon specification

Single reference for the card body icon (red circle + white arrow) so implementation and comparison use the same values. Source: Marubeni TOP `.p-home__about ul.c-card-list` and design-extract outputs.

---

## Overview

- **Role:** Icon to the left of the card label (e.g. "会社情報"), indicating a link. Shown on every card in the list.
- **Reference implementation:** `.c-icon-link__icon` in cleaned.html: contains an `img` with inline SVG (circle only) or SVG + Ben icon font for the arrow. Styled by 01-common.min.css.
- **EDS implementation:** Inline SVG (circle + path) in `blocks/cards/cards.js`; size and colors from `styles/marubeni-theme.css` CSS variables.
- **Visual:** Solid red circle outline with white right-pointing arrow centered inside; diameter consistent across cards.

| Spec item | Value | Reference |
|-----------|--------|-----------|
| Circle | fill none, stroke red, r=12 in viewBox 0 0 24 24 | Reference data URL SVG; cards-computed-styles |
| Arrow | White fill, right-pointing triangle | marubeni-theme.css |
| Icon box | 26×26px (2.6rem @ root 10px) | cards-computed-styles (i.c-icon-link__icon) |

---

## Circle

| Property | Spec value | CSS variable / source |
|----------|------------|------------------------|
| Shape | Circle | — |
| fill | none | SVG attribute |
| stroke | #e60012 | `--card-icon-color` (marubeni-theme.css) |
| stroke-width | 1.5 | `--card-icon-stroke-width` (marubeni-theme.css) |
| viewBox | 0 0 24 24 | cards.js (createCardBodyIconSVG) |
| cx, cy | 12, 12 | Center in 24×24 |
| r | 12 | `--card-icon-circle-r` (marubeni-theme.css); reference data URL SVG |

**Source files:** `drafts/tmp/import-work/design-extract/cards-computed-styles.json` (i.c-icon-link__icon, svg), `drafts/tmp/import-work/design-extract/cards-icon-computed.json` (if present: circle r, stroke), reference cleaned.html img `data:image/svg+xml;base64,...` (circle r=12).

---

## Arrow

| Property | Spec value | CSS variable / source |
|----------|------------|------------------------|
| Color | #fff (white) | `--card-icon-arrow-color` (marubeni-theme.css) |
| Shape | Right-pointing triangle (path) or Ben font `\e902` | cards.js path; 01-common.min.css |
| Implementation | SVG path with class `cards-card-body-icon-arrow` | blocks/cards/cards.js, cards.css |

**Source files:** `styles/marubeni-theme.css` (`--card-icon-arrow-color`), scraped 01-common.min.css (Ben `\e902`).

---

## Size and box

| Property | Spec value | CSS variable / source |
|----------|------------|------------------------|
| Icon container width | 26px | cards-computed-styles i.c-icon-link__icon.width |
| Icon container height | 26px | cards-computed-styles i.c-icon-link__icon.height |
| Root font-size | 10px | root-font.json computed |
| In rem (desktop) | 2.6rem | `--card-icon-size` (marubeni-theme.css) |
| In rem (mobile &lt;900px) | 2.4rem | marubeni-theme.css @media |

**Source files:** `drafts/tmp/import-work/design-extract/cards-computed-styles.json` (entries i.c-icon-link__icon, svg), `drafts/tmp/import-work/design-extract/root-font.json`, `styles/marubeni-theme.css`.

---

## Spacing

| Property | Spec value | CSS variable / source |
|----------|------------|------------------------|
| Icon ↔ label gap | 1rem (desktop), 0.8rem (mobile) | `--card-icon-gap` (marubeni-theme.css) |
| Card body padding-left | icon width + gap (e.g. 2.6rem + 1rem) | cards.css calc(var(--card-icon-size) + var(--card-icon-gap)) |
| Title block margin-top | 24px | cards-computed-styles div.c-card-list__title.c-icon-link.margin-top |
| Title block padding-left | 36px | cards-computed-styles div.c-card-list__title.c-icon-link.padding-left |
| Icon margin (reference) | 0.5px 0 | cards-computed-styles i.c-icon-link__icon.margin |

**Source files:** `drafts/tmp/import-work/design-extract/cards-computed-styles.json` (div.c-card-list__title.c-icon-link, i.c-icon-link__icon), `styles/marubeni-theme.css`, `blocks/cards/cards.css`.

---

## Colors (HEX)

| Element | Spec value | Variable / source |
|---------|------------|-------------------|
| Circle stroke | #e60012 | `--card-icon-color` |
| Arrow fill | #fff | `--card-icon-arrow-color` |
| Label text | #282828 | `--card-text-color` |
| Label hover | #c41230 | `--card-text-hover-color` |

**Source files:** `styles/marubeni-theme.css`, design-extract colors if needed.

---

## Responsive

| Breakpoint | --card-icon-size | --card-icon-gap |
|------------|------------------|------------------|
| default (≥900px) | 2.6rem | 1rem |
| &lt; 900px | 2.4rem | 0.8rem |

**Source:** `styles/marubeni-theme.css` @media screen and (width &lt; 900px).

---

## Source files summary

| File | Use |
|------|-----|
| drafts/tmp/import-work/design-extract/cards-computed-styles.json | Icon box 26×26, color, margin; title margin/padding, font-size, line-height |
| drafts/tmp/import-work/design-extract/cards-icon-computed.json | Icon-specific metrics (circle r, stroke-width from DOM) when scraper has run |
| drafts/tmp/import-work/design-extract/root-font.json | Root 10px for px↔rem |
| drafts/tmp/import-work/styles/01-common.min.css | Reference .c-icon-link__icon, Ben font |
| styles/marubeni-theme.css | --card-icon-* and --card-text-color |
| blocks/cards/cards.js | SVG structure, circle r from --card-icon-circle-r |
| blocks/cards/cards.css | Icon container size, circle stroke-width, arrow fill |

---

## Notes

- Reference HTML uses an `img` with data URL SVG containing only a circle (r=12, no arrow in SVG); arrow may be from Ben font or separate layer. EDS uses a single inline SVG (circle + path) for both.
- For design-gap checks: implement to this spec, then use screenshot comparison (reference vs AEM) to verify visually.
