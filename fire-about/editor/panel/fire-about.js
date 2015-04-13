var Remote = require('remote');
var App = Remote.require('app');

Polymer({
    version: "",

    created: function () {
        this.version = App.getVersion();
    },
});
