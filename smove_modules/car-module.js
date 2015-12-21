/**
 * Created by nguyenlinh on 5/12/15.
 */

var config          = require('./../config');
var CarDB           = require('./database_schema.js').CarDB;
var ParkLocation    = require('./database_schema.js').ParkLocation;
var Common          = require('./common.js').Common;
var async           = require('async');
var bcrypt 	        = require("bcrypt");
var Email           = require('./email.js').Email;
var async           = require('async');
var path            = require('path');

//get all the park in a radius
//center must be an array [long lat] or null
//callback contain err and park doc

var Cars = new (function () {

    var SearchParkingLot = function (center, distance, limit, callback) {
        if (center) {

            if (!distance) {
                return callback("wrong format", null);
            }

            if (center.length != 2) {
                return callback("wrong center", null);
            }

            var number = limit || 50;

            ParkLocation.find({
                location: {
                    $near: center,
                    $maxDistance: distance * 1.0 / (111.2 * 1000)
                }
            }).limit(number).lean().exec(function (findErr, findDoc) {
                if (findErr) {
                    return callback(findErr,null);
                }
                return callback(null, findDoc);
            });
        } else {
            ParkLocation.find().limit(limit || 20).exec(function (err, doc) {
                if (err) {
                    return callback(err, null);
                }
                return callback(null, doc);
            });
        }
    }

    var BuildPark = function (name, coords, active, callback) {
        //find if another park if too close (<1.0km)
        ParkLocation.find({
            location: {
                $near: coords,
                $maxDistance: 1.0 / 111.2
            }
        }).lean().exec(function (finderr, findDoc) {

            if (finderr) {
                return callback(finderr, null);
            }

            if (findDoc.length > 0) {
                return callback("close", null);
            }

            var newPark = new ParkLocation({
                name:           name,
                location:       coords,
                active:         active,
                carAvailable:   0
            });

            newPark.save(function (saveerr, savedoc) {
                if (saveerr) {
                    return callback(saveerr, null);
                }
                return callback(null, savedoc);
            });
        });
    };

    var AddCar = function (providerId, condition, plate, parkingId, callback) {

        CarDB.find({ plate: plate }).lean().exec(function (findErr, findDoc) {

            if (findErr) {
                return callback(findErr, null);
            }

            if (findDoc.length > 0) {
                return callback("plate existed", findDoc);
            }

            ParkLocation.find({
                $and: [
                    { active: true },
                    { _id: parkingId}
                ]
            }).exec(function (parkErr, parkDoc) {

                if (parkErr) {
                    return callback(parkErr, null);
                }

                if (parkDoc.length == 0) {
                    return callback("no park", null);
                }

                var newCar = new CarDB ({
                    condition:  condition || 'Excellent',
                    plate:      plate,
                    parking:    parkingId,
                    provider:   providerId
                });

                newCar.save(function (saveErr, saveDoc) {
                    if (saveErr) {
                        return callback(saveErr, null);
                    }

                    ParkLocation.update({ _id: parkingId }, { $inc: { carAvailable: 1 } }).lean().exec(function (err, doc) {
                        if (err) {
                            return callback(err, null);
                        } else {
                            return callback(null, doc);
                        }
                    });

                });
            });
        });
    };


    var editCar = function (carId, condition, plate, newParkingId, oldParkingId, callback) {

        RelocateCar (carId, oldParkingId, newParkingId, function (err) {
            if (err) {
                return callback(err);
            }

            CarDB.update({_id: carId}, {
                $set: {
                    plate:      plate,
                    condition:  condition
                }
            }).lean().exec(function (carErr) {

                return callback(carErr);

            })
        });

    };

    var SearchCar = function (latitude, longitude, distance, callback) {
        //choose all parking location near the current location
        // get the max distance or set it to 1 kilometers
        var maxDistance = distance || 1;

        maxDistance = maxDistance / 111.2;

        var coords  = [];
        coords[0]   = longitude;
        coords[1]   = latitude;

        ParkLocation.find({
            $and: [
                {
                    location: {
                        $near: coords,
                        $maxDistance: maxDistance
                    }
                },
                {
                    carAvailable: {
                        "$gte": 0
                    }
                }
            ]

        }).lean().exec(function (err, locationDoc) {

            if (err) {
                return callback(err, null);
            }

            var parkingIds = [];
            //get all the park location schema in one array

            async.forEach(locationDoc, function (parkLocation, parkLocationCallback) {
                parkingId.push(parkLocation._id);
                parkLocationCallback();

            }, function (err) {

                CarDB.find({
                    $and: [
                        {
                            parking: { $in: parkingIds }
                        }
                    ]
                }).lean().exec(function (err, carDoc) {
                    if (err || !carDoc) {
                        callback("error", null);
                        return;
                    }
                    return callback(null, carDoc);
                });
            });
        });
    }

    var GetCarListByProvider = function (providerId, params, callback) {

        var filter = {};

        filter.provider = providerId;

        if (params.filter) {

            if (params.filter.plate && params.filter.plate.length) {
                var plate       = ".*" + params.filter.plate + ".*";
                filter.plate    = new RegExp(plate);
            }

            if (params.filter.condition && params.filter.condition.length) {
                filter.condition  = params.filter.condition;
            }

        }

        async.parallel([
            function (cb) {
                var query = CarDB.find(filter).skip(params.offset).limit(params.limit).populate('parking','location name').lean();

                query.exec(function (err, cars) {

                    if (err) {
                        return cb (err);
                    }

                    return cb (null, cars);
                })
            },

            function (cb) {

                var query = CarDB.count(filter);

                query.exec(function (err, count) {

                    if (err) {
                        return cb (err);
                    }

                    return cb (null, count);
                })
            }
        ], function (err, results) {

            if (err) {
                return callback(err);
            }

            return callback(null, results[0], results[1]);
        });

    }

    var GetCarListByPark = function (parkId, limit, callback) {

        if (limit != 0) {
            CarDB.find({ parking: parkId }).populate('provider').limit(limit).lean().exec(function (err, doc) {
                return callback(err, doc);
            });
        } else {
            CarDB.find({ parking: parkId }).populate('provider').lean().exec(function (err, doc) {
                return callback(err, doc);
            });
        }
    }

    var RelocateCar = function (carId, oldParkId, newParkId, callback) {

        //verify old park
        ParkLocation.update({ _id: oldParkId }, { $inc: { carAvailable: -1 } }).lean().exec(function (oldErr, oldDoc) {
            if (oldErr) {
                return callback(oldErr, null);
            }
            //verify new Park
            ParkLocation.update({ _id: newParkId }, { $inc: { carAvailable: 1 } }).lean().exec(function (newErr, newDoc) {
                if (newErr) {
                    return callback(newErr, null);
                }
                //update car park location
                CarDB.update({ _id: carId }, { $set: { parking: newParkId } }).lean().exec(function (carErr, carDoc) {
                    if (carErr) {
                        return callback(carErr, null);
                    }
                    return callback(null, carDoc);
                });
            });
        });
    }


    this.SearchCar              = SearchCar;
    this.SearchParkingLot       = SearchParkingLot;
    this.AddCar                 = AddCar;
    this.BuildPark              = BuildPark;
    this.GetCarListByProvider   = GetCarListByProvider;
    this.GetCarListByPark       = GetCarListByPark;
    this.RelocateCar            = RelocateCar;
    this.editCar                = editCar;

});

exports.Cars = Cars;
