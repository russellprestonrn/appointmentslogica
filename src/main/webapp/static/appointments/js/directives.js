/* Directives */

angular.module('appointmentsApp.directives', []).directive('resize', function ($window) {
        return function (scope, element, attr) {

            var w = angular.element($window);
            scope.$parent.$watch(function () {
                return {
                    'h': w.height(),
                    'w': w.width()
                };
            }, function (newValue, oldValue) {
                scope.$parent.windowHeight = newValue.h;
                scope.$parent.windowWidth = newValue.w;

                scope.$parent.resizeWithOffset = function (offsetH, offsetW) {

                    scope.$parent.$eval(attr.notifier);

                    var newSize = {
                        'height': (newValue.h - offsetH) + 'px'
                    };

                    if (offsetW !== undefined) {
                        newSize.width = (newValue.w - offsetW) + 'px'
                    }

                    return newSize;
                };
            }, true);

            w.bind('resize', function () {
                scope.$parent.$apply();
            });
        }
}).directive('center', function ($window) {
        return function (scope, element, attr) {

            var w = angular.element($window);
            scope.$parent.$watch(function () {
                return {
                    'h': w.height(),
                    'w': w.width()
                };
            }, function (newValue, oldValue) {
                scope.$parent.windowHeight = newValue.h;
                scope.$parent.windowWidth = newValue.w;

                scope.$parent.centerWithOffset = function (offsetW) {

                    scope.$parent.$eval(attr.notifier);

                    return {
                        'left': (newValue.w/2) - offsetW
                    };
                };
            }, true);

            w.bind('center', function () {
                scope.$parent.$apply();
            });
        }
    }).directive('enterKey', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                var key = typeof event.which === "undefined" ? event.keyCode : event.which;
                if(key === 13) {
                    scope.$apply(function (){
                        scope.$eval(attrs.enterKey);
                    });

                    event.preventDefault();
                }
            });
        };
    });