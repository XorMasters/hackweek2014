console.log("Inside Test");

require.config({
    baseUrl: '../Code'
});

require(["xormasters/callcenter/Contact", "xormasters/callcenter/CallcenterClient", "xormasters/callcenter/signaling/Signaling"], function (contact, callcenter, signaling) {

    var contactObj = new contact.Contact("name", "description", {});
   
    var client = callcenter.createClient();
    var AgentDataRef = new Firebase("https://xormastersclient.firebaseio.com");
    var ClentDataRef = new Firebase("https://blazing-fire-5145.firebaseio.com");
    var _signaling = new signaling.Signaling(AgentDataRef,ClentDataRef);
    _signaling.postRequest(contactObj);


    console.log(contactObj);
    console.log(client);
});
