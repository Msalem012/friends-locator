// Map marker management for Geoloc
class CustomMarker {
    constructor(map, latitude, longitude, username, icon = null) {
        this.map = map;
        this.latitude = latitude;
        this.longitude = longitude;
        this.username = username;
        this.trailVisible = false;

        try {
            if (icon) {
                // Use the provided icon
                this.marker = L.marker([latitude, longitude], { icon: icon }).addTo(this.map);
            } else {
                // Use a cute animal icon as default (turtle)
                const defaultIcon = L.divIcon({
                    className: 'custom-marker-icon',
                    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="26" height="26">
                            <path fill="#77B255" d="M35.778 19.968c0-3.994-2.952-7.439-7.673-10.527C26.772 8.913 24.32 6.323 24 4c0 0-2.285 3.285-1.159 6.183-2.765-1.221-5.487-2.218-8.093-2.976-.15-.044-.296-.087-.447-.129C13.157 4.073 10.457 0 10.457 0c-.487 2.529-1.532 4.064-2.532 5.914-3.012.837-5.603 1.82-7.638 2.89C-.001 12.533 0 17.519 0 17.519v13.939c0 2.476 8.552 4.485 19.098 4.485 10.547 0 19.1-2.009 19.1-4.485v-5.962c.001-.4.001-.816-.005-1.236-.237 3.123-2.415 3.853-2.415 3.853-3.71 1.995-8.335 2.707-8.335 2.707-5.267.881-9.436-.434-9.436-.434-3.785-.906-5.006-3.311-5.006-3.311-1.281-2.252.324-5.251.324-5.251.906-1.541 2.639-2.043 2.639-2.043 3.962-1.24 6.487 2.042 6.487 2.042 2.042 2.187 1.389 5.416 1.389 5.416-.272 3.244-3.636 2.858-3.636 2.858-1.793-.251-1.793-1.39-1.793-1.39-.046-1.02 1.206-1.206 1.206-1.206.786-.324.6-1.205.6-1.205-.092-.417-.881-.602-.881-.602-2.32-.997-4.776 1.205-4.776 1.205-1.803 1.559-1.109 3.682-1.109 3.682.881 3.405 5.85 4.314 5.85 4.314 5.821 1.238 10.877.116 10.877.116 7.229-1.668 8.335-5.37 8.335-5.37 1.182-2.438.879-4.547.879-4.547-.648-3.346-3.173-3.857-3.173-3.857-1.668-.741-1.574.211-1.574.211.186.462.372.51.372.51.602.046.741.694.741.694 0 .88-1.389.834-1.389.834-1.436-.324-1.158-2.275-1.158-2.275.649-2.228 3.312-1.528 3.312-1.528 3.359.717 3.615 4.223 3.615 4.223.463 3.346-1.624 6.117-1.624 6.117 4.131-2.322 4.732-8.866 4.732-8.866z"/>
                            <path fill="#5C913B" d="M28.109 9.48c-.6-.539-1.215-1.083-1.847-1.633 1.02 7.851-1.089 18.896-15.442 23.453 2.672.538 5.6.947 8.694 1.105 10.527-.67 15.336-7.521 15.336-10.895v-5.962c0-.399 0-.814-.006-1.234-.237 3.123-2.416 3.853-2.416 3.853-3.71 1.995-8.334 2.707-8.334 2.707-5.265.881-9.436-.434-9.436-.434-3.787-.906-5.006-3.311-5.006-3.311l-.002-.004c-.203-.354-.329-.743-.393-1.152-.015-.089-.027-.18-.036-.271-.007-.058-.007-.118-.011-.178-.001-.009-.004-.018-.004-.026-.004-.067-.004-.135-.006-.202 0-.065-.004-.13-.001-.196.001-.065.006-.129.01-.194.001-.014 0-.028.001-.042.007-.098.019-.195.032-.293.006-.045.007-.09.015-.134.001-.008.004-.016.005-.023.025-.131.059-.26.095-.39.019-.069.036-.139.058-.207.026-.081.057-.16.087-.24.024-.062.047-.126.074-.186.025-.057.055-.111.083-.168.038-.077.074-.156.117-.231.024-.043.052-.083.077-.125.057-.094.115-.186.178-.278.025-.036.052-.071.078-.107.052-.071.103-.143.16-.213.037-.045.079-.088.119-.132.05-.057.1-.115.154-.17.05-.05.105-.097.158-.146.049-.045.097-.092.149-.136.059-.05.122-.098.184-.146.043-.033.084-.068.128-.101.084-.06.171-.118.26-.174.027-.018.052-.038.08-.055.117-.07.238-.136.363-.197.021-.01.044-.021.066-.031.098-.045.197-.083.299-.122.047-.018.093-.039.14-.055.07-.025.14-.046.211-.068.068-.021.135-.044.205-.063.053-.014.108-.023.162-.035.086-.02.172-.041.26-.056.036-.007.074-.01.11-.015.12-.018.24-.028.36-.036.02-.001.039-.006.06-.007.119-.004.239-.004.359.004.021.001.042.006.063.007.111.008.222.012.333.029.065.01.128.031.192.044.061.012.123.02.185.035.085.021.168.051.251.08.04.014.082.022.121.037.145.055.285.126.422.196.017.009.036.014.053.023.11.059.213.128.315.197.058.039.121.069.177.112.043.033.08.075.121.11.055.047.111.094.163.145.045.045.081.096.123.143.043.049.087.097.127.15.045.059.082.123.123.186.032.049.066.096.094.147.039.07.069.144.102.216.026.058.056.115.078.175.035.093.061.19.087.286.015.054.034.106.046.161.024.11.036.222.049.334.006.056.02.107.023.164.012.212.006.425-.023.639-.001.011-.004.023-.006.033-.019.137-.05.276-.087.413-.013.05-.022.097-.037.146-.08.261-.188.522-.333.784-.004.007-.005.015-.009.021-.03.055-.073.107-.107.162-.145.236-.309.47-.502.699-.173.205-.358.409-.568.604-.012.011-.028.019-.04.03-.167.149-.342.295-.537.433-.01.007-.021.011-.031.018-.176.122-.361.239-.561.346l-.006.003c-.175.093-.358.174-.549.246-.062.023-.121.048-.184.069-.138.044-.281.082-.429.11-.103.021-.206.036-.313.043-.095.007-.189.01-.287.002-.091-.007-.179-.024-.27-.047-.069-.018-.138-.036-.207-.062-.089-.034-.175-.077-.261-.128-.047-.028-.096-.051-.142-.085-.083-.061-.158-.133-.231-.212-.04-.042-.087-.079-.124-.126-.063-.082-.116-.174-.168-.271-.028-.051-.055-.103-.079-.158-.047-.108-.085-.223-.115-.346-.011-.045-.024-.089-.032-.135-.029-.165-.043-.341-.032-.527.002-.034.012-.065.015-.099.013-.119.038-.247.067-.374.013-.056.019-.115.035-.17.034-.116.082-.234.136-.352.022-.05.041-.102.067-.149.058-.108.127-.217.2-.326.03-.045.06-.092.093-.136.109-.148.232-.296.371-.442.029-.03.063-.057.093-.087.113-.113.234-.226.362-.337.035-.03.073-.056.109-.086.156-.128.321-.254.499-.375.024-.017.051-.03.076-.046.198-.129.407-.254.631-.371.014-.007.03-.011.044-.018.247-.128.513-.248.794-.36.003-.001.005-.001.007-.002.303-.12.626-.231.972-.33 1.264-.358 2.738-.618 4.453-.712.035-.002.073-.002.108-.004.365-.018.732-.03 1.113-.03.378 0 .775.014 1.168.035.056.003.11.011.166.014.366.027.738.062 1.117.11.088.011.177.017.266.029.345.047.694.104 1.048.169.051.01.103.018.154.027.364.07.732.153 1.109.244.05.012.1.025.149.038.353.093.714.196 1.082.31.098.03.199.062.297.093.091.031.183.06.274.091.054.018.105.037.159.057.143.05.287.098.43.15.06.021.116.045.175.067.33.125.663.256.993.398.05.022.1.044.149.066.298.13.595.27.894.416.048.023.097.044.145.069.332.166.664.343.998.53.05.028.1.058.15.087.303.176.605.36.907.553.05.031.1.064.15.096.339.22.677.451 1.017.69.03.022.061.042.091.064.153.11.304.225.456.34-.022-.079-.04-.158-.067-.236-.008-.027-.019-.054-.028-.081-.136-.422-.331-.834-.554-1.241-.304-.553-.661-1.092-1.114-1.642z"/>
                            <circle fill="#3E721D" cx="17" cy="17" r="1"/>
                            <circle fill="#3E721D" cx="21" cy="17" r="1"/>
                            <path fill="#3E721D" d="M21.864 21.5c-2.353 2.67-5.38 0-5.38 0-.372-.291-.097-.809.309-.809h4.762c.406 0 .681.518.309.809z"/>
                        </svg>`,
                    iconSize: [26, 26],
                    iconAnchor: [13, 26],
                    popupAnchor: [0, -13]
                });
                
                this.marker = L.marker([latitude, longitude], { icon: defaultIcon }).addTo(this.map);
            }
        } catch (error) {
            console.error("Error creating marker:", error);
            // Fallback to default marker
            this.marker = L.marker([latitude, longitude]).addTo(this.map);
        }
        
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
    
    // Create a more colorful trail style that matches animal theme
    const trailLine = L.polyline(trailPath, {
        color: customMarker.isCurrentUser ? '#FF9500' : '#4D7BF3', // Orange for current user, blue for others
        weight: 4,
        opacity: 0.7,
        smoothFactor: 1,
        dashArray: '8, 6', // Dashed line for playful effect
        lineCap: 'round'
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
        
        // Create new marker with different appearance based on whether it's the current user
        let marker;
        
        if (isCurrentUser) {
            // Create a cute animal marker for the current user (penguin)
            const currentUserIcon = L.divIcon({
                className: 'current-user-marker-icon',
                html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="32" height="32">
                        <path fill="#31373D" d="M34 29.535c0 3.877-7.611 5.464-15.992 5.464S2 33.412 2 29.535c0-3.877 7.625-10.536 16.008-10.536S34 25.658 34 29.535z"/>
                        <path fill="#66757F" d="M32.496 22.003c0 3.438-6.157 5.497-14.504 5.497-8.348 0-14.492-2.059-14.492-5.497 0-3.438 6.155-6.223 14.502-6.223 8.348 0 14.494 2.785 14.494 6.223z"/>
                        <path fill="#292F33" d="M19.557 28.818c-.198.142-.581-.197-.851-.763-.271-.566-.33-1.133-.133-1.273.198-.142.582.197.852.763.27.566.33 1.134.132 1.273zm-3.125 0c.198.142.581-.197.851-.763.271-.566.33-1.133.133-1.273-.198-.142-.582.197-.852.763-.27.566-.33 1.134-.132 1.273z"/>
                        <path fill="#31373D" d="M9.239 25.35c.469.308 2.4.705 8.736.705 6.196 0 8.785-.383 9.288-.704a.144.144 0 0 0 .048-.198c-.188-.307-3.584-5.235-9.312-5.235-5.662 0-8.983 4.934-9.155 5.234-.049.085-.02.164.048.197z"/>
                        <path fill="#CCD6DD" d="M17.975 25.191c-5.259 0-7.031-.386-7.399-.386-.234 0-.233.356 0 .386.368.048 2.418.386 7.399.386 4.938 0 7.086-.338 7.399-.386.234-.036.234-.386 0-.386-.299 0-2.14.386-7.399.386z"/>
                        <path fill="#3B88C3" d="M27.305 15.981c0 4.582-4.121 8.294-9.205 8.294-5.085 0-9.206-3.712-9.206-8.294 0-4.581 4.121-11.294 9.206-11.294 5.084 0 9.205 6.713 9.205 11.294z"/>
                        <path fill="#55ACEE" d="M26.305 14.981c0 4.582-3.67 8.294-8.205 8.294-4.534 0-8.206-3.712-8.206-8.294 0-4.581 3.671-10.293 8.206-10.293 4.535 0 8.205 5.712 8.205 10.293z"/>
                        <circle fill="#292F33" cx="14.768" cy="15.435" r="1.237"/>
                        <circle fill="#292F33" cx="21.435" cy="15.435" r="1.237"/>
                        <path fill="#F7FCFF" d="M24.471 25.538c-.223 1.004-1.206 1.702-2.198 1.553-.992-.148-1.618-1.078-1.396-2.078.055-.245.16-.461.298-.645.018.104.035.208.059.312.094.416.484.689.868.611.386-.079.626-.488.531-.909-.013-.057-.028-.111-.046-.163.248-.095.519-.147.808-.113.993.147 1.308 1.075 1.076 2.432z"/>
                        <path fill="#F5F8FA" d="M23.979 24.316c-.023 0-.044.005-.066.006.082.115.144.253.172.411.094.42-.168.83-.583.911-.414.082-.827-.193-.92-.613-.019-.085-.025-.169-.025-.252-.166.225-.266.503-.314.808-.182.817.33 1.615 1.143 1.784.812.168 1.613-.354 1.795-1.171.168-.761-.221-1.509-.917-1.766-.093-.028-.189-.036-.285-.118z"/>
                        <path fill="#FFCC4D" d="M18.1 21.6c-1.608 0-2.438-1.109-2.438-1.109-.308-.418-.062-.861-.062-.861.646-.739 1.181-.302 1.181-.302.892.872 1.318.458 1.318.458.511-.424 1.093.147 1.093.147 1.138 1.034 1.535.246 1.535.246.536-.559 1.026-.046 1.026-.046 2.088 2.608 0 2.608 0 2.608-.783.917-2.87.859-3.653-.141z"/>
                     </svg>`,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -16]
            });
            
            marker = new CustomMarker(this.map, latitude, longitude, username, currentUserIcon);
        } else {
            // Use a different animal for other users (rabbit)
            const otherUserIcon = L.divIcon({
                className: 'other-user-marker-icon',
                html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="28" height="28">
                        <path fill="#F7DECE" d="M14.613 16.737c-1.802-.488-2.905-2.105-2.905-3.539 0-2.439 2.263-4.197 4.643-3.538 1.622.449 2.929 2.188 2.799 4.236-.078 1.227-.557 2.396-1.52 3.09-.814.587-2.116.169-3.017-.249z"/>
                        <path fill="#F7DECE" d="M21.387 16.737c1.802-.488 2.905-2.105 2.905-3.539 0-2.439-2.263-4.197-4.643-3.538-1.622.449-2.929 2.188-2.799 4.236.078 1.227.557 2.396 1.52 3.09.814.587 2.116.169 3.017-.249z"/>
                        <path fill="#F7DECE" d="M30 16c0 7.456-5.544 14-12 14S6 23.456 6 16 9.582 4 18 4s12 4.544 12 12z"/>
                        <path fill="#292F33" d="M19 21.896c-.276 0-.5-.224-.5-.5v-1c0-.276.224-.5.5-.5s.5.224.5.5v1c0 .276-.224.5-.5.5zm-2 0c-.276 0-.5-.224-.5-.5v-1c0-.276.224-.5.5-.5s.5.224.5.5v1c0 .276-.224.5-.5.5z"/>
                        <path fill="#292F33" d="M19 21c-.184 0-.36-.102-.447-.277-.501-1.003-1.605-1.003-2.106 0-.142.284-.486.399-.767.257-.282-.142-.398-.485-.257-.767.835-1.669 2.718-1.669 3.553 0 .142.283.028.626-.256.767-.086.043-.177.064-.268.064z"/>
                        <path fill="#F19020" d="M19.835 15.059c-.208.261-.372.595-.419.915-.147 1.012.53 1.906 1.518 1.813 1.054-.1 1.372-1.292.891-2.17-.41-.746-1.432-1.284-1.99-.558zm-3.665 0c.208.261.372.595.419.915.147 1.012-.53 1.906-1.518 1.813-1.054-.1-1.372-1.292-.891-2.17.41-.746 1.432-1.284 1.99-.558z"/>
                        <path fill="#67757F" d="M29.206 18.346c-1.267 2.222-3.992 7.271-11.184 7.657C10.83 26.386 8.77 22.473 6.794 18.346 5.138 14.906 2 11.438 2 7c0-3.313 3.313-6 7-6 2.888 0 3.244 1.683 4.657 3.5C15.467 6.694 16.99 6 18 6c1.01 0 2.534.694 4.343 1.5C23.756 5.683 24.112 4 27 4c3.687 0 7 2.687 7 6 0 4.438-3.138 7.906-4.794 11.346z"/>
                        <path fill="#E1E8ED" d="M33 7c0-2.762-2.687-5-6-5-3.621 0-4.081 2.083-5.407 4-1.535-.917-2.771-1-3.593-1-.822 0-2.058.083-3.593 1C13.081 4.083 12.621 2 9 2 5.687 2 3 4.238 3 7c0 4.117 2.945 7.369 4.712 10.989 2.522 5.157 2.818 7.022 10.288 7.011 7.47-.011 7.776-1.853 10.288-7.011C30.055 14.369 33 11.117 33 7z"/>
                        </svg>`,
                iconSize: [28, 28],
                iconAnchor: [14, 28],
                popupAnchor: [0, -14]
            });
            
            marker = new CustomMarker(this.map, latitude, longitude, username, otherUserIcon);
        }
        
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