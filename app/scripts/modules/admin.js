//admin module
/// <reference path="https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js" />
/// <reference path="https://ajax.googleapis.com/ajax/libs/angularjs/1.3.14/angular.min.js" />
/// <reference path="http://maps.google.com/maps/api/js" />
/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/bootstrap3-dialog/1.34.3/js/bootstrap-dialog.min.js" />

var adminModule = angular.module('adminModule', []);
adminModule.controller('userController', function ($http, $scope,$log) {
    $scope.userList = [];
    $scope.pagination = {};
    $scope.pagination.pageSize = 7;
    $scope.editUser = null;

    $scope.fetchPage = function (currentId, pageNumber) {
        var query = 'pageSize=' + $scope.pagination.pageSize + '&pageNumber=' + pageNumber;
        $http.get('/api/user/fetch?' + query).success(function (data, status, headers, config) {
            if (status == 200) {
                $scope.userList = data;

            }

        });

    }

    $http.get('/api/user/count').success(function (data, status, headers, config) {
        //get user count
        if (status == 200) {
            $scope.pagination.totalItems = data.count;
            $scope.pagination.currentPage = 1;
            $scope.pagination.jumpPage = 1;
        }

        //get and display userList
        $scope.fetchPage(0, 1);

    });


    $scope.pagination.pageChanged = function () {
        $log.log('Page changed to: ' + $scope.pagination.currentPage);
        if ($scope.userList.length == 0) {
            return;
        }
        $scope.fetchPage($scope.userList[0]._id, $scope.pagination.currentPage);
        $scope.pagination.jumpPage = $scope.pagination.currentPage;
    };

    $scope.editButton_OnClick = function (user) {
        //load edit user
        $scope.editUser = user;

        $('#editModal').modal({
            show: true,
        });
    }

    $scope.saveButton_OnClick = function () {
        if (!$scope.editUser) {
            return;
        }

        //save the user info
        $http.post('/api/user/updateinfo', {
            userId: $scope.editUser._id,
            firstname: $scope.editUser.given_name,
            lastname: $scope.editUser.surname,
            contact: $scope.editUser.contact,
            role: $scope.editUser.role,
        }).success(function (data, status, headers, config) {
            if (status == 200) {

            }
            if (status == 409) {
                alert('update failed');
            }

            $('#editModal').modal('hide');
        });
    }

});
adminModule.controller('parkController', function ($http, $scope) {
    $scope.parkList = [];

    //get parking list
    $scope.loadParks = function (latitutde, longitude, distance, limit) {
        $http.get('/car/searchpark?latitude=' + latitutde + '&longitude=' + longitude + '&distance=' + distance + '&limit=' + limit).success(function (data, status, headers, config) {
            console.log(data);
            $scope.parkList = data;
        });
    }
    
    $scope.parkMarker = null;
    $scope.parkList_click = function (park) {
        var myLatLng = new google.maps.LatLng(park.location[1], park.location[0]);
        var icon = 'images/park_32.ico';
        //add a new marker in the map which allows selecting
        var newMarker = new google.maps.Marker({
            position: myLatLng,
            map: $scope.map,
            icon: icon
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
        BootstrapDialog.alert('Choose a place on the map');
    }

    //cancel adding park
    $scope.addPark_cancel = function () {
        $scope.addingPark = false;
        if ($scope.map) {
            $scope.map.setOptions({ draggableCursor: null });
        }
        $scope.pickedLatLng = null;
        $scope.parkName = null;
        $('#parkNameModal').modal('hide');
    }

    //submit adding a map
    $scope.submit_OnClick = function () {
        if ($scope.pickedLatLng) {
            if ($scope.parkName == '' || $scope.parkName == null || !$scope.parkName) {
                BootstrapDialog.alert('Enter the Park name');
                return;
            }
            $http.post('/car/buildpark/', {
                latitude: $scope.pickedLatLng.lat(),
                longitude: $scope.pickedLatLng.lng(),
                name: $scope.parkName,
            }).success(function (data, status, headers, config) {
                if (status == 409) {
                    BootstrapDialog.alert("error");
                } else if (data == "close") {
                    BootstrapDialog.alert("Must not choose a park too close to one another");
                } else {
                    //success
                    $scope.pickedLatLng = null;
                    location.reload();
                }
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
            //var myLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            //fake location for testing
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

            //center,distance,limit,map,icon
            //load all parking lots
            //$scope.loadParks(position.coords.latitude, position.coords.longitude, 3000, 20, map, icon);

            ////registter the click event
            //google.maps.event.addListener(map, 'click', function (event) {
            //    $scope.clickMap(event.latLng, map, icon);
            //});
            $scope.loadParks(position.coords.latitude, position.coords.longitude, 0, 30);

            

            google.maps.event.addListener(map,'click',function (event) {
                if ($scope.addingPark) {
                    console.log(event);
                    $scope.addingPark = false;
                    map.setOptions({ draggableCursor: null });
                    $scope.pickedLatLng = event.latLng;
                    $('#parkNameModal').modal({
                        show: true,
                    });
                }
                
            });
            google.maps.event.addListener(map, 'mousemove', function (event) {
                //console.log('move + add is '+$scope.addingPark);
                if ($scope.addingPark == true) {
                    map.setOptions({ draggableCursor: "url('images/park_32.ico'), move" });
                }
                
            });
        });
    };
});

adminModule.controller('dashboardController', function ($http, $scope) {
    
});

adminModule.directive('mapCanvas', ['$window', '$q', function ($window, $q) {
    var params;

    return {
        restrict: 'A',
        link: function (scope, element, attrs) { // function content is optional
            // in this example, it shows how and when the promises are resolved

            //$(document).mouseup(function (e) {
            //    var container = $("#park_mapcanvas");
            //    if (!container.is(e.target) && container.has(e.target).length === 0) {
            //        // if the target of the click isn't the container, nor a descendant of the container
            //        //click outside
            //        scope.addingPark = false;
            //        if (scope.map) {
            //            scope.map.setOptions({ draggableCursor: null });
            //        }
                    
            //    }
            //});

            $('#parkNameModal').on('shown.bs.modal', function () {
                //edit modal shown
                //auto fill the name
                if (scope.geocoder && scope.pickedLatLng) {
                    scope.geocoder.geocode({ 'latLng': scope.pickedLatLng }, function (results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                            //console.log(results);
                            if (results[0]) {
                                scope.parkName = results[0].formatted_address;
                                scope.$apply();
                                document.getElementById('autoloadText').style.display = 'none';
                            }
                        }

                    });
                }

            });

            $window.initializeMap = function () {
                scope.initializeMap();
            }

            if (window.google && google.maps) {
                // Map script is already loaded
                BootstrapDialog.alert("Map script is already loaded. Initialising");
                scope.initializeMap();
            } else {
                alert("Lazy loading Google map...");
                $.getScript("http://maps.google.com/maps/api/js?callback=initializeMap", function (data, textStatus, jqxhr) {
                    //console.log( data ); // Data returned
                    console.log(textStatus); // Success
                    console.log(jqxhr.status); // 200
                    console.log("Load was performed.");
                });

            }
        }
    };
}]);