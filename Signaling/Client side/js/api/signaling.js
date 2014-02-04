var xorMasters = {
	
	signaling : {

	var contactRequest = {
		name : "",
		description : "",
		timestamp : "",
		callinfo : {
			offer : "" ,
			candidates ""
		}
	}

	 var myAgentDataRef = new Firebase("https://xormastersclient.firebaseio.com");
	 var myClentDataRef = new Firebase("https://blazing-fire-5145.firebaseio.com");

	function postRequest ( request ) {
		myAgentDataRef.push(request);
	}

	function postClientRequest (request) {
		myClentDataRef.push(request);
	}



	}
}