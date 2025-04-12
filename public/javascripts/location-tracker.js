// Location Tracker for Geoloc Application
class LocationTracker {
  constructor() {
    this.watchId = null;
    this.tracking = false;
    this.userId = null;
    this.options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };
  }

  setUserId(userId) {
    this.userId = userId;
    console.log('User ID set for location tracking:', userId);
  }

  async startTracking() {
    if (!this.userId) {
      console.error('Cannot start tracking: User ID not set');
      throw new Error('User ID not set');
    }

    if (this.tracking) {
      console.log('Already tracking location');
      return;
    }

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      throw new Error('Geolocation not supported');
    }

    try {
      // Initialize the database
      await geolocationDB.init();
      
      // Get current position immediately
      navigator.geolocation.getCurrentPosition(
        position => this.handlePositionUpdate(position),
        error => this.handleError(error),
        this.options
      );
      
      // Start watching position
      this.watchId = navigator.geolocation.watchPosition(
        position => this.handlePositionUpdate(position),
        error => this.handleError(error),
        this.options
      );
      
      this.tracking = true;
      console.log('Location tracking started');
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('locationTrackingStarted'));
      
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw error;
    }
  }

  stopTracking() {
    if (!this.tracking || this.watchId === null) {
      console.log('No active tracking to stop');
      return false;
    }
    
    navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
    this.tracking = false;
    console.log('Location tracking stopped');
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('locationTrackingStopped'));
    
    return true;
  }

  async handlePositionUpdate(position) {
    try {
      await geolocationDB.saveLocation(this.userId, position);
      
      // Dispatch event with the new position
      window.dispatchEvent(new CustomEvent('locationUpdated', {
        detail: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp || Date.now()
        }
      }));
    } catch (error) {
      console.error('Error saving location:', error);
    }
  }

  handleError(error) {
    let errorMessage;
    
    switch(error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Location permission denied";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location information unavailable";
        break;
      case error.TIMEOUT:
        errorMessage = "Location request timed out";
        break;
      default:
        errorMessage = "Unknown location error";
        break;
    }
    
    console.error('Geolocation error:', errorMessage);
    
    // Dispatch error event
    window.dispatchEvent(new CustomEvent('locationError', {
      detail: { code: error.code, message: errorMessage }
    }));
  }

  async getLocationHistory(limit = 10) {
    if (!this.userId) {
      console.error('Cannot get location history: User ID not set');
      throw new Error('User ID not set');
    }
    
    try {
      const history = await geolocationDB.getLocationHistory(this.userId, limit);
      return history;
    } catch (error) {
      console.error('Error getting location history:', error);
      throw error;
    }
  }

  async clearLocationHistory() {
    if (!this.userId) {
      console.error('Cannot clear location history: User ID not set');
      throw new Error('User ID not set');
    }
    
    try {
      await geolocationDB.clearLocationHistory(this.userId);
      console.log('Location history cleared');
      return true;
    } catch (error) {
      console.error('Error clearing location history:', error);
      throw error;
    }
  }

  isTracking() {
    return this.tracking;
  }
}

// Create global instance
const locationTracker = new LocationTracker(); 