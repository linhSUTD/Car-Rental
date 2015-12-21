//provider controller
/// <reference path="https://ajax.googleapis.com/ajax/libs/angularjs/1.3.14/angular.min.js" />

var providerModule = angular.module('providerModule', []);
 
providerModule.controller('providerController', function ($http, $scope) {
    var geocoder;
    $scope.map = null;

    
    $scope.ParkManager = {
        SelectedIndex: -1,
        ParkingList: [],

    };
    $scope.loadParks = function (latitutde, longitude, distance, limit, map, icon) {
        $scope.ParkManager = {
            SelectedIndex: -1,
            ParkingList: [],

        };
        $http.get('/car/searchpark?latitude=' + latitutde + '&longitude=' + longitude + '&distance=' + distance + '&limit=' + limit).success(function (data, status, headers, config) {
            for (var index in data) {
                var location = data[index].location;
                var myLatLng = new google.maps.LatLng(location[1], location[0]);
                
                //add a new marker in the map which allows selecting
                var newMarker = new google.maps.Marker({
                    position: myLatLng,
                    map: map,
                    icon: icon
                });
                var newParkManagerObject = {
                    ParkingLot: data[index],
                    MapMark: newMarker
                };
                
                $scope.ParkManager.ParkingList.push(newParkManagerObject);
                
                

                //add click event
                newMarker.addListener('click', function (event) {
                    //old index
                    var oldIndex = $scope.ParkManager.SelectedIndex;

                    //update index
                    for (var parkindex in $scope.ParkManager.ParkingList) {
                        var obj = $scope.ParkManager.ParkingList[parkindex].MapMark;
                        if (obj.position.lat() == event.latLng.lat() && obj.position.lng() == event.latLng.lng()) {
                            $scope.ParkManager.SelectedIndex = parkindex;
                            break;
                        }
                    }

                    //console.log(event);
                    if ($scope.ParkManager.SelectedIndex != -1 && oldIndex!=$scope.ParkManager.SelectedIndex) {
                        //remove animation
                        if (oldIndex != -1) {
                            $scope.ParkManager.ParkingList[oldIndex].MapMark.setAnimation(null);
                        }
                        
                        //update animation
                        $scope.ParkManager.ParkingList[$scope.ParkManager.SelectedIndex].MapMark.setAnimation(google.maps.Animation.BOUNCE);
                    }
                    
                    
                    
                    
                });
            }
        });
    }
    $scope.initializeMap = function () {
        var mapCanvas = document.getElementById('addCar_mapCanvas');
        console.log('initializing map');
        geocoder = new google.maps.Geocoder();
        
        //get current position
        getLocation(function (position) {
            //var myLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            //fake location for testing
            var myLatLng = new google.maps.LatLng(1.350380, 103.851959);
            var mapOptions = {
                center: myLatLng,
                zoom: 16,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            }
            
            var map = new google.maps.Map(mapCanvas, mapOptions);
            
            $scope.map = map;
            var iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
            
            var marker = new google.maps.Marker({
                position: map.getCenter(),
                map: map,
                title: 'Click to zoom'
            });
            var icon = 'http://maps.google.com/mapfiles/kml/pal2/icon47.png';
            
            //center,distance,limit,map,icon
            //load all parking lots
            $scope.loadParks(position.coords.latitude, position.coords.longitude, 0, 20, map, icon);
            
            ////registter the click event
            //google.maps.event.addListener(map, 'click', function (event) {
            //    $scope.clickMap(event.latLng, map, icon);
            //});
            $scope.map = map;
            $scope.getCarList();
        });
    };
    
    $scope.addCarSubmit = function () {
        if ($scope.addCarPlate == "" || $scope.addCarPlate == null || $scope.ParkManager.SelectedIndex == -1) {
            alert('Write a plate and choose a parking lot');
            return;
        }
        $http.post('/car/addCar', {
            plate: $scope.addCarPlate,
            parkingId: $scope.ParkManager.ParkingList[$scope.ParkManager.SelectedIndex].ParkingLot._id,

        }).success(function (data, status, headers, config) {
            console.log(status);
            $scope.ParkManager.SelectedIndex = -1;
            $scope.addCarPlate = null;
            
            $('#addCarModal').modal('hide');
            $scope.ParkManager.ParkingList[$scope.ParkManager.SelectedIndex].MapMark.setAnimation(null);
        });
        
    }
    
    $scope.getStreetAddress = function (car) {
        var newLatLng = new google.maps.LatLng(car.parking.location[1], car.parking.location[0]);
        geocoder.geocode({ 'latLng': newLatLng }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                //console.log(results);
                if (results[0]) {
                    car.parking.address = results[0].formatted_address;
                    $scope.$apply();
                }
            }

        });
    }

    $scope.carList = [];
    //get car list of this provider
    $scope.getCarList = function () {
        $scope.carList = [];


        $http.get('/car/getlist/provider').success(function (data, status, headers, config) {
            console.log(data);
            $scope.carList = data;
            var datalength = data.length;
            for (var getCarIndex = 0; getCarIndex < datalength; getCarIndex++) {
                var newLatLng = new google.maps.LatLng(data[getCarIndex].parking.location[1], data[getCarIndex].parking.location[0]);
                var car = data[getCarIndex];
                $scope.getStreetAddress(car);
                
            }
            
        });


    }
    var pictureInput = document.getElementById("pictureInput");
    var pictureClient = new XMLHttpRequest();
    pictureClient.onreadystatechange = function () {
        if (pictureClient.readyState == 4 && pictureClient.status == 200) {
            alert(pictureClient.statusText);
            location.reload();
        }
    }

    var pickedCar = null;

    pictureInput.onchange = function () {
        if (pictureInput.files.length == 0) {
            return;
        }

        if(!pickedCar){
            return;
        }

        var file = pictureInput;

        var formData = new FormData();
        console.log(file.files[0]);

        formData.append("uploadPicture", file.files[0]);
        formData.append("carId", pickedCar._id);

        pictureClient.open("post", "/upload/carpicture", true);
        //client.setRequestHeader("Content-Type", "multipart/form-data");
        pictureClient.send(formData);  /* Send to server */
    }

    $scope.addphoto_OnClick = function (car) {
        pictureInput.click();
        pickedCar = car;
    }

});

providerModule.directive('mapCanvas', ['$window', '$q', function ($window, $q) {
    var params;

    return {
        restrict: 'A',
        link: function (scope, element, attrs) { // function content is optional
            // in this example, it shows how and when the promises are resolved

            $window.initializeMap = function () {
                scope.initializeMap();
            }

            if (window.google && google.maps) {
                // Map script is already loaded
                alert("Map script is already loaded. Initialising");
                scope.initializeMap();
            } else {
                alert("Lazy loading Google map...");
                $.getScript("http://maps.google.com/maps/api/js?callback=initializeMap",function( data, textStatus, jqxhr ) {
                    //console.log( data ); // Data returned
                    console.log( textStatus ); // Success
                    console.log( jqxhr.status ); // 200
                    console.log( "Load was performed." );
                });
                
            }
        }
    };
}]);