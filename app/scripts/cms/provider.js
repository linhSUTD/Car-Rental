/**
 * Created by nguyenlinh on 4/14/15.
 */

var providerApp = angular.module("providerApp", ['ngRoute', 'ui.router', 'ngAnimate', 'ui.bootstrap', 'ui.utils']);


providerApp.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {

    $urlRouterProvider.otherwise("/");

    $stateProvider.state('dashboard', {
        url: "/",
        templateUrl: "views/cms/provider/dashboard.html",
        controller: 'dashboardController'
    }).state('car', {
        url: "/car",
        templateUrl: "views/cms/provider/car.html",
        controller: 'carController'
    }).state('profile', {
        url: "/profile",
        templateUrl: "views/cms/provider/profile.html",
        controller: 'profileController'
    })

});

providerApp.controller('dashboardController', ['$scope', '$http', function ($scope, $http) {

}]);

providerApp.controller('profileController', ['$scope', '$http', function ($scope, $http) {

}]);

providerApp.controller('headerController', ['$scope', '$http', function ($scope, $http) {

    $http.get('/api/provider/getinfo').success(function (data, status, headers, config) {
        $scope.user = data.user;

    }).error(function (error, status) {

        var box = bootbox.alert("Services are restricted!", function () {
            window.location = URL.LOGIN;
        });

        box.find(".btn-primary").removeClass("btn-primary").addClass("btn btn-sm");

    });

    $scope.logout = function () {
        $http.get('/api/user/logout').success(function (data, status, headers, config) {
            showPopup("Log Out Successfully");
            setTimeout(function () {
                window.location = URL.PORTAL;
            }, 1000);
        })
    }
}]);

providerApp.controller('carController', ['$scope', '$http', '$modal', function ($scope, $http, $modal) {

    $scope.createCar = function () {
        var modalInstance = $modal.open({
            templateUrl: 'views/cms/provider/createCar.html',
            controller:  'createCarController'
        });
    }

    $scope.itemsPerPage = 10;
    $scope.currentPage  = 1;
    $scope.filter       = {};

    $scope.resetFilter  = function() {
        $scope.filter   = {};
    }

    $scope.filterBy = function(){
        $scope.currentPage = 1;
        getCarList(($scope.currentPage-1)* $scope.itemsPerPage, $scope.itemsPerPage);
    }

    function initialize () {

        getCarList(($scope.currentPage-1)* $scope.itemsPerPage, $scope.itemsPerPage);

        $scope.$watch('currentPage', function(currentPage){
            getCarList((currentPage-1)* $scope.itemsPerPage, $scope.itemsPerPage);
        });

    }

    setTimeout(function(){
        initialize();
    }, 20);

    function getCarList (offset, limit) {
        $http.post("/api/car/getlist/provider",
        {
            offset:     offset,
            limit:      limit,
            filter:     $scope.filter || {}
        })
        .success(function (data) {
            $scope.carList = data.carList;
            $scope.totalItems = data.total;

        })
    }

    $scope.editCar = function (car) {
        var modalInstance = $modal.open({
            templateUrl: 'views/cms/provider/editCar.html',
            controller:  'editCarController',
            resolve: {
                'car': function () {
                    return car;
                }
            }
        });
    }
}]);

providerApp.controller('editCarController', ['$scope', '$http', '$modalInstance', "car", function ($scope, $http, $modalInstance, car) {

    $scope.car  = car;

    $scope.initializeMap = function () {
        var mapCanvas = document.getElementById('addCar_mapCanvas');

        geocoder = new google.maps.Geocoder();

        //get current position
        getLocation(function (position) {
            var myLatLng = new google.maps.LatLng(1.350380, 103.851959);

            var mapOptions = {
                center: myLatLng,
                zoom: 16,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            }

            var map = new google.maps.Map(mapCanvas, mapOptions);

            $scope.map = map;


            var marker = new google.maps.Marker({
                position: map.getCenter(),
                map: map,
                title: 'Click to zoom'
            });

            var icon = 'http://maps.google.com/mapfiles/kml/pal2/icon47.png';

            $scope.currentParking = new google.maps.LatLng($scope.car.parking.location[1], $scope.car.parking.location[0]);


            $scope.loadParks(position.coords.latitude, position.coords.longitude, 0, 20, map, icon);

        });
    };

    $scope.loadParks = function (latitude, longitude, distance, limit, map, icon) {

        $scope.ParkManager = {
            SelectedIndex: -1,
            ParkingList: []
        };

        var params = {
            latitude:   latitude,
            longitude:  longitude,
            distance:   distance,
            limit:      limit
        }

        $http.post('/api/car/searchpark', params).success(function (data, status, headers, config) {

            var parks = data.parks;

            for (var index in parks) {

                var location = parks[index].location;

                var myLatLng = new google.maps.LatLng(location[1], location[0]);

                var newMarker = new google.maps.Marker({
                    position: myLatLng,
                    map: map,
                    icon: icon
                });

                var newParkManagerObject = {
                    ParkingLot: parks[index],
                    MapMark:    newMarker
                };

                $scope.ParkManager.ParkingList.push(newParkManagerObject);

                //add click event
                newMarker.addListener('click', function (event) {

                    var oldIndex = $scope.ParkManager.SelectedIndex;

                    //update index
                    for (var parkIndex in $scope.ParkManager.ParkingList) {

                        var parkIcon = $scope.ParkManager.ParkingList[parkIndex].MapMark;

                        if (parkIcon.position.lat() == event.latLng.lat() && parkIcon.position.lng() == event.latLng.lng()) {

                            $scope.ParkManager.SelectedIndex = parkIndex;

                            break;
                        }
                    }

                    if ($scope.ParkManager.SelectedIndex != -1 && oldIndex != $scope.ParkManager.SelectedIndex) {
                        //remove animation
                        if (oldIndex != -1) {
                            $scope.ParkManager.ParkingList[oldIndex].MapMark.setAnimation(null);
                        }

                        //update animation
                        $scope.ParkManager.ParkingList[$scope.ParkManager.SelectedIndex].MapMark.setAnimation(google.maps.Animation.BOUNCE);
                    }
                });
            }

            /* animate here */

            for (var parkIndex in $scope.ParkManager.ParkingList) {

                var parkIcon = $scope.ParkManager.ParkingList[parkIndex].MapMark;

                if (parkIcon.position.lat() == $scope.currentParking.lat() && parkIcon.position.lng() == $scope.currentParking.lng()) {

                    $scope.ParkManager.SelectedIndex = parkIndex;

                    $scope.ParkManager.ParkingList[parkIndex].MapMark.setAnimation(google.maps.Animation.BOUNCE);

                    break;
                }
            }


        }).error(function (error, status) {

            var box = bootbox.alert(error.errorCode);

            box.find(".btn-primary").removeClass("btn-primary").addClass("btn btn-sm");
        });

    }

    $scope.cancel = function () {
        $modalInstance.close();
    }

    $scope.submitCar = function () {

        $http.post('/api/car/editCar', {
            id:             $scope.car._id,
            plate:          $scope.car.plate,
            condition:      $scope.car.condition,
            newParkingId:   $scope.ParkManager.ParkingList[$scope.ParkManager.SelectedIndex].ParkingLot._id,
            oldParkingId:   $scope.car.parking._id

        }).success(function (data, status, headers, config) {

            $modalInstance.close();

            showPopup("Update Car Successfully");

            setTimeout(function(){
                location.reload();
            }, 1500);

        }).error(function (error, status) {

            var box = bootbox.alert(error.errorCode);

            box.find(".btn-primary").removeClass("btn-primary").addClass("btn btn-sm");

        });
    }


}]);

providerApp.controller('createCarController', ['$scope', '$http', '$modalInstance', function ($scope, $http, $modalInstance) {

    $scope.cancel = function () {
        $modalInstance.close();
    }

    $scope.initializeMap = function () {
        var mapCanvas = document.getElementById('addCar_mapCanvas');

        geocoder = new google.maps.Geocoder();

        //get current position
        getLocation(function (position) {
            var myLatLng = new google.maps.LatLng(1.350380, 103.851959);

            var mapOptions = {
                center: myLatLng,
                zoom: 16,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            }

            var map = new google.maps.Map(mapCanvas, mapOptions);

            $scope.map = map;


            var marker = new google.maps.Marker({
                position: map.getCenter(),
                map: map,
                title: 'Click to zoom'
            });

            var icon = 'http://maps.google.com/mapfiles/kml/pal2/icon47.png';

            $scope.loadParks(position.coords.latitude, position.coords.longitude, 0, 20, map, icon);

        });
    };

    $scope.loadParks = function (latitude, longitude, distance, limit, map, icon) {

        $scope.ParkManager = {
            SelectedIndex: -1,
            ParkingList: []
        };

        var params = {
            latitude:   latitude,
            longitude:  longitude,
            distance:   distance,
            limit:      limit
        }

        $http.post('/api/car/searchpark', params).success(function (data, status, headers, config) {

            var parks = data.parks;

            for (var index in parks) {

                var location = parks[index].location;

                var myLatLng = new google.maps.LatLng(location[1], location[0]);

                var newMarker = new google.maps.Marker({
                    position: myLatLng,
                    map: map,
                    icon: icon
                });

                var newParkManagerObject = {
                    ParkingLot: parks[index],
                    MapMark:    newMarker
                };

                $scope.ParkManager.ParkingList.push(newParkManagerObject);

                //add click event
                newMarker.addListener('click', function (event) {

                    var oldIndex = $scope.ParkManager.SelectedIndex;

                    //update index
                    for (var parkIndex in $scope.ParkManager.ParkingList) {

                        var parkIcon = $scope.ParkManager.ParkingList[parkIndex].MapMark;

                        if (parkIcon.position.lat() == event.latLng.lat() && parkIcon.position.lng() == event.latLng.lng()) {

                            $scope.ParkManager.SelectedIndex = parkIndex;

                            break;
                        }
                    }

                    if ($scope.ParkManager.SelectedIndex != -1 && oldIndex != $scope.ParkManager.SelectedIndex) {
                        //remove animation
                        if (oldIndex != -1) {
                            $scope.ParkManager.ParkingList[oldIndex].MapMark.setAnimation(null);
                        }

                        //update animation
                        $scope.ParkManager.ParkingList[$scope.ParkManager.SelectedIndex].MapMark.setAnimation(google.maps.Animation.BOUNCE);
                    }
                });
            }


        }).error(function (error, status) {

            var box = bootbox.alert(error.errorCode);

            box.find(".btn-primary").removeClass("btn-primary").addClass("btn btn-sm");
        });


    }

    $scope.newCar = {};

    $scope.submitCar = function () {

        if ($scope.ParkManager.SelectedIndex == -1) {
            var box = bootbox.alert("Choose a parking lot!");
            box.find(".btn-primary").removeClass("btn-primary").addClass("btn btn-sm");
            return;
        }

        $http.post('/api/car/addCar', {
            plate:      $scope.newCar.plate,
            condition:  $scope.newCar.condition,
            parkingId:  $scope.ParkManager.ParkingList[$scope.ParkManager.SelectedIndex].ParkingLot._id

        }).success(function (data, status, headers, config) {

            $modalInstance.close();

            showPopup("Create Car Successfully");

            setTimeout(function(){
                location.reload();
            }, 1500);

        }).error(function (error, status) {

            console.log(error);

            var box = bootbox.alert(error.errorCode);

            box.find(".btn-primary").removeClass("btn-primary").addClass("btn btn-sm");
        });
    }
}]);

providerApp.directive('mapCanvas', ['$window', '$q', function ($window, $q) {
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
                scope.initializeMap();
            } else {
                $.getScript("http://maps.google.com/maps/api/js?callback=initializeMap",function( data, textStatus, jqxhr ) {
                    console.log( "Load was performed." );
                });

            }
        }
    };
}]);

