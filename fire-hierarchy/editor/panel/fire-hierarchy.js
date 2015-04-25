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
    },

    attached: function () {
        Editor.mainWindow.$.hierarchy = this;
    },

    detached: function () {
        Editor.mainWindow.$.hierarchy = null;
    },

    'scene:launched': function ( detail ) {
        this.reload(detail);
    },

    'entity:created': function ( detail ) {
        createEntityFromSnapshot(this.$.hierarchyTree, null, detail);
    },

    'entity:removed': function ( detail ) {
        var entityId = detail['entity-id'];

        this.$.hierarchyTree.deleteItemById(entityId);
    },

    'entity:renamed': function ( detail ) {
        var entityId = detail['entity-id'];
        var newName = detail.name;

        this.$.hierarchyTree.renameItemById( entityId, newName );
    },

    'entity:parent-changed': function ( detail ) {
        var entityId = detail['entity-id'];
        var parentId = detail['parent-id'];

        this.$.hierarchyTree.setItemParentById( entityId, parentId );
    },

    'entity:index-changed': function ( detail ) {
        var entityId = detail['entity-id'];
        var nextSiblingId = detail['next-sibliing-id'];

        this.$.hierarchyTree.setItemIndex( entityId, nextSiblingId );
    },

    'entity:hint': function ( detail ) {
        var entityId = detail['entity-id'];
        this.hint(entityId);
    },

    'hierarchy-menu:create-entity': function () {
        this.$.hierarchyTree.createEntityFromContextSelect();
    },

    'hierarchy-menu:create-child-entity': function () {
        this.$.hierarchyTree.createChildEntityFromContextSelect();
    },

    'hierarchy-menu:rename': function () {
        this.$.hierarchyTree.renameEntityFromContextSelect();
    },

    'hierarchy-menu:delete': function () {
        this.$.hierarchyTree.deleteEntityFromContextSelect();
    },

    'hierarchy-menu:duplicate': function () {
        this.$.hierarchyTree.duplicateEntityFromContextSelect();
    },

    'selection:entity:selected': function ( detail ) {
        this.select( detail['id-list'], true );
    },

    'selection:entity:unselected': function ( detail ) {
        this.select( detail['id-list'], false );
    },

    'selection:entity:activated': function ( detail ) {
        this.active( detail.id, true );
    },

    'selection:entity:deactivated': function ( detail ) {
        this.active( detail.id, false );
    },

    'selection:entity:hover': function ( detail ) {
        this.hover( detail.id );
    },

    'selection:entity:hoverout': function ( detail ) {
        this.hoverout( detail.id );
    },

    select: function (entityIds, selected) {
        for (var i = 0; i < entityIds.length; ++i) {
            var id = entityIds[i];
            var el = this.$.hierarchyTree.idToItem[id];
            if (el) {
                el.selected = selected;
            }
        }
    },

    active: function (id, activated) {
        if ( activated ) {
            var el = this.$.hierarchyTree.idToItem[id];
            this.$.hierarchyTree.active(el);
        }
        else {
            this.$.hierarchyTree.active(null);
        }
    },

    hover: function ( entityId ) {
        var el = this.$.hierarchyTree.idToItem[entityId];
        if (el) {
            el.hover = true;
        }
    },

    hoverout: function ( entityId ) {
        var el = this.$.hierarchyTree.idToItem[entityId];
        if (el) {
            el.hover = false;
        }
    },

    hint: function ( entityId ) {
        this.$.hierarchyTree.hintItem(entityId);
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
