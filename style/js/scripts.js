/*-----------------------------------------------------------------------------------*/
/*  判断是否为移动设备
/*-----------------------------------------------------------------------------------*/

var isMobile = (function(){
    var device = {
        Android: function() {  
            return navigator.userAgent.match(/Android/i) ? true : false;  
        },  
        BlackBerry: function() {  
            return navigator.userAgent.match(/BlackBerry/i) ? true : false;  
        },  
        iOS: function() {  
            return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;  
        },  
        Windows: function() {  
            return navigator.userAgent.match(/IEMobile/i) ? true : false;  
        }
    };
    return (device.Android() || device.BlackBerry() || device.iOS() || device.Windows());  
})();
/*-----------------------------------------------------------------------------------*/
/*  动态插入代码
/*-----------------------------------------------------------------------------------*/
$(document).ready(function(){
    if(!isMobile){
        var zhaoyong_video = '<embed allowfullscreen="true" allownetworking="internal" allowscriptaccess="never" autostart="true" class="blog_video" enablecontextmenu="False" id="blog_video_1383450259641" invokeurls="false" loop="true" showstatusbar="1" src="http://player.youku.com/player.php/sid/XNTA2NDk1OTAw/v.swf" type="application/x-shockwave-flash" videosource="http://v.youku.com/v_show/id_XNTA2NDk1OTAw.html" videothumb="http://g4.ykimg.com/0100641F46507DF50EF64507E1094B6C194E6D-80F9-0B8E-2CB5-7C9362574B1B" videotitle="赵勇幽默讲解三生中国九大优势%2b%2b" wmode="opaque">';
        $('#zhaoyong_video').prepend(zhaoyong_video);
        var baidu_share_string = '<script type="text/javascript" id="bdshare_js" data="type=slide&amp;img=0&amp;pos=right&amp;uid=1354421" ></script><script type="text/javascript" id="bdshell_js"></script><script type="text/javascript">document.getElementById("bdshell_js").src = "http://bdimg.share.baidu.com/static/js/shell_v2.js?cdnversion=" + Math.ceil(new Date()/3600000);</script>';
        $('body').append(baidu_share_string);
    }
});
/*-----------------------------------------------------------------------------------*/
/*	屏蔽鼠标右键，禁止选择、拷贝
/*-----------------------------------------------------------------------------------*/

$(document).ready(function(){
	$(document).bind('contextmenu selectstart dragstart', function(){
		//return false;
	});
});
