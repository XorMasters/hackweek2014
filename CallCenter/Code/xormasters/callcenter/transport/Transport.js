'use strict'

define({
    Transport: function() {

        return {
            pause : function() {
            },
        
            play : function() {
            },

            hangup : function() {
            },
        
            localStream : function() {
            },
        
            localAddress : function() {
            },
        
            on : function(event, handler) {
                // on local/remote stream added/removed
            }
        }
    }
});
