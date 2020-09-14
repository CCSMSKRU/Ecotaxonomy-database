(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);


    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option3',
            title: 'Rollback changes',
            disabled: function(){
                return false;
            },
            callback: function(){

                var row = tableInstance.ct_instance.selectedRowIndex;

                bootbox.dialog({
                    title: 'Are you sure?',
                    message: 'Rollback changes?<br>',
                    buttons: {
                        confirm: {
                            label: 'Yes I confirm',
                            callback: function(){
                                var row = tableInstance.ct_instance.selectedRowIndex;
                                var id = tableInstance.data.data[row].id;
                                var o = {
                                    command: 'rollback',
                                    object: 'rollback_backup',
                                    params: {id: id}
                                };

                                socketQuery(o, function (res) {
                                    console.log(res);
                                });
                            }
                        },
                        cancel: {
                            label: 'Cancel',
                            callback: function(){

                            }
                        }
                    }
                });
            }
        }
    ];

}());
