(function () {

    var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
    var tableInstance = MB.Tables.getTable(tableNId);

    if (!tableInstance.profile.class_fields_profile){
        tableInstance.profile.class_fields_profile = {};
        for (var i in tableInstance.profile.data) {
            tableInstance.profile.class_fields_profile[tableInstance.profile.data[i].column_name] = tableInstance.profile.data[i];
        }
    }

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Open',
            disabled: function(){
                return false;
            },
            callback: function(){
                tableInstance.openRowInModal();
            }
        },
        {
            name: 'clearValue',
            title: 'Clear value',
            disabled: function(){
                var col = tableInstance.ct_instance.selectedColIndex;
                console.log('===>',col);
                var colProfile = tableInstance.profile.class_fields_profile[col];
                return !(colProfile.dynamic_field_id)
            },
            callback: function(){
                var row = tableInstance.ct_instance.selectedRowIndex;
                var col = tableInstance.ct_instance.selectedColIndex;
                var colProfile = tableInstance.profile.class_fields_profile[col];
                bootbox.dialog({
                    title: 'Clear value',
                    message: 'Are you sure?',
                    buttons:{
                        success: {
                            label: 'Clear',
                            callback: function(){
                                alert('Clear value');
                                // var o = {
                                //     command:'',
                                //     object:'Taxon',
                                //     params:{
                                //         id:tableInstance.data.data[row].id
                                //     }
                                // };
                                // socketQuery(o, function(r){
                                //     console.log(r);
                                //     tableInstance.reload();
                                // });

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
