/**
 * @file mapCharts.js
 * @author xieyq on 2017/7/26.
 * @version 1.0.0
 * @updateTime 2017/7/26
 * @description 地图插件文件
 */
define('MapCharts',[],function(){
/*
 * 地图插件的构造方法
 * @class
 * */
function MapCharts(dom) {
    this.dom = dom;
    //svg数据，用来存储已经请求过的svg文件数据
    this.svgData = {};
}

/*
 * 对象对应的属性方法
 * */
MapCharts.prototype = {
    /*
     * 设置图形参数，并且绘制对应的图形
     * */
    setOption: function (option) {
        // 合并参数
        this.opts = $.fn.extend(true, {}, this.defaultOption, option || {});
        //调用初始化方法
        this.init();
    },
    /*
     * 获取对应的图形参数
     * */
    getOption: function () {
        return this.opts;
    },
    /*
     * 初始化方法
     * */
    init: function () {
        //初始化参数选项
        this.initOption();
        this.load();    //加载地图
    },
    /*
     * 初始化参数选项
     * */
    initOption: function () {

        //处理网格的各个方向的数值，处理成像素单位
        this.opts.grid.left = this.handlePosValue(this.opts.grid.left);
        this.opts.grid.top = this.handlePosValue(this.opts.grid.top);
        this.opts.grid.right = this.handlePosValue(this.opts.grid.right);
        this.opts.grid.bottom = this.handlePosValue(this.opts.grid.bottom);

        //将参数选项中的标识样式中的emphasis中没有的属性从normal中copy
        this.opts.series.symbol.itemStyle.emphasis = $.extend(true, {}, this.opts.series.symbol.itemStyle.normal, this.opts.series.symbol.itemStyle.emphasis);

        //将参数选项中的区域样式中的emphasis中没有的属性从normal中copy
        this.opts.series.itemStyle.emphasis = $.extend(true, {}, this.opts.series.itemStyle.normal, this.opts.series.itemStyle.emphasis);

        //将参数选项中的区域样式中的emphasis中没有的属性从normal中copy
        this.opts.series.label.emphasis = $.extend(true, {}, this.opts.series.label.normal, this.opts.series.label.emphasis);

        //如果类型是热力图
        if (this.opts.series.type === 'heatmap') {
            //如果视觉映射是连续的
            if (this.opts.visualMap.type === 'continuous') {
                //赋值渐变颜色
                this.gradientColor = this.gradientColors(this.opts.visualMap.inRange.color, this.STEPS);
            } else if (this.opts.visualMap.type === 'piecewise') {   //如果视觉映射类型是分段的

            }
        }
    },
    /*
    * 处理位置数值
    * @param {String|Number} value 要处理的数值
    * */
    handlePosValue: function(value) {
        var result = value;
        //如果不是一个数字，则设置成0
        if(isNaN(parseFloat(value))) {
            result = 0;
        } else if((value + '').match(/%$/)) {   //如果是以百分号结尾
            result = this.dom.offsetWidth * parseFloat(value) / 100;
        }
        return result;
    },
    /*
     * 加载地图
     * */
    load: function () {
        var _this = this;
        //如果已经存在了对应的svg文件数据，则直接进行绘制
        if (!!_this.svgData[_this.opts.series.map]) {
            _this.createSvg(_this.svgData[_this.opts.series.map]); //设置svg地图
            _this.render(); //绘制地图
        } else {
            //同步加载svg地图，是为了防止系统多次点击某个区域的地图，反应不及时的问题
            $.ajax({
                type: "GET",
                url: _this.opts.series.path + _this.opts.series.map + '.svg',
                dataType: 'text',
                async: false,
                success: function (response) {
                    _this.svgData[_this.opts.series.map] = response;
                    _this.createSvg(response); //设置svg地图
                    _this.render(); //绘制地图
                },
                error: function (info) {
                    throw new Error('加载' + _this.opts.series.map + '地图失败，请确认是否存在对应的svg文件！' + info);
                }
            });
        }
    },
    /*
     * 创建对应的svg元素
     * @param {String} response 请求之后的xml文本
     * */
    createSvg: function (response) {
        var _this = this;
        // 地图加载完毕
        _this.dom.innerHTML = response;

        var svg = Snap('#' + _this.dom.getAttribute('id') + ' #svgMap');
        svg.attr({
            width: '100%',
            height: '100%'
        });
        _this.svg = svg;
    },
    /*
     * 绘制图形
     * */
    render: function () {
        //初始化地图
        this.initMap();
        //设置地图默认样式
        this.setMapStyle();
        //处理新疆和兵团的数据
        this.handleMapData();
        //初始化地图区域
        this.initAreaMap();
        //创建对应的提示框
        this.createTooltip();
        //添加区域地图的交互事件
        this.addAreaMapInteraction();
        //创建视觉映射组件
        this.createVisualMap();
        //创建动画效果
        this.addAnimate();
    },
    /*
     * 设置地图样式外观
     * */
    setMapStyle: function () {
        var _this = this;

        // 地图背景样式
        +function setMapBjStyle() {

            // 隐藏所有的 -outline
            $('[id$="-outline"]').css({
                display: 'none'
            });

            // 设置所有路径的默认样式
            _this.svg.selectAll('path').attr({
                stroke: _this.opts.series.defaultStyle.borderColor,
                strokeWidth: _this.opts.series.defaultStyle.borderWidth * _this.mapRatio,
                fill: _this.opts.series.defaultStyle.areaColor
            });

            if ($('#xinjiang-group').length) {
                $('#xinjiang-outline').css({
                    display: 'block'
                });
            }

            //如果存在背景区域
            if(_this.svg.select('#svgMapBj')) {
                var _bgArea = _this.opts.series.bgArea;
                //背景的阴影部分
                var _filter = _this.svg.paper.filter(Snap.filter.shadow(
                    _bgArea.shadowOffsetX * _this.mapRatio,
                    _bgArea.shadowOffsetY * _this.mapRatio,
                    _bgArea.shadowBlur * _this.mapRatio,
                    _bgArea.shadowColor));
                //设置地图背景的所有的路径样式
                _this.svg.select('#svgMapBj').selectAll('path').attr({
                    display: 'block',
                    fill: _bgArea.areaColor, //_this.mapStyle.mapBj.fill,
                    filter: _filter,   //增加阴影
                    opacity: _bgArea.opacity,   //对应的透明度
                    stroke: _this.opts.series.bgArea.borderColor,
                    strokeWidth: _this.opts.series.bgArea.borderWidth * _this.mapRatio
                });
                /*_this.svg.select('#svgMapBj').attr({
                    transform: 't0,' + (_this.opts.series.bgArea.borderWidth / 4 * _this.mapRatio)
                });*/
                //如果台湾存在
                if(_this.svg.select('#pathTaiwan')) {
                    _this.svg.select('#pathTaiwan').attr({
                        stroke: 'none',
                        strokeWidth: 0
                    });
                }
                if(_this.svg.select('#pathHainan')) {
                    _this.svg.select('#pathHainan').attr({
                        stroke: 'none',
                        strokeWidth: 0
                    });
                }
                //_this.mapGroup.append(_this.svg.select('#svgMapBj'));
            }
        }();

        // 设置默认元素
        +function setOriginalElement() {
            //移除默认文本
            _this.svg.selectAll('text').remove(); // 移除默认文本
            _this.svg.selectAll('circle').attr({ // 隐藏所有的圆
                display: 'none'
            });
            // 移除默认文本
            _this.svg.selectAll('ellipse').attr({ // 隐藏所有的椭圆
                display: 'none'
            });
        }();

    },
    /*
    * 初始化地图
    * */
    initMap: function() {
        var _this = this;

        // 视窗对象
        _this.viewBox = _this.svg.attr('viewBox');

        //创建地图集合，改集合用来存放地图用到的所有数据
        _this.mapGroup = _this.svg.paper.g();

        // 地图的比值
        //_this.mapRatio = Math.max(_this.viewBox.width / _this.RELATIVE_WIDTH, _this.viewBox.height / _this.RELATIVE_WIDTH);
        _this.mapRatio = Math.max(_this.viewBox.width / _this.dom.offsetWidth, _this.viewBox.height / _this.dom.offsetHeight);

        //创建矩阵对象，用于获取其他点进行对应矩阵变换之后的位置坐标
        _this.matrix = new Snap.Matrix(1,0,0,1,0,0);
        //如果长宽比不等于1，则说明有缩放
        if(_this.opts.series.aspectScale < 1) {
            _this.svg.select('#perspective').attr({
                transform: 's1,' + _this.opts.series.aspectScale + ',' + _this.viewBox.width / 2 + ',' + _this.viewBox.height / 2
            });
            _this.matrix.scale(1, _this.opts.series.aspectScale, _this.viewBox.width / 2, _this.viewBox.height / 2);
        }
        this.createFullSvg();   //创建覆盖全部的svg对象
    },
    /*
     * 处理地图数据
     * */
    handleMapData: function () {
        var _this = this;
        var data = _this.opts.series.data; //获取对应的数据
        //如果是全国地图 需要处理新疆的数据
        if (_this.opts.series.map === '000000') {
            var xj = data['480000'], bt = data['520000'];
            data.xinjiangGroup = {};
            //如果新疆和兵团都存在
            if (xj && bt) {
                for (var key in xj) {
                    //如果是热力图 并且 如果key等于用来处理区域颜色的属性 并且 如果是百分比的话，则取平均值
                    if (_this.opts.series.type === 'heatmap'
                        && key === _this.opts.visualMap.props
                        && _this.opts.visualMap.propsType === 'percent') {
                        data.xinjiangGroup[key] = (parseFloat(xj[key]) + parseFloat(bt[key])) / 2;
                    } else {    //否则直接取两个的加和即可
                        data.xinjiangGroup[key] = xj[key] + bt[key];
                    }
                }
            } else {
                data.xinjiangGroup = xj || bt;
            }
        }
    },
    /*
     * 初始化区域地图
     * */
    initAreaMap: function () {
        var _this = this;
        var series = _this.opts.series; //获取系列数据

        _this.areaMapSet = {}; //设置集合,用来处理鼠标交互事件
        _this.areaMapData = {}; //地图数据
        _this.areaMap = {}; //区域地图
        _this.areaMapG =  _this.svg.paper.g();   //区域的集合
        _this.areaMapCircle = {}; //地图圆
        _this.areaMapCircleG = _this.svg.paper.g();   //圆的集合
        _this.areaMapText = {}; //地图文本
        _this.areaMapTextG = _this.svg.paper.g();   //文本的集合

        //添加动画元素
        _this.animateCircleOuter={};
        _this.animateCircleInner={};
        _this.animateImg={};

        //遍历系列数据
        for (var key in series.data) {
            //定义一个属性名的变量，后面会经常用到
            var propName = _this.MAP_PREFIX + series.data[key].mapId;

            // 区域数据对象
            _this.areaMapData[propName] = series.data[key];
            _this.areaMapData[propName].mapId = series.data[key].mapId;

            _this.areaMapSet[propName] = _this.svg.selectAll('#' + propName + '-outline');
            _this.areaMapSet[propName].clear();

            // 判断区域对象是否存在
            if ($('#' + propName + '-outline').length > 0) {
                // 区域对象
                _this.areaMap[propName] = _this.svg.select('#' + propName + '-outline');
                _this.areaMap[propName].attr({
                    display: 'block'
                });

                //获取对应的path对象
                var _path = _this.getAreaPath(_this.areaMap[propName], key);

                //设置区域的样式
                _this.setAreaStyle(_path, _this.opts.series.itemStyle.normal, _this.areaMapData[propName], 1);

                //往集合中添加对应的地图区域
                _this.areaMapSet[propName].push(_this.areaMap[propName]);

            }
            //判断圆圈是否存在，并且展现
            /*
            * 2017.08.25
            * 根据需要标记不一样了，重写了方法
            * */
            if ($('#' + propName + '-circle').length > 0) {
                // 区域圆心对象
                var areaCircle= _this.svg.select('#' + propName + '-circle');
                //圆心坐标
                var circlePoint = {
                    x: areaCircle.attr('cx'),
                    y: areaCircle.attr('cy')
                };
                _this.areaMapCircle[propName]=_this.svg.paper.g().attr({
                    id: propName + '-text'
                }).data('point', circlePoint);

                //如果标识展现,则设置对应的样式
                if (series.symbol.itemStyle.normal.show || series.symbol.itemStyle.emphasis.show) {
                    //设置对应的圆的样式
                    _this.setSymbolStyle(_this.areaMapCircle[propName], series.symbol.itemStyle.normal,_this.areaMapData[propName],circlePoint,propName);

                    //将对应的数据添加到对应的集合中
                    _this.areaMapCircleG.add(_this.areaMapCircle[propName]);

                    //往集合中添加对应的地图区域标记
                    _this.areaMapSet[propName].push(_this.areaMapCircle[propName]);
                }

                //label参数默认展现，或者滑过展现的时候，才会去绘制对应的文本
                if (series.label.normal.show || series.label.emphasis.show) {
                    //创建对应的文本
                    _this.areaMapText[propName] = _this.svg.paper.el('text', {
                        id: propName + '-text'
                    }).data('point', circlePoint);
                    //将文本添加到文本集合中
                    _this.areaMapTextG.add(_this.areaMapText[propName]);

                    //设置文本的样式
                    _this.setTextStyle(_this.areaMapText[propName], _this.opts.series.label.normal, _this.areaMapData[propName], circlePoint);

                    //往集合中添加对应的地图区域标记
                    _this.areaMapSet[propName].push(_this.areaMapText[propName]);
                }
            }
        }
    },
    /*
     * 获取区域的path对象
     * */
    getAreaPath: function (outline, key) {

        var _path = outline.selectAll('path').length > 0 ? outline.selectAll('path') : outline;

        // 如果是新疆、兵团、新疆兵团的合计，则将其设置为几乎透明，对应的path为#xinjiang-outline
        if (key == '520000' || key == '480000' || key == 'xinjiangGroup') {
            //设置对应的新疆和兵团为空
            outline.attr({
                fill: 'rgba(0,0,0,0.01)',
                stroke: 'none'
            });
            _path = this.svg.select('#xinjiang-outline');
        }
        return _path;
    },
    /*
     * 设置区域的样式
     * @param {Object} areaSvg 区域svg对象
     * @param {Object} style 区域样式对象
     * @param {Object} data 区域数据对象
     * @param {Number} state 状态 1 正常 2 鼠标滑过 3是置为不可用
     * */
    setAreaStyle: function (areaSvg, style, data, state) {
        var fill = style.areaColor;
        var filter = this.svg.paper.filter(Snap.filter.shadow(style.shadowOffsetX * this.mapRatio, style.shadowOffsetY * this.mapRatio, style.shadowBlur * this.mapRatio, style.shadowColor));
        //如果是热力图的话，并且状态是1的时候
        if (this.opts.series.type === 'heatmap' && state === 1) {
            var visualMap = this.opts.visualMap;
            var value = data[visualMap.props];
            //如果是新疆或者兵团，最后的值取的是新疆兵团的合计值
            if((data.mapId === '480000' || data.mapId === '520000') && this.areaMapData[this.MAP_PREFIX + 'xinjiangGroup']) {
                value = this.areaMapData[this.MAP_PREFIX + 'xinjiangGroup'][visualMap.props];
            }
            //如果是连续的
            if (this.opts.visualMap.type === 'continuous') {
                //获取属性对应的分割段数的位置索引
                var cIndex = ((value - visualMap.min) / (visualMap.max - visualMap.min)) * this.STEPS;
                if (cIndex < 0) {
                    cIndex = 0;
                } else if (cIndex > this.STEPS) {
                    cIndex = this.STEPS;
                }
                fill = this.gradientColor[cIndex];
            } else if (this.opts.visualMap.type === 'piecewise') {   //如果是分段的
                //如果设置了自定义分段属性pieces
                if (!!this.opts.visualMap.pieces) {
                    //满足最小值标识，满足最大值标识，满足两个值的索引
                    var minFlag = false,
                        maxFlag = false,
                        pIndex = 0;
                    for (var i = (visualMap.pieces.length - 1); i >= 0; i--) {
                        var pieceData = visualMap.pieces[i];
                        //如果最小值不存在 或者数值比最小值要大
                        if (!visualMap.pieces[i].min || value > visualMap.pieces[i].min) {
                            minFlag = true;
                        } else {
                            minFlag = false;
                        }
                        //如果最大值不存在 或者 数值不大于最大值
                        if (!visualMap.pieces[i].max || value <= visualMap.pieces[i].max) {
                            maxFlag = true;
                        } else {
                            maxFlag = false;
                        }
                        if (minFlag && maxFlag) {
                            pIndex = i;
                            break;
                        }
                    }
                    fill = visualMap.inRange.color[pIndex];
                } else {    //否则通过splitNumber去判断对应的填充
                    //获取对应的索引
                    var index = Math.floor(value / ((visualMap.max - visualMap.min) / visualMap.splitNumber));
                    if (index < 0) {
                        index = 0;
                    } else if (index > (visualMap.splitNumber - 1)) {
                        index = visualMap.splitNumber - 1;
                    }
                    fill = visualMap.inRange.color[index];
                }
            }
        }
        areaSvg.attr({
            stroke: style.borderColor,
            strokeWidth: style.borderWidth * this.mapRatio,
            fill: fill,
            filter: filter, //对应的阴影
            cursor: 'pointer',
            display: 'block'
        });
    },
    /*
     * 设置标识的样式
     * @param {Object} symbolSvg 标识svg对象
     * @param {Object} style 样式对象
     * @param {Object} data 区域数据
     * @param {Object} point 坐标
     * @param {Object} propName 标记
     * */
    setSymbolStyle: function (symbolSvg, style,data,point,propName) {
        if(data){
            var _this=this,
                _shadow= _this.svg.filter(Snap.filter.shadow(style.outer.shadow.dx, style.outer.shadow.dy, style.outer.shadow.blur, style.outer.shadow.color)),
                _ratio=_this.mapRatio*style.ratio;
            if(data.csrs>10000){
                _ratio=_ratio;
            }else if(data.csrs<3000){
                _ratio*=0.5;
            }else{
                _ratio*=0.7;
            }
            _this.animateCircleOuter[propName]=_this.svg.paper.ellipse(point.x,point.y,0,0).attr({
                filter:_shadow,
                stroke:style.outer.stroke,
                "stroke-width":style.outer.strokeWidth
            }).data("data",{
                x:point.x,
                y:point.y,
                rx:style.outer.radius[0]*_ratio,
                ry:style.outer.radius[1]*_ratio
            });
            _this.animateCircleInner[propName]=_this.svg.paper.ellipse(point.x,point.y,0,0).attr({
                fill:style.inner.fill,
                stroke:style.inner.stroke,
                "stroke-width":style.inner.strokeWidth
            }).data("data",{
                x:point.x,
                y:point.y,
                rx:style.inner.radius[0]*_ratio,
                ry:style.inner.radius[1]*_ratio
            });
            _this.animateImg[propName]=_this.svg.paper.image(style.img.src,point.x,point.y,0,0).data("data",{
                x:point.x,
                y:point.y,
                width:style.img.size[0]*_ratio,
                height:style.img.size[1]*_ratio
            });
            symbolSvg.add(_this.animateCircleOuter[propName],_this.animateCircleInner[propName],_this.animateImg[propName])
        };
        symbolSvg.attr({
            display: style.show?'block':'none'
        })
    },
    /*
     * 设置文本样式
     * @param {Object} textSvg 文本svg对象
     * @param {Object} style 样式对象
     * @param {Object} data 对应的区域数据对象
     * @param {Object} {x, y} point 对应位置坐标
     * */
    setTextStyle: function (textSvg, style, data, point) {
        var _this = this;
        //默认的时候展现名称
        var _text = data.name;
        //如果label有formatter属性
        if (style.formatter) {
            _text = style.formatter(data);
        }
        var _fontSize = style.textStyle.fontSize * _this.mapRatio;

        textSvg.attr({
            text: _text,   //为对应的名称
            //x轴坐标 对应x轴坐标加上x轴的偏移量
            x: _this.matrix.x(parseFloat(point.x), parseFloat(point.y)) + style.offset[0] * _this.mapRatio,
            //y轴坐标 对应y轴坐标加上y轴的偏移量
            y: _this.matrix.y(parseFloat(point.x), parseFloat(point.y)) + style.offset[1] * _this.mapRatio,
            fontSize: (_fontSize < 12 ? 12 : _fontSize) + 'px',   //字体大小
            fill: style.textStyle.color,  //字体颜色
            fontFamily: style.textStyle.fontFamily,   //字体系列
            textAnchor: style.textStyle.align,    //水平对齐方式
            display: style.show ? 'block' : 'none',   //默认是否展现
            cursor: 'pointer'
        });
        //如果字体小于12，则需要将文本进行缩放，因为谷歌浏览器最小字体是识别12号字体
        if (_fontSize < 12) {
            textSvg.attr({
                transform: 's' + (_fontSize / 12)
            });
        }
    },
    /*
    * 创建覆盖全部的svg对象
    * 即该svg对象会占满元素的全部地方
    * */
    createFullSvg: function() {
        var _this = this;
        // 创建操作svg的另外一个svg对象
        _this.fullSvg = Snap('100%', '100%').attr({
            id : 'svgFull'
        });

        //追加到现在的dom后面
        _this.dom.appendChild(_this.fullSvg.node);

        // 添加样式
        $('#svgFull').css({
            position : 'absolute',
            top : 0,
            left : 0,
            zIndex : 99
        });

        // 设置样式
        _this.fullSvg.attr({
            viewBox : '0 0 ' + _this.dom.offsetWidth + ' ' + _this.dom.offsetHeight,
            'pointer-events' : 'none'
        });

        // 绑定浏览器事件
        $(window).off('resize.snap').on('resize.snap', function () {
            _this.fullSvg.attr({
                viewBox : '0 0 ' + _this.dom.offsetWidth + ' ' + _this.dom.offsetHeight,
                'pointer-events' : 'none'
            });
        });
    },
    /*
    * 创建动画效果
    *
    * */
    addAnimate:function () {
        var _this=this,
            _opts=_this.opts.series.symbol.animate;

        var _scope={
            outerData:{},
            innerData:{},
            imgData:{},
            setSize:function (ratio) {
                //先将将元素属性置零
                $.each(_this.animateCircleOuter,function (key,value) {
                    _scope.outerData=_this.animateCircleOuter[key].data("data");
                    _this.animateCircleOuter[key].attr({
                        rx:_scope.outerData.rx*ratio,
                        ry:_scope.outerData.ry*ratio,
                    });
                    _scope.innerData=_this.animateCircleInner[key].data("data");
                    _this.animateCircleInner[key].attr({
                        rx:_scope.innerData.rx*ratio,
                        ry:_scope.innerData.ry*ratio,
                    });
                    _scope.imgData=_this.animateImg[key].data("data");
                    _this.animateImg[key].attr({
                        x:_scope.imgData.x-_scope.imgData.width*ratio/2,
                        y:_scope.imgData.y-_scope.imgData.height*ratio,
                        width:_scope.imgData.width*ratio,
                        height:_scope.imgData.height*ratio
                    });
                })
            },
            addLoadAnimate:function () {
                _scope.setSize(0);
                Snap.animate(0, 1, function (value) {
                    _scope.setSize(value);
                }, _opts.loadAnimate.duration, mina.easeout(), function () {
                });
            },
            //添加波浪效果
            addNormalAnimate:function (direction) {
                var start=direction?_opts.normalAnimate.ratio:1,
                    end=direction?1:_opts.normalAnimate.ratio;
                Snap.animate(start, end, function (time) {
                    $.each(_this.animateCircleOuter,function (key,value) {
                        _scope.outerData=value.data("data");
                        value.attr({
                            opacity : time,
                            rx:_scope.outerData.rx*time,
                            ry:_scope.outerData.ry*time,
                        });
                        _scope.innerData=_this.animateCircleInner[key].data("data");
                        _this.animateCircleInner[key].attr({
                            opacity : time,
                            rx:_scope.innerData.rx*time,
                            ry:_scope.innerData.ry*time,
                        });
                    })
                }, _opts.normalAnimate.duration, mina.easeout(), function () {
                    _scope.addNormalAnimate(!direction);
                });

            }
        }
        if(_opts.loadAnimate.show){
            setTimeout(function () {
                _scope.addLoadAnimate();
            },_opts.loadAnimate.delay);
        }
        if(_opts.normalAnimate.show){
            _scope.addNormalAnimate(true);
        }
    },
    /*
     * 绘制视觉映射组件
     * */
    createVisualMap: function () {
        //如果不展现并且类型是不是热力图，则不用创建
        if (this.opts.series.type != 'heatmap' || !this.opts.visualMap.show) {
            return;
        }
        this.visualMap = {
            group: this.fullSvg.paper.g()   //创建视觉图映射插件的集合
        };    //创建了对应的视觉映射组件对象

        //设置其可以有操作事件
        this.visualMap.group.attr({
            'pointer-events': 'auto'
        });

        //起点坐标
        var startPoint = this.getVisualMapStartP();
        //如果是连续型的
        if (this.opts.visualMap.type === 'continuous') {
            //绘制连续型的视觉映射组件
            this.drawContinuousVisualMap(startPoint);
        } else if (this.opts.visualMap.type === 'piecewise') {   //如果是分段型的
            //绘制分段型的视觉映射组件
            this.drawPiecewiseVisualMap(startPoint);
        }
        var translateX = 0, translateY = 0;
        var groupBox = this.visualMap.group.getBBox();
        if(this.opts.visualMap.left === 'center') {
            translateX = -groupBox.width / 2;
        } else if(this.opts.visualMap.left === 'right') {
            translateX = -groupBox.width;
        }
        if(this.opts.visualMap.top === 'center') {
            translateY = -groupBox.height / 2;
        } else if(this.opts.visualMap.top === 'bottom') {
            translateY = -groupBox.height;
        }
        this.visualMap.group.attr({
            transform: 't' + translateX + ',' + translateY
        });
    },
    /*
    * 获取视觉映射组件的起点坐标
    * */
    getVisualMapStartP: function() {
        var _this = this;
        var visualMap = _this.opts.visualMap;

        //创建起点坐标对象
        var point = {
            x: 0,
            y:  0
        };
        //获取x轴的起点
        if(visualMap.left === 'left') {
            point.x = 0;
        } else if(visualMap.left === 'center'){
            point.x = _this.dom.offsetWidth / 2;
        } else if(visualMap.left === 'right') {
            point.x = _this.dom.offsetWidth;
        } else {
            point.x = _this.handlePosValue(visualMap.left);
        }

        if(point.x < _this.opts.grid.left) {
            point.x = _this.opts.grid.left
        } else if(point.x > (_this.dom.offsetWidth - _this.opts.grid.right)) {
            point.x = (_this.dom.offsetWidth - _this.opts.grid.right);
        }

        //获取y轴的起点
        if(visualMap.top === 'top') {
            point.y = 0;
        } else if(visualMap.top === 'center'){
            point.y = _this.dom.offsetHeight / 2;
        } else if(visualMap.top === 'bottom') {
            point.y = _this.dom.offsetHeight;
        } else {
            point.y = _this.handlePosValue(visualMap.top);
        }
        if(point.y < _this.opts.grid.top) {
            point.y = _this.opts.grid.top;
        } else if(point.y > (_this.dom.offsetHeight - _this.opts.grid.bottom)) {
            point.y = (_this.dom.offsetHeight - _this.opts.grid.bottom);
        }
        return point;
    },
    /*
     * 创建连续型的视觉映射组件
     * */
    drawContinuousVisualMap: function (startPoint) {
        var _this = this;
        //获取视觉映射的样式对象
        var visualMap = _this.opts.visualMap;

        //设置视觉映射组件的数值数组
        _this.visualMap.stopValues = _this.getColorStopValues(visualMap.min, visualMap.max);

        var rectInfo = _this.getVisualMapRectInfo(visualMap, startPoint);
        //颜色背景区域
        _this.visualMap.colorAreaBg = _this.fullSvg.paper.el('rect', {
            x: rectInfo.x,
            y: rectInfo.y,
            width: rectInfo.width,
            height: rectInfo.height,
            fill: '#ccc',
            stroke: 'none'
        });
        _this.visualMap.group.add(_this.visualMap.colorAreaBg);

        //创建裁剪区域，为了鼠标滑到两端的顶点附近，三角形展现超出的问题
        _this.visualMap.colorAreaClipPath = _this.fullSvg.paper.el('clipPath', {
            id: 'colorarea-clipPath'
        });
        //创建裁剪区域的元素
        _this.visualMap.colorAreaClipPathEle = _this.fullSvg.paper.el('rect', {
            x: rectInfo.x,
            y: rectInfo.y,
            width: rectInfo.width,
            height: rectInfo.height
        });
        _this.visualMap.colorAreaClipPath.append(_this.visualMap.colorAreaClipPathEle);
        _this.fullSvg.select('defs').append(_this.visualMap.colorAreaClipPath);

        //创建对应的颜色区域
        _this.visualMap.colorArea = _this.visualMap.colorAreaBg.clone().attr({
            clipPath: 'url(#colorarea-clipPath)',
            fill: rectInfo.fill,
            stroke: visualMap.borderColor,
            strokeWidth: visualMap.borderWidth
        });
        _this.visualMap.group.add(_this.visualMap.colorArea);

        //如果存在两端文本，则创建对应的两端文本
        if (visualMap.text && visualMap.text.length && visualMap.text.length > 1) {
            //创建两端文本
            _this.createBothEndsText(visualMap, rectInfo);
        }
        //如果显示拖拽用的手柄，则需绘制对应的拖拽手柄
        if (visualMap.calculable) {
            //获取手柄的点的位置
            var handShankPoints = _this.getHandShankPoints(visualMap, rectInfo);
            _this.drawHandShank(visualMap, handShankPoints);  //绘制拖拽手柄
        }

        //如果存在鼠标悬浮
        if (visualMap.hoverLink) {
            _this.drawHoverLink();  //绘制悬浮元素
        }
    },
    /*
    * 创建视觉插件的两端文字
    * */
    createBothEndsText: function(visualMap, rectInfo) {
        var _this = this;
        //创建两端文本对象
        var bothEndsText = {};
        //创建最小和最大的文本信息对象
        var minTextInfo = {
            x: rectInfo.x + visualMap.itemWidth / 2,
            y: rectInfo.y + visualMap.itemHeight + visualMap.textGap + visualMap.textStyle.fontSize,
            textAnchor: 'middle'
        }, maxTextInfo = {
            x: rectInfo.x + visualMap.itemWidth/ 2,
            y: rectInfo.y - visualMap.textGap,
            textAnchor: 'middle'
        };
        //如果是水平的
        if(visualMap.orient === 'horizontal') {
            minTextInfo.x = rectInfo.x - visualMap.textGap;
            minTextInfo.y = rectInfo.y + visualMap.itemWidth;
            minTextInfo.textAnchor = 'end';

            maxTextInfo.x = rectInfo.x + visualMap.itemHeight + visualMap.textGap;
            maxTextInfo.y = rectInfo.y + visualMap.itemWidth;
            maxTextInfo.textAnchor = 'start';
        }
        bothEndsText.min = _this.fullSvg.paper.el('text', {
            text: visualMap.text[1],
            x: minTextInfo.x,
            y: minTextInfo.y,
            fill: visualMap.textStyle.color,
            textAnchor: minTextInfo.textAnchor,
            fontSize: visualMap.textStyle.fontSize + 'px',
            fontFamily: visualMap.textStyle.fontFamily,
            fontWeight: visualMap.textStyle.fontWeight,
            fontStyle: visualMap.textStyle.fontStyle
        });
        _this.visualMap.group.add(bothEndsText.min);

        bothEndsText.max = _this.fullSvg.paper.el('text', {
            text: visualMap.text[0],
            x: maxTextInfo.x,
            y: maxTextInfo.y,
            fill: visualMap.textStyle.color,
            textAnchor: maxTextInfo.textAnchor,
            fontSize: visualMap.textStyle.fontSize + 'px',
            fontFamily: visualMap.textStyle.fontFamily,
            fontWeight: visualMap.textStyle.fontWeight,
            fontStyle: visualMap.textStyle.fontStyle
        });
        if(visualMap.orient === 'horizontal') {
            bothEndsText.min.attr({
                transform: 't0,' + (visualMap.textStyle.fontSize - 4 - visualMap.itemWidth) / 2
            });
            bothEndsText.max.attr({
                transform: 't0,' + (visualMap.textStyle.fontSize - 4 - visualMap.itemWidth) / 2
            });
        }
        _this.visualMap.group.add(bothEndsText.max);
        return bothEndsText;
    },
    /*
    * 获取矩形的信息
    * */
    getVisualMapRectInfo: function(visualMap, startPoint) {
        var _this = this;

        var rectInfo = {
            x: startPoint.x,
            y: startPoint.y,
            width: visualMap.itemWidth,
            height:visualMap.itemHeight,
            fill: 'none'
        };
        var colorStr = '';
        for (var i = 0; i < visualMap.inRange.color.length; i++) {
            colorStr += visualMap.inRange.color[i];
            if (i < (visualMap.inRange.color.length - 1)) {
                colorStr += '-';
            }
        }
        //如果方向是水平的
        if(visualMap.orient === 'horizontal') {
            rectInfo.width = visualMap.itemHeight;
            rectInfo.height = visualMap.itemWidth;
            rectInfo.fill = _this.svg.paper.gradient('l(0,0.5,1,0.5)' + colorStr);
        } else {    //如果是垂直方向
            rectInfo.fill = _this.svg.paper.gradient('l(0.5,1,0.5,0)' + colorStr);
        }
        return rectInfo;
    },
    /*
     * 创建分段型的视觉映射组件
     * */
    drawPiecewiseVisualMap: function (startPoint) {
        var _this = this;
        //获取视觉映射的样式对象
        var visualMap = _this.opts.visualMap;

        var legendList = [];
        //图例文本坐标[x, y]
        var pointLengend = {
            x: startPoint.x,
            y: startPoint.y
        };
        var visualMapObj = {
            group: _this.fullSvg.paper.g() //分段型的视觉映射插件集合
        };
        _this.visualMap.group.add(visualMapObj.group);

        visualMapObj.legendList = legendList;  //图例数组

        //当pieces属性存在，则按照pieces绘制对应的图例
        if (visualMap.pieces) {
            for (var j = 0; j < visualMap.pieces.length; j++) {
                //绘制对应的图例
                var legend = _this.drawPiecewiseLegend((pointLengend, [visualMap.pieces[j].min, visualMap.pieces[j].max], visualMap.inRange.color[j]));
                legendList.push(legend);
                visualMapObj.group.add(legend.group);

                if(visualMap.orient === 'horizontal') {
                    pointLengend.x += legend.group.getBBox().width + visualMap.itemGap
                } else {
                    pointLengend.y -= (visualMap.itemHeight + visualMap.itemGap);
                }
            }
        } else {    //否则按照splitNumber去绘制对应的图例
            //每段间隔
            var segment = (visualMap.max - visualMap.min) / visualMap.splitNumber;
            var range = [visualMap.min, visualMap.min + segment];
            for (var i = 0; i < visualMap.splitNumber; i++) {
                //对应的填充颜色
                var color = visualMap.inRange.color[i];
                //绘制对应的图例
                var legend = _this.drawPiecewiseLegend(pointLengend, range, color);
                legendList.push(legend);
                visualMapObj.group.add(legend.group);

                range[0] += segment;
                range[1] += segment;
                if(visualMap.orient === 'horizontal') {
                    pointLengend.x += legend.group.getBBox().width + visualMap.itemGap
                } else {
                    pointLengend.y -= (visualMap.itemHeight + visualMap.itemGap);
                }
            }
        }
        if(visualMap.orient != 'horizontal') {
            visualMapObj.group.attr({
                transform: 't0,' + (visualMapObj.group.getBBox().height - visualMap.itemHeight)
            });
        }
        //是否可以被选中
        if (visualMap.calculable) {
            //添加图例选中事件
            _this.selectedLegend(legendList);
        }
        //如果鼠标悬浮属性为true
        if (visualMap.hoverLink) {
            //定义鼠标滑过高亮数组对象
            _this.visualMap.hoverLinkHighLight = [];
            //定义图例鼠标滑过事件
            _this.hoverLegend(legendList);
        }
    },
    /*
     * 图例选中事件
     * */
    selectedLegend: function (legendList) {
        var _this = this;
        $.each(legendList, function (index, legend) {
            //添加点击事件
            legend.group.click(function () {
                //获取状态
                var state = this.data('active');
                //获取范围
                var range = this.data('range');
                //如果当前状态是活跃的
                if (state) {
                    $.each(_this.areaMapData, function (key, data) {
                        var propValue = data[_this.opts.visualMap.props];
                        if (propValue >= range[0] && propValue <= range[1]) {
                            //置为不可用
                            _this.disableArea(key, _this.areaMapSet[key], data);
                        }
                    });
                    //置为不可点
                    _this.disabledLegend(legend);
                } else {
                    $.each(_this.areaMapData, function (key, data) {
                        var propValue = data[_this.opts.visualMap.props];
                        if (propValue >= range[0] && propValue <= range[1]) {
                            //重置
                            _this.resetArea(key, _this.areaMapSet[key], data);
                        }
                    });
                    //重置图例
                    _this.resetLegend(legend);
                }
                //设置状态为当前状态相反的状态
                this.data('active', !state);
            });
        });
    },
    /*
     * 图例滑过事件
     * */
    hoverLegend: function (legendList) {
        var _this = this;
        $.each(legendList, function (index, legend) {
            legend.group.hover(
                //鼠标滑过事件
                function () {
                    _this.highLightByValue(this.data('range')); //高亮对应的区域
                },
                //鼠标滑出事件
                function () {
                    _this.resetHoverLinkHightLight(_this.visualMap.hoverLinkHighLight); //重置对应的高亮区域
                }
            )
        });
    },
    /*
     * 绘制分段型的视觉映射组件-图例
     * */
    drawPiecewiseLegend: function (point, range, color) {
        var _this = this;
        //获取视觉映射的样式对象
        var visualMap = _this.opts.visualMap;

        //创建一个图例对象
        var legend = {};

        //创建图例组
        legend.group = _this.fullSvg.paper.g().attr({
            cursor: 'pointer'
        }).data('range', [range[0], range[1]])  //添加范围数组数据
            .data('active', true);  //添加活跃状态数据

        //创建对应的矩形
        legend.rect = _this.fullSvg.paper.el('rect', {
            x: point.x,
            y: point.y,
            width: visualMap.itemWidth,
            height: visualMap.itemHeight,
            fill: color,
            stroke: 'none'
        }).data('color', color);
        legend.group.add(legend.rect);

        legend.text = _this.fullSvg.paper.el('text', {
            text: range[0] + '-' + range[1],
            x: point.x + (visualMap.itemWidth + 10),
            y: point.y + visualMap.itemHeight,
            fill: visualMap.textStyle.color,
            textAnchor: 'start',
            fontSize: visualMap.textStyle.fontSize + 'px',
            fontFamily: visualMap.textStyle.fontFamily,
            fontWeight: visualMap.textStyle.fontWeight,
            fontStyle: visualMap.textStyle.fontStyle
        });
        var textBox = legend.text.getBBox();
        legend.text.attr({
            transform: 't0,' + (-(textBox.height - visualMap.itemHeight) / 2)
        });
        legend.group.add(legend.text);
        return legend;
    },
    /*
     * 将图例置为不可用
     * */
    disabledLegend: function (legend) {
        legend.rect.attr({
            fill: '#eee'
        });
        legend.text.attr({
            opacity: 0.5
        });
    },
    /*
     * 重置图例
     * */
    resetLegend: function (legend) {
        var _this = this;
        legend.rect.attr({
            fill: legend.rect.data('color')
        });
        legend.text.attr({
            opacity: 1
        });
    },
    /*
     * 绘制拖拽手柄
     * */
    drawHandShank: function (visualMap, handShankPoints) {
        var _this = this;

        //创建手柄对象
        var handShank = {
            group: _this.svg.paper.g(), //手柄集合
            max: {},    //最大值手柄
            min: {}     //最小值手柄
        };

        _this.visualMap.handShankMaxG = _this.fullSvg.paper.g().attr({
            cursor: 'move'
        }).data('offset', 0);
        _this.visualMap.group.add(_this.visualMap.handShankMaxG);

        //创建对应的手柄
        _this.visualMap.handShankMax = _this.fullSvg.paper.el('polygon', {
            points: handShankPoints.maxPoints.join(','),
            fill: _this.gradientColor[_this.gradientColor.length - 1],
            stroke: 'none'
        });
        _this.visualMap.handShankMaxG.add(_this.visualMap.handShankMax);

        _this.visualMap.handShankMaxText = _this.fullSvg.paper.el('text', {
            text: visualMap.max,
            x: handShankPoints.maxTextPoints[0],
            y: handShankPoints.maxTextPoints[1],
            fill: visualMap.textStyle.color,
            fontSize: visualMap.textStyle.fontSize + 'px',
            fontFamily: visualMap.textStyle.fontFamily,
            fontWeight: visualMap.textStyle.fontWeight,
            fontStyle: visualMap.textStyle.fontStyle
        });
        _this.visualMap.handShankMaxG.add(_this.visualMap.handShankMaxText);

        _this.visualMap.handShankMinG = _this.fullSvg.paper.g().attr({
            cursor: 'move'
        }).data('offset', 0);
        _this.visualMap.group.add(_this.visualMap.handShankMinG);

        //创建对应的手柄
        _this.visualMap.handShankMin = _this.fullSvg.paper.el('polygon', {
            points: handShankPoints.minPoints.join(','),
            fill: _this.gradientColor[0],
            stroke: 'none'
        });
        _this.visualMap.handShankMinG.add(_this.visualMap.handShankMin);

        _this.visualMap.handShankMinText = _this.fullSvg.paper.el('text', {
            text: visualMap.min,
            x: handShankPoints.minTextPoints[0],
            y: handShankPoints.minTextPoints[1],
            textAnchor: (visualMap.orient === 'horizontal' ? 'end' : 'start'),
            fill: visualMap.textStyle.color,
            fontSize: visualMap.textStyle.fontSize + 'px',
            fontFamily: visualMap.textStyle.fontFamily,
            fontWeight: visualMap.textStyle.fontWeight,
            fontStyle: visualMap.textStyle.fontStyle
        });
        _this.visualMap.handShankMinG.add(_this.visualMap.handShankMinText);

        //设置手柄的范围
        _this.visualMap.handShankRange = [visualMap.min, visualMap.max];

        //绘制最大的手柄
        _this.dragHandShankMax();
        //绘制最小的手柄
        _this.dragHandShankMin();
    },
    /*
    * 获取手柄的坐标
    * */
    getHandShankPoints: function(visualMap, rectInfo) {
        var _this = this;
        //创建手柄坐标对象
        var handShankPoints = {
            minPoints: [],  //最小值坐标
            minTextPoints: [],  //最小值文本坐标
            maxPoints: [],   //最大值坐标
            maxTextPoints: []   //最大值文本坐标
        };
        //三角形的边长
        var triangleSideLen = 10;

        //如果是水平
        if(visualMap.orient === 'horizontal') {
            //最小值
            //第一个点
            handShankPoints.minPoints.push(rectInfo.x);
            handShankPoints.minPoints.push(rectInfo.y);
            //第二个点
            handShankPoints.minPoints.push(handShankPoints.minPoints[0]);
            handShankPoints.minPoints.push(rectInfo.y - triangleSideLen);
            //第三个点
            handShankPoints.minPoints.push(rectInfo.x - triangleSideLen);
            handShankPoints.minPoints.push(handShankPoints.minPoints[3]);

            //最小值文本坐标
            handShankPoints.minTextPoints.push((handShankPoints.minPoints[4] - visualMap.textGap));
            handShankPoints.minTextPoints.push((handShankPoints.minPoints[1]));

            //最大值
            //第一个点
            handShankPoints.maxPoints.push(rectInfo.x + visualMap.itemHeight);
            handShankPoints.maxPoints.push(rectInfo.y);
            //第二个点
            handShankPoints.maxPoints.push(handShankPoints.maxPoints[0]);
            handShankPoints.maxPoints.push(rectInfo.y - triangleSideLen);
            //第三个点
            handShankPoints.maxPoints.push(rectInfo.x + visualMap.itemHeight + triangleSideLen);
            handShankPoints.maxPoints.push(handShankPoints.maxPoints[3]);

            //最大值文本坐标
            handShankPoints.maxTextPoints.push((handShankPoints.maxPoints[4] + visualMap.textGap));
            handShankPoints.maxTextPoints.push((handShankPoints.maxPoints[1]));
        } else {
            //最小值
            //起点x坐标
            handShankPoints.minPoints.push(rectInfo.x + visualMap.itemWidth);
            //起点y坐标
            handShankPoints.minPoints.push(rectInfo.y + visualMap.itemHeight);
            //第二个点x坐标
            handShankPoints.minPoints.push(rectInfo.x + visualMap.itemWidth + visualMap.textGap);
            //第二个点y坐标
            handShankPoints.minPoints.push(handShankPoints.minPoints[1]);
            //第三个点x坐标
            handShankPoints.minPoints.push(handShankPoints.minPoints[2]);
            //第三个点y坐标
            handShankPoints.minPoints.push(rectInfo.y + visualMap.itemHeight + visualMap.textGap);

            //最小值文本坐标
            handShankPoints.minTextPoints.push((handShankPoints.minPoints[2] + visualMap.textGap));
            handShankPoints.minTextPoints.push((handShankPoints.minPoints[5]));

            //最大值
            //起点x坐标
            handShankPoints.maxPoints.push(rectInfo.x + visualMap.itemWidth);
            //起点y坐标
            handShankPoints.maxPoints.push(rectInfo.y);
            //第二个点x坐标
            handShankPoints.maxPoints.push(rectInfo.x + visualMap.itemWidth +  visualMap.textGap);
            //第二个点y坐标
            handShankPoints.maxPoints.push(handShankPoints.maxPoints[1]);
            //第三个点x坐标
            handShankPoints.maxPoints.push(handShankPoints.maxPoints[2]);
            //第三个点y坐标
            handShankPoints.maxPoints.push(rectInfo.y -  visualMap.textGap);

            //最大值文本坐标
            handShankPoints.maxTextPoints.push((handShankPoints.maxPoints[2] + visualMap.textGap));
            handShankPoints.maxTextPoints.push((handShankPoints.maxPoints[1]));
        }
        return handShankPoints;
    },
    /*
     * 拖拽最大值的手柄
     * */
    dragHandShankMax: function () {
        var _this = this;
        var offset = 0;
        _this.visualMap.handShankMaxG.drag(
            //onmove方法
            function (dx, dy, x, y, event) {
                offset = parseFloat(this.data('offset'));
                var transform = '';
                //如果是水平的
                if(_this.opts.visualMap.orient === 'horizontal') {
                    offset += dx;
                    if(offset > 0) {
                        offset = 0;
                    } else if(Math.abs(offset) >  _this.opts.visualMap.itemHeight) {
                        offset = -_this.opts.visualMap.itemHeight;
                    }
                    transform = 't' + offset + ',0';
                } else {
                    offset += dy;
                    if (offset < 0) {
                        offset = 0;
                    } else if (offset > _this.opts.visualMap.itemHeight) {
                        offset = _this.opts.visualMap.itemHeight;
                    }
                    transform = 't0,' + offset;
                }
                this.attr({
                    transform: transform
                });

                var value = _this.opts.visualMap.min + ((_this.opts.visualMap.itemHeight - Math.abs(offset)) / _this.opts.visualMap.itemHeight) * (_this.opts.visualMap.max - _this.opts.visualMap.min);
                _this.visualMap.handShankMaxText.attr({
                    text: parseInt(value)
                });

                var index = parseInt(((_this.opts.visualMap.itemHeight - Math.abs(offset)) / _this.opts.visualMap.itemHeight) * _this.STEPS);
                if (index >= _this.STEPS) {
                    index = _this.STEPS - 1;
                }
                _this.visualMap.handShankMax.attr({
                    fill: _this.gradientColor[index]
                });

                //最大值改变
                _this.visualMap.handShankRange[1] = parseInt(value);

                if ((_this.opts.visualMap.itemHeight - Math.abs(offset)) < Math.abs(_this.visualMap.handShankMinG.data('offset'))) {

                    var minTransform = '';
                    if(_this.opts.visualMap.orient === 'horizontal') {
                        minTransform = 't' + (_this.opts.visualMap.itemHeight - Math.abs(offset)) + ',0';
                    } else {
                        minTransform = 't0,' + (offset - _this.opts.visualMap.itemHeight);
                    }
                    _this.visualMap.handShankMinG.attr({
                        transform: minTransform
                    });

                    var minValue = _this.opts.visualMap.min + ((_this.opts.visualMap.itemHeight - Math.abs(offset)) / (_this.opts.visualMap.itemHeight)) * (_this.opts.visualMap.max - _this.opts.visualMap.min);
                    _this.visualMap.handShankMinText.attr({
                        text: parseInt(minValue)
                    });
                    //最大值改变
                    _this.visualMap.handShankRange[0] = parseInt(minValue);
                    var minIndex = parseInt(( Math.abs(Math.abs(offset) - _this.opts.visualMap.itemHeight) / (_this.opts.visualMap.itemHeight)) * _this.STEPS);
                    if (minIndex >= _this.STEPS) {
                        minIndex = _this.STEPS - 1;
                    }
                    _this.visualMap.handShankMin.attr({
                        fill: _this.gradientColor[minIndex]
                    });
                }

                var distance = ((_this.visualMap.handShankRange[1] - _this.visualMap.handShankRange[0]) / (_this.opts.visualMap.max - _this.opts.visualMap.min)) * (_this.opts.visualMap.itemHeight);
                if(_this.opts.visualMap.orient === 'horizontal') {
                    //设置剪切路径的属性值
                    _this.visualMap.colorAreaClipPathEle.attr({
                        x: parseFloat(_this.visualMap.colorAreaBg.attr('x')) + (_this.opts.visualMap.itemHeight - Math.abs(offset)) - distance,
                        width: distance
                    });
                } else {
                    //设置剪切路径的属性值
                    _this.visualMap.colorAreaClipPathEle.attr({
                        y: parseFloat(_this.visualMap.colorAreaBg.attr('y')) + offset,
                        height: distance
                    });
                }


                //展现区间内的区域
                _this.displayRangeArea(_this.visualMap.handShankRange);
            },
            //start方法
            function (x, y, event) {
            },
            //end方法
            function (x, y, event) {
                this.data('offset', offset);
                if ((_this.opts.visualMap.itemHeight - Math.abs(offset)) < Math.abs(_this.visualMap.handShankMinG.data('offset'))) {
                    //如果是水平的
                    if(_this.opts.visualMap.orient === 'horizontal') {
                        _this.visualMap.handShankMinG.data('offset', (_this.opts.visualMap.itemHeight - Math.abs(offset)));
                    } else {
                        _this.visualMap.handShankMinG.data('offset', (offset - _this.opts.visualMap.itemHeight));
                    }
                }
            }
        );
    },
    /*
     * 拖拽最小值的手柄
     * */
    dragHandShankMin: function () {
        var _this = this;
        var offset = 0;
        _this.visualMap.handShankMinG.drag(
            //onmove方法
            function (dx, dy, x, y, event) {
                offset = parseFloat(this.data('offset'));
                var transform = '';
                if(_this.opts.visualMap.orient === 'horizontal') {
                    offset += dx;
                    if (Math.abs(offset) > _this.opts.visualMap.itemHeight) {
                        offset = _this.opts.visualMap.itemHeight;
                    } else if (offset < 0) {
                        offset = 0;
                    }
                    transform = 't' + offset + ',0';
                } else {
                    offset += dy;
                    if (Math.abs(offset) > _this.opts.visualMap.itemHeight) {
                        offset = -_this.opts.visualMap.itemHeight;
                    } else if (offset > 0) {
                        offset = 0;
                    }
                    transform = 't0,' + offset;
                }

                this.attr({
                    transform: transform
                });
                var value = _this.opts.visualMap.min + (Math.abs(offset) / (_this.opts.visualMap.itemHeight)) * (_this.opts.visualMap.max - _this.opts.visualMap.min);
                _this.visualMap.handShankMinText.attr({
                    text: parseInt(value)
                });

                var index = parseInt((Math.abs(offset) / (_this.opts.visualMap.itemHeight)) * _this.STEPS);
                if (index >= _this.STEPS) {
                    index = _this.STEPS - 1;
                }
                _this.visualMap.handShankMin.attr({
                    fill: _this.gradientColor[index]
                });

                //设置手柄范围的最小值
                _this.visualMap.handShankRange[0] = parseInt(value);

                if (Math.abs(offset) > ((_this.opts.visualMap.itemHeight) - Math.abs(_this.visualMap.handShankMaxG.data('offset')))) {

                    if(_this.opts.visualMap.orient === 'horizontal') {
                        _this.visualMap.handShankMaxG.attr({
                            transform: 't' + (Math.abs(offset) - _this.opts.visualMap.itemHeight) + ',0'
                        });
                    } else {
                        _this.visualMap.handShankMaxG.attr({
                            transform: 't0,' + (_this.opts.visualMap.itemHeight - Math.abs(offset))
                        });
                    }

                    var maxValue = _this.opts.visualMap.min + (Math.abs(offset) / (_this.opts.visualMap.itemHeight)) * (_this.opts.visualMap.max - _this.opts.visualMap.min);
                    _this.visualMap.handShankMaxText.attr({
                        text: parseInt(maxValue)
                    });
                    //最大值改变
                    _this.visualMap.handShankRange[1] = parseInt(maxValue);
                    var maxIndex = parseInt(( Math.abs(offset) / (_this.opts.visualMap.itemHeight)) * _this.STEPS);
                    if (maxIndex >= _this.STEPS) {
                        maxIndex = _this.STEPS - 1;
                    }
                    _this.visualMap.handShankMax.attr({
                        fill: _this.gradientColor[maxIndex]
                    });
                }

                var distance = ((_this.visualMap.handShankRange[1] - _this.visualMap.handShankRange[0]) / (_this.opts.visualMap.max - _this.opts.visualMap.min)) * (_this.opts.visualMap.itemHeight);
                if(_this.opts.visualMap.orient === 'horizontal') {
                    //设置剪切路径的属性值
                    _this.visualMap.colorAreaClipPathEle.attr({
                        x: parseFloat(_this.visualMap.colorAreaBg.attr('x')) + Math.abs(offset),
                        width: distance
                    });
                } else {
                    //设置剪切路径的属性值
                    _this.visualMap.colorAreaClipPathEle.attr({
                        y: parseFloat(_this.visualMap.colorAreaBg.attr('y')) + (_this.opts.visualMap.itemHeight) - Math.abs(offset) - distance,
                        height: distance
                    });
                }

                //展现区间内的区域
                _this.displayRangeArea(_this.visualMap.handShankRange);
            },
            //start方法
            function (x, y, event) {
            },
            //end方法
            function (x, y, event) {
                this.data('offset', offset);
                if (Math.abs(offset) < ((_this.opts.visualMap.itemHeight) - _this.visualMap.handShankMax.data('offset'))) {
                    if(_this.opts.visualMap.orient === 'horizontal') {
                        _this.visualMap.handShankMaxG.data('offset', (Math.abs(offset) - _this.opts.visualMap.itemHeight));
                    } else {
                        _this.visualMap.handShankMaxG.data('offset', (_this.opts.visualMap.itemHeight - Math.abs(offset)));
                    }
                }
            }
        );
    },
    /*
     * 展现区间内的区域
     * */
    displayRangeArea: function (range) {
        var _this = this;
        $.each(_this.areaMapData, function (key, data) {
            var propValue = data[_this.opts.visualMap.props];
            if (propValue < range[0] || propValue > range[1]) {
                //置为不可用
                _this.disableArea(key, _this.areaMapSet[key], data);
            } else {
                //重置
                _this.resetArea(key, _this.areaMapSet[key], data);
            }
        });
    },
    /*
     * 绘制视觉映射组件的鼠标滑过元素
     * */
    drawHoverLink: function () {
        var _this = this;
        //获取视觉映射的样式对象
        var visualMap = _this.opts.visualMap;

        this.visualMap.hoverLinkG = _this.fullSvg.paper.g().attr({
            display: 'none'
        });
        this.visualMap.group.add(this.visualMap.hoverLinkG);

        //创建裁剪区域，为了鼠标滑到两端的顶点附近，三角形展现超出的问题
        _this.visualMap.hoverLinkClipPath = _this.fullSvg.paper.el('clipPath', {
            id: 'hoverLink-clipPath'
        });
        //创建裁剪区域的元素
        _this.visualMap.hoverLinkClipPathEle = _this.fullSvg.paper.el('rect', {
            x: 0,
            y: 0,
            width: 8,
            height: 14
        });
        _this.visualMap.hoverLinkClipPath.append(_this.visualMap.hoverLinkClipPathEle);
        _this.fullSvg.select('defs').append(_this.visualMap.hoverLinkClipPath);

        //创建鼠标滑过元素
        _this.visualMap.hoverLink = _this.fullSvg.paper.el('polygon', {
            points: [0, 0],
            clipPath: 'url(#hoverLink-clipPath)',
            fill: 'none',
            stroke: 'none'
        });
        this.visualMap.hoverLinkG.add(_this.visualMap.hoverLink);

        _this.visualMap.hoverLinkText = _this.fullSvg.paper.el('text', {
            text: '≈',
            x: 0,
            y: 0,
            fill: visualMap.textStyle.color,
            textAnchor: 'middle',
            fontSize: visualMap.textStyle.fontSize + 'px',
            fontFamily: visualMap.textStyle.fontFamily,
            fontWeight: visualMap.textStyle.fontWeight,
            fontStyle: visualMap.textStyle.fontStyle
        });
        _this.visualMap.hoverLinkG.add(_this.visualMap.hoverLinkText);

        //定义高亮的区域数组
        _this.visualMap.hoverLinkHighLight = [];

        //触发悬浮事件
        _this.triggerHoverLink();
    },
    /*
     * 触发鼠标悬浮事件
     * */
    triggerHoverLink: function () {
        var _this = this;
        var colorAreaBox = _this.visualMap.colorArea.getBBox();
        _this.visualMap.colorArea.hover(
            //鼠标滑过事件
            function (event) {
                event = event || window.event;
                var $target = $(event.target);
                //定义偏移量
                var offset = 0,
                    point = {x: 0, y: 0};   //坐标
                if(_this.opts.visualMap.orient === 'horizontal') {
                    offset = (event.pageX - $target.offset().left);
                    point = {
                        x: colorAreaBox.x + offset,
                        y: colorAreaBox.y
                    };
                } else {
                    offset = (event.pageY - $target.offset().top);
                    point = {
                        x: colorAreaBox.x2,
                        y: colorAreaBox.y + offset
                    };
                }
                //更新鼠标悬浮元素
                _this.updateHoverLink(point, offset);
                //展现鼠标悬浮元素
                _this.showHoverLink();
            },
            //鼠标离开事件
            function () {
                //隐藏鼠标悬浮
                _this.hideHoverLink();
                //重置高亮区域
                _this.resetHoverLinkHightLight(_this.visualMap.hoverLinkHighLight);
            }
        ).mousemove(    //鼠标悬浮
            function (event) {
                event = event || window.event;
                var $target = $(event.target);
                //定义偏移量
                var offset = 0,
                    point = {x: 0, y: 0};   //坐标
                if(_this.opts.visualMap.orient === 'horizontal') {
                    offset = (event.pageX - $target.offset().left);
                    point = {
                        x: colorAreaBox.x + offset,
                        y: colorAreaBox.y
                    };
                } else {
                    offset = (event.pageY - $target.offset().top);
                    point = {
                        x: colorAreaBox.x2,
                        y: colorAreaBox.y + offset
                    };
                }
                //更新鼠标悬浮元素
                _this.updateHoverLink(point, offset);
            }
        );
    },
    /*
     * 展现鼠标悬浮
     * */
    showHoverLink: function () {
        this.visualMap.hoverLinkG.attr({
            display: 'block'
        });
    },
    /*
     * 隐藏鼠标悬浮
     * */
    hideHoverLink: function () {
        this.visualMap.hoverLinkG.attr({
            display: 'none'
        });
    },
    /*
     * 更新鼠标滑过元素的位置
     * @param {Object} {x, y} point 位置坐标
     * @param {Number} offset 偏移量
     * */
    updateHoverLink: function (point, offset) {
        var _this = this;
        var colorAreaBox = _this.visualMap.colorArea.getBBox();
        var points = [];

        //剪切路径样式
        var clipPathStyle = {};
        var itemOffset = _this.opts.visualMap.itemHeight - offset; //偏移量
        if(_this.opts.visualMap.orient === 'horizontal') {
            if(_this.opts.visualMap.orient === 'horizontal') {
                itemOffset = offset;
            }
            //第一个点x轴坐标，即三角形的左上角
            points.push(point.x - 7);
            //第一个点y轴坐标，即三角形的左上角
            points.push(point.y);
            //第二个点x轴坐标，即三角形的左下角
            points.push(point.x + 7);
            //第二个点y轴坐标，即三角形的左下角
            points.push(points[1]);
            //第三个点x轴坐标，即三角形的右侧
            points.push(point.x);
            //第三个点y轴坐标，即三角形的右侧
            points.push(points[1] - 8);

            clipPathStyle = {
                x: points[0],
                y: points[1] - 8,
                width: 14,
                height: 8
            };
            if(points[0] < colorAreaBox.x) {
                clipPathStyle.x = colorAreaBox.x;
                clipPathStyle.width -= (colorAreaBox.x - points[0]);
            } else if(points[2] > colorAreaBox.x2) {
                clipPathStyle.width -= (points[2] - colorAreaBox.x2);
            }
        } else {
            //第一个点x轴坐标，即三角形的左上角
            points.push(point.x);
            //第一个点y轴坐标，即三角形的左上角
            points.push(point.y - 7);
            //第二个点x轴坐标，即三角形的左下角
            points.push(points[0]);
            //第二个点y轴坐标，即三角形的左下角
            points.push(point.y + 7);
            //第三个点x轴坐标，即三角形的右侧
            points.push(points[0] + 8);
            //第三个点y轴坐标，即三角形的右侧
            points.push(point.y);

            clipPathStyle = {
                x: points[0],
                y: points[1],
                width: 8,
                height: 14
            };
            if (points[1] < colorAreaBox.y) {
                clipPathStyle.y = colorAreaBox.y;
                clipPathStyle.height -= (colorAreaBox.y - points[1]);
            } else if (points[3] > colorAreaBox.y2) {
                clipPathStyle.height -= (points[3] - colorAreaBox.y2);
            }
        }
        _this.visualMap.hoverLinkClipPathEle.attr({
            x: clipPathStyle.x,
            y: clipPathStyle.y,
            width: clipPathStyle.width,
            height: clipPathStyle.height
        });


        var value = _this.opts.visualMap.min + (itemOffset / (_this.opts.visualMap.itemHeight)) * (_this.opts.visualMap.max - _this.opts.visualMap.min);
        if(_this.opts.visualMap.orient === 'horizontal') {
            _this.visualMap.hoverLinkText.attr({
                x: points[4],
                y: clipPathStyle.y - (5),
                text: '≈ ' + parseInt(value),
                textAnchor: 'middle'
            });
        } else {
            _this.visualMap.hoverLinkText.attr({
                x: points[4] + (5),
                text: '≈ ' + parseInt(value),
                textAnchor: 'start'
            });
            var textBox = _this.visualMap.hoverLinkText.getBBox();
            _this.visualMap.hoverLinkText.attr({
                y: points[5] + textBox.height / 2 - 2
            });
        }
        var delt = (_this.opts.visualMap.max - _this.opts.visualMap.min) * 0.05;
        var range = [value - delt, value + delt];
        if (range[0] < _this.opts.visualMap.min) {
            range[0] = _this.opts.visualMap.min;
        }
        if (range[1] > _this.opts.visualMap.max) {
            range[1] = _this.opts.visualMap.max;
        }
        //高亮区域
        _this.highLightByValue(range);
        var index = parseInt((itemOffset / (_this.opts.visualMap.itemHeight)) * _this.STEPS);
        if (index >= _this.STEPS) {
            index = _this.STEPS - 1;
        }
        _this.visualMap.hoverLink.attr({
            points: points,
            fill: _this.gradientColor[index]
        });
    },
    /*
     * 根据数值设置地图的高亮
     * */
    highLightByValue: function (range) {
        var _this = this;

        //先重置之前的高亮的区域
        _this.resetHoverLinkHightLight(_this.visualMap.hoverLinkHighLight);

        //遍历获取并设置高亮区域
        $.each(_this.areaMapData, function (key, data) {
            //获取对应的数值
            var _propValue = parseInt(data[_this.opts.visualMap.props]);
            if (_propValue >= range[0] && _propValue < range[1]) {
                //高亮区域
                _this.highLightArea(key, _this.areaMapSet[key], data);
                var highLightObj = {
                    key: key,
                    svgSet: _this.areaMapSet[key],
                    data: data
                };
                _this.visualMap.hoverLinkHighLight.push(highLightObj);
            }
        });
    },
    /*
     * 重置之前高亮的区域
     * */
    resetHoverLinkHightLight: function (hoverLinkHighLight) {
        var _this = this;
        //如果不是数组或长度为0，则返回
        if (!hoverLinkHighLight.length) {
            return;
        }
        $.each(hoverLinkHighLight, function (index, obj) {
            var outline = _this.areaMap[obj.key] ? _this.areaMap[obj.key] : this;
            //如果路径的状态是disabled，则设置样式为不可用的样式，否则设置成正常的样式
            if (_this.getOutline(outline, obj.data.mapId).data('disabled')) {
                //置为不可用
                _this.disableArea(obj.key, obj.svgSet, obj.data)
            } else {
                //重置高亮区域
                _this.resetArea(obj.key, obj.svgSet, obj.data);
            }
        });
        hoverLinkHighLight = [];    //重置高亮数组
    },
    /*
     * 创建提示框
     * */
    createTooltip: function () {
        var _this = this;
        //如果提示框存在，则删除对应的提示框
        if (!!_this.tooltip) {
            _this.tooltip.remove();
        }
        //是否展现提示框,如果不展现，则跳出对应的创建方法
        if (!_this.opts.tooltip.show) {
            return;
        }
        var tooltip = _this.opts.tooltip;
        //创建对应的提示框，并添加到body中
        _this.tooltip = $('<div></div>').addClass(tooltip.className).appendTo('body');
    },
    /*
     * 展现提示框
     * @param {Event} evnet 鼠标事件对象
     * @data {Object}  data 对应区域的数据对象
     * */
    showTooltip: function (event, data) {
        var _this = this,
            _html='<p>在押总数：<em>'+data.zyzs+'</em></p>'+
                  '<p>出所人数：<em>'+data.csrs+'</em></p>'+
                  '<p>外籍犯：<em>'+data.wjf+'</em></p>';

        //如果提示框对象存在并且展现
        if (_this.tooltip && _this.opts.tooltip.show) {
            //设置提示框浮层的内容
            _this.tooltip.html(_html);
            //更新提示框的位置
            _this.updateTooltipPos(event);
            //展现提示框
            _this.tooltip.show();
        }
    },
    /*
     * 更新提示框的位置
     * @param {Event} evnet 鼠标事件对象
     * */
    updateTooltipPos: function (event) {
        event = event || window.event;
        //浏览器窗口的宽度和高度
        var winW = $(window).width(),
            winH = $(window).height();
        //鼠标的x和y坐标
        var left = event.pageX,
            top = event.pageY;

        //获取提示框的宽度和高度
        var tooltipW = this.tooltip.outerWidth(),
            tooltipH = this.tooltip.outerHeight();

        left += 15;
        top += 15;

        if ((left + tooltipW + 20) > winW) {
            left = winW - tooltipW - 20;
        }
        if ((top + tooltipH + 20) > winH) {
            top = winH - tooltipH - 20;
        }
        this.tooltip.css({
            left: left,
            top: top
        });
    },
    /*
     * 隐藏提示框
     * */
    hideTooltip: function () {
        this.tooltip.hide();
    },
    /*
     * 渐变颜色
     * */
    gradientColors: function (colorArr, steps) {
        var gradientColorArr = [];
        if (colorArr.length < 2) {
            return colorArr;
        }
        //分割的段数 向上取整
        var segment = Math.ceil(steps / (colorArr.length - 1));
        for (var i = 0; i < (colorArr.length - 1); i++) {
            //定义开始颜色和结束颜色
            var startColor = Snap.color(colorArr[i]),
                endColor = Snap.color(colorArr[i + 1]);

            //获取颜色之间的差值
            var diffValue = {
                r: (endColor.r - startColor.r) / segment,
                g: (endColor.g - startColor.g) / segment,
                b: (endColor.b - startColor.b) / segment,
                opacity: (endColor.opacity - startColor.opacity) / segment
            };
            for (var j = (segment * i); j < (segment * (i + 1)); j++) {
                gradientColorArr.push(
                    'rgba(' +
                    (diffValue.r * (j - (segment * i)) + startColor.r) + ',' +
                    (diffValue.g * (j - (segment * i)) + startColor.g) + ',' +
                    (diffValue.b * (j - (segment * i)) + startColor.b) + ',' +
                    (diffValue.opacity * (j - (segment * i)) + startColor.opacity) + ')');
            }
        }
        return gradientColorArr;
    },
    /*
     * 获取连续型的视觉映射组件，每一个点的颜色对应的数值
     * @param {Number} min 最小值
     * @param {Number} max 最大值
     * @return {Array} stopValues 获取中间区域的数组
     * */
    getColorStopValues: function (min, max) {
        //如果相等则直接返回一个数字的数组
        if (min === max) {
            return [min];
        }
        //获取分割段数
        var segment = (max - min) / this.STEPS;
        var value = min;
        var stopValues = [];
        for (var i = 0; i <= this.STEPS, value < max; i++) {
            stopValues.push(value);
            value += segment;
        }
        stopValues.push(max);
        return stopValues;
    },
    /*
     * 添加地图的交互效果
     * */
    addAreaMapInteraction: function () {
        var _this = this;
        //为区域添加事件
        $.each(_this.areaMapSet, function (name, value) {
            //获取对应的区域数据
            var data = _this.areaMapData[name];
            value.forEach(function (element) {
                //地图 鼠标滑过事件
                element.hover(function (event) {
                        //高亮区域
                        _this.highLightArea(name, value, data);
                        //展现提示框
                        _this.showTooltip(event, data);
                    },
                    //鼠标移出事件
                    function () {
                        if (_this.getOutline((_this.areaMap[name] ? _this.areaMap[name] : this), data.mapId).data('disabled')) {
                            //置为不可用
                            _this.disableArea(name, value, data);
                        } else {
                            //重置区域
                            _this.resetArea(name, value, data);
                        }

                        //隐藏提示框
                        _this.hideTooltip();
                    }).mousemove(function (event) {
                        //更新提示框的位置
                        _this.updateTooltipPos(event);
                    })
            });
        });
    },
    /*
     * 获取轮廓，主要是处理新疆的轮廓
     * */
    getOutline: function (outline, key) {
        if (key == '520000' || key == '480000' || key == 'xinjiangGroup') {
            outline = this.getAreaPath(outline, key);
        }
        return outline;
    },
    /*
     * 高亮区域
     * */
    highLightArea: function (name, svgSet, data) {
        var _this = this;
        svgSet.forEach(function (element) {
            /*var outline = _this.areaMap[name] ? _this.areaMap[name] : this;*/
            var outline = _this.areaMap[name] ? _this.areaMap[name] : null;
            //如果存在区域
            if(outline){
                //设置对应的path样式
                var _path = _this.getAreaPath(outline, data.mapId);
                //设置鼠标滑过样式
                _this.setAreaStyle(_path, _this.opts.series.itemStyle.emphasis, data, 2);
                //如果标识会展现，则设置circle样式
                if ((_this.opts.series.symbol.itemStyle.normal.show || _this.opts.series.symbol.itemStyle.emphasis.show) && _this.areaMapCircle[name]) {
                    _this.setSymbolStyle(_this.areaMapCircle[name], _this.opts.series.symbol.itemStyle.emphasis);
                }

                //如果文本会展现，则设置对应的文本样式
                if ((_this.opts.series.label.normal.show || _this.opts.series.label.emphasis.show) && _this.areaMapText[name]) {
                    //文本坐标
                    var _textPoint = _this.areaMapText[name].data('point');
                    _this.setTextStyle(_this.areaMapText[name], _this.opts.series.label.emphasis, data, _textPoint);
                }
            }

        });
    },
    /*
     * 重置区域
     * */
    resetArea: function (name, svgSet, data) {
        var _this = this;
        svgSet.forEach(function () {
            var outline = (_this.areaMap[name] ? _this.areaMap[name] : null);
            if(outline){
                _this.getOutline(outline, data.mapId).data('disabled', false);
                //获取对应的区域path对象
                var _path = _this.getAreaPath(outline, data.mapId);

                //将区域样式设置为默认的样式
                _this.setAreaStyle(_path, _this.opts.series.itemStyle.normal, data, 1);

                //如果标识会展现，则设置circle样式
                if ((_this.opts.series.symbol.itemStyle.normal.show || _this.opts.series.symbol.itemStyle.emphasis.show) && _this.areaMapCircle[name]) {
                    _this.setSymbolStyle(_this.areaMapCircle[name], _this.opts.series.symbol.itemStyle.normal)
                }

                //如果文本会展现，则设置对应的文本样式
                if ((_this.opts.series.label.normal.show || _this.opts.series.label.emphasis.show) && _this.areaMapText[name]) {
                    //文本坐标
                    var _textPoint = _this.areaMapText[name].data('point');
                    _this.setTextStyle(_this.areaMapText[name], _this.opts.series.label.normal, data, _textPoint);
                }
            }

        });
    },
    /*
     * 将区域置成不可用
     * */
    disableArea: function (name, svgSet, data) {
        var _this = this;
        svgSet.forEach(function (element) {
            var outline = (_this.areaMap[name] ? _this.areaMap[name] : this);
            _this.getOutline(outline, data.mapId).data('disabled', true);
            //获取对应的区域path对象
            var _path = _this.getAreaPath(outline, data.mapId);

            //将区域样式设置为默认的样式
            _this.setAreaStyle(_path, _this.opts.series.itemStyle.normal, data, 3);

            //如果标识会展现，则设置circle样式
            if ((_this.opts.series.symbol.itemStyle.normal.show || _this.opts.series.symbol.itemStyle.emphasis.show) && _this.areaMapCircle[name]) {
                _this.setSymbolStyle(_this.areaMapCircle[name], _this.opts.series.symbol.itemStyle.normal)
            }

            //如果文本会展现，则设置对应的文本样式
            if ((_this.opts.series.label.normal.show || _this.opts.series.label.emphasis.show) && _this.areaMapText[name]) {
                //文本坐标
                var _textPoint = _this.areaMapText[name].data('point');
                _this.setTextStyle(_this.areaMapText[name], _this.opts.series.label.normal, data, _textPoint);
            }
        });
    },
    /*
     * 给图形绑定事件
     * @param {String} eventName 事件名称
     * @param {Callback} handler 事件的回调函数
     * */
    on: function (eventName, handler) {
        var _this = this;
        eventName = eventName.toLocaleLowerCase();  //将事件名称转换成小写
        //如果事件名称在鼠标事件名称中不存在，则不往下执行
        if (_this.MOUSE_EVENT_NAMES.indexOf(eventName) === -1) {
            return;
        }
        $.each(_this.areaMapSet, function (name, value) {
            //获取对应的数据对象
            var data = _this.areaMapData[name];
            value.forEach(function (element) {
                //给元素绑定对应的点击事件
                element[eventName](function () {
                    handler(data);
                });
            });
        });
    },
    /*
     * 给元素解除绑定事件
     * */
    off: function (eventName, handler) {
        var _this = this;
        eventName = eventName.toLocaleLowerCase();  //将事件名称转换成小写
        //如果事件名称在鼠标事件名称中不存在，则不往下执行
        if (_this.MOUSE_EVENT_NAMES.indexOf(eventName) === -1) {
            return;
        }
        $.each(_this.areaMapSet, function (name, value) {
            var data = _this.areaMapData[name];
            value.forEach(function (element) {
                //移除对应的事件
                element['un' + eventName](function () {
                    //如果存在回调函数，则执行对应的回调函数
                    if (!!handler) {
                        handler(data);
                    }
                });
            });
        });
    },
    //设置分段数
    STEPS: 200,
    //设置地图的前缀
    MAP_PREFIX: 'mapid-',
    //设置地图的相对宽度
    RELATIVE_WIDTH: 6028,
    //鼠标事件名称，暂时只支持click事件
    //, 'dblclick', 'mouseover', 'mouseout', 'mousemove','mousedown', 'mouseup'
    MOUSE_EVENT_NAMES: ['click'],
    /*
     * 地图的默认参数选项对象
     * */
    defaultOption: {
        //直角坐标系内绘图网格
        grid: {
            left: 60,    //grid 组件离容器左侧的距离。
            top: 20,        //grid 组件离容器上侧的距离。
            right: 60,   //grid 组件离容器右侧的距离。
            bottom: 20      //grid 组件离容器下侧的距离。
        },
        //提示框参数
        tooltip: {
            show: true,      //是否展现提示框
            className:"fd-toolTip",
        },
        //视觉映射参数
        visualMap: {
            show: false,    //视觉映射组件是否展示

            //视觉映射组件的类型 continuous|piecewise 连续型|分段型
            type: 'continuous',

            min: 0,     //允许的最小值

            max: 100,   //允许的最大值

            props: 'value', //属性名称，改属性用来控制对应区域的颜色

            propsType: 'number',    //属性类型默认是数值， number|percent 数值|百分比

            //选中范围中的视觉元素
            inRange: {
                //图元颜色
                color: ['#82caee', '#6cbbe3', '#459ee8', '#479cc6', '#0d61c1']
            },

            splitNumber: 5, //对于分段型数据，自动分成几段，默认为5段

            //分段型数据中，自定义分成几段，每一段的范围，以及每一段的特别样式
            //该设置默认没有，只有自定义参数中设置了之后，才会生效，设置了改属性，则会忽略splitNumber
            /*pieces: [
             {min: 80},
             {min: 60, max: 80},
             {min: 0, max: 60}
             ],*/

            //是否显示拖拽用的手柄（手柄能拖拽调整选中范围）。
            calculable: true,

            //打开 hoverLink 功能时，鼠标悬浮到 visualMap 组件上时，鼠标位置对应的数值 在 图表中对应的图形元素，会高亮。
            hoverLink: true,

            //两端的文本，如['High', 'Low']
            text: null,

            left: 'left',                // 'center' ¦ 'left' ¦ 'right' ¦ {number} (px)
            right: 'auto',            // The same as left.
            top: 'top',              // 'top' ¦ 'bottom' ¦ 'center' ¦ {number} (px)
            bottom: 'auto',              // The same as top.

            itemWidth: 20,
            itemHeight: 14,
            orient: 'vertical',        // 'horizontal' ¦ 'vertical'

            backgroundColor: 'rgba(0,0,0,0)',
            borderColor: 'none',       // 值域边框颜色
            contentColor: '#5793f3',
            inactiveColor: '#aaa',
            borderWidth: 0,            // 值域边框线宽，单位px，默认为0（无边框）
            padding: 5,                // 值域内边距，单位px，默认各方向内边距为5，
                                       // 接受数组分别设定上右下左边距，同css
            itemGap: 10,                //信息项之间的距离
            textGap: 10,               //
            precision: 0,              // 小数精度，默认为0，无小数点

            formatter: null,
            text: null,                // 文本，如['高', '低']，兼容ec2，text[0]对应高值，text[1]对应低值
            textStyle: {
                color: '#333',  //字体颜色
                fontSize: 13,   //字号
                fontFamily: 'Microsoft Yahei',  //字体系列
                fontWeight: 'normal',   //粗细
                lineHeight: 20, //行高
                fontStyle: 'normal' //字体样式
            }
        },
        //系列参数，注：该出系列为一个对象，而不是一个数组，因为地图不支持多个一起展现
        series: {
            //类型，默认是地图，则不会去读取visualMap中的设置 map|heatmap 地图|热力图 type为热力图的时候，颜色会从visualMap中的color获取
            type: 'map',

            //地图id用于来展现哪个地区的地图用6位数字组成的字符串来表示对应的区域标识
            map: '000000',

            aspectScale: 1,     //这个参数用于 scale 地图的长宽比。

            //背景区域
            bgArea: {
                areaColor: 'rgba(1 ,29 , 94, 1)',
                borderColor: '#01aeca',
                borderWidth: 1,
                borderType: 'solid',
                shadowBlur: 4,
                shadowColor: 'rgba(0,47,153,0.5)',
                shadowOffsetX: 4,
                shadowOffsetY: 4,
                opacity: 1   //对应的透明度，因为IE不支持阴影颜色为透明度，用opacity去控制对应的透明度
            },

            //地图svg请求的路径
            path: 'svg/mapid-',

            //标记，即区域圆点的展现形式
            symbol: {
                type: 'circle',
                animate:{
                    loadAnimate:{
                        show:true,
                        delay:400,//延迟动画
                        duration:400,//动画的持续时间
                    },
                    normalAnimate:{
                        show:true,
                        duration:2000,//动画的持续时间
                        ratio:0.8,//动画的缩放比
                    }
                },
                //图形信息项样式
                itemStyle: {
                    //默认样式
                    normal: {
                        show: true,
                        ratio:0.8,//缩放比例

                        img:{
                            src:"../images/index/bar.png",
                            size:[24,100],
                        },
                        outer:{
                            radius:[35,16],
                            stroke:"#0177af",
                            strokeWidth:2,
                            shadow: {
                                dx: 0,
                                dy: 0,
                                blur: 8,
                                color: 'rgba(0,156,255,0.8)'
                            },
                        },
                        inner:{
                            radius:[30,12],
                            stroke:"#00effd",
                            strokeWidth:1,
                            fill: "#012a69",
                        }
                    },
                    // 强调的样式，即鼠标滑过的样式，也是选中样式
                    emphasis: {
                        show: false
                    }
                }
            },
            /*//标记，即区域圆点的展现形式
            symbol: {
                type: 'circle',
                //图形信息项样式
                itemStyle: {
                    //默认样式
                    normal: {
                        show: false,
                        size: 4,
                        //圆心的偏移量
                        offset: [0, 0],
                        color: '#f96f04',   //填充的颜色
                        borderColor: 'none',    //边框的颜色
                        borderWidth: 0,         //边框的宽度
                        borderType: 'solid'     //边框线的类型
                    },
                    // 强调的样式，即鼠标滑过的样式，也是选中样式
                    emphasis: {
                        show: false
                    }
                }
            },*/

            //地图标签(name名称的样式)
            label: {
                //默认样式
                normal: {
                    //是否展现
                    show: true,
                    //x y轴的偏移量
                    offset: [0, 20],
                    //文本样式
                    textStyle: {
                        color: '#80b0ff',  //字体颜色
                        fontSize: 10,   //字体大小
                        fontFamily: 'Microsoft YaHei',  //字体系列
                        fontWeight: 'normal',   //字体加粗
                        align: 'middle' //水平对齐方式 默认水平居中 start 左对齐 end 右对齐
                    }
                },
                //强调的样式，即鼠标滑过的样式，也是选中样式
                emphasis: {
                    show: false
                }
            },

            //默认数据中不存在的填充颜色
            defaultStyle: {
                areaColor: '#eee',
                borderWidth: 1,
                borderColor: 'rgba(61,134,187,1)',
                borderType: 'solid'
            },

            //信息项样式(单个地图区域的样式)
            itemStyle: {
                //默认样式
                normal: {
                    color: 'auto',
                    areaColor: 'rgba(1 ,29 , 94, 1)',
                    borderWidth: 1,
                    borderColor: 'rgba(1,139,166,1)',
                    borderType: 'solid',

                    shadowBlur: 0,              //图形阴影的模糊大小
                    shadowColor: 'none',        //阴影颜色。支持的格式同color。
                    shadowOffsetX: 0,           //阴影水平方向上的偏移距离
                    shadowOffsetY: 0           //阴影垂直方向上的偏移距离。
                },
                // 强调的样式，即鼠标滑过的样式，也是选中样式
                emphasis: {
                    areaColor: '#00a0e9'
                }
            }
        }
    }
};
    return   MapCharts
});