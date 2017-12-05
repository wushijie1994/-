/**
 * @file index.js 首页面对应的js文件
 * @author xieyq on 2017/7/25.
 * @version 1.0.0
 */
$(function() {
    var myChart = mapCharts.init(document.getElementById('court-map'));
    myChart.setOption();
});