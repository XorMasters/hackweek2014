'use strict'

define(
    ["xormasters/callcenter/Contact",
     "xormasters/callcenter/transport/Transport",
     "xormasters/callcenter/signaling/Signaling",
     "EventEmitter"],
    function (modContact, modTransport, modSignaling, EventEmitter) {

        var ClientNegotiator = function (supportContent, clientName, callCenterName) {

            this.supportContent = supportContent;
            this.clientName = clientName;
			console.log("call center name: " + callCenterName);
            this.signaling = new modSignaling.createClientSignalingForClient(clientName, callCenterName);
        };

         ClientNegotiator.prototype = {

             // Negotiate a support session from client to master:
             //    - Start transport session
             //    - wait for WebRTC local call info to become available
             //    - send the support request along with the local call info through signaling
             //    - wait for support request to be accepted by an agent
            connect: function () {

                var thi$ = this;

                var supportSession = new modTransport.Session();

                supportSession.on('localCallInfoAvailable', function (localCallInfo) {
                    console.log('Received WebRTC local call info for support session. Posting support request...');
                    var clientContact =
                            new modContact.Contact(thi$.clientName, 'Client', "Support client " + thi$.clientName, localCallInfo);
                    var supportRequest = {
                        contact : clientContact,
                        content : thi$.supportContent
                    };
                    thi$.signaling.postClientRequest(supportRequest);
                });

                supportSession.on('connected', function () {
                    console.log('Agent connected to support session');
                    thi$.emit('connected', supportSession);
                });
				
                supportSession.on('disconnected', function () {
                    console.log('Agent disconnected to support session');
                    thi$.emit('disconnected', supportSession);
                });				

				supportSession.on('localStreamError', function(error) {
					thi$.emit('localStreamError', error);
				});
				
                supportSession.addTransport("support", {video:true, audio:true});

                this.signaling.on('request_accepted', function (supportRequest) {
                    console.log("Accepted support request " + supportRequest);
                    supportSession.setRemoteCallInfo("support", supportRequest.source.callInfo);
                });
            }
        };

        ClientNegotiator.prototype.__proto__ = EventEmitter.prototype;

        //==================================================================================================
        // Factories
        function createClientNegotiator(supportContent, clientName, callCenterName) {
            return new ClientNegotiator(supportContent, clientName, callCenterName);
        }

        //==================================================================================================
        // Exports
        return {
            createClientNegotiator: createClientNegotiator,
        }
    }
);
