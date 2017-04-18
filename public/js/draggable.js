function ele_draggable(){
    var drapDirId  = 0 , drapNoteId= 0 ;
    //目录拖放
    $('.li-dir').draggable({
        scroll: false,
        appendTo: "body",
        cancel: "i.right-menu",
        cursorAt: { top: 10, left: 10},
        helper: function( e ) {
            return $( "<img class='ui-widget-header' src='/img/drap_dir.png' />" );
        },
        start: function() {
            //开始
            if($(this).hasClass('my-dir-list')) return false;
            $(this).addClass('obj-drap');
            drapDirId = $(this).data('id');
        },
        drag: function() {
            //期间
        },
        stop: function() {
            //结束
            $('.obj-drap').removeClass('obj-drap');
            drapDirId = 0;
        }
    });

    //目录排序
    $( ".sortable" ).sortable({
        axis: "y",
        revert: true,
        update: function(event, ui) {
            var obj = $(this).children('li').eq(0).children('.rightbtn');
            if(obj.hasClass('li-dir')){
                var url = '/dir/update_dir_sort';
            }else if(obj.hasClass('li-note')){
                var url = '/dir/update_note_sort'
            }else{
                return false;
            }
            update_sort(obj,url);
        }
    });


    //笔记拖放
    $('.li-note').draggable({
        cancel: "i.right-menu",
        scroll: false,
        cursorAt: { top: 10, left: 10},
        helper: function( e ) {
            return $( "<img class='ui-widget-header' src='/img/drap_note.png' />" );
        },
        start: function() {
            //开始
            $(this).addClass('obj-drap');
            drapNoteId = $(this).data('id');
        },
        stop: function() {
            //结束
            $('.obj-drap').removeClass('obj-drap');
            drapNoteId = 0;
        }
    });

    //目录drop
    $( ".li-dir" ).droppable({
        accept: ".rightbtn",
        hoverClass: "cur-drap",
        drop: function( event, ui ) {
            if($(this).hasClass('li-trash')) return false;
            $('.ui-widget-header').remove();
            $('.obj-drap').removeClass('obj-drap');
            if(drapDirId){
                drap_dir($(this).data('id'),drapDirId,ui);
                drapDirId = 0;
            }else if(drapNoteId){
                drap_note($(this),drapNoteId);
                drapNoteId = 0;
            }
        }
    });

    //回收站
    $( ".sidebar-trash" ).droppable({
        accept: ".rightbtn",
        hoverClass: "cur-drap",
        drop: function( event, ui ) {
            $('.ui-widget-header').remove();
            $('.obj-drap').removeClass('obj-drap');
            if(drapDirId){
                var url = '/dir/delete_dir';
                var resObj = $(".li-dir[data-id="+drapDirId+"]").parent('li');
                var delObj = $(".dir-list .li-dir[data-id="+drapDirId+"]");
                var list = get_dir_list(delObj);
                list.push(drapDirId);
                ajax_delete_btn(url,list,resObj);
                drapDirId = 0;
            }else if(drapNoteId){
                var url = '/dir/delete_note';
                var resObj = $(".li-note[data-id="+drapNoteId+"]").parent('li');
                ajax_delete_btn(url,drapNoteId,resObj);
                drapNoteId = 0;
            }
        }
    });

}


//拖放目录
function drap_dir(curId,dragId,ui){
    if(curId == dragId) return false;
    var parObj = $(".dir-list .li-dir[data-id="+dragId+"]").parent('li').parent('ul').prev('.li-dir');
    var parent_id = parObj.data('id');
    if(curId == parent_id) return false;
    var curObj = $(".dir-list .li-dir[data-id="+curId+"]");

    if(ui.draggable.hasClass('li-trash')){
        var dragObj = $(".li-trash[data-id="+dragId+"]");
    }else{
        var dragObj = $(".dir-list .li-dir[data-id="+dragId+"]");
    }

    if(parObj.next('ul').children('li').length == 1){
        parObj.children('.down-btn').removeClass('drop-down pack-up');
    }

    var html = dragObj.parent().prop("outerHTML");

    //UL下没有li的清除掉
    if(parObj.next('ul').children('li').length == 0){
        parObj.next('ul').remove();
    }
    //删除被移动文件
    $(".li-dir[data-id="+dragId+"]").parent().remove();
    ui.draggable.remove();//删除通过jquery-ui手动的元素

    //拖放到文件夹
    if(curObj.next('ul').length > 0){
        curObj.next('ul').append(html);
    }else{
        curObj.after('<ul>'+html+'</ul>');
        curObj.children('.down-btn').addClass('drop-down');
    }

    if(parObj.hasClass('curr')){
        //拖放右侧消失
        $(".item-dir .li-dir[data-id="+dragId+"]").parent('li').remove();
    }
    if(curObj.hasClass('curr')){
        //拖放右侧增加
        $(".item-dir").append(html);
    }else if(dragObj.hasClass('curr')){
        curObj.next('ul').show();
    }
    ele_draggable();//新添加的元素也可以拖放
    update_dir_list($(".dir-list .li-dir[data-id="+dragId+"]"),curId);
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