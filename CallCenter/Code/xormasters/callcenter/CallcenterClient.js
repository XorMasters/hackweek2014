'use strict'

define(["xormasters/callcenter/signaling/Signaling", "xormasters/callcenter/transport/Transport"], function (signaling, transport) {
    
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
