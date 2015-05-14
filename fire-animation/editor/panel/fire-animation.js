Polymer({
    eventDelegates: {
        'resize': '_onResize',
        'panel-show': '_onPanelShow',
        'mode-changed': '_onModeChanged',
    },

    created: function () {
    },

    domReady: function () {
    },

    attached: function () {
    },

    detached: function () {
    },

    _onResize: function ( event ) {
        this.$.props.resize();
        this.$.props.repaint();

        this.$.view.resize();
        this.$.view.repaint();
    },

    _onPanelShow: function ( event ) {
        this.$.props.resize();
        this.$.props.repaint();

        this.$.view.resize();
        this.$.view.repaint();
    },

    _onModeChanged: function ( event ) {
        this.$.view.mode = event.detail.mode;
    },

});
