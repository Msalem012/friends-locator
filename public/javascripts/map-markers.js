// Map marker management for Geoloc
class CustomMarker {
    constructor(map, latitude, longitude, username) {
        this.map = map;
        this.latitude = latitude;
        this.longitude = longitude;
        this.username = username;
        this.trailVisible = false;

        const customIcon = L.icon({
            iconUrl: 'https://www.svgrepo.com/show/484570/octopus.svg',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
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
        
        navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                // Update marker location
                customMarker.updateLocation(latitude, longitude);
                
                // Center map on user if this is their own marker
                if (customMarker.isCurrentUser) {
                    customMarker.map.setView([latitude, longitude], 13);
                }
                
                // Emit location update via Socket.IO if connected
                if (window.socket && userId) {
                    window.socket.emit('location_update', {
                        userId: userId,
                        latitude: latitude,
                        longitude: longitude
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
                console.error('Error getting location:', error);
                showLocationError(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
        
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

    // Add a new marker
    addMarker(userId, latitude, longitude, username, isCurrentUser = false) {
        // Remove existing marker for this user if it exists
        this.removeMarker(userId);
        
        // Create new marker
        const marker = new CustomMarker(this.map, latitude, longitude, username);
        
        // Store if this is the current user
        marker.isCurrentUser = isCurrentUser;
        
        // Enable trail for current user only
        marker.shouldShowTrail = isCurrentUser;
        
        // Store in our collection
        this.markers.set(userId, marker);
        
        // If this is the current user, store a reference and start tracking
        if (isCurrentUser) {
            this.currentUserMarker = marker;
            trackUserLocation(marker);
        }
        
        return marker;
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