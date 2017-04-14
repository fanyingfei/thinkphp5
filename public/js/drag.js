var drapId  = 0;
//笔记开始拖放时
$("body").on("dragstart", '.li-note', function(e){
    var rec_id = $(this).data('id');
    drapId = $(this).data('id');
    drapObj = e.originalEvent.dataTransfer;
    drapObj.setData("rec-id",rec_id);
    var dragIcon = document.createElement("img");
    dragIcon.src = $('#drop-note').attr('src');
    drapObj.setDragImage(dragIcon, -10, -10);
});
//目录开始拖放时
$("body").on("dragstart", '.li-dir', function(e){
    var rec_id = $(this).data('id');
    drapId = $(this).data('id');
    drapObj = e.originalEvent.dataTransfer;
    drapObj.setData("dir-id",rec_id);
 //   drapObj.dropEffect="move";
 //   drapObj.effectAllowed="all";
    var dragIcon = document.createElement("img");
    dragIcon.src = $('#drop-dir').attr('src');
    drapObj.setDragImage(dragIcon, -10, -2);
});
//目录或者笔记播放结束时
$("body").on("dragend", 'li .rightbtn', function(e){
    drapId  = 0;
    $('.cur-drap').removeClass('cur-drap');
});
//拖放元素进入目标元素时
$("body").on("dragenter", '.li-dir', function(e){
    e.originalEvent.preventDefault();
    $('.cur-drap').removeClass('cur-drap');
    if($(this).data('id') == drapId) return false;
    $(this).addClass('cur-drap');
});
//当拖拽完成后触发的事件，此事件作用在被拖曳元素上
$("body").on("drop", '.li-dir', function(e){
    e.originalEvent.preventDefault();
    var drapObj = e.originalEvent.dataTransfer;
    drapObj.preventDefault;
    $('.cur-drap').removeClass('cur-drap');
    if(drapObj.getData("rec-id")){
        var id  = drapObj.getData("rec-id");
        drapObj.clearData("rec-id");
        drap_note($(this),id);
    }else if(drapObj.getData("dir-id")){
        var id  = drapObj.getData("dir-id");
        drapObj.clearData("dir-id");
        drap_dir($(this),id);
    }
})
//拖放目录
function drap_dir(curObj,id){
    var cur_id = curObj.data('id');
    if(cur_id == id) return false;
    var parent_id = $(".dir-list .li-dir[data-id="+id+"]").parent('li').parent('ul').prev('.li-dir').data('id');
    if(cur_id == parent_id) return false;
    var curObj = $(".dir-list .li-dir[data-id="+cur_id+"]");

    if($(".dir-list .li-dir[data-id="+parent_id+"]").next('ul').children('li').length == 1){
        $(".dir-list .li-dir[data-id="+parent_id+"]").children('.down-btn').removeClass('drop-down pack-up');
    }

    var html = $(".dir-list .li-dir[data-id="+id+"]").parent().prop("outerHTML");
    //删除被移动文件
    $(".li-dir[data-id="+id+"]").parent().remove();
    //拖放到文件夹
    if(curObj.next('ul').length > 0){
        curObj.next('ul').append(html);
    }else{
        curObj.after('<ul>'+html+'</ul>');
        curObj.children('.down-btn').addClass('drop-down');
    }
    //UL下没有li的清除掉
    if($(".dir-list .li-dir[data-id="+parent_id+"]").next('ul').children('li').length == 0){
        $(".dir-list .li-dir[data-id="+parent_id+"]").next('ul').remove();
    }

    if($(".dir-list .li-dir[data-id="+parent_id+"]").hasClass('curr')){
        //拖放右侧消失
        $(".item-dir .li-dir[data-id="+id+"]").parent('li').remove();
    }
    if(curObj.hasClass('curr')){
        //拖放右侧增加
        $(".item-dir").append(html);
    }
    update_dir_list($(".dir-list .li-dir[data-id="+id+"]"),cur_id);
}

//拖放结束后排序
function drap_dir_sort(obj,parent_id,result){
    var parentObj = $(".dir-list .li-dir[data-id="+parent_id+"]");
    if(result.length <= 1) return false;
    $.each(result, function(k, v){
        if(v == obj.data('id')){
            if(k == result.length-1) return false; //最后一个时不用再排序，默认添加到最后一个
            parentObj.next('ul').children('li').eq(k).before(obj.parent('li'));
            if($(".dir-list .li-dir[data-id="+parent_id+"]").hasClass('curr')){
                $(".item-dir li").eq(k).before($(".item-dir .li-dir[data-id="+v+"]").parent('li'));
            }
        }
    });
}

function get_dir_attr(obj){
    var item = new Array();
    var parent_id = obj.data('id');
    var class_id = parseInt(obj.attr('class-id'))+1;
    $(obj).next('ul').children('li').each(function(){
        item.push([$(this).children('.li-dir').data('id'),class_id,parent_id,$(this).children('.li-dir').children('.name').text()]);
        if($(this).children('.li-dir').next('ul').length > 0){
            var item_list = get_dir_attr($(this).children('.li-dir'));
            for(var i=0;i<item_list.length;i++){
                item.push(item_list[i]);
            }
        }
    });
    return item;
}
