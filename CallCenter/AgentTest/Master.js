console.log("Inside Master Test");

require.config({
    baseUrl: '../Code'
});

require(["xormasters/callcenter/Contact", "xormasters/callcenter/CallcenterClient", "xormasters/callcenter/signaling/Signaling"], function (contact, callcenter, signaling) {

    var contactObj = new contact.Contact("Master", "Test offer made by master", {});
   
    var client = callcenter.createClient();
    var AgentDataRef = new Firebase("https://xormastersclient.firebaseio.com");
    var ClientDataRef = new Firebase("https://blazing-fire-5145.firebaseio.com");
    var _signaling = new signaling.Signaling(AgentDataRef,ClientDataRef);
    _signaling.postAgentRequest(contactObj);


    console.log(contactObj);
    console.log(client);

});
