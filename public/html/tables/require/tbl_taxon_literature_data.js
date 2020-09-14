(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

    var parentForm = tableInstance.parentObject;

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option0',
            title: 'Watch files',
            disabled: function () {
                return false;
            },
            callback: function () {


                var row = tableInstance.ct_instance.selectedRowIndex;
                var l_id = tableInstance.data.data[row]['id'];

                var o = {
                    command:'get',
                    object:'literature_data_file',
                    params:{
                        param_where: {
                            literature_data_id: l_id
                        }
                    }
                };

                socketQuery(o, function(res){
                    if(!res.code == 0){
                        toastr[res.toastr.type](res.toastr.message);
                        return false;
                    }


                    var tpl = '{{#files}}<div class="l-file-item" data-fileid="{{file_id}}"><span class="l-file-name">{{file}}</span> <i class="download-l-file fa fa-download"></i></div>{{/files}}';
                    var mo = {
                        files: []
                    }

                    for(var i in res.data){
                        var f = res.data[i];

                        mo.files.push(f);

                    }

                    bootbox.dialog({
                        title: 'Literature data files',
                        message: Mustache.to_html(tpl, mo),
                        buttons: {
                            error: {
                                label: 'close',
                                callback: function(){

                                }
                            }
                        }
                    });

                    $('.download-l-file').off('click').on('click', function(){

                        var file_id = $(this).parents('.l-file-item').attr('data-fileid');
                        var document_name = $(this).parents('.l-file-item').find('.l-file-name').html();

                        var o = {
                            command:'download',
                            object:'File',
                            params:{
                                id:file_id
                            }
                        };

                        socketQuery(o, function (res) {

                            var fileName = res.path + res.filename;
                            var linkName = 'my_download_link' + MB.Core.guid();
                            $("body").prepend('<a id="'+linkName+'" href="' + res.path + '?filename='+ res.filename +'" download="'+ document_name + res.extension +'" style="display:none;"></a>');

                            var jqElem = $('#'+linkName);
                            jqElem[0].click();
                            jqElem.remove();
                            //$("#my_download_link").remove();
                        });

                    });


                });
            }
        }
    ];

}());