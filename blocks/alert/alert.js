/**
 * Alert block: single CTA line (link or text). First row = content; link in cell or whole row.
 * @param {Element} block The alert block element
 */
export default async function decorate(block) {
  const row = block.querySelector(':scope > div');
  if (!row) return;
  const cell = row.querySelector('div');
  const link = cell?.querySelector('a');
  const text = cell?.textContent?.trim() || '';

  block.textContent = '';
  const wrap = document.createElement('div');
  wrap.className = 'alert-inner';
  if (link?.href) {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = text || link.textContent?.trim();
    a.className = 'alert-link';
    wrap.append(a);
  } else {
    const span = document.createElement('span');
    span.textContent = text;
    wrap.append(span);
  }
  block.append(wrap);
}
