String.prototype.isEmpty = function() {
    return (this.length === 0 || !this.trim());
};

window.addEventListener("load", function () {

    updateCurrentCity();

    const storedCitiesCallback = function (cities) {
        cities.forEach(city => {
            const cityWeatherCallback = function (weather) {
                appendCityToFavourites(city, weather, false);
            }
            showFavouriteCityLoadingPlaceholder(city);
            requestCityWeather(city, cityWeatherCallback);
        });
    }

    getStorageCities(storedCitiesCallback);
}, false);

/**
 * geo utils
 */

function updateCurrentCity() {
    showHeaderLoadingView();
    const currentCityGeoCallback = function (lat, lon) {
        const city = {
            "city_name": null,
            "lat": lat,
            "lon": lon
        }
        const currentCityWeatherCallback = function (weather) {
            showCurrentCityGeo(city, weather);
        }

        requestCityWeather(city, currentCityWeatherCallback)
    }
    getCurrentGeo(currentCityGeoCallback);
}

function getCurrentGeo(callback) {
    const geolocation = navigator.geolocation;
    const positionCallback = function (position) {
        callback(position.coords.latitude, position.coords.longitude);
    }

    const positionErrorCallback = function (positionError) {
        // Hardcoded SP coordinates
        callback(60., 31.);
    }

    geolocation.getCurrentPosition(positionCallback, positionErrorCallback, null);
}

function addCityToFavouritesByName() {
    const inputField = document.getElementById("new-favourite-city");
    const query = inputField.value;

    if (query.isEmpty()) {
        alert("Запрос не может быть пустым!");
        return;
    }

    if (!hasCityNameInStorage(query)) {
        inputField.value = "";

        const city = {
            "city_name": query,
            "lat": null,
            "lon": null
        };

        const requestCallback = function (weather) {
            if (hasCityInStorage(city['id'])) {
                alert("У вас уже добавлен этот город в избранное!");
                removeCityPlaceholder(city);
            } else {
                appendCityToFavourites(city, weather, true);
            }
        };
        showFavouriteCityLoadingPlaceholder(city);
        requestCityWeather(city, requestCallback);
    } else {
        alert("У вас уже добавлен этот город в избранное!");
    }
}

/**
 * api utils
 */

function formatRequestWithGeoCoords(lat, lon) {
    return `http://localhost:8888/weather/coordinates?lat=${lat}&lon=${lon}`;
}

function formatRequestWithQuery(query) {
    return `http://localhost:8888/weather/city?query=${query}`;
}

function favouriteCitiesUrl() {
    return `http://localhost:8888/favourites`;
}

function addToFavouriteCityUrl(city) {
    const id = city['id'];
    const city_name = city['city_name'];
    const lat = city['lat'];
    const lon = city['lon'];
    return `http://localhost:8888/favourites?id=${id}&city_name=${city_name}&lat=${lat}&lon=${lon}`;
}

function removeFromFavouritesCityUrl(id) {
    return `http://localhost:8888/favourites?id=${id}`;
}

function requestCityWeather(city, requestCallback) {
    if (city["city_name"] == null) {
        requestCityWeatherByGeoCoords(city, requestCallback);
    } else {
        requestCityWeatherByCityName(city, requestCallback);
    }
}

function requestCityWeatherByGeoCoords(city, callback) {
    const xhr = new XMLHttpRequest();
    const requestUrl = formatRequestWithGeoCoords(city["lat"], city["lon"]);
    xhr.open("GET", requestUrl, true);
    xhr.addEventListener("load", function (event) {
        if (xhr.status !== 200) {
            const errorJson = JSON.parse(xhr.responseText);
            console.log(errorJson);
            alert(errorJson['msg']);
            removeCityPlaceholder(city);
        } else {
            const jsonResponse = JSON.parse(xhr.responseText);
            city['id'] = jsonResponse['city']['id'];
            city['city_name'] = jsonResponse['city']['city_name'];
            const weather = jsonResponse['weather'];
            callback(weather);
        }
    }, false);
    xhr.addEventListener("error", function (event) {
        alert("Произошла ошибка! Проверьте доступ к сети");
        removeCityPlaceholder(city);
    }, false)
    xhr.send();
}

function requestCityWeatherByCityName(city, callback) {
    const xhr = new XMLHttpRequest();
    const requestUrl = formatRequestWithQuery(city['city_name']);
    xhr.open("GET", requestUrl, true);
    xhr.addEventListener("load", function (event) {
        if (xhr.status !== 200) {
            const errorJson = JSON.parse(xhr.responseText);
            console.log(errorJson);
            alert(errorJson['msg']);
            removeCityPlaceholder(city);
        } else {
            const jsonResponse = JSON.parse(xhr.responseText);
            city['id'] = jsonResponse['city']['id'];
            city['lat'] = jsonResponse['city']['lat'];
            city['lon'] = jsonResponse['city']['lon'];
            const weather = jsonResponse['weather'];
            callback(weather);
        }
    }, false);
    xhr.addEventListener("error", function (event) {
        alert("Произошла ошибка! Проверьте доступ к сети");
        removeCityPlaceholder(city);
    }, false)
    xhr.send();
}

function requestAllFavouriteCities(callback) {
    const xhr = new XMLHttpRequest();
    const url = favouriteCitiesUrl();
    xhr.open("GET", url, true);
    xhr.addEventListener("load", function () {
        if (xhr.status !== 200) {
            const errorJson = JSON.parse(xhr.responseText);
            console.log(errorJson);
            alert(errorJson['msg']);
        } else {
            const response = JSON.parse(xhr.responseText);
            const cities = response['response'];
            callback(cities);
        }
    });
    xhr.addEventListener("error", function () {
        alert("Произошла ошибка! Проверьте доступ к сети");
    });
    xhr.send();
}

function requestAddCityToFavourites(city, callback) {
    const xhr = new XMLHttpRequest();
    const url = addToFavouriteCityUrl(city);
    xhr.open("POST", url, true);
    xhr.addEventListener("load", () => {
        if (xhr.status !== 200) {
            const errorJson = JSON.parse(xhr.responseText);
            console.log(errorJson);
            alert(errorJson['msg']);
        } else {
            callback(city);
        }
    });
    xhr.addEventListener("error", function () {
        alert("Произошла ошибка! Проверьте доступ к сети");
    });
    xhr.send();
}

function requestRemoveCityFromFavourites(cityId, callback) {
    const xhr = new XMLHttpRequest();
    const url = removeFromFavouritesCityUrl(cityId);
    xhr.open("DELETE", url, true);
    xhr.addEventListener("load", () => {
        if (xhr.status !== 200) {
            const errorJson = JSON.parse(xhr.responseText);
            console.log(errorJson);
            alert(errorJson['msg']);
        } else {
            callback(cityId);
        }
    });
    xhr.addEventListener("error", function () {
        alert("Произошла ошибка! Проверьте доступ к сети");
    });
    xhr.send();
}

/**
 * view utils
 */

function createHeaderLoadingElement() {
    const template = document.getElementById("loading-header-template");
    const docFragment = document.importNode(template.content, true);
    const div = docFragment.querySelector("div");
    div.id = "loading-view";
    return div;
}

function showHeaderLoadingView() {
    const btn = document.getElementsByClassName("update-btn")[0];
    btn.disabled = true;
    hideCurrentWeatherBlock();
    const container = document.getElementById("main-root");
    container.insertBefore(createHeaderLoadingElement(), container.firstChild);
}

function hideHeaderLoadingView() {
    const btn = document.getElementsByClassName("update-btn")[0];
    btn.disabled = false;
    const loadingView = document.getElementById("loading-view");
    loadingView.remove();
}

function showCurrentWeatherBlock() {
    hideHeaderLoadingView();

    const headerBlockTemplate = document.getElementById("header-city-template");
    const headerBlockFragment = document.importNode(headerBlockTemplate.content, true);
    const headerBlock = headerBlockFragment.querySelector("div");

    const headerListTemplate = document.getElementById("header-city-list-template");
    const headerListFragment = document.importNode(headerListTemplate.content, true);
    const headerList = headerListFragment.querySelector("div");
    headerList.id = "info-by-geolocation";

    const container = document.getElementById("main-root");
    container.insertBefore(headerList, container.firstChild);
    container.insertBefore(headerBlock, headerList);
}

function hideCurrentWeatherBlock() {
    const container = document.getElementById("main-root");
    if (container.children[1].id === "info-by-geolocation") {
        container.firstChild.remove();
        container.firstChild.remove();
    }
}

function createFavouriteCityBlock(city) {
    const favouriteCityTemplate = document.getElementById("favourite-city-template");
    const favouriteCityFragment = document.importNode(favouriteCityTemplate.content, true);
    const favouriteCityDiv = favouriteCityFragment.querySelector("div");

    const block = placeHolderCollection[city['city_name']];
    block.replaceWith(favouriteCityDiv);
    return favouriteCityDiv;
}

const placeHolderCollection = {}

function removeCityPlaceholder(city) {
    placeHolderCollection[city['city_name']].remove();
    placeHolderCollection[city['city_name']] = null;
}

function showFavouriteCityLoadingPlaceholder(city) {
    const favouritesList = document.getElementById("favourites-list");
    let lastListItem = favouritesList.lastChild;
    if (lastListItem == null || lastListItem.childNodes.length === 2) {
        lastListItem = document.createElement("li");
        lastListItem.classList.add("container");
        favouritesList.appendChild(lastListItem);
    }

    const placeholderTemplate = document.getElementById("loading-city-template");
    const placeholderFragment = document.importNode(placeholderTemplate.content, true);
    const placeholderDiv = placeholderFragment.querySelector("div");

    const loadingCity = placeholderDiv.getElementsByTagName("h4")[0];
    loadingCity.innerHTML = city['city_name'];

    lastListItem.appendChild(placeholderDiv);
    placeHolderCollection[city['city_name']] = placeholderDiv;
}

function appendCityToFavourites(city, weather, needToSaveToStorage) {
    if (needToSaveToStorage) {
        saveCityToStorage(city);
    }
    const cityBlock = createFavouriteCityBlock(city);

    const cityHeader = cityBlock.children[0];
    fillCityHeader(city, weather, cityHeader);

    const cityList = cityBlock.children[1].children;
    fillCityList(city, weather, cityList);
}

function showCurrentCityGeo(city, weather) {

    showCurrentWeatherBlock()

    const cityName = document.getElementById("geolocation-city-name");
    const cityIcon = document.getElementById("geolocation-city-icon");
    const cityTemperature = document.getElementById("geolocation-temperature");

    const geoInfo = document.getElementById("info-by-geolocation");

    cityName.innerHTML = city['city_name'];
    cityIcon.src = weather['icon_url'];
    cityTemperature.innerHTML = `${weather['temperature']}°C`;

    const geoInfoList = geoInfo.children[0].children;
    fillCityList(city, weather, geoInfoList);
}

function fillCityHeader(city, weather, header) {
    const cityName = header.getElementsByTagName("h4")[0];
    cityName.innerHTML = city['city_name'];
    const cityTemperature = header.getElementsByTagName("span")[0];
    cityTemperature.innerHTML = `${weather['temperature']}°C`;
    const cityIcon = header.getElementsByTagName("img")[0];
    cityIcon.src = weather['icon_url'];

    const btn = header.getElementsByTagName("button")[0];
    btn.addEventListener("click", function () {
        const removeCardCallback = () => {
            const liParent = btn.parentElement.parentElement.parentElement;
            btn.parentElement.parentElement.remove();
            if (liParent.children.length !== 0) {
                rebalanceFavouriteList(liParent);
            }
        }
        removeCityFromStorage(city, removeCardCallback);
    }, false);
}

function fillCityList(city, weather, geoInfoList) {
    for (let i = 0; i < geoInfoList.length; ++i) {
        const listItem = geoInfoList[i];
        const geoField = listItem.children[0];
        switch (i) {
            case 0:
                geoField.innerHTML = `${weather['wind_speed']}m/s, ${weather['wind_direction']}`;
                break;
            case 1:
                const condition = weather['cloudiness'];
                geoField.innerHTML = capitalizeFirstLetter(condition);
                break;
            case 2:
                const pressure = weather['pressure'];
                geoField.innerHTML = `${pressure} hpa`
                break;
            case 3:
                const humidity = weather['humidity'];
                geoField.innerHTML = `${humidity}%`
                break;
            case 4:
                geoField.innerHTML = `[${Math.floor(city['lat'])}, ${Math.floor(city['lon'])}]`
                break;
        }
    }
}

function rebalanceFavouriteList(singleContainer) {
    const favList = document.getElementById("favourites-list");
    if (favList.children.length === 0) {
        return;
    }
    if (favList.children[favList.children.length - 1].children.length === 1) {
        // Одинокий чел, грустный
        const oneElement = favList.children[favList.children.length - 1].children[0];
        oneElement.remove();
        singleContainer.append(oneElement);
    } else {
        // Парный чел, довольный
        singleContainer.remove();
        favList.append(singleContainer);
    }
}

function capitalizeFirstLetter(string) {
    return string.slice(0, 1).toUpperCase() + string.slice(1);
}

/**
 * storage utils
 */

let citiesList = [];

function getStorageCities(callback) {
    const addToLocalCache = function (cities) {
        cities.forEach(city => citiesList.push(city));
        console.log(citiesList);
        callback(cities);
    }
    requestAllFavouriteCities(addToLocalCache);
}

function saveCityToStorage(city) {
    const addToLocalCache = function (city) {
        citiesList.push(city);
        console.log(citiesList);
    }
    requestAddCityToFavourites(city, addToLocalCache);
}

function removeCityFromStorage(city, callback) {
    const id = city['id'];
    const removeFromCacheCallback = (cityId) => {
        citiesList = citiesList.filter((value) => value['id'] !== cityId);
        callback();
    }
    requestRemoveCityFromFavourites(id, removeFromCacheCallback);
}

function hasCityNameInStorage(cityName) {
    const lowerCaseCityName = cityName.toLowerCase();
    const index = citiesList.findIndex(value => value['city_name'].toLowerCase() === lowerCaseCityName);
    return index !== -1;
}

function hasCityInStorage(cityId) {
    const index = citiesList.findIndex(value => value['id'] === cityId);
    return index !== -1;
}