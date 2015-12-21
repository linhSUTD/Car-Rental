/**
 * Created by nguyenlinh on 5/12/15.
 */
var passport                = require('passport');
var login                   = require('connect-ensure-login');
var Cars                    = require("./smove_modules/car-module.js").Cars;
var config                  = require('./config');
var ProviderDB              = require('./smove_modules/database_schema.js').ProviderDB;

exports.GetNearByCar = [
    function (req, res, next) {
        if (!req.isAuthenticated()) {
            return res.error("Please Log In!");
        }

        next();
    },

    function(req, res) {
        try
        {
            var lat         = req.ensureParam("latitude");
            var lon         = req.ensureParam("longitude");
            var distance    = req.ensureParam("distance", null, true);
        }
        catch(e)
        {
            return res.error(e);
        }

        Cars.SearchCar(lat, lon, distance, function (err, doc) {
            if (err) {
                console.log(err);
                return;
            }
            return res.json(200, {
                cars: doc
            });
        });
    }

]

exports.BuildParkingLot = [
    function (req, res, next) {
        if (!req.isAuthenticated()) {
            return res.error("Please Log In!");
        }

        next();
    },

    function(req, res) {

        if (req.user.role != config.server.UserRole.ADMIN) {
            return res.error();
        }

        try
        {
            var latitude        = req.ensureParam("latitude");
            var longitude       = req.ensureParam("longitude");
            var name            = req.ensureParam("name", "string");
        }
        catch(e)
        {
            console.log(e);
            return res.error(e);
        }

        var coords = [longitude, latitude];

        Cars.BuildPark(name, coords, true, function (err, doc) {
            if (err) {
                console.log(err);
                return res.error(err);
            }

            return res.success();
        });

    }
]


exports.SearchPark = [

    function (req, res, next) {
        if (!req.isAuthenticated()) {
            return res.error("Please Log In!");
        }

        next();
    },

    function(req, res) {

        try {
            var lat         = req.ensureParam("latitude");
            var lon         = req.ensureParam("longitude");
            var distance    = req.ensureParam("distance", null, true);
            var limit       = req.ensureParam("limit", null, true);
        }
        catch (e) {
            return res.error(e);
        }

        var center = [lat, lon];

        if (distance == 0 || distance == null) {
            center = null;
        }

        Cars.SearchParkingLot(center, distance, limit, function (err, doc) {
            if (err) {
                return res.error(err);
            }

            return res.json (200, {
                parks: doc
            })
        });
    }

]

exports.AddCar = [

    function (req, res, next) {
        if (!req.isAuthenticated()) {
            return res.error("Please Log In!");
        }

        next();
    },

    function(req, res) {

        if (req.user.role != config.server.UserRole.PROVIDER) {
            return res.error();
        }

        try {
            var plate       = req.ensureParam("plate", "string");
            var parkingId   = req.ensureParam("parkingId", "string");
            var condition   = req.ensureParam("condition", "string");
        }
        catch (e) {
            return res.error(e);
        }

        ProviderDB.findById (req.user.providerId, function (err, doc) {

            if (err) {
                return res.error(err);
            }

            if (!doc) {
                return res.error("There is no matching provider!");
            }

            Cars.AddCar(req.user.providerId, condition, plate, parkingId, function (err, doc) {
                if (err) {
                    return res.error(err);
                }

                return res.success();
            });
        });
    }
]

exports.editCar = [
    function (req, res, next) {
        if (!req.isAuthenticated()) {
            return res.error("Please Log In!");
        }

        next();
    },

    function(req, res) {

        if (req.user.role != config.server.UserRole.PROVIDER) {
            return res.error();
        }

        try {
            var id              = req.ensureParam("id", "string");
            var plate           = req.ensureParam("plate", "string");
            var newParkingId    = req.ensureParam("newParkingId", "string");
            var oldParking      = req.ensureParam("oldParkingId", "string");
            var condition       = req.ensureParam("condition", "string");
        }
        catch (e) {
            return res.error(e);
        }

        Cars.editCar(id, condition, plate, newParkingId, oldParking, function (err) {

            if (err) {
                return res.error(err);
            }

            return res.success();
        });
    }
]

exports.GetListByProvider = [

    function (req, res, next) {
        if (!req.isAuthenticated()) {
            return res.error("Please Log In!");
        }

        next();
    },

    function(req, res) {

        if (req.user.role != config.server.UserRole.PROVIDER) {
            return res.error();
        }

        try {
            var params = {
                offset: 	req.ensureParam("offset", null, true),
                limit: 		req.ensureParam("limit", null, true),
                filter:     req.ensureParam("filter", "object", true) || {}
            }
        }
        catch (e) {
            return res.error(e);
        }

        ProviderDB.findById (req.user.providerId, function (err, doc) {

            if (err) {
                return res.error(err);
            }

            if (!doc) {
                return res.error("There is no matching provider!");
            }

            Cars.GetCarListByProvider(req.user.providerId, params, function (err, cars, total) {
                if (err) {
                    return res.error(err);
                }

                return res.json(200, {
                    carList:    cars,
                    total:      total
                })
            });
        });
    }
]


exports.GetListByPark = [
    function (req, res, next) {
        if (!req.isAuthenticated()) {
            return res.error("Please Log In!");
        }

        next();
    },

    function(req, res) {

        try {

            var parkId  = req.ensureParam("parkId", "string");
            var limit   = req.ensureParam("limit", null, true);
        }
        catch (e) {
            return res.error(e);
        }

        Cars.GetCarListByPark(parkId, limit, function (err, doc) {

            if (err) {
                return res.error(err);
            }

            return res.json(200, {
                carList: doc
            })
        });

    }
]

exports.RelocateCar = [

    function (req, res, next) {
        if (!req.isAuthenticated()) {
            return res.error("Please Log In!");
        }

        next();
    },

    function(req, res) {

        try {
            var carId       = req.ensureParam("carId", "string");
            var oldParkId   = req.ensureParam("oldParkId", "string");
            var newParkId   = req.ensureParam("newParkId", "string");
        }

        catch (e) {
            return res.error(e);
        }

        Cars.RelocateCar(carId, oldParkId, newParkId, function (err, doc) {
            if (err) {
                return res.error(err);
            }
            return res.success();
        });
    }
]
