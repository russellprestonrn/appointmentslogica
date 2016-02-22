'use strict';

angular.module('appointmentsApp.controllers', []).controller('mainController',
    ['$scope', '$rootScope',"$fhirApiServices",
    function ($scope, $rootScope, $fhirApiServices ) {

        $scope.patient;
        $scope.profile;
        $scope.appointments = [];


        /**
         *
         *      FHIR SERVICE OAUTH2 AUTHENTICATION & APP INITIALIZATION
         *
         **/
        $fhirApiServices.initClient().then(function(){
            $fhirApiServices.queryPatient()
                .done(function(patientResult){
                    $scope.patient = patientResult;
                });
            $fhirApiServices.queryResourceInstances("Appointment")
                .done(function(resourceResults){
                    angular.forEach(resourceResults, function (resource) {
                        $scope.appointments.push(resource);

                    });
                    $rootScope.$digest();
                });

        });

    }]).controller("PatientViewController",
    function($scope){

    }).controller("PractitionerViewController",
    function($scope){

    });