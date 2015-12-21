/**
 * Created by nguyenlinh on 4/13/15.
 */

var homepageApp = angular.module("homepageApp", ['homepageAppCtrl', 'ngAnimate',  'ui.router', 'ngRoute', 'ui.bootstrap']);


homepageApp.config(function($stateProvider, $urlRouterProvider, $locationProvider){

    $urlRouterProvider.otherwise("/");

    $stateProvider
        .state('home', {
            url: "/",
            templateUrl: "views/homepage/main.html",
            controller: 'homeCtrl'
        })
        .state('history', {
            url: "/history",
            templateUrl: "views/homepage/history.html",
            controller: 'busCtrl'
        })
        .state('car', {
            url: "/car",
            templateUrl: "views/homepage/car.html",
            controller: 'carCtrl'
        })
});

homepageApp.directive('revolutionSlider', function() {
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attrs) {
            RevosliderInit.initRevoSlider();
        }
    }
})


homepageApp.directive('mapCanvas', ['$window', '$q', function ($window, $q) {
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
                $.getScript("http://maps.google.com/maps/api/js?callback=initializeMap");
            }
        }
    };
}]);
