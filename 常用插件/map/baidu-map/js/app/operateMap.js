/**
 * @file operateMap.js
 * @author xieyq on 2017/7/12.
 * @version 1.0.0
 * @description 热力图svg操作的js文件
 */
//定义地图图形的方法
var mapCharts = {
    version: '1.0.1' //mapCharts版本
};
mapCharts.init = function(dom) {
    var charts = new MapCharts(dom);
    return charts;
};
/*
 * 地图图形的构造方法
 * */
function MapCharts(dom) {
    this.dom = dom; //设置对应的dom元素
}
/*
 * 对象对应的属性方法
 * */
MapCharts.prototype = {
    /*
     * 设置参数选项
     * */
    setOption: function(options) {
        var _this = this;
        _this.defaultOptions = {
            isShowErrorLog: false, // 是否显示错误日志
            snap: '',
            tooltip: {
                show: true,
                showHead: true,
                id: 'tips',
                formatter: function() {},
                style: {}
            },
            mapId: '000000', //对应的地图mapId
            isMaxMap: true,
            // 地图参数
            mapStyle: {
                map: {
                    fill: 'rgba(20,167,209,0.3)',
                    stroke: 'rgba(0,70,156,1)'
                },
                mapBj: {
                    fill: '#e27934',
                    shadow: {
                        x: 15,
                        y: 20,
                        radius: 15,
                        color: 'rgba(0,0,0,0.5)' //Snap.filter.shadow(30, 30, 15,'#2badfd')
                    },
                    stroke: 'rgb(25,77,136)',
                    strokeWidth: 1
                },
                areaMap: {
                    fill: 'rgba(20,167,209,0.3)',
                    stroke: 'rgba(0,70,156,1)',
                    strokeWidth: 5,
                    outlineStroke: 'rgba(0,70,156,1)',
                    outlineFill: '#82caee',
                    textFill: '#fff',
                    hoverFill: 'rgba(25,167,253,0.8)'

                },
                circle: {
                    stroke: 'rgba(0,70,156,1)',
                    r: 24,
                    fill: '#f96f04' //圆的填充颜色
                },
                textStyle: {
                    fontSize: 92,
                    fill: '#fff',
                    hoverFill: '#fff',
                    shadow: {
                        x: 30,
                        y: 40,
                        radius: 25,
                        color: '#000' //Snap.filter.shadow(30, 30, 15,'#2badfd')
                    }
                },
                relativeWidth: 6028
            },
            areaMapColor: ['#82caee', '#459ee8', '#0d61c1'],
            data: {}, //对应的数据对象
            setGray: 'rgba(128,128,128,1)', //灰色
            setGrayStroke: '#333',
            mapidPrefix: 'mapid-', // mapid 的前缀
            clickCallback: function(event, _this, dataList) {}

        };

        // 合并参数
        _this.opts = $.fn.extend(true, {}, _this.defaultOptions, options || {});
        _this.init(); //调用初始化方法
    },
    /*
     * 处理地图数据
     * */
    handleMapData: function() {
        var _this = this;
        var data = _this.areaMapDataSource; //获取对应的数据
        //如果是全国地图 需要处理新疆的数据
        if (_this.opts.mapId === '000000') {
            var xj = data['520000'],
                bt = data['480000'];
            data.xinjiangGroup = {
                "name": "贵州",
                "cjaj": parseInt(xj.cjaj) + parseInt(bt.cjaj),
                "hgaj": parseInt(xj.hgaj) + parseInt(bt.hgaj),
                "ajhgl": (parseFloat(xj.ajhgl) + parseFloat(bt.ajhgl)) / 2
            }
        }
    },
    /*
     * 地图图形的初始化方法
     * */
    init: function() {
        var _this = this;
        //请求svg地图
        _this.requestSvgMap('../svg/mapid-' + _this.opts.mapId + '.svg');
    },
    /*
     * 设置svg地图
     * */
    setSvgMap: function(response) {
        var _this = this;
        // 地图加载完毕
        _this.dom.innerHTML = response;

        var snap = Snap('#svgMap');
        snap.attr({
            width: '100%',
            height: '100%'
        });
        _this.snap = snap;
        _this.render(); //渲染地图
    },
    /*
     * 请求svg地图
     * */
    requestSvgMap: function(url) {
        var _this = this;
        //  加载svg地图
        $.ajax({
            type: "GET",
            url: url,
            dataType: 'text',
            success: function(response) {
                _this.setSvgMap(response); //设置svg地图
            },
            error: function(info) {
                throw new Error('加载地图失败' + info);
            }
        });
    },
    /*
     * 渲染svg
     * */
    render: function() {
        //设置地图样式
        this.setMapStyle();
        //处理地图数据，主要是为了解决新疆、兵团的数据
        this.handleMapData();
        //创建提示框
        this.createTipBox();
        //初始化地图区域
        this.initAreaMap();
        this.setAreaMapFillColor(); //设置区域填充颜色
        //添加区域交互动效
        this.addAreaMapInteraction();
        //获取所有圆属性
        this.getCirclePosition();
        //操作动画圆
        this.operateAnimateCircle();

    },
    // 检测当前浏览器是否是ie 是ie则返回false
    checkIE: function() {
        if ((navigator.userAgent.indexOf('MSIE') >= 0) &&
            (navigator.userAgent.indexOf('Opera') < 0)) {
            // alert('你是使用IE')
            return false;
        } else if (navigator.userAgent.indexOf('Firefox') >= 0) {
            return true;
        } else if (navigator.userAgent.indexOf('Opera') >= 0) {
            return true;
        } else {
            return true;
        }
    },
    /*
     * 设置地图的样式外观
     * */
    setMapStyle: function() {
        var _this = this;
        var snap = _this.snap;

        // 是否显示错误日志
        _this.isShowErrorLog = _this.opts.isShowErrorLog;
        // 区域文本
        _this.areaText = [];

        // mapid 前缀
        _this.mapidPrefix = _this.opts.mapidPrefix;

        // 是否是大地图
        _this.isMaxMap = _this.opts.isMaxMap;

        // 视窗对象
        _this.viewBox = _this.snap.attr('viewBox');

        // map style
        _this.mapStyle = _this.opts.mapStyle;

        // 地图的比值
        _this.mapRatio = Math.max(_this.viewBox.width / _this.mapStyle.relativeWidth,
            _this.viewBox.height / _this.mapStyle.relativeWidth);

        function changeMapStyle() {

            // 设置地图描边的大小
            _this.mapStyle.map.strokeWidthRatio = _this.mapStyle.map.strokeWidth * _this.mapRatio;

            // 设置阴影大小
            _this.mapStyle.mapBj.shadowFilter = Snap.filter.shadow(
                _this.mapStyle.mapBj.shadow.x * _this.mapRatio,
                _this.mapStyle.mapBj.shadow.y * _this.mapRatio,
                _this.mapStyle.mapBj.shadow.radius * _this.mapRatio,
                _this.mapStyle.mapBj.shadow.color);

            // 设置地图字体大小
            var fontSize = _this.mapStyle.textStyle.fontSize * _this.mapRatio;
            //检测是否是IE
            if (!_this.checkIE()) {
                fontSize = _this.mapStyle.textStyle.fontSize * _this.mapRatio * 1.5;
            }
            _this.mapStyle.textStyle.fontSizeRatio = fontSize;

            // 圆半径
            _this.mapStyle.circle.rRatio = _this.mapStyle.circle.r * _this.mapRatio;

            //areaMap边框
            _this.mapStyle.areaMap.strokeWidthRatio = _this.mapStyle.areaMap.strokeWidth * _this.mapRatio;

            //dataText shadow
            _this.mapStyle.textStyle.shadowFilter = Snap.filter.shadow(
                _this.mapStyle.textStyle.shadow.x * _this.mapRatio,
                _this.mapStyle.textStyle.shadow.y * _this.mapRatio,
                _this.mapStyle.textStyle.shadow.radius * _this.mapRatio,
                _this.mapStyle.textStyle.shadow.color);
        }

        // 根据不同的尺寸设置不同的样式
        changeMapStyle();

        // 设置区域颜色
        _this.areaMapColor = _this.opts.areaMapColor;

        // 数据源对象
        _this.areaMapDataSource = _this.opts.data;

        // 地图背景样式
        +

        function setMapBjStyle() {
            _this.mapPathBjG = snap.select('#svgMapBj');

            _this.snap.selectAll('path').attr({
                stroke: _this.mapStyle.mapBj.stroke,
                fill: _this.opts.setGray // 默认设置灰色
            });
            // 隐藏所有的 -outline
            $('[id$="-outline"]').css({
                display: 'none'
            });

            if ($('#xinjiang-group').length) {
                $('#xinjiang-outline').css({
                    display: 'block'
                });
            }

            _this.mapPathBjGPath = _this.mapPathBjG
                .selectAll('path');
            _this.mapPathBjGPath.attr({
                display: 'block',
                fill: _this.opts.setGray, //_this.mapStyle.mapBj.fill,
                filter: snap.paper.filter(_this.mapStyle.mapBj.shadowFilter),
                stroke: _this.mapStyle.mapBj.stroke,
                strokeWidth: _this.mapStyle.mapBj.strokeWidthRatio
            });


        }();

        if (_this.snap.select('	#mapid-nansha')) {
            _this.snap.select('#mapid-nansha').attr({
                fill: 'rgba(255,255,255,1)', // 'rgba(168,208,248,0.8)',
                stroke: '#6699cc', // _this.mapStyle.mapBj.stroke,
                strokeWidth: '6px'
            });
        }

        // 设置默认元素
        +

        function setOriginalElement() {
            _this.snap.selectAll('text').remove(); // 移除默认文本
            _this.snap.selectAll('circle').attr({ // 隐藏所有的圆
                display: 'none'
            });
            _this.snap.selectAll('polily').attr({ // 隐藏所有的圆
                display: 'none'
            });
            // 移除默认文本
            _this.snap.selectAll('ellipse').attr({ // 隐藏所有的圆
                visibility: 'hidden',
                fill: '#fff'
            });
        }();
    },
    /*
     * 初始化区域地图
     * */
    initAreaMap: function() {
        var _this = this;
        // 创建一个包含所有区域的地图对象
        _this.areaMapSet = {}; //设置集合,用来处理鼠标交互事件
        _this.areaMap = {}; //区域地图
        _this.areaMapData = {}; //地图数据
        _this.areaMapCircle = {}; //地图圆
        _this.areaMapText = {}; //地图文本

        //遍历数据对象
        for (var mapId in _this.areaMapDataSource) {
            // 区域数据对象
            _this.areaMapData[_this.mapidPrefix + mapId] = _this.areaMapDataSource[mapId];
            _this.areaMapData[_this.mapidPrefix + mapId].mapId = mapId;

            _this.areaMapSet[_this.mapidPrefix + mapId] = _this.snap.selectAll('#' + _this.mapidPrefix + mapId + '-outline');
            _this.areaMapSet[_this.mapidPrefix + mapId].clear();

            var cursor = 'default';
            if (/[0-9]+(0000)$/.test(mapId) || /^[A-Za-z]/.test(mapId)) {
                cursor = 'pointer';
            }

            // 判断区域对象是否存在
            if ($('#' + _this.mapidPrefix + mapId + '-outline').length > 0) {
                // 区域对象
                _this.areaMap[_this.mapidPrefix + mapId] = _this.snap.select('#' + _this.mapidPrefix + mapId + '-outline');
                //设置对应的样式
                _this.areaMap[_this.mapidPrefix + mapId].attr({
                    stroke: _this.mapStyle.areaMap.outlineStroke,
                    strokeWidth: _this.mapStyle.areaMap.strokeWidthRatio,
                    fill: _this.mapStyle.areaMap.outlineFill,
                    cursor: cursor,
                    display: 'block'
                }).data('data', _this.areaMapData[_this.mapidPrefix + mapId]); //添加对应的数据对象
                // 不置灰就用data里保留的颜色
                if (_this.areaMap[_this.mapidPrefix + mapId].selectAll('path').length > 0) {
                    _this.areaMap[_this.mapidPrefix + mapId].selectAll('path').attr({
                        fill: _this.mapStyle.areaMap.outlineFill,
                        stroke: _this.mapStyle.areaMap.outlineStroke
                    });
                }

                _this.areaMapSet[_this.mapidPrefix + mapId].push(_this.areaMap[_this.mapidPrefix + mapId]);
                // 设置颜色
                if (mapId == '520000' || mapId == '480000' || mapId == 'xinjiangGroup') {
                    if (_this.snap.select('#xinjiang-outline')) {
                        _this.snap.select('#xinjiang-outline').attr({
                            fill: _this.mapStyle.areaMap.outlineFill,
                            stroke: _this.mapStyle.areaMap.outlineStroke
                        });
                    }
                }

                // 判断是不是新疆这块区域
                if (mapId == '520000' || mapId == '480000' || mapId == 'xinjiangGroup') {
                    _this.areaMap[_this.mapidPrefix + mapId].attr({
                        fill: 'rgba(0,0,0,0.01)',
                        stroke: 'none'
                    });
                }
            } else {
                //绘制高院辖区
                var gyGroup = this.createHighCourt(_this.areaMapData[_this.mapidPrefix + mapId]);
                var gyCircle = this.createHighCourtCircle(_this.areaMapData[_this.mapidPrefix + mapId]);

                gyGroup.attr({
                    cursor: 'default'
                }).data('data', _this.areaMapData[_this.mapidPrefix + mapId]);

                gyCircle.attr({
                    cursor: 'default'
                }).data('data', _this.areaMapData[_this.mapidPrefix + mapId]);
                _this.areaMapSet[_this.mapidPrefix + mapId].push(gyGroup);
                _this.areaMapSet[_this.mapidPrefix + mapId].push(gyCircle);
            }

            // 判断圆的对象是否存在
            if ($('#' + _this.mapidPrefix + mapId + '-circle').length > 0) {
                // 区域圆心对象
                _this.areaMapCircle[_this.mapidPrefix + mapId] = _this.snap.select('#' + _this.mapidPrefix + mapId + '-circle');

                //设置对应的圆的样式
                _this.areaMapCircle[_this.mapidPrefix + mapId].attr({
                    fill: _this.mapStyle.circle.fill,
                    r: _this.mapStyle.circle.rRatio,
                    display: 'block',
                    cursor: cursor
                }).data('data', _this.areaMapData[_this.mapidPrefix + mapId]).appendTo(_this.snap);
                _this.areaMapSet[_this.mapidPrefix + mapId].push(_this.areaMapCircle[_this.mapidPrefix + mapId]);

                // 创建数据本对象
                _this.areaMapText[_this.mapidPrefix + mapId] = _this.snap.el('text', {
                    class: 'areaMapName-' + mapId,
                    text: _this.areaMapDataSource[mapId].name,
                    x: _this.areaMapCircle[_this.mapidPrefix + mapId].attr('cx'),
                    y: parseInt(_this.areaMapCircle[_this.mapidPrefix + mapId].attr('cy') - _this.mapStyle.textStyle.fontSizeRatio * 1.3) * 1,
                    fontSize: _this.mapStyle.textStyle.fontSizeRatio + 'px',
                    fill: _this.mapStyle.textStyle.fill,
                    filter: _this.snap.filter(_this.mapStyle.textStyle.shadowFilter),
                    fontFamily: 'Microsoft YaHei',
                    textAnchor: 'middle',
                    dominantBaseline: 'middle',
                    cursor: cursor
                });

                _this.areaMapSet[_this.mapidPrefix + mapId].push(_this.areaMapText[_this.mapidPrefix + mapId])
            }
            // 南沙群岛
            if (_this.snap.selectAll('#nansha-outline').length > 0) {
                _this.snap.select('#nansha-outline').attr({
                    stroke: _this.mapStyle.areaMap.outlineStroke,
                    strokeWidth: _this.mapStyle.areaMap.strokeWidthRatio,
                    fill: '#68bdfb' //_this.mapStyle.areaMap.outlineFill
                });
            }
        }
    },
    /*
     * 创建提示框
     * */
    createTipBox: function() {
        var _this = this;
        // 合并参数
        var style = $.fn.extend(true, {
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: '999',
            color: '#fff',
            'font-size': '13px',
            fontFamily: 'Microsoft YaHei',
            lineHeight: '1.5em',
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderColor: '#408fc3',
            borderRadius: '5px',
            padding: '5px 8px',
            whiteSpace: 'nowrap',
            display: 'none'

        }, _this.opts.tooltip.style || {});
        $('<div id=' +
            _this.opts.tooltip.id +
            '>' +
            '<h3 style="white-space:nowrap;font-size:14px;">西北</h3>' +
            '<p  style="white-space:nowrap;"><span class="fd-name-01">参检案件</span>：<span  class="fd-name-count-01">0</span></p>' +
            '<p  style="white-space:nowrap;"><span class="fd-name-02">合格案件</span>：<span  class="fd-name-count-02">0</span></p>' +
            '<p  style="white-space:nowrap;"><span class="fd-name-03">案件合格率</span>：<span  class="fd-name-count-03">0%</span></p>' +
            '</div>').css(style).appendTo('body');
    },
    /*
     * 根据数值获取对应的颜色值
     * @param {float} value 数值
     * @return {String}  颜色字符串
     * */
    getColorByValue: function(value) {
        var _this = this;
        value = parseFloat(value);
        if (value < 60) {
            return _this.opts.areaMapColor[0];
        } else if (value >= 60 && value <= 80) {
            return _this.opts.areaMapColor[1];
        } else {
            return _this.opts.areaMapColor[2];
        }
    },
    /*
     * 设置区域地图的填充颜色
     * */
    setAreaMapFillColor: function() {
        var _this = this;
        $.each(_this.areaMap, function(name, value) {
            var data = value.data('data');
            //如果当前元素时一个集合，则获取子集的path，否则子集则是一个path
            var _path = value.selectAll('path').length > 0 ? value.selectAll('path') : value;
            _path.attr({
                fill: _this.getColorByValue(data.ajhgl) //根据案件合格率获取对应的颜色
            });

            // 设置颜色新疆区域
            if (data.mapId == '520000' || value.data('data').mapId == '480000' || value.data('data').mapId == 'xinjiangGroup') {
                if (_this.snap.select('#xinjiang-outline')) {
                    _this.snap.select('#xinjiang-outline').attr({
                        fill: _this.getColorByValue(data.ajhgl) //根据案件合格率获取对应的颜色
                    });
                }
            }

            // 判断是不是新疆这块区域
            if (data.mapId == '520000' || data.mapId == '480000' || data.mapId == 'xinjiangGroup') {
                value.attr({
                    fill: 'rgba(0,0,0,0.01)',
                    stroke: 'none'
                });
            }
        });
    },
    /*
     * 给地图添加交互效果
     * 需要给path路径、圆圈、文本统一添加上交互效果
     * */
    addAreaMapInteraction: function() {
        var _this = this;
        var tooltip = $('#' + _this.opts.tooltip.id),
            tooltipTitle = tooltip.find('h3'),
            tooltipContent1Count = tooltip.find('.fd-name-count-01'),
            tooltipContent2Count = tooltip.find('.fd-name-count-02'),
            tooltipContent3Count = tooltip.find('.fd-name-count-03');
        var delt = 5;
        var winW = $(window).width();
        var winH = $(window).height();


        $.each(_this.areaMapSet, function(name, value) {

            value.forEach(function(element, index) {
                //热力图 鼠标滑过事件
                element.hover(function(event) {
                        var event = event || window.event;
                        var outline = _this.areaMap[name] ? _this.areaMap[name] : this;
                        var data = outline.data('data');
                        var _path = outline.selectAll('path').length > 0 ? outline.selectAll('path') :
                            (outline.selectAll('rect').length > 0 ? outline.selectAll('rect') : outline);

                        tooltipTitle.text(data.name);
                        tooltipContent1Count.text(data.cjaj);
                        tooltipContent2Count.text(data.hgaj);
                        tooltipContent3Count.text(data.ajhgl + '%');
                        //判断是否超出了屏幕的宽度和高度
                        var left = event.pageX;
                        var top = event.pageY;
                        var tipW = tooltip.width();
                        var tipH = tooltip.height();
                        if ((left + tipW + delt) > winW) {
                            left = winW - tipW - delt;
                        }
                        if ((top + tipH + delt) > winH) {
                            top = winH - tipH - delt;
                        }
                        tooltip.css({
                            left: left,
                            top: top
                        }).show();

                        //设置鼠标滑过样式
                        _path.attr({
                            fill: _this.mapStyle.areaMap.hoverFill
                        });

                        //名称颜色变为hoverFill的颜色
                        /*_this.areaMapText[name].attr({
                            fill: _this.mapStyle.textStyle.hoverFill
                        });*/

                        // 判断是不是新疆这块区域
                        if ((data.mapId !== _this.opts.mapId) && (data.mapId == '520000' || data.mapId == '480000' || data.mapId == 'xinjiangGroup')) {
                            outline.attr({
                                opacity: 0.001
                            });
                        }
                    },
                    //鼠标移出事件
                    function() {

                        var outline = _this.areaMap[name] ? _this.areaMap[name] : this;
                        var data = outline.data('data');
                        var _path = outline.selectAll('path').length > 0 ? outline.selectAll('path') :
                            (outline.selectAll('rect').length > 0 ? outline.selectAll('rect') : outline);
                        _path.attr({
                            fill: _this.getColorByValue(data.ajhgl)
                        });
                        if (tooltip.is(':visible')) {
                            // 隐藏提示框
                            tooltip.hide();
                        }

                        // 判断是不是新疆这块区域
                        if ((data.mapId !== _this.opts.mapId) && (data.mapId == '520000' || data.mapId == '480000' || data.mapId == 'xinjiangGroup')) {
                            outline.attr({
                                fill: 'rgba(0,0,0,0.1)'
                            });
                        }
                        /*_this.areaMapText[name].attr({
                            fill: _this.mapStyle.textStyle.fill
                        });*/
                    }).mousemove(function(event) {
                    var event = event || window.event;
                    if (tooltip.is(':visible')) {
                        //判断是否超出了屏幕的宽度和高度
                        var left = event.pageX;
                        var top = event.pageY;
                        var tipW = tooltip.width();
                        var tipH = tooltip.height();
                        left += 20;
                        if ((left + tipW + delt) > winW) {
                            left = winW - tipW - delt;
                        }
                        if ((top + tipH + delt) > winH) {
                            top = winH - tipH - delt;
                        }
                        tooltip.css({
                            left: left,
                            top: top
                        });
                    }
                }).click(function(event) {
                    var event = event || window.event;
                    var outline = _this.areaMap[name];
                    var _data = outline.data('data');
                    //如果当前是中院辖区，则不能继续下钻
                    if (!/[0-9]+(0000)$/.test(_data.mapId) || _data.mapId === _this.opts.mapId) {
                        return;
                    }
                    // 点击之后的回调函数
                    _this.opts.clickCallback(event, outline, _data);
                });
            });
        });
        // 判断是不是新疆这块区域
        if (_this.snap.select('#xinjiang-group')) {
            _this.snap.select('#xinjiang-group').hover(function() {
                _this.snap.select('#xinjiang-outline').attr({
                    fill: _this.mapStyle.areaMap.hoverFill
                });
            }, function() {
                var data = _this.snap.select('#mapid-xinjiangGroup-outline').data('data');
                _this.snap.select('#xinjiang-outline').attr({
                    fill: _this.getColorByValue(data.ajhgl)
                });
            });
        }
    },

    /*
     * 获取圆属性
     * */
    getCirclePosition: function() {
        var _this = this;

        var arr = []; //存放 所有固定圆相关属性 的 数组
        $.each(_this.areaMapCircle, function(name, value) {
            var obj = {
                cx: value.attr('cx'),
                cy: value.attr('cy'),
                id: value.attr('id')
            };
            arr.push(obj);
        });
        return arr;
    },

    /*
     *   处理动画圆
     */
    operateAnimateCircle: function() {
        var _this = this;
        var circlePositionArr = _this.getCirclePosition();
        //基于固定圆坐标绘制动画圆
        for (var i = 0; i < circlePositionArr.length; i++) {
            var tmp = circlePositionArr[i];
            _this.CreateAnimateCircle({
                x: tmp.cx,
                y: tmp.cy,
                r: 35 * _this.mapRatio,
                radius: 75 * _this.mapRatio,
                tweenTime: 600
            });
        }
    },


    /*
     * 动画(内圆 + 闪烁  + 光环)
     */
    CreateAnimateCircle: function(updateOptions) {
        var _this = this;
        var snap = _this.snap;

        var obj = $.fn.extend({}, {
            x: 0,
            y: 0,
            r: 10,
            radius: 20,
            tweenTime: 400

        }, updateOptions || {}); // {x,y,r,radius,tweenTime}
        _this.x = obj.x;
        _this.y = obj.y;
        _this.r = obj.r;
        _this.radius = obj.radius;
        _this.tweenTime = obj.tweenTime;

        var timer = null;
        var r1,
            r2,
            r3,
            r4;
        r1 = _this.r;
        r2 = r1 + _this.radius * 0.33;
        r3 = r1 + _this.radius * 0.66;
        r4 = r1 + _this.radius;

        try {
            var circle01 = snap.paper.circle(_this.x, _this.y, r1).attr({
                stroke: "#fff45c",
                fill: "#fff45c",
                strokeWidth: 4 * _this.mapRatio,
                id: "animateCircle1"
            });
            var circle02 = circle01.clone().attr({ fill: "none", r: r2 });
            var circle03 = circle02.clone().attr({ r: r3 });
            var circle04 = circle02.clone().attr({ r: r4 });

            var circleAnimateg = snap.g(circle01, circle02, circle03, circle04).attr({
                id: "circleAnimateg",
                "display": "block",
                "pointer-events": "none"
            });

            // 动画方法
            function animateCircle() {
                circle02.animate({
                    r: r2,
                    opacity: 0.66
                }, _this.tweenTime);
                circle03.animate({
                    r: r3,
                    opacity: 0.33
                }, _this.tweenTime);
                circle04.animate({
                    r: r4,
                    opacity: 0
                }, _this.tweenTime);
            };

            // 停止当前动画方法
            function stopAnimateCircle() {
                circle02.stop().attr({
                    r: r1,
                    opacity: 1
                });
                circle03.stop().attr({
                    r: r2,
                    opacity: 0.66
                });
                circle04.stop().attr({
                    r: r3,
                    opacity: 0.33
                });
                animateCircle();
            };

            // 循环函数
            function loop() {
                if (timer)
                    clearTimeout(timer);
                stopAnimateCircle();
                timer = setTimeout(function() {
                    loop()
                }, _this.tweenTime);
            };
            loop();

            // update
            _this.update = function() {
                r1 = _this.r;
                r2 = r1 + _this.radius * 0.33;
                r3 = r1 + _this.radius * 0.66;
                r4 = r1 + _this.radius;
                circle01.attr({
                    cx: _this.x,
                    cy: _this.y,
                    r: r1
                });
                circle02.attr({
                    cx: _this.x,
                    cy: _this.y,
                    r: r2
                });
                circle03.attr({
                    cx: _this.x,
                    cy: _this.y,
                    r: r3
                });
                circle04.attr({
                    cx: _this.x,
                    cy: _this.y,
                    r: r4
                });
            };
            _this.update();

        } catch (e) {
            throw new Error(e + "createAnimateCircle(obj):obj的参数为对象，形式为{_this.x:num,y:num,r:num,radius:num,tweenTime:time}")
        }
    },
    /*
     * 创建高院辖区
     */
    createHighCourt: function(data) {
        var _this = this;
        var snap = _this.snap;
        var svgMapArea = snap.select('#svgMapBj');

        var g = snap.paper.g();
        var rectX = svgMapArea.getBBox().x - 700 * _this.mapRatio;
        var rectY = svgMapArea.getBBox().y + 100 * _this.mapRatio;
        if(rectX < _this.viewBox.x) {
            rectX = _this.viewBox.x;
        }
        var rect = snap.paper.el("rect", {
            x: rectX,
            y: rectY,
            width: 700 * _this.mapRatio,
            height: 140 * _this.mapRatio
        }).attr({
            id: 'HighCourt',
            fill: _this.getColorByValue(data.ajhgl),
            stroke: '#4bc7ea',
            strokeWidth: 2 * _this.mapRatio
        });
        g.add(rect);
        var text = snap.text(
            rectX + 700 * _this.mapRatio / 2,
            rectY + 140 * _this.mapRatio / 2 + (_this.mapStyle.textStyle.fontSize * 2 / 3) * _this.mapRatio / 2,
            data.name).attr({
            fill: '#fff',
            textAnchor: 'middle',
            fontFamily: 'Microsoft YaHei',
            fontSize: _this.mapStyle.textStyle.fontSizeRatio + "px"
        });
        g.add(text);
        return g;
    },
    /*
     * 创建高院辖区圆
     */
    createHighCourtCircle: function() {
        var _this = this;
        var snap = _this.snap;
        var g = snap.paper.g();
        //获取高院矩形位置
        var HighCourtRect = snap.select('#HighCourt');
        var HighCourtCircleX = HighCourtRect.getBBox().cx;
        var HighCourtCircleY = HighCourtRect.getBBox().y2 + 110 * _this.mapRatio;
        var circle = snap.paper.el("circle", {
            cx: HighCourtCircleX,
            cy: HighCourtCircleY,
            fill: _this.mapStyle.circle.fill,
            r: _this.mapStyle.circle.rRatio,
            display: 'block',
            id: 'HighCourtCircle'
        });
        //创建高院动画圆
        _this.CreateAnimateCircle({
            x: HighCourtCircleX,
            y: HighCourtCircleY,
            r: 35 * _this.mapRatio,
            radius: 75 * _this.mapRatio,
            tweenTime: 600
        });
        g.add(circle);
        return g;
    },
    /*
     * 更新数据
     * */
    updateData: function(dataSource) {
        var _this = this;
        _this.areaMapDataSource = dataSource; //赋值对应的数据的对象
        _this.handleMapData(); //处理新疆和兵团的数据
        $.each(_this.areaMapDataSource, function(mapId, value) {
            // 更新所有数据对象
            _this.areaMapData[_this.mapidPrefix + mapId].mapId = mapId;
            _this.areaMapData[_this.mapidPrefix + mapId].name = $.trim(value.name);
            _this.areaMapData[_this.mapidPrefix + mapId].cjaj = Number(value.cjaj);
            _this.areaMapData[_this.mapidPrefix + mapId].hgaj = Number(value.hgaj);
            _this.areaMapData[_this.mapidPrefix + mapId].ajhgl = Number(value.ajhgl);
        });
        _this.setAreaMapFillColor(); //设置区域的填充颜色
    }
};