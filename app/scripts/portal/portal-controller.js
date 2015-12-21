/**
 * Created by nguyenlinh on 4/13/15.
 */

var portalAppController = angular.module('portalAppController', []);

var getLocation = function (callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            //getting result done
            return callback(position);
        }, function (error) {
            //error getting position
            var x = null;

            console.log(error);
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    x = "User denied the request for Geolocation."
                    break;
                case error.POSITION_UNAVAILABLE:
                    x = "Location information is unavailable."
                    break;
                case error.TIMEOUT:
                    x = "The request to get user location timed out."
                    break;
            }
            alert(x);
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

$(document).ready(function () {
    $('html, body').stop().animate({
        scrollTop: 0
    }, 50, 'linear');

    // cache the window object
    $window = $(window);
    $.fn.isOnScreen = function () {
        var element = this.get(0);

        var bounds = element.getBoundingClientRect();
        if (bounds.top < window.innerHeight && bounds.bottom > 0) {
            return this;
        } else {
            return null;
        }
    }


    $.fn.isOffScreen = function () {
        var element = this.get(0);
        var bounds = element.getBoundingClientRect();
        if (bounds.top < window.innerHeight && bounds.bottom > 0) {
            return null;
        } else {
            return this;
        }
    }

    //set data background moving speed
    //to create parallax effect
    $('section[data-type="background"]').each(function () {
        // declare the variable to affect the defined data-type
        var $scroll = $(this);

        $(window).scroll(function () {
            // HTML5 proves useful for helping with creating JS functions!
            // also, negative value because we're scrolling upwards
            var yPos = -($window.scrollTop() / $scroll.data('speed'));

            // background position
            var coords = '50% ' + yPos + 'px';

            // move the background
            $scroll.css({ backgroundPosition: coords });
        }); // end window scroll
    });  // end section function

}); // close out script

portalAppController.controller('loginCtrl', ['$scope', '$location', '$http', function ($scope, $location, $http) {
    $scope.user = {};

    $scope.signin = function () {

        $http.post('/api/user/login', $scope.user).success(function (data) {

            window.location = URL.HOMEPAGE;

        }).error(function (error, status) {

            if (error.errorCode && error) {
                var box = bootbox.alert(error.errorCode);

                box.find(".btn-primary").removeClass("btn-primary").addClass("btn btn-sm");

            } else {
                var box = bootbox.alert("Incorrect username or password");

                box.find(".btn-primary").removeClass("btn-primary").addClass("btn btn-sm");
            }
        });
    }
}]);

portalAppController.controller('registerCtrl', ['$scope', '$location', '$http', function ($scope, $location, $http) {
    $scope.user = {};

    $scope.signup = function () {
        $scope.user.username = $scope.user.email;
        $scope.user.role = Properties.PUBLIC_USER;

        $http.post('/api/user/register', $scope.user).success(function (data) {

            showPopup("The activation email has been sent to the email " + $scope.user.email);

        }).error(function (error, status) {
            var box = bootbox.alert(error.errorCode);
            box.find(".btn-primary").removeClass("btn-primary").addClass("btn btn-sm");
        });
    }
}]);


portalAppController.controller('portalController', function ($scope, $timeout, $http) {

    $http.get('/api/user/getinfo').success(function (data, status, headers, config) {
        window.location = URL.HOMEPAGE;
    });

    $scope.about = {};
    $scope.about.texts = [];
    $scope.about.logos = [];
    $scope.about.displayed = false;

    $scope.service = {};
    $scope.service.displayed = false;

    $scope.achievement = {};
    $scope.achievement.displayed = false;

    $scope.feedbackDisplayed = false;

    $scope.drawHeart = function () {

        if ($scope.feedbackDisplayed == true) {
            return;
        }


        $('#heartSvgVector').lazylinepainter({
            "svgData": GlobalVectors['heartSvgVector'],
            "strokeWidth": 10,
            "strokeColor": '#ec454d',
            'responsive': true

        }).lazylinepainter('paint');
        $scope.feedbackDisplayed = true;
    }

    $scope.handleAboutSection = function () {
        if ($scope.about.displayed == true) {
            return;
        }
        $timeout(function () {
            $scope.about.texts.push(1);
            $scope.about.logos.push(1);
        }, 1500, true, null);
        $scope.about.displayed = true;
    }


});

portalAppController.controller('achievementController', function ($scope, $timeout) {
    $scope.statisticList = ['user', 'road', 'upvote', 'time', 'money', 'social'];

    //user
    $scope.user = {};
    $scope.user.value = 472;
    $scope.user.displayed = false;

    //road
    $scope.road = {};
    $scope.road.value = 1243156;
    $scope.road.displayed = false;

    //upvote
    $scope.upvote = {};
    $scope.upvote.value = 52462378;
    $scope.upvote.displayed = false;

    //time
    $scope.time = {};
    $scope.time.value = 1346688;
    $scope.time.displayed = false;

    //chat
    $scope.money = {};
    $scope.money.value = 26421;
    $scope.money.displayed = false;

    //social
    $scope.social = {};
    $scope.social.value = 22356312;
    $scope.social.displayed = false;

    //Object.keys(obj).length

    function setDrawTime(vectorObject, drawTime) {
        //console.log(vectorObject);
        var stepTime = Math.round(drawTime * 1.0 / vectorObject.strokepath.length);
        vectorObject.strokepath.forEach(function (path, index) {
            path.duration = stepTime;
        });
    }

    function setAllDrawTime(drawTime) {
        $scope.statisticList.forEach(function (name, index) {
            if (GlobalVectors[name + 'SvgVector']) {
                setDrawTime(GlobalVectors[name + 'SvgVector'][name + 'SvgVector'], drawTime);
                //console.log(GlobalVectors[name + 'SvgVector'][name + 'SvgVector']);
            }
        });
    }

    setAllDrawTime(1200);







    $scope.getFormatedNumber = function (number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    $scope.animateNumber = function (name) {
        //keep the old value
        var realValue = $scope[name].value;

        //make the number increase from 0 to its value in 1s
        //each step happens in 0.05s => 20 steps
        var step = Math.round($scope[name].value * 1.0 / 20);
        $scope[name].value = 0;

        function incNumber() {
            $scope[name].value += step;
            if ($scope[name].value + step > realValue) {
                $scope[name].value = realValue;
                return;
            }
            $timeout(incNumber, 50, true, null);
        }
        incNumber();
    }

    $scope.animateIcon = function (name) {
        if ($scope[name].drawn) {
            return;
        }
        $('#' + name +'SvgVector').lazylinepainter({
            "svgData": GlobalVectors[name+'SvgVector'],
            "strokeWidth": 15,
            "strokeColor": "white",
            'responsive': true,

        }).lazylinepainter('paint');
        $scope[name].displayed = true;
        $scope[name].drawn = true;
    }

    $scope.animateStatistic = function (name) {
        $scope.animateNumber(name);

        $scope.animateIcon(name);
    }

    $('#achievement').waypoint({
        handler: function (direction) {
            console.log(direction);
            if (direction == 'down') {
                $('.statisticElement').each(function (index, element) {
                    var dataName = $(element).data('statistic');
                    $scope.animateStatistic(dataName);
                });
            }


        },
    });


    //$('#intro').on('appear', function (event, onScreenElements) {
    //    // this element is now inside browser viewport
    //    var dataName = $(this).data('statistic');

    //});

    //$('.statisticElement').on('disappear', function (event, $all_disappeared_elements) {
    //    var dataName = $(this).data('statistic');
    //    $scope[dataName].displayed = false;
    //});


});


portalAppController.controller('mapController', function ($scope, $timeout) {
    //moveState BEGIN,STARTCHOSEN,ENDCHOSEN,CARCHOSEN,ARRIVING,ARRIVED,END

    var carIcon = 'images/caricon.png';
    var staticCarIcon = 'http://maps.google.com/mapfiles/kml/pal2/icon47.png';
    $scope.parkicon = 'http://maps.google.com/mapfiles/kml/pal2/icon47.png';

    $scope.moveState = 'BEGIN';



    //load all parks nearby
    $scope.loadParks = function (map) {
        $scope.parkingList = [[1.354625, 103.898821], [1.327038, 103.843664]];

        for (var index in $scope.parkingList) {
            var location = $scope.parkingList[index];
            var myLatLng = new google.maps.LatLng(location[0], location[1]);
            addParkMarker(myLatLng, map);
        }

    }

    $scope.demoStart = function () {
        if ($scope.moveState == 'BEGIN') {
            AdjustModalAndShow($scope.moveState);
        }

    }

    $('#services').waypoint({
        handler: function (direction) {
            $scope.demoStart();
        },
    });
    $scope.car_OnCLick = function (carItem) {

    }

    $scope.caritems = [];
    $scope.carData = null;
    var modalTitle = document.getElementById('mapModalTitle');

    $scope.modalTitle = 'Choose a parking lot near your location';

    function AdjustModalAndShow(state) {
        switch (state) {
            case 'BEGIN':

                $scope.modalTitle = 'Choose a parking lot near your location';
                break;
            case 'STARTCHOSEN':
                $scope.modalTitle = 'Choose a parking lot you where want to return the car';
                break;
            case 'ENDCHOSEN':
                $scope.modalTitle = 'Enjoy your trip';
                break;
            case 'ARRIVED':
                $scope.modalTitle = 'Safe and sound';
                break;

            default:
                break;
        }
        $scope.$apply();
        $('#mapModal').modal('show');
    }
    $('#mapModal').on('hidden.bs.modal', function (e) {
        if ($scope.moveState == 'ENDCHOSEN') {
            calcRoute(function () {
                //moving ended;
                AdjustModalAndShow($scope.moveState);
            });
        } else if ($scope.moveState == 'ARRIVED') {
            //direct to the next page
            document.getElementById('achievementLink').click();
        }
    });
    function addParkMarker(location, map) {
        var marker = new google.maps.Marker({
            position: location,
            map: map,
            icon: staticCarIcon
        });

        marker.addListener('click', function (event) {
            console.log('click marker');
            switch ($scope.moveState) {
                case 'BEGIN':
                    $scope.startPoint = marker;
                    $scope.moveState = 'STARTCHOSEN';
                    //change the modal
                    AdjustModalAndShow($scope.moveState);

                    break;
                case 'STARTCHOSEN':
                    $scope.endPoint = marker;
                    $scope.moveState = 'ENDCHOSEN';
                    //getCarsFromPark($scope.startPoint.position.lat(), $scope.startPoint.position.lng())
                    AdjustModalAndShow($scope.moveState);
                    break;

                default:
                    break;
            }
        });

    }

    var calcRoute = function (callback) {
        if (!$scope.startPoint || !$scope.endPoint) {
            return;
        }
        var startLat = $scope.startPoint.position.lat();
        var startLng = $scope.startPoint.position.lng();
        var endLat = $scope.endPoint.position.lat();
        var endLng = $scope.endPoint.position.lng();

        var start = new google.maps.LatLng(startLat, startLng);
        var end = new google.maps.LatLng(endLat, endLng);

        var waypts = [];
        //var checkboxArray = document.getElementById('waypoints');
        //for (var i = 0; i < checkboxArray.length; i++) {
        //    if (checkboxArray.options[i].selected == true) {
        //        waypts.push({
        //            location: checkboxArray[i].value,
        //            stopover: true
        //        });
        //    }
        //}
        //var haight = new google.maps.LatLng(37.7699298, -122.4469157);
        //var oceanBeach = new google.maps.LatLng(37.7683909618184, -122.51089453697205);
        var request = {
            origin: start,
            destination: end,
            optimizeWaypoints: true,
            travelMode: google.maps.TravelMode.DRIVING
        };

        $scope.directionsService.route(request, function (response, status) {
            console.log(status);
            if (status == google.maps.DirectionsStatus.OK) {
                $scope.directionsDisplay.setDirections(response);
                //console.log(response);

                animateMovement(response.routes[0].overview_path, callback);
            }
        });
    }

    function animateMovement(routeData, callback) {
        $scope.moveState = 'ARRIVING';
        var progress = 0;
        //make some moves
        var carMarker = new google.maps.Marker({
            position: new google.maps.LatLng(routeData[progress].lat(), routeData[progress].lng()),
            map: $scope.map,
            icon: carIcon
        });
        var delay = Math.round(5.0 * 1000 / routeData.length);
        var move = function () {
            progress++;
            //console.log(routeData[progress].lat() + '&' + routeData[progress].lng());
            var newLatLng = new google.maps.LatLng(routeData[progress].lat(), routeData[progress].lng());
            carMarker.setPosition(newLatLng);

            if (progress != routeData.length - 1) {
                $timeout(move, delay, false, null);
            } else {
                //destination reached
                $scope.moveState = 'ARRIVED';
                callback(true);
            }

        }

        $timeout(move, delay, false, null);
    }

    $scope.initializeMap = function () {
        var mapCanvas = document.getElementById('pageMap');
        //console.log(mapCanvas);

        //var myLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        //fake location for testing
        var myLatLng = new google.maps.LatLng(1.350380, 103.851959);
        console.log(myLatLng);

        var mapOptions = {
            center: myLatLng,
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }

        var map = new google.maps.Map(mapCanvas, mapOptions);
        //console.log(map);
        $scope.directionsService = new google.maps.DirectionsService();
        $scope.map = map;
        $scope.directionsDisplay = new google.maps.DirectionsRenderer();
        $scope.directionsDisplay.setMap(map);
        var marker = new google.maps.Marker({
            position: map.getCenter(),
            map: map,
            title: 'Click to zoom'
        });
        //center,distance,limit,map,icon
        //load all parking lots
        $scope.loadParks(map);

        //registter the click event
        //google.maps.event.addListener(map, 'click', function (event) {
        //    $scope.clickMap(event.latLng, map, icon);
        //});
    };

});
