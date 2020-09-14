var traitsEditor;
(function(){

    var modal = $('.mw-wrap').last();
    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_project', formID);
    var formWrapper = $('#mw-'+formInstance.id);

    var id = formInstance.activeId;

    //var o = {
    //    command:'getTree',
    //    object:'Taxon',
    //    params:{
    //        id:id
    //    }
    //};
    //socketQuery(o, function(res){
    //    //$('.taxon-tree-holder').JSONRenderer();
    //    //
    //    //$('.taxon-tree-holder').JSONRenderer('refreshData', res.tree[0]);
    //});


    traitsEditor = {
        changes: [],
        traits: [],
        ic_traits: [],
        trait_selects: [],
        tree: [],
        parentTraits: [],
        ic_parentTraits: [],
        parentPictures: [],
        taxonPictures: [],
        sameLevelPictures: [],
        pictureTypes:[],
        articlesPage: 0,
        articles_search_keyword: '',

        init: function () {
            traitsEditor.getTree(function () {

                traitsEditor.populateTree();

            });
        },
        getTree: function (cb) {

            var o = {
                command: 'getTree',
                object: 'Project',
                params: {
                    id: formInstance.activeId
                }
            };

            socketQuery(o, function (res) {

                if(res.code != 0){
                    toastr[res.toastr.type](res.toastr.message);
                    return;
                }

                traitsEditor.tree = res.tree;

                console.log('TREWEEEEEEEE', res.tree);

                if(typeof cb == 'function'){
                    cb();
                }

            });

        },

        populateTree: function () {

            var holder = formWrapper.find('.taxon-tree-holder');

            holder.jstree(traitsEditor.tree);

            holder.on('select_node.jstree', function (e) {

                console.log('NODE', e);


            });

        }

    };


    //traitsEditor.getAll();
    traitsEditor.init();













}());