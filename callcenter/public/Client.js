require.config({
    paths: {
        "EventEmitter": "../Lib/EventEmitter",
        "WebRtcAdapter": "../Lib/adapter",
    },
    baseUrl: './Code'
});


//var Client = undefined;
//var supportClient = undefined;

define(
    ["xormasters/callcenter/signaling/ClientNegotiator",
     "EventEmitter"],

    function (modNegotiator, EventEmitter) {

        var Client = function (supportContent, callCenterName) {
            // TODO: get unique agent name for each agent
            this.clientName = "Client";
			this.callCenterName = callCenterName
            this.supportSession = undefined;
            this.negotiator = modNegotiator.createClientNegotiator(supportContent, this.clientName, this.callCenterName);
            var thi$ = this;

			this.negotiator.on('localStreamError', function(error){
				thi$.emit('localStreamError', error);
			});
			
            this.negotiator.on('connected', function (session) {
                thi$.supportSession = session;
                session.on('remoteStreamAdded', function (stream) {
                    thi$.emit('remoteStreamAdded', stream);
                });
                session.on('remoteStreamRemoved', function (stream) {
                    thi$.emit('remoteStreamRemoved', stream);
                });
                console.log('Support session connected')

                for( var name in session.transports ) {
                  if (session.transports[name].remoteStream != undefined) {
                    thi$.emit('remoteStreamAdded', session.transports[name].remoteStream);
                  }
                }
                //TODO
                //session.on('remoteMediaStreamAdded');
            });
			
			this.negotiator.on('disconnected', function(session){
				console.log('Disconnected from support session');
				thi$.emit('disconnected', session);
			})
        };

        Client.prototype = {

            requestSupport: function () {
                this.negotiator.connect();
            },
        
            hangup : function () {
                if (this.supportSession != undefined) {
                    this.supportSession.close('support');
                    this.supportSession = undefined;
                    this.negotiator = undefined;
                }
            }
        };

        Client.prototype.__proto__ = EventEmitter.prototype;

        var createClient = function (supportContent, callCenterName) {
            return new Client(supportContent, callCenterName);
        }

        //Client = _Client;
        return {
            createClient: createClient
        };
    }
);
