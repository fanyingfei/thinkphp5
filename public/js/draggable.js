function ele_draggable(){
    //目录拖放
    $('.li-dir').draggable({
        scroll: false,
        appendTo: "body",
        distance:10,
        cancel: "i.right-menu,.li-group,.sidebar-title,.rename-input,.li-trash",
        cursorAt: { top: 10, left: 10},
        helper: function( e ) {
            return $( "<img class='ui-widget-header' src='/img/drap_dir.png' />" );
        },
        start: function() {
            $(this).addClass('obj-drap');
        },
        stop: function() {
            $('.obj-drap').removeClass('obj-drap');
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
            var obj = $(this).children('li').eq(0).children('div');
            var dirId = obj.data('id');
            var groupId = obj.attr('group_id');

            if(obj.hasClass('li-group')){
                var url = '/dir/update_group_sort';
                var comObj = obj;
                var parentName = $('.my-group-list').children('.name').text();
            }else if(obj.hasClass('li-dir')){
                var url = '/dir/update_dir_sort';
                var comObj = $(".dir-list .li-dir[data-id="+dirId+"]");
                var parentName = comObj.parent('li').parent('ul').prev('div').children('.name').text();
            }else if(obj.hasClass('li-note')){
                var url = '/dir/update_note_sort';
                var comObj = obj;
                var parentName = $('.dir-warp .curr').children('.name').text();
            }else{
                return false;
            }
            update_sort(comObj,url,parentName);
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
            $(this).addClass('obj-drap');
        },
        stop: function() {
            $('.obj-drap').removeClass('obj-drap');
        }
    });

    //弹框可拖动位置
    $('.dialog-warp').draggable({
        accept: ".dialog-header",
        cancel: ".dialog-body",
        containment:'.dialog-mask',
        scroll: false
    });

    //目录drop
    $( "li .li-dir , .my-dir-list" ).droppable({
        accept: function(e) {
            if(e.hasClass("rightbtn") && !e.hasClass("li-trash")){
                return true;
            }
        },
    //    accept: ".rightbtn",
        hoverClass: "cur-drap",
        drop: function( event, ui ) {
            if($(this).hasClass('li-trash')) return false;
            var obj = ui.draggable;
            if(obj.attr('group-id') > 0 && obj.attr('group-id') != $(this).attr('group-id')){
                prompt_msg('error','协作内的文件只能在协作组内拖动');
                return false;
            }
            $('.ui-widget-header').remove();
            $('.obj-drap').removeClass('obj-drap');
            if(obj.hasClass('li-dir')){
                drap_dir($(this),ui);
            }else if(obj.hasClass('li-note')){
                drap_note($(this),ui);
            }
        }
    });


    //回收站
    $( ".my-trash" ).droppable({
        accept: ".rightbtn",
        hoverClass: "cur-drap",
        drop: function( event, ui ) {
            $('.ui-widget-header').remove();
            $('.obj-drap').removeClass('obj-drap');
            var obj = ui.draggable;
            var rec_id = obj.data('id');
            var group_id = obj.attr('group-id');
            if(obj.hasClass('li-dir')){
                var url = '/dir/delete_dir';
                var resObj = $(".li-dir[data-id="+rec_id+"]").parent('li');
                var delObj = $(".dir-warp .li-dir[data-id="+rec_id+"]");
                var groupId = delObj.attr('group-id');
                var list = get_dir_list(delObj);
                list.push(rec_id);
                ajax_delete_btn(url,list,resObj,groupId);
            }else if(obj.hasClass('li-note')){
                var url = '/dir/delete_note';
                var resObj = $(".li-note[data-id="+rec_id+"]").parent('li');
                var groupId = resObj.attr('group-id');
                ajax_delete_btn(url,rec_id,resObj,groupId);
            }
        }
    });

}


//拖放目录
function drap_dir(drapObj , ui){
    var draptId = drapObj.data('id');
    var dragId = ui.draggable.data('id');
    var drapGroupId = drapObj.attr('group-id');
    var dragGroupId = ui.draggable.attr('group-id');

    if(draptId == dragId && drapGroupId == dragGroupId) return false;

    var parObj = $(".dir-warp .li-dir[data-id="+dragId+"][group-id="+dragGroupId+"]").parent('li').parent('ul').prev('div');//被拖动元素的父元素
    var parentGroupId = parObj.attr('group-id');
    var parentDirId =  parObj.data('id');

    if(draptId == parentDirId && drapGroupId == parentGroupId) return false;

    var curObj = $(".dir-warp .li-dir[data-id="+draptId+"][group-id="+drapGroupId+"]");//要拖到的目标元素
    var dragObj = $(".dir-warp .li-dir[data-id="+dragId+"][group-id="+dragGroupId+"]");
    var comDragObj = $(".li-dir[data-id="+dragId+"][group-id="+dragGroupId+"]");

    if(parObj.next('ul').children('li').length <= 1){
        //这时拖放的元素还没有删除，所以是 <=1
        parObj.children('.down-btn').removeClass('drop-down pack-up');
    }

    //UL下没有li的清除掉
    if(curObj.next('ul').children('li').length == 0) curObj.next('ul').remove();

    comDragObj.attr('group-id',drapGroupId).next('ul').find('.rightbtn').attr('group-id',drapGroupId);

    var html = comDragObj.parent().prop("outerHTML");

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
        //拖放进的目录是选中时右侧增加
        $(".item-dir").append(html);
    }else if(dragObj.hasClass('curr')){
        curObj.next('ul').show();
    }
    //如果是回收站拖进来的清除掉回收站的CLASS标签
    $('.dir-warp .li-trash').removeClass('li-trash');

    //新添加后重新获得元素
    var drapAfterObj = $(".dir-warp .li-dir[data-id="+dragId+"]");
    ele_draggable();//新添加的元素也可以拖放
    set_item_num();
    //dragGroupId传过去，因为重新添加后group-id已经改变了
    update_dir_list(drapAfterObj,drapObj,dragGroupId);
}

function get_dir_attr(obj){
    var item = new Array();
    var parent_id = obj.data('id');
    var group_id = obj.attr('group-id');
    var class_id = parseInt(obj.attr('class-id'))+1;

    obj.next('ul').children('li').each(function(){
        $(this).attr('class-id',class_id);
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