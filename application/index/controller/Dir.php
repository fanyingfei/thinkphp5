<?php
namespace app\index\controller;

use think\Db;
use think\Request;
use think\Controller;
use think\View;
use think\Session;

class Dir extends Controller
{
    private $uid;
    private $maxDir = 5;
    private $groupWait = 0;
    private $groupRefuse = 1;
    private $groupAgree = 2;
    private $sortList = ['desc','asc'];
    private $colList = ['rank'=>'rank','create'=>'c_time','update'=>'u_time','title'=>'convert(title USING gbk) COLLATE gbk_chinese_ci'];

    public function __construct() {
        parent::__construct();
        $uid = Session::get('uid');
        if(empty($uid)) splash('error','nologin');
        $this->uid = Session::get('uid');
    }

    public function dir_list()
    {
        $uid = $this->uid;
        $res = Db::table('dir')->where(['uid'=>$uid,'is_delete'=>0,'group_id'=>0])->order('rank desc')->order('dir_id asc')->field('dir_id,dir_name,class_id,group_id,parent_id,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();
        $data = $this->nesting($res);
        splash('succ','',$data);
    }

    public function group_list(){
        $uid = $this->uid;
        $group_ids = Db::table('user_group')->where(['uid'=>$uid,'invite'=>$this->groupAgree])->column('group_id');

        $group_list = Db::table('group')->where('group_id','in',$group_ids)->
        order('rank desc')->order('group_id asc')->field('group_id,version,group_name,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();

        $dir_res = Db::table('dir')->where('is_delete',0)->where('group_id', 'in' , $group_ids)->order('rank desc')->order('dir_id asc')->field('dir_id,dir_name,class_id,group_id,parent_id,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();
        foreach($group_list as &$group){
            foreach($dir_res as $dir){
                if($dir['group_id'] != $group['group_id']) continue;
                $group['dir_list'][] = $dir;
            }
        }
        foreach($group_list as &$item){
            if(empty($item['dir_list'])){
                $item['dir_list'] = [];
            }else{
                $item['dir_list'] = $this->nesting($item['dir_list'] , 1);
                $this->change_group_list($item['dir_list']);
            }
        }

        splash('succ','',$group_list);
    }

    public function item_group(){
        $uid = $this->uid;
        $group_ids = Db::table('user_group')->where(['uid'=>$uid,'invite'=>$this->groupAgree])->column('group_id');

        $group_list = Db::table('group')->where('group_id','in',$group_ids)->
        order('rank desc')->order('group_id asc')->field('group_id,version,group_name,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();
        splash('succ','',$group_list);
    }

    public function invite_group(){
        $time = time();
        $request = Request::instance();
        $phone = $request->param('phone');
        $group_id = $request->param('group_id');
        $again = $request->param('again');

        $uid = Db::table('user')->where('phone',$phone)->value('uid');
        if(empty($uid)) splash('error','找不到该账号');

        $user_group = Db::table('user_group')->where(['uid'=>$uid,'group_id'=>$group_id])->find();
        if(!empty($user_group)){
            if($user_group['invite'] == $this->groupRefuse && $again == 1){
                $res = Db::table('user_group')->where('rec_id', $user_group['rec_id'])->update(['invite'=>$this->groupWait,'inviter'=>$uid,'u_time'=>$time]);
                splash('succ','邀请已再次发出，等待对方同意');
            }
            if($user_group['invite'] == $this->groupWait) splash('error','已经邀请过该用户，正在等待对方同意');
            elseif($user_group['invite'] == $this->groupRefuse) splash('error','对方已拒绝邀请',$this->groupRefuse);
            elseif($user_group['invite'] == $this->groupAgree) splash('error','对方已经是该协作的成员了');
        }

        $data = ['group_id' => $group_id, 'uid'=>$uid,'inviter'=>$uid,'u_time'=>$time,'c_time'=>$time];
        $rec_id = Db::name('user_group')->insertGetId($data);
        if($rec_id) splash('succ','邀请成功，等待对方同意');
        else splash('error','邀请失败，请刷新重试');
    }


    public function my_invite_group(){
        $uid = $this->uid;
        $my_group = Db::table('user_group')->alias('ug')->join('group g','ug.group_id = g.group_id')->join('user u','ug.inviter = u.uid')
            ->where(['ug.uid'=>$uid,'ug.invite'=>$this->groupWait])->field('ug.group_id,u.user_name,g.group_name')->select();
        splash('succ','',$my_group);
    }

    public function invite_agree_refuse(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $group_id = $request->param('group_id');
        $invite = $request->param('invite');
        if(!in_array($invite,[$this->groupRefuse,$this->groupAgree])) splash('error','操作失败，请刷新重试');

        $res = Db::table('user_group')->where(['uid'=>$uid,'group_id'=>$group_id])->update(['invite'=>$invite,'u_time'=>$time]);
        $msg = $invite == $this->groupRefuse ? '邀请已拒绝' : '同意邀请成功，你已加入该协作';
        if($res) splash('succ',$msg);
        else splash('error','操作失败，请刷新重试');
    }

    public function item_list_group(){
        $request = Request::instance();
        $group_id = $request->param('group_id');

        $dir_res = Db::table('dir')->where(['group_id'=>$group_id,'is_delete'=>0])->order('rank desc')->order('dir_id asc')->field('dir_id,dir_name,group_id,class_id,parent_id,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();
        $dir_res = $this->nesting($dir_res,1);
        $note_res = Db::table('note')->where(['group_id'=>$group_id,'is_delete'=>0,'dir_id'=>0])->order('rank desc')->order('rec_id desc')->field('rec_id,title,dir_id,group_id,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();
        splash('succ','',['dir'=>$dir_res,'note'=>$note_res]);
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

        $dir_res = Db::table('dir')->where(['uid'=>$uid,'is_delete'=>0,'parent_id'=>$dir_id,'group_id'=>$group_id])->order('rank desc')->order('dir_id asc')->field('dir_id,dir_name,group_id,class_id,parent_id,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();
        $note_res = Db::table('note')->where(['uid'=>$uid,'is_delete'=>0,'dir_id'=>$dir_id])->order($col.' '.$sort)->order('rec_id desc')->field('rec_id,title,dir_id,group_id,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();

        splash('succ','',['dir'=>$dir_res,'note'=>$note_res]);
    }

    public function trash_list(){
        $uid = $this->uid;
        $res = Db::table('dir')->where(['uid'=>$uid,'is_delete'=>1])->order('u_time desc')->field('dir_id,dir_name,class_id,group_id,parent_id,FROM_UNIXTIME(u_time, "%Y-%m-%d") as time')->select();
        $dir_res = $this->nesting($res,1);
        $note_res = Db::table('note')->where(['uid'=>$uid,'is_delete'=>1])->order('u_time desc')->field('rec_id,title,dir_id,group_id,FROM_UNIXTIME(u_time, "%Y-%m-%d") as time')->select();

        splash('succ','',['dir'=>$dir_res,'note'=>$note_res]);
    }

    public function create_dir(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $name = '新建文件夹';
        $class_id = $request->param('class_id');
        $parent_id = $request->param('parent_id');
        $group_id = $request->param('group_id');
        if($parent_id == 0) $class_id = 1;

        if($class_id > $this->maxDir) splash('error','最多拥有'.$this->maxDir.'层目录');

        $data = ['dir_name' => $name, 'uid'=>$uid,'class_id'=>$class_id,'group_id'=>$group_id,'parent_id'=>$parent_id,'u_time'=>$time,'c_time'=>$time];

        $dir_id = Db::name('dir')->insertGetId($data);
        if($dir_id) splash('succ','新建文件夹成功',['dir_id'=>$dir_id,'dir_name'=>$name,'class_id'=>$class_id,'time'=>date('Y-m-d',$time)]);
        else splash('error','新建文件夹失败，请刷新重试');
    }

    public function create_group(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $name = '新建协作';

        $data = ['group_name' => $name, 'uid'=>$uid,'u_time'=>$time,'c_time'=>$time];
        $group_id = Db::name('group')->insertGetId($data);

        $user_group = ['uid'=>$uid,'group_id'=>$group_id,'invite'=>$this->groupAgree,'inviter'=>$uid,'u_time'=>$time,'c_time'=>$time];
        Db::name('user_group')->insertGetId($user_group);
        if($group_id) splash('succ','新建协作成功',['group_id'=>$group_id,'version'=>0,'group_name'=>$name,'time'=>date('Y-m-d',$time)]);
        else splash('error','新建协作失败，请刷新重试');
    }

    public function update_drap_dir(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $list = $request->param('list/a');
        $parent_id = $request->param('parent_id');
        $group_id = $request->param('group_id');

        foreach($list as $key=>$item){
            $data = ['dir_id'=>$item[0],'class_id' => $item[1] ,'parent_id'=>$item[2],'group_id'=>$group_id,'u_time'=>time(),'rank'=>-1,'is_delete'=>0];
            if($data['parent_id'] == 0) $data['class_id'] = 1;
            if($data['class_id'] > $this->maxDir) splash('error','最多拥有'.$this->maxDir.'层目录');
            $list[$key] = $data;
        }

        foreach($list as $row){
            $dir_id = $row['dir_id'];
            unset($row['dir_id']);
            $res = Db::table('dir')->where('dir_id', $dir_id)->update($row);
        }

        if($res) splash('succ','拖放目录成功');
        else splash('error','拖放目录失败，请刷新重试');
    }

    public function update_dir_sort(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $list = $request->param('list/a');
        foreach($list as $item){
            $data = ['rank' => $item[1] , 'u_time'=>time()];
            $res = Db::table('dir')->where('dir_id', $item[0])->update($data);
        }
        if($res) splash('succ','排序成功');
        else splash('error','排序失败，请刷新重试');
    }

    public function update_group_sort(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $list = $request->param('list/a');
        foreach($list as $item){
            $data = ['rank' => $item[1] , 'u_time'=>time()];
            $res = Db::table('group')->where('group_id', $item[0])->update($data);
        }
        if($res) splash('succ','排序成功');
        else splash('error','排序失败，请刷新重试');
    }

    public function delete_dir(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $dir_ids = $request->param('id/a');
        if(empty($dir_ids)) splash('error','请选择要删除的目录');

        $data = ['is_delete' => 1 , 'u_time'=>time()];
        $res = Db::table('dir')->where('uid',$uid)->where('dir_id','in',$dir_ids)->update($data);
        if($res){
            Db::table('note')->where('uid',$uid)->where('dir_id','in',$dir_ids)->update($data);
            splash('succ','删除目录成功','dir');
        }
        else splash('error','删除目录失败，请刷新重试');
    }

    public function delete_group(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $group_id = $request->param('group_id');
        if(empty($group_id)) splash('error','请选择要删除的选项');

        $res = Db::table('user_group')->where(['uid'=>$uid,'group_id'=>$group_id])->delete();
        if($res) splash('succ','删除成功');
        else splash('error','删除失败，请刷新重试');
    }

    public function dir_trash_delete(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $dir_ids = $request->param('id/a');
        if(empty($dir_ids)) splash('error','请选择要删除的目录');

        $res = Db::table('dir')->where('uid',$uid)->where('dir_id','in',$dir_ids)->delete();
        if($res){
            Db::table('note')->where('uid',$uid)->where('dir_id','in',$dir_ids)->delete();
            splash('succ','彻底删除目录成功','dir');
        }
        else splash('error','彻底删除目录失败，请刷新重试');
    }

    public function dir_recover(){
        $exist = 0;
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $dir_list = $request->param('id/a');
        if(empty($dir_list)) splash('error','请选择要恢复的目录');

        foreach($dir_list as $key=>$item){
            $dir_list[$key] = ['dir_id'=>$item[0],'class_id' => $item[1]];
        }

        $end_dir = end($dir_list); //class_id最大的那个元素
        $cur_dir = $end_dir['dir_id'];
        $parent_id = Db::table('dir')->where(['dir_id'=>$cur_dir,'uid'=>$uid])->value('parent_id');

        if(!empty($parent_id)){
            $res_dir_id = Db::table('dir')->where(['dir_id'=>$parent_id,'uid'=>$uid,'is_delete'=>0])->value('dir_id');
            if(!empty($res_dir_id)) $exist = 1;
        }

        if($exist == 0){
            $parent_id = 0;
            $class_diff = $end_dir['class_id']-1;
            foreach($dir_list as &$row){
                $row['class_id'] -= $class_diff;
            }
        }

        Db::startTrans();
        try{
            $flag = true;
            $data = ['is_delete' => 0 , 'u_time'=>time()];
            foreach($dir_list as $one){
                $data['class_id'] = $one['class_id'];
                Db::table('dir')->where(['dir_id'=>$one['dir_id'],'uid'=>$uid])->update($data);
            }
            unset($data['class_id']);
            $dir_ids = array_column($dir_list,'dir_id');
            Db::table('note')->where(['uid'=>$uid,'is_delete'=>1])->where('dir_id','in',$dir_ids)->update($data);
            Db::commit(); // 提交事务
        } catch (\Exception $e) {
            $flag = false;
            Db::rollback(); // 回滚事务
        }

        if($flag){
            $sort_list = Db::table('dir')->where(['uid'=>$uid,'is_delete'=>0,'parent_id'=>$parent_id])->order('rank desc')->order('dir_id asc')->column('dir_id');
            splash('succ','目录已恢复',['type'=>'dir','parent_id'=>$parent_id,'sort_list'=>$sort_list]);
        }else{
            splash('error','目录恢复失败，请刷新重试','dir');
        }
    }


    public function update_name(){
        $uid = $this->uid;
        $request = Request::instance();
        $dir_id = $request->param('id');
        $name = $request->param('name');
        $data = ['dir_name' => $name ,'u_time'=>time()];
        $res = Db::table('dir')->where(['dir_id'=>$dir_id,'uid'=>$uid])->update($data);
        if($res) splash('succ','重命名成功');
    }

    public function update_group_name(){
        $request = Request::instance();
        $group_id = $request->param('id');
        $name = $request->param('name');
        $data = ['group_name' => $name ,'u_time'=>time()];
        $res = Db::table('group')->where(['group_id'=>$group_id])->update($data);
        if($res) splash('succ','重命名成功');
    }

    public function note_item(){
        $uid = $this->uid;
        $request = Request::instance();
        $rec_id = $request->param('rec_id');
        $res = Db::table('note')->where(['rec_id'=>$rec_id])->find();
        splash('succ','',$res);
    }

    public function delete_note(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $rec_id = $request->param('id');
        $data = ['is_delete' => 1 , 'u_time'=>time()];
        $res = Db::table('note')->where(['rec_id'=>$rec_id,'uid'=>$uid])->update($data);
        if($res) splash('succ','删除笔记成功');
        else splash('error','删除笔记失败，请刷新重试');
    }

    public function note_trash_delete(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $rec_id = $request->param('id');
        $data = ['is_delete' => 1 , 'u_time'=>time()];
        $res = Db::table('note')->where(['rec_id'=>$rec_id,'uid'=>$uid])->delete();
        if($res) splash('succ','删除笔记成功');
        else splash('error','删除笔记失败，请刷新重试');
    }

    public function trash_all(){
        $uid = $this->uid;
        Db::startTrans();
        try{
            $flag = true;
            Db::table('dir')->where(['uid'=>$uid,'is_delete'=>1])->delete();
            Db::table('note')->where(['uid'=>$uid,'is_delete'=>1])->delete();
            Db::commit(); // 提交事务
        } catch (\Exception $e) {
            $flag = false;
            Db::rollback(); // 回滚事务
        }
        if($flag) splash('succ','清空回收站成功');
        else splash('error','清空回收站失败，请刷新重试');
    }

    public function note_recover(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $rec_id = $request->param('id');
        $data = ['is_delete' => 0 , 'u_time'=>time()];

        //笔记隶属的目录
        $parent_id = Db::table('note')->alias('n')->join('dir d','n.dir_id = d.dir_id')->where(['n.rec_id'=>$rec_id,'n.uid'=>$uid,'d.is_delete'=>0])->value('n.dir_id');
        if(empty($parent_id)) $data['dir_id'] = 0;
        $res = Db::table('note')->where(['rec_id'=>$rec_id,'uid'=>$uid])->update($data);
        if($res) splash('succ','恢复笔记成功',['type'=>'note','parent_id'=>$parent_id]);
        else splash('error','恢复笔记失败，请刷新重试');
    }

    public function note_update(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $rec_id = $request->param('rec_id');
        $title = trim($request->param('title'));
        $precont = $request->param('precont');
        $content = $request->param('content');
        $md5cont = md5($content);

        if(empty($title)) splash('error','标题不能为空');
        if($md5cont == $precont) splash('succ','保存成功');

        $data = ['uid'=>$uid,'title'=>$title,'content'=>$content,'md5'=>$md5cont,'u_time'=>$time,'c_time'=>$time];
        $res = Db::table('note')->where(['rec_id'=>$rec_id,'uid'=>$uid])->update($data);
        splash('succ','保存成功',$md5cont);
    }

    public function update_drap_note(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $rec_id = $request->param('rec_id');
        $dir_id = $request->param('dir_id');
        $group_id = $request->param('group_id');
        $data = ['dir_id'=>$dir_id,'group_id'=>$group_id,'u_time'=>$time,'is_delete'=>0];
        Db::table('note')->where('rec_id', $rec_id)->update($data);
        splash('succ','拖放笔记成功');
    }

    public function update_note_name(){
        $uid = $this->uid;
        $request = Request::instance();
        $rec_id = $request->param('id');
        $title = $request->param('name');
        $data = ['title' => $title ,'u_time'=>time()];
        $res = Db::table('note')->where(['rec_id'=>$rec_id,'uid'=>$uid])->update($data);
        splash('succ','重命名成功');
    }

    public function update_note_sort(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $list = $request->param('list/a');
        foreach($list as $item){
            $data = ['rank' => $item[1] , 'u_time'=>time()];
            $res = Db::table('note')->where('rec_id', $item[0])->update($data);
        }
        splash('succ','排序成功');
    }

    public function note_create(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $title = '新建笔记';
        $content = '';
        $dir_id = $request->param('dir_id');
        $group_id = $request->param('group_id');

        $data = ['dir_id' => $dir_id,'group_id'=>$group_id, 'uid'=>$uid,'title'=>$title,'content'=>$content,'md5'=>md5($content),'u_time'=>$time,'c_time'=>$time];
        $rec_id = Db::name('note')->insertGetId($data);

        if($rec_id) splash('succ','新建笔记成功',['rec_id'=>$rec_id,'title'=>$title,'time'=>date('Y-m-d',$time)]);
        else splash('error','新建笔记失败，请刷新重试');
    }

    public function note_search(){
        $uid = $this->uid;
        $request = Request::instance();
        $search = trim($request->param('search'));
        $list = Db::table('note')->where(['uid'=>$uid,'is_delete'=>0])->where('title','like','%'.$search.'%')->order('rec_id desc')->field('rec_id,dir_id,group_id,title,c_time')->select();
        foreach($list as &$item){
            $item['time'] = date('Y-m-d',$item['c_time']);
        }
        splash('succ','搜索结果',$list);
    }


    public function nesting($res,$type = 0){
        //type=0时按第一级展示,不等于0时按外层展示，外层不一定是第一级
        $max_class = 1;
        $list = $data = [];
        foreach($res as $item){
            if($item['class_id'] > $max_class) $max_class = $item['class_id'];
            $list[$item['dir_id']] = $item;
        }

        for($i=$max_class ; $i>1 ; $i--){
            foreach($list as $key=>$row){
                if($row['class_id'] != $i) continue;
                if(!empty($list[$row['parent_id']])){
                    $list[$row['parent_id']]['child'][] = $row;
                    unset($list[$key]);
                    continue;
                }
                if($type == 1) continue;
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
