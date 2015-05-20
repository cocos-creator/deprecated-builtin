Polymer({

    publish: {
        clip: null,
    },

    observe: {
        'clip': 'clipChanged',
    },

    get view () {
        return this.$.view;
    },

    init: function () {
        this.offsetY = 0.0;

        this.$.view.setScaleH( [5,2,3,2], 1, 1000, 'frame' );
        this.$.view.setMappingH( 0, 100, 100 );
        this.$.view.setRangeH( -10, null );

        this.$.view.setAnchor( 0.0, 0.0 );
        this.$.view.xAxisScaleAt( 0.0, 10 );

        // init gizmos
        this.svg = SVG( this.$.keys );
        this.svgScene = this.svg.group();
        this.propGroups = {};
        this.selection = [];
    },

    resize: function () {
        this.$.view.resize();
    },

    repaint: function () {
        this.$.view.repaint();
    },

    pan: function ( dx, dy ) {
        this.$.view.pan( dx, dy );

        this.updateSVGKeys();
    },

    scaleAction: function ( event ) {
        this.$.view.scaleAction( event );

        this.updateSVGKeys();
    },

    updateOffsetY: function ( offsetY ) {
        this.offsetY = -offsetY;
        this.style.backgroundPositionY = this.offsetY + 'px';
        this.svgScene.translate( 0.0, this.offsetY );
    },

    updateSVG: function () {
        this.svgScene.translate( 0.0, this.offsetY );
        this.updateSVGProps();
        this.updateSVGKeys();
    },

    updateSVGProps: function () {
        for ( var i = 0; i < this.clip.frames.length; ++i ) {
            var frameInfo = this.clip.frames[i];
            var groupInfo = this.propGroups[frameInfo.component + '.' + frameInfo.property];
            if ( groupInfo ) {
                groupInfo.svg.translate( 0.0, i * 30 );
            }
        }
    },

    updateSVGKeys: function () {
        for ( var p in this.propGroups ) {
            var groupInfo = this.propGroups[p];
            for ( var i = 0; i < groupInfo.keyNodes.length; ++i ) {
                var keyNode = groupInfo.keyNodes[i];
                keyNode.svg.translate( this.$.view.valueToPixelH(keyNode.frame), 10 );
            }
        }
    },

    clipChanged: function () {
        if ( !this.clip ) {
            this.svgScene.clear();
            return;
        }

        this.svgScene.clear();
        for ( var i = 0; i < this.clip.frames.length; ++i ) {
            var frameInfo = this.clip.frames[i];

            var group = this.svgScene.group();
            group.translate( 0, i * 30 );
            this.propGroups[frameInfo.component + '.' + frameInfo.property] = {
                svg: group,
                keyNodes: [],
            };

            for ( var k = 0; k < frameInfo.keys.length; ++k ) {
                this.addKeyNode( frameInfo.component, frameInfo.property, frameInfo.keys[k] );
            }
            // group.rect( 300, 30 )
            // .fill({ color: '#f00', opacity: 0.1 })
            // .stroke({ width: 1, color: '#f00' })
            // .attr({ 'vector-effect': 'non-scaling-stroke' })
            // ;
        }
    },

    addKeyInfos: function ( infos ) {
        for ( var i = 0; i < infos.length; ++i ) {
            var info = infos[i];
            this.addKeyNode( info.component, info.property, {
                frame: info.frame,
                value: info.value,
                curve: info.curve,
            });
        }
    },

    addKeyNode: function ( comp, prop, key ) {
        var groupInfo = this.propGroups[comp + '.' + prop];
        if ( !groupInfo ) {
            Editor.warn('Can not add key in %s.%s, property not found', comp, prop );
            return;
        }

        //
        var keyNode = groupInfo.svg.polygon('-5,5 0,0 5,5 0,10')
        .stroke({ width: 2, color: '#fff' })
        .fill({ color: '#2d94e9' })
        .translate( this.$.view.valueToPixelH(key.frame), 10 )
        ;
        keyNode.addClass('key-node');
        keyNode.on('mousedown', function ( event ) {
            event.stopPropagation();
            var item, i, idx = -1;
            for ( i = 0; i < this.selection.length; ++i ) {
                item = this.selection[i];
                if ( item.id() === keyNode.id() ) {
                    idx = i;
                    break;
                }
            }

            if ( event.metaKey || event.ctrlKey ) {
                if ( idx !== -1 ) {
                    keyNode.removeClass('selected');
                    this.selection.splice( idx, 1 );
                }
                else {
                    keyNode.addClass('selected');
                    this.selection.push(keyNode);
                }
            }
            else {
                if ( idx === -1 ) {
                    for ( i = 0; i < this.selection.length; ++i ) {
                        item = this.selection[i];
                        item.removeClass('selected');
                    }

                    keyNode.addClass('selected');
                    this.selection = [keyNode];
                }
            }
        }.bind(this));

        groupInfo.keyNodes.push({
            svg: keyNode,
            frame: key.frame,
        });
    },

    addProperty: function ( comp, prop ) {
        var groupInfo = this.propGroups[comp + '.' + prop];
        if ( groupInfo ) {
            this.updateSVGProps();
            return;
        }

        var group = this.svgScene.group();
        this.propGroups[comp + '.' + prop] = {
            svg: group,
            keyNodes: [],
        };

        this.updateSVGProps();
    },

    removeProperty: function ( comp, prop ) {
        var groupInfo = this.propGroups[comp + '.' + prop];
        if ( groupInfo ) {
            groupInfo.svg.remove();
            delete this.propGroups[comp + '.' + prop];
        }

        this.updateSVGProps();
    },

    _onMouseDown: function ( event ) {
        if ( event.shiftKey )
            return;

        event.stopPropagation();

        for ( var i = 0; i < this.selection.length; ++i ) {
            var item = this.selection[i];
            item.removeClass('selected');
        }
        this.selection = [];
    },
});
