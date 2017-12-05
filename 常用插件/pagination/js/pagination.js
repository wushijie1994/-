/**
 * Created by Administrator on 2017/5/18 0018.
 */

define('Pagination',[], function () {
    function Pagination(options){
        var  options=options||{};
        // 总页数
        this.totalPage=options.totalPage?options.totalPage:20;
        //  总数据条数
        this.totalSize=options.totalSize?options.totalSize:0;
        // 当前的数据条数
        this.currentSize=options.currentSize?options.currentSize:0;
        // 当前的页数
        this.currentPage= options.currentPage?options.currentPage:1;
        // 一页显示多少数
        this.showPage =options.showPage?options.showPage:10;
        // 是否显示...
        this.showPoint = options.showPoint?options.showPoint:false;
        // 是否显示右侧信息
        this.showPageInfo=options.showPageInfo?options.showPageInfo:true;
        /**********
         *  文字
         **********/
        this.next =options.next ?options.next:'下一页';
        this.prev =options.prev ?options.prev:'前一页';
        this.first =options.first ?options.first:'首页';
        this.last =options.last ?options.last:'末页';
        // 回调函数
        this.callback= options.callback?options.callback:null;
        // 获取this对象（分页对象）
        if(typeof  options.getPaginationObj=='function'){
            options.getPaginationObj(this);
        }
    }

    Pagination.prototype={
        // 分页改变后的回调函数
        changedCallback: function () {
            var  _this=this;
            if(typeof _this.callback=='function'){
                _this.callback(_this.currentPage,_this);
            }
        },
        // 到目标页
        gotoPage: function (page) {
            var  _this=this;
            _this.currentPage=page;
            _this.changedCallback();
        },
        //  上一页
        gotoPrevPage: function () {
            var  _this=this;
            if (_this.currentPage > 1) {
                _this.currentPage -= 1;
                _this.changedCallback();
            }
        },
        //  下一页
        gotoNextPage: function () {
            var  _this=this;
            if (_this.currentPage < _this.totalPage) {
                _this.currentPage += 1;
                _this.changedCallback();
            }
        },
        //  获取页码
        getPages: function () {
            var  _this=this;
            var pages = [];
            //  s ： 可视化窗口显示多少页
            //  l: 中间靠left 左边的数字
            //  r：中间靠right 右边的数字
            //  t： 总页数
            var s = _this.showPage, l = _this.currentPage, r = _this.currentPage, t = _this.totalPage;
            pages.push(l);
            while (true) {
                //  当超出可视个数退出循环
                if (pages.length >= s) {
                    break;
                }
                // 左边的数据  --l
                if (l > 1) {
                    pages.unshift(--l);
                }
                //  大于等于最大页数(防止总页数小于可视个数时进去死循环)
                if (pages.length >= t) {
                    break;
                }
                //  右边的数字  ++r
                if (r < t) {
                    pages.push(++r);
                }
            }
            return pages;
        },
        // 是否是当前页
        isCurrentPage: function (page) {
            var  _this=this;
            return page == _this.currentPage;
        },
        // 判断是否显示该页
        showThisPage: function (item) {
            var  _this=this;
            return _this.showPoint ? (item != 1 && item != this.totalPage) : true;
        },
        // 显示左边的点
        showLeftPoint: function () {
            var  _this=this;
            //  当前的页-可视页数的一半>0
            return _this.showPoint && (_this.currentPage - _this.showPage / 2 > 2) && (_this.totalPage > _this.showPage);
        },
        // 显示右边的点
        showRightPoint: function () {
            var  _this=this;
            //  当前的页+可视页数的一半< 总数
            return _this.showPoint && (_this.currentPage + _this.showPage / 2 < _this.totalPage - 1) && (_this.totalPage > _this.showPage);
        },
        // 初始化分页
        getInitPages: function () {
            var  _this=this;
            //  debugger
            return _this.getPages();
        }
    };
    return  Pagination;
});

