(function () {

    var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
    var tableInstance = MB.Tables.getTable(tableNId);

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Set as default',
            disabled: function(){
                return false;
            },
            callback: function(){
                var id = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['id'];
                bootbox.dialog({
                    title: 'Please, confirm',
                    message: 'Set this record as default?',
                    buttons:{
                        success: {
                            label: 'Confirm',
                            callback: function(){
                                var o = {
                                    command:'setDefault',
                                    object:'Copyright',
                                    params:{
                                        id:id
                                    }
                                };
                                socketQuery(o, function(r){
                                    tableInstance.reload();
                                });
                            }
                        },
                        error:{
                            label: 'Cancel',
                            callback: function(){

                            }
                        }
                    }
                })
            }
        }

    ];

}());