function start_init(){
    init_user_info();
    //初始得到目录列表
    var sel_col = $.cookie('setting_col');
    var sel_sort = $.cookie('setting_sort');
    var sel_value = $.cookie('setting_value');
    if(sel_value !== undefined){
        $('.setting-sel').removeClass('selected');
        $('.setting-sel[data-value='+sel_value+']').addClass('selected');
    }
    if(sel_col !== undefined && sel_sort !== undefined){
        $('.setting-sort').removeClass('selected desc asc');
        $('.setting-sort[data-col='+sel_col+']').addClass(sel_sort+' selected');
    }

    var flag = dir_list();
    if(flag){
        setTimeout(function(){
            $('.main').removeClass('none');
            $('.loading-open').remove();
            get_wangDemo_height();
            ajax_polling();
        },500);
    }
}

function init_user_info(){
    var data = get_user_info();
    if(data== '') return false;
    $('.top-right .user-name').text(data.user_name);
    $('.top-right .user-avatar').attr('src',data.avatar);
    $('.top-right .pagehome').attr('href','/home/'+data.uid);
}



//创建目录的HTML
function create_dir_html(obj){
    var html = '<div class="li-dir rightbtn" group-id="'+obj.group_id+'" class-id="'+ obj.class_id+'" data-id="'+ obj.dir_id+'" private="'+obj.private+'">';
    if(obj.child) html += '<span class="down-btn drop-down"></span>';
    else html += '<span class="down-btn"></span>';
    html += '<i class="icon"></i><div class="name">'+obj.dir_name+'</div>';
    html += '<div class="item-time">'+obj.time+'</div><i class="right-menu"></i></div>';
    return html;
}

//创建笔记的HTML
function create_note_html(obj){
    var html = '<li class="note-drap"><div class="li-note rightbtn" group-id="'+obj.group_id+'" data-id="'+ obj.rec_id+'" parent-id="'+ obj.dir_id+'">';
    html += '<i class="icon"></i><div class="name">'+ obj.name+'</div><div class="item-time">'+ obj.time+'</div><i class="right-menu"></i></div></li>';
    return html;
}

function create_group_html(obj){
    var html = '<div class="li-group li-dir" group-id="'+ obj.group_id+'" data-id="0" class-id="0" version="'+obj.version+'">';
    if(obj.dir_list != undefined && obj.dir_list != '') html += '<span class="down-btn drop-down"></span>';
    else html += '<span class="down-btn"></span>';
    html += '<i class="icon"></i><div class="name">'+obj.group_name+'</div>';
    html += '<div class="item-time">'+obj.time+'</div><i class="right-menu"></i></div>';
    return html;
}

//得到富文本编辑器的高度
function get_wangDemo_height(){
    var height = $('.note-detail').height() - $(".title-wrap").outerHeight() - 40;
    $('#wangDemo').height(height);
}

function change_scroller_height(obj){
    if(obj.offset().top >= obj.parent().offset().top) return false;
    obj.css("margin-top", 0);
}


//打开下拉目录的方法
function open_dir(obj){
    var parent = obj.parent();
    if(parent.next('ul').is(":hidden")){
        parent.next('ul').slideDown('fast');
        obj.addClass('pack-up');
    }else{
        parent.parent().find('ul').slideUp('fast');
        parent.parent().find('ul').prev('div').children('.down-btn').removeClass('pack-up');
    }
    hide_dropdown_menu();
}

//创建目录列表的HTML，循环嵌套
function create_list(obj , type){
    var html = '';
    $.each(obj, function(key, v){
        if(v.child){
            html += '<li>'+create_dir_html(v);
            html += create_list(v.child);
            html += '</li>';
        }else{
            html += '<li>'+create_dir_html(v)+'</li>';
        }
    })
    if(type == 'item')  return '<ul class="item-dir">'+html+'</ul>';
    else return '<ul class="sortable">'+html+'</ul>';
}

//没有任何目录和笔记时调用此方法
function no_item_html(){
    empty_note();
    var msg = '列表空空如也~';
    if($('.search-input').val() != '') msg = '搜索结果为空';
    if($('.item-wrap .scroller-container > ul > li').length == 0){
        var html = '<div class="no-item"><p>'+msg+'</p></div>';
        $('.item-note').html(html);
    }else{
        $('.no-item').remove();
    }
}

//没有笔记时view的显示
function empty_note(){
    if($('.item-note .rightbtn').length > 0) return false;
    var obj = $('.detail-container');
    if(obj.hasClass('empty')) return false;
    obj.addClass('empty').children().hide().end().append('<div class="empty-img"></div>');
    $('.title-wrap input').val('');
    $('.note-detail .note-view').html('');
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
    if(status == 'succ') status = 'success';
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