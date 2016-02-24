'use strict';

angular.module('appointmentsApp.controllers', []).controller('mainController',
    ['$scope', '$rootScope',"$fhirApiServices",
    function ($scope, $rootScope, $fhirApiServices ) {

        $scope.user = "";
        $scope.patient = "";
        $scope.profile = "";
        $scope.appointments = [];
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

        function buildCalendar(){
            angular.forEach($scope.appointments, function (appointment) {
                $scope.events.push({
                    "id":appointment.id,
                    "text":appointment.description,
                    "start": new DayPilot.Date(appointment.start),
                    "end": new DayPilot.Date(appointment.end)

                })
            });
        }

        /**
         *
         *      FHIR SERVICE OAUTH2 AUTHENTICATION & APP INITIALIZATION
         *
         **/
        $fhirApiServices.initClient().then(function(){
            if ($fhirApiServices.hasPatientContext()) {
                $fhirApiServices.queryPatient()
                    .done(function(patientResult){
                        $scope.patient = patientResult;
                        var query = {patient: $scope.patient.id};
                        $scope.user = $scope.patient;
                        $fhirApiServices.queryResourceInstances("Appointment", query)
                            .done(function(resourceResults){
                                angular.forEach(resourceResults, function (resource) {
                                    $scope.appointments.push(resource);

                                });
                                buildCalendar();
                                $rootScope.$digest();
                            });
                    }).fail(function(){
                    });
            } else {
                $fhirApiServices.getFhirProfileUser()
                    .done(function(profileResult){
                        $scope.profile = profileResult;
                        var query = {practitioner: $scope.profile.id};
                        $scope.user = $scope.profile;
                        $fhirApiServices.queryResourceInstances("Appointment", query)
                            .done(function(resourceResults){
                                angular.forEach(resourceResults, function (resource) {
                                    $scope.appointments.push(resource);
                                });
                                buildCalendar();
                                $rootScope.$digest();
                            });
                    });
            }
        });

    }]);