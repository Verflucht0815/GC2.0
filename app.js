// Growlab Controller - Hauptanwendung mit ESP32 Integration
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
        this.esp32IP = null; // Wird automatisch erkannt oder manuell gesetzt
        this.useSimulation = true; // Auf false setzen für echte ESP32 Verbindung
        
        this.init();
    }
    
    init() {
        console.log('🌱 Growlab Controller wird initialisiert...');
        console.log('⚙️ ESP32 IP automatische Erkennung gestartet...');
        
        // DOM Elemente referenzieren
        this.initDOMElements();
        
        // Event Listeners einrichten
        this.setupEventListeners();
        
        // Initial UI aktualisieren
        this.updateSystemInfo();
        this.updateTimestamp();
        
        // ESP32 Verbindung versuchen
        this.detectESP32();
        
        // Intervalle starten
        this.startIntervals();
        
        console.log('✅ Growlab Controller bereit!');
        console.log('💡 Konsole Befehle: growlabDebug.setESP32IP("192.168.178.XXX")');
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
            
            // An ESP32 senden wenn verbunden
            if (this.esp32IP && !this.useSimulation) {
                this.updateESP32Config();
            }
        });
        
        // Schieberegler für Bodenfeuchtigkeit Schwellwert
        this.elements.soilThreshold.addEventListener('input', (e) => {
            const value = e.target.value;
            this.elements.thresholdValue.textContent = `${value}%`;
            this.config.irrigation.soil_threshold = parseInt(value);
            
            // An ESP32 senden wenn verbunden
            if (this.esp32IP && !this.useSimulation) {
                this.updateESP32Config();
            }
        });
    }
    
    async detectESP32() {
        console.log('🔍 Suche ESP32 im lokalen Netzwerk...');
        
        // Häufige IP-Bereiche für FRITZ!Box
        const ipRanges = [
            '192.168.178',
            '192.168.1',
            '10.0.0'
        ];
        
        for (const range of ipRanges) {
            for (let i = 100; i <= 120; i++) {
                const testIP = `${range}.${i}`;
                try {
                    const response = await fetch(`http://${testIP}/api/status`, {
                        method: 'GET',
                        timeout: 2000
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.wifiSSID === this.config.wifi.ssid) {
                            this.esp32IP = testIP;
                            this.useSimulation = false;
                            console.log(`✅ ESP32 gefunden: ${testIP}`);
                            this.updateConnectionStatus(true);
                            this.loadESP32Data();
                            return;
                        }
                    }
                } catch (error) {
                    // Ignoriere Verbindungsfehler bei der Suche
                }
            }
        }
        
        console.log('⚠️ ESP32 nicht gefunden - verwende Simulation');
        console.log('💡 Manuell setzen: growlabDebug.setESP32IP("http://192.168.178.30/")');
        this.simulateConnection();
    }
    
    startIntervals() {
        // Sensor Daten aktualisieren
        this.intervals.sensorUpdate = setInterval(() => {
            if (this.useSimulation) {
                this.updateSensorData();
            } else {
                this.loadESP32Data();
            }
        }, this.config.intervals.sensor_update);
        
        // Zeitstempel aktualisieren
        this.intervals.timestamp = setInterval(() => {
            this.updateTimestamp();
        }, 1000);
        
        // Uptime aktualisieren
        this.intervals.uptime = setInterval(() => {
            this.updateUptime();
        }, 1000);
        
        // Auto-Bewässerung prüfen (nur in Simulation)
        this.intervals.autoIrrigation = setInterval(() => {
            if (this.useSimulation) {
                this.checkAutoIrrigation();
            }
        }, 5000);
        
        // Verbindungsstatus prüfen
        this.intervals.connectionCheck = setInterval(() => {
            if (!this.useSimulation) {
                this.checkESP32Connection();
            }
        }, this.config.intervals.connection_check);
    }
    
    async loadESP32Data() {
        if (!this.esp32IP) return;
        
        try {
            const response = await fetch(`http://${this.esp32IP}/api/sensors`, {
                method: 'GET',
                timeout: 5000
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            this.currentData = {
                temperature: parseFloat(data.temperature) || 0,
                humidity: parseFloat(data.humidity) || 0,
                soilMoisture: parseFloat(data.soilMoisture) || 0,
                vpd: parseFloat(data.vpd) || 0
            };
            
            // Pumpen Status aktualisieren
            this.config.system.pump_active = data.pumpActive || false;
            this.config.system.last_update = new Date();
            
            // UI aktualisieren
            this.updateSensorUI();
            this.updatePumpUI();
            this.updateLastUpdateTime();
            this.updateConnectionStatus(true);
            
            console.log('📊 ESP32 Daten geladen:', this.currentData);
            
        } catch (error) {
            console.error('❌ ESP32 Verbindungsfehler:', error);
            this.updateConnectionStatus(false);
            
            // Fallback zur Simulation nach mehreren Fehlern
            if (this.connectionFailures > 3) {
                console.log('⚠️ Zu viele Verbindungsfehler - wechsle zu Simulation');
                this.useSimulation = true;
                this.esp32IP = null;
            }
        }
    }
    
    async sendToESP32(endpoint, data) {
        if (!this.esp32IP) {
            console.log('⚠️ ESP32 IP nicht verfügbar');
            return false;
        }
        
        try {
            const response = await fetch(`http://${this.esp32IP}/api/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                timeout: 5000
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`📡 ESP32 ${endpoint} erfolgreich:`, result);
            return result;
            
        } catch (error) {
            console.error(`❌ ESP32 ${endpoint} Fehler:`, error);
            return false;
        }
    }
    
    async togglePump() {
        if (this.useSimulation) {
            // Simulation
            this.config.system.pump_active = !this.config.system.pump_active;
            
            if (this.config.system.pump_active) {
                this.startPump();
            } else {
                this.stopPump();
            }
            
            this.updatePumpUI();
            console.log(`💧 Pumpe ${this.config.system.pump_active ? 'EIN' : 'AUS'} (Simulation)`);
        } else {
            // ESP32 Steuerung
            const result = await this.sendToESP32('pump', {
                activate: !this.config.system.pump_active,
                duration: this.config.irrigation.default_duration
            });
            
            if (result) {
                this.config.system.pump_active = result.pumpActive;
                this.updatePumpUI();
                console.log(`💧 ESP32 Pumpe ${this.config.system.pump_active ? 'EIN' : 'AUS'}`);
            }
        }
    }
    
    async toggleAutoMode() {
        this.config.system.auto_mode = !this.config.system.auto_mode;
        
        // ESP32 Konfiguration aktualisieren
        if (!this.useSimulation) {
            await this.updateESP32Config();
        }
        
        const autoButton = this.elements.pumpAuto;
        if (this.config.system.auto_mode) {
            autoButton.style.background = 'linear-gradient(45deg, #00ff87, #60efff)';
            autoButton.style.color = '#000';
            autoButton.querySelector('.btn-text').textContent = 'Auto: EIN';
        } else {
            autoButton.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
            autoButton.style.color = '#fff';
            autoButton.querySelector('.btn-text').textContent = 'Auto Modus';
        }
        
        console.log(`🤖 Auto-Modus ${this.config.system.auto_mode ? 'EIN' : 'AUS'}`);
    }
    
    async updateESP32Config() {
        if (this.useSimulation) return;
        
        const configData = {
            autoMode: this.config.system.auto_mode,
            soilThreshold: this.config.irrigation.soil_threshold,
            pumpDuration: this.config.irrigation.default_duration
        };
        
        const result = await this.sendToESP32('config', configData);
        if (result) {
            console.log('⚙️ ESP32 Konfiguration aktualisiert');
        }
    }
    
    async checkESP32Connection() {
        if (!this.esp32IP) return;
        
        try {
            const response = await fetch(`http://${this.esp32IP}/api/status`, {
                method: 'GET',
                timeout: 3000
            });
            
            if (response.ok) {
                this.updateConnectionStatus(true);
                this.connectionFailures = 0;
            } else {
                throw new Error('Connection failed');
            }
        } catch (error) {
            this.connectionFailures = (this.connectionFailures || 0) + 1;
            this.updateConnectionStatus(false);
        }
    }
    
    updateConnectionStatus(connected) {
        this.config.system.connected = connected;
        const statusDot = this.elements.connectionStatus.querySelector('.status-dot');
        const statusText = this.elements.connectionStatus.querySelector('span:last-child');
        
        if (connected) {
            statusDot.classList.add('connected');
            statusText.textContent = this.useSimulation ? 'Simulation' : `ESP32 (${this.esp32IP})`;
        } else {
            statusDot.classList.remove('connected');
            statusText.textContent = 'Verbindung getrennt';
        }
    }
    
    simulateConnection() {
        this.useSimulation = true;
        this.config.system.connected = true;
        this.updateConnectionStatus(true);
        
        // Erste Sensor Daten simulieren
        this.updateSensorData();
        
        console.log('📡 Simulation aktiviert');
    }
    
    // === SIMULATION METHODEN ===
    
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
        
        console.log('📊 Sensor Daten aktualisiert (Simulation):', this.currentData);
    }
    
    generateRealisticValue(base, variance) {
        const randomFactor = (Math.random() - 0.5) * 2; // -1 bis 1
        return parseFloat((base + randomFactor * variance).toFixed(1));
    }
    
    startPump() {
        this.config.system.pump_active = true;
        
        // Automatisches Ausschalten nach eingestellter Dauer
        if (!this.config.system.auto_mode) {
            setTimeout(() => {
                this.stopPump();
                this.updatePumpUI();
            }, this.config.irrigation.default_duration * 1000);
        }
    }
    
    stopPump() {
        this.config.system.pump_active = false;
    }
    
    checkAutoIrrigation() {
        if (!this.config.system.auto_mode || !this.currentData.soilMoisture) return;
        
        // Wenn Bodenfeuchtigkeit unter Schwellwert und Pumpe nicht aktiv
        if (this.currentData.soilMoisture < this.config.irrigation.soil_threshold && 
            !this.config.system.pump_active) {
            
            console.log(`🤖 Auto-Bewässerung aktiviert: Bodenfeuchtigkeit ${this.currentData.soilMoisture}% < ${this.config.irrigation.soil_threshold}%`);
            this.startPump();
            this.updatePumpUI();
            
            // Auto-Bewässerung nach Dauer stoppen
            setTimeout(() => {
                this.stopPump();
                this.updatePumpUI();
                console.log('🤖 Auto-Bewässerung beendet');
            }, this.config.irrigation.default_duration * 1000);
        }
    }
    
    // === UI UPDATE METHODEN ===
    
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
        const element = this.elements[elementId];
        
        // Alle Status-Klassen entfernen
        element.classList.remove('good', 'warning', 'error');
        
        // Neue Status-Klasse hinzufügen
        element.classList.add(status);
    }
    
    updatePumpUI() {
        const pumpStatus = this.elements.pumpStatus;
        const pumpButton = this.elements.pumpToggle;
        
        if (this.config.system.pump_active) {
            pumpStatus.textContent = 'EIN';
            pumpStatus.classList.add('active');
            pumpButton.querySelector('.btn-text').textContent = 'Pumpe AUS';
            pumpButton.style.background = 'linear-gradient(45deg, #ff4757, #ff3742)';
        } else {
            pumpStatus.textContent = 'AUS';
            pumpStatus.classList.remove('active');
            pumpButton.querySelector('.btn-text').textContent = 'Pumpe EIN';
            pumpButton.style.background = 'linear-gradient(45deg, #00ff87, #60efff)';
        }
    }
    
    updateSystemInfo() {
        this.elements.wifiStatus.textContent = this.config.wifi.ssid;
        this.elements.thingspeakStatus.textContent = `Channel ${this.config.thingspeak.channelID}`;
    }
    
    updateTimestamp() {
        const now = new Date();
        this.elements.timestamp.textContent = UTILS.formatTime(now);
    }
    
    updateLastUpdateTime() {
        if (this.config.system.last_update) {
            this.elements.lastUpdate.textContent = UTILS.formatTime(this.config.system.last_update);
        }
    }
    
    updateUptime() {
        this.elements.uptime.textContent = UTILS.getUptime(this.config.system.start_time);
    }
    
    // === UTILITY METHODEN ===
    
    setESP32IP(ip) {
        this.esp32IP = ip;
        this.useSimulation = false;
        this.loadESP32Data();
        console.log(`📡 ESP32 IP manuell gesetzt: ${ip}`);
    }
    
    // ThingSpeak Integration (optional)
    async sendToThingSpeak(data) {
        const url = `${this.config.thingspeak.baseURL}/update?api_key=${this.config.thingspeak.writeAPIKey}`;
        const params = new URLSearchParams({
            [THINGSPEAK_FIELDS.temperature]: data.temperature,
            [THINGSPEAK_FIELDS.humidity]: data.humidity,
            [THINGSPEAK_FIELDS.soil_moisture]: data.soilMoisture,
            [THINGSPEAK_FIELDS.vpd]: data.vpd,
            [THINGSPEAK_FIELDS.pump_status]: this.config.system.pump_active ? 1 : 0
        });
        
        try {
            const response = await fetch(`${url}&${params}`);
            console.log('📡 Daten an ThingSpeak gesendet:', response.status);
        } catch (error) {
            console.error('❌ ThingSpeak Fehler:', error);
        }
    }
    
    async loadFromThingSpeak() {
        const url = `${this.config.thingspeak.baseURL}/channels/${this.config.thingspeak.channelID}/feeds/last.json?api_key=${this.config.thingspeak.readAPIKey}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log('📥 Daten von ThingSpeak geladen:', data);
            return data;
        } catch (error) {
            console.error('❌ ThingSpeak Laden Fehler:', error);
            return null;
        }
    }
    
    // Cleanup beim Verlassen der Seite
    destroy() {
        Object.values(this.intervals).forEach(interval => {
            clearInterval(interval);
        });
        console.log('🧹 Growlab Controller beendet');
    }
}

// Growlab Controller initialisieren wenn DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    window.growlab = new GrowlabController();
});

// Cleanup beim Verlassen der Seite
window.addEventListener('beforeunload', () => {
    if (window.growlab) {
        window.growlab.destroy();
    }
});

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (!window.growlab) return;
    
    // Leertaste = Pumpe togglen
    if (e.code === 'Space' && !e.target.matches('input')) {
        e.preventDefault();
        window.growlab.togglePump();
    }
    
    // 'A' = Auto-Modus togglen
    if (e.code === 'KeyA' && !e.target.matches('input')) {
        window.growlab.toggleAutoMode();
    }
});

// Console Kommandos für Debugging
window.growlabDebug = {
    getConfig: () => GROWLAB_CONFIG,
    getCurrentData: () => window.growlab?.currentData,
    setESP32IP: (ip) => window.growlab?.setESP32IP(ip),
    toggleSimulation: () => {
        if (window.growlab) {
            window.growlab.useSimulation = !window.growlab.useSimulation;
            console.log(`🔄 Simulation: ${window.growlab.useSimulation ? 'EIN' : 'AUS'}`);
        }
    },
    simulateWater: () => {
        if (window.growlab) {
            window.growlab.currentData.soilMoisture = Math.max(0, window.growlab.currentData.soilMoisture - 20);
            window.growlab.updateSensorUI();
        }
    },
    forcePump: () => window.growlab?.togglePump(),
    toggleAuto: () => window.growlab?.toggleAutoMode(),
    testESP32: async () => {
        if (window.growlab?.esp32IP) {
            try {
                const response = await fetch(`http://${window.growlab.esp32IP}/api/status`);
                const data = await response.json();
                console.log('✅ ESP32 Test erfolgreich:', data);
            } catch (error) {
                console.error('❌ ESP32 Test fehlgeschlagen:', error);
            }
        }
    }
};
