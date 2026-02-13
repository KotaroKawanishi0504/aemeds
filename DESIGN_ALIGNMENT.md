# Design alignment with reference site

When aligning blocks or styles with the **reference site** (e.g. Marubeni TOP), follow this workflow so design gaps are found systematically and implemented in one pass.

## Reference artifacts

- **Reference HTML:** `drafts/tmp/import-work/cleaned.html` — scraped structure and class names from the reference site.
- **Style and structure summary:** `drafts/tmp/marubeni-style-analysis.md` — colors, typography, spacing, and block-by-block HTML structure (e.g. Cards).

## Workflow

1. **Read the reference**  
   Open the relevant section in `cleaned.html` and the matching block row in `marubeni-style-analysis.md` (including the "Block-by-block reference structure" subsection).

2. **Capture icon/SVG specs when the block has icons**  
   For any icon (e.g. card body icon), **before** coding, document from the reference:
   - **Fill vs stroke** — for each shape (circle, path): does it use fill, stroke, or both? Which color for each?
   - **Exact colors** — hex/rgb per element (do not rely only on inherited `color`).
   - **Size in this component** — icon width/height in the same context (e.g. card body), not from another section.
   - **Drawing method** — arrow/symbol drawn as filled path or stroked path, and approximate thickness.

   Write this as an "Icon spec" in the block's reference (e.g. in `marubeni-style-analysis.md` or block-by-block section). Implementation must follow this spec so that fill/stroke and size gaps do not occur.

3. **List gaps using the 7 aspects**  
   Compare reference vs current implementation (`blocks/{block-name}/`, theme CSS) and write a **gap list** for:
   - **Size** — font sizes, icon dimensions, spacing
   - **Aspect ratio** — image ratio handling
   - **Color** — background, text, border, accent (exact codes)
   - **Shape** — border-radius, corners
   - **Effects** — box-shadow, transition, transform
   - **Interaction** — hover, focus, active states
   - **Responsive** — breakpoints and layout changes

   (The full checklist including "Icons and SVG" is in `.cursor/skills/analyze-and-plan/resources/visual-analysis.md` §7.)

4. **Implement from the gap list**  
   Apply HTML/CSS/JS changes to close each gap. Re-check after changes.

This reduces the need to point out every visual difference manually; one "align with the reference" request can trigger a full comparison and then targeted fixes.
