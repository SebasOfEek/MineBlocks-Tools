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

  function makeNotificationElement(text, type) {
    const el = document.createElement('div');
    el.className = 'notification ' + (type ? 'notif-' + type : 'notif-info');
    el.setAttribute('role', 'status');

    // SVG icons per type
    const icons = {
      error: '<svg class="notif__icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.001 10h2v5h-2z" fill="#fff"/><path d="M11 16h2v2h-2z" fill="#fff"/><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z" fill="#fff"/></svg>',
      success: '<svg class="notif__icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12.5l2 2 4-5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      warning: '<svg class="notif__icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="#fff"/><path d="M12 9v4" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 17h.01" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      info: '<svg class="notif__icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#fff"/></svg>'
    };

    const svg = icons[type] || icons.info;

    el.innerHTML = `
      <div class="notif__icon">${svg}</div>
      <div class="notif__title">${text}</div>
      <button class="notif-close" aria-label="close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    `;

    return el;
  }

  function showNotification(text, type = 'info', timeout = 4000) {
    const c = ensureContainer();
    const el = makeNotificationElement(text, type);
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
    showNotification(text, type, timeout);
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
