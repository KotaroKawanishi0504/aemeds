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
 * Decorates the hero-video block: video (>=900px), poster (<900px), optional link overlay.
 * Config: video, poster, link, linkLabel (from block config table).
 * @param {Element} block The hero-video block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const videoUrl = toSingleUrl(config.video);
  const posterUrl = toSingleUrl(config.poster);
  const linkUrl = toSingleUrl(config.link);
  const linkLabel = Array.isArray(config.linkLabel) ? config.linkLabel[0] : (config.linkLabel || '');

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

  block.append(mediaWrap);

  if (linkUrl && linkLabel) {
    const linkEl = document.createElement('a');
    linkEl.href = linkUrl;
    linkEl.className = 'hero-video-link';
    linkEl.textContent = linkLabel;
    block.append(linkEl);
  }
}
