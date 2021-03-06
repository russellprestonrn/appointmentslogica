var user = "";
var patient = "";
var profile = "";
var appointments = [];
var events = [];

var selectedEndpoint = "";
var currentClient;
var clientList = {
    secureFhirClient: ""
};

var endpointChoices = [
    {
        name: "Default",
        color: "#00AEEF"
    },
    {
        name: "Epic",
        color: "#ba122b",
        serviceUrl: "https://open-ic.epic.com/FHIR/api/FHIR/DSTU2",
        idMapper: {
            COREPATIENT1: "Tw7SP1sBqQoduuaDojd44wcx8KAzmRCwo5pnhZcoN520B",
            COREPATIENT2: "TC1.2m5XdQszeI0Nz13l-O9blxzpCHD2a4YXtKyw-BnEB",
            COREPATIENT3: "TlJf9j92mA7CV.8nJyh9v4IMR3c6Pm7UYkRw3NRE-bHYB",
            COREPRACTITIONER1: "TVy8RAXnmRUPk1qD4uj.ZnAB",
            COREPRACTITIONER4: "TimwOSrxR9gFuHZTwFBMzlgB"
        }
    },
    {
        name: "Federated",
        color: "#4178be",
        serviceUrl: "https://dataphoria.org/datafhir",
        sources: [
            {
                source: "Epic",
                color: "#ba122b"
            },
            {
                source: "Vista",
                color: "#4178be"
            },
            {
                source: "HSPC",
                color: "#00AEEF"
            }
        ]
//    },
//    {
//        name: "Custom",
//        color: "#008000",
//        serviceUrl: ""
    }
];

initClient().then(function(){
    windowResized();
    buildSettings();
    initializeCalendar();
    setUpScrollHandling();

    if (hasPatientContext()) {
        queryPatient()
            .done(function(patientResult){
                patient = patientResult;
                user = patient;
                user.resourceType = "Patient";
                document.getElementById("app-title").innerHTML = "Patient Appointments";
                document.getElementById("user-name").innerHTML = patient.name;
                document.getElementById("user-icon").className = "fa fa-user";
                $('#calendar').fullCalendar( 'changeView', "month" );
                readAppointments({patient: patient.id});
            }).fail(function(){
            });
    } else {
        getFhirProfileUser()
            .done(function(profileResult){
                profile = profileResult;
                user = profile;
                user.resourceType = "Practitioner";
                document.getElementById("app-title").innerHTML = "Practitioner Appointments";
                document.getElementById("user-name").innerHTML = profile.name;
                document.getElementById("user-icon").className = "fa fa-user-md";
                $('#calendar').fullCalendar( 'changeView', "agendaWeek" );
                readAppointments({practitioner: profile.id});
            }).fail(function(){
            });
    }
});

function readAppointments(query)  {
    appointments = [];
    queryResourceInstances("Appointment", query)
        .done(function(resourceResults){
            resourceResults.forEach(function(resource) {
                // Check for source Extension
                if (typeof resource.extension !== "undefined") {
                    resource.extension.forEach(function (extension) {
                        if (extension.url == "http://logicahealth.org/extensions/source-system") {
                            resource.color = getColor(extension.valueString, selectedEndpoint);
                        }
                    });
                }
                if (selectedEndpoint.name !== "Federated" ) {
                    getParticipants(resource)
                        .done(function(participants){
                            resource.participants = participants;
                            appointments.push(resource);
                            buildCalendarEvents();
                        }).fail(function(){
                        });
                } else {
                    appointments.push(resource);
                }
            });
            buildCalendarEvents();

        }).fail(function(){
        });
}

function getColor(source, endpoint) {
    var color;
    endpoint.sources.forEach(function(sourceItem){
        if (sourceItem.source === source){
            color = sourceItem.color;
        }
    });
    return color;
}

function getParticipants(resource)  {
    var participantList = [];
    var deferred = $.Deferred();

    resource.participant.forEach(function(participant) {

        var segments = participant.actor.reference.split("/");
            participantList.push({
                resourceType: segments[segments.length - 2],
                id: segments[segments.length - 1]
            });
    });
        getParticipant(participantList, 0).done(function(participants){
            deferred.resolve(participants);
        }).fail(function(){
                deferred.reject();
            });
    return deferred;
}

function getParticipant(participantList, index)  {
    var participants = [];
    var deferred = $.Deferred();
        $.when(currentClient.api.read({type: participantList[index].resourceType, id: participantList[index].id}))
        .done(function(participantResult){
            if (participantList.length > index + 1) {
                    getParticipant(participantList, ++index).done(function(nestedParticipants){
                    participants = participants.concat(nestedParticipants);
                    participants.push({
                        resourceType: participantResult.data.resourceType,
                        id: participantResult.data.id,
                        name: nameGivenFamily(participantResult.data)
                    });
                    deferred.resolve(participants);
                }).fail(function(){
                        deferred.reject();
                    });
            } else {
                participants.push({
                    resourceType: participantResult.data.resourceType,
                    id: participantResult.data.id,
                    name: nameGivenFamily(participantResult.data)
                });
                deferred.resolve(participants);
            }
        }).fail(function(){
            deferred.reject();
        });
    return deferred;
}

function settings(choosen, customUrl){
    var newSettings = "";
    endpointChoices.forEach(function(entry){
        if (entry.name === choosen) {
            newSettings = entry;
        }
    });

    if (newSettings.name === "Custom" && customUrl !== undefined) {
        newSettings.serviceUrl = customUrl;
    }

    if (selectedEndpoint === newSettings || newSettings.serviceUrl === ""){
        return;
    }
    selectedEndpoint = newSettings;
    if (selectedEndpoint.name === "Default") {
        initClient();
    } else {
        initNonSecureClient(selectedEndpoint.serviceUrl);
    }

    if (user.resourceType === "Patient") {
        var patientId;
        if (selectedEndpoint.idMapper !== undefined &&
            selectedEndpoint.idMapper[patient.id] !== undefined) {
            patientId = selectedEndpoint.idMapper[patient.id]
        } else {
            patientId = patient.id;
        }

        readAppointments({patient: patientId});
    } else {
        var practitionerId;
        if (selectedEndpoint.idMapper !== undefined &&
            selectedEndpoint.idMapper[profile.id] !== undefined) {
            practitionerId = selectedEndpoint.idMapper[profile.id]
        } else {
            practitionerId = profile.id;
        }
        readAppointments({practitioner: practitionerId});
    }
}

$(document).on('click', 'div.dropdown ul.dropdown-menu li a', function (e) {
    var customUrl;
    if (e.currentTarget.id === "Custom") {
        customUrl = document.getElementById("custom-url").value;
    }
    settings(e.currentTarget.id, customUrl);
});

function updateCalendarEvents() {
    $('#calendar').fullCalendar( 'removeEvents' );
    events.forEach(function(event){
        $('#calendar').fullCalendar( 'renderEvent', event, true );
    });
    $('#calendar').fullCalendar( 'rerenderEvents' );
}

function buildSettings() {
    var html = "";

    endpointChoices.forEach(function(choice) {
        if (choice.name !== "Custom") {
            html = html + '<li><a href="#" id="'+ choice.name + '">' + choice.name + '</a></li>';
        }
    });
//    html = html + '<li><a href="#" id="Custom">Custom</a></li><input class="custom-url" type="text" id="custom-url">';
    document.getElementById("settings-choices").innerHTML = html;
}

function determineEndtime(start, duration) {
    if (duration === undefined)
        return undefined;
    var endTime = new Date(start);
    endTime.setMinutes(endTime.getMinutes() + duration);
    return endTime.toISOString();
}

function buildCalendarEvents(){
    while (events.length > 0) {
        events.pop();
    }

    appointments.forEach(function(appointment) {
        events.push({
            "id":appointment.id,
            "color": (appointment.color !== undefined) ? appointment.color : selectedEndpoint.color,
            "title":(appointment.description !== undefined) ? appointment.description : appointment.type.text,
            "start": new Date(appointment.start),
            "location": (mockLocation(appointment) !== undefined) ? mockLocation(appointment) : "",
            "who": buildAttendeesList(appointment),
            "end": (appointment.end !== undefined) ? new Date(appointment.end) : new Date(determineEndtime(appointment.start, appointment.minutesDuration))
        })
    });
    updateCalendarEvents();
}

function buildAttendeesList(appointment) {
    var attendees = "";
    var currentUserFound = false;
    if (appointment.participants !== undefined) {
        appointment.participants.forEach(function(participant){
            if (participant.resourceType === "Patient" || participant.resourceType === "Practitioner"){
                if (attendees !== "") {
                    attendees = attendees + "; ";
                }
                if (participant.name === user.name) {
                    currentUserFound = true;
                }
                attendees = attendees + participant.name;
            }
        });
    }
    if (!currentUserFound) {
        attendees = user.name + "; " + attendees;
    }
    return attendees;
}

function mockLocation(appointment) {
    var location = "";
    var practitioner = "";
    if (appointment.participants !== undefined) {
        appointment.participants.forEach(function(participant){
            if (participant.resourceType === "Practitioner"){
                practitioner = participant;
            } else if (participant.resourceType === "Location") {
                location = participant;
            }
        });
    }
    if (location !== "") {
        return location;
    } else if (practitioner !== "") {
        return "Office of " + practitioner.name;
    } else {
        return "Doctor's Office";
    }
}

var locked = false;
var runOnScroll =  function(evt) {
    if(locked) return;
    locked = true;
    $('.popover').each( function() {
        if( $(evt.target).parents(".fc-time-grid-event").get(0) !== $(this).prev().get(0) ) {
            $(this).popover('hide');
        }
    });
    $('#calendar').fullCalendar( 'unselect' );
    locked = false;
};

function setUpScrollHandling() {
    var elements = document.querySelectorAll(".fc-scroller");
    elements = Array.prototype.slice.call(elements);

    // and then make each element do something on scroll
    elements.forEach(function(element) {
        element.addEventListener("scroll", runOnScroll);
    });
}

function initializeCalendar() {
    $('#calendar').fullCalendar({
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay'
        },
        defaultDate: new Date().toDateString(),
        editable: false,
        selectable: true,
        eventLimit: true, // allow "more" link when too many events
        events: events,
        businessHours: {
            start: '08:00',
            end: '17:00',

            dow: [ 1, 2, 3, 4, 5 ]
            // days of week. an array of zero-based day of week integers (0=Sunday)
            // (Monday-Thursday in this example)
        },
        dayClick: function(date, jsEvent, view) {
            $('#calendar').fullCalendar('gotoDate', date);
            $('#calendar').fullCalendar( 'unselect' );
            $('.popover').each( function() {
                if( $(jsEvent.target).parents(".fc-day").get(0) !== $(this).prev().get(0) ) {
                    $(this).popover('hide');
                }
            });
        },
        eventRender: function (event, element) {
            element.popover({
                placement:'top',
                html:true,
                container:'body',
                content:    '<div class="event-title-box"><div class="event-title">'+event.title+'</div><a href="#" class="event-close-button">&#10005;</a></div>' +
                    (event.location && '</div><div class="event-detail-line"><div class="event-label">Where</div><div class="event-value">'+ event.location+'</div></div>' || '') +
                    (event.start && '<div class="event-detail-line"><div class="event-label">Start</div><div class="event-value">'+ moment(new Date(event.start)).format('MMMM Do YYYY, h:mm a')+'</div></div>' || '') +
                    (event.end && '<div class="event-detail-line"><div class="event-label">End</div><div class="event-value">'+moment(new Date(event.end)).format('MMMM Do YYYY, h:mm a')+'</div></div>' || '') +
                    (event.who && '<div class="event-detail-line"><div class="event-label">Who</div><div class="event-value">'+ event.who+'</div></div>' || ''),
                trigger: 'focus'
            });
            element.attr('tabindex', -1);
            $('body').on('click', function (e) {
                if (!element.is(e.target) && element.has(e.target).length === 0 && $('.popover').has(e.target).length === 0)
                    element.popover('hide');
                $('#calendar').fullCalendar( 'unselect' );
            });

        },
        eventClick: function(calEvent, jsEvent, view) {
            $(this).popover('show');
            return false;
        },
        viewRender: function(view,element){
            setUpScrollHandling();
        }
    });
}

function windowResized() {
    var offset = (user.resourceType === "Patient") ? 150 : 180;
    var w = window.outerWidth;
    document.getElementById("app-title").style.left = (w/2) - offset + "px";
}

/**
 *
 *      FHIR SERVICE API CALLS
 *
 **/

function initClient(){
    endpointChoices.forEach(function(entry){
        if (entry.name === "Default") {
            selectedEndpoint = entry;
        }
    });

    var deferred = $.Deferred();
    if (clientList.secureFhirClient !== undefined && clientList.secureFhirClient !== "") {
        currentClient = clientList.secureFhirClient;
        deferred.resolve();
    }

    FHIR.oauth2.ready(function(smart){
        clientList.secureFhirClient = smart;
        currentClient = smart;
        deferred.resolve();
    });
    return deferred;
}

function initNonSecureClient(serviceUrl) {
    if (clientList[serviceUrl] !== undefined) {
        currentClient = clientList[serviceUrl];
    } else {
        clientList[serviceUrl] = FHIR.client({ serviceUrl: serviceUrl });
        currentClient = clientList[serviceUrl];
    }
}

function queryResourceInstances(resource, searchValue, tokens, sort, count) {
    var deferred = $.Deferred();

    if (selectedEndpoint.name === "Federated"){

        var params = "";
        for(var propertyName in searchValue) {
            if (searchValue.hasOwnProperty(propertyName)) {
                if (params !== "")
                {
                    params = params + "&";
                }
                params = params + propertyName + "=" + searchValue[propertyName];
            }
        }
        $.get(clientList.secureFhirClient.server.serviceUrl + '/_services/smart/federated?uri=/' + resource + '?' + params,
            function(resourceSearchResult, status){
                var resourceResults = [];
                if (resourceSearchResult.entry) {
                    resourceSearchResult.entry.forEach(function(entry){
                        entry.resource.fullUrl = entry.fullUrl;
                        resourceResults.push(entry.resource);
                    });
                }
                deferred.resolve(resourceResults, resourceSearchResult);
            });
    } else {

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
            }).fail(function(){
                deferred.reject();
            });
    }
    return deferred;
}

function queryPatient(){
    var deferred = $.Deferred();
    $.when(currentClient.patient.read())
        .done(function(patientResult){
            var patient = {name:""};
            patient.name = nameGivenFamily(patientResult);
//
//            patientResult.name[0].given.forEach(function(value) {
//                patient.name = patient.name + ' ' + String(value);
//            });
//            patientResult.name[0].family.forEach(function(value) {
//                patient.name = patient.name + ' ' + value;
//            });
            patient.sex = patientResult.gender;
            patient.dob = patientResult.birthDate;
            patient.id  = patientResult.id;
            deferred.resolve(patient);
        }).fail(function(){
            deferred.reject();
        });
    return deferred;
}

function getFhirProfileUser() {
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
            user.name = nameGivenFamily(userResult.data);
            user.id  = userResult.data.id;
            deferred.resolve(user);
        }).fail(function(){
            deferred.reject();
        });
    return deferred;
}

function hasPatientContext() {
    return currentClient.patient !== undefined;
}


function nameGivenFamily(p) {
    var isArrayName = p && p.name && p.name[0];
    var personName;

    if (isArrayName) {
        personName = p && p.name && p.name[0];
        if (!personName) return null;

    } else {
        personName = p && p.name;
        if (!personName) return null;
    }

    var user;
    if (Object.prototype.toString.call(personName.family) === '[object Array]') {
        user = personName.given.join(" ") + " " + personName.family.join(" ");
    } else {
        user = personName.given.join(" ") + " " + personName.family;
    }
    if (personName.suffix) {
        user = user + ", " + personName.suffix.join(", ");
    }
    return user;
}