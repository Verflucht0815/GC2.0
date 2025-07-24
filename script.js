const esp32IP = "http://DEINE_ESP32_IP"; // Ersetze mit der IP-Adresse des ESP32

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

// Status beim Laden der Seite aktualisieren
document.addEventListener("DOMContentLoaded", updateStatus);