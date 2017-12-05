/**
 * @version:	 		    2017.01.01
 * @createTime: 	 		2017.06.30
 * @updateTime: 			2017.06.30
 * @author:				    wuwg
 * @description             main.js ,所有js入口文件
 */
(function () {
	//  js 的路径=>所有模块的查找根路径
	var  baseUrl='../js/';
	// 防止浏览器缓存main.js，所用用时间戳加载 version.js
	require([baseUrl+'version.js'+'?'+new Date().getTime()],function (version) {
		var  _commonUrl=version.commonUrl ;
		//  require 配置文件
		require.config({
			urlArgs:'version='+version.version,
			baseUrl:baseUrl,
			paths:{
				/**
				 * config
				 */
				config:'config',
				/**
				 * lib
				 */
				//  dom 操作库=>jquery
				jquery:_commonUrl+'lib/jquery/jQuery.v1.11.1.min', //  jquery采用的amd 模块命名， jquery这个名字不可更改
				//  mvvm 库  => vue
				vue:_commonUrl+'lib/vue/vue',
				//  snap
				snap:_commonUrl+'lib/snap/snap.svg-min',
				//  echars
				echarts:_commonUrl+'lib/echarts/echarts-all',
				// ui module
				uiModel:_commonUrl+'lib/uiModel/uiModel',
				//  datetimepicker
				datetimepicker:_commonUrl+'lib/plugin/datetimepicker.min',
				// scrollbar 滚动条
				scrollbar:_commonUrl+'lib/plugin/scrollbar',

				/**
				 * app
				 */
				// 公用的数据表
				fdDataTable:'app/dataTable/fdDataTable',
				// 公用组件
				fdComponent:_commonUrl+'app/component/fdComponent',
				// 公用global
				fdGlobal:_commonUrl+'app/common/global',
				// setHtml
				setHtml:_commonUrl+'app/common/setHtml',
				/**
				 * 插件库
				 */
				//进度条
				DrawProgress:_commonUrl+'lib/plugin/DrawProgress',
				//饼图
				DrawPie:_commonUrl+'lib/plugin/DrawPie',
				//地图方法
				MapCharts:_commonUrl+'lib/plugin/MapCharts',
			},
			//为那些没有使用define()来声明依赖关系
			shim:{
				'scrollbar' : {
					deps : ['jquery'],
					exports : 'scrollbar'
				},
				//  日期控件
				'datetimepicker' : {
					deps : ['jquery']
				},
				"DrawProgress":{
					deps : ['jquery','snap']
				},
			},
			waitSeconds:0  //加载超时问题的一个解决方法0表示不设置超时，默认是7s
		});

		// 模块的入口
		require(['jquery','fdGlobal','config','vue','setHtml'], function (jquery,fdGlobal,config,Vue,setHtml) {
			// 设置一个全局对象 global+ fd
			window.globalFd={
				// ajax超时加载
				ajaxTimer:null,
				// 超时时间
				ajaxTimeout:5000
			};
			// 正在加载数据
			fdGlobal.loading();
			// 获取js路径
			var url = config.dirJsPath,jsurl = $('body').data('js');


			//如果存在js路径，那么就加载该js
			if (jsurl) {
				require([url+jsurl], function () {
					fdGlobal.removeLoading();
				});
			}
			//  显示body 增加动画类名
			$('body').css({
				visibility : 'visible'
			}).addClass('fd-body-animate');

			setTimeout(function () {
				$("body").addClass("fd-animate-body");
			},300)
		});

	});
})();

