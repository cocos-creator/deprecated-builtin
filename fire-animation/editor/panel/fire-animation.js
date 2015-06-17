Polymer({
    eventDelegates: {
        'resize': '_onResize',
        'panel-show': '_onPanelShow',
        'mode-changed': '_onModeChanged',
        'clip-index-changed': '_onClipIndexChanged',
        'clip-changed': '_onClipChanged',
        'remove-prop': '_onRemoveProp',
        'toggle-editing': '_onToggleEditing',
        'start-editing': '_onStartEditing',
        'add-key': '_onAddKey',
        'show-curve': '_onShowCurve',
        'play-anim': '_onPlayAnim',
        'stop-anim': '_onStopAnim',
    },

    created: function () {
        this.entity = null;
        this.clip = null;
        this.editing = false;
        this.offsetY = 0.0;
        this._snapshot = null;
        // this.popup();
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
        this.$.view.addProperty( compName, propName );
        this.clip.updateLength();

        Editor.AssetDB.save( this.url, Editor.serialize(this.clip) );
    },

    'fire-animation:state-changed': function ( state ) {
        this.state = state;
    },

    'entity:inspector-dirty': function () {
        if ( !this.editing )
            return;

        this.$.view.applyKeyFrame();
        this.clip.updateLength();

        Editor.AssetDB.save( this.url, Editor.serialize(this.clip) );
    },

    'gizmos:dirty': function () {
        if ( !this.editing )
            return;

        this.$.view.applyKeyFrame();
        this.clip.updateLength();

        Editor.AssetDB.save( this.url, Editor.serialize(this.clip) );
    },

    setEditing: function ( editing ) {
        if ( this._playing ) {
            this.stopAnim();
        }

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

                var animation = this.entity.getComponent(Fire.Animation);
                if ( animation ) {
                    animation.stop();
                }

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
        this.setEditing(false);

        var clipIdx = event.detail.index;

        if ( clipIdx !== -1 ) {
            var animComp = this.entity.getComponent(Fire.Animation);
            this.clip = animComp._clips[clipIdx];
            this.url = Editor.AssetDB.uuidToUrl(this.clip._uuid);
        }
        else {
            this.clip = null;
            this.url = null;
        }
    },

    _onClipChanged: function ( event ) {
        this.setEditing(false);

        this.clip.updateLength();
        Editor.AssetDB.save( this.url, Editor.serialize(this.clip) );
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
        this.$.view.removeProperty( compName, propName );

        this.clip.updateLength();
        Editor.AssetDB.save( this.url, Editor.serialize(this.clip) );
    },

    _onAddKey: function ( event ) {
        this.$.view.addKey( event.detail.component, event.detail.property );

        this.clip.updateLength();
        Editor.AssetDB.save( this.url, Editor.serialize(this.clip) );
    },

    _onShowCurve: function ( event ) {
        var bezier = event.detail.curve;
        var frame = event.detail.frame;
        var component = event.detail.component;
        var property = event.detail.property;

        var curvePopup = new BezierPop();
        curvePopup.bezier = bezier;
        document.body.appendChild(curvePopup);
        curvePopup.domReady();

        EditorUI.addHitGhost('cursor', '998', function () {
            var keyInfo = this.clip.findKey( component, property, frame );
            if ( keyInfo ) {
                keyInfo.curve = curvePopup.bezier;
            }
            curvePopup.remove();
            EditorUI.removeHitGhost();

            Editor.AssetDB.save( this.url, Editor.serialize(this.clip) );
        }.bind(this), true);
    },

    _onPlayAnim: function () {
        this.playAnim();
    },

    _onStopAnim: function () {
        this.stopAnim();
    },

    playAnim: function () {
        this._playing = true;
        this._startTime = null;
        this._animState = null;
        this._animation = null;
        this._snapshot = Editor.snapshotEntity(this.entity);

        var animation = this.entity.getComponent(Fire.Animation);
        if ( animation ) {
            this._animation = animation;
            this._animState = animation.play(this.clip.name);
        }

        window.requestAnimationFrame( this.stepAnim.bind(this) );
    },

    stopAnim: function () {
        this._playing = false;
        this._startTime = null;
        this._animState = null;
        this._animation = null;

        this.$.props.playing = false;

        if ( this._snapshot ) {
            Editor.applyFromSnapshot(this.entity, this._snapshot);
            this._snapshot = null;

            var animation = this.entity.getComponent(Fire.Animation);
            if ( animation ) {
                animation.stop();
            }

            Editor.sendToMainWindow( 'scene:repaint' );
        }
    },

    stepAnim: function ( timestamp ) {
        if ( !this._playing )
            return;

        if ( !this._startTime ) {
            this._startTime = timestamp;
        }

        var curTime = (timestamp - this._startTime)/1000;
        curTime = curTime % this._animState.clip.length;

        this._animState.time = curTime;
        this._animation.sample();

        Editor.mainWindow.repaint();

        this.$.view.updateNeedle( curTime * this._animState.clip.frameRate );

        window.requestAnimationFrame ( this.stepAnim.bind(this) );
    },

});
