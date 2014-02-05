'use strict'

define(
    ["xormasters/callcenter/signaling/CallQueue",
     "xormasters/callcenter/transport/Transport"],
        
    function (signalling, transport) {
    
        return {
            createClient: function () {
                var _callQueue = new signalling.CallQueue();
                var _eventEmitter = new EventEmitter();

                var _postRequest = function (name, description, sessionHandler, errorHandler) {

                    var transportSession = transport.createSession();

                    transportSession.on('localCallInfoAvailable', function (localCallInfo) {
                        var contact = {
                            name: name,
                            description: description,
                            callInfo: localCallInfo
                        };
                        _callQueue.postRequest(
                                contact,
                                function (req, resp) {
                                    // Request has been accepted by remote party

                                    transportSession.on('connected', function () {
                                        var epSession = new EndpointSession(transportSession, req, resp);
                                        sessionHandler(name, epSession);
                                    });
                                    
                                    transportSession.setRemoteCallInfo(resp.callInfo);
                                },
                                function (req, error) {
                                    // An error during request processing
                                    errorHandler(req, error);
                                });
                    });
                    transportSession.addTransport(name);
                };

                var _postClientRequest = function (clientId, name, description) {
                };

                var _acceptRequest = function (request, sessionHandler, errorHandler) {
                    var transportSession = transport.createSession();
                    transportSession.setRemoteCallInfo(request.callInfo);
                    transportSession.on('localCallInfoAvailable', function (localCallInfo) {
                        var response = {
                            name: request.name,
                            description: request.description,
                            callInfo: localCallInfo
                        };
                        _callQueue.acceptRequest(request, response);
                    });

                    transportSession.on('connected', function() {
                        var epSession = new EndpointSession(transportSession, req, resp);
                        sessionHandler(name, epSession);
                    });

                    // How to distinguish between creating an offer and creating an answer?
                    transportSession.addTransport(request.name, request.callInfo);
                };

                var _on = function (event, handler) {
                    _eventEmitter.on(event, handler);
                }

                return {
                    postRequest: _postRequest,
                    postClientRequest: _postClientRequest,
                    acceptRequest: _acceptRequest,
                    on: _on,
                }
            }
    };
});
