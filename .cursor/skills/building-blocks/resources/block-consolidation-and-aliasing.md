# Block Consolidation and AEM Class Aliasing

This document describes how to merge two blocks into one and how to handle cases where the HTML class assigned by AEM (or the import sheet) differs from the canonical block name in the codebase.

## When This Applies

- **Block consolidation:** You want to maintain a single implementation (e.g. `cards-carousel`) while AEM or content still references another name (e.g. `card-carousel`). You remove the duplicate block folder and route both names to one implementation.
- **Page migration:** Imported or published HTML uses a block class (e.g. `card-carousel`) that does not match the codebase block name (e.g. `cards-carousel`). You avoid creating a second block; instead you alias the AEM class to the canonical block.

## 1. Loader-Side Alias (scripts/aem.js)

The loader decides which block script and CSS to load based on the block's **short name**. That name comes from the block's class (e.g. `block-carousel` from `class="block card-carousel"`). If you want `card-carousel` to load the same script as `cards-carousel`:

1. In `decorateBlock` (or equivalent), derive the **canonical block name** from the short name before setting `block.dataset.blockName`.
2. Example: when `shortBlockName === 'card-carousel'`, set `block.dataset.blockName = 'cards-carousel'` so the loader loads `blocks/cards-carousel/cards-carousel.js` and the corresponding CSS.

Result: Both `class="card-carousel"` and `class="cards-carousel"` load the same implementation.

## 2. Decorate-Side: Add Canonical Class

CSS for the block is usually scoped to the block class (e.g. `.cards-carousel`). If AEM only adds `class="card-carousel"`, those selectors do not match. At the start of `decorate(block)`:

- If the block has the AEM/alias class but not the canonical class, add the canonical class:  
  `block.classList.add('cards-carousel')`

Then both the alias and canonical classes are present and CSS applies regardless of which class the platform added.

## 3. Interaction Parity (Hover, Focus, etc.)

When two blocks are consolidated, or when one block is intended to look and behave like another (e.g. Card Carousel like Card):

- **Shared CSS does not apply automatically** if the DOM or class names differ. For example, Card uses `.cards` and `.cards-card-*`; Cards Carousel uses `.cards-carousel` and `.cards-carousel-*`. Selectors in `blocks/cards/cards.css` will not match the carousel.
- **Explicitly add the same interactions** to the block that uses different class names: hover image zoom (`transition` + `transform: scale(1.05)`), link/text hover color (`var(--card-text-hover-color, #e60012)`), underline (`text-decoration: underline`, `text-underline-offset`), and any focus states.
- Before deleting a block folder, **audit the removed block's CSS and JS** for hover, focus, and other interactions, and ensure they exist in the block you are keeping.

## 4. Block Consolidation Checklist

When merging block A into block B and removing the folder for block A:

- [ ] **Loader:** In `scripts/aem.js`, when short block name is A, set `dataset.blockName` to B so B's script and CSS load.
- [ ] **Decorate:** In B's `decorate(block)`, if the block has class A but not B, add class B so B's CSS applies.
- [ ] **Interactions:** Compare A's and B's CSS/JS; copy any hover, focus, or other behavior from A into B (using B's class names) so nothing is lost.
- [ ] **Delete:** Remove the folder `blocks/{block-a}/` (all files: `_*.json`, `*.js`, `*.css`).
- [ ] **Build:** Run `npm run lint` and `npm run build:json`. The merged `component-definition.json` will no longer include block A.
- [ ] **Test:** Verify pages that use class A and class B both render and behave correctly (including hover/focus).
- [ ] **Git:** Commit and push as usual.

## 5. Reference: Project Loader Pattern

In this project, the alias is implemented in `scripts/aem.js` inside the block decoration flow:

- `shortBlockName` is derived from the block's class (e.g. `card-carousel`).
- `blockName = shortBlockName === 'card-carousel' ? 'cards-carousel' : shortBlockName`
- `block.dataset.blockName = blockName` so the loader uses `blockName` to load script and CSS.

The block's `decorate(block)` then adds the canonical class when the element only has the alias class, so `.cards-carousel` selectors in CSS apply.
