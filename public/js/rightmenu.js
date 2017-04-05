var RightObj ;
var RightDirId ;
var RightType;
$("body").on("contextmenu", '.rightbtn', function(e){
    RightObj = $(this);
    RightDirId = $(this).data('id');
    if($(this).hasClass('li-note')){
        RightType = 'item';
        $('.right-create-note').hide();
        $('.right-create-dir').hide();
    }else if($(this).hasClass('li-dir')){
        RightType = 'dir';
        $('.right-create-note').show();
        $('.right-create-dir').show();
    }
    $(".dir-right-menu").css({"left":e.pageX,"top":e.pageY}).show();
    return false;
})

$("body").on("click", '.right-menu', function(e){
    RightObj = $(this).parents('.rightbtn');
    RightDirId = RightObj.data('id');
    if(RightObj.hasClass('li-note')) RightType = 'item';
    else if(RightObj.hasClass('li-dir')) RightType = 'dir';
    $(".dir-right-menu").css({"left":e.pageX,"top":e.pageY}).show();
    return false;
})
$("body").on("dblclick", '.right-menu', function(e){
    //阻止双击冒泡
    return false;
})
$('.right-create-dir').click(function(){
    var parent_id = RightDirId;
    var class_id = parseInt(RightObj.attr('class-id')) + 1;
    $(".dir-right-menu").hide();
    create_dir(parent_id,class_id);
})
$('.right-create-note').click(function(){
    $(".dir-right-menu").hide();
    create_note(RightDirId)
})
$('body').click(function(){
    $(".dir-right-menu").hide();
})
$(".dir-right-menu").on("click", function(e){
    e.stopPropagation();
});

$(".move-up").on("click", function(e){
    if(RightType == 'dir'){
        var url = '/dir/update_dir_sort';
        var obj = $(".dir-list .li-dir[data-id="+RightDirId+"]");
        var itemobj = $(".item-list .li-dir[data-id="+RightDirId+"]");
        if(obj.parent('li').prev('li').length == 0) return false;
        obj.parent('li').insertBefore(obj.parent('li').prev('li'));
        itemobj.parent('li').insertBefore(itemobj.parent('li').prev('li'));
    }else{
        var url = '/dir/update_note_sort';
        var obj = $(".li-note[data-id="+RightDirId+"]");
        if(obj.parent('li').prev('li').length == 0) return false;
        obj.parent('li').insertBefore(obj.parent('li').prev('li'));
    }
    update_sort(obj,url);
});

$(".move-down").on("click", function(e){
    if(RightType == 'dir'){
        var obj = $(".dir-list .li-dir[data-id="+RightDirId+"]");
        var url = '/dir/update_dir_sort';
        var itemobj = $(".item-list .li-dir[data-id="+RightDirId+"]");
        if(obj.parent('li').next('li').length == 0) return false;
        obj.parent('li').next('li').insertBefore(obj.parent('li'));
        itemobj.parent('li').next('li').insertBefore(itemobj.parent('li'));
    }else if(RightType == 'item'){
        var url = '/dir/update_note_sort'
        var obj = $(".li-note[data-id="+RightDirId+"]");
        if(obj.parent('li').next('li').length == 0) return false;
        obj.parent('li').next('li').insertBefore(obj.parent('li'));
    }
    update_sort(obj,url);
});

function update_sort(obj,url){
    var parent_ul = obj.parent('li').parent('ul');
    var list = new Array();
    var length = parent_ul.children('li').length;
    parent_ul.children('li').each(function(v){
        list.push([$(this).children('.rightbtn').data('id'),length-v]);
    });
    $.ajax({
        url:  url,
        data:{'list':list},
        type: "POST",
        dataType:'json',
        success:function(obj){

        },
        error:function(e){}
    });
}

$(".delete").on("click", function(e){
    var id = RightDirId;
    if(RightType == 'dir'){
        var url = '/dir/delete_dir';
        var resObj = $(".li-dir[data-id="+id+"]").parent('li');
    }else if(RightType == 'item'){
        var url = '/dir/delete_note';
        var resObj = $(".li-note[data-id="+id+"]").parent('li');
        empty_note();
    }
    $(".dir-right-menu").hide();
    if($(".dir-list .li-dir[data-id="+id+"]").parent('li').siblings('li').length == 0){
        $(".dir-list .li-dir[data-id="+id+"]").parent('li').parent('ul').prev('.li-dir').children('.down-btn').removeClass('drop-down pack-up');
    }
    resObj.remove();
    if($('.widget-scroller .rightbtn').length == 0) $('.item-note').html(no_item_html());
    $.ajax({
        url:  url,
        data:{'id':id},
        type: "POST",
        dataType:'json',
        success:function(obj){

        },
        error:function(e){}
    });
});

$(".rename").on("click", function(e){
    $(".dir-right-menu").hide();
    create_update_name(RightObj);
});

function create_update_name(obj){
    var text = obj.children('.name').text();
    var type = obj.hasClass('li-dir') ? 'dir' : 'item';
    obj.find('.name').html('<input prevalue="'+text+'" class="rename-input" value="'+text+'" />');
    obj.attr('draggable','false');
    $(".rename-input").focus().select();
    if(type == 'item'){
        obj.find('.item-time').hide();
        obj.children('.name').addClass('item-rename');
    }else if(type == 'dir'){
        obj.children('.name').addClass('dir-rename');
    }
    obj.find('.right-menu').addClass('none');
}

$("body").on("click", '.rename-input', function(e){
    return false;
})
$(document).keypress(function(e) {
    // 回车键事件
    if(e.which == 13) change_name();
});
$("body").on("blur", '.rename-input', function(e){
    change_name();
})

function change_name(){
    if($('.rename-input').length == 0) return false;
    var obj = $('.rename-input');
    var name = obj.val();
    var itemObj = obj.parents('.rightbtn');
    var id = itemObj.data('id');
    if(RightType == 'item'){
        var url = '/dir/update_note_name';
        var resObj = $(".li-note[data-id="+id+"] .name");
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
    if(itemObj.hasClass('curr')) $('.note-detail .title').val(name);
    rename_regain();
    $.ajax({
        url:  url,
        data:{'name':name,'id':id},
        type: "POST",
        dataType:'json',
        success:function(obj){

        },
        error:function(e){}
    });
}

function rename_regain(){
    $('.item-rename').removeClass('item-rename');
    $('.dir-rename').removeClass('dir-rename');
    $('.right-menu').removeClass('none');
}