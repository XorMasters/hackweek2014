console.log("Inside Test");

require.config({
    baseUrl: '../Code'
});

require(["xormasters/callcenter/Contact", "xormasters/callcenter/CallcenterClient", "xormasters/callcenter/signaling/Signaling"], function (contact, callcenter, signaling) {

    var contactObj = new contact.Contact("name", "description", {});
   
    var client = callcenter.createClient();
    var AgentDataRef = new Firebase("https://xormastersclient.firebaseio.com");
    var ClientDataRef = new Firebase("https://blazing-fire-5145.firebaseio.com");
    var _signaling = new signaling.Signaling(AgentDataRef,ClientDataRef);
    _signaling.postRequest(contactObj);


    console.log(contactObj);
    console.log(client);

    AgentDataRef.on("child_added", function(snapshot) {
                var data = snapshot.name();
                console.log("child_added AgentDataRef" + data);
            });

    AgentDataRef.on("value", function(snapshot) {
                var data = snapshot.name();
                console.log("value AgentDataRef" + data);
            });	

    ClientDataRef.on("child_added", function(snapshot) {
                var data = snapshot.name();
                console.log("child_added ClientDataRef" + data);
            });
});
