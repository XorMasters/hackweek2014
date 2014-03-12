require.config({
    paths: {
        "EventEmitter": "../Lib/EventEmitter",
        "WebRtcAdapter": "../Lib/adapter"
    },
    baseUrl: './Code'
});

$( document ).ready(function() {
     console.log('Document Ready!');
});

var masterNegotiator = undefined;
var callQueue = undefined;
var supportRequestSource = undefined;
var agents = {};
var name = window.location.search.slice(1);

console.log("name: " + name);

var onload = function() {
	if(name == null || name.length <= 0) {
		console.log("No name to call center given");
		alert("No name is given for the call center. Reload the page with a call center name")
	}
	
	$('#call-center-name').html($('#call-center-name').html() + name);
}

require(
    ["xormasters/callcenter/signaling/MasterNegotiator",
     "xormasters/callcenter/signaling/Signaling",
     "xormasters/callcenter/queue/CallQueue"],

    function (modNegotiator, modSignaling, modCallQueue) {

        masterNegotiator = modNegotiator.createMasterNegotiator('call_queue', name);
        supportRequestSource = modSignaling.createClientSignalingForMaster(name);
        supportRequestSource.on('support_request', function (supportRequest) {
            if (callQueue != undefined) {
                console.log('Master adds support request from client ' + supportRequest.source.name + ' to queue');
                callQueue.update(supportRequest);
            } else {
                console.log('Master drops support request from client ' + supportRequest.source.name + 'because there is no agent connected');
            }
        });

        masterNegotiator.on('connected', function (agent) {

			var agentSession = agent.session;
			var agentContact = agent.contact;
			
			if( callQueue == undefined ) {
            	callQueue = new modCallQueue.CallQueue(true, agentSession);
            	callQueue.start();
				callQueue.on('update', populateQueue)
			}
			
			callQueue.sendUpdate();

			var keys = Object.keys(agentSession.transports)
			var transport = keys[keys.length - 1]
			addAgentToList({transport: transport, timestamp: new Date(), contact: agentContact, state: 'connected'})	
        })

		function addAgentToList(agent) {
			agents[agent.contact.name] = agent.contact;
			
			$('.agent-entry').remove("[id='" + agent.contact.name + "']");
			
			var agentDiv = $('<div/>', {'class': 'agent-entry', 
			                           'id': agent.contact.name});
									   
			agentDiv.append($('<div/>', {'class': 'agent-entry-name', 
			                             html: 'Agent name: ' + agent.contact.name}));			
			agentDiv.append($('<div/>', {'class': 'agent-entry-transport-name', 
			                             html: 'Transport name: ' + agent.transport}));			
			agentDiv.append($('<div/>', {'class': 'agent-entry-time', 
			                              html: 'Connected to call center: ' + agent.timestamp.toLocaleString()}));			
			agentDiv.append($('<div/>', {'class': 'agent-entry-state', 
			                             html: 'State: ' + agent.state}));
			
			$('#agents-list').append(agentDiv);
		}
		
	    function populateQueue(entries) {
	        $("#calls-list").empty();

	        for (var idx = 0; idx < entries.length; ++idx) {
				console.log("entry => ", entries[idx])
				var id = 'entry' + idx;
			
	            var status = entries[idx].status.toLowerCase();
	            var newDiv = $('<div/>', {'class': 'queue-entry-' + status, 
				                          'id': id});
										  
	            newDiv.append($('<div/>', {'class': 'queue-entry-name', 
				                            html: "Name: " + entries[idx].content.name}));
	            newDiv.append($('<div/>', {'class': 'queue-entry-summary', 
				                           html: "Summary: " + entries[idx].content.summary}));
	            newDiv.append($('<div/>', {'class': 'queue-entry-status', 
				                           html: "Status: " + entries[idx].status}));

	            if(entries[idx].status == 'waiting') {
	              newDiv.append($('<div/>', {'class': 'queue-entry-wait', 
				                             html: "Waiting Since: " + new Date(entries[idx].timestamp).toLocaleString()}));			  
	            }
				
	            $("#calls-list").append(newDiv);
	        }
	    }
		
        function hangup(e) {
            callQueue && callQueue.stop();
			callQueue = undefined;
            masterNegotiator = undefined;
        }

        window.onbeforeunload = hangup;
        masterNegotiator.connect();
    }
);
