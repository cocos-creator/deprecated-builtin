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

                results.push( { compName: compName, propName: propName } );
            }
        }
    }

    return results;
}

Polymer(EditorUI.mixin({

    publish: {
        'mode': 'dropsheet', // curve, dropsheet
        'entity': null,
        'clip': null,
    },

    observe: {
        'entity': 'entityChanged',
        'curClipIdx': 'curClipIdxChanged',
    },

    ready: function () {
        this._initResizable();
        this.$.modes.select(0);

        this.animations = [];
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
            var result = this.clip.frames.some( function ( frame ) {
                return frame.component === item.compName &&
                    frame.property === item.propName;
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
            this.animations = [];
            return;
        }

        var animComp = this.entity.getComponent(Fire.Animation);
        if ( !animComp ) {
            this.animations = [];
            return;
        }

        this.animations = animComp.animations.map( function ( item, index ) {
            return { name: item.name, value: index };
        });
        if ( this.animations.length > 0 ) {
            this.curClipIdx = 0;
        }
    },

    curClipIdxChanged: function () {
        this.fire('clip-index-changed', { index: this.curClipIdx });
    },

}, EditorUI.resizable));
