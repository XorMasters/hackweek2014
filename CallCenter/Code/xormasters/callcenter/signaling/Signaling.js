'use strict'

define(
    ["EventEmitter"],
    function(EventEmitter) {

        var masterDestination = "Master";

//==================================================================================================
// Agent <-> Master Signaling
        var AgentSignaling = function (isMaster, localDestination) {

            //Sagar's Firebase
            this.agentDataRef = new Firebase("https://xormastersclient.firebaseio.com");
            //Stan's Firebase
            //this.agentDataRef = new Firebase("https://resplendent-fire-4441.firebaseio.com/");
            this.isMaster = isMaster;
            this.localDestination = localDestination;
            var thi$ = this;

            this.agentDataRef.on("child_added", function (snapshot) {
                var destination = snapshot.child('destination').val();

                if (thi$.isMaster) {
                    var agentContact = snapshot.child('source').val();
                    console.log('Received child_added for destination: ', destination, ' source ', agentContact);
                    if ((destination === localDestination)
                            && (agentContact.name.indexOf('Agent') == 0)) {
                        thi$.emit('agent_request', agentContact);
                    }
                } else {
                    var masterContact = snapshot.child('source').val();
                    console.log('Received child_added for destination: ', destination, ' source ', masterContact);
                    if ((destination === localDestination)
                            && (masterContact.name.indexOf('Master') == 0)) {
                        thi$.emit('master_accepted', masterContact);
                    }
                    // TODO: How about multiple agents at the same time?
                    // snapshot.remove();
                }
            });
        };

        AgentSignaling.prototype = {

            postAgentRequest: function (agentContact) {

                var request = {
                    source: agentContact,
                    destination: masterDestination,
                    timestamp : new Date().getTime()
                }

                this.agentDataRef.push(request);
            },

            acceptAgentRequest: function (agentContact, masterContact) {

                var request = {
                    source: masterContact,
                    destination: agentContact.name,
                    timestamp: new Date().getTime()
                }

                this.agentDataRef.push(request);
            },
        }

        AgentSignaling.prototype.__proto__ = EventEmitter.prototype;

//==================================================================================================
// Client <-> Master Signaling
        var ClientSignaling = function () {

            var clientDataRef = new Firebase("https://blazing-fire-5145.firebaseio.com");
        };

        ClientSignaling.prototype = {
            postClientRequest : function(clientContact) {
                ClientDataref.push(request);
            },
        
            acceptClientRequest: function (clientContact, agentContact) {
            }
        }
        
        ClientSignaling.prototype.__proto__ = EventEmitter.prototype;

//==================================================================================================
// Factories
        function createSignalingForAgent(localDestination) {
            return new AgentSignaling(false, localDestination);
        }

        function createSignalingForMaster() {
            return new AgentSignaling(true, masterDestination);
        }

//==================================================================================================
// Exports
        return {
            createSignalingForAgent: createSignalingForAgent,
            createSignalingForMaster: createSignalingForMaster
        }
    }
);
