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
  return $(
    `<span><img src="${img}" style="width: 25px; height: 25px; vertical-align: middle; margin-right: 10px; border-radius: 5px; box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);" />${display}</span>`
  );
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
  return display;
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

// Función reutilizable global que limpia el formulario. Si preserveMob=true,
// no tocará el select `#mobType` (útil al cambiar de mob y querer mantener la selección).
function clearAllFormData(preserveMob = false) {
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

  // Resetear estados de botones
  $(".popup-button")
    .css({
      "background-color": "#fca5a5",
      color: "#991b1b",
    })
    .find("i")
    .removeClass("fa-check saved")
    .addClass("fa-times not-saved");

  // Bloquear las cards
  if (typeof lockAllCards === 'function') lockAllCards();

  // Ir a la primera página de cards (si existe)
  if (typeof changePage === 'function') changePage(1);

  // Actualizar el comando
  if (typeof updateCommand === 'function') updateCommand();
}

$(document).ready(function () {
  $.getJSON(
    "https://raw.githubusercontent.com/SebasOfEek/MineBlocks-Tools/main/json/mobs.json",
    function (data) {
      const mobType = $("#mobType");
      mobType.empty();
      mobType.append('<option value="" data-i18n="common.select">--Seleccionar--</option>');
      data.mobs.forEach(function (mob) {
        const option = $("<option>")
          .val(mob.value)
          .text(mob.text)
          .attr("data-image", mob.image)
          .attr("data-i18n", `external.mobs.${mob.value}`)
          .attr("data-default-text", mob.text);
        mobType.append(option);
      });

      mobType
        .select2({
          templateResult: formatOption,
          templateSelection: formatSelection,
        });

      // Cuando se selecciona un mob con select2, limpiar el formulario usando
      // la misma lógica que el botón Limpiar (preservando la selección)
      mobType.on("select2:select", function (e) {
        const newVal = e && e.params && e.params.data ? e.params.data.id : $(this).val();
        clearAllFormData(true);

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
  $(".footer-box").on("click", function () {
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
  });
});

let isSaved = false;
const updateStatus = (saved) => {
  const statusButton = $("#statusButton");
  const statusIcon = statusButton.find("i");

  statusIcon
    .removeClass("fa-times fa-check not-saved saved")
    .addClass(saved ? "fa-check saved" : "fa-times not-saved");

  statusButton
    .css("background-color", saved ? "#86efac" : "#fca5a5")
    .css("color", saved ? "#166534" : "#991b1b");

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

    // Actualizar estilos directamente
    statusButton
      .css("background-color", saved ? "#86efac" : "#fca5a5")
      .css("color", saved ? "#166534" : "#991b1b");

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

    statusButton
      .css("background-color", saved ? "#86efac" : "#fca5a5")
      .css("color", saved ? "#166534" : "#991b1b");

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
    "https://raw.githubusercontent.com/SebasOfEek/MineBlocks-Tools/main/json/items.json",
    function (data) {
      const itemSelect = $("#itemSelect");

      // ensure externalTranslations map exists
      window.externalTranslations = window.externalTranslations || {};
      const currentSavedLang = localStorage.getItem('language') || 'es';

      data.items.forEach((item) => {
        const key = `external.items.${item.value}`;
        if (item.translations) {
          window.externalTranslations[key] = item.translations;
        } else {
          window.externalTranslations[key] = { en: item.text, es: item.text };
        }

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

    statusButton
      .css("background-color", finalSaved ? "#86efac" : "#fca5a5")
      .css("color", finalSaved ? "#166534" : "#991b1b");

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

    statusButton
      .css("background-color", saved ? "#86efac" : "#fca5a5")
      .css("color", saved ? "#166534" : "#991b1b");

    isHealthSaved = saved;
  };

  const saveHealth = () => {
    const health = $("#mobHealth").val().trim();
    if (health && !isNaN(health)) {
      const numHealth = parseInt(health);
      if (numHealth > 0 && numHealth <= 100) {
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
      if (value > 100) {
        this.value = 100;
        value = 100;
      }
      // Actualizar estado cuando hay un valor válido
      const isValid = value > 0 && value <= 100;
      updateHealthStatus(isValid);
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

  const updateLootStatus = (saved) => {
    const statusButton = $("#lootStatusButton");
    const statusIcon = statusButton.find("i");

    statusIcon
      .removeClass("fa-times fa-check")
      .addClass(saved ? "fa-check" : "fa-times");

    statusButton
      .css("background-color", saved ? "#86efac" : "#fca5a5")
      .css("color", saved ? "#166534" : "#991b1b");

    isLootSaved = saved;
  };

  $("#toggleLoot").on("click", function () {
    isLootEnabled = !isLootEnabled;
    $(this).find("i").toggleClass("fa-toggle-off fa-toggle-on");
    const enabledText = t('common.enabled', 'Activado');
    const disabledText = t('common.disabled', 'Desactivado');
    $(this).find("span").text(isLootEnabled ? enabledText : disabledText);
    updateLootStatus(false);
  });

  $("#lootSaveButton").on("click", function () {
    updateLootStatus(true);
    console.log("Estado del loot guardado:", isLootEnabled);
  });
});

$(document).ready(function () {
  $.getJSON(
    "https://raw.githubusercontent.com/SebasOfEek/MineBlocks-Tools/main/json/armor.json",
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
              if (item.translations) {
                window.externalTranslations[key] = item.translations;
              } else {
                window.externalTranslations[key] = { en: item.text, es: item.text };
              }

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

          statusButton
            .css("background-color", saved ? "#86efac" : "#fca5a5")
            .css("color", saved ? "#166534" : "#991b1b");

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

    statusButton
      .css("background-color", saved ? "#86efac" : "#fca5a5")
      .css("color", saved ? "#166534" : "#991b1b");

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
  function loadLanguage(lang) {
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
            if ($element.data('i18n-attr')) {
              // Si hay un atributo específico para traducir (como placeholder, title, etc)
              const attr = $element.data('i18n-attr');
              $element.attr(attr, value);
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
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        console.error("Error al cargar el idioma:", textStatus, errorThrown);
      });
  }

  $(".language-btn").on("click", function () {
    $(".language-btn").removeClass("active");
    $(this).addClass("active");
    const lang = $(this).data("lang");
    localStorage.setItem("language", lang);
    loadLanguage(lang);
  });

  // Corrección aquí: typo en savedLanguage
  const savedLanguage = localStorage.getItem("language") || "es";
  $(".language-btn").removeClass("active");
  $(`.language-btn[data-lang="${savedLanguage}"]`).addClass("active");
  // Cargar idioma guardado al iniciar
  if (typeof loadLanguage === 'function') loadLanguage(savedLanguage);

  $(".popup-close, .popup-overlay").on("click", function (e) {
    if (e.target === this) {
      $(this).closest(".popup-overlay").removeClass("show");
    }
  });
});

// Nueva función para cargar la configuración de bloqueo de tarjetas desde un solo archivo JSON centralizado
function loadMobLockConfig(mobType) {
  if (!mobType) {
    lockAllCards();
    return;
  }

  const configUrl = "json/cards_config.json";

  $.getJSON(configUrl)
    .done(function (allConfigs) {
      const config = allConfigs[mobType];
      if (config && Array.isArray(config.lockedCards)) {
        applyCardLocks(config.lockedCards);
      } else {
        lockAllCards();
      }
    })
    .fail(function () {
      lockAllCards();
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
      if ($(this).hasClass("locked") || $(`#${cardId}`).hasClass("locked")) {
        e.preventDefault();
        e.stopPropagation();
        
        // Activar animación de bloqueo
        triggerLockedCardAnimation(cardId);
        
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
      if ($(`#${cardId}`).hasClass("locked")) {
        e.preventDefault();
        e.stopPropagation();
        
        // Activar animación de bloqueo
        triggerLockedCardAnimation(cardId);
        
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
    "https://raw.githubusercontent.com/SebasOfEek/MineBlocks-Tools/main/json/items.json",
    function (data) {
      const sidebarItemSelect = $("#sidebarItemSelect");
      
      // Limpiar opciones existentes
      sidebarItemSelect.empty();
      sidebarItemSelect.append('<option value="">Seleccionar item</option>');
      
      // Agregar items del JSON
      data.items.forEach((item) => {
        const option = $("<option>")
          .val(item.value)
          .text(item.text)
          .attr("data-image", item.image);
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
                $('<img src="' + img + '" style="width:20px;height:20px;vertical-align:middle;margin-right:8px;" />')
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
          placeholder: "Seleccionar item",
          allowClear: false,
          closeOnSelect: true,
          minimumResultsForSearch: 5
        });
        
        // Asegurar que el select2 esté por encima de otros elementos
        $("#lootTagsPopup .select2-container").css('z-index', 9999);
        
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
        }
      });
    }
  );

  // Manejar botones toggle en el modal de Loot Tags
  $("#lootTagsPopup .toggle-button").on("click", function () {
    const $icon = $(this).find("i");
    const $span = $(this).find("span");
    const yesText = t('common.yes', 'Sí');
    const noText = t('common.no', 'No');

    if ($icon.hasClass("fa-toggle-off")) {
      $icon.removeClass("fa-toggle-off").addClass("fa-toggle-on");
      $span.text(yesText);
    } else {
      $icon.removeClass("fa-toggle-on").addClass("fa-toggle-off");
      $span.text(noText);
    }
  });

  // Container para los items guardados
  if (!$('.saved-items-container').length) {
    $('.loot-tags-header').before('<div class="saved-items-container" style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:10px;"></div>');
  }

  // Función para limpiar todos los inputs
  function clearInputs() {
    $('#itemQuantity, #itemBonus, #lootBonus, #itemChance, #itemDamage, #itemVariant, #itemColor').val('');
    $('#itemOnFire, #isBaby, #isSheared').prop('checked', false);
  }

  // Función para cargar datos en los inputs
  function loadItemData(itemData) {
    $('#itemQuantity').val(itemData.cantidad || '');
    $('#itemBonus').val(itemData.bonus || '');
    $('#lootBonus').val(itemData.lootBonus || '');
    $('#itemChance').val(itemData.oportunidad || '');
    $('#itemDamage').val(itemData.danio || '');
    $('#itemVariant').val(itemData.variante || '');
    $('#itemColor').val(itemData.color || '');
    $('#itemOnFire').prop('checked', itemData.enLlamas || false);
    $('#isBaby').prop('checked', itemData.esBebe || false);
    $('#isSheared').prop('checked', itemData.esquilada || false);
  }

  // Click en item guardado para cargar sus datos
  $(document).on('click', '.saved-item', function() {
    const itemData = JSON.parse($(this).attr('data-item'));
    loadItemData(itemData);
    // Seleccionar el item en el select2
    $('#sidebarItemSelect').val(itemData.value).trigger('change');
  });

  // Manejar botones de acción
  $("#lootTagsPopup .sidebar-button.save").on("click", function () {
    const selectedOption = $('#sidebarItemSelect').find('option:selected');
    const imageUrl = selectedOption.data('image');
    const itemValue = selectedOption.val();
    
    if (imageUrl && itemValue) {
      // Verificar si el item ya está guardado
      if ($('.saved-item[data-value="' + itemValue + '"]').length > 0) {
        return; // No permitir guardar el mismo item dos veces
      }

      // Recopilar todos los datos
      const itemData = {
        value: itemValue,
        image: imageUrl,
        cantidad: $('#itemQuantity').val(),
        bonus: $('#itemBonus').val(),
        lootBonus: $('#lootBonus').val(),
        oportunidad: $('#itemChance').val(),
        enLlamas: $('#itemOnFire').is(':checked'),
        danio: $('#itemDamage').val(),
        esBebe: $('#isBaby').is(':checked'),
        variante: $('#itemVariant').val(),
        esquilada: $('#isSheared').is(':checked'),
        color: $('#itemColor').val()
      };

      // Crear elemento para el item guardado
      const $savedItem = $('<div>')
        .addClass('saved-item')
        .css({
          width: '32px',
          height: '32px',
          borderRadius: '5px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          position: 'relative'
        })
        .attr('data-value', itemValue)
        .attr('data-item', JSON.stringify(itemData));

      const $img = $('<img>')
        .attr('src', imageUrl)
        .css({
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        });

      // Agregar indicador si hay datos adicionales
      if (Object.values(itemData).some(val => val && val !== itemValue && val !== imageUrl)) {
        const $indicator = $('<div>')
          .css({
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#4CAF50',
            border: '1px solid white'
          });
        $savedItem.append($indicator);
      }

      // Agregar tooltip con los datos
      $savedItem.attr('title', 'Click para ver detalles');
      
      $savedItem.append($img);
      $('.saved-items-container').append($savedItem);
      
      // Limpiar selección y todos los inputs
      $('#sidebarItemSelect').val(null).trigger('change');
      clearInputs();
    }
  });

  $("#lootTagsPopup .sidebar-button.delete").on("click", function () {
    $('.saved-items-container').empty();
  });

  $("#lootTagsPopup .sidebar-button:not(.save):not(.delete)").on("click", function () {
    console.log("Editar item en Loot Tags");
    // Aquí puedes agregar la lógica para editar
  });
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

    // Solo añadir atributos si están configurados
    let attributes = [];

    const name = $("#mobName").val() || "";
    if (name) attributes.push(`name:"${name}"`);

    const health = $("#mobHealth").val() || "";
    if (health) attributes.push(`health:${health}`);

    const aggro = $("#aggressivenessSelect").val() || "";
    if (aggro) attributes.push(`aggro:"${aggro}"`);

    const armorPieces = ["helmet", "chestplate", "leggings", "boots"].map(
      (type) => {
        const value = $(`#${type}Select`).val() || "{}";
        return value === "{}" ? value : `"${value}"`;
      }
    );

    if (armorPieces.some((piece) => piece !== "{}")) {
      attributes.push(`armor:[${armorPieces.join(", ")}]`);
    }

    const holding = $("#itemSelect").val() || "";
    if (holding) attributes.push(`holding:"${holding}"`);

  // Skin ID (sin comillas, solo número) - si existe, agregar como skin:NNN
  const skin = $("#skinId").val() || "";
  if (skin) attributes.push(`skin:${skin}`);

  // Creeper cargado (charged) - toggle similar a loot
  const charged = $("#toggleCharged").find("i").hasClass("fa-toggle-on");
  if (charged) attributes.push("charged:1");

  const lootEnabled = $("#toggleLoot").find("i").hasClass("fa-toggle-on");
  if (lootEnabled) attributes.push("defaultDrops:true");

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
}

$(document).ready(function () {
  // Eventos para campos de entrada
  $(
    "#mobType, #mobName, #mobHealth, #itemSelect, #mobAmount, #aggressivenessSelect, #skinId"
    ).on("input change", updateCommand);
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
  });

  // Si se recarga la página, mantener bloqueado
  // ...existing code...
});
$(document).ready(function () {
  $.getJSON(
    "https://raw.githubusercontent.com/SebasOfEek/MineBlocks-Tools/main/json/items.json",
    function (data) {
      const sidebarItemSelect = $("#sidebarItemSelect");
      sidebarItemSelect.empty();
      sidebarItemSelect.append('<option value="">Seleccionar item</option>');
      data.items.forEach((item) => {
        const option = $("<option>")
          .val(item.value)
          .text(item.text)
          .attr("data-image", item.image);
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

    // Resetear estados de botones
    $(".popup-button")
      .css({
        "background-color": "#fca5a5",
        color: "#991b1b",
      })
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
  });

  // Si se recarga la página, mantener bloqueado
  // ...existing code...
});

$(document).ready(function () {
  // Guardados modal: abrir/cerrar
  $("#savedButton").on("click", function (e) {
    e.stopPropagation();
    $("#savedModal").addClass("show");
  });

  // Cerrar modal al hacer click en el fondo o en el botón de cerrar
  $("#savedModal .popup-close, #savedModal").on("click", function (e) {
    if (e.target === this) {
      $("#savedModal").removeClass("show");
    }
  });

  // Prevenir cierre al hacer click dentro de la ventana del modal
  $(".saved-modal-window").on("click", function (e) {
    e.stopPropagation();
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
    statusButton.css("background-color", saved ? "#86efac" : "#fca5a5").css("color", saved ? "#166534" : "#991b1b");
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
    statusButton.css("background-color", isOn ? "#86efac" : "#fca5a5").css("color", isOn ? "#166534" : "#991b1b");

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
    lootEnabled: $("#toggleLoot").find("i").hasClass("fa-toggle-on"),
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
  const lootEnabled = $("#toggleLoot").find("i").hasClass("fa-toggle-on");
  if (lootEnabled) {
    data.card5 = { lootEnabled: lootEnabled };
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
    alert("No se puede guardar: Seleccione un mob y configure sus propiedades");
    console.log("No se puede guardar: falta mobType o comando");
    return false;
  }

  // Validar datos del item si existe
  if (cards.card4) {
    const { itemSelect, itemAmount, itemData } = cards.card4;
    console.log("Validando datos del item:", cards.card4);
    
    if (itemSelect && (!itemAmount || !itemData)) {
      alert("Complete todos los datos del item (cantidad y datos) antes de guardar");
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
    
    // Mostrar un mensaje de éxito
    alert("¡Comando guardado exitosamente!");
    return true;
  } else {
    alert("Este comando ya está guardado");
    console.log("El comando ya existe en los guardados");
    return false;
  }
}

// Editar: cargar todos los datos guardados de las cards al formulario

// Renderizar la lista de guardados en el modal (muestra datos de las cards)
function renderSavedCommands() {
  const saved = getSavedCommands();
  const $content = $(".saved-modal-content");
  $content.empty();
  if (saved.length === 0) {
    $content.append("<p>No hay guardados aún.</p>");
    return;
  }
  const $list = $("<ul>").css({padding:0, margin:0, listStyle:"none"});
  saved.forEach((item, idx) => {
    const $li = $("<li>").css({
      background: "#eee",
      margin: "0 0 10px 0",
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
          .css({
            width: "38px",
            height: "38px",
            borderRadius: "8px",
            marginRight: "12px",
            objectFit: "cover",
            boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
          })
      : $("<span>").css({width:"38px",height:"38px",display:"inline-block"});

    // Comando
    const $cmd = $("<span>")
      .css({fontFamily:"Consolas,monospace", fontSize:"1.1em", flex: "1 1 auto", wordBreak: "break-all"})
      .text(item.command);

    // Botones
    const $btns = $("<div>").css({display:"flex", gap:"7px", alignItems:"center"});

    // Copiar
    const $copy = $("<button>")
      .html('<i class="fas fa-copy"></i>')
      .css({
        background: "#7dbbff",
        color: "#166534",
        border: "none",
        borderRadius: "8px",
        padding: "6px 10px",
        cursor: "pointer"
      })
      .attr("title", "Copiar comando")
      .on("click", function(e) {
        e.stopPropagation();
        copyTextToClipboard(item.command);
      });

    // Editar
    const $edit = $("<button>")
      .html('<i class="fas fa-edit"></i>')
      .css({
        background: "#facc15",
        color: "#7c5700",
        border: "none",
        borderRadius: "8px",
        padding: "6px 10px",
        cursor: "pointer"
      })
      .attr("title", "Editar este guardado")
      .on("click", function(e) {
        e.stopPropagation();
        loadSavedCommandToForm(item); // <-- Esta es la función correcta
        $("#savedModal").removeClass("show");
      });

    // Eliminar
    const $del = $("<button>")
      .html('<i class="fas fa-trash"></i>')
      .css({
        background: "#fca5a5",
        color: "#991b1b",
        border: "none",
        borderRadius: "8px",
        padding: "6px 10px",
        cursor: "pointer"
      })
      .attr("title", "Eliminar")
      .on("click", function(e) {
        e.stopPropagation();
        removeSavedCommand(idx);
      });

    $btns.append($copy, $edit, $del);

    // Mostrar resumen de datos de cards (opcional)
    const $cardsSummary = $("<div>").css({fontSize:"0.8em", color:"#666", marginTop:"5px", maxWidth:"300px"});
    if (item.cards && Object.keys(item.cards).length > 0) {
      const summaryParts = [];
      
      if (item.cards.card1 && item.cards.card1.mobName) {
        summaryParts.push(`Nombre: ${item.cards.card1.mobName}`);
      }
      if (item.cards.card2 && item.cards.card2.mobAmount) {
        summaryParts.push(`Cantidad: ${item.cards.card2.mobAmount}`);
      }
      if (item.cards.card9 && item.cards.card9.mobHealth) {
        summaryParts.push(`Vida: ${item.cards.card9.mobHealth}`);
      }
      if (item.cards.card4 && item.cards.card4.itemSelect) {
        summaryParts.push(`Item: ${item.cards.card4.itemSelect}`);
      }
      if (item.cards.cardAggressiveness && item.cards.cardAggressiveness.aggressivenessSelect) {
        summaryParts.push(`Agresividad: ${item.cards.cardAggressiveness.aggressivenessSelect}`);
      }
      
      if (summaryParts.length > 0) {
        $cardsSummary.text(summaryParts.join(" | "));
      }
    }

    $li.append($img, $cmd, $cardsSummary, $btns);
    $list.append($li);
  });
  $content.append($list);
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
function loadSavedCommandToForm(item) {
  console.log("Cargando datos guardados:", item);
  
  // Primero limpiar todo el formulario para dejar un estado limpio
  if (typeof clearAllFormData === 'function') clearAllFormData(false);

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
  
  // Cargar configuración de bloqueo para el mob
  loadMobLockConfig(item.mobType);
  
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
      const loot = cards.card5.lootEnabled;
      const $lootIcon = $("#toggleLoot").find("i");
      const isCurrentlyOn = $lootIcon.hasClass("fa-toggle-on");
      
      if (loot && !isCurrentlyOn) {
        $("#toggleLoot").trigger("click");
        console.log("Activado loot");
      } else if (!loot && isCurrentlyOn) {
        $("#toggleLoot").trigger("click");
        console.log("Desactivado loot");
      }
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
    
    // Card 9 - Vida
    if (cards.card9 && cards.card9.mobHealth) {
      $("#mobHealth").val(cards.card9.mobHealth).trigger("input");
      console.log("Cargada vida:", cards.card9.mobHealth);
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
      if (isCurrentSaved()) {
        $("#footerSaveButton").addClass("saved");
      } else {
        $("#footerSaveButton").removeClass("saved");
      }
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

  // Guardado del comando desde el botón en el footer
  $("#footerSaveButton").off("click").on("click", function () {
    const $btn = $(this);
    const mobType = $("#mobType").val();
    const command = getCurrentCommandText();
    let saved = getSavedCommands();

    if ($btn.hasClass("saved")) {
      // Quitar guardado
      if (confirm("¿Desea eliminar este comando de los guardados?")) {
        saved = saved.filter(
          (item) =>
            !(item.command === command && item.mobType === mobType)
        );
        setSavedCommands(saved);
        $btn.removeClass("saved");
        alert("Comando eliminado de los guardados");
        console.log("Guardado eliminado");
      }
    } else {
      // Guardar con datos de todas las cards
      console.log("Intentando guardar comando...");
      const formData = getCurrentFormDataByCard();
      console.log("Datos del formulario:", formData);
      
      if (saveCurrentCommand()) {
        $btn.addClass("saved");
        console.log("Comando guardado exitosamente");
        // El mensaje de éxito se muestra en saveCurrentCommand
      }
    }
  });

  // Renderizar guardados al abrir el modal
  $("#savedButton").on("click", function () {
    renderSavedCommands();
  });

  // Si cambian los campos relevantes, actualizar el estado del bookmark
  $(
    "#mobType, #mobName, #mobHealth, #itemSelect, #mobAmount, #aggressivenessSelect, #helmetSelect, #chestplateSelect, #leggingsSelect, #bootsSelect, #positionType, #posX, #posY, #toggleLoot"
  ).on("input change", function () {
    // Pequeño delay para que se actualice el comando primero
    setTimeout(function() {
      toggleFooterSaveButton();
    }, 50);
  });

  // Al limpiar, actualizar estado del bookmark
  $("#clearButton").on("click", function () {
    setTimeout(function() {
      toggleFooterSaveButton();
    }, 100);
  });
  
  // Inicialización del sistema de guardado
  console.log("Sistema de guardado inicializado");
  console.log("Guardados existentes:", getSavedCommands().length);
});
