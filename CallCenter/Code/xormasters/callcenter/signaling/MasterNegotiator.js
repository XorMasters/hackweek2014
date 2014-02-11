'use strict'

define(
    ["xormasters/callcenter/Contact",
     "xormasters/callcenter/transport/Transport",
     "xormasters/callcenter/signaling/Signaling",
     "EventEmitter"],
    function (modContact, modTransport, modSignaling, EventEmitter) {
        
        var MasterNegotiator = function (transportName) {

            this.transportName = transportName;
            this.signaling = new modSignaling.createSignalingForMaster();
        };

        function initiateAgentSession(negotiator, agentContact) {

            var agentSession = new modTransport.Session();

            agentSession.on('localCallInfoAvailable', function (localCallInfo) {
                console.log('Received local call info. Accepting agent request...');
                var localContact = new modContact.Contact("Master", "Test answer made by Master", localCallInfo);
                negotiator.signaling.acceptAgentRequest(agentContact, localContact);
            });

            agentSession.on('connected', function () {
                console.log('Master connected to master session for agent', agentSession);
                negotiator.emit('connected', agentSession);
            });

            agentSession.addTransportWithRemote(negotiator.transportName, agentContact.callInfo);
        }

        MasterNegotiator.prototype = {

            connect: function () {
                var thi$ = this;
                this.signaling.on("agent_request", function (agentContact) {
                    console.log("Received agent request.");
                    initiateAgentSession(thi$, agentContact);
                });
            }
        };

        MasterNegotiator.prototype.__proto__ = EventEmitter.prototype;

//==================================================================================================
// Factories
        function createMasterNegotiator(transportName) {
            return new MasterNegotiator(transportName);
        }

//==================================================================================================
// Exports
        return {
            createMasterNegotiator: createMasterNegotiator,
        }
    }
);
