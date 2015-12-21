/**
 * Created by nguyenlinh on 4/13/15.
 */
/**
 */
var homepageAppCtrl = angular.module('homepageAppCtrl', []);

function getCookie() {
    var cookie = $.cookie('email_cookie');
    if (!cookie) {
        return null;
    }
    var parsed = null;

    if (cookie) {
        cookie = cookie.substring(cookie.indexOf('{'));
        try {
            parsed = JSON.parse(cookie);
        } catch (e) {
            parsed = null;
        }

    }

    return parsed;
}

var getLocation = function (callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            //getting result done
            return callback(position);
        }, function (error) {
            //error getting position
            var x = null;

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


homepageAppCtrl.controller('headerCtrl', ['$scope', '$location', '$http', '$modal', function ($scope, $location, $http, $modal) {

    $scope.email_cookie = getCookie();

    $scope.avatarSrc = null;
    $scope.avatarInput = document.getElementById('avatar_input');
    $scope.newAvatarImg = document.getElementById('newAvatarImg');
    $scope.newAvatarImg.src = 'images/upload.png';

    $scope.reloadAvatar = function () {
        if (!$scope.email_cookie || !$scope.email_cookie._id) {
            return;
        }
        var avatarImages = document.getElementsByClassName('user-avatar');
        for (var index in avatarImages) {
            avatarImages[index].src = '/avatar/' + $scope.email_cookie._id + '?' + new Date().getTime();
        }
    }
    $scope.reloadAvatar();

    var fr = new FileReader();
    fr.onload = function (e) {
        $scope.newAvatarImg.src = this.result;
        $scope.newAvatarImg.style.width = $scope.newAvatarImg.clientHeight + 'px';
    }


    $scope.avatarInput.addEventListener("change", function () {
        // fill fr with image data
        fr.readAsDataURL($scope.avatarInput.files[0]);
    });


    //display the selected image for new avatar
    $scope.newAvatarSource = function () {
        var avatarInput = document.getElementById('avatar_input').click();
        if (!avatarInput.files || avatarInput.files.length == 0) {
            return
        }
    }


    //change avatar module
    $scope.avatar_OnClick = function () {
        $('#avatarModal').modal('show');
    }

    $scope.newAvatar_Click = function () {
        $scope.avatarInput.click();
    }

    $scope.client = new XMLHttpRequest();
    /* Check the response status */
    $scope.client.onreadystatechange = function () {
        if ($scope.client.readyState == 4 && $scope.client.status == 200) {
            alert($scope.client.statusText);
            $scope.newAvatarImg.src = 'images/upload.png';
            location.reload();
        }
        $('#avatarModal').modal('hide');
    }
    $scope.submit_OnClick = function () {

        var file = document.getElementById("avatar_input");
        /* Create a FormData instance */
        var formData = new FormData();
        /* Add the file */
        formData.append("uploadavatar", file.files[0]);

        $scope.client.open("post", "/upload/avatar", true);
        //client.setRequestHeader("Content-Type", "multipart/form-data");
        $scope.client.send(formData);  /* Send to server */
    }

    $http.get('/api/user/getinfo').success(function (data, status, headers, config) {

        $scope.user = data.user;

        $scope.goToCMS = function () {

            switch ($scope.user.role) {
                case Properties.ADMIN_USER:
                    window.location = URL.ADMIN_CMS;
                    break;
                case Properties.PROVIDER:
                    window.location = URL.PROVIDER_CMS;
                    break;
                case Properties.PUBLIC_USER:
                    window.location = URL.PUBLIC_CMS;
                    break;
            }
        }

        $scope.logout = function () {
            $http.get('/api/user/logout').success(function (data, status, headers, config) {
                showPopup("Log Out Successfully");
                setTimeout(function () {
                    window.location = URL.PORTAL;
                }, 1000);
            })
        }
    }).error(function (error, status) {

        var box = bootbox.alert(error.errorCode, function () {
            window.location = URL.LOGIN;
        });

        box.find(".btn-primary").removeClass("btn-primary").addClass("btn btn-sm");

    });



}]);

homepageAppCtrl.controller('homeCtrl', function ($scope, $location, $http, $modal, $timeout) {

    var carIcon = 'images/caricon.png';

    var staticCarIcon = 'http://maps.google.com/mapfiles/kml/pal2/icon47.png';

    $scope.moveState = 'BEGIN';

    //load all parks nearby
    $scope.loadParks = function (latitutde, longitude, distance, limit, map) {

        var params = {
            latitude:   latitutde,
            longitude:  longitude,
            distance:   distance,
            limit:      limit
        }

        $http.post('/api/car/searchpark', params).success(function (data, status, headers, config) {

            console.log(data.parks);

            $scope.parkingList = data.parks;

            for (var index in $scope.parkingList) {

                var location = $scope.parkingList[index].location;

                var myLatLng = new google.maps.LatLng(location[1], location[0]);

                addParkMarker(myLatLng, map);
            }

        });
    }

    function addParkMarker(location, map) {

        var marker = new google.maps.Marker({
            position: location,
            map: map,
            icon: staticCarIcon
        });
    }

    $scope.initializeMap = function () {
        var mapCanvas = document.getElementById('parkingMap');

        //get current position
        getLocation(function (position) {



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

            $scope.loadParks(position.coords.latitude, position.coords.longitude, 0, 20, map);
        });
    };



});

homepageAppCtrl.controller('loginCtrl', ['$scope', '$location', '$http', function ($scope, $location, $http) {

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

homepageAppCtrl.controller('registerCtrl', ['$scope', '$location', '$http', function ($scope, $location, $http) {
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

homepageAppCtrl.controller('busCtrl', ['$scope', '$location', '$http', function ($scope, $location, $http) {

}]);

homepageAppCtrl.controller('carCtrl', ['$scope', '$location', '$http', function ($scope, $location, $http) {

    $scope.maxDate = new Date(2020, 1, 1);

    $scope.minDate = new Date();

    $scope.openFrom = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.openedFrom = true;
    };

    $scope.openTo = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.openedTo = true;
    };

    $scope.search = {};

    $scope.search.date = {};

    $scope.searchCar = function () {
        console.log("ok man!");
    }
}]);

homepageAppCtrl.controller('truckCtrl', ['$scope', '$location', '$http', function ($scope, $location, $http) {

}]);

