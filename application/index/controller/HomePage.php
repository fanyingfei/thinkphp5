<?php
namespace app\index\controller;

use think\Db;
use think\Request;
use think\Controller;
use think\View;
use think\Session;

class HomePage extends Controller
{
    private $uid;

    public function __construct() {
        parent::__construct();
        $this->uid = 1;
    }

    public function dir_list()
    {
        $uid = $this->uid;
        $res = Db::table('dir')->where(['uid'=>$uid,'group_id'=>0,'is_delete'=>0])->order('rank desc')->order('dir_id asc')->field('dir_id,dir_name,class_id,group_id,parent_id,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();
        $data = $this->nesting($res);
        splash('succ','',$data);
    }

    public function group_list(){
        $uid = $this->uid;
        $group_ids = Db::table('user_group')->where(['uid'=>$uid,'invite'=>$this->groupAgree])->column('group_id');

        $group_list = Db::table('group')->where('group_id','in',$group_ids)->
        order('rank desc')->order('group_id asc')->field('group_id,version,group_name,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();

        $dir_res = Db::table('dir')->where('group_id', 'in' , $group_ids)->where('is_delete',0)->order('rank desc')->order('dir_id asc')->field('dir_id,dir_name,class_id,group_id,parent_id,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();

        foreach($group_list as &$group){
            $group['dir_list'] = [];
            foreach($dir_res as $dir){
                if($dir['group_id'] != $group['group_id']) continue;
                $group['dir_list'][] = $dir;
            }
            if(empty($group['dir_list'])) continue;
            $group['dir_list'] = $this->nesting($group['dir_list']);
        }

        splash('succ','',$group_list);
    }

    public function item_list_group(){
        $request = Request::instance();
        $group_id = $request->param('group_id');

        $note_res = Db::table('note')->where(['group_id'=>$group_id,'dir_id'=>0,'is_delete'=>0])->order('rank desc')->order('rec_id desc')->field('rec_id,name,dir_id,group_id,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();
        splash('succ','',$note_res);
    }

    public function item_list_dir(){
        $uid = $this->uid;
        $col_list = $this->colList;
        $sort_list = $this->sortList;

        $request = Request::instance();
        $col = $request->param('col');
        $col = empty($col_list[$col]) ? 'rank' : $col_list[$col];
        $sort = $request->param('sort');
        $sort = in_array($sort,$sort_list) ? $sort : 'desc';
        $dir_id = $request->param('dir_id');
        $group_id = $request->param('group_id');

        if($group_id > 0){
            $note_res = Db::table('note')->where(['group_id'=>$group_id,'dir_id'=>$dir_id,'is_delete'=>0])->order($col.' '.$sort)->order('rec_id desc')->field('rec_id,name,dir_id,group_id,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();
        }else{
            $note_res = Db::table('note')->where(['uid'=>$uid,'group_id'=>$group_id,'dir_id'=>$dir_id,'is_delete'=>0])->order($col.' '.$sort)->order('rec_id desc')->field('rec_id,name,dir_id,group_id,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();
        }
        splash('succ','',$note_res);
    }

    public function note_item(){
        $uid = $this->uid;
        $request = Request::instance();
        $rec_id = $request->param('rec_id');
        $res = Db::table('note')->where(['rec_id'=>$rec_id])->find();
        splash('succ','',$res);
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

    public function nesting($res){
        $max_class = 1;
        $list = $data = [];
        foreach($res as $item){
            if($item['class_id'] > $max_class) $max_class = $item['class_id'];
            $list[$item['dir_id']] = $item;
        }

        for($i=$max_class ; $i>1 ; $i--){
            foreach($list as $key=>$row){
                if($row['class_id'] != $i) continue;
                if(empty($list[$row['parent_id']])) continue;
                $list[$row['parent_id']]['child'][] = $row;
                unset($list[$key]);
            }
        }

        foreach($list as $one){
            $data[] = $one;
        }

        return $data;
    }

    //把parent_id,class_id不对的重置
    function change_group_list(&$list,$class_id=1){
        foreach($list as $key=>&$item){
            if($item['class_id'] != $class_id){
                $item['class_id'] = $class_id;
                Db::table('dir')->where('dir_id', $item['dir_id'])->update(['class_id'=>$class_id]);
            }
            if($item['class_id'] == 1 && $item['parent_id'] != 0 ){
                $item['parent_id'] = 0;
                Db::table('dir')->where('dir_id', $item['dir_id'])->update(['parent_id'=>0]);
            }
            if(!empty($item['child'])){
                $this->change_group_list($item['child'],$item['class_id']+1);
            }
        }
    }
}