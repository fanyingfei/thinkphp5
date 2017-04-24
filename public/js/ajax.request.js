//创建目录
function create_dir(parent_id,class_id,group_id){
    if(parent_id == -1){
        prompt_msg('error','不能在我的协作组直接新建目录');
        return false;
    }else if(parent_id == -2){
        prompt_msg('error','不能在回收站新建目录');
        return false;
    }
    if($('.item-note .no-item').length > 0 ) $('.no-item').remove();
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
            var obj = $(".dir-warp .li-dir[data-id="+parent_id+"][group-id="+group_id+"]");
            if(obj.next('ul').length > 0) obj.next('ul').append(html);
            else obj.after('<ul>'+html+'</ul>');

            obj.children('.down-btn').addClass('drop-down pack-up').end().next('ul').slideDown('fast');
            obj.parents('ul').slideDown('fast').end().parents('ul').prev('div').children('.down-btn').addClass('drop-down pack-up');

            if(parent_id == $('.dir-warp .curr').data('id')) $('.item-dir').append(html);
            var curObj = $(".dir-warp .li-dir[data-id="+res.result.dir_id+"]");
            create_update_name(curObj);
            change_version(group_id);
            ele_draggable();
        },
        error:function(e){}
    });
}
//创建笔记
function create_note(dir_id,group_id){
    if(dir_id == -1){
        prompt_msg('error','不能在我的协作组直接新建笔记');
        return false;
    }else if(dir_id == -2){
        prompt_msg('error','不能在回收站新建笔记');
        return false;
    }
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
                get_item_list();
            }else if(dir_id == 0 && group_id > 0 && group_id != $('.dir-warp .li-group.curr').attr('group-id')){
                $('.dir-warp .curr').removeClass('curr');
                $('.dir-warp .li-group[group-id='+group_id+']').addClass('curr');
                get_item_list();
                show_note();
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
        async: false,
        dataType:'json',
        success:function(res){
            var obj = res.result;
            var html = '<div class="li-dir li-group sidebar-title my-group-list" group-id="0" data-id="-1">';
            html += '<span class="down-btn';
            if(obj.length > 0) html+= ' drop-down';
            html += '"></span><i class="icon"></i><div class="name">我的协作组</div></div><ul class="sortable">';
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


function auto_update_group(group_id){
    $.ajax({
        url:  '/dir/group_item',
        data:{'group_id':group_id},
        type: "POST",
        dataType:'json',
        success:function(res){
            var obj = res.result;
            var groupId = obj.group_id;
            if($('.group-list li .li-group[group-id='+groupId+']').length == 0) return false;

            var groupObj = $('.group-list .li-group[group-id='+groupId+']');
            var itemObj = $('.item-wrap .li-group[group-id='+groupId+']');

            var html = create_group_html(obj);

            //如果右侧也在的话，把右侧替换掉
            if(itemObj.length > 0) itemObj.parent('li').replaceWith('<li>'+html+'</li>');

            if(obj.dir_list.length > 0) html += create_list(obj.dir_list);

            groupObj.parent('li').replaceWith('<li>'+html+'</li>');

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
function item_group(dir_id,group_id,col,sort){
    var html = '';
    $.ajax({
        url:  '/dir/item_group',
        data:{},
        type: "POST",
        async: false,
        dataType:'json',
        success:function(res){
            var obj = res.result;
            html = '<ul class="item-group sortable">';
            $.each(obj, function(key, v){
                html += '<li>'+create_group_html(v)+'</li>';
            })
            html += '</ul><ul class="item-note"></ul>';
        },
        error:function(e){}
    });
    return html;
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
            html += '<span class="down-btn"></span><i class="icon"></i><div class="name">我的文件夹</div></div>';
            html += create_list(obj);
            $('.dir-list').html(html);

            if($('.my-dir-list').next('ul').children('li').length > 0) $('.my-dir-list').children('.down-btn').addClass('drop-down');

            if($.cookie('currDir') && $.cookie('currGroup')){
                var dir_id = $.cookie('currDir');
                var group_id = $.cookie('currGroup');
            }else{
                var dir_id = 0;
                var group_id = 0;
            }
            var note_id = $.cookie('currNote');

            group_list();

            if(dir_id == -2){
                $('.sidebar-trash .li-dir').addClass('curr');
            }else if(dir_id == -1){
                $('.my-group-list').addClass('curr');
                if($('.my-group-list').next('ul').children('li').length > 0) $('.my-group-list').children('.down-btn').addClass('drop-down pack-up').end().next('ul').slideDown('fast');
            }else{
                var curObj = $('.dir-warp .li-dir[data-id='+dir_id+'][group-id='+group_id+']');
                curObj.addClass('curr');
                if(curObj.next('ul').children('li').length > 0) curObj.children('.down-btn').addClass('drop-down pack-up').end().next('ul').slideDown('fast');
                curObj.parents('ul').slideDown('fast').prev('div').children('.down-btn').addClass('drop-down pack-up');
            }
            get_item_list();
            if(note_id > 0) $('.item-note .li-note[data-id='+note_id+']').addClass('curr');
            show_note();
            flag = true;
        },
        error:function(e){}
    });
    return flag;
}

function get_item_list(){
    $('.item-wrap .widget-scroller-wrap').addClass('loading').children('.scroller-container').hide();
    var group_id = $('.dir-warp .li-dir.curr').attr('group-id');
    var dir_id = $('.dir-warp .li-dir.curr').data('id');
    set_item_search();

    //去除滚动条的影响
    $('.item-list .scroller-container').css("margin-top", 0);
    //得到选择的排序
    var col = $('.setting-sort.selected').data('col');
    var sort = 'desc';
    if($('.setting-sort.selected').hasClass('asc')) sort = 'asc';

    var html = '';
    if(dir_id == -1){
        html = item_group(dir_id,group_id,col,sort);
    }else if(dir_id == -2){
        html = ajax_trash_list();
    }else if(dir_id == 0 && group_id > 0){
        html = item_list_group(dir_id,group_id,col,sort);
    }else{
        html = item_list_dir(dir_id,group_id,col,sort);
    }
    $('.item-wrap .scroller-container').html(html);
    if(dir_id == -2) $('.item-wrap .scroller-container li .rightbtn').addClass('li-trash');
    $('.item-wrap .widget-scroller-wrap').removeClass('loading').children('.scroller-container').slideDown('fast');
    set_item_num();
    no_item_html();
    ele_draggable();
}

function item_list_group(dir_id,group_id,col,sort){
    var html = '';
    $.ajax({
        url:  '/dir/item_list_group',
        data:{'group_id':group_id,'col':col,'sort':sort},
        type: "POST",
        async: false,
        dataType:'json',
        success:function(res){
            var setting = $('.setting-sel.selected').data('value');
            var obj = res.result;
            html = '<ul class="item-dir sortable">';
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
        },
        error:function(e){}
    });
    return html;
}
//中间的目录和笔记列表
function item_list_dir(dir_id,group_id,col,sort){
    var html = '';
    $.ajax({
        url:  '/dir/item_list_dir',
        data:{'dir_id':dir_id,'col':col,'sort':sort,'group_id':group_id},
        type: "POST",
        async: false,
        dataType:'json',
        success:function(res){
            var setting = $('.setting-sel.selected').data('value');
            var obj = res.result;
            html = '<ul class="item-dir sortable">';
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
        },
        error:function(e){}
    });
    return html;
}

//回收站列表
function ajax_trash_list(){
    var html = '';
    $.ajax({
        url:  '/dir/trash_list',
        data:{},
        type: "POST",
        async: false,
        dataType:'json',
        success:function(res){
            var obj = res.result;
            html = create_list(obj.dir,'item');
            html += '<ul class="item-note">';
            $.each(obj.note, function(key, v){
                html += create_note_html(v);
            })
            html += '</ul>';
        },
        error:function(e){}
    });
    return html;
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
            $('.note-detail .note-name').val(obj.name);
            $('.title-wrap').attr('prevalue',obj.name).attr('group-id',obj.group_id).attr('data-id',obj.rec_id);
            $('.note-detail .note-view').html(obj.content).attr('precontent',obj.md5);
            $('.detail-container').removeClass('loading').children().fadeIn('fast');
        },
        error:function(e){}
    });
}
//保存笔记
function save_note(flag){
    var name = $('.note-name').val();
    var rec_id = $('.title-wrap').attr('data-id');
    var group_id = $('.title-wrap').attr('group-id');
    var content = $('#wangDemo').html();
    var precont = $('#wangDemo').attr('precontent');
    if(name == '') return false;
    $.ajax({
        url:  '/dir/note_update',
        data:{'name':name,'content':content,'rec_id':rec_id,'precont':precont,'group_id':group_id},
        type: "POST",
        dataType:'json',
        success:function(obj){
            if(!flag && obj.status == 'succ') prompt_msg('success','自动保存成功');
            if(flag && obj.status == 'succ') prompt_msg('success',obj.msg);
            if(obj.status == 'error'){
                prompt_msg('error',obj.msg);
                return false;
            }

            $('#wangDemo').attr('precontent',obj.result);
            if($(".li-note[data-id="+rec_id+"] .name").text() != name) $(".li-note[data-id="+rec_id+"] .name").html(name);
        },
        error:function(e){}
    });
}
//拖放笔记
function drap_note(curObj,ui){
    var dragId = ui.draggable.data('id');
    var cur_group = ui.draggable.attr('group-id');
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
        data:{'rec_id':dragId , 'dir_id':curr_dir_id,'group_id':groupId,'cur_group':cur_group},
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
function update_dir_list(curObj,parObj,cur_group){
    //cur_group是拖动前的group-id
    var objName = curObj.children('.name').eq(0).text();
    var group_id = parObj.attr('group-id');
    var parent_id = parObj.data('id');
    var class_id = parseInt(parObj.attr('class-id'))+1;
    var parentName = parObj.children('.name').eq(0).text();
    curObj.attr('class-id',class_id).attr('group-id',group_id);
    var cur_dir = curObj.data('id');
    var cur_item = [cur_dir,class_id,parent_id,curObj.children('.name').eq(0).text(),group_id];
    var list = get_dir_attr(curObj);
    list.push(cur_item);
    $.ajax({
        url:  '/dir/update_drap_dir',
        data:{'list':list,'cur_dir':cur_dir,'parent_id':parent_id,'group_id':group_id,'cur_group':cur_group,'parent_name':parentName,'cur_name':objName},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                ajax_error(res);
                return false;
            }
            if(group_id == cur_group){
                change_version(group_id);
            }else if(group_id == 0 && cur_group > 0){
                change_version(cur_group);
            }else if(group_id > 0 && cur_group == 0){
                change_version(group_id);
            }else if(group_id > 0 && cur_group > 0){
                change_version(group_id);
                change_version(cur_group);
            }
            no_item_html();
        },
        error:function(e){}
    });
}
//删除目录或者笔记
function ajax_delete_btn(url,ids,delObj,groupId){
    var name = delObj.children('div').children('.name').eq(0).text();
    $.ajax({
        url:  url,
        data:{'id':ids,'group_id':groupId,'name':name},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                ajax_error(res);
                return false;
            }
            if(res.result == 'dir'){
                var dir_id = delObj.children('div').data('id');
                //当前选中的文件夹被删除后，item那列置为空
                if(dir_id == $('.dir-warp .li-dir.curr').data('id')) $('.item-wrap .scroller-container ul').html('');
                var parObj = $(".dir-warp .li-dir[data-id="+dir_id+"]").parent('li');
                if(parObj.siblings('li').length == 0){
                    parObj.parent('ul').prev('div').children('.down-btn').removeClass('drop-down pack-up');
                    parObj.parent('ul').remove();
                }
                change_version(groupId);
            }
            if($('.my-trash').hasClass('curr')) get_item_list();
            delObj.remove();
            set_item_num();
            ele_draggable();
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
function ajax_trash_btn(url,ids,delObj,group_id){
    var name = delObj.children('div').children('.name').eq(0).text();
    var cur_dir = delObj.children('div').data('id');
    $.ajax({
        url:  url,
        data:{'id':ids,'group_id':group_id,'name':name,'cur_dir':cur_dir},
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
                if(parent_id == 0 && group_id > 0){
                    var parObj = $(".dir-warp .li-group[group-id=" + group_id + "]");
                }else{
                    var parObj = $(".dir-warp .li-dir[data-id=" + parent_id + "]");
                }
                var html = delObj.prop("outerHTML");
                if (parObj.next('ul').length > 0) {
                    parObj.next('ul').append(html);
                } else {
                    parObj.after('<ul>' + html + '</ul>');
                }
                parObj.children('.down-btn').addClass('drop-down pack-up');
                parObj.next('ul').slideDown('fast').end().parents('ul').slideDown('fast').end().parents('ul').prev('div').children('.down-btn').addClass('drop-down pack-up');
                change_version(group_id);
            }
            trash_change(delObj,ids,data.type);
            ele_draggable();
        },
        error:function(e){}
    });
}
//回收站彻底删除
function ajax_trash_delete(url,ids,delObj){
    var group_id = delObj.children('div').attr('group-id');
    $.ajax({
        url:  url,
        data:{'id':ids,'group_id':group_id},
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
            if($('.my-trash').hasClass('curr')){
                $('.item-wrap .scroller-container ul').html('');
                set_item_num();
                no_item_html();
            }
        },
        error:function(e){}
    });
}
//排序
function ajax_update_sort(url,list,group_id,parent_name){
    $.ajax({
        url:  url,
        data:{'list':list,'group_id':group_id,'parent_name':parent_name},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                ajax_error(res);
                return false;
            }
            if(res.result == 'dir') change_version(group_id);
        },
        error:function(e){}
    });
}
//目录或者笔记改名字
function ajax_update_name(url,name,id,prename,group_id){
    $.ajax({
        url:  url,
        data:{'name':name,'id':id,'prename':prename,'group_id':group_id},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                ajax_error(res);
                return false;
            }
            if(res.result == 'dir') change_version(group_id);
        },
        error:function(e){}
    });
}
//搜索文章方法
function search_note(){
    var search = $('.search-input').val();
    set_item_search();
    if($.trim(search) == ''){
        get_item_list();
        show_note();
        return false;
    }
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
//轮询
function ajax_polling(){
    $.ajax({
        url:  '/dir/polling_info',
        data:{},
        type: "POST",
        dataType:'json',
        success:function(res){
            var obj = res.result;
            if(obj.invite_list.length > 0){
                var html = '';
                if($('.invite-item').length == 0){
                    $('.my-invite-list').html('');
                    html = '<div class="invite-list-title"><span>邀请列表</span><span class="zoom-btn zoom-out">+</span><span class="zoom-btn zoom-in">-</span></div>';
                }
                $.each(obj.invite_list , function(k,v){
                    if($('.invite-item[group-id='+ v.group_id+']').length > 0) return true;
                    html += '<div class="invite-item" group-id="'+ v.group_id+'"><p><span>'+ v.user_name+'</span>邀请你加入<span>'+ v.group_name+'</span></p>' +
                    '<div><span class="yes">同意</span><span class="no">拒绝</span></div></div>';
                })
                $('.my-invite-list').append(html).show();
            }
            if(obj.group_list.length > 0){
                $.each(obj.group_list , function(k,v){
                    var groupObj = $('.group-list li .li-group[group-id='+ v.group_id+']');
                    if(groupObj.length == 0) return true;
                    if(groupObj.length > 0 && groupObj.attr('version') != v.version){
                        auto_update_group(v.group_id);
                    }
                })
            }
            setTimeout("ajax_polling()",30000);
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
                prompt_msg('success','同意邀请，可在我的协作组里查看');
                group_list();
            }
            if($('.invite-item').length == 0) $('.my-invite-list').html('');
        },
        error:function(e){}
    });
}

//展示笔记
function show_note(){
    //没有任何笔记时
    if($('.item-note li').length == 0){
        empty_note();
        return false;
    }

    if($('.detail-container').hasClass('empty')){
        $('.detail-container .empty-img').remove();
        $('.detail-container').removeClass('empty');
    }

    $('.detail-container').addClass('loading').children().hide();

    //有笔记时
    if($('.item-note .li-note.curr').length > 0){
        var rec_id = $('.item-note .li-note.curr').data('id')
    }else if($.cookie('currNote') && $('.item-note .li-note[data-id='+$.cookie('currNote')+']').parents('.item-list').length>0
        && $('.dir-list .li-dir.curr').data('id') == $('.item-list').attr('parent-id')){
        var rec_id = $.cookie('currNote');
    }else{
        var rec_id = $('.item-note li:first-child .li-note').data('id');
    }

    $('.item-note .li-note[data-id='+rec_id+']').addClass('curr');
    ajax_show_note(rec_id);
}

function change_version(group_id){
    if(group_id <= 0) return false;
    var obj = $('.group-list .li-group[group-id='+group_id+']');
    obj.attr('version',parseInt(obj.attr('version')) + 1);
}

function set_item_search(){
    var dir_id = $('.dir-warp .li-dir.curr').data('id');
    var group_id = $('.dir-warp .li-dir.curr').attr('group-id');

    if(dir_id <= 0 && group_id == 0){
        $('.item-back').addClass('disabled');
    }else{
        $('.item-back').removeClass('disabled');
    }
    if(dir_id >= 0){
        $('.item-setting').removeClass('disabled');
    }else{
        $('.item-setting').addClass('disabled');
    }
}

function set_item_num(){
    $('.item-num span').html($('.item-wrap .scroller-container > ul > li').length);
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
    no_item_html();
}

function ajax_error(res){
    if(res.msg == 'nologin'){
        window.location.href='/login';
    }else{
        prompt_msg('error',res.msg);
    }
}

function prompt_msg(status,msg,$flag){
    if($('.hint-container').length > 0){
        $('.hint-container').remove();
    }
    var html = '<div class="hint-container"><div class="widget-hint"><p class="'+status+'">' +
        '<span class="icon-hint"></span><span class="hint-msg">'+msg+'</span></p></div></div>';

    if($flag !== undefined){
        $('.detail-container').append(html);
    }else{
        $('body').append(html);
    }
    var obj = $('.hint-container');
    obj.fadeIn(500);
    setTimeout(function(){
        obj.fadeOut(500,function(){
            if(obj != undefined) obj.remove();
        });
    },3000);
}