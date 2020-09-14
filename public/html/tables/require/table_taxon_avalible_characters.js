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
            name: 'addDynamicField',
            title: 'Set as dynamic',
            disabled: function(){
                return false;
            },
            callback: function(){
                var row = tableInstance.ct_instance.selectedRowIndex;

                var html =  '<div class="row">' +
                    '<div class="col-md-12">' +
                        '<div class="form-group">' +
                            '<form>' +
                                '<div class="add-holder">' +
                                    '<input type="radio" id="addRadio" name="add_remove_radio" value="add">' +
                                    '<label for="addRadio"> Add</label>' +
                                    '<div class="bootbox-label">Select client object destination:</div>' +
                                    '<div  id="choose-dynamicFieldPair" class="deny-select-3-wrapper"></div>' +
                                '</div>'+
                                '<hr>' +
                                '<div class="remove-holder">' +
                                    '<input type="radio" id="removeRadio" name="add_remove_radio" value="remove">' +
                                    '<label for="removeRadio"> Remove</label>' +
                                '</div>' +
                            '</form>' +
                        '</div>' +
                    '</div>'+
                '</div>';


                var selInstance;

                var sel_arr = tableInstance.ct_instance.selection2.data;
                var ids = [];

                // for (var i in d) {
                //     ids.push(d[i].id);
                //
                // }

                var o = {
                    command:'sync',
                    object:'dynamic_field_pair',
                    params:{
                        type_sysname_key:'trait_type_sysname',
                        source_id:null
                    }

                };
                var dialogInstance = bootbox.dialog({
                    title: 'Set column as dynamic',
                    message: html,
                    buttons: {
                        success: {
                            label: 'Confirm',
                            callback: function(){
                                if(!selInstance){
                                    toastr.info('No client object selected');
                                    return;
                                }
                                o.params.id = selInstance.value.id;

                                async.eachSeries(sel_arr, function(item, cb){
                                    o.params.source_id = item.id;
                                    socketQuery(o, function(res){
                                        cb(null);
                                    });
                                }, (err, res)=>{
                                    toastr.info('Done');
                                });
                            }
                        },
                        cancel: {
                            label: 'Отмена',
                            callback: function(){

                            }
                        }
                    }
                });
                $('input[type=radio][name=add_remove_radio]').change(function() {
                    if (this.value == 'add') {
                        $('.bootbox-label').css({ filter: 'unset' });
                        $(selInstance.wrapper).css({ filter: 'unset' });
                        selInstance = initSelect3()
                    }
                    else if (this.value == 'remove') {
                        selInstance.dropData();
                        $('.bootbox-label').css({ filter: 'blur(1px)' });
                        $(selInstance.wrapper).css({ filter: 'blur(1px)' });
                        $(selInstance.wrapper).find('.select3-select').off('click');
                    }
                });

                dialogInstance.removeAttr('tabindex');

                var denySelId = MB.Core.guid();
                var default_where = [
                    {
                        key:'source_class_id',
                        val1:tableInstance.profile.extra_data.object_profile.class_id
                    }
                ];

                function initSelect3() {
                    return MB.Core.select3.init({
                        id :                denySelId,
                        wrapper:            $('#choose-dynamicFieldPair'),
                        column_name:        'id',
                        class:              'dynamic_field_pair',
                        return_id:          'id', // Не прокинуты в select3 (используется данные из профайла колонки)
                        return_name:        'name', // Не прокинуты в select3 (используется данные из профайла колонки)
                        rowId:              row.id,
                        default_where:default_where,
                        withSearch:         true,
                        withEmptyValue:     false,
                        absolutePosition:   true,
                        isFilter:           false,
                        value: {},
                        additionalClass:    ''
                    });
                }
                var selInstance = initSelect3();





                // var denySelId = MB.Core.guid();
                //
                // selInstance = MB.Core.select3.init({
                //     id :                denySelId,
                //     wrapper:            $('#choose-dynamicFieldPair'),
                //     column_name:        'id',
                //     class:              'dynamic_field_pair',
                //     client_object:      '',
                //     return_id:          'id',
                //     return_name:        'name',
                //     withSearch:         true,
                //     withEmptyValue:     true,
                //     absolutePosition:   true,
                //     isFilter:           false,
                //     parentObject:       {},
                //     value: {},
                //     additionalClass:    ''
                // });



                //
                //
                // var o = {
                //     command:'sync',
                //     object:'dynamic_field',
                //     params:{
                //         id:tableInstance.data.data[row].id
                //     }
                // };
                // socketQuery(o, function(r){
                //     console.log(r);
                //     tableInstance.reload();
                // });
            }
        }
    ];




}());
