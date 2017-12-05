/**
 * @version:	 		    2017.05.01
 * @createTime: 	 		2017.06.13
 * @updateTime: 			2017.06.13
 * @author:				    wuwg
 * @moduleName              fd+component   前缀 +名字
 * @description             fdComponent.js ,全局的组件
 ***/

/**
 *    Vue.component(id,[definition])
 *     id=String
 *    definition =function||Object
 */
 
 define('fdComponent',['vue','uiModel','datetimepicker','DrawProgress','echarts'],
     function (Vue,uiModel,datetimepicker,DrawProgress,echarts) {
    //转换为中文
     ;(function($){
         $.fn.datetimepicker.dates['zh-CN'] = {
             days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
             daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六", "周日"],
             daysMin:  ["日", "一", "二", "三", "四", "五", "六", "日"],
             months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
             monthsShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
             today: "今天",
             suffix: [],
             meridiem: ["上午", "下午"]
         };
     }(jQuery));
    // 日期控件
     Vue.component('datetime-picker', {
         template:'<div class="fd-inputGroup date" :id="scope.id">'+
                     '<input :value="scope.date" readonly>'+
                     '<span class="fd-add-on"><i class="fd-icon-th"></i></span>'+
                     '</div>',
         props: {
             id: {
                 type: String,
                 default: ''
             },
             changeCallback:{
                 required: true,
                 default: null
             },
             date: {
                 type: String,
                 default: ''
             },
             datepickerOptions: {
                 type: Object,
                 default: function () {
                     return {};
                 }
             },
             name:{
                 type: String,
                 default: ''
             },

         },
         data: function () {
           return  {
               scope:{
                   id:this.id,
                   changeCallback:this.changeCallback,
                   date:this.date,
                   datepickerOptions:this.datepickerOptions,
                   name:this.name,
               }
           }
         },
         //  深度兼容 date的变化
         watch:{
             date:{
                 deep:true,
                 handler: function(newValue,oldValue){
                     if(newValue!==oldValue && newValue!==this.scope.date ){
                         this.scope.date=newValue;
                     }
                 }
             }

         },
         methods: {
             changeDate: function () {
                 var _this = this;
                 var dateValue =  _this.input.val();
                 _this.$emit('change', dateValue,_this.name);
             }
         },
         mounted: function () {
             var _this = this;
             //获取日历控件元素，如果有组件就是对应的div上添加日历控件，如果没有组件就在对应的input元素上添加
             _this.$datetimepickerEle = $(_this.$el);
             // 如果是input元素直接绑定日历控件，则直接获取input的值，如果是父级，则获取子集input的值
             _this.input=_this.$datetimepickerEle.is('input')?_this.$datetimepickerEle:_this.$datetimepickerEle.find('input');
             //创建日期控件
             _this.$datetimepickerEle.datetimepicker(_this.scope.datepickerOptions).on('changeDate', function (e) {
                 _this.changeDate();
                 _this.scope.changeCallback();
             }).on('show', function(event){
                 //  更新日期
                 _this.$datetimepickerEle.datetimepicker('update');
             });
         }
     });
    //进度条，柱状图
     Vue.component('component-progress',{
             props:{
                 count:{
                     required:true,
                     type:Number,
                     default:0
                 },
                 total:{
                     required:true,
                     type:Number,
                     default:100
                 },
                 className:{
                     type:String,
                     default:''
                 },
                 delay:{
                     type:Number,
                     default:1000
                 },
             },
             //模板
             template:'   <div class="fd-component-progress" :class="scope.className">'+
             '              <div class="fd-progress">'+
             '                   <span class="fd-progress-current" :style="{width:scope.width}"></span>'+
             '              </div>'+
             '              <span class="fd-count" v-text="scope.count"></span>'+
             '            </div>',
             data: function () {
                 return {
                     scope:{
                         count:this.count,
                         total:this.total,
                         className:this.className,
                         width:0,
                     }
                 }
             },
             watch:{
                 count:{
                     deep:true,
                     handler: function (newValue,oldValue) {
                         this.scope.count=newValue;
                         this.scope.width=this.getWidth();
                     }
                 },
                 total:{
                     deep:true,
                     handler: function (newValue,oldValue) {
                         this.scope.total=newValue;
                         this.scope.width=this.getWidth();
                     }
                 }
             },
             methods: {
                 getWidth:function(){
                     return  this.scope.count/this.scope.total*100+'%';
                 }
             },
             computed:{
             }, // 插入到真实dom后
             mounted: function () {
                 var  _this=this;
                 setTimeout(function(){
                     _this.scope.width=_this.getWidth();
                 },_this.delay);
             }
         });
    //echarts图标
     Vue.component('component-charts',{
         props:{
             options:{
                 type:Object,
                 required:true
             },
             id:{
                 type:String,
                 required:true
             },
             delay:{
                 type:Number,
                 default:1000,
             },
             clickCallback:{
                 type:Function
             }
         },
         template:'<div class="fd-charts"   :id="scope.id" ></div>',
         data: function () {
             return {
                 scope:{
                     options:this.options,
                     id:this.id,
                     clickCallback:this.clickCallback,
                     delay:this.delay
                 }
             }
         },
         watch:{
             // * 最好还是别用什么深度监控，这就是一个坑，用了以后各种对象找不到，还报错
             options:{
                 deep:true,
                 handler: function (newValue,oldValue) {
                     this.update(this);
                 }
             }
         },
         methods:{
             getOptions: function (options) {
                 if($.type(options)=='object'){
                     var  _originOptions=JSON.parse(JSON.stringify(options));
                 }
                 var   _defaultOptions = {
                     //显示暂无数据的情况
                     noDataLoadingOption :{
                         text: '暂无数据',
                         effect:'bubble',
                         effectOption : {
                             effect: {
                                 n: 0 //气泡个数为0
                             },
                             //改变暂无数据的背景色
                             backgroundColor:"rgba(10,53,121,0.6)"
                         },
                         textStyle: {
                             color : '#40a5f4',
                             'font-family':'Microsoft YaHei',
                             fontSize:14,
                             fontWeight: '400'
                         }
                     },
                 };
                 //  合并参数
                 var  _options= $.extend(true,{},_defaultOptions,options||{});
                 return  _options;
             },
             // 更新图表
             update: function (_this) {
                 // 生成图表
                 if(!!_this.myChart){
                     _this.myChart.clear();
                     _this.myChart.setOption(_this.getOptions( _this.options));
                 }else{
                     _this.init();
                 }
             },
             // 销毁图表
             destory: function () {
                 var _this=this;
                 $(window).off('resize.'+_this.scope.id);
                 _this.myChart.clear();
                 _this.myChart.dispose();
             },
             //绑定事件
             bindEvent: function () {
                 var _this=this;
                 // 绑定resize事件
                 $(window).off('resize.'+_this.scope.id).on('resize.'+_this.scope.id,function(){
                     _this.myChart.resize();
                 });
             },
             // 创建图表
             createChart: function () {
                 var _this=this;
                 // 生成图表实例
                 _this.myChart=echarts.init(document.getElementById(_this.scope.id));

                 // 生成图表
                 _this.myChart.setOption(_this.getOptions(_this.scope.options));
                 /*绑定事件*/
                 if(_this.scope.clickCallback){
                     _this.myChart.on('click', function (param) {
                         _this.scope.clickCallback(param);
                     });
                 }

             },
             // 初始化函数
             init: function () {
                 var _this=this;
                 // 创建图表
                 //因为有动画，所以要采用定时器
                 if(_this.timmer){
                     clearTimeout(_this.timmer);
                 }
                 _this.timmer=setTimeout(function () {
                     _this.createChart();
                 },_this.scope.delay);
             }
         },
         // 插入到真实dom后
         mounted: function () {
             var  _this=this;
             // 初始化
             _this.init();
             //绑定事件
             _this.bindEvent();
         }
     });
     //  进度条插件,svg环形
     Vue.component('component-progress02',{
         props:{
             options:{
                 type:Object,
                 required:true
             }
         },
         template:'<div class="fd-svgBox"   :id="scope.options.id" ></div>',
         data: function () {
             return {
                 scope:{
                     options:this.options
                 }
             }
         },
         watch:{
             options:{
                 deep:true,
                 handler: function (newValue,oldValue) {
                     this.update(this);
                 }
             }
         },
         methods:{
             getOptions: function (options) {
                 return  options;
             },
             // 更新
             update: function (_this) {
                 // 生成
                 _this.destory();
                 _this.createProgress();
             },
             // 销毁
             destory: function () {
                 var _this=this;
                 $("#"+_this.scope.options.id).empty();
             },
             //绑定事件
             bindEvent: function () {
             },
             // 创建
             createProgress: function () {
                 var _this=this;
                 // 生成实例
                 if(_this.scope.options.data){
                     _this.progress= new DrawProgress();
                     _this.progress.setOptions(_this.scope.options);
                 }
             },
             // 初始化函数
             init: function () {
                 var _this=this;
                 // 创建图表
                 _this.createProgress();
                 //绑定事件
                 _this.bindEvent();
             }
         },
         // 插入到真实dom后
         mounted: function () {
             var  _this=this;
             // 初始化
             _this.init();
         }
     });
     //下拉组件
     Vue.component('component-select', {
         props:{
             name:{
                 type:String,
                 required:true
             },
             // 值
             val:{
                 type:null,//  null 代表任意类型
                 required:true,
                 validator:function (value) {
                     return  value+"200";
                     //  return [{key:'',value:''}]
                 }
             },
             dataList:{
                 // 必传且是数组
                 required: true,
                 type:Array,  // 多种类型 [String,Number]
                 default:[{key:'',value:''}] //，有默认值
             }
         } ,
         //  模板
         template:'<div class="fd-inputGroup js-drop-menu-contain">'+
         '<span class="fd-trigger fd-select js-drop-menu-trigger"></span>'+
         '<input class="fd-input js-drop-menu-trigger" readonly v-model="scope.val">'+
         '<ul class="fd-selectList js-drop-menu fd-hide">'+
         '<li  class="fd-selectItem js-drop-item"  v-for="item in scope.dataList" v-text="item.value" @click="clickItem(item,$event)">'+
         '</li>'+
         '</ul></div>',
         //  私有作用域数据
         data: function () {
             return {
                 scope:{
                     name:this.name,
                     val:this.val,
                     checked:this.checked,
                     showError:this.showError,
                     dataList:this.dataList
                 }
             }
         },
         // 监听值的变化
         watch:{
             val: function (newValue,oldValue) {
                 if(newValue!=this.scope.val){
                     this.scope.val=typeof (newValue)=='undefined'?'':newValue;
                 }
             }
         },
         // 方法
         methods:{
             // 点击下拉框
             clickItem:function(item,$event){
                 // 赋值
                 this.scope.val=item.value;
                 // 发送消息到父级
                 this.$emit('change',item,this.name);
             },
             getClass: function () {
                 if(this.scope.checked){
                     return "fd-selectItem-check"
                 }
             }
         },
         // 计算属性
         computed:{
             //  根据值判断是否显示×
             getVal:function(){
                 return  this.scope.val!==''?true:false;
             }
         },
     });

     });
   
