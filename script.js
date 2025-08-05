const esp32Url = "http://192.168.178.29"; // Ersetze mit der tatsächlichen IP-Adresse des ESP32

function addLog(message) {
    const log = document.getElementById("log");
    const entry = document.createElement("p");
    entry.textContent = "[" + new Date().toLocaleTimeString() + "] " + message;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

function updateSensors() {
    fetch(`${esp32Url}/sensor`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP-Fehler: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            document.getElementById("temperature").textContent = data.temperature.toFixed(1);
            document.getElementById("humidity").textContent = data.humidity.toFixed(1);
            addLog(`Sensorwerte aktualisiert: ${data.temperature.toFixed(1)}°C, ${data.humidity.toFixed(1)}%`);
        })
        .catch(error => {
            addLog(`Fehler beim Abrufen der Sensorwerte: ${error}`);
        });
}

function triggerGitHubUpdate() {
    addLog("GitHub Update wird ausgelöst...");
    // Hinweis: Die GitHub-Logik läuft auf dem ESP32
}

function refreshSensors() {
    updateSensors();
}

window.onload = function() {
    updateSensors();
    setInterval(updateSensors, 60000); // Alle 60 Sekunden aktualisieren
};
