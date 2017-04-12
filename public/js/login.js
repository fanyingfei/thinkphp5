(function($){
    $.fn.drag = function(options){
        var x, drag = this, isMove = false, defaults = {
        };
        var options = $.extend(defaults, options);

        var handler = drag.find('.handler');
        var drag_bg = drag.find('.drag_bg');
        var text = drag.find('.drag_text');
        var maxWidth = drag.outerWidth() - handler.outerWidth();  //能滑动的最大间距

        //鼠标按下时候的x轴的位置
        handler.mousedown(function(e){
            $('.login .login-error').text('').hide();
            isMove = true;
            x = e.pageX;
        });

        //鼠标指针在上下文移动时，移动距离大于0小于最大间距，滑块x轴位置等于鼠标移动距离
        $(document).mousemove(function(e){
            var _x = e.pageX - x;
            if(isMove){
                if(_x > 0 && _x <= maxWidth){
                    handler.css({'left': _x});
                    drag_bg.css({'width': _x});
                }else if(_x > maxWidth){  //鼠标指针移动距离达到最大时清空事件
                    dragOk();
                }
            }
        }).mouseup(function(e){
            isMove = false;
            var _x = e.pageX - x;
            if(_x < maxWidth){ //鼠标松开时，如果没有达到最大距离位置，滑块就返回初始位置
                handler.css({'left': 0});
                drag_bg.css({'width': 0});
            }
        });

        //清空事件
        function dragOk(){
            drag.addClass('drag_ok').css({'color': '#fff'});
            text.text('验证通过').attr('data-value',1);
            handler.unbind('mousedown').css({'left': 'auto','right':0});
            drag_bg.css({'width': maxWidth});
            $(document).unbind('mousemove');
            $(document).unbind('mouseup');
        }
    };


    var oW,oLeft;
    var handler = $('.handler');
    var oBtn = $('.handler')[0];
    var drag_bg = $('.drag_bg');
    var text = $('.drag_text');
    var maxWidth = $('#drag').outerWidth() - $('.handler').outerWidth();  //能滑动的最大间距
    var flag=1;


    oBtn.addEventListener('touchstart',function(e){
        if(flag==1){
            var touches = e.touches[0];
            $('.login .login-error').text('').hide();
            oW = touches.clientX;
        }
    },false);

    oBtn.addEventListener("touchmove", function(e) {
        if(flag==1){
            var touches = e.touches[0];
            oLeft = touches.clientX - oW;

            oLeft = touches.clientX - oW;
            if(oLeft > 0 && oLeft <= maxWidth){
                handler.css({'left': oLeft});
                drag_bg.css({'width': oLeft});
            }else if(oLeft > maxWidth){  //鼠标指针移动距离达到最大时清空事件
                flag = 0;
                $('#drag').addClass('drag_ok').css({'color': '#fff'});
                text.text('验证通过').attr('data-value',1);
                handler.css({'left': 'auto','right':0});
                drag_bg.css({'width': maxWidth});
            }
        }

    },false);

    oBtn.addEventListener("touchend",function(e) {
        if(flag==1) {
            var _m = parseInt(oBtn.style.left);
            if (_m > 0 && _m < maxWidth) {
                $('.handler').css({'left': 0});
                $('.drag_bg').css({'width': 0});
            }
        }
    },false);
})(jQuery);