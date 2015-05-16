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

    'panel:open': function ( detail ) {
        if ( detail ) {
            var uuid = detail.uuid;
            this.load(uuid);
        }
    },

    'asset:changed': function ( detail ) {
        var uuid = detail.uuid;

        if ( this.uuid !== uuid ) {
            return;
        }

        this.load(uuid);
    },

    load: function ( uuid ) {
        if ( uuid ) {
            this.uuid = uuid;
            this.url = Editor.AssetDB.uuidToUrl(uuid);

            Fire.AssetLibrary.loadAssetInEditor( this.uuid, function ( err, asset ) {
                this.asset = asset;
            }.bind(this));
        }
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
