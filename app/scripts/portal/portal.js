var portalApp = angular.module('portalApp', ['portalAppController', 'ngAnimate', 'ui.router']);

portalApp.config(function($stateProvider, $urlRouterProvider, $locationProvider){

    $urlRouterProvider.otherwise("/");

    $stateProvider
        .state('portal', {
            url: "/",
            templateUrl: "views/portal/portal.html"
        })
        .state('login', {
            url: "/login",
            templateUrl: "views/portal/login.html",
            controller: 'loginCtrl'
        })
        .state('register', {
            url: "/register",
            templateUrl: "views/portal/register.html",
            controller: 'registerCtrl'
        });
});


portalApp.directive('mapCanvas', ['$window', '$q', function ($window, $q) {
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
                console.log("Map script is already loaded. Initialising");
                scope.initializeMap();
            } else {
                console.log("Lazy loading Google map...");
                $.getScript("http://maps.google.com/maps/api/js?callback=initializeMap");
            }
        }
    };
}]);

portalApp.directive('portalNav', function () {
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attrs) {
            $('a.page-scroll').bind('click', function (event) {
                var $anchor = $(this);
                var href = $anchor.attr('href')
                $('html, body').stop().animate({
                    scrollTop: $(href).offset().top
                }, 1500, 'easeInOutExpo');

                event.preventDefault();
            });
        }
    }
});

portalApp.directive('portalScroll', function () {
    return  {
        restrict: 'A',

        scope: false,

        link: function (scope, element, attrs) {

            $('#intro').mousewheel(function (event) {
                if (event.deltaY < 0) {
                    event.preventDefault();
                    $('html, body').stop().animate({
                        scrollTop: $('#services').offset().top
                    }, 1500, 'easeInOutExpo');
                }
            });


            $('#services').mousewheel(function (event) {
                if (event.deltaY > 0) {
                    event.preventDefault();
                    $('html, body').stop().animate({
                        scrollTop: $('#intro').offset().top
                    }, 1500, 'easeInOutExpo');

                    scope.handleAboutSection();

                } else if (event.deltaY < 0) {
                    $('html, body').stop().animate({
                        scrollTop: $('#achievement').offset().top
                    }, 1500, 'easeInOutExpo');
                }
            });

            $('#achievement').mousewheel(function (event) {
                if (event.deltaY > 0) {
                    var topplace = $('#achievement_topPlace').isOnScreen();
                    if ($('#achievement_topPlace').isOnScreen()) {
                        event.preventDefault();
                        $('html, body').stop().animate({
                            scrollTop: $('#services').offset().top
                        }, 1500, 'easeInOutExpo');

                        return;
                    }

                }
            });
        }
    }
})
