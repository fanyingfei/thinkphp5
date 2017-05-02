//监听鼠标右键点击
var RightObj;
$("body").on("contextmenu", '.rightbtn', function(e){
    get_menu_html($(this) , e);
    return false;
})
$("body").on("contextmenu", '.my-dir-list', function(e){
    get_menu_html($(this) , e);
    return false;
})
$("body").on("contextmenu", '.my-group-list', function(e){
    get_menu_html($(this) , e);
    return false;
})
$("body").on("contextmenu", 'li .li-group', function(e){
    get_menu_html($(this) , e);
    return false;
})
//清空回收站
$("body").on("contextmenu", '.sidebar-trash', function(e){
    get_menu_html($(this) , e);
    return false;
})
//监听右键按钮点击
$("body").on("click", '.right-menu', function(e){
    get_menu_html($(this).parent(),e);
    return false;
})
//阻双击冒泡事件
$("body").on("dblclick", '.right-menu', function(e){
    return false;
})
//右键的创建目录
$("body").on("click", '.right-create-dir', function(){
    var parent_id = $('.dir-right-menu').data('id');
    var class_id = parseInt($('.dir-right-menu').attr('class-id')) + 1;
    var group_id = $('.dir-right-menu').attr('group-id');
    hide_dropdown_menu();
    create_dir(parent_id,class_id,group_id);
})
//右键的创建笔记
$("body").on("click", '.right-create-note', function(){
    var parent_id = $('.dir-right-menu').data('id');
    var group_id = $('.dir-right-menu').attr('group-id');
    hide_dropdown_menu();
    create_note(parent_id , group_id)
})

$("body").on("click", '.set-manage', function(){
    var dir_id = $('.dir-right-menu').data('id');
    var group_id = $('.dir-right-menu').attr('group-id');
    var manage = $(this).attr('manage');
    var curObj = $(".dir-warp .li-dir[data-id="+dir_id+"][group-id="+group_id+"]");
    var list = get_dir_list(curObj);
    list.push(dir_id);
    $.each(list, function(key, v){
        $(".dir-warp .li-dir[data-id="+v+"][group-id="+group_id+"]").attr('private',manage);
    })
    set_dir_manage(list,group_id,manage);
    hide_dropdown_menu();
});

//右键的创建协作
$("body").on("click", '.create-group', function(){
    hide_dropdown_menu();
    create_group();
})
//点击其他隐藏右键菜单
$('body').click(function(){
    hide_dropdown_menu();
})
$('body').contextmenu(function(){
    hide_dropdown_menu();
})
//阻击冒泡事件
$("body").on("click", '.dir-right-menu', function(e){
    e.stopPropagation();
});
//上移
$("body").on("click", '.move-up', function(){
    move_up_down('up');
});
//下移
$("body").on("click", '.move-down', function(){
    move_up_down('down');
});
//邀请协作
$("body").on("click", '.invite-group', function(){
    var type = $('.dir-right-menu').attr('dirNote');
    var groupId = $('.dir-right-menu').attr('group-id');
    hide_dropdown_menu();
    if(!(type == 'group' && groupId > 0)) return false;
    var html = '<div class="dialog-mask"></div><div class="invite-group-warp dialog-warp" group-id="'+groupId+'">' +
        '<div class="dialog-header"><h4>邀请协作</h4><span class="dialog-close" title="关闭">×</span></div>' +
        '<div class="dialog-body"><p class="dialog-prompt">请输入要邀请的账号，暂仅支持手机号邀请（请慎重邀请）</p><input class="invite-input" placeholder="">' +
        '<button class="invite-btn">邀请</button><div class="invite-prompt"><span class="icon-hint"></span><span class="invite-msg"></span></div></div></div>';
    $('body').append(html);
    ele_draggable();
});
$("body").on("click", '.history-log', function(){
    var group_id = $('.dir-right-menu').attr('group-id');
    hide_dropdown_menu();
    get_group_log(group_id);
});
$("body").on("click", '.dialog-close', function(){
    $('.dialog-mask').slideUp('fast').remove();
    $('.dialog-warp').slideUp('fast').remove();
});
$("body").on("click", '.zoom-out', function(){
    if($('.invite-item').is(":hidden")) $('.invite-item').slideDown('fast');
});
$("body").on("click", '.zoom-in', function(){
    if(!$('.invite-item').is(":hidden")) $('.invite-item').slideUp('fast');
});
$("body").on("click", '.invite-item .yes', function(){
    var group_id = $(this).parents('.invite-item').attr('group-id');
    invite_agree_refuse(group_id,2);
});
$("body").on("click", '.invite-item .no', function(){
    var group_id = $(this).parents('.invite-item').attr('group-id');
    invite_agree_refuse(group_id,1);
});
//点击邀请
$("body").on("click", '.invite-btn', function(){
    var invite_phone = $.trim($('.invite-input').val());
    var group_id = $('.invite-group-warp').attr('group-id');
    var again = $('.invite-group-warp').attr('again');
    if(invite_phone == ''){
        $('.invite-msg').html('请输入要邀请的账号');
        return false;
    }
    invite_group(invite_phone,group_id,again);
});
function move_up_down(upDown){
    var type = $('.dir-right-menu').attr('dirNote');
    var objId = $('.dir-right-menu').data('id');
    var groupId = $('.dir-right-menu').attr('group-id');
    hide_dropdown_menu();
    if(type == 'dir'){
        var obj = $(".dir-list .li-dir[data-id="+objId+"]");
        var parentName = obj.parent('li').parent('ul').prev('div').children('.name').text();
        var url = '/dir/update_dir_sort';
        var itemobj = $(".item-list .li-dir[data-id="+objId+"]");
        if(upDown == 'down'){
            if(obj.parent('li').next('li').length == 0) return false;
            obj.parent('li').next('li').insertBefore(obj.parent('li'));
            itemobj.parent('li').next('li').insertBefore(itemobj.parent('li'));
        }else if(upDown == 'up'){
            if(obj.parent('li').prev('li').length == 0) return false;
            obj.parent('li').insertBefore(obj.parent('li').prev('li'));
            itemobj.parent('li').insertBefore(itemobj.parent('li').prev('li'));
        }
    }else if(type == 'note'){
        var url = '/dir/update_note_sort';
        var obj = $(".li-note[data-id="+objId+"]");
        var parentName = $('.dir-warp .curr').children('.name').text();
        if(upDown == 'down'){
            if(obj.parent('li').next('li').length == 0) return false;
            obj.parent('li').next('li').insertBefore(obj.parent('li'));
        }else if(upDown == 'up'){
            if(obj.parent('li').prev('li').length == 0) return false;
            obj.parent('li').insertBefore(obj.parent('li').prev('li'));
        }
    }else if(type == 'group'){
        var url = '/dir/update_group_sort';
        var obj = $(".group-list .li-group[group-id="+groupId+"]");
        var parentName = obj.parent('li').parent('ul').prev('div').children('.name').text();
        var itemobj = $(".item-list .li-group[group-id="+groupId+"]");
        if(upDown == 'down'){
            if(obj.parent('li').next('li').length == 0) return false;
            obj.parent('li').next('li').insertBefore(obj.parent('li'));
            itemobj.parent('li').next('li').insertBefore(itemobj.parent('li'));
        }else if(upDown == 'up'){
            if(obj.parent('li').prev('li').length == 0) return false;
            obj.parent('li').insertBefore(obj.parent('li').prev('li'));
            itemobj.parent('li').insertBefore(itemobj.parent('li').prev('li'));
        }
    }else{
        return false;
    }
    update_sort(obj,url,parentName);
}

//移动后的排序
function update_sort(obj,url,parent_name){
    var group_id = obj.attr('group-id');
    var parent_ul = obj.parent('li').parent('ul');
    var list = new Array();
    var length = parent_ul.children('li').length;
    parent_ul.children('li').each(function(v){
        if($(this).children('div').hasClass('li-group')){
            group_id = 0;
            list.push([$(this).children('div').attr('group-id'),length-v]);
        }else{
            list.push([$(this).children('.rightbtn').data('id'),length-v]);
        }
    });
    ajax_update_sort(url,list,group_id,parent_name);
}
//右键目录和笔记的删除
$("body").on("click", '.delete', function(){
    var type = $('.dir-right-menu').attr('dirNote');
    var id = $('.dir-right-menu').data('id');
    var groupId = $('.dir-right-menu').attr('group-id');
    hide_dropdown_menu();
    if(type == 'dir'){
        var url = '/dir/delete_dir';
        var resObj = $(".li-dir[data-id="+id+"]").parent('li');
        var delObj = $(".dir-warp .li-dir[data-id="+id+"]");
        var list = get_dir_list(delObj);
        list.push(id);
        ajax_delete_btn(url,list,resObj,groupId);
    }else if(type == 'note'){
        var url = '/dir/delete_note';
        var resObj = $(".li-note[data-id="+id+"]").parent('li');
        ajax_delete_btn(url,id,resObj,groupId);
    }else if(type == 'group'){
        var url = '/dir/delete_group';
        var resObj = $("li .li-group[group-id="+groupId+"]").parent('li');
        ajax_delete_btn(url,id,resObj,groupId);
    }
});
//垃圾箱恢复
$("body").on("click", '.right-trash-recover', function(){
    var type = $('.dir-right-menu').attr('dirNote');
    var id = $('.dir-right-menu').data('id');
    var group_id = $('.dir-right-menu').attr('group-id');
    hide_dropdown_menu();
    if(type == 'dir'){
        var url = '/dir/dir_recover';
        var resObj = $(".item-dir .li-dir[data-id="+id+"]").parent('li');
        var delObj = $(".item-dir .li-dir[data-id="+id+"]");
        var cur_item = [delObj.data('id'),delObj.attr('class-id'),'',delObj.children('.name').text()];
        var list = get_dir_attr(delObj);
        list.push(cur_item);
        ajax_trash_btn(url,list,resObj,group_id);
    }else if(type == 'note'){
        var url = '/dir/note_recover';
        var resObj = $(".li-note[data-id="+id+"]").parent('li');
        ajax_trash_btn(url,id,resObj,group_id);
    }
});
//清空回收站
$("body").on("click", '.trash-all-delete', function(){
    hide_dropdown_menu();
    ajax_trash_all();
});
//垃圾箱永久删除
$("body").on("click", '.right-trash-delete', function(){
    var type = $('.dir-right-menu').attr('dirNote');
    var id = $('.dir-right-menu').data('id');
    hide_dropdown_menu();
    if(type == 'dir'){
        var url = '/dir/dir_trash_delete';
        var resObj = $(".item-dir .li-dir[data-id="+id+"]").parent('li');
        var delObj = $(".item-dir .li-dir[data-id="+id+"]");
        var list = get_dir_list(delObj);
        list.push(id);
        ajax_trash_delete(url,list,resObj);
    }else if(type == 'note'){
        var url = '/dir/note_trash_delete';
        var resObj = $(".li-note[data-id="+id+"]").parent('li');
        ajax_trash_delete(url,id,resObj);
    }
});

function get_dir_list(obj){
    var item = new Array();
    $(obj).next('ul').children('li').each(function(){
        item.push($(this).children('.li-dir').data('id'));
        if($(this).children('.li-dir').next('ul').length > 0){
            var item_list = get_dir_list($(this).children('.li-dir'));
            for(var i=0;i<item_list.length;i++){
                item.push(item_list[i]);
            }
        }
    });
    return item;
}

//重命名
$("body").on("click", '.rename', function(){
    hide_dropdown_menu();
    create_update_name(RightObj);
});
//创建重命名的input
function create_update_name(obj){
    var text = obj.children('.name').text();
    var type = obj.hasClass('li-dir') ? 'dir' : 'item';
    obj.find('.name').html('<input prevalue="'+text+'" class="rename-input" value="'+text+'" />');
    $(".rename-input").focus().select();
    if(type == 'item'){
        obj.find('.item-time').hide();
        obj.children('.name').addClass('item-rename');
    }else if(type == 'dir'){
        obj.children('.name').addClass('dir-rename');
    }
    obj.find('.right-menu').addClass('none');
    obj.find('.item-time').addClass('none');
}
//阻击右键菜单的冒泡
$("body").on("click", '.rename-input', function(e){
    return false;
})
// 重命名的回车键事件
$("body").on("keydown", '.rename-input', function(e){
    if(e.which == 13) $('.rename-input').trigger('blur');
});
$("body").on("blur", '.rename-input', function(e){
    change_name();
})

function change_name(){
    if($('.rename-input').length == 0) return false;
    var obj = $('.rename-input');
    var name = obj.val();
    var itemObj = obj.parent('.name').parent('div');
    var id = itemObj.data('id');
    var group_id = itemObj.attr('group-id');
    if(itemObj.hasClass('li-group')) var type = 'group';
    else if(itemObj.hasClass('li-dir')) var type = 'dir';
    else if(itemObj.hasClass('li-note')) var type = 'note';

    if(type == 'note'){
        var url = '/dir/update_note_name';
        var resObj = $(".li-note[data-id="+id+"] .name");
        if(itemObj.hasClass('curr')) $('.note-detail .note-name').val(name);
    }else if(type == 'dir'){
        var url = '/dir/update_dir_name';
        var resObj = $(".li-dir[data-id="+id+"] .name");
    }else if(type == 'group'){
        id = itemObj.attr('group-id');
        var url = '/dir/update_group_name';
        var resObj = $(".li-group[group-id="+id+"] .name");
    }
    var pre_name = obj.attr('prevalue');
    if(pre_name == name){
        obj.parent('.name').html(name);
        rename_regain();
        return false;
    }
    resObj.html(name);
    rename_regain();
    ajax_update_name(url,name,id,pre_name,group_id);
}

function rename_regain(){
    $('.item-rename').removeClass('item-rename');
    $('.dir-rename').removeClass('dir-rename');
    $('.right-menu').removeClass('none');
    $('.item-time').removeClass('none');
}

function hide_dropdown_menu(menu){
    if(menu != 'setting'){ //setting-menu的下拉菜单
        $(".dropdown-menu").hide();
    }
    if(menu != 'rightMenu'){ // 我的文件夹的右键菜单
        $('.dir-right-menu').remove();
        $('.right-hover').removeClass('right-hover');
    }
}

function get_menu_html(obj,e){
    hide_dropdown_menu();
    obj.addClass('right-hover');
    RightObj = obj;
    var dir_id = obj.data('id');
    var group_id = obj.attr('group-id');
    var class_id = obj.attr('class-id') == undefined ? 0 : obj.attr('class-id');
    var type = '', dirNote ='';
    if(obj.hasClass('my-dir-list')){
        type = 'sidebar-dir';
    }else if(obj.hasClass('my-group-list')){
        type = 'sidebar-group';
    }else if(obj.hasClass('sidebar-trash')){
        type = 'trash-all';
    }else if(obj.hasClass('li-trash')){
        type = 'trash';
    }else if(obj.hasClass('li-search')){
        type = 'search';
    }else if(obj.hasClass('li-group')){
        type = 'group';
    }else if(obj.hasClass('li-dir')){
        type = 'dir';
    }else if(obj.hasClass('li-note')){
        type = 'note';
    }else{
        return false;
    }

    if(obj.hasClass('li-group')){
        dirNote = 'group';
    }else if(obj.hasClass('li-dir')){
        dirNote = 'dir';
    }else if(obj.hasClass('li-note')){
        dirNote = 'note';
    }

    var html = '<ul class="dropdown-menu dir-right-menu" role="menu" dirNote = "'+dirNote+'" ' +
        'type="'+type+'" data-id="'+dir_id+'" group-id="'+group_id+'" class-id="'+class_id+'">';
    if(type == 'dir' || type == 'note'){
        html += '<li class="move-up">上移</li>';
        html += '<li class="move-down">下移</li>';
        html += '<li class="delete">删除</li>';
        html += '<li class="li-divider rename">重命名</li>';
        if(type == 'dir'){
            var obj = $('.dir-warp .li-dir[data-id='+dir_id+'][group-id='+group_id+']');
            if(obj.parent('li').parent('ul').prev('div[private=1]').length == 0){
                var manage = 0,manage_msg = '设为公开';
                if(obj.attr('private') == 0) manage = 1,manage_msg = '设为私密';
                html += '<li class="li-divider set-manage" manage="'+manage+'">'+manage_msg+'</li>';
            }
        }
    }else if(type == 'trash'){
        html += '<li class="right-trash-recover">恢复</li>';
        html += '<li class="right-trash-delete">永久删除</li>';
    }else if(type == 'trash-all'){
        html += '<li class="trash-all-delete">清空回收站</li>';
    }else if(type == 'search'){
        html += '<li class="delete">删除</li>';
        html += '<li class="li-divider">重命名</li>';
    }else if(type == 'sidebar-group'){
        html += '<li class="create-group">添加协作</li>';
    }
    if(type == 'dir' || type == 'group' || type == 'sidebar-dir'){
        if(type == 'group'){
            html += '<li class="rename">重命名</li>';
            html += '<li class="delete">退出协作</li>';
            html += '<li class="invite-group">邀请协作</li>';
            html += '<li class="li-divider history-log">历史记录</li>';
        }
        html += '<li class="right-create-note">新建笔记</li>';
        html += '<li class="right-create-dir">新建文件夹</li>';
    }
    html += '</ul>';
    $('body').append(html);
    var height = e.pageY;
    if(height > $(document).height()/2) height = e.pageY - $(".dir-right-menu").height()-5;
    $(".dir-right-menu").css({"left":e.pageX,"top": height}).show();
}