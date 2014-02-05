'use strict'

define({
    Signaling: function(myAgentDataRef , myClientDataRef) {

        var AgentDataref = myAgentDataRef;
        var ClientDataref = myClientDataRef;
        return {

            postAgentRequest : function(request) {
                AgentDataref.push(request);
            },

            postClientRequest : function(request) {
                ClientDataref.push(request);
            },
        
            acceptRequest : function(request, response) {
            },
        
            on : function(event, handler) {
            }
        };
    }
});
