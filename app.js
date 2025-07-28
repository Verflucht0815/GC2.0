// Growlab Controller - Hauptanwendung
class GrowlabController {
    constructor() {
        this.config = GROWLAB_CONFIG;
        this.currentData = {
            temperature: null,
            humidity: null,
            soilMoisture: null,
            vpd: null
        };
        this.intervals = {};
        
        this.init();
    }
    
    init() {
        console.log('🌱 Growlab Controller wird initialisiert...');
        
        // DOM Elemente referenzieren
        this.initDOMElements();
        
        // Event Listeners einrichten
        this.setupEventListeners();
        
        // Initial UI aktualisieren
        this.updateSystemInfo();
        this.updateTimestamp();
        
        // Intervalle starten
        this.startIntervals();
        
        // Simuliere Verbindung (für Demo)
        setTimeout(() => {
            this.simulateConnection();
        }, 2000);
        
        console.log('✅ Growlab Controller bereit!');
    }
    
    initDOMElements() {
        // Sensor Elemente
        this.elements = {
            temperature: document.getElementById('temperature'),
            humidity: document.getElementById('humidity'),
            vpd: document.getElementById('vpd'),
            soilMoisture: document.getElementById('soilMoisture'),
            
            // Status Indikatoren
            tempStatus: document.getElementById('tempStatus'),
            humidityStatus: document.getElementById('humidityStatus'),
            vpdStatus: document.getElementById('vpdStatus'),
            soilStatus: document.getElementById('soilStatus'),
            
            // Steuerung
            pumpToggle: document.getElementById('pumpToggle'),
            pumpAuto: document.getElementById('pumpAuto'),
            pumpStatus: document.getElementById('pumpStatus'),
            pumpDuration: document.getElementById('pumpDuration'),
            soilThreshold: document.getElementById('soilThreshold'),
            durationValue: document.getElementById('durationValue'),
            thresholdValue: document.getElementById('thresholdValue'),
            
            // System Info
            connectionStatus: document.getElementById('connectionStatus'),
            wifiStatus: document.getElementById('wifiStatus'),
            thingspeakStatus: document.getElementById('thingspeakStatus'),
            lastUpdate: document.getElementById('lastUpdate'),
            uptime: document.getElementById('uptime'),
            timestamp: document.getElementById('timestamp')
        };
    }
    
    setupEventListeners() {
        // Pumpe Ein/Aus Button
        this.elements.pumpToggle.addEventListener('click', () => {
            this.togglePump();
        });
        
        // Auto Modus Button
        this.elements.pumpAuto.addEventListener('click', () => {
            this.toggleAutoMode();
        });
        
        // Schieberegler für Bewässerungsdauer
        this.elements.pumpDuration.addEventListener('input', (e) => {
            const value = e.target.value;
            this.elements.durationValue.textContent = `${value}s`;
            this.config.irrigation.default_duration = parseInt(value);
        });
        
        // Schieberegler für Bodenfeuchtigkeit Schwellwert
        this.elements.soilThreshold.addEventListener('input', (e) => {
            const value = e.target.value;
            this.elements.thresholdValue.textContent = `${value}%`;
            this.config.irrigation.soil_threshold = parseInt(value);
        });
    }
    
    startIntervals() {
        // Sensor Daten aktualisieren (simuliert)
        this.intervals.sensorUpdate = setInterval(() => {
            this.updateSensorData();
        }, this.config.intervals.sensor_update);
        
        // Zeitstempel aktualisieren
        this.intervals.timestamp = setInterval(() => {
            this.updateTimestamp();
        }, 1000);
        
        // Uptime aktualisieren
        this.intervals.uptime = setInterval(() => {
            this.updateUptime();
        }, 1000);
        
        // Auto-Bewässerung prüfen
        this.intervals.autoIrrigation = setInterval(() => {
            this.checkAutoIrrigation();
        }, 5000);
    }
    
    simulateConnection() {
        this.config.system.connected = true;
        const statusDot = this.elements.connectionStatus.querySelector('.status-dot');
        statusDot.classList.add('connected');
        
        // Erste Sensor Daten simulieren
        this.updateSensorData();
        
        console.log('📡 ESP32 Verbindung simuliert');
    }
    
    updateSensorData() {
        if (!this.config.system.connected) return;
        
        // Simuliere realistische Sensor Daten
        this.currentData = {
            temperature: this.generateRealisticValue(23, 2),
            humidity: this.generateRealisticValue(60, 10),
            soilMoisture: this.generateRealisticValue(65, 15),
        };
        
        // VPD berechnen
        this.currentData.vpd = parseFloat(
            UTILS.calculateVPD(this.currentData.temperature, this.currentData.humidity)
        );
        
        // UI aktualisieren
        this.updateSensorUI();
        this.config.system.last_update = new Date();
        this.updateLastUpdateTime();
        
        console.log('📊 Sensor Daten aktualisiert:', this.currentData);
    }
    
    generateRealisticValue(base, variance) {
        const randomFactor = (Math.random() - 0.5) * 2; // -1 bis 1
        return parseFloat((base + randomFactor * variance).toFixed(1));
    }
    
    updateSensorUI() {
        // Temperatur
        this.elements.temperature.textContent = `${this.currentData.temperature}°C`;
        this.updateSensorStatus('tempStatus', this.currentData.temperature, this.config.optimal_ranges.temperature);
        
        // Luftfeuchtigkeit
        this.elements.humidity.textContent = `${this.currentData.humidity}%`;
        this.updateSensorStatus('humidityStatus', this.currentData.humidity, this.config.optimal_ranges.humidity);
        
        // VPD
        this.elements.vpd.textContent = `${this.currentData.vpd} kPa`;
        this.updateSensorStatus('vpdStatus', this.currentData.vpd, this.config.optimal_ranges.vpd);
        
        // Bodenfeuchtigkeit
        this.elements.soilMoisture.textContent = `${this.currentData.soilMoisture}%`;
        this.updateSensorStatus('soilStatus', this.currentData.soilMoisture, this.config.optimal_ranges.soil_moisture);
    }
    
    updateSensorStatus(elementId, value, range) {
        const status = UTILS.getStatus(value, range);
