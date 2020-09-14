(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

    var parentForm = tableInstance.parentObject;

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option0',
            title: 'Split',
            disabled: function () {

                var row = tableInstance.ct_instance.selectedRowIndex;
                var count = tableInstance.data.data[row].individual_count;

                return count <= 1;

            },
            callback: function () {

                var row = tableInstance.ct_instance.selectedRowIndex;
                var id = tableInstance.data.data[row].id;
                var current_count = tableInstance.data.data[row].individual_count;

                var tpl = `<div id="split-individual-holder">
                            <div class="form-group">
                                <label>Set count:</label>
                                <input type="number" id="split-individual-count" class="form-control" value="0" min="0" max="${current_count - 1}" />                      
                            </div>
                            </div>`;

                var row_id = tableInstance.data.data[row].storage_id;
                var taxon_id = tableInstance.data.data[row].taxon_id;


                bootbox.dialog({
                    title: 'Split',
                    message: tpl,
                    buttons: {
                        success: {
                            label: 'Confirm',
                            callback: function(){

                                var count = $('#split-individual-count').val();

                                if(+count >= +current_count || +count <= 0){
                                    toastr['info']('Count must be more than 0 and lower then '+ current_count);
                                }else{

                                    var o = {
                                        command: 'split',
                                        object: 'data_individual',
                                        params: {
                                            count: count,
                                            id: id
                                        }
                                    };

                                    socketQuery(o, function(res){
                                        if(!res.code == 0){
                                            toastr[res.toastr.type](res.toastr.message);
                                            return false;
                                        }

                                        tableInstance.reload();

                                    });

                                }

                            }
                        },
                        error: {
                            label: 'Cancel',
                            callback: function(){

                            }
                        }
                    }
                });

                // var item = formWrapper.find('.light-table-holder-taxon').eq(loaded);
                // var taxon_id = item.attr('data-id');


                // var light_table = new MB.TableN({
                //     name: 'some name',
                //     client_object: 'split_storage_data_individual',
                //     class: 'data_individual',
                //     id: MB.Core.guid(),
                //     virtual_data: {
                //         // virtual_where: 'project_taxon',
                //         taxon_id: taxon_id,
                //         storage_id: row_id
                //     }
                // });
                //
                // light_table.create($('#split-individual-holder'), function () {
                //     console.log('new table rendered');
                //
                //     $('#split-individual-holder').find('.ct-btn-create-inline').trigger('click');
                //
                // });

            }
        }
    ];

}());

