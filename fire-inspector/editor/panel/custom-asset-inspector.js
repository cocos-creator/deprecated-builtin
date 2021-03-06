Polymer({
    created: function () {
        this.asset = null;
        this.meta = null;
        this.saving = false;

        this._timeout = null;
    },

    save: function () {
        this.saving = true;

        if ( this._timeout ) {
            clearTimeout( this._timeout );
            this._timeout = null;
        }

        this._timeout = setTimeout ( function () {
            Editor.AssetDB.saveByUuid( this.meta.uuid, Editor.serialize(this.asset) );
        }.bind(this), 500);
    },

    metaChanged: function () {
        this.saving = false;
        if ( this._timeout ) {
            clearTimeout( this._timeout );
            this._timeout = null;
        }

        Fire.AssetLibrary.loadAssetInEditor( this.meta.uuid, function ( err, asset ) {
            if ( !(asset instanceof Fire.CustomAsset) ) {
                Fire.error( 'The asset is corrupted!' );
            }

            if ( asset && this.meta.uuid === asset._uuid ) {
                this.asset = asset;
                this.assetClassName = Fire.JS.getClassName(asset);

                this.$.fields.target = this.asset;
                this.$.fields.refresh();
            }
        }.bind(this) );
    },

    fieldsChangedAction: function ( event ) {
        event.stopPropagation();

        if ( this.asset ) {
            this.asset.dirty = true;
            this.save();
        }
    },

    // applyAction: function ( event ) {
    //     event.stopPropagation();
    //     Editor.sendToCore('asset-db:apply',
    //                     Editor.serialize(this.meta),
    //                     Editor.serialize(this.asset)
    //                    );
    // },

    // revertAction: function ( event ) {
    //     event.stopPropagation();
    //     this.fire('reload');
    // },
});
