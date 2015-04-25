var Url = require('fire-url');

Polymer({
    created: function () {
        this.viewMode = "list";
        this.searchText = "";
        this.items = [];
        this._curId = "";
    },

    ready: function () {
        window.onkeydown = function ( event ) {
            switch ( event.which ) {
            // enter, esc
            case 13:
            case 27:
                var browserWindow = Remote.getCurrentWindow();
                browserWindow.close();
                break;

            default:
                this.$.search.focus();
            }
        }.bind(this);

        var Remote = require('remote');
        var browserWindow = Remote.getCurrentWindow();
        if ( browserWindow ) {
            browserWindow.on ( 'close', function () {
                Editor.sendToWindows('quick-view:closed');
            });
        }
    },

    domReady: function () {
        // TODO
        // var Remote = require('remote');
        // var browserWindow = Remote.getCurrentWindow();
        // browserWindow.focusOnWebView();
        // this.$.search.focus();
    },

    'panel:open': function ( detail ) {
        var typeID = detail['type-id'];
        this._curId = detail.id;

        var self = this;
        Editor.AssetDB.query( "assets://", {
            'type-id': typeID
        }, function ( results ) {
            self.items = results.map ( function ( item ) {
                var icon = '';
                if ( typeID === Fire.JS._getClassId(Fire.Texture) ) {
                    icon = "uuid://" + item.uuid + "?thumb";
                }

                return {
                    icon: icon,
                    text: Url.basenameNoExt(item.url),
                    uuid: item.uuid,
                    selected: (item.uuid === self._curId)
                };
            }).sort( function (a,b) {
                return a.text.localeCompare(b.text);
            });
        });

        if ( typeID !== Fire.JS._getClassId(Fire.Texture) ) {
            this.$.btnGroup.style.display = "none";
        }
        this.$.btnGroup.select(0);
    },

    applyFilter: function ( items, searchText ) {
        var results = items.filter( function ( item ) {
            return item.text.toLowerCase().indexOf(searchText) !== -1;
        });
        results.unshift({
            icon: null,
            text: "None",
            uuid: "",
            selected: this._curId === "",
        });
        return results;
    },

    listViewAction: function () {
        this.viewMode = "list";
    },

    gridViewAction: function () {
        this.viewMode = "grid";
    },

    selectAction: function ( event ) {
        event.stopPropagation();

        Editor.sendToWindows('quick-view:selected', event.detail.uuid);
    },
});
