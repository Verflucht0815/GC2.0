const channelID = "2999714";
const writeAPIKey = "OZ1QPHK0W2IRD8WA";
const readAPIKey = "95YOHGB903ET32DX";
const thingSpeakUrl = "https://api.thingspeak.com";

async function toggleRelay(state) {
  try {
    const url = `${thingSpeakUrl}/update?api_key=${writeAPIKey}&field4=${state}`;
    const response = await fetch(url);
    if (response.ok) {
      updateStatus();
    } else {
      alert("Fehler beim Senden an ThingSpeak");
      document.getElementById("relayStatus").textContent = "Fehler";
    }
  } catch (error) {
    alert("Verbindung zu ThingSpeak fehlgeschlagen");
    document.getElementById("relayStatus").textContent = "Fehler";
  }
}

async function updateStatus() {
  try {
    const url = `${thingSpeakUrl}/channels/${channelID}/fields/4/last.txt?api_key=${readAPIKey}`;
    const response = await fetch(url);
    const status = await response.text();
    document.getElementById("relayStatus").textContent = status === "1" ? "EIN" : "AUS";
  } catch (error) {
    document.getElementById("relayStatus").textContent = "Fehler";
  }
}

document.addEventListener("DOMContentLoaded", updateStatus);
