const esp32IP = "http://192.168.178.29";

async function toggleRelay(state) {
  try {
    const response = await fetch(`${esp32IP}/relay/${state}`);
    if (response.ok) {
      updateStatus();
    } else {
      alert("Fehler beim Senden der Anfrage");
    }
  } catch (error) {
    alert("Verbindung zum ESP32 fehlgeschlagen");
    document.getElementById("relayStatus").textContent = "Fehler";
  }
}

async function updateStatus() {
  try {
    const response = await fetch(`${esp32IP}/status`);
    const status = await response.text();
    document.getElementById("relayStatus").textContent = status;
  } catch (error) {
    document.getElementById("relayStatus").textContent = "Fehler";
  }
}

document.addEventListener("DOMContentLoaded", updateStatus);
