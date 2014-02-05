'use strict'

define({
    Signaling: function(myAgentDataRef , myClientDataRef) {

        var AgentDataref = myAgentDataRef;
        var ClientDataref = myClientDataRef;
        return {

            postRequest : function(request) {
                AgentDataref.push(request);
            },

            postClientRequest : function(request, client) {
            },
        
            acceptRequest : function(request, response) {
            },
        
            on : function(event, handler) {
            }
        };
    }
});
