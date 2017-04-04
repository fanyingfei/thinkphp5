$(function (){
    var height = $('#article').height() - $("#wangDemo").offset().top - 10;
    $('#wangDemo').height(height);

   // wangEditor.config.mapAk = 'TVhjYjq1ICT2qqL5LdS8mwas';
    var editor = new wangEditor('wangDemo');

    editor.config.uploadImgUrl = '/upload.php';

    // 表情
    editor.config.emotions = {
        'default': {
            title: '默认',
            data: '/wangEditor/emotions.data'
        },
        'weibo': {
            title: '微博表情',
            data: [
                {
                    icon: 'http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/7a/shenshou_thumb.gif',
                    value: '[草泥马]'    
                },
                {
                    icon: 'http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/60/horse2_thumb.gif',
                    value: '[神马]'    
                },
                {
                    icon: 'http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/bc/fuyun_thumb.gif',
                    value: '[浮云]'    
                },
                {
                    icon: 'http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/c9/geili_thumb.gif',
                    value: '[给力]'    
                },
                {
                    icon: 'http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/f2/wg_thumb.gif',
                    value: '[围观]'    
                },
                {
                    icon: 'http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/70/vw_thumb.gif',
                    value: '[威武]'
                },
                {
                    icon: 'http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/6e/panda_thumb.gif',
                    value: '[熊猫]'
                },
                {
                    icon: 'http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/81/rabbit_thumb.gif',
                    value: '[兔子]'
                },
                {
                    icon: 'http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/bc/otm_thumb.gif',
                    value: '[奥特曼]'
                },
                {
                    icon: 'http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/15/j_thumb.gif',
                    value: '[囧]'
                },
                {
                    icon: 'http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/89/hufen_thumb.gif',
                    value: '[互粉]'
                },
                {
                    icon: 'http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/c4/liwu_thumb.gif',
                    value: '[礼物]'
                },
                {
                    icon: 'http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/ac/smilea_thumb.gif',
                    value: '[呵呵]'
                },
                {
                    icon: 'http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/0b/tootha_thumb.gif',
                    value: '[哈哈]'
                }
            ]
        }
    };

    editor.config.menus = $.map(wangEditor.config.menus, function(item, key) {
             if (item === 'video') {
                  return null;
             }
             return item;
         });
   // editor.config.mapAk = 'TVhjYjq1ICT2qqL5LdS8mwas';
    editor.create();
	
});