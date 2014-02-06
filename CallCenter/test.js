require.config({
    paths: {
        "EventEmitter": "../Lib/EventEmitter",
        "WebRtcAdapter": "../Lib/adapter",
    },
    baseUrl: '../Code'
});

require(
    ["xormasters/callcenter/Contact",
     "xormasters/callcenter/CallcenterClient",
     "xormasters/callcenter/transport/Transport"],
    function (modContact, modCallcenter, modTransport) {

        var contactObj = new modContact.Contact("name", "description", {});
        var client = modCallcenter.createClient();

        var session = new modTransport.Session();

        console.log(contactObj);
        console.log(client);
        console.log(session);

        session.addTransport("MySession");

        //setTimeout(function () {
        //    console.log("Removing transport " + "MySession");
        //    session.removeTransport("MySession");
        //}, 10000);
    }
);
