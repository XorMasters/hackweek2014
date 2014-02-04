var xormasters.signaling = {


	Signaling : function() {


	 var myAgentDataRef = new Firebase("https://xormastersclient.firebaseio.com");
	 var myClentDataRef = new Firebase("https://blazing-fire-5145.firebaseio.com");

	postRequest : function( request ) {
		myAgentDataRef.push(request);
	}

	postClientRequest : function(request) {
		myClentDataRef.push(request);
	}

	acceptRequest : function(request , response) {

	}

	on : function(event , request) {

	}

	}

}