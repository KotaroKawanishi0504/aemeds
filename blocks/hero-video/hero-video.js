import { readBlockConfig } from '../../scripts/aem.js';

/**
 * Get single URL from config value (string or first element of array).
 * @param {string|string[]} v Config value
 * @returns {string}
 */
function toSingleUrl(v) {
  if (Array.isArray(v)) return v[0] || '';
  return typeof v === 'string' ? v : '';
}

/**
 * Get URL from a cell: a[href], img[src], or text.
 * @param {Element} cell Cell element
 * @returns {string}
 */
function getUrlFromCell(cell) {
  if (!cell) return '';
  const a = cell.querySelector('a[href]');
  if (a?.href) return a.href.trim();
  const img = cell.querySelector('img[src]');
  if (img?.src) return img.src.trim();
  const text = cell.textContent?.trim() || '';
  if (text && (text.startsWith('http') || text.startsWith('/'))) return text;
  return '';
}

/**
 * Check if URL looks like a video asset.
 * @param {string} url URL
 * @returns {boolean}
 */
function isVideoUrl(url) {
  if (!url) return false;
  const path = url.split('?')[0].toLowerCase();
  return /\.(mp4|webm|ogv|mov)(\?|#|$)/i.test(path);
}

/**
 * Decode link label for display (fixes URL-encoded text like %20, %7C).
 * @param {string} label Raw label that may be URL-encoded
 * @returns {string} Decoded label safe for textContent
 */
function decodeLinkLabel(label) {
  if (typeof label !== 'string' || !label) return '';
  try {
    if (/%[0-9A-Fa-f]{2}/.test(label)) {
      return decodeURIComponent(label.replace(/\+/g, ' '));
    }
  } catch {
    // ignore invalid sequences
  }
  return label;
}

/**
 * Decorates the hero-video block: video (>=900px), poster (<900px), optional link overlay.
 * Config: video, poster, link, linkLabel (from block config table or AEM row structure).
 * @param {Element} block The hero-video block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const first = (v) => (Array.isArray(v) ? v[0] : v);
  let videoUrl = toSingleUrl(config.video) || toSingleUrl(config['video-900px']);
  let posterUrl = toSingleUrl(config.poster) || toSingleUrl(config['poster-image-900px']);
  let linkUrl = toSingleUrl(config.link) || toSingleUrl(config['link-url']);
  let linkLabel = first(config.linkLabel) || first(config['link-label']) || first(config.linklabel) || '';
  if (!videoUrl && Object.keys(config).length > 0) {
    const videoKey = Object.keys(config).find((k) => /^video/i.test(k));
    if (videoKey) videoUrl = toSingleUrl(config[videoKey]);
  }
  if (!posterUrl && Object.keys(config).length > 0) {
    const posterKey = Object.keys(config).find((k) => /^poster/i.test(k));
    if (posterKey) posterUrl = toSingleUrl(config[posterKey]);
  }

  if (!videoUrl || !posterUrl) {
    const rows = [...block.querySelectorAll(':scope > div')].filter((r) => r.children.length > 0);
    if (rows.length > 0) {
      const getVal = (row, preferLink = false) => {
        const col = row.querySelector('div:last-child') || row.children[row.children.length - 1];
        if (!col) return getUrlFromCell(row.querySelector('div'));
        if (preferLink) {
          const a = col.querySelector('a[href]');
          if (a?.href) return a.href.trim();
        }
        return getUrlFromCell(col) || col.textContent?.trim() || '';
      };
      if (!videoUrl && rows[0]) videoUrl = getVal(rows[0], true);
      if (!posterUrl && rows[1]) posterUrl = getVal(rows[1]);
      if (!linkUrl && rows[2]) linkUrl = getVal(rows[2], true);
      if (!linkLabel && rows[3]) linkLabel = (rows[3].textContent || '').trim();
    }
  }

  if (!videoUrl || !posterUrl) {
    const allLinks = [...block.querySelectorAll('a[href]')];
    const allImgs = [...block.querySelectorAll('img[src]')];
    if (!videoUrl && allLinks.length > 0) {
      const videoLink = allLinks.find((a) => isVideoUrl(a.href));
      if (videoLink) videoUrl = videoLink.href.trim();
    }
    if (!posterUrl && allImgs.length > 0) posterUrl = allImgs[0].src.trim();
    if (!linkUrl && allLinks.length > 0) {
      const nonVideo = allLinks.find((a) => !isVideoUrl(a.href));
      if (nonVideo) linkUrl = nonVideo.href.trim();
    }
  }

  block.textContent = '';

  const mediaWrap = document.createElement('div');
  mediaWrap.className = 'hero-video-media';

  if (videoUrl) {
    const videoWrap = document.createElement('div');
    videoWrap.className = 'hero-video-video';
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.autoplay = true;
    video.setAttribute('playsinline', '');
    const source = document.createElement('source');
    source.src = videoUrl;
    source.type = 'video/mp4';
    video.append(source);
    videoWrap.append(video);
    mediaWrap.append(videoWrap);
  }

  if (posterUrl) {
    const posterWrap = document.createElement('div');
    posterWrap.className = 'hero-video-poster';
    const picture = document.createElement('picture');
    const img = document.createElement('img');
    img.src = posterUrl;
    img.alt = '';
    picture.append(img);
    posterWrap.append(picture);
    mediaWrap.append(posterWrap);
  }

  /* AEM が Link label を空で出力することがあるため、linkUrl のみある場合はフォールバック表示を使う */
  const linkLabelToUse = linkLabel || (linkUrl ? 'More' : '');
  if (linkUrl && linkLabelToUse) {
    const linkEl = document.createElement('a');
    linkEl.href = linkUrl;
    linkEl.className = 'hero-video-link';
    const iconWrap = document.createElement('span');
    iconWrap.className = 'hero-video-link-icon';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'hero-video-link-icon-svg');
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '12');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', 'currentColor');
    svg.appendChild(circle);
    iconWrap.appendChild(svg);
    linkEl.appendChild(iconWrap);
    const labelSpan = document.createElement('span');
    labelSpan.className = 'hero-video-link-label';
    labelSpan.textContent = decodeLinkLabel(linkLabelToUse);
    linkEl.appendChild(labelSpan);
    mediaWrap.append(linkEl);
  }

  block.append(mediaWrap);
}
