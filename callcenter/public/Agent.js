console.log("Inside Agent Test");

require.config({
    paths: {
        "EventEmitter": "../Lib/EventEmitter",
        "WebRtcAdapter": "../Lib/adapter",
    },
    baseUrl: './Code'
});

// TODO: get unique agent name for each agent
var kAgentName = "Agent";

define(
    ["xormasters/callcenter/signaling/AgentNegotiator",
        "xormasters/callcenter/signaling/AgentSupportNegotiator",
        "xormasters/callcenter/queue/CallQueue",
        "EventEmitter"],

    function (modNegotiator, modSupportNegotiator, modCallQueue, EventEmitter) {

        var Agent = function (agentName, callCenterName) {
            this.agentName = agentName;
			this.role = 'Agent';
			this.callCenterName = callCenterName;
            this.masterNegotiator = modNegotiator.createAgentNegotiator('call_queue', agentName, callCenterName);
            this.supportNegotiator = undefined;
            this.callQueue = undefined;
            this.supportSession = undefined;

			console.log("call center name: " + this.callCenterName);
            var thi$ = this;

            this.masterNegotiator.on('connected', function (session) {

                thi$.callQueue = new modCallQueue.CallQueue(false, session);

                thi$.callQueue.on('takenResult', function (msgPayload) {

                    if (msgPayload == null) {
                        console.log('Request not accessible.');
                        return;
                    }

                    console.log('Granted permission to take request: ' + msgPayload);

                    thi$.supportNegotiator = modSupportNegotiator.createAgentSupportNegotiator(msgPayload, 'support', thi$.agentName, thi$.callCenterName);

					thi$.supportNegotiator.on('localStreamError', function(error) {
						console.log("Negotiator: Local stream error");
						thi$.emit('localStreamError', error);
					});
					
                    thi$.supportNegotiator.on('connected', function (session) {
                        thi$.supportSession = session;
                        // TODO: subscribe to all session events to make the streams available in HTML
                        console.log('Connected to support session');

                        session.on('remoteStreamAdded', function (stream) {
                            console.log("Agent: remote stream added");
                            thi$.emit('remoteStreamAdded', stream);
                        });
                        session.on('remoteStreamRemoved', function (stream) {
                            thi$.emit('remoteStreamRemoved', stream);
                        });

						session.on('localStreamAdded', function(stream) {
							console.log("Agent: local stream added");
							thi$.emit('localStreamAdded', stream);
						});
                        session.on('localStreamRemoved', function (stream) {
                            thi$.emit('localStreamRemoved', stream);
                        });
                        
                        for( var name in session.transports) {
                          if (session.transports[name].localStream != undefined) {
                            thi$.emit('localStreamAdded', session.transports[name].localStream);
                          }
                          
                          if (session.transports[name].remoteStream != undefined) {
                            thi$.emit('remoteStreamAdded', session.transports[name].remoteStream);
                          }
                        }

                    });
					
					thi$.supportNegotiator.on('disconnected', function(session){
						thi$.emit('disconnected', session);
					});
					
                    thi$.supportNegotiator.connect();
                });

                thi$.callQueue.on('update', function (queue) {
                    console.log('Call queue updated. New queue: ' + queue);
                    thi$.emit('queue_updated', queue);
                });

                thi$.callQueue.start();
            });
        };

        Agent.prototype = {

            connectToMaster: function () {
                this.masterNegotiator.connect();
            },

            hangupSupportSession: function () {
				console.log("Hanging up: ", this.supportSession );
                if (this.supportSession != undefined && this.supportSession.transports.support != undefined) {
                    this.supportSession.close('support');
                    this.supportSession = undefined;
                    this.supportNegotiator = undefined;
                }
            },

            hangup: function () {
                this.hangupSupportSession();
            },

            acceptRequest: function (supportRequest) {
                this.callQueue.take(supportRequest);
            }
        };

        Agent.prototype.__proto__ = EventEmitter.prototype;

        return {
            Agent: Agent
        };
        //Agent = _Agent;
        //supportAgent = new _Agent(kAgentName);
    }
);
