Polymer(EditorUI.mixin({

    publish: {
        'mode': 'dropsheet', // curveview, dropsheet
        'curFrame': 0
    },

    observe: {
        'mode': 'modeChanged',
        'curFrame': 'curFrameChanged'
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

    _onKeydown: function (event) {
        // process shift
        if ( event.which === 16 ) {
            this.style.cursor = '-webkit-grab';
        }
    },

    _onKeyup: function (event) {
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

    _onNeedleMouseDown: function (event) {
        event.stopPropagation();
        EditorUI.addDragGhost("col-resize");
        this.$.needle.classList.add('active');

        var rect = this.$.timeline.getBoundingClientRect();
        var mousemoveHandle =  function (event) {
            var offsetX = Math.clamp( event.clientX - rect.left, 0, rect.width-1 );
            var newFrame = this.$.timeline.ticks.pixelToValueH(offsetX);

            this.updateNeedle(newFrame);
            this.$.tip.style.display = 'block';
            this.$.tip.style.left = offsetX + 20;
            this.$.tip.style.top = event.clientY - 20;
            this.$.tip.innerHTML = this.curFrame;
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
    },

    updateNeedle: function ( frame ) {
        this.curFrame = Math.round(frame);
        var pixel = this.$.timeline.ticks.valueToPixelH(this.curFrame);
        this.$.needle.style.left = pixel;
        this.$.mask.style.width = Math.max( 0, pixel );
    },

}, EditorUI.resizable, EditorUI.focusable));
