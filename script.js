const ESP32_IP = "http://192.168.178.29";  // ESP32 lokale IP anpassen

function openPopup() {
  document.getElementById("popup").style.display = "flex";
  document.getElementById("esp-ip").textContent = ESP32_IP.replace("http://", "");
}

function closePopup() {
  document.getElementById("popup").style.display = "none";
}

async function fetchData() {
  try {
    const res = await fetch(ESP32_IP + "/data");
    if (!res.ok) throw new Error("Netzwerkfehler");
    const json = await res.json();
    document.getElementById("temp").textContent = json.temp;
    document.getElementById("hum").textContent = json.humidity;
  } catch(e) {
    console.error(e);
    document.getElementById("temp").textContent = "-";
    document.getElementById("hum").textContent = "-";
  }
}

fetchData();
setInterval(fetchData, 5000);

window.addEventListener("click", (e) => {
  if (e.target.id === "popup") closePopup();
});
