'use strict';

angular.module('appointmentsApp.services', []).factory('$fhirApiServices', function ($rootScope, $filter) {

        /**
         *
         *      FHIR SERVICE API CALLS
         *
         **/

    var currentClient;

    var clientList = {
        secureFhirClient: ""
    };

    return {
        initClient: function(){
            var that = this;
            var deferred = $.Deferred();
            if (clientList.secureFhirClient !== "") {
                currentClient = clientList.secureFhirClient;
                deferred.resolve();
            }

            FHIR.oauth2.ready(function(smart){
                clientList.secureFhirClient = smart;
                currentClient = smart;
                deferred.resolve();
            });
            return deferred;
        },
        initNonSecureClient: function(serviceUrl) {
            if (clientList[serviceUrl] !== undefined) {
                currentClient = clientList[serviceUrl];
            } else {
                clientList[serviceUrl] = FHIR.client({ serviceUrl: serviceUrl });
                currentClient = clientList[serviceUrl];
            }
        },
        queryResourceInstances: function(resource, searchValue, tokens, sort, count) {
            var deferred = $.Deferred();

            if (count === undefined) {
                count = 50;
            }

            var searchParams = {type: resource, count: count};
            searchParams.query = {};
            if (searchValue !== undefined) {
                searchParams.query = searchValue;
            }
            if (typeof sort !== 'undefined' ) {
                searchParams.query['$sort'] = sort;
            }
            if (typeof sort !== 'undefined' ) {
                searchParams.query['name'] = tokens;
            }

            $.when(currentClient.api.search(searchParams))
                .done(function(resourceSearchResult){
                    var resourceResults = [];
                    if (resourceSearchResult.data.entry) {
                        resourceSearchResult.data.entry.forEach(function(entry){
                            entry.resource.fullUrl = entry.fullUrl;
                            resourceResults.push(entry.resource);
                        });
                    }
                    deferred.resolve(resourceResults, resourceSearchResult);
                });
            return deferred;
        },
        queryPatient: function(){
        var deferred = $.Deferred();
        $.when(currentClient.patient.read())
            .done(function(patientResult){
                var patient = {name:""};
                angular.forEach(patientResult.name[0].given, function (value) {
                    patient.name = patient.name + ' ' + String(value);
                });
                angular.forEach(patientResult.name[0].family, function (value) {
                    patient.name = patient.name + ' ' + value;
                });
                patient.sex = patientResult.gender;
                patient.dob = patientResult.birthDate;
                patient.id  = patientResult.id;
                deferred.resolve(patient);
            }).fail(function(){
                deferred.reject();
            });
        return deferred;
        },
        getFhirProfileUser: function() {
            var deferred = $.Deferred();
            if (currentClient.userId === null ||
                typeof currentClient.userId === "undefined"){
                deferred.resolve(null);
                return deferred;
            }
            var historyIndex = currentClient.userId.lastIndexOf("/_history");
            var userUrl = currentClient.userId;
            if (historyIndex > -1 ){
                userUrl = currentClient.userId.substring(0, historyIndex);
            }
            var userIdSections = userUrl.split("/");

            $.when(currentClient.api.read({type: userIdSections[userIdSections.length-2], id: userIdSections[userIdSections.length-1]}))
                .done(function(userResult){

                    var user = {name:""};
                    user.name = $filter('nameGivenFamily')(userResult.data);
                    user.id  = userResult.data.id;
                    deferred.resolve(user);
                });
            return deferred;
        },
        getIntent: function() {
            return currentClient.tokenResponse.intent;
        },
        hasPatientContext: function() {
            return currentClient.patient !== undefined;
        }
    }
});
