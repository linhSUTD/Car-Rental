'use strict';

describe('Controller: MainCtrl', function () {

  // load the controller's module
    beforeEach(module('jschallengeApp'));

    var MainCtrl,scope;
    

  // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        scope.awesomeThings = [1, 2, 3];
        MainCtrl = $controller('MainCtrl', {
            $scope: scope
        });
    }));

    it('should attach a list of awesomeThings to the scope', function () {
        expect(scope.awesomeThings.length).toBe(3);
    });
});
