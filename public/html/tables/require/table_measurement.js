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
        }//,
        // {
        //     name: 'addDynamicField',
        //     title: 'Insert column (deprecated)',
        //     disabled: function(){
        //         return true;
        //     },
        //     callback: function(){
        //         var row = tableInstance.ct_instance.selectedRowIndex;
        //
        //         var html =  '<div class="row">' +
        //             '<div class="col-md-12">' +
        //             '<div class="form-group">' +
        //             '<div class="bootbox-label">Выберите клиентский объект назначения:</div>' +
        //             '<div  id="choose-dynamicFieldPair" class="deny-select-3-wrapper"></div>' +
        //             '</div>' +
        //             '</div>'+
        //             '</div>';
        //
        //
        //         var selInstance;
        //
        //         var o = {
        //             command:'sync',
        //             object:'dynamic_field_pair',
        //             params:{
        //                 source_id:tableInstance.data.data[row].id
        //             }
        //
        //         };
        //
        //         bootbox.dialog({
        //             title: 'Insert column',
        //             message: html,
        //             buttons: {
        //                 success: {
        //                     label: 'Подтвердить',
        //                     callback: function(){
        //
        //                         if(selInstance){
        //                             o.params.id = selInstance.value.id;
        //                         }
        //
        //                         socketQuery(o, function(res){
        //
        //                             if(!res.code){
        //
        //                             }
        //
        //
        //                         });
        //                     }
        //                 },
        //                 cancel: {
        //                     label: 'Отмена',
        //                     callback: function(){
        //
        //                     }
        //                 }
        //             }
        //         });
        //
        //         var denySelId = MB.Core.guid();
        //
        //         selInstance = MB.Core.select3.init({
        //             id :                denySelId,
        //             wrapper:            $('#choose-dynamicFieldPair'),
        //             column_name:        'id',
        //             class:              'dynamic_field_pair',
        //             client_object:      '',
        //             return_id:          'id',
        //             return_name:        'name',
        //             withSearch:         true,
        //             withEmptyValue:     true,
        //             absolutePosition:   true,
        //             isFilter:           false,
        //             parentObject:       {},
        //             value: {},
        //             additionalClass:    ''
        //         });
        //
        //         //
        //         //
        //         // var o = {
        //         //     command:'sync',
        //         //     object:'dynamic_field',
        //         //     params:{
        //         //         id:tableInstance.data.data[row].id
        //         //     }
        //         // };
        //         // socketQuery(o, function(r){
        //         //     console.log(r);
        //         //     tableInstance.reload();
        //         // });
        //     }
        // }
    ];




}());