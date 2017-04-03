var drapId  = 0;

$("body").on("dragstart", '.li-dir', function(e){
    var rec_id = $(this).data('id');
    drapId = $(this).data('id');
    drapObj = e.originalEvent.dataTransfer;
    drapObj.setData("text",rec_id);
 //   drapObj.dropEffect="move";
 //   drapObj.effectAllowed="all";
    var dragIcon = document.createElement("img");
    dragIcon.src = $('#drop-dir').attr('src');
    drapObj.setDragImage(dragIcon, -10, -2);
});
$("body").on("dragend", '.li-dir', function(e){
    drapId  = 0;
    $('.cur-drap').removeClass('cur-drap');
});
$("body").on("dragenter", '.li-dir', function(e){
    e.originalEvent.preventDefault();
    $('.cur-drap').removeClass('cur-drap');
    if($(this).data('id') == drapId) return false;
    $(this).addClass('cur-drap');
});
//当拖拽完成后触发的事件，此事件作用在被拖曳元素上
$("body").on("drop", '.li-dir', function(e){
    e.originalEvent.preventDefault;
    var id = e.originalEvent.dataTransfer.getData("text");
    $('.cur-drap').removeClass('cur-drap');
    if($(this).data('id') == id) return false;
    var parent_id = $(".dirlist .li-dir[data-id="+id+"]").parent('li').parent('ul').prev('.li-dir').data('id');
    if($(this).data('id') == parent_id) return false;
    var cur_id = $(this).data('id');
    var curObj = $(".dirlist .li-dir[data-id="+cur_id+"]");

    if($(".dirlist .li-dir[data-id="+parent_id+"]").next('ul').children('li').length == 1){
        $(".dirlist .li-dir[data-id="+parent_id+"]").children('.drop-down').text('');
    }

    var html = $(".dirlist .li-dir[data-id="+id+"]").parent().prop("outerHTML");
    //删除被移动文件
    $(".li-dir[data-id="+id+"]").parent().remove();
    //拖放到文件夹
    if(curObj.next('ul').length > 0){
        curObj.next('ul').append(html);
    }else{
        curObj.after('<ul>'+html+'</ul>');
        curObj.children('.drop-down').text('+');
    }
    //UL下没有li的清除掉
    if($(".dirlist .li-dir[data-id="+parent_id+"]").next('ul').children('li').length == 0){
        $(".dirlist .li-dir[data-id="+parent_id+"]").next('ul').remove();
    }

    if($(".dirlist .li-dir[data-id="+parent_id+"]").hasClass('curr')){
        //拖放右侧消失
        $(".item-dir .li-dir[data-id="+id+"]").parent('li').remove();
    }
    if(curObj.hasClass('curr')){
        //拖放右侧增加
        $(".item-dir").append(html);
    }
    update_dir_list($(".dirlist .li-dir[data-id="+id+"]"),$(this).data('id'));
})

function update_dir_list(obj,parent_id){
    var parent = obj.parent('li').parent('ul').parent('li').children('.li-dir');
    var class_id = parseInt(parent.attr('class-id'))+1;
    obj.attr('class-id',class_id);
    var cur_item = [obj.data('id'),class_id,parent.data('id'),obj.text()];
    var list = get_dir_attr(obj);
    list.push(cur_item);
    $.ajax({
        url:  '/dir/update_dir',
        data:{'list':list,'parent_id':parent_id},
        type: "POST",
        dataType:'json',
        success:function(result){
            drap_dir_sort(obj,parent_id,result);
        },
        error:function(e){}
    });
}

function drap_dir_sort(obj,parent_id,result){
    var parentObj = $(".dirlist .li-dir[data-id="+parent_id+"]");
    if(result.length <= 1) return false;
    $.each(result, function(k, v){
        if(v == obj.data('id')){
            if(k == result.length-1) return false;
            parentObj.next('ul').children('li').eq(k-1).after(obj.parent('li'));
            if($(".dirlist .li-dir[data-id="+parent_id+"]").hasClass('curr')){
                $(".item-dir li").eq(k-1).after($(".item-dir .li-dir[data-id="+v+"]").parent('li'));
            }
        }
    });
}

function get_dir_attr(obj){
    var item = new Array();
    var parent_id = obj.data('id');
    var class_id = parseInt(obj.attr('class-id'))+1;
    $(obj).next('ul').children('li').each(function(){
        item.push([$(this).children('.li-dir').data('id'),class_id,parent_id,$(this).children('.li-dir').text()]);
        if($(this).children('.li-dir').next('ul').length > 0){
            var item_list = get_dir_attr($(this).children('.li-dir'));
            for(var i=0;i<item_list.length;i++){
                item.push(item_list[i]);
            }
        }
    });
    return item;
}
