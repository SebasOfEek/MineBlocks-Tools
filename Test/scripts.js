var currentPage = 1;
var skinsArray = [];
var skinsPerPage = 100;
var totalSkinsToLoad = 4000;
var skinsLoaded = 0;
var allSkinsArray = [];
var pagesPerBatch = 100;
var totalPages = totalSkinsToLoad / 4;
var startTime = Date.now();

function loadSkinsProgressively() {
    let types = ['featured', 'new', 'best'];
    let promises = types.map(type => loadSkinsInBatches(type, 1));
    Promise.all(promises).then(() => {
        updateSkinList();
        updateProgressBar();
        displayAllSkins();
        $('#loading-message').hide();
    });
}

function loadSkinsInBatches(type, startPage) {
    let promises = [];
    for (let i = 0; i < pagesPerBatch; i++) {
        promises.push(loadSkinsByType(type, startPage + i));
    }
    return Promise.all(promises).then(() => {
        if (startPage + pagesPerBatch < totalPages) {
            return loadSkinsInBatches(type, startPage + pagesPerBatch);
        }
    });
}

function loadSkinsByType(type, page) {
    return new Promise((resolve, reject) => {
        $.ajax({
            cache: false,
            url: 'https://mineblocks.com/1/scripts/returnSkins.php',
            type: 'POST',
            data: { type: type, page: page },
            success: function(data) {
                if (data && data !== "0") {
                    try {
                        let parsedData = JSON.parse(data);
                        if (Array.isArray(parsedData)) {
                            let uniqueSkins = new Set(parsedData.map(skin => JSON.stringify(skin)));
                            uniqueSkins.forEach(skin => allSkinsArray.push(JSON.parse(skin)));
                            skinsArray = allSkinsArray.slice();
                            skinsLoaded += parsedData.length;
                            resolve();
                        }
                    } catch (error) {
                        console.error("Error parsing JSON:", error);
                        reject(error);
                    }
                } else {
                    resolve();
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading skins:', status, error);
                reject(error);
            }
        });
    });
}

function updateSkinList() {
    var startIndex = (currentPage - 1) * skinsPerPage;
    var endIndex = startIndex + skinsPerPage;
    var skinsToDisplay = skinsArray.slice(startIndex, endIndex);

    $('#skin-select').empty();
    if (skinsToDisplay.length === 0) {
        $('#skin-select').append('<option>No skins found</option>');
    } else {
        let uniqueSkins = new Set();
        for (var i = 0; i < skinsToDisplay.length; i++) {
            var skin = skinsToDisplay[i];
            if (!uniqueSkins.has(skin.id)) {
                uniqueSkins.add(skin.id);
                $('#skin-select').append('<option value="' + skin.id + '">' + skin.name + ' (Author: ' + skin.author + ')</option>');
            }
        }
        showSkinPreview(skinsToDisplay[0].id);
    }

    $('#prevPage').prop('disabled', currentPage === 1);
    $('#nextPage').prop('disabled', currentPage * skinsPerPage >= skinsLoaded);
}

function showSkinPreview(skinId) {
    var imageUrl = 'https://mineblocks.com/1/skins/images/' + skinId + '.png';
    $('#skin-preview').html('<img src="' + imageUrl + '" alt="Skin Preview" width="800">');
    $('#skin-id').text('Skin ID: ' + skinId);
}

function updateProgressBar() {
    var progress = (skinsLoaded / totalSkinsToLoad) * 100;
    $('#progress-bar').width(progress + '%');
    $('#progress-text').text(skinsLoaded + ' / ' + totalSkinsToLoad + ' skins loaded');
    if (skinsLoaded >= totalSkinsToLoad) {
        $('#progress-text').text('Loading complete: ' + skinsLoaded + ' skins');
    }
}

function displayAllSkins() {
    let uniqueSkins = new Set();
    var allSkinsHtml = skinsArray.map(function(skin) {
        if (!uniqueSkins.has(skin.id)) {
            uniqueSkins.add(skin.id);
            return '<div>' + skin.name + ' (Author: ' + skin.author + ')</div>';
        }
    }).join('');
    $('#all-skins').html(allSkinsHtml);
}

loadSkinsProgressively();

$('#search-button').click(function() {
    var query = $('#search-input').val().trim();
    console.log("Searching skins with term:", query);
    searchSkins(query);
});

function searchSkins(query) {
    query = query.toLowerCase();
    var filteredSkins = allSkinsArray.filter(function(skin) {
        return skin.name.toLowerCase().includes(query) || skin.author.toLowerCase().includes(query);
    });

    if (filteredSkins.length > 0) {
        currentPage = 1;
        skinsArray = filteredSkins;
        updateSkinList();
        displayAllSkins();
    } else {
        $('#skin-select').empty().append('<option>No skins found for that search.</option>');
        $('#skin-preview').html('');
        $('#skin-id').text('');
        $('#all-skins').html('<div>No skins found for that search.</div>');
    }
}

$('#search-input').on('input', function() {
    var query = $(this).val().trim().toLowerCase();
    var suggestions = allSkinsArray.filter(function(skin) {
        return skin.name.toLowerCase().includes(query) || skin.author.toLowerCase().includes(query);
    }).map(function(skin) {
        return skin.name + ' (Author: ' + skin.author + ')';
    });

    $('#search-input').autocomplete({
        source: suggestions
    });
});

$('#prevPage').click(function() {
    if (currentPage > 1) {
        currentPage--;
        updateSkinList();
    }
});

$('#nextPage').click(function() {
    if (currentPage * skinsPerPage < skinsLoaded) {
        currentPage++;
        updateSkinList();
    }
});

$('#skin-select').change(function() {
    var selectedSkinId = $(this).val();
    showSkinPreview(selectedSkinId);
});
