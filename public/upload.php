<?php
if(!empty($_FILES["wangEditorH5File"])) $file= $_FILES["wangEditorH5File"];
if(!empty($_FILES["wangEditorDragFile"])) $file= $_FILES["wangEditorDragFile"];
if(!empty($_FILES["wangEditorPasteFile"])) $file= $_FILES["wangEditorPasteFile"];

if ($file["size"] > 2000)
{
    if ($file["error"] > 0)
    {
        echo "Return Code: " . $file["error"] . "<br />";
    }
    else
    {
        if (file_exists("upload/" . $file["name"]))
        {
            echo $file["name"] . " already exists. ";
        }
        else
        {
            move_uploaded_file($file["tmp_name"], "upload/" . $file["name"]);
            echo "/upload/" . $file["name"];exit;
        }
    }
}
else
{
    echo "Invalid file";
}
?> 