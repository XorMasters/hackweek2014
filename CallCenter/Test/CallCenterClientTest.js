console.log("Inside Test");

require.config({
    baseUrl: '../xormasters'
});

require(["callcenter/Contact", "callcenter/client/CallcenterClient", ], function (contact, callcenter) {

    var contactObj = new contact.Contact("name", "description", {});
    var client = callcenter.createClient();

    console.log(contactObj);
    console.log(client);
});
