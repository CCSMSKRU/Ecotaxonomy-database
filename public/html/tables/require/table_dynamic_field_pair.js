(function () {

    var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
    var tableInstance = MB.Tables.getTable(tableNId);

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'syncAll',
            title: 'Sync All',
            disabled: function(){
                return false;
            },
            callback: function(){
                var row = tableInstance.ct_instance.selectedRowIndex;
                var o = {
                    command:'sync_all',
                    object:'dynamic_field_pair',
                    params:{
                        id:tableInstance.data.data[row].id
                    }
                };
                socketQuery(o, function(r){
                    console.log(r);
                });
            }
        }

    ];




}());
