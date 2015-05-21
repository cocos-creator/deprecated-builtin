Polymer({
    publish: {
        asset: null,
        meta: null,
    },

    info: "Unkown",
    rawTexture: null,

    created: function () {
        this.lines = [];
    },

    domReady: function () {
    },

    resize: function () {
        if ( !this.asset)
            return;

        var contentRect = this.$.content.getBoundingClientRect();
        var result = Fire.fitSize( this.asset.width,
                                   this.asset.height,
                                   contentRect.width,
                                   contentRect.height );
        this.$.canvas.width = result[0];
        this.$.canvas.height = result[1];

        //
        this.repaint();
    },

    repaint: function () {
        var ctx = this.$.canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;

        if ( this.asset instanceof Fire.Texture ) {
            ctx.drawImage( this.asset.image, 0, 0, this.$.canvas.width, this.$.canvas.height );

            var xRatio = this.$.canvas.width / this.asset.width;
            var yRatio = this.$.canvas.height / this.asset.height;

            if ( this.meta.subRawData ) {
                if ( this.meta.type === Fire.TextureType.Sprite ) {
                    //for ( var subInfo of this.meta.subRawData ) {
                    this.meta.subRawData.forEach(function(subInfo) {
                        if ( subInfo.asset instanceof Fire.Sprite ) {
                            ctx.beginPath();
                            ctx.rect( subInfo.asset.trimX * xRatio,
                                      subInfo.asset.trimY * yRatio,
                                      subInfo.asset.width * xRatio,
                                      subInfo.asset.height * yRatio );
                            ctx.lineWidth = 1;
                            ctx.strokeStyle = '#ff00ff';
                            ctx.stroke();
                        }
                    });
                }
            }
        }
        else if ( this.asset instanceof Fire.Sprite ) {
            if ( this.rawTexture ) {
                ctx.drawImage( this.rawTexture.image,
                              this.asset.trimX, this.asset.trimY, this.asset.width, this.asset.height,
                              0, 0, this.$.canvas.width, this.$.canvas.height
                             );
            }

            this.$.dragleft.style.display = 'block';
            this.$.dragtop.style.display = 'block';
            this.$.dragbottom.style.display = 'block';
            this.$.dragright.style.display = 'block';
            
            this.updateLine();
        }
    },

    assetChanged: function () {
        this.info = this.asset.width + " x " + this.asset.height;
        this.rawTexture = null;
        this.resize();

        if ( this.asset instanceof Fire.Sprite ) {
            Fire.AssetLibrary.loadAssetInEditor( this.meta.rawTextureUuid, function ( err, rawTexture ) {
                this.rawTexture = rawTexture;
                this.repaint();
            }.bind(this) );

            return;
        }
    },

    updateLine: function () {
        var left = (this.getBoundingClientRect().width - (this.$.canvas.getBoundingClientRect().width/this.asset.width * this.asset.width)) / 2;
        var top = (this.getBoundingClientRect().height - (this.$.canvas.getBoundingClientRect().height/this.asset.height * this.asset.height)) / 2;

        var drawWidth = this.$.canvas.getBoundingClientRect().width /this.asset.width * this.asset.width;
        var drawHeight = this.$.canvas.getBoundingClientRect().height/this.asset.height * this.asset.height;

        var xRatio = this.$.canvas.width / this.asset.width;
        var yRatio = this.$.canvas.height / this.asset.height;

        var lastTop = this.asset.borderTop;
        var lastleft = this.asset.borderLeft;
        var lastBottom = this.asset.borderBottom;
        var lastRight = this.asset.borderRight;

        this.$.dragleft.style.height = drawHeight;
        this.$.dragleft.style.left = left + (lastleft * xRatio);
        this.$.dragleft.style.top = top;

        this.$.dragtop.style.top = top + (lastTop * yRatio);
        this.$.dragtop.style.width = drawWidth;
        this.$.dragtop.style.left = left;

        this.$.dragbottom.style.right = left;
        this.$.dragbottom.style.top = top + this.$.canvas.getBoundingClientRect().height - (lastBottom * yRatio) ;
        this.$.dragbottom.style.width = drawWidth;

        this.$.dragright.style.top = top;
        this.$.dragright.style.left = left + this.$.canvas.getBoundingClientRect().width - (lastRight * xRatio);
        this.$.dragright.style.height = drawHeight;
    },

    drawDragCircle: function (event) {
        event.stopPropagation();
        var direction = event.toElement.parentElement;
        EditorUI.addDragGhost("normal");
        var left = (this.getBoundingClientRect().width - (this.$.canvas.getBoundingClientRect().width/this.asset.width * this.asset.width)) / 2;
        var top = (this.getBoundingClientRect().height - (this.$.canvas.getBoundingClientRect().height/this.asset.height * this.asset.height)) / 2;

        var lastTop = this.asset.borderTop;
        var lastleft = this.asset.borderLeft;
        var lastBottom = this.asset.borderBottom;
        var lastRight = this.asset.borderRight;

        var eleTop = direction.getBoundingClientRect().top - this.$.canvas.getBoundingClientRect().top;
        var eleLeft = direction.getBoundingClientRect().left - this.$.canvas.getBoundingClientRect().left;
        var eleRight = direction.getBoundingClientRect().left - this.getBoundingClientRect().left;
        var eleBottom = direction.getBoundingClientRect().top - this.getBoundingClientRect().top;

        var xRatio = this.$.canvas.width / this.asset.width;
        var yRatio = this.$.canvas.height / this.asset.height;

        var mousemoveHandle = function (event) {
            var dx = event.clientX - this._lastClientX;
            var dy = event.clientY - this._lastClientY;
            switch (direction.id) {
                case 'dragtop':
                    if (lastTop + (dy / yRatio) <= 0) {
                        direction.style.top = top;
                        this.asset.borderTop = 0;
                        return;
                    }
                    else if (lastTop + (dy / yRatio) >= this.asset.height) {
                        direction.style.top = top + this.$.canvas.getBoundingClientRect().height;
                        this.asset.borderTop = this.asset.height;
                        return;
                    }
                    direction.style.top = eleTop + top + dy;
                    this.asset.borderTop = lastTop + (dy / yRatio);
                break;
                case 'dragbottom':
                    if (lastBottom - (dy / yRatio) <= 0) {
                        direction.style.top = top + this.$.canvas.getBoundingClientRect().height;
                        this.asset.borderBottom = 0;
                        return;
                    }
                    else if (lastBottom - (dy / yRatio) >= this.asset.height) {
                        direction.style.top = top;
                        this.asset.borderBottom = this.asset.height;
                        return;
                    }
                    direction.style.top = eleBottom + dy;
                    this.asset.borderBottom = lastBottom - (dy / yRatio);
                break;

                case 'dragleft':
                    if(lastleft + (dx / xRatio) <= 0) {
                        direction.style.left = left;
                        this.asset.borderLeft = 0;
                        return;
                    }
                    else if (lastleft + (dx / xRatio) >= this.asset.width) {
                        direction.style.left = left + this.$.canvas.getBoundingClientRect().width;
                        this.asset.borderLeft = this.asset.width;
                        return;
                    }
                    direction.style.left = eleLeft + dx + left;
                    this.asset.borderLeft = lastleft + (dx / xRatio);
                break;

                case 'dragright':
                    if (lastRight - (dx / xRatio) <= 0) {
                        direction.style.left = left + this.$.canvas.getBoundingClientRect().width;
                        this.asset.borderRight = 0;
                        return;
                    }
                    else if (lastRight - (dx / xRatio) >= this.asset.width) {
                        direction.style.left = left;
                        this.asset.borderRight = this.asset.width;
                        return;
                    }
                    direction.style.left = eleRight + dx;
                    this.asset.borderRight = lastRight - (dx / xRatio);
                break;
            }
            this.asset.dirty = true;
        }.bind(this);

        var mouseupHandle = function (event) {
            document.removeEventListener('mousemove', mousemoveHandle);
            document.removeEventListener('mouseup', mouseupHandle);
            EditorUI.removeDragGhost();
        }.bind(this);

        this._lastClientX = event.clientX;
        this._lastClientY = event.clientY;
        document.addEventListener ( 'mousemove', mousemoveHandle );
        document.addEventListener ( 'mouseup', mouseupHandle );
    },
});
