$(document).ready(function () {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    $("#themeButton").text("Claro");
  }

  $("#themeButton").on("click", function (e) {
    e.stopPropagation();
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";

    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
      $(this).text("Oscuro");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
      $(this).text("Claro");
    }
  });
});

function formatOption(option) {
  if (!option.id) return option.text;
  const img = $(option.element).data("image");
  if (!img) return option.text;
  return $(
    `<span><img src="${img}" style="width: 25px; height: 25px; vertical-align: middle; margin-right: 10px; border-radius: 5px; box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);" />${option.text}</span>`
  );
}

function formatSelection(option) {
  if (!option.id) return option.text;
  return option.text;
}

$(document).ready(function () {
  $.getJSON(
    "https://raw.githubusercontent.com/SebasOfEek/MineBlocks-Tools/main/json/mobs.json",
    function (data) {
      const mobType = $("#mobType");
      mobType.empty();
      mobType.append('<option value="">--Seleccionar--</option>');
      data.mobs.forEach(function (mob) {
        const option = $("<option>")
          .val(mob.value)
          .text(mob.text)
          .attr("data-image", mob.image);
        mobType.append(option);
      });

      mobType
        .select2({
          templateResult: formatOption,
          templateSelection: formatSelection,
        })
        .on("change", function () {
          const selected = $(this).find(":selected");
          const imageUrl = selected.data("image");
          const mobImage = $("#mobImage");

          if (imageUrl) {
            mobImage.html(`<img src="${imageUrl}" alt="${selected.text()}">`);
            mobImage.addClass("transparent");
          } else {
            mobImage.empty();
            mobImage.removeClass("transparent");
          }

          // Nuevo: cargar configuración de bloqueo desde JSON del mob
          loadMobLockConfig($(this).val());
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
    .removeClass("saved not-saved")
    .addClass(saved ? "saved" : "not-saved");

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
      updateStatus(false);
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

    statusIcon
      .removeClass("fa-times fa-check")
      .addClass(saved ? "fa-check" : "fa-times");

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
      let value = parseInt(this.value);
      if (value > 20) this.value = 20;
      updateAmountStatus(false);
    })
    .on("keypress", function (e) {
      if (e.key === "Enter" || e.keyCode === 13) {
        e.preventDefault();
        saveAmount();
      }
    });

  $("#mobAmount").on("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "");
  });
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
      updatePositionStatus(coord, false);
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
        labelPosX.text("Coordenada ~X:");
        labelPosY.text("Coordenada ~Y:");
      } else {
        labelPosX.text("Coordenada X:");
        labelPosY.text("Coordenada Y:");
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

      data.items.forEach((item) => {
        itemSelect.append(new Option(item.text, item.value));
        itemSelect
          .find(`option[value="${item.value}"]`)
          .data("image", item.image);
      });

      itemSelect
        .select2({
          templateResult: formatOption,
          templateSelection: formatOption,
          width: "100%",
          dropdownParent: $("#itemPopup"),
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
        updateItemStatus(!!selectedValue);
        if (selectedValue) {
          console.log("Item guardado:", selectedValue);
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

    statusIcon
      .removeClass("fa-times fa-check not-saved saved")
      .addClass(saved ? "fa-check saved" : "fa-times not-saved");

    statusButton
      .removeClass("saved not-saved")
      .addClass(saved ? "saved" : "not-saved");

    isItemSaved = saved;
  };

  $("#itemSelect").on("change", function () {
    const selectedValue = $(this).val();
    updateItemStatus(!!selectedValue);
  });

  $("#itemPopup").on("show", function () {
    updateItemStatus(false);
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
      }
    }
  };

  $("#healthSaveButton").on("click", saveHealth);

  $("#mobHealth")
    .on("input", function () {
      let value = parseInt(this.value);
      if (value > 100) this.value = 100;
      updateHealthStatus(false);
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
    $(this)
      .find("span")
      .text(isLootEnabled ? "Activado" : "Desactivado");
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

      selects.forEach((type) => {
        const select = $(`#${type}Select`);
        if (data[type]) {
          data[type].forEach((item) => {
            select.append(new Option(item.text, item.value));
            select
              .find(`option[value="${item.value}"]`)
              .data("image", item.image);
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

  $(".language-btn").on("click", function () {
    $(".language-btn").removeClass("active");
    $(this).addClass("active");
    const lang = $(this).data("lang");
    localStorage.setItem("language", lang);
  });

  const savedLanguage = localStorage.getItem("language") || "es";
  $(".language-btn").removeClass("active");
  $(`.language-btn[data-lang="${savedanguage}"]`).addClass("active");

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
    card18: "nbtPopup",
    cardAggressiveness: "aggressivenessPopup"
  };

  Object.entries(cardMappings).forEach(([cardId, popupId]) => {
    $(`#${cardId}, #${cardId} + .card-icon`).off("click").on("click", function (e) {
      if ($(this).hasClass("locked") || $(`#${cardId}`).hasClass("locked")) {
        e.preventDefault();
        e.stopPropagation();
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
    card18: "nbtHelpPopup",
    cardAggressiveness: "aggressivenessHelpPopup"
  };

  Object.entries(helpPopupMappings).forEach(([cardId, helpPopupId]) => {
    $(`#${cardId} .question-icon`).off("click").on("click", function (e) {
      if ($(`#${cardId}`).hasClass("locked")) {
        e.preventDefault();
        e.stopPropagation();
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

$(document).ready(function () {
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

      const lootEnabled = $("#toggleLoot").find("i").hasClass("fa-toggle-on");
      if (lootEnabled) attributes.push("defaultDrops:true");

      if (attributes.length > 0) {
        command += ` {${attributes.join(", ")}}`;
      }
    }

    $(".footer-box-big").html(command);
  }

  // Eventos para campos de entrada
  $(
    "#mobType, #mobName, #mobHealth, #itemSelect, #mobAmount, #aggressivenessSelect"
  ).on("input change", updateCommand);
  $("#helmetSelect, #chestplateSelect, #leggingsSelect, #bootsSelect").on(
    "change",
    updateCommand
  );
  $("#positionType, #posX, #posY").on("input change", updateCommand);
  $("#toggleLoot").on("click", updateCommand);

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
  // Agregar el evento click al botón Limpiar
  $(".menu-button").each(function () {
    if ($(this).text() === "Limpiar") {
      $(this).on("click", function () {
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
        $("#labelPosX").text("Coordenada X:");
        $("#labelPosY").text("Coordenada Y:");

        // Cerrar todas las casillas extendidas/popups
        $(".popup-overlay").removeClass("show");

        // Resetear todos los toggles y establecer estado
        $(".popup-toggle-button").each(function () {
          const icon = $(this).find("i");
          const text = $(this).find("span");
          const id = $(this).attr("id");

          icon.removeClass("fa-toggle-on").addClass("fa-toggle-off");

          if (id === "toggleLoot" || id === "toggleLootTags") {
            text.text("Desactivado");
          } else {
            text.text("No");
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
      });
    }
  });
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
