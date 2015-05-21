Polymer({
    publish: {
        bezier: [],
    },

    svg: null,
    bezierBinding: '',
    selectCurves: [],
    typeIndex: 0,
    move: false,
    _previewProgress: 0,
    _stopPreview: false,

    curves: [
        {
            name: 'Linear',
            items: [
                {
                    name: 'Default',
                    value: [0.5,0.5,0.5,0.5],
                },
            ],
        },
        {
            name: 'Ease In',
            items: [
                {
                    name: 'Cubic',
                    value: [0.4,0,0.5,0.5],
                },
                {
                    name: 'Quad',
                    value: [0.55,0.08,0.68,0.53],
                },
                {
                    name: 'Quart',
                    value: [0.89,0.03,0.68,0.21],
                },
                {
                    name: 'Quint',
                    value: [0.75,0.05,0.85,0.06],
                },
                {
                    name: 'Sine',
                    value: [0.48,0,0.73,0.71],
                },
                {
                    name: 'Expo',
                    value: [0.95,0.04,0.79,0.03],
                },
                {
                    name: 'Circ',
                    value: [0.6,0.04,0.98,0.33],
                },
            ],
        },

        {
            name: 'Ease Out',
            items: [
                {
                    name: 'Cubic',
                    value: [0.06,0.12,0.58,1],
                },
                {
                    name: 'Quad',
                    value: [0.25,0.46,0.45,0.95],
                },
                {
                    name: 'Quart',
                    value: [0.16,0.84,0.43,1],
                },
                {
                    name: 'Quint',
                    value: [0.22,1,0.31,1],
                },
                {
                    name: 'Sine',
                    value: [0.39,0.59,0.56,1],
                },
                {
                    name: 'Expo',
                    value: [0.18,1,0.22,1],
                },
                {
                    name: 'Circ',
                    value: [0.08,0.82,0.01,1],
                },
            ],
        },
        {
            name: 'Ease in out',
            items: [
                {
                    name: 'Cubic',
                    value: [0.42,0,0.58,1],
                },
                {
                    name: 'Quad',
                    value: [0.48,0.04,0.52,0.96],
                },
                {
                    name: 'Quart',
                    value: [0.83,0,0.17,1],
                },
                {
                    name: 'Quint',
                    value: [0.94,0,0.06,1],
                },
                {
                    name: 'Sine',
                    value: [0.46,0.05,0.54,0.95],
                },
                {
                    name: 'Expo',
                    value: [1,0,0,1],
                },
                {
                    name: 'Circ',
                    value: [0.86,0.14,0.14,0.86],
                },
            ],
        },
        {
            name: 'Back',
            items: [
                {
                    name: 'Forward',
                    value: [0.18,0.89,0.31,1.21],
                },
                {
                    name: 'Reverse',
                    value: [0.6,-0.27,0.73,0.04],
                },
            ],
        },
    ],

    domReady: function () {
        this.svg = this.$.svg;
        this.distance = this.$.curve.getBoundingClientRect().width - 1;
        this.ofX = this.$.curve.offsetLeft;
        this.ofY = this.$.curve.offsetTop;
        if ( this.bezier.length === 0) {
            this.selectCurves = this.curves[0].items[0].value;
            this.changeBezierType(0);
        }else {
            this.loadCustomBezier();
            this.drawBezier();
        }
        this.playPreview();
    },

    changeBezier: function(event) {
        var ele = event.target;
        for (var i = 0; i < ele.parentElement.children.length; i++) {
            ele.parentElement.children[i].removeAttribute('active');
            if (ele === ele.parentElement.children[i]) {
                this.bezier = this.curves[this.typeIndex].items[i].value.slice(0);
                ele.parentElement.children[i].setAttribute('active','');
                this.drawBezier();
            }
        }
    },

    changeBezierType: function (index) {
        this.typeIndex = index;
        if (!index) {
            this.selectCurves = this.curves[0].items.slice(0);
            return;
        }
        this.selectCurves = this.curves[index].items.slice(0);
    },

    curveTypeClickAction: function (event) {
        var ele = event.target;
        for (var i = 0; i < ele.parentElement.children.length; i++) {
            ele.parentElement.children[i].removeAttribute('select');
            if (ele === ele.parentElement.children[i]) {
                this.changeBezierType(i-1);
                this.typeIndex = i-1;
                ele.setAttribute('select','');
            }
        }
    },

    drawBezier: function () {
        if (this.bezier === []) {
            return;
        }
        this.$.svg.innerHTML = '';
        var realBezier = this.realCoord(this.bezier);

        var svgns = "http://www.w3.org/2000/svg";
        var slash = this.drawLine(this.distance + this.ofX,this.ofY,'#3e3e3e',true);
        var path = document.createElementNS(svgns,"path");
        var d = this.getPath(realBezier);

        path.setAttribute("d", d);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#e2e2e2");
        this.$.svg.appendChild(path);

        var line1 = this.drawLine(realBezier[0],realBezier[1],'#2c7dfd',true);
        var line2 = this.drawLine(realBezier[2],realBezier[3],'#2c7dfd',false);

        var spoint = this.drawRect(this.ofX,this.ofY + this.distance);
        var epoint = this.drawRect(this.ofX + this.distance,this.ofY);

        var c1point = this.drawPoint(realBezier[0],realBezier[1]);

        var c2point = this.drawPoint(realBezier[2],realBezier[3]);

        c1point.onmousedown = function () {
            this.move = true;
            this.onmousemove = function (event) {
                if (this.move) {
                    this.$.svg.style.cursor = 'all-scroll';
                    var x = event.clientX - this.$.curve.getBoundingClientRect().left + this.ofX;
                    var y = event.clientY - this.$.curve.getBoundingClientRect().top + this.ofY;
                    c1point.setAttribute("cx",x);
                    c1point.setAttribute("cy",y);
                    line1.setAttribute('x2',x);
                    line1.setAttribute('y2',y);
                    realBezier[0] = x;
                    this.bezier[0] = (x - this.ofX) / this.distance;
                    realBezier[1] = y;
                    this.bezier[1] = 1 - ((y - this.ofY) / this.distance);
                    path.setAttribute("d", this.getPath(realBezier));
                    this.updateValue();
                }
            };
            this.onmouseup = function () {
                this.$.svg.style.cursor = 'default';
                this.move = false;
            };
        }.bind(this);

        c2point.onmousedown = function () {
            this.move = true;
            this.onmousemove = function (event) {
                if (this.move) {
                    this.$.svg.style.cursor = 'all-scroll';
                    var x = event.clientX - this.$.curve.getBoundingClientRect().left + this.ofX;
                    var y = event.clientY - this.$.curve.getBoundingClientRect().top + this.ofY;
                    c2point.setAttribute("cx",x);
                    c2point.setAttribute("cy",y);
                    line2.setAttribute('x2',x);
                    line2.setAttribute('y2',y);
                    realBezier[2] = x;
                    this.bezier[2] = (x - this.ofX) / this.distance;
                    realBezier[3] = y;
                    this.bezier[3] = 1 - ( (y - this.ofY) / this.distance);
                    path.setAttribute("d", this.getPath(realBezier));
                    this.updateValue();
                }
            };

            this.onmouseup = function () {
                this.$.svg.style.cursor = 'default';
                this.move = false;
            };
        }.bind(this);
        this.updateValue();
    },

    realCoord: function (bezier) {
        var realCoord = [
            bezier[0] * this.distance + this.ofX,
            (1 - bezier[1]) * this.distance + this.ofY,
            bezier[2] * this.distance + this.ofX,
            (1 - bezier[3]) * this.distance + this.ofY,
        ];
        return realCoord;
    },

    getPath: function (points)　{
        var dstart = "M"+ this.ofX + ',' + (this.ofY + this.distance) + ' ';
        var controlPoint = "C" + points[0]
                        + ',' + points[1] + ','
                        + points[2] + ','
                        + points[3] + ','
                        + (this.ofX + this.distance) + ',' + (this.ofY) + ' ';
        var p = dstart + controlPoint;
        return p;
    },

    drawPoint: function (cx,cy) {
        var svgns = "http://www.w3.org/2000/svg";
        var point = document.createElementNS(svgns,"circle");
        point.setAttribute("cx",cx);
        point.setAttribute("cy",cy);
        point.setAttribute("r","3");
        point.setAttribute("fill","#454544");
        point.setAttribute("stroke","white");
        point.setAttribute("class","point");
        this.svg.appendChild(point);
        return point;
    },

    drawRect: function (x,y) {
        var svgns = "http://www.w3.org/2000/svg";
        var rect = document.createElementNS(svgns,"rect");
        rect.setAttribute("x",x - 2.5);
        rect.setAttribute("y",y - 2.5);
        rect.setAttribute("width","5");
        rect.setAttribute("height","5");
        rect.setAttribute("stroke","#2f8bf5");
        rect.setAttribute("fill","white");
        this.svg.appendChild(rect);
        return rect;
    },

    drawLine: function (x,y,color,first)　{
        var svgns = "http://www.w3.org/2000/svg";
        var line = document.createElementNS(svgns,"line");
        if (first) {
            line.setAttribute("x1",this.ofX);
            line.setAttribute("y1",this.ofY + this.distance);
        }
        else {
            line.setAttribute("x1",this.ofX + this.distance);
            line.setAttribute("y1",this.ofY);
        }

        line.setAttribute("x2",x);
        line.setAttribute("y2",y);
        line.setAttribute("stroke",color);
        line.setAttribute("fill","transparent");
        line.setAttribute("stroke-width","1");
        this.svg.appendChild(line);
        return line;
    },

    updateValue: function () {
        this.bezierBinding = [
            this.bezier[0].toFixed(2),
            this.bezier[1].toFixed(2),
            this.bezier[2].toFixed(2),
            this.bezier[3].toFixed(2),
        ];
    },

    selectCurvesChanged: function () {
        this.$.btnGrp.innerHTML = '';
        for (var item in this.selectCurves) {
            var btns = document.createElement('div');
            btns.className = 'btn_item';
            if (item === '0' ) {
                btns.setAttribute('active','');
            }
            btns.addEventListener('click',function(event) {
                this.changeBezier(event);
            }.bind(this));
            btns.innerHTML = this.selectCurves[item].name;
            this.$.btnGrp.appendChild(btns);
        }
        this.$.beziers.children[this.typeIndex + 1].setAttribute('select','');
        this.bezier = this.curves[this.typeIndex].items[0].value.slice(0);
        this.drawBezier();
    },

    loadCustomBezier: function () {
        this.$.btnGrp.innerHTML = '';
        var btns = document.createElement('div');
        btns.className = 'btn_item';
        btns.setAttribute('active','');
        btns.innerHTML = 'Custom';
        this.$.btnGrp.appendChild(btns);
    },

    setBezier: function (bezier) {
        this.loadCustomBezier();
        this.bezier = bezier.slice(0);
        this.drawBezier();
    },

    updateAnimate: function () {
        if (this._stopPreview) {
            this.$.animate1.style.bottom = -1;
            this.$.animate2.style.left = -1;
            this._previewProgress = 0;
            return;
        }

        window.requestAnimationFrame(function() {
            if (this._previewProgress >= 1) {
                this._previewProgress = 0;
            }

            var coord = this.bezierToCoord(this.bezier,this._previewProgress);
            this.$.animate1.style.bottom = coord.y * this.distance;
            this.$.animate2.style.left = coord.x * this.distance;
            this._previewProgress += 0.008;
            this.updateAnimate();
        }.bind(this));
    },

    playPreview: function() {
        this._stopPreview = false;
        this.updateAnimate();
    },

    stopPreview: function () {
        this._stopPreview = true;
    },

    bezierToCoord: function (cp,t) {
        function Point2D(x,y){
            this.x=x||0.0;
            this.y=y||0.0;
        }

        var ax, bx, cx;
        var ay, by, cy;
        var tSquared, tCubed;

        cx = 3.0 * cp[0];
        bx = 3.0 * (cp[2] - cp[0]) - cx;
        ax = 1 - cx - bx;

        cy = 3.0 * (cp[1]);
        by = 3.0 * (cp[3] - cp[1]) - cy;
        ay = 1 - cy - by;

        var x = (ax * Math.pow(t,2) * t) + (bx * Math.pow(t,2)) + (cx * t) + 0,
            y = (ay * Math.pow(t,2) * t) + (by * Math.pow(t,2)) + (cy * t) + 0;

        return new Point2D(x,y);
    }

});
