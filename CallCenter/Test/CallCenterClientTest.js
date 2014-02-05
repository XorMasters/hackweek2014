console.log("Inside Test");

require.config({
    paths: {
        "EventEmitter": "../Lib/EventEmitter",
        "WebRtcAdapter": "../Lib/adapter",
    },
    baseUrl: '../Code'
});

require(
    ["xormasters/callcenter/Contact",
     "xormasters/callcenter/CallcenterClient"],
    function (contact, callcenter, transport) {

        var contactObj = new contact.Contact("name", "description", {});
        var client = callcenter.createClient();

        console.log(contactObj);
        console.log(client);
        console.log(session);
    }
);
