'use strict'

define(
    ["xormasters/callcenter/Contact",
     "xormasters/callcenter/transport/Transport",
     "xormasters/callcenter/signaling/Signaling",
     "EventEmitter"],
    function (modContact, modTransport, modSignaling, EventEmitter) {

        var AgentSupportNegotiator = function (supportRequest, transportName, agentName) {

            this.supportRequest = supportRequest;
            this.transportName = transportName;
            this.agentName = agentName;
            this.signaling = new modSignaling.createClientSignalingForAgent(agentName);
        };

         AgentSupportNegotiator.prototype = {

            connect: function () {

                var thi$ = this;

                var supportSession = new modTransport.Session();

                supportSession.on('localCallInfoAvailable', function (localCallInfo) {
                    console.log('AgentSupportNegotiator: Received local call info. Posting support response...');
                    var localAgentContact =
                            new modContact.Contact(thi$.agentName, "Support session request from agent " + thi$.agentName, localCallInfo);
                    thi$.signaling.acceptClientRequest(thi$.supportRequest, localAgentContact);
                });

                supportSession.on('localStreamError', function (error) {
                    thi$.emit('localStreamError', error);
                });

                supportSession.on('connected', function () {
                    console.log('Agent connected to support session');
                    thi$.emit('connected', supportSession);
                });

                supportSession.addTransportWithRemote(this.transportName, thi$.supportRequest.source.callInfo, { video: true, audio:true });
            }
        };

        AgentSupportNegotiator.prototype.__proto__ = EventEmitter.prototype;

        //==================================================================================================
        // Factories
        function createAgentSupportNegotiator(supportRequest, transportName, agentName) {
            return new AgentSupportNegotiator(supportRequest, transportName, agentName);
        }

        //==================================================================================================
        // Exports
        return {
            createAgentSupportNegotiator: createAgentSupportNegotiator,
        }
    }
);
