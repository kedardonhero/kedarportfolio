
const ADD_BIN_PIN = "4321";
const SERVER_URL = "http://192.168.1.56:5000"; // Flask server IP
let lastAddedBinId = null;
let alertInterval = null;
let alertAcknowledged = false;
let alertAcknowledgedUntil = 0; // timestamp (ms)
let resumeAlertTimeout = null;
let pickingLocation = false;
let routingControl = null;



let pickMap = null;
let pickMarker = null;
let pickedLatLng = null;

const mapPickOverlay = document.getElementById("mapPickOverlay");
const mapPickModal   = document.getElementById("mapPickModal");


// dom elements
const username = document.getElementById("username");
const password = document.getElementById("password");
const loginPage = document.getElementById("loginPage");
const dashboard = document.getElementById("dashboard");

const rows = document.getElementById("rows");
const total = document.getElementById("total");
const full = document.getElementById("full");
const half = document.getElementById("half");
const empty = document.getElementById("empty");

const overlay = document.getElementById("overlay");
const binModal = document.getElementById("binModal");
const modalId = document.getElementById("modalId");
const modalLoc = document.getElementById("modalLoc");
const modalFill = document.getElementById("modalFill");
const modalStatus = document.getElementById("modalStatus");
const modalHeight = document.getElementById("modalHeight");
const modalWeight = document.getElementById("modalWeight");

/* ADD BIN MODAL */
const addOverlay = document.getElementById("addOverlay");
const addBinModal = document.getElementById("addBinModal");
const pinInput = document.getElementById("pinInput");
const pinStep = document.getElementById("pinStep");
const formStep = document.getElementById("formStep");

const newId = document.getElementById("newId");
const newLoc = document.getElementById("newLoc");
const newLat = document.getElementById("newLat");
const newLng = document.getElementById("newLng");

/* DELETE MODAL */
const deleteOverlay = document.getElementById("deleteOverlay");
const deleteBinModal = document.getElementById("deleteBinModal");
const deletePinInput = document.getElementById("deletePinInput");

/* TOAST */
const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");
const undoBtn = document.getElementById("undoBtn");






const bounds = L.latLngBounds(
  [32.5205, -92.6425],
  [32.5265, -92.6325]
);



let map, markers = [];

let activeBin = null;
let binToDelete = null;
let addAuthorized = false;

let lastDeletedBin = null;
let undoTimer = null;


let bins = [];

const OFFLINE_AFTER_MS = 10 * 1000;  // after 10 sec it shows offline

function isOffline(bin){
  if(!bin.last_seen) return false;
  const t = new Date(bin.last_seen).getTime();
  if(Number.isNaN(t)) return false;
  return (Date.now() - t) > OFFLINE_AFTER_MS;
}



let alertSound = null;
let fullBinAlert = null;
let fullBinList = null;



window.addEventListener("DOMContentLoaded", () => {
  alertSound = document.getElementById("alertSound");
});


// login 
function login(){
  if(username.value && password.value){

    // FORCE audio unlock on user click
    alertSound?.play()
      .then(() => {
        alertSound.pause();
        alertSound.currentTime = 0;
      })
      .catch(() => {});

    loginPage.classList.add("hidden");
    dashboard.classList.remove("hidden");
    initMap();
    loadBins();
    setInterval(loadBins, 1000); // LIVE update every  seconds
  }
}



// for the map 
function initMap(){
  if(map) return;

  map = L.map("ltMap",{
    center:[32.5236,-92.6379],
    zoom:16,
    minZoom:15,
    maxZoom:18,
    maxBounds: bounds,
    maxBoundsViscosity:1
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  updateMarkers();
}

function updateMarkers(){
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  bins.forEach(b => {
    const color =
      isOffline(b) ? "#6b7280" :
      b.v >= 80 ? "#ef4444" :
      b.v >= 40 ? "#f59e0b" :
      "#22c55e";

    const marker = L.circleMarker([b.lat, b.lng],{
      radius:8,
      color,
      fillOpacity:0.9
    })
    .addTo(map)
    .on("click", () => openModal(b));

    markers.push(marker);
  });
}

// for the info
function openModal(bin){
  activeBin = bin;
  overlay.classList.remove("hidden");
  binModal.classList.remove("hidden");
  updateModal();
}

function closeModal(){
  overlay.classList.add("hidden");
  binModal.classList.add("hidden");
  activeBin = null;
}

function updateModal(){

  if(!activeBin) return;

  // ALWAYS GET FRESH BIN FROM bins[]
  const latest = bins.find(
    b => String(b.id) === String(activeBin.id)
  );

  if(!latest) return;

  // update reference
  activeBin = latest;

  modalId.textContent = latest.id;
  modalLoc.textContent = latest.loc;

  const lastSeenEl = document.getElementById("modalLastSeen");
  lastSeenEl.textContent =
    latest.last_seen
      ? new Date(latest.last_seen).toLocaleString()
      : "—";

  // HEIGHT
  modalHeight.textContent =
    (latest.height_cm == null || isOffline(latest))
      ? "—"
      : latest.height_cm;

  // WEIGHT
  modalWeight.textContent =
    (latest.weight_kg == null || isOffline(latest))
      ? "—"
      : Number(latest.weight_kg).toFixed(2);

  const color =
    latest.v >= 80 ? "#ef4444" :
    latest.v >= 40 ? "#f59e0b" :
    "#22c55e";

  if(isOffline(latest)){
    modalFill.style.width = "100%";
    modalFill.style.background = "#6b7280";
    modalStatus.textContent = "OFFLINE";
    modalStatus.style.color = "#cbd5e1";
    return;
  }

  modalFill.style.width = Math.round(latest.v) + "%";
  modalFill.style.background = color;

  modalStatus.textContent = "LIVE";
  modalStatus.style.color = "#22c55e";
}




// adding the new bin 
function openAddBin(){
  addAuthorized = false;
  addOverlay.classList.remove("hidden");
  addBinModal.classList.remove("hidden");
  pinStep.classList.remove("hidden");
  formStep.classList.add("hidden");
  pinInput.value = "";
  newLat.value = "";
  newLng.value = "";
}

function closeAddBin(){
  addOverlay.classList.add("hidden");
  addBinModal.classList.add("hidden");

  // close picker too (without restoring add modal)
  mapPickOverlay.classList.add("hidden");
  mapPickModal.classList.add("hidden");

  if (pickMarker) {
    pickMarker.remove();
    pickMarker = null;
  }
  pickedLatLng = null;
}

function verifyPin(){
  if(pinInput.value !== ADD_BIN_PIN){
    pinInput.value = "";
    pinInput.placeholder = "Wrong PIN";
    return;
  }

  addAuthorized = true;
  pinStep.classList.add("hidden");
  formStep.classList.remove("hidden");
}

function confirmAddBin(){
  if(!addAuthorized) return;

  //  Required fields (trim removes spaces)
  const id  = newId.value.trim();
  const loc = newLoc.value.trim();
  const latStr = newLat.value.trim();
  const lngStr = newLng.value.trim();

  //  Block if missing
  if(!id){
    showToast("Bin ID is required");
    newId.focus();
    return;
  }

  if(!loc){
    showToast("Bin Name/Location is required");
    newLoc.focus();
    return;
  }

  if(!latStr || !lngStr){
    showToast("Pick a location on the map first");
    return;
  }

  //  Numbers check
  const lat = Number(latStr);
  const lng = Number(lngStr);

  if(Number.isNaN(lat) || Number.isNaN(lng)){
    showToast("Latitude/Longitude must be valid numbers");
    return;
  }

  //  Campus bounds check
  if (!bounds.contains(L.latLng(lat, lng))) {
    showToast("Latitude/Longitude must be inside campus 🚫");
    return;
  }

  const newBin = {
    id,
    loc,
    lat,
    lng,
    v: 0
  };

  fetch(`${SERVER_URL}/api/bin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newBin)
  })
  .then(() => {
    lastAddedBinId = newBin.id;

    closeAddBin();
    showToast("Bin added (Undo?)");
    loadBins();

    undoTimer = setTimeout(() => {
      lastAddedBinId = null;
      hideToast();
    }, 5000);
  });
}


// for deleting the bin
function openDeleteBin(){
  if(!activeBin) return;

  binToDelete = activeBin;

  overlay.classList.add("hidden");
  binModal.classList.add("hidden");

  deleteOverlay.classList.remove("hidden");
  deleteBinModal.classList.remove("hidden");
  deletePinInput.value = "";
}


function closeDeleteBin(){
  deleteOverlay.classList.add("hidden");
  deleteBinModal.classList.add("hidden");
}

function confirmDeleteBin(){
  if(deletePinInput.value !== ADD_BIN_PIN){
    deletePinInput.value = "";
    deletePinInput.placeholder = "Wrong PIN";
    return;
  }

  // SAVE FOR UNDO FIRST
  lastDeletedBin = { ...binToDelete };

  fetch(`${SERVER_URL}/api/bin/${binToDelete.id}`, {
    method: "DELETE"
  })
  .then(() => {
    closeDeleteBin();
    showToast("Bin deleted (Undo?)");
    loadBins();

    undoTimer = setTimeout(() => {
      lastDeletedBin = null;
      binToDelete = null;   // clear AFTER timeout
      hideToast();
    }, 5000);
  });
}



let toastTimer = null;

function showToast(msg, duration = 5000){
  toastText.textContent = msg;
  toast.classList.remove("hidden");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    hideToast();
  }, duration);
}

function hideToast(){
  toast.classList.add("hidden");
}


undoBtn.onclick = function(){

  // UNDO DELETE
  if(lastDeletedBin){
    fetch(`${SERVER_URL}/api/bin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lastDeletedBin)
    })
    .then(() => {
      lastDeletedBin = null;
      binToDelete = null;
      clearTimeout(undoTimer);
      hideToast();
      loadBins();
    });
    return;
  }

  //  UNDO ADD
  if(lastAddedBinId){
    fetch(`${SERVER_URL}/api/bin/${lastAddedBinId}`, {
      method: "DELETE"
    })
    .then(() => {
      lastAddedBinId = null;
      clearTimeout(undoTimer);
      hideToast();
      loadBins();
    });
  }
};


function handleSoundAlert(){

  if(!alertSound || !fullBinAlert || !fullBinList) return;

  const now = Date.now();
  const hasFullBins = bins.some(b => b.v >= 80 && !isOffline(b));

  // ⏸ Respect acknowledge silence window
  if(now < alertAcknowledgedUntil){
    return;
  }

  //  Start alerts
  if(hasFullBins){
    startAlertLoop();
  }
  // ✅ Stop alerts when no bins are full
  else{
    stopAlertLoop();
    alertAcknowledgedUntil = 0;
    fullBinAlert.classList.add("hidden");
  }
}

//to resume the sound after one minute 
function startAlertLoop(){
  if(alertInterval) return; // already running

  playAlert();
  alertInterval = setInterval(playAlert, 60000); //this line sets the value of alret sound for every 60 seconds
}

function stopAlertLoop(){
  clearInterval(alertInterval);
  alertInterval = null;
}

function playAlert(){
  const fullBins = bins.filter(b => b.v >= 80 && !isOffline(b));
  if(fullBins.length === 0) return;

  //  Reset & play sound
  alertSound.pause();
  alertSound.currentTime = 0;
  alertSound.play().catch(() => {});

  //  Update popup
  fullBinList.innerHTML = "";
  fullBins.forEach(b => {
    fullBinList.innerHTML += `
      <li>🗑 ${b.id} — ${b.loc} (${b.v}%)</li>
    `;
  });

  fullBinAlert.classList.remove("hidden");
}





function acknowledgeAlert(){

  const silenceDuration = 2 * 60 * 1000; // 2 minutes 

  alertAcknowledgedUntil = Date.now() + silenceDuration;

  // Stop alerts immediately
  stopAlertLoop();
  fullBinAlert.classList.add("hidden");

  // Clear any old resume timers
  clearTimeout(resumeAlertTimeout);

  // HARD RESUME after silence ends
  resumeAlertTimeout = setTimeout(() => {
    alertAcknowledgedUntil = 0; 

    if(bins.some(b => b.v >= 80)){
      startAlertLoop(); // 
    }
  }, silenceDuration);
}




function loadBins(){
  fetch(`${SERVER_URL}/api/bins`)
    .then(res => res.json())
    .then(data => {
    bins = data;
    render();
    handleSoundAlert();

    // LIVE MODAL UPDATE
    if(activeBin){
      updateModal();
    }
  });

}



/**********************
 * TABLE + METRICS
 **********************/
function render(){
  rows.innerHTML = "";

  let f=0, h=0, e=0;

  bins.forEach(b => {

    const s = isOffline(b) ? "offline" : (b.v>=80 ? "full" : b.v>=40 ? "half" : "empty");

    if(s==="full") f++;
    else if(s==="half") h++;
    else e++;

    const rowClass = (s === "offline") ? "offline-row" : "";

    rows.innerHTML += `
      <tr class="${rowClass}">
        <td>${b.id}</td>
        <td>${b.loc}</td>
        <td>${isOffline(b) ? "—" : (Math.round(b.v) + "%")}</td>

        <td>
          <span class="status-pill ${s}">
            <span class="dot"></span>
            ${s.toUpperCase()}
          </span>
        </td>

        <td>
          <button class="delete-btn" onclick="deleteFromRow('${b.id}')">
            🗑
          </button>
        </td>
      </tr>
    `;
});





  total.textContent = bins.length;
  full.textContent = f;
  half.textContent = h;
  empty.textContent = e;

  document.getElementById("lastUpdate").textContent =
    "🟢 Live • Updated " + new Date().toLocaleTimeString();

  updateMarkers();
  // saveBins();
}
function deleteFromRow(binId){
  const bin = bins.find(b => b.id === binId);
  if(!bin) return;

  // Make sure info modal is CLOSED
  overlay.classList.add("hidden");
  binModal.classList.add("hidden");

  // Set delete target directly
  activeBin = bin;
  binToDelete = bin;

  // Open delete PIN modal ONLY
  deleteOverlay.classList.remove("hidden");
  deleteBinModal.classList.remove("hidden");
  deletePinInput.value = "";
}



window.addEventListener("DOMContentLoaded", () => {
  alertSound = document.getElementById("alertSound");
  fullBinAlert = document.getElementById("fullBinAlert");
  fullBinList = document.getElementById("fullBinList");
});

function closeFullAlert(){
  // Just close the popup
  fullBinAlert.classList.add("hidden");


}


function startPickLocation(){
  // hide Add Bin modal while picking
  addOverlay.classList.add("hidden");
  addBinModal.classList.add("hidden");

  // show picker modal
  mapPickOverlay.classList.remove("hidden");
  mapPickModal.classList.remove("hidden");

  pickedLatLng = null;

  setTimeout(() => {
    if(!pickMap){
      const center = map ? map.getCenter() : {lat: 32.5236, lng: -92.6379};
      const zoom   = map ? map.getZoom() : 16;

      pickMap = L.map("pickMap", {
        center: [center.lat, center.lng],
        zoom,
        minZoom: 15,
        maxZoom: 18,
        maxBounds: bounds,
        maxBoundsViscosity: 1
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
        .addTo(pickMap);

      //  click inside bounds only
      pickMap.on("click", (e) => {
        if(!bounds.contains(e.latlng)){
          showToast("Pick inside campus only 🚫");
          return;
        }

        pickedLatLng = e.latlng;

        if(!pickMarker){
          pickMarker = L.marker(e.latlng, { draggable: true }).addTo(pickMap);

          let lastValid = e.latlng;

          pickMarker.on("drag", () => {
            const p = pickMarker.getLatLng();
            if(bounds.contains(p)) lastValid = p;
          });

          pickMarker.on("dragend", () => {
            const p = pickMarker.getLatLng();
            if(!bounds.contains(p)){
              pickMarker.setLatLng(lastValid);
              showToast("Stay inside campus 🚫");
              return;
            }
            pickedLatLng = p;
          });
        } else {
          pickMarker.setLatLng(e.latlng);
        }
      });
    }

    // always after visible
    pickMap.invalidateSize();
    // optional: keep view in bounds
    pickMap.fitBounds(bounds);
  }, 120);

  showToast("Select location on the popup map");
}

function closeMapPicker(){
  mapPickOverlay.classList.add("hidden");
  mapPickModal.classList.add("hidden");

  // bring Add Bin modal back (form step)
  addOverlay.classList.remove("hidden");
  addBinModal.classList.remove("hidden");
  pinStep.classList.add("hidden");
  formStep.classList.remove("hidden");
}

function confirmPickedLocation(){
  if(!pickedLatLng){
    showToast("Click on the map first");
    return;
  }

  newLat.value = pickedLatLng.lat.toFixed(6);
  newLng.value = pickedLatLng.lng.toFixed(6);

  //  close picker + restore add modal
  closeMapPicker();
  showToast("Location selected ✅");
}

function stopPickLocation(){
  pickingLocation = false;
  document.getElementById("ltMap").style.cursor = "";
}

function getMyLocation(){
  return new Promise((resolve, reject) => {
    if(!navigator.geolocation) return reject("No GPS");
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(L.latLng(pos.coords.latitude, pos.coords.longitude)),
      () => reject("Location denied"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}



function openProDirections(){
  const id = document.getElementById("modalId")?.textContent?.trim();
  if(!id) return showToast("No bin selected");

  const bin = bins.find(b => String(b.id) === String(id));
  if(!bin) return showToast("Bin not found");

  if(isOffline(bin)) return showToast("This bin is OFFLINE 🚫");

  const url =
    `https://www.google.com/maps/dir/?api=1` +
    `&destination=${bin.lat},${bin.lng}` +
    `&travelmode=walking`;

  window.open(url, "_blank");
  closeModal();
}






