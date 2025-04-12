// Main JavaScript file for Geoloc Application
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in by looking for user data in page
  const userDataElement = document.getElementById('userData');
  if (userDataElement) {
    try {
      const userData = JSON.parse(userDataElement.dataset.user);
      if (userData && userData.id) {
        initializeLocationTracking(userData.id);
        // Initialize sync manager after location tracker
        syncManager.init();
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }

  // Setup UI elements if present
  setupTrackingControls();
  setupLocationHistoryDisplay();
  setupDataManagementControls();
});

/**
 * Initialize location tracking with the user ID
 */
function initializeLocationTracking(userId) {
  console.log('Initializing location tracking for user:', userId);
  locationTracker.setUserId(userId);

  // Auto-start tracking if configured
  if (document.body.dataset.autoStartTracking === 'true') {
    startLocationTracking();
  }

  // Update UI state
  updateTrackingUI();
}

/**
 * Start location tracking
 */
async function startLocationTracking() {
  try {
    await locationTracker.startTracking();
    updateTrackingUI();
    showToast('Location tracking started');
  } catch (error) {
    console.error('Failed to start tracking:', error);
    showToast('Failed to start location tracking', 'error');
  }
}

/**
 * Stop location tracking
 */
function stopLocationTracking() {
  locationTracker.stopTracking();
  updateTrackingUI();
  showToast('Location tracking stopped');
}

/**
 * Update the UI to reflect current tracking state
 */
function updateTrackingUI() {
  const isTracking = locationTracker.isTracking();
  const startBtn = document.getElementById('startTrackingBtn');
  const stopBtn = document.getElementById('stopTrackingBtn');
  const statusElement = document.getElementById('trackingStatus');

  if (startBtn) {
    startBtn.disabled = isTracking;
  }
  
  if (stopBtn) {
    stopBtn.disabled = !isTracking;
  }
  
  if (statusElement) {
    statusElement.textContent = isTracking ? 'Active' : 'Inactive';
    statusElement.className = isTracking ? 'status-active' : 'status-inactive';
  }
}

/**
 * Setup the tracking control buttons
 */
function setupTrackingControls() {
  const startBtn = document.getElementById('startTrackingBtn');
  const stopBtn = document.getElementById('stopTrackingBtn');
  const clearBtn = document.getElementById('clearHistoryBtn');

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      startLocationTracking();
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      stopLocationTracking();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear your location history?')) {
        try {
          await locationTracker.clearLocationHistory();
          showToast('Location history cleared');
          refreshLocationHistory();
        } catch (error) {
          console.error('Failed to clear history:', error);
          showToast('Failed to clear location history', 'error');
        }
      }
    });
  }
}

/**
 * Setup the location history display
 */
function setupLocationHistoryDisplay() {
  const refreshBtn = document.getElementById('refreshHistoryBtn');
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshLocationHistory();
    });
  }

  // Listen for location updates to refresh history
  window.addEventListener('locationUpdated', () => {
    refreshLocationHistory();
  });
}

/**
 * Setup data management controls
 */
function setupDataManagementControls() {
  const autoCleanToggle = document.getElementById('autoCleanToggle');
  const cleanOldBtn = document.getElementById('cleanOldBtn');
  const statusEl = document.getElementById('syncStatus');
  
  if (cleanOldBtn) {
    cleanOldBtn.addEventListener('click', async () => {
      if (confirm('This will remove location data older than 7 days. Continue?')) {
        cleanOldBtn.disabled = true;
        const success = await syncManager.cleanOldLocations(7);
        cleanOldBtn.disabled = false;
        
        if (success) {
          showToast('Old location data cleaned up', 'success');
          refreshLocationHistory();
        } else {
          showToast('Failed to clean up old data', 'error');
        }
      }
    });
  }
  
  if (autoCleanToggle) {
    autoCleanToggle.addEventListener('change', () => {
      syncManager.toggleAutoClean(autoCleanToggle.checked);
      showToast(`Auto-cleanup ${autoCleanToggle.checked ? 'enabled' : 'disabled'}`);
    });
  }
  
  // Update connection status when it changes
  window.addEventListener('onlineStatusChanged', (event) => {
    if (statusEl) {
      const isOnline = event.detail.isOnline;
      statusEl.textContent = isOnline ? 'Connected (local storage only)' : 'Offline (local storage only)';
      statusEl.className = isOnline ? 'status-active' : 'status-inactive';
    }
  });
  
  // Update status when locations are cleaned up
  window.addEventListener('locationsCleanedUp', (event) => {
    showToast(`Cleaned ${event.detail.removed} old locations`, 'success');
    refreshLocationHistory();
  });
}

/**
 * Refresh the location history display
 */
async function refreshLocationHistory() {
  const historyContainer = document.getElementById('locationHistoryContainer');
  if (!historyContainer) return;

  try {
    const history = await locationTracker.getLocationHistory(10);
    
    if (history.length === 0) {
      historyContainer.innerHTML = '<p>No location history found.</p>';
      return;
    }
    
    let html = '<ul class="location-history-list">';
    history.forEach(entry => {
      const date = new Date(entry.timestamp);
      html += `
        <li class="location-history-item">
          <div class="location-coords">
            <span>Lat: ${entry.latitude.toFixed(6)}</span>
            <span>Lng: ${entry.longitude.toFixed(6)}</span>
          </div>
          <div class="location-time">
            ${date.toLocaleString()}
          </div>
        </li>
      `;
    });
    html += '</ul>';
    
    historyContainer.innerHTML = html;
  } catch (error) {
    console.error('Error fetching location history:', error);
    historyContainer.innerHTML = '<p>Error loading location history.</p>';
  }
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'info') {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Remove after delay
  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    setTimeout(() => {
      if (toast.parentNode === toastContainer) {
        toastContainer.removeChild(toast);
      }
    }, 500);
  }, 3000);
} 