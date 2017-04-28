$(document).ready(function(){
    dir_list();
    function dir_list(){
        var uid = $('.panel-profile').data('id');
        var dir_id = $('.panel-profile').attr('dir-id');
        $.ajax({
            url:  '/show/dir_list',
            data:{'uid':uid},
            type: "POST",
            async: false,
            dataType:'json',
            success:function(res){
                var obj = res.result;
                var html = create_list(obj);
                $('.dir-list').html(html);
                if(dir_id == 0) return false;
                $('.li-dir[data-id='+dir_id+']').addClass('curr').parents('ul').show().prev('div').children('.down-btn').addClass('drop-down pack-up');
            },
            error:function(e){}
        });
    }

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

    //创建目录的HTML
    function create_dir_html(obj){
        var uid = $('.panel-profile').data('id');
        var html = '<div class="li-dir" data-id="'+obj.dir_id+'">';
        if(obj.child) html += '<span class="down-btn drop-down"></span>';
        else html += '<span class="down-btn"></span>';
        html += '<div class="name"><a href="/home/'+uid+'?d='+obj.dir_id+'">'+obj.dir_name+'</a></div>';
        html += '<div class="item-time">'+obj.time+'</div><i class="right-menu"></i></div>';
        return html;
    }

    $("body").on("click", '.drop-down', function(){
        var obj = $(this);
        var parent = obj.parent();
        if(parent.next('ul').is(":hidden")){
            parent.next('ul').slideDown('fast');
            obj.addClass('pack-up');
        }else{
            parent.parent().find('ul').slideUp('fast');
            parent.parent().find('ul').prev('div').children('.down-btn').removeClass('pack-up');
        }
        return false;
    });
});