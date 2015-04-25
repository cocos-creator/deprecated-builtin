var Async = require('async');

Polymer(EditorUI.mixin({
    elementBG: null,
    elementSel: null,
    customBG: false,
    atlasBG: null,
    showCheckerboard: true,

    zoom: 1.0,
    highlighted: false,

    url: "",
    uuid: "",
    asset: null,
    meta: null,

    publish: {
        droppable: 'asset',
    },

    created: function () {
        this.elementBG = new Fire.Color( 0.1, 0.38, 1, 0.5 );
        this.elementSel = new Fire.Color(0,0,0,1);
        this.atlasBG = new Fire.Color(1,0,1,1);

        // init asset library
        Fire.AssetLibrary.init("library://");
    },

    domReady: function () {
        //
        this._initDroppable(this.$.view);
    },

    'panel:open': function ( detail ) {
        var uuid = detail.uuid;
        this.load(uuid);
    },

    'asset:changed': function ( detail ) {
        var uuid = detail.uuid;

        if ( this.uuid !== uuid ) {
            return;
        }

        this.load(uuid);
    },

    'fire-inspector:asset-dirty': function ( detail ) {
        var uuid = detail.uuid;
        var assetJson = detail.json;

        if ( this.uuid !== uuid ) {
            return;
        }

        var scope = this;
        Fire.AssetLibrary.loadJson(assetJson, function ( err, asset ) {
            scope.asset = asset;

            Async.each( scope.asset.sprites,
                       scope.loadRawTextureFromSprite,
                       function ( err ) {
                           if ( err ) {
                               Fire.error(err.message);
                               return;
                           }

                           scope.layoutAtlas();
                       } );
        }, true);
    },

    'fire-inspector:meta-dirty': function ( detail ) {
        var uuid = detail.uuid;
        var metaJson = detail.json;

        if ( this.uuid !== uuid ) {
            return;
        }

        var scope = this;
        Fire.AssetLibrary.loadJson(metaJson, function ( err, meta ) {
            scope.meta = meta;
            scope.layoutAtlas();
        }, true);
    },

    loadRawTextureFromSprite: function ( sprite, cb ) {
        var spriteMetaJson = Editor.AssetDB.loadMetaJson(sprite._uuid);
        var spriteMetaJsonObj = JSON.parse(spriteMetaJson);
        Fire.AssetLibrary.loadAssetInEditor( spriteMetaJsonObj.rawTextureUuid, function ( err, rawTexture ) {
            sprite.rawTexture = rawTexture;
            cb();
        });
    },

    load: function ( uuid ) {
        this.uuid = uuid;
        this.url = Editor.AssetDB.uuidToUrl(uuid);

        // load meta file
        var metaJson = Editor.AssetDB.loadMetaJson(this.uuid);
        var scope = this;

        //
        Async.waterfall([
            function ( next ) {
                Fire.AssetLibrary.loadMeta(metaJson, function ( err, meta ) {
                    scope.meta = meta;
                    next ();
                });
            },

            function ( next ) {
                Fire.AssetLibrary.loadAssetInEditor( scope.uuid, function ( err, asset ) {
                    scope.asset = asset;
                    next ();
                } );
            },

            function ( next ) {
                Async.each( scope.asset.sprites,
                            scope.loadRawTextureFromSprite,
                            function ( err ) {
                                next(err);
                            } );
            },

        ], function ( err ) {
            scope.resize();
            scope.repaint();
        });
    },

    layoutAtlas: function () {
        this.meta.layout(this.asset);
        this.resize();
        this.repaint();
    },

    resize: function () {
        this.$.canvas.width = this.asset.width;
        this.$.canvas.height = this.asset.height;
    },

    repaint: function () {
        var ctx = this.$.canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;

        ctx.clearRect( 0, 0, this.$.canvas.width, this.$.canvas.height );
        ctx.fillStyle = this.elementBG.toCSS('rgba');

        for ( var i = 0; i < this.asset.sprites.length; ++i ) {
            var sprite = this.asset.sprites[i];
            ctx.fillRect( sprite.x, sprite.y, sprite.rotatedWidth, sprite.rotatedHeight );

            if ( sprite.rotated ) {
                ctx.save();
                ctx.translate( sprite.x, sprite.y );
                ctx.rotate( Math.PI * 0.5 );
                ctx.drawImage( sprite.rawTexture.image,
                              sprite.trimX, sprite.trimY, sprite.width, sprite.height,
                              0, -sprite.height, sprite.width, sprite.height
                             );
                ctx.restore();
            }
            else {
                ctx.drawImage( sprite.rawTexture.image,
                              sprite.trimX, sprite.trimY, sprite.width, sprite.height,
                              sprite.x, sprite.y, sprite.width, sprite.height
                             );
            }
        }

    },

    elementBGChanged: function () {
        this.repaint();
    },

    atlasBGChanged: function () {
        this.repaint();
    },

    applyAction: function (event) {
        event.stopPropagation();

        Editor.AssetDB.apply({
            'meta-json': Editor.serializeMeta(this.meta),
            'asset-json': Editor.serialize(this.asset),
            'asset-dirty': true
        });
    },

    dropAreaEnterAction: function (event) {
        event.stopPropagation();
        this.highlighted = true;
    },

    dropAreaLeaveAction: function (event) {
        event.stopPropagation();
        this.highlighted = false;
    },

    dropAreaAcceptAction: function (event) {
        event.stopPropagation();
        this.highlighted = false;

        var scope = this;
        var sprites = [];

        Async.each( event.detail.dragItems, function ( uuid, dragitemCB ) {
            Fire.AssetLibrary.loadAssetInEditor( uuid, function ( err, asset ) {
                if ( asset instanceof Fire.Texture ) {
                    var metaJson = Editor.AssetDB.loadMetaJson(asset._uuid);
                    Fire.AssetLibrary.loadMeta(metaJson, function ( err, meta ) {
                        if ( meta.type === Fire.TextureType.Sprite ) {
                            for ( var i = 0; i < meta.subRawData.length; ++i ) {
                                var subInfo = meta.subRawData[i];
                                sprites.push(subInfo.asset);
                            }
                        }

                        dragitemCB ();
                    });

                    return;
                }

                if ( asset instanceof Fire.Sprite ) {
                    sprites.push(asset);
                    dragitemCB();
                    return;
                }

                Fire.warn('Can not accept asset ' + asset.name);
                dragitemCB();
            } );
        }, function ( err ) {
            if ( err ) {
                Fire.error(err.message);
                return;
            }

            Async.each( sprites, function ( sprite, spriteCB ) {
                            if ( scope.asset.add(sprite) === false ) {
                                Fire.warn( sprite.name + " already exists in atlas.");
                                spriteCB();
                                return;
                            }

                            scope.loadRawTextureFromSprite( sprite, spriteCB );
                        },
                        function ( err ) {
                            scope.layoutAtlas();
                        } );
        } );
    },
}, EditorUI.droppable));
