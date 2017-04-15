var RightObj ;
var RightDirId ;
var RightType;
//监听鼠标右键点击
$("body").on("contextmenu", '.rightbtn', function(e){
    hide_dropdown_menu();
    RightObj = $(this);
    RightDirId = $(this).data('id');
    if($(this).hasClass('li-note')) RightType = 'note';
    else if($(this).hasClass('li-dir')) RightType = 'dir';

    var menu_type = RightType;
    if($(this).hasClass('li-trash')) menu_type = 'trash';
    get_menu_html(menu_type,e);
    return false;
})
//清空回收站
$("body").on("contextmenu", '.sidebar-trash', function(e){
    hide_dropdown_menu();
    get_menu_html('trash-all',e);
    return false;
})
//监听右键按钮点击
$("body").on("click", '.right-menu', function(e){
    hide_dropdown_menu();
    RightObj = $(this).parents('.rightbtn');
    RightDirId = RightObj.data('id');
    if(RightObj.hasClass('li-note')) RightType = 'note';
    else if(RightObj.hasClass('li-dir')) RightType = 'dir';

    var menu_type = RightType;
    if(RightObj.hasClass('li-trash')) menu_type = 'trash';
    get_menu_html(menu_type,e);
    return false;
})
//阻双击冒泡事件
$("body").on("dblclick", '.right-menu', function(e){
    return false;
})
//右键的创建目录
$("body").on("click", '.right-create-dir', function(){
    var parent_id = RightDirId;
    var class_id = parseInt(RightObj.attr('class-id')) + 1;
    hide_dropdown_menu();
    create_dir(parent_id,class_id);
})
//右键的创建笔记

$("body").on("click", '.right-create-note', function(){
    hide_dropdown_menu();
    create_note(RightDirId)
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
    if(RightType == 'dir'){
        var url = '/dir/update_dir_sort';
        var obj = $(".dir-list .li-dir[data-id="+RightDirId+"]");
        var itemobj = $(".item-list .li-dir[data-id="+RightDirId+"]");
        if(obj.parent('li').prev('li').length == 0) return false;
        obj.parent('li').insertBefore(obj.parent('li').prev('li'));
        itemobj.parent('li').insertBefore(itemobj.parent('li').prev('li'));
    }else if(RightType == 'note'){
        var url = '/dir/update_note_sort';
        var obj = $(".li-note[data-id="+RightDirId+"]");
        if(obj.parent('li').prev('li').length == 0) return false;
        obj.parent('li').insertBefore(obj.parent('li').prev('li'));
    }else{
        return false;
    }
    update_sort(obj,url);
});
//下移
$("body").on("click", '.move-down', function(){
    if(RightType == 'dir'){
        var obj = $(".dir-list .li-dir[data-id="+RightDirId+"]");
        var url = '/dir/update_dir_sort';
        var itemobj = $(".item-list .li-dir[data-id="+RightDirId+"]");
        if(obj.parent('li').next('li').length == 0) return false;
        obj.parent('li').next('li').insertBefore(obj.parent('li'));
        itemobj.parent('li').next('li').insertBefore(itemobj.parent('li'));
    }else if(RightType == 'note'){
        var url = '/dir/update_note_sort'
        var obj = $(".li-note[data-id="+RightDirId+"]");
        if(obj.parent('li').next('li').length == 0) return false;
        obj.parent('li').next('li').insertBefore(obj.parent('li'));
    }else{
        return false;
    }
    update_sort(obj,url);
});
//移动后的排序
function update_sort(obj,url){
    var parent_ul = obj.parent('li').parent('ul');
    var list = new Array();
    var length = parent_ul.children('li').length;
    parent_ul.children('li').each(function(v){
        list.push([$(this).children('.rightbtn').data('id'),length-v]);
    });
    ajax_update_sort(url,list);
}
//右键目录和笔记的删除
$("body").on("click", '.delete', function(){
    hide_dropdown_menu();
    var id = RightDirId;
    if(RightType == 'dir'){
        var url = '/dir/delete_dir';
        var resObj = $(".li-dir[data-id="+id+"]").parent('li');
        var delObj = $(".dir-list .li-dir[data-id="+id+"]");
        var list = get_dir_list(delObj);
        list.push(id);
        ajax_delete_btn(url,list,resObj);
    }else if(RightType == 'note'){
        var url = '/dir/delete_note';
        var resObj = $(".li-note[data-id="+id+"]").parent('li');
        ajax_delete_btn(url,id,resObj);
    }
});
//垃圾箱恢复
$("body").on("click", '.right-trash-recover', function(){
    hide_dropdown_menu();
    var id = RightDirId;
    if(RightType == 'dir'){
        var url = '/dir/dir_recover';
        var resObj = $(".item-dir .li-dir[data-id="+id+"]").parent('li');
        var delObj = $(".item-dir .li-dir[data-id="+id+"]");
        var cur_item = [delObj.data('id'),delObj.attr('class-id'),'',delObj.children('.name').text()];
        var list = get_dir_attr(delObj);
        list.push(cur_item);
        ajax_trash_btn(url,list,resObj);
    }else if(RightType == 'note'){
        var url = '/dir/note_recover';
        var resObj = $(".li-note[data-id="+id+"]").parent('li');
        ajax_trash_btn(url,id,resObj);
    }
});
//清空回收站
$("body").on("click", '.trash-all-delete', function(){
    hide_dropdown_menu();
    ajax_trash_all();
});
//垃圾箱永久删除
$("body").on("click", '.right-trash-delete', function(){
    hide_dropdown_menu();
    var id = RightDirId;
    if(RightType == 'dir'){
        var url = '/dir/dir_trash_delete';
        var resObj = $(".item-dir .li-dir[data-id="+id+"]").parent('li');
        var delObj = $(".item-dir .li-dir[data-id="+id+"]");
        var list = get_dir_list(delObj);
        list.push(id);
        ajax_trash_delete(url,list,resObj);
    }else if(RightType == 'note'){
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
$(".rename").on("click", function(e){
    hide_dropdown_menu();
    create_update_name(RightObj);
});
//创建重命名的input
function create_update_name(obj){
    var text = obj.children('.name').text();
    var type = obj.hasClass('li-dir') ? 'dir' : 'item';
    obj.find('.name').html('<input prevalue="'+text+'" class="rename-input" value="'+text+'" />');
    obj.parent().attr('draggable','false');
    $(".rename-input").focus().select();
    if(type == 'item'){
        obj.find('.item-time').hide();
        obj.children('.name').addClass('item-rename');
    }else if(type == 'dir'){
        obj.children('.name').addClass('dir-rename');
    }
    obj.find('.right-menu').addClass('none');
}
//阻击右键菜单的冒泡
$("body").on("click", '.rename-input', function(e){
    return false;
})
// 重命名的回车键事件
$("body").on("keydown", '.rename-input', function(e){
    if(e.which == 13) change_name();
});
$("body").on("blur", '.rename-input', function(e){
    change_name();
})

function change_name(){
    if($('.rename-input').length == 0) return false;
    var obj = $('.rename-input');
    var name = obj.val();
    var itemObj = obj.parent('.name').parent('.rightbtn');
    var id = itemObj.data('id');
    if(RightType == 'note'){
        var url = '/dir/update_note_name';
        var resObj = $(".li-note[data-id="+id+"] .name");
        if(itemObj.hasClass('curr')) $('.note-detail .title').val(name);
    }else if(RightType == 'dir'){
        var url = '/dir/update_name';
        var resObj = $(".li-dir[data-id="+id+"] .name");
    }
    itemObj.attr('draggable','true');
    if(obj.attr('prevalue') == name){
        obj.parent('.name').html(name);
        rename_regain();
        return false;
    }
    resObj.html(name);
    rename_regain();
    ajax_update_name(url,name,id);
}

function rename_regain(){
    $('.item-rename').removeClass('item-rename');
    $('.dir-rename').removeClass('dir-rename');
    $('.right-menu').removeClass('none');
}

function hide_dropdown_menu(){
    $(".dropdown-menu").hide();
    $('.dir-right-menu').remove();
}

function get_menu_html(type,e){
    var html = '<ul class="dropdown-menu dir-right-menu" role="menu">';
    if(type == 'dir' || type == 'note'){
        html += '<li class="move-up">上移</li>';
        html += '<li class="move-down">下移</li>';
        html += '<li class="delete">删除</li>';
        html += '<li class="li-divider rename">重命名</li>';
        if(type == 'dir'){
            html += '<li class="right-create-note">新建笔记</li>';
            html += '<li class="right-create-dir">新建文件夹</li>';
        }
    }else if(type == 'trash'){
        html += '<li class="right-trash-recover">恢复</li>';
        html += '<li class="right-trash-delete">永久删除</li>';
    }else if(type == 'trash-all'){
        html += '<li class="trash-all-delete">清空回收站</li>';
    }
    html += '</ul>';
    $('body').append(html);
    var height = e.pageY;
    if(height > $(document).height()/2) height = e.pageY - $(".dir-right-menu").height()-5;
    $(".dir-right-menu").css({"left":e.pageX,"top": height}).show();
}