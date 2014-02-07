'use strict'

define(
    ["xormasters/callcenter/Contact",
     "xormasters/callcenter/transport/Transport",
     "xormasters/callcenter/signaling/Signaling",
     "EventEmitter"],
    function (modContact, modTransport, modSignaling, EventEmitter) {

        var AgentNegotiator = function (transportName, agentName) {

            this.transportName = transportName;
            this.agentName = agentName;
            this.signaling = new modSignaling.createSignalingForAgent(agentName);
        };

         AgentNegotiator.prototype = {

            connect: function () {

                var thi$ = this;

                var masterSession = new modTransport.Session();

                masterSession.on('localCallInfoAvailable', function (localCallInfo) {
                    console.log('Received local call info. Posting agent request...');
                    var localAgentContact =
                            new modContact.Contact(thi$.agentName, "Master session request from agent " + thi$.agentName, localCallInfo);
                    thi$.signaling.postAgentRequest(localAgentContact);
                });

                masterSession.on('connected', function () {
                    console.log('Agent connected to master session');
                    thi$.emit('connected', masterSession);
                });

                masterSession.addTransport(this.transportName);

                this.signaling.on('master_accepted', function (masterContact) {
                    console.log("Request accepted by master node.");
                    masterSession.setRemoteCallInfo("MasterSession", masterContact.callInfo);
                });
            }
        };

        AgentNegotiator.prototype.__proto__ = EventEmitter.prototype;

        //==================================================================================================
        // Factories
        function createAgentNegotiator(transportName, agentName) {
            return new AgentNegotiator(transportName, agentName);
        }

        //==================================================================================================
        // Exports
        return {
            createAgentNegotiator: createAgentNegotiator,
        }
    }
);
