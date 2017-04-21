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
            if($(this).hasClass('my-dir-list li-group')) return false;
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
    $( ".sortable").sortable({
        axis: "y",
        revert: true,
        containment:'parent',
        sort:function(){
            $(this).find('ul').hide().end().find('.pack-up').removeClass('pack-up');
            var sortableHeight = $(this).children('li').eq(0).children('div').outerHeight();
            $('.ui-sortable-placeholder').height(sortableHeight);
            $('.ui-sortable-helper').height(sortableHeight);
        },
        update: function(event, ui) {
            var obj = $(this).children('li').eq(0).children('.rightbtn');
            if(obj.hasClass('li-group')){
                var url = '/dir/update_group_sort';
                group_update_sort(obj,url);
            }else if(obj.hasClass('li-dir')){
                var url = '/dir/update_dir_sort';
                update_sort(obj,url);
            }else if(obj.hasClass('li-note')){
                var url = '/dir/update_note_sort';
                update_sort(obj,url);
            }
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

    //邀请协作可拖动位置
    $('.invite-group-warp').draggable({
        accept: ".dialog-header",
        containment:'.dialog-mask',
        scroll: false
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
                drap_dir($(this),ui);
                drapDirId = 0;
            }else if(drapNoteId){
                drap_note($(this),ui);
                drapNoteId = 0;
            }
        }
    });

    //协作drop
    $( "li .li-group" ).droppable({
        accept: ".rightbtn",
        hoverClass: "cur-drap",
        drop: function( event, ui ) {
            if($(this).hasClass('li-trash')) return false;
            $('.ui-widget-header').remove();
            $('.obj-drap').removeClass('obj-drap');
            if(drapDirId){
                drap_dir($(this),ui);
                drapDirId = 0;
            }else if(drapNoteId){
                drap_note($(this),ui);
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
function drap_dir(drapObj , ui){
    var curId = drapObj.data('id');
    var dragId = ui.draggable.data('id');
    var groupId = drapObj.attr('group-id');
    var dragGroupId = ui.draggable.attr('group-id');

    if(curId == dragId) return false;
    if(curId == 0 && groupId > 0){
        var parObj = $(".dir-warp .li-dir[data-id="+dragId+"]").parent('li').parent('ul').prev('div');
        var parentGroupId = parObj.attr('group-id');
        var parentDirId =  parObj.data('id');
        if(groupId == parentGroupId && curId == parentDirId) return false;
        var curObj = $(".dir-warp .li-group[group-id="+groupId+"]");
    }else{
        var parObj = $(".dir-warp .li-dir[data-id="+dragId+"]").parent('li').parent('ul').prev('div');
        var parentGroupId = parObj.attr('group-id');
        var parent_id = parObj.data('id');
        //父元素和要拖放进去的元素相同时
        if(curId == parent_id && groupId == parentGroupId) return false;
        var curObj = $(".dir-warp .li-dir[data-id="+curId+"]");
    }

    if(ui.draggable.hasClass('li-trash')){
        var dragObj = $(".li-trash[data-id="+dragId+"]");
    }else{
        var dragObj = $(".dir-warp .li-dir[data-id="+dragId+"]");
    }

    if(parObj.next('ul').children('li').length <= 1){
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
    set_item_num();
    update_dir_list($(".dir-warp .li-dir[data-id="+dragId+"]"),curId);
}

function get_dir_attr(obj){
    var item = new Array();
    var parent_id = obj.data('id');
    var group_id = obj.attr('group-id');
    var class_id = parseInt(obj.attr('class-id'))+1;
    $(obj).next('ul').children('li').each(function(){
        $(this).attr('class-id',class_id).attr('group-id',group_id);
        item.push([$(this).children('.li-dir').data('id'),class_id,parent_id,$(this).children('.li-dir').children('.name').text(),group_id]);
        if($(this).children('.li-dir').next('ul').length > 0){
            var item_list = get_dir_attr($(this).children('.li-dir'));
            for(var i=0;i<item_list.length;i++){
                item.push(item_list[i]);
            }
        }
    });
    return item;
}