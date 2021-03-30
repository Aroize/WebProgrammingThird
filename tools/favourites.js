module.exports = {
    getAllFavCities: getAllFavCities,
    insertFavCity: insertFavCity,
    deleteFavCity: deleteFavCity
}

const sqlite = require('better-sqlite3');

const needToUpgrade = true

const db = sqlite('./db/database.db');

if (needToUpgrade) {
    db.prepare(`DROP TABLE IF EXISTS favs`).run();

    db.prepare(`CREATE TABLE favs ( id INTEGER PRIMARY KEY, city_name TEXT, lat FLOAT, lon FLOAT )`).run();
}

function getAllFavCities() {
    try {
        return db.prepare(`SELECT * FROM favs`).all();
    } catch (e) {
        return null;
    }

}

function insertFavCity(city) {
    try {
        const insert = db.prepare(`INSERT INTO favs ( id, city_name, lat, lon) VALUES (@id, @city_name, @lat, @lon)`);
        insert.run(city);
        return true;
    } catch (e) {
        return false;
    }
}

function deleteFavCity(cityId) {
    try {
        const del = db.prepare(`DELETE FROM favs WHERE id = ?`)
        del.run(cityId);
        return true;
    } catch (e) {
        return false;
    }
}



