(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

    var parentForm = tableInstance.parentObject;

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Open',
            disabled: function(){
                return false;
            },
            callback: function(){

                    var formId = MB.Core.guid();
                var row = tableInstance.ct_instance.selectedRowIndex;
                var p_id = tableInstance.data.data[row]['id'];

                var openInModalO = {
                    id: formId,
                    name: 'form_storage',
                    class: 'storage',
                    client_object: 'form_storage',
                    type: 'form',
                    ids: [p_id],
                    position: 'center',

                    tablePKeys: {data_columns: ["id"], data: [p_id]}
                };

                var form = new MB.FormN(openInModalO);
                form.project_id = tableInstance.data.data[row].project_id;
                form.create(function () {

                });
            }
        }

    ];

}());