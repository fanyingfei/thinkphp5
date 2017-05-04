<?php
// +----------------------------------------------------------------------
// | ThinkPHP [ WE CAN DO IT JUST THINK ]
// +----------------------------------------------------------------------
// | Copyright (c) 2006~2016 http://thinkphp.cn All rights reserved.
// +----------------------------------------------------------------------
// | Licensed ( http://www.apache.org/licenses/LICENSE-2.0 )
// +----------------------------------------------------------------------
// | Author: liu21st <liu21st@gmail.com>
// +----------------------------------------------------------------------
use think\Route;
// 注册路由到index模块的News控制器的read操作
Route::rule('/','index/test');
Route::rule('yuzhou','index/canvas');
Route::rule('login','index/login');
Route::rule('home/:uid','Show/index');
Route::rule('home','Show/index');
Route::rule('details/:rec_id','Show/note_item');