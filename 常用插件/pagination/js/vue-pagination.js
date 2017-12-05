/**
 * Created by Administrator on 2017/5/18 0018.
 */
 //  全局组件
Vue.component('component-pagination', {
    props: {
        //  总页数
        options: {
            required: true,
            type: Object
        }
    },
    template:'<div class="fd-pagination"   v-if="pagination.totalPage>0">' +
            '<div class="fd-info"  v-if="pagination.showPageInfo"  >' +
            '<span>共多少<em  v-text="pagination.totalSize"></em>条数据</span>' +
            '<span>当前显示<em  v-text="pagination.currentSize"></em>条数据</span>' +
            '</div>' +
            '<ul class="fd-operate"  >' +
            '<li class="fd-first"   v-if="!pagination.showPoint"   :class="{ disabled:pagination.currentPage==1}"   v-text="pagination.first"  @click=pagination.gotoPage(1) ></li>' +
            '<li class="fd-prev"    :class="{ disabled:pagination.currentPage==1}"  v-text="pagination.prev"  @click=pagination.gotoPrevPage()></li>' +
            '<li class="fd-page-count"   v-if="pagination.showPoint" :class="{active:pagination.isCurrentPage(1)}"  v-text="1"  @click=pagination.gotoPage(1) ></li>' +
            '<li class="fd-point"   v-if="pagination.showLeftPoint()" >...</li>' +
            '<li class="fd-page-count "   v-if="pagination.showThisPage(item)"    :class="{active:pagination.isCurrentPage(item)}" @click=pagination.gotoPage(item)  v-for="item in  pagination.getInitPages()"      v-text="item"></li>' +
            '<li class="fd-point"  v-if="pagination.showRightPoint()">...</li>' +
            '<li class="fd-page-count"   v-if="pagination.showPoint" :class="{active:pagination.isCurrentPage(pagination.totalPage)}"  v-text="pagination.totalPage"  @click=pagination.gotoPage(pagination.totalPage) ></li>' +
            '<li class="fd-next"    :class="{ disabled:pagination.currentPage==pagination.totalPage}"   v-text="pagination.next" @click=pagination.gotoNextPage()></li>' +
            '<li class="fd-last"  v-if="!pagination.showPoint"  :class="{ disabled:pagination.currentPage==pagination.totalPage}"   v-text="pagination.last"  @click=pagination.gotoPage(pagination.totalPage)></li>' +
            '</ul>' +
    '</div>',
    //  私有作用域数据
    data: function () {
        return {
            pagination : new Pagination(this.options)
        };
    }
});
