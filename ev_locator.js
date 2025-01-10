let map;
let selectedStation = null;
let sessionId = null;
let progress = 0;
let chargingInterval;

async function fetchStationsData() {
  try {
    const response = await fetch(
      "https://ev-charging-backend-hecdehhbbgbye2c6.canadacentral-01.azurewebsites.net/stations"
    );
    const stations = await response.json();
    console.log("fetched stations:", stations);
    return stations;
  } catch (error) {
    console.error("error fetching stations", error);
    return [];
  }
}

function initMap() {
  const mapLook = {
    zoom: 15,
    center: { lat: 51.509865, lng: -0.118092 },
  };

  map = new google.maps.Map(document.getElementById("map"), mapLook);

  fetchStationsData().then((stations) => {
    stations.forEach((station) => {
      placeMarker(station);
    });
  });
}

function placeMarker(station) {
  const lat = parseFloat(station.latitude);
  const lng = parseFloat(station.longitude);
  const power = parseFloat(station.power_kw);

  const marker = new google.maps.Marker({
    position: { lat: lat, lng: lng },
    map: map,
    title: station.station_name,
  });

  const infowindow = new google.maps.InfoWindow({
    content: `
        <h3>${station.station_name}</h3>
        <p>Addresss: ${station.address}</p>
        <p>power:${power}kw</p>
        `,
  });

  marker.addListener("click", () => {
    infowindow.open(map, marker);

    selectedStation = station;
    document.getElementById("session-buttons").style.display = "block";
    document.getElementById("start-charging").disabled = false;
    console.log(`Selected station: ${station.station_name}`);
  });
}

async function startCharging() {
  progress = 0;

  document.getElementById("charging-progress").style.display = "block";

  chargingInterval = setInterval(() => {
    if (progress < 100) {
      progress += 0.5;
      updateChargingProgress(progress);
    } else {
      clearInterval(chargingInterval);
    }
  }, 1000);

  function updateChargingProgress(progress) {
    document.getElementById("progress-bar").value = progress;

    document.getElementById(
      "progress-text"
    ).innerText = `${progress}% Charging`;
  }

  if (!selectedStation) {
    console.error("No station selected");
    return;
  }
  console.log("Starting session for station:", selectedStation);
  try {
    const response = await fetch(
      "https://ev-charging-backend-hecdehhbbgbye2c6.canadacentral-01.azurewebsites.net/sessions/start-charging",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ station_id: selectedStation.id, user_id: 1 }),
      }
    );
    const data = await response.json();
    sessionId = data.session_id;
    console.log(`Charging session started. Session ID: ${sessionId}`);
    document.getElementById("start-charging").disabled = true;
    document.getElementById("complete-charging").disabled = false;
  } catch (error) {
    console.error("Error starting session:", error);
  }
}

async function completeCharging() {
  if (!sessionId) return;

  clearInterval(chargingInterval);

  progress = Math.min(progress, 100);
  document.getElementById("progress-bar").value = progress;
  document.getElementById("progress-text").innerText = `${progress.toFixed(
    1
  )}% Charging`;

  try {
    const response = await fetch(
      "https://ev-charging-backend-hecdehhbbgbye2c6.canadacentral-01.azurewebsites.net/sessions/complete-charging",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      }
    );
    const data = await response.json();
    console.log(`Session completed. Cost: ${data.total_cost}`);
    document.getElementById("complete-charging").disabled = true;
    document.getElementById("payment-button").style.display = "block";
    //alert(`Session completed. Total Cost: ${data.total_cost}`);
  } catch (error) {
    console.error("Error completing session:", error);
  }
}

async function proceedToPayment() {
  if (!sessionId) {
    alert("No session found!");
    return;
  }

  try {
    const costResponse = await fetch(
      `https://ev-charging-backend-hecdehhbbgbye2c6.canadacentral-01.azurewebsites.net/sessions/get-cost`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      }
    );

    const costData = await costResponse.json();
    if (costData.error) {
      alert("Failed to fetch cost: " + costData.error);
      return;
    }

    const totalCost = costData.total_cost;
    console.log(`Total cost for session: ${totalCost}`);

    const encodedCost = encodeURIComponent(totalCost);

    window.location.href = `payment.html?cost=${encodedCost}`;
  } catch (error) {
    console.error("Error during payment process:", error);
  }
}
