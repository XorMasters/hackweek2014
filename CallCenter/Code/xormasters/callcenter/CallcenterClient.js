'use strict'

define(
    ["xormasters/callcenter/signaling/CallQueue",
     "xormasters/callcenter/transport/Transport"],
        
    function (signalling, transport) {
define(["xormasters/callcenter/signaling/Signaling", "xormasters/callcenter/transport/Transport"], function (signaling, transport) {
define(
    ["xormasters/callcenter/signaling/Signaling",
     "xormasters/callcenter/transport/Transport",
     "EventEmitter"],
        
    function (signaling, transport, EventEmitter) {
    
    return {
        createClient: function () {
            var _postRequest = function (name, description) {
            };

            var _postClientRequest = function (clientId, name, description) {
            };

            var _acceptRequest = function (contact) {
            };

            var _on = function (event, handler) {
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
