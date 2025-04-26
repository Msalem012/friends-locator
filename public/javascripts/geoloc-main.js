// geoloc-main.js
import { LocationTracker } from './location-tracker.js';
import { createGeolocationManager } from './geolocation-db.js';

export const geoManager = createGeolocationManager();
export const locationTracker = new LocationTracker();
export let trailVisible = true;

export function initializeApp(userId, username) {
    // Инициализация трекера
    locationTracker.setUserId(userId);
    // Обработчики событий
    setupTrackingControls()
}

function setupEventListeners() {
    window.addEventListener('positionUpdated', (event) => {
        const { latitude, longitude, timestamp } = event.detail;
        handleNewPosition(latitude, longitude, timestamp);
    });

    window.addEventListener('trackingError', (event) => {
        console.error('Tracking error:', event.detail.error);
        showToast('Ошибка геолокации', 'error');
    });
}

async function startTracking() {
    try {
        await locationTracker.startTracking();
        showToast('Отслеживание начато');
    } catch (error) {
        console.error('Failed to start tracking:', error);
        showToast('Не удалось начать отслеживание', 'error');
    }
}

function stopTracking() {
    locationTracker.stopTracking();
    showToast('Отслеживание остановлено');
}

async function handleNewPosition(lat, lng, timestamp) {
    try {
        // Сохраняем в базу данных
        await new Promise((resolve, reject) => {
            geoManager.saveCurrentGeolocation({
                latitude: lat,
                longitude: lng,
                timestamp
            }, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        // Можно добавить дополнительную обработку здесь
    } catch (error) {
        console.error('Failed to save location:', error);
    }
}

function showToast(message, type = 'info') {
    // Реализация toast-уведомлений
    console.log(`[${type}] ${message}`);
}


/**
 * Setup the tracking control buttons
 */
function setupTrackingControls() {
    const startBtn = document.getElementById('startTrackingBtn');
    const stopBtn = document.getElementById('stopTrackingBtn');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            trailVisible = true;
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            trailVisible = false;
        });
    }
}

export default {
    initializeApp,
    startTracking,
    stopTracking
};