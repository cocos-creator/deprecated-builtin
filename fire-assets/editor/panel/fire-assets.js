Polymer({
    created: function () {
        this.icon = new Image();
        this.icon.src = "fire://static/img/plugin-assets.png";

        this.ipc = new Editor.IpcListener();
    },

    attached: function () {
        Editor.mainWindow.$.assets = this;

        // TODO: discuss with Jare to change parameter to detail
        this.ipc.on('selection:asset:selected', this.select.bind(this, true));
        this.ipc.on('selection:asset:unselected', this.select.bind(this, false));
        this.ipc.on('selection:asset:activated', this.active.bind(this, true));
        this.ipc.on('selection:asset:deactivated', this.active.bind(this, false));
    },

    detached: function () {
        Editor.mainWindow.$.assets = null;

        this.ipc.clear();
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

    'asset:created': function ( event ) {
        var url = event.detail.url;
        var id = event.detail.uuid;
        var parentId = event.detail['parent-uuid'];

        this.$.assetsTree.newItem( url, id, parentId, false );
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

    browse: function () {
        Fire.info("browse assets://");
        this.$.assetsTree.browse("assets://");
    },

    select: function (selected, ids) {
        for (var i = 0; i < ids.length; ++i) {
            var id = ids[i];
            var el = this.$.assetsTree.idToItem[id];
            if (el) {
                el.selected = selected;
            }
        }
    },

    active: function (activated, id) {
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
