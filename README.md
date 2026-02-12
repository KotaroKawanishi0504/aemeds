# Your Project's Title...
Your project's description...

## Environments
- Preview: https://main--{repo}--{owner}.aem.page/
- Live: https://main--{repo}--{owner}.aem.live/

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on [www.aem.live](https://www.aem.live/docs/) and [experienceleague.adobe.com](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/edge-delivery/wysiwyg-authoring/authoring), more specifically:
1. [Getting Started](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/edge-delivery/wysiwyg-authoring/edge-dev-getting-started), [Creating Blocks](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/edge-delivery/wysiwyg-authoring/create-block), [Content Modelling](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/edge-delivery/wysiwyg-authoring/content-modeling)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

Furthremore, we encourage you to watch the recordings of any of our previous presentations or sessions:
- [Getting started with AEM Authoring and Edge Delivery Services](https://experienceleague.adobe.com/en/docs/events/experience-manager-gems-recordings/gems2024/aem-authoring-and-edge-delivery)

## Prerequisites

- nodejs 18.3.x or newer
- AEM Cloud Service release 2024.8 or newer (>= `17465`)

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Create a new repository based on the `aem-boilerplate` template
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)

## Marubeni: Header and Footer (Fragments)

Header and footer are loaded as **fragments**. Create these in AEM so they are available at:

- **Nav (header)**: Path resolved from page metadata `nav` or default `/nav`. Create content at `/content/marubeni/jp/nav` (or set metadata `nav` to your nav path).
- **Footer**: Path resolved from page metadata `footer` or default `/footer`. Create content at `/content/marubeni/jp/footer` (or set metadata `footer` to your footer path).

Each fragment is a normal page; its main content is included in the header or footer block. Use `.plain.html` delivery for fragment content (e.g. `/nav.plain.html`, `/footer.plain.html`).

## Marubeni: EDS skills (block development, content migration, style alignment)

- **[docs/SETUP_EDS_SKILLS.md](docs/SETUP_EDS_SKILLS.md)** – How to clone the Adobe EDS skills repo and copy skills into `.cursor/skills/`.
- **[docs/MARUBENI_EDS_SKILLS.md](docs/MARUBENI_EDS_SKILLS.md)** – When and in what order to use each skill (style alignment, page import, new blocks).
- **[docs/MARUBENI_EDS_SKILLS_JA.md](docs/MARUBENI_EDS_SKILLS_JA.md)** – 日本語解説：どのスキルが使えるか／スキル外で行う必要があること。
- **drafts/tmp/marubeni-style-analysis.md** – Template for visual analysis output (analyze-and-plan). Fill it, then use building-blocks to apply CSS.
- **styles/marubeni-theme.css** – Marubeni overrides for CSS custom properties; load after `styles.css` when serving Marubeni content.
- **[docs/PAGE_IMPORT_TOP.md](docs/PAGE_IMPORT_TOP.md)** – 丸紅TOPのページインポート手順（スクレープ〜プレビュー〜配置）。
