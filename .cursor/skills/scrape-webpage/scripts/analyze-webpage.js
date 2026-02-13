#!/usr/bin/env node

/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * Analyze Webpage for Migration
 *
 * Uses npm playwright to analyze a webpage and prepare it for content migration.
 *
 * Features:
 * - Scrolls to trigger lazy-loaded content
 * - Captures images and converts to web-friendly formats
 * - Takes full-page screenshot
 * - Extracts cleaned HTML with preserved attributes
 * - Extracts metadata (SEO, Open Graph, etc.)
 *
 * Usage:
 *   node analyze-webpage.js "https://example.com/page" --output ./analysis
 *
 * Requirements:
 *   npm install playwright
 *   npx playwright install chromium
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateDocumentPathInfo } from './generate-path.js';
import { setupImageCapture, waitForPendingImages, replaceImageUrls } from './image-capture.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Scroll through the entire page to trigger lazy-loaded images
 */
async function scrollToTriggerLazyLoad(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}


/**
 * Fix images in the DOM to ensure none are missed during extraction
 * Adapted from site-transfer-agent-importscript/resources/transformers/images.js
 */
async function fixImagesInDom(page, url) {
  await page.evaluate((sourceUrl) => {
    // Helper: Extract URL from background-image CSS property
    function extractUrlFromBackgroundImage(backgroundImage) {
      if (!backgroundImage || backgroundImage.toLowerCase() === 'none') {
        return null;
      }
      const urlMatch = backgroundImage.match(/url\(['"]?([^'")\s]+)['"]?\)/);
      return urlMatch ? urlMatch[1] : null;
    }

    // Helper: Get background image from inline style or data attribute
    function getBackgroundImageFromElement(element) {
      const inlineStyle = element.getAttribute('style');
      if (inlineStyle) {
        const styleParts = inlineStyle.split(';');
        for (const style of styleParts) {
          const [prop, ...valueParts] = style.split(':');
          if (prop?.trim() === 'background-image') {
            return valueParts.join(':').trim();
          }
        }
      }
      const bgImage = window.getComputedStyle(element)?.getPropertyValue('background-image');
      if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
        return bgImage;
      }

      return null;
    }

    // Helper: Extract picture source URL (largest viewport)
    function extractPictureSource(pictureElement) {
      const sources = pictureElement.querySelectorAll('source');
      if (sources.length === 0) return null;

      let largestSource = null;
      let largestMaxWidth = -1;

      for (const source of sources) {
        const mediaQuery = source.getAttribute('media');
        if (!mediaQuery) {
          largestSource = source;
          break;
        }

        const match = mediaQuery.match(/max-width:\s*(\d+)px/);
        if (match) {
          const maxWidth = parseInt(match[1], 10);
          if (maxWidth > largestMaxWidth) {
            largestMaxWidth = maxWidth;
            largestSource = source;
          }
        }
      }

      if (!largestSource) {
        largestSource = sources[sources.length - 1];
      }

      if (largestSource) {
        const srcset = largestSource.getAttribute('srcset');
        if (srcset) {
          return srcset.split(',')[0].trim().split(/\s+/)[0];
        }
      }
      return null;
    }

    // 1. Transform background images to actual img elements
    // Check common elements that often have background images from CSS
    const elementsToCheck = document.body.querySelectorAll('div, section, article, header, footer, aside, main, figure');
    elementsToCheck.forEach((element) => {
      const backgroundImage = getBackgroundImageFromElement(element);
      const src = extractUrlFromBackgroundImage(backgroundImage);
      if (src) {
        const img = document.createElement('img');
        img.src = src;
        element.prepend(img);
        element.style.backgroundImage = 'none';
      }
    });

    // 2. Ensure picture elements have img with src
    const pictures = document.body.querySelectorAll('picture');
    pictures.forEach((picture) => {
      const img = picture.querySelector('img');
      if (!img || !img.src) {
        const newImg = document.createElement('img');
        const src = extractPictureSource(picture);
        if (src) {
          newImg.src = src;
          if (img) {
            img.replaceWith(newImg);
          } else {
            picture.appendChild(newImg);
          }
        }
      }
    });

    // 3. Fix images with srcset but no src
    document.body.querySelectorAll('img').forEach((img) => {
      let src = img.getAttribute('src');
      const srcset = img.getAttribute('srcset')?.split(' ')[0];
      if (!src && srcset) {
        img.setAttribute('src', srcset);
      }
      src = img.getAttribute('src');

      // 4. Convert relative URLs to absolute
      if (src) {
        try {
          new URL(src);
          // Already absolute, leave it
        } catch (e) {
          // Relative URL - convert to absolute
          if (!src.startsWith('/')) {
            src = `./${src}`;
          }
          try {
            const absoluteUrl = new URL(src, sourceUrl);
            img.src = absoluteUrl.toString();
          } catch (err) {
            console.warn(`Unable to adjust image URL ${src}`);
          }
        }
      }
    });

    // 5. Transform inline SVG elements to img with data URLs
    const svgs = document.body.querySelectorAll('svg');
    svgs.forEach((svg) => {
      let svgString = '<svg';
      for (const attr of svg.attributes) {
        svgString += ` ${attr.name}="${attr.value}"`;
      }
      svgString += '>';
      svgString += svg.innerHTML;
      svgString += '</svg>';

      const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
      const img = document.createElement('img');
      img.src = svgDataUrl;
      svg.replaceWith(img);
    });
  }, url);
}

/**
 * Format HTML with proper indentation for readability
 */
function formatHtml(html) {
  let formatted = '';
  let indent = 0;
  const indentSize = 2;

  // Add newlines after tags
  html = html.replace(/></g, '>\n<');

  const lines = html.split('\n');

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Decrease indent for closing tags
    if (trimmed.startsWith('</')) {
      indent = Math.max(0, indent - 1);
    }

    // Add indentation
    formatted += ' '.repeat(indent * indentSize) + trimmed + '\n';

    // Increase indent for opening tags (but not self-closing or immediately closed)
    if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !trimmed.match(/<[^>]+>.*<\/[^>]+>$/)) {
      indent++;
    }
  });

  return formatted.trim();
}

/**
 * Extract cleaned HTML with preserved attributes
 */
async function extractCleanedHTML(page) {
  const html = await page.evaluate(() => {
    // 1. Remove non-content elements
    const selectorsToRemove = [
      'script', 'style', 'noscript'
    ];

    selectorsToRemove.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => el.remove());
    });

    // 2. CRITICAL: Preserve essential attributes, strip all others
    const keepAttributes = ['src', 'href', 'alt', 'title', 'class', 'id'];
    document.body.querySelectorAll('*').forEach(el => {
      const attrs = Array.from(el.attributes);
      attrs.forEach(attr => {
        if (!keepAttributes.includes(attr.name)) {
          el.removeAttribute(attr.name);
        }
      });
    });

    // 3. Return full body HTML (will be formatted on Node.js side)
    return document.body.outerHTML;
  });

  // Format HTML for readability
  return formatHtml(html);
}

/**
 * Extract metadata from page
 */
async function extractMetadata(page) {
  const metadata = await page.evaluate(() => {
    const meta = {};

    // Extract title
    const titleTag = document.querySelector('title');
    if (titleTag) meta.title = titleTag.textContent.trim();

    // Extract all meta tags
    document.querySelectorAll('meta').forEach(tag => {
      const name = tag.getAttribute('name') || tag.getAttribute('property');
      const content = tag.getAttribute('content');
      if (name && content) meta[name] = content;
    });

    // Extract canonical link
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) meta.canonical = canonical.getAttribute('href');

    // Extract JSON-LD
    const jsonLd = document.querySelector('script[type="application/ld+json"]');
    if (jsonLd) {
      try {
        meta.jsonLd = JSON.parse(jsonLd.textContent);
      } catch (e) {
        meta.jsonLd = jsonLd.textContent;
      }
    }

    return meta;
  });

  return metadata;
}

/**
 * Get all stylesheet URLs from the page (link[rel="stylesheet"]).
 * Returns absolute URLs.
 */
async function getStylesheetUrls(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map((link) => link.href)
      .filter(Boolean);
  });
}

/**
 * Fetch each stylesheet URL and save to outputDir/styles/ as 01-<basename>, 02-<basename>, ...
 * Uses the page's request context so same-origin and cookies apply.
 */
async function fetchAndSaveStylesheets(page, urls, outputDir) {
  const stylesDir = path.join(outputDir, 'styles');
  if (!fs.existsSync(stylesDir)) {
    fs.mkdirSync(stylesDir, { recursive: true });
  }

  const saved = [];
  const seenBasenames = new Set();

  for (let i = 0; i < urls.length; i += 1) {
    const cssUrl = urls[i];
    let basename;
    try {
      const u = new URL(cssUrl);
      basename = path.basename(u.pathname) || 'stylesheet.css';
    } catch {
      basename = `stylesheet-${i + 1}.css`;
    }
    basename = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!basename.endsWith('.css')) {
      basename += '.css';
    }
    if (seenBasenames.has(basename)) {
      const ext = path.extname(basename);
      const base = basename.slice(0, -ext.length);
      basename = `${base}-${i + 1}${ext}`;
    }
    seenBasenames.add(basename);

    const prefix = String(i + 1).padStart(2, '0');
    const filename = `${prefix}-${basename}`;
    const filePath = path.join(stylesDir, filename);

    try {
      const response = await page.request.get(cssUrl);
      if (!response.ok()) {
        console.error(`⚠️  Stylesheet ${cssUrl} returned ${response.status()}`);
        continue;
      }
      const body = await response.body();
      fs.writeFileSync(filePath, body, 'utf-8');
      saved.push({ url: cssUrl, filePath });
    } catch (err) {
      console.error(`⚠️  Failed to fetch stylesheet ${cssUrl}: ${err.message}`);
    }
  }

  return saved;
}

/**
 * Get all external script URLs (script[src]).
 */
async function getScriptUrls(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('script[src]'))
      .map((s) => s.src)
      .filter(Boolean);
  });
}

/**
 * Fetch URLs and save to outputDir/subdir with unique filenames (01-basename, 02-basename, ...).
 */
async function fetchAndSaveAssets(page, urls, outputDir, subdir, defaultExt) {
  const dir = path.join(outputDir, subdir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const saved = [];
  const seen = new Set();

  for (let i = 0; i < urls.length; i += 1) {
    const assetUrl = urls[i];
    let basename;
    try {
      const u = new URL(assetUrl);
      basename = path.basename(u.pathname) || `asset-${i + 1}${defaultExt}`;
    } catch {
      basename = `asset-${i + 1}${defaultExt}`;
    }
    basename = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (seen.has(basename)) {
      const ext = path.extname(basename) || defaultExt;
      const base = basename.slice(0, -ext.length) || basename;
      basename = `${base}-${i + 1}${ext}`;
    }
    seen.add(basename);

    const prefix = String(i + 1).padStart(2, '0');
    const filename = `${prefix}-${basename}`;
    const filePath = path.join(dir, filename);

    try {
      const response = await page.request.get(assetUrl);
      if (!response.ok()) {
        console.error(`⚠️  ${subdir} ${assetUrl} returned ${response.status()}`);
        continue;
      }
      const body = await response.body();
      fs.writeFileSync(filePath, body);
      saved.push({ url: assetUrl, filePath });
    } catch (err) {
      console.error(`⚠️  Failed to fetch ${subdir} ${assetUrl}: ${err.message}`);
    }
  }
  return saved;
}

/**
 * Get inline <style> tag contents concatenated.
 */
async function getInlineStyles(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent)
      .filter(Boolean)
      .join('\n\n/* --- next style tag --- */\n\n');
  });
}

/**
 * Parse CSS content for @font-face src url() and url(*.svg). baseUrl is the URL of the CSS file for resolving relative URLs.
 */
function extractAssetUrlsFromCss(cssContent, baseUrl) {
  const fonts = [];
  const svgs = [];
  const urlRe = /url\(['"]?([^'")\s]+)['"]?\)/g;
  let match;
  const base = baseUrl ? baseUrl.replace(/\/[^/]*$/, '/') : '';

  const fontBlockRe = /@font-face\s*\{[^}]*\}/g;
  let block;
  while ((block = fontBlockRe.exec(cssContent)) !== null) {
    const blockStr = block[0];
    const urlsInBlock = blockStr.match(urlRe);
    if (urlsInBlock) {
      urlsInBlock.forEach((u) => {
        const raw = u.replace(/^url\(['"]?|['"]?\)$/g, '').trim();
        const resolved = base ? new URL(raw, base).href : raw;
        if (!fonts.includes(resolved)) fonts.push(resolved);
      });
    }
  }

  urlRe.lastIndex = 0;
  while ((match = urlRe.exec(cssContent)) !== null) {
    const raw = match[1].trim();
    if (!/\.(svg|SVG)(\?|$)/.test(raw)) continue;
    const resolved = base ? new URL(raw, base).href : raw;
    if (!svgs.includes(resolved)) svgs.push(resolved);
  }

  return { fonts, svgs };
}

/**
 * Get SVG URLs from DOM (img[src], object[data], etc.).
 */
async function getSvgUrlsFromPage(page) {
  return page.evaluate(() => {
    const urls = new Set();
    document.querySelectorAll('img[src*=".svg"], object[data*=".svg"], image[href*=".svg"]').forEach((el) => {
      const u = el.src || el.data || el.getAttribute?.('href');
      if (u && u.includes('.svg')) urls.add(u);
    });
    return Array.from(urls);
  });
}

// --- Design extract: parse CSS and page for design tokens ---

/**
 * Extract @media breakpoints from CSS. sourceLabel is e.g. "01-common.min.css".
 */
function extractBreakpointsFromCss(cssContent, sourceLabel) {
  const breakpoints = [];
  const mediaRe = /@media\s*\(([^)]+)\)/g;
  let m;
  while ((m = mediaRe.exec(cssContent)) !== null) {
    const condition = m[1].trim();
    breakpoints.push({ condition, source: sourceLabel });
  }
  return breakpoints;
}

/**
 * Extract root font-size from :root or html in CSS.
 */
function extractRootFontFromCss(cssContent) {
  const rootBlockRe = /(:root|html)\s*\{([^}]*)\}/g;
  let m;
  while ((m = rootBlockRe.exec(cssContent)) !== null) {
    const block = m[2];
    const fontSizeMatch = block.match(/font-size\s*:\s*([^;]+)/);
    if (fontSizeMatch) return fontSizeMatch[1].trim();
  }
  return null;
}

/**
 * Extract @keyframes name and content from CSS. Simple brace-counting for block end.
 */
function extractKeyframesFromCss(cssContent) {
  const keyframes = [];
  const keyframesRe = /@keyframes\s+([^{]+)\s*\{/g;
  let m;
  while ((m = keyframesRe.exec(cssContent)) !== null) {
    const name = m[1].trim();
    const start = m.index + m[0].length;
    let depth = 1;
    let end = start;
    while (end < cssContent.length && depth > 0) {
      const ch = cssContent[end];
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      end += 1;
    }
    const content = cssContent.slice(start, end - 1).trim();
    keyframes.push({ name, content });
  }
  return keyframes;
}

/**
 * Extract color values from CSS (color, background, border-color, fill, stroke, box-shadow, etc.).
 */
function extractColorsFromCss(cssContent) {
  const colorRe = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|rgb\s*\([^)]+\)|rgba\s*\([^)]+\)|hsl\s*\([^)]+\)|hsla\s*\([^)]+\)|\btransparent\b/g;
  const seen = new Set();
  let m;
  colorRe.lastIndex = 0;
  while ((m = colorRe.exec(cssContent)) !== null) {
    const raw = m[0].trim();
    if (!seen.has(raw)) seen.add(raw);
  }
  return Array.from(seen);
}

/**
 * Extract box-shadow and filter declaration values from CSS.
 */
function extractShadowsAndFiltersFromCss(cssContent) {
  const boxShadows = [];
  const filters = [];
  const shadowRe = /(?:-webkit-)?box-shadow\s*:\s*([^;]+);/g;
  let m;
  while ((m = shadowRe.exec(cssContent)) !== null) {
    const v = m[1].trim();
    if (v && !boxShadows.includes(v)) boxShadows.push(v);
  }
  const filterRe = /(?:-webkit-)?filter\s*:\s*([^;]+);/g;
  filterRe.lastIndex = 0;
  while ((m = filterRe.exec(cssContent)) !== null) {
    const v = m[1].trim();
    if (v && !filters.includes(v)) filters.push(v);
  }
  return { boxShadows, filters };
}

/**
 * Extract rules whose selector contains ::before or ::after. Simple rule scan.
 */
function extractPseudoElementsFromCss(cssContent) {
  const rules = [];
  const ruleRe = /([^{]+)\s*\{([^}]*)\}/g;
  let m;
  while ((m = ruleRe.exec(cssContent)) !== null) {
    const selector = m[1].trim();
    if (selector.includes('::before') || selector.includes('::after')) {
      rules.push({ selector, declarations: m[2].trim() });
    }
  }
  return rules;
}

/**
 * Extract base selectors that have :hover or :focus (for runtime style sampling).
 */
function extractHoverSelectorsFromCss(cssContent) {
  const baseSelectors = new Set();
  const selectorRe = /([^{]+)\s*\{/g;
  const pseudoRe = /\s*:(?:hover|focus(?:-visible)?)(?=[\s,\)]|$)/g;
  let m;
  while ((m = selectorRe.exec(cssContent)) !== null) {
    const full = m[1].trim();
    if (!full.includes(':hover') && !full.includes(':focus')) continue;
    full.split(',').forEach((part) => {
      const base = part.trim().replace(pseudoRe, '').replace(/\s+/g, ' ').trim();
      if (base.length > 0) baseSelectors.add(base);
    });
  }
  return Array.from(baseSelectors);
}

/**
 * Get image natural dimensions from the page.
 */
async function getImageDimensions(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map((img) => ({
      src: img.currentSrc || img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    }));
  });
}

/** CSS properties to capture for block computed styles (e.g. Cards). */
const BLOCK_COMPUTED_STYLE_PROPS = [
  'color', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'border-width', 'border-radius', 'border-color', 'border-style',
  'box-shadow', 'background-color', 'background-image',
  'gap', 'display', 'flex-direction', 'align-items', 'justify-content',
  'text-decoration', 'opacity', 'transform'
];

/**
 * Get computed styles for all elements inside a container. Dedupes by signature (tag + class).
 * Returns array of { signature, tag, className, styles }.
 */
/**
 * Get icon-specific computed data for the first card icon in a container (e.g. .p-home__about ul.c-card-list).
 * Returns computed style for .c-icon-link__icon and rect/svg metrics for its first child.
 */
async function getCardsIconComputed(page, containerSelector) {
  return page.evaluate(({ selector }) => {
    const container = document.querySelector(selector);
    if (!container) return { containerFound: false };
    const icon = container.querySelector('.c-icon-link__icon');
    if (!icon) return { containerFound: true, iconFound: false };
    const cs = getComputedStyle(icon);
    const iconStyles = {
      width: cs.width,
      height: cs.height,
      color: cs.color,
      margin: cs.margin,
      marginTop: cs.marginTop,
      padding: cs.padding,
      display: cs.display,
      position: cs.position
    };
    const child = icon.firstElementChild;
    let childData = null;
    if (child) {
      const rect = child.getBoundingClientRect();
      childData = {
        tagName: child.tagName,
        width: rect.width,
        height: rect.height,
        src: child.tagName === 'IMG' && child.src ? child.src.slice(0, 120) : undefined
      };
      if (child.tagName === 'svg' || child.namespaceURI?.includes('svg')) {
        try {
          const circle = child.querySelector('circle');
          if (circle) {
            childData.circle = {
              r: circle.getAttribute('r'),
              cx: circle.getAttribute('cx'),
              cy: circle.getAttribute('cy'),
              stroke: circle.getAttribute('stroke') || cs.color,
              strokeWidth: circle.getAttribute('stroke-width') || getComputedStyle(circle).strokeWidth
            };
          }
        } catch (e) {
          childData.svgError = String(e.message);
        }
      }
    }
    return {
      containerFound: true,
      iconFound: true,
      containerSelector: selector,
      icon: { styles: iconStyles, child: childData }
    };
  }, { selector: containerSelector });
}

async function getComputedStylesForContainer(page, containerSelector, props = BLOCK_COMPUTED_STYLE_PROPS) {
  return page.evaluate(({ selector, styleProps }) => {
    const container = document.querySelector(selector);
    if (!container) return { containerFound: false, entries: [] };
    const elements = [container, ...container.querySelectorAll('*')];
    const seen = new Set();
    const entries = [];
    for (const el of elements) {
      const tag = el.tagName.toLowerCase();
      const rawClass = (el.className && typeof el.className === 'string')
        ? el.className
        : (el.className && el.className.baseVal != null) ? el.className.baseVal : '';
      const cls = rawClass.trim().split(/\s+/).filter(Boolean).join('.');
      const signature = cls ? `${tag}.${cls}` : tag;
      if (seen.has(signature)) continue;
      seen.add(signature);
      const c = getComputedStyle(el);
      const styles = {};
      styleProps.forEach((p) => {
        const v = c.getPropertyValue(p);
        if (v) styles[p] = v;
      });
      entries.push({ signature, tag, className: rawClass, styles });
    }
    return { containerFound: true, containerSelector: selector, entries };
  }, { selector: containerSelector, styleProps: props });
}

/**
 * Main analysis function
 */
async function analyzeWebpage(url, outputDir) {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.error(`Analyzing: ${url}`);
  console.error(`Output directory: ${outputDir}`);

  // Launch browser
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Set up image capture BEFORE navigation
    console.error('Setting up image capture...');
    const captureState = setupImageCapture(page, outputDir);

    // Navigate to page
    console.error('Navigating to page...');
    try {
      // Try networkidle first (most reliable when it works)
      await page.goto(url);
    } catch (error) {
      // Fall back to domcontentloaded if networkidle times out
      console.error('⚠️  networkidle timeout, falling back to domcontentloaded...');
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000); // Give page extra time to settle
    }

    // Scroll to trigger lazy loading
    console.error('Scrolling to trigger lazy-loaded content...');
    await scrollToTriggerLazyLoad(page);
    await page.waitForTimeout(1000); // Give lazy-loaded images time to populate

    // Wait for all pending images to complete
    console.error(`Waiting for ${captureState.pendingImages.size} pending images...`);
    await waitForPendingImages(captureState, 5000);
    console.error(`✅ Image capture complete: ${captureState.stats.total} total, ${captureState.stats.converted} converted, ${captureState.stats.failed} failed`);

    // Take screenshot
    console.error('Capturing screenshot...');
    const screenshot = path.join(outputDir, 'screenshot.png');
    await page.screenshot({ path: screenshot, fullPage: true });

    // Extract metadata
    console.error('Extracting metadata...');
    const metadata = await extractMetadata(page);

    // Fetch and save stylesheets (method 1: collect link[rel="stylesheet"] URLs, then fetch each)
    console.error('Fetching stylesheets...');
    const stylesheetUrls = await getStylesheetUrls(page);
    const stylesDir = path.join(outputDir, 'styles');
    const stylesSaved = await fetchAndSaveStylesheets(page, stylesheetUrls, outputDir);
    console.error(`✅ Stylesheets: ${stylesSaved.length} saved to ${stylesDir}`);

    // Fetch scripts
    console.error('Fetching scripts...');
    const scriptUrls = await getScriptUrls(page);
    const scriptsDir = path.join(outputDir, 'scripts');
    const scriptsSaved = await fetchAndSaveAssets(page, scriptUrls, outputDir, 'scripts', '.js');
    console.error(`✅ Scripts: ${scriptsSaved.length} saved to ${scriptsDir}`);

    // Inline styles
    console.error('Extracting inline styles...');
    const inlineStylesContent = await getInlineStyles(page);
    const inlineStylesPath = path.join(stylesDir, 'inline-styles.css');
    if (inlineStylesContent) {
      fs.writeFileSync(inlineStylesPath, inlineStylesContent, 'utf-8');
    }
    console.error(`✅ Inline styles: ${inlineStylesContent ? 'saved' : 'none'} to ${inlineStylesPath}`);

    // Parse saved CSS for @font-face and url(*.svg), then fetch
    const allFontUrls = new Set();
    const allSvgUrlsFromCss = new Set();
    for (let i = 0; i < stylesSaved.length; i += 1) {
      try {
        const cssPath = stylesSaved[i].filePath;
        const cssContent = fs.readFileSync(cssPath, 'utf-8');
        const baseUrl = stylesSaved[i].url;
        const { fonts, svgs } = extractAssetUrlsFromCss(cssContent, baseUrl);
        fonts.forEach((u) => allFontUrls.add(u));
        svgs.forEach((u) => allSvgUrlsFromCss.add(u));
      } catch (e) {
        console.error(`⚠️  Could not read CSS for asset extraction: ${stylesSaved[i].filePath}`);
      }
    }

    console.error('Fetching fonts from CSS...');
    const fontsDir = path.join(outputDir, 'fonts');
    const fontsSaved = await fetchAndSaveAssets(
      page,
      Array.from(allFontUrls),
      outputDir,
      'fonts',
      '.woff2'
    );
    console.error(`✅ Fonts: ${fontsSaved.length} saved to ${fontsDir}`);

    const svgUrlsFromPage = await getSvgUrlsFromPage(page);
    const allSvgUrls = new Set([...allSvgUrlsFromCss, ...svgUrlsFromPage]);
    console.error('Fetching SVGs (from CSS + DOM)...');
    const svgsDir = path.join(outputDir, 'svgs');
    const svgsSaved = await fetchAndSaveAssets(
      page,
      Array.from(allSvgUrls),
      outputDir,
      'svgs',
      '.svg'
    );
    console.error(`✅ SVGs: ${svgsSaved.length} saved to ${svgsDir}`);

    // Design extract: breakpoints, root font, keyframes, colors, shadows/filters, pseudo-elements, image dimensions, hover styles
    const designExtractDir = path.join(outputDir, 'design-extract');
    fs.mkdirSync(designExtractDir, { recursive: true });
    const designExtractFiles = [];
    const cssFilesWithContent = [];
    for (let i = 0; i < stylesSaved.length; i += 1) {
      try {
        const content = fs.readFileSync(stylesSaved[i].filePath, 'utf-8');
        const label = path.basename(stylesSaved[i].filePath);
        cssFilesWithContent.push({ sourceLabel: label, content });
      } catch (e) {
        console.error(`⚠️  Skip CSS for design extract: ${stylesSaved[i].filePath}`);
      }
    }
    if (inlineStylesContent) {
      cssFilesWithContent.push({ sourceLabel: 'inline-styles.css', content: inlineStylesContent });
    }
    const concatenatedCss = cssFilesWithContent.map((f) => f.content).join('\n');

    const HOVER_STYLE_PROPS = ['color', 'background-color', 'border-color', 'transform', 'opacity', 'box-shadow'];

    try {
      const breakpointsAll = [];
      for (const f of cssFilesWithContent) {
        const list = extractBreakpointsFromCss(f.content, f.sourceLabel);
        breakpointsAll.push(...list);
      }
      const breakpointsPath = path.join(designExtractDir, 'breakpoints.json');
      fs.writeFileSync(breakpointsPath, JSON.stringify({ breakpoints: breakpointsAll }, null, 2), 'utf-8');
      designExtractFiles.push({ name: 'breakpoints', filePath: breakpointsPath });
      console.error(`✅ Design extract: breakpoints (${breakpointsAll.length})`);
    } catch (e) {
      console.error(`⚠️  Design extract breakpoints failed: ${e.message}`);
    }

    try {
      const fromCss = extractRootFontFromCss(concatenatedCss);
      const computed = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).fontSize;
      });
      const rootFontPath = path.join(designExtractDir, 'root-font.json');
      fs.writeFileSync(rootFontPath, JSON.stringify({ fromCss, computed }, null, 2), 'utf-8');
      designExtractFiles.push({ name: 'root-font', filePath: rootFontPath });
      console.error('✅ Design extract: root-font');
    } catch (e) {
      console.error(`⚠️  Design extract root-font failed: ${e.message}`);
    }

    try {
      const keyframes = extractKeyframesFromCss(concatenatedCss);
      const keyframesPath = path.join(designExtractDir, 'keyframes.json');
      fs.writeFileSync(keyframesPath, JSON.stringify({ keyframes }, null, 2), 'utf-8');
      designExtractFiles.push({ name: 'keyframes', filePath: keyframesPath });
      console.error(`✅ Design extract: keyframes (${keyframes.length})`);
    } catch (e) {
      console.error(`⚠️  Design extract keyframes failed: ${e.message}`);
    }

    try {
      const images = await getImageDimensions(page);
      const imageDimsPath = path.join(designExtractDir, 'image-dimensions.json');
      fs.writeFileSync(imageDimsPath, JSON.stringify({ images }, null, 2), 'utf-8');
      designExtractFiles.push({ name: 'image-dimensions', filePath: imageDimsPath });
      console.error(`✅ Design extract: image-dimensions (${images.length})`);
    } catch (e) {
      console.error(`⚠️  Design extract image-dimensions failed: ${e.message}`);
    }

    try {
      const colors = extractColorsFromCss(concatenatedCss);
      const colorsPath = path.join(designExtractDir, 'colors.json');
      fs.writeFileSync(colorsPath, JSON.stringify({ colors, sources: 'from CSS declarations' }, null, 2), 'utf-8');
      designExtractFiles.push({ name: 'colors', filePath: colorsPath });
      console.error(`✅ Design extract: colors (${colors.length})`);
    } catch (e) {
      console.error(`⚠️  Design extract colors failed: ${e.message}`);
    }

    try {
      const { boxShadows, filters } = extractShadowsAndFiltersFromCss(concatenatedCss);
      const shadowsPath = path.join(designExtractDir, 'shadows-filters.json');
      fs.writeFileSync(shadowsPath, JSON.stringify({ boxShadows, filters }, null, 2), 'utf-8');
      designExtractFiles.push({ name: 'shadows-filters', filePath: shadowsPath });
      console.error(`✅ Design extract: shadows-filters`);
    } catch (e) {
      console.error(`⚠️  Design extract shadows-filters failed: ${e.message}`);
    }

    try {
      const rules = extractPseudoElementsFromCss(concatenatedCss);
      const pseudoPath = path.join(designExtractDir, 'pseudo-elements.json');
      fs.writeFileSync(pseudoPath, JSON.stringify({ rules }, null, 2), 'utf-8');
      designExtractFiles.push({ name: 'pseudo-elements', filePath: pseudoPath });
      console.error(`✅ Design extract: pseudo-elements (${rules.length})`);
    } catch (e) {
      console.error(`⚠️  Design extract pseudo-elements failed: ${e.message}`);
    }

    try {
      const baseSelectors = extractHoverSelectorsFromCss(concatenatedCss);
      const entries = [];
      for (const selector of baseSelectors) {
        try {
          const count = await page.locator(selector).count();
          if (count === 0) continue;
          const defaultStyles = await page.evaluate((sel, props) => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const c = getComputedStyle(el);
            const o = {};
            props.forEach((p) => { o[p] = c.getPropertyValue(p); });
            return o;
          }, selector, HOVER_STYLE_PROPS);
          if (!defaultStyles) continue;
          await page.hover(selector).catch(() => null);
          const hoverStyles = await page.evaluate((sel, props) => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const c = getComputedStyle(el);
            const o = {};
            props.forEach((p) => { o[p] = c.getPropertyValue(p); });
            return o;
          }, selector, HOVER_STYLE_PROPS);
          entries.push({ selector, default: defaultStyles, hover: hoverStyles || defaultStyles });
        } catch (err) {
          // Skip this selector
        }
      }
      const hoverPath = path.join(designExtractDir, 'hover-styles.json');
      fs.writeFileSync(hoverPath, JSON.stringify({ entries }, null, 2), 'utf-8');
      designExtractFiles.push({ name: 'hover-styles', filePath: hoverPath });
      console.error(`✅ Design extract: hover-styles (${entries.length})`);
    } catch (e) {
      console.error(`⚠️  Design extract hover-styles failed: ${e.message}`);
    }

    try {
      const cardsContainerSelector = '.p-home__about ul.c-card-list';
      const cardsComputed = await getComputedStylesForContainer(page, cardsContainerSelector);
      const cardsPath = path.join(designExtractDir, 'cards-computed-styles.json');
      fs.writeFileSync(cardsPath, JSON.stringify(cardsComputed, null, 2), 'utf-8');
      designExtractFiles.push({ name: 'cards-computed-styles', filePath: cardsPath });
      const count = cardsComputed.entries ? cardsComputed.entries.length : 0;
      console.error(`✅ Design extract: cards-computed-styles (${cardsComputed.containerFound ? count : 0} entries)`);
    } catch (e) {
      console.error(`⚠️  Design extract cards-computed-styles failed: ${e.message}`);
    }

    try {
      const cardsIconSelector = '.p-home__about ul.c-card-list';
      const cardsIconComputed = await getCardsIconComputed(page, cardsIconSelector);
      const cardsIconPath = path.join(designExtractDir, 'cards-icon-computed.json');
      fs.writeFileSync(cardsIconPath, JSON.stringify(cardsIconComputed, null, 2), 'utf-8');
      designExtractFiles.push({ name: 'cards-icon-computed', filePath: cardsIconPath });
      console.error(`✅ Design extract: cards-icon-computed (${cardsIconComputed.iconFound ? 'ok' : 'no icon'})`);
    } catch (e) {
      console.error(`⚠️  Design extract cards-icon-computed failed: ${e.message}`);
    }

    // Disable image capture (images already captured)
    captureState.disable();

    // Fix images in DOM (background images, picture elements, relative URLs, inline SVGs)
    console.error('Fixing images in DOM...');
    await fixImagesInDom(page, url);

    // Extract cleaned HTML
    console.error('Extracting cleaned HTML...');
    let html = await extractCleanedHTML(page);

    // Replace image URLs with local paths
    console.error('Replacing image URLs with local paths...');
    html = replaceImageUrls(html, captureState.imageMap);

    const htmlPath = path.join(outputDir, 'cleaned.html');
    fs.writeFileSync(htmlPath, html, 'utf-8');

    // Generate document paths
    console.error('Generating document paths...');
    const paths = generateDocumentPathInfo(url);

    // Build result object
    const result = {
      url,
      timestamp: new Date().toISOString(),
      paths: {
        documentPath: paths.documentPath,
        htmlFilePath: paths.htmlFilePath,
        mdFilePath: paths.mdFilePath,
        dirPath: paths.dirPath,
        filename: paths.filename
      },
      screenshot,
      html: {
        filePath: htmlPath,
        size: html.length
      },
      metadata,
      images: {
        count: captureState.imageMap.size,
        mapping: Object.fromEntries(captureState.imageMap),
        stats: captureState.stats
      },
      styles: {
        dirPath: stylesDir,
        count: stylesSaved.length,
        files: stylesSaved,
        inlineStylesPath: inlineStylesContent ? inlineStylesPath : null
      },
      scripts: {
        dirPath: scriptsDir,
        count: scriptsSaved.length,
        files: scriptsSaved
      },
      fonts: {
        dirPath: fontsDir,
        count: fontsSaved.length,
        files: fontsSaved
      },
      svgs: {
        dirPath: svgsDir,
        count: svgsSaved.length,
        files: svgsSaved
      },
      designExtract: {
        dirPath: designExtractDir,
        files: designExtractFiles
      }
    };

    // Save metadata.json file
    const metadataPath = path.join(outputDir, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(result, null, 2), 'utf-8');
    console.error(`Saved metadata to: ${metadataPath}`);

    console.error('Analysis complete!');

    return result;
  } finally {
    await browser.close();
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.error(`
Usage: node analyze-webpage.js <url> [--output <dir>]

Analyze a webpage and prepare it for content migration.

Arguments:
  <url>              URL of the webpage to analyze (required)
  --output <dir>     Output directory for artifacts (default: ./page-analysis)

Examples:
  node analyze-webpage.js "https://example.com/page"
  node analyze-webpage.js "https://example.com/page" --output ./my-analysis

Output:
  - screenshot.png            Screenshot of the page
  - cleaned.html              Extracted HTML with preserved attributes
  - metadata.json             Complete analysis results
  - images/                   Downloaded images

Requirements:
  npm install playwright
  npx playwright install chromium
`);
    process.exit(args.length === 0 ? 1 : 0);
  }

  const url = args[0];
  let outputDir = './page-analysis';

  // Parse --output flag
  const outputIndex = args.indexOf('--output');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    outputDir = args[outputIndex + 1];
  }

  try {
    const result = await analyzeWebpage(url, outputDir);

    // Output JSON to stdout (stderr used for progress messages above)
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Error analyzing webpage: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  analyzeWebpage,
  scrollToTriggerLazyLoad,
  extractCleanedHTML,
  extractMetadata,
  getStylesheetUrls,
  fetchAndSaveStylesheets
};
