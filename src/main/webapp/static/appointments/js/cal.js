'use strict';

angular.module('appointmentsApp.cal', ['daypilot']).controller('AppointmentsCtrl', function($scope, $timeout, $http) {

        $scope.navigatorConfig = {
            selectMode: "day",
            showMonths: 3,
            skipMonths: 3,
            onTimeRangeSelected: function(args) {
                $scope.weekConfig.startDate = args.day;
                $scope.dayConfig.startDate = args.day;   
                loadEvents();
            }
        };

    /* 
        Need to Load the data from the controller to these fields in JSON in the aray events.
    {
            "id":"10",
            "text":"Test",
            "start":"2016-01-19T11:30:00",
            "end":"2016-01-19T16:30:00"
        },
    */
    $scope.events = [];
    
        
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

  });
