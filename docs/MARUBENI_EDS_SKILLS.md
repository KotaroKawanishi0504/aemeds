# Marubeni EDS Skills – Usage Guide

This document summarizes **when** and **in what order** to use the Adobe EDS skills for the Marubeni site migration. For installing skills, see [SETUP_EDS_SKILLS.md](./SETUP_EDS_SKILLS.md).

---

## 1. Style alignment (priority)

**Goal:** Make block appearance match the Marubeni site (layout, typography, colors, spacing).

1. **analyze-and-plan** (Visual Analysis)  
   - Input: Marubeni TOP or target page (screenshot / Figma / URL).  
   - Output: `drafts/tmp/marubeni-style-analysis.md` with layout, typography, colors, spacing, and **acceptance criteria** per block.

2. **content-driven-development** + **building-blocks**  
   - Use CDD as the overall flow; in Step 2 use the analysis and acceptance criteria.  
   - In Step 5 run **building-blocks**. In **Step 4: Add CSS styling**, override the CSS custom properties in `styles/styles.css` and/or `styles/marubeni-theme.css` (see `resources/css-guidelines.md` in the building-blocks skill).  
   - Use **block-collection-and-party** to confirm block structure before changing styles.

3. **testing-blocks**  
   - After changes: lint, multiple viewports, screenshots, console checks to verify acceptance criteria.

**Enable Marubeni theme:** For Marubeni content, load the theme after the base styles, e.g. add in `head.html` or via metadata:  
`<link rel="stylesheet" href="/styles/marubeni-theme.css"/>`  
Update variables in `styles/marubeni-theme.css` from `drafts/tmp/marubeni-style-analysis.md`.

---

## 2. Content migration (page import)

**Goal:** Turn existing Marubeni pages into EDS-ready HTML (main content only; nav/footer stay as fragments).

1. **page-import** (orchestrator)  
   Run in order:
   - **scrape-webpage** – Target URL e.g. `https://www.marubeni.com/jp/...` → metadata, cleaned HTML, images.
   - **identify-page-structure** – Sections and content sequences (uses **page-decomposition** per section).
   - **authoring-analysis** – Decide “default content” vs “block” (Hero, Cards, Tabs, etc.). Use **block-inventory** and **get-block-structure.js** for expected HTML.
   - **generate-import-html** – EDS sections, block tables, metadata, image folder.
   - **preview-import** – Local preview and compare with original.

---

## 3. Block development (new or extended blocks)

**Goal:** Add or extend blocks (e.g. news tabs + list, IR banner) with consistent content model and styling.

1. **content-driven-development** from the start.  
2. Step 2: **analyze-and-plan** – Requirements and acceptance criteria.  
3. Step 3: **content-modeling** – Table structure (content model).  
4. Step 4: Test content in AEM or `drafts/tmp/*.plain.html`.  
5. Step 5: **building-blocks** – Implement JS/CSS; use **block-collection-and-party** for reference.  
6. Step 6–8: Lint, test, PR (**testing-blocks**).

---

## Quick reference

| Need | Skills (in order) |
|------|-------------------|
| Style gap | analyze-and-plan → content-driven-development + building-blocks → testing-blocks |
| Page import | page-import → scrape-webpage → identify-page-structure → authoring-analysis → generate-import-html → preview-import |
| New/extended block | content-driven-development (analyze-and-plan, content-modeling, building-blocks, block-collection-and-party, testing-blocks) |

**Other:** **find-test-content** (test URLs), **block-inventory** (block list), **docs-search** (aem.live), **code-review** (PR checklist).
