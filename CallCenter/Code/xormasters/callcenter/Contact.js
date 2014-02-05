'use strict'

define({
    Contact: function (name, description, callInfo) {

        var _name = name;
        var _description = description;
        var _callInfo = callInfo;

        return {
            name : _name,
            description : _description,
            callInfo : _callInfo
        };
    }
});
