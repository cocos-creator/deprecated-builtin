Polymer({

    get ticks () {
        return this.$.ticks;
    },

    init: function () {
        this.$.ticks.setScaleH( [5,2,3,2], 1, 1000, 'frame' );
        this.$.ticks.setMappingH( 0, 100, 100 );
        this.$.ticks.setRangeH( -10, null );

        this.$.ticks.setAnchor( 0.0, 0.0 );
        this.$.ticks.xAxisScaleAt( 0.0, 10 );
    },

    resize: function () {
        this.$.ticks.resize();
    },

    repaint: function () {
        this.$.ticks.repaint();
    },

    pan: function ( dx ) {
        this.$.ticks.pan( dx, 0 );
    },

    scaleAction: function ( event ) {
        this.$.ticks.scaleAction( event );
    },
});
