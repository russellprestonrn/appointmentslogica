'use strict';

angular.module('appointmentsApp.services', []).factory('$fhirApiServices', function ($rootScope, $filter) {

        /**
         *
         *      FHIR SERVICE API CALLS
         *
         **/

    var fhirClient;
    var patient;

    return {
        fhirClient: function(){
            return fhirClient;
        },
        clientInitialized: function(){
            return (fhirClient !== undefined && fhirClient !== null);
        },
        initClient: function(){
            var that = this;
            var deferred = $.Deferred();

            FHIR.oauth2.ready(function(smart){
                fhirClient = smart;
                deferred.resolve();
            });
            return deferred;
        },
        hasNext: function(lastSearch) {
            var hasLink = false;
            if (lastSearch  === undefined) {
                return false;
            } else {
                lastSearch.data.link.forEach(function(link) {
                    if (link.relation == "next") {
                        hasLink = true;
                    }
                });
            }
            return hasLink;
        },
        getNextOrPrevPage: function(direction, lastSearch) {
            var deferred = $.Deferred();
            $.when(fhirClient.api[direction]({bundle: lastSearch.data}))
                .done(function(pageResult){
                    var resources = [];
                    if (pageResult.data.entry) {
                        pageResult.data.entry.forEach(function(entry){
                            resources.push(entry.resource);
                        });
                    }
                    deferred.resolve(resources, pageResult);
                });
            return deferred;
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

            $.when(fhirClient.api.search(searchParams))
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
        $.when(fhirClient.patient.read())
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
            });
        return deferred;
        },
        getFhirProfileUser: function() {
            var deferred = $.Deferred();
            if (fhirClient.userId === null ||
                typeof this.fhirClient.userId === "undefined"){
                deferred.resolve(null);
                return deferred;
            }
            var historyIndex = fhirClient.userId.lastIndexOf("/_history");
            var userUrl = fhirClient.userId;
            if (historyIndex > -1 ){
                userUrl = fhirClient.userId.substring(0, historyIndex);
            }
            var userIdSections = userUrl.split("/");

            $.when(fhirClient.api.read({type: userIdSections[userIdSections.length-2], id: userIdSections[userIdSections.length-1]}))
                .done(function(userResult){

                    var user = {name:""};
                    user.name = $filter('nameGivenFamily')(userResult.data);
                    user.id  = userResult.data.id;
                    deferred.resolve(user);
                });
            return deferred;
        },
        getIntent: function() {
            return fhirClient.tokenResponse.intent;
        }
    }
});
