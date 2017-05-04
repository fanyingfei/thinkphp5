<?php
namespace app\index\controller;

use think\Db;
use think\Request;
use think\Controller;
use think\View;
use think\Session;

class Show extends Controller
{
    private $uid;

    public function __construct() {
        parent::__construct();
    }

    public function index($uid = 0){
        if(empty($uid)){
            $uid = Session::get('uid');
            $puid = $uid + USER_UID ;
        }else{
            $puid = $uid; // 传进来处理过的uid
            $uid = $uid - USER_UID ;
        }
        $request = Request::instance();
        $dir_id = $request->param('d');
        $user_info = Db::table('user')->where('uid',$uid)->field('uid,user_name,avatar,sex,year,moon,sign')->find();
        if(empty($user_info)) $this->error('页面找不到了');

        $res = Db::table('dir')->where(['uid'=>$uid,'group_id'=>0,'is_delete'=>0])->order('rank desc')->order('dir_id asc')->field('dir_id,private,dir_name,class_id,group_id,parent_id,FROM_UNIXTIME(c_time, "%Y/%m/%d") as time')->select();
        $dir_list = nesting($res);
        $html = $this->create_list($dir_list,$puid);

        $where = ['uid'=>$uid,'is_delete'=>0,'private'=>0];
        if(!empty($dir_id)) $where['dir_id'] = $dir_id;
        $count = Db::table('note')->where($where)->count('rec_id');
        $note_list = Db::table('note')->where($where)->order('rec_id desc')->field('rec_id,view,comment,name,dir_id,content,c_time')->paginate(10,$count,['var_page'=>'p']);

        $user_info['uid'] = $user_info['uid'] + USER_UID ;
        $data = ['user'=>$user_info,'count'=>$count,'dir_list'=>$html,'note_list'=>$note_list,'dir_id'=>$dir_id];
        return $this->fetch('user/show',$data);
    }

    public function dir_list(){
        $request = Request::instance();
        $uid = $request->param('uid') - USER_UID ;
        $res = Db::table('dir')->where(['uid'=>$uid,'group_id'=>0,'is_delete'=>0])->order('rank desc')->order('dir_id asc')->field('dir_id,dir_name,class_id,group_id,parent_id,FROM_UNIXTIME(c_time, "%Y/%m/%d") as time')->select();
        $list = nesting($res);
        $html = $this->create_list($list,$uid);
    }

    public function create_list($list,$uid){
        $html = '<ul>';
        foreach($list as $item){
            if($item['private'] == 1) continue;
            if(!empty($item['child']) && count($item['child']) > 0) $html .= '<li>';

            $html .= '<div class="li-dir" data-id="'.$item['dir_id'].'">';
            if(!empty($item['child']) && count($item['child']) > 0){
                $html .= '<span class="down-btn drop-down"></span>';
            }else{
                $html .= '<span class="down-btn"></span>';
            }
            $html .= '<div class="name"><a href="/home/'.$uid.'?d='.$item['dir_id'].'">'.$item['dir_name'].'</a></div>';
            $html .= '<div class="item-time">'.$item['time'].'</div><i class="right-menu"></i></div>';

            if(!empty($item['child']) && count($item['child']) > 0) $html .= $this->create_list($item['child'],$uid).'</li>';
        }
        $html .= '</ul>';
        return $html;
    }

    public function note_item($rec_id){
        $request = Request::instance();
        $detail = Db::table('note')->where(['rec_id'=>$rec_id])->field('uid,name,content,view,comment,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->find();
        if(empty($detail)) $this->error('页面找不到了');

        $user_info = Db::table('user')->where('uid',$detail['uid'])->field('uid,user_name,avatar,sex,year,moon,sign')->find();
        Db::table('note')->where('rec_id',$rec_id)->setInc('view');

        $uid = $user_info['uid'];
        $user_info['uid'] = $uid + USER_UID ;

        $res = Db::table('dir')->where(['uid'=>$uid,'group_id'=>0,'is_delete'=>0])->order('rank desc')->order('dir_id asc')->field('dir_id,private,dir_name,class_id,group_id,parent_id,FROM_UNIXTIME(c_time, "%Y/%m/%d") as time')->select();
        $dir_list = nesting($res);
        $html = $this->create_list($dir_list,$user_info['uid']);

        return $this->fetch('user/detail',['user'=>$user_info,'detail'=>$detail,'dir_list'=>$html]);
    }

    public function note_search(){
        $uid = $this->uid;
        $request = Request::instance();
        $search = trim($request->param('search'));
        $list = Db::table('note')->where(['uid'=>$uid,'is_delete'=>0])->where('name','like','%'.$search.'%')->order('rec_id desc')->field('rec_id,dir_id,group_id,name,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();
        foreach($list as &$item){
            $item['time'] = date('Y-m-d',$item['c_time']);
        }
        splash('succ','搜索结果',$list);
    }

}
