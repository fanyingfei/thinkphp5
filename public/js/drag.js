$("body").on("dragstart", '.li-dir', function(e){
    var rec_id = $(this).data('id');
    e.originalEvent.dataTransfer.setData("obj_add",rec_id);
});

$("body").on("dragover", '.li-dir', function(e){
    $('.cur_drap').removeClass('cur-drap');
    $(this).addClass('cur-drap');
    e.originalEvent.preventDefault();
});

//放下事件
$("body").on("drop", '.li-dir', function(e){
    var id = e.originalEvent.dataTransfer.getData("obj_add");
    $('.cur-drap').removeClass('cur-drap');
    if($(this).data('id') == id) return false;
    var parent_id = $(".dirlist .li-dir[data-id="+id+"]").parent('li').parent('ul').prev('.li-dir').data('id');
    if($(this).data('id') == parent_id) return false;

    if($(".dirlist .li-dir[data-id="+parent_id+"]").next('ul').length == 1){
        $(".dirlist .li-dir[data-id="+parent_id+"]").children('.drop-down').text('');
    }
    e.originalEvent.preventDefault;
    $('.cur-drap').removeClass('cur-drap');
    var html = $(".li-dir[data-id="+id+"]").parent().prop("outerHTML");
    $(".li-dir[data-id="+id+"]").parent().remove();
    if($(this).next('ul').length > 0){
        $(this).next('ul').append(html);
    }else{
        $(this).after('<ul>'+html+'</ul>');
        $(this).children('.drop-down').text('+');
    }
    //UL下没有li的清除掉
    if($(".dirlist .li-dir[data-id="+parent_id+"]").next('ul').children('li').length == 0){
        $(".dirlist .li-dir[data-id="+parent_id+"]").next('ul').remove();
    }

    if($(".dirlist .li-dir[data-id="+parent_id+"]").hasClass('curr')){
        //拖放右侧消失
        $(".item-dir .li-dir[data-id="+id+"]").parent('li').remove();
    }
    if($(this).hasClass('curr')){
        //拖放右侧增加
        $(".item-dir").append(html);
    }
    update_dir_list($(".dirlist .li-dir[data-id="+id+"]"),$(this).data('id'));
})

function update_dir_list(obj,parent_id){
    var parent = obj.parent('li').parent('ul').parent('li').children('.li-dir');
    var cur_item = [obj.data('id'),parseInt(parent.attr('class-id'))+1,parent.data('id'),obj.text()];
    var list = get_dir_attr(obj);
    list.push(cur_item);
    $.ajax({
        url:  '/dir/update_dir',
        data:{'list':list,'parent_id':parent_id},
        type: "POST",
        dataType:'json',
        success:function(result){
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
        },
        error:function(e){}
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