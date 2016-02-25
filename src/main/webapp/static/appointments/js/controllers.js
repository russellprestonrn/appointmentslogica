'use strict';

angular.module('appointmentsApp.controllers', []).controller('mainController',
    ['$scope', '$rootScope',"$fhirApiServices",
    function ($scope, $rootScope, $fhirApiServices ) {

        $scope.user = "";
        $scope.patient = "";
        $scope.profile = "";
        $scope.appointments = [];
        $scope.events = [];
        var selectedEndpoint = "";

        $scope.endpointChoices = [
            {
                name: "Epic",
                serviceUrl: "https://open-ic.epic.com/FHIR/api/FHIR/DSTU2",
                idMapper: {
                    COREPATIENT1: "Tw7SP1sBqQoduuaDojd44wcx8KAzmRCwo5pnhZcoN520B",
                    COREPATIENT2: "TC1.2m5XdQszeI0Nz13l-O9blxzpCHD2a4YXtKyw-BnEB",
                    COREPATIENT3: "TlJf9j92mA7CV.8nJyh9v4IMR3c6Pm7UYkRw3NRE-bHYB"
                }
            },
            {
                name: "Proxy",
                serviceUrl: "https://fhir-open-api-dstu2.smarthealthit.org"
            },
            {
                name: "SMART Launch"
            }
        ];

        $scope.settings = function(settings){
            if (selectedEndpoint === settings){
                return;
            }
            selectedEndpoint = settings;
            if (settings.name === "SMART Launch") {
                $fhirApiServices.initClient();
            } else {
                $fhirApiServices.initNonSecureClient(settings.serviceUrl);
            }

            if ($scope.user.resourceType === "Patient") {
                var patientId;
                if (selectedEndpoint.idMapper !== undefined &&
                    selectedEndpoint.idMapper[$scope.patient.id] !== undefined) {
                    patientId = selectedEndpoint.idMapper[$scope.patient.id]
                } else {
                    patientId = $scope.patient.id;
                }

                readAppointments({patient: patientId});
            } else {
                var practitionerId;
                if (selectedEndpoint.idMapper !== undefined &&
                    selectedEndpoint.idMapper[$scope.profile.id] !== undefined) {
                    practitionerId = selectedEndpoint.idMapper[$scope.profile.id]
                } else {
                    practitionerId = $scope.profile.id;
                }
                readAppointments({practitioner: practitionerId});
            }
        };

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
            while ($scope.events.length > 0) {
                $scope.events.pop();
            }
            $rootScope.$digest();
            angular.forEach($scope.appointments, function (appointment) {
                $scope.events.push({
                    "id":appointment.id,
                    "text":(appointment.description!== undefined) ? appointment.description : appointment.type.text,
                    "start": new DayPilot.Date(appointment.start),
                    "end": (appointment.end !== undefined) ? new DayPilot.Date(appointment.end) : new DayPilot.Date(determineEndtime(appointment.start, appointment.minutesDuration))

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
                        $scope.user = $scope.patient;
                        $scope.user.resourceType = "Patient";
                        readAppointments({patient: $scope.patient.id});
                    }).fail(function(){
                    });
            } else {
                $fhirApiServices.getFhirProfileUser()
                    .done(function(profileResult){
                        $scope.profile = profileResult;
                        $scope.user = $scope.profile;
                        $scope.user.resourceType = "Practitioner";
                        readAppointments({practitioner: $scope.profile.id});
                    });
            }
        });

        function readAppointments(query)  {
            $scope.appointments = [];
            $fhirApiServices.queryResourceInstances("Appointment", query)
                .done(function(resourceResults){
                    angular.forEach(resourceResults, function (resource) {
                        $scope.appointments.push(resource);
                    });
                    buildCalendar();
                    $rootScope.$digest();
                });
        }

        function determineEndtime(start, duration) {
            var endTime = new Date(start);
            endTime.setMinutes(endTime.getMinutes() + duration);
            return endTime.toISOString();
        }
    }]);