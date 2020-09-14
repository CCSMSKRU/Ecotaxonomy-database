(function () {

    let tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

    let parentForm = tableInstance.parentObject;

    let selected_event_id = $('#mw-'+tableInstance.parentObject.id).attr('data-selected-event-id');

    tableInstance.parent_id = selected_event_id;
    tableInstance.reload()


}());