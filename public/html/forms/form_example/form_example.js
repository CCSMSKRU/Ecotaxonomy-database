(function(){

    var modal = $('.mw-wrap').last();
    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_example', formID);
    var formWrapper = $('#mw-'+formInstance.id);

    var id = formInstance.activeId;

    var se_tbl = formInstance.tblInstances[0];

    var exampleEditor = {
        changes: [],
        tree: [],
        init: function () {
            exampleEditor.getTree(function () {

                exampleEditor.populateTree();

            });

            exampleEditor.setHandlers();

        },

        reload: function(cb){
            exampleEditor.setHandlers();
        },

        getTree: function (cb) {

            var o = {
                command: 'getTree',
                object: formInstance.class,
                client_object: formInstance.name,
                params: {
                    id: formInstance.activeId
                }
            };

            socketQuery(o, function (res) {

                if (res.code != 0) {
                    toastr[res.toastr.type](res.toastr.message);
                    return;
                }

                exampleEditor.tree = res.tree;


                if (typeof cb == 'function') {
                    cb();
                }

            });

        },


        populateTree: function () {
            var holder = formWrapper.find('.example-tree-holder');

            holder.jstree({
                'core':{
                    'multiple' : false,
                    'data': function(node, cb){
                        if(node.id === "#") {
                            cb(exampleEditor.tree.core.data);
                        }
                        else {
                            // debugger;
                            var o = {
                                command:'getTreeChilds',
                                object: formInstance.class,
                                client_object: formInstance.name,
                                params:{
                                    id: node.id
                                }
                            };

                            socketQuery(o, function(res){

                                if(!res.code == 0){
                                    toastr[res.toastr.type](res.toastr.message);
                                    return false;
                                }

                                cb(res.tree.core.data);
                            });
                        }
                    }
                }
            });


            holder.on('open_node.jstree', function (e,a) {

                console.log('open_node.jstree', a);

            });

            holder.on('select_node.jstree', function (e,a) {
                var id = a.node.id;
                formInstance.activeId = id;
                formInstance.tablePKeys['data'][0] = id;

                formInstance.reloadByActiveId(function(newFormInstance){
                    exampleEditor.reload();
                    formWrapper.find('.name-place').html(formInstance.data.data[0].name);

                });
            });



        },

        setHandlers: function () {



        }
    };

    //exampleEditor.getAll();

    formInstance.doNotGetScript = true;
    formInstance.afterReload = function(cb){
        // Можно запихнуть все что нужно вызвать при релоаде без загрузки нового скрипта.
        exampleEditor.reload();
        cb();
    };
    exampleEditor.init();



}());
