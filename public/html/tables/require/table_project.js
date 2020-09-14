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
            name: 'option2',
            title: 'Create child project',
            disabled: function(){
                return false;
            },
            callback: function(){

                var row = tableInstance.ct_instance.selectedRowIndex;
                var p_id = tableInstance.data.data[row]['id'];

                bootbox.dialog({
                    title: 'New project',
                    message: '<div class="form-group"><label>Name:</label><input type="text" class="form-control" id="new-proj-name"></div>',
                    buttons: {
                        success: {
                            label: 'Create',
                            callback: function(){

                                var o = {
                                    command: 'add',
                                    object: 'project',
                                    params: {
                                        parent_id: p_id,
                                        name: $('#new-proj-name').val()
                                    }
                                };

                                socketQuery(o, function(res){

                                    if(!res.code == 0){
                                        toastr[res.toastr.type](res.toastr.message);
                                        return false;
                                    }

                                    tableInstance.reload();

                                    var newid = res.id;

                                    var formId = MB.Core.guid();

                                    var form = new MB.FormN({
                                        id: formId,
                                        name: 'form_project',
                                        class: 'project',
                                        client_object: 'form_project',
                                        type: 'form',
                                        ids: [newid],
                                        position: 'center'
                                    });
                                    form.create(function () {

                                    });

                                });

                            }
                        },
                        error: {
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