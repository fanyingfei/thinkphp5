<?php
namespace app\index\controller;

use think\Db;
use think\Request;
use think\Controller;
use think\View;
use think\Session;
use think\Cookie;
use upload\MyUpload;
use upload\MyCrop;

class User extends Controller
{
    private $uid;

    public function __construct() {
        parent::__construct();
        $this->uid = Session::get('uid');
    }

    public function register(){
        $time = time();
        $request = Request::instance();
        $phone = $request->param('phone');
        if(!preg_match("/^1[34578]\d{9}$/", $phone)) splash('error','请输入正确手机号');

        $res = Db::table('user')->where('phone',$phone)->find();
        if(!empty($res)) splash('error','该手机号已经被注册');

        $password = $request->param('password');
        if(empty($password)) splash('error','密码不能为空');

        $code = $request->param('code');
        if(empty($code)) splash('error','请输入验证码');
        $verification_code = Session::get('verification_code');
        $verification_time = Session::get('verification_time');
        if(strtolower($code) != strtolower($verification_code)) splash('error','验证码不正确');
        if($time > $verification_time) splash('error','验证码已过期');

        $user_name = substr_replace($phone,'****',3,4);
        $data = ['phone' =>$phone,'user_name'=>$user_name, 'password' =>md5($password.$time),'c_time'=>$time];
        $uid = Db::name('user')->insertGetId($data);
        $res['uid'] = $uid;
        set_login($res);
        splash('succ','注册成功');
    }

    public function login(){
        $request = Request::instance();
        $phone = $request->param('phone');
        $remeber = intval($request->param('remeber'));
        if(!preg_match("/^1[34578]\d{9}$/", $phone)) splash('error','请输入正确手机号');

        $res = Db::table('user')->where('phone',$phone)->find();
        if(empty($res)) splash('error','该手机号尚未注册');

        $password = $request->param('password');
        if($res['password'] != md5($password.$res['c_time'])) splash('error','密码不正确');

        set_login($res);
        if($remeber == 1){
            $user_info = urlencode(json_encode(['m'=>$phone,'p'=>$res['password']]));
            Cookie::set('user',$user_info,3600*24*30);//记住一个月
        }else{
            Cookie::delete('user');
        }
        splash('succ','登录成功');
    }

    public function sendHuYiSms(){
        $account = 'C47550525';
        $password='8d4d9a02a10a89d72467811edfff59ce';
        $verification_code = random(4);
        $request = Request::instance();
        $mobile = $request->param('phone');
        if(!preg_match("/^1[34578]\d{9}$/", $mobile)) splash('error','请输入正确手机号');

        $res = Db::table('user')->where('phone',$mobile)->find();
        if(!empty($res)) splash('error','该手机号已经被注册');

        $content = '您的验证码为：'.$verification_code.'，10分钟内有效';
        $url = "http://106.ihuyi.cn/webservice/sms.php?method=Submit&format=json";
        $url = $url."&account=".$account."&password=".$password."&mobile=$mobile&content=".rawurlencode($content);
        $json_data = post_fsockopen($url);
        $result = json_decode($json_data,true);
        if(isset($result['code']) && $result['code'] == 2){
            Session::set('verification_code',$verification_code);
            Session::set('verification_time',time()+600);
            splash('succ','短信发送成功',$verification_code);
        }else{
            splash('error',$result['msg']);
        }
    }

    public function user_info(){
        $uid = Session::get('uid');
        if(empty($uid)) splash('error','nologin');
        $res = Db::table('user')->where('uid',$uid)->find();
        splash('succ','获取用户信息功能',$res);
    }

    public function avatar_upload(){
        $uid = $this->uid;
        $type = array('jpg', 'jpeg', 'png', 'gif');
        $path = sprintf('%s/%s/%s/', date('Y'), date('m'), date('d'));

        $upload = new MyUpload('avatar', 0, $type);
        //获取上传信息
        $info = $upload->getUploadFileInfo();
        $fileName = $uid . time() . rand(1000, 9999) . '.' . $info['suffix'];
        $fullName = $path . $fileName;
        $path = rtrim('upload', DIRECTORY_SEPARATOR) . '/' . $fullName;
        $success = $upload->save($path);
        $width = 0;
        $height = 0;
        if($success) {
            $path = '/'.$path;
            $attr = getimagesize($path);
            $width = $attr[0];
            $height = $attr[1];
        }
        $msg = $success ? '上传成功' : '上传失败';
        echo json_encode(array('result' => $success, 'msg' => $msg, 'src' => $path, 'width' => $width, 'height' => $height, 'path' => $path));
    }

    public function avatar_crop(){
        $uid = $this->uid;
        $src = $_GET['src'];
        $rs = explode(".",$src);
        $ext = strtolower($rs[count($rs)-1]);
        $type = array('jpg', 'jpeg', 'png');
        $path = sprintf('%s/%s/%s/', date('Y'), date('m'), date('d'));

        $fileName = $uid . time() . rand(1000, 9999) . '.' . $ext;
        $fullName = $path . $fileName;
        $path = rtrim('upload', DIRECTORY_SEPARATOR) . '/' . $fullName;

        $crop = new MyCrop();
        $crop->initialize($src, $path, $_GET['x'], $_GET['y'], 200, 200, $_GET['w'], $_GET['h']);
        $success = $crop->generate_shot();

        $msg = $success ? '裁剪成功' : '裁剪失败';
        echo json_encode(array('result' => $success, 'msg' => $msg));
    }

}
