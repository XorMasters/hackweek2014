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

        var signaling = new modSignaling.createSignalingForAgent(agentName);
        var masterSession = new modTransport.Session();

        function initiateMasterSession() {

            masterSession.on('localCallInfoAvailable', function (localCallInfo) {
                console.log('Received local call info. Posting agent request...');
                var localAgentContact =
                        new modContact.Contact(agentName, "Master session request from agent " + agentName, localCallInfo);
                signaling.postAgentRequest(localAgentContact);
            });

            masterSession.on('connected', function () {
                console.log('Agent connected to master session');
                masterSession.sendData({ message: "Hello from agent " });
            });

            masterSession.on('data', function (data) {
                console.log("Received data: " + data);
            })

            signaling.on('master_accepted', function (masterContact) {
                console.log("Request accepted by master node.");
                masterSession.setRemoteCallInfo("MasterSession", masterContact.callInfo);
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

        //setTimeout(hangupMasterSession, 10000);
    }
);
