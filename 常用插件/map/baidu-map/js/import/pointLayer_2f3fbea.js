var PointLayer = function (t, i) {
    Map.call(this);
    $.extend(this.config, t);
    $.extend(this.handler, i);
    var e = this;
    var s = function () {
        e.createCanvas()
    };
    this.zoom = function (t, i) {
        this.zoomCanvas(t, i), this.clearPoint()
    };
    this.addPoint = function (t) {
        var i = Map.createElement("image");
        return i.setAttribute("width", t.width / this.config.scale),
            i.setAttribute("height", t.height / this.config.scale),
            i.setAttribute("x", t.left - t.width / (2 * this.config.scale)),
            i.setAttribute("y", t.top - t.height / (2 * this.config.scale)),
            i.href.baseVal = t.src, this.canvas.appendChild(i), i
    };
    this.clearPoint = function () {
        for (; this.canvas.childNodes.length > 0;)this.canvas.removeChild(this.canvas.childNodes[0])
    };
    s();
};