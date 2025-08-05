async function fetchSensorData() {
  try {
    // Ersetze <öffentliche-IP> durch die öffentliche IP deines Routers
    const response = await fetch('http://192.168.178.29/sensor');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return null;
  }
}

function updateUI(data) {
  const tempElement = document.getElementById('temperature');
  const humElement = document.getElementById('humidity');
  const errorElement = document.getElementById('error');
  const lastUpdatedElement = document.getElementById('last-updated');

  if (data && data.temperature !== undefined && data.humidity !== undefined) {
    tempElement.textContent = `Temperature: ${data.temperature.toFixed(1)} °C`;
    humElement.textContent = `Humidity: ${data.humidity.toFixed(1)} %`;
    errorElement.classList.add('hidden');
    lastUpdatedElement.textContent = new Date().toLocaleTimeString();
  } else {
    tempElement.textContent = 'Temperature: -- °C';
    humElement.textContent = 'Humidity: -- %';
    errorElement.classList.remove('hidden');
    lastUpdatedElement.textContent = '--';
  }
}

async function startDataPolling() {
  // Initialer Abruf
  const initialData = await fetchSensorData();
  updateUI(initialData);

  // Regelmäßige Aktualisierung alle 5 Sekunden
  setInterval(async () => {
    const data = await fetchSensorData();
    updateUI(data);
  }, 5000);
}

// Starte das Polling nach dem Laden der Seite
window.onload = startDataPolling;
