const ESP32_IP = "http://192.168.178.29"; // <- DEINE IP HIER
const API_URL = ESP32_IP + "/api/status";

async function fetchStatus() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    document.getElementById("temp").textContent = data.temp;
    document.getElementById("hum").textContent = data.humidity;
  } catch (err) {
    console.error("Fehler beim Abrufen:", err);
  }
}

fetchStatus();
setInterval(fetchStatus, 5000);

// === Popup Funktionen ===
function openPopup() {
  document.getElementById("popup").classList.add("active");
  document.getElementById("esp-ip").textContent = ESP32_IP.replace("http://", "");
}

function closePopup() {
  document.getElementById("popup").classList.remove("active");
}

window.addEventListener("click", function (e) {
  const popup = document.getElementById("popup");
  if (e.target === popup) {
    closePopup();
  }
});
