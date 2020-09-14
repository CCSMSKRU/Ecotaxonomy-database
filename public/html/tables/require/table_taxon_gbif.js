(function () {

    var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
    var tableInstance = MB.Tables.getTable(tableNId);

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
            name: 'importToMain',
            title: 'Import to main',
            disabled: function(){
                return false;
            },
            callback: function(){

                // вот так вынимать данные выбранной строки:

                var id = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['id'];

                bootbox.dialog({
                    title: 'Import taxon to main taxons table?',
                    message: 'It may take a few minutes.<br><label>Import children?</label><input type="checkbox" class="form-control" id="import-children" />',
                    buttons:{
                        success: {
                            label: 'Ok',
                            callback: function(){

                                var checked = $('#import-children')[0].checked;

                                // тут твой код
                                var o = {
                                    command:'importToMainTable',
                                    object:'taxon_gbif',
                                    params:{
                                        id:id,
                                        import_childs:checked,

                                    }
                                };
                                socketQuery(o, function(r){
                                    console.log(r);
                                });


                            }
                        },
                        importAllByFilter: {
                            label: 'Import by filter',
                            callback: function() {

                                var checked = $('#import-children')[0].checked;

                                var o = {
                                    command: 'importToMainTableByFilter',
                                    object: 'taxon_gbif',
                                    params: {
                                        id: id,
                                        import_childs: checked,
                                        filterWhere: tableInstance.ct_instance.filterWhere,
                                        infoOptions: {
                                            selector: '#' + tableInstance.wrapper.find('.ct-loader-percent').attr('id')
                                        }
                                    }
                                };

                                socketQuery(o, function (r) {
                                    console.log(r);
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
