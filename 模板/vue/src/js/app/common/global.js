/**
 * @version:	 		    2017.13.16
 * @createTime: 	 		2017.03.16
 * @updateTime: 			2017.03.16
 * @author:				    wuwg
 * @description             global.js ,这里放的是全局的方法，禁止写其他代码
 ***/
define(['jquery'], function ($) {
    "user strict";
    var  _global= {

        getLocalPath : function (isAbsUrl) {
            var curWwwPath = window.location.href;
            var pathName = window.location.pathname;
            var pos = curWwwPath.indexOf(pathName);
            var localhostPath = curWwwPath.substring(0, pos);
            var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
            return  isAbsUrl?(localhostPath + projectName + '/'):'';
        },
        /**
         * @time 2019-09-24  新增=> 为了统一管理日志
         * @param showLog   是否输出日志
         * @param name      名称
         * @param method  请求方式  post,get,
         * @param url   请求的url
         * @param requestData   请求的数据
         */
        consoleLogRequest:function(showLog,name,method,url,requestData){
            if(showLog){
                console.log(name?name:'');
                console.log('[[前台]]==>请求方式是');
                console.log(method?method:'');
                console.log('[[前台]]==>请求的url是');
                console.log(url?url:'');
                console.log('[[前台]]==>请求的数据是');
                console.log(requestData?requestData:'');
            }
        },
        /**
         * @time 2019-09-24  新增=> 为了统一管理日志
         * @param showLog    是否输出日志
         * @param name   名称
         * @param responseData 后台返回的数据
         */
        consoleLogResponse:function(showLog,name,responseData){
            if(showLog){
                console.log(name?name:'');
                console.log('(后台)==>返回的数据是');
                console.log(responseData?responseData:'');
            }
        },
        //  正在加载页面
        loading:function(){
            $('body').append('<div id="js-fd-loading-init"  class="fd-loading-init" ><span>数据加载中...</span></div>');
            //  文档加载完成后，那么添加一个ajax 方法
            _global.ajaxLoading();
        },
        // 移除正在加载页面
        removeLoading:function(){
            $('#js-page-init').css({
                opacity: 1,
                visibility:'visible'
            });
            if($('#js-fd-loading-init').length > 0) {
                $('#js-fd-loading-init').remove();
            }
        },
        //  ajax 加载
        ajaxLoading: function () {
            //  判断当前的window是否是父级的window
            if( window.top.location.href == window.self.location.href ){
                // 加载
                $(['<div class="fd-loading-contain fd-hide" id="js-loading" >',
                    ' <div class="fd-loading-mask"></div>',
                    ' <img  class="fd-log" src="../images/loading.gif" alt="正在加载的图片"/>',
                    '</div>'].join("")).appendTo('body');
            }
            $(document).ajaxStart(function() {
                _global.ajaxStartLoading();
                if(globalFd.ajaxTimer){
                    clearTimeout(globalFd.ajaxTimer);
                }
                globalFd.ajaxTimer =setTimeout(function(){
                    _global.removeLoading();
                },globalFd.ajaxTimeout);
            });
            $(document).ajaxStop(function() {
                //  防止有些图形没有完成绘制，所以数据加载完后1秒钟再移除
                setTimeout(function(){
                    _global.ajaxStopLoading();
                },300);
            });
        },
        // 显示转圈的小图片
        ajaxStartLoading:function(){
            if($(window.top.document).find('#js-loading').hasClass('fd-hide')){
                $(window.top.document).find('#js-loading').removeClass('fd-hide');
            }
        },
        // 隐藏转圈的小图片
        ajaxStopLoading:function(){
            if(!$(window.top.document).find('#js-loading').hasClass('fd-hide')){
                $(window.top.document).find('#js-loading').addClass('fd-hide');
            }
        },

        // 请求数据报错
        requestError:function(data, textStatus, errorThrown){
            // 2016-09-29 ，ie会直接弹窗报错，所用 try{}catch(e){}
            try{
                console.error('请求数据发生了错误');
                console.error(data);
            }catch(e){
                //console.log(e);
            }
        },

        // localStorage
        // 储存storage
        saveLocalStorage : function (name, value) {
            localStorage.setItem(name, value);
        },

        // 查找storage
        findLocalStorage : function (str) {
            var requestStr = localStorage.getItem(str);
            return requestStr;
        },

        // 删除storage
        deleteLocalStorage : function (str) {
            localStorage.removeItem(str);
        },

        //sessionStorage
        // 储存storage
        saveSessionStorage : function (name, value) {
            sessionStorage.setItem(name, value);
        },

        // 查找storage
        findSessionStorage : function (str) {
            var requestStr = sessionStorage.getItem(str);
            return requestStr;
        },

        // 删除storage
        deleteSessionStorage : function (str) {
            sessionStorage.removeItem(str);
        },
        //  获取url中的参数
        getUrlParams: function () {
            var  _url=window.location.href;
            // 问号的位置
            var _questionPlace=_url.indexOf('\?');
            var  _data=false;
            if(_questionPlace!=-1){
                //  截取字符串
                _data=_url.substr(_questionPlace+1);
                // 对字符串进行解密
                _data=decodeURIComponent(_data);
                //获取数据对象
                _data=JSON.parse(_data);
            }
            return  _data;
        },
        limit:10,
        bindDropMenuEvent: function () {
            /**
             * @description 下拉组件在页面上使用，需要下面需要以下几个class
             * js-drop-menu-contain  下拉组件的容器
             * js-drop-menu-trigger  下拉组件的触发器
             * js-drop-menu  下拉菜单
             * js-drop-item  下拉菜单条目
             *@author  wuwg
             *@time  2016-10-09
             */
                //  给body绑定点击事件
            $('body').off('click.dropMenuShow').on('click.dropMenuShow','.js-drop-menu-trigger', function (event) {
                var  _this=$(this);
                var  _dropMenu=_this.siblings('.js-drop-menu');
                var  _dropComtain=_this.parent('.js-drop-menu-contain');
                $('.js-drop-menu-contain').removeClass('extend');

                //  隐藏其他的下拉框，显示当前点击的下拉框
                $('.js-drop-menu').not(_dropMenu).addClass('fd-hide');

                var  _event=event||window.event;

                var _target=$(event.target);


                // 如果当前的是显示的，那么就隐藏，反之一样
                if(_dropMenu.hasClass('fd-hide')){
                    _dropMenu.removeClass('fd-hide');
                    _dropComtain.addClass('extend');
                    // 绑定下拉框的提示事件
                 //   _tipsObj.bindMouseTipsEvent(_tipsObj.dropMenuTips);
                    $('body').off('click.dropMenuHide').on('click.dropMenuHide', function (event) {
                        var  target=$(event.target);
                        if(target.parents().hasClass('js-drop-menu-contain')||target.hasClass('js-drop-menu-contain')){
                            // 如果点击的是条目的话，那么就应该隐藏，否则不隐藏
                            if(target.is('.js-drop-item') ||  target.is( '.tree-hd[canselected="true"] .tree-name') ){
                                //  隐藏下拉框
                                _dropMenu.addClass('fd-hide');
                                // 去除展开类名
                                _dropComtain.removeClass('extend');
                                // 记得解除事件绑定
                                $('body').off('click.dropMenuHide');
                                // 记得解除下拉框的提示事件
                            //    _tipsObj.unbindMouseTipsEvent();
                            }else {
                                return false;
                            }
                        }else {
                            //  隐藏下拉框
                            _dropMenu.addClass('fd-hide');
                            // 去除展开类名
                            _dropComtain.removeClass('extend');
                            // 记得解除事件绑定
                            $('body').off('click.dropMenuHide');
                            // 记得解除下拉框的提示事件
                          //  _tipsObj.unbindMouseTipsEvent();
                        }
                    });
                }else {
                    //  隐藏下拉框
                    _dropMenu.addClass('fd-hide');
                    // 去除展开类名
                    _dropComtain.removeClass('extend');
                    // 记得解除事件绑定
                    $('body').off('click.dropMenuHide');
                    // 解除下拉框的提示事件
                   // _tipsObj.unbindMouseTipsEvent();
                }
            });
        },
        //设置最大日期

        endDate:'2017-08-23',
        //设置最小日期
        startDate:'2015-01-01',
    };
    return  _global;
});