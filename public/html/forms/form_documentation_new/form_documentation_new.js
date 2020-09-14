(function(){

    var modal = $('.mw-wrap').last();
    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_documentation_new', formID);
    var formWrapper = $('#mw-'+formInstance.id);

    var id = formInstance.activeId;

    var se_tbl = formInstance.tblInstances[0];

    var doc = {
        changes: [],
        tree: [],
        init: function () {

            doc.setHandlers();

        },

        reload: function(cb){
            doc.setHandlers();
        },
        setHandlers: function () {



        }
    };

    //exampleEditor.getAll();

    formInstance.doNotGetScript = true;
    formInstance.afterReload = function(cb){
        // Можно запихнуть все что нужно вызвать при релоаде без загрузки нового скрипта.
        doc.reload();
        cb();
    };
    doc.init();



}());
