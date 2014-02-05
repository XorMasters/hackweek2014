var xormasters.signaling = {


	Signaling : function() {


	 var myAgentDataRef = new Firebase("https://xormastersclient.firebaseio.com");
	 var myClentDataRef = new Firebase("https://blazing-fire-5145.firebaseio.com");

	this.postRequest : function( request ) {
		myAgentDataRef.push(request);
	}

	this.postClientRequest : function(request) {
		myClentDataRef.push(request);
	}

	this.acceptRequest : function(request , response) {

	}

	this.on : function(event , request) {

	}

	}

}