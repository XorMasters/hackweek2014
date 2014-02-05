console.log("Inside Agent Test");

require.config({
    baseUrl: '../Code'
});

require(["xormasters/callcenter/Contact", "xormasters/callcenter/CallcenterClient", "xormasters/callcenter/signaling/Signaling"], function (contact, callcenter, signaling) {

    var contactObj = new contact.Contact("Agent", "Test answer made by Agent", {});
   
    var client = callcenter.createClient();
    var AgentDataRef = new Firebase("https://xormastersclient.firebaseio.com");
    var ClientDataRef = new Firebase("https://blazing-fire-5145.firebaseio.com");
    var _signaling = new signaling.Signaling(AgentDataRef,ClientDataRef);


    console.log(contactObj);
    console.log(client);

    AgentDataRef.on("value", function(snapshot) {
                var data = snapshot.val();
                if(data.name = "Master") {
                    AgentDataRef.remove();
                    _signaling.postAgentRequest(contactObj);
                    console.log("Value AgentDataRef " + data.name);
                    AgentDataRef.off();
                }
                
            }); 

});
