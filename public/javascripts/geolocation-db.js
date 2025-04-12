// IndexedDB for Geolocation Storage
const DB_NAME = 'GeolocDB';
const DB_VERSION = 1;
const STORE_NAME = 'locationHistory';

class GeolocationDatabase {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.initialized = true;
        console.log('IndexedDB connected successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store for location history
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { 
            keyPath: 'timestamp' 
          });
          
          // Create indexes
          objectStore.createIndex('userId', 'userId', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: true });
          
          console.log('Database setup complete');
        }
      };
    });
  }

  async saveLocation(userId, position) {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const locationData = {
        userId: userId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp || Date.now()
      };
      
      // Optional additional data if available
      if (position.coords.altitude !== null) locationData.altitude = position.coords.altitude;
      if (position.coords.altitudeAccuracy !== null) locationData.altitudeAccuracy = position.coords.altitudeAccuracy;
      if (position.coords.heading !== null) locationData.heading = position.coords.heading;
      if (position.coords.speed !== null) locationData.speed = position.coords.speed;
      
      const request = store.add(locationData);
      
      request.onsuccess = () => {
        console.log('Location saved to IndexedDB');
        resolve(locationData);
      };
      
      request.onerror = (event) => {
        console.error('Error saving location to IndexedDB', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getLocationHistory(userId, limit = 50) {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('userId');
      
      const locations = [];
      const request = index.openCursor(IDBKeyRange.only(userId));
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && locations.length < limit) {
          locations.push(cursor.value);
          cursor.continue();
        } else {
          // Sort by timestamp descending (newest first)
          locations.sort((a, b) => b.timestamp - a.timestamp);
          resolve(locations);
        }
      };
      
      request.onerror = (event) => {
        console.error('Error retrieving location history', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async clearLocationHistory(userId) {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('userId');
      
      const request = index.openCursor(IDBKeyRange.only(userId));
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = (event) => {
        console.error('Error clearing location history', event.target.error);
        reject(event.target.error);
      };
    });
  }
}

// Create and export a singleton instance
const geolocationDB = new GeolocationDatabase(); 