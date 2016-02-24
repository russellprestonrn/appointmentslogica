'use strict';

angular.module('appointmentsApp', ['ui.router', 'ngAnimate', 'ui.bootstrap', 'daypilot', 'appointmentsApp.filters', 'appointmentsApp.services', 'appointmentsApp.controllers', 'appointmentsApp.directives'], function($stateProvider, $urlRouterProvider){

    $urlRouterProvider.otherwise('/patient-view');

    $stateProvider

        .state('patient-view', {
            url: '/patient-view',
            templateUrl: 'js/templates/patientView.html',
            authenticate: true
        })

        .state('practitioner-view', {
            url: '/practitioner-view',
            templateUrl: 'js/templates/practitionerView.html',
            authenticate: true
        })

});
