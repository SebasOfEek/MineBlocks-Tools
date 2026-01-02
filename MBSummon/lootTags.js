// lootTags.js — independent module to manage Loot Tags modal
(function($){
  const STORAGE_KEY = 'lootTagsStore';
  let store = [];
  let selectedId = null;
  let pendingDeleteId = null;
  let cardsConfig = null;
  let othersConfig = null;

  function uid() {
    return 'lt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
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
    // Mapping by order in DOM (matches HTML structure)
    const data = {};
    const $sel = $modal.find('#sidebarItemSelect');
    data.itemId = ($sel.val() || '').toString();
    data.itemText = ($sel.find('option:selected').text() || '').toString();
    data.image = ($sel.find('option:selected').data('image')) || '';

    // Safely get by index (if markup changes this may need updating)
    const getRaw = i => $(items.get(i)).find('input, select').first().val();

    // Numeric fields: return null when empty to allow explicit clearing on update
    const parseNum = v => {
      if (v === undefined || v === null || v === '') return null;
      // remove illegal chars just in case
      const cleaned = String(v).replace(/[^0-9.]/g, '');
      if (cleaned === '') return null;
      const n = cleaned.indexOf('.') === -1 ? parseInt(cleaned, 10) : parseFloat(cleaned);
      return isNaN(n) ? null : n;
    };

    // Amount rules: default to 1 when empty, disallow decimals (force integer)
    let amountRaw = parseNum(getRaw(0));
    if (amountRaw === null) amountRaw = 1;
    else amountRaw = Math.floor(amountRaw);
    data.amount = amountRaw;
    const bonusRaw = parseNum(getRaw(1));
    data.bonus = bonusRaw;
    const lootBonusRaw = parseNum(getRaw(2));
    data.lootBonus = lootBonusRaw;
    const chanceRaw = parseNum(getRaw(3));
    data.chance = chanceRaw;

    // toggles: always include explicit boolean so updates can disable
    const onFire = $(items.get(4)).find('.toggle-button i').hasClass('fa-toggle-on');
    data.onFire = !!onFire;

    const sizeRaw = parseNum(getRaw(5));
    data.size = sizeRaw;

    const isBaby = $(items.get(6)).find('.toggle-button i').hasClass('fa-toggle-on');
    data.isBaby = !!isBaby;

    const variantRaw = $(items.get(7)).find('select').val();
    data.variant = (variantRaw !== undefined && variantRaw !== '') ? variantRaw : null;

    const isSheared = $(items.get(8)).find('.toggle-button i').hasClass('fa-toggle-on');
    data.isSheared = !!isSheared;

    const colorRaw = getRaw(9);
    data.color = (colorRaw !== undefined && colorRaw !== '') ? colorRaw : null;

    return data;
  }

  function setFormData(obj){
    const $modal = $('#lootTagsPopup');
    const $container = $modal.find('.loot-tags-container');
    const items = $container.find('.loot-tags-item');
    const setInput = (i, val) => $(items.get(i)).find('input, select').first().val(val).trigger('input');

    if(obj.itemId) $modal.find('#sidebarItemSelect').val(obj.itemId).trigger('change');
    if (obj.amount !== undefined) setInput(0, obj.amount); else setInput(0, '');
    if (obj.bonus !== undefined) setInput(1, obj.bonus); else setInput(1, '');
    if (obj.lootBonus !== undefined) setInput(2, obj.lootBonus); else setInput(2, '');
    if (obj.chance !== undefined) setInput(3, obj.chance); else setInput(3, '');
    // toggles
    const toggleSet = (index, enabled) => {
      const $btn = $(items.get(index)).find('.toggle-button');
      if(!$btn.length) return;
      const $i = $btn.find('i');
      const $span = $btn.find('span');
      if(enabled){ $i.removeClass('fa-toggle-off').addClass('fa-toggle-on'); $span.text('Sí'); }
      else { $i.removeClass('fa-toggle-on').addClass('fa-toggle-off'); $span.text('No'); }
    };
    toggleSet(4, !!obj.onFire);
    if (obj.size !== undefined) setInput(5, obj.size); else setInput(5, '');
    toggleSet(6, !!obj.isBaby);
    if(obj.variant !== undefined) $(items.get(7)).find('select').val(obj.variant).trigger('change'); else $(items.get(7)).find('select').val('').trigger('change');
    toggleSet(8, !!obj.isSheared);
    if (obj.color !== undefined) $(items.get(9)).find('select').val(obj.color).trigger('change'); else $(items.get(9)).find('select').val('').trigger('change');
  }

  function clearForm(){
    const $modal = $('#lootTagsPopup');
    const $container = $modal.find('.loot-tags-container');
    $container.find('input').val('');
    $container.find('select').val('').trigger('change');
    $container.find('.toggle-button').each(function(){
      const $i = $(this).find('i');
      $(this).find('span').text('No');
      $i.removeClass('fa-toggle-on').addClass('fa-toggle-off');
    });
    $modal.find('#sidebarItemSelect').val('').trigger('change');
    // clear selection/editing visuals
    selectedId = null;
    $('.saved-loot-item').removeClass('editing selected').css('boxShadow','');
    $('#lootDeleteModal').removeClass('show');
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
      img.src = item.image || '';
      img.alt = item.itemText || item.itemId || '';
      img.style.maxWidth = '32px';
      img.style.maxHeight = '32px';
      img.style.display = 'block';
      img.style.borderRadius = '6px';

      imgWrap.appendChild(img);
      left.appendChild(imgWrap);

      const title = document.createElement('div');
      title.className = 'saved-title';
      title.textContent = (item.itemText || item.itemId || '');
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
      // clear editing visuals/state
      $item.removeClass('editing');
      $('.saved-loot-item').removeClass('selected').css('boxShadow','');
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

    // ensure editing visual removed if user clicks elsewhere
    $(document).on('click.loottagsCancel', function(e){
      if(!$(e.target).closest('.saved-loot-item, .loot-tags-window').length){
        $('.saved-loot-item').removeClass('editing');
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
    $('.saved-loot-item').removeClass('selected').css('boxShadow','');
    const $el = $('.saved-loot-item[data-id="'+id+'"]').first();
    $el.addClass('selected').css('boxShadow','0 6px 18px rgba(0,0,0,0.06)');
  }

  function editSaved(id){
    const item = store.find(s => s.id === id);
    if(!item) return;
    // show form and load data
    $('.loot-tags-window').removeClass('loot-compact');
    setFormData(item);
    selectedId = id;
    // ensure mob-specific rules applied when editing
    applyMobLootConfig($('#mobType').val() || '');
    // allow the current item's option to remain selectable while editing
    try { lockSidebarOptions(item.itemId); } catch(e){}
  }

  // Apply mob-specific config to enable/disable inputs inside the Loot Tags modal
  function applyMobLootConfig(mobKey){
    try{
      const $modal = $('#lootTagsPopup');
      const $container = $modal.find('.loot-tags-container');
      const items = $container.find('.loot-tags-item');
      // default: enable all
      const allFields = ['amount','bonus','lootBonus','chance','onFire','size','isBaby','variant','isSheared','color'];
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

      allFields.forEach(name => {
        const i = idxMap[name];
        const $el = $(items.get(i));
        if(!$el || !$el.length) return;
        const shouldEnable = enabled.indexOf(name) !== -1;
        // hide inputs not enabled (do not render them)
        if(!shouldEnable) $el.hide(); else $el.show();
        // ensure inputs/selects toggles enabled when visible
        $el.find('input, select').prop('disabled', !shouldEnable);
        $el.find('.toggle-button').each(function(){
          if(!shouldEnable){ $(this).addClass('disabled').prop('disabled', true).css('pointer-events','none'); }
          else { $(this).removeClass('disabled').prop('disabled', false).css('pointer-events','auto'); }
        });
      });
    }catch(e){ /* ignore */ }
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
      if($i.hasClass('fa-toggle-on')){ $i.removeClass('fa-toggle-on').addClass('fa-toggle-off'); $span.text('No'); }
      else { $i.removeClass('fa-toggle-off').addClass('fa-toggle-on'); $span.text('Sí'); }
    });

    // Sanitize numeric inputs inside loot-tags-container: remove +, - and any non-numeric chars except dot
    // Keydown: prevent plus/minus and any non-numeric keys except navigation, backspace, dot
    $modal.off('keydown.loottags', '.loot-tags-container input, .loot-tags-container select').on('keydown.loottags', '.loot-tags-container input, .loot-tags-container select', function(e){
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

    // Paste: sanitize pasted content to only digits and at most one dot
    $modal.off('paste.loottags', '.loot-tags-container input').on('paste.loottags', '.loot-tags-container input', function(e){
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

    // Input: final sanitize to remove any stray characters (keeps digits and single dot)
    $modal.find('.loot-tags-container').off('input.loottagsNumeric', 'input').on('input.loottagsNumeric', 'input', function(){
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
    $.getJSON('json/cards_config.json').done(function(cfg){
      try { cardsConfig = cfg || {}; } catch(e){ cardsConfig = null; }
      // Re-apply mob-specific rules now that config is available
      try { const cur = $('#mobType').val() || ''; applyMobLootConfig(cur); lockSidebarOptions(); } catch(e){}
    }).fail(function(){ cardsConfig = null; });
    // load others.json for colors/variants
    $.getJSON('json/others.json').done(function(cfg){
      try { othersConfig = cfg || {}; } catch(e){ othersConfig = null; }
      try {
        // populate color select
        const $color = $('#lootColorSelect');
        if($color && $color.length && othersConfig && Array.isArray(othersConfig.colors)){
          $color.empty();
          $color.append('<option value="">--Seleccionar--</option>');
          othersConfig.colors.forEach(c => {
            const opt = $('<option>').attr('value', c.value || '').attr('data-image', c.image || '').text(c.text || c.value || '');
            $color.append(opt);
          });
          try{ $color.select2({templateResult: formatOption, templateSelection: formatSelection, width: '200px', escapeMarkup: function(m){return m;}, containerCssClass: 'select2-color-container'}); }catch(e){}
        }
        // populate variant select
        const $variant = $('#lootVariantSelect');
        if($variant && $variant.length && othersConfig && Array.isArray(othersConfig.variant)){
          $variant.empty();
          othersConfig.variant.forEach(v => {
            const opt = $('<option>').attr('value', v.value || '').attr('data-image', v.image || '').text(v.text || v.value || '');
            $variant.append(opt);
          });
          try{ $variant.select2({templateResult: formatOption, templateSelection: formatSelection, width: '100px', escapeMarkup: function(m){return m;}, containerCssClass: 'select2-variant-container'}); }catch(e){}
        }
      }catch(e){ }
    }).fail(function(){ othersConfig = null; });
    renderSavedList();
  }

  $(document).ready(function(){
    // initialize when DOM ready
    init();
  });

  // Expose API for testing or external usage
  window.lootTagsStore = {
    init, loadStore, saveStore, getAll: () => store.slice(), add: addLootTag, update: updateLootTag, delete: deleteLootTag,
    clearAll: clearAllLootTags,
    // Return items mapped for command generation, respecting cards_config.json enabled fields for the given mob
    getCommandItems: function(mobKey){
      const items = store.slice();
      try{
        const allFields = ['amount','bonus','lootBonus','chance','onFire','size','isBaby','variant','isSheared','color'];
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
          return out;
        }).filter(i => i.itemId);
      }catch(e){ return store.slice(); }
    }
  };

})(jQuery);
