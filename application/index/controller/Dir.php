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
    private $colList = ['rank'=>'rank','create'=>'c_time','update'=>'u_time','name'=>'convert(name USING gbk) COLLATE gbk_chinese_ci'];
    //delete 0-未删除 , 1-删除 , 2-彻底删除

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
                $item['dir_list'] = $this->nesting($item['dir_list']);
                $this->change_group_list($item['dir_list']);
            }
        }

        splash('succ','',$group_list);
    }

    public function group_item(){
        $uid = $this->uid;
        $request = Request::instance();
        $group_id = $request->param('group_id');

        $group_list = Db::table('group')->where('group_id',$group_id)->field('group_id,version,group_name,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->find();

        $dir_res = Db::table('dir')->where('is_delete',0)->where('group_id', $group_id)->order('rank desc')->order('dir_id asc')->field('dir_id,dir_name,class_id,group_id,parent_id,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();

        $group_list['dir_list'] = $this->nesting($dir_res);
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
            elseif($user_group['invite'] == $this->groupAgree) splash('error','对方已经是协作组成员');
        }

        $data = ['group_id' => $group_id, 'uid'=>$uid,'inviter'=>$uid,'u_time'=>$time,'c_time'=>$time];
        $rec_id = Db::name('user_group')->insertGetId($data);
        if($rec_id) splash('succ','邀请成功，等待对方同意');
        else splash('error','邀请失败，请刷新重试');
    }


    public function polling_info(){
        $uid = $this->uid;
        $invite_list = $group_list = [];
        $my_group = Db::table('user_group')->alias('ug')->join('group g','ug.group_id = g.group_id')->join('user u','ug.inviter = u.uid')
            ->where(['ug.uid'=>$uid])->field('ug.group_id,u.user_name,g.group_name,g.version,ug.invite')->select();
        foreach($my_group as $item){
            if($item['invite'] == $this->groupAgree){
                $group_list[] = $item;
            }elseif($item['invite'] == $this->groupWait){
                $invite_list[] = $item;
            }
        }
        splash('succ','',['invite_list'=>$invite_list,'group_list'=>$group_list]);
    }

    public function invite_agree_refuse(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $group_id = $request->param('group_id');
        $invite = $request->param('invite');
        if(!in_array($invite,[$this->groupRefuse,$this->groupAgree])) splash('error','操作失败，请刷新重试');

        $res = Db::table('user_group')->where(['uid'=>$uid,'group_id'=>$group_id])->update(['invite'=>$invite,'u_time'=>$time]);
        $msg = $invite == $this->groupRefuse ? '邀请已拒绝' : '同意邀请成功，你已加入协作组';

        //添加记录
        if($invite == $this->groupAgree) $this->group_log($uid,$group_id,'加入协作组','user');
        if($res) splash('succ',$msg);
        else splash('error','操作失败，请刷新重试');
    }

    public function item_list_group(){
        $request = Request::instance();
        $group_id = $request->param('group_id');

        $dir_res = Db::table('dir')->where(['group_id'=>$group_id,'is_delete'=>0])->order('rank desc')->order('dir_id asc')->field('dir_id,dir_name,group_id,class_id,parent_id,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();
        $dir_res = $this->nesting($dir_res);
        $note_res = Db::table('note')->where(['group_id'=>$group_id,'is_delete'=>0,'dir_id'=>0])->order('rank desc')->order('rec_id desc')->field('rec_id,name,dir_id,group_id,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();
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

        if($group_id > 0){
            $dir_res = Db::table('dir')->where(['is_delete'=>0,'parent_id'=>$dir_id,'group_id'=>$group_id])->order($col.' '.$sort)->order('dir_id asc')->field('dir_id,dir_name,group_id,class_id,parent_id,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();
            $note_res = Db::table('note')->where(['is_delete'=>0,'dir_id'=>$dir_id])->order($col.' '.$sort)->order('rec_id desc')->field('rec_id,name,dir_id,group_id,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();
        }else{
            $dir_res = Db::table('dir')->where(['uid'=>$uid,'is_delete'=>0,'parent_id'=>$dir_id,'group_id'=>$group_id])->order($col.' '.$sort)->order('dir_id asc')->field('dir_id,dir_name,group_id,class_id,parent_id,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();
            $note_res = Db::table('note')->where(['uid'=>$uid,'is_delete'=>0,'dir_id'=>$dir_id,'group_id'=>$group_id])->order($col.' '.$sort)->order('rec_id desc')->field('rec_id,name,dir_id,group_id,FROM_UNIXTIME(c_time, "%Y-%m-%d") as time')->select();
        }
        splash('succ','',['dir'=>$dir_res,'note'=>$note_res]);
    }

    public function trash_list(){
        $uid = $this->uid;
        $res = Db::table('dir')->where(['del_uid'=>$uid,'is_delete'=>1])->order('u_time asc')->field('dir_id,dir_name,class_id,group_id,parent_id,FROM_UNIXTIME(u_time, "%Y-%m-%d") as time')->select();
        $dir_res = $this->nesting($res);
        $note_res = Db::table('note')->where(['del_uid'=>$uid,'is_delete'=>1])->order('u_time desc')->field('rec_id,name,dir_id,group_id,FROM_UNIXTIME(u_time, "%Y-%m-%d") as time')->select();

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

        if($dir_id){
            if($group_id > 0) $this->group_log($uid,$group_id,'新建目录','dir');
            splash('succ','新建文件夹成功',['dir_id'=>$dir_id,'group_id'=>$group_id,'dir_name'=>$name,'class_id'=>$class_id,'time'=>date('Y-m-d',$time)]);
        }else{
            splash('error','新建文件夹失败，请刷新重试');
        }
    }

    public function create_group(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $name = '新建协作组';

        $data = ['group_name' => $name, 'uid'=>$uid,'u_time'=>$time,'c_time'=>$time];
        $group_id = Db::name('group')->insertGetId($data);

        $user_group = ['uid'=>$uid,'group_id'=>$group_id,'invite'=>$this->groupAgree,'inviter'=>$uid,'u_time'=>$time,'c_time'=>$time];
        Db::name('user_group')->insertGetId($user_group);
        if($group_id){
            $this->group_log($uid,$group_id,'创建协作组','group');
            splash('succ','新建协作组成功',['group_id'=>$group_id,'version'=>0,'group_name'=>$name,'time'=>date('Y-m-d',$time)]);
        }else{
            splash('error','新建协作组失败，请刷新重试');
        }
    }

    public function update_drap_dir(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $list = $request->param('list/a');
        $parent_id = $request->param('parent_id');
        $group_id = $request->param('group_id');
        $cur_dir = $request->param('cur_dir');
        $cur_group = $request->param('cur_group');
        $cur_name = $request->param('cur_name');
        $parent_name = $request->param('parent_name');

        $drag_dir = Db::table('dir')->where(['dir_id'=>$cur_dir,'group_id'=>$cur_group,'is_delete'=>0])->field('uid')->find();
        if(empty($drag_dir)) splash('error','该目录不存在');
        if($cur_group > 0 && $group_id != $cur_group) splash('error','协作组内的目录只能在协作组内拖动');

        foreach($list as $key=>$item){
            $data = ['dir_id'=>$item[0],'class_id' => $item[1] ,'parent_id'=>$item[2],'group_id'=>$group_id,'u_time'=>$time,'is_delete'=>0];
            if($data['dir_id'] == $cur_dir) $data['rank'] = -1;
            if($data['parent_id'] == 0) $data['class_id'] = 1;
            if($data['class_id'] > $this->maxDir) splash('error','最多拥有'.$this->maxDir.'层目录');
            $list[$key] = $data;
        }

        foreach($list as $row){
            $dir_id = $row['dir_id'];
            unset($row['dir_id']);
            $res = Db::table('dir')->where('dir_id', $dir_id)->update($row);
            $note_data = ['group_id'=>$group_id,'u_time'=>$time,'is_delete'=>0];
            Db::table('note')->where('dir_id', $dir_id)->update($note_data);
        }

        if($res){
            if($group_id == $cur_group){
                $this->group_log($uid,$group_id,'拖动目录['.$cur_name.']到['.$parent_name.']','dir');
            }elseif($group_id == 0 && $cur_group > 0){
                $this->group_log($uid,$cur_group,'将目录['.$cur_name.']拖离协作组','dir');
            }elseif($group_id > 0 && $cur_group == 0){
                $this->group_log($uid,$group_id,'将目录['.$cur_name.']拖入协作组','dir');
            }elseif($group_id > 0 && $cur_group > 0){
                $this->group_log($uid,$cur_group,'将目录['.$cur_name.']拖离协作组','dir');
                $this->group_log($uid,$group_id,'将目录['.$cur_name.']拖入协作组','dir');
            }
            splash('succ','拖放目录成功');
        }else{
            splash('error','拖放目录失败，请刷新重试');
        }
    }

    public function update_dir_sort(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $list = $request->param('list/a');
        $group_id = $request->param('group_id');
        $parent_name = $request->param('parent_name');

        foreach($list as $item){
            $data = ['rank' => $item[1] , 'u_time'=>time()];
            $res = Db::table('dir')->where('dir_id', $item[0])->update($data);
        }
        if($res){
            if($group_id > 0 ) $this->group_log($uid,$group_id,'操作['.$parent_name.']目录下文件夹排序','dir');
            splash('succ','排序成功','dir');
        }else{
            splash('error','排序失败，请刷新重试');
        }
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
        if($res) splash('succ','排序成功','group');
        else splash('error','排序失败，请刷新重试');
    }

    public function delete_dir(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $dir_ids = $request->param('id/a');
        $name = $request->param('name');
        $group_id = $request->param('group_id');
        if(empty($dir_ids)) splash('error','请选择要删除的目录');

        $data = ['is_delete' => 1,'del_uid'=>$uid,'rank'=>-1 , 'u_time'=>time()];
        if($group_id > 0 ){
            $res = Db::table('dir')->where('group_id',$group_id)->where('dir_id','in',$dir_ids)->update($data);
            Db::table('note')->where('group_id',$group_id)->where('dir_id','in',$dir_ids)->update($data);
        }else{
            $res = Db::table('dir')->where('uid',$uid)->where('dir_id','in',$dir_ids)->update($data);
            Db::table('note')->where('uid',$uid)->where('dir_id','in',$dir_ids)->update($data);
        }
        if($res){
            if($group_id > 0) $this->group_log($uid,$group_id,'删除了目录['.$name.']','dir');
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
        if($res){
            $this->group_log($uid,$group_id,'退出协作组','user');
            splash('succ','删除成功');
        }else{
            splash('error','删除失败，请刷新重试');
        }
    }

    public function dir_trash_delete(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $dir_ids = $request->param('id/a');
        $group_id = $request->param('group_id');
        if(empty($dir_ids)) splash('error','请选择要删除的目录');

        $data = ['is_delete'=>2,'u_time'=>$time];
        if($group_id > 0){
            $res = Db::table('dir')->where('group_id',$group_id)->where('dir_id','in',$dir_ids)->update($data);
            Db::table('note')->where('group_id',$group_id)->where('dir_id','in',$dir_ids)->update($data);
        }else{
            $res = Db::table('dir')->where('del_uid',$uid)->where('dir_id','in',$dir_ids)->update($data);
            Db::table('note')->where('del_uid',$uid)->where('dir_id','in',$dir_ids)->update($data);
        }

        if($res){
            splash('succ','彻底删除目录成功','dir');
        }
        else splash('error','彻底删除目录失败，请刷新重试');
    }

    //回收站恢复
    public function dir_recover(){
        $exist = 0;
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $res_list = $request->param('id/a');
        $name = $request->param('name');
        $cur_dir = $request->param('cur_dir');
        $group_id = $request->param('group_id');
        if(empty($res_list)) splash('error','请选择要恢复的目录');

        $dir_list = [];
        foreach($res_list as $key=>$item){
            $dir_list[$item[0]] = ['dir_id'=>$item[0],'class_id' => $item[1]];
        }

        $pre_res = Db::table('dir')->where(['dir_id'=>$cur_dir,'del_uid'=>$uid])->field('parent_id,uid')->find();
        $parent_id = $pre_res['parent_id'];
        $pre_uid = $pre_res['uid'];

        //父级目录在的时候
        if(!empty($parent_id)){
            $res_dir_id = Db::table('dir')->where(['dir_id'=>$parent_id,'uid'=>$pre_uid,'is_delete'=>0])->value('dir_id');
            if(!empty($res_dir_id)) $exist = 1;
        }

        if($exist == 0){
            $parent_id = 0;
            $class_diff = $dir_list[$cur_dir]['class_id']-1;
            foreach($dir_list as &$row){
                $row['class_id'] -= $class_diff;
            }
            $dir_list[$cur_dir]['parent_id'] = $parent_id;
        }

        Db::startTrans();
        try{
            $flag = true;
            $data = ['is_delete' => 0 ,'del_uid'=>0, 'u_time'=>time()];
            foreach($dir_list as $one){
                $data['class_id'] = $one['class_id'];
                Db::table('dir')->where(['dir_id'=>$one['dir_id'],'del_uid'=>$uid])->update($data);
            }
            unset($data['class_id']);
            $dir_ids = array_column($dir_list,'dir_id');
            Db::table('note')->where(['del_uid'=>$uid,'is_delete'=>1])->where('dir_id','in',$dir_ids)->update($data);
            Db::commit(); // 提交事务
        } catch (\Exception $e) {
            $flag = false;
            Db::rollback(); // 回滚事务
        }

        if($flag){
            if($group_id > 0) $this->group_log($uid,$group_id,'恢复了目录['.$name.']','dir');
            splash('succ','目录已恢复',['type'=>'dir','parent_id'=>$parent_id]);
        }else{
            splash('error','目录恢复失败，请刷新重试','dir');
        }
    }


    public function update_dir_name(){
        $uid = $this->uid;
        $request = Request::instance();
        $dir_id = $request->param('id');
        $name = $request->param('name');
        $prename = $request->param('prename');
        $group_id = $request->param('group_id');
        $data = ['dir_name' => $name ,'u_time'=>time()];
        if($group_id > 0){
            $res = Db::table('dir')->where(['dir_id'=>$dir_id,'group_id'=>$group_id])->update($data);
        }else{
            $res = Db::table('dir')->where(['dir_id'=>$dir_id,'uid'=>$uid])->update($data);
        }

        if($group_id > 0) $this->group_log($uid,$group_id,'重命名目录['.$prename.']为['.$name.']','dir');
        if($res) splash('succ','重命名成功','dir');
    }

    public function update_group_name(){
        $uid = $this->uid;
        $request = Request::instance();
        $group_id = $request->param('id');
        $name = $request->param('name');
        $prename = $request->param('prename');
        $data = ['group_name' => $name ,'u_time'=>time()];
        $res = Db::table('group')->where(['group_id'=>$group_id])->update($data);
        $this->group_log($uid,$group_id,'重命名协作组['.$prename.']为['.$name.']','dir');
        if($res) splash('succ','重命名成功','group');
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
        $name = $request->param('name');
        $group_id = $request->param('group_id');
        $data = ['is_delete' => 1 ,'del_uid'=>$uid, 'u_time'=>time()];
        if($group_id > 0){
            $res = Db::table('note')->where(['rec_id'=>$rec_id,'group_id'=>$group_id])->update($data);
        }else{
            $res = Db::table('note')->where(['rec_id'=>$rec_id,'uid'=>$uid])->update($data);
        }
        if($res){
            if($group_id > 0) $this->group_log($uid,$group_id,'删除笔记['.$name.']','note');
            splash('succ','删除笔记成功');
        }else{
            splash('error','删除笔记失败，请刷新重试');
        }
    }

    public function note_trash_delete(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $rec_id = $request->param('id');
        $group_id = $request->param('group_id');
        $data = ['is_delete' => 2 , 'u_time'=>time()];

        if($group_id > 0){
            $res = Db::table('note')->where(['rec_id'=>$rec_id,'group_id'=>$group_id])->update($data);
        }else{
            $res = Db::table('note')->where(['rec_id'=>$rec_id,'uid'=>$uid])->update($data);
        }

        if($res) splash('succ','删除笔记成功');
        else splash('error','删除笔记失败，请刷新重试');
    }

    public function trash_all(){
        $time = time();
        $uid = $this->uid;
        Db::startTrans();
        try{
            $flag = true;
            $data = ['is_delete'=>2,'u_time'=>$time];
            Db::table('dir')->where(['del_uid'=>$uid,'is_delete'=>1])->update($data);
            Db::table('note')->where(['del_uid'=>$uid,'is_delete'=>1])->update($data);
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
        $name = $request->param('name');
        $group_id = $request->param('group_id');
        $data = ['is_delete' => 0 , 'u_time'=>time()];

        //笔记隶属的目录
        $parent_id = Db::table('note')->alias('n')->join('dir d','n.dir_id = d.dir_id')->where(['n.rec_id'=>$rec_id,'n.del_uid'=>$uid,'d.is_delete'=>0])->value('n.dir_id');
        if(empty($parent_id)) $data['dir_id'] = 0;
        $res = Db::table('note')->where(['rec_id'=>$rec_id,'del_uid'=>$uid])->update($data);
        if($res){
            if($group_id > 0) $this->group_log($uid,$group_id,'恢复笔记['.$name.']','note');
            splash('succ','恢复笔记成功',['type'=>'note','parent_id'=>$parent_id]);
        }else{
            splash('error','恢复笔记失败，请刷新重试');
        }
    }

    public function note_update(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $rec_id = $request->param('rec_id');
        $name = trim($request->param('name'));
        $group_id = $request->param('group_id');
        $precont = $request->param('precont');
        $content = $request->param('content');
        $md5cont = md5($content);

        if(empty($name)) splash('error','标题不能为空');

        if($group_id > 0){
            $pre_note = Db::table('note')->where('rec_id',$rec_id)->field('group_id,md5')->find();
            if($group_id != $pre_note['group_id']) splash('error','笔记不在协作组内');
            if($precont != $pre_note['md5']) splash('error','笔记内容已经被改变，请刷新后修改');
        }

        if($md5cont == $precont) splash('succ','保存成功');

        $data = ['uid'=>$uid,'name'=>$name,'content'=>$content,'md5'=>$md5cont,'u_time'=>$time,'c_time'=>$time];
        $res = Db::table('note')->where(['rec_id'=>$rec_id,'uid'=>$uid])->update($data);
        if($group_id > 0) $this->group_log($uid,$group_id,'修改了笔记['.$name.']','note');
        splash('succ','保存成功',$md5cont);
    }

    public function update_drap_note(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $rec_id = $request->param('rec_id');
        $cur_group = $request->param('cur_group');
        $dir_id = $request->param('dir_id');
        $group_id = $request->param('group_id');

        if($cur_group > 0 && $cur_group != $group_id) splash('error','协作组内的笔记只能在协作组内拖动');

        $data = ['dir_id'=>$dir_id,'group_id'=>$group_id,'rank'=>-1,'u_time'=>$time,'is_delete'=>0];
        Db::table('note')->where('rec_id', $rec_id)->update($data);
        splash('succ','拖放笔记成功');
    }

    public function update_note_name(){
        $uid = $this->uid;
        $request = Request::instance();
        $rec_id = $request->param('id');
        $group_id = $request->param('group_id');
        $prename = $request->param('prename');
        $name = $request->param('name');
        $data = ['name' => $name ,'u_time'=>time()];
        if($group_id > 0){
            $res = Db::table('note')->where(['rec_id'=>$rec_id,'group_id'=>$group_id])->update($data);
        }else{
            $res = Db::table('note')->where(['rec_id'=>$rec_id,'uid'=>$uid])->update($data);
        }

        if($group_id > 0) $this->group_log($uid,$group_id,'重命名笔记['.$prename.']为['.$name.']','note');
        splash('succ','重命名成功','note');
    }

    public function update_note_sort(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $list = $request->param('list/a');
        $group_id = $request->param('group_id');
        foreach($list as $item){
            $data = ['rank' => $item[1] , 'u_time'=>time()];
            $res = Db::table('note')->where('rec_id', $item[0])->update($data);
        }
        if($group_id > 0) $this->group_log($uid,$group_id,'拖放笔记','note');
        splash('succ','排序成功','note');
    }

    public function note_create(){
        $time = time();
        $uid = $this->uid;
        $request = Request::instance();
        $group_id = $request->param('group_id');
        $name = '新建笔记';
        $content = '';
        $dir_id = $request->param('dir_id');
        $group_id = $request->param('group_id');

        $data = ['dir_id' => $dir_id,'group_id'=>$group_id, 'uid'=>$uid,'name'=>$name,'content'=>$content,'md5'=>md5($content),'u_time'=>$time,'c_time'=>$time];
        $rec_id = Db::name('note')->insertGetId($data);

        if($rec_id){
            if($group_id > 0) $this->group_log($uid,$group_id,'新建笔记','note');
            splash('succ','新建笔记成功',['rec_id'=>$rec_id,'group_id'=>$group_id,'name'=>$name,'time'=>date('Y-m-d',$time)]);
        }else{
            splash('error','新建笔记失败，请刷新重试');
        }
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

    public function  get_group_log(){
        $uid = $this->uid;
        $request = Request::instance();
        $group_id = $request->param('group_id');
        $res_list = Db::table('group_log')->where(['group_id'=>$group_id])->order('rec_id desc')->field('uid,msg,c_time')->limit(1000)->select();
        $uid_list = array_column($res_list,'uid');
        $user_list = Db::table('user')->where('uid','in',$uid_list)->column('user_name','uid');

        $log_list = [];
        foreach($res_list as &$item){
            if(empty($user_list[$item['uid']])) continue;
            $date = date('Y-m-d',$item['c_time']);
            $time = date('H:i:s',$item['c_time']);
            $log_list[$date][] = ['time'=>$time,'user_name'=>$user_list[$item['uid']],'msg'=>$item['msg']];
        }

        splash('succ','历史记录',$log_list);
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

    function group_log($uid,$group_id,$msg='',$type = ''){
        Db::table('group_log')->insert(['uid' =>$uid, 'group_id' =>$group_id,'msg'=>$msg,'c_time'=>time()]);
        if($type == 'group' || $type == 'dir') Db::table('group')->where('group_id',$group_id)->setInc('version');
    }

    function user_group($uid,$group_id){
        $res = Db::table('user_group')->where(['uid'=>$uid,'group_id'=>$group_id])->find();
        if(empty($res)) splash('error','你不在该协作组');
    }
}
