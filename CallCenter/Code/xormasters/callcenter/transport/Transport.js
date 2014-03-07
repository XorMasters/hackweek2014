'use strict'

define(
    ["EventEmitter",
     "WebRtcAdapter"],
    function (EventEmitter, WebRtcAdapter) {

        // WebRTC Configuration
        var pc_config = webrtcDetectedBrowser === 'firefox' ?
                { 'iceServers': [{ 'url': 'stun:23.21.150.121' }] } : // number IP
                { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] };

        var pc_constraints = {
            'optional': [
              { 'DtlsSrtpKeyAgreement': true },
              { 'RtpDataChannels': true }
            ]
        };

        // Set up audio and video regardless of what devices are present.
        var sdpConstraints = {
            'mandatory': {
                'OfferToReceiveAudio': true,
                'OfferToReceiveVideo': true
            }
        };

        var Session = function () {
            var thi$ = this;
            this.transports = {};

            var room = location.pathname.substring(1);
            if (room === '') {
                room = 'foo';
            }

            //var socket = io.connect();
            var socket = new EventEmitter();

            if (room !== '') {
                //console.log('Create or join room', room);
                //socket.emit('create or join', room);
            }

            socket.on('created', function (room) {
                console.log('Created room ' + room);
                thi$.transport.setInitiator(true);
            });

            socket.on('full', function (room) {
                console.log('Room ' + room + ' is full');
            });

            socket.on('join', function (room) {
                console.log('Another peer made a request to join room ' + room);
                console.log('This peer is the initiator of room ' + room + '!');
                thi$.transport.setChannelReady(true);
            });

            socket.on('joined', function (room) {
                console.log('This peer has joined room ' + room);
                thi$.transport.setChannelReady(true);
            });

            socket.on('log', function (array) {
                console.log.apply(console, array);
            });

            socket.on('message', function (message) {
                console.log('Received message:', message);
                thi$.emit('message', message);
            });

            this.socket = socket;
        };

        var Transport = function(name, session) {
            this.name = name;
            this.session = session;
            this.isInitiator = false;
            this.isChannelReady = false;
            this.isStarted = false;
            this.sendChannel = null;
            this.localCallInfo = {
                iceCandidates: new Array(),
                sessionDescription: null,
                hasAllCandidates : false
            };
            this.remoteCallInfo = null;
            this.inConnection = false;
            this.receiveBuffer = "";
            this.sendBuffer = new Array();
            this.dataSent = 0;
            this.chunkSize = 1000;
            this.intervalID = 0;
            var thi$ = this;
            
      
            this.registerListeners();

            this.pc = new RTCPeerConnection(pc_config, pc_constraints);
      
            this.session.on( 'message', function(message) {
                if (message === 'got user media') {
                    thi$.maybeStart();
                } else if (message.type === 'offer') {
                    if (!thi$.isInitiator && !thi$.isStarted) {
                        thi$.maybeStart();
                    }
                    thi$.pc.setRemoteDescription(new RTCSessionDescription(message));
                    thi$.doAnswer();
                } else if (message.type === 'answer' && thi$.isStarted) {
                    thi$.pc.setRemoteDescription(new RTCSessionDescription(message));
                } else if (message.type === 'candidate' && thi$.isStarted) {
                    var candidate = new RTCIceCandidate({sdpMLineIndex:message.label,
                        candidate:message.candidate});
                    thi$.pc.addIceCandidate(candidate);
                } else if (message === 'bye' && this.isStarted) {
                    thi$.handleRemoteHangup();
                }
            });
        };

        Session.prototype = {
            addTransport: function (name, constraints) {
                console.log( "Adding transport named: " + name );
                var transport = new Transport(name, this)
                this.transports[name] = transport;
                transport.start(constraints);
            },

            addTransportWithRemote: function (name, remoteCallInfo, constraints) {
                console.log( "Adding transport named: " + name );
                var transport = new Transport(name, this)
                this.transports[name] = transport;
                transport.accept(remoteCallInfo, constraints);
            },

            removeTransport: function (name) {
                var transport = this.transports[name];
                transport.stop();
                this.transports[name] = undefined;
            },

            setRemoteCallInfo: function (name, callInfo) {
                console.log('Setting remote call info for transport \'' + name + '\'');
                this.transports[name].setRemoteCallInfo(callInfo);
            },

            sendData: function (data, name) {
                this.transports[name].sendData(data);
            },

            close : function(name) {
				if(this.transports[name] != undefined) {
                	this.transports[name].stop();
                	this.transports[name] = undefined;
				}
            }
        }

        Transport.prototype = {
            start: function (constraints) {
                console.log('Transport ' + this.name + ' starting call');
                this.sendMessage('got user media');
                this.setChannelReady(true);
                this.setInitiator(true);
                if(constraints == null || !(constraints.audio || constraints.video)) {
                  this.maybeStart();
                } else {
                  getUserMedia(constraints, this.handleUserMedia, this.handleUserMediaError);
                }
            },

            accept: function (remoteCallInfo, constraints) {
                var thi$ = this;
                console.log('Transport ' + this.name + ' accepting call');
                this.setChannelReady(true);
                this.setInitiator(false);
                if (constraints == null || !(constraints.audio || constraints.video)) {
                  this.setRemoteCallInfo(remoteCallInfo);
                  this.maybeStart();
                } else {
                    getUserMedia(
                        constraints,
                        function (stream) {
                            thi$.setRemoteCallInfo(remoteCallInfo);
                            thi$.handleUserMedia(stream);
                        },
                        this.handleUserMediaError);
                }
            },

            stop: function () {
                this.isStarted = false;
                this.pc.close();
                this.pc = null;
            },

            setStarted: function (started) {
                this.isStarted = started;
            },

            setInitiator: function (initiator) {
                this.isInitiator = initiator;
            },

            setChannelReady: function (ready) {
                this.isChannelReady = ready;
            },
       
            addLocalCandidate: function (candidate) {
                console.log('Adding local candidate to transport ' + this.name);
                this.localCallInfo.iceCandidates.push(candidate);
                console.log('Transport ' + this.name + ' now has ' + this.localCallInfo.iceCandidates.length + ' local candidates');
                this.checkAndConnect();
            },

            finalizeLocalCandidates: function () {
                console.log('All local candidates for transport ' + this.name + ' have been added');
                this.localCallInfo.hasAllCandidates = true;

                this.checkAndEmitLocalCallInfo();
                this.checkAndConnect();
            },

            setLocalDescription: function (sessionDescription) {
                console.log('Storing local session description for transport ' + this.name);
                this.localCallInfo.sessionDescription = sessionDescription;

                this.checkAndEmitLocalCallInfo();
                this.checkAndConnect();
            },

            setRemoteCallInfo: function (callInfo) {
                console.log('Adding remote call info to transport ' + this.name);
                this.remoteCallInfo = {
                    iceCandidates: new Array().concat(callInfo.iceCandidates),
                    sessionDescription: callInfo.sessionDescription
                };
                if (!this.isInitiator) {
                    this.pc.setRemoteDescription(
                            new RTCSessionDescription(this.remoteCallInfo.sessionDescription));
                }
                console.log('Transport ' + this.name + ' now has ' + this.remoteCallInfo.iceCandidates.length + ' remote candidates');
                this.checkAndConnect();
            },

            checkAndEmitLocalCallInfo: function() {
                if (this.localCallInfo.sessionDescription != null
                        && this.localCallInfo.hasAllCandidates) {
                    this.session.emit(
                            'localCallInfoAvailable',
                            {
                                iceCandidates: new Array().concat(this.localCallInfo.iceCandidates),
                                sessionDescription: this.localCallInfo.sessionDescription
                            });
                }
            },

            checkAndConnect: function () {

                //console.log(
                //        'checkAndConnect ',
                //        'this.inConnection', this.inConnection , ' ',
                //        'this.localCallInfo.sessionDescription != null=', this.localCallInfo.sessionDescription != null , ' ',
                //        'this.localCallInfo.hasAllCandidates=', this.localCallInfo.hasAllCandidates , ' ',
                //        'this.localCallInfo.hasAllCandidates=', this.remoteCallInfo != null);

                if (!this.inConnection && this.localCallInfo.sessionDescription != null
                        && this.localCallInfo.hasAllCandidates
                        && this.remoteCallInfo != null) {

                    this.inConnection = true;

                    if (this.isInitiator) {
                        this.pc.setRemoteDescription(
                                new RTCSessionDescription(this.remoteCallInfo.sessionDescription));
                    }

                    for (var index = 0; index < this.remoteCallInfo.iceCandidates.length; ++index) {
                        var candidate = new RTCIceCandidate({
                            sdpMLineIndex: this.remoteCallInfo.iceCandidates[index].label,
                            candidate: this.remoteCallInfo.iceCandidates[index].candidate
                        });
                        this.pc.addIceCandidate(candidate);
                    }
                }
            }
        }

        Session.prototype.sendMessage = function (message) {
            //console.log('Sending message: ', message);
            //this.socket.emit('message', message);
        }

        Transport.prototype.sendMessage = function (message) {
            //console.log('Sending message: ', message);
            //this.session.socket.emit('message', message);
        }

        ////////////////////////////////////////////////////

        Transport.prototype.maybeStart = function () {
            console.log("Transport.prototype.maybeStart: this.isStarted=" + this.isStarted + " this.isChannelReady= " + this.isChannelReady);
            if (!this.isStarted && this.isChannelReady) {
                this.createPeerConnection();
                this.isStarted = true;
                if (this.isInitiator) {
                    this.doCall();
                } else {
                    this.doAnswer();
                }
            }
        }

        /////////////////////////////////////////////////////////

        Transport.prototype.createPeerConnection = function () {
            try {
                this.pc.onicecandidate = this.handleIceCandidate;
                console.log('Created RTCPeerConnnection with:\n' +
                  '  config: \'' + JSON.stringify(pc_config) + '\';\n' +
                  '  constraints: \'' + JSON.stringify(pc_constraints) + '\'.');
            } catch (e) {
                console.log('Failed to create PeerConnection, exception: ' + e.message);
                alert('Cannot create RTCPeerConnection object.');
                return;
            }

            this.pc.onaddstream = this.handleRemoteStreamAdded;
            this.pc.onremovestream = this.handleRemoteStreamRemoved;
  
            if (this.isInitiator) {
                try {
                    // Reliable Data Channels not yet supported in Chrome
                    this.sendChannel = this.pc.createDataChannel("sendDataChannel",
                      { reliable: true });
                    this.sendChannel.onmessage = this.handleMessage;
                    trace('Created send data channel');
                } catch (e) {
                    alert('Failed to create data channel. ' +
                          'You need Chrome M25 or later with RtpDataChannel enabled');
                    trace('createDataChannel() failed with exception: ' + e.message);
                }
                this.sendChannel.onopen = this.handleSendChannelStateChange;
                this.sendChannel.onclose = this.handleSendChannelStateChange;
            } else {
                this.pc.ondatachannel = this.gotReceiveChannel;
            }
        }

        Transport.prototype.sendData = function (data) {

            this.sendBuffer.push(data);
            if (this.intervalID != 0) {
                return;
            }

            var thi$ = this;
            
            this.intervalID = setInterval(function () {
              for(var sending = true; sending; ) {
                var slideEndIndex = thi$.dataSent + thi$.chunkSize;
                var isEnd = false;
                if( thi$.sendBuffer.length <= 0 ) {
                  break;
                }
                
                if (slideEndIndex > thi$.sendBuffer[0].length) {
                    slideEndIndex = thi$.sendBuffer[0].length;
                    isEnd = true;
                }
                var chunk = {
                    data: thi$.sendBuffer[0].slice(thi$.dataSent, slideEndIndex),
                    final: isEnd
                }
                
                var chunkStr = JSON.stringify(chunk);
                trace("Sending chunk of size: " + chunkStr.length);
                
                try {
                  thi$.sendChannel.send(chunkStr);
                } catch(e) {
                  console.error(e);
                  sending = false;
                  continue;
                }
                
                if (isEnd) {
                    thi$.dataSent = 0;
                    thi$.sendBuffer.shift();
                } else {
                    thi$.dataSent = slideEndIndex;
                }
                if (thi$.sendBuffer.length == 0) {
                    clearInterval(thi$.intervalID);
                    thi$.intervalID = 0;
                }
              }
            }, 1000);
        }

        Transport.prototype.registerListeners = function () {
            var thi$ = this;
            this.gotReceiveChannel = function (event) {
                trace('Receive Channel Callback');
                thi$.sendChannel = event.channel;
                thi$.sendChannel.onmessage = thi$.handleMessage;
                thi$.sendChannel.onopen = thi$.handleReceiveChannelStateChange;
                thi$.sendChannel.onclose = thi$.handleReceiveChannelStateChange;
            }

            this.handleMessage = function (event) {
                var chunk = JSON.parse(event.data);

                if (chunk.final) {
                    thi$.session.emit('data', thi$.receiveBuffer.concat(chunk.data), thi$);
                    thi$.receiveBuffer = "";
                } else {
                    thi$.receiveBuffer = thi$.receiveBuffer.concat(chunk.data);
                }

                //thi$.emit('data', event.data);
            }

            this.handleSendChannelStateChange = function () {
                var readyState = thi$.sendChannel.readyState;
                trace('Send channel state is: ' + readyState);
                thi$.session.emit(readyState == "open" ? 'connected' : 'disconnected');
                console.log(thi$.pc);
            }

            this.handleReceiveChannelStateChange = function () {
                var readyState = thi$.sendChannel.readyState;
                trace('Receive channel state is: ' + readyState);
                thi$.session.emit(readyState == "open" ? 'connected' : 'disconnected');
                console.log(thi$.pc);
            }

            this.handleIceCandidate = function (event) {
                console.log('handleIceCandidate event: ', event);
                if (event.candidate) {
                    var candidate = {
                        type: 'candidate',
                        label: event.candidate.sdpMLineIndex,
                        id: event.candidate.sdpMid,
                        candidate: event.candidate.candidate
                    };
                    thi$.sendMessage(candidate);
                    thi$.addLocalCandidate(candidate);
                } else {
                    thi$.finalizeLocalCandidates();
                }
            }

            this.handleRemoteHangup = function () {
                console.log('Session terminated.');
                thi$.stop();
                thi$.isInitiator = false;
                thi$.inConnection = false;
            }

            this.setLocalAndSendMessage = function (sessionDescription) {
                console.log('Set Local send message \n');
                thi$.pc.setLocalDescription(sessionDescription);
                thi$.setLocalDescription(sessionDescription);
                thi$.sendMessage(sessionDescription);
            }
       
            this.handleUserMedia = function(stream) {
              console.log( "Local stream added");
              thi$.localStream = stream;
              thi$.pc.addStream(stream);

              console.log('Transport: handleUserMedia emits local stream added');
              thi$.session.emit('localStreamAdded', stream);
              thi$.maybeStart();
            }
            
            this.handleUserMediaError = function(error) {
              console.error( "getUserMedia error: ", error );
			  thi$.session.emit('localStreamError', error);
            }
            
            this.handleRemoteStreamAdded = function(event) {
              console.log("Remote stream added");
              thi$.remoteStream = event.stream
              thi$.session.emit('remoteStreamAdded', event.stream);

              //if (thi$.localStream != undefined) {
              //    console.log('Transport: handleRemoteStreamAdded emits local stream added');
              //    thi$.emit('localStreamAdded', thi$.localStream);
              //}
            }
            
            this.handleRemoteStreamRemoved = function(event) {
              console.log( "Remote stream removed" );
              thi$.remoteStream = undefined;
              thi$.session.emit('remoteStreamRemoved');
            }
        }

        Transport.prototype.doCall = function () {
            var constraints = { 'optional': [], 'mandatory': { 'MozDontOfferDataChannel': true } };
            // temporary measure to remove Moz* constraints in Chrome
            if (webrtcDetectedBrowser === 'chrome') {
                for (var prop in constraints.mandatory) {
                    if (prop.indexOf('Moz') !== -1) {
                        delete constraints.mandatory[prop];
                    }
                }
            }
            constraints = mergeConstraints(constraints, sdpConstraints);
            console.log('Sending offer to peer, with constraints: \n' +
              '  \'' + JSON.stringify(constraints) + '\'.');
            this.pc.createOffer(this.setLocalAndSendMessage, null, constraints);
        }

        Transport.prototype.doAnswer = function () {
            //console.log('Sending answer to peer.');
            this.pc.createAnswer(this.setLocalAndSendMessage, null, sdpConstraints);
        }

        function mergeConstraints(cons1, cons2) {
            var merged = cons1;
            for (var name in cons2.mandatory) {
                merged.mandatory[name] = cons2.mandatory[name];
            }
            merged.optional.concat(cons2.optional);
            return merged;
        }

        Transport.prototype.hangup = function () {
            console.log('Hanging up.');
            this.stop();
            this.sendMessage('bye');
        }

        Session.prototype.__proto__ = EventEmitter.prototype;
        Transport.prototype.__proto__ = EventEmitter.prototype;

        return {
            Session : Session,
            Transport : Transport
        };
    }
);
