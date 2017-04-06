<?php
namespace app\index\controller;

use think\Db;
use think\Request;
use think\Controller;
use \think\View;

class Dir extends Controller
{
    public function dir_list()
    {
        $user_id = 1;
        $res = Db::table('dir')->where(['uid'=>$user_id,'is_delete'=>0])->order('rank desc')->order('c_time asc')->field('dir_id,dir_name,class_id,parent_id')->select();
        $data = $this->nesting($res);
        return JSON($data);
    }

    public function item_list(){
        $user_id = 1;
        $request = Request::instance();
        $dir_id = $request->param('dir_id');
        $dir_res = Db::table('dir')->where(['uid'=>$user_id,'is_delete'=>0,'parent_id'=>$dir_id])->order('rank desc')->order('c_time asc')->field('dir_id,dir_name,class_id,parent_id,c_time')->select();
        $note_res = Db::table('note')->where(['uid'=>$user_id,'is_delete'=>0,'dir_id'=>$dir_id])->order('rank desc')->order('c_time asc')->field('rec_id,title,c_time')->select();
        foreach($dir_res as &$dir){
            $dir['time'] = date('Y-m-d',$dir['c_time']);
        }
        foreach($note_res as &$item){
            $item['time'] = date('Y-m-d',$item['c_time']);
        }
        $data = array('dir'=>empty($dir_res) ? array() : $dir_res,'note'=>empty($note_res) ? array() : $note_res);
        return json(array('dir'=>$dir_res,'note'=>$note_res));
    }

    public function create_dir(){
        $time = time();
        $request = Request::instance();
     //   $user_id = $request->session('uid');
        $user_id = 1;
        $name = '新建文件夹';
        $class_id = $request->param('class_id');
        $parent_id = $request->param('parent_id');
        if($parent_id == 0) $class_id = 1;

        $data = ['dir_name' => $name, 'uid'=>$user_id,'class_id'=>$class_id,'parent_id'=>$parent_id,'u_time'=>$time,'c_time'=>$time];

        $res = Db::name('dir')->insertGetId($data);
        return json($res);
    }

    public function update_drap_dir(){
        $time = time();
        $request = Request::instance();
        //   $user_id = $request->session('uid');
        $user_id = 1;
        $list = $request->param('list/a');
        $parent_id = $request->param('parent_id');
        foreach($list as $item){
            $data = ['class_id' => $item[1] ,'parent_id'=>$item[2],'u_time'=>time(),'rank'=>0];
            if($data['parent_id'] == 0) $data['class_id'] = 1;
            Db::table('dir')->where('dir_id', $item[0])->update($data);
        }
        $res = Db::table('dir')->where(['uid'=>$user_id,'is_delete'=>0,'parent_id'=>$parent_id])->order('rank desc')->order('c_time asc')->column('dir_id');
        return json($res);
    }

    public function update_dir_sort(){
        $time = time();
        $request = Request::instance();
        //   $user_id = $request->session('uid');
        $user_id = 1;
        $list = $request->param('list/a');
        foreach($list as $item){
            $data = ['rank' => $item[1] , 'u_time'=>time()];
            $res = Db::table('dir')->where('dir_id', $item[0])->update($data);
        }
        return json($res);
    }

    public function delete_dir(){
        $time = time();
        $request = Request::instance();
        //   $user_id = $request->session('uid');
        $user_id = 1;
        $id = $request->param('id');
        $data = ['is_delete' => 1 , 'u_time'=>time()];
        $res = Db::table('dir')->where('dir_id', $id)->update($data);
        return json($res);
    }


    public function update_name(){
        $request = Request::instance();
        $dir_id = $request->param('id');
        $name = $request->param('name');
        $data = ['dir_name' => $name ,'u_time'=>time()];
        $res = Db::table('dir')->where('dir_id', $dir_id)->update($data);
        return json($res);
    }

    public function note_item(){
        $user_id = 1;
        $request = Request::instance();
        $rec_id = $request->param('rec_id');
        $res = Db::table('note')->where(['rec_id'=>$rec_id,'uid'=>$user_id])->order('rank desc')->order('c_time asc')->find();
        return json($res);
    }

    public function delete_note(){
        $time = time();
        $request = Request::instance();
        //   $user_id = $request->session('uid');
        $user_id = 1;
        $id = $request->param('id');
        $data = ['is_delete' => 1 , 'u_time'=>time()];
        $res = Db::table('note')->where('rec_id', $id)->update($data);
        return json($res);
    }

    public function note_update(){
        $time = time();
        $request = Request::instance();
        $rec_id = $request->param('rec_id');
        $title = $request->param('title');
        $content = $request->param('content');
        //   $user_id = $request->session('uid');
        $user_id = 1;
        $data = ['uid'=>$user_id,'title'=>$title,'content'=>$content,'u_time'=>$time,'c_time'=>$time];
        $res = Db::table('note')->where('rec_id', $rec_id)->update($data);
        return json($res);
    }

    public function update_drap_note(){
        $time = time();
        $request = Request::instance();
        //   $user_id = $request->session('uid');
        $user_id = 1;
        $rec_id = $request->param('rec_id');
        $dir_id = $request->param('dir_id');
        $data = ['dir_id'=>$dir_id,'u_time'=>$time];
        $res = Db::table('note')->where('rec_id', $rec_id)->update($data);
        return json($res);
    }

    public function update_note_name(){
        $request = Request::instance();
        $rec_id = $request->param('id');
        $title = $request->param('name');
        $data = ['title' => $title ,'u_time'=>time()];
        $res = Db::table('note')->where('rec_id', $rec_id)->update($data);
        return json($res);
    }

    public function update_note_sort(){
        $time = time();
        $request = Request::instance();
        //   $user_id = $request->session('uid');
        $user_id = 1;
        $list = $request->param('list/a');
        foreach($list as $item){
            $data = ['rank' => $item[1] , 'u_time'=>time()];
            $res = Db::table('note')->where('rec_id', $item[0])->update($data);
        }
        return json($res);
    }

    public function note_create(){
        $time = time();
        $request = Request::instance();
        $title = '新建笔记';
        $content = '';
        $dir_id = $request->param('dir_id');
        //   $user_id = $request->session('uid');
        $user_id = 1;
        $data = ['dir_id' => $dir_id, 'uid'=>$user_id,'title'=>$title,'content'=>$content,'u_time'=>$time,'c_time'=>$time];
        $inser_id = Db::name('note')->insertGetId($data);
        return json(array('rec_id'=>$inser_id,'time'=>date('Y-m-d',$time),'title'=>$title));
    }

    public function nesting($res){
        $max_class = 1;
        $list = array();
        foreach($res as $item){
            if($item['class_id'] > $max_class) $max_class = $item['class_id'];
            $list[$item['dir_id']] = $item;
        }

        for($i=$max_class ; $i>1 ; $i--){
            foreach($list as $key=>$row){
                if($row['class_id'] != $i) continue;
                if(!empty($list[$row['parent_id']])) $list[$row['parent_id']]['child'][] = $row;
                unset($list[$key]);
            }
        }

        $data = array();
        foreach($list as $one){
            $data[] = $one;
        }
        return $data;
    }

    public function get_children_dir($parent_id){
        $user_id = 1;
        $sql = 'select dir_id,dir_name,parent_id,class_id from dir where dir_id = 0 union all ';
        $sql .= 'select tr.dir_id,tr.dir_name,tr.parent_id,tr.class_id + 1 from dir td inner join dir tr on td.dir_id = tr.dir_id';
    }
}
