console.log("Inside Agent Test");

require.config({
    paths: {
        "EventEmitter": "../Lib/EventEmitter",
        "WebRtcAdapter": "../Lib/adapter",
    },
    baseUrl: './Code'
});

// TODO: get unique agent name for each agent
var agentName = "Agent";

require(
    ["xormasters/callcenter/Contact",
     "xormasters/callcenter/transport/Transport",
     "xormasters/callcenter/signaling/Signaling"],

    function (modContact, modTransport, modSignaling) {

        var agentDataRef = new Firebase("https://xormastersclient.firebaseio.com");
        var clientDataRef = new Firebase("https://blazing-fire-5145.firebaseio.com");
        var signaling = new modSignaling.Signaling(agentDataRef, clientDataRef);

        var masterSession = new modTransport.Session();

        function initiateMasterSession() {

            masterSession.on('localCallInfoAvailable', function (localCallInfo) {
                console.log('Received local call info. Posting agent request...');
                var localAgentContact = new modContact.Contact(agentName, "Test answer made by Agent", localCallInfo);
                signaling.postAgentRequest(localAgentContact);
            });

            agentDataRef.on("child_added", function (snapshot) {
                var name = snapshot.child('name').val();
                if (name == "Master") {
                    console.log("Request accepted by master.");
                    agentDataRef.remove();
                }
            });

            masterSession.addTransport("MasterSession");
        }

        function hangupMasterSession() {
            if (masterSession != undefined) {
                masterSession.removeTransport("MasterSession");
                masterSession = undefined;
            }
        }

        initiateMasterSession();

        setTimeout(hangupMasterSession, 10000);
    }
);
