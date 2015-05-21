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

        // init svg
        this.svg = SVG( this.$.keys );
        this.svgScene = this.svg.group();
        this.foreground = this.svg.group();
        this.propGroups = {};
        this.selection = [];
        this._selectionSnapshort = [];
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
                keyNode.translate( this.$.view.valueToPixelH(keyNode.frame), 10 );
            }
        }
    },

    clipChanged: function () {
        this.selection = [];

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
            .addClass('key-node')
            ;
        keyNode.selectable = true;
        keyNode.component = comp;
        keyNode.property = prop;
        keyNode.frame = key.frame;

        keyNode.on('mousedown', function ( event ) {
            event.stopPropagation();

            if ( this.selection.indexOf(keyNode) === -1 ) {
                this.clearSelect();
                this.select( [keyNode] );
            }

            var rect = this.$.keys.getBoundingClientRect();
            var oldFrame = keyNode.frame;
            for ( var i = 0; i < this.selection.length; ++i ) {
                var item = this.selection[i];
                item.oldFrame = item.frame;
                item.front();
            }

            var mousemoveHandle = function(event) {
                event.stopPropagation();

                // process selection
                var offsetx = event.clientX - rect.left;

                var frame = Math.round(this.$.view.pixelToValueH(offsetx));
                frame = Math.max( 0, frame );
                var minFrameOffset = frame - oldFrame;
                var item, i;

                for ( i = 0; i < this.selection.length; ++i ) {
                    item = this.selection[i];
                    frame = item.oldFrame + minFrameOffset;
                    frame = Math.max( 0, frame );
                    if ( Math.abs(frame - item.oldFrame) < Math.abs(minFrameOffset) ) {
                        minFrameOffset = frame - item.oldFrame;
                    }
                }

                for ( i = 0; i < this.selection.length; ++i ) {
                    item = this.selection[i];
                    item.frame = item.oldFrame + minFrameOffset;
                }

                this.updateSVGKeys();

            }.bind(this);

            var mouseupHandle = function(event) {
                event.stopPropagation();

                document.removeEventListener('mousemove', mousemoveHandle);
                document.removeEventListener('mouseup', mouseupHandle);

                EditorUI.removeDragGhost();
                this.style.cursor = '';

                // apply move
                var i, item, keyNode, keyInfo, keyInfos = [];

                // remove key to move from clip
                for ( i = 0; i < this.selection.length; ++i ) {
                    item = this.selection[i];
                    if ( item.oldFrame === item.frame )
                        continue;

                    keyInfo = this.clip.removeKey( item.component, item.property, item.oldFrame );
                    keyInfo.frame = item.frame;
                    keyInfos.push({
                        component: item.component,
                        property: item.property,
                        info: keyInfo,
                    });
                }

                // add key to move back to clip
                for ( i = 0; i < keyInfos.length; ++i ) {
                    item = keyInfos[i];
                    this.clip.addKey( item.component, item.property, item.info );
                }

                //
                for ( i = 0; i < this.selection.length; ++i ) {
                    item = this.selection[i];
                    if ( item.oldFrame === item.frame )
                        continue;

                    var groupInfo = this.propGroups[item.component + '.' + item.property];
                    if ( groupInfo ) {
                        for ( var k = groupInfo.keyNodes.length-1; k >= 0; --k ) {
                            keyNode = groupInfo.keyNodes[k];
                            if ( keyNode !== item && keyNode.frame === item.frame ) {
                                groupInfo.keyNodes[k].remove();
                                groupInfo.keyNodes.splice( k, 1 );
                            }
                        }
                        groupInfo.keyNodes.sort(function ( a, b ) {
                            return a.frame - b.frame;
                        });
                    }
                }

                this.fire('clip-changed');
            }.bind(this);

            //
            EditorUI.addDragGhost('ew-resize');
            document.addEventListener ( 'mousemove', mousemoveHandle );
            document.addEventListener ( 'mouseup', mouseupHandle );
            this.style.cursor = 'ew-resize';

        }.bind(this));

        groupInfo.keyNodes.push(keyNode);
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

    updateSelectRect: function ( x, y, w, h ) {
        if ( !this.selectRect ) {
            this.selectRect = this.foreground.rect();
        }

        this.selectRect
            .addClass('rect-select')
            .move( Math.floor(x) + 0.5, Math.floor(y) + 0.5 )
            .size( w, h )
            ;
    },

    fadeoutSelectRect: function () {
        if ( !this.selectRect ) {
            return;
        }

        var selectRect = this.selectRect;
        this.selectRect = null;

        selectRect.animate( 100, '-' ).opacity(0.0).after( function () {
            selectRect.remove();
        });
    },

    rectHitTest: function ( x, y, w, h ) {
        var rect = this.svg.node.createSVGRect();
        rect.x = x;
        rect.y = y;
        rect.width = w;
        rect.height = h;

        var els = this.svg.node.getIntersectionList(rect, null);
        var results = [];

        for ( var i = 0; i < els.length; ++i ) {
            var el = els[i];
            var node = el.instance;
            if ( node && node.selectable ) {
                results.push( node );
            }
        }

        return results;
    },

    _onMouseDown: function ( event ) {
        if ( event.shiftKey )
            return;

        event.stopPropagation();

        if ( event.which === 1 ) {
            event.stopPropagation();

            var toggleMode = false;
            if ( event.metaKey || event.ctrlKey ) {
                toggleMode = true;
            }
            var lastSelection = this.selection;

            var rect = this.$.keys.getBoundingClientRect();
            var pressx = event.clientX;
            var pressy = event.clientY;

            var mousemoveHandle = function(event) {
                event.stopPropagation();

                // process selection
                var startx = pressx - rect.left;
                var starty = pressy - rect.top;
                var offsetx = event.clientX - pressx;
                var offsety = event.clientY - pressy;

                var magSqr = offsetx*offsetx + offsety*offsety;
                if ( magSqr < 2.0 * 2.0 ) {
                    return;
                }

                if ( offsetx < 0.0 ) {
                    startx += offsetx;
                    offsetx = -offsetx;
                }
                if ( offsety < 0.0 ) {
                    starty += offsety;
                    offsety = -offsety;
                }

                this.updateSelectRect( startx, starty, offsetx, offsety );
                var results = this.rectHitTest( startx, starty, offsetx, offsety );
                if ( toggleMode ) {
                    for ( i = 0; i < lastSelection.length; ++i ) {
                        if ( results.indexOf(lastSelection[i]) === -1 )
                            results.push( lastSelection[i] );
                    }
                }

                this.clearSelect();
                this.select( results );
            }.bind(this);

            var mouseupHandle = function(event) {
                event.stopPropagation();

                document.removeEventListener('mousemove', mousemoveHandle);
                document.removeEventListener('mouseup', mouseupHandle);

                EditorUI.removeDragGhost();
                this.style.cursor = '';
                this.fadeoutSelectRect();

                // process selection
                var startx = pressx - rect.left;
                var starty = pressy - rect.top;
                var offsetx = event.clientX - pressx;
                var offsety = event.clientY - pressy;

                var magSqr = offsetx*offsetx + offsety*offsety;
                if ( magSqr >= 2.0 * 2.0 ) {
                    // confirm
                }
                else {
                    var results = this.rectHitTest( startx, starty, 1, 1 );
                    if ( toggleMode ) {
                        if ( results.length > 0 ) {
                            if ( lastSelection.indexOf(results[0]) === -1 ) {
                                this.select( [results[0]] );
                            }
                            else {
                                this.unselect( [results[0]] );
                            }
                        }
                    }
                    else {
                        this.clearSelect();
                        if ( results.length > 0 ) {
                            this.select( [results[0]] );
                        }
                    }
                }
            }.bind(this);

            //
            EditorUI.addDragGhost();
            document.addEventListener ( 'mousemove', mousemoveHandle );
            document.addEventListener ( 'mouseup', mouseupHandle );

            return;
        }
    },

    select: function ( nodes ) {
        for ( var i = 0; i < nodes.length; ++i ) {
            var item = nodes[i];
            if ( this.selection.indexOf(item) === -1 ) {
                item.addClass('selected');
                this.selection.push(item);
            }
        }
    },

    unselect: function ( nodes ) {
        for ( var i = nodes.length-1; i >= 0; --i ) {
            var item = nodes[i];
            var idx = this.selection.indexOf(item);
            if ( idx !== -1 ) {
                item.removeClass('selected');
                this.selection.splice( idx, 1 );
            }
        }
    },

    clearSelect: function () {
        for ( var i = 0; i < this.selection.length; ++i ) {
            var item = this.selection[i];
            item.removeClass('selected');
        }
        this.selection = [];
    },
});
