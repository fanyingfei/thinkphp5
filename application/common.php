<?php
// +----------------------------------------------------------------------
// | ThinkPHP [ WE CAN DO IT JUST THINK ]
// +----------------------------------------------------------------------
// | Copyright (c) 2006-2016 http://thinkphp.cn All rights reserved.
// +----------------------------------------------------------------------
// | Licensed ( http://www.apache.org/licenses/LICENSE-2.0 )
// +----------------------------------------------------------------------
// | Author: 流年 <liu21st@gmail.com>
// +----------------------------------------------------------------------
use think\Session;

// 应用公共文件
function splash($status , $msg,$data=''){
    $arr = array('status'=>$status,'msg'=>$msg,'result'=>$data);
    ajax_response(json_encode($arr));
}

function ajax_response($response){

    if(is_array($response))$response = json_encode($response);

    if(!empty($_REQUEST['jsonpcallback'])){
        header('content-type:text/javascript;charset＝utf-8');
        $response = $_REQUEST['jsonpcallback']."(".$response.")";
    }

    die($response);
}

function set_login($res){
    Session::set('uid',$res['uid']);
}

function post_fsockopen($url = '', $post = array() , $method = 'POST', $header = null, $timeout = 20 ){
    if (empty($url)) return '';
    $url = parse_url($url);
    $method = strtoupper(trim($method));
    $method = empty($method) ? 'GET' : $method;
    $scheme = strtolower($url['scheme']);
    $host = $url['host'];
    $path = $url['path'];
    empty($path) and ($path = '/');
    $query = empty($url['query']) ? '' :  $url['query'];
    $port = isset($url['port']) ? (int)$url['port'] : ('https' == $scheme ? 443 : 80);
    $protocol = 'https' == $scheme ? 'ssl://' : '';

    if (!$res = fsockopen($protocol.$host, (int)$port, $errno, $errstr, (int)$timeout)) {
        return '';
        //   return array('error' => mb_convert_encoding($errstr, 'UTF-8', 'UTF-8,GB2312'), 'errorno' => $errno);
    } else {
        $crlf = "\r\n";
        $commonHeader = $method == 'PROXY' ? array() : array(
            'Host' => $host,
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36',
            'Content-Type' => 'POST' == $method ? 'application/x-www-form-urlencoded' : 'text/html; charsert=UTF-8',
            'Connection' => 'Close'
        );
        is_array($header) and ($commonHeader = array_merge($commonHeader, $header));

        foreach ($commonHeader as $key => & $val) {
            $val = str_replace(array("\n", "\r", ':'), '', $val);
            $key = str_replace(array("\n", "\r", ':'), '', $key);
            $val = "{$key}: {$val}{$crlf}";
        }

        if ($method == 'PROXY') {
            $post = trim(str_replace(array("\n", "\r"), '', $post)).$crlf;

            if (empty($post)) return array('error' => '使用代理时,必须指定代理请求方法($post参数)');
        } else if (!is_array($post)) {
            $post = array();
        }

        switch ($method) {
            case 'POST':
                $post_msg = '';
                foreach($post as $k => $v) {
                    $post_msg .= $k.'='.$v.'&';
                }
                $post = trim($post_msg,'&');
                $query = empty($query) ? '' : '?'.$query;
                $commonHeader[] = 'Content-Length: '.strlen($post).$crlf;
                $post = empty($post) ? '' : $crlf.$post.$crlf;
                $commonHeader = implode('', $commonHeader);
                $request = "{$method} {$path}{$query} HTTP/1.0{$crlf}"
                    ."{$commonHeader}"
                    .$post
                    .$crlf;//表示提交结束了
                break;
            case 'PROXY'://代理
                $commonHeader = implode('', $commonHeader);
                $request =  $post
                    .$commonHeader
                    .$crlf;//表示提交结束了
                break;
            case 'GET':
            default:
                empty($query) ? ($query = array()) : parse_str($query, $query);
                $query = array_merge($query, $post);
                $query = http_build_query($query);
                $commonHeader = implode('', $commonHeader);
                $query = empty($query) ? '' : '?'.$query;
                $request =  "{$method} {$path}{$query} HTTP/1.1{$crlf}"
                    ."{$commonHeader}"
                    .$crlf;//表示提交结束了
        }

        fwrite($res, $request);
        $reponse = '';

        while (!feof($res)) {
            $reponse .= fgets($res, 128);
        }

        fclose($res);
        $pos = strpos($reponse, $crlf . $crlf);//查找第一个分隔
        if($pos === false) return $reponse;
        $header = substr($reponse, 0, $pos);
        $body = substr($reponse, $pos + 2 * strlen($crlf));
        return $body;
    }
}

function random($length = 4) {
    $hash = '';
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
    $max = strlen($chars) - 1;
    PHP_VERSION < '4.2.0' && mt_srand((double)microtime() * 1000000);
    for($i = 0; $i < $length; $i++) {
        $hash .= $chars[mt_rand(0, $max)];
    }
    return $hash;
}