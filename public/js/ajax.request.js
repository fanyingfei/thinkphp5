//创建目录
function create_dir(parent_id,class_id){
    $.ajax({
        url:  '/dir/create_dir',
        data:{'parent_id':parent_id,'class_id':class_id},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                alert(res.msg);
                return false;
            }
            var html = '<li>'+create_dir_html(res.result, 0)+'</li>';
            var obj = $(".dir-list .li-dir[data-id="+parent_id+"]");
            if(obj.next('ul').length > 0) obj.next('ul').append(html);
            else obj.after('<ul>'+html+'</ul>');

            obj.children('.down-btn').addClass('drop-down pack-up');
            obj.next('ul').show();
            if(parent_id == $('.item-list').attr('parent-id')) $('.item-dir').append(html);
            var curObj = $(".dir-list .li-dir[data-id="+res.result.dir_id+"]");
            create_update_name(curObj);
        },
        error:function(e){}
    });
}
//创建笔记
function create_note(dir_id){
    if($('.item-list .no-item').length > 0) $('.item-list .no-item').remove();
    $.ajax({
        url:  '/dir/note_create',
        data:{'dir_id':dir_id},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                alert(res.msg);
                return false;
            }
            var obj = res.result;
            //不是当前选中的文件夹创建笔记时，要把这个文件夹选中
            if(dir_id != $('.dir-list .li-dir.curr').data('id')){
                $('.dir-list .li-dir.curr').removeClass('curr');
                $('.dir-list .li-dir[data-id='+dir_id+']').addClass('curr');
                //得到item列表后把新建的笔记设置选中
                item_list();
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
            var html = '<div class="li-dir my-dir-list" class-id="0" data-id="0">';
            if(obj.length > 0) html+= '<span class="down-btn drop-down pack-up"></span>';
            html += '<i class="icon"></i>&nbsp;&nbsp;我的文件夹</div>';
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
            item_list();
            show_note();
            flag = true;
        },
        error:function(e){}
    });
    return flag;
}
//中间的目录和笔记列表
function item_list(){
    $('.item-wrap .widget-scroller-wrap').addClass('loading').children('.scroller-container').hide();
    var id = $('.li-dir.curr').data('id');
    if(id == undefined){
        id = $('.sidebar .li-dir:first-child').data('id');
        $(".sidebar .li-dir[data-id="+id+"]").addClass('curr');
    }
    set_item_hd(id,'item');
    //去除滚动条的影响
    $('.item-list .scroller-container').css("margin-top", 0);
    //得到选择的排序
    var col = $('.setting-sort.selected').data('col');
    var sort = 'desc';
    if($('.setting-sort.selected').hasClass('asc')) sort = 'asc';

    $.ajax({
        url:  '/dir/item_list',
        data:{'dir_id':id,'col':col,'sort':sort},
        type: "POST",
        async: false,
        dataType:'json',
        success:function(res){
            var setting = $('.setting-sel.selected').data('value');
            var obj = res.result;
            var html = '';
            if(setting == 'all'){
                $.each(obj.dir, function(key, v){
                    html += '<li>'+create_dir_html(v,0)+'</li>';
                })
            }
            $('.item-dir').html(html);
            html = '';
            $.each(obj.note, function(key, v){
                html += create_note_html(v);
            })

            $('.item-note').html(html);
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
            var html = create_list(obj.dir,'trash');
            $('.item-dir').html(html);
            html = '';
            $.each(obj.note, function(key, v){
                html += create_note_html(v);
            })
            $('.item-note').html(html);
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
function drap_note(curObj,id){
    var parent_id = $('.item-list').attr('parent-id');
    var curr_dir_id = curObj.data('id');
    if(curr_dir_id == parent_id) return false;
    $('.li-note[data-id='+id+']').parent().remove();
    no_item_html();
    $.ajax({
        url:  '/dir/update_drap_note',
        data:{'rec_id':id , 'dir_id':curr_dir_id},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                alert(res.msg);
                return false;
            }
        },
        error:function(e){}
    });
}
//目录排序
function update_dir_list(obj,parent_id){
    var parent = obj.parent('li').parent('ul').prev('.li-dir');
    var class_id = parseInt(parent.attr('class-id'))+1;
    obj.attr('class-id',class_id);
    var cur_item = [obj.data('id'),class_id,parent.data('id'),obj.children('.name').text()];
    var list = get_dir_attr(obj);
    list.push(cur_item);
    $.ajax({
        url:  '/dir/update_drap_dir',
        data:{'list':list,'parent_id':parent_id},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                alert(res.msg);
                return false;
            }
            drap_dir_sort(obj,parent_id,res.result);
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
                alert(res.msg);
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
//恢复回收站
function ajax_trash_btn(url,ids,delObj){
    $.ajax({
        url:  url,
        data:{'id':ids},
        type: "POST",
        dataType:'json',
        success:function(res){
            if(res.status == 'error'){
                alert(res.msg);
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
                    drap_dir_sort($(".dir-list .li-dir[data-id=" + dir_id + "]"), parent_id, data.sort_list);
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
                alert(res.msg);
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
                alert(res.msg);
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
                alert(res.msg);
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
                alert(res.msg);
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
        item_list();
        return false;
    }
    set_item_hd(0,'search');
    $.ajax({
        url:  '/dir/note_search',
        data:{'search':search},
        type: "POST",
        dataType:'json',
        success:function(obj){
            var html = '';
            $('.item-dir').html('');
            if(obj.result.length == 0){
                html += '<div class="no-item">搜索结果为空</div>';
            }else{
                $.each(obj.result, function(key, v){
                    html += create_note_html(v);
                })
            }
            $('.item-note').html(html);
            set_item_num();
            show_note();
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
    if(type=='item'){
        $('.item-setting').removeClass('disabled');
    }else{
        $('.item-setting').addClass('disabled');
    }
}

function set_item_num(){
    $('.item-num span').html($('.item-wrap .rightbtn').length);
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