# Design alignment with reference site

When aligning blocks or styles with the **reference site** (e.g. Marubeni TOP), follow this workflow so design gaps are found systematically and implemented in one pass.

## Reference artifacts

- **Reference HTML:** `drafts/tmp/import-work/cleaned.html` — scraped structure and class names from the reference site.
- **Style and structure summary:** `drafts/tmp/marubeni-style-analysis.md` — colors, typography, spacing, and block-by-block HTML structure (e.g. Cards).

## Workflow

1. **Read the reference**  
   Open the relevant section in `cleaned.html` and the matching block row in `marubeni-style-analysis.md` (including the "Block-by-block reference structure" subsection).

2. **List gaps using the 7 aspects**  
   Compare reference vs current implementation (`blocks/{block-name}/`, theme CSS) and write a **gap list** for:
   - **Size** — font sizes, icon dimensions, spacing
   - **Aspect ratio** — image ratio handling
   - **Color** — background, text, border, accent (exact codes)
   - **Shape** — border-radius, corners
   - **Effects** — box-shadow, transition, transform
   - **Interaction** — hover, focus, active states
   - **Responsive** — breakpoints and layout changes

   (The same checklist is in `.cursor/skills/analyze-and-plan/resources/visual-analysis.md` §7.)

3. **Implement from the gap list**  
   Apply HTML/CSS/JS changes to close each gap. Re-check after changes.

This reduces the need to point out every visual difference manually; one "align with the reference" request can trigger a full comparison and then targeted fixes.
