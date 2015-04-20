Polymer({
    created: function () {
        this.icon = new Image();
        this.icon.src = 'fire://static/img/plugin-assets.png';
    },

    attached: function () {
        Editor.mainWindow.$.assets = this;
    },

    detached: function () {
        Editor.mainWindow.$.assets = null;
    },

    'asset:hint': function ( event ) {
        var uuid = event.detail.uuid;
        this.hint(uuid);
    },

    'folder:created': function ( event ) {
        var url = event.detail.url;
        var id = event.detail.uuid;
        var parentId = event.detail.parentUuid;

        this.$.assetsTree.newItem( url, id, parentId, true );
    },

    'asset:moved': function ( event ) {
        var id = event.detail.uuid;
        var destUrl = event.detail['dest-url'];
        var destDirId = event.detail['dest-parent-uuid'];

        this.$.assetsTree.moveItem( id, destUrl, destDirId );
    },

    'assets:created': function ( event ) {
        var results = event.detail.results;
        for ( var i = 0; i < results.length; ++i ) {
            var info = results[i];
            this.$.assetsTree.newItem( info.url, info.uuid, info.parentUuid, info.isDir );
        }
    },

    'assets:deleted': function ( event ) {
        var results = event.detail.results;
        var filterResults = Editor.arrayCmpFilter ( results, function ( a, b ) {
            if ( Path.contains( a.url, b.url ) ) {
                return 1;
            }
            if ( Path.contains( b.url, a.url ) ) {
                return -1;
            }
            return 0;
        } );

        for ( var i = 0; i < filterResults.length; ++i ) {
            this.$.assetsTree.deleteItemById(filterResults[i].uuid);
        }
    },

    'fire-assets:refresh-context-menu': function ( event ) {
        // make context menu dirty
        this.$.assetsTree.contextmenu = null;
    },

    'selection:asset:selected': function ( event ) {
        this.select( event.detail['id-list'], true );
    },

    'selection:asset:unselected': function ( event ) {
        this.select( event.detail['id-list'], false );
    },

    'selection:asset:activated': function ( event ) {
        this.active( event.detail.id, true );
    },

    'selection:asset:deactivated': function ( event ) {
        this.active( event.detail.id, false );
    },

    browse: function () {
        Fire.info('browse assets://');
        this.$.assetsTree.browse('assets://');
    },

    select: function ( ids, selected ) {
        for (var i = 0; i < ids.length; ++i) {
            var id = ids[i];
            var el = this.$.assetsTree.idToItem[id];
            if (el) {
                el.selected = selected;
            }
        }
    },

    active: function ( id, activated ) {
        if ( activated ) {
            var el = this.$.assetsTree.idToItem[id];
            this.$.assetsTree.active(el);
        }
        else {
            this.$.assetsTree.active(null);
        }
    },

    hint: function (uuid) {
        this.$.assetsTree.hintItem(uuid);
    },

    createAction: function () {
        var Remote = require('remote');
        var Menu = Remote.require('menu');

        var rect = this.$.addIcon.getBoundingClientRect();
        var template = this.$.assetsTree.getCreateMenuTemplate();
        var menu = Menu.buildFromTemplate(template);
        menu.popup(Remote.getCurrentWindow(),
                   Math.floor(rect.left + 5),
                   Math.floor(rect.bottom + 10));
    },

});
