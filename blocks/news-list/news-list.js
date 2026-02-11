/**
 * News list block: each row = one item. Cells = date, category, title (link optional).
 * If a cell contains a link, it's used as the item link; otherwise title is plain text.
 * @param {Element} block The news-list block element
 */
export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')].filter((row) => row.children.length > 0);
  const list = document.createElement('ul');
  list.className = 'news-list';

  rows.forEach((row) => {
    const cells = [...row.querySelectorAll('div')];
    const date = cells[0]?.textContent?.trim() || '';
    const category = cells[1]?.textContent?.trim() || '';
    const titleCell = cells[2];
    const link = titleCell?.querySelector('a');
    const titleText = titleCell?.textContent?.trim() || '';

    const li = document.createElement('li');
    li.className = 'news-list-item';

    const meta = document.createElement('div');
    meta.className = 'news-list-meta';
    if (date) {
      const dateSpan = document.createElement('span');
      dateSpan.className = 'news-list-date';
      dateSpan.textContent = date;
      meta.append(dateSpan);
    }
    if (category) {
      const catSpan = document.createElement('span');
      catSpan.className = 'news-list-category';
      catSpan.textContent = category;
      meta.append(catSpan);
    }
    li.append(meta);

    const titleWrap = document.createElement('div');
    titleWrap.className = 'news-list-title';
    if (link?.href) {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = titleText || link.textContent?.trim();
      titleWrap.append(a);
    } else {
      titleWrap.textContent = titleText;
    }
    li.append(titleWrap);
    list.append(li);
  });

  block.textContent = '';
  block.append(list);
}
