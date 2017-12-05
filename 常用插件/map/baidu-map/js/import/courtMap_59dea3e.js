define("wiki-court:widget/courtMap/courtMap.js", function (t, a, i) {
    function e() {
        var t = [],
            a = c("#header .container").width(),
            i = c(window).width(),
            e = (c("#main").height(),  (i - a) / 2),
            r = c("#court-nav").width();
        t[0] = i - e - r;
        var n = c(window).height() - c("#header").outerHeight(!0),
            o = c("#court-nav").outerHeight(!0) + 50;
        return o > n && (n = o),
            t[0] / Map.MAP_RATE > n ? (t[1] = n, t[0] = t[1] * Map.MAP_RATE, t[3] = (i - e - r - t[0]) / 2) : (t[1] = t[0] / Map.MAP_RATE, t[3] = 0),
            c("#main").height(t[1] + 190 * (i / 1349)),
            console.log(t), t
    }

    function r(t) {
        var a = o.addPoint({
            src: "http://baike.bdimg.com/static/wiki-court/widget/courtMap/images/marker02_8eef6f0.png",
            width: 9,
            height: 9,
            lat: t.longitude,
            lng: t.latitude
        });
        c(a).attr("data-courtname", t.courtName), c(a).attr("data-tel", t.tel), c(a).attr("data-address", t.address), c(a).attr("data-logoUrl", t.logoUrl),
            c(a).hover(function () {
            {
                var t = 77, i = 182, e = 30;
                c(this).attr("x"), c(this).attr("y")
            }
            c(this).attr("href", "http://baike.bdimg.com/static/wiki-court/widget/courtList/images/marker01_d7a3565.png"),
                c(this).attr("width", 16 / o.getScale()),
                c(this).attr("height", 19 / o.getScale());
            var r = parseFloat(c(this).attr("x")),
                n = parseFloat(c(this).attr("y"));
            c(this).attr("x", r - 3 / o.getScale()),
                c(this).attr("y", n - 5 / o.getScale()),
                c("#court-tip").show(), c("#court-tip").css("top", c(a).offset().top - i - e + "px"),
                c("#court-tip").css("left", c(a).offset().left - t + "px"),
                c("#court-tip").animate({top: c(a).offset().top - i + "px"}, 200),
                c(this).attr("data-status", 1),
                c("#court-tip h3").html(c(this).attr("data-courtname")),
                c("#court-tip .tel").html(c(this).attr("data-tel")),
                c("#court-tip .address").html(c(this).attr("data-address")),
                c(this).attr("data-logoUrl") ? c("#court-tip .main img").attr("src", "http://c.hiphotos.baidu.com/baike/pic/item/" + c(this).attr("data-logoUrl") + ".jpg") : c("#court-tip .main img").attr("src", "http://baike.bdimg.com/static/wiki-court/widget/courtMap/images/default01_15a1d1d.png"),
                c("#court-tip .main").attr("href", "http://baike.baidu.com/item/" + c(this).attr("data-courtname"))
        }, function () {
        }),
            c("#court-tip").hover(function () {
        }, function () {
            c(this).hide();
            var t = c("#court-map .layer image[data-status=1]");
            if (t.length > 0) {
                t.attr("href", "http://baike.bdimg.com/static/wiki-court/widget/courtMap/images/marker02_8eef6f0.png"), t.attr("width", 9 / o.getScale()), t.attr("height", 9 / o.getScale());
                var a = parseFloat(t.attr("x")), i = parseFloat(t.attr("y"));
                t.attr("x", a + 3 / o.getScale()), t.attr("y", i + 5 / o.getScale()), t.attr("data-status", 0)
            }
        })
    }

    function n() {
        var t = e();
        o = new Mapper({marginLeft: t[3], width: t[0], height: t[1]}, {
            handleLoadProvince: function () {
                courtList.searchByProvince("beijing"), c("#back-china").hide(), c("#court-map").attr("class", ""), courtList.markerLevel1()
            }, handleLoadCity: function (t) {
                courtList.searchByProvince(h[t.code]),
                    c("#back-china").show(),
                    s = 2,
                    c("#court-map").attr("class", "mapLevel2"),
                    courtList.markerLevel2(h[t.code])
            }, handleLoadCounty: function (t, a) {
                courtList.searchByCity(a.name), s = 3, c("#court-map").attr("class", "mapLevel3"), courtList.markerLevel3()
            }
        });
        o.appendTo(document.getElementById("court-map"));
        o.load();
        c("#back-china").on("click", function () {
            2 == s ? (o.backToChina(), s = 1) : 3 == s && (o.backToProvince(), s = 2)
        })
    }

    var o, c = t("wiki-common:widget/lib/jquery/jquery.js"), h = {
        110000: "beijing",
        120000: "tianjin",
        130000: "hebei",
        140000: "shanxi",
        150000: "neimenggu",
        210000: "liaoning",
        220000: "jilin",
        230000: "heilongjiang",
        310000: "shanghai",
        320000: "jiangsu",
        330000: "zhejiang",
        340000: "anhui",
        350000: "fujian",
        360000: "jiangxi",
        370000: "shandong",
        410000: "henan",
        420000: "hubei",
        430000: "hunan",
        440000: "guangdong",
        450000: "guangxi",
        460000: "hainan",
        500000: "chongqing",
        510000: "sichuan",
        520000: "guizhou",
        530000: "yunnan",
        540000: "xizang",
        610000: "shaanxi",
        620000: "gansu",
        630000: "qinghai",
        640000: "ningxia",
        650000: "xinjiang",
        710000: "taiwan",
        810000: "xianggang",
        820000: "aomen",
        460300: "hainansansha"
    }, s = 1;
    i.exports = {init: n, markerCourt: r}
});