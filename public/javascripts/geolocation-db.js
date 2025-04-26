//IndexedDB initialize
let dbInstance; // ���������� ���������� ��� �������� ����������

export function initIndexedDB(callback) {
    const request = indexedDB.open('geoloc_db', 1);

    request.onerror = function (event) {
        console.error('Error opening database:', event.target.error);
        callback(null, event.target.error);
    };

    request.onsuccess = function (event) {
        console.log('IndexedDb is open');
        dbInstance = event.target.result;
    
        // Очищаем хранилище locations
        const transaction = dbInstance.transaction('locations', 'readwrite');
        const store = transaction.objectStore('locations');
        const clearRequest = store.clear();
    
        clearRequest.onsuccess = () => {
            console.log('Locations store cleared successfully');
            callback(dbInstance);
        };
    
        clearRequest.onerror = (err) => {
            console.error('Error clearing locations:', err.target.error);
            callback(dbInstance, err.target.error);
        };
    };

    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('IndexedDb is upgrade');

        // ������� ��������� (������� ��� ���������)
        const locationStore = db.createObjectStore('locations', { keyPath: 'id', autoIncrement: true });
        locationStore.createIndex('latitude', 'latitude', { unique: false });
        locationStore.createIndex('longitude', 'longitude', { unique: false });
        locationStore.createIndex('timestamp', 'timestamp', { unique: false });

        //All users
        const usersStore = db.createObjectStore('users', { keyPath: 'user_id', autoIncrement: true });
        usersStore.createIndex('username', 'username', { unique: false });
        usersStore.createIndex('latitude', 'latitude', { unique: false });
        usersStore.createIndex('longitude', 'longitude', { unique: false });
        usersStore.createIndex('isChosen', 'isChosen', { unique: false });

        //Track another user
        const userLocationStore = db.createObjectStore('userlocations', { keyPath: 'id', autoIncrement: true });
        userLocationStore.createIndex('latitude', 'latitude', { unique: false });
        userLocationStore.createIndex('longitude', 'longitude', { unique: false });
        userLocationStore.createIndex('timestamp', 'timestamp', { unique: false });
    };
}

export function createGeolocationManager() {
    return {
        initialize: (callback) => {
            if (dbInstance) {
                return callback(null); // ��� ����������������
            }

            initIndexedDB((database, error) => {
                if (error) return callback(error);
                dbInstance = database; // ��������� � ���������� ����������
                callback(null);
            });
        },

        saveCurrentGeolocation: (location, callback) => {
            if (!dbInstance) {
                return callback(new Error('Database not initialized'), null);
            }

            const transaction = dbInstance.transaction(['locations'], 'readwrite');
            const store = transaction.objectStore('locations');

            const locationData = {
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: location.timestamp || Date.now(),
            };

            const request = store.add(locationData);

            request.onsuccess = () => {
                console.log('Geolocation data saved successfully:', locationData);
                callback(null, locationData);
            };

            request.onerror = (event) => {
                console.error('Error saving geolocation data:', event.target.error);
                callback(event.target.error, null);
            };
        },
        getCurrentGeolocationAndSave: (callback) => {
            if (!navigator.geolocation) {
                const error = new Error("Geolocation is not supported by this browser.");
                console.error(error.message);
                callback(error, null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const timestamp = position.timestamp;

                    const transaction = dbInstance.transaction(['locations'], 'readwrite');
                    const store = transaction.objectStore('locations');

                    const locationData = {
                        latitude: latitude,
                        longitude: longitude,
                        timestamp: timestamp,
                    };

                    const request = store.add(locationData);

                    request.onsuccess = () => {
                        console.log('Geolocation data saved successfully:', locationData);
                        callback(null, locationData);
                    };

                    request.onerror = (event) => {
                        console.error('Error saving geolocation data:', event.target.error);
                        callback(event.target.error, null);
                    };
                },
                (error) => {
                    console.error('Error getting geolocation:', error);
                    callback(error, null);
                }
            );
        },

        getAllGeolocations: (callback) => {
            const transaction = dbInstance.transaction(['locations'], 'readonly');
            const store = transaction.objectStore('locations');
            const request = store.getAll();

            request.onsuccess = () => {
                const locations = request.result;
                const result = locations.map(loc => ({
                    id: loc.id,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    timestamp: loc.timestamp
                }));
                callback(null, result);
            };

            request.onerror = (event) => {
                console.error('Error getting all locations:', event.target.error);
                callback(event.target.error, null);
            };
        },

        upsertUser: (user, callback) => {
            const transaction = dbInstance.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            const request = store.put(user);
            request.onsuccess = () => {
                console.log(`User ${user.user_id} upserted successfully:`, user);
                callback(null);
            };
            request.onerror = (event) => {
                console.error('Error upserting user', event.target.error);
                callback(event.target.error); // �������� ������ � �������
            };
        },


        clearAndPopulateUserLocations: (locations, callback) => {
            const transaction = dbInstance.transaction(['userlocations'], 'readwrite');
            const store = transaction.objectStore('userlocations');

            const clearRequest = store.clear();

            clearRequest.onsuccess = () => {
                // After clearing, add all locations
                locations.forEach(location => {
                    const addRequest = store.add(location);

                    addRequest.onerror = (event) => {
                        console.error('Error adding location:', event.target.error);
                        transaction.abort(); // Abort transaction if any error occurs
                        callback(event.target.error);
                        return;
                    };
                });

                transaction.oncomplete = () => {
                    console.log('User locations cleared and populated successfully.');
                    callback(null);
                };

                transaction.onerror = (event) => {
                    console.error('Transaction error:', event.target.error);
                    callback(event.target.error);
                };
            };

            clearRequest.onerror = (event) => {
                console.error('Error clearing userlocations:', event.target.error);
                callback(event.target.error);
            };
        }

    };
}