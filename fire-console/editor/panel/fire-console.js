var Util = require('util');

Polymer({
    options: [
        { name: 'All'  , value: 0 },
        { name: 'Log'  , value: 1 },
        { name: 'Warn' , value: 2 },
        { name: 'Error', value: 3 },
        { name: 'Info' , value: 4 },
    ],

    created: function () {
        this.icon = new Image();
        this.icon.src = "fire://static/img/plugin-console.png";

        this.collapse = true;
        this.option = 0;
        this.filterText = '';
        this.useRegex = false;
        this.logs = [];
        this._curSelected = null;
    },

    ready: function () {
        Editor.sendRequestToCore( 'console:query', function ( results ) {
            for ( var i = 0; i < results.length; ++i ) {
                var item = results[i];
                this.add( item.type, item.message );
            }
        }.bind(this));
    },

    'console:log': function ( message ) {
        this.add( 'log', message );
    },

    'console:success': function ( message ) {
        this.add( 'log', message );
    },

    'console:failed': function ( message ) {
        this.add( 'log', message );
    },

    'console:info': function ( message ) {
        this.add( 'info', message );
    },

    'console:warn': function ( message ) {
        this.add( 'warn', message );
    },

    'console:error': function ( message ) {
        this.add( 'error', message );
    },

    'console:clear': function () {
        this.clear();
    },

    add: function ( type, text ) {
        this.logs.push({
            type: type,
            text: text,
            count: 0,
        });
        this.logs = this.logs.slice();
    },

    clear: function () {
        this.logs = [];
        this.$.detail.clear();
    },

    applyFilter: function ( logs, filterText, option, useRegex ) {
        var filterLogs = [];
        var type;
        switch(option) {
            case 0: type = ""; break;
            case 1: type = "log"; break;
            case 2: type = "warn"; break;
            case 3: type = "error"; break;
            case 4: type = "info"; break;
        }

        var filter;
        if ( useRegex ) {
            try {
                filter = new RegExp(filterText);
            }
            catch ( err ) {
                filter = new RegExp("");
            }
        }
        else {
            filter = filterText.toLowerCase();
        }

        var i = 0;
        var log = null;

        for ( i = 0; i < logs.length; ++i ) {
            log = logs[i];
            log.count = 0;

            if ( type !== "" && log.type !== type ) {
                continue;
            }

            if ( useRegex ) {
                if ( !filter.exec(log.text) ) {
                    continue;
                }
            }
            else {
                if ( log.text.toLowerCase().indexOf(filter) === -1 ) {
                    continue;
                }
            }
            filterLogs.push(log);
        }


        if ( this.collapse && filterLogs.length > 0 ) {
            var collapseLogs = [];
            var lastLog = filterLogs[0];

            collapseLogs.push( lastLog );

            for ( i = 1; i < filterLogs.length; ++i ) {
                log = filterLogs[i];
                if ( lastLog.text === log.text && lastLog.type === log.type ) {
                    lastLog.count += 1;
                }
                else {
                    collapseLogs.push( log );
                    lastLog = log;
                }
            }

            filterLogs = collapseLogs;
        }

        return filterLogs;
    },

    itemClickAction: function (event) {
        event.stopPropagation();

        this.$.detail.type = event.target.type;
        this.$.detail.log = event.target.text;

        if ( this._curSelected !== null  ){
            this._curSelected.selected = false;
        }
        this._curSelected = event.target;
        if ( this._curSelected ) {
            this._curSelected.selected = true;
        }
    },

    clearAction: function (event) {
        this.clear();
    },
});
