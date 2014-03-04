console.log("Inside Master Test");

require.config({
    paths: {
        "EventEmitter": "../Lib/EventEmitter",
        "WebRtcAdapter": "../Lib/adapter"
    },
    baseUrl: './Code'
});

var masterNegotiator = undefined;
var callQueue = undefined;
var supportRequestSource = undefined;

require(
    ["xormasters/callcenter/signaling/MasterNegotiator",
     "xormasters/callcenter/signaling/Signaling",
     "xormasters/callcenter/queue/CallQueue"],

    function (modNegotiator, modSignaling, modCallQueue) {

        masterNegotiator = modNegotiator.createMasterNegotiator('call_queue');
        supportRequestSource = modSignaling.createClientSignalingForMaster();
        supportRequestSource.on('support_request', function (supportRequest) {
            if (callQueue != undefined) {
                console.log('Master adds support request from client ' + supportRequest.source.name + ' to queue');
                callQueue.update(supportRequest);
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

			if( callQueue == undefined ) {
            	callQueue = new modCallQueue.CallQueue(true, agentSession);
            	callQueue.start();
				callQueue.on('update', populateQueue)
			}
			
			callQueue.sendUpdate();

			console.log('AgentSession - ', agentSession)
			var agentList = document.getElementById('agents-list');

			var keys = Object.keys(agentSession.transports)
			var transport = keys[keys.length - 1]
			addAgentToList({transport: transport, timestamp: new Date(), state: 'connected'})
			
            //setTimeout(function () {
            //    updateQueue();
            //    setInterval(function () { updateQueue(); }, 1000);
            //}, 0);
        })

		function addAgentToList(agent) {
			var agentsList = document.getElementById('agents-list')
			
			var agentDiv = document.createElement('div')
			agentDiv.setAttribute('class', 'agent-entry')
			
			var nameDiv = document.createElement('div')
			nameDiv.setAttribute('class', 'agent-entry-name')
			nameDiv.innerHTML = 'Transport name: ' + agent.transport
			agentDiv.appendChild(nameDiv);
			
			var timeDiv = document.createElement('div')
			timeDiv.setAttribute('class', 'agent-entry-time')
			timeDiv.innerHTML = 'Connected to call center: ' + agent.timestamp.toLocaleString()
			agentDiv.appendChild(timeDiv);
			
			var stateDiv = document.createElement('div')
			stateDiv.setAttribute('class', 'agent-entry-state')
			stateDiv.innerHTML = 'State: ' + agent.state
			agentDiv.appendChild(stateDiv);
			
			agentsList.appendChild(agentDiv);
		}
		
	    function populateQueue(entries) {

	        var queue = document.getElementById("calls-list");
	        queue.innerHTML = "";
	        for (var idx = 0; idx < entries.length; ++idx) {
	            var newDiv = document.createElement('div');
				var id = 'entry' + idx;
			
	            var status = entries[idx].status.toLowerCase();
	            newDiv.setAttribute('class', 'queue-entry-' + status);
	            newDiv.setAttribute('id', id);

	            var nameDiv = document.createElement('div')
	            nameDiv.setAttribute('class', 'queue-entry-name');
	            nameDiv.innerHTML = "Name: " + entries[idx].content.name;
	            newDiv.appendChild(nameDiv);

	            var summDiv = document.createElement('div')
	            summDiv.setAttribute('class', 'queue-entry-summary');
	            summDiv.innerHTML = "Summary: " + entries[idx].content.summary;
	            newDiv.appendChild(summDiv);

	            var statDiv = document.createElement('div')
	            statDiv.setAttribute('class', 'queue-entry-status');
	            statDiv.innerHTML = "Status: " + entries[idx].status;
	            newDiv.appendChild(statDiv);

	            if(entries[idx].status == 'waiting') {
	              var waitDiv = document.createElement('div')
	              waitDiv.setAttribute('class', 'queue-entry-wait');
	              waitDiv.innerHTML = "Waiting Since: " + new Date(entries[idx].timestamp).toLocaleString();
	              newDiv.appendChild(waitDiv);
			  
	            }
	            queue.appendChild(newDiv);
	        }
	    }
		
        function hangup(e) {
            callQueue.stop();
			callQueue = undefined;
            masterNegotiator = undefined;
        }

        window.onbeforeunload = hangup;
        masterNegotiator.connect();
    }
);
