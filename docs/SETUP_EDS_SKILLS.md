# EDS Skills Setup for Marubeni Project

This project follows the [Marubeni EDS Skills Plan](https://github.com/adobe/skills/tree/main/skills/aem/edge-delivery-services/skills) for block development, content migration, and style alignment. Use this guide to install and use the Adobe EDS skills locally.

## 1. Clone the Adobe skills repository

```bash
git clone https://github.com/adobe/skills.git adobe-skills
cd adobe-skills
```

## 2. Copy skills into this project

Copy the skills you need from `adobe-skills/skills/aem/edge-delivery-services/skills/` into this project's skill directory.

**Recommended location (Cursor):** `.cursor/skills/`  
**Alternative (Claude):** `.claude/skills/`

**Skills to copy for Marubeni (minimal set):**

| Skill folder name | Use case |
|------------------|----------|
| `content-driven-development` | Overall flow for style alignment, new blocks, block changes |
| `analyze-and-plan` | Visual analysis and acceptance criteria (e.g. Marubeni TOP) |
| `building-blocks` | Block implementation and CSS (uses `resources/css-guidelines.md`) |
| `block-collection-and-party` | Reference block structure and samples |
| `testing-blocks` | Lint, browser checks, screenshots |
| `content-modeling` | Block table structure design |
| `page-import` | One-page import orchestrator |
| `scrape-webpage` | Fetch Marubeni page HTML, metadata, images |
| `identify-page-structure` | Section boundaries and content sequences |
| `page-decomposition` | Section-level block candidates |
| `authoring-analysis` | Default content vs block assignment |
| `generate-import-html` | EDS-ready HTML generation |
| `preview-import` | Local preview of import result |
| `find-test-content` | Find pages with blocks for testing |
| `block-inventory` | List available blocks |
| `docs-search` | aem.live / docs search |
| `code-review` | PR checklist |

**Copy command example (PowerShell):**

- If `adobe-skills` is next to `aemeds` (e.g. `eds/adobe-skills` and `eds/aemeds`), run from **aemeds**:

```powershell
cd "c:\Users\kawanish\OneDrive - Adobe\Desktop\Work\Cursor\eds\aemeds"
$src = "c:\Users\kawanish\OneDrive - Adobe\Desktop\Work\Cursor\eds\adobe-skills\skills\aem\edge-delivery-services\skills"
$dst = ".cursor\skills"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
@(
  "content-driven-development", "analyze-and-plan", "building-blocks", "block-collection-and-party",
  "testing-blocks", "content-modeling", "page-import", "scrape-webpage", "identify-page-structure",
  "page-decomposition", "authoring-analysis", "generate-import-html", "preview-import",
  "find-test-content", "block-inventory", "docs-search", "code-review"
) | ForEach-Object { if (Test-Path "$src\$_") { Copy-Item -Path "$src\$_" -Destination "$dst\$_" -Recurse -Force; Write-Host "Copied: $_" } else { Write-Host "Skip (not found): $_" } }
```

- Or use your own paths: set `$src` to your `adobe-skills\skills\aem\edge-delivery-services\skills` and `$dst` to `aemeds\.cursor\skills`.

## 3. Script dependencies (optional)

**When is #3 needed?** Only when you **actually run** the Node scripts below. If you use the skills only as **procedure guides** (e.g. AI follows SKILL.md for style alignment, building-blocks, or page-import steps without running scripts), you can skip #3.

**Where to install:** Each skill has its own `scripts/` with a `package.json`. Install dependencies **inside that skill’s scripts folder**, not in the aemeds project root.

| Skill | Script | Dependencies (run `npm i` in that skill’s `scripts/`) |
|-------|--------|--------------------------------------------------------|
| **block-collection-and-party** | `get-block-structure.js` | `jsdom` (in package.json) |
| **scrape-webpage** | `analyze-webpage.js` | `sharp` (in package.json); **Playwright** is required by the script but not listed — run `npm i playwright` and `npx playwright install chromium` in `scrape-webpage/scripts/` |
| **find-test-content** | `find-block-content.js` | `jsdom` (in package.json) |
| **code-review** | `capture-screenshots.js` | `playwright` (in package.json) |
| **docs-search** | `search.js` | None (Node built-ins + fetch) |

**Example (only if you run the scrape script):**

```bash
cd aemeds/.cursor/skills/scrape-webpage/scripts
npm install
npm install playwright
npx playwright install chromium
node analyze-webpage.js "https://www.marubeni.com/jp/" --output ./import-work
```

The **aemeds** root `package.json` does not need these dependencies; they stay in the skill folders.

## 4. How to use skills in Cursor

- Place skills under `.cursor/skills/` (each skill = folder with `SKILL.md` and optional `resources/`, `scripts/`).
- In chat or agent mode, refer to the skill by name, e.g.:
  - "Follow **content-driven-development** for style alignment."
  - "Run **analyze-and-plan** (Visual Analysis) for Marubeni TOP and output to `drafts/tmp/marubeni-style-analysis.md`."
  - "Use **building-blocks** Step 4 to apply CSS custom properties from the style analysis."

See [MARUBENI_EDS_SKILLS.md](./MARUBENI_EDS_SKILLS.md) for usage order and workflows.
