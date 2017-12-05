var Map = function () {
    this.canvas = null,
        this.config = {
        fillColor: "#000000",
        strokeColor: "#fcfcfc",
        strokeWidth: 1,
        width: 0,
        height: 0,
        scale: 1,
        translate: [0, 0],
        fontSize: 12,
        fontColor: "#ffffff",
        fontFamily: "SimSun"
    },
        this.handler = {handleAreaClick: null, handleAfterZoom: null},
        this.createCanvas = function () {
            this.canvas = Map.createElement("g");
            this.canvas.setAttribute("class", "layer");
            this.canvas.setAttribute("fill", this.config.fillColor);
            this.canvas.setAttribute("stroke", this.config.strokeColor);
            this.canvas.setAttribute("stroke-width", this.config.strokeWidth);
        },
        this.appendTo = function (t) {
            t.appendChild(this.canvas)
        },
        this.convertToXY = function (t, e) {
            var a = 3600 * (Map.AREA.MAXLNG - Map.AREA.MINLNG) / this.config.width, n = 3600 * (Map.AREA.MAXLAT - Map.AREA.MINLAT) / this.config.height;
            return [3600 * (t - Map.AREA.MINLNG) / a, 3600 * (Map.AREA.MAXLAT - e) / n]
        },
        this.zoomCanvas = function (t, e) {
            this.config.scale = t,
                this.config.translate = e,
                this.canvas.setAttribute("transform", "scale(" + t + "," + t + ") translate(" + e[0] + "," + e[1] + ")"),
                this.canvas.setAttribute("stroke-width", this.config.strokeWidth / t)
        },
        this.convertToXYList = function (t) {
            for (var e = {
                range: {
                    left: this.config.width,
                    top: this.config.height,
                    right: 0,
                    bottom: 0
                }
            }, a = 0; a < t.length; a++)for (var n = 0; n < t[a].length; n++)t[a][n] = this.convertToXY(t[a][n][0], t[a][n][1]),
                Map.calcRange(e.range, t[a][n]);
            return e.center = Map.calcCenter(e.range), e.latLng = t, e
        },
        this.drawCanvas = function (t) {
            for (var e = t.latLng, a = [], n = Map.createElement("path"), i = 0; i < e.length; i++) {
                for (var o = 0; o < e[i].length; o++)a.push((0 == o ? "M" : "L") + e[i][o][0] + " " + e[i][o][1]);
                a.push("L" + e[i][0][0] + " " + e[i][0][1] + " Z")
            }
            return n.setAttribute("autoSize", !0), n.setAttribute("d", a.join(" ")), n
        },
        this.clear = function () {
            for (; this.canvas.childNodes.length > 0;)this.canvas.removeChild(this.canvas.childNodes[0])
        }
};
Map.AREA = {
    MAXLNG: 135.103684,
    MINLNG: 73.497551,
    MAXLAT: 53.568958,
    MINLAT: 18.121885
};
Map.MAP_RATE = 1.22;
Map.SVG_NS = "http://www.w3.org/2000/svg",
    Map.calcRange = function (t, e) {
    var a = e[0], n = e[1];
        t.right = a > t.right ? a : t.right;
        t.left = a < t.left ? a : t.left;
        t.top = n < t.top ? n : t.top;
        t.bottom = n > t.bottom ? n : t.bottom
};
Map.calcCenter = function (t) {
    return [(t.left + t.right) / 2, (t.top + t.bottom) / 2]
};
Map.createElement = function (t) {
    return document.createElementNS(Map.SVG_NS, t)
};