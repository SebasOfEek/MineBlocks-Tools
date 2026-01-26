// lootTags.js — independent module to manage Loot Tags modal
(function($){
  const STORAGE_KEY = 'lootTagsStore';
  let store = [];
  let selectedId = null;
  let pendingDeleteId = null;
  let cardsConfig = null;
  let othersConfig = null;
  let itemsIndex = {}; // map item.value -> image url (fallback)

  function uid() {
    return 'lt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
  }

  // Format functions for Select2 options (with images)
  function formatOption(option) {
    if (!option.id) return option.text;
    // Use global functions if available, otherwise implement locally
    if (typeof window.formatOption === 'function') return window.formatOption(option);
    
    const $el = $(option.element);
    const key = $el.data('i18n');
    let display = option.text || $el.attr('data-default-text') || '';
    try {
      if (key && typeof window.t === 'function') {
        const fromLang = window.t(key, null);
        if (fromLang) display = fromLang;
        else if (window.externalTranslations && window.externalTranslations[key]) {
          const lang = localStorage.getItem('language') || 'es';
          if (window.externalTranslations[key][lang]) display = window.externalTranslations[key][lang];
        }
      }
    } catch (e) {}
    const img = $el.data('image');
    if (!img) return display;
    const $wrap = $('<span>').addClass('select2-option-wrap');
    const $img = $('<img>').addClass('select2-option-img').attr('src', img).attr('alt', display);
    $wrap.append($img).append($('<span>').addClass('select2-option-text').text(display));
    return $wrap;
  }

  function formatSelection(option) {
    if (!option.id) return option.text;
    // Use global function if available, otherwise implement locally
    if (typeof window.formatSelection === 'function') return window.formatSelection(option);
    
    const $el = $(option.element);
    const key = $el.data('i18n');
    let display = option.text || $el.attr('data-default-text') || '';
    try {
      if (key && typeof window.t === 'function') {
        const fromLang = window.t(key, null);
        if (fromLang) display = fromLang;
        else if (window.externalTranslations && window.externalTranslations[key]) {
          const lang = localStorage.getItem('language') || 'es';
          if (window.externalTranslations[key][lang]) display = window.externalTranslations[key][lang];
        }
      }
    } catch (e) {}
    // For selection display, only show text (no image)
    const $sel = $('<span>').addClass('select2-selection-wrap');
    $sel.append($('<span>').addClass('select2-selection-text').text(display));
    return $sel;
  }

  // Resolve help text for a given .loot-tags-item row, respecting per-element data-help-{lang}, data-help, explicit i18n key, and fallback JSON keys
  function resolveHelpText($row){
    const lang = (localStorage.getItem('language') || 'es').toString();
    const helpI18nKey = $row.attr('data-help-i18n');
    let helpText = '';

    const dataHelpLang = $row.attr('data-help-' + lang);
    if (dataHelpLang) helpText = dataHelpLang;

    if(!helpText){ const dataHelp = $row.attr('data-help'); if(dataHelp) helpText = dataHelp; }

    if(!helpText && helpI18nKey && typeof window.t === 'function'){
      try{ helpText = window.t(helpI18nKey, ''); }catch(e){ helpText = ''; }
    }

    if(!helpText){
      const field = $row.attr('data-field') || ($row.find('label').data('i18n') || '').toString().split('.').pop();
      const key = field ? ('modals.lootTags.helpTexts.' + field) : null;
      if(key && typeof window.t === 'function'){
        try{ helpText = window.t(key, ''); }catch(e){ helpText = ''; }
      }
    }

    return helpText || $row.find('label').text().trim() || '';
  }

  function loadStore(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || '[]';
      store = JSON.parse(raw) || [];
    } catch(e) { store = []; }
  }

  function saveStore(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  // Disable options in the sidebar select that are already used by saved loot tags
  function lockSidebarOptions(currentAllowedId){
    const $sel = $('#sidebarItemSelect');
    if(!$sel || !$sel.length) return;
    const used = new Set(store.map(s => (s.itemId || '').toString()));
    $sel.find('option').each(function(){
      const v = (this.value || '').toString();
      if(!v) return; // skip placeholder
      if(used.has(v) && v !== (currentAllowedId || '').toString()) $(this).prop('disabled', true);
      else $(this).prop('disabled', false);
    });
    // If select2 is active, trigger an update
    try { if($sel.hasClass('select2-hidden-accessible')) $sel.trigger('change.select2'); else $sel.trigger('change'); } catch(e){}
  }

  // Observe changes to the sidebar select (options population) and re-lock when options are added
  function observeSidebarOptions(){
    const $sel = $('#sidebarItemSelect');
    if(!$sel || !$sel.length) return;
    const el = $sel.get(0);
    try{
      const mo = new MutationObserver(function(muts){
        // allow currently edited item's option
        const currentItemId = (selectedId && store.find(s=>s.id===selectedId)) ? (store.find(s=>s.id===selectedId).itemId) : null;
        lockSidebarOptions(currentItemId);
      });
      mo.observe(el, { childList: true, subtree: false, attributes: true, attributeFilter: ['disabled','value'] });
    }catch(e){ /* ignore */ }
  }

  function getFormData(){
    const $modal = $('#lootTagsPopup');
    const $container = $modal.find('.loot-tags-container');
    const items = $container.find('.loot-tags-item');
    // Flexible mapping: prefer elements with data-field attribute; fallback to legacy index positions
    const data = {};
    const $sel = $modal.find('#sidebarItemSelect');
    data.itemId = ($sel.val() || '').toString();
    data.itemText = ($sel.find('option:selected').text() || '').toString();
    data.image = ($sel.find('option:selected').data('image')) || '';

    const parseNum = v => {
      if (v === undefined || v === null || v === '') return null;
      const cleaned = String(v).replace(/[^0-9.]/g, '');
      if (cleaned === '') return null;
      const n = cleaned.indexOf('.') === -1 ? parseInt(cleaned, 10) : parseFloat(cleaned);
      return isNaN(n) ? null : n;
    };

    // helper to read a single element (input/select/toggle)
    const readElem = $el => {
      if(!$el || !$el.length) return null;
      const $inp = $el.find('input, select').first();
      if($inp && $inp.length){
        // handle multi-selects -> return array
        if($inp.is('select') && $inp.prop('multiple')){
          const v = $inp.val() || [];
          return Array.isArray(v) ? v.map(String) : (v ? [String(v)] : []);
        }
        const type = ($inp.attr('type') || '').toLowerCase();
        const val = $inp.val();
        if(type === 'number' || $inp.hasClass('integer-only')) return parseNum(val);
        return val === undefined ? null : String(val);
      }
      // toggles
      const $tog = $el.find('.toggle-button');
      if($tog && $tog.length){
        return !!$tog.find('i').hasClass('fa-toggle-on');
      }
      return null;
    };

    // First, populate legacy first-10 fields by index (maintain compatibility)
    const legacyGet = i => $(items.get(i));
    // amount
    let amountRaw = parseNum(readElem(legacyGet(0)));
    if (amountRaw === null) amountRaw = 1; else amountRaw = Math.floor(amountRaw);
    data.amount = amountRaw;
    data.bonus = parseNum(readElem(legacyGet(1)));
    data.lootBonus = parseNum(readElem(legacyGet(2)));
    data.chance = parseNum(readElem(legacyGet(3)));
    data.onFire = !!readElem(legacyGet(4));
    data.size = parseNum(readElem(legacyGet(5)));
    data.isBaby = !!readElem(legacyGet(6));
    const variantVal = $(legacyGet(7)).find('select').val();
    data.variant = (variantVal !== undefined && variantVal !== '') ? variantVal : null;
    data.isSheared = !!readElem(legacyGet(8));
    data.color = readElem(legacyGet(9)) || null;

    // Now read any elements that declare data-field (these are additional tags)
    $container.find('.loot-tags-item[data-field]').each(function(){
      const field = $(this).attr('data-field');
      if(!field) return;
      const val = readElem($(this));
      data[field] = val;
    });

    return data;
  }

  function setFormData(obj){
    const $modal = $('#lootTagsPopup');
    const $container = $modal.find('.loot-tags-container');
    const items = $container.find('.loot-tags-item');
    const setInput = ($el, val) => {
      if(!$el || !$el.length) return;
      const $inp = $el.find('input, select').first();
      if($inp && $inp.length){
        // handle multi-selects
        if($inp.is('select') && $inp.prop('multiple')){
          if(val === null || val === undefined) $inp.val([]);
          else if(Array.isArray(val)) $inp.val(val);
          else $inp.val([String(val)]);
          try{ $inp.trigger('change'); }catch(e){ $inp.trigger('input'); }
          return;
        }
        $inp.val((val === null || val === undefined) ? '' : val).trigger('input');
        return;
      }
      const $tog = $el.find('.toggle-button');
      if($tog && $tog.length){
        const $i = $tog.find('i'); const $s = $tog.find('span');
        const role = $tog.data('role') || $tog.attr('data-role') || '';
        if(val){ $i.removeClass('fa-toggle-off').addClass('fa-toggle-on'); }
        else { $i.removeClass('fa-toggle-on').addClass('fa-toggle-off'); }
        if(role === 'particles'){
          $s.text(val ? t('modals.lootTags.particlesEnabled','Particles') : t('modals.lootTags.particlesDisabled','Disabled Particles'));
        } else if(role === 'category'){
          $s.text(val ? t('modals.lootTags.categorySplash','Splash') : t('modals.lootTags.categoryNormal','Normal'));
        } else {
          $s.text(val ? t('common.yes','Sí') : t('common.no','No'));
        }
      }
    };

    if(obj.itemId) $modal.find('#sidebarItemSelect').val(obj.itemId).trigger('change');
    setInput($(items.get(0)), obj.amount !== undefined ? obj.amount : '');
    setInput($(items.get(1)), obj.bonus !== undefined ? obj.bonus : '');
    setInput($(items.get(2)), obj.lootBonus !== undefined ? obj.lootBonus : '');
    setInput($(items.get(3)), obj.chance !== undefined ? obj.chance : '');
    setInput($(items.get(4)), !!obj.onFire);
    setInput($(items.get(5)), obj.size !== undefined ? obj.size : '');
    setInput($(items.get(6)), !!obj.isBaby);
    if(obj.variant !== undefined) $(items.get(7)).find('select').val(obj.variant).trigger('change'); else $(items.get(7)).find('select').val('').trigger('change');
    setInput($(items.get(8)), !!obj.isSheared);
    if (obj.color !== undefined) $(items.get(9)).find('select').val(obj.color).trigger('change'); else $(items.get(9)).find('select').val('').trigger('change');

    // set any named data-field elements
    $container.find('.loot-tags-item[data-field]').each(function(){
      const f = $(this).attr('data-field');
      if(!f) return;
      setInput($(this), (obj && obj[f] !== undefined) ? obj[f] : '');
    });
  }

  function clearForm(clearEditing){
    if(clearEditing === undefined) clearEditing = true; // default: clear editing state
    const $modal = $('#lootTagsPopup');
    const $container = $modal.find('.loot-tags-container');
    $container.find('input').val('');
    $container.find('select').val('').trigger('change');
    $container.find('.toggle-button').each(function(){
      const $i = $(this).find('i');
      const $s = $(this).find('span');
      const role = $(this).data('role') || $(this).attr('data-role') || '';
      if(role === 'particles'){
        $i.removeClass('fa-toggle-off').addClass('fa-toggle-on');
        $s.text(t('modals.lootTags.particlesEnabled','Particles'));
      } else if(role === 'category'){
        $i.removeClass('fa-toggle-on').addClass('fa-toggle-off');
        $s.text(t('modals.lootTags.categoryNormal','Normal'));
      } else {
        $s.text(t('common.no','No'));
        $i.removeClass('fa-toggle-on').addClass('fa-toggle-off');
      }
    });
    $modal.find('#sidebarItemSelect').val('').trigger('change');
    // clear selection/editing visuals only if explicitly requested
    if(clearEditing){
      selectedId = null;
      $('.saved-loot-item').removeClass('editing selected');
      // re-enable any items/buttons disabled during editing
      $('.saved-loot-item').removeClass('disabled-editing').find('button').prop('disabled', false);
      $('#lootDeleteModal').removeClass('show');
      // Re-enable the item select when exiting edit mode
      try{ 
        const $sel = $('#sidebarItemSelect');
        if($sel.length) {
          $sel.prop('disabled', false);
          if($sel.data('select2')) $sel.select2('enable');
        }
      }catch(e){}
    }
    // refresh select locking
    lockSidebarOptions();
    try { if(typeof updateCommand === 'function') updateCommand(); } catch(e){}
  }

  function renderSavedList(){
    const $list = $('.loot-tags-saved-list');
    $list.empty();
    if(!store.length){
      var emptyMsg = 'No hay loot tags guardados.';
      try{ if(typeof window.t === 'function') emptyMsg = window.t('modals.lootTags.emptyMessage', emptyMsg); }catch(e){}
      $list.append('<div class="empty" style="color:var(--popup-accent);">'+emptyMsg+'</div>');
      // ensure inputs visible if none saved
      $('.loot-tags-window').removeClass('loot-compact');
      // refresh select locking (no used items)
      lockSidebarOptions();
      return;
    }

    const frag = document.createDocumentFragment();
    store.forEach(item => {
      const div = document.createElement('div');
      // keep existing class for compatibility and add requested .saved-list-item
      div.className = 'saved-loot-item saved-list-item';
      div.setAttribute('data-id', item.id);
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.justifyContent = 'space-between';
      div.style.gap = '8px';
      div.style.padding = '8px';
      div.style.margin = '0px 0px 15px';
      // left: image + name
      const left = document.createElement('div');
      left.className = 'left';
      left.style.display = 'flex';
      left.style.gap = '10px';
      left.style.alignItems = 'center';

      const imgWrap = document.createElement('div');
      imgWrap.className = 'img-wrap';
      imgWrap.style.width = '36px';
      imgWrap.style.height = '36px';
      imgWrap.style.display = 'flex';
      imgWrap.style.alignItems = 'center';
      imgWrap.style.justifyContent = 'center';

      const img = document.createElement('img');
      // prefer explicit saved image, otherwise try indexed image from json/items.json
      const fallbackImage = (item.itemId && itemsIndex[item.itemId]) ? itemsIndex[item.itemId] : '';
      img.src = item.image || fallbackImage || '';
      img.alt = item.itemText || item.itemId || '';
      img.style.maxWidth = '32px';
      img.style.maxHeight = '32px';
      img.style.display = 'block';
      img.style.borderRadius = '6px';
      // If image fails to load, try fallback from itemsIndex (only once)
      img.addEventListener('error', function onImgError(){
        try{
          const current = img.getAttribute('src') || '';
          const fallback = (item.itemId && itemsIndex[item.itemId]) ? itemsIndex[item.itemId] : '';
          if(fallback && fallback !== current){
            img.removeEventListener('error', onImgError);
            img.src = fallback;
            return;
          }
          // final fallback: clear src to avoid broken icon
          img.removeEventListener('error', onImgError);
          img.src = '';
        }catch(e){ img.src = ''; }
      });
      imgWrap.appendChild(img);
      left.appendChild(imgWrap);

      const title = document.createElement('div');
      title.className = 'saved-title';
      // Compute display text using current language translations, fallback to saved text, then to itemId
      let titleText = item.itemId || '';
      try {
        const curLang = localStorage.getItem('language') || 'es';
        const key = item.itemId ? ('external.items.' + item.itemId) : null;
        
        // Try to get translation for current language
        if (key) {
          // First try external translations
          if (window.externalTranslations && window.externalTranslations[key]) {
            if (window.externalTranslations[key][curLang]) {
              titleText = window.externalTranslations[key][curLang];
            } else {
              // If current lang not available, try first available language in translations
              const langs = Object.keys(window.externalTranslations[key]);
              if (langs.length > 0 && window.externalTranslations[key][langs[0]]) {
                titleText = window.externalTranslations[key][langs[0]];
              }
            }
          }
          // If no external translation found, try the language JSON via t()
          if (titleText === item.itemId && typeof window.t === 'function') {
            const fromLang = window.t(key, null);
            if (fromLang) titleText = fromLang;
          }
        }
        
        // Last resort: use saved itemText if nothing else worked
        if (titleText === item.itemId && item.itemText) {
          titleText = item.itemText;
        }
      } catch (e) { /* ignore */ }
      title.textContent = titleText;
      left.appendChild(title);
      // actions
      const actions = document.createElement('div');
      actions.className = 'actions';
      actions.style.display = 'flex';
      actions.style.gap = '6px';
      const updateBtn = document.createElement('button');
      updateBtn.className = 'small update-loot-btn saved-update-btn saved-action-btn';
      updateBtn.innerHTML = '<i class="fas fa-check"></i>';
      updateBtn.style.display = 'none';

      const editBtn = document.createElement('button');
      editBtn.className = 'small edit-loot-btn saved-edit-btn saved-action-btn';
      editBtn.innerHTML = '<i class="fas fa-pen"></i>';

      const delBtn = document.createElement('button');
      delBtn.className = 'small delete-loot-btn saved-delete-btn saved-action-btn';
      delBtn.innerHTML = '<i class="fas fa-trash"></i>';

      actions.appendChild(updateBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      div.appendChild(left);
      div.appendChild(actions);

      frag.appendChild(div);
    });
    $list.get(0).appendChild(frag);

    // After rendering, do NOT auto-compact the form — keep inputs visible by default.
    // Compact mode is only applied when user explicitly triggers it (editing flow may remove it).

    // bind delegated handlers
    $list.off('click.loottags', '.saved-loot-item');
    $list.on('click.loottags', '.saved-loot-item', function(e){
      const id = $(this).data('id');
      const $editing = $list.find('.saved-loot-item.editing').first();
      // Prevent interaction with other items while one is in editing mode
      if($editing.length && $editing.data('id') !== id) return;
      selectSaved(id);
    });
    $list.off('click.loottags', '.edit-loot-btn');
    $list.on('click.loottags', '.edit-loot-btn', function(e){
      e.stopPropagation();
      const $item = $(this).closest('.saved-loot-item');
      const id = $item.data('id');
      // show update button and disable edit/delete while editing
      $item.find('.update-loot-btn').show();
      $item.find('.edit-loot-btn, .delete-loot-btn').prop('disabled', true).hide();
      // mark visually as editing
      $item.addClass('editing');
      // disable interaction on other saved items while editing
      $list.find('.saved-loot-item').not($item).addClass('disabled-editing').find('button').prop('disabled', true);
      editSaved(id);
    });
    // Pressed visual for edit/delete/update buttons (delegated)
    $list.off('mousedown.loottags touchstart.loottags', '.saved-loot-item button').on('mousedown.loottags touchstart.loottags', '.saved-loot-item button', function(e){
      $(this).addClass('pressed');
    });
    $list.off('mouseup.loottags mouseleave.loottags touchend.loottags', '.saved-loot-item button').on('mouseup.loottags mouseleave.loottags touchend.loottags', '.saved-loot-item button', function(e){
      $(this).removeClass('pressed');
    });
    $list.off('click.loottags', '.update-loot-btn');
    $list.on('click.loottags', '.update-loot-btn', function(e){
      e.stopPropagation();
      const $item = $(this).closest('.saved-loot-item');
      const id = $item.data('id');
      const data = getFormData();
      if(!data.itemId){
        const m = (typeof window.t === 'function') ? window.t('notifications.loot.missing','Debes agregar un item primero.') : 'Debes agregar un item primero.';
        notify({ type: 'warning', text: m, timeout: 1600 });
        return;
      }
      updateLootTag(id, data);
      // clear editing visuals/state and re-enable other items
      $item.removeClass('editing');
      $('.saved-loot-item').removeClass('disabled-editing selected').find('button').prop('disabled', false);
      selectedId = null;
      clearForm();
    });
    $list.off('click.loottags', '.delete-loot-btn');
    $list.on('click.loottags', '.delete-loot-btn', function(e){
      e.stopPropagation();
      const id = $(this).closest('.saved-loot-item').data('id');
      // delete instantly without confirmation
      deleteLootTag(id);
    });

    // ensure editing visual removed if user clicks elsewhere (but not when closing modal)
    $(document).on('click.loottagsCancel', function(e){
      // Treat clicks inside select2 dropdowns/containers as inside the modal
      const $t = $(e.target);
      const insideSelect2 = !!$t.closest('.select2-container, .select2-dropdown, .select2-search, .select2-results').length;
      // If click is on a popup-close or overlay (user intentionally closing modal), preserve editing state
      const isPopupClick = !!$t.closest('.popup-close, .popup-overlay').length;
      if(isPopupClick) return;
      // If the modal is being closed intentionally, do not cancel editing here
      if(window._lootTagsModalClosing) return;
      if(!insideSelect2 && !$(e.target).closest('.saved-loot-item, .loot-tags-window').length){
        // Only clear editing state if clicking outside modal (not when closing it)
        if(!$('#lootTagsPopup').hasClass('show')){
          $('.saved-loot-item').removeClass('editing');
          $('.saved-loot-item').removeClass('disabled-editing').find('button').prop('disabled', false);
          $('.update-loot-btn').hide();
        }
      }
    });
    // refresh select locking to disable already used items
    lockSidebarOptions();
  }

  function addLootTag(obj){
    // Filter out null/empty properties for new items (save only filled inputs)
    const filtered = {};
    Object.keys(obj || {}).forEach(k => {
      const v = obj[k];
      if (v === null || v === '' || (typeof v === 'number' && isNaN(v))) return;
      filtered[k] = v;
    });
    const item = Object.assign({}, filtered, { id: uid(), createdAt: Date.now() });
    store.push(item);
    saveStore();
    renderSavedList();
    // Debug: log the stored item to console so user can inspect exactly what was saved
    try{ console.log('LootTags - item added:', item); }catch(e){}
    if(window.notify){
      const msg = (typeof window.t === 'function') ? window.t('notifications.loot.added','Item agregado.') : 'Item agregado.';
      notify({ type: 'success', key: 'notifications.loot.added', text: msg, timeout: 1500 });
    }
    // refresh option locking after add
    try { lockSidebarOptions(); } catch(e){}
    // update command output
    try { if(typeof updateCommand === 'function') updateCommand(); } catch(e){}
    return item.id;
  }

  function updateLootTag(id, data){
    const idx = store.findIndex(s => s.id === id);
    if(idx === -1) return false;
    store[idx] = Object.assign({}, store[idx], data);
    saveStore();
    renderSavedList();
    // Debug: log the updated item so the console shows final stored state
    try{ console.log('LootTags - item updated (id=' + id + '):', store[idx]); }catch(e){}
    if(window.notify){
      const msg = (typeof window.t === 'function') ? window.t('notifications.loot.updated','Item actualizado.') : 'Item actualizado.';
      notify({ type: 'success', key: 'notifications.loot.updated', text: msg, timeout: 1200 });
    }
    try { lockSidebarOptions(); } catch(e){}
    // update command output
    try { if(typeof updateCommand === 'function') updateCommand(); } catch(e){}
    return true;
  }

  function deleteLootTag(id){
    const idx = store.findIndex(s => s.id === id);
    if(idx === -1) return false;
    const removed = store.splice(idx,1)[0];
    saveStore();
    renderSavedList();
    if(window.notify){
      const msg = (typeof window.t === 'function') ? window.t('notifications.loot.deleted','Item eliminado.') : 'Item eliminado.';
      notify({ type: 'success', key: 'notifications.loot.deleted', text: msg, timeout: 1200 });
    }
    try { lockSidebarOptions(); } catch(e){}
    // update command output
    try { if(typeof updateCommand === 'function') updateCommand(); } catch(e){}
    return removed;
  }

  // Clear all saved loot tags (used when clearing the form or changing mob)
  function clearAllLootTags(){
    store = [];
    saveStore();
    renderSavedList();
    try { lockSidebarOptions(); } catch(e){}
    try { if(typeof updateCommand === 'function') updateCommand(); } catch(e){}
  }

  function selectSaved(id){
    selectedId = id;
    // highlight in UI
    $('.saved-loot-item').removeClass('selected');
    const $el = $('.saved-loot-item[data-id="'+id+'"]').first();
    $el.addClass('selected');
  }

  function editSaved(id){
    const item = store.find(s => s.id === id);
    if(!item) return;
    // show form and load data
    $('.loot-tags-window').removeClass('loot-compact');
    // Prepare item-specific fields first (this resets defaults), then fill values
    try{ applyItemConfig(item.itemId); }catch(e){}
    // now populate form values from stored item
    try{ window._lootTagsSuppressSidebarChange = true; }catch(e){}
    setFormData(item);
    try{ window._lootTagsSuppressSidebarChange = false; }catch(e){}
    selectedId = id;
    // apply mob-specific rules after filling so mob restrictions are enforced
    try{ applyMobLootConfig($('#mobType').val() || ''); }catch(e){}
    // allow the current item's option to remain selectable while editing
    try { lockSidebarOptions(item.itemId); } catch(e){}
    // Re-apply item config WITHOUT resetting values so item-supported fields remain visible
    try{ applyItemConfig(item.itemId, true); }catch(e){}
    // Disable the item select while editing to prevent changing items mid-edit
    try{ 
      const $sel = $('#sidebarItemSelect');
      if($sel.length) {
        $sel.prop('disabled', true);
        if($sel.data('select2')) $sel.select2('disable');
      }
    }catch(e){}
    // Debug: log the item being edited
    try{ console.log('LootTags - editing item (id=' + id + '):', item); }catch(e){}
  }

  // Apply mob-specific config to enable/disable inputs inside the Loot Tags modal
  function applyMobLootConfig(mobKey){
    try{
      const $modal = $('#lootTagsPopup');
      const $container = $modal.find('.loot-tags-container');
      const items = $container.find('.loot-tags-item');
      // default: enable all (include item tag fields)
      const allFields = ['amount','bonus','lootBonus','chance','onFire','size','isBaby','variant','isSheared','color',
        'item_type','item_unbreakable','item_enchantment','item_anvilUses','item_name','item_canPlaceOn','item_canDestroy','item_showParticles','item_category','item_command','item_uses'
      ];
      let enabled = allFields.slice();

      if(cardsConfig && mobKey && cardsConfig[mobKey] && cardsConfig[mobKey].lootTags && Array.isArray(cardsConfig[mobKey].lootTags.enabled)){
        enabled = cardsConfig[mobKey].lootTags.enabled.slice();
      }

      // for each field decide enable/disable by mapping name->index
      const idxMap = { amount:0, bonus:1, lootBonus:2, chance:3, onFire:4, size:5, isBaby:6, variant:7, isSheared:8, color:9 };
      // Resolve presets and aliases so `enabled` can contain mixed values
      // e.g. ["ANIMALS","isSheared","color"] or { "preset": "ANIMALS" }
      let raw = [];
      if(cardsConfig && cardsConfig[mobKey] && cardsConfig[mobKey].lootTags){
        const lt = cardsConfig[mobKey].lootTags;
        if(Array.isArray(lt.enabled)) raw = lt.enabled.slice();
        else if(typeof lt.preset === 'string') raw = [lt.preset];
      }

      // If enabled is a single string in the JSON (legacy), handle it
      if(Array.isArray(enabled) && enabled.length === 1 && typeof enabled[0] === 'string' && raw.length === 0){
        raw = enabled.slice();
      }

      const resolved = [];
      const presets = (cardsConfig && cardsConfig._lootTagPresets) || {};
      const aliases = (cardsConfig && cardsConfig._lootTagFieldNames) || {};

      raw.forEach(token => {
        if(!token || typeof token !== 'string') return;
        const t = token.trim();
        // preset name (case-sensitive key in _lootTagPresets)
        if(presets[t] && Array.isArray(presets[t])){
          presets[t].forEach(f => { if(f && resolved.indexOf(f) === -1) resolved.push(f); });
          return;
        }
        // alias mapping (like AMOUNT -> amount)
        if(aliases[t]){
          const f = aliases[t];
          if(resolved.indexOf(f) === -1) resolved.push(f);
          return;
        }
        // direct field name (allow case-insensitive match to known fields)
        const lower = t.toLowerCase();
        const match = allFields.find(f => f.toLowerCase() === lower);
        if(match && resolved.indexOf(match) === -1) resolved.push(match);
      });

      // If resolved empty => enable all fields (default)
      if(resolved.length === 0) enabled = allFields.slice();
      else enabled = resolved.slice();

      // For each field, try to find element via data-field first, else via legacy index
      allFields.forEach(name => {
        let $el = $container.find('.loot-tags-item[data-field="' + name + '"]').first();
        if(!$el || !$el.length){
          const i = idxMap[name];
          $el = $(items.get(i));
        }
        if(!$el || !$el.length) return;
        const shouldEnable = enabled.indexOf(name) !== -1;
        if(!shouldEnable) $el.hide(); else $el.show();
        $el.find('input, select').prop('disabled', !shouldEnable);
        $el.find('.toggle-button').each(function(){
          if(!shouldEnable){ $(this).addClass('disabled').prop('disabled', true).css('pointer-events','none'); }
          else { $(this).removeClass('disabled').prop('disabled', false).css('pointer-events','auto'); }
        });
      });
    }catch(e){ /* ignore */ }
  }

  // Apply item-specific field visibility based on cardsConfig.items mapping
  function applyItemConfig(itemId, preserveValues){
    if(preserveValues === undefined) preserveValues = false;
    try{
      const $modal = $('#lootTagsPopup');
      const $container = $modal.find('.loot-tags-container');
      // Prefer per-item metadata inside json/items.json (window._itemsFieldMap).
      // Fallback to cardsConfig.items for backward compatibility.
      let enabled = [];
      try{
        if(window && window._itemsFieldMap && itemId && window._itemsFieldMap[itemId]){
          const cfg = window._itemsFieldMap[itemId];
          if(Array.isArray(cfg)) enabled = cfg.slice();
          else if(typeof cfg === 'string' && cardsConfig && cardsConfig._itemPresets && cardsConfig._itemPresets[cfg]) enabled = cardsConfig._itemPresets[cfg].slice();
        } else if(cardsConfig){
          const itemsMap = cardsConfig.items || {};
          const presets = cardsConfig._itemPresets || {};
          if(itemId && itemsMap[itemId]){
            const cfg = itemsMap[itemId];
            if(Array.isArray(cfg)) enabled = cfg.slice();
            else if(typeof cfg === 'string' && presets[cfg]) enabled = presets[cfg].slice();
          }
        }
      }catch(e){ enabled = []; }
      
      // Before applying new config, reset values of all fields so leftover selections don't persist
      // If preserveValues is true, skip resetting so existing values remain visible.
      const resetField = function($el){
        if(!$el || !$el.length) return;
        if(preserveValues) return;
        // reset selects
        $el.find('select').each(function(){
          const $s = $(this);
          if($s.prop('multiple')){ $s.val([]).trigger('change'); }
          else { $s.val('').trigger('change'); }
        });
        // reset inputs
        $el.find('input').each(function(){ $(this).val('').trigger('input'); });
        // reset toggles: particles default ON, category default OFF, otherwise OFF
        $el.find('.toggle-button').each(function(){
          const $t = $(this); const $i = $t.find('i'); const $s = $t.find('span');
          const role = $t.data('role') || $t.attr('data-role') || '';
          if(role === 'particles'){ $i.removeClass('fa-toggle-off').addClass('fa-toggle-on'); $s.text(t('modals.lootTags.particlesEnabled','Particles')); }
          else if(role === 'category'){ $i.removeClass('fa-toggle-on').addClass('fa-toggle-off'); $s.text(t('modals.lootTags.categoryNormal','Normal')); }
          else { $i.removeClass('fa-toggle-on').addClass('fa-toggle-off'); $s.text(t('common.no','No')); }
        });
      };

      // Reset default fields first (amount, bonus, lootBonus, chance, onFire, size, isBaby, variant, isSheared, color)
      const defaultFields = ['amount', 'bonus', 'lootBonus', 'chance', 'onFire', 'size', 'isBaby', 'variant', 'isSheared', 'color'];
      defaultFields.forEach(name => {
        const $el = $container.find('.loot-tags-item[data-field="' + name + '"]');
        if($el && $el.length) resetField($el);
      });

      // If no specific config, hide all extra item fields to keep UI compact
      const extraFields = ['item_type','item_unbreakable','item_enchantment','item_anvilUses','item_name','item_canPlaceOn','item_canDestroy','item_showParticles','item_category','item_command','item_uses','item_type_spawnegg','item_type_color','item_type_color2','item_type_balloon','item_type_potion'];
      // Debug: log computed enabled fields for this item
      try{ console.log('applyItemConfig for itemId="' + (itemId||'') + '", enabled=', enabled); }catch(e){}

      extraFields.forEach(name => {
        const $el = $container.find('.loot-tags-item[data-field="' + name + '"]');
        if(!$el || !$el.length) return;
        // reset values to defaults first (unless preserveValues)
        resetField($el);
        const show = enabled.indexOf(name) !== -1;
        if(show) $el.show(); else $el.hide();
        $el.find('input, select').prop('disabled', !show);
        $el.find('.toggle-button').each(function(){ if(!show){ $(this).addClass('disabled').prop('disabled', true).css('pointer-events','none'); } else { $(this).removeClass('disabled').prop('disabled', false).css('pointer-events','auto'); } });
      });
    }catch(e){ }
  }

  function askDelete(id){
    pendingDeleteId = id;
    // open the global delete modal
    $('#lootDeleteModal').addClass('show');
  }

  function initEvents(){
    const $modal = $('#lootTagsPopup');
    // namespace events to avoid duplicates
    $modal.off('.lootTags');

    // toggle buttons inside form - bind directly because .popup-window stops propagation
    $modal.find('.toggle-button').off('click.lootTags').on('click.lootTags', function(){
      const $i = $(this).find('i');
      const $span = $(this).find('span');
      const isOn = $i.hasClass('fa-toggle-on');
      // toggle classes
      if(isOn){ $i.removeClass('fa-toggle-on').addClass('fa-toggle-off'); }
      else { $i.removeClass('fa-toggle-off').addClass('fa-toggle-on'); }
      // Determine label based on role (particles/category vs generic)
      const role = $(this).data('role') || $(this).attr('data-role') || '';
      if(role === 'particles'){
        const onText = t('modals.lootTags.particlesEnabled', 'Particles');
        const offText = t('modals.lootTags.particlesDisabled', 'Disabled Particles');
        $span.text(isOn ? offText : onText);
      } else if(role === 'category'){
        const splashText = t('modals.lootTags.categorySplash','Splash');
        const normalText = t('modals.lootTags.categoryNormal','Normal');
        $span.text(isOn ? normalText : splashText);
      } else {
        const yes = t('common.yes','Sí');
        const no = t('common.no','No');
        $span.text(isOn ? no : yes);
      }
    });

    // Sanitize numeric inputs inside loot-tags-container: remove +, - and any non-numeric chars except dot
    // Keydown: prevent plus/minus and any non-numeric keys except navigation, backspace, dot
    // Restrict this behavior to inputs[type="number"] only so text inputs can accept chars
    $modal.off('keydown.loottags', '.loot-tags-container input[type="number"], .loot-tags-container select').on('keydown.loottags', '.loot-tags-container input[type="number"], .loot-tags-container select', function(e){
      const allowedKeys = [8,9,13,27,37,38,39,40,46]; // backspace, tab, enter, esc, arrows, delete
      const key = e.which || e.keyCode;
      // allow control/meta combos (copy/paste)
      if(e.ctrlKey || e.metaKey) return;
      // allow allowedKeys
      if(allowedKeys.indexOf(key) !== -1) return;
      // digits (top row) and numpad digits
      if((key >= 48 && key <= 57) || (key >= 96 && key <= 105)) return;
      // dot key (.) - allow but ensure only one
      if(key === 190 || key === 110){
        // If this input has class integer-only, do not allow dot
        if($(this).hasClass('integer-only')){ e.preventDefault(); return; }
        if(this.value && this.value.indexOf('.') !== -1){ e.preventDefault(); }
        return;
      }
      // otherwise prevent (this blocks +, -, letters, etc.)
      e.preventDefault();
    });

    // Paste: sanitize pasted content to only digits and at most one dot (only for number inputs)
    $modal.off('paste.loottags', '.loot-tags-container input[type="number"]').on('paste.loottags', '.loot-tags-container input[type="number"]', function(e){
      const clipboard = (e.originalEvent || e).clipboardData.getData('text/plain') || '';
      const cleaned = clipboard.replace(/[^0-9.]/g, '');
      // collapse multiple dots
      const parts = cleaned.split('.');
      let final = parts.shift() + (parts.length ? '.' + parts.join('') : '');
      // prevent default paste and insert cleaned
      e.preventDefault();
      const $t = $(this);
      $t.val(final).trigger('input');
    });

    // Input: final sanitize to remove any stray characters (keeps digits and single dot) - only for number inputs
    $modal.find('.loot-tags-container').off('input.loottagsNumeric', 'input[type="number"]').on('input.loottagsNumeric', 'input[type="number"]', function(){
      const $t = $(this);
      let val = $t.val() || '';
      if(typeof val !== 'string') val = String(val);
      let cleaned = val.replace(/[^0-9.]/g, '');
      if(cleaned.indexOf('.') !== -1){
        const parts = cleaned.split('.');
        cleaned = parts.shift() + (parts.length ? '.' + parts.join('') : '');
      }
      if(cleaned !== val) $t.val(cleaned);
    });

    // Apply mob-specific input enable/disable when mob changes
    $(document).on('change', '#mobType', function(){
      applyMobLootConfig($(this).val());
      // Reset form and saved loot tags when changing mob
      clearForm();
      clearAllLootTags();
    });

    // Also apply when opening the loot tags modal
    $modal.on('show.lootTags', function(){
      const cur = $('#mobType').val() || '';
      applyMobLootConfig(cur);
    });

    // Save button (main) - bind directly to the button inside popup
    $modal.find('.loot-tags-buttons .sidebar-button.save').off('click.lootTags').on('click.lootTags', function(){
      const data = getFormData();
        if(!data.itemId){
          const m = (typeof window.t === 'function') ? window.t('notifications.loot.missing','Debes agregar un item primero.') : 'Debes agregar un item primero.';
          notify({ type: 'warning', text: m, timeout: 1600 });
          return;
        }
      // Debug: show exactly what user is trying to save
      try{ console.log('LootTags - Save button pressed, form data:', data); }catch(e){}
      // If selectedId -> update; else add
      if(selectedId){
        updateLootTag(selectedId, data);
      } else {
        addLootTag(data);
      }
      clearForm();
    });

    // Add pressed visual feedback for sidebar buttons (touch/mouse)
    $modal.find('.sidebar-button').off('.press').on('mousedown.press touchstart.press', function(){
      $(this).addClass('pressed');
    }).on('mouseup.press mouseleave.press touchend.press', function(){
      $(this).removeClass('pressed');
    });

    // Edit main button: treat as "New" (show form) - bind directly
    $modal.find('.loot-tags-buttons .sidebar-button').not('.save').not('.delete').off('click.lootTags').on('click.lootTags', function(){
      selectedId = null;
      $('.loot-tags-window').removeClass('loot-compact');
      clearForm();
      $('#sidebarItemSelect').focus();
    });

    // Delete main button: bind directly
    $modal.find('.loot-tags-buttons .sidebar-button.delete').off('click.lootTags').on('click.lootTags', function(){
      if(!selectedId){ notify({ type: 'warning', body: 'Selecciona un item a eliminar', timeout:1200 }); return; }
      // delete immediately
      deleteLootTag(selectedId);
    });

    // confirmation buttons (global modal)
    $('#confirmDeleteLoot').off('click.loottags').on('click.loottags', function(){
      if(pendingDeleteId){ deleteLootTag(pendingDeleteId); pendingDeleteId = null; $('#lootDeleteModal').removeClass('show'); selectedId = null; }
    });
    $('#cancelDeleteLoot').off('click.loottags').on('click.loottags', function(){ pendingDeleteId = null; $('#lootDeleteModal').removeClass('show'); });

    // Press animation for saved list action buttons (mouse + touch)
    $(document).off('mousedown.loottags touchstart.loottags', '.saved-action-btn').on('mousedown.loottags touchstart.loottags', '.saved-action-btn', function(){
      $(this).addClass('pressed');
    });
    $(document).off('mouseup.loottags mouseleave.loottags touchend.loottags touchcancel.loottags', '.saved-action-btn').on('mouseup.loottags mouseleave.loottags touchend.loottags touchcancel.loottags', '.saved-action-btn', function(){
      $(this).removeClass('pressed');
    });

    // handle saved list item click (already delegated in renderSavedList)
  }

  function init(){
    loadStore();
    // reset persisted loot tags on page load (start fresh)
    clearAllLootTags();
    initEvents();
    // observe sidebar select for population and keep options locked
    observeSidebarOptions();
    // load cards config for per-mob input enabling
    $.getJSON('data/cards_config.json').done(function(cfg){
      try { cardsConfig = cfg || {}; } catch(e){ cardsConfig = null; }
      // Re-apply mob-specific rules now that config is available
      try { const cur = $('#mobType').val() || ''; applyMobLootConfig(cur); lockSidebarOptions(); } catch(e){}
    }).fail(function(){ cardsConfig = null; });
    // load others.json for colors/variants
    $.getJSON('data/others.json').done(function(cfg){
      try { othersConfig = cfg || {}; } catch(e){ othersConfig = null; }
      try {
        // populate color select and register translations
        const $color = $('#lootColorSelect');
        window.externalTranslations = window.externalTranslations || {};
        const curLang = localStorage.getItem('language') || 'es';
        if($color && $color.length && othersConfig && Array.isArray(othersConfig.colors)){
          $color.empty();
          $color.append($('<option>').attr('value','').attr('data-i18n','common.select').attr('data-default-text','--Seleccionar--').text(t('common.select','--Seleccionar--')));
          othersConfig.colors.forEach(c => {
            const key = `external.others.colors.${c.value}`;
            if(c.translations) window.externalTranslations[key] = c.translations;
            else window.externalTranslations[key] = { en: c.text || c.value, es: c.text || c.value };
            const display = (window.externalTranslations[key] && window.externalTranslations[key][curLang]) ? window.externalTranslations[key][curLang] : (c.text || c.value || '');
            const opt = $('<option>')
              .attr('value', c.value || '')
              .attr('data-image', c.image || '')
              .attr('data-i18n', key)
              .attr('data-default-text', c.text || c.value || '')
              .text(display);
            $color.append(opt);
          });
          try{ $color.select2({templateResult: formatOption, templateSelection: formatOption, width: '200px', escapeMarkup: function(m){return m;}, containerCssClass: 'select2-color-container'}); }catch(e){}
        }
        // populate variant select and register translations
        const $variant = $('#lootVariantSelect');
        if($variant && $variant.length && othersConfig && Array.isArray(othersConfig.variant)){
          $variant.empty();
          $variant.append($('<option>').attr('value','').attr('data-i18n','common.select').attr('data-default-text','--Seleccionar--').text(t('common.select','--Seleccionar--')));
          othersConfig.variant.forEach(v => {
            const key = `external.others.variant.${v.value}`;
            if(v.translations) window.externalTranslations[key] = v.translations;
            else window.externalTranslations[key] = { en: v.text || v.value, es: v.text || v.value };
            const display = (window.externalTranslations[key] && window.externalTranslations[key][curLang]) ? window.externalTranslations[key][curLang] : (v.text || v.value || '');
            const opt = $('<option>')
              .attr('value', v.value || '')
              .attr('data-image', v.image || '')
              .attr('data-i18n', key)
              .attr('data-default-text', v.text || v.value || '')
              .text(display);
            $variant.append(opt);
          });
          try{ $variant.select2({templateResult: formatOption, templateSelection: formatOption, width: '100px', escapeMarkup: function(m){return m;}, containerCssClass: 'select2-variant-container'}); }catch(e){}
        }
        // populate enchantments select (multi) from others.json -> enchants
        try{
          const $enchant = $('#itemEnchantSelect');
          if($enchant && $enchant.length && othersConfig && Array.isArray(othersConfig.enchants)){
            othersConfig.enchants.forEach(e => {
              const key = `external.others.enchants.${e.value}`;
              if(e.translations) window.externalTranslations[key] = e.translations;
              else window.externalTranslations[key] = { en: e.text || e.value, es: e.text || e.value };
              const curLang = localStorage.getItem('language') || 'es';
              const display = (window.externalTranslations[key] && window.externalTranslations[key][curLang]) ? window.externalTranslations[key][curLang] : (e.text || e.value || '');
              const opt = $('<option>').attr('value', e.value || '').attr('data-image', e.image || '').attr('data-i18n', key).attr('data-default-text', e.text || e.value || '').text(display);
              $enchant.append(opt);
            });
            try{ $enchant.select2({ dropdownParent: $(document.body), placeholder: t('common.select','--Seleccionar--'), templateResult: formatOption, templateSelection: formatSelection, width: '100%', allowClear: true, closeOnSelect: false, escapeMarkup: function(m){return m;} }); }catch(e){}
          }
        }catch(e){}
        
        // Load item type selects (spawnegg, color, color2, balloon, potion)
        try{
          const curLang = localStorage.getItem('language') || 'es';
          
          // Spawnegg - load from mobs.json
          try{
            $.getJSON('data/mobs.json').done(function(mobsData){
              if(mobsData && Array.isArray(mobsData.mobs)){
                const $spawnegg = $('#itemTypeSpawneggSelect');
                if($spawnegg && $spawnegg.length){
                  mobsData.mobs.forEach(m => {
                    const key = `external.mobs.${m.value}`;
                    if(m.translations) window.externalTranslations[key] = m.translations;
                    else window.externalTranslations[key] = { en: m.text || m.value, es: m.text || m.value };
                    const display = (window.externalTranslations[key] && window.externalTranslations[key][curLang]) ? window.externalTranslations[key][curLang] : (m.text || m.value || '');
                    const opt = $('<option>')
                      .attr('value', m.value || '')
                      .attr('data-image', m.image || '')
                      .attr('data-i18n', key)
                      .attr('data-default-text', m.text || m.value || '')
                      .text(display);
                    $spawnegg.append(opt);
                  });
                  try{ $spawnegg.select2({ templateResult: formatOption, templateSelection: formatSelection, width: '100%', dropdownParent: $(document.body), escapeMarkup: function(m){return m;} }); }catch(e){}
                }
              }
            }).fail(function(){ });
          }catch(e){}
          
          // Color, Color2, Balloon, Potion - load from others.json
          if(othersConfig){
            // Color
            const $typeColor = $('#itemTypeColorSelect');
            if($typeColor && $typeColor.length && othersConfig.colors && Array.isArray(othersConfig.colors)){
              othersConfig.colors.forEach(c => {
                const key = `external.others.colors.${c.value}`;
                const display = (window.externalTranslations[key] && window.externalTranslations[key][curLang]) ? window.externalTranslations[key][curLang] : (c.text || c.value || '');
                const opt = $('<option>')
                  .attr('value', c.value || '')
                  .attr('data-image', c.image || '')
                  .attr('data-i18n', key)
                  .attr('data-default-text', c.text || c.value || '')
                  .text(display);
                $typeColor.append(opt);
              });
              try{ $typeColor.select2({ templateResult: formatOption, templateSelection: formatSelection, width: '100%', dropdownParent: $(document.body), escapeMarkup: function(m){return m;} }); }catch(e){}
            }
            
            // Color2
            const $typeColor2 = $('#itemTypeColor2Select');
            if($typeColor2 && $typeColor2.length && othersConfig.typeColor && Array.isArray(othersConfig.typeColor)){
              othersConfig.typeColor.forEach(c => {
                const key = `external.others.typeColor.${c.value}`;
                const display = (window.externalTranslations[key] && window.externalTranslations[key][curLang]) ? window.externalTranslations[key][curLang] : (c.text || c.value || '');
                const opt = $('<option>')
                  .attr('value', c.value || '')
                  .attr('data-image', c.image || '')
                  .attr('data-i18n', key)
                  .attr('data-default-text', c.text || c.value || '')
                  .text(display);
                $typeColor2.append(opt);
              });
              try{ $typeColor2.select2({ templateResult: formatOption, templateSelection: formatSelection, width: '100%', dropdownParent: $(document.body), escapeMarkup: function(m){return m;} }); }catch(e){}
            }
            
            // Balloon
            const $typeBalloon = $('#itemTypeBalloonSelect');
            if($typeBalloon && $typeBalloon.length && othersConfig.typeBalloon && Array.isArray(othersConfig.typeBalloon)){
              othersConfig.typeBalloon.forEach(b => {
                const key = `external.others.typeBalloon.${b.value}`;
                const display = (window.externalTranslations[key] && window.externalTranslations[key][curLang]) ? window.externalTranslations[key][curLang] : (b.text || b.value || '');
                const opt = $('<option>')
                  .attr('value', b.value || '')
                  .attr('data-image', b.image || '')
                  .attr('data-i18n', key)
                  .attr('data-default-text', b.text || b.value || '')
                  .text(display);
                $typeBalloon.append(opt);
              });
              try{ $typeBalloon.select2({ templateResult: formatOption, templateSelection: formatSelection, width: '100%', dropdownParent: $(document.body), escapeMarkup: function(m){return m;} }); }catch(e){}
            }
            
            // Potion
            const $typePotion = $('#itemTypePotionSelect');
            if($typePotion && $typePotion.length && othersConfig.typePotion && Array.isArray(othersConfig.typePotion)){
              othersConfig.typePotion.forEach(p => {
                const key = `external.others.typePotion.${p.value}`;
                const display = (window.externalTranslations[key] && window.externalTranslations[key][curLang]) ? window.externalTranslations[key][curLang] : (p.text || p.value || '');
                const opt = $('<option>')
                  .attr('value', p.value || '')
                  .attr('data-image', p.image || '')
                  .attr('data-i18n', key)
                  .attr('data-default-text', p.text || p.value || '')
                  .text(display);
                $typePotion.append(opt);
              });
              try{ $typePotion.select2({ templateResult: formatOption, templateSelection: formatSelection, width: '100%', dropdownParent: $(document.body), escapeMarkup: function(m){return m;} }); }catch(e){}
            }
          }
        }catch(e){}
      }catch(e){ }
    }).fail(function(){ othersConfig = null; });
    // preload items.json to provide image/text fallbacks when needed
    // Use a cached promise so multiple modules can reuse the same fetch and avoid duplicate processing
    try{
      if(!window._itemsJsonPromise){
        window._itemsJsonPromise = $.getJSON('data/items.json')
          .done(function(data){
            try{
              itemsIndex = {};
              if(data && Array.isArray(data.items)){
                data.items.forEach(it => { if(it && it.value){ itemsIndex[it.value] = it.image || ''; } });
              }
            }catch(e){ itemsIndex = {}; }
            // expose a lightweight cached map for others
            window._itemsIndex = itemsIndex;
            // also keep full items JSON and build a quick fields map for lootFields
            try{
              window._itemsJsonData = data;
              window._itemsFieldMap = {};
              if(data && Array.isArray(data.items)){
                data.items.forEach(it => { if(it && it.value){ window._itemsFieldMap[it.value] = it.lootFields || it.fields || it.showFields || null; } });
              }
              // populate itemCanPlaceOnSelect options (multi-select) with items catalog
              try{
                const $can = $('#itemCanPlaceOnSelect');
                if($can && $can.length && data && Array.isArray(data.items)){
                  const curLang = localStorage.getItem('language') || 'es';
                  data.items.forEach(it => {
                    const key = `external.items.${it.value}`;
                    if(it.translations) window.externalTranslations[key] = it.translations;
                    else window.externalTranslations[key] = { en: it.text || it.value, es: it.text || it.value };
                    const display = (window.externalTranslations[key] && window.externalTranslations[key][curLang]) ? window.externalTranslations[key][curLang] : (it.text || it.value || '');
                    const opt = $('<option>').attr('value', it.value || '').attr('data-image', it.image || '').attr('data-i18n', key).attr('data-default-text', it.text || it.value || '').text(display);
                    $can.append(opt);
                  });
                  try{ $can.select2({ templateResult: formatOption, templateSelection: formatSelection, width: '100%', dropdownParent: $(document.body), placeholder: t('common.select','--Seleccionar--'), allowClear: true, closeOnSelect: false, escapeMarkup: function(m){return m;} }); }catch(e){}
                }
                // populate itemCanDestroySelect similarly
                try{
                  const $destroy = $('#itemCanDestroySelect');
                  if($destroy && $destroy.length && data && Array.isArray(data.items)){
                    const curLang = localStorage.getItem('language') || 'es';
                    data.items.forEach(it => {
                      const key = `external.items.${it.value}`;
                      if(it.translations) window.externalTranslations[key] = it.translations;
                      else window.externalTranslations[key] = { en: it.text || it.value, es: it.text || it.value };
                      const display = (window.externalTranslations[key] && window.externalTranslations[key][curLang]) ? window.externalTranslations[key][curLang] : (it.text || it.value || '');
                      const opt = $('<option>').attr('value', it.value || '').attr('data-image', it.image || '').attr('data-i18n', key).attr('data-default-text', it.text || it.value || '').text(display);
                      $destroy.append(opt);
                    });
                    try{ $destroy.select2({ templateResult: formatOption, templateSelection: formatSelection, width: '100%', dropdownParent: $(document.body), placeholder: t('common.select','--Seleccionar--'), allowClear: true, closeOnSelect: false, escapeMarkup: function(m){return m;} }); }catch(e){}
                  }
                }catch(e){}
              }catch(e){}
            }catch(e){ window._itemsFieldMap = {}; }
            return data;
          }).fail(function(){ itemsIndex = {}; window._itemsIndex = itemsIndex; window._itemsJsonData = null; window._itemsFieldMap = {}; });
      } else {
        // ensure local itemsIndex picks up existing cached map if present
        if(window._itemsIndex) itemsIndex = window._itemsIndex;
      }
    }catch(e){ itemsIndex = {}; }
    renderSavedList();
    // add contextual help buttons to each loot-tags-item
    try{ addHelpButtons(); }catch(e){}
    // Ensure extra item fields are hidden unless an item is selected
    try{
      const sid = $('#sidebarItemSelect').val() || '';
      applyItemConfig(sid);
    }catch(e){}
  }

  // Insert help button into each loot-tags-item and wire tooltip
  function addHelpButtons(){
    const $modal = $('#lootTagsPopup');
    const $container = $modal.find('.loot-tags-container');
    $container.find('.loot-tags-item').each(function(){
      const $row = $(this);
      if($row.find('.lt-help').length) return; // already added
      // Determine help text priority:
      // 1. data-help-{lang} attribute on the element (e.g. data-help-es / data-help-en)
      // 2. data-help attribute (generic)
      // 3. data-help-i18n attribute (explicit i18n key)
      // 4. constructed i18n key from data-field -> modals.lootTags.helpTexts.{field}
      // 5. fallback to label text
      const lang = (localStorage.getItem('language') || 'es').toString();
      const helpI18nKey = $row.attr('data-help-i18n');
      let helpText = '';

      // 1) data-help-{lang}
      const dataHelpLang = $row.attr('data-help-' + lang);
      if (dataHelpLang) {
        helpText = dataHelpLang;
      }

      // 2) generic data-help
      if (!helpText) {
        const dataHelp = $row.attr('data-help');
        if (dataHelp) helpText = dataHelp;
      }

      // 3) explicit i18n key
      if (!helpText && helpI18nKey && typeof window.t === 'function') {
        try { helpText = window.t(helpI18nKey, ''); } catch(e) { helpText = ''; }
      }

      // 4) constructed key from data-field
      if (!helpText) {
        const field = $row.attr('data-field') || ($row.find('label').data('i18n') || '').toString().split('.').pop();
        const key = field ? ('modals.lootTags.helpTexts.' + field) : null;
        if (key && typeof window.t === 'function') {
          try { helpText = window.t(key, ''); } catch(e) { helpText = ''; }
        }
      }

      // create help button (no native title to avoid duplicate browser tooltip)
      const $btn = $('<button type="button" class="lt-help" aria-label="help">?</button>');
      // set initial aria-label for accessibility; actual shown text is resolved on hover/click
      $btn.attr('aria-label', resolveHelpText($row));

      // Detect if it's a touch device
      const isTouchDevice = () => (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));

      if(isTouchDevice()) {
        // Mobile: click to toggle tooltip visibility
        $btn.on('click', function(e){ 
          e.preventDefault();
          const $existingTooltip = $('.lt-tooltip');
          // If tooltip already exists, close it
          if($existingTooltip.length) {
            hideHelpTooltip();
          } else {
            // Otherwise show it (will auto-close after 4 seconds)
            const text = resolveHelpText($row);
            console.log('lt-help click:', $row.attr('data-field'), text);
            showHelpTooltip($(this), text, false); 
          }
        });
        // Close tooltip when tapping outside
        $(document).on('click.lootTooltip', function(e) {
          if(!$(e.target).closest('.lt-help, .lt-tooltip').length) {
            hideHelpTooltip();
          }
        });
      } else {
        // Desktop: hover and click both work
        $btn.on('mouseenter', function(){ const text = resolveHelpText($row); console.log('lt-help mouseenter:', $row.attr('data-field'), text); showHelpTooltip($(this), text); });
        $btn.on('mouseleave', function(){ hideHelpTooltip(); });
        $btn.on('click', function(e){ e.preventDefault(); const text = resolveHelpText($row); console.log('lt-help click:', $row.attr('data-field'), text); showHelpTooltip($(this), text, true); });
      }
      
      // Insert button right after the label instead of at the end of row
      const $label = $row.find('label');
      if($label.length) {
        // Create a wrapper div to keep label and help button on same line
        const $labelWrapper = $('<div class="loot-label-wrapper" style="display: flex; align-items: center; gap: 6px; justify-content: space-between;"></div>');
        $label.wrap($labelWrapper);
        $label.after($btn);
      } else {
        $row.append($btn);
      }
    });
  }

  let _ltTooltipTimeout = null;
  let _ltTooltipPersistent = false;
  function showHelpTooltip($btn, text, persist){
    hideHelpTooltip();
    const $t = $('<div class="lt-tooltip" role="tooltip"></div>').text(text || '');
    // Apply temporary styles to allow proper rendering and size calculation
    $t.css({ position: 'fixed', visibility: 'hidden', top: '-9999px', left: '-9999px', maxWidth: '300px', zIndex: 99999 });
    $('body').append($t);
    _ltTooltipPersistent = !!persist;

    // Smart positioning based on viewport size
    const isMobile = window.innerWidth < 768;
    // use bounding client rect for viewport-relative coords (button)
    const rect = ($btn && $btn.length && $btn[0].getBoundingClientRect) ? $btn[0].getBoundingClientRect() : { left:0, top:0, width:0, height:0 };
    const btnHeight = rect.height || $btn.outerHeight();
    const btnWidth = rect.width || $btn.outerWidth();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const viewportBtnTop = rect.top;
    const viewportBtnLeft = rect.left;

    // After appending with temporary styles, compute tooltip size using its bounding rect (accurate)
    const tooltipRect = ($t && $t.length && $t[0].getBoundingClientRect) ? $t[0].getBoundingClientRect() : { width: 0, height: 0 };
    let tooltipWidth = tooltipRect.width || $t.outerWidth() || 280;
    let tooltipHeight = tooltipRect.height || $t.outerHeight() || 60;

    let left, top;

    if(isMobile) {
      const padding = 10;
      // Position tooltip to the right of the button (same as desktop)
      left = viewportBtnLeft + btnWidth + 5;
      if(left + tooltipWidth + 20 > viewportWidth) {
        left = viewportBtnLeft - tooltipWidth - 5;
      }
      top = viewportBtnTop - 5;
      if(top + tooltipHeight > viewportHeight - 20) {
        top = viewportHeight - tooltipHeight - 20;
      }
      if(top < 0) {
        top = 10;
      }
      left = Math.max(10, Math.min(left, viewportWidth - tooltipWidth - 10));
    } else {
      left = viewportBtnLeft + btnWidth + 5;
      if(left + tooltipWidth + 20 > viewportWidth) {
        left = viewportBtnLeft - tooltipWidth - 5;
      }
      top = viewportBtnTop - 5;
      if(top + tooltipHeight > viewportHeight - 20) {
        top = viewportHeight - tooltipHeight - 20;
      }
      if(top < 0) {
        top = 10;
      }
      left = Math.max(10, Math.min(left, viewportWidth - tooltipWidth - 10));
    }

    $t.css({ 
      position: 'fixed', 
      left: left + 'px', 
      top: top + 'px', 
      zIndex: 99999,
      visibility: 'visible',
      backgroundColor: 'var(--tooltip-bg, #2a2a2a)',
      color: 'var(--tooltip-text, #ffffff)',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: '500',
      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      maxWidth: '300px',
      wordWrap: 'break-word',
      whiteSpace: 'pre-wrap',
      border: '1px solid rgba(255,255,255,0.1)'
    });

    // Debug: log bounding rect and all computed styles for inspection
    try{
      const el = $t[0];
      const rectDbg = el.getBoundingClientRect();
      const comp = window.getComputedStyle(el);
      const styles = {};
      for(let i=0;i<comp.length;i++){ const p = comp[i]; styles[p] = comp.getPropertyValue(p); }
      console.log('lt-tooltip rect:', rectDbg);
      console.log('lt-tooltip computed styles:', styles);
      console.log('lt-tooltip numeric left/top:', left, top, 'tooltipSize:', tooltipWidth, tooltipHeight, 'viewport:', viewportWidth, viewportHeight);
    }catch(e){ console.warn('lt-tooltip debug error', e); }

    // keep visible while hovering tooltip or button
    $t.on('mouseenter', function(){ if(_ltTooltipTimeout){ clearTimeout(_ltTooltipTimeout); _ltTooltipTimeout = null; } });
    $t.on('mouseleave', function(){ if(!_ltTooltipPersistent){ _ltTooltipTimeout = setTimeout(hideHelpTooltip, 300); } });

    $btn.on('mouseenter.ltBtn', function(){ if(_ltTooltipTimeout){ clearTimeout(_ltTooltipTimeout); _ltTooltipTimeout = null; } });
    $btn.on('mouseleave.ltBtn', function(){ if(!_ltTooltipPersistent){ _ltTooltipTimeout = setTimeout(hideHelpTooltip, 300); } });

    $(document).on('click.ltTooltipOuter', function(e){ if(!$(e.target).closest('.lt-help, .lt-tooltip').length){ hideHelpTooltip(); } });

    // Only set auto-hide timeout for mobile devices (non-touch devices handle it via mouseleave)
    if(!persist && isMobile){ _ltTooltipTimeout = setTimeout(hideHelpTooltip, 4000); }
  }
  function hideHelpTooltip(){ if(_ltTooltipTimeout){ clearTimeout(_ltTooltipTimeout); _ltTooltipTimeout = null; } _ltTooltipPersistent = false; $('.lt-tooltip').remove(); try{ $(document).off('click.ltTooltipOuter'); }catch(e){} $('.lt-help').off('mouseleave.ltBtn mouseenter.ltBtn'); }

          // Update enchant select (texts & re-init)
          try{
            const $enchant = $('#itemEnchantSelect');
            if($enchant && $enchant.length){
              $enchant.find('option[data-i18n]').each(function(){
                const $o = $(this); const key = $o.data('i18n'); let newT = null;
                try{ if(window.currentLangData && key){ const v = window.t(key,null); if(v) newT = v; } }catch(e){}
                if((!newT || newT === null) && window.externalTranslations && window.externalTranslations[key]) newT = window.externalTranslations[key][curLang] || $o.attr('data-default-text') || $o.text();
                if(!newT) newT = $o.attr('data-default-text') || $o.text();
                if($o.text() !== newT) $o.text(newT);
              });
              if($enchant.data('select2')){
                const val = $enchant.val(); try{ $enchant.select2('destroy'); }catch(e){}
                try{ $enchant.select2({ dropdownParent: $(document.body), placeholder: t('modals.lootTags.selectEnchantPlaceholder','Seleccionar encantamientos'), templateResult: formatOption, templateSelection: formatSelection, width: '100%', allowClear: true, closeOnSelect: false, escapeMarkup: function(m){return m;} }); $enchant.val(val).trigger('change'); }catch(e){}
              }
            }
          }catch(e){}

          // Update item canPlaceOn and canDestroy selects
          try{
            ['#itemCanPlaceOnSelect','#itemCanDestroySelect'].forEach(function(sel){
              try{
                const $s = $(sel);
                if($s && $s.length){
                  $s.find('option[data-i18n]').each(function(){ const $o=$(this); const key=$o.data('i18n'); let newT=null; try{ if(window.currentLangData && key){ const v=window.t(key,null); if(v) newT=v; } }catch(e){} if((!newT||newT===null) && window.externalTranslations && window.externalTranslations[key]) newT = window.externalTranslations[key][curLang] || $o.attr('data-default-text') || $o.text(); if(!newT) newT = $o.attr('data-default-text') || $o.text(); if($o.text() !== newT) $o.text(newT); });
                  if($s.data('select2')){ const v=$s.val(); try{ $s.select2('destroy'); }catch(e){} try{ $s.select2({ templateResult: formatOption, templateSelection: formatSelection, width: '100%', dropdownParent: $(document.body), placeholder: t('modals.lootTags.selectItemPlaceholder','Seleccionar item'), allowClear: true, closeOnSelect: false, escapeMarkup: function(m){return m;} }); $s.val(v).trigger('change'); }catch(e){}
                  }
                }
              }catch(e){}
            });
          }catch(e){}

  $(document).ready(function(){
    // initialize when DOM ready
    init();
  });

  // Expose API for testing or external usage
  window.lootTagsStore = {
    init, loadStore, saveStore, getAll: () => store.slice(), add: addLootTag, update: updateLootTag, delete: deleteLootTag,
    clearAll: clearAllLootTags,
    refreshLanguage: function(){
      // Defer rendering saved list until after select option texts are refreshed
      try{ /* renderSavedList will be called after select updates below */ }catch(e){}
      try{
        const curLang = localStorage.getItem('language') || 'es';
        // Update sidebar item option texts
        const $sidebar = $('#sidebarItemSelect');
        if($sidebar && $sidebar.length){
          $sidebar.find('option[data-i18n]').each(function(){
            const $opt = $(this);
            const key = $opt.data('i18n');
            let newText = null;
            try{
              if(window.currentLangData && key){ const fromLang = window.t(key, null); if(fromLang) newText = fromLang; }
            }catch(e){}
            if((!newText || newText === null) && window.externalTranslations && window.externalTranslations[key]){
              newText = window.externalTranslations[key][curLang] || $opt.attr('data-default-text') || $opt.text();
            }
            if(!newText) newText = $opt.attr('data-default-text') || $opt.text();
            if($opt.text() !== newText) $opt.text(newText);
          });
          // Re-init Select2 to force refresh
          try{
            if($sidebar.data('select2')){
              const curVal = $sidebar.val();
              try{ $sidebar.select2('destroy'); }catch(e){}
              try{
                $sidebar.select2({
                  templateResult: function(option){ return formatOption(option); },
                  templateSelection: function(option){ return formatSelection(option); },
                  width: '100%',
                  dropdownParent: $('#lootTagsPopup .popup-content'),
                  placeholder: t('modals.lootTags.selectItemPlaceholder','Select item'),
                  allowClear: false,
                  closeOnSelect: true
                });
                $sidebar.val(curVal).trigger('change.select2');
              }catch(e){}
            }
          }catch(e){}
        }

        // Update color select
        try{
          const $color = $('#lootColorSelect');
          if($color && $color.length){
            $color.find('option[data-i18n]').each(function(){
              const $o = $(this); const key = $o.data('i18n'); let newT = null;
              try{ if(window.currentLangData && key){ const v = window.t(key,null); if(v) newT = v; } }catch(e){}
              if((!newT || newT === null) && window.externalTranslations && window.externalTranslations[key]) newT = window.externalTranslations[key][curLang] || $o.attr('data-default-text') || $o.text();
              if(!newT) newT = $o.attr('data-default-text') || $o.text();
              if($o.text() !== newT) $o.text(newT);
            });
            if($color.data('select2')){
              const v = $color.val(); try{ $color.select2('destroy'); }catch(e){}
              try{ $color.select2({templateResult: formatOption, templateSelection: formatOption, width: '200px', escapeMarkup: function(m){return m;}, containerCssClass: 'select2-color-container'}); $color.val(v).trigger('change.select2'); }catch(e){}
            }
          }
        }catch(e){}

        // Update variant select
        try{
          const $variant = $('#lootVariantSelect');
          if($variant && $variant.length){
            $variant.find('option[data-i18n]').each(function(){
              const $o = $(this); const key = $o.data('i18n'); let newT = null;
              try{ if(window.currentLangData && key){ const v = window.t(key,null); if(v) newT = v; } }catch(e){}
              if((!newT || newT === null) && window.externalTranslations && window.externalTranslations[key]) newT = window.externalTranslations[key][curLang] || $o.attr('data-default-text') || $o.text();
              if(!newT) newT = $o.attr('data-default-text') || $o.text();
              if($o.text() !== newT) $o.text(newT);
            });
            if($variant.data('select2')){
              const v = $variant.val(); try{ $variant.select2('destroy'); }catch(e){}
              try{ $variant.select2({templateResult: formatOption, templateSelection: formatOption, width: '100px', escapeMarkup: function(m){return m;}, containerCssClass: 'select2-variant-container'}); $variant.val(v).trigger('change.select2'); }catch(e){}
            }
          }
        }catch(e){}

      }catch(e){ /* ignore */ }
      try{ if(typeof updateSidebarItemSelect2Language === 'function') updateSidebarItemSelect2Language(); }catch(e){}
      // Now that selects/external translations have been updated, render saved list so
      // titles pick up the correct localized strings.
      try{ renderSavedList(); }catch(e){}
      // Update help buttons text for current language
      try{
        const $container = $('#lootTagsPopup').find('.loot-tags-container');
        if($container && $container.length){
          $container.find('.loot-tags-item').each(function(){
            const $row = $(this);
            const txt = resolveHelpText($row);
            const $btn = $row.find('.lt-help');
            if($btn && $btn.length){
              $btn.attr('aria-label', txt);
            }
          });
        }
      }catch(e){}
    },
    // Return items mapped for command generation, respecting cards_config.json enabled fields for the given mob
    getCommandItems: function(mobKey){
      const items = store.slice();
      try{
        const allFields = ['amount','bonus','lootBonus','chance','onFire','size','isBaby','variant','isSheared','color',
          'item_type','item_unbreakable','item_enchantment','item_anvilUses','item_name','item_canPlaceOn','item_canDestroy','item_showParticles','item_category','item_command','item_uses'
        ];
        const presets = (cardsConfig && cardsConfig._lootTagPresets) || {};
        const aliases = (cardsConfig && cardsConfig._lootTagFieldNames) || {};

        // build raw enabled tokens
        let raw = [];
        if(cardsConfig && mobKey && cardsConfig[mobKey] && cardsConfig[mobKey].lootTags){
          const lt = cardsConfig[mobKey].lootTags;
          if(Array.isArray(lt.enabled)) raw = lt.enabled.slice();
          else if(typeof lt.preset === 'string') raw = [lt.preset];
        }

        // fallback to DEFAULT preset if nothing
        if(raw.length === 0 && presets.DEFAULT) raw = ['DEFAULT'];

        const resolved = [];
        raw.forEach(token => {
          if(!token || typeof token !== 'string') return;
          const t = token.trim();
          if(presets[t] && Array.isArray(presets[t])){ presets[t].forEach(f=>{ if(resolved.indexOf(f)===-1) resolved.push(f); }); return; }
          if(aliases[t]){ const f = aliases[t]; if(resolved.indexOf(f)===-1) resolved.push(f); return; }
          const lower = t.toLowerCase(); const match = allFields.find(f=>f.toLowerCase()===lower);
          if(match && resolved.indexOf(match)===-1) resolved.push(match);
        });

        const enabled = (resolved.length===0) ? allFields.slice() : resolved.slice();

        // map items
        return items.map(it => {
          const out = { id: it.id, itemId: it.itemId || it.itemText || '', itemText: it.itemText || '' };
          if(enabled.indexOf('amount')!==-1 && it.amount !== undefined) out.quantity = it.amount;
          if(enabled.indexOf('bonus')!==-1 && it.bonus !== undefined) out.bonus = it.bonus;
          if(enabled.indexOf('lootBonus')!==-1 && it.lootBonus !== undefined) out.lootBonus = it.lootBonus;
          if(enabled.indexOf('chance')!==-1 && it.chance !== undefined) out.chance = it.chance;
          if(enabled.indexOf('variant')!==-1 && it.variant !== undefined) out.variant = it.variant;
          if(enabled.indexOf('isSheared')!==-1 && it.isSheared !== undefined) out.isSheared = !!it.isSheared;
          if(enabled.indexOf('isBaby')!==-1 && it.isBaby !== undefined) out.isBaby = !!it.isBaby;
          if(enabled.indexOf('color')!==-1 && it.color !== undefined) out.color = it.color;
          if(enabled.indexOf('onFire')!==-1 && it.onFire !== undefined) out.onFire = !!it.onFire;
          if(enabled.indexOf('size')!==-1 && it.size !== undefined) out.size = it.size;
          // item-specific tags mapping
          if(enabled.indexOf('item_unbreakable')!==-1 && it.item_unbreakable !== undefined) out.unbreakable = !!it.item_unbreakable;
          if(enabled.indexOf('item_enchantment')!==-1 && it.item_enchantment !== undefined){
            if(Array.isArray(it.item_enchantment)) out.enchantments = it.item_enchantment.slice();
            else if(it.item_enchantment) out.enchantments = [String(it.item_enchantment)];
          }
          if(enabled.indexOf('item_name')!==-1 && it.item_name !== undefined) out.name = it.item_name;
          if(enabled.indexOf('item_canPlaceOn')!==-1 && it.item_canPlaceOn !== undefined){
            if(Array.isArray(it.item_canPlaceOn)) out.canPlaceOn = it.item_canPlaceOn.slice();
            else if(it.item_canPlaceOn) out.canPlaceOn = [String(it.item_canPlaceOn)];
          }
          if(enabled.indexOf('item_uses')!==-1 && it.item_uses !== undefined) out.uses = it.item_uses;
          if(enabled.indexOf('item_command')!==-1 && it.item_command !== undefined) out.command = it.item_command;
          if(enabled.indexOf('item_anvilUses')!==-1 && it.item_anvilUses !== undefined) out.anvilUses = it.item_anvilUses;
          return out;
        }).filter(i => i.itemId);
      }catch(e){ return store.slice(); }
    }
    , applyItemConfig: applyItemConfig
  };

})(jQuery);
