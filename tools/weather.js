module.exports = {
    getWeatherByCityName: getWeatherByCityName,
    getWeatherByGeoCoords: getWeatherByGeoCoords
}

global.fetch = require("node-fetch");

const apiKey = "16cef8b09402035e00967f9f98573581"

function formatRequestWithGeoCoords(lat, lon) {
    return `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&lang=ru`
}

function formatRequestWithQuery(query) {
    return `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${apiKey}&lang=ru`
}

function getWeatherByCityName(query) {
    return baseWeatherRequest(formatRequestWithQuery(query))
}

function getWeatherByGeoCoords(lat, lon) {
    return baseWeatherRequest(formatRequestWithGeoCoords(lat, lon));
}

async function baseWeatherRequest(url) {
    const response = await fetch(encodeURI(url));
    if (!response.ok) {
        const serverError = JSON.parse(await response.text());
        const status = parseInt(serverError['cod']);
        const error = { 'status': status };
        console.log(serverError);
        if (status === 404) {
            error['msg'] = "Введенного Вами города нет в базе. Проверьте правильность написания имени города";
        } else {
            error['msg'] = serverError['message'];
        }
        return error;
    }
    const text = await response.text();
    const jsonResponse = JSON.parse(text);
    const city = fetchCityFromJson(jsonResponse);
    const weather = fetchWeatherFromJson(jsonResponse);
    return {
        'city': city,
        'weather': weather,
        'status': 200
    };
}

function fetchCityFromJson(response) {
    return {
        'id': response['id'],
        'city_name': response['name'],
        'lat': response['coord']['lat'],
        'lon': response['coord']['lon']
    }
}

function fetchWeatherFromJson(response) {
    const weatherMain = response['main'];
    const weatherAddon = response['weather'][0];
    const wind = response['wind']
    return {
        'humidity': weatherMain['humidity'],
        'temperature': convertKelvinToCelsius(weatherMain['temp']),
        'pressure': weatherMain['pressure'],
        'cloudiness': weatherAddon['description'],
        'icon_url': formatWeatherIcon(weatherAddon['icon']),
        'wind_direction': extractWindDirectionFromDegrees(wind['deg']),
        'wind_speed': wind['speed']
    }
}

function convertKelvinToCelsius(kelvin) {
    return Math.floor(kelvin - 273);
}

function formatWeatherIcon(iconId) {
    return `http://openweathermap.org/img/wn/${iconId}@4x.png`
}

function extractWindDirectionFromDegrees(deg) {
    if (deg > 348.75 || deg < 11.25) {
        return "North";
    } else if (deg > 11.25 && deg < 33.75) {
        return "North, Northeast";
    } else if (deg > 33.75 && deg < 56.25) {
        return "Northeast";
    } else if (deg > 56.25 && deg < 78.75) {
        return "East, Northeast";
    } else if (deg > 78.75 && deg < 101.25) {
        return "East";
    } else if (deg > 101.25 && deg < 123.75) {
        return "East, Southeast";
    } else if (deg > 123.75 && deg < 146.25) {
        return "Southeast";
    } else if (deg > 146.25 && deg < 168.75) {
        return "South, Southeast";
    } else if (deg > 168.75 && deg < 191.25) {
        return "South";
    } else if (deg > 191.25 && deg < 213.75) {
        return "South, Southwest";
    } else if (deg > 213.75 && deg < 236.25) {
        return "Southwest";
    } else if (deg > 236.25 && deg < 258.75) {
        return "West, Southwest";
    } else if (deg > 258.75 && deg < 281.25) {
        return "West"
    } else if (deg > 281.25 && deg < 303.75) {
        return "West, Northwest";
    } else if (deg > 303.75 && deg < 326.25) {
        return "Northwest";
    } else {
        return "North, Northwest";
    }
}