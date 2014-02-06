'use strict'

define(
    function() {

        var masterDestination = "Master";

        var AgentSignaling = function(isMaster) {

            this.agentDataRef = new Firebase("https://xormastersclient.firebaseio.com");
            this.isMaster = isMaster;

            agentDataRef.on("child_added", function (snapshot) {
                var destination = snapshot.child('destination').val();

                if (this.isMaster) {
                    var agentContact = snapshot.child('source').val();
                    emit('agent_request', agentContact);
                } else {
                    var masterContact = snapshot.child('source').val();
                    emit('master_accepted', masterContact);
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
        var ClientSignaling = function() {

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

        return {
            AgentSignaling : AgentSignaling,
            ClientSignaling : ClientSignaling
        }
    }
);
