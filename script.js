function openPopup() {
  document.getElementById("popup").style.display = "flex";
}

function closePopup() {
  document.getElementById("popup").style.display = "none";
}

// Beispiel für dynamische IP-Aktualisierung
document.addEventListener("DOMContentLoaded", () => {
  fetch("/ip")
    .then(res => res.text())
    .then(ip => {
      document.getElementById("esp-ip").textContent = ip;
    })
    .catch(() => {
      document.getElementById("esp-ip").textContent = "nicht verfügbar";
    });

  // Optional: Sensorwerte abrufen
  fetch("/data")
    .then(res => res.json())
    .then(data => {
      document.getElementById("temp").textContent = data.temp;
      document.getElementById("hum").textContent = data.hum;
    })
    .catch(() => {
      document.getElementById("temp").textContent = "Fehler";
      document.getElementById("hum").textContent = "Fehler";
    });
});
