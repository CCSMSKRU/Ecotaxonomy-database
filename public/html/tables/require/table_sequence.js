(function () {
    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);


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
            title: 'Primers',
            disabled: function(){
                return false;
            },
            callback: function(){
                let o = {
                    command: 'get',
                    object: 'primer_pair',
                    params: {
                        limit: 1
                    },
                }
                socketQuery(o, res => {
                    if (res.data[0]) {
                        let formId = MB.Core.guid();
                        let row = tableInstance.ct_instance.selectedRowIndex;
                        let id = tableInstance.data.data[row]['id'];

                        let form = new MB.FormN({
                            id: formId,
                            name: 'form_primer_pair',
                            class: 'primer_pair',
                            client_object: 'form_primer_pair',
                            type: 'form',
                            ids: [],
                            params: {
                                sequence_name: tableInstance.data.data[row]['name'],
                                sequence_id: id
                            },
                            position: 'center'
                        });

                        form.create(function () {

                        });
                    }
                })



                // tableInstance.openRowInModal();
            }
        }
    ];

}());
