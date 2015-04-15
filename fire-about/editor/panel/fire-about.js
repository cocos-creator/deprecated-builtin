Polymer({
    version: "",

    created: function () {
        var Remote = require('remote');
        var App = Remote.require('app');

        this.version = App.getVersion();
    },
});
