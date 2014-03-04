'use strict'

define(
    ["EventEmitter"],
    function(EventEmitter) {

        var masterDestination = "Master";

//==================================================================================================
// Agent <-> Master Signaling
        var AgentSignaling = function (isMaster, localDestination) {

            //Sagar's Firebase
            this.agentDataRef = new Firebase("https://blazing-fire-5145.firebaseio.com");
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
                        snapshot.ref().remove();
                    }
                } else {
                    var masterContact = snapshot.child('source').val();
                    console.log('Received child_added for destination: ', destination, ' source ', masterContact);
                    if ((destination === localDestination)
                            && (masterContact.name.indexOf('Master') == 0)) {
                        thi$.emit('master_accepted', masterContact);
                        snapshot.ref().remove();
                    }
                    // TODO: How about multiple agents at the same time?
                }

            });
        };

        AgentSignaling.prototype = {

            postAgentRequest: function (agentContact) {
                console.log('Signaling: postAgentRequest =>', agentContact);
                var request = {
                    source: agentContact,
                    destination: masterDestination,
                    timestamp : new Date().getTime()
                }

                this.agentDataRef.push(request);
            },

            acceptAgentRequest: function (agentContact, masterContact) {
                console.log('Signaling: acceptAgentRequest =>', agentContact);
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
        var ClientSignaling = function (mode, localDestination) {

            this.mode = mode;
            this.localDestination = localDestination;
            this.clientDataRef = new Firebase("https://xormastersclient.firebaseio.com");

            var thi$ = this;

            this.clientDataRef.on("child_added", function (snapshot) {
                var destination = snapshot.child('destination').val();

                if (thi$.mode === 'master') {
                    var clientContact = snapshot.child('source').val();
                    console.log('ClientSignaling: Received child_added for destination: ', destination, ' source ', clientContact);
                    if ((destination === localDestination)
                            && (clientContact.name.indexOf('Client') == 0)) {

                        var supportRequest = {
                            status : 'waiting',
                            source: clientContact,
                            content: snapshot.child('content').val(),
                            timestamp: snapshot.child('timestamp').val(),
                        };

                        thi$.emit('support_request', supportRequest);
                        snapshot.ref().remove();
                    }
                } else if (mode === 'client') {
                    var agentContact = snapshot.child('source').val();
                    var destination = snapshot.child('destination').val();
                    console.log('ClientSignaling: Received child_added for destination: ', destination, ' source ', agentContact);
                    if ((destination === localDestination)
                            && (agentContact.name.indexOf('Agent') == 0)) {

                        var supportRequest = {
                            source: agentContact,
                            destination: destination,
                            content: snapshot.child('content').val(),
                            timestamp: snapshot.child('timestamp').val(),
                        };

                        thi$.emit('request_accepted', supportRequest);
                        snapshot.ref().remove();
                    }
                    // TODO: How about multiple agents at the same time?
                    // snapshot.remove();
                }
            });
        };

        ClientSignaling.prototype = {
            postClientRequest : function(clientSupportRequest) {

                console.log('Signaling: postClientRequest' + clientSupportRequest);
                var request = {
                    source: clientSupportRequest.contact,
                    content : clientSupportRequest.content,
                    destination: masterDestination,
                    timestamp: new Date().getTime()
                }

                this.clientDataRef.push(request);
            },
        
            acceptClientRequest: function (clientSupportRequest, agentContact) {

                console.log('Signaling: acceptAgentRequest' + agentContact);
                var request = {
                    source: agentContact,
                    content: clientSupportRequest.content,
                    destination: clientSupportRequest.source.name,
                    timestamp: new Date().getTime()
                }

                this.clientDataRef.push(request);
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

        function createClientSignalingForMaster() {
            return new ClientSignaling('master', masterDestination);
        }

        function createClientSignalingForAgent(agentName) {
            return new ClientSignaling('agent', agentName);
        }

        function createClientSignalingForClient(clientName) {
            return new ClientSignaling('client', clientName);
        }

//==================================================================================================
// Exports
        return {
            createSignalingForAgent: createSignalingForAgent,
            createSignalingForMaster: createSignalingForMaster,
            createClientSignalingForMaster: createClientSignalingForMaster,
            createClientSignalingForAgent: createClientSignalingForAgent,
            createClientSignalingForClient: createClientSignalingForClient
        }
    }
);
