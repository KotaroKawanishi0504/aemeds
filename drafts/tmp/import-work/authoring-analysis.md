# Authoring analysis: Marubeni TOP (page-import)

**Source:** metadata.json + cleaned.html from scrape-webpage (https://www.marubeni.com/jp/).  
**identify-page-structure:** Main content inside `<main id="main">`; header/footer excluded (fragments).

## Section → block mapping

| Section | Content description | Decision | Block / default |
|---------|---------------------|----------|------------------|
| 1 | Hero carousel (video/image + link) | Block | Hero (first slide only for initial import) |
| 2 | Spotlight cards (決算説明会, 決算情報, Scope) | Block | Carousel or Cards |
| 3 | 社長メッセージ CTA (message image + text) | Block | Default content (heading + link + image) |
| 4 | 丸紅について (about heading + cards) | Block | Default content + Cards if needed |
| 5 | 最新情報 (tabs: What's New, リリース, お知らせ, IR, 丸紅グループ) + news list | Block | Tabs + News list |
| 6+ | Banners / links (IR, 採用, etc.) | Default or Notice banner | Notice banner / default |

## Paths (from metadata.json)

- **htmlFilePath:** /jp/index.plain.html
- **dirPath:** /jp
- **Images:** jp/images/ (same directory as HTML)

## Block structures used

- **Hero:** image URL, alt, text (h1/link)
- **Cards:** each row = image + title (link); 3 cards for spotlight
- **Tabs:** row 1 = tab labels; rows 2+ = panel content (news-list in first panel)
- **News list:** each row = date, category, title (link)
