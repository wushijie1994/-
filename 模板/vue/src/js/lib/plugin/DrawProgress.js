/**
 * @author  wusj
 * @updateTime  2017-08-23
 * @createTime  2017-08-23
 *@name       DrawProgress
 *@description       绘制进度条
 */
define('DrawProgress',[],function(){
// 构造函数
function DrawProgress() {};
// 原型
DrawProgress.prototype = {
    //  设置参数
    setOptions : function (options) {
        var _this = this;
        var _defaultOptions = {
            id: 'jsProgress',
            width:90,
            height:90,
            tweenTime:1000,
            startAngle: -240,
            endAngle: 60,
            radius:30,
            delay:600,//动画延迟
            bg:{
                stroke:"#24497b",
                strokeWidth:7,
                shadow: {
                    dx: 0,
                    dy: 0,
                    blur: 8,
                    color: 'rgba(4,165,225,1)'
                },
            },
            bar:{
                strokeWidth:5,
                lineWidth:4,
                fill:"#8bc1eb",
                line:"#27d7ff",
                bg:"#042458",
            },
            text:{
                fill:"#80b4e2",
                "font-size":"18px",
                "text-anchor":"middle",
                "font-weight":"bold"
            },
            circle: {
                r: 80,
                strockWidth: 3,
            },
            data:{
                value:2645,
                percent:0.8
            },
        };
        //  合并参数
        _this.opts = $.extend(true, {}, _defaultOptions, options || {});
        //  执行初始化动画
        _this.init();
    },
    //  初始化函数
    init : function () {
        var _this = this;
        //初始化页面参数
        _this.initParams();
        // 创建舞台
        _this.createStage();
        // 创建滤镜
        _this.createFilter();
        // 绘制基础图形
        _this.drawProgress();
        // 绘制文本
        _this.drawText();
        // 添加旋转动画
        _this.addAnimate();
    },
    //初始化参数
    initParams:function () {
        var _this = this;
        _this.centerPoint = {
            x:45,
            y:45
        };
        _this.rad = Math.PI / 180;   //π值
    },
    // 绘制舞台
    createStage : function () {
        var _this = this;
        //  创建snap 对象
        _this.snap = Snap(_this.opts.width, _this.opts.height);
        // 添加属性
        _this.snap.attr({
            width : '100%',
            height : '100%',
            viewBox : '0 0 90 90',
        });
        // 追加到容器
        document.getElementById(_this.opts.id).appendChild(_this.snap.node);
    },
    // 创建滤镜
    createFilter : function () {
        var _this = this;
        // 圆框的阴影
        _this.shadow = _this.snap.filter(Snap.filter.shadow(_this.opts.bg.shadow.dx, _this.opts.bg.shadow.dy, _this.opts.bg.shadow.blur, _this.opts.bg.shadow.color));
    },
    //创建圆环
    drawProgress:function () {
        var _this=this,
            data = _this.opts.data,//数据列表
            startPoint=_this.getPoint(_this.opts.radius,_this.opts.startAngle),
            endPoint=_this.getPoint(_this.opts.radius,_this.opts.endAngle),
            bgStartPoint=_this.getPoint(_this.opts.radius,_this.opts.startAngle-3),
            bgEndPoint=_this.getPoint(_this.opts.radius,_this.opts.endAngle+3),
            path;

        //背景路径
        path=['M', bgStartPoint.x, bgStartPoint.y,'A', _this.opts.radius, _this.opts.radius, 0, 1, 1, bgEndPoint.x, bgEndPoint.y].join(" ");
        _this.bg=_this.snap.paper.path('').attr({
            'd': path,
            fill: "none",
            stroke: _this.opts.bg.stroke,
            "stroke-width":_this.opts.bg.strokeWidth,
            filter : _this.shadow
        })

        path=['M', startPoint.x, startPoint.y,'A', _this.opts.radius, _this.opts.radius, 0, 1, 1, endPoint.x, endPoint.y].join(" ");
        _this.bg02=_this.snap.paper.path('').attr({
            'd': path,
            fill: "none",
            stroke: _this.opts.bar.bg,
            "stroke-width":_this.opts.bar.strokeWidth
        })
        _this.barLength=_this.bg02.getTotalLength()*_this.opts.data.percent;
        _this.bar01=_this.snap.paper.path('').attr({
            'd': path,
            fill: "none",
            stroke: _this.opts.bar.fill,
            "stroke-width":_this.opts.bar.strokeWidth,
            "stroke-dasharray":"0 ,10000",
        })
        _this.bar02=_this.snap.paper.path('').attr({
            'd': path,
            fill: "none",
            stroke: _this.opts.bar.line,
            "stroke-width":_this.opts.bar.lineWidth,
            "stroke-dasharray":"0 ,10000",
        })
    },
    //绘制文本
    drawText:function () {
        var _this=this;
        // 创建数据
        _this.text= _this.snap.text(_this.centerPoint.x,_this.centerPoint.y+9,_this.opts.data.value).attr(_this.opts.text);
    },
    /*
    * 添加动画
    * */
    addAnimate:function () {
        var _this=this;
        setTimeout(function(){
            Snap.animate(0,_this.barLength,function (curLength) {
                _this.bar01.attr({
                    "stroke-dasharray":curLength+" 10000",
                });
                _this.bar02.attr({
                    "stroke-dasharray":curLength+" 10000",
                });
            },_this.opts.tweenTime,mina.linear,function(){});
        },_this.opts.delay);

    },
    /*
     * 获取点的坐标
     * */
    getPoint: function (raduis, angle) {
        var _this = this;
        var centerPoint = _this.centerPoint;    //圆心坐标
        return {
            x:centerPoint.x + raduis * Math.cos(angle * _this.rad),
            y:centerPoint.y + raduis * Math.sin(angle * _this.rad),
        };
    },
    //  更新数据的方法
    update : function (data) {
        var _this = this;
        if (data) {
            _this.opts.data = data;
        }
        //  销毁函数
        _this.destory();
        // 绘制基础图形
        _this.drawProgress();
        // 添加旋转动画
        _this.addAnimate();
    },
    //  销毁函数
    destory : function () {
        var _this = this;
        // 销毁对象
        _this.snap.clear();
    }
};
    return   DrawProgress
});