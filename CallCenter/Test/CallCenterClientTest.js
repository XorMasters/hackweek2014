console.log("Inside Test");

require.config({
    baseUrl: '../Code'
});

require(["xormasters/callcenter/Contact", "xormasters/callcenter/CallcenterClient", ], function (contact, callcenter) {

    var contactObj = new contact.Contact("name", "description", {});
    var client = callcenter.createClient();

    console.log(contactObj);
    console.log(client);
});
