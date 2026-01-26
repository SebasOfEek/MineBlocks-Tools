// --- Pantalla de carga ---
function translateLoadingScreen() {
  const savedLanguage = localStorage.getItem("language") || "es";
  const translations = {
    es: "Cargando datos...",
    en: "Loading data..."
  };
  $("#loadingText").text(translations[savedLanguage] || translations.es);
}

$(document).ready(function () {
  $("body").css("overflow", "hidden");
  translateLoadingScreen();
  window.hideLoadingScreen = function() {
    $("#loadingScreen").css("opacity", 0);
    setTimeout(function() {
      $("#loadingScreen").hide();
      $("body").css("overflow", "auto");
    }, 500);
  };
});

// --- Guardar y restaurar inputs/selections ---
function saveFormState() {
  const state = {};
  $("input, select, textarea").each(function() {
      const id = $(this).attr("id") || $(this).data("id");
    if (id) {
      // Skip file inputs (value is read-only for security in many browsers)
      if ($(this).is(':file')) {
        // do not store file input values
        return;
      }
      if ($(this).is(":checkbox")) {
        state[id] = $(this).prop("checked");
      } else {
        state[id] = $(this).val();
      }
    }
  });
  localStorage.setItem("formState", JSON.stringify(state));
}

function restoreFormState() {
  const state = JSON.parse(localStorage.getItem("formState") || '{}');
  Object.entries(state).forEach(([id, value]) => {
    const $el = $("#"+id);
    if ($el.length) {
      if ($el.is(":checkbox")) {
        $el.prop("checked", value);
      } else {
        try{
          // Do not attempt to set file inputs programmatically
          if ($el.is(':file')) {
            // skip restoring file input values
            return;
          }
          $el.val(value);
          if ($el.is("select")) {
            $el.trigger("change.select2");
          } else {
            $el.trigger("input");
          }
        }catch(err){
          // Non-fatal: log and continue so one bad element doesn't break initialization
          try{ console.warn('restoreFormState skipped setting value for', id, err); }catch(e){}
        }
      }
    }
  });
}

$(document).ready(function () {
  restoreFormState();
  setTimeout(window.hideLoadingScreen, 800);
  $("input, select, textarea").on("input change", saveFormState);
});

  // Robust fallback: if for any reason the loading screen wasn't hidden (JS errors, race),
  // ensure it's removed after a short timeout and also when the window 'load' event fires.
  try {
    window.addEventListener && window.addEventListener('load', function() {
      // small delay to allow other load handlers to run
      setTimeout(function() {
        try {
          if (window.hideLoadingScreen) {
            window.hideLoadingScreen();
          } else {
            var el = document.getElementById('loadingScreen');
            if (el) el.style.display = 'none';
            document.body.style.overflow = 'auto';
          }
        } catch (e) {
          // last resort
          var el2 = document.getElementById('loadingScreen');
          if (el2) el2.style.display = 'none';
          document.body.style.overflow = 'auto';
        }
      }, 120);
    });

    // Timeout fallback: force-hide after 5 seconds if still visible
    setTimeout(function() {
      try {
        var el = document.getElementById('loadingScreen');
        if (el && (el.style.display !== 'none' && window.getComputedStyle(el).display !== 'none')) {
          console.warn('Loading screen fallback hide triggered');
          if (window.hideLoadingScreen) window.hideLoadingScreen();
          else el.style.display = 'none';
          document.body.style.overflow = 'auto';
        }
      } catch (e) {
        // ignore
      }
    }, 5000);
  } catch (e) {
    // ignore
  }

  // Expose for console/testing
  try{ window.loadLanguage = loadLanguage; }catch(e){}
$(document).ready(function () {
  const $themeBtn = $("#themeButton");
  const $themeIcon = $themeBtn.find("i");
  function updateThemeButton(isDark) {
    if (isDark) {
      $themeIcon.removeClass("fa-moon").addClass("fa-sun");
      const lightText = (window.currentLangData && window.currentLangData.menu && window.currentLangData.menu.theme && window.currentLangData.menu.theme.light) || "Claro";
      $themeBtn.find("span").text(lightText);
    } else {
      $themeIcon.removeClass("fa-sun").addClass("fa-moon");
      const darkText = (window.currentLangData && window.currentLangData.menu && window.currentLangData.menu.theme && window.currentLangData.menu.theme.dark) || "Oscuro";
      $themeBtn.find("span").text(darkText);
    }
  }
  const savedTheme = localStorage.getItem("theme");
  updateThemeButton(savedTheme === "dark");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }

  $themeBtn.on("click", function (e) {
    e.stopPropagation();
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
      updateThemeButton(false);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
      updateThemeButton(true);
    }
  });
});

function formatOption(option) {
  if (!option.id) return option.text;
  // determine display text dynamically using data-i18n / external translations
  const $el = $(option.element);
  const key = $el.data('i18n');
  let display = option.text || $el.attr('data-default-text') || '';
  try {
    if (key) {
      // try language JSON first
      const fromLang = t(key, null);
      if (fromLang) display = fromLang;
      else if (window.externalTranslations && window.externalTranslations[key]) {
        const lang = localStorage.getItem('language') || 'es';
        if (window.externalTranslations[key][lang]) display = window.externalTranslations[key][lang];
      }
    }
  } catch (e) {
    // ignore
  }
  const img = $el.data('image');
  if (!img) return display;
  const $wrap = $('<span>').addClass('select2-option-wrap');
  const $img = $('<img>').addClass('select2-option-img').attr('src', img).attr('alt', display);
  $wrap.append($img).append($('<span>').addClass('select2-option-text').text(display));
  return $wrap;
}

function formatSelection(option) {
  if (!option.id) return option.text;
  const $el = $(option.element);
  const key = $el.data('i18n');
  let display = option.text || $el.attr('data-default-text') || '';
  try {
    if (key) {
      const fromLang = t(key, null);
      if (fromLang) display = fromLang;
      else if (window.externalTranslations && window.externalTranslations[key]) {
        const lang = localStorage.getItem('language') || 'es';
        if (window.externalTranslations[key][lang]) display = window.externalTranslations[key][lang];
      }
    }
  } catch (e) {}
  const img = $el.data('image');
  if (!img) return display;
  const $sel = $('<span>').addClass('select2-selection-wrap');
  $sel.append($('<img>').addClass('select2-selection-img').attr('src', img).attr('alt', display));
  $sel.append($('<span>').addClass('select2-selection-text').text(display));
  return $sel;
}

// Translation helper: t('path.to.key', 'fallback') => returns translation from loaded language data
function t(key, fallback) {
  try {
    if (window.currentLangData) {
      const parts = key.split('.');
      let cur = window.currentLangData;
      for (let i = 0; i < parts.length; i++) {
        cur = cur[parts[i]];
        if (cur === undefined) return fallback;
      }
      return cur || fallback;
    }
  } catch (e) {
    // ignore
  }
  return fallback;
}

// Asegura que el select2 de mobs (`#mobType`) muestre las etiquetas en el idioma actual.
// Reescribe los textos de las <option> según `window.currentLangData` o `window.externalTranslations`
// y re-inicializa Select2 para forzar la actualización visual si es necesario.
function updateMobSelect2Language() {
  try {
    const $mob = $("#mobType");
    if (!$mob.length) return;
    const lang = localStorage.getItem('language') || 'es';

    // Actualizar texto de cada opción según data-i18n o externalTranslations
    $mob.find('option[data-i18n]').each(function() {
      const $opt = $(this);
      const key = $opt.data('i18n');
      let newText = null;
      if (window.currentLangData && key) {
        // intentar con t() usando el json cargado
        newText = t(key, null);
      }
      if ((!newText || newText === null) && window.externalTranslations && window.externalTranslations[key]) {
        newText = window.externalTranslations[key][lang] || $opt.attr('data-default-text') || $opt.text();
      }
      if (!newText) newText = $opt.attr('data-default-text') || $opt.text();
      // Solo actualizar si hay cambio
      if ($opt.text() !== newText) $opt.text(newText);
    });

    // Si Select2 está inicializado, re-inicializar para forzar refresco visual
    if ($mob.data('select2')) {
      const currentVal = $mob.val();
      try { $mob.select2('destroy'); } catch (e) { /* ignore */ }
      $mob.select2({ templateResult: formatOption, templateSelection: function(option){ return option && option.text ? option.text : ''; } });
      // Restaurar selección visible
      $mob.val(currentVal).trigger('change.select2');
    }
  } catch (e) {
    console.error('updateMobSelect2Language error', e);
  }
}

// Update the Select2 instance and placeholder for the sidebar item select (#sidebarItemSelect)
function updateSidebarItemSelect2Language(){
  try{
    const $sel = $('#sidebarItemSelect');
    if(!$sel.length) return;
    const lang = localStorage.getItem('language') || 'es';
    // update empty option text
    const placeholder = t('modals.lootTags.selectItemPlaceholder', 'Select item');
    const $first = $sel.find('option').first();
    if($first && $first.val() === '') $first.text(placeholder);

    // If Select2 initialized, destroy and reinit to update placeholder
    if($sel.data('select2')){
      const currentVal = $sel.val();
      try{ $sel.select2('destroy'); }catch(e){}
      $sel.select2({
        templateResult: function(option){ return formatOption(option); },
        templateSelection: function(option){ return formatSelection(option); },
        width: '100%',
        dropdownParent: $('#lootTagsPopup .popup-content'),
        placeholder: placeholder,
        allowClear: false,
        closeOnSelect: true
      });
      $sel.val(currentVal).trigger('change.select2');
    }
  }catch(e){ console.error('updateSidebarItemSelect2Language', e); }
}

// Función reutilizable global que limpia el formulario. Si preserveMob=true,
// no tocará el select `#mobType` (útil al cambiar de mob y querer mantener la selección).
function clearAllFormData(preserveMob = false, suppressNotify = false) {
  // Bloquear el sidebar primero para mostrar el candado inmediatamente
  if (typeof lockSidebar === 'function') lockSidebar();

  // Limpiar inputs normales
  $('input[type="text"], input[type="number"], input[type="color"]').val("");

  // Limpiar y resetear todos los select2 y selects normales
  $("select").each(function () {
    if (preserveMob && $(this).is("#mobType")) return; // mantener mobType si se pide
    $(this).val("").trigger("change");
  });

  // Resetear positionType y deshabilitar inputs de coordenadas
  if (!preserveMob) {
    $("#positionType").val("").trigger("change");
  } else {
    // Si preservamos mob, solo resetear positionType visual si existe
    $("#positionType").trigger("change");
  }
  $("#posX, #posY").prop("disabled", true);
  $("#labelPosX").text(t('modals.position.coordX', 'Coordenada X:'));
  $("#labelPosY").text(t('modals.position.coordY', 'Coordenada Y:'));

  // Cerrar todas las casillas extendidas/popups
  $(".popup-overlay").removeClass("show");

  // Resetear todos los toggles y establecer estado
  $(".popup-toggle-button").each(function () {
    const icon = $(this).find("i");
    const text = $(this).find("span");
    const id = $(this).attr("id");

    icon.removeClass("fa-toggle-on").addClass("fa-toggle-off");

    // Use translated labels when available
    const enabledText = t('common.enabled', 'Activado');
    const disabledText = t('common.disabled', 'Desactivado');
    const yesText = t('common.yes', 'Sí');
    const noText = t('common.no', 'No');

    if (id === "toggleLoot" || id === "toggleLootTags") {
      text.text(disabledText);
    } else {
      text.text(noText);
    }
  });

  // Ocultar específicamente las opciones de Loot Tags
  $("#lootTagsOptions").hide();

  // Resetear el mobImage solo si no se preserva la selección
  if (!preserveMob) {
    $("#mobImage").empty().removeClass("transparent");
  }

  // Clear health hearts preview when clearing the form
  if (typeof clearHealthHearts === 'function') clearHealthHearts();

  // Resetear estados de botones (usar clases CSS centralizadas)
  $(".popup-button")
    .addClass('status-button status-not-saved')
    .removeClass('status-saved')
    .find("i")
    .removeClass("fa-check saved")
    .addClass("fa-times not-saved");

  // Ensure loot toggle/status reset explicitly to avoid persistence issues
  try { setLootState(false); } catch (err) { /* ignore */ }

  // Bloquear las cards
  if (typeof lockAllCards === 'function') lockAllCards();

  // Ir a la primera página de cards (si existe)
  if (typeof changePage === 'function') changePage(1);

  // Actualizar el comando
  if (typeof updateCommand === 'function') updateCommand();

  // Clear loot tags only when not preserving mob selection
  try { if (!preserveMob && window.lootTagsStore && typeof window.lootTagsStore.clearAll === 'function') window.lootTagsStore.clearAll(); } catch(e){}

  // Only notify when we are doing a full clear (not when preserving mob selection)
  // and when notifications are not explicitly suppressed by the caller.
  if (!preserveMob && !suppressNotify) {
    if (typeof notifyInfo === 'function') {
      notifyInfo({ key: 'notifications.cleared', timeout: 1500 });
    } else if (typeof notify === 'function') {
      notify({ type: 'info', key: 'notifications.cleared', timeout: 1500 });
    }
  }
}

$(document).ready(function () {
  $.getJSON(
    "data/mobs.json",
    function (data) {
      const mobType = $("#mobType");
      mobType.empty();
      // ensure externalTranslations map exists and pick current language
      window.externalTranslations = window.externalTranslations || {};
      const currentSavedLang = localStorage.getItem('language') || 'es';
      // placeholder option - keep data-i18n so it translates
      mobType.append('<option value="" data-i18n="common.select" data-default-text="--Seleccionar--">--Seleccionar--</option>');
      data.mobs.forEach(function (mob) {
        const key = `external.mobs.${mob.value}`;
        // Ensure both `en` and `es` keys exist; use mob.text as fallback for missing entries
        window.externalTranslations[key] = Object.assign({ en: mob.text, es: mob.text }, mob.translations || {});
        const displayText = (window.externalTranslations[key] && window.externalTranslations[key][currentSavedLang]) ? window.externalTranslations[key][currentSavedLang] : mob.text;
        const option = $("<option>")
          .val(mob.value)
          .text(displayText)
          .attr("data-image", mob.image)
          .attr("data-i18n", key)
          .attr("data-default-text", mob.text);
        mobType.append(option);
      });

      mobType
        .select2({
          // For mobType we want plain text only (no image)
          templateResult: function(option) {
            if (!option.id) return option.text;
            return $("<span>" + (option.text || '') + "</span>");
          },
          templateSelection: function(option){ return option && option.text ? option.text : ''; },
        })
        .on('select2:open', function() {
          // Evitar que la página haga scroll cuando se abre el dropdown
          $('body').css('overflow', 'hidden');
        })
        .on('select2:close', function() {
          // Restaurar overflow al cerrar
          $('body').css('overflow', 'auto');
        });

      // Si existe la función para sincronizar idioma en el select2 de mobs, llamarla ahora
      if (typeof updateMobSelect2Language === 'function') updateMobSelect2Language();

      // Cuando se selecciona un mob con select2, limpiar el formulario usando
      // la misma lógica que el botón Limpiar (preservando la selección)
      mobType.on("select2:select", function (e) {
        const newVal = e && e.params && e.params.data ? e.params.data.id : $(this).val();
        // Reset form but preserve selected mob. Also explicitly reset loot state
        clearAllFormData(true);
        try { setLootState(false); } catch (err) { /* ignore */ }

        // Actualizar imagen
        const selected = mobType.find(":selected");
        const imageUrl = selected.data("image");
        const mobImage = $("#mobImage");

        if (imageUrl) {
          mobImage.html(`<img src="${imageUrl}" alt="${selected.text()}">`);
          mobImage.addClass("transparent");
        } else {
          mobImage.empty();
          mobImage.removeClass("transparent");
        }

        // Cargar configuración de bloqueo del mob seleccionado
        loadMobLockConfig(newVal);
        // Ensure any previous health preview is removed when switching mobs
        if (typeof clearHealthHearts === 'function') clearHealthHearts();
      });

      // Al inicio, bloquear todas las tarjetas
      lockAllCards();
    }
  );
});

function updateMobOptions() {
  const selected = $("#mobType").val();
  console.log("Mob seleccionado:", selected);
}

$(document).ready(function () {
  $(".menu").on("click", function (e) {
    e.stopPropagation();
    $(".menu").toggleClass("show-buttons");
  });

  $(document).on("click", function (e) {
    if (!$(e.target).closest(".menu").length) {
      $(".menu").removeClass("show-buttons");
    }
  });
});

$(document).ready(function () {
  $(window).on("click", function (e) {
    if ($(e.target).is(".modal")) {
      $("#myModal").removeClass("active");
    }
  });
});

$(document).ready(function () {
  $("#card1, #card1 + .card-icon").on("click", function () {
    $("#customPopup").addClass("show");
  });

  $("#card1 .question-icon").on("click", function (e) {
    e.stopPropagation();
    $("#helpPopup").addClass("show");
  });

  $(".popup-close, .popup-overlay").on("click", function (e) {
    if (e.target === this) {
      $(this).closest(".popup-overlay").removeClass("show");
    }
  });

  $(".popup-window").on("click", function (e) {
    e.stopPropagation();
  });
});

  $(document).ready(function () {
  $("#footerCopyButton").on("click", function (e) {
    try{
      // If another footer action is being processed, ignore this click
      if(document._footerActionInProgress) return;
      // mark a short-lived global lock to prevent delegated handlers duplicating work
      document._footerActionInProgress = true; setTimeout(function(){ document._footerActionInProgress = false; }, 700);
      window._lastFooterAction = Date.now();
    }catch(e){}
    // Obtener el texto del comando sin las etiquetas HTML
    const commandText = $(".footer-box-big").text();

    // Crear un elemento textarea temporal
    const textarea = document.createElement("textarea");
    textarea.value = commandText;
    document.body.appendChild(textarea);

    // Seleccionar y copiar el texto
    textarea.select();
    document.execCommand("copy");

    // Eliminar el textarea temporal
    document.body.removeChild(textarea);

    // Mostrar efecto visual de copiado
    $(this).addClass("copied");
    setTimeout(() => {
      $(this).removeClass("copied");
    }, 1000);
    // notify copy success for footer main copy
    if (typeof notifySuccess === 'function') {
      notifySuccess({ key: 'notifications.copied', timeout: 1800 });
    } else if (typeof notify === 'function') {
      notify({ type: 'success', key: 'notifications.copied', timeout: 1800 });
    }
    try{ $(this).data('copy-bound', true); }catch(e){}
  });

  // Delegated fallback: handle clicks on #footerCopyButton even if the node was replaced
  document.addEventListener('click', function(ev){
    try{
      // Avoid duplicate handling if a direct handler ran very recently or a footer action is in progress
      if(document._footerActionInProgress) return;
      if(window._lastFooterAction && (Date.now() - window._lastFooterAction) < 600) return;
      const found = ev.target && ev.target.closest && ev.target.closest('#footerCopyButton');
      if(!found) return;
      const $found = $(found);
      if($found.data('copy-bound')) return; // original handler exists
      ev.stopPropagation(); ev.preventDefault();
      const commandText = document.querySelector('.footer-box-big') ? document.querySelector('.footer-box-big').innerText : '';
      const textarea = document.createElement('textarea');
      textarea.value = commandText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      try{ $found.addClass('copied'); setTimeout(()=>{ $found.removeClass('copied'); }, 1000); }catch(e){}
      if (typeof notifySuccess === 'function') { notifySuccess({ key: 'notifications.copied', timeout: 1800 }); }
    }catch(e){}
  }, false);

  // Extra robust delegated handler: catch clicks on any footer/mobile element that contains copy/random icons
  document.addEventListener('click', function(ev){
    try{
      // Avoid duplicate handling if a direct handler ran very recently or a footer action is in progress
      if(document._footerActionInProgress) return;
      if(window._lastFooterAction && (Date.now() - window._lastFooterAction) < 600) return;
      const el = ev.target;
      const candidate = el.closest && el.closest('.footer-box, .mobile-action, #footerMobileToggle');
      if(!candidate) return;
      const ico = candidate.querySelector && candidate.querySelector('i');
      if(!ico) return;

      // Handle copy icon clicks
      if(ico.classList.contains('fa-copy')){
        ev.stopPropagation(); ev.preventDefault();
        // set lock so other handlers ignore this same user action
        document._footerActionInProgress = true; setTimeout(function(){ document._footerActionInProgress = false; }, 700);
        const commandText = document.querySelector('.footer-box-big') ? document.querySelector('.footer-box-big').innerText : '';
        const textarea = document.createElement('textarea'); textarea.value = commandText; document.body.appendChild(textarea); textarea.select(); document.execCommand('copy'); document.body.removeChild(textarea);
        try{ $(candidate).addClass('copied'); setTimeout(()=>{ $(candidate).removeClass('copied'); }, 1000); }catch(e){}
        if (typeof notifySuccess === 'function') notifySuccess({ key: 'notifications.copied', timeout: 1800 });
        // close mobile actions if they are open
        const actions = document.getElementById('footerMobileActions'); if(actions) actions.classList.remove('show');
        return;
      }

      // Handle random icon clicks
      if(ico.classList.contains('fa-shuffle')){
        ev.stopPropagation(); ev.preventDefault();
        // set lock so other handlers ignore this same user action
        document._footerActionInProgress = true; setTimeout(function(){ document._footerActionInProgress = false; }, 700);
        // Prefer clicking actual footerRandomButton if present
        const rb = document.getElementById('footerRandomButton');
        if(rb && typeof rb.click === 'function') { rb.click(); }
        else if(window._randimizerRandomize && typeof window._randimizerRandomize === 'function') { window._randimizerRandomize(); }
        // close mobile actions if they are open
        const actions = document.getElementById('footerMobileActions'); if(actions) actions.classList.remove('show');
        return;
      }
    }catch(e){}
  }, false);
});

let isSaved = false;
const updateStatus = (saved) => {
  const statusButton = $("#statusButton");
  const statusIcon = statusButton.find("i");

  statusIcon
    .removeClass("fa-times fa-check not-saved saved")
    .addClass(saved ? "fa-check saved" : "fa-times not-saved");

  // Apply unified CSS classes instead of inline styles
  statusButton.addClass('status-button').removeClass('status-saved status-not-saved').addClass(saved ? 'status-saved' : 'status-not-saved');

  isSaved = saved;
};

const saveName = () => {
  const name = $("#mobName").val().trim();
  if (name) {
    updateStatus(true);
    console.log("Nombre guardado:", name);
  }
};

$("#saveButton").on("click", saveName);

$(document).ready(function () {
  $("#customPopup").on("show", function () {
    updateStatus(false);
  });

  $("#mobName")
    .on("input", function () {
      const name = $(this).val().trim();
      // Actualizar estado según si hay contenido
      updateStatus(!!name);
      updateCommand();
    })
    .on("keypress", function (e) {
      if (e.key === "Enter" || e.keyCode === 13) {
        e.preventDefault();
        updateCommand();
      }
    });
});

$(document).ready(function () {
  $("#card2, #card2 + .card-icon").on("click", function () {
    $("#amountPopup").addClass("show");
  });

  $("#card2 .question-icon").on("click", function (e) {
    e.stopPropagation();
    $("#amountHelpPopup").addClass("show");
  });

  let isAmountSaved = false;
  const updateAmountStatus = (saved) => {
    const statusButton = $("#amountStatusButton");
    const statusIcon = statusButton.find("i");

    // Remover todas las clases posibles primero
    statusIcon
      .removeClass("fa-times fa-check not-saved saved")
      .addClass(saved ? "fa-check saved" : "fa-times not-saved");

    // Use unified classes to control visual state
    statusButton.addClass('status-button').removeClass('status-saved status-not-saved').addClass(saved ? 'status-saved' : 'status-not-saved');


    isAmountSaved = saved;
  };

  const saveAmount = () => {
    const amount = $("#mobAmount").val().trim();
    if (amount && !isNaN(amount)) {
      const numAmount = parseInt(amount);
      if (numAmount > 0 && numAmount <= 20) {
        updateAmountStatus(true);
        updateCommand(); // Actualizar comando cuando se guarda
        console.log("Cantidad guardada:", amount);
      }
    }
  };

  $("#amountSaveButton").on("click", saveAmount);

  $("#mobAmount")
    .on("input", function () {
      // Forzar solo números
      this.value = this.value.replace(/[^0-9]/g, "");
      let value = parseInt(this.value, 10);
      if (isNaN(value)) value = 0;
      if (value > 20) {
        this.value = "20";
        value = 20;
      }
      // Actualizar estado cuando hay un valor válido
      const isValid = value > 0 && value <= 20;
      updateAmountStatus(isValid);
    })
    .on("keypress", function (e) {
      if (e.key === "Enter" || e.keyCode === 13) {
        e.preventDefault();
        saveAmount();
      }
    });
  // Nota: la limpieza de caracteres se hace arriba en el mismo handler
});

$(document).ready(function () {
  $("#card3, #card3 + .card-icon").on("click", function () {
    $("#positionPopup").addClass("show");
  });

  $("#card3 .question-icon").on("click", function (e) {
    e.stopPropagation();
    $("#positionHelpPopup").addClass("show");
  });

  let isPositionSaved = { x: false, y: false };

  const updatePositionStatus = (coord, saved) => {
    const statusButton = $(`#pos${coord.toUpperCase()}StatusButton`);
    const statusIcon = statusButton.find("i");

    statusIcon
      .removeClass("fa-times fa-check")
      .addClass(saved ? "fa-check" : "fa-times");

    statusButton.addClass('status-button').removeClass('status-saved status-not-saved').addClass(saved ? 'status-saved' : 'status-not-saved');

    isPositionSaved[coord.toLowerCase()] = saved;
  };

  const savePosition = (coord) => {
    const pos = $(`#pos${coord.toUpperCase()}`).val().trim();
    if (pos && !isNaN(pos)) {
      updatePositionStatus(coord, true);
      console.log(`Posición ${coord.toUpperCase()} guardada:`, pos);
    }
  };

  $("#posXSaveButton, #posYSaveButton").on("click", function () {
    const coord = $(this).attr("id").includes("X") ? "X" : "Y";
    savePosition(coord);
  });

  $("#posX, #posY")
    .on("input", function () {
      const coord = $(this).attr("id").includes("X") ? "X" : "Y";
      const value = $(this).val().trim();
      // Actualizar estado cuando hay un valor
      updatePositionStatus(coord, !!value);
    })
    .on("keypress", function (e) {
      if (e.key === "Enter" || e.keyCode === 13) {
        e.preventDefault();
        const coord = $(this).attr("id").includes("X") ? "X" : "Y";
        savePosition(coord);
      }
    });

  $("#positionType").on("change", function () {
    const selectedType = $(this).val();
    const posX = $("#posX");
    const posY = $("#posY");
    const labelPosX = $("#labelPosX");
    const labelPosY = $("#labelPosY");

    if (selectedType) {
      posX.prop("disabled", false);
      posY.prop("disabled", false);

      if (selectedType === "relative") {
        labelPosX.text(t('modals.position.coordXRelative', 'Coordenada ~X:'));
        labelPosY.text(t('modals.position.coordYRelative', 'Coordenada ~Y:'));
      } else {
        labelPosX.text(t('modals.position.coordX', 'Coordenada X:'));
        labelPosY.text(t('modals.position.coordY', 'Coordenada Y:'));
      }

      // Actualizar el comando cuando cambie el tipo de posición
      updateCommand();
    } else {
      posX.prop("disabled", true);
      posY.prop("disabled", true);
      labelPosX.text("Coordenada X:");
      labelPosY.text("Coordenada Y:");
    }

    posX.val("");
    posY.val("");
    updatePositionStatus("X", false);
    updatePositionStatus("Y", false);
  });
});

$(document).ready(function () {
  $.getJSON(
    "data/items.json",
    function (data) {
      const itemSelect = $("#itemSelect");

      // ensure externalTranslations map exists
      window.externalTranslations = window.externalTranslations || {};
      const currentSavedLang = localStorage.getItem('language') || 'es';

      data.items.forEach((item) => {
        const key = `external.items.${item.value}`;
        // Ensure both `en` and `es` keys exist; use item.text as fallback for missing entries
        window.externalTranslations[key] = Object.assign({ en: item.text, es: item.text }, item.translations || {});

        const displayText = (window.externalTranslations[key] && window.externalTranslations[key][currentSavedLang]) ? window.externalTranslations[key][currentSavedLang] : item.text;

        const $opt = $("<option>")
          .val(item.value)
          .text(displayText)
          .attr('data-i18n', key)
          .attr('data-default-text', item.text)
          .data('image', item.image);

        itemSelect.append($opt);
      });

      itemSelect
        .select2({
          templateResult: formatOption,
          templateSelection: formatOption,
          width: "100%",
          dropdownParent: $("#itemPopup"),
          matcher: function(params, data) {
            // Si la opción está deshabilitada, no permitir su selección
            if ($(data.element).prop('disabled')) {
              return null;
            }
            // Comportamiento normal de búsqueda
            if (!params.term) {
              return data;
            }
            if (data.text.toLowerCase().indexOf(params.term.toLowerCase()) > -1) {
              return data;
            }
            return null;
          }
        })
        .next(".select2-container")
        .css({
          "border-radius": "0.375rem",
          height: "2.8em",
          "margin-top": "-0.4em",
        })
        .find(".select2-selection")
        .css({
          height: "100%",
          display: "flex",
          "align-items": "center",
        })
        .find(".select2-selection__arrow")
        .css({
          height: "100%",
          "line-height": "2.8em",
          top: "0",
        });

      $("#itemSelect").on("change", function () {
        const selectedValue = $(this).val();
        const itemAmount = $("#itemAmount").val();
        const itemData = $("#itemData").val();
        
        if (selectedValue) {
          // Solo actualizar el estado si tenemos todos los datos necesarios
          const isValid = selectedValue && itemAmount && itemData;
          updateItemStatus(isValid);
          if (isValid) {
            console.log("Item guardado:", {
              item: selectedValue,
              amount: itemAmount,
              data: itemData
            });
            // Guardar en el objeto de cards
            if (window.cards && window.cards.card4) {
              window.cards.card4 = {
                itemSelect: selectedValue,
                itemAmount: itemAmount,
                itemData: itemData
              };
            }
            // Actualizar el comando
            updateCommand();
            // Limpiar los inputs después de guardar
            $("#itemAmount, #itemData").val("");
          }
        } else {
          updateItemStatus(false);
        }
      });
    }
  );

  $("#card4, #card4 + .card-icon").on("click", function () {
    $("#itemPopup").addClass("show");
  });

  $("#card4 .question-icon").on("click", function (e) {
    e.stopPropagation();
    $("#itemHelpPopup").addClass("show");
  });

  let isItemSaved = false;

  const updateItemStatus = (saved) => {
    const statusButton = $("#itemStatusButton");
    const statusIcon = statusButton.find("i");
    const itemSelect = $("#itemSelect").val();
    const itemAmount = $("#itemAmount").val();
    const itemData = $("#itemData").val();
    // Considerar guardado si hay un item seleccionado (comportamiento similar a armadura)
    const finalSaved = !!itemSelect;

    console.log("Estado de los campos (item):", {
      itemSelect,
      itemAmount,
      itemData,
      finalSaved
    });

    statusIcon
      .removeClass("fa-times fa-check not-saved saved")
      .addClass(finalSaved ? "fa-check saved" : "fa-times not-saved");

    // Use finalSaved as the visual determinant (was using saved by mistake for border)
    statusButton.addClass('status-button').removeClass('status-saved status-not-saved').addClass(finalSaved ? 'status-saved' : 'status-not-saved');

    isItemSaved = finalSaved;
    return finalSaved;
  };

$("#itemSelect").on("change", function () {
      const selectedValue = $(this).val();
      console.log("Cambio detectado en itemSelect:", selectedValue);
      
      // Actualizar estado inmediatamente cuando se selecciona un item
      const isValid = !!selectedValue;
      updateItemStatus(isValid);
      
      if (isValid) {
        console.log("Item seleccionado:", selectedValue);
      }
    });  $("#itemPopup").on("show", function () {
    updateItemStatus(false);
    // Limpiar los inputs al abrir el popup
    $("#itemAmount, #itemData").val("");
  });

  // Agregar listeners para los inputs
  $("#itemAmount, #itemData").on("input", function() {
    const itemSelect = $("#itemSelect").val();
    if (itemSelect) {
      updateItemStatus(true);
    }
  });
});

$(document).ready(function () {
  $("#card9, #card9 + .card-icon").on("click", function () {
    $("#healthPopup").addClass("show");
  });

  $("#card9 .question-icon").on("click", function (e) {
    e.stopPropagation();
    $("#healthHelpPopup").addClass("show");
  });

  let isHealthSaved = false;
  const updateHealthStatus = (saved) => {
    const statusButton = $("#healthStatusButton");
    const statusIcon = statusButton.find("i");

    statusIcon
      .removeClass("fa-times fa-check")
      .addClass(saved ? "fa-check" : "fa-times");

    statusButton.addClass('status-button').removeClass('status-saved status-not-saved').addClass(saved ? 'status-saved' : 'status-not-saved');

    isHealthSaved = saved;
  };

  const saveHealth = () => {
    const health = $("#mobHealth").val().trim();
    if (health && !isNaN(health)) {
      const numHealth = parseInt(health);
      if (numHealth > 0 && numHealth <= 1000) {
        updateHealthStatus(true);
        console.log("Vida guardada:", health);
        // Actualizar el comando con la nueva vida
        updateCommand();
        // Limpiar el input después de guardar
        $("#mobHealth").val("");
      }
    }
  };

  $("#healthSaveButton").on("click", saveHealth);

  $("#mobHealth")
    .on("input", function () {
      let value = parseInt(this.value);
      if (isNaN(value)) value = 0;
      if (value > 1000) {
        this.value = 1000;
        value = 1000;
      }
      // Actualizar estado cuando hay un valor válido
      const isValid = value > 0 && value <= 1000;
      updateHealthStatus(isValid);
      // Render hearts preview
      try { renderHealthHearts(value); } catch (e) { /* ignore */ }
    })
    .on("keypress", function (e) {
      if (e.key === "Enter" || e.keyCode === 13) {
        e.preventDefault();
        saveHealth();
      }
    });

  $("#mobHealth").on("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "");
  });
});

// Render dynamic hearts based on numeric health input
function renderHealthHearts(healthValue) {
  const container = document.getElementById('healthHearts');
  if (!container) return;
  let hp = parseInt(healthValue, 10) || 0;
  container.innerHTML = '';
  if (hp <= 0) return;

  // Each full heart = 2 hp, half heart = 1 hp
  const fullHearts = Math.floor(hp / 2);
  const halfHeartCount = hp % 2 === 1 ? 1 : 0;
  const MAX_ICONS = 50;

  // Use the same image snippets but build a single HTML string (faster than DOM ops)
  const fullHeartHTML = '<img class="block-image" src="https://res.cloudinary.com/dnyoogvv1/image/upload/v1764644594/blocks2_okmvnm.png" style="width: 16px; height: 16px; object-fit: none; object-position: -256px -160px;">';
  const halfHeartHTML = '<img class="block-image" src="https://res.cloudinary.com/dnyoogvv1/image/upload/v1764644594/blocks2_okmvnm.png" style="width: 16px; height: 16px; object-fit: none; object-position: -240px -160px;">';

  let iconsRendered = 0;
  let heartsHtml = '';

  for (let i = 0; i < fullHearts && iconsRendered < MAX_ICONS; i++) {
    heartsHtml += fullHeartHTML;
    iconsRendered++;
  }
  if (halfHeartCount && iconsRendered < MAX_ICONS) {
    heartsHtml += halfHeartHTML;
    iconsRendered++;
  }

  // If there are remaining heart units (not rendered), show a counter
  const totalHeartUnits = fullHearts + halfHeartCount * 0.5;
  const remainingUnits = Math.max(0, totalHeartUnits - iconsRendered);
  if (remainingUnits > 0) {
    const display = Number.isInteger(remainingUnits) ? String(remainingUnits) : remainingUnits.toFixed(1);
    heartsHtml += `<div class="more-count">x(${display})</div>`;
  }

  // Set in one operation to minimize reflows
  container.innerHTML = heartsHtml;
}

// Helper to clear the health hearts preview
function clearHealthHearts() {
  const container = document.getElementById('healthHearts');
  if (!container) return;
  container.innerHTML = '';
}

// GLOBAL: manage Loot toggle + status so other modules (load/save/clear) can call it
// setLootState(enabled) will set the toggle UI and update the small status button
function setLootState(enabled) {
  const $toggle = $("#toggleLoot");
  const $icon = $toggle.find("i");
  const $span = $toggle.find("span");

  if (enabled) {
    $icon.removeClass("fa-toggle-off").addClass("fa-toggle-on");
    $span.text(t('common.enabled', 'Activado'));
  } else {
    $icon.removeClass("fa-toggle-on").addClass("fa-toggle-off");
    $span.text(t('common.disabled', 'Desactivado'));
  }

  // update the small status button to mirror the toggle "saved" state policy:
  // when the toggle is enabled, treat the status as saved (true). When disabled -> not saved.
  updateLootStatus(enabled);
  // expose current state
  window.isLootEnabled = !!enabled;
}

// Make updateLootStatus globally available so load/save routines can call it
function updateLootStatus(saved) {
  const statusButton = $("#lootStatusButton");
  const statusIcon = statusButton.find("i");

  statusIcon
    .removeClass("fa-times fa-check")
    .addClass(saved ? "fa-check" : "fa-times");

  // unified classes
  statusButton.addClass('status-button').removeClass('status-saved status-not-saved').addClass(saved ? 'status-saved' : 'status-not-saved');

  window.isLootSaved = !!saved;
}

$(document).ready(function () {
  let isLootEnabled = false;
  let isLootSaved = false;

  $("#card5, #card5 + .card-icon").on("click", function () {
    $("#lootPopup").addClass("show");
  });

  $("#card5 .question-icon").on("click", function (e) {
    e.stopPropagation();
    $("#lootHelpPopup").addClass("show");
  });

  $("#toggleLoot").on("click", function () {
    // Toggle state and use the centralized setter so status button is consistent
    isLootEnabled = !isLootEnabled;
    setLootState(isLootEnabled);
  });

  $("#lootSaveButton").on("click", function () {
    // Mark as saved and ensure UI matches
    setLootState(window.isLootEnabled === true);
    // Also mark the saved status explicitly
    updateLootStatus(true);
    console.log("Estado del loot guardado:", window.isLootEnabled);
  });
});

$(document).ready(function () {
  $.getJSON(
    "data/armor.json",
    function (data) {
      const selects = ["helmet", "chestplate", "leggings", "boots"];
      const armorStatus = {};

      // Ensure a place to store external translations loaded from armor.json
      window.externalTranslations = window.externalTranslations || {};
      const currentSavedLang = localStorage.getItem('language') || 'es';

      selects.forEach((type) => {
        const select = $(`#${type}Select`);
          if (data[type]) {
            data[type].forEach((item) => {
              // create option with data-i18n key so translations can be applied
              const key = `external.armor.${type}.${item.value}`;

              // store translations map for later language switches
              // Ensure both `en` and `es` keys exist; use item.text as fallback for missing entries
              window.externalTranslations[key] = Object.assign({ en: item.text, es: item.text }, item.translations || {});

              // choose initial display text according to saved language
              const displayText = (window.externalTranslations[key] && window.externalTranslations[key][currentSavedLang]) ? window.externalTranslations[key][currentSavedLang] : item.text;

              const $opt = $("<option>")
                .val(item.value)
                .text(displayText)
                .attr('data-i18n', key)
                .attr('data-default-text', item.text)
                .data('image', item.image);
              select.append($opt);
            });
          }

        select
          .select2({
            templateResult: formatOption,
            templateSelection: formatOption,
            width: "100%",
            dropdownParent: $("#armorPopup"),
          })
          .next(".select2-container")
          .css({
            "border-radius": "0.375rem",
            height: "2.8em",
            "margin-top": "-0.4em",
          })
          .find(".select2-selection")
          .css({
            height: "100%",
            display: "flex",
            "align-items": "center",
          })
          .find(".select2-selection__arrow")
          .css({
            height: "100%",
            "line-height": "2.8em",
            top: "0",
          });

        armorStatus[type] = false;

        const updateArmorStatus = (type, saved) => {
          const statusButton = $(`#${type}StatusButton`);
          const statusIcon = statusButton.find("i");

          statusIcon
            .removeClass("fa-times fa-check")
            .addClass(saved ? "fa-check" : "fa-times");

          statusButton.addClass('status-button').removeClass('status-saved status-not-saved').addClass(saved ? 'status-saved' : 'status-not-saved');

          armorStatus[type] = saved;
        };

        select.on("change", function () {
          const value = $(this).val();
          updateArmorStatus(type, !!value);
          if (value) {
            console.log(`${type} guardado:`, value);
          }
        });
      });
    }
  );

  $("#card6, #card6 + .card-icon").on("click", function () {
    $("#armorPopup").addClass("show");
  });

  $("#card6 .question-icon").on("click", function (e) {
    e.stopPropagation();
    $("#armorHelpPopup").addClass("show");
  });
});

$(document).ready(function () {
  let isAggressivenessSaved = false;

  $("#cardAggressiveness, #cardAggressiveness + .card-icon").on(
    "click",
    function () {
      $("#aggressivenessPopup").addClass("show");
    }
  );

  $("#cardAggressiveness .question-icon").on("click", function (e) {
    e.stopPropagation();
    $("#aggressivenessHelpPopup").addClass("show");
  });

  const updateAggressivenessStatus = (saved) => {
    const statusButton = $("#aggressivenessStatusButton");
    const statusIcon = statusButton.find("i");

    statusIcon
      .removeClass("fa-times fa-check")
      .addClass(saved ? "fa-check" : "fa-times");

    statusButton.addClass('status-button').removeClass('status-saved status-not-saved').addClass(saved ? 'status-saved' : 'status-not-saved');

    isAggressivenessSaved = saved;
  };

  $("#aggressivenessSelect").on("change", function () {
    const selectedValue = $(this).val();
    updateAggressivenessStatus(!!selectedValue);
    if (selectedValue) {
      console.log("Agresividad guardada:", selectedValue);
    }
  });
});

$(document).ready(function () {
  $("#languageButton")
    .off("click")
    .on("click", function (e) {
      e.stopPropagation();
      $("#languagePopup").addClass("show");
    });

  // Cargar y aplicar idioma
  function loadLanguage(lang, cb) {
    const url = `lang/${lang}.json`;
    $.getJSON(url)
      .done(function (data) {
        window.currentLangData = data;

        // Función auxiliar para obtener valor anidado de objeto usando una ruta con puntos
        function getNestedValue(obj, path) {
          return path.split('.').reduce((current, key) => current && current[key], obj);
        }

        // Actualizar elementos con data-i18n
        $('[data-i18n]').each(function() {
          const $element = $(this);
          const key = $element.data('i18n');
          let value = getNestedValue(data, key);

          // If value not found and element has data-default-text (external lists), use that
          if (value === undefined && $element.attr('data-default-text')) {
            value = $element.attr('data-default-text');
          }

          if (value) {
                // Si el elemento tiene un atributo data-i18n-attr (por ejemplo: data-i18n-attr="placeholder")
                // jQuery .data() convierte nombres con guiones a camelCase, así que leemos el atributo bruto
                const i18nAttr = $element.attr('data-i18n-attr') || $element.data('i18nAttr') || $element.data('i18n-attr');
                if (i18nAttr) {
                  // Si hay un atributo específico para traducir (como placeholder, title, alt, etc)
                  $element.attr(i18nAttr, value);
                } else if ($element.is('option') && $element.parent().hasClass('select-with-images')) {
              // For options inside select2/complex selects, update the text and also the option's text node
              $element.text(value);
            } else {
              // Por defecto, actualizar el contenido de texto
              $element.text(value);
            }
          }
        });

        // Common: Update placeholder option text for selects
        if (data.common && data.common.select) {
          $("select").each(function () {
            const $first = $(this).find("option").first();
            if ($first && $first.val() === "") {
              $first.text(data.common.select);
            }
          });
        }

        // Update toggle button states
        $('.popup-toggle-button').each(function() {
          const $button = $(this);
          const $span = $button.find('span');
          const isOn = $button.find('i').hasClass('fa-toggle-on');
          const key = isOn ? 'common.enabled' : 'common.disabled';
          const value = getNestedValue(data, key);
          if (value) {
            $span.text(value);
          }
        });

          // Update dynamically populated selects (armor, mobs) by translating their options if possible
          $('select option[data-i18n]').each(function() {
            const $opt = $(this);
            const key = $opt.data('i18n');
            const val = getNestedValue(data, key);
            if (val !== undefined) {
              $opt.text(val);
            } else if (window.externalTranslations && window.externalTranslations[key] && window.externalTranslations[key][lang]) {
              // use translations provided by external data sources (e.g., armor.json or items.json)
              $opt.text(window.externalTranslations[key][lang]);
            } else if ($opt.attr('data-default-text')) {
              // ensure fallback exists
              $opt.text($opt.attr('data-default-text'));
            }
          });

          // Reinitialize Select2 for selects that had option text changes so dropdown & selection update
          $('select').each(function() {
            const $sel = $(this);
            // only handle selects that contain translated options
            if ($sel.find('option[data-i18n]').length === 0) return;

            // If not a Select2 instance, nothing to do
            if (!$sel.data('select2')) return;

            // Decide configuration based on popup container
            const inArmorPopup = $sel.closest('#armorPopup').length > 0;
            const inItemPopup = $sel.closest('#itemPopup').length > 0;
            const isMobType = $sel.is('#mobType');

            try {
              $sel.select2('destroy');
            } catch (e) {
              // ignore
            }

            if (inArmorPopup) {
              $sel.select2({ templateResult: formatOption, templateSelection: formatOption, width: '100%', dropdownParent: $('#armorPopup') })
                .next('.select2-container')
                .css({ 'border-radius': '0.375rem', height: '2.8em', 'margin-top': '-0.4em' })
                .find('.select2-selection')
                .css({ height: '100%', display: 'flex', 'align-items': 'center' })
                .find('.select2-selection__arrow')
                .css({ height: '100%', 'line-height': '2.8em', top: '0' });
            } else if (inItemPopup) {
              $sel.select2({ templateResult: formatOption, templateSelection: formatOption, width: '100%', dropdownParent: $('#itemPopup') })
                .next('.select2-container')
                .css({ 'border-radius': '0.375rem', height: '2.8em', 'margin-top': '-0.4em' })
                .find('.select2-selection')
                .css({ height: '100%', display: 'flex', 'align-items': 'center' })
                .find('.select2-selection__arrow')
                .css({ height: '100%', 'line-height': '2.8em', top: '0' });
            } else if (isMobType) {
              $sel.select2({ templateResult: formatOption, templateSelection: formatSelection, width: '100%' });
            } else {
              // generic reinit with default templates
              $sel.select2({ templateResult: formatOption, templateSelection: formatOption, width: '100%' });
            }
          });

        // Update theme button text according to current theme
        const currentThemeIsDark = document.documentElement.getAttribute("data-theme") === "dark";
        const themeText = currentThemeIsDark ? (data.menu.theme.light || "Claro") : (data.menu.theme.dark || "Oscuro");
        $("#themeButton span").text(themeText);

        console.log('Idioma cargado:', lang);
        // invoke optional callback after language has been fully applied
        try { if (typeof cb === 'function') cb(); } catch (e) { /* ignore callback errors */ }
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        console.error("Error al cargar el idioma:", textStatus, errorThrown);
      });
  }

  $(".language-btn").on("click", function () {
    $('.language-btn').removeClass('active');
    $(this).addClass('active');
    const lang = $(this).data('lang');
    localStorage.setItem('language', lang);
    translateLoadingScreen(); // Traducir pantalla de carga
    // Load language and apply translations (no notification shown)
    // Pass a callback to ensure dynamic UI (selects, modals) are refreshed after translations
    loadLanguage(lang, function(){
      try{ if(typeof updateMobSelect2Language === 'function') updateMobSelect2Language(); }catch(e){}
      try{ if(typeof updateSidebarItemSelect2Language === 'function') updateSidebarItemSelect2Language(); }catch(e){}
      try{ updateCommand(); }catch(e){}
        try{ if(window.lootTagsStore && typeof window.lootTagsStore.refreshLanguage === 'function') window.lootTagsStore.refreshLanguage(); }catch(e){}
      // If baby modal is open, re-evaluate visibility/status so texts update
      try{
        const cur = $('#babyMode').val();
        if(cur === 'time') { $('#babyRow').show(); $('#babyTimeWrapper').show(); } else { $('#babyRow').hide(); $('#babyTimeWrapper').hide(); }
      }catch(e){}
    });
    // Close the language selection modal after applying the language
    $("#languagePopup").removeClass('show');
  });

  // Home button: navigate to the external tools page when clicked
  $(document).ready(function () {
    $("#homeButton").off('click').on('click', function (e) {
      e.stopPropagation();
      window.location.href = 'https://mine-blocks-tools.vercel.app/index2.html';
    });
  });

  // Corrección aquí: typo en savedLanguage
  const savedLanguage = localStorage.getItem("language") || "es";
  $(".language-btn").removeClass("active");
  $(`.language-btn[data-lang="${savedLanguage}"]`).addClass("active");
  // Cargar idioma guardado al iniciar y refrescar select2
  if (typeof loadLanguage === 'function') {
    loadLanguage(savedLanguage);
    setTimeout(function() {
      if (typeof updateMobSelect2Language === 'function') updateMobSelect2Language();
      try{ if(typeof updateSidebarItemSelect2Language === 'function') updateSidebarItemSelect2Language(); }catch(e){}
      try{ if(window.lootTagsStore && typeof window.lootTagsStore.refreshLanguage === 'function') window.lootTagsStore.refreshLanguage(); }catch(e){}
    }, 300);
  }

  $(".popup-close, .popup-overlay").on("click", function (e) {
    if (e.target === this) {
      const $ov = $(this).closest('.popup-overlay');
      // If closing the loot tags modal, set a short-lived flag so other handlers
      // (like the global click cancel) can detect an intentional close and avoid
      // hiding update buttons.
      try{
        if($ov && $ov.attr('id') === 'lootTagsPopup'){
          window._lootTagsModalClosing = true;
          // Only clear form inputs, NOT the editing state
          if(typeof window.lootTagsStore !== 'undefined' && window.lootTagsStore){
            try { window.lootTagsStore.clearForm(false); } catch(e){}
          }
          setTimeout(function(){ window._lootTagsModalClosing = false; }, 300);
        }
      }catch(e){}
      $ov.removeClass("show");
    }
  });
});

// Nueva función para cargar la configuración de bloqueo de tarjetas desde un solo archivo JSON centralizado
function loadMobLockConfig(mobType) {
  return new Promise(function(resolve) {
    if (!mobType) {
      lockAllCards();
      return resolve();
    }

    const configUrl = "data/cards_config.json";

    $.getJSON(configUrl)
      .done(function (allConfigs) {
        const config = allConfigs[mobType];
        if (config && Array.isArray(config.lockedCards)) {
          applyCardLocks(config.lockedCards);
        } else {
          lockAllCards();
        }
        resolve();
      })
      .fail(function () {
        lockAllCards();
        resolve();
      });
  });
}

// Aplica el bloqueo/desbloqueo: solo las tarjetas en unlockedCardIds estarán desbloqueadas, el resto bloqueadas
function applyCardLocks(unlockedCardIds) {
  $(".card, .card-icon").each(function () {
    const cardId = $(this).attr("id");
    if (unlockedCardIds.includes(cardId)) {
      $(this).removeClass("locked");
      $(this).find(".card-lock-overlay").remove();
    } else {
      $(this).addClass("locked");
      if (
        !$(this).find(".card-lock-overlay").length &&
        !$(this).hasClass("card-icon")
      ) {
        $(this).append(
          '<div class="card-lock-overlay"><i class="fas fa-lock"></i></div>'
        );
      }
    }
  });
  reorderCardsByLockState();
}

// Bloquea todas las tarjetas
function lockAllCards() {
  $(".card, .card-icon").each(function () {
    const $card = $(this);
    $card.addClass("locked");
    if (!$card.find(".card-lock-overlay").length && !$card.hasClass("card-icon")) {
      $card.append('<div class="card-lock-overlay"><i class="fas fa-lock"></i></div>');
    }
  });
  reorderCardsByLockState();
}

// Reordena las cards: primero las desbloqueadas, luego las bloqueadas
function reorderCardsByLockState() {
  const $grid = $(".card-grid");
  if ($grid.length === 0) return;

  // Selecciona todas las cards y card-icons en el orden actual
  const $cards = $grid.children(".card, .card-icon");
  // Separa desbloqueadas y bloqueadas
  const unlocked = [];
  const locked = [];
  $cards.each(function () {
    if (!$(this).hasClass("locked")) {
      unlocked.push(this);
    } else {
      locked.push(this);
    }
  });

  // Limpia el grid y agrega primero desbloqueadas, luego bloqueadas (manteniendo pares card/card-icon juntos)
  $grid.empty();
  // Helper para mantener pares card/card-icon juntos
  function appendPairs(cardList) {
    for (let i = 0; i < cardList.length; i++) {
      const $el = $(cardList[i]);
      if ($el.hasClass("card")) {
        $grid.append($el);
        // Busca el siguiente card-icon (hermano inmediato en DOM original)
        const $icon = $cards.eq($cards.index($el) + 1);
        if ($icon.hasClass("card-icon")) {
          $grid.append($icon);
        }
      }
    }
  }
  appendPairs(unlocked);
  appendPairs(locked);

  // Reasignar eventos después de reordenar
  attachCardPopupEvents();
}

// Asigna los eventos de apertura de popups y ayuda a las cards
function attachCardPopupEvents() {
  // Mapeo de cards a popups principales
  const cardMappings = {
    card1: "customPopup",
    card2: "amountPopup",
    card3: "positionPopup",
    card4: "itemPopup",
    card5: "lootPopup",
    card6: "armorPopup",
    card7: "lootTagsPopup",
    card9: "healthPopup",
    card10: "skinPopup",
    card11: "soundPopup",
    card12: "visibilityPopup",
    card13: "firePopup",
    card14: "lifetimePopup",
    card15: "babyPopup",
    card16: "colorPopup",
    card17: "sizePopup",
    card18: "chargedPopup",
    cardAggressiveness: "aggressivenessPopup"
  };

  Object.entries(cardMappings).forEach(([cardId, popupId]) => {
    $(`#${cardId}, #${cardId} + .card-icon`).off("click").on("click", function (e) {
      // First check if mob is selected
      const mobType = $('#mobType').val();
      if (!mobType || mobType.trim() === '') {
        e.preventDefault();
        e.stopPropagation();
        // Notify user to select a mob first
        try {
          const msgKey = 'notifications.select_mob';
          const msgText = (typeof t === 'function') ? t(msgKey, 'Por favor, selecciona un mob primero') : 'Por favor, selecciona un mob primero';
          if (typeof notify === 'function') notify({ type: 'warning', text: msgText, timeout: 2000 });
          else alert(msgText);
        } catch(err) { console.warn('Could not show mob selection notification'); }
        return false;
      }
      
      // Then check if card is locked for this mob
      if ($(this).hasClass("locked") || $(`#${cardId}`).hasClass("locked")) {
        e.preventDefault();
        e.stopPropagation();
        // Notify user that card is not available for this mob
        try {
          const msgKey = 'notifications.card_not_available';
          const msgText = (typeof t === 'function') ? t(msgKey, 'Tarjeta no disponible') : 'Tarjeta no disponible';
          if (typeof notify === 'function') notify({ type: 'warning', text: msgText, timeout: 2000 });
          else alert(msgText);
        } catch(err) { console.warn('Could not show card unavailable notification'); }
        return false;
      }
      
      $(`#${popupId}`).addClass("show");
    });
  });

  // Mapeo de cards a popups de ayuda
  const helpPopupMappings = {
    card1: "helpPopup",
    card2: "amountHelpPopup",
    card3: "positionHelpPopup",
    card4: "itemHelpPopup",
    card5: "lootHelpPopup",
    card6: "armorHelpPopup",
    card7: "lootTagsHelpPopup",
    card9: "healthHelpPopup",
    card10: "skinHelpPopup",
    card11: "soundHelpPopup",
    card12: "visibilityHelpPopup",
    card13: "fireHelpPopup",
    card14: "lifetimeHelpPopup",
    card15: "babyHelpPopup",
    card16: "colorHelpPopup",
    card17: "sizeHelpPopup",
    card18: "chargedHelpPopup",
    cardAggressiveness: "aggressivenessHelpPopup"
  };

  Object.entries(helpPopupMappings).forEach(([cardId, helpPopupId]) => {
    $(`#${cardId} .question-icon`).off("click").on("click", function (e) {
      // Check if mob is selected first
      const mobType = $('#mobType').val();
      if (!mobType || mobType.trim() === '') {
        e.preventDefault();
        e.stopPropagation();
        try {
          const msgKey = 'notifications.select_mob';
          const msgText = (typeof t === 'function') ? t(msgKey, 'Por favor, selecciona un mob primero') : 'Por favor, selecciona un mob primero';
          if (typeof notify === 'function') notify({ type: 'warning', text: msgText, timeout: 2000 });
          else alert(msgText);
        } catch(err) { console.warn('Could not show mob selection notification'); }
        return false;
      }
      
      // Check if card is locked for this mob
      if ($(`#${cardId}`).hasClass("locked")) {
        e.preventDefault();
        e.stopPropagation();
        try {
          const msgKey = 'notifications.card_not_available';
          const msgText = (typeof t === 'function') ? t(msgKey, 'Tarjeta no disponible') : 'Tarjeta no disponible';
          if (typeof notify === 'function') notify({ type: 'warning', text: msgText, timeout: 2000 });
          else alert(msgText);
        } catch(err) { console.warn('Could not show card unavailable notification'); }
        return false;
      }
      
      e.stopPropagation();
      $(`#${helpPopupId}`).addClass("show");
    });
  });
}

// Inicializar eventos al cargar la página
$(document).ready(function () {
  attachCardPopupEvents();
});

// Inicializar el modal de Loot Tags con el selector de items
$(document).ready(function () {
  $.getJSON(
    "data/items.json",
    function (data) {
      const sidebarItemSelect = $("#sidebarItemSelect");
      
      // Limpiar opciones existentes
      sidebarItemSelect.empty();
      // Ensure externalTranslations map exists and pick current language
      window.externalTranslations = window.externalTranslations || {};
      const currentSavedLang = localStorage.getItem('language') || 'es';
      // Use translation helper for placeholder and keep data-i18n
      sidebarItemSelect.append('<option value="" data-i18n="modals.lootTags.selectItemPlaceholder" data-default-text="Select item">' + t('modals.lootTags.selectItemPlaceholder', 'Select item') + '</option>');

      // Agregar items del JSON and register translations
      data.items.forEach((item) => {
        const key = `external.items.${item.value}`;
        // Ensure both `en` and `es` keys exist; use item.text as fallback for missing entries
        window.externalTranslations[key] = Object.assign({ en: item.text, es: item.text }, item.translations || {});
        const displayText = (window.externalTranslations[key] && window.externalTranslations[key][currentSavedLang]) ? window.externalTranslations[key][currentSavedLang] : item.text;
        const option = $("<option>")
          .val(item.value)
          .text(displayText)
          .attr("data-image", item.image)
          .attr('data-i18n', key)
          .attr('data-default-text', item.text);
        sidebarItemSelect.append(option);
      });

      // Destruir instancia previa de Select2 si existe
      if (sidebarItemSelect.data('select2')) {
        sidebarItemSelect.select2('destroy');
      }

      // Pequeño retraso para asegurar que el DOM esté listo
      setTimeout(() => {
        // Inicializar Select2 con nueva configuración
        sidebarItemSelect.select2({
          templateResult: function(option) {
            if (!option.id) return option.text;
            const img = $(option.element).data('image');
            const isSelected = $('.saved-item[data-value="' + option.id + '"]').length > 0;
            
            if (isSelected) {
              const $disabledOption = $('<span></span>').css({
                opacity: 0.5,
                cursor: 'not-allowed',
                color: '#999',
                textDecoration: 'line-through'
              });
              
              if (img) {
                $disabledOption.append(
                  $('<img src="' + img + '" style="width:20px;height:20px;vertical-align:middle;margin-right:8px;filter:grayscale(100%);" />')
                );
              }
              $disabledOption.append(option.text);
              option.disabled = true;
              return $disabledOption;
            }
            
            const $optionElem = $('<span></span>');
            if (img) {
              $optionElem.append(
                $('<img src="' + img + '" style="width:20px;height:20px;vertical-align:middle;margin-right:8px;border-radius: 6px;box-shadow:0 0 5px rgba(0, 0, 0, 0.36);" />')
              );
            }
            $optionElem.append(option.text);
            return $optionElem;
          },
          templateSelection: function(option) {
            return option.text; // Solo mostrar el texto sin imagen
          },
          width: "100%",
          dropdownParent: $("#lootTagsPopup .popup-content"),
          placeholder: t('modals.lootTags.selectItemPlaceholder', 'Select item'),
          allowClear: false,
          closeOnSelect: true,
          minimumResultsForSearch: 5
        });
        
        // Asegurar que el select2 esté por encima de otros elementos
        $("#lootTagsPopup .select2-container").css('z-index', 1);
        
        // Debug para ver si el select2 se inicializó correctamente
        console.log('Select2 initialized:', sidebarItemSelect.data('select2'));
      }, 100);

      // Manejar cambio de selección
      sidebarItemSelect.on("change", function () {
        const selectedValue = $(this).val();
        if (selectedValue) {
          // Obtener la imagen del item seleccionado
          const selectedOption = $(this).find('option:selected');
          const imageUrl = selectedOption.data('image');
          
          // Actualizar el add-item-header con la imagen
          const $addItemHeader = $('.add-item-header');
          $addItemHeader.find('.item-image').remove(); // Remover imagen anterior si existe
          
          if (imageUrl) {
            // Agregar nueva imagen antes del icono de plus
            const $image = $('<img>')
              .addClass('item-image')
              .attr('src', imageUrl)
              .css({
                width: '32px',
                height: '32px',
                verticalAlign: 'middle',
                marginRight: '8px'
              });
            $addItemHeader.find('.fa-plus').before($image);
          }
          console.log("Item seleccionado en Loot Tags:", selectedValue);
          try{
            if(!window._lootTagsSuppressSidebarChange){
              // Clear form data when changing items
              if(window.lootTagsStore && typeof window.lootTagsStore.clearForm === 'function') window.lootTagsStore.clearForm(true);
              // Apply item config for the newly selected item
              if(window.lootTagsStore && typeof window.lootTagsStore.applyItemConfig === 'function') window.lootTagsStore.applyItemConfig(selectedValue);
            }
          }catch(e){}
        }
      });
    }
  );

  // Loot Tags logic has been migrated to `lootTags.js` (independent module).
  // The previous inline handlers were removed to avoid duplicate behavior.
});

$(document).ready(function () {
  function changePage(pageNumber) {
    $(".card-page").removeClass("active");
    $(`#page${pageNumber}`).addClass("active");
    $(".dot").removeClass("active");
    $(`.dot[data-page="${pageNumber}"]`).addClass("active");

    if (!$("#mobType").val()) {
      toggleCardLocks(true);
    }
  }

  $(".dot").on("click", function () {
    const page = $(this).data("page");
    changePage(page);
  });

  function toggleCardLocks(show) {
    if (show) {
      $(".card").each(function () {
        if (!$(this).find(".card-lock-overlay").length) {
          $(this).append(
            '<div class="card-lock-overlay"><i class="fas fa-lock"></i></div>'
          );
        }
      });
    } else {
      $(".card-lock-overlay").remove();
    }
  }
});

// Definir updateCommand en el scope global para evitar ReferenceError
function updateCommand() {
  let command = '<span class="command-summon">/summon</span>';

  const mobType = $("#mobType").val() || "";
  if (mobType) {
    command += ` ${mobType}`;

    const quantity = $("#mobAmount").val() || "1";
    command += ` ${quantity}`;

    // Manejar la posición según el tipo seleccionado
    const positionType = $("#positionType").val();
    const posX = $("#posX").val() || "~";
    const posY = $("#posY").val() || "~";

    if (positionType === "relative") {
      command += ` ~${posX === "~" ? "" : posX} ~${posY === "~" ? "" : posY}`;
    } else if (positionType === "absolute") {
      command += ` ${posX} ${posY}`;
    } else {
      command += " ~ ~";
    }

    // Helper: only include attributes when the corresponding card is enabled (not locked)
    function isCardEnabled(cardId){ try{ return !$('#' + cardId).hasClass('locked'); }catch(e){ return true; } }

    // Solo añadir atributos si están configurados
    let attributes = [];

    const name = $("#mobName").val() || "";
    if (name && isCardEnabled('card1')) attributes.push(`name:"${name}"`);

    const health = $("#mobHealth").val() || "";
    if (health && isCardEnabled('card9')) attributes.push(`health:${health}`);

    const aggro = $("#aggressivenessSelect").val() || "";
    if (aggro && isCardEnabled('cardAggressiveness')) attributes.push(`aggro:"${aggro}"`);

    const armorPieces = ["helmet", "chestplate", "leggings", "boots"].map(
      (type) => {
        const value = $(`#${type}Select`).val() || "{}";
        return value === "{}" ? value : `"${value}"`;
      }
    );

    if (isCardEnabled('card6') && armorPieces.some((piece) => piece !== "{}")) {
      attributes.push(`armor:[${armorPieces.join(", ")}]`);
    }

    const holding = $("#itemSelect").val() || "";
    if (holding && isCardEnabled('card4')) attributes.push(`holding:"${holding}"`);

  // Skin ID (sin comillas, solo número) - si existe, agregar como skin:NNN
  const skin = $("#skinId").val() || "";
  if (skin && isCardEnabled('card10')) attributes.push(`skin:${skin}`);

  // Creeper cargado (charged) - toggle similar a loot
  const charged = $("#toggleCharged").find("i").hasClass("fa-toggle-on");
  if (charged && isCardEnabled('card18')) attributes.push("charged:1");

  // Toggle semantics: when the toggle is ON it means the user wants to DISABLE default drops.
  const toggleOn = $("#toggleLoot").find("i").hasClass("fa-toggle-on");
  if (toggleOn && isCardEnabled('card5')) attributes.push("defaultDrops:false");

  // Baby handling: support select with 'always' or 'time' + numeric input
  try {
    const babyMode = $("#babyMode").val();
    if (babyMode === "always") {
      attributes.push("baby:true");
    } else if (babyMode === "time") {
      const bt = $("#babyTimeInput").val();
      if (bt !== undefined && bt !== null && bt !== "" && !isNaN(bt)) {
        attributes.push(`baby:${parseInt(bt,10)}`);
      }
    }
  } catch(e) { /* ignore if elements missing */ }

  // Include drops built from Loot Tags saved items
    try {
    // Build drops using lootTagsStore.getCommandItems to respect cards_config.json
    try{
      const lootItems = (window.lootTagsStore && typeof window.lootTagsStore.getCommandItems === 'function') ? window.lootTagsStore.getCommandItems(mobType) : ((window.lootTagsStore && typeof window.lootTagsStore.getAll === 'function') ? window.lootTagsStore.getAll() : []);
      // Only include drops if the lootTags card is enabled
      if (isCardEnabled('card7') && lootItems && lootItems.length > 0) {
        const dropsArr = [];
        lootItems.forEach(item => {
          if (!item || !item.itemId) return;
          let part = `{item:{id:"${item.itemId}"}`;
          if (item.quantity !== undefined && item.quantity !== null && item.quantity !== "") part += `, quantity:${item.quantity}`;
          if (item.bonus !== undefined && item.bonus !== null && item.bonus !== "") part += `, bonus:${item.bonus}`;
          if (item.lootBonus !== undefined && item.lootBonus !== null && item.lootBonus !== "") part += `, lootBonus:${item.lootBonus}`;
          if (item.chance !== undefined && item.chance !== null && item.chance !== "") part += `, chance:${item.chance}`;
          if (item.variant) part += `, variant:"${item.variant}"`;
          if (item.isSheared !== undefined) part += `, sheared:${item.isSheared}`;
          if (item.isBaby !== undefined) part += `, isBaby:${item.isBaby}`;
          if (item.color) part += `, color:"${item.color}"`;
          if (item.onFire !== undefined) part += `, onFire:${item.onFire}`;
          if (item.size !== undefined && item.size !== null && item.size !== "") part += `, size:${item.size}`;
          // item-level special properties
          if (item.unbreakable !== undefined) part += `, unbreakable:${item.unbreakable ? 'true' : 'false'}`;
          if (item.enchantments !== undefined && Array.isArray(item.enchantments) && item.enchantments.length) {
            const ench = item.enchantments.map(e => '"' + String(e).replace(/"/g, '\\"') + '"').join(", ");
            part += `, enchantments:[${ench}]`;
          }
          if (item.name) part += `, name:"${String(item.name).replace(/"/g,'\\"')}"`;
          if (item.uses !== undefined && item.uses !== null && item.uses !== "") part += `, uses:${item.uses}`;
          if (item.canPlaceOn !== undefined && Array.isArray(item.canPlaceOn) && item.canPlaceOn.length) {
            const cp = item.canPlaceOn.map(v => '"' + String(v).replace(/"/g,'\\"') + '"').join(", ");
            part += `, canPlaceOn:[${cp}]`;
          }
          if (item.command) part += `, command:"${String(item.command).replace(/"/g,'\\"')}"`;
          if (item.anvilUses !== undefined) part += `, anvilUses:${item.anvilUses}`;
          part += `}`;
          dropsArr.push(part);
        });
        if (dropsArr.length > 0) attributes.push(`drops:[${dropsArr.join(", ")}]`);
      }
    }catch(e){ /* ignore mapping errors */ }
  } catch (e) { /* ignore if lootTags missing */ }

    if (attributes.length > 0) {
      command += ` {${attributes.join(", ")}}`;
    }
  }

  // Solo actualiza el contenido del comando, preservando el botón de guardado
  const $footerBoxBig = $(".footer-box-big");
  
  // Remover solo el contenido del comando, no el botón
  $footerBoxBig.contents().filter(function() {
    // Mantener el botón de guardado, eliminar solo texto y spans de comando
    return this.nodeType === 3 || (this.nodeType === 1 && !$(this).hasClass("footer-save-btn"));
  }).remove();
  
  // Agregar el comando después del botón
  $footerBoxBig.append(command);

  // Mostrar/ocultar el botón de guardar según si hay un mob seleccionado
  if (mobType) {
    $("#footerSaveButton").show();
  } else {
    $("#footerSaveButton").hide();
  }
}

$(document).ready(function () {
  // Eventos para campos de entrada
  $(
    "#mobType, #mobName, #mobHealth, #itemSelect, #mobAmount, #aggressivenessSelect, #skinId"
    ).on("input change", updateCommand);
  // Baby controls: mode select and numeric input should update command
  $("#babyMode").on("change", function(){
    try{
      if($(this).val() === 'time'){
        $("#babyRow").show();
        $("#babyTimeWrapper").show();
      } else {
        $("#babyRow").hide();
        $("#babyTimeWrapper").hide();
      }
    }catch(e){}
    updateCommand();
  });
  $("#babyTimeInput").on("input", function(){
    // allow only digits
    this.value = this.value.replace(/[^0-9]/g, '');
    updateCommand();
  });

  // Initialize baby UI state and status button
  try{
    function setBabyStatus(saved){
      const $btn = $("#babyStatusButton");
      const $i = $btn.find('i');
      if(saved){
        $i.removeClass('fa-times not-saved').addClass('fa-check saved');
        $btn.addClass('status-saved').removeClass('status-not-saved');
      } else {
        $i.removeClass('fa-check saved').addClass('fa-times not-saved');
        $btn.addClass('status-not-saved').removeClass('status-saved');
      }
    }

    // initial
    const curMode = $('#babyMode').val();
    if(curMode === 'time') { $('#babyRow').show(); $('#babyTimeWrapper').show(); } else { $('#babyRow').hide(); $('#babyTimeWrapper').hide(); }
    // set initial saved state
    if(curMode === 'always') setBabyStatus(true); else if(curMode === 'time') setBabyStatus($('#babyTimeInput').val() && $('#babyTimeInput').val().trim() !== ''); else setBabyStatus(false);

    // Update status when mode changes (keep existing binding but ensure row visibility)
    $('#babyMode').on('change.babyStatus', function(){
      const v = $(this).val();
      if(v === 'always'){
        setBabyStatus(true);
        $('#babyRow').hide();
      } else if(v === 'time'){
        // saved only if value present
        const val = $('#babyTimeInput').val();
        setBabyStatus(val && val.trim() !== '' ? true : false);
        $('#babyRow').show();
      } else {
        setBabyStatus(false);
        $('#babyRow').hide();
      }
    });

    // When typing time, set saved when value valid
    $('#babyTimeInput').on('input.babyStatus', function(){
      const v = $(this).val();
      setBabyStatus(v && v.trim() !== '');
    });
  }catch(e){}
  // Press animation for Save buttons: add .pressed on mousedown/touchstart
  try{
    $(document).on('mousedown touchstart', '.popup-button.save-button', function(e){
      $(this).addClass('pressed');
    });
    $(document).on('mouseup mouseleave touchend touchcancel', '.popup-button.save-button', function(e){
      $(this).removeClass('pressed');
    });
  }catch(e){}
  $("#helmetSelect, #chestplateSelect, #leggingsSelect, #bootsSelect").on(
    "change",
    updateCommand
  );
  $("#positionType, #posX, #posY").on("input change", updateCommand);
  $("#toggleLoot").on("click", updateCommand);
  // Toggle para creeper cargado
  $("#toggleCharged").on("click", function() {
    updateCommand();
  });

  // Eventos para guardar con Enter
  $("#mobName, #mobAmount, #posX, #posY, #mobHealth").on(
    "keypress",
    function (e) {
      if (e.key === "Enter" || e.keyCode === 13) {
        updateCommand();
      }
    }
  );

  // Actualizar comando inicial
  updateCommand();
});

$(document).ready(function () {
  

  // Agregar el evento click al botón Limpiar (usa la función reutilizable)
  $("#clearButton").on("click", function () {
    clearAllFormData(false);
    // Limpiar completamente la tienda de Loot Tags
    try {
      if (window.lootTagsStore && typeof window.lootTagsStore.clearForm === 'function') {
        window.lootTagsStore.clearForm(true);
      }
    } catch (e) {
      console.warn('Error clearing loot tags store:', e);
    }
  });

  // Si se recarga la página, mantener bloqueado
  // ...existing code...
});
$(document).ready(function () {
  $.getJSON(
    "data/items.json",
    function (data) {
      const sidebarItemSelect = $("#sidebarItemSelect");
      sidebarItemSelect.empty();
      // ensure externalTranslations map exists
      window.externalTranslations = window.externalTranslations || {};
      const currentSavedLang = localStorage.getItem('language') || 'es';
      // placeholder with i18n metadata
      sidebarItemSelect.append('<option value="" data-i18n="modals.lootTags.selectItemPlaceholder" data-default-text="Select item">' + t('modals.lootTags.selectItemPlaceholder','Select item') + '</option>');
      data.items.forEach((item) => {
        const key = `external.items.${item.value}`;
        // Ensure both `en` and `es` keys exist; use item.text as fallback for missing entries
        window.externalTranslations[key] = Object.assign({ en: item.text, es: item.text }, item.translations || {});
        const displayText = (window.externalTranslations[key] && window.externalTranslations[key][currentSavedLang]) ? window.externalTranslations[key][currentSavedLang] : item.text;
        const option = $("<option>")
          .val(item.value)
          .text(displayText)
          .attr("data-image", item.image)
          .attr('data-i18n', key)
          .attr('data-default-text', item.text);
        sidebarItemSelect.append(option);
      });
      // Función para mostrar solo texto en la selección
      function sidebarFormatSelection(option) {
        return option.text;
      }
      sidebarItemSelect.select2({
        templateResult: formatOption,
        templateSelection: sidebarFormatSelection,
        width: "100%",
        dropdownParent: $(".sidebar-right"),
        dropdownCssClass: "sidebar-small-select2",
        containerCssClass: "sidebar-small-select2",
      });
      sidebarItemSelect
        .next(".select2-container")
        .addClass("sidebar-small-select2");
      // Mostrar imagen en el botón add-item-header al seleccionar un item
      sidebarItemSelect.on("change", function () {
        const selected = $(this).find(":selected");
        const img = selected.data("image");
        const addBtn = $(".add-item-header");
        if (img) {
          addBtn.html(
            '<img src="' +
              img +
              '" alt="item" style="width:32px;height:32px;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.2);">'
          );
        } else {
          addBtn.html('<i class="fas fa-plus"></i>');
        }
        try{
          if(!window._lootTagsSuppressSidebarChange){
            // also apply item config when sidebar changes in the main sidebar context
            try{ if(window.lootTagsStore && typeof window.lootTagsStore.applyItemConfig === 'function') window.lootTagsStore.applyItemConfig($(this).val()); }catch(e){}
          }
        }catch(e){}
      });
      // Cuando se abra el dropdown de este select2 dentro del modal Loot Tags, expandir visual
      sidebarItemSelect.on('select2:open', function(){
        try{
          const $cont = $(this).next('.select2-container');
          $cont.addClass('sidebar-expanded');
        }catch(e){}
      });
      sidebarItemSelect.on('select2:close', function(){
        try{
          const $cont = $(this).next('.select2-container');
          $cont.removeClass('sidebar-expanded');
        }catch(e){}
      });
    }
  );
});

// Asegura que no se abran popups al hacer click en una card bloqueada
$(document).ready(function () {
  function handleCardClick(cardId, popupId) {
    $(`#${cardId}, #${cardId} + .card-icon`).off("click").on("click", function (e) {
      // Si la card está bloqueada, no abrir el popup
      if ($(this).hasClass("locked") || $(`#${cardId}`).hasClass("locked")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      $(`#${popupId}`).addClass("show");
    });
  }

  const cardMappings = {
    card1: "customPopup",
    card2: "amountPopup",
    card3: "positionPopup",
    card4: "itemPopup",
    card5: "lootPopup",
    card6: "armorPopup",
    card7: "lootTagsPopup",
    card9: "healthPopup",
    card10: "skinPopup",
    card11: "soundPopup",
    card12: "visibilityPopup",
    card13: "firePopup",
    card14: "lifetimePopup",
    card15: "babyPopup",
    card16: "colorPopup",
    card17: "sizePopup",
    card18: "nbtPopup",
    cardAggressiveness: "aggressivenessPopup"
  };

  Object.entries(cardMappings).forEach(([cardId, popupId]) => {
    handleCardClick(cardId, popupId);
  });

  // También previene la apertura de popups de ayuda en cards bloqueadas
  const helpPopupMappings = {
    card1: "helpPopup",
    card2: "amountHelpPopup",
    card3: "positionHelpPopup",
    card4: "itemHelpPopup",
    card5: "lootHelpPopup",
    card6: "armorHelpPopup",
    card7: "lootTagsHelpPopup",
    card9: "healthHelpPopup",
    card10: "skinHelpPopup",
    card11: "soundHelpPopup",
    card12: "visibilityHelpPopup",
    card13: "fireHelpPopup",
    card14: "lifetimeHelpPopup",
    card15: "babyHelpPopup",
    card16: "colorHelpPopup",
    card17: "sizeHelpPopup",
    card18: "nbtHelpPopup",
    cardAggressiveness: "aggressivenessHelpPopup"
  };

  Object.entries(helpPopupMappings).forEach(([cardId, helpPopupId]) => {
    $(`#${cardId} .question-icon`).off("click").on("click", function (e) {
      // Si la card está bloqueada, no abrir el popup de ayuda
      if ($(`#${cardId}`).hasClass("locked")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      e.stopPropagation();
      $(`#${helpPopupId}`).addClass("show");
    });
  });
});

// Mueve estas funciones fuera de $(document).ready para que sean globales
function lockSidebar() {
  $(".sidebar-right").addClass("locked");
  if ($(".sidebar-lock-overlay").length === 0) {
    $(".sidebar-right").prepend('<div class="sidebar-lock-overlay"><i class="fas fa-lock"></i></div>');
  }
}
function unlockSidebar() {
  $(".sidebar-right").removeClass("locked");
  $(".sidebar-lock-overlay").remove();
}

$(document).ready(function () {
  // Inicialmente bloqueado
  lockSidebar();

  // Manejar el toggle de Loot Tags (activar/desactivar sidebar-right)
  $("#toggleLootTags").on("click", function () {
    const icon = $(this).find("i");
    icon.toggleClass("fa-toggle-off fa-toggle-on");
    const isActive = icon.hasClass("fa-toggle-on");
    const enabledText = t('common.enabled', 'Activado');
    const disabledText = t('common.disabled', 'Desactivado');
    $(this).find("span").text(isActive ? enabledText : disabledText);
    if (isActive) {
      unlockSidebar();
    } else {
      lockSidebar();
    }
  });

  // Si se limpia el formulario, bloquear el sidebar
  $("#clearButton").on("click", function () {
    // Limpiar inputs normales
    $('input[type="text"], input[type="number"], input[type="color"]').val(
      ""
    );

    // Limpiar y resetear todos los select2 y selects normales
    $("select").each(function () {
      $(this).val("").trigger("change");
    });

    // Resetear positionType y deshabilitar inputs de coordenadas
    $("#positionType").val("").trigger("change");
    $("#posX, #posY").prop("disabled", true);
  $("#labelPosX").text(t('modals.position.coordX', 'Coordenada X:'));
  $("#labelPosY").text(t('modals.position.coordY', 'Coordenada Y:'));

    // Cerrar todas las casillas extendidas/popups
    $(".popup-overlay").removeClass("show");

    // Resetear todos los toggles y establecer estado
    $(".popup-toggle-button").each(function () {
      const icon = $(this).find("i");
      const text = $(this).find("span");
      const id = $(this).attr("id");

      icon.removeClass("fa-toggle-on").addClass("fa-toggle-off");

      const enabledText = t('common.enabled', 'Activado');
      const disabledText = t('common.disabled', 'Desactivado');
      const yesText = t('common.yes', 'Sí');
      const noText = t('common.no', 'No');

      if (id === "toggleLoot" || id === "toggleLootTags") {
        text.text(disabledText);
      } else {
        text.text(noText);
      }
    });

    // Ocultar específicamente las opciones de Loot Tags
    $("#lootTagsOptions").hide();

    // Resetear el mobImage
    $("#mobImage").empty().removeClass("transparent");

    // Resetear estados de botones (usar clases CSS centralizadas)
    $(".popup-button")
      .addClass('status-button status-not-saved')
      .removeClass('status-saved')
      .find("i")
      .removeClass("fa-check saved")
      .addClass("fa-times not-saved");

    // Bloquear las cards
    lockAllCards();

    // Ir a la primera página de cards
    changePage(1);

    // Actualizar el comando
    updateCommand();

    // Bloquear el sidebar
    lockSidebar();

    // Limpiar completamente la tienda de Loot Tags
    try {
      if (window.lootTagsStore && typeof window.lootTagsStore.clearForm === 'function') {
        window.lootTagsStore.clearForm(true);
      }
    } catch (e) {
      console.warn('Error clearing loot tags store:', e);
    }
  });

  // Si se recarga la página, mantener bloqueado
  // ...existing code...
});

$(document).ready(function () {
  // Guardados modal: abrir/cerrar (desde menú) — mostrar SOLO la lista de guardados
  $("#savedButton").on("click", function (e) {
    e.stopPropagation();
    // Asegurar que el formulario de "crear guardado" esté oculto
    $(".saved-entry, .saved-modal-actions").hide();
    // Mostrar y renderizar la lista de guardados
    $(".saved-modal-list").show();
    renderSavedCommands();
    $("#savedListModal").addClass("show");
  });

  // Cerrar modal al hacer click en el fondo o en el botón de cerrar
  $("#savedListModal .popup-close, #savedListModal").on("click", function (e) {
    if (e.target === this) {
      // Restaurar estado por defecto: ocultar lista
      $(".saved-modal-list").hide();
      $("#savedListModal").removeClass("show");
    }
  });

  // Close handler for create modal (click background or close button)
  $("#savedCreateModal .popup-close, #savedCreateModal").on("click", function (e) {
    if (e.target === this) {
      $("#savedCreateModal").removeClass("show");
    }
  });

  // Prevenir cierre al hacer click dentro de la ventana del modal
  $("#savedListModal .saved-modal-window, #savedCreateModal .saved-modal-window, .saved-modal-window").on("click", function (e) {
    e.stopPropagation();
  });
});

// Handlers para el modal de Guardados activado desde el botón en el footer
$(document).ready(function () {
  // Abrir modal de guardado mínimo (imagen + nombre + botones) al pulsar bookmark
  $("#footerSaveButton").on("click", function (e) {
    e.stopPropagation();

    const $btn = $(this);

    // Si ya está marcado como 'saved', eliminar sin pedir confirmación
    if ($btn.hasClass("saved")) {
      const mobType = $("#mobType").val();
      const command = getCurrentCommandText();
      let saved = getSavedCommands();
      saved = saved.filter(
        (item) => !(item.command === command && item.mobType === mobType)
      );
      setSavedCommands(saved);
      $btn.removeClass("saved");
      renderSavedCommands();
      return;
    }

    // Si no está guardado: abrir modal para que el usuario escriba el nombre
    const mobImgSrc = $("#mobImage img").attr("src");
    const mobNameVal = $("#mobName").val() || $("#mobType option:selected").text() || "";

    const $savedMobImage = $("#savedMobImage");
    $savedMobImage.empty();
    if (mobImgSrc) {
      $savedMobImage.html(`<img src="${mobImgSrc}" alt="${mobNameVal}" style="width:100%;height:100%;object-fit:cover;">`);
    }

    // Prellenar nombre
    $("#savedCommandName").val(mobNameVal);

  // Mostrar modal (create)
  $("#savedCreateModal").addClass("show");
    $("#savedCommandName").focus();
    // Mostrar el formulario de creación y ocultar la lista cuando abrimos el modal desde el bookmark
    $(".saved-entry, .saved-modal-actions").show();
    $(".saved-modal-list").hide();
  });

  // Confirmar guardado: usar saveCurrentCommand() después de prellenar el nombre
  $("#confirmSaveButton").on("click", function () {
    console.debug('confirmSaveButton clicked, attempting save...');
    const name = $("#savedCommandName").val().trim();
    if (!name) {
      $("#savedCommandName").focus();
      return;
    }

    // Inyectar el nombre en el formulario (card1) para que saveCurrentCommand lo incluya
    $("#mobName").val(name).trigger("input");

      // Validate mobType is selected before attempting to save
      const mobTypeVal = $("#mobType").val();
      if (!mobTypeVal) {
        console.debug('No mobType selected; aborting save and focusing selector.');
        try{
          if(typeof notify === 'function') notify({ type: 'warning', text: t ? t('modals.savedModal.selectMob','Selecciona un mob antes de guardar') : 'Selecciona un mob antes de guardar', timeout: 2200 });
          else alert('Selecciona un mob antes de guardar');
        }catch(e){ }
        $("#mobType").focus();
        return;
      }

      // Intentar guardar usando la función central
      const prevSavedState = $("#footerSaveButton").hasClass("saved");
      const ok = saveCurrentCommand();
    // Si el guardado fue exitoso, marcar y actualizar la lista; si falló (ej. duplicado),
    // restaurar el estado visual previo para evitar cambios inesperados.
    if (ok) {
      $("#footerSaveButton").addClass("saved");
      renderSavedCommands();
      $("#savedCreateModal").removeClass("show");
    } else {
      console.debug('saveCurrentCommand returned false');
      if (prevSavedState) {
        $("#footerSaveButton").addClass("saved");
      } else {
        $("#footerSaveButton").removeClass("saved");
      }
    }
  });

  // Cancelar guardado
  $("#cancelSaveButton").on("click", function () {
    $("#savedCreateModal").removeClass("show");
  });
});

// Skin ID & Charged (Creeper) handlers
$(document).ready(function() {
  // Skin popup open handled globally; aquí solo lógica del input
  let isSkinSaved = false;
  function updateSkinStatus(saved) {
    const statusButton = $("#skinStatusButton");
    const statusIcon = statusButton.find("i");
    statusIcon.removeClass("fa-times fa-check not-saved saved").addClass(saved ? "fa-check saved" : "fa-times not-saved");
    statusButton.addClass('status-button').removeClass('status-saved status-not-saved').addClass(saved ? 'status-saved' : 'status-not-saved');
    isSkinSaved = saved;
  }

  $("#skinId").on("input", function() {
    // already sanitized via HTML oninput, double-check
    this.value = this.value.replace(/[^0-9]/g, '');
    const val = $(this).val().trim();
    updateSkinStatus(!!val);
    updateCommand();
  });

  // Charged toggle behavior
  $("#toggleCharged").on("click", function() {
    const $icon = $(this).find("i");
    const $span = $(this).find("span");
    $icon.toggleClass("fa-toggle-off fa-toggle-on");
    const isOn = $icon.hasClass("fa-toggle-on");
    const enabledText = t('common.enabled', 'Activado');
    const disabledText = t('common.disabled', 'Desactivado');
    $span.text(isOn ? enabledText : disabledText);

    // actualizar status button visual
    const statusButton = $("#chargedStatusButton");
    const statusIcon = statusButton.find("i");
    statusIcon.removeClass("fa-times fa-check not-saved saved").addClass(isOn ? "fa-check saved" : "fa-times not-saved");
    statusButton.addClass('status-button').removeClass('status-saved status-not-saved').addClass(isOn ? 'status-saved' : 'status-not-saved');

    updateCommand();
  });

  // Reset states when opening popups
  $("#skinPopup").on("show", function(){ updateSkinStatus(false); $("#skinId").val(""); });
  $("#chargedPopup").on("show", function(){ $("#toggleCharged i").removeClass("fa-toggle-on").addClass("fa-toggle-off"); $("#toggleCharged span").text(t('common.disabled','Desactivado')); $("#chargedStatusButton i").removeClass("fa-check saved").addClass("fa-times not-saved"); });
});



// Utilidad para obtener todos los datos relevantes del formulario
function getCurrentFormData() {
  // Puedes agregar más campos si lo deseas
  return {
    mobType: $("#mobType").val(),
    mobName: $("#mobName").val(),
    mobAmount: $("#mobAmount").val(),
    positionType: $("#positionType").val(),
    posX: $("#posX").val(),
    posY: $("#posY").val(),
    mobHealth: $("#mobHealth").val(),
    itemSelect: $("#itemSelect").val(),
    itemAmount: $("#itemAmount").val(),
    itemData: $("#itemData").val(),
    helmetSelect: $("#helmetSelect").val(),
    chestplateSelect: $("#chestplateSelect").val(),
    leggingsSelect: $("#leggingsSelect").val(),
    bootsSelect: $("#bootsSelect").val(),
    aggressivenessSelect: $("#aggressivenessSelect").val(),
    // Expose the effective defaultDrops value (true = default drops active).
    // When the toggle is ON the user requested to DISABLE defaults, so invert here.
    lootEnabled: !$("#toggleLoot").find("i").hasClass("fa-toggle-on"),
    // Puedes agregar más campos aquí si lo necesitas
    command: getCurrentCommandText()
  };
}

// Utilidad para obtener el texto del comando generado
function getCurrentCommandText() {
  // Obtener todo el texto del footer-box-big excluyendo el botón
  const $footerBoxBig = $(".footer-box-big");
  let commandText = "";
  
  $footerBoxBig.contents().each(function() {
    if (this.nodeType === 3) { // Nodo de texto
      commandText += $(this).text();
    } else if (this.nodeType === 1 && !$(this).hasClass("footer-save-btn")) { // Elemento HTML que no sea el botón
      commandText += $(this).text();
    }
  });
  
  return commandText.trim();
}

// Utilidad para obtener todos los datos relevantes del formulario, agrupados por card
function getCurrentFormDataByCard() {
  const data = {};
  
  // Card 1 - Nombre
  const mobName = $("#mobName").val();
  if (mobName) {
    data.card1 = { mobName: mobName };
  }
  
  // Card 2 - Cantidad
  const mobAmount = $("#mobAmount").val();
  if (mobAmount) {
    data.card2 = { mobAmount: mobAmount };
  }
  
  // Card 3 - Posición
  const positionType = $("#positionType").val();
  const posX = $("#posX").val();
  const posY = $("#posY").val();
  if (positionType || posX || posY) {
    data.card3 = {
      positionType: positionType,
      posX: posX,
      posY: posY
    };
  }
  
    // Card 4 - Item equipado y sus datos
  const itemSelect = $("#itemSelect").val();
  const itemAmount = $("#itemAmount").val();
  const itemData = $("#itemData").val();
  
  if (itemSelect) {
    data.card4 = { 
      itemSelect: itemSelect,
      itemAmount: itemAmount,
      itemData: itemData
    };
    console.log("Guardando datos del item:", data.card4);
  }  // Card 5 - Loot predeterminado
  const lootEnabledVal = !$("#toggleLoot").find("i").hasClass("fa-toggle-on");
  if (lootEnabledVal) {
    data.card5 = { lootEnabled: lootEnabledVal };
  }
  
  // Card 6 - Armadura
  const helmetSelect = $("#helmetSelect").val();
  const chestplateSelect = $("#chestplateSelect").val();
  const leggingsSelect = $("#leggingsSelect").val();
  const bootsSelect = $("#bootsSelect").val();
  if (helmetSelect || chestplateSelect || leggingsSelect || bootsSelect) {
    data.card6 = {
      helmetSelect: helmetSelect,
      chestplateSelect: chestplateSelect,
      leggingsSelect: leggingsSelect,
      bootsSelect: bootsSelect
    };
  }
  
  // Card 9 - Vida
  const mobHealth = $("#mobHealth").val();
  if (mobHealth) {
    data.card9 = { mobHealth: mobHealth };
  }
  
  // Card Agresividad
  const aggressivenessSelect = $("#aggressivenessSelect").val();
  if (aggressivenessSelect) {
    data.cardAggressiveness = { aggressivenessSelect: aggressivenessSelect };
  }

  // Card 7 - Loot Tags (capture full stored items if present)
  try{
    if(window.lootTagsStore && typeof window.lootTagsStore.getAll === 'function'){
      const lt = window.lootTagsStore.getAll();
      if(lt && lt.length){ data.card7 = { items: lt }; }
    }
  }catch(e){ }

  // Card 15 - Baby settings
  try{
    const babyMode = $("#babyMode").val();
    const babyTime = $("#babyTimeInput").val();
    if(babyMode || (babyTime && babyTime !== '')){
      data.card15 = { babyMode: babyMode, babyTime: babyTime };
    }
  }catch(e){}

  // Card 18 - Charged toggle
  try{
    const charged = $("#toggleCharged").find('i').hasClass('fa-toggle-on');
    if(charged){ data.card18 = { charged: true }; }
  }catch(e){}
  
  return data;
}

// Guardar y cargar desde localStorage
function getSavedCommands() {
  return JSON.parse(localStorage.getItem("mbsummon_saved") || "[]");
}
function setSavedCommands(arr) {
  localStorage.setItem("mbsummon_saved", JSON.stringify(arr));
}

// Nueva función para guardar el comando, guardando cada card por separado
function saveCurrentCommand() {
  const mobType = $("#mobType").val();
  const command = getCurrentCommandText();
  const cards = getCurrentFormDataByCard();
  let saved = getSavedCommands();

  console.log("Iniciando proceso de guardado...");

  if (!mobType || !command) {
    console.log("No se puede guardar: falta mobType o comando");
    return false;
  }

  // Validar datos del item si existe
  if (cards.card4) {
    const { itemSelect, itemAmount, itemData } = cards.card4;
    console.log("Validando datos del item:", cards.card4);
    
    if (itemSelect && (!itemAmount || !itemData)) {
      console.log("Faltan datos del item:", {
        itemSelect,
        itemAmount: itemAmount || "falta cantidad",
        itemData: itemData || "faltan datos"
      });
      return false;
    }
  }

  // Evita duplicados por mobType y comando
  const exists = saved.some(
    (item) => item.mobType === mobType && item.command === command
  );
  
  if (!exists) {
    const newSave = {
      mobType: mobType,
      command: command,
      cards: cards,
      timestamp: new Date().toISOString()
    };
    
    saved.push(newSave);
    setSavedCommands(saved);
    console.log("Comando guardado exitosamente:", newSave);
    // Mostrar un mensaje de éxito via notifications
    if (typeof notifySuccess === 'function') {
      notifySuccess({ key: 'notifications.saved_success', timeout: 2500 });
    } else if (typeof notify === 'function') {
      notify({ type: 'success', text: t('notifications.saved_success','Comando guardado'), timeout: 2500 });
    } 
    return true;
  } else {
    // notify duplicate
    if (typeof notify === 'function') {
      notify({ type: 'info', text: t('notifications.save_duplicate','Este comando ya está guardado'), timeout: 2200 });
    } 
    console.log("El comando ya existe en los guardados");
    return false;
  }
}

// Editar: cargar todos los datos guardados de las cards al formulario

// Renderizar la lista de guardados en el modal (muestra datos de las cards)
function renderSavedCommands() {
  const saved = getSavedCommands();
  // Render into the dedicated list container so we don't remove the "save current" input UI
  let $listContainer = $(".saved-modal-list");
  if (!$listContainer.length) {
    $listContainer = $(".saved-modal-content");
  }
  $listContainer.empty();
  if (saved.length === 0) {
    const emptyMsg = t('modals.savedModal.emptyMessage', 'No hay guardados aún.');
    const $p = $('<p>').attr('data-i18n', 'modals.savedModal.emptyMessage').text(emptyMsg);
    $listContainer.append($p);
    return;
  }
  const $list = $("<ul>").css({padding:0, margin:0, listStyle:"none"});
  saved.forEach((item, idx) => {
    const $li = $("<li>")
      .addClass("saved-list-item")
      .css({
        margin: "0 0 15px 0",
        padding: "12px 16px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px"
      });

    // Imagen del mob
    let mobImgSrc = "";
    if (item.mobType) {
      const $opt = $('#mobType option[value="' + item.mobType + '"]');
      mobImgSrc = $opt.data("image") || "";
    }
    const $img = mobImgSrc
      ? $("<img>")
          .attr("src", mobImgSrc)
          .attr("alt", item.mobType)
          .addClass('saved-thumb')
          .css({
            width: "38px",
            height: "38px",
            borderRadius: "8px",
            marginRight: "12px",
            objectFit: "cover",
            boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
          })
      : $("<span>").addClass('saved-thumb').css({width:"38px",height:"38px",display:"inline-block"});

    // Nombre mostrado (sacar de card1 si existe, sino usar mobType texto)
    let displayName = "";
    if (item.cards && item.cards.card1 && item.cards.card1.mobName) {
      displayName = item.cards.card1.mobName;
    } else if (item.mobType) {
      const $opt = $('#mobType option[value="' + item.mobType + '"]');
      displayName = $opt.length ? $opt.text() : item.mobType;
    } else {
      displayName = "Guardado";
    }

    // Let CSS control text color so dark theme can apply. Keep layout rules
    // here but avoid hard-coding colors.
    const $nameSpan = $("<div>")
      .addClass('saved-name')
      .css({fontSize: "1rem", fontWeight: 700})
      .text(displayName);

  // Botones
  const $btns = $("<div>")
    .addClass('saved-btns')
    .css({display:"flex", gap:"18px", alignItems:"center", flex: '0 0 auto'});

    // Copiar
    const $copy = $("<button>")
      .html('<i class="fas fa-copy"></i>')
      .css({
        background: "#7dbbff",
        color: "#166534",
        border: "none",
        borderRadius: "8px",
  padding: "11px 15px",
        cursor: "pointer"
      })
  // set data-i18n so loadLanguage() can translate tooltip titles later
  .attr('data-i18n', 'modals.savedModal.copyTooltip')
  .attr('data-i18n-attr', 'title')
  .attr("title", t('modals.savedModal.copyTooltip', 'Copiar comando'))
      .on("click", function(e) {
        e.stopPropagation();
            copyTextToClipboard(item.command);
            // notify copy success for saved modal
            if (typeof notifySuccess === 'function') {
              notifySuccess({ key: 'notifications.copied', timeout: 1800 });
            } else if (typeof notify === 'function') {
              notify({ type: 'success', key: 'notifications.copied', timeout: 1800 });
            }
      });

  $copy.addClass('saved-action-btn saved-copy-btn');
    $copy.on('mousedown touchstart', function(){ $(this).addClass('pressed'); });
    $copy.on('mouseup mouseleave touchend', function(){ $(this).removeClass('pressed'); });

    // Editar
    const $edit = $("<button>")
      .html('<i class="fas fa-edit"></i>')
      .css({
        background: "#facc15",
        color: "#7c5700",
        border: "none",
        borderRadius: "8px",
  padding: "11px 15px",
        cursor: "pointer"
      })
  .attr('data-i18n', 'modals.savedModal.editTooltip')
  .attr('data-i18n-attr', 'title')
  .attr("title", t('modals.savedModal.editTooltip', 'Editar este guardado'))
      .on("click", function(e) {
        e.stopPropagation();
        // Cerrar el modal de lista y cerrar el menú en móvil antes de cargar
        $("#savedListModal").removeClass("show");
        $(".menu").removeClass("show-buttons");
        loadSavedCommandToForm(item); // <-- Esta es la función correcta
        // (no notification shown for entering edit mode to avoid redundancy)
      });

  $edit.addClass('saved-action-btn saved-edit-btn');
    $edit.on('mousedown touchstart', function(){ $(this).addClass('pressed'); });
    $edit.on('mouseup mouseleave touchend', function(){ $(this).removeClass('pressed'); });

    // Eliminar
    const $del = $("<button>")
      .html('<i class="fas fa-trash"></i>')
      .css({
        background: "#fca5a5",
        color: "#991b1b",
        border: "none",
        borderRadius: "8px",
  padding: "11px 15px",
        cursor: "pointer"
      })
  .attr('data-i18n', 'modals.savedModal.deleteTooltip')
  .attr('data-i18n-attr', 'title')
  .attr("title", t('modals.savedModal.deleteTooltip', 'Eliminar'))
      .on("click", function(e) {
        e.stopPropagation();
        removeSavedCommand(idx);
      });

  $del.addClass('saved-action-btn saved-delete-btn');
    $del.on('mousedown touchstart', function(){ $(this).addClass('pressed'); });
    $del.on('mouseup mouseleave touchend', function(){ $(this).removeClass('pressed'); });

    $btns.append($copy, $edit, $del);

    // Append only image, name and buttons (no datos detallados)
  $li.append($img, $nameSpan, $btns);

  // small press animation on item itself
  $li.on('mousedown touchstart', function(){ $(this).addClass('pressed'); });
  $li.on('mouseup mouseleave touchend', function(){ $(this).removeClass('pressed'); });
    $list.append($li);
  });
  $listContainer.append($list);
}

// Copiar texto al portapapeles
function copyTextToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    // Fallback para navegadores antiguos
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

// Cargar los datos guardados en el formulario y actualizar el comando
async function loadSavedCommandToForm(item) {
  console.log("Cargando datos guardados:", item);
  
  // Primero limpiar todo el formulario para dejar un estado limpio
  // Suprimir la notificación de 'cleared' aquí porque mostraremos una notificación
  // específica de 'editing' después de cargar el guardado.
  if (typeof clearAllFormData === 'function') clearAllFormData(false, true);
  // Ensure loot toggle/status is reset before loading saved data to avoid persistence bugs
  try { setLootState(false); } catch (err) { /* ignore */ }

  // Luego cargar el mobType y actualizar imagen/bloqueos
  $("#mobType").val(item.mobType || "").trigger("change");
  
  // Asegurar que la imagen y los bloqueos se actualicen
  const selected = $("#mobType").find(":selected");
  const imageUrl = selected.data("image");
  const mobImage = $("#mobImage");
  
  if (imageUrl) {
    mobImage.html(`<img src="${imageUrl}" alt="${selected.text()}">`);
    mobImage.addClass("transparent");
  } else {
    mobImage.empty();
    mobImage.removeClass("transparent");
  }
  
  // Cargar configuración de bloqueo para el mob y esperar a que se aplique
  await loadMobLockConfig(item.mobType);
  
  // Cargar los datos inmediatamente después de que se desbloqueen las cards
  const cards = item.cards || {};
  
  // Función para cargar datos con reintentos si es necesario
  function loadCardData() {
    // Card 1 - Nombre
    if (cards.card1 && cards.card1.mobName) {
      $("#mobName").val(cards.card1.mobName).trigger("input");
      console.log("Cargado nombre:", cards.card1.mobName);
    }
    
    // Card 2 - Cantidad
    if (cards.card2 && cards.card2.mobAmount) {
      $("#mobAmount").val(cards.card2.mobAmount).trigger("input");
      console.log("Cargada cantidad:", cards.card2.mobAmount);
    }
    
    // Card 3 - Posición
    if (cards.card3) {
      if (cards.card3.positionType) {
        $("#positionType").val(cards.card3.positionType).trigger("change");
        console.log("Cargado tipo de posición:", cards.card3.positionType);
        
        // Cargar coordenadas inmediatamente después del tipo
        if (cards.card3.posX) {
          $("#posX").val(cards.card3.posX).trigger("input");
          console.log("Cargada posX:", cards.card3.posX);
        }
        if (cards.card3.posY) {
          $("#posY").val(cards.card3.posY).trigger("input");
          console.log("Cargada posY:", cards.card3.posY);
        }
      }
    }
    
    // Card 4 - Item equipado y datos
    if (cards.card4) {
      console.log("Cargando datos del item:", cards.card4);
      
      if (cards.card4.itemSelect) {
        $("#itemSelect").val(cards.card4.itemSelect).trigger("change");
        console.log("Item seleccionado:", cards.card4.itemSelect);
      }
      
      if (cards.card4.itemAmount) {
        $("#itemAmount").val(cards.card4.itemAmount).trigger("input");
        console.log("Cantidad del item:", cards.card4.itemAmount);
      }
      
      if (cards.card4.itemData) {
        $("#itemData").val(cards.card4.itemData).trigger("input");
        console.log("Datos del item:", cards.card4.itemData);
      }
    }
    
    // Card 5 - Loot predeterminado
    if (cards.card5 && typeof cards.card5.lootEnabled !== 'undefined') {
      const loot = !!cards.card5.lootEnabled;
      // Set the toggle state directly rather than triggering clicks to avoid side effects
      const $toggle = $("#toggleLoot");
      const $icon = $toggle.find("i");
      const $span = $toggle.find("span");

      if (loot) {
        $icon.removeClass("fa-toggle-off").addClass("fa-toggle-on");
        $span.text(t('common.enabled', 'Activado'));
        console.log("Activado loot (load)");
      } else {
        $icon.removeClass("fa-toggle-on").addClass("fa-toggle-off");
        $span.text(t('common.disabled', 'Desactivado'));
        console.log("Desactivado loot (load)");
      }

      // Update the small status button visual to match the loaded value
      if (typeof updateLootStatus === 'function') updateLootStatus(loot);
    }
    
    // Card 6 - Armadura
    if (cards.card6) {
      if (cards.card6.helmetSelect) {
        $("#helmetSelect").val(cards.card6.helmetSelect).trigger("change");
        console.log("Cargado casco:", cards.card6.helmetSelect);
      }
      if (cards.card6.chestplateSelect) {
        $("#chestplateSelect").val(cards.card6.chestplateSelect).trigger("change");
        console.log("Cargada pechera:", cards.card6.chestplateSelect);
      }
      if (cards.card6.leggingsSelect) {
        $("#leggingsSelect").val(cards.card6.leggingsSelect).trigger("change");
        console.log("Cargadas grebas:", cards.card6.leggingsSelect);
      }
      if (cards.card6.bootsSelect) {
        $("#bootsSelect").val(cards.card6.bootsSelect).trigger("change");
        console.log("Cargadas botas:", cards.card6.bootsSelect);
      }
    }
    
    // Card 7 - Loot Tags
    if (cards.card7 && Array.isArray(cards.card7.items)) {
      try{
        if(window.lootTagsStore && typeof window.lootTagsStore.clearAll === 'function'){
          window.lootTagsStore.clearAll();
          cards.card7.items.forEach(it => {
            try{ if(typeof window.lootTagsStore.add === 'function') window.lootTagsStore.add(it); }catch(e){}
          });
          console.log('Cargadas loot tags:', cards.card7.items.length);
        }
      }catch(e){ console.warn('Error loading loot tags', e); }
    }
    
    // Card 9 - Vida
    if (cards.card9 && cards.card9.mobHealth) {
      $("#mobHealth").val(cards.card9.mobHealth).trigger("input");
      console.log("Cargada vida:", cards.card9.mobHealth);
    }

    // Card 15 - Baby
    if (cards.card15) {
      try{
        if(cards.card15.babyMode !== undefined){ $("#babyMode").val(cards.card15.babyMode).trigger('change'); console.log('Cargado babyMode:', cards.card15.babyMode); }
        if(cards.card15.babyTime !== undefined && $('#babyTimeInput').length){ $("#babyTimeInput").val(cards.card15.babyTime).trigger('input'); console.log('Cargado babyTime:', cards.card15.babyTime); }
      }catch(e){ console.warn('Error loading baby settings', e); }
    }

    // Card 18 - Charged (Creeper)
    if (cards.card18 && cards.card18.charged) {
      try{
        const $t = $("#toggleCharged");
        const $i = $t.find('i');
        const isOn = $i.hasClass('fa-toggle-on');
        if(!isOn){ $t.trigger('click'); }
        console.log('Cargado charged:', true);
      }catch(e){ console.warn('Error loading charged state', e); }
    }
    
    // Card Agresividad
    if (cards.cardAggressiveness && cards.cardAggressiveness.aggressivenessSelect) {
      $("#aggressivenessSelect").val(cards.cardAggressiveness.aggressivenessSelect).trigger("change");
      console.log("Cargada agresividad:", cards.cardAggressiveness.aggressivenessSelect);
    }
    
    // Actualizar comando inmediatamente
    if (typeof updateCommand === "function") {
      updateCommand();
    }
    
    // Actualizar estado del botón de guardado
    if (typeof isCurrentSaved === "function") {
      if (isCurrentSaved()) {
        $("#footerSaveButton").addClass("saved");
      } else {
        $("#footerSaveButton").removeClass("saved");
      }
    }
  }
  
  // Ejecutar la carga de datos inmediatamente
  loadCardData();
  
  console.log("Datos cargados completamente");
  // Ensure footer save button remains in 'saved' visual state when loading a saved command
  try{ $('#footerSaveButton').addClass('saved').data('locked-saved', true); }catch(e){}
}

// Eliminar guardado por índice
function removeSavedCommand(idx) {
  let arr = getSavedCommands();
  arr.splice(idx, 1);
  setSavedCommands(arr);
  renderSavedCommands();
  // Si el guardado eliminado es el actual, desmarcar el bookmark
  const current = getCurrentFormData();
  if (!isCurrentSaved()) {
    $("#footerSaveButton").removeClass("saved");
  }
  // notify deletion
  if (typeof notify === 'function') {
    // Use generic saved-deleted notification for saved commands
    notify({ type: 'success', key: 'notifications.deleted', timeout: 2000 });
  }
}

// Verifica si el formulario current ya está guardado (por comando y mobType)
function isCurrentSaved() {
  const current = getCurrentFormData();
  const saved = getSavedCommands();
  
  if (!current.mobType || !current.command) {
    return false;
  }
  
  const exists = saved.some(
    (item) =>
      item.command === current.command &&
      item.mobType === current.mobType
  );
  
  return exists;
}

// Sistema de guardado principal - Manejo de eventos
$(document).ready(function () {
  // Mostrar/ocultar el botón de guardado según selección de mob
  function toggleFooterSaveButton() {
    if ($("#mobType").val()) {
      $("#footerSaveButton").show();
      // Si el actual está guardado, marca el bookmark
      // If loading a saved command just now, keep locked saved state
      if($('#footerSaveButton').data('locked-saved')){ $('#footerSaveButton').addClass('saved'); return; }
      if (isCurrentSaved()) { $("#footerSaveButton").addClass("saved"); } else { $("#footerSaveButton").removeClass("saved"); }
    } else {
      $("#footerSaveButton").hide();
    }
  }

  // Al cambiar el mobType, mostrar/ocultar el botón
  $("#mobType").on("change", function() {
    toggleFooterSaveButton();
  });

  // También al cargar la página, por si ya hay uno seleccionado
  toggleFooterSaveButton();

  // Nota: el comportamiento de click en #footerSaveButton se maneja en otro bloque

  // Renderizar guardados al abrir el modal (desde el menú)
  $("#savedButton").on("click", function () {
    // Asegurar que el formulario de creación esté oculto y mostrar la lista
    $(".saved-entry, .saved-modal-actions").hide();
    $(".saved-modal-list").show();
    renderSavedCommands();
    // Asegurar que el modal esté abierto
    $("#savedListModal").addClass("show");
  });

  // Si cambian los campos relevantes, actualizar el estado del bookmark
  $(
    "#mobType, #mobName, #mobHealth, #itemSelect, #mobAmount, #aggressivenessSelect, #helmetSelect, #chestplateSelect, #leggingsSelect, #bootsSelect, #positionType, #posX, #posY, #toggleLoot"
  ).on("input change", function () {
    // Pequeño delay para que se actualice el comando primero
    // If user modifies something after loading a saved command, remove locked state
    try{ $('#footerSaveButton').removeData('locked-saved'); }catch(e){}
    setTimeout(function() { toggleFooterSaveButton(); }, 50);
  });

  // Al limpiar, actualizar estado del bookmark
  $("#clearButton").on("click", function () {
    setTimeout(function() {
      toggleFooterSaveButton();
      // Limpiar completamente la tienda de Loot Tags
      try {
        if (window.lootTagsStore && typeof window.lootTagsStore.clearForm === 'function') {
          window.lootTagsStore.clearForm(true);
        }
      } catch (e) {
        console.warn('Error clearing loot tags store:', e);
      }
    }, 100);
  });
  
  // Inicialización del sistema de guardado
  console.log("Sistema de guardado inicializado");
  console.log("Guardados existentes:", getSavedCommands().length);
});

// Ensure Select2 inside popups don't overflow adjacent status buttons by
// dynamically calculating and setting a max-width for the Select2 container
// inside each .popup-input-wrapper. Runs on ready, resize and when a Select2 opens.
$(document).ready(function() {
  function adjustSelect2InWrapper($wrapper) {
    if (!$wrapper || !$wrapper.length) return;
    // prefer the select2 container inside the wrapper, fallback to next sibling of select
    let $select2 = $wrapper.find('.select2-container').first();
    if (!$select2.length) {
      const $sel = $wrapper.find('select').first();
      if ($sel.length && $sel.data('select2')) $select2 = $sel.next('.select2-container');
    }

    // find the nearest popup-button (status) to reserve space for
    let $statusBtn = $wrapper.siblings('.popup-button').first();
    if (!$statusBtn.length) $statusBtn = $wrapper.parent().find('.popup-button').first();

    if (!$select2.length) return;

    const wrapperWidth = $wrapper.width() || 0;
    const btnWidth = $statusBtn.length ? $statusBtn.outerWidth(true) : 0;
    const reserve = btnWidth + 12; // small gap
    const max = Math.max(40, wrapperWidth - reserve);

    $select2.css('max-width', max + 'px');
    $select2.find('.select2-selection__rendered').css({
      overflow: 'hidden',
      'text-overflow': 'ellipsis',
      'white-space': 'nowrap',
      'max-width': '100%'
    });
  }

  function adjustAllPopupSelects() {
    $('.popup-input-wrapper').each(function() {
      adjustSelect2InWrapper($(this));
    });
  }

  // debounce helper
  function debounce(fn, wait) {
    let t;
    return function() {
      const args = arguments;
      const ctx = this;
      clearTimeout(t);
      t = setTimeout(function() { fn.apply(ctx, args); }, wait);
    };
  }

  // Run on load
  setTimeout(adjustAllPopupSelects, 80);

  // Adjust on window resize
  $(window).on('resize', debounce(adjustAllPopupSelects, 120));

  // When any Select2 opens, adjust its wrapper (some Select2 instances render after open,
  // so schedule a short retry)
  $(document).on('select2:open', function(e) {
    try {
      const $sel = $(e.target);
      const $wrapper = $sel.closest('.popup-input-wrapper');
      if ($wrapper.length) {
        adjustSelect2InWrapper($wrapper);
        setTimeout(function() { adjustSelect2InWrapper($wrapper); }, 80);
      } else {
        // fallback: adjust all popup selects
        setTimeout(adjustAllPopupSelects, 80);
      }
    } catch (err) {
      // ignore
    }
  });
});

// Settings modal: only Export / Import behavior
$(document).ready(function() {
  // Open settings modal
  $('#configButton').on('click', function(e){
    e.stopPropagation();
    $('#settingsModal').addClass('show');
    // Notifications will show selected file info; no DOM filename display needed
  });

  // Close handlers
  $('#settingsClose, #settingsModal .popup-close').on('click', function(){
    $('#settingsModal').removeClass('show');
    // clear file input value to allow re-importing same file later
    $('#settingsImportInput').val('');
  });

  // Export saved commands as JSON file
  $('#settingsExport').on('click', function(){
    try {
      const saved = getSavedCommands() || [];
      if (!saved || saved.length === 0) {
        // Nothing to export — notify the user
        if (typeof notifyWarn === 'function') {
          notifyWarn({ text: t('modals.savedModal.emptyMessage','No saved items'), timeout: 2000 });
        } else if (typeof notify === 'function') {
          notify({ type: 'warning', text: t('modals.savedModal.emptyMessage','No saved items'), timeout: 2000 });
        } 
        return;
      }
      const payload = JSON.stringify(saved, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth()+1).padStart(2,'0');
      const d = String(now.getDate()).padStart(2,'0');
      const filename = (t('modals.settings.exportFilenamePrefix','mbsummon_saves') || 'mbsummon_saves') + '_' + y + m + d + '.json';
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      // notify export success
      if (typeof notifySuccess === 'function') {
        notifySuccess({ key: 'notifications.export_success', timeout: 2600 });
      } else if (typeof notify === 'function') {
        notify({ type: 'success', key: 'notifications.export_success', timeout: 2600 });
      }
    } catch (e) {
      console.error('Export failed', e);
      if (typeof notifyError === 'function') {
        notifyError({ text: t('notifications.export_failed','Error al exportar'), timeout: 3200 });
      } else if (typeof notify === 'function') {
        notify({ type: 'error', text: t('notifications.export_failed','Error al exportar'), timeout: 3200 });
      }
    }
  });

  // Import: open file selector when button clicked
  $('#settingsImportButton').on('click', function(){
    $('#settingsImportInput').click();
  });

  // Handle file selected
  $('#settingsImportInput').on('change', function(e){
    const file = (e.target.files && e.target.files[0]) ? e.target.files[0] : null;
    if (!file) return;
    // Notify the user which file was selected
    if (typeof notifyInfo === 'function') {
      notifyInfo({ text: t('notifications.import_file_selected_prefix','Archivo seleccionado') + ': ' + file.name, timeout: 3000 });
    } else if (typeof notify === 'function') {
      notify({ type: 'info', text: t('notifications.import_file_selected_prefix','Archivo seleccionado') + ': ' + file.name, timeout: 3000 });
    } 

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const text = evt.target.result;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          if (typeof notifyError === 'function') {
            notifyError({ text: t('modals.settings.importInvalidFile','Invalid import file - expected an array of saved items'), timeout: 4200 });
          } 
          return;
        }

        const existing = getSavedCommands() || [];
        let added = 0;
        parsed.forEach((item) => {
          // minimal validation: must have mobType and command
          if (!item || !item.mobType || !item.command) return;
          const exists = existing.some(s => s.mobType === item.mobType && s.command === item.command);
          if (!exists) {
            existing.push(item);
            added++;
          }
        });
        setSavedCommands(existing);
        renderSavedCommands();

        const msg = (t('modals.settings.importSuccess','Import complete. Added %d new items.') || 'Import complete. Added %d new items.').replace('%d', added);
        if (typeof notifySuccess === 'function') {
          notifySuccess({ text: msg, timeout: 3500 });
        } else if (typeof notify === 'function') {
          notify({ type: 'success', text: msg, timeout: 3500 });
        } 

        // reset input so same file can be chosen again if needed
        $('#settingsImportInput').val('');
      } catch (err) {
        console.error('Import error', err);
        if (typeof notifyError === 'function') {
          notifyError({ text: t('modals.settings.importFailed','Import failed - invalid JSON'), timeout: 4500 });
        } else if (typeof notify === 'function') {
          notify({ type: 'error', text: t('modals.settings.importFailed','Import failed - invalid JSON'), timeout: 4500 });
        }
      }
    };
    reader.readAsText(file);
  });
});
