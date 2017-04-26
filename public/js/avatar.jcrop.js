$(function () {

    function getFileSize(fileName) {
        var byteSize = 0;
        //console.log($("#" + fileName).val());
        if($("#" + fileName)[0].files) {
            var byteSize  = $("#" + fileName)[0].files[0].size;
        }
        byteSize = Math.ceil(byteSize / 1024); //KB
        return byteSize ;
    }
    $("body").on("change", '#avatar', function(){
        var allowImgageType = ['jpg', 'jpeg', 'png', 'gif'];
        var file = $("#avatar").val();
        //获取大小
        var byteSize = getFileSize('avatar');
        //获取后缀
        if (file.length > 0) {
            if(byteSize > 2048) {
                alert("上传的附件文件不能超过2M");
                return;
            }
            var pos = file.lastIndexOf(".");
            //截取点之后的字符串
            var ext = file.substring(pos + 1).toLowerCase();
            if($.inArray(ext, allowImgageType) != -1) {
                ajaxFileUpload();
            }else {
                alert("请选择jpg,jpeg,png,gif类型的图片");
            }
        }
        else {
            alert("请选择jpg,jpeg,png,gif类型的图片");
        }
    });
    function ajaxFileUpload() {
        $.ajaxFileUpload({
            url: '/user/avatar_upload', //用于文件上传的服务器端请求地址
            secureuri: false, //一般设置为false
            fileElementId: 'avatar', //文件上传空间的id属性  <input type="file" id="file" name="file" />
            dataType: 'json', //返回值类型 一般设置为json
            success: function (resObj, status)  //服务器成功响应处理函数
            {
                if(resObj.status == 'error'){
                    prompt_msg('error',resObj.msg);
                    return false;
                }
                var data = resObj.result;
                $("#picture-original>img").attr({src: data.src, width: data.width, height: data.height});
                $('#imgsrc').val(data.path);

                //同时启动裁剪操作，触发裁剪框显示，让用户选择图片区域
                var cutter = new jQuery.UtrialAvatarCutter({
                        //主图片所在容器ID
                        content : "picture-original",
                        //缩略图配置,ID:所在容器ID;width,height:缩略图大小
                        purviews : [{id:"picture-120",width:120,height:120}],
                        //选择器默认大小
                        selector : {width:200,height:200},
                        showCoords : function(c) { //当裁剪框变动时，将左上角相对图片的X坐标与Y坐标 宽度以及高度
                            $("#x1").val(c.x);
                            $("#y1").val(c.y);
                            $("#cw").val(c.w);
                            $("#ch").val(c.h);
                        },
                        cropattrs : {boxWidth: 200, boxHeight: 200}
                    }
                );
                cutter.reload(data.src);
                $('#div-avatar').show();
            },
            error: function (data, status, e)//服务器响应失败处理函数
            {
                alert(e);
            }
        })
        return false;
    }

    $("body").on("click", '#btnCrop', function(){
        if($('#picture-original img').attr('src') == ''){
            prompt_msg('error','请先上传图片');
            return false;
        }
        $.getJSON('/user/avatar_crop', {x: $('#x1').val(), y: $('#y1').val(), w: $('#cw').val(), h: $('#ch').val(), src: $('#imgsrc').val()}, function(data) {
            prompt_msg(data.status,data.msg);
            if(data.status == 'succ'){
                $('.user-warp .user-avatar').attr('src',data.result);
                $(".dialog-close").trigger("click");
            }
        });
        return false;
    });
});
