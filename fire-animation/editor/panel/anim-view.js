Polymer(EditorUI.mixin({

    publish: {
        'mode': 'dropsheet', // curveview, dropsheet
        frame: 0
    },

    observe: {
        'mode': 'modeChanged',
        'frame': 'frameChanged'
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

        this.frameChanged();

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
        this.moveNeedle(this.$.dropsheet.view.valueToPixelH(this.frame));
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

    frameChanged: function () {
        this.moveNeedle(this.$.dropsheet.view.valueToPixelH(this.frame));
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

    moveNeedle: function (offsetX) {
        var nextFrames = this.$.dropsheet.view.pixelToValueH(offsetX);
        var integerPixel = this.$.dropsheet.view.valueToPixelH(Math.round(nextFrames));
        this.frame = Math.round(nextFrames);
        this.$.needle.style.left = integerPixel;
        this.$.mask.style.width = integerPixel < 0 ? 0 : integerPixel;
        return this.frame;
    },

    dragNeedleAction: function (event) {
        EditorUI.addDragGhost("col-resize");
        var forward = false;
        var rollback = false;
        var oldFrame = 0;
        var timer = setInterval(function () {
            if (forward) {
                this.$.needle.style.left = this.getBoundingClientRect().width - 50;
                this.$.mask.style.width = this.getBoundingClientRect().width - 50;
                this.moveNeedle(this.$.needle.getBoundingClientRect().left - this.getBoundingClientRect().left);
                this.$.timeline.pan( -3, 0 );
                this.$.dropsheet.pan( -3, 0 );
                this.$.curveview.pan( -3, 0 );
                this.repaint();
            }
            if (rollback) {
                this.$.needle.style.left = 50;
                this.$.mask.style.width = 50;
                this.moveNeedle(50);
                this.$.timeline.pan( 3, 0 );
                this.$.dropsheet.pan( 3, 0 );
                this.$.curveview.pan( 3, 0 );
                this.repaint();
            }
        }.bind(this), 5);

        var left = this.$.needle.getBoundingClientRect().left - this.getBoundingClientRect().left;
        var dropSheetWidth = this.getBoundingClientRect().width;

        var mousemoveHandle =  function (event) {
            forward = false;
            rollback = false;
            var dx = event.clientX - this._lastClientX;

            if ((left + dx) <= 50 && this.$.dropsheet.view.xAxisOffset < -50) {
                rollback = true;
                return;
            }

            if ( (left + dx) <= 0 && this.$.dropsheet.view.xAxisOffset >= -50) {
                this.$.needle.style.left = 0;
                this.$.mask.style.width = 0;
                this.frame = 0;
                return;
            }

            if ( (left + dx) >= dropSheetWidth - 50) {
                oldFrame = this.frame;
                forward = true;
                return;
            }

            this.moveNeedle(left + dx);
            this.$.tip.style.display = 'block';
            this.$.tip.style.left = left + dx + 20;
            this.$.tip.style.top = event.clientY - 20;
            this.$.tip.innerHTML = this.frame;
        }.bind(this);

        var mouseupHandle = function (event) {
            document.removeEventListener('mousemove', mousemoveHandle);
            document.removeEventListener('mouseup', mouseupHandle);
            this.$.tip.style.display = 'none';
            forward = false;
            rollback = false;
            clearInterval(timer);
            EditorUI.removeDragGhost();
        }.bind(this);

        this._lastClientX = event.clientX;

        document.addEventListener ( 'mousemove', mousemoveHandle );
        document.addEventListener ( 'mouseup', mouseupHandle );
    },

    _clickMoveNeedle: function (event) {
        var offsetX = event.clientX - this.getBoundingClientRect().left;
        this.moveNeedle(offsetX);
    },

}, EditorUI.resizable));
