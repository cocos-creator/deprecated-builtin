Polymer({

    get view () {
        return this.$.view;
    },

    init: function () {
        this.$.view.setScaleH( [5,2,3,2], 1, 1000, 'frame' );
        this.$.view.setMappingH( 0, 100, 100 );
        this.$.view.setRangeH( -10, null );

        this.$.view.setAnchor( 0.0, 0.0 );
    },

    resize: function () {
        this.$.view.resize();
    },

    repaint: function () {
        this.$.view.repaint();
    },

    pan: function ( dx, dy ) {
        this.$.view.pan( dx, dy );
    },

    scaleAction: function ( event ) {
        this.$.view.scaleAction( event );
    },
});
