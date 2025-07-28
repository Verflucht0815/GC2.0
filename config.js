// ESP32 Growlab Konfiguration
const GROWLAB_CONFIG = {
    // WiFi Einstellungen
    wifi: {
        ssid: "FRITZ!Box 6670 VY",
        password: "94053371659582359324"
    },
    
    // ThingSpeak API Konfiguration
    thingspeak: {
        channelID: 2999714,
        writeAPIKey: "OZ1QPHK0W2IRD8WA",
        readAPIKey: "95YOHGB903ET32DX",
        baseURL: "https://api.thingspeak.com"
    },
    
    // ESP32 Pin Konfiguration
    pins: {
        DHT_PIN: 4,
        DHT_TYPE: "DHT22",
        RELAY_PIN: 5,
        SOIL_PIN: 34
    },
    
    // Sensor Optimal-Bereiche
    optimal_ranges: {
        temperature: {
            min: 20,
            max: 26,
            unit: "°C"
        },
        humidity: {
            min: 50,
            max: 70,
            unit: "%"
        },
        vpd: {
            min: 0.8,
            max: 1.2,
            unit: "kPa"
        },
        soil_moisture: {
            min: 60,
            max: 80,
            unit: "%"
        }
    },
    
    // Bewässerungssteuerung
    irrigation: {
        default_duration: 10, // Sekunden
        min_duration: 5,
        max_duration: 60,
        soil_threshold: 50, // Prozent
        auto_mode: false
    },
    
    // Update Intervalle
    intervals: {
        sensor_update: 30000, // 30 Sekunden
        thingspeak_update: 60000, // 1 Minute
        connection_check: 10000 // 10 Sekunden
    },
    
    // System Status
    system: {
        connected: false,
        last_update: null,
        start_time: new Date(),
        pump_active: false,
        auto_mode: false
    }
};

// ThingSpeak Field Mapping
const THINGSPEAK_FIELDS = {
    temperature: "field1",
    humidity: "field2",
    soil_moisture: "field3",
    vpd: "field4",
    pump_status: "field5"
};

// Status Konstanten
const STATUS = {
    GOOD: "good",
    WARNING: "warning",
    ERROR: "error"
};

// Utility Funktionen
const UTILS = {
    // VPD Berechnung (Vapor Pressure Deficit)
    calculateVPD: (temperature, humidity) => {
        const saturationVaporPressure = 0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3));
        const actualVaporPressure = (humidity / 100) * saturationVaporPressure;
        return (saturationVaporPressure - actualVaporPressure).toFixed(2);
    },
    
    // Status basierend auf Optimal-Bereich bestimmen
    getStatus: (value, range) => {
        if (value >= range.min && value <= range.max) {
            return STATUS.GOOD;
        } else if (value >= range.min - 5 && value <= range.max + 5) {
            return STATUS.WARNING;
        } else {
            return STATUS.ERROR;
        }
    },
    
    // Zeit formatieren
    formatTime: (date) => {
        return date.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },
    
    // Uptime berechnen
    getUptime: (startTime) => {
        const now = new Date();
        const diff = now - startTime;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
};

// Export für Verwendung in anderen Dateien
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GROWLAB_CONFIG, THINGSPEAK_FIELDS, STATUS, UTILS };
}
