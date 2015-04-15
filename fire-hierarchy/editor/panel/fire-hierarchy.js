function createEntityFromSnapshot(tree, selection, entityData, parentEL) {
    if ( !(entityData.objFlags & Fire._ObjectFlags.HideInEditor) ) {
        var el = tree.newItem(entityData.name, entityData.id, parentEL);
        if (selection) {
            el.selected = selection.indexOf(el.userId) !== -1;
        }

        var children = entityData.children;
        for (var i = 0, len = children.length; i < len; i++) {
            createEntityFromSnapshot(tree, selection, children[i], el);
        }
    }
}

Polymer({
    created: function () {
        this.icon = new Image();
        this.icon.src = "fire://static/img/plugin-hierarchy.png";

        this.ipc = new Editor.IpcListener();
    },

    attached: function () {
        Editor.mainWindow.$.hierarchy = this;

        this.ipc.on('scene:launched', this.reload.bind(this));

        this.ipc.on('selection:entity:selected', this.select.bind(this, true));
        this.ipc.on('selection:entity:unselected', this.select.bind(this, false));
        this.ipc.on('selection:entity:hover', this.hover.bind(this));
        this.ipc.on('selection:entity:hoverout', this.hoverout.bind(this));
        this.ipc.on('selection:entity:activated', this.active.bind(this, true));
        this.ipc.on('selection:entity:deactivated', this.active.bind(this, false));
    },

    detached: function () {
        Editor.mainWindow.$.hierarchy = null;

        this.ipc.clear();
    },

    'entity:created': function ( event ) {
        createEntityFromSnapshot(this.$.hierarchyTree, null, event.detail);
    },

    'entity:removed': function ( event ) {
        var entityId = event.detail['entity-id'];

        this.$.hierarchyTree.deleteItemById(entityId);
    },

    'entity:renamed': function ( event ) {
        var entityId = event.detail['entity-id'];
        var newName = event.detail.name;

        this.$.hierarchyTree.renameItemById( entityId, newName );
    },

    'entity:parent-changed': function ( event ) {
        var entityId = event.detail['entity-id'];
        var parentId = event.detail['parent-id'];

        this.$.hierarchyTree.setItemParentById( entityId, parentId );
    },

    'entity:index-changed': function ( event ) {
        var entityId = event.detail['entity-id'];
        var nextSiblingId = event.detail['next-sibliing-id'];

        this.$.hierarchyTree.setItemIndex( entityId, nextSiblingId );
    },

    'entity:hint': function ( event ) {
        var entityId = event.detail['entity-id'];
        this.hint(entityId);
    },

    'hierarchy-menu:create-entity': function ( event ) {
        this.$.hierarchyTree.createEntityFromContextSelect();
    },

    'hierarchy-menu:create-child-entity': function ( event ) {
        this.$.hierarchyTree.createChildEntityFromContextSelect();
    },

    'hierarchy-menu:rename': function ( event ) {
        this.$.hierarchyTree.renameEntityFromContextSelect();
    },

    'hierarchy-menu:delete': function ( event ) {
        this.$.hierarchyTree.deleteEntityFromContextSelect();
    },

    'hierarchy-menu:duplicate': function () {
        this.$.hierarchyTree.duplicateEntityFromContextSelect();
    },

    select: function (selected, entityIds) {
        for (var i = 0; i < entityIds.length; ++i) {
            var id = entityIds[i];
            var el = this.$.hierarchyTree.idToItem[id];
            if (el) {
                el.selected = selected;
            }
        }
    },

    active: function (activated, id) {
        if ( activated ) {
            var el = this.$.hierarchyTree.idToItem[id];
            this.$.hierarchyTree.active(el);
        }
        else {
            this.$.hierarchyTree.active(null);
        }
    },

    hover: function ( entityID ) {
        var el = this.$.hierarchyTree.idToItem[entityID];
        if (el) {
            el.hover = true;
        }
    },

    hoverout: function ( entityID ) {
        var el = this.$.hierarchyTree.idToItem[entityID];
        if (el) {
            el.hover = false;
        }
    },

    hint: function ( entityID ) {
        this.$.hierarchyTree.hintItem(entityID);
    },

    createAction: function () {
        var rect = this.$.addIcon.getBoundingClientRect();
        Editor.popupMenu(Editor.plugins.hierarchy.getMenuTemplate('main-menu'),
                       Math.floor(rect.left + 5),
                       Math.floor(rect.bottom + 10));
    },

    reload: function (sceneSnapshot) {
        var tree = this.$.hierarchyTree;
        tree.clear();

        var selection = Editor.Selection.entities;
        var entityDatas = sceneSnapshot.entities;
        for (var i = 0, len = entityDatas.length; i < len; i++) {
            createEntityFromSnapshot(tree, selection, entityDatas[i]);
        }
    },
});
