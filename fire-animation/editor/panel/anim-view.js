Polymer(EditorUI.mixin({

    publish: {
        'mode': 'dropsheet', // curveview, dropsheet
    },

    observe: {
        'mode': 'modeChanged',
    },

    eventDelegates: {
        'resize': '_onResize',
    },

    ready: function () {
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
        // if (  Polymer.dom(event).localTarget === this.$.timeline ) {
        //     var newScale = Editor.Utils.smoothScale(this.$.timeline.xAxisScale, event.wheelDelta);
        //     this.$.timeline.xAxisScaleAt ( event.offsetX, newScale );
        //     this.$.timeline.repaint();

        //     newScale = Editor.Utils.smoothScale(this.$.curveview.xAxisScale, event.wheelDelta);
        //     this.$.curveview.xAxisScaleAt ( event.offsetX, newScale );
        //     this.$.curveview.repaint();
        // }
        // else {
        //     this.$.curveview.scaleAction(event);
        //     this.$.timeline.scaleAction(event);
        // }

        if ( this.mode === 'dropsheet' ) {
            this.$.dropsheet.scaleAction(event);
        }
        else {
            this.$.curveview.scaleAction(event);
        }
        this.$.timeline.scaleAction(event);
    },

    _onMouseDown: function ( event ) {
        if ( event.which === 1 ) {
            event.stopPropagation();

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
            }.bind(this);

            var mouseupHandle = function(event) {
                event.stopPropagation();

                document.removeEventListener('mousemove', mousemoveHandle);
                document.removeEventListener('mouseup', mouseupHandle);

                EditorUI.removeDragGhost();
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

}, EditorUI.resizable));
