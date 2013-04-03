var Media = function(data) {
    this.id = data.id;
    this.type = data.type;

    switch(this.type) {
        case "yt":
            this.initYouTube();
            break;
        case "vi":
            this.initVimeo();
            break;
        case "dm":
            this.initDailymotion();
            break;
        case "sc":
            this.initSoundcloud();
            break;
        case "li":
            this.initLivestream();
            break;
        case "tw":
            this.initTwitch();
            break;
        default:
            break;
    }
}

Media.prototype.initYouTube = function() {
    this.removeOld();
    this.player = new YT.Player("ytapiplayer", {
        height: VHEIGHT,
        width: VWIDTH,
        videoId: this.id,
        playerVars: {
            "autoplay": 1,
            "controls": 1,
        },
        events: {
            onPlayerReady: function() {
                socket.emit("playerReady");
            }
        }
    });

    this.load = function(data) {
        this.player.loadVideoById(data.id, data.currentTime);
        this.id = data.id;
    }

    this.pause = function() {
        this.player.pauseVideo();
    }

    this.play = function() {
        this.player.playVideo();
    }

    this.getTime = function(callback) {
        callback(this.player.getCurrentTime());
    }

    this.seek = function(time) {
        this.player.seekTo(time, true);
    }
}

Media.prototype.initVimeo = function() {
    
    var iframe = $("<iframe/>").insertBefore($("#ytapiplayer"));
    $("#ytapiplayer").remove();
    iframe.attr("id", "ytapiplayer");
    iframe.attr("width", VWIDTH);
    iframe.attr("height", VHEIGHT);
    iframe.attr("src", "http://player.vimeo.com/video/"+this.id+"?api=1&player_id=ytapiplayer");
    iframe.attr("webkitAllowFullScreen", "");
    iframe.attr("mozallowfullscreen", "");
    iframe.attr("allowFullScreen", "");
    iframe.css("border", "none");
    
    this.player = $f(iframe[0]);
    $f(iframe[0]).addEvent("ready", function() {
        this.player = $f(iframe[0]);
        this.play();
    }.bind(this));

    this.load = function(data) {
        this.id = data.id;
        this.initVimeo();
    }

    this.pause = function() {
        this.player.api("pause");
    }

    this.play = function() {
        this.player.api("play");
    }

    this.getTime = function(callback) {
        this.player.api("getCurrentTime", callback);
    }

    this.seek = function(time) {
        this.player.api("seekTo", time);
    }
}

Media.prototype.initDailymotion = function() {
    this.removeOld();
    this.player = DM.player("ytapiplayer", {
        video: this.id,
        width: parseInt(VWIDTH),
        height: parseInt(VHEIGHT),
        params: {autoplay: 1}
    });

    this.load = function(data) {
        this.id = data.id;
        this.player.api("load", data.id);
    }

    this.pause = function() {
        this.player.api("pause");
    }

    this.play = function() {
        this.player.api("play");
    }

    this.getTime = function(callback) {
        callback(this.player.currentTime);
    }

    this.seek = function(seconds) {
        this.player.api("seek", seconds);
    }
}

Media.prototype.initSoundcloud = function() {
    unfixSoundcloudShit();
    var iframe = $("<iframe/>").insertBefore($("#ytapiplayer"));
    $("#ytapiplayer").remove();

    iframe.attr("id", "ytapiplayer");
    iframe.attr("src", "https://w.soundcloud.com/player/?url=" + this.id);
    iframe.css("width", "100%").attr("height", "166");
    iframe.css("border", "none");

    this.player = SC.Widget("ytapiplayer");
    setTimeout(function() { this.play(); }.bind(this), 1000);

    this.load = function(data) {
        this.id = data.id;
        this.player.load(data.id, {auto_play: true});
    }

    this.pause = function() {
        this.player.pause();
    }

    this.play = function() {
        this.player.play();
    }

    this.getTime = function(callback) {
        this.player.getPosition(function(pos) {
            callback(pos / 1000);
        });
    }

    this.seek = function(seconds) {
        this.player.seekTo(seconds * 1000);
    }
}

Media.prototype.initLivestream = function() {
    this.removeOld();
    var flashvars = {channel: this.id};
    var params = {AllowScriptAccess: "always"};
    swfobject.embedSWF("http://cdn.livestream.com/chromelessPlayer/v20/playerapi.swf", "ytapiplayer", VWIDTH, VHEIGHT, "9.0.0", "expressInstall.swf", flashvars, params);

    this.load = function(data) {
        this.id = data.id;
        this.initLivestream();
    }

    this.pause = function() { }
    
    this.play = function() { }

    this.getTime = function() { }

    this.seek = function() { }
}

Media.prototype.initTwitch = function() {
    this.removeOld();
    var url = "http://www.twitch.tv/widgets/live_embed_player.swf?channel="+this.id;
    var params = {
        allowFullScreen:"true",
        allowScriptAccess:"always",
        allowNetworking:"all",
        movie:"http://www.twitch.tv/widgets/live_embed_player.swf",
        id: "live_embed_player_flash",
        flashvars:"hostname=www.twitch.tv&channel="+this.id+"&auto_play=true&start_volume=100"
    };
    swfobject.embedSWF( url, "ytapiplayer", VWIDTH, VHEIGHT, "8", null, null, params, {} );

    this.load = function(data) {
        this.id = data.id;
        this.initTwitch();
    }

    this.pause = function() { }
    
    this.play = function() { }

    this.getTime = function() { }

    this.seek = function() { }
}

Media.prototype.update = function(data) {
    if(data.id != this.id) {
        this.load(data);
    }
    if(data.paused) {
        this.pause();
    }
    this.getTime(function(seconds) {
        if(Math.abs(data.currentTime - seconds) > SYNC_THRESHOLD) {
            this.seek(data.currentTime);
        }
    }.bind(this));
}

Media.prototype.removeOld = function() {
    var old = $("#ytapiplayer");
    var placeholder = $("<div/>").insertBefore(old);
    old.remove();
    placeholder.attr("id", "ytapiplayer");
}