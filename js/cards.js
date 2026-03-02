/* js/cards.js
   Helper para crear cards dinámicamente.
   Uso: MBTools.addCard(imgUrl, title, description)
*/
(function () {
  const container = document.getElementById('cards');
  if (!container) return;

  /* helpers: slug, hex->rgba y contraste para colores custom en statuses */
  function slugify(s){ return String(s||'').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-_]/g,'') || 'custom'; }
  function hexToRgb(hex){ if(!hex) return null; hex = String(hex).trim().replace('#',''); if(hex.length===3) hex = hex.split('').map(c=>c+c).join(''); const v = parseInt(hex,16); return { r:(v>>16)&255, g:(v>>8)&255, b: v & 255 }; }
  function rgbaFromHex(hex, a){ const c = hexToRgb(hex); return c ? `rgba(${c.r}, ${c.g}, ${c.b}, ${a})` : ''; }
  function getContrastColor(hex){ const c = hexToRgb(hex); if(!c) return '#fff'; const lum = (0.299*c.r + 0.587*c.g + 0.114*c.b)/255; return lum > 0.6 ? '#111' : '#fff'; }

  // storage for cards (used for filtering / sorting)
  const cardData = [];

  function createCard({ img = '', title = 'Nueva herramienta', desc = '', link = '', statuses = [], author = '' } = {}) {
    const article = document.createElement('article');
    article.className = 'card';
    article.setAttribute('role', 'listitem');

    // header (title + desc left, image right)
    const header = document.createElement('div');
    header.className = 'card__header';

    const left = document.createElement('div');
    left.className = 'card__header-left';

    // title row (title + optional link icon)
    const titleRow = document.createElement('div');
    titleRow.className = 'card__title-row';

    const titleEl = document.createElement(link ? 'a' : 'div');
    if (link) {
      titleEl.href = link;
      titleEl.target = '_blank';
      titleEl.rel = 'noopener noreferrer';
    }
    titleEl.className = 'card__title';
    titleEl.textContent = title;
    titleRow.appendChild(titleEl);

    if (link) {
      const linkBtn = document.createElement('a');
      linkBtn.className = 'card__link';
      linkBtn.href = link;
      linkBtn.target = '_blank';
      linkBtn.rel = 'noopener noreferrer';
      linkBtn.setAttribute('aria-label', 'Abrir herramienta');
      linkBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M21 21H3V3"/></svg>';
      titleRow.appendChild(linkBtn);
    }

    left.appendChild(titleRow);

    // description
    const descEl = document.createElement('p');
    descEl.className = 'card__desc';
    descEl.textContent = desc;
    left.appendChild(descEl);

    // author line (optional)
    if (author) {
      const authEl = document.createElement('div');
      authEl.className = 'card__author';
      authEl.textContent = 'By: ' + author;
      left.appendChild(authEl);
    }

    // statuses (array desde JSON). soporta string o objeto { label, state, color, textColor }
    const meta = document.createElement('div');
    meta.className = 'card__meta';
    const normalizedStatuses = [];
    (Array.isArray(statuses) ? statuses : []).forEach(s => {
      const item = (typeof s === 'string') ? { label: s, state: s } : (s || {});
      const label = item.label || item.state || '';
      const st = slugify(item.state || item.label || label);
      const span = document.createElement('span');
      span.className = 'status status--' + st;
      span.textContent = label;
      meta.appendChild(span);
      normalizedStatuses.push(Object.assign({}, item, { stateSlug: st }));
    });
    left.appendChild(meta);

    const media = document.createElement('div');
    media.className = 'card__media';
    if (img) {
      media.style.backgroundImage = `url('${img}')`;
    } else {
      media.classList.add('card__media--placeholder');
      media.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 7l7-5 7 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }

    header.appendChild(left);
    header.appendChild(media);

    article.appendChild(header);
    container.appendChild(article);

    // store metadata for filtering/sorting
    cardData.push({
      element: article,
      title,
      author,
      statuses: normalizedStatuses,
      index: cardData.length
    });

    return article;
  }

  // escape básico para evitar inyección accidental
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function addCard(img, title, desc, link = '', statuses = [], author = '') {
    return createCard({ img, title, desc, link, statuses, author });
  }

  // API pública
  window.MBTools = window.MBTools || {};
  window.MBTools.addCard = addCard;
  window.MBTools.createCard = createCard;

  /* --------------------------------------------------
     filtering & search (cards only)
     -------------------------------------------------- */
  const searchInput = document.getElementById('tool-search');
  const filterSelect = document.getElementById('filter-select');

  function updateFilterOptions() {
    if (!filterSelect) return;
    const states = new Map();
    const authors = new Set();
    cardData.forEach(c => {
      c.statuses.forEach(s => states.set(s.stateSlug, s.label || s.stateSlug));
      if (c.author) authors.add(c.author);
    });

    filterSelect.innerHTML = '<option value="">Todos</option>';

    if (states.size) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = 'Estados';
      Array.from(states.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .forEach(([slug, label]) => {
          const opt = document.createElement('option');
          opt.value = 'state:' + slug;
          opt.textContent = label;
          optgroup.appendChild(opt);
        });
      filterSelect.appendChild(optgroup);
    }

    if (authors.size) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = 'Autores';
      Array.from(authors)
        .sort((a, b) => a.localeCompare(b))
        .forEach(name => {
          const opt = document.createElement('option');
          opt.value = 'author:' + name;
          opt.textContent = name;
          optgroup.appendChild(opt);
        });
      filterSelect.appendChild(optgroup);
    }

    const sortGroup = document.createElement('optgroup');
    sortGroup.label = 'Orden';
    [['default','Por defecto'],['az','A - Z'],['za','Z - A']].forEach(([val,label])=>{
      const opt = document.createElement('option');
      opt.value = 'sort:' + val;
      opt.textContent = label;
      sortGroup.appendChild(opt);
    });
    filterSelect.appendChild(sortGroup);
  }

  function applyFilters() {
    const q = String(searchInput?.value || '').toLowerCase();
    const sel = filterSelect?.value || '';
    let stateVal = '', authorVal = '', sortVal = 'default';
    if (sel.startsWith('state:')) stateVal = sel.slice(6);
    else if (sel.startsWith('author:')) authorVal = sel.slice(7);
    else if (sel.startsWith('sort:')) sortVal = sel.slice(5);

    let list = cardData.slice();
    if (q) list = list.filter(c => c.element.textContent.toLowerCase().includes(q));
    if (stateVal) list = list.filter(c => c.statuses.some(s => s.stateSlug === stateVal));
    if (authorVal) list = list.filter(c => c.author === authorVal);

    if (sortVal === 'az' || sortVal === 'za') {
      list.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }) * (sortVal === 'az' ? 1 : -1));
    } else {
      list.sort((a, b) => a.index - b.index);
    }

    list.forEach(c => container.appendChild(c.element));
    cardData.forEach(c => {
      c.element.style.display = list.includes(c) ? '' : 'none';
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }
  if (filterSelect) {
    filterSelect.addEventListener('change', applyFilters);
  }

  // after loading or adding new cards we should refresh options
  function onCardsUpdated() {
    updateFilterOptions();
    applyFilters();
  }

  // after loading or adding new cards we should refresh options
  function onCardsUpdated() {
    updateFilterOptions();
    applyFilters();
  }

  // whenever createCard is called from external code, update filters
  const origCreate = createCard;
  createCard = function(opts) {
    const el = origCreate(opts);
    onCardsUpdated();
    return el;
  };

  // load JSON as before, but hook onCardsUpdated after initial batch
  if (container.children.length === 0) {
    fetch('data/cards.json')
      .then(r => r.json())
      .then(list => {
        if (Array.isArray(list)) {
          list.forEach(item => {
            createCard({
              img: item.img || '',
              title: item.title || '',
              desc: item.desc || '',
              link: item.link || '',
              statuses: item.statuses || [],
              author: item.author || ''
            });
          });
          onCardsUpdated();
        }
      })
      .catch(() => {
        // fallback: no hacer nada si no hay acceso a archivo (ej. file://)
      });
  }

  // export update helper so other code can refresh if needed
  window.MBTools._refreshCards = onCardsUpdated;

})();