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

        var agentSessions = new Array();

        function initiateAgentSession(agentContact) {

            var agentSession = new modTransport.Session();

            agentSession.on('localCallInfoAvailable', function (localCallInfo) {
                console.log('Received local call info. Accepting agent request...');
                var localContact = new modContact.Contact("Master", "Test answer made by Master", localCallInfo);
                signaling.acceptAgentRequest(agentContact, localContact);
            });

            agentSession.on('connected', function () {
                console.log('Master connected to master session for agent');
                agentSession.sendData({ message: "Hello from master node" });
            });

            agentSession.addTransportWithRemote("AgentSession" + agentContact.name, agentContact.callInfo);

            agentSession.transport.on('data', function (data) {
                console.log("Received data: " + data);
            })

            agentSessions.push({ sessionId: agentContact.name, session: agentSession });
        }

        function hangup() {
            // TODO - for now keep agent sessions around until the page is unloaded.
        }

        function hangupAgentSessions(e) {
            for (var index = 0; index < agentSessions.length; index++) {
                agentSessions[index].close();
                agentSessions[index] = undefined;
            }
        }

        window.onbeforeunload = hangupAgentSessions;

        var signaling = new modSignaling.createSignalingForMaster();
        signaling.on("agent_request", function (agentContact) {
            console.log("Received agent request.");
            initiateAgentSession(agentContact);
        });
    }
);
