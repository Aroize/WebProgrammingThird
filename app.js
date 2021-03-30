const express = require('express');
const weather = require('./tools/weather.js');
const favs = require('./tools/favourites');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.redirect('/index.html')
})

app.get('/weather/city', (req, res) => {
   let query = req.query.query;
   if (query !== undefined) {
       weather.getWeatherByCityName(query)
           .then((response) => { sendResponse(res, response)})
           .catch(reason => {
               console.log(reason);
               sendResponse(res, { "status": 520, "msg": "Unknown error"});
           });
   } else {
       const response = {
           "status": 400,
           "msg": "Must be provided query or geo coords (lat and lon)"
       }
       sendResponse(res, response);
   }
});

app.get('/weather/coordinates', (req, res) => {
    let lat = req.query.lat;
    let lon = req.query.lon;
    if (lat !== undefined && lon !== undefined) {
        weather.getWeatherByGeoCoords(lat, lon)
            .then((response) => { sendResponse(res, response) })
            .catch(reason => {
                console.log(reason);
                sendResponse(res, { "status": 520, "msg": "Unknown error"});
            });
    } else {
        const response = {
            "status": 400,
            "msg": "Must be provided query or geo coords (lat and lon)"
        }
        sendResponse(res, response);
    }
});

app.get('/favourites', (req, res) => {
    const cities = favs.getAllFavCities();
    if (cities === null) {
        sendResponse(res, {'status': 500, 'msg': "Failure while reading favourite cities"});
    } else {
        sendResponse(res, {'status': 200, 'response': cities});
    }
});

app.post('/favourites', (req, res) => {
    let id = req.query.id;
    let cityName = req.query.city_name;
    let lat = req.query.lat;
    let lon = req.query.lon;
    if (id === undefined || cityName === undefined || lat === undefined || lon === undefined) {
        sendResponse(res, {'status': 400, 'msg': 'One of required parameters wasn\'t specified (id, city_name, lat or lon)'});
    } else {
        const success = favs.insertFavCity({ 'id': id, 'city_name': cityName, 'lat': lat, 'lon': lon });
        if (success) {
            sendResponse(res, {'status': 200, 'response': "Success"});
        } else {
            sendResponse(res, {'status': 500, 'msg':
                    `Ошибка при добавлении города в избранное. 
                    При перезагрузке страницы данный город не будет отображен в избранном.`
            });
        }
    }
});

app.delete('/favourites', (req, res) => {
    let id = req.query.id;
    const success = favs.deleteFavCity(id);
    if (success) {
        sendResponse(res, {'status': 200, 'response': "Success"});
    } else {
        sendResponse(res, {'status': 500, 'msg': "Failure while deleting favourite city"});
    }
})

function sendResponse(res, response) {
    res.status(response['status'])
        .json(response);
}

app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`);
});