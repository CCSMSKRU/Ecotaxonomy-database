(function(){
    var modal = $('.mw-wrap').last();
    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_data_individual', formID);
    var formWrapper = $('#mw-'+formInstance.id);

    var id = formInstance.activeId;
    var taxon_id = formInstance.data.data[0].taxon_id;



    var traitsEditor = {
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

	        traitsEditor.getPictureTypes();

	        traitsEditor.getParentTraits(function () {

		        traitsEditor.populateParentTraits();

		        traitsEditor.getTraits(function () {

			        traitsEditor.populateTraits();

			        traitsEditor.setHandlers();

		        });


	        });

	        traitsEditor.getTree(function () {

		        traitsEditor.populateTree();

	        });

	        traitsEditor.getParentPictures(function () {

		        traitsEditor.populateParentPictures();
		        traitsEditor.setHandlers();

	        });

	        traitsEditor.getTaxonPictures(function () {

		        traitsEditor.populateTaxonPictures();
		        traitsEditor.setHandlers();

	        });

	        traitsEditor.getSamePictures(function () {

		        traitsEditor.populateSamePictures();
		        traitsEditor.setHandlers();

	        });

	        traitsEditor.setName();

        },


        getParentTraits: function (cb) {

            var o = {
                command: 'getParentTraits',
                object: 'taxon',
                params: {
                    id: taxon_id
                }
            };

            socketQuery(o, function (res) {
                if(res.code != 0){
                    toastr[res.toastr.type](res.toastr.message);
                }

                traitsEditor.parentTraits = res.traits;
                traitsEditor.ic_parentTraits = res.characters;

                if(typeof cb == 'function'){
                    cb();
                }

            });

        },

        populateParentTraits: function () {

            var tpl = '<div class="tep-list-holder row">' +
                '{{#params}}<div class="tep-item-holder col-md-4" data-id="{{id}}" data-type="{{trait_type_sysname}}"><div class="parent-trait">' +
                '<label>{{name}}:</label><div class="parent-trait-value1-holder">{{value1}}</div>&nbsp;&nbsp;<div class="parent-trait-value2-holder">{{value2}}</div>' +
                //'<div class="tep-tod-holder" data-type="{{trait_type_sysname}}" data-value1="{{value1}}" data-value2="{{value2}}"></div>' +
                '</div><div class="trait-top-taxon-link" data-id="{{taxon_id}}">{{taxon_name}}</div></div>{{/params}}' +
                '</div>';

            var mo = {
                params: []
            };

            var mo2 = {
                params: []
            };

            for(var i in traitsEditor.parentTraits){

                mo.params.push({
                    id: traitsEditor.parentTraits[i].id,
                    name: traitsEditor.parentTraits[i].name,
                    trait_type_sysname: traitsEditor.parentTraits[i].trait_type_sysname,
                    value1: traitsEditor.parentTraits[i].value1,
                    value2: traitsEditor.parentTraits[i].value2,
                    taxon_id: traitsEditor.parentTraits[i].taxon_id,
                    taxon_name: traitsEditor.parentTraits[i].taxon_name
                });

            }

            for(var i in traitsEditor.ic_parentTraits){

                mo2.params.push({
                    id: traitsEditor.ic_parentTraits[i].id,
                    name: traitsEditor.ic_parentTraits[i].name,
                    trait_type_sysname: traitsEditor.ic_parentTraits[i].trait_type_sysname,
                    value1: traitsEditor.ic_parentTraits[i].value1,
                    value2: traitsEditor.ic_parentTraits[i].value2,
                    taxon_id: traitsEditor.ic_parentTraits[i].taxon_id,
                    taxon_name: traitsEditor.ic_parentTraits[i].taxon_name
                });

            }


            if(traitsEditor.parentTraits && Object.keys(traitsEditor.parentTraits).length > 0) {
                formWrapper.find('.parent-taxon-traits').html(Mustache.to_html(tpl, mo));
            }

            if(traitsEditor.ic_parentTraits && Object.keys(traitsEditor.ic_parentTraits).length > 0) {
                formWrapper.find('.ic-parent-taxon-traits').html(Mustache.to_html(tpl, mo2));
            }


        },


        getTraits: function (cb) {


            var o = {
                command: 'getTraits',
                object: 'taxon',
                params: {
                    id: formInstance.activeId
                }
            };

            socketQuery(o, function (res) {
                if(res.code != 0){
                    toastr[res.toastr.type](res.toastr.message);
                }

                traitsEditor.traits = res.traits;
                traitsEditor.ic_traits = res.characters;


                if(typeof cb == 'function'){
                    cb();
                }

            });




        },

        populateTraits: function () {


            var tpl = '<div class="tep-list-holder row">' +
                '{{#params}}<div class="tep-item-holder col-md-4" data-id="{{id}}" data-triaitid="{{trait_id}}" data-type="{{trait_type_sysname}}">' +
                '<label>{{name}}</label>' +
                '<div class="tep-tod-holder" data-type="{{trait_type_sysname}}" data-value1="{{value1}}" data-value2="{{value2}}"></div>' +
                '<div class="tep-remove" data-id="{{id}}"><i class="fa fa-times"></i>&nbsp;&nbsp;Remove param</div>' +
                '<div class="tep-description" data-id="{{id}}"><i class="fa fa-question-circle-o"></i>&nbsp;&nbsp;Information</div>' +
                '</div>{{/params}}' +
                '</div>';

            var mo = {
                params: []
            };

            var mo2 = {
                params: []
            };

            function getTraitById(id){

                var traitsFound = false;
                var res = undefined;

                for(var i in traitsEditor.traits){
                    if(traitsEditor.traits[i].id == id){
                        traitsFound = true;
                        res = traitsEditor.traits[i];
                    }
                }

                if(!traitsFound){
                    for(var i in traitsEditor.ic_traits){
                        if(traitsEditor.ic_traits[i].id == id){
                            res = traitsEditor.ic_traits[i];
                        }
                    }
                }

                return res;

            };



            for(var i in traitsEditor.traits){

                mo.params.push({
                    id: traitsEditor.traits[i].id,
                    trait_id: traitsEditor.traits[i].taxon_avalible_trait_id,
                    name: traitsEditor.traits[i].name,
                    trait_type_sysname: traitsEditor.traits[i].trait_type_sysname,
                    value1: traitsEditor.traits[i].value1,
                    value2: traitsEditor.traits[i].value2
                });

            }

            for(var i in traitsEditor.ic_traits){

                mo2.params.push({
                    id: traitsEditor.ic_traits[i].id,
                    trait_id: traitsEditor.ic_traits[i].taxon_avalible_trait_id,
                    name: traitsEditor.ic_traits[i].name,
                    trait_type_sysname: traitsEditor.ic_traits[i].trait_type_sysname,
                    value1: traitsEditor.ic_traits[i].value1,
                    value2: traitsEditor.ic_traits[i].value2
                });

            }


            if(traitsEditor.traits && Object.keys(traitsEditor.traits).length > 0) {
                formWrapper.find('.taxon-traits').html(Mustache.to_html(tpl, mo));
            }

            if(traitsEditor.ic_traits && Object.keys(traitsEditor.ic_traits).length > 0){
                formWrapper.find('.ic-taxon-traits').html(Mustache.to_html(tpl,mo2));
            }




            for(var i=0; i<formWrapper.find('.sc_taxon-traits-holder .tep-tod-holder').length;i++){

                var ep = formWrapper.find('.sc_taxon-traits-holder .tep-tod-holder').eq(i);
                var epitem = ep.parents('.tep-item-holder');
                var type = ep.attr('data-type');
                var fld;
                var insert = ep;
                var tod_id = type;

                var trait = getTraitById(epitem.attr('data-id'));
                var sub_table_name_for_select = trait.sub_table_name_for_select;

                var value1 = ep.attr('data-value1');
                var value2 = ep.attr('data-value2');

                switch (type){

                    case 'SHORT_TEXT':

                        fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><input type="text" class="ap-value ap-field-editor" value="'+value1+'"/></div>';
                        insert.html(fld);

                        break;

                    case 'INTEGER':

                        fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><input type="number" class="ap-value ap-field-editor" value="'+value1+'"/></div>';
                        insert.html(fld);



                        break;

                    case 'INTEGERRANGE':

                        fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><input type="number" class="ap-value ap-value-1 ap-field-editor ap-field-editor-1" value="'+value1+'"/><input type="number" class="ap-value ap-value-2 ap-field-editor ap-field-editor-2" value="'+value2+'"/></div>';
                        insert.html(fld);

                        break;

                    case 'FLOAT':

                        fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><input type="number" step="0.1" class="ap-value ap-field-editor" value="'+value1+'"/></div>';
                        insert.html(fld);

                        break;

                    case 'FLOATRANGE':

                        fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><input type="number" step="0.1" class="ap-value ap-value-1 ap-field-editor ap-field-editor-1" value="'+value1+'"/><input type="number" step="0.1" class="ap-value ap-value-2 ap-field-editor ap-field-editor-2" value="'+value2+'"/></div>';
                        insert.html(fld);

                        break;

                    case 'DATE':

                        fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><input type="text" class="ap-field-date ap-field-editor"  value="'+value1+'"/></div>';
                        insert.html(fld);

                        insert.find('.ap-field-date').datepicker({
                            autoclose: true,
                            todayHighlight: true,
                            //minuteStep: 10,
                            keyboardNavigation: false,
                            todayBtn: true,
                            firstDay: 1,
                            format: 'dd.mm.yyyy',
//                startDate: '-infinity',
                            weekStart: 1,
                            language: "en"
                        });

                        break;

                    case 'DATERANGE':

                        fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><input type="text" class="ap-field-date ap-field-date-1 ap-field-editor ap-field-editor-1"  value="'+value1+'"/><input type="text" class="ap-field-date ap-field-date-2 ap-field-editor ap-field-editor-2" value="'+value2+'"></div>';
                        insert.html(fld);

                        insert.find('.ap-field-date').datepicker({
                            autoclose: true,
                            todayHighlight: true,
                            //minuteStep: 10,
                            keyboardNavigation: false,
                            todayBtn: true,
                            firstDay: 1,
                            format: 'dd.mm.yyyy',
//                startDate: '-infinity',
                            weekStart: 1,
                            language: "en"
                        });

                        break;

                    case 'IMAGE':

                        fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><div class="ap-field-editor ap-field-image">'+value1+'</div></div>';
                        insert.html(fld);

                        break;

                    case 'FILE':

                        fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><div class="ap-field-editor ap-field-file">'+value1+'</div></div>';
                        insert.html(fld);

                        break;

                    case 'SELECT':

                        fld = '<div class="ep-tod-holder" data-id="'+tod_id+'" data-type="select" data-get="'+sub_table_name_for_select+'"><select class="select2-item" data-get="'+sub_table_name_for_select+'"><option value="'+value2+'" selected>'+value1+'</option></select></div>';

                        insert.html(fld);

                        break;

                    case 'MULTISELECT':

                        fld = '<div class="ep-tod-holder" data-id="'+tod_id+'" data-type="multiselect">' +
                        '<div class="ap-lov-item-add"><i class="fa fa-plus"></i>&nbsp;&nbsp;Add list item</div>' +
                        '<div class="ap-lov-insert"></div>'+
                        '</div>';

                        insert.html(fld);

                        var sel_insert = insert.find('.ap-lov-insert');

                        insert.find('.ap-lov-item-add').off('click').on('click', function(){

                            sel_insert.append('<div class="ap-lov-item-holder" data-type="multiselect"><input type="text" class="ap-lov-item-fld" /><div class="ap-lov-item-set-as-selected">Set as selected</div><div class="ap-lov-remove-item"><i class="fa fa-times"></i>&nbsp;&nbsp;Remove item</div></div>');

                            sel_insert.find('.ap-lov-item-set-as-selected').off('click').on('click', function(){

                                var tp = $(this).parents('.ap-lov-item-holder');
                                tp.toggleClass('selected');

                                if(tp.hasClass('selected')){
                                    $(this).html('Deselect');
                                }else{
                                    $(this).html('Set as selected');
                                }


                            });

                            sel_insert.find('.ap-lov-remove-item').off('click').on('click', function(){

                                var tp = $(this).parents('.ap-lov-item-holder');
                                tp.remove();

                            });

                        });

                        break;

                    case 'TEXT':

                        fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><textarea class="ap-field-editor ap-field-textarea">'+value1+'</textarea></div>';
                        insert.html(fld);

                        break;

                    default :

                        break;

                }


            }

            formWrapper.find('.ep-tod-holder .select2-item').select2();

            traitsEditor.setHandlers();

        },


        getTree: function (cb) {

            var o = {
                command: 'getTree',
                object: 'Taxon',
                params: {
                    id: taxon_id
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

        },


        getParentPictures: function (cb) {

            var o = {
                command: 'getParentPictures',
                object: 'taxon',
                params: {
                    id: taxon_id
                }
            };

            socketQuery(o, function (res) {

                if(res.code != 0){
                    toastr[res.toastr.type](res.toastr.message);
                }

                traitsEditor.parentPictures = res.pictures || [];

                if(typeof cb == 'function'){
                    cb();
                }

            });

        },

        populateParentPictures: function () {
            var tpl, mo;

            if (traitsEditor.parentPictures && traitsEditor.parentPictures.length == 0) {

                tpl = '<div class="no-traits col-md-12">No pictures</div>';

            } else {

                tpl = `
                {{#parental_pictures}}
                <div class="pic-block col-md-2" data-id="{{id}}">
                    <div class="pic-holder gallery_image_wrapper">
				            <img 
				                src="upload/Taxon_pictures/{{img_mini}}" 
				                class="tax-pic parental-pic gallery_image" 
				                data-id="{{id}}"
				                data-small-src="upload/Taxon_pictures/{{img_small}}" 
				                data-full-src="upload/Taxon_pictures/{{img}}" />
                    </div>
                </div>
                {{/parental_pictures}}
                <div class="col-md-12 expand-pictures-holder">
                    <div class="expand-pictures">View all pictures</div>
                </div>
                `;

                mo = {
                    parental_pictures: []
                };

                for (var i in traitsEditor.parentPictures) {
                    var p = traitsEditor.parentPictures[i];

                    mo.parental_pictures.push({
                        id: p.id,
                        img: p.name,
                        img_small: p.name_small,
                        img_mini: p.name_mini,
                        description: p.description || ' '
                    });
                }

            }

            formWrapper.find('.parental-pictures').html(Mustache.to_html(tpl, mo));
        },


        getTaxonPictures: function (cb) {

            var o = {
                command: 'getPictures',
                object: 'taxon',
                params: {
                    id: formInstance.activeId
                }
            };

            socketQuery(o, function (res) {

                if(res.code != 0){
                    toastr[res.toastr.type](res.toastr.message);
                }

                traitsEditor.taxonPictures = res.pictures || [];

                if(typeof cb == 'function'){
                    cb();
                }

            });

        },

        populateTaxonPictures: function () {
            var tpl, mo;

            if (traitsEditor.taxonPictures && traitsEditor.taxonPictures.length == 0) {

                tpl = '<div class="no-traits col-md-12">No pictures</div>';

            } else {

                tpl = `
                {{#taxonPictures}}
                <div class="pic-block col-md-4" data-id="{{id}}">
                    <div class="pic-holder gallery_image_wrapper">
                        <div class="pic-zoom fa fa-search-plus"></div>
                        <img src="upload/Taxon_pictures/{{img}}" class="tax-pic parental-pic" data-id="{{id}}" />
                    </div>
                    <div class="pic-is-main-holder">Is main: {{{is_main}}}</div>
                    <div class="pic-published-holder">Published: {{{published}}}</div>
                </div>
                {{/taxonPictures}}
                <div class="col-md-12 expand-pictures-holder"><div class="expand-pictures">View all pictures</div></div>
                `;

                mo = {
                    taxonPictures: []
                };

                for (var i in traitsEditor.taxonPictures) {
                    var p = traitsEditor.taxonPictures[i];

                    mo.taxonPictures.push({
                        id: p.id,
                        img: p.name,
                        description: p.description || ' ',
                        is_main: (p.is_main_picture) ? '<i class="fa fa-check-circle-o"></i>' : '<i class="fa fa-times-circle-o"></i>',
                        published: (p.show_on_site) ? '<i class="fa fa-check-circle-o"></i>' : '<i class="fa fa-times-circle-o"></i>'
                    });
                }
            }

            formWrapper.find('.taxon-pictures').html(Mustache.to_html(tpl, mo));
        },


        getSamePictures: function (cb) {
            var o = {
                command: 'getSameLevelPictures',
                object: 'taxon',
                params: {
                    id: formInstance.activeId
                }
            };

            socketQuery(o, function (res) {
                if(res.code != 0){
                    toastr[res.toastr.type](res.toastr.message);
                }

                traitsEditor.sameLevelPictures = res.pictures || [];

                if(typeof cb == 'function'){
                    cb();
                }
            });
        },

        populateSamePictures: function () {
            var tpl, mo;

            if (traitsEditor.sameLevelPictures.length == 0) {
                tpl = '<div class="no-traits col-md-12">No pictures</div>';
            } else {
                tpl = `
                {{#sameLevelPictures}}
                <div class="pic-block col-md-2" data-id="{{id}}">
                    <div class="pic-holder">
                        <img 
                            src="upload/Taxon_pictures/{{img_mini}}" 
                            class="tax-pic parental-pic gallery_image" 
                            data-id="{{id}}"
                            data-small-src="upload/Taxon_pictures/{{img_small}}" 
                            data-full-src="upload/Taxon_pictures/{{img}}" />
                    </div>
                </div>
                {{/sameLevelPictures}}
                <div class="col-md-12 expand-pictures-holder"><div class="expand-pictures">View all pictures</div></div>
                `;

                mo = {
                    sameLevelPictures: []
                };

                console.log('taxonPictures', traitsEditor.sameLevelPictures);

                for (var i in traitsEditor.sameLevelPictures) {
                    var p = traitsEditor.sameLevelPictures[i];

                    mo.sameLevelPictures.push({
                        id: p.id,
                        img: p.name,
                        img_small: p.name_small,
                        img_mini: p.name_mini,
                        description: p.description || ' '
                    });
                }
            }

            formWrapper.find('.same-level-pictures').html(Mustache.to_html(tpl, mo));
        },


        getPictureTypes: function () {

            var o = {
                command: 'get',
                object: 'picture_type',
                params: {

                }
            };

            socketQuery(o, function (res) {

                if(res.code != 0){
                    toastr[res.toastr.type](res.toastr.message);
                    return false;
                }

                traitsEditor.pictureTypes = res.data;

            });

        },

        picturesEditor: function () {

            function getDataByName(name){

                var items = $('.pic-desc-item');

                for(var i = 0; i< items.length; i++){
                    var t = items.eq(i);
                    var tname = t.attr('data-name');

                    if(tname == name){

                        var res = {
                            desc: t.find('.pic-desc-textarea').val(),
                            is_main: t.find('.main-picture')[0].checked,
                            show_on_site: t.find('.visible-on-site')[0].checked,
                            picture_type_id: t.find('.pic-type').val()
                        };
                        return res;

                    }
                }

            }

            var tpl = `
                <div class="pics-desc-holder">
                    <div class="row">
                        {{#pics}}
                        <div class="pic-desc-item col-md-3 " data-id="{{id}}" data-name="{{name}}">
                            <div class="pic-img-holder">
                                <div class="pic-name-holder">{{nameOrig}}</div>
                                <div class="pic-img-holder"><img src="upload/Taxon_pictures/{{name}}" /></div>
                            </div>
                            <div class="pic-desc-editor fn-field">
                                <div class="posRel">
                                    <label class="pic-type-label">Description:</label>
                                    <textarea rows="2" class="pic-desc-textarea" data-name="{{name}}">{{description}}</textarea>
                                </div>
                                <div class="posRel">
                                    <label class="pic-type-label">External ID:</label>
                                    <input class="fn-control pic-external_id" type="text" data-name="{{name}}" val="{{external_id}}"/>
                                </div>
                                <div class="posRel">
                                    <label class="pic-type-label">Choose picture type:</label>
                                    <select style="width: 100%;" class="pic-type" data-name="{{type}}"><option value="-1">-</option>{{#pictureTypes}}<option value="{{id}}" {{selected}}>{{name}}</option>{{/pictureTypes}}</select>
                                 </div>                            
                                <div class="posRel">
                                    <label class="pic-type-label">Main picture:</label>
                                    <input type="checkbox" class="main-picture" {{is_main}} />
                                </div>
                                <div class="posRel">
                                    <label class="pic-type-label">Visible on site:</label>
                                    <input type="checkbox" class="visible-on-site" {{published}} /></div>
                                </div>
                        </div>
                        {{/pics}}
                    </div>
                </div>`;

            var mo = {
                pics: []
            };

            var picTypes = [];

            for(var k in traitsEditor.pictureTypes){
                picTypes.push(traitsEditor.pictureTypes[k]);
            }

            for(var i in traitsEditor.taxonPictures){

                traitsEditor.taxonPictures[i].pictureTypes = [];

                for(var l in picTypes){
                    traitsEditor.taxonPictures[i].pictureTypes.push({
                        id: picTypes[l].id,
                        name: picTypes[l].name,
                        selected: (picTypes[l].id == traitsEditor.taxonPictures[i].picture_type_id)? 'selected' : ''
                    });
                }


                traitsEditor.taxonPictures[i].is_main = (traitsEditor.taxonPictures[i].is_main_picture)? 'checked' : '';
                traitsEditor.taxonPictures[i].published = (traitsEditor.taxonPictures[i].show_on_site)? 'checked' : '';

                mo.pics.push(traitsEditor.taxonPictures[i]);
            }

            console.log(mo);

            bootbox.dialog({
                title: 'Pictures data modification interface',
                message: Mustache.to_html(tpl, mo),
                className: 'wide-modal',
                buttons: {
                    success: {
                        label: 'Save',
                        className: 'modal-save-button',
                        callback: function () {

                            var o = {
                                command: 'modifyByList',
                                object: 'taxon_picture',
                                params: {
                                    id: formInstance.activeId,
                                    pictures: []
                                }
                            };

                            for(var k in traitsEditor.taxonPictures){
                                var p = traitsEditor.taxonPictures[k];

                                var name = p.name;
                                var pic_id = p.id;

                                var desc = getDataByName(name).desc;
                                var is_main_picture = getDataByName(name).is_main;
                                var show_on_site = getDataByName(name).show_on_site;
                                var picture_type_id = getDataByName(name).picture_type_id;

                                o.params.pictures.push({
                                    id: pic_id,
                                    taxon_id: formInstance.activeId,
                                    description: (desc)? desc : '',
                                    picture_type_id: picture_type_id,
                                    is_main_picture: is_main_picture,
                                    show_on_site: show_on_site
                                });
                            }

                            socketQuery(o, function (res) {
                                tr.reloadPictures();
                            });

                        }
                    },
                    error: {
                        label: 'Exit',
                        callback: function () {

                        }
                    }
                }
            })

            $('input[type="checkbox"].main-picture').off('change').on('change', function () {

                $('input[type="checkbox"].main-picture').removeAttr('checked');
                $(this).attr('checked','checked');

            });

        },


        searchArticles: function(cb){

            var o = {
                command: 'search_articles',
                object: 'taxon',
                params: {
                    page: traitsEditor.articlesPage,
                    search_keyword: traitsEditor.articles_search_keyword
                }
            };

            if(traitsEditor.articles_search_keyword.length >= 2){

                socketQuery(o, function(res){

                    if(!res.code){

                        cb(res.body);

                    }else{
                        toastr[res.toastr.type](res.toastr.message);
                    }

                });
            }else{

                toastr['info']('Please, type 2 or more letters to search');

            }



        },


        getAll: function () {

            var tep_holder = formWrapper.find('.taxon-parameters'); //taxon exsist paramters


            var o = {
                command: 'getAll',
                object: 'taxon_avalible_trait',
                params: {
                    taxon_id: formInstance.activeId
                }
            }

            socketQuery(o, function (res) {

                if(res.code!=0){

                    toastr[res.toastr.type](res.toastr.message);

                    return false;
                }

                traitsEditor.traits = res.data;

                var tpl = '<div class="tep-list-holder">' +
                    '{{#params}}<div class="tep-item-holder" data-id="{{id}}" data-type="{{trait_type_sysname}}">' +
                    '<label>{{name}}</label>' +
                    '<div class="tep-tod-holder" data-type="{{trait_type_sysname}}" data-value1="{{value1}}" data-value2="{{value2}}"></div>' +
                    '<div class="tep-remove" data-id="{{id}}"><i class="fa fa-times"></i>&nbsp;&nbsp;Remove param</div>' +
                    '</div>{{/params}}' +
                    '</div>';

                var mo = {
                    params: []
                };

                for(var i in res.data){

                    mo.params.push({
                        id: res.data[i].id,
                        name: res.data[i].name,
                        trait_type_sysname: res.data[i].trait_type_sysname,
                        value1: res.data[i].value1,
                        value2: res.data[i].value2
                    });

                }

                formWrapper.find('.taxon-parameters').html(Mustache.to_html(tpl,mo));

                for(var i=0; i<formWrapper.find('.taxon-parameters .tep-tod-holder').length;i++){

                    var ep = formWrapper.find('.taxon-parameters .tep-tod-holder').eq(i);
                    var type = ep.attr('data-type');
                    var fld;
                    var insert = ep;
                    var tod_id = type;

                    var value1 = ep.attr('data-value1');
                    var value2 = ep.attr('data-value2');

                    switch (type){

                        case 'SHORT_TEXT':

                            fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><input type="text" class="ap-value ap-field-editor" value="'+value1+'"/></div>';
                            insert.html(fld);

                            break;

                        case 'INTEGER':

                            fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><input type="number" class="ap-value ap-field-editor" value="'+value1+'"/></div>';
                            insert.html(fld);



                            break;

                        case 'INTEGERRANGE':

                            fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><input type="number" class="ap-value ap-value-1 ap-field-editor ap-field-editor-1" value="'+value1+'"/><input type="number" class="ap-value ap-value-2 ap-field-editor ap-field-editor-2" value="'+value2+'"/></div>';
                            insert.html(fld);

                            break;

                        case 'FLOAT':

                            fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><input type="number" step="0.1" class="ap-value ap-field-editor" value="'+value1+'"/></div>';
                            insert.html(fld);

                            break;

                        case 'FLOATRANGE':

                            fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><input type="number" step="0.1" class="ap-value ap-value-1 ap-field-editor ap-field-editor-1" value="'+value1+'"/><input type="number" step="0.1" class="ap-value ap-value-2 ap-field-editor ap-field-editor-2" value="'+value2+'"/></div>';
                            insert.html(fld);

                            break;

                        case 'DATE':

                            fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><input type="text" class="ap-field-date ap-field-editor"  value="'+value1+'"/></div>';
                            insert.html(fld);

                            insert.find('.ap-field-date').datepicker({
                                autoclose: true,
                                todayHighlight: true,
                                //minuteStep: 10,
                                keyboardNavigation: false,
                                todayBtn: true,
                                firstDay: 1,
                                format: 'dd.mm.yyyy',
//                startDate: '-infinity',
                                weekStart: 1,
                                language: "en"
                            });

                            break;

                        case 'DATERANGE':

                            fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><input type="text" class="ap-field-date ap-field-date-1 ap-field-editor ap-field-editor-1"  value="'+value1+'"/><input type="text" class="ap-field-date ap-field-date-2 ap-field-editor ap-field-editor-2" value="'+value2+'"></div>';
                            insert.html(fld);

                            insert.find('.ap-field-date').datepicker({
                                autoclose: true,
                                todayHighlight: true,
                                //minuteStep: 10,
                                keyboardNavigation: false,
                                todayBtn: true,
                                firstDay: 1,
                                format: 'dd.mm.yyyy',
//                startDate: '-infinity',
                                weekStart: 1,
                                language: "en"
                            });

                            break;

                        case 'IMAGE':

                            fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><div class="ap-field-editor ap-field-image">'+value1+'</div></div>';
                            insert.html(fld);

                            break;

                        case 'FILE':

                            fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><div class="ap-field-editor ap-field-file">'+value1+'</div></div>';
                            insert.html(fld);

                            break;

                        case 'SELECT':

                            fld = '<div class="ep-tod-holder" data-id="'+tod_id+'" data-type="select">' +
                            '<div class="ap-lov-item-add"><i class="fa fa-plus"></i>&nbsp;&nbsp;Add list item</div>' +
                            '<div class="ap-lov-insert"></div>'+
                            '</div>';

                            insert.html(fld);

                            var sel_insert = insert.find('.ap-lov-insert');

                            insert.find('.ap-lov-item-add').off('click').on('click', function(){

                                sel_insert.append('<div class="ap-lov-item-holder" data-type="multiselect"><label>Set value</label><input type="text" class="ap-lov-item-fld" /><div class="ap-lov-item-set-as-selected">Set as selected</div><div class="ap-lov-remove-item"><i class="fa fa-times"></i>&nbsp;&nbsp;Remove item</div></div>');

                                sel_insert.find('.ap-lov-item-set-as-selected').off('click').on('click', function(){


                                    var allp = $(this).parents('.ap-tod-holder');
                                    var tp = $(this).parents('.ap-lov-item-holder');

                                    allp.find('.ap-lov-item-holder').removeClass('selected');

                                    allp.find('.ap-lov-item-set-as-selected').html('Set as selected');

                                    tp.toggleClass('selected');

                                    if(tp.hasClass('selected')){
                                        $(this).html('Deselect');
                                    }else{
                                        $(this).html('Set as selected');
                                    }






                                });

                                sel_insert.find('.ap-lov-remove-item').off('click').on('click', function(){

                                    var tp = $(this).parents('.ap-lov-item-holder');
                                    tp.remove();

                                });

                            });


                            break;

                        case 'MULTISELECT':

                            fld = '<div class="ep-tod-holder" data-id="'+tod_id+'" data-type="multiselect">' +
                            '<div class="ap-lov-item-add"><i class="fa fa-plus"></i>&nbsp;&nbsp;Add list item</div>' +
                            '<div class="ap-lov-insert"></div>'+
                            '</div>';

                            insert.html(fld);

                            var sel_insert = insert.find('.ap-lov-insert');

                            insert.find('.ap-lov-item-add').off('click').on('click', function(){

                                sel_insert.append('<div class="ap-lov-item-holder" data-type="multiselect"><input type="text" class="ap-lov-item-fld" /><div class="ap-lov-item-set-as-selected">Set as selected</div><div class="ap-lov-remove-item"><i class="fa fa-times"></i>&nbsp;&nbsp;Remove item</div></div>');

                                sel_insert.find('.ap-lov-item-set-as-selected').off('click').on('click', function(){

                                    var tp = $(this).parents('.ap-lov-item-holder');
                                    tp.toggleClass('selected');

                                    if(tp.hasClass('selected')){
                                        $(this).html('Deselect');
                                    }else{
                                        $(this).html('Set as selected');
                                    }


                                });

                                sel_insert.find('.ap-lov-remove-item').off('click').on('click', function(){

                                    var tp = $(this).parents('.ap-lov-item-holder');
                                    tp.remove();

                                });

                            });

                            break;

                        case 'TEXT':

                            fld = '<div class="ep-tod-holder" data-id="'+tod_id+'"><textarea class="ap-field-editor ap-field-textarea">'+value1+'</textarea></div>';
                            insert.html(fld);

                            break;

                        default :

                            break;

                    }

                    traitsEditor.setHandlers();


                }

                formWrapper.find('.tep-remove').off('click').on('click', function () {

                    var id = $(this).attr('data-id');

                    bootbox.dialog({
                        title: 'Delete trait',
                        message: '<label>Are you sure?</label>',
                        buttons: {
                            success: {
                                label: 'Delete',
                                callback: function () {

                                    console.log('GERE');

                                    var o = {
                                        command: 'remove',
                                        object: 'taxon_avalible_trait',
                                        params: {
                                            id: id
                                        }
                                    };

                                    console.log('GERE',o);

                                    socketQuery(o, function (res) {

                                        console.log('GERE');

                                        formWrapper.find('.tep-item-holder[data-id="'+id+'"]').remove();

                                    });

                                }
                            },
                            error: {
                                label: 'Cancel',
                                callback: function () {

                                }
                            }
                        }
                    })



                });

            });
        },
        setHightlight: function (state) {

            console.log(state);

            if(state){
                formWrapper.find('.save-traits').addClass('enabled');
            }else{
                formWrapper.find('.save-traits').removeClass('enabled');
            }

        },
        getTraitById: function (id) {

            for(var i in traitsEditor.traits){
                var tr = traitsEditor.traits[i];
                if(tr.id == id){
                    return tr;
                }
            }

        },
        setChange: function (change) {
            //change = {
            //    id: 123,
            //    value1: 1,
            //    value2: 2
            //};

            var wasChange = false;
            var found = false;

            for(var i in traitsEditor.changes){
                var ch = traitsEditor.changes[i];

                //if(traitsEditor.getTraitById(change.id).value1 == change.value1 && traitsEditor.getTraitById(change.id).value2 == change.value2){
                //
                //    for(var l in traitsEditor.changes){
                //        var chl = traitsEditor.changes[l];
                //
                //    }
                //
                //    continue;
                //}

                if(ch.id == change.id){
                    if(ch.value1 != change.value1){
                        ch.value1 = change.value1;
                        wasChange = true;
                    }
                    if(ch.value2 != change.value2){
                        ch.value2 = change.value2;
                        wasChange = true;
                    }
                    found = true;
                }
            }

            if(!found){

                traitsEditor.changes.push(change);
                wasChange = true;

            }


            traitsEditor.setHightlight(wasChange);

            console.log(traitsEditor.changes);

        },

        setHandlers: function () {

            var flds = formWrapper.find('.tep-item-holder');

            flds.each(function (i, e) {

                var type = $(e).attr('data-type');
                //var id = $(e).attr('data-id');
                var id = $(e).attr('data-triaitid');
                var editor = $(e).find('.ap-field-editor');

                switch(type){

                    case 'SHORT_TEXT':

                        editor.off('input').on('input', function () {

                            traitsEditor.setChange({
                                id:id,
                                value1: editor.val(),
                                value2: ''
                            });

                        });

                        break;

                    case 'NUMBER':

                        editor.off('input').on('input', function () {

                            traitsEditor.setChange({
                                id:id,
                                value1: editor.val(),
                                value2: ''
                            });
                        });

                        break;

                    case 'FLOAT':
                        editor.off('input').on('input', function () {
                            traitsEditor.setChange({
                                id:id,
                                value1: editor.val(),
                                value2: ''
                            });
                        });

                        break;

                    case 'TEXT':
                        editor.off('input').on('input', function () {
                            traitsEditor.setChange({
                                id:id,
                                value1: editor.val(),
                                value2: ''
                            });
                        });

                        break;

                    default :

                        break;

                }

            });

            formWrapper.find('.save-traits').off('click').on('click', function () {


                traitsEditor.save(function(){
                    formInstance.reload();
                });


            });

            formWrapper.find('.parent-taxon-traits-toggler').off('click').on('click', function () {

                if(formWrapper.find('.parent-taxon-traits').hasClass('collapsed')){

                    formWrapper.find('.parent-taxon-traits').removeClass('collapsed');
                    $(this).html('Collapse traits');

                }else{

                    formWrapper.find('.parent-taxon-traits').addClass('collapsed');
                    $(this).html('Expand traits');

                }


            });

            formWrapper.find('.pic-zoom').off('click').on('click', function () {

                function getTypeById(id){
                    for(var i in traitsEditor.pictureTypes){
                        if(traitsEditor.pictureTypes[i].id == id){
                            return traitsEditor.pictureTypes[i].name;
                        }
                    }
                }

                var tpl =   '<div class="owl-carousel">'+
                    '{{#pictures}}' +
                        '<div>' +
                            '<div class="picture-data-holder-modal">' +
                                '<div class="pic-desc">Description: {{description}}</div>' +
                                '<div class="pic-type">Type: {{type}}</div>' +
                                '<div class="pic-is-main-holder">Is main: {{{is_main}}}</div>' +
                                '<div class="pic-published-holder">Published: {{{published}}}</div>' +
                            '</div>' +
                            '<div class="picture-holder"><img class="es-watch-picture-item" src="upload/Taxon_pictures/{{img}}" /></div>' +
                        '</div>{{/pictures}}'+
                    '</div>';

                //var taxon = es.getTaxonById(taxon_id);

                var mo = {
                    pictures: []
                };

                for(var i in traitsEditor.taxonPictures){
                    mo.pictures.push({
                        img: traitsEditor.taxonPictures[i].name,
                        description: traitsEditor.taxonPictures[i].description,
                        type: getTypeById(traitsEditor.taxonPictures[i].picture_type_id),
                        is_main: (traitsEditor.taxonPictures[i].is_main_picture)? '<i style="color:green;" class="fa fa-check-circle-o"></i>' : '<i style="color:red;" class="fa fa-times-circle-o"></i>',
                        published: (traitsEditor.taxonPictures[i].show_on_site)? '<i style="color:green;" class="fa fa-check-circle-o"></i>' : '<i style="color:red;" class="fa fa-times-circle-o"></i>',
                    });
                }


                traitsEditor.modal(true, Mustache.to_html(tpl,mo), function(){

                    $('.owl-carousel').owlCarousel({
                        dots:true,
                        nav:true,
                        center: true,
                        items: 1
                    });

                });

            });

            formWrapper.find('.add-avail-param-btn').off('click').on('click', function () {




                var tpl = '<div class="row"><div class="add-av-tax-trait-holder col-md-4">' +
                    '<select id="add-tax-av-trait-select"><option value="-1">Choose trait</option>{{#traits}}<option value="{{id}}">{{name}}</option>{{/traits}}</select>' +
                    '</div><div class="add-av-tax-trait-value-holder col-md-4"></div><div class="add-av-tax-trait-confirm-holder col-md-4"></div>';

                var mo = {
                    traits: []
                };

                var o = {
                    command: 'get',
                    object: 'taxon_avalible_trait',
                    params: {
                        taxon_id: formInstance.activeId
                    }
                };

                socketQuery(o, function (res) {

                    if(res.code != 0){
                        toastr[res.toastr.type](res.toastr.message);
                        return false;
                    }

                    function localGetTraitById(id){
                        for(var i in res.data){
                            if(res.data[i].id == id){
                                return res.data[i];
                            }
                        }
                    };

                    for(var i in res.data){
                        mo.traits.push(res.data[i]);
                    }

                    formWrapper.find('.add-av-traits-holder').html(Mustache.to_html(tpl,mo));

                    formWrapper.find('#add-tax-av-trait-select').select2();

                    formWrapper.find('#add-tax-av-trait-select').on('change', function (e) {

                        var id = $(this).select2('data')[0].id;

                        if(id == '-1'){
                            return;
                        }

                        var trait = localGetTraitById(id);
                        var type = trait.trait_type_sysname;
                        var insert = formWrapper.find('.add-av-tax-trait-value-holder');
                        var fld;
                        var selected_value = undefined;
                        var selected_id = id;

                        console.log(id, type, trait);

                        switch(type){
                            case 'INTEGER':

                                fld = '<input type="number" class="add-av-trait-field add-av-trait-field-integer" />';
                                insert.html(fld);

                                insert.find('.add-av-trait-field-integer').off('input').on('input', function () {
                                    selected_value = $(this).val();
                                });

                                break;
                            case 'SELECT':

                                fld = '<select class="add-av-trait-field-select-value"><option value="-1">Choose value</option>{{#tr_values}}<option value="{{id}}">{{name}}</option>{{/tr_values}}</select>';

                                var o = {
                                    command: 'get',
                                    object: trait.sub_table_name_for_select,
                                    params: {

                                    }
                                };

                                socketQuery(o, function (res2) {

                                    if(res2.code != 0){
                                        toastr[res2.toastr.type](res2.toastr.message);
                                        return false;
                                    }

                                    var mo2 = {
                                        tr_values:[]
                                    };

                                    for(var k in res2.data){
                                        mo2.tr_values.push(res2.data[k]);
                                    }

                                    insert.html(Mustache.to_html(fld, mo2));

                                    var values_select = formWrapper.find('.add-av-trait-field-select-value').select2({});

                                    formWrapper.find('.add-av-trait-field-select-value').on('change', function (e) {

                                        var id = $(this).select2('data')[0].id;

                                        selected_value = id;

                                    });

                                });

                                break;
                            case 'TEXT':

                                fld = '<input type="text" class=" add-av-trait-field add-av-trait-field-text" />';
                                insert.html(fld);

                                insert.find('.add-av-trait-field-text').off('input').on('input', function () {
                                    selected_value = $(this).val();
                                });

                                break;
                            default:

                                fld = '<input type="text" class="form-control add-av-trait-field add-av-trait-field-text" />';
                                insert.html(fld);

                                break;
                        }

                        formWrapper.find('.add-av-tax-trait-confirm-holder').html('<div class="add-av-tax-trait-confirm"><i class="fa fa-check"></i>&nbsp;&nbsp;Confirm</div></div>');

                        formWrapper.find('.add-av-tax-trait-confirm').off('click').on('click', function () {


                            var o = {
                                command: 'setTraitValue',
                                object:'taxon',
                                params: {
                                    taxon_id: formInstance.activeId,
                                    taxon_avalible_trait_id: selected_id,
                                    value1: selected_value,
                                    value2: ''
                                }
                            };


                            if(type == 'SELECT' && !selected_value  || type == 'SELECT' && selected_value == -1){
                                toastr['error']('Please specify value');
                                return;
                            }

                            socketQuery(o, function (res3) {

                                if(res3.code != 0){
                                    toastr[res3.toastr.type](res3.toastr.message);
                                    formInstance.reload();
                                    return;
                                }

                                formInstance.reload();

                            });


                        });

                    });

                });

                return;

                var guid = MB.Core.guid();
                var mo = {
                    guid:guid
                }

                formWrapper.find('.ap-fields').append(Mustache.to_html(tpl,mo));

                var fld_row = formWrapper.find('.ap-fields-row[data-id="'+guid+'"]');


                socketQuery({
                    command: 'get',
                    object: 'trait_type'
                }, function (types) {

                    if(types.code == 0){

                        var tHtml = '';

                        for(var i in types.data){
                            tHtml += '<option value="'+types.data[i].sysname+'">'+types.data[i].name+'</option>';
                        }

                        fld_row.find('.ap-tod').html(tHtml);

                        var sel = fld_row.find('.ap-tod').select3();

                        fld_row.find('.ap-add-filed').off('click').on('click', function () {

                            var self = this;

                            if($('input.ap-name').val().length <= 0 || sel.value.id == -1){

                                if($('input.ap-name').val().length <= 0){

                                    toastr['error']('Parameter name is required.');

                                    $('.ap-name').css({borderColor: 'red'});

                                    setTimeout(function () {
                                        $('.ap-name').css({borderColor: '#d1d1d1'});
                                    }, 3000);

                                }

                                if(sel.value.id == -1){

                                    toastr['error']('Parameter data type is required.');



                                    $('.ap-filed-tod-holder .select3-wrapper').css({borderColor: 'red'});

                                    setTimeout(function () {

                                        $('.ap-filed-tod-holder .select3-wrapper').css({borderColor: '#d1d1d1'});

                                    }, 3000);

                                }


                                return;

                            }


                            var o = {
                                command: 'add',
                                object: 'taxon_avalible_trait',
                                params: {
                                    taxon_id: formInstance.activeId,
                                    name: $('.ap-name').val(),
                                    trait_type_sysname: sel.value.id
                                }
                            };

                            socketQuery(o , function (res) {

                                if(res.code!= 0){
                                    return false;
                                }

                                var tod_id = res.id;
                                var p = $(self).parents('.ap-holder');
                                var insert = p.find('.ap-tod-insert');


                                var fld;

                                switch (sel.value.id){



                                    case 'SHORT_TEXT':

                                        fld = '<div class="ap-tod-holder" data-id="'+tod_id+'"><input type="text" class="ap-value"/></div>';
                                        insert.html(fld);

                                        break;

                                    case 'INTEGER':

                                        fld = '<div class="ap-tod-holder" data-id="'+tod_id+'"><input type="number" class="ap-value"/></div>';
                                        insert.html(fld);



                                        break;

                                    case 'INTEGERRANGE':

                                        fld = '<div class="ap-tod-holder" data-id="'+tod_id+'"><input type="number" class="ap-value ap-value-1"/><input type="number" class="ap-value ap-value-2"/></div>';
                                        insert.html(fld);

                                        break;

                                    case 'FLOAT':

                                        fld = '<div class="ap-tod-holder" data-id="'+tod_id+'"><input type="number" step="0.1" class="ap-value"/></div>';
                                        insert.html(fld);

                                        break;

                                    case 'FLOATRANGE':

                                        fld = '<div class="ap-tod-holder" data-id="'+tod_id+'"><input type="number" step="0.1" class="ap-value ap-value-1"/><input type="number" step="0.1" class="ap-value ap-value-2"/></div>';
                                        insert.html(fld);

                                        break;

                                    case 'DATE':

                                        fld = '<div class="ap-tod-holder" data-id="'+tod_id+'"><input type="text" class="ap-field-date" /></div>';
                                        insert.html(fld);

                                        insert.find('.ap-field-date').datepicker({
                                            autoclose: true,
                                            todayHighlight: true,
                                            //minuteStep: 10,
                                            keyboardNavigation: false,
                                            todayBtn: true,
                                            firstDay: 1,
                                            format: 'dd.mm.yyyy',
//                startDate: '-infinity',
                                            weekStart: 1,
                                            language: "en"
                                        });

                                        break;

                                    case 'DATERANGE':

                                        fld = '<div class="ap-tod-holder" data-id="'+tod_id+'"><input type="text" class="ap-field-date ap-field-date-1" /><input type="text" class="ap-field-date ap-field-date-2"></div>';
                                        insert.html(fld);

                                        insert.find('.ap-field-date').datepicker({
                                            autoclose: true,
                                            todayHighlight: true,
                                            //minuteStep: 10,
                                            keyboardNavigation: false,
                                            todayBtn: true,
                                            firstDay: 1,
                                            format: 'dd.mm.yyyy',
//                startDate: '-infinity',
                                            weekStart: 1,
                                            language: "en"
                                        });

                                        break;

                                    case 'IMAGE':

                                        fld = '<div class="ap-tod-holder" data-id="'+tod_id+'"><div class="ap-field-image"></div></div>';
                                        insert.html(fld);

                                        break;

                                    case 'FILE':

                                        fld = '<div class="ap-tod-holder" data-id="'+tod_id+'"><div class="ap-field-file"></div></div>';
                                        insert.html(fld);

                                        break;

                                    case 'SELECT':

                                        fld = '<div class="ap-tod-holder" data-id="'+tod_id+'" data-type="select">' +
                                        '<div class="ap-lov-item-add"><i class="fa fa-plus"></i>&nbsp;&nbsp;Add list item</div>' +
                                        '<div class="ap-lov-insert"></div>'+
                                        '</div>';

                                        insert.html(fld);

                                        var sel_insert = insert.find('.ap-lov-insert');

                                        insert.find('.ap-lov-item-add').off('click').on('click', function(){

                                            sel_insert.append('<div class="ap-lov-item-holder" data-type="multiselect"><label>Set value</label><input type="text" class="ap-lov-item-fld" /><div class="ap-lov-item-set-as-selected">Set as selected</div><div class="ap-lov-remove-item"><i class="fa fa-times"></i>&nbsp;&nbsp;Remove item</div></div>');

                                            sel_insert.find('.ap-lov-item-set-as-selected').off('click').on('click', function(){


                                                var allp = $(this).parents('.ap-tod-holder');
                                                var tp = $(this).parents('.ap-lov-item-holder');

                                                allp.find('.ap-lov-item-holder').removeClass('selected');

                                                allp.find('.ap-lov-item-set-as-selected').html('Set as selected');

                                                tp.toggleClass('selected');

                                                if(tp.hasClass('selected')){
                                                    $(this).html('Deselect');
                                                }else{
                                                    $(this).html('Set as selected');
                                                }






                                            });

                                            sel_insert.find('.ap-lov-remove-item').off('click').on('click', function(){

                                                var tp = $(this).parents('.ap-lov-item-holder');
                                                tp.remove();

                                            });

                                        });


                                        break;

                                    case 'MULTISELECT':

                                        fld = '<div class="ap-tod-holder" data-id="'+tod_id+'" data-type="multiselect">' +
                                        '<div class="ap-lov-item-add"><i class="fa fa-plus"></i>&nbsp;&nbsp;Add list item</div>' +
                                        '<div class="ap-lov-insert"></div>'+
                                        '</div>';

                                        insert.html(fld);

                                        var sel_insert = insert.find('.ap-lov-insert');

                                        insert.find('.ap-lov-item-add').off('click').on('click', function(){

                                            sel_insert.append('<div class="ap-lov-item-holder" data-type="multiselect"><input type="text" class="ap-lov-item-fld" /><div class="ap-lov-item-set-as-selected">Set as selected</div><div class="ap-lov-remove-item"><i class="fa fa-times"></i>&nbsp;&nbsp;Remove item</div></div>');

                                            sel_insert.find('.ap-lov-item-set-as-selected').off('click').on('click', function(){

                                                var tp = $(this).parents('.ap-lov-item-holder');
                                                tp.toggleClass('selected');

                                                if(tp.hasClass('selected')){
                                                    $(this).html('Deselect');
                                                }else{
                                                    $(this).html('Set as selected');
                                                }


                                            });

                                            sel_insert.find('.ap-lov-remove-item').off('click').on('click', function(){

                                                var tp = $(this).parents('.ap-lov-item-holder');
                                                tp.remove();

                                            });

                                        });

                                        break;

                                    case 'TEXT':

                                        fld = '<div class="ap-tod-holder" data-id="'+tod_id+'"><textarea class="ap-field-textarea"></textarea></div>';
                                        insert.html(fld);

                                        break;

                                    default :

                                        break;

                                }


                                fld_row.find('.ap-confirm').off('click').on('click', function () {

                                    var pid = $(this).parents('.ap-fields-row').find('.ap-tod-holder').attr('data-id');
                                    var val = $(this).parents('.ap-fields-row').find('.ap-value').val();

                                    var o = {
                                        command: 'setValue',
                                        object: 'taxon_avalible_trait',
                                        params: {
                                            id: pid,
                                            value1: val
                                        }
                                    };

                                    socketQuery(o , function (res) {

                                        if(res.code == 0){
                                            formWrapper.find('.ap-fields').html('');
                                            formInstance.reload();
                                        }

                                    });

                                });


                            });

                        });


                    }else{

                        console.warn('НЕ УДАЛОСЬ ПОЛУЧИТЬ ТИПЫ');

                    }



                });

            });

            formWrapper.find('.ep-tod-holder .select2-item').off('select2:opening').on('select2:opening', function (e) {

                var p = $(this).parents('.ep-tod-holder');
                var sel_object = p.attr('data-get');
                var sel = $(this);

                var selected_id = sel.select2('data')[0].id;
                var selected_name = sel.select2('data')[0].text;


                if(!sel.hasClass('loaded')){

                    e.preventDefault();

                    var o = {
                        command: 'get',
                        object: sel_object,
                        params: {

                        }
                    }

                    socketQuery(o, function (res) {

                        if(res.code != 0){
                            return;
                        }

                        for(var j in res.data){

                            var data = {
                                id: res.data[j].id,
                                text: res.data[j].name
                            };

                            if(data.id == selected_id){
                                sel.append(newOption).trigger('change');
                            }else{
                                var newOption = new Option(data.text, data.id, false, false);
                                sel.append(newOption).trigger('change');
                            }

                        }

                        if(!sel.hasClass('loaded')){
                            sel.addClass('loaded');
                            sel.select2('open');
                        }


                    });

                }

                //sel.select2();



            });
            
            formWrapper.find('.expand-pictures').off('click').on('click', function () {

                var p = $(this).parents('.any-pictures-holder');

                if(p.hasClass('collapsed')){
                    p.removeClass('collapsed');
                    $(this).html('Collapse pictures');
                }else{
                    p.addClass('collapsed');
                    $(this).html('View all pictures');
                }

            });

            formWrapper.find('.load-pictures').off('click').on('click', function () {

                var pics = [];

                function getDataByName(name){

                    var items = $('.pic-desc-item');

                    for(var i = 0; i< items.length; i++){
                        var t = items.eq(i);
                        var tname = t.attr('data-name');

                        if(tname == name){

                            var res = {
                                desc: t.find('.pic-desc-textarea').val(),
                                is_main: t.find('.main-picture')[0].checked,
                                show_on_site: t.find('.visible-on-site')[0].checked,
                                picture_type_id: t.find('.pic-type').val()
                            };
                            return res;

                        }
                    }

                }

                var fl = new ImageLoader({
                    dir: 'upload/Taxon_pictures/',
                    success: function (file) {

                        var pc = this.InProcessCounter;

                        if(pc > 0){
                            pics.push(file);
                            return;
                        }else{
                            pics.push(file);

                            var tpl = MB.PicEditor.getTpl(['visible', 'picture_type', 'external_id', 'description']);

                            var mo = {
                                pics: []
                            };

                            var picTypes = [];
                            for(var k in traitsEditor.pictureTypes){
                                picTypes.push(traitsEditor.pictureTypes[k]);
                            }

                            for(var i in pics){

                                pics[i].pictureTypes = picTypes;

                                mo.pics.push(pics[i]);
                            }


                            console.log(this.InProcessCounter);

                            bootbox.dialog({
                                title: 'Set pictures definitions',
                                message: Mustache.to_html(tpl,mo),
                                buttons: {
                                    success:{
                                        label: 'Save',
                                        callback: function () {

                                            var o = {
                                                command: 'addByList',
                                                object: 'taxon_picture',
                                                params: {
                                                    taxon_id: formInstance.activeId,
                                                    pictures: []
                                                }
                                            }

                                            for(var k in pics){
                                                var p = pics[k];
                                                var name = p.name;
                                                var desc = getDataByName(name).desc;
                                                var is_main_picture = getDataByName(name).is_main;
                                                var show_on_site = getDataByName(name).show_on_site;
                                                var picture_type_id = getDataByName(name).picture_type_id;

                                                o.params.pictures.push({
                                                    taxon_id: formInstance.activeId,
                                                    name: p.name,
                                                    description: (desc)? desc : '',
                                                    picture_type_id: picture_type_id,
                                                    is_main_picture: is_main_picture,
                                                    show_on_site: show_on_site
                                                });
                                            }


                                            socketQuery(o, function (res) {


                                                tr.reloadPictures();
                                            });
                                        }
                                    },
                                    error:{
                                        label: 'Cancel',
                                        callback: function () {

                                        }
                                    }

                                }
                            });

                            $('input[type="checkbox"].main-picture').off('change').on('change', function () {

                                $('input[type="checkbox"].main-picture').removeAttr('checked');
                                $(this).attr('checked','checked');

                            });

                            $('.visible-on-site, .main-picture').checkboxIt();

                            console.log(file);

                        }

                    }
                });

                fl.start();

            });

            formWrapper.find('.ap-field-editor').off('input').on('input', function (e) {
                console.log('EEE', e);

                var p = $(this).parents('.tep-item-holder').eq(0);
                var id = p.attr('data-triaitid');
                var val = $(this).val();

                traitsEditor.setChange({
                    id: id,
                    value1: val,
                    value2: ''
                });

            });

            formWrapper.find('.ep-tod-holder .select2-item').off('select2:select').on('select2:select', function (e) {
                console.log('SEL EEE', e);

                var p = $(this).parents('.tep-item-holder').eq(0);
                var id = p.attr('data-triaitid');
                var val = e.params.data.id;

                traitsEditor.setChange({
                    id: id,
                    value1: val,
                    value2: ''
                });

            });

            formWrapper.find('.modify-pictures-taxon').off('click').on('click', function () {

                traitsEditor.picturesEditor();

            });

            formWrapper.find('.trait-top-taxon-link').off('click').on('click', function () {

                var id = $(this).attr('data-id');

                var formId = MB.Core.guid();

                var form = new MB.FormN({
                    id: formId,
                    name: 'form_taxon',
                    class: 'taxon',
                    client_object: 'form_taxon',
                    type: 'form',
                    ids: [id],
                    position: 'center'
                });
                form.create(function () {
                    var modal = MB.Core.modalWindows.windows.getWindow(formId);

                    $(modal).on('close', function () {
                        formInstance.reload();
                    });

                    $(form).on('update', function () {
                        formInstance.reload();
                    });

                });

            });

            formWrapper.find('.tep-description').off('click').on('click', function () {

                var trait_name = $(this).parents('.tep-item-holder').find('label').eq(0).html();

                function getDataById(id){
                    var res = undefined;

                    for(var i in traitsEditor.traits){
                        if(traitsEditor.traits[i].id == id){
                            res = traitsEditor.traits[i];
                        }
                    }

                    for(var i in traitsEditor.ic_traits){
                        if(traitsEditor.ic_traits[i].id == id){
                            res = traitsEditor.ic_traits[i];
                        }
                    }

                    return res;
                }

                var tpl = '<h2>{{name}}</h2><br/><div class="trait-desc-holder">{{description}}</div><br/><br/>' +
                    '<div class="trait-values-desc-holder">{{#values}}<div><b>{{name}}</b>{{#definition}}:&nbsp;&nbsp;{{definition}}{{/definition}}</div>{{/values}}</div><br/><br/>' +
                    '<div class="trait-pics-holder"><div class="row">' +
                    '{{#pictures}}' +
                        '<div class="trait-pic-item col-md-4"><img src="upload/Taxon_pictures/{{name}}" /><div class="trait-pic-desc">{{description}}</div></div>' +
                    '{{/pictures}}' +
                    '</div></div>';


                var trait = getDataById($(this).attr('data-id'));

                var mo = {
                    name: trait_name,
                    description: trait.definition,
                    pictures: trait.pictures,
                    values: []
                };

                if(trait.trait_type_sysname == 'SELECT'){

                    var o = {
                        command: 'get',
                        object: trait.sub_table_name_for_select,
                        params: {

                        }
                    };

                    socketQuery(o, function (res) {

                        if (res.code != 0) {
                            toastr[res.toastr.type](res.toastr.message);
                            return;
                        }

                        for(var k in res.data){
                            mo.values.push({
                                name: res.data[k].name,
                                definition: res.data[k].definition
                            })
                        }


                        bootbox.dialog({
                            title: 'Trait information',
                            message: Mustache.to_html(tpl,mo),
                            className: 'wide-modal',
                            buttons: {
                                success: {
                                    label: 'Ok',
                                    callback: function () {

                                    }
                                },
                                error: {
                                    label: 'Close',
                                    callback: function () {

                                    }
                                }
                            }
                        });

                    });

                }else{

                    bootbox.dialog({
                        title: 'Trait information',
                        message: Mustache.to_html(tpl,mo),
                        className: 'wide-modal',
                        buttons: {
                            success: {
                                label: 'Ok',
                                callback: function () {

                                }
                            },
                            error: {
                                label: 'Close',
                                callback: function () {

                                }
                            }
                        }
                    });

                }

            });

            formWrapper.find('.articles-search-btn').off('click').on('click', function(){

                traitsEditor.articles_search_keyword = formWrapper.find('.articles-search').val();

                traitsEditor.searchArticles(function(html){

                    formWrapper.find('.articles-more').remove();

                    formWrapper.find('.articles-data').html(html + '<div class="articles-more">More results</div>');

                    formWrapper.find('.articles-data a').attr('target','_blank');

                    traitsEditor.setHandlers();
                });


            });

            formWrapper.find('.articles-more').off('click').on('click', function(){


                traitsEditor.articlesPage += 10;

                traitsEditor.searchArticles(function(html){

                    formWrapper.find('.articles-more').remove();

                    formWrapper.find('.articles-data').append(html + '<div class="articles-more">More results</div>');

                    formWrapper.find('.articles-data a').attr('target','_blank');

                    traitsEditor.setHandlers();

                });

            });

            formWrapper.find('.articles-search').off('keyup').on('keyup', function(e){

                if(e.keyCode == 13){
                    formWrapper.find('.articles-search-btn').click();
                }

            });

            formWrapper.find('.articles-search').off('input').on('input', function(e){

                if(e.keyCode != 13){
                    traitsEditor.articlesPage = 0;
                }

                traitsEditor.articles_search_keyword = $(this).val();


            });

        },

        save: function (cb) {

            for(var i in traitsEditor.changes){
                traitsEditor.changes[i].taxon_id = formInstance.activeId;
            }

            var o = {
                command: 'setValueByList',
                object: 'taxon_avalible_trait',
                params: {
                    list: traitsEditor.changes
                }
            };

            socketQuery(o, function (res) {

                console.log(res);

                traitsEditor.setHightlight(false);

                if(typeof cb == 'function'){
                    cb();
                }

            });
        },
        modal: function (state, content, init) {

            var tpl = '<div class="es-modal-holder">' +
                '<div class="es-modal-fader"></div>' +
                '<div class="es-modal-close">' +
                '<i class="fa fa-times"></i>' +
                '</div>' +
                '<div class="es-modal-content">' +
                '<div class="es-modal-inner">'+content+'</div>' +
                '</div>' +
                '</div>';

            if(state){

                $('body').prepend(tpl);

                init();

                $('.es-modal-close').off('click').on('click', function () {


                    $('.es-modal-holder').remove();

                });

            }else{

                $('.es-modal-holder').remove();

            }


        },

        setName: function () {

            var nPlace = formWrapper.find('.name-place');
            if(formInstance.data.data[0].name_full.length == 0){
                nPlace.html(formInstance.data.data[0].name);
            }

        }


    };


    //traitsEditor.getAll();
    traitsEditor.init();

    console.log('HERE');


    var tpl =   '<div class="ap-fields-row" data-id="{{guid}}">' +
                '<div class="ap-field ap-filed-name-holder" >'+
                '<label>Parameter name</label><input class="ap-name" type="text" />'+
                '</div>'+
                '<div class="ap-field ap-filed-tod-holder">'+
                '<label>Parameter data type</label><select class="ap-tod">'+
                '</select>'+
                '</div>'+
                '<div class="ap-add-filed"><i class="fa fa-check"></i>&nbsp;&nbsp;Create</div>'+
                '<div class="ap-tod-insert">'+
                '</div>'+
                '<div class="ap-confirm"><i class="fa fa-database"></i>&nbsp;&nbsp;Confirm</div>' +
                '</div>';

}());