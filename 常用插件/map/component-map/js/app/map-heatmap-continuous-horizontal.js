/**
 * @file map1.js
 * @author xieyq on 2017/8/2.
 * @version 1.0.0
 * @updateTime 2017/8/2
 * @description
 */
$(function() {
    //定义变量
    var scope = {
        map: null, //定义地图对象
        mapId: '000000', //默认展现的地图
        type: 0, //默认展现的类型
        /*
         * 刷新地图
         * */
        refreshMap: function() {
            $.ajax({
                type: 'get',
                url: '../json/mapid-' + scope.mapId + '.json',
                dataType: 'json',
                success: function(data) {
                    if (data.success) {
                        //更新地图
                        scope.updateMap(scope.mapId, data.data);
                    }
                }
            });
        },
        /*
         * 更新地图
         * */
        updateMap: function(mapId, data) {
            //如果地图对象不存在，则需要创建
            if (!scope.map) {
                scope.map = mapCharts.init(document.getElementById('court-map'));
                scope.map.setOption({
                    tooltip: {
                        formatter: function(data) {
                            var _str = data.name + '<br>';
                            _str += '参检案件：' + data.cjaj + '<br>';
                            _str += '合格案件：' + data.hgaj + '<br>';
                            _str += '案件合格率：' + data.ajhgl;
                            return _str;
                        }
                    },
                    //视觉映射参数
                    visualMap: {
                        show: true,
                        //type: 'piecewise',
                        //决定颜色的属性名
                        props: 'ajhgl',
                        //属性类型
                        propsType: 'percent',
                        itemHeight: 140,
                        text: ['高', '低'],
                        left: 'left',
                        top: 'bottom',
                        orient: 'horizontal',
                        //隐藏拖拽手柄
                        calculable: false,
                        //关闭鼠标滑过组件高亮对应的区域
                        hoverLink: false
                    },
                    series: {
                        type: 'heatmap',    //热力图
                        path: '../svg/mapid-',
                        map: mapId,     //展现的地图id
                        data: data,     //地图数据
                        //文本样式
                        label: {
                            show: true,
                            emphasis: {
                                textStyle: {
                                    color: '#fff'
                                }
                            }
                        },
                        itemStyle: {
                            normal: {
                                borderColor: 'rgba(0,70,156,0.3)',
                                borderWidth: 1,
                                shadowBlur: 10,
                                shadowColor: 'rgba(0,0,0,0.5)'
                            },
                            emphasis: {
                                areaColor: 'rgba(25,167,253,0.8)'
                            }
                        }
                    }
                });

                scope.map.on('click', function(data) {
                    scope.mapId = data.mapId;
                    scope.refreshMap(); //刷新地图
                });
            } else if (scope.map.opts.mapId === mapId) { //如果只是type发生了变化，则只需要更新当前地图
                //scope.map.updateData(data); //更新地图数据
            } else { //地图区域发生变化
                var _option = scope.map.getOption();    //获取对应的选项参数
                _option.series.map = mapId;
                _option.series.data = data;
                scope.map.setOption(_option);   //设置对应的参数
            }
        }
    };
    scope.refreshMap(); //刷新地图
});