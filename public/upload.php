<?php
if(!empty($_FILES["wangEditorH5File"])) $file= $_FILES["wangEditorH5File"];
if(!empty($_FILES["wangEditorDragFile"])) $file= $_FILES["wangEditorDragFile"];
if(!empty($_FILES["wangEditorPasteFile"])) $file= $_FILES["wangEditorPasteFile"];

if ($file["size"] > 2000)
{
    $path = 'upload/'.date('Ymd').'/';
    if ($file['error'] > 0) {
        echo "error : " . $file['error'];
    }else{
        if (file_exists($path . $file['name'])) {
            echo $file['name'] . ' already exists. ';
        }else{
            move_uploaded_file($file['tmp_name'], $path. $file['name']);
            echo $path . $file['name'];exit;
        }
    }
}else{
    echo "Invalid file";
}
?> 