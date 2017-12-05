var $ = require("wiki-common:widget/lib/jquery/jquery.js");
var Mapper = function (t, n) {
    var e = {
        fillColor: "#52a3f5",
        strokeColor: "#b1d9fc",
        strokeWidth: 1,
        width: 0,
        height: 0,
        scale: 1,
        translate: [0, 0],
        fontSize: 11,
        fontColor: "#1a6bbc",
        fontFamily: "SimSun",
        marginLeft: 0,
        marginTop: 0
    };
    var a = {handleLoadProvince: null, handleLoadCity: null, handleLoadCounty: null};
    this.config = e, $.extend(e, t), $.extend(a, n);
    var i = this, o = null, r = null, l = null, d = null, h = null, c = null, u = null,
        s = Map.createElement("svg"),
        v = Map.createElement("g"),
        f = function () {
            s.setAttribute("width", "100%");
            s.setAttribute("height", "100%");
            s.appendChild(v);
            v.setAttribute("transform", "scale(1,1) translate(" + e.marginLeft + "," + e.marginTop + ")");
            o = new MapLayer(e, {
                handleAreaClick: function (t) {
                    var n = t.attr("key");
                    i.loadCity(n)
                },
                level: 1
            });
            r = new MapLayer(e, {
                handleAreaClick: function (t) {
                    var n = t.attr("key");
                    i.loadCounty(n)
                }, level: 2
            });
            l = new MapLayer(e, {
                handleAreaClick: function (t) {
                    t.attr("key")
                }, level: 3
            });
            d = new PointLayer(e, {});
            o.appendTo(v);
            r.appendTo(v);
            l.appendTo(v);
            d.appendTo(v);
        };
    this.appendTo = function (t) {
        t.appendChild(s)
    };
    var g = function (t) {
        var n = t.right - t.left, a = t.bottom - t.top;
        return n > a ? e.width / n : e.height / a
    };
    this.zoom = function (t, n) {
        o.zoom(t, n), r.zoom(t, n), l.zoom(t, n), d.zoom(t, n), e.scale = t
    };
    this.getScale = function () {
        return e.scale
    };
    var p = function (t, n) {
        $.getJSON("/cms/s/chinamap/" + t, n)
    };
    this.load = function () {
        p("china.json", function (t) {
            h = t;
            p("province.json", function (t) {
                for (var n in t) {
                    var e = o.convertToXYList(t[n]);
                    $.extend(h[n], e);
                    var i = o.draw(h[n]);
                    i.setAttribute("key", n)
                }
                !!a.handleLoadProvince && a.handleLoadProvince()
            })
        })
    };
    var y = function (t) {
        if (!t)return 0;
        var n = 0;
        for (var e in t)n++;
        return n
    };
    this.loadCity = function (t) {
        var n = h[t].list;
        y(n) <= 0 || p(t + ".json", function (o) {
            r.clear();
            for (var l in o) {
                var d = r.convertToXYList(o[l]);
                $.extend(n[l], d);
                var u = r.draw(n[l]);
                u.setAttribute("key", l)
            }
            var s = h[t].center,
                v = g(h[t].range),
                f = [e.width / 2 - s[0] - (e.width * v / 2 - e.width / 2) / v, e.height / 2 - s[1] - (e.height * v / 2 - e.height / 2) / v];
            i.zoom(v, f), c = h[t], !!a.handleLoadCity && a.handleLoadCity(c)
        })
    };
    this.loadCounty = function (t) {
        var n = c.list[t].list;
        y(n) <= 0 || p(c.code + "/" + t + ".json", function (o) {
            l.clear();
            for (var r in o) {
                var d = l.convertToXYList(o[r]);
                $.extend(n[r], d);
                var h = l.draw(n[r]);
                h.setAttribute("key", r)
            }
            var s = c.list[t].center, v = g(c.list[t].range), f = [e.width / 2 - s[0] - (e.width * v / 2 - e.width / 2) / v, e.height / 2 - s[1] - (e.height * v / 2 - e.height / 2) / v];
            i.zoom(v, f), u = c.list[t], !!a.handleLoadCounty && !!a.handleLoadCounty(c, u)
        })
    };
    this.backToProvince = function () {
        var t = c.code, n = h[t].center, o = g(h[t].range), r = [e.width / 2 - n[0] - (e.width * o / 2 - e.width / 2) / o, e.height / 2 - n[1] - (e.height * o / 2 - e.height / 2) / o];
        i.zoom(o, r), c = h[t], l.clear(), !!a.handleLoadCity && a.handleLoadCity(c)
    };
    this.backToChina = function () {
        l.clear(), r.clear(), i.zoom(1, [0, 0]), !!a.handleLoadProvince && a.handleLoadProvince()
    };
    this.addPoint = function (t) {
        var n = o.convertToXY(t.lat, t.lng);
        return t.left = n[0], t.top = n[1], d.addPoint(t)
    };
    this.clearPoint = function () {
        d.clearPoint()
    };
    f();
};