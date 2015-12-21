/**
 * Created by nguyenlinh on 4/14/15.
 */

var adminApp = angular.module("adminApp", ['ngRoute', 'ui.router', 'ngAnimate', 'ui.bootstrap', 'ui.utils']);


adminApp.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {

    $urlRouterProvider.otherwise("/");

    $stateProvider.state('dashboard', {
        url: "/",
        templateUrl: "views/cms/admin/dashboard.html",
        controller: 'dashboardController'
    }).state('user', {
        url: "/user",
        templateUrl: "views/cms/admin/user.html",
        controller: 'userController'
    }).state('park', {
        url: "/park",
        templateUrl: "views/cms/admin/park.html",
        controller: 'parkController'
    }).state('profile', {
        url: "/profile",
        templateUrl: "views/cms/admin/profile.html",
        controller: 'profileController'
    })

});

adminApp.controller('headerController', ['$scope', '$http', function ($scope, $http) {
    $http.get('/api/admin/getinfo').success(function (data, status, headers, config) {
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

adminApp.controller('dashboardController', ['$scope', '$location', '$http', function ($scope, $location, $http) {
}]);

adminApp.controller('profileController', ['$scope', '$location', '$http', function ($scope, $location, $http) {
}]);

adminApp.controller('userController', ['$scope', '$location', '$http', '$log', '$modal', function ($scope, $location, $http, $log, $modal) {

    $scope.users = [];
    $scope.itemsPerPage     = 10;
    $scope.currentPage      = 1;
    $scope.filter           = {};

    $scope.resetFilter = function() {
        $scope.filter  = {};
    }

    $scope.filterBy = function(){
        $scope.currentPage = 1;
        getUserList(($scope.currentPage-1)* $scope.itemsPerPage, $scope.itemsPerPage);
    }

    function initialize () {

        getUserList(($scope.currentPage-1)* $scope.itemsPerPage, $scope.itemsPerPage);

        $scope.$watch('currentPage', function(currentPage){
            getUserList((currentPage-1)* $scope.itemsPerPage, $scope.itemsPerPage);
        });

    }

    setTimeout(function(){
        initialize();
    }, 20);

    function getUserList (offset, limit) {
        $http.post("/api/admin/getUserList",
            {
                offset:     offset,
                limit:      limit,
                filter:     $scope.filter || {}
            })
            .success(function (data)
            {
                $scope.users = data.users;
                $scope.totalItems = data.total;
            })
    }

    $scope.editUser = function (user) {
        var modalInstance = $modal.open({
            templateUrl: 'views/cms/admin/editUser.html',
            controller:  'editUserController',
            resolve: {
                'user': function () {
                    return user;
                }
            }
        });
    }

    $scope.disable = function(user){
        $http.post('/api/admin/disableUser', {id: user._id}).success(function(data, status, headers, config){
            showPopup("Disable User Successfully");
            getUserList(($scope.currentPage-1)* $scope.itemsPerPage, $scope.itemsPerPage);

        }).error(function (error, status)
        {
            var box = bootbox.alert(error.errorCode);
            box.find(".btn-primary").removeClass("btn-primary").addClass("btn btn-sm");
        });
    }

    $scope.activate = function(user) {
        $http.post('/api/admin/activateUser', {id: user._id}).success(function(data, status, headers, config){

            showPopup("Activate User Successfully");
            getUserList(($scope.currentPage-1)* $scope.itemsPerPage, $scope.itemsPerPage);

        }).error(function (error, status)
        {
            var box = bootbox.alert(error.errorCode);
            box.find(".btn-primary").removeClass("btn-primary").addClass("btn btn-sm");
        });
    }
}]);


adminApp.controller('editUserController', ["$scope", "$modalInstance", "$http", "user", function ($scope, $modalInstance, $http, user) {
    $scope.user = user;

    $scope.submitUserForm = function () {
        $modalInstance.close();

        $http.post('/api/user/updateinfo', $scope.user).success(function (data, status, headers, config) {

            showPopup("Update User Successfully");

            setTimeout(function(){
                location.reload();
            }, 1500);

        }).error(function (error, status)
        {
            var box = bootbox.alert(error.errorCode);
            box.find(".btn-primary").removeClass("btn-primary").addClass("btn btn-sm");
        });
    }

    $scope.closeModal = function () {
        $modalInstance.close();
    }

}]);

adminApp.controller('parkController', ['$scope', '$location', '$http', function ($scope, $location, $http) {

    setTimeout(function () {
        $('#parkNameModal').on('shown.bs.modal', function () {
            if ($scope.geocoder && $scope.pickedLatLng) {

                $scope.geocoder.geocode({ 'latLng': $scope.pickedLatLng }, function (results, status) {

                    if (status == google.maps.GeocoderStatus.OK) {

                        if (results[0]) {
                            $scope.parkName = results[0].formatted_address;
                            $scope.$apply();
                        }

                    }
                });
            }
        });

    }, 20)

    $scope.loadParks = function (latitutde, longitude, distance, limit, map) {

        var params = {
            latitude:   latitutde,
            longitude:  longitude,
            distance:   distance,
            limit:      limit
        }

        $http.post('/api/car/searchpark', params).success(function (data, status, headers, config) {

            $scope.parkList = data.parks;

        }).error(function (error, status) {

            var box = bootbox.alert(error.errorCode);

            box.find(".btn-primary").removeClass("btn-primary").addClass("btn btn-sm");

        });

    }

    $scope.parkList_Click = function (park) {
        var myLatLng = new google.maps.LatLng(park.location[1], park.location[0]);

        var icon = 'images/park_32.ico';

        var newMarker = new google.maps.Marker({
            position:   myLatLng,
            map:        $scope.map,
            icon:       icon
        });

        if ($scope.parkMarker) {
            $scope.parkMarker.setMap(null);
        }

        $scope.parkMarker = newMarker;

        $scope.map.setCenter(myLatLng);
    }

    $scope.addingPark = false;

    //add a park
    $scope.addPark_Click = function () {
        $scope.addingPark = true;
    }

    //cancel adding park
    $scope.addPark_Cancel = function () {

        if ($scope.map) {
            $scope.map.setOptions({ draggableCursor: null });
        }

        $scope.addingPark   = false;
        $scope.pickedLatLng = null;
        $scope.parkName     = null;
        $('#parkNameModal').modal('hide');
    }

    //submit adding a map
    $scope.submit_OnClick = function () {
        if ($scope.pickedLatLng) {

            if (isNullOrEmpty($scope.parkName)) {
                showPopup("Park name is missing!");
                return;
            };

            $http.post('/api/car/buildpark/', {

                latitude: $scope.pickedLatLng.lat(),

                longitude: $scope.pickedLatLng.lng(),

                name: $scope.parkName

            }).success(function (data, status, headers, config) {

                $scope.pickedLatLng = null;

                showPopup("Add New Parking Lot Successfully!");

                setTimeout(function () {
                    location.reload();
                }, 1000);

            }).error(function (error, status) {

                var box = bootbox.alert(error.errorCode);

                box.find(".btn-primary").removeClass("btn-primary").addClass("btn btn-sm");

            });
        }

        $('#parkNameModal').modal('hide');
    }

    $scope.initializeMap = function () {
        var mapCanvas = document.getElementById('park_mapcanvas');

        console.log('initializing map');

        $scope.geocoder = new google.maps.Geocoder();

        //get current position
        getLocation(function (position) {
            var myLatLng = new google.maps.LatLng(1.350380, 103.851959);
            var mapOptions = {
                center: myLatLng,
                zoom: 15,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            }

            var map = new google.maps.Map(mapCanvas, mapOptions);

            $scope.map = map;

            var marker = new google.maps.Marker({
                position: map.getCenter(),
                map: map,
                title: 'Click to zoom'
            });

            var icon = 'images/park_32.ico';

            $scope.loadParks(position.coords.latitude, position.coords.longitude, 0, 30);

            google.maps.event.addListener(map,'click',function (event) {
                if ($scope.addingPark) {

                    $scope.addingPark   = false;

                    map.setOptions({ draggableCursor: null });

                    $scope.pickedLatLng = event.latLng;

                    $('#parkNameModal').modal({
                        show: true
                    });
                }

            });

            google.maps.event.addListener(map, 'mousemove', function (event) {
                if ($scope.addingPark == true) {
                    map.setOptions({ draggableCursor: "url('images/park_32.ico'), move" });
                }
            });

        });
    };

}]);




adminApp.directive('mapCanvas', ['$window', '$q', function ($window, $q) {
    var params;

    return {
        restrict: 'A',
        link: function (scope, element, attrs) { // function content is optional

            $window.initializeMap = function () {
                scope.initializeMap();
            }

            if (window.google && google.maps) {
                scope.initializeMap();
            } else {
                $.getScript("http://maps.google.com/maps/api/js?callback=initializeMap");
            }
        }
    };
}]);
