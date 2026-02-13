#!/usr/bin/env node
/**
 * Run scrape-webpage (analyze-webpage.js) for Marubeni TOP.
 * Output: drafts/tmp/import-work (metadata.json, cleaned.html, screenshot.png, images/, styles/)
 *
 * Prerequisites (one-time):
 *   cd .cursor/skills/scrape-webpage/scripts
 *   npm install
 *   npm install playwright
 *   npx playwright install chromium
 *
 * Run from aemeds root: node scripts/run-marubeni-scrape.js
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeWebpage } from '../.cursor/skills/scrape-webpage/scripts/analyze-webpage.js';

const dirName = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(dirName, '..', 'drafts', 'tmp', 'import-work');
const url = 'https://www.marubeni.com/jp/';

const result = await analyzeWebpage(url, outputDir);
// eslint-disable-next-line no-console
console.log(JSON.stringify(result, null, 2));
