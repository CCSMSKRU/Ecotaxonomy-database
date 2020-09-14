(function(){

    var frameID = MB.Frames.justLoadedId;
    var frameInstance = MB.Frames.getFrame('frame_example', frameID);
    // var frameWrapper = $('#mw-'+frameInstance.id);
    var frameWrapper = frameInstance.container;


    var id = frameInstance.activeId;

    var se_tbl = frameInstance.tblInstances[0];

    var frameEditor = {
        changes: [],
        tree: [],
        init: function () {
            frameEditor.getTree(function () {

                frameEditor.populateTree();

            });

            frameEditor.setHandlers();

        },

        reload: function(cb){
            frameEditor.setHandlers();
        },

        getTree: function (cb) {

            var o = {
                command: 'getTree',
                object: 'Example',
                params: {
                    id: frameInstance.activeId
                }
            };

            socketQuery(o, function (res) {

                if (res.code != 0) {
                    toastr[res.toastr.type](res.toastr.message);
                    return;
                }

                frameEditor.tree = res.tree;


                if (typeof cb == 'function') {
                    cb();
                }

            });

        },


        populateTree: function () {
            var holder = frameWrapper.find('.example-tree-holder');

            holder.jstree({
                'core':{
                    'multiple' : false,
                    'data': function(node, cb){
                        if(node.id === "#") {
                            cb(frameEditor.tree.core.data);
                        }
                        else {
                            // debugger;
                            var o = {
                                command:'getTreeChilds',
                                object:'Example',
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
                frameInstance.activeId = id;
                frameInstance.tablePKeys['data'][0] = id;

                frameInstance.reloadByActiveId(function(newFormInstance){
                    frameEditor.reload();
                    frameWrapper.find('.name-place').html(frameInstance.data.data[0].name);

                });
            });



        },

        setHandlers: function () {



        }
    };

    //frameEditor.getAll();

    frameInstance.doNotGetScript = true;
    frameInstance.afterReload = function(cb){
        // Можно запихнуть все что нужно вызвать при релоаде без загрузки нового скрипта.
        frameEditor.reload();
        cb();
    };
    frameEditor.init();



}());
