/* js/main.js
   Código compartido que no tiene que ver directamente con las cards.
   Se encarga de navegación, panel de cambio de idioma/tema y galería.
*/

(function () {
  /* -----------------------
     navegación móvil
     ----------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    const hamb = document.querySelector('.hamburger');
    const navEl = document.getElementById('site-navigation');
    if (hamb && navEl) {
      hamb.addEventListener('click', () => {
        const open = navEl.classList.toggle('open');
        hamb.setAttribute('aria-expanded', open);
      });
      // cerrar menú al pulsar un enlace
      navEl.addEventListener('click', e => {
        if (e.target.tagName === 'A') {
          navEl.classList.remove('open');
          hamb.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // arrancar galería cuando el DOM esté listo
    startGallerySlideshow();

    // inicializaciones de tema/idioma
    initTheme();
    initLanguage();
  });

  /* --------------------------------------------------
     tema / idioma
     -------------------------------------------------- */
  const themeBtn = document.getElementById('theme-toggle');
  const langSelect = document.getElementById('lang-select');

  function setTheme(dark) {
    document.body.classList.toggle('light-mode', !dark);
    if (themeBtn) {
      themeBtn.innerHTML = dark ? '<i class="fa fa-moon"></i>' : '<i class="fa fa-sun"></i>';
    }
    localStorage.setItem('dark-mode', dark ? '1' : '0');
  }

  function initTheme() {
    if (!themeBtn) return;
    themeBtn.addEventListener('click', () => {
      const currentlyDark = !document.body.classList.contains('light-mode');
      setTheme(!currentlyDark);
    });
    // icon fallback
    function updateThemeIcon(dark) {
      if (!themeBtn) return;
      themeBtn.innerHTML = dark ? '<i class="fa fa-moon"></i> 🌙' : '<i class="fa fa-sun"></i> ☀️';
    }
    const orig = setTheme;
    setTheme = function (d) { orig(d); updateThemeIcon(d); };

    const stored = localStorage.getItem('dark-mode');
    if (stored !== null) {
      setTheme(stored === '1');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark);
    }
  }

  function setLanguage(code) {
    document.documentElement.lang = code;
    if (langSelect) {
      langSelect.value = code;
    }
    localStorage.setItem('lang', code);
  }

  function initLanguage() {
    if (!langSelect) return;
    langSelect.addEventListener('change', () => {
      setLanguage(langSelect.value);
    });
    const storedLang = localStorage.getItem('lang');
    if (storedLang) {
      setLanguage(storedLang);
    } else {
      // detectar del navegador si no hay nada en storage
      const nav = navigator.language || navigator.userLanguage || 'en';
      const code = nav.slice(0, 2).toLowerCase();
      const allowed = ['en', 'es'];
      setLanguage(allowed.includes(code) ? code : 'en');
    }
  }

  /* --------------------------------------------------
     galería de imágenes
     -------------------------------------------------- */
  let _galleryTimer = null;
  function startGallerySlideshow() {
    const gallery = document.querySelector('.gallery');
    if (!gallery) return;
    const imgs = gallery.querySelectorAll('img');
    if (imgs.length <= 1) return;
    let idx = 0;
    imgs.forEach((img, i) => {
      img.style.display = i === 0 ? 'block' : 'none';
    });
    _galleryTimer = setInterval(() => {
      imgs[idx].style.display = 'none';
      idx = (idx + 1) % imgs.length;
      imgs[idx].style.display = 'block';
    }, 3000);
  }

  const galleryContainer = document.querySelector('.gallery');
  function addGalleryImage(src, alt = '') {
    if (!galleryContainer) return;
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.loading = 'lazy';
    galleryContainer.appendChild(img);
    img.style.display = 'none';
    if (_galleryTimer) {
      clearInterval(_galleryTimer);
      _galleryTimer = null;
    }
    startGallerySlideshow();
    return img;
  }

  if (galleryContainer && galleryContainer.children.length === 0) {
    fetch('data/gallery.json')
      .then(r => r.json())
      .then(arr => {
        if (Array.isArray(arr)) {
          arr.forEach(item => addGalleryImage(item.src || item, item.alt || ''));
        }
      })
      .catch(() => {});
  }

  window.MBTools = window.MBTools || {};
  window.MBTools.addGalleryImage = addGalleryImage;
})();
