console.log("Inside Master Test");

require.config({
    paths: {
        "EventEmitter": "../Lib/EventEmitter",
        "WebRtcAdapter": "../Lib/adapter"
    },
    baseUrl: './Code'
});

var masterNegotiator = undefined;
var callQueues = new Array();
var supportRequestSource = undefined;

require(
    ["xormasters/callcenter/signaling/MasterNegotiator",
     "xormasters/callcenter/signaling/Signaling",
     "xormasters/callcenter/queue/CallQueue"],

    function (modNegotiator, modSignaling, modCallQueue) {

        masterNegotiator = modNegotiator.createMasterNegotiator('call_queue');
        supportRequestSource = modSignaling.createClientSignalingForMaster();
        supportRequestSource.on('support_request', function (supportRequest) {
            if (callQueues.length > 0 && callQueues[0] != undefined) {
                console.log('Master adds support request from client ' + supportRequest.source.name + ' to queue');
                callQueues[0].update(supportRequest);
            } else {
                console.log('Master drops support request from client ' + supportRequest.source.name + 'because there is no agent connected');
            }
        });

        //function updateQueue() {
        //    var entry = {
        //        status: 'waiting',
        //        content: 'My question',
        //        from: 'client X'
        //    };
        //    callQueue.update(entry);
        //}

        masterNegotiator.on('connected', function (agentSession) {

            callQueue = new modCallQueue.CallQueue(true, agentSession);
            callQueue.start();

            callQueues.push(callQueue);

            //setTimeout(function () {
            //    updateQueue();
            //    setInterval(function () { updateQueue(); }, 1000);
            //}, 0);
        })

        function hangup(e) {
            for (var index = 0; index < callQueues.length; index++) {
                callQueues[index].stop();
                callQueues[index] = undefined;
            }
            callQueues = undefined;
            masterNegotiator = undefined;
        }

        window.onbeforeunload = hangup;

        masterNegotiator.connect();
    }
);
