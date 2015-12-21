var express = require('express');
var router = express.Router();
var mongoose = require('../smove_modules/Database.js');
var Car = require('../smove_modules/Car.js').Car;
var Provider = require('../smove_modules/Provider.js').Provider;
var ParkLocation = require('../smove_modules/Provider.js').ParkLocation;
var newSchema = new mongoose.Schema({
    newDb: { type: Boolean,default:true }

});

var newDb = mongoose.model('newDb', newSchema);

//generate a location [lat,lon] surrounding origin at distance d
//maxDistance in km
function generateCloseLocation(origin, distance) {
    var llUnit = 0.009 * distance;
    var randomLatDif = random() * (llUnit );
    var randomLonDif = Math.sqrt(llUnit * llUnit - randomLatDif * randomLatDif);
    return [randomLatDif, randomLonDif];

}


function AddSampleObjects(lon,lat) { 
    //create some parking slots near your location
    for (var i =0; i < 5; i++) { 
        
    }
}

//check if this is the first time the db starts
newDb.find({}).lean().exec(function (err, doc) {
    if (err || !doc) {
        console.log('newDb prob');
        return;
    }
    if (doc.length == 0) { 
        //new db, add some sample objects

    } else { 
        return;
    }
});


module.exports = router;