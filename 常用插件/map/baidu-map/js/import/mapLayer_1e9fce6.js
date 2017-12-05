var $ = require("wiki-common:widget/lib/jquery/jquery.js");
var MapLayer = function (t, e) {
    Map.call(this);
    $.extend(this.config, t), $.extend(this.handler, e), this.textGroup = null;
    var a = this;
    var n = function () {
        a.createCanvas();
        a.createTextGroup();
        $(a.canvas).bind("click", function (t) {
            var e = $(t.target), n = e.attr("key");
            n && a.handler.handleAreaClick(e)
        })
    };
    this.createTextGroup = function () {
        this.canvas.setAttribute("class", "layer"),
            1 == this.handler.level ? this.canvas.setAttribute("class", "layer level1") :
                2 == this.handler.level ? this.canvas.setAttribute("class", "layer level2") :
                3 == this.handler.level && this.canvas.setAttribute("class", "layer level3"),
            this.canvas.setAttribute("font-size", this.config.fontSize / this.config.scale),
            this.canvas.setAttribute("font-family", this.config.fontFamily)
    };
    this.appendTo = function (t) {
        return t.appendChild(this.canvas), a
    };
    this.zoom = function (t, e) {
        this.zoomCanvas(t, e);
        for (var a = this.canvas.getElementsByTagName("text"), n = 0; n < a.length; n++) {
            var i = parseFloat(a[n].getAttribute("ox")), r = parseFloat(a[n].getAttribute("oy"));
            a[n].setAttribute("x", i * t), a[n].setAttribute("y", r * t), a[n].setAttribute("transform", "scale(" + 1 / t + "," + 1 / t + ")")
        }
    };
    this.draw = function (t) {
        var e = Map.createElement("g"), a = this.drawCanvas(t);
        t.textCenter && !t.loaded && (t.textCenter = this.convertToXY(t.textCenter[0], t.textCenter[1]), t.loaded = !0);
        var n = this.drawText(decodeURIComponent(t.name), t.textCenter ? t.textCenter : t.center, t.code);
        return e.appendChild(a), e.appendChild(n), this.canvas.appendChild(e), a
    };
    this.drawText = function (t, e, a) {
        var n = Map.createElement("text");
        return n.setAttribute("x", e[0]), n.setAttribute("y", e[1]), n.setAttribute("ox", e[0]), n.setAttribute("oy", e[1]), n.textContent = t, n.setAttribute("key", a), n
    };
    n()
};