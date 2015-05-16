Polymer({
    eventDelegates: {
        'resize': '_onResize',
        'panel-show': '_onPanelShow',
        'mode-changed': '_onModeChanged',
        'clip-index-changed': '_onClipIndexChanged',
    },

    created: function () {
        this.entity = null;
        this.clip = null;
    },

    domReady: function () {
    },

    attached: function () {
    },

    detached: function () {
    },

    'panel:open': function () {
        // TODO
    },

    // 'asset:changed': function ( detail ) {
    //     var uuid = detail.uuid;

    //     if ( this.uuid !== uuid ) {
    //         return;
    //     }

    //     this.load(uuid);
    // },

    'selection:entity:activated': function ( detail ) {
        var entity = Editor.getInstanceById(detail.id);
        this.entity = entity;
    },

    'selection:entity:deactivated': function ( detail ) {
        this.entity = null;
    },

    'fire-animation:add-prop': function ( compName, propName ) {
        this.clip.addProperty( compName, propName );
        Editor.AssetDB.save( this.url, Editor.serialize(this.clip) );
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

    _onClipIndexChanged: function ( event ) {
        var clipIdx = event.detail.index;

        if ( clipIdx !== -1 ) {
            var animComp = this.entity.getComponent(Fire.Animation);
            this.clip = animComp.animations[clipIdx];
            this.url = Editor.AssetDB.uuidToUrl(this.clip._uuid);
        }
        else {
            this.clip = null;
            this.url = null;
        }
    },
});
