Polymer({
    eventDelegates: {
        'resize': '_onResize',
        'panel-show': '_onPanelShow',
        'mode-changed': '_onModeChanged',
        'clip-index-changed': '_onClipIndexChanged',
        'remove-prop': '_onRemoveProp',
        'toggle-editing': '_onToggleEditing',
        'start-editing': '_onStartEditing',
    },

    created: function () {
        this.entity = null;
        this.clip = null;
        this.editing = false;
        this._snapshot = null;
        this.popup();
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
        if ( entity && entity.getComponent(Fire.Animation) ) {
            this.entity = entity;
        }
    },

    'selection:entity:deactivated': function ( detail ) {
        this.setEditing(false);
        this.entity = null;
    },

    'fire-animation:add-prop': function ( compName, propName ) {
        this.clip.addProperty( compName, propName );
        this.clip.sort();
        Editor.AssetDB.save( this.url, Editor.serialize(this.clip) );
    },

    'fire-animation:state-changed': function ( state ) {
        this.state = state;
    },

    'entity:inspector-dirty': function () {
        if ( !this.editing )
            return;

        this.$.view.applyKeyFrame();
        Editor.AssetDB.save( this.url, Editor.serialize(this.clip) );
    },

    'gizmos:dirty': function () {
        if ( !this.editing )
            return;

        this.$.view.applyKeyFrame();
        Editor.AssetDB.save( this.url, Editor.serialize(this.clip) );
    },

    setEditing: function ( editing ) {
        if ( this.editing === editing )
            return;

        this.editing = editing;

        if ( this.editing ) {
            this._snapshot = Editor.snapshotEntity(this.entity);
        }
        else {
            if ( this._snapshot ) {
                Editor.applyFromSnapshot(this.entity, this._snapshot);
                this._snapshot = null;
                Editor.sendToMainWindow( 'scene:repaint' );
            }
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

    _onToggleEditing: function ( event ) {
        if ( !this.entity )
            return;

        this.setEditing(!this.editing);
    },

    _onStartEditing: function () {
        if ( !this.entity )
            return;

        this.setEditing(true);
    },

    _onRemoveProp: function ( event ) {
        var compName = event.detail.component;
        var propName = event.detail.property;
        this.clip.removeProperty( compName, propName );
        Editor.AssetDB.save( this.url, Editor.serialize(this.clip) );
    },

    popup: function () {
        var curve = new BezierPop();
        curve.bezier = [1,1,1,0];
        document.body.appendChild(curve);
    },
});
