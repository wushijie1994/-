define("wiki-court:widget/courtList/courtList.js", function (e, a, n) {
    function t() {
        var e = new Date;
        f.ajax({
            url: "/cms/s/court/court.json?t=" + e.getFullYear() + e.getMonth() + e.getDate() + e.getHours(),
            dataType: "json",
            async: !1,
            cache: !0,
            success: function (e) {
                g = v = e, f("#court-nav .subhead span").text(e.size)
            }
        });
        f("#search-box .result-nav .next").on("click", function () {
            d >= j ? d = j : d += 1, o(d)
        });
        f("#search-box .result-nav .prev").on("click", function () {
            1 >= d ? d = 1 : d -= 1, o(d)
        });
        f("#search-box .search-input .icon").on("click", function () {
            s(f("#search-box .search-input input").val())
        });
        f("#search-box .search-input input").on("keydown", function (e) {
            13 == e.keyCode && f("#search-box .search-input .icon").trigger("click")
        });
    }

    function r(e) {
        g[e] && g[e].list ? (v = p = g[e].list, j = Math.ceil(v.length / b), f("#search-box .result-nav .page-info .total").text(j), f("#search-box .search-result p").html(g[e].provinceName + "共收录法院 <span>" + v.length + "</span> 家"), d = 1, o(d)) : (v = p = [], j = 0, f("#search-box .result-nav .page-info .total").text(j), f("#search-box .search-result p").html("共收录法院 <span>" + v.length + "</span> 家"), f("#search-box .search-result ul").html(""), f("#search-box .result-nav .page-info .current").text(0)), k = e
    }

    function i(e) {
        for (var a = [], n = g[k].list, t = 0; t < n.length; t++)
            n[t].cityName == e && a.push(n[t]);
        v = p = a,
            j = Math.ceil(v.length / b),
            f("#search-box .result-nav .page-info .total").text(j),
            f("#search-box .search-result p").html(g[k].provinceName + e + "共收录法院 <span>" + v.length + "</span> 家"),
            d = 1,
            o(d)
    }

    function s(e) {
        var a = [];
        if (e)if (f("#court-map").hasClass("mapLevel2") || f("#court-map").hasClass("mapLevel3"))for (var n = 0; n < v.length; n++)v[n].courtName.indexOf(e) > -1 && a.push(v[n]); else for (var t in g) {
            if ("size" == t)break;
            for (var r = g[t].list, n = 0; n < r.length; n++)r[n].courtName.indexOf(e) > -1 && a.push(r[n])
        } else a = v;
        v = a, j = Math.ceil(v.length / b), f("#search-box .result-nav .page-info .total").text(j), f("#search-box .search-result p").html("共查到法院 <span>" + v.length + "</span> 家"), l(), d = 1, o(d)
    }

    function o(e) {
        var a = b * (e - 1), n = 0;
        n = b * e > v.length ? v.length : b * e, f("#search-box .search-result ul").html("");
        for (var t = "", r = a; n > r; r++) {
            var i = v[r];
            t = 1 == i.level || 2 == i.level || 3 == i.level ? t + '<li class="advanced"><a href="http://baike.baidu.com/item/' + i.courtName + '" target="_blank">' + i.courtName + "</a></li>" : t + '<li><a href="http://baike.baidu.com/item/' + i.courtName + '" target="_blank">' + i.courtName + "</a></li>"
        }
        f("#search-box .search-result ul").html(t),
            f("#search-box .result-nav .page-info .current").text(e)
    }

    function l() {
        for (var e = [], a = [], n = [], t = [], r = 0; r < v.length; r++)1 == v[r].level ? e.push(v[r]) : 2 == v[r].level ? a.push(v[r]) : 3 == v[r].level ? n.push(v[r]) : t.push(v[r]);
        v = e.concat(a, n, t)
    }

    function c() {
        var e = g[m[0]].list;
        x.markerCourt(e[0]), x.markerCourt(e[1]);
        for (var a = 1; a < m.length; a++) {
            var n = g[m[a]].list;
            if (n[0]) {
                var t = n[0];
                t.longitude && t.latitude && x.markerCourt(t)
            }
        }
    }

    function h(e) {
        var a = g[e].list;
        if ("chongqing" == k || "beijing" == k || "shanghai" == k || "tianjin" == k)
            for (var n = 0; n < a.length; n++)
                x.markerCourt(a[n]);
        else
            for (var n = 0; n < a.length; n++)
                (1 == a[n].level || 2 == a[n].level || 3 == a[n].level) && x.markerCourt(a[n])
    }

    function u() {
        for (var e = 0; e < v.length; e++)x.markerCourt(v[e])
    }

    var g, v, p, f = e("wiki-common:widget/lib/jquery/jquery.js"),
        x = e("wiki-court:widget/courtMap/courtMap.js"),
        m = ["beijing", "heilongjiang", "shaanxi", "guangdong", "shanxi", "chongqing", "sichuan", "guizhou", "qinghai", "tianjin", "ningxia", "neimenggu", "shandong", "anhui", "hunan", "yunnan", "jilin", "guangxi", "hubei", "xizang", "xinjiang", "gansu", "jiangsu", "hainan", "liaoning", "henan", "shanghai", "zhejiang", "jiangxi", "fujian", "hebei", "hainansansha"],
        b = 10,
        k = "beijing",
        j = 0,
        d = 1;
    n.exports = {
        init: t,
        currentProvince: k,
        searchByProvince: r,
        searchByCity: i,
        markerLevel1: c,
        markerLevel2: h,
        markerLevel3: u
    }
});