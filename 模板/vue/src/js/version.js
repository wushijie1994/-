/**
 * @version:	 		    2017.06.13
 * @createTime: 	 		2017.06.13
 * @updateTime: 			2017.06.13
 * @author:				    wuwg
 * @description             version controller
 */
define([], function () {
    return {
        version:'17.0.2'+new Date().getTime(), //  项目版本号
        author:'wuwg',  // 作者名
        updateTime:'2017-06-13', // 更新时间
        commonUrl:''
    };
});

// browser-sync  start --server  --files "src/**/*.html, src/**/*.css , src/**/*.less, src/js/app/**/*.js"