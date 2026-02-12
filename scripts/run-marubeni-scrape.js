#!/usr/bin/env node
/**
 * Run scrape-webpage (analyze-webpage.js) for Marubeni TOP.
 * Output: drafts/tmp/import-work (metadata.json, cleaned.html, screenshot.png, images/)
 *
 * Prerequisites (one-time):
 *   cd .cursor/skills/scrape-webpage/scripts
 *   npm install
 *   npm install playwright
 *   npx playwright install chromium
 *
 * Run from aemeds root: node scripts/run-marubeni-scrape.js
 */
import { analyzeWebpage } from '../.cursor/skills/scrape-webpage/scripts/analyze-webpage.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, '..', 'drafts', 'tmp', 'import-work');
const url = 'https://www.marubeni.com/jp/';

const result = await analyzeWebpage(url, outputDir);
console.log(JSON.stringify(result, null, 2));
