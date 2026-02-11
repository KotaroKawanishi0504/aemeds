/**
 * Tabs block: first row = tab labels, following rows = panel content (one row per tab).
 * @param {Element} block The tabs block element
 */
export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (rows.length < 2) return;

  const tabLabels = rows[0];
  const labelCells = [...tabLabels.querySelectorAll('div')];
  const labels = labelCells.map((cell) => cell.textContent?.trim() || '');
  const panels = rows.slice(1).map((row) => {
    const cell = row.querySelector('div');
    const wrap = document.createElement('div');
    wrap.className = 'tabs-panel-content';
    if (cell) wrap.innerHTML = cell.innerHTML;
    return wrap;
  });

  block.textContent = '';
  const tabList = document.createElement('div');
  tabList.className = 'tabs-triggers';
  const panelContainer = document.createElement('div');
  panelContainer.className = 'tabs-panels';

  labels.forEach((label, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tabs-trigger';
    btn.textContent = label;
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    btn.setAttribute('aria-controls', `tabs-panel-${i}`);
    btn.id = `tabs-trigger-${i}`;
    tabList.append(btn);

    const panel = panels[i] || document.createElement('div');
    panel.className = 'tabs-panel';
    panel.id = `tabs-panel-${i}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tabs-trigger-${i}`);
    panel.hidden = i !== 0;
    panelContainer.append(panel);
  });

  block.append(tabList);
  block.append(panelContainer);

  block.querySelectorAll('.tabs-trigger').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      block.querySelectorAll('.tabs-trigger').forEach((b, j) => {
        b.setAttribute('aria-selected', j === i ? 'true' : 'false');
      });
      block.querySelectorAll('.tabs-panel').forEach((p, j) => {
        p.hidden = j !== i;
      });
    });
  });
}
