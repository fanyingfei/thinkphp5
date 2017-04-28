$(document).ready(function(){
    dir_list();
    function dir_list(){
        var dir_id = $('.panel-profile').attr('dir-id');
        $('.li-dir[data-id='+dir_id+']').addClass('curr').parents('ul').show().prev('div').children('.down-btn').addClass('drop-down pack-up');
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