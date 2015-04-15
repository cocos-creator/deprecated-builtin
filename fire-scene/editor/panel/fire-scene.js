var Path = require('fire-path');
var Url = require('fire-url');

Polymer({
    created: function () {
        this.icon = new Image();
        this.icon.src = "fire://static/img/plugin-scene.png";

        this.ipc = new Editor.IpcListener();
    },

    attached: function () {
        Editor.mainWindow.$.scene = this;

        // register ipc
        this.ipc.on('selection:entity:selected', this.select.bind(this, true) );
        this.ipc.on('selection:entity:unselected', this.select.bind(this, false) );
        this.ipc.on('selection:entity:hover', this.hover.bind(this) );
        this.ipc.on('selection:entity:hoverout', this.hoverout.bind(this) );
    },

    detached: function () {
        Editor.mainWindow.$.scene = null;

        this.ipc.clear();
    },

    'scene:dirty': function () {
        this.delayRepaintScene();
    },

    initRenderContext: function () {
        this.$.view.init();
    },

    resize: function () {
        var old = this.style.display;
        this.style.display = "";

        this.$.view.resize();

        this.style.display = old;
    },

    select: function ( selected, entityIds ) {
        if ( selected )
            this.$.view.select(entityIds);
        else
            this.$.view.unselect(entityIds);
    },

    hover: function ( entityID ) {
        if ( !entityID )
            return;

        this.$.view.hover(entityID);
    },

    hoverout: function ( entityID ) {
        if ( !entityID )
            return;

        this.$.view.hoverout( entityID );
    },

    delayRepaintScene: function () {
        if ( this._repainting )
            return;

        this._repainting = true;
        setTimeout( function () {
            this.repaintScene();
            this._repainting = false;
        }.bind(this), 10 );
    },

    repaintScene: function () {
        this.$.view.repaint();
    },

    initSceneCamera: function () {
        this.$.view.initSceneCamera();
    },

    layoutToolsAction: function ( event ) {
        this.$.view.rebuildGizmos();
        event.stopPropagation();
    },

    showAction: function ( event ) {
        this.resize();
    },

    resizeAction: function ( event ) {
        this.resize();
    },
});
