'use strict';

angular.module('appointmentsApp.controllers', []).controller('mainController',
    ['$scope', '$rootScope',"$fhirApiServices", "$state",
    function ($scope, $rootScope, $fhirApiServices, $state ) {

        $scope.patient = "";
        $scope.profile = "";
        $scope.appointments = [];


        /**
         *
         *      FHIR SERVICE OAUTH2 AUTHENTICATION & APP INITIALIZATION
         *
         **/
        $fhirApiServices.initClient().then(function(){
            var query = {};
            switch($fhirApiServices.getIntent()) {
                case 'patient-view':
                    $fhirApiServices.queryPatient()
                        .done(function(patientResult){
                            $scope.patient = patientResult;
                            query.patient = $scope.patient.id;
                            $fhirApiServices.queryResourceInstances("Appointment", query)
                                .done(function(resourceResults){
                                    angular.forEach(resourceResults, function (resource) {
                                        $scope.appointments.push(resource);

                                    });
                                    $rootScope.$digest();
                                });
                        });
                    $state.go('patient-view', {});
                    break;
                case 'practitioner-view':
                    $fhirApiServices.getFhirProfileUser()
                        .done(function(profileResult){
                            $scope.profile = profileResult;
                            query.practitioner = $scope.profile.id;
                            $fhirApiServices.queryResourceInstances("Appointment", query)
                                .done(function(resourceResults){
                                    angular.forEach(resourceResults, function (resource) {
                                        $scope.appointments.push(resource);

                                    });
                                    $rootScope.$digest();
                                });
                        });
                    $state.go('practitioner-view', {});
                    break;
                default:
                    if ($fhirApiServices.hasPatientContext()) {
                       $fhirApiServices.queryPatient()
                        .done(function(patientResult){
                            $scope.patient = patientResult;
                            query.patient = $scope.patient.id;
                            $fhirApiServices.queryResourceInstances("Appointment", query)
                                .done(function(resourceResults){
                                    angular.forEach(resourceResults, function (resource) {
                                        $scope.appointments.push(resource);

                                    });
                                    $rootScope.$digest();
                                });
                        }).fail(function(){
                        });
                        $state.go('patient-view', {});
                    } else {
                        $fhirApiServices.getFhirProfileUser()
                            .done(function(profileResult){
                                $scope.profile = profileResult;
                                query.practitioner = $scope.profile.id;
                                $fhirApiServices.queryResourceInstances("Appointment", query)
                                    .done(function(resourceResults){
                                        angular.forEach(resourceResults, function (resource) {
                                            $scope.appointments.push(resource);

                                        });
                                        $rootScope.$digest();
                                    });
                            });
                        $state.go('practitioner-view', {});
                    }
            }

        });

    }]).controller("PatientViewController",
    function($scope){

    }).controller("PractitionerViewController",
    function($scope){

    });