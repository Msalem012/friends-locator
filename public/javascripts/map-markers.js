// Custom marker class with improved scaling and trail support
class CustomMarker {
    constructor(map, latitude, longitude, username, options = {}) {
        if (!map || !map.addLayer) {
            throw new Error('Valid Leaflet map instance is required');
        }

        this.map = map;
        this.latitude = latitude;
        this.longitude = longitude;
        this.username = username;
        this.options = options;
        this.baseSize = options.size || [32, 32];
        this.currentScale = 1;

        // Create marker with improved icon implementation
        this.marker = L.marker([latitude, longitude], {
            icon: this.createIcon(options.icon || this.createDefaultIcon()),
            draggable: options.draggable || false
        }).addTo(map);

        // Setup zoom handling
        this.setupZoomHandling();

        // Initialize popup
        this.initializePopup(options);

        // Initialize trail if needed
        if (options.isTrail) {
            this.addTrail(options.trailOptions);
        }
    }

    createDefaultIcon() {
        return {
            imageUrl: '/images/raccoon-svgrepo-com.png',
            size: this.baseSize,
            anchor: [this.baseSize[0] / 2, this.baseSize[1]],
            className: 'custom-marker-icon'
        };
    }

    createIcon(iconOptions) {
        const isCustomIcon = iconOptions instanceof L.Icon;
        if (isCustomIcon) return iconOptions;

        const imgUrl = iconOptions.imageUrl || '/images/raccoon-svgrepo-com.png';
        const size = iconOptions.size || this.baseSize;
        const anchor = iconOptions.anchor || [size[0] / 2, size[1]];

        return L.divIcon({
            className: `custom-marker ${iconOptions.className || ''}`,
            html: `
                <div class="marker-container" style="
                    width: ${size[0]}px; 
                    height: ${size[1]}px;
                    transform-origin: center bottom;
                ">
                    <img src="${imgUrl}" alt="${this.username}" 
                         style="width: 100%; height: 100%; object-fit: contain;">
                    <span class="marker-username">${this.username.charAt(0).toUpperCase()}</span>
                </div>
            `,
            iconSize: size,
            iconAnchor: anchor,
            popupAnchor: [0, -anchor[1]]
        });
    }

    setupZoomHandling() {
        this.updateIconScale(this.map.getZoom());

        this.map.on('zoomend', () => {
            this.updateIconScale(this.map.getZoom());
        });
    }

    updateIconScale(currentZoom) {
        const baseZoom = 13; // Zoom level where marker appears at normal size
        const scale = Math.min(1.5, Math.max(0.7, 1 + (currentZoom - baseZoom) * 0.05));
        this.currentScale = scale;

        const iconElement = this.marker._icon;
        if (iconElement) {
            const container = iconElement.querySelector('.marker-container');
            if (container) {
                container.style.transform = `scale(${scale})`;
            }
        }
    }

    initializePopup(options) {
        const popupContent = options.popupContent || this.createDefaultPopup();
        this.marker.bindPopup(popupContent, {
            className: 'custom-popup',
            offset: L.point(0, -this.baseSize[1] * this.currentScale)
        });
    }

    createDefaultPopup() {
        return `
            <div class="custom-popup-content">
                <h3>${this.username}</h3>
                <p>Lat: ${this.latitude.toFixed(6)}</p>
                <p>Lng: ${this.longitude.toFixed(6)}</p>
                <p>Updated: ${new Date().toLocaleTimeString()}</p>
            </div>
        `;
    }

    updatePosition(lat, lng) {
        this.latitude = lat;
        this.longitude = lng;
        this.marker.setLatLng([lat, lng]);

        if (this.trail) {
            this.updateTrail(lat, lng);
        }

        return this;
    }

    updateUsername(username) {
        this.username = username;
        this.marker.setPopupContent(this.createDefaultPopup());
        return this;
    }

    addTrail(options = {}) {
        if (!this.trail) {
            this.trail = L.polyline([], {
                color: options.color || '#3498db',
                weight: options.weight || 3,
                opacity: options.opacity || 0.7,
                smoothFactor: 1,
                className: 'custom-trail'
            }).addTo(this.map);

            // Add initial point if we have position
            if (this.latitude && this.longitude) {
                this.trail.addLatLng([this.latitude, this.longitude]);
            }
        }
        return this;
    }

    updateTrail(lat, lng) {
        if (this.trail) {
            this.trail.addLatLng([lat, lng]);

            // Simplify the trail periodically for performance
            const points = this.trail.getLatLngs();
            if (points.length > 100) {
                this.trail.setLatLngs(points.filter((_, i) => i % 2 === 0));
            }
        }
        return this;
    }

    clearTrail() {
        if (this.trail) {
            this.trail.setLatLngs([]);
        }
        return this;
    }

    hideTrail() {
        if (this.trail) {
            // Store trail data but hide it from map
            this.trailData = this.trail.getLatLngs();
            this.trail.remove();
            this.trail = null;
        }
        return this;
    }

    showTrail(options = {}) {
        // If we have stored trail data and no active trail, recreate the trail
        if (this.trailData && !this.trail) {
            this.trail = L.polyline(this.trailData, {
                color: options.color || '#3498db',
                weight: options.weight || 3,
                opacity: options.opacity || 0.7,
                smoothFactor: 1,
                className: 'custom-trail'
            }).addTo(this.map);
        } else if (!this.trail) {
            // If no stored data, create an empty trail
            this.addTrail(options);
        }
        return this;
    }

    removeTrail() {
        if (this.trail) {
            this.trail.remove();
            this.trail = null;
        }
        // Also clear any stored trail data
        this.trailData = null;
        return this;
    }

    remove() {
        if (this.marker) {
            this.marker.remove();
        }
        if (this.trail) {
            this.trail.remove();
        }
    }
}

// Enhanced Marker Manager with better trail handling
export default class MarkerManager {
    constructor(map, options = {}) {
        if (!map || !map.addLayer) {
            throw new Error('Valid Leaflet map instance is required');
        }

        this.map = map;
        this.markers = new Map();
        this.paths = new Map();
        this.trails = new Map();
        this.markerTimeouts = new Map(); // Track timeouts for each marker
        this.lastSeen = new Map();
        this.options = {
            marker: {
                size: [32, 32]
            },
            trailOptions: {
                color: '#3498db',
                weight: 3,
                opacity: 0.7,
                smoothFactor: 1
            },
            markerTimeout: 30000, // 30 seconds before considering a marker stale
            ...options
        };
    }

    setMarker(userId, lat, lng, username, options = {}) {
        // Update last seen timestamp whenever a marker is updated
        this.lastSeen.set(userId, Date.now());

        // Clear any existing timeout for this marker
        if (this.markerTimeouts.has(userId)) {
            clearTimeout(this.markerTimeouts.get(userId));
            this.markerTimeouts.delete(userId);
        }

        let marker = this.markers.get(userId);
        const isTrail = options.isTrail || false;

        if (marker) {
            marker.updatePosition(lat, lng);
            marker.updateUsername(username);

            if (isTrail && !marker.trail) {
                marker.addTrail(this.getTrailOptions(options));
            } else if (!isTrail && marker.trail) {
                marker.removeTrail();
            }
        } else {
            marker = new CustomMarker(this.map, lat, lng, username, {
                ...this.options.marker,
                ...options,
                isTrail: isTrail,
                trailOptions: this.getTrailOptions(options)
            });
            this.markers.set(userId, marker);
        }

        // Add a visibility flag
        marker.isVisible = true;

        // Set a timeout to check marker visibility after a delay
        // This prevents markers from disappearing between updates
        if (userId !== 'current_user') { // Don't timeout the current user's marker
            const timeout = setTimeout(() => {
                console.log(`No updates for marker ${userId} for ${this.options.markerTimeout}ms`);
                // Instead of removing, we could just update visual appearance or fade it
                // this.removeMarker(userId);
                if (marker && marker.marker) {
                    // Make the marker semi-transparent to indicate it's stale
                    const iconElement = marker.marker._icon;
                    if (iconElement) {
                        iconElement.style.opacity = '0.5';
                        marker.isVisible = false;
                    }
                }
            }, this.options.markerTimeout);
            
            this.markerTimeouts.set(userId, timeout);
        }

        return marker;
    }

    // Make sure markers can be restored from stale state
    refreshMarker(userId) {
        const marker = this.markers.get(userId);
        if (marker && !marker.isVisible) {
            const iconElement = marker.marker._icon;
            if (iconElement) {
                iconElement.style.opacity = '1.0';
                marker.isVisible = true;
            }
        }
    }

    // Override the original removeMarker to also clear timeouts
    removeMarker(userId) {
        // Clear any timeout for this marker
        if (this.markerTimeouts.has(userId)) {
            clearTimeout(this.markerTimeouts.get(userId));
            this.markerTimeouts.delete(userId);
        }

        const marker = this.markers.get(userId);
        if (marker) {
            marker.remove();
            this.markers.delete(userId);
        }
        return this;
    }

    getTrailOptions(options) {
        return {
            ...this.options.trailOptions,
            ...(options.trailOptions || {})
        };
    }

    clearAll() {
        this.markers.forEach(marker => marker.remove());
        this.markers.clear();
        this.clearAllPaths();
        return this;
    }

    getMarker(userId) {
        return this.markers.get(userId);
    }

    addTrailForUser(userId, options) {
        const marker = this.getMarker(userId);
        if (marker) {
            marker.addTrail(this.getTrailOptions(options));
        }
        return this;
    }

    removeTrailForUser(userId) {
        const marker = this.getMarker(userId);
        if (marker) {
            marker.removeTrail();
        }
        return this;
    }

    updateTrailForUser(userId, lat, lng) {
        const marker = this.getMarker(userId);
        if (marker) {
            if (!marker.trail) {
                marker.addTrail(this.options.trailOptions);
            }
            marker.updateTrail(lat, lng);
        }
        return this;
    }

    drawPathFromPoints(points, options = {}) {
        if (!points || !Array.isArray(points) || points.length === 0) {
            console.warn('No valid points provided to draw path');
            return null;
        }

        const validPoints = points.filter(p =>
            p.latitude !== undefined &&
            p.longitude !== undefined &&
            !isNaN(p.latitude) &&
            !isNaN(p.longitude)
        );

        if (validPoints.length === 0) {
            console.warn('All points were invalid');
            return null;
        }

        const latLngs = validPoints.map(p => L.latLng(p.latitude, p.longitude));
        const pathId = options.pathId || 'default_path';

        // Remove existing path if it exists
        if (this.paths.has(pathId)) {
            this.map.removeLayer(this.paths.get(pathId));
        }

        const pathOptions = {
            color: '#3b82f6',
            weight: 5,
            opacity: 0.7,
            lineJoin: 'round',
            smoothFactor: 1,
            ...options
        };

        const path = L.polyline(latLngs, pathOptions).addTo(this.map);
        this.paths.set(pathId, path);

        if (options.fitBounds !== false) {
            try {
                this.map.fitBounds(path.getBounds(), {
                    padding: options.padding || [30, 30],
                    maxZoom: options.maxZoom || 18
                });
            } catch (e) {
                console.error('Error fitting bounds:', e);
            }
        }

        return path;
    }

    clearPath(pathId = 'default_path') {
        if (this.paths.has(pathId)) {
            this.map.removeLayer(this.paths.get(pathId));
            this.paths.delete(pathId);
        }
        return this;
    }

    clearAllPaths() {
        this.paths.forEach(path => this.map.removeLayer(path));
        this.paths.clear();
        return this;
    }

    fitToMarkers(padding = 50) {
        const markers = Array.from(this.markers.values());
        if (markers.length > 0) {
            const group = L.featureGroup(markers.map(m => m.marker));
            this.map.fitBounds(group.getBounds(), {
                padding: [padding, padding],
                maxZoom: 18
            });
        }
        return this;
    }

    clearAllTrails() {
        this.markers.forEach(marker => {
            if (marker.trail) {
                marker.hideTrail();
            }
        });
        return this;
    }

    showAllTrails() {
        this.markers.forEach(marker => {
            if (marker.trailData) {
                marker.showTrail();
            }
        });
        return this;
    }

    // Add method to get last seen time for a marker
    getLastSeen(id) {
        return this.lastSeen.get(id) || null;
    }
    
    // Add method to check if a marker is stale (inactive for too long)
    isStale(id, staleThreshold) {
        const lastSeen = this.lastSeen.get(id);
        if (!lastSeen) return true;
        
        const now = Date.now();
        return (now - lastSeen) > staleThreshold;
    }
    
    // Add method to remove stale markers
    removeStaleMarkers(staleThreshold) {
        const staleIds = [];
        
        this.lastSeen.forEach((timestamp, id) => {
            if (this.isStale(id, staleThreshold)) {
                staleIds.push(id);
            }
        });
        
        staleIds.forEach(id => {
            this.removeMarker(id);
            this.lastSeen.delete(id);
        });
        
        return staleIds;
    }
}

// Helper function to create custom icons
export function createCustomIcon(options = {}) {
    const defaultOptions = {
        imageUrl: '/images/raccoon-svgrepo-com.png',
        size: [32, 32],
        anchor: [16, 32],
        className: ''
    };

    const mergedOptions = { ...defaultOptions, ...options };

    return L.divIcon({
        className: `custom-icon ${mergedOptions.className}`,
        html: `
            <div class="marker-container" style="
                width: ${mergedOptions.size[0]}px; 
                height: ${mergedOptions.size[1]}px;
            ">
                <img src="${mergedOptions.imageUrl}" alt="Marker" 
                     style="width: 100%; height: 100%; object-fit: contain;">
            </div>
        `,
        iconSize: mergedOptions.size,
        iconAnchor: mergedOptions.anchor,
        popupAnchor: [0, -mergedOptions.anchor[1]]
    });
}