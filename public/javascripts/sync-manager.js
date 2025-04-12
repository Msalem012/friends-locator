// Sync Manager for Geoloc App
class SyncManager {
  constructor() {
    this.syncInProgress = false;
    this.syncInterval = null;
    this.autoSyncEnabled = true;
    this.syncIntervalTime = 5 * 60 * 1000; // 5 minutes by default
  }

  /**
   * Initialize the sync manager
   */
  init() {
    // Setup event listeners
    window.addEventListener('online', () => {
      this.handleOnlineStatus(true);
    });
    
    window.addEventListener('offline', () => {
      this.handleOnlineStatus(false);
    });
    
    // Start monitoring if we're online
    this.handleOnlineStatus(navigator.onLine);
    
    console.log('Sync manager initialized - local only mode');
  }

  /**
   * Handle online/offline status changes
   */
  handleOnlineStatus(isOnline) {
    console.log(`Connection status: ${isOnline ? 'Online' : 'Offline'}`);
    
    // Dispatch online status event
    window.dispatchEvent(new CustomEvent('onlineStatusChanged', {
      detail: { isOnline }
    }));
  }

  /**
   * Toggle auto-clean feature and update user preferences
   */
  async toggleAutoClean(enabled) {
    this.autoSyncEnabled = enabled;
    
    if (enabled) {
      console.log('Auto-clean enabled');
    } else {
      console.log('Auto-clean disabled');
    }
    
    // Dispatch event for UI update
    window.dispatchEvent(new CustomEvent('autoCleanStatusChanged', {
      detail: { enabled }
    }));
    
    return true;
  }

  /**
   * Clean old location data
   * This function removes data older than the specified period
   */
  async cleanOldLocations(days = 7) {
    console.log(`Cleaning locations older than ${days} days`);
    
    try {
      // Calculate cutoff date
      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
      
      // Get the user ID
      const userId = locationTracker.userId;
      if (!userId) {
        console.error('Cannot clean locations: User ID not set');
        return false;
      }
      
      // Access the database directly
      await geolocationDB.init();
      
      // We need to get all locations to filter by date
      const allLocations = await geolocationDB.getLocationHistory(userId, 1000);
      
      // Filter out locations to keep
      const locationsToKeep = allLocations.filter(loc => loc.timestamp >= cutoffTime);
      
      // If we're keeping all locations, no need to proceed
      if (locationsToKeep.length === allLocations.length) {
        console.log('No old locations to clean');
        return true;
      }
      
      // Clear all locations
      await geolocationDB.clearLocationHistory(userId);
      
      // Re-add locations to keep
      const savePromises = [];
      
      for (const loc of locationsToKeep) {
        // Create a position-like object
        const positionObj = {
          coords: {
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy || 0,
            altitude: loc.altitude || null,
            altitudeAccuracy: loc.altitudeAccuracy || null,
            heading: loc.heading || null,
            speed: loc.speed || null
          },
          timestamp: loc.timestamp
        };
        
        savePromises.push(geolocationDB.saveLocation(userId, positionObj));
      }
      
      await Promise.all(savePromises);
      
      const removedCount = allLocations.length - locationsToKeep.length;
      console.log(`Cleaned ${removedCount} old locations, kept ${locationsToKeep.length}`);
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('locationsCleanedUp', {
        detail: {
          removed: removedCount,
          kept: locationsToKeep.length
        }
      }));
      
      return true;
    } catch (error) {
      console.error('Error cleaning old locations:', error);
      return false;
    }
  }
}

// Create global instance
const syncManager = new SyncManager(); 