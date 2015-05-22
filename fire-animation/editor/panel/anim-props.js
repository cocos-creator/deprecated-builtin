function _getProperties ( entity ) {
    var results = [];

    for ( var i = 0; i < entity._components.length; ++i ) {
        var comp = entity._components[i];
        if ( comp instanceof Fire.Animation ) {
            continue;
        }

        var compName = Fire.JS.getClassName(comp);
        var klass = comp.constructor;
        if (klass.__props__) {
            for (var p = 0; p < klass.__props__.length; p++) {
                var propName = klass.__props__[p];
                var attrs = Fire.attr(comp, propName);

                // skip hide-in-inspector
                if ( attrs.hideInInspector ) {
                    continue;
                }

                var value = comp[propName];
                if ( Fire.isValueType(value) ) {
                    var klass2 = value.constructor;
                    for (var p2 = 0; p2 < klass2.__props__.length; p2++) {
                        var propName2 = klass2.__props__[p2];
                        results.push( { compName: compName, propName: propName + '.' + propName2 } );
                    }
                }
                else {
                    results.push( { compName: compName, propName: propName } );
                }
            }
        }
    }

    return results;
}

Polymer(EditorUI.mixin({

    publish: {
        'editing': false,
        'mode': 'dropsheet', // curve, dropsheet
        'entity': null,
        'clip': null,
        'offsetY': 0.0,
    },

    observe: {
        'entity': 'entityChanged',
        'curClipIdx': 'curClipIdxChanged',
    },

    ready: function () {
        this._initResizable();
        this.$.modes.select(0);

        this.clips = [];
        this.curClipIdx = -1;
    },

    resize: function () {
    },

    repaint: function () {
    },

    _onDropSheet: function () {
        this.mode = 'dropsheet';
        this.fire('mode-changed', { mode: this.mode });
    },

    _onCurve: function () {
        this.mode = 'curve';
        this.fire('mode-changed', { mode: this.mode });
    },

    _onAddProp: function ( event ) {
        if ( !this.clip ) {
            return;
        }

        var props = _getProperties(this.entity);
        props = props.filter ( function ( item ) {
            var result = this.clip.curveData.some( function ( item ) {
                return item.component === item.compName &&
                    item.property === item.propName;
            });
            return !result;
        }.bind(this));

        var template = props.map( function ( item ) {
            return {
                label: item.compName + '.' + item.propName,
                message: 'fire-animation:add-prop',
                panel: 'fire-animation.panel',
                params: [ item.compName, item.propName ],
            };
        });

        var rect = event.target.getBoundingClientRect();
        Editor.Menu.popup( rect.left + 5, rect.bottom + 5, template );
    },

    entityChanged: function () {
        this.curClipIdx = -1;

        if ( !this.entity ) {
            this.clips = [];
            return;
        }

        var animComp = this.entity.getComponent(Fire.Animation);
        if ( !animComp ) {
            this.clips = [];
            return;
        }

        this.clips = animComp._clips.map( function ( item, index ) {
            return { name: item.name, value: index };
        });
        if ( this.clips.length > 0 ) {
            this.curClipIdx = 0;
        }
    },

    curClipIdxChanged: function () {
        this.fire('clip-index-changed', { index: this.curClipIdx });
    },

    _onEditClick: function () {
        this.fire('toggle-editing');
    },

    _onRemoveProp: function ( event ) {
        var target = event.target;
        var el = target.parentElement;
        var compName = el.getAttribute('comp');
        var propName = el.getAttribute('prop');

        this.fire('remove-prop', {
            component: compName,
            property: propName,
        });
    },

    _onScroll: function ( event ) {
        this.offsetY = this.$.props.scrollTop;
    },

}, EditorUI.resizable));
