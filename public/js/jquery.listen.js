//监听创建笔记
$("body").on("click", '.create-note', function(){
    if($(".dir-warp .curr").length > 0){
        var dir_id = $('.curr').data('id');
        var group_id = $('.curr').attr('group-id');
    }else{
        var dir_id = $('.dir-warp .li-dir:first-child').data('id');
    }
    create_note(dir_id,group_id);
});

//监听创建目录
$("body").on("click", '.create-dir', function(){
    if($(".dir-warp .curr").length > 0){
        var parent_id = $('.dir-warp .curr').data('id');
        var group_id = $('.dir-warp .curr').attr('group-id');
        var class_id = parseInt($('.dir-warp .curr').attr('class-id')) + 1;
    }else{
        var parent_id = 0;
        var class_id = 1;
        var group_id = 0;
    }

    create_dir(parent_id,class_id,group_id);
})

//监听打开笔记
$("body").on("click", '.li-note', function(){
    $('.li-note.curr').removeClass('curr');
    var rec_id = $(this).data('id');
    $(".li-note[data-id="+rec_id+"]").addClass('curr');
    show_note();
});

var clickTime ; //取消双击时触发单机事件
//监听打开目录
$("body").on("click", '.li-dir', function(){
    $('.search-input').val('');
    hide_dropdown_menu();
    var clickObj = $(this);
    var dir_id = clickObj.data('id');
    var group_id = clickObj.attr('group-id');
    if(clickObj.hasClass('curr')) return false;
    if(clickObj.hasClass('li-trash')) return false;
    if(clickObj.parent().hasClass('ui-sortable-helper')) return false;//拖放排序时取消单击事件
    clearTimeout(clickTime);
    clickTime = setTimeout(function() {
        $('.dir-warp .curr').removeClass('curr');
        if(dir_id < 0){
            clickObj.addClass('curr');
        }else{
            var curObj = $(".dir-warp .li-dir[data-id="+dir_id+"][group-id="+group_id+"]");
            var downBtn = curObj.parent('li').parent('ul').prev('div').children('.down-btn');
            curObj.addClass('curr');
            curObj.parents('ul').slideDown('fast');
            if(!downBtn.hasClass('pack-up')) downBtn.addClass('pack-up');
        }
        get_item_list();
        show_note();
    },10);
});

//双击目录同样触发下单事件
$("body").on("dblclick", '.li-dir', function(){
    clearTimeout(clickTime);
  //  open_dir($(this).children('.down-btn'));
    return false;
});

//监听目录下拉事件
$("body").on("click", '.drop-down', function(){
    open_dir($(this));
    return false;
});

$("body").on("blur", '.note-detail', function(e){
    var content = $('#wangDemo').html();
    if($.md5(content) == $('#wangDemo').attr('precontent')) return false;
    save_note(false); //false自动保存，不要弹框提示
});

//保存笔记，调用保存方法
$("body").on("click", '.save', function(){
    var name = $('.note-name').val();
    if(name == '') alert('标题不能为空');
    save_note(true);//true手动保存，需弹框提示
});

//笔记标题改变时同步中间的笔记名
$('.title-wrap .note-name').bind('input propertychange', function() {
    $('.li-note.curr .name').text($(this).val());
});

$("body").on("blur", '.title-wrap .note-name', function(e){
    var name = $.trim($('.title-wrap .note-name').val());
    var rec_id = $('.title-wrap').attr('data-id');
    var group_id = $('.title-wrap').attr('group-id');
    var prename = $('.title-wrap').attr('prevalue');
    if(name == prename) return false;
    ajax_update_name('/dir/update_note_name',name,rec_id,prename,group_id);
});

//点击搜索图标
$("body").on("click", '.search-icon', function(){
    $('.search-input').attr('search',1);
    get_item_list();
});
//回车搜索
$("body").on("keydown", '.search-input', function(e){
    if(e.which == 13){
        $('.search-input').attr('search',1);
        get_item_list();
    }
});
//点击弹出的消息时
$("body").on("click", '.hint-container', function(){
    $(this).slideUp('fast').remove();
});
//回到上一级
$("body").on("click", '.item-back', function(){
    if($(this).hasClass('disabled')) return false;
    var curObj = $('.dir-warp .curr');
    var parObj = curObj.parent('li').parent('ul').prev('div');
    var dir_id = curObj.data('id');
    var group_id = curObj.attr('group-id');

    curObj.removeClass('curr');
    parObj.addClass('curr');

    curObj.parents('ul').slideDown('fast').prev('div').children('.down-btn').addClass('pack-up');
    get_item_list();
    show_note();
});

//item设置
$("body").on("click", '.setting-icon', function(){
    hide_dropdown_menu('setting');
    if($('.item-setting').hasClass('disabled')) return false;
    if($('.setting-menu').is(":hidden")){
        $('.setting-menu').show();
    }else{
        $('.setting-menu').hide();
    }
    return false;
});

$("body").on("click", '.setting-sel', function(){
    $('.setting-sel').removeClass('selected');
    $('.item-note .no-item').remove();
    $(this).addClass('selected');
    $.cookie('setting_value',$(this).data('value'));
    get_item_list();
    show_note();
});

$("body").on("click", '.setting-sort', function(){
    if($(this).hasClass('desc')){
        var order_by = 'asc';
        $('.setting-sort').removeClass('selected desc asc');
        $(this).addClass(order_by+' selected');
    }else if($(this).hasClass('asc')){
        var order_by = 'desc';
        $('.setting-sort').removeClass('selected desc asc');
        $(this).addClass(order_by+' selected');
    }else{
        var order_by = 'desc';
        $('.setting-sort').removeClass('selected desc asc');
        $(this).addClass(order_by+' selected');
    }
    $.cookie('setting_col',$(this).data('col'));
    $.cookie('setting_sort',order_by);
    get_item_list();
    show_note();
});

$("body").on("click", '.update-user-info', function(){
    var user_name = $.trim($('.f-user-name').val());
    if(user_name == ''){
        prompt_msg('error','昵称不能为空');
        return false;
    }
    update_user_info();
});


//浏览器大小改变的同时改变编辑器的高度
window.onresize = function(){
    get_wangDemo_height();
    change_scroller_height($('.dir-warp .scroller-container'));
    change_scroller_height($('.item-wrap .scroller-container'));
}


//关闭或者刷新浏览器时触发
window.onbeforeunload = function(){
    if($('.dir-warp .li-dir.curr').length > 0){
        var dir_id = $('.dir-warp .li-dir.curr').data('id');
        var group_id = $('.dir-warp .li-dir.curr').attr('group-id');
    }else{
        var dir_id = 0;
        var group_id = 0;
    }
    $.cookie('currDir', dir_id , { path : '/' });
    $.cookie('currGroup', group_id , { path : '/' });

    if($('.item-note .li-note.curr').length > 0){
        var rec_id = $('.item-note .li-note.curr').data('id');
    }else{
        var rec_id = 0;
    }
    $.cookie('currNote', rec_id , { path : '/' });
}

$("body").on("click", '.user-avatar', function(){
    var html ='<div class="dialog-mask"></div>'+
        '<div class="dialog-warp user-info-dialog">'+
        '<div class="dialog-header"><h4>修改头像</h4><span class="dialog-close" title="关闭">×</span></div>'+
        '<div class="dialog-body"><div class="avatar-upload">'+
        '<div class="upload-warp">上传新头像</div>'+
        '<div class="upload-hint">支持JPG、PNG、GIF格式，小于2MB</div>'+
        '<input type="file" id="avatar" name="avatar" /></div>'+
        '<div id="div-avatar"><div id="picture-original"><img src="" /></div><div id="picture-120"></div>'+
        '<input type="hidden" id="x1" name="x1" value="0" />'+
        '<input type="hidden" id="y1" name="y1" value="0" />'+
        '<input type="hidden" id="cw" name="cw" value="0" />'+
        '<input type="hidden" id="ch" name="ch" value="0" />'+
        '<input type="hidden" id="imgsrc" name="imgsrc" />'+
        '<div class="upload-btn bottom-btn"><div class="dialog-close">取消</div><div class="dialog-btn-yes" id="btnCrop">保存</div></div>'+
        '</div></div></div>';
    $('body').append(html);
    ele_draggable();
});

$("body").on("click", '.user-name', function(){
    var mydate = new Date();
    var year = parseInt(mydate.getFullYear()) - 10;
    var minyear = parseInt(year) - 60;
    var data = get_user_info();
    var html ='<div class="dialog-mask"></div>'+
        '<div class="dialog-warp user-info-dialog">'+
        '<div class="dialog-header"><h4>个人信息</h4><span class="dialog-close" title="关闭">×</span></div>'+
        '<div class="dialog-body">'+
        '<div class="user-info-item"><span class="item-key">昵称</span><span class="item-value"><input class="input-text f-user-name" value="'+data.user_name+'" /></span></div>'+
        '<div class="user-info-item"><span class="item-key">性别</span><span class="item-value">' +
        '<input class="input-radio f-sex" name="radio-sex" value="1" type="radio" /><label>男</label>' +
        '<input class="input-radio f-sex" name="radio-sex" value="2" type="radio" /><label>女</label>' +
        '<input class="input-radio f-sex" name="radio-sex" value="0" type="radio" /><label>保密</label></span></div>'+
        '<div class="user-info-item"><span class="item-key">生日</span><span class="item-value"><select class="user-year"><option value="0">选择年份</option>';
    for(year ; year > minyear ; year--){
        html += '<option value="'+year+'">'+year+'年</option>';
    }
    html += '</select><select class="user-moon"><option value="0">选择月份</option>';
    for(var m=1 ; m <= 12 ; m++){
        html += '<option value="'+m+'">'+m+'月</option>';
    }
    html += '</select></span></div>'+
    '<div class="user-info-item"><span class="item-key sign">签名</span><span class="item-value"><textarea class="f-sign">'+data.sign+'</textarea></span></div>'+
    '<div class="user-info-btn bottom-btn"><div class="dialog-close">取消</div><div class="dialog-btn-yes update-user-info">保存</div></div>'+
    '</div></div></div>';
    $('body').append(html);
    $('.input-radio[value='+data.sex+']').attr("checked","checked");
    $('.user-year option[value='+data.year+']').attr("selected",true);
    $('.user-moon option[value='+data.moon+']').attr("selected",true);
    ele_draggable();
});