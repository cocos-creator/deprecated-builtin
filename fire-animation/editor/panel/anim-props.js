Polymer(EditorUI.mixin({

    publish: {
        'mode': 'dropsheet', // curve, dropsheet
    },

    ready: function () {
        this._initResizable();
        this.$.modes.select(0);
    },

    resize: function () {
    },

    repaint: function () {
    },

    _onDropSheet: function () {
        this.mode = 'dropsheet';
        this.fire('mode-changed', { mode: this.mode });
    },

    _onCurve: function () {
        this.mode = 'curve';
        this.fire('mode-changed', { mode: this.mode });
    },

}, EditorUI.resizable));
