// Map marker management for Geoloc
class CustomMarker {
    constructor(map, latitude, longitude, username) {
        this.map = map;
        this.latitude = latitude;
        this.longitude = longitude;
        this.username = username;
        this.trailVisible = false;

        // Use the original octopus SVG icon
        const customIcon = L.icon({
            iconUrl: 'https://www.svgrepo.com/show/484570/octopus.svg',
            iconSize: [38, 38],
            iconAnchor: [19, 38],
            popupAnchor: [0, -35],
            className: 'custom-marker-class'
        });

        // Create marker
        this.marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(this.map);
        
        // Add popup with username
        this.marker.bindPopup(`<b>${this.username}</b>`);
    }

    // Update marker location
    updateLocation(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;

        // Update marker coordinates
        this.marker.setLatLng([latitude, longitude]);

        // Update popup content
        this.marker.setPopupContent(`<b>${this.username}</b>`);
    }

    // Update username
    updateUsername(newUsername) {
        this.username = newUsername;
        this.marker.setPopupContent(`<b>${this.username}</b>`);
    }

    // Remove marker from map
    remove() {
        if (this.marker && this.map) {
            this.map.removeLayer(this.marker);
        }
        
        if (this.trailLine && this.map) {
            this.map.removeLayer(this.trailLine);
        }
    }
}

// Function to track user location
function trackUserLocation(customMarker) {
    if (navigator.geolocation) {
        let trailStarted = false;
        let watchId = null;
        let locationErrorCount = 0;
        let lastReportTime = 0;
        const minReportInterval = 2000; // Minimum time between location reports in milliseconds

        // Function to start location tracking
        function startTracking() {
            // Clear existing watch if any
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }

            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    // Reset error count on successful position
                    locationErrorCount = 0;
                    
                    const { latitude, longitude, accuracy } = position.coords;
                    const now = Date.now();
                    
                    // Don't update too frequently to save battery
                    if (now - lastReportTime < minReportInterval) {
                        return;
                    }
                    
                    // Only use location updates with reasonable accuracy
                    if (accuracy > 100) {
                        console.log("Skipping low accuracy location:", accuracy, "meters");
                        return;
                    }
                    
                    lastReportTime = now;

                    // Update marker location
                    customMarker.updateLocation(latitude, longitude);
                    
                    // Emit location update via Socket.IO if connected
                    if (window.socket && window.socket.connected && userId) {
                        window.socket.emit('location_update', {
                            userId: userId,
                            latitude: latitude,
                            longitude: longitude,
                            timestamp: now
                        });
                    }
                    
                    // Start drawing trail after a delay
                    if (!trailStarted && customMarker.shouldShowTrail) {
                        trailStarted = true;
                        setTimeout(() => {
                            drawFilteredTrail(customMarker);
                            console.log("Trail drawing started");
                        }, 5000);
                    }
                },
                (error) => {
                    locationErrorCount++;
                    console.error('Error getting location:', error, 'Count:', locationErrorCount);
                    
                    // Show error only on first occurrence
                    if (locationErrorCount === 1) {
                        showLocationError(error);
                    }
                    
                    // If we get repeated errors, try restarting after a delay
                    if (locationErrorCount >= 3) {
                        console.log("Multiple location errors, restarting tracking...");
                        setTimeout(() => {
                            startTracking();
                        }, 10000); // Wait 10 seconds before trying again
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                }
            );
        }

        // Start tracking immediately
        startTracking();
        
        // Setup ping interval to ensure server knows we're still online
        const pingInterval = setInterval(() => {
            if (window.socket && window.socket.connected && userId) {
                window.socket.emit('user_ping', { userId: userId });
            }
        }, 30000); // Every 30 seconds
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                console.log("Page is visible again, resuming tracking");
                // Restart tracking when page becomes visible again
                startTracking();
                
                // Force an immediate location check
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const { latitude, longitude } = position.coords;
                            customMarker.updateLocation(latitude, longitude);
                            
                            // Emit location update
                            if (window.socket && window.socket.connected && userId) {
                                window.socket.emit('location_update', {
                                    userId: userId,
                                    latitude: latitude,
                                    longitude: longitude,
                                    timestamp: Date.now()
                                });
                            }
                        },
                        (error) => console.error('Error getting location on visibility change:', error),
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    );
                }
            }
        });
        
        // Handle beforeunload event
        window.addEventListener('beforeunload', () => {
            // Clear tracking
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
            clearInterval(pingInterval);
            
            // Try to send a final position update
            if (window.socket && window.socket.connected && userId) {
                window.socket.emit('user_disconnecting', { 
                    userId: userId,
                    lastLatitude: customMarker.latitude,
                    lastLongitude: customMarker.longitude
                });
            }
        });
        
        return true;
    } else {
        showLocationError({ code: 0, message: 'Geolocation is not supported by this browser.' });
        return false;
    }
}

// Function to draw a trail for a marker
function drawFilteredTrail(customMarker, pointLifespan = 30000) {
    const trailPath = [[customMarker.latitude, customMarker.longitude]];
    const timestamps = [Date.now()];
    
    const trailLine = L.polyline(trailPath, {
        color: 'blue',
        weight: 4,
        opacity: 0.7,
        smoothFactor: 1
    }).addTo(customMarker.map);

    customMarker.trailVisible = true;
    customMarker.trailLine = trailLine;

    customMarker.showTrail = () => {
        if (!customMarker.map.hasLayer(trailLine)) {
            trailLine.addTo(customMarker.map);
            customMarker.trailVisible = true;
        }
    };

    customMarker.hideTrail = () => {
        if (customMarker.map.hasLayer(trailLine)) {
            customMarker.map.removeLayer(trailLine);
            customMarker.trailVisible = false;
        }
    };

    const originalUpdate = customMarker.updateLocation.bind(customMarker);

    customMarker.updateLocation = (latitude, longitude) => {
        const lastPoint = trailPath[trailPath.length - 1];
        
        // Check if map has distance method (it might not in some versions)
        let distance = 0;
        if (typeof customMarker.map.distance === 'function') {
            distance = customMarker.map.distance(lastPoint, [latitude, longitude]);
        } else {
            // Simple distance calculation as fallback
            const dx = (latitude - lastPoint[0]) * 111000; // approx meters per degree latitude
            const dy = (longitude - lastPoint[1]) * 111000 * Math.cos(lastPoint[0] * Math.PI / 180);
            distance = Math.sqrt(dx*dx + dy*dy);
        }

        if (distance > 2 && distance < 50) {
            originalUpdate(latitude, longitude);
            trailPath.push([latitude, longitude]);
            timestamps.push(Date.now());

            const now = Date.now();
            while (timestamps.length > 0 && now - timestamps[0] > pointLifespan) {
                trailPath.shift();
                timestamps.shift();
            }

            if (customMarker.trailVisible) {
                trailLine.setLatLngs(trailPath);
            }
        } else {
            // Just update position without adding to trail for jumps or tiny movements
            originalUpdate(latitude, longitude);
            console.log("Ignoring jump or very small movement:", distance, "m");
        }
    };
}

// Manager for all markers on the map
class MarkerManager {
    constructor(map) {
        this.map = map;
        this.markers = new Map(); // userId -> marker
        this.currentUserMarker = null;
    }

    // Create icon for a marker
    createMarkerIcon(isCurrentUser) {
        if (isCurrentUser) {
            // Use the octopus icon for the current user
            return L.icon({
                iconUrl: 'https://www.svgrepo.com/show/484570/octopus.svg',
                iconSize: [38, 38],
                iconAnchor: [19, 38],
                popupAnchor: [0, -35],
                className: 'current-user-marker'
            });
        } else {
            // Use a different color octopus for other users
            return L.icon({
                iconUrl: 'https://www.svgrepo.com/show/484570/octopus.svg',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32],
                className: 'other-user-marker'
            });
        }
    }

    // Add a new marker
    addMarker(userId, latitude, longitude, username, isCurrentUser = false) {
        // Remove existing marker for this user if it exists
        this.removeMarker(userId);
        
        // Get the right marker icon
        const customIcon = this.createMarkerIcon(isCurrentUser);
        
        // Create marker with the icon
        const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(this.map);
        
        // Add popup with username
        marker.bindPopup(`<b>${username}</b>`);
        
        // Create our marker object
        const customMarker = new Object();
        customMarker.map = this.map;
        customMarker.marker = marker;
        customMarker.latitude = latitude;
        customMarker.longitude = longitude;
        customMarker.username = username;
        customMarker.isCurrentUser = isCurrentUser;
        customMarker.trailVisible = false;
        
        // Add methods to the marker object
        customMarker.updateLocation = function(lat, lng) {
            this.latitude = lat;
            this.longitude = lng;
            this.marker.setLatLng([lat, lng]);
            this.marker.setPopupContent(`<b>${this.username}</b>`);
        };
        
        customMarker.updateUsername = function(newUsername) {
            this.username = newUsername;
            this.marker.setPopupContent(`<b>${this.username}</b>`);
        };
        
        customMarker.remove = function() {
            if (this.marker && this.map) {
                this.map.removeLayer(this.marker);
            }
            
            if (this.trailLine && this.map) {
                this.map.removeLayer(this.trailLine);
            }
        };
        
        // Enable trail for current user only
        customMarker.shouldShowTrail = isCurrentUser;
        
        // Store in our collection
        this.markers.set(userId, customMarker);
        
        // If this is the current user, store a reference and start tracking
        if (isCurrentUser) {
            this.currentUserMarker = customMarker;
            trackUserLocation(customMarker);
        }
        
        return customMarker;
    }

    // Update an existing marker
    updateMarker(userId, latitude, longitude, username) {
        const marker = this.markers.get(userId);
        
        if (!marker) {
            console.warn(`Marker with userId ${userId} not found`);
            return null;
        }
        
        marker.updateLocation(latitude, longitude);
        
        if (username && username !== marker.username) {
            marker.updateUsername(username);
        }
        
        return marker;
    }

    // Remove a marker
    removeMarker(userId) {
        const marker = this.markers.get(userId);
        
        if (marker) {
            marker.remove();
            this.markers.delete(userId);
            
            if (marker === this.currentUserMarker) {
                this.currentUserMarker = null;
            }
            
            return true;
        }
        
        return false;
    }

    // Clear all markers except current user
    clearOtherMarkers() {
        for (const [userId, marker] of this.markers.entries()) {
            if (!marker.isCurrentUser) {
                marker.remove();
                this.markers.delete(userId);
            }
        }
    }

    // Get all markers
    getAllMarkers() {
        return Array.from(this.markers.values());
    }
}

// Helper function to display location errors
function showLocationError(error) {
    let message = '';
    
    switch(error.code) {
        case 1:
            message = "Location permission denied";
            break;
        case 2:
            message = "Location information unavailable";
            break;
        case 3:
            message = "Location request timed out";
            break;
        default:
            message = error.message || "Unknown location error";
            break;
    }
    
    // Show error message
    alert(`Geolocation error: ${message}`);
} 