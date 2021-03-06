Polymer(EditorUI.mixin({

    publish: {
        'mode': 'dropsheet', // curveview, dropsheet
        'curFrame': 0,
        'entity': null,
        'clip': null,
        'offsetY': 0.0,
    },

    observe: {
        'mode': 'modeChanged',
        'curFrame': 'curFrameChanged',
        'entity': 'entityChanged',
        'offsetY': 'offsetYChanged',
    },

    eventDelegates: {
        'resize': '_onResize',
    },

    ready: function () {
        this._initFocusable(this.$.border);
        this._initResizable();
    },

    domReady: function () {
        // curveview
        this.$.curveview.init();

        // dropsheet
        this.$.dropsheet.init();

        // timline
        this.$.timeline.init();

        this.modeChanged();
        this.curFrameChanged();
    },

    _onResize: function ( event ) {
        if ( this.mode === 'dropsheet' ) {
            this.$.dropsheet.resize();
            this.$.dropsheet.repaint();
        }
        else {
            this.$.curveview.resize();
            this.$.curveview.repaint();
        }

        this.$.timeline.resize();
        this.$.timeline.repaint();
    },

    _onMouseWheel: function ( event ) {
        if ( this.mode === 'dropsheet' ) {
            this.$.dropsheet.scaleAction(event);
        }
        else {
            this.$.curveview.scaleAction(event);
        }
        this.$.timeline.scaleAction(event);
        this.updateNeedle( this.curFrame );
    },

    _onMouseDown: function ( event ) {
        event.stopPropagation();
        this.focus();

        if ( event.which === 1 ) {
            if ( event.shiftKey ) {
                var mousemoveHandle = function(event) {
                    event.stopPropagation();

                    var dx = event.clientX - this._lastClientX;
                    var dy = event.clientY - this._lastClientY;

                    this._lastClientX = event.clientX;
                    this._lastClientY = event.clientY;

                    if ( this.mode === 'dropsheet' ) {
                        this.$.dropsheet.pan( dx, dy );
                        this.$.dropsheet.repaint();
                    }
                    else {
                        this.$.curveview.pan( dx, dy );
                        this.$.curveview.repaint();
                    }

                    this.$.timeline.pan( dx );
                    this.$.timeline.repaint();

                    this.updateNeedle( this.curFrame );
                }.bind(this);

                var mouseupHandle = function(event) {
                    event.stopPropagation();

                    document.removeEventListener('mousemove', mousemoveHandle);
                    document.removeEventListener('mouseup', mouseupHandle);

                    EditorUI.removeDragGhost();

                    if ( event.shiftKey )
                        this.style.cursor = '-webkit-grab';
                    else
                        this.style.cursor = '';
                }.bind(this);

                //
                this._lastClientX = event.clientX;
                this._lastClientY = event.clientY;

                //
                EditorUI.addDragGhost('-webkit-grabbing');
                this.style.cursor = '-webkit-grabbing';
                document.addEventListener ( 'mousemove', mousemoveHandle );
                document.addEventListener ( 'mouseup', mouseupHandle );

                return;
            }
        }
    },

    _onKeyDown: function (event) {
        switch ( event.which ) {
            // shift
            case 16:
                event.stopPropagation();
                this.style.cursor = '-webkit-grab';
            break;

            // delete
            case 8:
            case 46:
                event.stopPropagation();
                if ( this.mode === 'dropsheet' ) {
                    this.$.dropsheet.deleteSelection();
                    this.fire('clip-changed');
                }
            break;
        }
    },

    _onKeyUp: function (event) {
        // process shift
        if ( event.which === 16 ) {
            this.style.cursor = '';
        }
    },

    resize: function () {
        if ( this.mode === 'dropsheet' ) {
            this.$.dropsheet.resize();
        }
        else {
            this.$.curveview.resize();
        }
        this.$.timeline.resize();
    },

    repaint: function () {
        if ( this.mode === 'dropsheet' ) {
            this.$.dropsheet.repaint();
        }
        else {
            this.$.curveview.repaint();
        }
        this.$.timeline.repaint();
    },

    curFrameChanged: function () {
        this.updateNeedle( this.curFrame );
    },

    modeChanged: function () {
        if ( this.mode === 'dropsheet' ) {
            this.$.curveview.style.display = 'none';
            this.$.dropsheet.style.display = '';

            this.$.dropsheet.view.xAxisSync(
                this.$.timeline.ticks.xAxisOffset,
                this.$.timeline.ticks.xAxisScale
            );

            this.$.dropsheet.resize();
            this.$.dropsheet.repaint();
        }
        else if ( this.mode === 'curve' ) {
            this.$.curveview.style.display = '';
            this.$.dropsheet.style.display = 'none';

            this.$.curveview.view.xAxisSync(
                this.$.timeline.ticks.xAxisOffset,
                this.$.timeline.ticks.xAxisScale
            );

            this.$.curveview.resize();
            this.$.curveview.repaint();
        }
    },

    entityChanged: function () {
        if ( !this.entity ) {
            this.curFrame = 0;
        }
    },

    offsetYChanged: function () {
        // dropsheet
        if ( this.mode === 'dropsheet' ) {
            this.$.dropsheet.updateOffsetY(this.offsetY);
        }
    },

    _onNeedleMouseDown: function (event) {
        event.stopPropagation();
        EditorUI.addDragGhost("col-resize");
        this.$.needle.classList.add('active');
        this.fire('start-editing');

        var rect = this.$.timeline.getBoundingClientRect();
        var mousemoveHandle =  function (event) {
            var offsetX = Math.clamp( event.clientX - rect.left, 0, rect.width-1 );
            var newFrame = this.$.timeline.ticks.pixelToValueH(offsetX);

            this.updateNeedle(newFrame);
            this.$.tip.style.display = 'block';
            this.$.tip.style.left = offsetX + 20;
            this.$.tip.style.top = event.clientY - rect.top;
            this.$.tip.innerHTML = this.curFrame;

            var animation = this.entity.getComponent(Fire.Animation);
            if ( animation ) {
                var animState = animation.play(this.clip.name);
                animState.time = this.clip.frameToTime(this.curFrame);
                animation.sample();
                Editor.sendToMainWindow( 'scene:repaint' );
            }
        }.bind(this);

        var mouseupHandle = function (event) {
            document.removeEventListener('mousemove', mousemoveHandle);
            document.removeEventListener('mouseup', mouseupHandle);

            this.$.needle.classList.remove('active');
            this.$.tip.style.display = 'none';

            EditorUI.removeDragGhost();
        }.bind(this);

        document.addEventListener ( 'mousemove', mousemoveHandle );
        document.addEventListener ( 'mouseup', mouseupHandle );
    },

    _onMouseClick: function (event) {
        var offsetX = event.clientX - this.getBoundingClientRect().left;
        var frame = this.$.timeline.ticks.pixelToValueH(offsetX);
        this.updateNeedle(frame);
        this.fire('start-editing');

        var animation = this.entity.getComponent(Fire.Animation);
        if ( animation ) {
            var animState = animation.play(this.clip.name);
            animState.time = this.clip.frameToTime(this.curFrame);
            animation.sample();
            Editor.sendToMainWindow( 'scene:repaint' );
        }
    },

    updateNeedle: function ( frame ) {
        this.curFrame = Math.max( 0, Math.round(frame) );
        var pixel = this.$.timeline.ticks.valueToPixelH(this.curFrame);
        this.$.needle.style.left = pixel;
        // this.$.mask.style.width = Math.max( 0, pixel );
    },

    applyKeyFrame: function () {
        var newKeyInfos = this.clip.applyKeyFrame( this.entity, this.curFrame );

        // dropsheet
        if ( this.mode === 'dropsheet' ) {
            this.$.dropsheet.addKeyInfos(newKeyInfos);
        }
    },

    addKey: function ( compName, propName ) {
        //
        var keyInfo = this.clip.findKey( compName, propName, this.curFrame );
        if ( keyInfo ) {
            return;
        }

        var comp = this.entity.getComponent(compName);
        if ( !comp ) {
            return;
        }

        var splits = propName.split('.');
        var value;

        if ( splits.length === 1 ) {
            value = comp[propName];
            if ( value === undefined ) {
                return;
            }
        }
        // get value type properties
        else {
            value = comp[splits[0]];
            if ( value === undefined ) {
                return;
            }
            value = value[splits[1]];
            if ( value === undefined ) {
                return;
            }
        }

        keyInfo = {
            frame: this.curFrame,
            value: value,
            curve: [0.5,0.5,0.5,0.5], // linear
        };

        //
        this.clip.addKey( compName, propName, keyInfo );

        // dropsheet
        if ( this.mode === 'dropsheet' ) {
            this.$.dropsheet.addKeyNode(compName, propName, keyInfo);
        }
    },

    addProperty: function ( comp, prop ) {
        // dropsheet
        if ( this.mode === 'dropsheet' ) {
            this.$.dropsheet.addProperty( comp, prop );
        }
    },

    removeProperty: function ( comp, prop ) {
        // dropsheet
        if ( this.mode === 'dropsheet' ) {
            this.$.dropsheet.removeProperty( comp, prop );
        }
    },

}, EditorUI.resizable, EditorUI.focusable));
