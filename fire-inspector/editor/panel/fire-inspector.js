var Path = require('fire-path');
var Url = require('fire-url');

Polymer({
    created: function () {
        this.target = null;
        this.icon = new Image();
        this.icon.src = "fire://static/img/plugin-inspector.png";

        this.ipc = new Editor.IpcListener();
    },

    attached: function () {
        Editor.mainWindow.$.inspector = this;

        // register Ipc
        this.ipc.on('selection:activated', this._onInspect.bind(this) );
    },

    detached: function () {
        Editor.mainWindow.$.inspector = null;

        this.ipc.clear();
    },

    'asset:changed': function ( event ) {
        var uuid = event.detail.uuid;
        if ( this.target && this.target.uuid === uuid ) {
            var reloadMeta = true;

            // NOTE: we don't need to reload custom-asset if it is auto-saved
            if ( this.target instanceof Editor.CustomAssetMeta ) {
                if ( this.$.inspector.asset && this.$.inspector.asset.dirty ) {
                    this.$.inspector.asset.dirty = false;
                    reloadMeta = false;
                }
            }

            //
            if ( reloadMeta ) {
                var metaJson = Editor.AssetDB.loadMetaJson(uuid);
                Fire.AssetLibrary.loadMeta(metaJson, function ( err, meta ) {
                    this.inspect(meta,true);
                }.bind(this));
            }
        }
    },

    'asset:moved': function ( event ) {
        var uuid = event.detail.uuid;
        var destUrl = event.detail['dest-url'];
        if ( this.target && this.target.uuid === uuid ) {
            if ( this.$.inspector.asset ) {
                this.$.inspector.asset.name = Url.basenameNoExt(destUrl);
            }
        }
    },

    'asset:saved': function ( event ) {
        var url = event.detail.url;
        var uuid = event.detail.uuid;

        if ( this.target && this.target.uuid === uuid ) {
            if ( this.$.inspector.saving !== undefined ) {
                this.$.inspector.saving = false;

                if ( this.$.inspector.asset && this.$.inspector.asset.dirty ) {
                    this.$.inspector.asset.dirty = false;
                }
            }
        }
    },

    'component:added': function ( event ) {
        var entityId = event.detail['entity-id'];
        var compId = event.detail['component-id'];
        this._onEntityDirty( entityId, compId );
    },

    'component:removed': function ( event ) {
        var entityId = event.detail['entity-id'];
        var compId = event.detail['component-id'];
        this._onEntityDirty( entityId, compId );
    },

    _onInspect: function ( type, id ) {
        if (type === 'entity') {
            if (id) {
                var entity = Editor.getInstanceById(id);
                if (entity) {
                    this.inspect(entity);
                }
                else {
                    this.inspect(null);
                }
            }
            else if (this.target instanceof Fire.Entity) {
                // uninspect
                this.inspect(null);
            }
        }
        else if (type === 'asset') {
            if (id) {
                this.lastUuid = id;
                var metaJson = Editor.AssetDB.loadMetaJson(id);
                // Checks whether last uuid modified to ensure call stack not suspended by another ipc event
                // This may occurred after ipc sync invocation such as AssetDB.xxx
                if (metaJson && this.lastUuid === id) {
                    // one frame dely to make sure mouse right click event (contextmenu popup) will not suspend the rendering
                    setImmediate(function (metaJson) {
                        // Only inspect the lastest one
                        if (this.lastUuid === id) {
                            Fire.AssetLibrary.loadMeta(metaJson, function ( err, meta ) {
                                this.inspect(meta);
                            }.bind(this));
                        }
                    }.bind(this, metaJson));
                }
            }
            else if (this.target instanceof Editor.AssetMeta) {
                // uninspect
                this.inspect(null);
            }
        }
    },

    _onEntityDirty: function ( entityID, componentID ) {
        if ( this.target && this.target.id === entityID ) {
            var entity = Editor.getInstanceById(entityID);
            if (entity) {
                this.$.inspector.refresh();
            }
        }
    },

    inspect: function ( obj, force ) {
        //
        if ( !force ) {
            //
            if ( this.target === obj ) {
                return;
            }

            //
            if ( this.target instanceof Editor.AssetMeta && obj instanceof Editor.AssetMeta ) {
                if ( this.target.uuid === obj.uuid ) {
                    return;
                }
            }
        }
        if ( obj && obj.constructor === Editor.AssetMeta ) {
            // unknown asset
            obj = null;
        }
        //
        if ( this.target ) {
            Editor.observe(this.target,false);
        }
        if ( obj ) {
            Editor.observe(obj,true);
        }

        var isTargetCustom = this.target instanceof Editor.CustomAssetMeta;
        var isObjCustom = obj instanceof Editor.CustomAssetMeta;

        if ( isTargetCustom && isObjCustom ) {
            this.target = this.$.inspector.meta = obj;
        }
        else if ( this.target instanceof Editor.AssetMeta && obj instanceof Editor.AssetMeta &&
                 !isTargetCustom && !isObjCustom )
        {
            this.target = this.$.inspector.meta = obj;
        }
        else if ( this.target instanceof Fire.Entity && obj instanceof Fire.Entity ) {
            this.target = this.$.inspector.target = obj;
        }
        else {
            while ( this.firstElementChild ) {
                this.removeChild(this.firstElementChild);
            }
            if ( obj instanceof Editor.AssetMeta ) {
                if ( obj instanceof Editor.CustomAssetMeta ) {
                    this.$.inspector = new CustomAssetInspector();
                    this.target = this.$.inspector.meta = obj;
                }
                else {
                    this.$.inspector = new ImporterInspector();
                    this.target = this.$.inspector.meta = obj;
                }
            }
            else if ( obj instanceof Fire.Entity ) {
                this.$.inspector = new EntityInspector();
                this.target = this.$.inspector.target = obj;
            }
            else {
                this.$.inspector = null;
                this.target = null;
                return;
            }
            this.$.inspector.setAttribute('fit','');
            this.appendChild(this.$.inspector);
        }
    },

    reloadAction: function ( event ) {
        event.stopPropagation();

        if ( this.target && this.target instanceof Editor.AssetMeta ) {
            var metaJson = Editor.AssetDB.loadMetaJson(this.target.uuid);
            Fire.AssetLibrary.loadMeta(metaJson, function ( err, meta ) {
                this.inspect(meta,true);
            }.bind(this));
        }
    },

    resizeAction: function ( event ) {
        if ( this.$.inspector && this.$.inspector.resize ) {
            var old = this.style.display;
            this.style.display = "";

            this.$.inspector.resize();

            this.style.display = old;
        }
    },

    showAction: function ( event ) {
        if ( this.$.inspector && this.$.inspector.repaint ) {
            this.$.inspector.repaint();
        }
    },
});
