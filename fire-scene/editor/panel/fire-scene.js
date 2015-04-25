var Path = require('fire-path');
var Url = require('fire-url');

Polymer({
    created: function () {
        this.icon = new Image();
        this.icon.src = "fire://static/img/plugin-scene.png";
    },

    attached: function () {
        Editor.mainWindow.$.scene = this;
    },

    detached: function () {
        Editor.mainWindow.$.scene = null;
    },

    'scene:dirty': function () {
        this.delayRepaintScene();
    },

    'component:enabled': function ( detail ) {
        var compId = detail['component-id'];
        this.$.view.updateComponent( compId, true );
    },

    'component:disabled': function ( detail ) {
        var compId = detail['component-id'];
        this.$.view.updateComponent( compId, false );
    },

    'selection:entity:selected': function ( detail ) {
        this.select( detail['id-list'], true );
    },

    'selection:entity:unselected': function ( detail ) {
        this.select( detail['id-list'], false );
    },

    'selection:entity:hover': function ( detail ) {
        this.hover( detail.id );
    },

    'selection:entity:hoverout': function ( detail ) {
        this.hoverout( detail.id );
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

    select: function ( entityIds, selected ) {
        if ( selected )
            this.$.view.select(entityIds);
        else
            this.$.view.unselect(entityIds);
    },

    hover: function ( entityId ) {
        if ( !entityId )
            return;

        this.$.view.hover(entityId);
    },

    hoverout: function ( entityId ) {
        if ( !entityId )
            return;

        this.$.view.hoverout( entityId );
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
