
/**
 * 客户端 javscript 分页插件， 无ajax
 *
 * By Weizeyan[weizeyan52@126.com]
 *
*/

;(function($){
	if(typeof($.fn.pagebar) !== "undefined"){
		return;
	};	
	$.fn.pagebar = function(options){
		var set = $.extend({
			
			//数据列表
			data : [],
			
			//当前页 
			page : 1,
			
			//偏移量
			offset : 2, 
			
			//页码格式
			numType : [2, 2], 
			
			//返回分页列表的html
			getListHtml : function(data){ 
				var html = "";
				if(data.length > 0){
					html += "<div>";
					var i = 0, l = data.length;
					for(; i < l; i++){
						var obj = data[i];
						html += "<p>" + obj.mtitle + "</p>";		
					};
					html += "</div>";
				};
				return html;
			},
			
			//分页列表的html渲染后的回调函数
			onListRenderd :  function(listCon, data){ 
				//alert(data.length);
			},
			
			//分页条
			pagebar : ".pagebar", 
			
			//分页数据
			container : ".listcon"	 
		}, options);
		return this.each(function(){
			
			var t = $(this), _t = this, pagebar = t.find(set.pagebar), container = t.find(set.container);
			
			//当前分页数据
			var currentData = [];
			
			//页码格式
			var numType = set.numType;
			
			//设置当前页
			var currentPage = set.page;
			
			//获取总记录
			var count = set.data.length;
			
			//偏移量
			var offset = set.offset;
			
			//总页数
			var pageCount = count % offset === 0 ? count / offset : 
			parseInt(count / offset) + 1 ;
			
			function __initEvent(){
				var page = isNaN(parseInt(this.getAttribute("page"))) ? 1 : parseInt(this.getAttribute("page"));
				set.page = page;
				t.pagebar(set);
			};
			
			var APP = {
				
				//获取下一页
				__getNextPageHtml : function(){
					var tpage = currentPage + 1;
					return (tpage <= pageCount) ? ("<span class='pagenode' page='" + tpage + "'><a href='javascript:;' onclick='return false;'>下一页</a></span>") : ("<span page='" + pageCount + "'>下一页</span>"); 
				},
				
				//获取上一页
				__getPrevPageHtml : function(){
					var tpage = currentPage - 1;
					return (tpage <= 0) ? ("<span class='pagenode' page='1'>上一页</span>") : ("<span class='pagenode' page='" + tpage + "'><a href='javascript:;' onclick='return false;'>上一页</a></span>");
				},
				
				//获取第一页
				__getFirstPageHtml : function(){
					return (currentPage > 1) ? ("<span class='pagenode' page='1'><a href='javascript:;' onclick='return false;'>首页</a></span>") : ("<span class='pagenode' page='1'>首页</span>");
				},
				
				//获取最后一页
				__getLastPageHtml : function(){
					return (currentPage < pageCount) ? ("<span class='pagenode' page='" + pageCount + "'><a href='javascript:;' onclick='return false;'>尾页</a></span>") : ("<span class='pagenode' page='" + pageCount + "'>尾页</span>");
				},
				
				//获取中间循环的页码
				__getNumerPageHtml : function(){
					var html = "";
					for(var i = currentPage - numType[0], l = currentPage + numType[1]; i <= l; i++){
						if(i > 0 && i <= pageCount){
							if(i === currentPage){
								html += "<span class='pagenode' page='" + i + "'>第" + i + "页</span>";
							}else{
								html += "<span class='pagenode' page='" + i + "'><a href='javascript:;' onclick='return false;'>第" + i + "页</a></span>";
							};
						};
					};
					return html;
				},
				
				//获取分页条
				getPageBar : function(){
					return this.__getFirstPageHtml() + "&nbsp;" + this.__getPrevPageHtml() + "&nbsp;" + this.__getNumerPageHtml() + this.__getNextPageHtml() + "&nbsp;" + this.__getLastPageHtml();
				},
				
				//获取分页数据
				getPageListHtml : function(){
					var startIndex = this.__getStartIndexByPage(currentPage);
					var endIndex = startIndex + offset;
					var listData = set.data.slice(startIndex, endIndex);
					currentData = listData;
					return set.getListHtml(listData);
				},
				
				__getStartIndexByPage : function(page){
					return (page - 1) * offset;
				},
				
				//输出分页数据到dom
				renderPutPageParHtml : function(){
					pagebar.html(this.getPageBar()).find(".pagenode").each(function(){
						this.onclick = __initEvent;
					});
				},
				
				//输出对应数据列表到dom
				renderListDataHtml : function(){
					container.html(this.getPageListHtml());
					container.each(function(){
						set.onListRenderd.call(this, this, currentData);	
					});
				},
				
				init : function(){
					this.renderPutPageParHtml();
					this.renderListDataHtml();
				}
			};
			APP.init();
		 
		});
	};
})(jQuery);
