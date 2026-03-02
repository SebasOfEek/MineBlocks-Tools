/* notifications.js
   Simple notification system with optional translation support.
   Usage:
     notify({ key: 'notifications.saved_success', text: 'Saved', type: 'success', timeout: 3500 });
     notifySuccess('Saved')
     notifyError({ text: 'Import failed' })

   The system will try to use global t(key, fallback) if available (from your
   existing i18n). You can also register local translations via
     addNotificationTranslations('en', { 'notifications.saved_success': 'Saved' })
*/
(function () {
  const containerId = 'notifContainer';
  const translations = {}; // { lang: { key: text } }

  function ensureContainer() {
    let c = document.getElementById(containerId);
    if (!c) {
      c = document.createElement('div');
      c.id = containerId;
      c.className = 'notif-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function getLang() {
    return (localStorage && localStorage.getItem('language')) || 'es';
  }

  function translate(key, fallback) {
    if (!key) return fallback || '';
    // Prefer global t() if available
    try {
      if (window.t && typeof window.t === 'function') {
        const out = window.t(key, fallback || key);
        if (out) return out;
      }
    } catch (e) {
      // ignore
    }
    const lang = getLang();
    if (translations[lang] && translations[lang][key]) return translations[lang][key];
    return fallback || key;
  }

  function makeNotificationElement(text, type, iconHtml) {
    const el = document.createElement('div');
    el.className = 'notification ' + (type ? 'notif-' + type : 'notif-info');
    el.setAttribute('role', 'status');

    // Default Font Awesome icons per semantic action (fallbacks)
    const defaultIcons = {
      error: '<i class="notif__fa fas fa-times-circle" aria-hidden="true"></i>',
      success: '<i class="notif__fa fas fa-check-circle" aria-hidden="true"></i>',
      warning: '<i class="notif__fa fas fa-exclamation-triangle" aria-hidden="true"></i>',
      info: '<i class="notif__fa fas fa-info-circle" aria-hidden="true"></i>'
    };

    // If caller provided explicit icon HTML, use it; otherwise try to pick by type
    let fa = iconHtml || defaultIcons[type] || defaultIcons.info;

    el.innerHTML = `
      <div class="notif__icon">${fa}</div>
      <div class="notif__title">${text}</div>
      <button class="notif-close" aria-label="close">
        <i class="fas fa-times" aria-hidden="true"></i>
      </button>
    `;

    return el;
  }

  function showNotification(text, type = 'info', timeout = 4000, opts) {
    const c = ensureContainer();
    opts = opts || {};
    // Determine icon priority: opts.icon -> opts.key-based mapping -> type
    let iconHtml = opts.icon || null;
    if(!iconHtml && opts.key && typeof opts.key === 'string'){
      const k = opts.key.toLowerCase();
      // map some common keys to representative icons
      if(k.indexOf('saved') !== -1) iconHtml = '<i class="notif__fa fas fa-save" aria-hidden="true"></i>';
      else if(k.indexOf('added') !== -1) iconHtml = '<i class="notif__fa fas fa-plus" aria-hidden="true"></i>';
      else if(k.indexOf('updated') !== -1) iconHtml = '<i class="notif__fa fas fa-edit" aria-hidden="true"></i>';
      else if(k.indexOf('deleted') !== -1) iconHtml = '<i class="notif__fa fas fa-trash" aria-hidden="true"></i>';
      else if(k.indexOf('copied') !== -1) iconHtml = '<i class="notif__fa fas fa-copy" aria-hidden="true"></i>';
      else if(k.indexOf('export') !== -1) iconHtml = '<i class="notif__fa fas fa-file-export" aria-hidden="true"></i>';
    }
    const el = makeNotificationElement(text, type, iconHtml);
    const closeBtn = el.querySelector('.notif-close');
    closeBtn.addEventListener('click', () => {
      hide(el);
    });
    c.appendChild(el);
    // Animation: add class for enter
    requestAnimationFrame(() => el.classList.add('show'));

    let to = null;
    if (timeout && timeout > 0) {
      to = setTimeout(() => hide(el), timeout);
    }
    // Pause on hover
    el.addEventListener('mouseenter', () => { if (to) clearTimeout(to); });
    el.addEventListener('mouseleave', () => { if (timeout) to = setTimeout(() => hide(el), timeout); });
  }

  function hide(el) {
    if (!el) return;
    el.classList.remove('show');
    el.classList.add('hide');
    setTimeout(() => { try { el.remove(); } catch (e) {} }, 260);
  }

  // Public API
  window.notify = function (opts) {
    if (typeof opts === 'string') opts = { text: opts };
    opts = opts || {};
    const key = opts.key;
    const raw = opts.text || '';
    const type = opts.type || 'info';
    const timeout = typeof opts.timeout === 'number' ? opts.timeout : 4000;
    const text = key ? translate(key, raw) : raw;
    // pass opts so showNotification can inspect key/icon hints
    showNotification(text, type, timeout, opts);
  };

  window.notifySuccess = function (opts) { if (typeof opts === 'string') opts = { text: opts }; opts.type = 'success'; window.notify(opts); };
  window.notifyError = function (opts) { if (typeof opts === 'string') opts = { text: opts }; opts.type = 'error'; window.notify(opts); };
  window.notifyInfo = function (opts) { if (typeof opts === 'string') opts = { text: opts }; opts.type = 'info'; window.notify(opts); };
  window.notifyWarn = function (opts) { if (typeof opts === 'string') opts = { text: opts }; opts.type = 'warning'; window.notify(opts); };

  window.addNotificationTranslations = function (lang, map) {
    translations[lang] = Object.assign(translations[lang] || {}, map || {});
  };

  window.clearNotifications = function () {
    const c = document.getElementById(containerId);
    if (c) c.innerHTML = '';
  };

  // Expose for debugging
  window._notificationSystem = { translations };

  // Ensure container at load
  ensureContainer();
})();
