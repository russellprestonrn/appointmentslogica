'use strict';

angular.module('appointmentsApp.controllers', []).controller('mainController',
    ['$scope', '$rootScope',"$fhirApiServices", "$state",
    function ($scope, $rootScope, $fhirApiServices, $state ) {

        $scope.user = "";
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
                            $scope.user = $scope.patient;
                            $fhirApiServices.queryResourceInstances("Appointment", query)
                                .done(function(resourceResults){
                                    angular.forEach(resourceResults, function (resource) {
                                        $scope.appointments.push(resource);

                                    });
                                    $rootScope.$emit('build-calendar');
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
                            $scope.user = $scope.profile;
                            $fhirApiServices.queryResourceInstances("Appointment", query)
                                .done(function(resourceResults){
                                    angular.forEach(resourceResults, function (resource) {
                                        $scope.appointments.push(resource);

                                    });
                                    $rootScope.$emit('build-calendar');
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
                               $scope.user = $scope.patient;
                               $fhirApiServices.queryResourceInstances("Appointment", query)
                                .done(function(resourceResults){
                                    angular.forEach(resourceResults, function (resource) {
                                        $scope.appointments.push(resource);

                                    });
                                    $rootScope.$emit('build-calendar');
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
                                $scope.user = $scope.profile;
                                $fhirApiServices.queryResourceInstances("Appointment", query)
                                    .done(function(resourceResults){
                                        angular.forEach(resourceResults, function (resource) {
                                            $scope.appointments.push(resource);
                                        });
                                        $rootScope.$emit('build-calendar');
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

    }).controller('AppointmentsCtrl', function($scope, $rootScope) {

        $scope.events = [];

        $scope.navigatorConfig = {
            selectMode: "day",
            showMonths: 3,
            skipMonths: 3,
            onTimeRangeSelected: function(args) {
//                $scope.listConfig.startDate = args.day;
                $scope.weekConfig.startDate = args.day;
                $scope.dayConfig.startDate = args.day;
//                loadEvents();
            }
        };

        $scope.dayConfig = {
            viewType: "Day"
        };

        $scope.weekConfig = {
            visible: false,
            viewType: "Week"
        };

        $scope.showDay = function() {
            $scope.dayConfig.visible = true;
            $scope.weekConfig.visible = false;
        };

        $scope.showWeek = function() {
            $scope.dayConfig.visible = false;
            $scope.weekConfig.visible = true;
        };

        $rootScope.$on('build-calendar', function(){
            angular.forEach($scope.appointments, function (appointment) {
                $scope.events.push({
                    "id":appointment.id,
                    "text":appointment.description,
                    "start": new DayPilot.Date(appointment.start),
                    "end": new DayPilot.Date(appointment.end)

                })
            });
        });
    });