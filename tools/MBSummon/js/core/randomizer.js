(function(){
  // randimizer.js - agrega un botón de azar junto al botón de copiar y rellena cards activas
  // Requisitos: debe ejecutarse después de que el DOM y los scripts principales estén listos.

  function notifyWarn(msg){
    try{
      const text = (typeof t === 'function') ? t(msg, msg) : msg;
      if(typeof notify === 'function') notify({ type: 'warning', text: text, timeout: 1800 });
      else if(typeof notifyInfo === 'function') notifyInfo({ key: msg, timeout: 1800 });
      else alert(text);
    }catch(e){ try{ alert(msg); }catch(e){} }
  }
  function notifySuccess(msg){
    try{
      const text = (typeof t === 'function') ? t(msg, msg) : msg;
      if(typeof notify === 'function') notify({ type: 'success', text: text, timeout: 1400 });
      else if(typeof notifyInfo === 'function') notifyInfo({ key: msg, timeout: 1400 });
      else console.log('OK:', text);
    }catch(e){ console.log('OK:', msg); }
  }

  function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function pick(arr){ if(!arr||!arr.length) return null; return arr[randInt(0, arr.length-1)]; }

  function ensureElements(){
    const footer = document.querySelector('.footer-box-big');
    const copyBtn = document.querySelector('.footer-copy-btn, .footer-save-btn, .footer-box .footer-save-btn');
    return { footer, copyBtn };
  }

  function createButton(){
    // Prefer an existing static button with id `footerRandomButton`
    const existing = document.getElementById('footerRandomButton');
    if(existing) return existing;

    const { footer, copyBtn } = ensureElements();
    // Prefer to insert the button between .footer-box-big and .footer-box inside .footer
    const footerContainer = document.querySelector('.footer');
    const footerBox = document.querySelector('.footer-box');
    // If inserting into the small copy box, create a box-styled button to match visuals
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = 'Randomize active cards';
    btn.innerHTML = '<i class="fas fa-shuffle"></i>';

    // place it between the command area and the copy area when possible
    if(footerBox){
      // If footer exists but no static button, create a small icon-like box matching .footer-box
      btn.className = 'footer-box footer-random-btn';
      btn.id = 'footerRandomButton';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.cursor = 'pointer';
      footerContainer.insertBefore(btn, footerBox);
    } else if(copyBtn && copyBtn.parentNode){
      btn.id = 'footerRandomButton';
      copyBtn.parentNode.insertBefore(btn, copyBtn);
    } else if(footer){
      btn.id = 'footerRandomButton';
      footer.appendChild(btn);
    } else {
      // last resort: append to body
      btn.id = 'footerRandomButton';
      document.body.appendChild(btn);
    }
    return btn;
  }

  // Ensure button persists: observe footer parent and reinsert if removed
  function observePersistence(btn){
    try{
      // Prefer observing the footer if present (more targeted), fallback to body
      const observeTarget = document.querySelector('.footer') || document.body;
      const obs = new MutationObserver((mutations)=>{
        const exists = !!document.getElementById('footerRandomButton');
        if(!exists){
          const newBtn = createButton();
          attachHandler(newBtn);
        }
      });
      obs.observe(observeTarget, { childList: true, subtree: true });
      window._randimizerFooterObserver = obs;

      // Fallback periodic check during initial load / devtools reload quirks
      let tries = 0;
      const interval = setInterval(()=>{
        try{
          if(!document.getElementById('footerRandomButton')){
            const newBtn = createButton();
            attachHandler(newBtn);
          }
        }catch(e){}
        tries++;
        if(tries>60) clearInterval(interval);
      }, 500);
    }catch(e){ /* ignore */ }
  }

  function isMobLoaded(){
    try{ const v = (window.$ && window.$('#mobType').length) ? window.$('#mobType').val() : document.querySelector('#mobType') && document.querySelector('#mobType').value; return !!v; }catch(e){ return false; }
  }

  // Cards excluded from randomization
  const EXCLUDED = new Set(['mobName','mobAmount','positionType','skinId']);

  function isCardEnabled(cardId){
    try{ const el = document.getElementById(cardId); if(!el) return false; return !el.classList.contains('locked'); }catch(e){ return false; }
  }

  // Main randomization logic
  async function randomizeActiveCards(){
    if(!isMobLoaded()){
      notifyWarn('notifications.select_mob');
      return;
    }

    // Health: random 1-1000
    try{ const $ = window.$ || window.jQuery; if($){ $('#mobHealth').val(randInt(1,1000)).trigger('input'); } else { const h=document.getElementById('mobHealth'); if(h) { h.value = randInt(1,1000); h.dispatchEvent(new Event('input')); } } }catch(e){}

    // Default loot toggle: choose random true/false
    try{
      const disable = Math.random() < 0.5; // 50% chance to disable default drops
      // toggle semantics in this app: toggle ON means disable defaults. So set toggle according to 'disable'
      const $ = window.$ || window.jQuery;
      if($){ const $t = $('#toggleLoot'); const $i = $t.find('i'); const isOn = $i.hasClass('fa-toggle-on'); if(disable !== isOn) $t.trigger('click'); }
      else { const t = document.getElementById('toggleLoot'); if(t){ const i = t.querySelector('i'); const isOn = i && i.classList.contains('fa-toggle-on'); if(disable !== isOn){ t.click(); } } }
    }catch(e){}

    // Armor: pick random values from selects if enabled (helmet,chestplate,leggings,boots)
    try{
      // Only randomize armor if the armor card is enabled for this mob
      if(isCardEnabled('card6')){
        const armorKeys = ['helmetSelect','chestplateSelect','leggingsSelect','bootsSelect'];
      const $ = window.$ || window.jQuery;
      for(const key of armorKeys){
        const el = document.getElementById(key);
        if(!el) continue;
        if(el.disabled) continue;
        // get options (exclude empty/default)
        const opts = Array.from(el.querySelectorAll('option')).filter(o=>o.value && o.value!=='{}');
        if(!opts.length) continue;
        const pickOpt = pick(opts);
        if($) { $('#' + key).val(pickOpt.value).trigger('change'); } else { el.value = pickOpt.value; el.dispatchEvent(new Event('change')); }
      }
      }
    }catch(e){}

    // Loot Tags: choose random items (1..10) from available items.json list and replace current lootTags
    try{
      // Try to load items from window.externalTranslations keys or from json via fetch
      let available = [];
      try{
        if(window.externalTranslations){
          // find keys like external.items.<id>
          Object.keys(window.externalTranslations).forEach(k=>{ if(k.indexOf('external.items.')===0){ const id = k.split('.').pop(); available.push(id); } });
        }
      }catch(e){}
      if(available.length===0){
        // fallback: try to reuse a shared cached promise set by lootTags module to avoid repeated loads
        try{
          if(window._itemsJsonPromise){
            const data = await window._itemsJsonPromise;
            if(data && Array.isArray(data.items)) available = data.items.map(it=>it.value);
          } else if(window._itemsIndex){
            available = Object.keys(window._itemsIndex || {});
          } else {
            const resp = await fetch('data/items.json');
            if(resp.ok){ const data = await resp.json(); if(data && Array.isArray(data.items)) available = data.items.map(it=>it.value); }
          }
        }catch(e){}
      }

      if(isCardEnabled('card7') && available.length>0 && window.lootTagsStore && typeof window.lootTagsStore.clearAll === 'function' && typeof window.lootTagsStore.add === 'function'){
        // clear existing
        window.lootTagsStore.clearAll();
        const n = randInt(1, Math.min(10, available.length));
        // shuffle and pick first n
        for(let i=0;i<n;i++){
          const id = available.splice(randInt(0, available.length-1),1)[0];
          if(!id) continue;
          // create a basic loot entry (random minimal fields)
          const obj = { itemId: id, itemText: id, amount: randInt(1,64) };
          window.lootTagsStore.add(obj);
        }
      }
    }catch(e){ console.error('randimizer: loot tags', e); }

    // Other cards: equipment holding, aggressiveness, baby, charged, armor already handled — try to randomize a few common fields
    try{
      const $ = window.$ || window.jQuery;
      // holding (itemSelect)
      try{
        const select = document.getElementById('itemSelect');
        // Only change holding if card4 is enabled
        if(isCardEnabled('card4') && select && !select.disabled){
          // attempt to pick from externalTranslations keys under external.items
          let opts = Array.from(select.querySelectorAll('option')).filter(o=>o.value);
          if(opts.length>1){ const pickOpt = pick(opts.filter(o=>o.value)); if($){ $('#itemSelect').val(pickOpt.value).trigger('change'); } else { select.value = pickOpt.value; select.dispatchEvent(new Event('change')); } }
        }
      }catch(e){}

      // Ensure item amount and item data are set when randomizing to allow saving (only if card4 enabled)
      try{
        if(isCardEnabled('card4')){
          const amtEl = document.getElementById('itemAmount');
          const dataEl = document.getElementById('itemData');
          if(amtEl && (amtEl.disabled === false)){
            const val = randInt(1, Math.max(1, parseInt(amtEl.max || 64)));
            if(window.$) { $('#itemAmount').val(val).trigger('input'); } else { amtEl.value = val; amtEl.dispatchEvent(new Event('input')); }
          }
          if(dataEl){
            if(window.$) { $('#itemData').val('{}').trigger('input'); } else { dataEl.value = '{}'; dataEl.dispatchEvent(new Event('input')); }
          }
        }
      }catch(e){}

      // aggressiveness
      try {
        const agg = document.getElementById('aggressivenessSelect');
        if (isCardEnabled('cardAggressiveness') && agg && !agg.disabled) {
          const opts = Array.from(agg.querySelectorAll('option')).filter(o => o.value);
          if (opts.length) {
            const p = pick(opts);
            if (window.$) {
              $('#aggressivenessSelect').val(p.value).trigger('change');
            } else {
              agg.value = p.value;
              agg.dispatchEvent(new Event('change'));
            }
          }
        }
      } catch (e) {}
      
      // Baby: randomize baby mode (card15)
      try {
        const babyModeEl = document.getElementById('babyMode');
        const babyTimeEl = document.getElementById('babyTimeInput');
        if (isCardEnabled('card15') && babyModeEl && !babyModeEl.disabled) {
          const r = Math.random();
          if (r < 0.33) {
            if (window.$) { $('#babyMode').val('always').trigger('change'); } else { babyModeEl.value = 'always'; babyModeEl.dispatchEvent(new Event('change')); }
          } else if (r < 0.66) {
            // time mode with random seconds
            const t = randInt(1, 300);
            if (window.$) { $('#babyMode').val('time').trigger('change'); $('#babyTimeInput').val(t).trigger('input'); }
            else { babyModeEl.value = 'time'; babyModeEl.dispatchEvent(new Event('change')); if(babyTimeEl){ babyTimeEl.value = t; babyTimeEl.dispatchEvent(new Event('input')); } }
          } else {
            if (window.$) { $('#babyMode').val('').trigger('change'); } else { babyModeEl.value = ''; babyModeEl.dispatchEvent(new Event('change')); }
          }
        }
      } catch (e) {}

      // Charged (Creeper) toggle: random true/false (card18)
      try {
        const t = document.getElementById('toggleCharged');
        // Only toggle charged if card18 is enabled
        if (isCardEnabled('card18') && t) {
          const want = Math.random() < 0.5; // true means ON (charged)
          const i = t.querySelector('i');
          const isOn = i && i.classList.contains('fa-toggle-on');
          if (want !== isOn) {
            // toggle
            if (window.$) { $('#toggleCharged').trigger('click'); } else { t.click(); }
          }
        }
      } catch (e) {}
    }catch(e){}

    // Ensure UI updates (select2, triggers) have a moment to propagate before generating command
    try{
      // Wait a bit to allow asynchronous UI updates to settle (select2, triggers)
      await new Promise(resolve => setTimeout(resolve, 350));
      if(typeof updateCommand === 'function') updateCommand();
    }catch(e){}
    notifySuccess('notifications.randomize_success');
  }

  // Init on DOM ready
  function init(){
    try{
      const btn = createButton();
      attachHandler(btn);
      observePersistence(btn);
      // create mobile controls if necessary
      try{ createMobileControls(); }catch(e){}
    }catch(e){ console.error('randimizer init error', e); }
  }

  // Expose helpers so other scripts (and delegated handlers) can invoke randomize
  try{
    window._randimizerRandomize = randomizeActiveCards;
    window._randimizerEnsureButton = function(){ const b = createButton(); attachHandler(b); return b; };
  }catch(e){}

  function attachHandler(btn){
    if(!btn) return;
    // Defensive: attach listener to a clone before replacing the original node
    const handler = function(e){
      e.stopPropagation();
      e.preventDefault();
      try{
        // If another footer action is being processed, ignore this click
        if(document._footerActionInProgress) return;
        // short global lock so delegated handlers don't duplicate work
        document._footerActionInProgress = true; setTimeout(function(){ document._footerActionInProgress = false; }, 700);
        window._lastFooterAction = Date.now();
      }catch(e){}
      if(!isMobLoaded()) { notifyWarn('notifications.select_mob'); return; }
      randomizeActiveCards();
    };

    const clone = btn.cloneNode(true);
    try{ clone.addEventListener('click', handler); }catch(e){}
    if(btn.parentNode) btn.parentNode.replaceChild(clone, btn);

    const newBtn = document.getElementById('footerRandomButton') || clone;
    try{ newBtn.style.display = 'flex'; newBtn.style.visibility = 'visible'; newBtn.style.opacity = '1'; }catch(e){}

    // Delegate as a fallback in case the node is replaced by other scripts later
    if(!document._randimizerDelegateInstalled){
      document.addEventListener('click', function(ev){
        const target = ev.target && (ev.target.id === 'footerRandomButton' || (ev.target.closest && ev.target.closest('#footerRandomButton')));
        if(target){
          ev.stopPropagation();
          ev.preventDefault();
          if(!isMobLoaded()) { notifyWarn('notifications.select_mob'); return; }
          randomizeActiveCards();
        }
      }, true);
      document._randimizerDelegateInstalled = true;
    }
  }

  // Ensure init runs also on full window load
  try{ window.addEventListener('load', function(){ try{ init(); }catch(e){} }); }catch(e){}

  // Mobile controls: creates a toggle button that reveals copy + random on small screens
  function createMobileControls(){
    const footer = document.querySelector('.footer');
    if(!footer) return;
    if(document.getElementById('footerMobileToggle')) return;

    const toggle = document.createElement('div');
    toggle.id = 'footerMobileToggle';
    toggle.className = 'footer-box footer-mobile-toggle';
    toggle.title = (typeof t === 'function') ? t('footer.saveTitle','Actions') : 'Actions';
    // default icon: 4-squares grid (fa-th)
    toggle.innerHTML = '<i class="fas fa-border-all"></i>';

    const actions = document.createElement('div');
    actions.id = 'footerMobileActions';
    actions.className = 'mobile-actions';
    actions.innerHTML = `<div class="mobile-action" id="mobileRandomBtn"><i class="fas fa-shuffle"></i></div>\n      <div class="mobile-action" id="mobileCopyBtn"><i class="fas fa-copy"></i></div>\n    `;

    // Insert the toggle into the footer and make actions a child of the toggle
    // so actions can be absolutely positioned relative to the toggle (floating)
    const copyBtn = document.getElementById('footerCopyButton');
    if (copyBtn && copyBtn.parentNode) {
      copyBtn.parentNode.insertBefore(toggle, copyBtn);
    } else {
      footer.appendChild(toggle);
    }
    // Attach actions inside the toggle so they float above it
    toggle.appendChild(actions);
    // Set a CSS variable so mobile actions can match the toggle size
    function updateToggleSize(){
      try{
        const rect = toggle.getBoundingClientRect();
        const size = Math.round(Math.max(rect.width, rect.height));
        toggle.style.setProperty('--toggle-size', size + 'px');
      }catch(e){}
    }
    updateToggleSize();
    // update on resize/orientation change
    window.addEventListener('resize', updateToggleSize);

    toggle.addEventListener('click', function(e){
      e.stopPropagation();
      const isShown = actions.classList.toggle('show');
      updateToggleSize();
      // toggle icon: show down arrow when opened, 4-squares when closed
      const ico = toggle.querySelector('i');
      if(ico){ ico.className = isShown ? 'fas fa-chevron-down' : 'fas fa-border-all'; }
    });

    document.addEventListener('click', function(e){
      if(!e.target.closest || (!e.target.closest('#footerMobileActions') && !e.target.closest('#footerMobileToggle'))){
        if(actions.classList.contains('show')){
          actions.classList.remove('show');
          const ico = toggle.querySelector('i'); if(ico) ico.className = 'fas fa-border-all';
        }
      }
    }, true);

    document.getElementById('mobileRandomBtn').addEventListener('click', function(){ const rb = document.getElementById('footerRandomButton'); if(rb) rb.click(); actions.classList.remove('show'); const ico = toggle.querySelector('i'); if(ico) ico.className = 'fas fa-border-all'; });
    document.getElementById('mobileCopyBtn').addEventListener('click', function(){ const cb = document.getElementById('footerCopyButton'); if(cb) cb.click(); actions.classList.remove('show'); const ico = toggle.querySelector('i'); if(ico) ico.className = 'fas fa-border-all'; });
  }

  if(document.readyState === 'complete' || document.readyState === 'interactive') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
