'use strict'

define({
    Contact: function (name, role, description, callInfo) {

        var _name = name;
        var _description = description;
        var _callInfo = callInfo;
		var _role = role
		
        return {
            name : _name,
			role : _role,
            description : _description,
            callInfo : _callInfo
        };
    }
});
