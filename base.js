const target = document.getElementById('fullscreenTarget');
const btn = document.getElementById('fullscreen-btn');

btn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        target.requestFullscreen().catch(err => {
            alert(`Error attempting fullscreen: ${err.message}`);
        });
        btn.innerText = "Exit Fullscreen";
        btn.setAttribute('isFull',true);

    } else {
        document.exitFullscreen();
        btn.innerText = "Fullscreen";
        btn.setAttribute('isFull',false);
    }
});

// Sync button text if user exits with ESC
document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
        btn.innerText = "Fullscreen";
        btn.setAttribute('isFull',false);
    }
});



document.querySelector('div.header-disclaimer span.infoButton').addEventListener("click", () => { openModal("Mineral resources mapping of orthomagmatic deposits in Europe – Map viewer", document.getElementById("mapDescription").innerHTML) })
document.querySelector('div.header-disclaimer span.terminologyButton').addEventListener("click", () => { openModal("TERMINOLOGY (Mineral deposit passport – SEMACRET Map viewer)", document.getElementById("mapTerminology").innerHTML) })

locations = [];
map = null;
markerGroup = null;

(() => {
    fetch('./index-maps.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            locations = data.features;
            setFilter();
            setMap(locations);
        })
        .catch(error => {
            console.error('Fetch error:', error);
            // document.getElementById('output').textContent = 'Error loading data.';
        });
})();
var markers = []
function setMap(filterLocations) {
    if (map) {
        bound = [];
        markerGroup.clearLayers();
    } else {
        map = L.map('map').setView([65, -20], 3);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, minZoom: 3 }).addTo(map);
        map.attributionControl.remove();
        markerGroup = L.layerGroup().addTo(map);
        map.on('zoomend', function () {
            let currentZoom = map.getZoom();
            scaleIcon(currentZoom);
        });
    }

    var bounds = [];
    markers = [];

    for (let location of filterLocations) {

        if (location.geometry?.coordinates?.length == 2) {
            const geo = location.geometry?.coordinates;
            var icon = setIcon(location.properties);
            const marker = L.marker(
                [geo[1], geo[0]],
                {
                    icon: L.icon({
                        iconUrl: icon.url,
                        iconSize: icon.size,
                        // iconAnchor: icon.anchor,
                        // popupAnchor: icon.popupAnchor,
                    })
                }
            ).addTo(map)
                .bindPopup(
                    `
            <div style="
font-family: 'Segoe UI', Tahoma, sans-serif;
background-color: #ffffff;
width: 420px;
font-size: 14px;
color: #333;
line-height: 1.6;
">
<div><strong>Occurrence ID:</strong> ${location.properties.OCCURRENCE_ID?.replace('Null', '---')}</div>
<div><strong>Occurrence name:</strong> ${location.properties.OCCURRENCE_NAME?.replace('Null', '---')}</div>
<div><strong>Country:</strong> ${location.properties.COUNTRY?.replace('Null', '---')}</div>
<div><strong>Occurrence type:</strong> ${location.properties.OCCURRENCE_TYPE?.replace('Null', '---')}</div>
<div><strong>Mineralization type:</strong> ${location.properties.MINERALIZATION_TYPE?.replace('Null', '---')}</div>
<div><strong>Importance:</strong> ${location.properties.IMPORTANCE?.replace('Null', '---')}</div>
<div><strong>Classification method:</strong> ${location.properties.CLASSIFICATIONMETHOD?.replace('Null', '---')}</div>
<div><strong>Estimation date:</strong> ${location.properties.ESTIMATIONDATE?.replace('Null', '---')}</div>
<div><strong>Total ORE (T):</strong> ${location.properties.TOTAL_ORE_T?.replace('Null', '---')}</div>
<div><strong>Best UNFC class:</strong> ${location.properties.BEST_UNFC_CLASS?.replace('Null', '---')}</div>
<div><strong>Best UNFC amount:</strong> ${location.properties.BEST_UNFC_AM?.replace('Null', '---')}</div>
<div><strong>Additional UNFC classes:</strong> ${location.properties.ADDITIONA_UNFC_CLASSES?.replace('Null', '---')}</div>
<div><strong>Inspire mine status:</strong> ${location.properties.INSPIRE_MINE_STATUS?.replace('Null', '---')}</div>
<div><strong>Passport URL:</strong>
<a href="${location.properties.PASSPORT_URL?.replace('Null', '---')}" target="_blank" style="color: #007bff; text-decoration: none;">
View Link
</a>
</div>
</div>

                `, { maxWidth: 'auto' });
            bounds.push([geo[1], geo[0]]);
            markers.push({ icon: icon, marker: marker });
            markerGroup.addLayer(marker);
        }
    }

    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
    }
};


function scaleIcon(zoom) {
    const BASE_ZOOM = 5;
    for (let m of markers) {
        let scaleFactor = zoom / BASE_ZOOM;

        // Optional: Clamp scale to avoid crazy big/small icons
        scaleFactor = Math.max(0.5, Math.min(scaleFactor, 3));

        let newSize = m.icon.size[0] * scaleFactor;
        m.marker.setIcon(
            L.icon({
                iconUrl: m.icon.url,
                iconSize: [newSize, newSize],
                // iconAnchor: [newSize / 2, newSize * 0.7],
                // popupAnchor: [0, -newSize * 0.2],
            })
        );
    }
}

function setIcon(p) {
    const BASE_SIZE = 20;

    var color = '', logo = 'shape', size;
    switch (p.MINERALIZATION_TYPE) {
        case '(Fe)Ti-V':
            color = 'grey';
            break;
        case 'Cr (PGE)':
            color = 'blue';
            break;
        case 'Ni-Cu (Co, PGE, Cr)':
            color = 'orange';
            break;
        case 'PGE (Au, Ag, Cu, Cr, Ni)':
            color = 'green';
            break;
    }

    var sizeRaw = p.IMPORTANCE.replace(/\s*\(.*?\)/, '').trim().toLowerCase();

    var sizeData = BASE_SIZE;
    switch (sizeRaw) {
        case 'small':
            break;
        case 'medium':
            sizeData *= 1.5;
            break;
        case 'large':
            sizeData *= 2;
            break;
        case 'very large':
            sizeData *= 3;
            break;
        default:
            sizeData *= 2.5;
            logo = 'circle';
    }

    var size = [sizeData, sizeData];
    if (color === 'green' && logo === 'shape') {
        size = [size[0] - 10, size[1] - 10]
    }

    // Dynamically calculate anchor positions
    const iconAnchor = [size[0] / 2, size[1]]; // bottom center of icon
    const popupAnchor = [0, -size[1]];         // directly above the icon

    // return L.icon({
    //     iconUrl: `icons/${logo}_${color}.svg`,
    //     iconSize: size,
    //     iconAnchor,
    //     popupAnchor
    // });


    return {
        url: `./icons/${logo}_${color}.svg`,
        size: size,
        anchor: [size[0] / 2, size[1] * 0.7],  // tweak here
        popupAnchor: [0, -size[1] * 0.2],          // tweak here
    };
}

function setFilter() {
    const occurenceSet = new Set();
    const countriesSet = new Set();
    const mineralizationSet = new Set();
    const importanceSet = new Set();
    const inspiremineSet = new Set();
    const classificationSet = new Set();
    for (var location of locations) {
        occurenceSet.add(location.properties.OCCURRENCE_TYPE);
        countriesSet.add(location.properties.COUNTRY);
        mineralizationSet.add(location.properties.MINERALIZATION_TYPE);
        importanceSet.add(location.properties.IMPORTANCE);
        inspiremineSet.add(location.properties.INSPIRE_MINE_STATUS);
        classificationSet.add(location.properties.CLASSIFICATIONMETHOD);
    }
    /*
        "OCCURRENCE_ID": "SEM-1ES101",
        "OCCURRENCE_NAME": "Aguablanca",
        "COUNTRY": "Spain",
        "OCCURRENCE_TYPE": "Deposit",
        "MINERALIZATION_TYPE": "Ni-Cu (Co, PGE, Cr)",
        "IMPORTANCE": "Medium (C)",
        "CLASSIFICATIONMETHOD": "CRIRSCO-compliant",
        "ESTIMATIONDATE": "24/03/2024",
        "TOTAL_ORE_T": "5325000,0",
        "BEST_UNFC_CLASS": "Null",
        "BEST_UNFC_AM": "26 716,8 t Ni; 24 288 t Cu; 809,6 t Co; 1,17 t Pd and 1,38 t Pt",
        "ADDITIONA_UNFC_CLASSES": "Null",
        "INSPIRE_MINE_STATUS": "Under development",
        "PASSPORT_URL": "https://app.geology.cz/semacret/pdf.php?id=SEM-1ES101_Aguablanca"
    */

    for (const o of sortArrayAndSimplify(occurenceSet)) {
        setCheckBox('occurence', o);
    }

    // const sortedCountries = [...countriesSet].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    // for (const o of sortedCountries) {
    //     setCheckBox('countries', o);
    // }

    for (const o of sortArrayAndSimplify(mineralizationSet)) {
        setCheckBox('mineralization', o);
    }


    for (const o of sortArrayAndSimplify(classificationSet)) {
        setCheckBox('classification', o);
    }

    for (const o of sortArrayAndSimplify(importanceSet, true, ["Very large", "Large", "Medium", "Small", "Not specified"])) {
        setCheckBox('importance', o);
    }

    for (const o of sortArrayAndSimplify(inspiremineSet, false, ["Operating", "Under development", "Not operating", "---"])) {
        setCheckBox('INSPIREMine', o);
    }

    document
        .getElementById('filter-selections')
        .addEventListener('change', function (event) {
            if (event.target.type === 'checkbox') applyFilter();
        });
}

function sortArrayAndSimplify(originalSet, removeParentesis, sortOrder) {
    var uniqueItems = new Set();
    for (const entry of originalSet) {
        const items = entry ? entry.split(";") : []; // split by semicolon
        for (const item of items) {
            if (removeParentesis) {
                uniqueItems.add(item.replace(/\s*\(.*?\)/, '').trim());

            } else {
                uniqueItems.add(item.trim()); // trim whitespace and add
            }
        }
    }

    var cleanResponse = [...uniqueItems].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));


    return sortOrder ? orderedClassifications = cleanResponse.sort((a, b) => {
        const indexA = sortOrder.indexOf(a) !== -1 ? sortOrder.indexOf(a) : sortOrder.length;
        const indexB = sortOrder.indexOf(b) !== -1 ? sortOrder.indexOf(b) : sortOrder.length;
        return indexA - indexB;
    }) : cleanResponse;
}

function setCheckBox(wrapperId, text) {
    const container = document.getElementById(wrapperId);

    const wrapper = document.createElement('div');
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = text;

    wrapper.appendChild(label);
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode((!text || text.toLowerCase().trim()) == 'null' ? ' ---' : text));

    container.appendChild(wrapper);
}

function applyFilter() {
    var tmpLocations = locations;
    const selectedOcurrences = Array.from(document.querySelectorAll('#occurence input[type=checkbox]:checked')).map(cb => cb.value);
    tmpLocations = selectedOcurrences.length > 0 ? tmpLocations.filter(l => selectedOcurrences.some(_ => l.properties.OCCURRENCE_TYPE.indexOf(_) != -1)) : tmpLocations;

    const selectedCountries = Array.from(document.querySelectorAll('#countries input[type=checkbox]:checked')).map(cb => cb.value);
    tmpLocations = selectedCountries.length > 0 ? tmpLocations.filter(l => selectedCountries.some(_ => l.properties.COUNTRY.indexOf(_) != -1)) : tmpLocations;

    const selectedClassification = Array.from(document.querySelectorAll('#classification input[type=checkbox]:checked')).map(cb => cb.value);
    tmpLocations = selectedClassification.length > 0 ? tmpLocations.filter(l => selectedClassification.some(_ => l.properties.CLASSIFICATIONMETHOD.indexOf(_) != -1)) : tmpLocations;

    const selectedMineralization = Array.from(document.querySelectorAll('#mineralization input[type=checkbox]:checked')).map(cb => cb.value);
    tmpLocations = selectedMineralization.length > 0 ? tmpLocations.filter(l => selectedMineralization.some(_ => l.properties.MINERALIZATION_TYPE.indexOf(_) != -1)) : tmpLocations;

    const selectedImportance = Array.from(document.querySelectorAll('#importance input[type=checkbox]:checked')).map(cb => cb.value);
    tmpLocations = selectedImportance.length > 0 ? tmpLocations.filter(l => selectedImportance.some(_ => l.properties.IMPORTANCE.indexOf(_) != -1)) : tmpLocations;

    const selectedInspire = Array.from(document.querySelectorAll('#INSPIREMine input[type=checkbox]:checked')).map(cb => cb.value);
    tmpLocations = selectedInspire.length > 0 ? tmpLocations.filter(l => selectedInspire.some(_ => l.properties.INSPIRE_MINE_STATUS.indexOf(_) != -1)) : tmpLocations;

    setClear('occurence');
    setClear('mineralization');
    setClear('classification');
    setClear('importance');
    setClear('INSPIREMine');

    setMap(tmpLocations);
}

function setClear(id) {
    const selected = Array.from(document.querySelectorAll(`#${id} input[type=checkbox]:checked`)).map(cb => cb.value);

    if (selected.length > 0) {
        if (document.querySelector(`div[for=${id}] span.clear-btn`)) return;

        const clearBtn = document.createElement('span');
        clearBtn.textContent = 'Clear ×';
        clearBtn.className = 'clear-btn';
        clearBtn.style.cssText = 'margin-left:10px; color:#007bff; cursor:pointer; font-size:0.9em;';
        clearBtn.onclick = () => {
            var list = document.querySelectorAll(`#${id} input[type=checkbox]:checked`)
            for (var l of list) {
                l.checked = false;
            }
            removeClear(id);
            applyFilter();
        };
        document.querySelector(`div[for=${id}]`).appendChild(clearBtn);
    } else {
        removeClear(id);
    }

}
function removeClear(id) {
    var clear = document.querySelector(`div[for=${id}] span.clear-btn`);
    if (clear) {
        clear.remove();
    }
}