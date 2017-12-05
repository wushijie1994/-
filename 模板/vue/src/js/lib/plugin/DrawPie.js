/**
 * @author  wusj
 * @updateTime  2017-08-23
 * @createTime  2017-08-23
 *@name       DrawPie
 *@description       绘制饼图
 */
/**
 * 饼图的构造函数
 */
define('DrawPie',[],function(){
function DrawPie(options) {
	this.setOption(options);
}
/*
 * 饼图的自定义方法
 * */
DrawPie.prototype = {
	/*
	 * 设置饼图的选项参数
	 * */
	setOption : function (options) {
		var _this = this;
		/*
		 * 设置默认的参数选项
		 * */
		var _defaultOptions = {
			// 饼图的外层div
			id : 'jsPieWrap',
			svgClass : 'jsPieSvg',
			color : ['#2899c3', '#4e2aa8', '#ff9b00', '#2899c3', '#3d4fb2', '#d3e728', '#ff9b00', '#14ce7d', '#ff4e59', '#64b9fa'],
			startAngle:-90,
			width:350,
			height:260,
			minY:14,//最小Y值，内部元素防止越界
			delay:0,//动画延迟
			//半径
			radius : [44, 60],
			zeroAngle:3,//为零时的角度
			minAngle:5,//最小角度
			// 起始角度在 0的基础上的增量
			startPlusAngle : 0,
			text:{
				fill : '#00acff',
				fontSize : '12px',
				fontSize02 : '12px',
				fontFamily : 'Microsoft YaHei',
			},
			bg:{
				//最外侧环你
				circle1:{
					radius:70+1,
					attr:{
						fill : 'none',
						stroke:"#1c4480",
						"stroke-width":2,
					}
				},
				circle2:{
					radius:38+13,
					attr:{
						fill : 'none',
						stroke:"#4072db",
						"stroke-width":26,
					}
				},
				circle3:{
					radius:40+10,
					attr:{
						fill : 'none',
						stroke:"#214e90",
						"stroke-width":20,
					}
				}
			},
			lableLine:{
				width:[20,50],
				attr:{
					fill : 'none',
					stroke:"#01a4d2",
					"stroke-width":1,
				}
			},
			// 百分数保留的小数位数
			toFixed : 2,
			data : [], //数据列表
			//点击事件回调函数
			clickCallback : function () {}
		};
		//  合并参数
		_this.opts = $.extend(true, {}, _defaultOptions, options || {});
		// 初始化参数
		_this.initParams();
		// 创造svg舞台
		_this.createStage();
		//绘制图形
		_this.render();
	},
	// 初始化参数
	initParams : function () {
		var _this = this;
		_this.dom = document.getElementById(_this.opts.id);
		//图形宽度
		_this.W = _this.opts.width;
		//图形高度
		_this.H = _this.opts.height;
		// 设置中心坐标

		_this.centerPoint = {
			x :_this.W/2,
			y : _this.H/2
		};
		//获取数据的总和’
		_this.total = _this.getTotal(_this.opts.data);
		//获取总的角度
		_this.totalAngle = _this.getTotalAngle(_this.opts.data);
		//π值
		_this.rad = Math.PI / 180;
		// 默认激活的条目
		_this.activeIndex = 0;
	},
	// 创建舞台
	createStage : function () {
		var _this = this;
		//  创建snap 对象
		_this.snap = Snap("100%", "100%");
		// 添加属性
		_this.snap.attr({
			viewBox : '0 0 ' + _this.W + " " + _this.H,
			class : _this.opts.svgClass
		});
		// 追加到容器
		_this.dom.appendChild(_this.snap.node);
	},
	/*
	 * 绘制饼图
	 * */
	render : function () {
		var _this = this;
		//绘制背景
		_this.drawBg();
		_this.drawAnulus();
		_this.drawLable();//画引导线
		_this.drawName();//画引导线
		//_this.setAnulusPath(1);
		setTimeout(function () {
			_this.enterAnimation();
		},_this.opts.delay);

	},
	/*绘制背景*/
	drawBg:function () {
		var _this=this,
			_bgStyle=_this.opts.bg;
		_this.bg=_this.snap.paper.g();
		//绘制背景圆
		for(key in _bgStyle){
			_this.bg.add(_this.snap.paper.circle(_this.centerPoint.x,_this.centerPoint.y,_bgStyle[key].radius).attr(_bgStyle[key].attr));
		}
	},
	/*
	 * 绘制弧度
	 * */
	drawAnulus : function () {
		var _this = this;
		//数据列表
		var data = _this.opts.data;
		//设置弧度列表
		_this.anulus = [];
		//遍历数据列表，绘制对应的圆环
		data.map(function (item, index) {
			var anulus = _this.snap.paper.path('').attr({
				fill : _this.opts.color[index],
				stroke : 'none',
				cursor : "pointer"
			}).data('data', {
				startAngle : 0,
				endAngle : 0,
				index : index,
				data : item
			}).click(function () {
				//点击事件
				var _data = this.data('data');
				//如果存在点击回调函数
				if (_this.opts.clickCallback) {
					_this.opts.clickCallback(_data);
				}
			}).hover(function () {
				_this.showName(index);
				this.attr({
					opacity : 0.8
				})
			}, function () {
				_this.hideName(index);
				this.attr({
					opacity : 1
				})
			});
			_this.anulus.push(anulus);
		});
	},
	/*
	 * 设置圆弧路径
	 * @param {Float} animationDecimal 加载进度
	 * */
	setAnulusPath : function (animationDecimal) {
		var _this = this;
		var data = _this.opts.data; //数据列表
		var angle = _this.opts.startAngle; //获取开始角度
		//遍历数据列表，设置对应的圆环路径
		data.map(function (item, index) {
			var anglePlus = animationDecimal * _this.getAngle(item); //获取当前数据所占的角度
			var startAngle = angle, //开始角度
				endAngle = angle + anglePlus; //结束角度
			var anulusPath = _this.getPiePath(_this.opts.radius[0], _this.opts.radius[1], startAngle, endAngle); //获取对应的弧度路径
			_this.anulus[index].attr('d', anulusPath); //设置对应的路径
			var _anulusData = _this.anulus[index].data('data');
			_anulusData.startAngle = startAngle;
			_anulusData.endAngle = endAngle;
			_this.anulus[index].data('data', _anulusData); //重新设置对应的弧度数据
			angle += anglePlus; //加上对应的角度
		});
	},
	/**
	 * 绘制引导线
	 * @
	 * */
	drawLable:function () {
		var _this = this,
			_data = _this.opts.data, //数据列表
			_angle = _this.opts.startAngle, //获取开始角度
			_lineStyle=_this.opts.lableLine,
			_textStyle=_this.opts.text,//文本样式
			_anchor="start",
			_visibility="visible",//标签是否可见，越界了就不可见了
			_lableData,//存储当前lable的数据
			_sild,//左侧还是右侧，
			_anglePlus=0,//角度增量
			_minddleAngle=0;//中间值
		_this.lable=[];
		_this.lableG=_this.snap.paper.g().attr({
			opacity : 0
		});
		var _point1,_point2,_point3={};
		//遍历数据列表，设置对应的lable
		_data.map(function (item, index) {
			_anglePlus =_this.getAngle(item); //获取当前数据所占的角度
			_minddleAngle=_angle+_anglePlus/2;//引导线的角度
			_point1=_this.getPoint(_minddleAngle,_this.opts.radius[1]);//起点
			_point2=_this.getPoint(_minddleAngle,_this.opts.radius[1]+_lineStyle.width[0]);//中点
			//防止重叠
			for(var i=0;i<_this.lable.length;i++){
				_lableData=_this.lable[i].data("data");
				_sild=_this.getSide(_point2,_lableData.point2);
				if(_sild!=0){//位于同一侧
					if(Math.abs(_point2.y-_lableData.point2.y)<_lableData.textHeight){
						//完蛋重叠了
						if(item.value==0){
							//当前元素为0
							_visibility="hidden";
						}else{
							_visibility="visible";
							_point2.y=_lableData.point2.y+_lableData.textHeight*_sild;//避免上下重叠
							_point2.x=_lableData.point2.x+_lableData.textHeight*_sild;//避免上下重叠
						}
					}
				}
			}
			_point3.y=_point2.y;//终点
			if(_point2.quadrant==1||_point2.quadrant==4){
				//右侧
				_point3.x=_point2.x+_lineStyle.width[1];
				_anchor="end";
			}else{
				//左侧
				_point3.x=_point2.x-_lineStyle.width[1];
				_anchor="start";
			}


			var lable={},
				lableG=_this.snap.paper.g(),
				path="M"+_point1.x+" "+_point1.y+" L "+_point2.x+" "+_point2.y+" L "+_point3.x+" "+_point3.y,
				text=parseFloat(item.value/_this.total*100).toFixed(_this.opts.toFixed)+"%";
			lable.line=_this.snap.paper.path(path).attr(_lineStyle.attr);
			lable.text=_this.snap.paper.text(_point3.x,_point3.y-1,text).attr({
				fill : _textStyle.fill,
				"font-size" :_textStyle.fontSize,
				"font-family" :_textStyle.fontFamily,
				"text-anchor":_anchor,
				cursor : "pointer"
			});
			//将lable合并到一起
			lableG.add(lable.line,lable.text).data("data",{
				point1:_point1,
				point2:_point2,
				point3:_point3,
				textHeight:lable.text.getBBox().height,
				data:item.value,
			}).attr({
				"visibility":_visibility
			}).hover(function () {
				_this.showName(index);
			},function () {
				_this.hideName(index);
			});
			_this.lableG.add(lableG);
			_this.lable.push(lableG);
			_angle += _anglePlus; //加上对应的角度
		});
	},
	/**
	 * 绘制地区名称
	 * @
	 * */
	drawName:function () {
		var _this = this,
			_data = _this.opts.data, //数据列表
			_textStyle=_this.opts.text,//文本样式
			_text="",
			_curText="",
			_length=5,
			_index=0,
			_anchor="middle";//中间值
		_this.name=[];
		//遍历数据列表，设置对应的lable
		_data.map(function (item, index) {
			_text=item.name;
			_index=0;
			var _nameG=_this.snap.paper.g().attr({
				"visibility":"hidden",
			});
			while(_text.length){
				if(_text.length>_length){
					_curText=_text.substring(0,_length);
					_text=_text.substring(_length);
				}else{
					_curText=_text;
					_text="";
				}
				var name=_this.snap.paper.text(_this.centerPoint.x,_this.centerPoint.y+_index*parseInt(_textStyle.fontSize02)+2,_curText).attr({
					fill : _this.opts.color[index],
					"font-size" :_textStyle.fontSize02,
					"font-family" :_textStyle.fontFamily,
					"text-anchor":"middle",
				});
				_nameG.add(name);
				_index++;
			}
			_this.name.push(_nameG)
		});
	},
	//显示文字
	showName:function (index) {
		var _this = this;
		_this.name[index].attr({
			"visibility":"visible"
		});

	},
	//隐藏文字
	hideName:function (index) {
		var _this = this;
		_this.name[index].attr({
			"visibility":"hidden"
		});
	},
	/**
	 * 进入动画
	 * */
	enterAnimation : function () {
		var _this = this;
		Snap.animate(0, 1, function (value) {
			_this.setAnulusPath(value);
		}, 400, mina.easeout(), function () {
			_this.showLabelAnimate();
		});
	},
	/**
	 *  标签展现动画
	 * */
	showLabelAnimate : function () {
		var _this = this;
		_this.lableG.animate({
			opacity : 1
		}, 200, mina.easein(), null)
	},
	/**
	* 获取圆上点的坐标
	*
	* */
	getPoint:function (angle,radius) {
		var
			_this = this,
			_centerPoint = _this.centerPoint, //圆心坐标
			_point={};
		_point.x=_centerPoint.x + radius * Math.cos(angle * _this.rad);
		_point.y=_centerPoint.y + radius * Math.sin(angle * _this.rad);
		if(-90<=angle&&angle<0){
			_point.quadrant=1
		}else if(0<angle&&angle<=90){
			_point.quadrant=4
		}else if(90<angle&&angle<=180){
			_point.quadrant=3
		}else{
			_point.quadrant=2
		}
		return _point;
	},

	/**
	 *  获取圆弧的路径
	 * @param insideRadius   {number}  内圆半径
	 * @param outsideRaduis  {number} 外圆半径
	 * @param startAngle   {number}  开始角度
	 * @param endAngle     {number}   结束角度
	 * @returns {string}  圆弧路径
	 */
	getPiePath : function (insideRadius, outsideRaduis, startAngle, endAngle) {
		var _this = this;
		var start=_this.getPoint(startAngle,outsideRaduis),
			end=_this.getPoint(endAngle,outsideRaduis),
			star2=_this.getPoint(endAngle,insideRadius),
			end2=_this.getPoint(startAngle,insideRadius);
		var largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
		var path = [
			'M', start.x, start.y,
			'A', outsideRaduis, outsideRaduis, 0, largeArc, 1, end.x, end.y,
			'L', star2.x, star2.y,
			'A', insideRadius, insideRadius, 0, largeArc, 0, end2.x, end2.y,
			'Z'
		];
		return path.join(' ');
	},
	/**
	 * 获取数据总和
	 * @param {Array} data 计算总和的数据列表
	 * */
	getTotal : function (data) {
		var _res=0;
		for(var i=0;i<data.length;i++){
			_res+=data[i].value;
		}
		return _res;
	},
	/*获取角度*/
	getAngle:function(item){
		var _this=this;
		if(item.value!=0){
			return Math.max(_this.opts.minAngle,_this.totalAngle*item.value/_this.total)
		}else{
			return _this.opts.zeroAngle;
		}
	},
	/*获取总角度*/
	getTotalAngle:function() {
		var _this=this;
		var _totalAngle = 360,
			_data=_this.opts.data,
			_total = _this.total,
			_curAngle=0,
			_minAngle = _this.opts.minAngle,
			_zeroAngle = _this.opts.zeroAngle;
		for(var i=0;i<_data.length;i++){
			_curAngle=360*_data[i].value/_total;
			if(_curAngle<_minAngle){
				if(_curAngle==0){
					_totalAngle-=_zeroAngle;
				}else{
					_totalAngle-=(_minAngle-_curAngle);
				}
			}
		}
		return _totalAngle;
	},
	/*判断两个点是否位于同一侧*/
	getSide:function (point1,point2) {
		var _res;
		if(point1.quadrant==1||point1.quadrant==4){
			if(point2.quadrant==1||point2.quadrant==4){
				_res=1;//右侧
			}else{
				_res=false;
			}
		}else{
			if(point2.quadrant==2||point2.quadrant==3){
				_res=-1;//左侧
			}else{
				_res=false;
			}
		}
		return _res;
	},
	/*获取属性*/
	getOption:function () {
		var _this=this;
		return _this.opts;
	},
	/*更新方法*/
	update:function (options) {
		var _this=this;
		_this.opts=options;
		_this.snap.clear();
		_this.render();
	}
};
	return   DrawPie
});