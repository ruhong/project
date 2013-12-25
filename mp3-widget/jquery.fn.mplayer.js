/**
 * jQuery.fn.mPlayer - 跨浏览器的媒体播放器插件 支持Flash和html5
 * By Jacky.Wei
 * Project URL -  http://designcss.org/public/jfk/source/jfk.fn.mplayer/jquery.html
*/
(function($){
	//插件引用次数的索引
	var CID = -1;
	if(typeof(SWFMPlayers) !== "undefined"){
		return;
	};
	if(typeof($.fn.mPlayer) !== "undefined"){
		return;
	};
	
	//swf对象列表
	var SWFMPlayers = {};
	/*封装一个lrc处理类*/
	function LRC(){};
	LRC.prototype.init = function(url, onbeforeLoadLRC, onLRCLoaded, idPrefix){
		url = url || "";
		onbeforeLoadLRC = onbeforeLoadLRC || function(){};
		onLRCLoaded = onLRCLoaded || function(){};
		idPrefix = idPrefix || "DEFAULT";
		onbeforeLoadLRC();
		//lrccon.html("<p class='loadinglrc'>正在加载歌词......</p>");
		this.txt = "";
		this.__lrccache = [];
		var o = this;
		$.get(url,{},function(txt){
			onLRCLoaded(o.setLRCToHtml(txt, idPrefix));			
		});
	};
	LRC.prototype.setLRCToHtml = function(txt, idPrefix){
		this.__lrccache  = this.lrcToArr(txt);
		return (function(arr){
			var ret = "";
			$.each(arr,function(){
				ret += "<p id='" + idPrefix + "_lrcto_" + this.time + "' lrcto='" + this.time + "'><!--" + this.time + " :-->" + this.lrc + "</p>";
			});
			return ret;
		})(this.__lrccache);
	};
	LRC.prototype.lrcToArr = function(lrcTxt){
		var data = $.trim(lrcTxt).split(/\n+/);
		var pat_lrcTime = /^(\d+\:){1,2}([\d\.]+)$/;
		var lrcData = [];
		$.each(data, function(i){
			if($.trim(this) !== ""){
				var str = $.trim(this).slice(1);
				var lastIndex = str.lastIndexOf("]");
				var left = str.slice(0, lastIndex);
				var leftArr = left.split("][");
				var right = str.slice(lastIndex + 1);
				if($.trim(right) !== ""){
					$.each(leftArr, function(){
						if(pat_lrcTime.test(this)){
							var timeStrToArr = this.split(":");
							var time = 0;
							if(timeStrToArr.length === 2){
								time = parseInt(timeStrToArr[0], 10) * 60 + parseFloat(timeStrToArr[1]);
							}else if(timeStrToArr.length === 3){
								time = parseInt(timeStrToArr[0], 10) * 3600 + parseInt(timeStrToArr[1], 10) * 60 + parseFloat(timeStrToArr[2]);
							};
							time = parseInt(time * 1000);
							lrcData.push({
								time : time,
								lrc : right	
							});
						};
					});
				};
			};
		});
		return this.sorted(lrcData);
	};
	LRC.prototype.sorted = function(arr){
		return arr.sort(function(a, b){
			return a.time - b.time;
		});
	};
	//是否支持audio标签的判断
	var MediaCanPlayType = (function(){
	
		function getAudioNode(){
			return document.createElement("audio");
		};
		
		function supportAudio(){
			var audio = getAudioNode();
			if (audio != null && audio.canPlayType){
				return true;
			};	
			return false;
		};
		
		function supportSWF(){
			var support = false;
			if(window.ActiveXObject){
				try{
					new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
					support = true;
				}catch(e){
					 
				}
			}else if(navigator.plugins && navigator.plugins.length > 0){
				support = typeof(navigator.plugins["Shockwave Flash"]) !== "undefined";
			};
			return support;
		};
		
		return {
			//对flash的支持
			supportSWF : supportSWF(),
			
			//对html5 audio的支持
			supportAudio : supportAudio(),
			//html audio是否支持mp3
			mp3 : (function(){
				var audio = getAudioNode();
				var support = supportAudio();
				return support ? audio.canPlayType("audio/mpeg") != "" : false;
			})(),
			//html audio是否支持ogg
			ogg : (function(){
				var audio = getAudioNode();
				var support = supportAudio();
				return support ? audio.canPlayType("audio/ogg") != "" : false;
			})()
		};	
	})();
	
	//智能机浏览器版本信息
	var browser = {
		versions: function () {
			var u = navigator.userAgent, app = navigator.appVersion;
			return {//移动终端浏览器版本信息 
				trident: u.indexOf('Trident') > -1, //IE内核
				presto: u.indexOf('Presto') > -1, //opera内核
				webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
				gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
				mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
				ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
				android: u.indexOf('Android') > -1, //android终端
				iPhone: u.indexOf('iPhone') > -1, //是否为iPhone
				iPad: u.indexOf('iPad') > -1, //是否iPad
				webApp: u.indexOf('Safari') == -1, //是否web应该程序，没有头部与底部
				ie6 : /msie 6/i.test(u)
			};
		} (),
		language: (navigator.browserLanguage || navigator.language).toLowerCase()
	};
	
	 
	//触发鼠标事件时获取坐标
	function mousePosition(ev){
		if(ev.pageX || ev.pageY){
			return {x:ev.pageX, y:ev.pageY};
		};
		return {
			x:ev.clientX + document.body.scrollLeft - document.body.clientLeft,
			y:ev.clientY + document.body.scrollTop  - document.body.clientTop
		};
	};
	function getOffsetLeft(ele){
		var ret = 0;
		while(ele !== null){
			ret += ele.offsetLeft;
			ele = ele.offsetParent;
		};
		return ret;
	};
	function getOffsetTop(ele){
		var ret = 0;
		while(ele !== null){
			ret += ele.offsetTop;
			ele = ele.offsetParent;
		};
		return ret;
	};
	//时间转换为字符串
	function timeFormat(time){
		time = Math.round(time);
		var str = "";
		if(time < 60){
			str = "00:" + ((time < 10) ? ("0" + time) : time); 
		}else{
			var minutes = parseInt(time / 60);
			if(minutes < 10){
				minutes = "0" + minutes;
			};
			var seconds = time % 60;
			if(seconds < 10){
				seconds = "0" + seconds;
			};
			str = minutes + ":" + seconds;
		};
		return str;
	};
	
	//数组切割
    function arrayChunk (a, b) {
		var ret = [];
		var l = a.length;
		var pieces = l % b == 0 ? (l / b) : parseInt(l / b) + 1;
		for (var i = 0; i < pieces; i++) {
			var start = i * b;
			var end = (i + 1) * b;
			ret[i] = a.slice(start, end)
		};
		return ret
    };
	var supportSWF = browser.versions.mobile ? false : MediaCanPlayType.supportSWF,
	//var supportSWF = false,
	supportAudio = MediaCanPlayType.supportAudio, 
	supportMP3 = MediaCanPlayType.mp3, 
	supportOGG = MediaCanPlayType.ogg;
	if(browser.versions.ie6){
		try{
			document.execCommand("BackgroundImageCache", false, true);
		}catch(e){
		};
	};	
	$.fn.mPlayer = function(options){
		var set = $.extend({
			swfURL : "mp3-widget/mplayer.swf",
			fileDir : "meidia/",
			mediaType : "audio",
			playMode : 1,	//1.顺序播放 2.随机播放  3.单曲循环
			autoPlay : true,		
			fileLists : [
				//{mp3_src : "f/k.mp3", ogg_src : "f/k.ogg", fid : 101, title : ""}
			],
			currentId : 101,
			volume : 0.5,
			pagecfg : {
				listoffset : 2
			}
			
		}, options);
		
		//如果ios则默认不播放
		if(browser.versions.ios){
			set.autoPlay = false; 
		};		
		
		return this.each(function(){
			CID += 1; 
			//当前插件引用的索引
			var _cid = CID;
			//每一行lrc歌词容器的id前缀
			var _lrcPreFix = "MPLAYERLRC_" + _cid; 
			//swf播放器创建状态
			var SWFCreated = false;
			var t = $(this), _t = this;
			//临时存储音量的变量
			var cacheVolume = set.volume;
			//html5音频对象
			var media = null;
			//当前id
			var currentId = set.currentId;
			//文件列表
			var mediaList = set.fileLists;
			//lrc实例化
			var lrcApp = new LRC();
			//是否包含lrc歌词
			var hasLrc = false;
			//拖拽状态
			var lrcIsDraging = false;
			//当前播放位置
			var currentPosition = 0;
			//当前文件下载进度
			var percentLoaded = 0;
			//播放状态
			var playState = "stop"; // play stop pause
			 
			var mp = {
				titlebar : t.find(".mp_title"),
				audiocon : t.find(".mp_audiocon"),
				cachedbar : t.find(".mp_cached"),
				progressbar : t.find(".mp_progressbar"),
				playedbar : t.find(".mp_played"),
				playedto : t.find(".mp_playedto"),
				timelength : t.find(".mp_timelength"),
				playpausebtn : t.find(".mp_playpausebtn"),
				stopbtn : t.find(".mp_stopbtn"),
				currentvolumebar : t.find(".mp_currentvolume"),
				volumeprogress : t.find(".mp_volumeprogress"),
				minvolumebtn : t.find(".mp_minvolume"),
				maxvolumebtn : t.find(".mp_maxvolume"),
				playmodebtn1 : t.find(".mp_playmode_mode1"),
				playmodebtn2 : t.find(".mp_playmode_mode2"),
				playmodebtn3 : t.find(".mp_playmode_mode3"),
				playmodecon : t.find(".mp_playmodecon"),
				prevbtn : t.find(".mp_prevbtn"),
				nextbtn : t.find(".mp_nextbtn"),
				lrccon : t.find(".mp_lrccon"),
				lrctimebar : t.find(".mp_lrctimebar"),
				lrctimebarcon : t.find(".mp_lrctimebarcon"),
				lrcshowtime : t.find(".mp_showtime"),
				playlistcon : t.find(".mp_listcon") 
				 
			};
			
			var SWFMPlayer = {
				cid : _cid,
				play : function(){
					(function(_this){
						try{
							_this.getSwf().__play(); 
						}catch(e){
							setTimeout(arguments.callee, 0);
						};
					})(this);
					
				},
				pause : function(){
					(function(_this){
						try{
							_this.getSwf().__pause(); 
						}catch(e){
							setTimeout(arguments.callee, 0);
						};
					})(this);
					
				},
				stop : function(){
					(function(_this){
						try{
							_this.getSwf().__stop();
						}catch(e){
							setTimeout(arguments.callee, 0);
						};
					})(this);
				},
				setVolume : function(value){
					(function(_this){
						try{
							_this.getSwf().__setVolume(value);
						}catch(e){
							setTimeout(arguments.callee, 0);
						};
					})(this);
				},
				playTo : function(position){
					//alert(position * 1000)
					//单位为秒，该参数将转换为毫秒进行传递
					(function(_this){
						try{
							_this.getSwf().__playTo(position * 1000);
						}catch(e){
							setTimeout(arguments.callee, 0);
						};
					})(this);
					
				
				},
				setURL : function(url){
					(function(_this){
						try{
							_this.getSwf().__setURL(url);
						}catch(e){
							setTimeout(arguments.callee, 0);
						};
					})(this);
				},
				getSwf : function(){
					var movieName = "mplayerSwf_" + _cid;
					if (window.document[movieName]) {
						return window.document[movieName];
					}
					if (navigator.appName.indexOf("Microsoft Internet") == -1) {
						if (document.embeds && document.embeds[movieName]){
							return document.embeds[movieName];
						}
					}else {
						return document.getElementById(movieName);
					};
					 
				},
				
				onError : function(){
					percentLoaded = 0;
					playMedia(set.playMode == 2 ? getId() : getNextId());
				 
				},
				onProgressing : function(bytesLoaded, bytesTotal){
					var loaded = Math.round(bytesLoaded / bytesTotal * 100);
					setCachedBar(loaded + "%");
					percentLoaded = loaded;
				},
				onTimeUpdate : function(time){
					playState = "play";
					mp.playedto.text(timeFormat(time));
					var mediaObj = getMediaById(currentId);
					setPlayedBar((time / mediaObj.duration) * 100 + "%"); 
					if(!hasLrc){
						return;
					};
					if(lrcIsDraging === true){
						return;
					};
					var ___cpos = parseInt(time * 1000),
					___currnentlrc = $("#" + _lrcPreFix + "_lrcto_" + (function(){
						if(lrcApp.__lrccache.length === 0){
							return 0;
						};
						var ret = lrcApp.__lrccache[lrcApp.__lrccache.length - 1].time;
						for(var i = 0, l = lrcApp.__lrccache.length; i < l; i++){
							var time = lrcApp.__lrccache[i].time;
							if(___cpos <= time ){
								var index = i === 0 ? 0 : i - 1;
								ret = lrcApp.__lrccache[index].time;
								break;
							};
						};
						return ret;
					})());
					___currnentlrc.addClass("currnetlrc").siblings().removeClass("currnetlrc");
					mp.lrccon.css({
						top : - (___currnentlrc[0] ? ___currnentlrc[0].offsetTop : 0) + 100 + "px" 		  
					});
				},
				onEnded : function(){
					playState = "stop";
					resetLRCStyle();
					setStopEvent();	
					//列表循环
					if(set.playMode == 1){
						playMedia(getNextId());
					}else if(set.playMode == 2){
						//随机播放
						playMedia(getId());
					}else if(set.playMode == 3){
						playMedia(currentId);
					};
				}
				
			};
			SWFMPlayers["CID_" + CID] = SWFMPlayer;
			var _SWFMPlayer = SWFMPlayers["CID_" + _cid];
			
			//从数据列表内获取文件信息		
			function getMediaById(id){
				var i = 0, l = mediaList.length;
				for(; i < l; i++){
					var val = mediaList[i];
					if(val.fid == id){
						return val;
					};
				};
				return null;
			};
			
			//html5的核心事件封装
			function eventListener(_media, _event, _call){
				_media.addEventListener(_event, function(){
					_call();
				}, false);
			};
			
			
			function init(){
				var currentMedia = getMediaById(currentId);
				if(currentMedia !== null){
					if(supportSWF || supportMP3){
						playMedia(currentId, set.autoPlay);
						setVolume(set.volume, true); 
						setPlayMode(set.playMode);
						apiEvent();
						 
					};
				};
			};
			
			//播放器内的dom事件绑定
			function apiEvent(){
				mp.playpausebtn.click(function(){
					setPlayPauseEvent();
					if(supportSWF){
						if(!mp.playpausebtn.hasClass("mp_pausebtn")){
							_SWFMPlayer.pause();
							playState = "pause";
						}else{
							_SWFMPlayer.play();
						};
					}else if(supportMP3){
						if(media.paused){
							media.play();
						}else{
							media.pause();
							playState = "pause";
						};
					};
				});
				mp.stopbtn.click(function(){
					setStopEvent();	
					playState = "stop";		
				});
				mp.playmodecon.find(".mp_playmode").click(function(){
					setPlayMode($(this).attr("__playmode"));
				});
				
				mp.nextbtn.click(function(){
					setStopEvent();	
					playMedia(set.playMode == 2 ? getId() : getNextId());
				});
				
				mp.prevbtn.click(function(){
					setStopEvent();	
					playMedia(set.playMode == 2 ? getId() : getPrevId());
				});
				mp.minvolumebtn.click(function(){
					toggleMuteEvent();						   
				});
				mp.maxvolumebtn.click(function(){
					setMaxVolumeEvent();						   
				});
				mp.volumeprogress.click(function(e){
					e = e || window.event;
					var posEvent = mousePosition(e);
					var postElement = {left : getOffsetLeft(this)};
					var data = {x : posEvent.x - postElement.left};
					var percent = data.x / this.offsetWidth;
					set.volume = percent;
					setVolume(percent);
					if(percent > 0){
						mp.minvolumebtn.removeClass("mp_minvolumed");
					};
				});
				
				mp.progressbar.click(function(e){
					
					if(percentLoaded == 0){
						return;
					};		
					e = e || window.event;
					var posEvent = mousePosition(e);
					var postElement = {left : getOffsetLeft(this)};
					var data = {x : posEvent.x - postElement.left};
					var percent = data.x / this.offsetWidth;
					var mediaObj = getMediaById(currentId);
					var cTime = percent * mediaObj.duration;
					var isToPlay = mp.playpausebtn.hasClass("mp_pausebtn");
					if(supportSWF){
						_SWFMPlayer.playTo(cTime);
						if(!isToPlay){
							_SWFMPlayer.pause();
							_SWFMPlayer.onTimeUpdate(cTime);
						};
					}else if(supportMP3){
						(function(){
							try{
								media.pause();
								media.currentTime = cTime;
								if(isToPlay){
									media.play();
								};
								
							}catch(e){
								setTimeout(arguments.callee, 0);
							};
						})();
					};
					setPlayedBar((percent * 100) + "%");
					mp.playedto.text(timeFormat(percent * mediaObj.duration));
					
				});
			};
			
			//和播放相关的事件绑定
			function mediaEventListener(autoPlay){
				eventListener(media, "timeupdate", function(){
					
					playState = "play";
					var time = media.currentTime;
					mp.playedto.text(timeFormat(time));
					setPlayedBar((time / media.duration) * 100 + "%");
					if(!hasLrc){
						return;
					};
					if(lrcIsDraging === true){
						return;
					};
					var ___cpos = parseInt(media.currentTime * 1000),
					___currnentlrc = $("#" + _lrcPreFix + "_lrcto_" + (function(){
						if(lrcApp.__lrccache.length === 0){
							return 0;
						};
						var ret = lrcApp.__lrccache[lrcApp.__lrccache.length - 1].time;
						for(var i = 0, l = lrcApp.__lrccache.length; i < l; i++){
							var time = lrcApp.__lrccache[i].time;
							if(___cpos <= time ){
								var index = i === 0 ? 0 : i - 1;
								ret = lrcApp.__lrccache[index].time;
								break;
							};
						};
						return ret;
					})());
					___currnentlrc.addClass("currnetlrc").siblings().removeClass("currnetlrc");
					mp.lrccon.css({
						top : - (___currnentlrc[0] ? ___currnentlrc[0].offsetTop : 0) + 100 + "px" 		  
					});
				});
				eventListener(media, "ended", function(){
					playState = "stop";
					resetLRCStyle();
					setStopEvent();	
					//列表循环
					if(set.playMode == 1){
						playMedia(getNextId());
					}else if(set.playMode == 2){
						//随机播放
						playMedia(getId());
					}else if(set.playMode == 3){
						playMedia(currentId);
					}
				});
				eventListener(media, "progress", function(){
					if (media.buffered != null && media.buffered.length) {
						var loaded = Math.round(media.buffered.end(0) / media.duration * 100);
						setCachedBar(loaded + "%");
						percentLoaded = loaded;
					};
				});
				eventListener(media, "canplaythrough", function(){
					setCachedBar("100%");
					percentLoaded = 100; 
				});
				 
			};
		
			
			function resetLRCStyle(){
				mp.lrccon.css({position : "static", top : 100 + "px"});
			};
			
			//重置显示时间的状态
			function resetTimeBar(){
				mp.playedto.text("00:00");
				mp.timelength.text("00:00");
			};
			
			//设置播放和暂停事件后的样式
			function setPlayPauseEvent(){
				var btn = mp.playpausebtn;
				if(!btn.hasClass("mp_pausebtn")){
					btn.addClass("mp_pausebtn").removeClass("mp_playbtn");
				}else{
					btn.addClass("mp_playbtn").removeClass("mp_pausebtn");
				};
			};
			
			//设置停止播放事件
			function setStopEvent(){
				var stopBtn = mp.stopbtn, playPauseBtn = mp.playpausebtn;
				playPauseBtn.addClass("mp_playbtn").removeClass("mp_pausebtn");
				mp.playedto.text("00:00");
				setPlayedBar(0);
				if(supportSWF){
					_SWFMPlayer.stop();
					
				}else if(supportMP3){
					if(media != null){
						media.pause();
						(function(){
							try{
								media.currentTime = 0;
							}catch(e){
								setTimeout(arguments.callee, 0);
							}
						})();
					};
				};
				
			};
			
			//设置音量
			function setVolume(val, isInit){
				isInit = typeof(isInit) == "undefined" ? false : isInit;
				mp.currentvolumebar.css({width : val * 100 + "%"});
				if(supportSWF){
					if(!isInit){
						_SWFMPlayer.setVolume(val);
					};
				}else if(supportMP3){
					(function(){
						try{
							media.volume = val;
						}catch(e){
							setTimeout(arguments.callee, 0);
						};
					})();
				};
				
			};
			
			//静音模式的切换
			function toggleMuteEvent(){
				//如果当前是已静音状态
				if(mp.minvolumebtn.hasClass("mp_minvolumed")){
					mp.minvolumebtn.removeClass("mp_minvolumed");
					setVolume(set.volume);
				}else{
					mp.minvolumebtn.addClass("mp_minvolumed");
					setVolume(0);
				};
			};
			
			//设置播放模式， 修改相应的显示样式
			function setPlayMode(mode){
				set.playMode = mode;
				var modeBtn = (function(){
					var b = null;
					if(mode == 1){
						b = mp.playmodebtn1;
					}else if(mode == 2){
						b = mp.playmodebtn2;
					}else if(mode == 3){
						b = mp.playmodebtn3;
					};
					return b;
				})();
				if(modeBtn != null){
					if(mode == 1){
						modeBtn.addClass("mp_playmode_mode1_selected").siblings().removeClass("mp_playmode_mode2_selected").removeClass("mp_playmode_mode3_selected");
					}else if(mode == 2){
						modeBtn.addClass("mp_playmode_mode2_selected").siblings().removeClass("mp_playmode_mode1_selected").removeClass("mp_playmode_mode3_selected");
					}else if(mode == 3){
						modeBtn.addClass("mp_playmode_mode3_selected").siblings().removeClass("mp_playmode_mode1_selected").removeClass("mp_playmode_mode2_selected");
					};
					
				};
			};
			
			//音量最大化的样式
			function setMaxVolumeEvent(){
				setVolume(1);
				set.volume = 1;
				mp.minvolumebtn.removeClass("mp_minvolumed");
			};
			
			//获取html5音频播放器
			function getAudioHtml(mediaObj, autoPlay){
				var html = "<audio controls='controls' src='<!--{src}-->' <!--{autoPlay}--> type='<!--{type}-->'></audio>";
				html = html.replace(/<!--{src}-->/g, (supportMP3 ? mediaObj.mp3_src : (supportOGG ? mediaObj.ogg_src : ""))).
				replace(/<!--{type}-->/g, supportMP3 ? "audio/mpeg" : (supportOGG ? "audio/ogg" : "")).
				replace(/<!--{autoPlay}-->/g, autoPlay ? " autoplay='autoplay' " : " ");
				return html;
			};
			
			//获取flash播放器
			function getSWFHtml(mediaObj, autoPlay){
				var html = "<object type='application/x-shockwave-flash' data='<!--{swfURL}-->' width='1'  height='1' id='mplayerSwf_" + _cid + "'>" +
						"<param name='movie' value='<!--{swfURL}-->'/>"  +
						"<param name='allowScriptAccess' value='always' />"  +	
						"<param name='allowFullScreen' value='true' />"  +
						"<param name='FlashVars' value='volume=" + set.volume + "&inserfaceNamespace=" + "SWFMPlayers.CID_" + _cid + 
						"&autoPlay=<!--{autoPlay}-->&initURL=<!--{src}-->' />"  +
				"</object>";
				html = html.replace(/<!--{src}-->/g, mediaObj.mp3_src).
				replace(/<!--{swfURL}-->/g, set.swfURL).
				replace(/<!--{autoPlay}-->/g, autoPlay ? "true" : "false");
				return html;
			};
			
			//根据id获取所在页(从1开始)
			function getPageById(mid){
				mid = !isNaN(parseInt(mid)) ? parseInt(mid) : 0;
				var DATALIST = arrayChunk(set.fileLists, set.pagecfg.listoffset);
				var i = 0, l = DATALIST.length;
				for(; i < l; i++){
					var arr = DATALIST[i];
					var j = 0, jl = arr.length;
					for(; j < jl; j++){
						var obj = arr[j];
						if(parseInt(obj.fid) === mid){
							return i + 1;
						};
					};
				};
				return 0;
			};
			 
			//初始化播放列表事件 
			function initmusiclistevent(){
				mp.playlistcon.find("li").each(function(){
					var t = $(this);
					var _link = t.find(".musicitemlink");
					_link.click(function(){
						setStopEvent();	
						playMedia(parseInt($(this).attr("mid")));
					});	
				});
				
			};
			
			//播放文件
			function playMedia(id, autoPlay){
				percentLoaded = 0;
				resetLRCStyle();
				resetTimeBar();
				setCachedBar(0);
				setPlayedBar(0);
				currentId = id;
				autoPlay = typeof(autoPlay) == "undefined" ? true : autoPlay;
				var mediaObj = getMediaById(id);
				mp.titlebar.text(mediaObj.title);
				mp.timelength.text(timeFormat(mediaObj.duration));
				if(mediaObj.lrc != ""){
					lrcApp.init(mediaObj.lrc, function(){
						mp.lrccon.html("<p style='display:block;' class=\"loadinglrc\">正在加载歌词......</p>");
					}, function(html){ 
						mp.lrccon.html(html).css({position : "absolute"});
						 
						__play();
					}, _lrcPreFix);
					hasLrc = true;
				}else{
					mp.lrccon.html("<p style='display:block;' class=\"loadinglrc\">未找到歌词</p>");
					__play();
					hasLrc = false;
				};
				function __play(){
					
					setStopEvent(); 
					var playerHTML = supportSWF ? getSWFHtml(mediaObj, autoPlay) : (supportMP3 ? getAudioHtml(mediaObj, autoPlay) : "") ;
					if(supportSWF){
						if(!SWFCreated){
							mp.audiocon.html(playerHTML);
							SWFCreated = true;
						}else{
							_SWFMPlayer.setURL(mediaObj.mp3_src);
						};
						if(autoPlay){
							setPlayPauseEvent();
						};
					}else if(supportMP3){
						mp.audiocon.html(playerHTML);
						media = t.find("audio")[0];
						mediaEventListener();
						if(!browser.versions.ios){
							if(autoPlay){
								setPlayPauseEvent();
								media.play();
							};
						};
					};
					
					if(mp.minvolumebtn.hasClass("mp_minvolumed")){
						setVolume(0);
					}else{
						setVolume(set.volume); 
					}
					
				};
				
				mp.playlistcon.pagebar({
					data : set.fileLists,
					page : getPageById(currentId),
					offset : set.pagecfg.listoffset,
					pagebar : ".mp_page",
					container : ".mp_list",	
					//页码格式
					numType : [1, 1], 
					//返回分页列表的html
					getListHtml : function(data){ 
						var ret = "";
						if(data.length > 0){
							ret += "<ul>";
							$.each(data, function(i, v){
								var focusClass = v.fid == currentId ? " class='current' " : "";
								ret += "<li " + focusClass + " id='" + _lrcPreFix + "_item_" + v.fid + "'>";
								ret += "<p class=\"mitem_l\">";
								ret += "<a hidefocus='true' class='musicitemlink' href=\"###\" onclick=\"return false;\" mid=\""+ v.fid +"\" title=\""+ v.title +"\">" + v.title + "</a>"
								ret += "</p>";
								ret += "<p style='display : none' class=\"mitem_r\">";
								ret += "<a hidefocus='true' href=\"###\" mid=\""+ v.fid +"\" onclick=\"return false;\">删除</a>";
								ret += "</p>";
								ret += "</li>";
							});
							ret += "</ul>";
						};
						return ret;
					},
					
					//分页列表的html渲染后的回调函数
					onListRenderd :  function(listCon, data){ 
						initmusiclistevent();
					}
				});
				
			
			};
			
			//设置缓冲进度条
			function setCachedBar(percent){
				mp.cachedbar.css({width : percent});
			};
			//设置已播放进度条
			function setPlayedBar(percent){
				mp.playedbar.css({width : percent});
			};
			
			//获取前一条
			function getPrevId(){
				var cIndex = getIndexById(currentId);
				var len = mediaList.length;
				var ret = 0;
				if(cIndex > 0){
					ret = mediaList[cIndex - 1].fid;
				}else{
					ret = mediaList[len - 1].fid;
				};
				return ret;		
			};
			
			//获取后一条
			function getNextId(){
				var cIndex = getIndexById(currentId);
				var len = mediaList.length;
				var ret = 0;
				if(cIndex + 1 >= len){
					ret = mediaList[0].fid;
				}else{
					ret = mediaList[cIndex + 1].fid;
				};
				return ret;
			};
			
			//随机获取一条
			function getId(){
				var len = mediaList.length;
				var index = Math.floor(Math.random() * len); 
				return mediaList[index].fid;
			};
			
			//根据id获取所在索引
			function getIndexById(id){
				var i = 0, l = mediaList.length;
				for(; i < l; i++){
					if(mediaList[i].fid == id){
						return i;
					}
				};
				return -1;
			};
			
			init();
			
		});
		
	};
	window["SWFMPlayers"] = SWFMPlayers;
})(jQuery);
