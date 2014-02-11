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

        var Client = function (supportContent) {
            // TODO: get unique agent name for each agent
            this.clientName = "Client";
            this.supportSession = undefined;
            this.negotiator = modNegotiator.createClientNegotiator(supportContent, this.clientName);
            var thi$ = this;

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
        };

        Client.prototype = {

            requestSupport: function () {
                this.negotiator.connect();
            },
        
            hangup : function () {
                if (this.supportSession != undefined) {
                    this.supportSession.close();
                    this.supportSession = undefined;
                    this.negotiator = undefined;
                }
            }
        };

        Client.prototype.__proto__ = EventEmitter.prototype;

        var createClient = function (supportContent) {
            return new Client(supportContent);
        }

        //Client = _Client;
        return {
            createClient: createClient
        };
    }
);

//window.onbeforeunload = function (e) {
//    if (supportClient != undefined) {
//        supportClient.hangup();
//        supportClient = undefined;
//    }
//};

//function requestSupport(supportContent) {
//    if (supportClient != undefined) {
//        console.log('Support session already in progress.');
//        return;
//    }

//    supportClient = new Client(supportContent);

//    supportClient.on('remoteStreamAdded', function (stream) {
//        var videoElement = document.getElementById("videoDiv");
//        videoElement.removeChild(videoElement.childNodes[0]);

//        var video = document.createElement('video');
//        video.setAttribute('autoplay');
//        video.setAttribute('muted');
//        video.src = URL.createObjectURL(stream);
//        videoElement.appendChild(video);
//    });

//    supportClient.on('remoteStreamRemoved', function (stream) {

//        var videoElement = document.getElementById("videoDiv");
//        videoElement.removeChild(videoElement.childNodes[0]);

//        var image = document.createElement('img');
//        image.setAttribute('class', 'silhouette');
//        image.setAttribute('id', 'image');
//        image.setAttribute('src', 'Images/support.jpg');
//        videoElement.appendChild(image);
//    });

//    supportClient.requestSupport();
//}

//function onSupportRequestedAction() {
//    var clientName = document.getElementById("name").value;
//    var description = document.getElementById("desc").value;

//    var supportContent = {
//        name: clientName,
//        summary: description
//    };

//    requestSupport(supportContent);
//}

//var requestButton = document.getElementById("start");
//requestButton.onclick = onSupportRequestedAction;
