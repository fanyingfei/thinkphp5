<?php
namespace app\index\controller;

use think\Db;
use think\Request;
use think\Controller;
use think\View;
use think\Session;

class User extends Controller
{
    public function register(){
        $time = time();
        $request = Request::instance();
        $phone = $request->param('phone');
        if(!preg_match("/^1[34578]\d{9}$/", $phone)) splash('error','请输入正确手机号');

        $res = Db::table('user')->where('phone',$phone)->find();
        if(!empty($res)) splash('error','该手机号已经被注册');

        $password = $request->param('password');
        if(empty($password)) splash('error','手机号不能为空');
        $dbpass = $request->param('dbpass');
        if($password != $dbpass) splash('error','两次输入的密码不一致');

        $data = ['phone' =>$phone, 'password' =>md5($password.$time),'c_time'=>$time];
        $uid = Db::name('user')->insertGetId($data);
        $res['uid'] = $uid;
        $this->set_login($res);
        splash('succ','注册成功');
    }

    public function login(){
        $request = Request::instance();
        $phone = $request->param('phone');
        $password = $request->param('password');

        $res = Db::table('user')->where('phone',$phone)->find();
        if(empty($res)) splash('error','该手机号尚未注册');

        if($res['password'] != md5($password.$res['c_time'])) splash('error','密码不正确');

        $this->set_login($res);
        splash('succ','登录成功');
    }

    public function set_login($res){
        Session::set('uid',$res['uid']);
    }
}
