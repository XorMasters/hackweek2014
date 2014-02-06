console.log("Inside Master Test");

require.config({
    paths: {
        "EventEmitter": "../Lib/EventEmitter",
        "WebRtcAdapter": "../Lib/adapter"
    },
    baseUrl: './Code'
});

require(
    ["xormasters/callcenter/Contact",
     "xormasters/callcenter/transport/Transport",
     "xormasters/callcenter/signaling/Signaling"],

    function (modContact, modTransport, modSignaling) {

        var agentDataRef = new Firebase("https://xormastersclient.firebaseio.com");
        var clientDataRef = new Firebase("https://blazing-fire-5145.firebaseio.com");
        var signaling = new modSignaling.Signaling(agentDataRef, clientDataRef);

        var agentSessions = new Array();

        function initiateAgentSession(agentContact) {

            var agentSession = new modTransport.Session();

            agentSession.on('localCallInfoAvailable', function (localCallInfo) {
                console.log('Received local call info. Accepting agent request...');
                var localContact = new modContact.Contact("Master", "Test answer made by Master", localCallInfo);
                signaling.acceptRequest(agentContact, localContact);
            });

            agentSessions.push({ sessionId: agentContact.name, session: agentSession });

            agentSession.addTransport("AgentSession" + agentContact.name);
        }

        function hangupAgentSession() {
            // TODO - for now keep agent sessions around until the page is destroyed.
        }

        agentDataRef.on("child_added", function (snapshot) {
            var name = snapshot.child('name').val();
            if (name.indexOf('Agent') == 0) {
                console.log("Received agent request.");
                initiateAgentSession(agentContact);
            }
        });
    }
);
