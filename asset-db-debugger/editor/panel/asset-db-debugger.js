Polymer({

    created: function () {
        this.infoList = [];
        this._option = -1;
        this.searchValue = "";
        this.keyName = "";
        this.valueName = "";
        this.watchON = false;
    },

    domReady: function () {
        this.$.btnGroup.select(0);
    },

    filter: function ( infoList, searchValue ) {
        var text = searchValue.toLowerCase();
        var filterList = [];

        for ( var i = 0; i < this.infoList.length; ++i ) {
            var info = this.infoList[i];
            if ( info.key.toLowerCase().indexOf(text) !== -1 ) {
                filterList.push(info);
                continue;
            }

            if ( info.value.toLowerCase().indexOf(text) !== -1 ) {
                filterList.push(info);
                continue;
            }
        }
        return filterList;
    },

    ipcUuidAssetResults: function ( event ) {
        var results = event.detail.results;

        this.infoList = [];
        for ( var i = 0; i < results.length; ++i ) {
            var info = results[i];
            this.infoList.push( { key: info.uuid, value: info.name + " [" + info.type + "]" } );
        }
    },

    urlUuidAction: function ( event ) {
        this._option = 'url-uuid';
        this.keyName = "URL";
        this.valueName = "UUID";
        this.infoList = [];
        Editor.sendRequestToCore('asset-db-debugger:query-url-uuid', function ( results ) {
            this.infoList = [];
            for ( var i = 0; i < results.length; ++i ) {
                var info = results[i];
                this.infoList.push( { key: info.url, value: info.uuid } );
            }
        }.bind(this));
    },

    uuidUrlAction: function ( event ) {
        this._option = 'uuid-url';
        this.keyName = "UUID";
        this.valueName = "URL";
        this.infoList = [];
        Editor.sendRequestToCore('asset-db-debugger:query-uuid-url', function ( results ) {
            this.infoList = [];
            for ( var i = 0; i < results.length; ++i ) {
                var info = results[i];
                this.infoList.push( { key: info.uuid, value: info.url } );
            }
        }.bind(this));
    },

    urlSubUuidsAction: function ( event ) {
        this._option = 'url-subuuids';
        this.keyName = "URL";
        this.valueName = "SUB UUIDS";
        this.infoList = [];
        Editor.sendRequestToCore('asset-db-debugger:query-url-subuuids', function ( results ) {
            this.infoList = [];
            for ( var i = 0; i < results.length; ++i ) {
                var info = results[i];
                for ( var j = 0; j < info.uuids.length; ++j ) {
                    this.infoList.push( { key: info.url, value: info.uuids[j] } );
                }
            }
        }.bind(this));
    },

    libraryAction: function ( event ) {
        this._option = 'library';
        this.keyName = "UUID";
        this.valueName = "ASSET NAME";
        this.infoList = [];
        Editor.sendToMainWindow('asset-db-debugger:query-uuid-asset');
    },

    refreshAction: function ( event ) {
        switch (this._option) {
        case 'url-uuid': this.urlUuidAction(); break;
        case 'uuid-url': this.uuidUrlAction(); break;
        case 'url-subuuids': this.urlSubUuidsAction(); break;
        case 'library': this.libraryAction(); break;
        }
    },
});
