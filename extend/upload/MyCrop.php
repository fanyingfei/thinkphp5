<?php

namespace upload;

class MyCrop {

    private $filename;
	private $destname;  	
    private $ext;  
    private $x;  
    private $y;  
    private $src_width;  
    private $src_height;  
    private $dest_width;  
    private $dest_height;  
    private $jpeg_quality = 90;  

    /** 
     * 初始化截图对象 
     *@param filename 源文件路径全明 
     *@param x  横坐标1 
     *@param y  纵坐标1 
     *@param width  截图的宽 
     *@param height  截图的高 
     *  
     */  
    public function initialize($filename, $destname, $x, $y, $dest_width, $dest_height, $src_width, $src_height)  
    {  
        if(file_exists($filename))  
        {  
            $this->filename = $filename; 
			$this->destname = $destname; 
            $pathinfo = pathinfo($filename);  
            $this->ext = $pathinfo['extension'];
			$this->dest_width = $dest_width;
			$this->dest_height = $dest_height;
			$this->src_width = $src_width;
			$this->src_height = $src_height;
			//print_r($img);
        }  
        else  
        {  
         //   $e = new Exception('the file is not exists!',1050);
          //  throw $e;
        }  
        $this->x = $x;  
        $this->y = $y;     
        // $this->x1 = $x1;   
        // $this->y1 = $y1;   
    }  
    /** 
     * 生成截图 
     * 根据图片的格式，生成不同的截图 
     */  
    public function generate_shot()  
    {  
        switch($this->ext)  
        {  
            case 'jpg': 
			case 'jpeg': 
                return $this->generate_jpg();  
                break;  
            case 'png':  
                return $this->generate_png();  
                break;  
            case 'gif':  
                return $this->generate_gif();  
                break;  
            default:  
                return false;  
        }  
    }  
    /** 
     * 得到生成的截图的文件名 
     *  
     */  
    // private function get_shot_name()  
    // {  
        // $pathinfo = pathinfo($this->filename);  
        // $fileinfo = explode('.',$pathinfo['basename']);  
        // $filename = $fileinfo[0] . '_small.' . $this->ext;  
        // return $pathinfo['dirname'] . '/' .$filename;  
    // }  
    /** 
     * 生成jpg格式的图片 
     *  
     */  
    private function generate_jpg()  
    {  
        $shot_name = $this->destname;  
        $img_r = imagecreatefromjpeg($this->filename);
        $dst_r = ImageCreateTrueColor($this->dest_width, $this->dest_height);  
        imagecopyresampled($dst_r, $img_r, 0, 0, $this->x, $this->y, $this->dest_width, $this->dest_height, $this->src_width, $this->src_height);  
        return imagejpeg($dst_r,$shot_name,$this->jpeg_quality);  
        //return $shot_name;  
    }  
    /** 
     * 生成gif格式的图片 
     *  
     */  
    private function generate_gif()  
    {  
        $shot_name = $this->destname;  
        $img_r = imagecreatefromgif($this->filename);  
        $dst_r = ImageCreateTrueColor($this->dest_width, $this->dest_height); 
		imagecopyresampled($dst_r, $img_r, 0, 0, $this->x, $this->y, $this->dest_width, $this->dest_height, $this->src_width, $this->src_height);  
        return imagegif($dst_r,$shot_name);  
        //return $shot_name;  
    }  
    /** 
     * 生成png格式的图片 
     *  
     */  
    private function generate_png()  
    {  
        $shot_name = $this->destname;  
        $img_r = imagecreatefrompng($this->filename);  
        $dst_r = ImageCreateTrueColor($this->dest_width, $this->dest_height); 
		imagecopyresampled($dst_r, $img_r, 0, 0, $this->x, $this->y, $this->dest_width, $this->dest_height, $this->src_width, $this->src_height);  
        return imagepng($dst_r,$shot_name);  
        //return $shot_name;  
    }  
}
