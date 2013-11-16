/*-----------------------------------------------------------------------------------*/
/*	SELECTNAV
/*-----------------------------------------------------------------------------------*/

$(document).ready(function() {
	selectnav('tiny', {
		label: '--- 导航 --- ',
		indent: '-'
	});
});

/*-----------------------------------------------------------------------------------*/
/*	BLOGVIDEO
/*-----------------------------------------------------------------------------------*/
 
$(document).ready(function(){
	var zhaoyong_video = '<embed allowfullscreen="true" allownetworking="internal" allowscriptaccess="never" autostart="true" class="blog_video" enablecontextmenu="False" height="425" id="blog_video_1383450259641" invokeurls="false" loop="true" showstatusbar="1" src="http://player.youku.com/player.php/sid/XNTA2NDk1OTAw/v.swf" type="application/x-shockwave-flash" videosource="http://v.youku.com/v_show/id_XNTA2NDk1OTAw.html" videothumb="http://g4.ykimg.com/0100641F46507DF50EF64507E1094B6C194E6D-80F9-0B8E-2CB5-7C9362574B1B" videotitle="赵勇幽默讲解三生中国九大优势%2b%2b" width="500" wmode="opaque">';
	$('#zhaoyong_video').prepend(zhaoyong_video);
});

/*-----------------------------------------------------------------------------------*/
/*	屏蔽鼠标右键，禁止选择、拷贝
/*-----------------------------------------------------------------------------------*/

$(document).ready(function(){
	$(document).bind('contextmenu selectstart dragstart', function(){
		return false;
	});
});