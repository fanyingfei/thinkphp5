<?php

if ($_FILES["wangEditorH5File"]["size"] > 200000)
{
    if ($_FILES["wangEditorH5File"]["error"] > 0)
    {
        echo "Return Code: " . $_FILES["file"]["error"] . "<br />";
    }
    else
    {
        if (file_exists("upload/" . $_FILES["wangEditorH5File"]["name"]))
        {
            echo $_FILES["wangEditorH5File"]["name"] . " already exists. ";
        }
        else
        {
            move_uploaded_file($_FILES["wangEditorH5File"]["tmp_name"],
                "upload/" . $_FILES["wangEditorH5File"]["name"]);
            echo "/upload/" . $_FILES["wangEditorH5File"]["name"];exit;
        }
    }
}
else
{
    echo "Invalid file";
}
?> 