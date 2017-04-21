//创建目录
function create_dir(parent_id,class_id,group_id){
    $.ajax({
        url:  '/dir/create_dir',
        data:{'parent_id':parent_id,'class_id':class_id,'group_id':group_id},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                ajax_error(res);
                return false;
            }
            var html = '<li>'+create_dir_html(res.result, 0)+'</li>';
            if(parent_id == 0 && group_id > 0){
                var obj = $(".group-list .li-group[group-id="+group_id+"]");
            }else{
                var obj = $(".dir-list .li-dir[data-id="+parent_id+"]");
            }
            if(obj.next('ul').length > 0) obj.next('ul').append(html);
            else obj.after('<ul>'+html+'</ul>');

            obj.children('.down-btn').addClass('drop-down pack-up');
            obj.next('ul').slideDown('fast');
            obj.parents('ul').slideDown('fast').end().parents('ul').prev('div').children('.down-btn').addClass('drop-down pack-up');
            $('.item-note .no-item').remove();
            if(parent_id == $('.item-list').attr('parent-id')) $('.item-dir').append(html);
            var curObj = $(".dir-warp .li-dir[data-id="+res.result.dir_id+"]");
            create_update_name(curObj);
            ele_draggable();
        },
        error:function(e){}
    });
}
//创建笔记
function create_note(dir_id,group_id){
    if($('.item-list .no-item').length > 0) $('.item-list .no-item').remove();
    $.ajax({
        url:  '/dir/note_create',
        data:{'dir_id':dir_id,'group_id':group_id},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                ajax_error(res);
                return false;
            }
            var obj = res.result;
            //不是当前选中的文件夹创建笔记时，要把这个文件夹选中
            if(group_id == 0 && dir_id != $('.dir-warp .li-dir.curr').data('id')){
                $('.dir-warp .curr').removeClass('curr');
                $('.dir-warp .li-dir[data-id='+dir_id+']').addClass('curr');
                //得到item列表后把新建的笔记设置选中
                item_list_dir();
            }else if(dir_id == 0 && group_id > 0 && group_id != $('.dir-warp .li-group.curr').attr('group-id')){
                $('.dir-warp .curr').removeClass('curr');
                $('.dir-warp .li-group[group-id='+group_id+']').addClass('curr');
                item_list_group();
            }else{
                if($('.item-note li').length > 0){
                    $('.item-note li:first-child').before(create_note_html(obj));
                }else{
                    $('.item-note').prepend(create_note_html(obj));
                }
            }
            $('.li-note.curr').removeClass('curr');
            $('.li-note[data-id='+obj.rec_id+']').addClass('curr');
            show_note();
            ele_draggable();
        },
        error:function(e){}
    });
}
function create_group(){
    $.ajax({
        url:  '/dir/create_group',
        data:{},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                ajax_error(res);
                return false;
            }
            var html = '<li>'+create_group_html(res.result)+ '</li>';
            $('.group-list').children('ul').append(html);
            if($('.my-group-list').hasClass('curr')){
                $('ul.item-group').html(html);
                set_item_num();
                no_item_html();
            }
            $('.my-group-list .down-btn').addClass('drop-down pack-up');
            $('.group-list').children('ul').slideDown('fast');
            var curObj = $(".dir-warp .li-group[group-id="+res.result.group_id+"]");
            create_update_name(curObj);
            ele_draggable();
        },
        error:function(e){}
    });
}
//组
function group_list(){
    $.ajax({
        url:  '/dir/group_list',
        data:{},
        type: "POST",
        dataType:'json',
        success:function(res){
            var obj = res.result;
            var html = '<div class="li-group sidebar-title my-group-list" group-id="0" data-id="-1">';
            html += '<span class="down-btn';
            if(obj.length > 0) html+= ' drop-down';
            html += '"></span><i class="icon"></i>&nbsp;&nbsp;我的协作</div><ul class="sortable">';
            $.each(obj, function(key, v){
                html += '<li>'+create_group_html(v);
                if(v.dir_list != '') html += create_list(v.dir_list);
                html += '</li>';
            })
            html += '</ul>';
            $('.group-list').html(html);
            ele_draggable();
        },
        error:function(e){}
    });
}
function invite_group(phone,group_id,again){
    $.ajax({
        url:  '/dir/invite_group',
        data:{'phone':phone,'group_id':group_id,'again':again},
        type: "POST",
        dataType:'json',
        success:function(res){
            $('.invite-msg').html(res.msg);
            if(res.status == 'error'){
                $('.dialog-body').addClass('warning');
            }else{
                $('.dialog-body').addClass('success');
            }
            if(res.result == 1){
                $('.invite-btn').text('再次邀请');
                $('.invite-group-warp').attr('again',1);
            }else{
                $('.invite-btn').text('邀请');
                $('.invite-group-warp').attr('again',0);
            }
        },
        error:function(e){}
    });
}
function item_group(){
    $('.item-wrap .widget-scroller-wrap').addClass('loading').children('.scroller-container').hide();
    //去除滚动条的影响
    $('.item-list .scroller-container').css("margin-top", 0);
    set_item_hd(0,'group');
    $.ajax({
        url:  '/dir/item_group',
        data:{},
        type: "POST",
        dataType:'json',
        success:function(res){
            var obj = res.result;
            var html = '<ul class="item-group sortable">';
            $.each(obj, function(key, v){
                html += '<li>'+create_group_html(v)+'</li>';
            })
            html += '</ul>';
            $('.item-wrap .scroller-container').html(html);
            set_item_num();
            no_item_html();
            ele_draggable();
        },
        error:function(e){}
    });
}
//目录列表
function dir_list(){
    var flag = false;
    $.ajax({
        url:  '/dir/dir_list',
        data:{},
        type: "POST",
        async: false,
        dataType:'json',
        success:function(res){
            var obj = res.result;
            var html = '<div class="li-dir sidebar-title my-dir-list" group-id="0" class-id="0" data-id="0">';
            html += '<span class="down-btn';
            if(obj.length > 0) html+= ' drop-down pack-up';
            html += '"></span><i class="icon"></i>&nbsp;&nbsp;我的文件夹</div>';
            html += create_list(obj);
            $('.dir-list').html(html);
            if($.cookie('currDir')){
                var dir_id = $.cookie('currDir');
                $('.dir-list .li-dir[data-id='+dir_id+']').parents('ul').show();
                $('.dir-list .li-dir[data-id='+dir_id+']').parents('ul').prev('.li-dir').children('.down-btn').addClass('pack-up');
            }else{
                var dir_id = 0;
            }

            $('.dir-list .li-dir[data-id='+dir_id+']').addClass('curr');
            $('.item-list').attr('parent-id',dir_id);
            item_list_dir();
            show_note();
            flag = true;
        },
        error:function(e){}
    });
    return flag;
}
function item_list_group(){
    $('.item-wrap .widget-scroller-wrap').addClass('loading').children('.scroller-container').hide();
    var group_id = $('.li-group.curr').attr('group-id');
    var dir_id = $('.li-group.curr').data('id');
    if(group_id == undefined){
        group_id = $('.group-list .li-group:first-child').attr('group-id');
        $(".group-list .li-group[group-id="+group_id+"]").addClass('curr');
    }
    set_item_hd(dir_id,'group');
    //去除滚动条的影响
    $('.item-list .scroller-container').css("margin-top", 0);
    //得到选择的排序
    var col = $('.setting-sort.selected').data('col');
    var sort = 'desc';
    if($('.setting-sort.selected').hasClass('asc')) sort = 'asc';

    $.ajax({
        url:  '/dir/item_list_group',
        data:{'group_id':group_id,'col':col,'sort':sort},
        type: "POST",
        async: false,
        dataType:'json',
        success:function(res){
            var setting = $('.setting-sel.selected').data('value');
            var obj = res.result;
            var html = '<ul class="item-dir sortable">';
            if(setting == 'all') {
                $.each(obj.dir, function (key, v) {
                    html += '<li>' + create_dir_html(v, 0) + '</li>';
                })
            }
            html += '</ul><ul class="item-note sortable">';
            $.each(obj.note, function(key, v){
                html += create_note_html(v);
            })
            html += '</ul>';
            $('.item-wrap .scroller-container').html(html);
            set_item_num();
            no_item_html();
            show_note();
            ele_draggable();
        },
        error:function(e){}
    });
}
//中间的目录和笔记列表
function item_list_dir(){
    $('.item-wrap .widget-scroller-wrap').addClass('loading').children('.scroller-container').hide();
    var id = $('.li-dir.curr').data('id');
    if(id == undefined){
        id = $('.dir-list .li-dir:first-child').data('id');
        $(".dir-list .li-dir[data-id="+id+"]").addClass('curr');
    }
    var group_id =$('.li-dir.curr').attr('group-id');
    if(group_id > 0 ) var click_type = 'group';
    else var click_type = 'item';
    set_item_hd(id,click_type);
    //去除滚动条的影响
    $('.item-list .scroller-container').css("margin-top", 0);
    //得到选择的排序
    var col = $('.setting-sort.selected').data('col');
    var sort = 'desc';
    if($('.setting-sort.selected').hasClass('asc')) sort = 'asc';

    $.ajax({
        url:  '/dir/item_list_dir',
        data:{'dir_id':id,'col':col,'sort':sort,'group_id':group_id},
        type: "POST",
        async: false,
        dataType:'json',
        success:function(res){
            var setting = $('.setting-sel.selected').data('value');
            var obj = res.result;
            var html = '<ul class="item-dir sortable">';
            if(setting == 'all'){
                $.each(obj.dir, function(key, v){
                    html += '<li>'+create_dir_html(v,0)+'</li>';
                })
            }
            html += '</ul><ul class="item-note sortable">';
            $.each(obj.note, function(key, v){
                html += create_note_html(v);
            })
            html += '</ul>';
            $('.item-wrap .scroller-container').html(html);
            set_item_num();
            no_item_html();
            $('.item-wrap .widget-scroller-wrap').removeClass('loading').children('.scroller-container').slideDown('fast');
            ele_draggable();
        },
        error:function(e){}
    });
}

//回收站列表
function ajax_trash_list(){
    set_item_hd(0,'trash');
    $.ajax({
        url:  '/dir/trash_list',
        data:{},
        type: "POST",
        async: false,
        dataType:'json',
        success:function(res){
            var obj = res.result;
            var html = create_list(obj.dir,'item');
            html += '<ul class="item-note">';
            $.each(obj.note, function(key, v){
                html += create_note_html(v);
            })
            html += '</ul>';
            $('.item-wrap .scroller-container').html(html);
            $('.item-wrap .rightbtn').addClass('li-trash');
            set_item_num();
            no_trash_html();
            ele_draggable();
        },
        error:function(e){}
    });
}

//展示笔记
function ajax_show_note(rec_id){
    $.ajax({
        url:  '/dir/note_item',
        data:{'rec_id':rec_id},
        type: "POST",
        dataType:'json',
        success:function(res){
            var obj = res.result;
            if(!obj) return false;
            $('#note-id').val(obj.rec_id);
            $('.note-detail .title').val(obj.title).attr('prevalue',obj.title);
            $('.note-detail .note-view').html(obj.content).attr('precontent',obj.md5);
            $('.detail-container').removeClass('loading').children().fadeIn('fast');
        },
        error:function(e){}
    });
}
//保存笔记
function save_note(flag){
    var title = $('.title').val();
    var rec_id = $('#note-id').val();
    var content = $('#wangDemo').html();
    var precont = $('#wangDemo').attr('precontent');
    if(title == '') return false;
    $.ajax({
        url:  '/dir/note_update',
        data:{'title':title,'content':content,'rec_id':rec_id,'precont':precont},
        type: "POST",
        dataType:'json',
        success:function(obj){
            if(flag) alert(obj.msg);
            if(obj.status == 'error') return false;
            if(!flag && obj.status == 'succ') alert_msg('success','自动保存成功');
            $('#wangDemo').attr('precontent',obj.result);
            if($(".li-note[data-id="+rec_id+"] .name").text() != title) $(".li-note[data-id="+rec_id+"] .name").html(title);
        },
        error:function(e){}
    });
}
//拖放笔记
function drap_note(curObj,ui){
    var dragId = ui.draggable.data('id');
    var parent_id = $('.item-list').attr('parent-id');
    var curr_dir_id = curObj.data('id');
    var groupId = curObj.attr('group-id');
    if(curr_dir_id == parent_id) return false;
    $('.li-note[data-id='+dragId+']').parent().remove();
    ui.draggable.remove();//删除通过jquery-ui手动的元素
    set_item_num();
    no_item_html();
    $.ajax({
        url:  '/dir/update_drap_note',
        data:{'rec_id':dragId , 'dir_id':curr_dir_id,'group_id':groupId},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                ajax_error(res);
                return false;
            }
        },
        error:function(e){}
    });
}
//目录排序
function update_dir_list(obj,parent_id){
    var parent = obj.parent('li').parent('ul').prev('div');
    var group_id = parent.attr('group-id');
    if(group_id > 0){
        obj.addClass('item-group');
    }else{
        obj.removeClass('item-group');
    }
    var class_id = parseInt(parent.attr('class-id'))+1;
    obj.attr('class-id',class_id).attr('group-id',group_id);
    var cur_item = [obj.data('id'),class_id,parent.data('id'),obj.children('.name').text(),group_id];
    var list = get_dir_attr(obj);
    list.push(cur_item);
    $.ajax({
        url:  '/dir/update_drap_dir',
        data:{'list':list,'parent_id':parent_id,'group_id':group_id},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                ajax_error(res);
                return false;
            }
            no_item_html();
        },
        error:function(e){}
    });
}
//删除目录或者笔记
function ajax_delete_btn(url,ids,delObj){
    $.ajax({
        url:  url,
        data:{'id':ids},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                ajax_error(res);
                return false;
            }
            var id = delObj.children('.rightbtn').data('id');
            if(res.result == 'dir'){
                //当前选中的文件夹被删除后，item那列置为空
                if(id == $('.dir-list .li-dir.curr').data('id')) $('.item-wrap .scroller-container ul').html('');
                var parObj = $(".dir-list .li-dir[data-id="+id+"]").parent('li');
                if(parObj.siblings('li').length == 0){
                    parObj.parent('ul').prev('.li-dir').children('.down-btn').removeClass('drop-down pack-up');
                    parObj.parent('ul').remove();
                }
                if($('.sidebar-trash').hasClass('curr')){
                    ajax_trash_list();
                    show_note();
                }
            }
            delObj.remove();
            set_item_num();
            no_item_html();
        },
        error:function(e){}
    });
}
//删除协作
function ajax_delete_group(group_id){
    $.ajax({
        url:  '/dir/delete_group',
        data:{'group_id':group_id},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                ajax_error(res);
                return false;
            }
            var delObj = $(".group-list .li-group[group-id="+group_id+"]").parent('li');
            if(delObj.siblings('li').length == 0){
                $('.my-group-list').children('.down-btn').removeClass('drop-down pack-up');
                delObj.parent('ul').remove();
            }
            delObj.remove();
            set_item_num();
            no_item_html();
        },
        error:function(e){}
    });
}
//恢复回收站
function ajax_trash_btn(url,ids,delObj){
    $.ajax({
        url:  url,
        data:{'id':ids},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                ajax_error(res);
                return false;
            }
            var data = res.result;
            if(data.type == 'dir') {
                delObj.find('.rightbtn').removeClass('li-trash');
                var parent_id = data.parent_id;
                var dir_id = delObj.children('.rightbtn').data('id');
                var parObj = $(".dir-list .li-dir[data-id=" + parent_id + "]");
                var html = delObj.prop("outerHTML");
                if (parObj.next('ul').length > 0) {
                    parObj.next('ul').append(html);
                } else {
                    parObj.after('<ul>' + html + '</ul>');
                    parObj.children('.down-btn').addClass('drop-down');
                }
                parObj.next('ul').slideDown('fast');
            }
            trash_change(delObj,ids,data.type);
        },
        error:function(e){}
    });
}
//回收站彻底删除
function ajax_trash_delete(url,ids,delObj){
    $.ajax({
        url:  url,
        data:{'id':ids},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                ajax_error(res);
                return false;
            }
            trash_change(delObj,ids,res.result);
        },
        error:function(e){}
    });
}
//清空回收站
function ajax_trash_all(){
    $.ajax({
        url: '/dir/trash_all',
        data:{},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                ajax_error(res);
                return false;
            }
            if($('.sidebar-trash').hasClass('curr')){
                $('.item-wrap .scroller-container ul').html('');
                set_item_num();
                no_trash_html();
            }
        },
        error:function(e){}
    });
}
//排序
function ajax_update_sort(url,list){
    $.ajax({
        url:  url,
        data:{'list':list},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                ajax_error(res);
                return false;
            }
        },
        error:function(e){}
    });
}
//目录或者笔记改名字
function ajax_update_name(url,name,id){
    $.ajax({
        url:  url,
        data:{'name':name,'id':id},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                ajax_error(res);
                return false;
            }
        },
        error:function(e){}
    });
}
//搜索文章方法
function search_note(){
    var search = $('.search-input').val();
    if($.trim(search) == ''){
        item_list_dir();
        return false;
    }
    set_item_hd(0,'search');
    $.ajax({
        url:  '/dir/note_search',
        data:{'search':search},
        type: "POST",
        dataType:'json',
        success:function(obj){
            var html = '<ul class="item-note sortable">';
            if(obj.result.length == 0){
                html += '<div class="no-item">搜索结果为空</div>';
            }else{
                $.each(obj.result, function(key, v){
                    html += create_note_html(v);
                })
            }
            $('.item-wrap .scroller-container').html(html+'</ul>');
            $('.item-note .li-note').addClass('li-search');
            set_item_num();
            show_note();
        },
        error:function(e){}
    });
}

function get_user_info(){
    $.ajax({
        url:  '/user/user_info',
        data:{},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error') return false;
            var obj = res.result;
            $('.user-name').text(obj.user_name);
        },
        error:function(e){}
    });
}
//得到我的邀请
function get_invite_group(){
    $.ajax({
        url:  '/dir/my_invite_group',
        data:{},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.result <= 0){
                setTimeout("get_invite_group()",600000);
                return false;
            }
            var html = '';
            if($('.invite-item').length == 0){
                $('.my-invite-list').html('');
                html = '<div class="invite-list-title"><span>邀请列表</span><span class="zoom-btn zoom-out">+</span><span class="zoom-btn zoom-in">-</span></div>';
            }
            $.each(res.result , function(k,v){
                if($('.invite-item[group-id='+ v.group_id+']').length > 0) return true;
                html += '<div class="invite-item" group-id="'+ v.group_id+'"><p><span>'+ v.user_name+'</span>邀请你加入<span>'+ v.group_name+'</span></p>' +
                '<div><span class="yes">同意</span><span class="no">拒绝</span></div></div>';
            })
            $('.my-invite-list').append(html).show();
            setTimeout("get_invite_group()",30000);
        },
        error:function(e){}
    });
}
//同意邀请或者拒绝邀请
function invite_agree_refuse(group_id,invite){
    $.ajax({
        url:  '/dir/invite_agree_refuse',
        data:{'group_id':group_id,'invite':invite},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                ajax_error(res);
                return false;
            }
            $('.invite-item[group-id='+group_id+']').remove();
            if(invite == 1){
                prompt_msg('success','你已经拒绝了该邀请');
            }else if(invite == 2){
                prompt_msg('success','同意邀请，可在我的协作里查看');
                group_list();
            }
            if($('.invite-item').length == 0) $('.my-invite-list').html('');
        },
        error:function(e){}
    });
}

function set_item_hd(id,type){
    $('.item-list').attr('parent-id',id).attr('type',type);
    if(id != 0){
        $('.item-back').removeClass('disabled');
    }else{
        $('.item-back').addClass('disabled');
    }
    if(type=='item' || (type == 'group' && id != 0)){
        $('.item-setting').removeClass('disabled');
    }else{
        $('.item-setting').addClass('disabled');
    }
}

function set_item_num(){
    $('.item-num span').html($('.item-wrap .rightbtn').length);
    $('.item-wrap .widget-scroller-wrap').removeClass('loading').children('.scroller-container').slideDown('fast');
}

function trash_change(delObj,delList,type){
    if(type == 'dir'){
        $.each(delList , function(k,v){
            var parent_id = v[0] == undefined ? v : v[0];
            $('.item-note .li-trash[parent-id="'+parent_id+'"]').parent('li').remove();
        })
    }
    delObj.remove();
    set_item_num();
    no_trash_html();
}

function ajax_error(res){
    if(res.msg == 'nologin'){
        window.location.href='/login';
    }else{
        prompt_msg('error',res.msg);
    }
}

function prompt_msg(status,msg){
    if($('.hint-container').length > 0){
        $('.hint-container').remove();
    }
    var html = '<div class="hint-container"><div class="widget-hint"><p class="'+status+'"><span class="icon-hint"></span><span class="hint-msg">'+msg+'</span></p></div></div>';

    $('body').append(html);
    var obj = $('.hint-container');
    obj.fadeIn(500);
    setTimeout(function(){
        obj.fadeOut(500,function(){
            if(obj != undefined) obj.remove();
        });
    },2000);
}