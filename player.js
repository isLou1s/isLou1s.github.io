var song="";
var app = new Vue({
    el: "#UI",
    data: {
        name: "",
        list: [],
        comment_list:[],
        playurl: "",
        imageurl: "",
        a:[]
    },
    methods: {
        searchclick: function () {
            console.log(this.name);
            var that = this;
            $.ajax({
                type: "get",
                dataType: "json",
                xhrFields: {withCredentials: true},
                url: "https://autumnfish.cn/search?keywords=" + that.name,
                success: function (da) {
                    that.list = [];
                    for (let i = 0; i < 10; ++i) {
                        var item = [];
                        item.push(da.result.songs[i].id);
                        item.push(da.result.songs[i].name);
                        item.push(da.result.songs[i].artists[0].name);
                        that.list.push(item);
                    }

                },
                error: function () {
                    console.log("ERROR");
                }
            });
        },
        playclick: function (index) {
            console.log(this.list[index][0]);
            var that = this;
            $.ajax({
                type: "get",
                dataType: "json",
                xhrFields: {withCredentials: true},
                url: "https://autumnfish.cn/song/url?id=" + that.list[index][0],
                success: function (da) {
                    that.playurl = da.data[0].url;
                },
                error: function () {
                    console.log("ERROR");
                }
            });
            $.ajax({
                type: "get",
                dataType: "json",
                xhrFields: {withCredentials: true},
                url: "https://autumnfish.cn/song/detail?ids=" + that.list[index][0],
                success: function (da) {

                    that.imageurl = da.songs[0].al.picUrl;
                },
                error: function () {
                    console.log("ERROR");
                }
            });
            $.ajax({
                type: "get",
                dataType: "json",
                xhrFields: {withCredentials: true},
                url: "https://autumnfish.cn/comment/hot?type=0&id=" + that.list[index][0],
                success: function (da) {
                    that.comment_list=[];
                    for(let i=0;i<50;++i){
                        var item=[];
                        item.push(da.hotComments[i].user.avatarUrl);
                        item.push(da.hotComments[i].user.nickname);
                        item.push(da.hotComments[i].content);
                        that.comment_list.push(item);
                    }
                },
                error: function () {
                    console.log("ERROR");
                }
            });
            $.ajax({
                type: "get",
                dataType: "json",
                xhrFields: {withCredentials: true},
                url: "https://autumnfish.cn/lyric?id=" + that.list[index][0],
                success: function (da) {

                    song=da.lrc.lyric;

                },
                error: function () {
                    console.log("ERROR");
                }
            });
        },
        play: function () {
            $("#image").css("animation-play-state", "running");
            this.a.a=setInterval(lrcDisplay, 100);
        },
        pause: function () {
            $("#image").css("animation-play-state", "paused");
            console.log(this.a.a);
            clearInterval(this.a.a);
        }

    }
})
function lrcDisplay(){
    var audio = document.getElementById("audio");
    //获取播放进度(转换的格式为: 00:00)
    var minute = parseInt(audio.currentTime / 60);//分钟
    minute = minute == 0 ? "00" : (minute + "").length < 2 ? "0" + minute : minute;
    //获取秒数
    var second = (parseInt(audio.currentTime)) % 60;
    second = second == 0 ? "00" : (second + "").length < 2 ? "0" + second : second;
    var n=song.match(new RegExp("\\["+minute+":"+second+".[0-9]+](.*?)"+"\\n",'g'));
    if(n!=null) {
        var temp = "";
        for (let item in n) {
            var str = n[item].substring(11);
            temp =temp+str + "<br/>";
        }
        console.log(temp);
        $("#songtext").html(temp);
        console.log(minute, second);
    }
}

