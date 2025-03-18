let db; //Переменная под базу данных

// Открытие базы данных IndexedDB
const request = indexedDB.open('locationDB', 1);

//Создание базы данных
request.onupgradeneeded = (event) => {
    db = event.target.result; //Получение доступа к базе
    const objectStore = db.createObjectStore('locations', { keyPath: 'id', autoIncrement: true }); //Создание объектного хранилища
    objectStore.createIndex('latitude', 'latitude', { unique: false }); //широта
    objectStore.createIndex('longitude', 'longitude', { unique: false }); //долгота
    objectStore.createIndex('timestamp', 'timestamp', { unique: false }); //время
};

//Если база данных открыта
request.onsuccess = (event) => {
    db = event.target.result;
    console.log('Database opened successfully');
};

//Если база данных не открыта
request.onerror = (event) => {
    console.error('Database error:', event.target.errorCode);
};

//Сохранение местоположения в базе
function saveLocation(latitude, longitude) {
    const transaction = db.transaction(['locations'], 'readwrite'); //Создание транзакции для чтения и записи
    const objectStore = transaction.objectStore('locations'); //Получение доступа к объектному хранилищу locations
    const locationData = { latitude, longitude, timestamp: new Date() };
    objectStore.add(locationData); //Добавление данных в базу 
    //Транзакция выполнена
    transaction.oncomplete = () => {
        console.log('Location saved to IndexedDB:', locationData);
        //displayLocation(locationData);
    };
    //Транзакция не выполнена
    transaction.onerror = (event) => {
        console.error('Error saving location:', event.target.errorCode);
    };
}

//Функция получения местоположения
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const latitude = position.coords.latitude; //Получение широты
            const longitude = position.coords.longitude; //Получение долготы
            saveLocation(latitude, longitude); //Сохранение в базу данных
        }, (error) => { //Обработка ошибки
            console.error('Error getting location:', error);
        });
    }
    else { //В случае если браузер не поддерживает  Geolocation Api
        console.log('Geolocation is not supported by this browser.');
    }
}

//Запуск функции для получения местоположения
getLocation();

//Частота обновления данных в милисикундах (сейчас стоит 10 секунд)
setInterval(getLocation, 10000);
