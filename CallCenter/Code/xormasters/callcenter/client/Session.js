'use strict'

define(["transport/Transport"], function (transportModule) {

    return function Session(transport) {

        var _pause = function () {
        }

        var _play = function () {
        }

        var _hangup = function () {
        }

        var _on = function (event, handler) {
        }

        return {
            pause: _pause,
            play: _play,
            hangup: _hangup,
            on: _on
        };
    };
});
