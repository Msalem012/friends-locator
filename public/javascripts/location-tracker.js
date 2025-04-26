// location-tracker.js
export class LocationTracker {
    constructor() {
        this.watchId = null;
        this.tracking = false;
        this.userId = null;
        this.lastPosition = null;
        this.lastUpdateTime = 0;
        this.updateInterval = 3000;
        this.minAccuracy = 50;
        this.positionThreshold = 0.000005;
        this.positionHistory = [];
        this.historySize = 5;
        this.options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 3000
        };
    }

    setUserId(userId) {
        this.userId = userId;
        console.log('User ID set:', userId);
    }

    async startTracking() {
        if (!this.userId) throw new Error('User ID not set');
        if (this.tracking) return;

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                position => {
                    this.handlePosition(position);
                    this.watchId = navigator.geolocation.watchPosition(
                        this.handlePosition.bind(this),
                        this.handleError.bind(this),
                        this.options
                    );
                    this.tracking = true;
                    resolve(true);
                },
                error => {
                    this.handleError(error);
                    reject(error);
                },
                this.options
            );
        });
    }

    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        this.tracking = false;
        window.dispatchEvent(new Event('trackingStopped'));
    }

    handlePosition(position) {
        if (position.coords.accuracy > this.minAccuracy) {
            console.log('Low accuracy position ignored');
            return false;
        }

        const newPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp || Date.now()
        };
        this.positionHistory.push(newPosition);
        if (this.positionHistory.length > this.historySize) {
            this.positionHistory.shift();
        }

        const avgLat = this.positionHistory.reduce((sum, pos) => sum + pos.latitude, 0) / this.positionHistory.length;
        const avgLon = this.positionHistory.reduce((sum, pos) => sum + pos.longitude, 0) / this.positionHistory.length;

        newPosition.latitude = avgLat;
        newPosition.longitude = avgLon;

        if (position.coords.speed < 1) {
            this.positionThreshold = 0.000002;
        } else {
            this.positionThreshold = 0.00001;
        }

        const timeThreshold = Date.now() - this.lastUpdateTime >= this.updateInterval;
        const positionChanged = !this.lastPosition ||
            Math.abs(this.lastPosition.latitude - newPosition.latitude) > this.positionThreshold ||
            Math.abs(this.lastPosition.longitude - newPosition.longitude) > this.positionThreshold;

        if (timeThreshold || positionChanged) {
            this.lastPosition = newPosition;
            this.lastUpdateTime = Date.now();

            window.dispatchEvent(new CustomEvent('positionUpdated', {
                detail: newPosition
            }));

            return true;
        }

        return false;
    }


    handleError(error) {
        console.error('Geolocation error:', error);
        window.dispatchEvent(new CustomEvent('trackingError', {
            detail: { error }
        }));
    }

    isTracking() {
        return this.tracking;
    }

    getLastPosition() {
        return this.lastPosition;
    }
}