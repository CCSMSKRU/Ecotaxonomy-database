var traitsEditor;
(function(){

    var modal = $('.mw-wrap').last();
    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_taxon', formID);
    var formWrapper = $('#mw-'+formInstance.id);

//2414

    var id = formInstance.activeId;
    // console.error(id);

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

    function getTraitById(id) {
	    var traitsFound = false;
	    var res = null;

	    for (var i in traitsEditor.traits) {
		    if (traitsEditor.traits[i].id == id) {
			    traitsFound = true;
			    res = traitsEditor.traits[i];
		    }
	    }

	    if (!traitsFound) {
		    for (var i in traitsEditor.ic_traits) {
			    if (traitsEditor.ic_traits[i].id == id) {
				    res = traitsEditor.ic_traits[i];
			    }
		    }
	    }

	    return res;
    }

    function sortByCategoryId(traits) {
    	if (!traits) return traits;

        let traits_by_categories_sorted = [];

        traits.forEach(row => {
            let category = row.character_category || row.trait_category || 'Without category';
	        let category_id = row.character_category_id || row.trait_category_id || 999999;
	        let num_in_series = row.character_category_num_in_series || row.trait_category_num_in_series || 999999;

            let obj = {
                id: row.id,
                trait_id: row.taxon_avalible_trait_id,
                name: row.name,
                trait_type_sysname: row.trait_type_sysname,
                value1: row.value1,
                value2: row.value2,
                isSetted: row.isSetted,
                isParent: row.isParent,
                taxon_name: row.taxon_name,
                category: row.character_category,
	            meas_unit_sign: row.meas_unit_sign,
	            max_value: row.max_value,
	            min_value: row.min_value,
	            sort_no: row.sort_no
            };

            if (row.trait_type_sysname === 'FLOAT' || row.trait_type_sysname === 'INTEGER') {
	            let min_label = typeof row.min_value === 'number' ? `(min: ${+row.min_value}` : '';
	            let max_label = typeof row.max_value === 'number' ? `max: ${+row.max_value})` : '';
	            if (min_label && !max_label)
		            min_label += ')';
	            if (max_label && !min_label)
		            max_label = '(' + max_label;

	            obj.name = obj.name + ' ' + min_label + (min_label && max_label ? ', ' : '') + max_label;
            }

            let curr_category;

            for (let trait of traits_by_categories_sorted) {
                if (trait.category_id === category_id) {
                    curr_category = trait;
                    break;
                }
            }

            if (!curr_category) {
                curr_category = {
                    category: category,
	                category_id: category_id,
	                num_in_series: num_in_series,
                    params: []
                };

                traits_by_categories_sorted.push(curr_category);
            }

            curr_category.params.push(obj);
        });

        traits_by_categories_sorted.sort((a, b) => {
            if (a.num_in_series > b.num_in_series) return 1;
            if (a.num_in_series < b.num_in_series) return -1;
            return 0;
        });

	    traits_by_categories_sorted.forEach(row => {
		    row.params.sort((a, b) => {
			    if (a.sort_no > b.sort_no) return 1;
			    if (a.sort_no < b.sort_no) return -1;
			    return 0;
		    });
	    });

        return traits_by_categories_sorted;
    }


    traitsEditor = {
        changes: [],
        traits: [],
        ic_traits: [],
        trait_selects: [],
        tree: [],
        parentTraits: [],
        ic_parentTraits: [],
        parentPictures: [],
	    parentDIPictures: [],
        taxonPictures: [],
	    taxonDIPictures: [],
        sameLevelPictures: [],
	    sameLevelDIPictures: [],
        childTaxonsPictures: [],
	    childTaxonsDIPictures: [],
        synonymsPictures: [],
	    synonymsDIPictures: [],
        articlesPage: 0,
        articles_search_keyword: '',
        synonyms: [],
        isActualTaxonDefaultHtml: true,

        literatureData: [],
        literatureData_value: [],

        init: function () {
            const _t = this;

            async.series({
                loadMain: cb => {
                    async.parallel([
                        cb => {
                            traitsEditor.getTraits(function () {
                                traitsEditor.populateTraits();
                                traitsEditor.setHandlers();

                                cb(null);
                            });
                        },
                        cb => {
                            traitsEditor.getTree(function () {
                                traitsEditor.populateTree();

                                cb(null);
                            });
                        },
                        cb => {
                            traitsEditor.getSynonyms(function () {
                                traitsEditor.populateSynonyms();
                                cb(null);
                            });
                        }
                    ], cb);
                },
                loadDistribution: cb => {
                    traitsEditor.getLocationsTree(() => {
                        traitsEditor.populateLocationsTree();

                        cb(null);
                    });
                },
                loadHabitats: cb => {
                  traitsEditor.getHabitatTree(() => {
                      traitsEditor.populateHabitatsTree();

                      cb(null);
                  })
                },
                loadPictures: cb => {
                    traitsEditor.reloadPictures(cb);
                },
                addButtonAddVoucherSpecimen: cb => {
                    _t.button_add_voucher_specimen_html = $(formWrapper.find('[data-tbls="data_individual.tbl_data_individual_voucher"]')
                        .find('.ct-environment-buttons')
                        .find('ul')
                        .prepend('<li class="ct-environment-btn ct-btn-add-voucher-specimen-inline"><div class="nb btn btnDouble green"><i class="fa fa-plus"></i><div class="btnDoubleInner">Add voucher specimen</div></div></li>').children()[0])

                    _t.button_add_voucher_specimen_html.off('click').on('click', () => {
                       _t.add_voucher_specimen()
                    });

                    cb(null);
                },
                loadLiterature: cb => {
                    traitsEditor.reloadLiteratureData(cb);
                }
            }, () => {
                traitsEditor.setName();
            });


            // $('.taxon-ids-value[data-id="id"]').html(formInstance.data.data[0].id);
            // $('.taxon-ids-value[data-id="gbif_taxonID"]').html(formInstance.data.data[0].gbif_taxonID);
        },

        reload: function() {
            traitsEditor.changes = [];
            traitsEditor.traits = [];
            traitsEditor.ic_traits = [];
            traitsEditor.trait_selects = [];
            traitsEditor.tree = [];
            traitsEditor.parentTraits = [];
            traitsEditor.ic_parentTraits = [];
            traitsEditor.parentPictures = [];
            traitsEditor.taxonPictures = [];
            traitsEditor.sameLevelPictures = [];
            traitsEditor.synonymsPictures = [];

            traitsEditor.articlesPage = 0;
            traitsEditor.articles_search_keyword = '';
            traitsEditor.literatureData = [];
            traitsEditor.literatureData_value = [];
            traitsEditor.synonyms = [];

            async.series({
                loadMain: cb => {
                    async.parallel([
                        cb => {
                            traitsEditor.getTraits(function () {
                                traitsEditor.populateTraits();
                                traitsEditor.setHandlers();

                                cb(null);
                            });
                        },
                        cb => {
                            traitsEditor.getSynonyms(function () {
                                traitsEditor.populateSynonyms();
                                cb(null);
                            });
                        }
                    ], cb)
                },
                loadPictures: cb => {
                    traitsEditor.reloadPictures(cb);
                }
            }, () => {
                traitsEditor.reloadLiteratureData();

                traitsEditor.setName();
            });

            // $('.taxon-ids-value[data-id="id"]').html(formInstance.data.data[0].id);
            // $('.taxon-ids-value[data-id="gbif_taxonID"]').html(formInstance.data.data[0].gbif_taxonID);
        },
        reloadTraits: () => {
            traitsEditor.traits = [];
            traitsEditor.ic_traits = [];
            traitsEditor.traits_with_another_gender_val = [];

            traitsEditor.getTraits(function () {
                traitsEditor.populateTraits();
                traitsEditor.setHandlers();
            });
        },
        reloadPictures: (cb) => {
            traitsEditor.parentPictures = [];
            traitsEditor.taxonPictures = [];
            traitsEditor.sameLevelPictures = [];
            traitsEditor.childTaxonsPictures = [];
            traitsEditor.synonymsPictures = [];

            async.parallel([
	            cb => {
		            traitsEditor.getTaxonPictures(function () {
			            traitsEditor.populateTaxonPictures();
			            traitsEditor.addCollapseBtnToPictures('.taxon-pictures');

			            cb(null);
		            });
	            },
	            cb => {
		            traitsEditor.getSynonymsPictures(function() {
			            traitsEditor.populateSynonymsPictures();
			            traitsEditor.addCollapseBtnToPictures('.synonyms_pictures');

			            cb(null);
		            });
	            },
                cb => {
                    traitsEditor.getParentPictures(function () {
                        traitsEditor.populateParentPictures();
                        traitsEditor.addCollapseBtnToPictures('.parental-pictures');

                        cb(null);
                    });
                },
                cb => {
                    traitsEditor.getSamePictures(function () {
                        traitsEditor.populateSamePictures();
                        traitsEditor.addCollapseBtnToPictures('.same-level-pictures');

                        cb(null);
                    });
                },
                cb => {
                    traitsEditor.getChildTaxonsPictures(function() {
                        traitsEditor.populateChildTaxonsPictures();
                        traitsEditor.addCollapseBtnToPictures('.child-level-pictures');

                        cb(null);
                    });
                }
            ], (err, res) => {
                if (typeof cb === "function") cb(err, res);
                traitsEditor.setHandlers();
            });
        },


        add_voucher_specimen: () => {
	        let message_html = `
	                    <div>
                            <div class="wrapper-for">
                                <div class="label-for">Name: </div>
                                <input class="input-for name" type="text">
                            </div>
                            <div class="wrapper-for">
                                <div class="label-for">Storage: </div>
                                <select class="select-for storage"></select>
                            </div>
                            <div class="wrapper-for">
                                <div class="label-for">Decimal longitude: </div>
                                <input class="input-for decimal-longitude" type="number">
                            </div>
                            <div class="wrapper-for">
                                <div class="label-for">Decimal latitude: </div>
                                <input class="input-for decimal-latitude" type="number">
                            </div>
                            <div class="wrapper-for">
                                <div class="label-for">Comment: </div>
                                <textarea class="textarea-for-comment-new-voucher"></textarea>
                            </div>
                        </div>
	                `;

	        let sto_id = null;
	        let $bootbox_main = bootbox.dialog({
		        message: message_html,
		        title: "Add voucher specimen",
		        buttons: {
			        success: {
				        label: "OK",
				        callback: () => {
					        let o = {
						        object: 'data_individual',
						        command: 'add',
						        params: {
							        taxon_id: id,
							        name: $bootbox_main.find('input.input-for.name').val(),
							        project: 'Vouchers',
							        storage_id: sto_id,
							        longitude: $bootbox_main.find('input.input-for.decimal-longitude').val(),
							        latitude:  $bootbox_main.find('input.input-for.decimal-latitude').val(),
							        comment:  $bootbox_main.find('textarea.textarea-for-comment-new-voucher').val(),
							        voucher: true
						        }
					        };

					        socketQuery(o, res => {
						        formInstance.tblInstances.forEach(tbl => {
							        if (tbl.class === 'data_individual')
							        	tbl.reload()
						        })
					        })
				        }
			        },
			        danger: {
				        label: "Cancel",
				        callback: () => {}
			        },
		        }
	        }).on('shown.bs.modal', function () {
		        const selectorSt = $bootbox_main.find('select.storage');
		        initCustomSelect({
			        class_name: 'storage',
			        placeholder: 'Select storage...',
			        selector: selectorSt
		        }).off('select2:select').on('select2:select', function (e) {
			        sto_id = e.params.data.id;
		        });
	        });
        },

        addCollapseBtnToPictures: function(parentDivClassName) {
            let pics_parent = formWrapper.find(parentDivClassName);
            let pics = pics_parent.find('.pic-block');

            let n = parentDivClassName === '.taxon-pictures' ? 4 : 6;

            if (pics.length > n) {
                for (let i = n; i < pics.length; i++) {
                    pics.eq(i).addClass('pic-hidden');
                }


                $(parentDivClassName).append('<div class="col-md-12 expand-pictures-holder"><div class="collapseBtn">View all pictures</div></div>');
                let btn = $(parentDivClassName).find('.collapseBtn');

                btn.on('click', () => {
                    if (pics.eq(n).hasClass('pic-hidden')) {
                        btn.html('Hide all pictures');
                        for (let i = 0; i < pics.length; i++) {
                            pics.eq(i).removeClass('pic-hidden');
                            pics.eq(i).addClass('pic-visible');
                        }
                    } else {
                        btn.html('View all pictures');
                        for (let i = n; i < pics.length; i++) {
                            pics.eq(i).addClass('pic-hidden');
                            pics.eq(i).removeClass('pic-visible');
                        }
                    }
                })
            }
        },
	    getLocationsTree: function (cb) {
		    var o = {
			    command: 'getTree',
			    object: 'Location',
			    params: {
				    id: 3127
			    }
		    };

		    socketQuery(o, function (res) {
			    if(res.code != 0){
				    toastr[res.toastr.type](res.toastr.message);
                    traitsEditor.locations_tree = {
                        core:{
                            data:[]
                        }
                    }
				    return;
			    }

			    traitsEditor.locations_tree = res.tree;

			    // console.log('getLocationsTree', res);

			    if(typeof cb === 'function') cb();
		    });
	    },

	    populateLocationsTree: function () {
		    var holder = formWrapper.find('.location_tree_holder');

		    holder.jstree({
			    'core': {
				    'multiple': false,
				    'data': function (node, cb) {
					    if (node.id === "#") {
						    cb(traitsEditor.locations_tree.core.data);
					    } else {
						    let o = {
							    command: 'getTreeChilds',
							    object: 'Location',
							    params: {
								    id: node.id
							    }
						    };

						    socketQuery(o, function (res) {
							    if (res.code !== 0) {
								    toastr[res.toastr.type](res.toastr.message);
								    return false;
							    }

							    // console.log('LOCATIONS TREE DATA', res.tree.core.data);

							    cb(res.tree.core.data);
						    });
					    }
				    }
			    }
		    });

		    holder.on('select_node.jstree', function (e, a) {
			    // console.log('NODE', a.node);

			    traitsEditor.locations_tree_selected_id = +a.node.id;
		    });

		    formWrapper.find('.add_location').off('click').on('click', function () {
		    	if (!traitsEditor.locations_tree_selected_id) {
		    		toastr['info']('Please, select location from the tree.');
		    		return;
			    }

			    let o = {
			        command: 'get',
			        object: 'taxon_location',
			        params: {
			        	param_where: {
					        taxon_id: id,
					        location_id: traitsEditor.locations_tree_selected_id
				        },
				        collapseData: false
			        }
			    };

		    	socketQuery(o, (res) => {
		    	   if (res && res.length) {
				       toastr['error']('Taxon already binded to the location.');
			       } else {
				       let o = {
					       command: 'add',
					       object: 'taxon_location',
					       params: {
						       taxon_id: id,
						       location_id: traitsEditor.locations_tree_selected_id
					       }
				       };

				       socketQuery(o, (res) => {
					       if (res.code === 0) {
						       for (let t of formInstance.tblInstances) {
							       if (t.class === 'taxon_location') {
								       t.reload();
								       break;
							       }
						       }
					       }
				       });
			       }
		    	});
		    });
	    },

        reloadLiteratureData: function(cb){

            traitsEditor.getLiteratureData(function(){
                traitsEditor.getLiteratureData_value(function(){
                    traitsEditor.populateLiteratureData();

                    if(typeof cb == 'function') cb();
                });
            });

        },

        getLiteratureData: function(cb){

            var o = {
                command: 'get',
                object: 'taxon_literature_data_link',
                params: {
                    param_where: {
                        taxon_id: formInstance.activeId
                    }
                }
            };

            socketQuery(o, function (res) {
                if(res.code != 0){
                    toastr[res.toastr.type](res.toastr.message);
                }

                traitsEditor.literatureData = res.data;

                if(typeof cb == 'function'){
                    cb();
                }

            });

        },

        getLiteratureData_value: function(cb){

            var o = {
                command: 'get',
                object: 'taxon_trait_value_literature_data_link',
                params: {
                    param_where: {
                        taxon_id: formInstance.activeId
                    }
                }
            };

            socketQuery(o, function (res) {
                if(res.code != 0){
                    toastr[res.toastr.type](res.toastr.message);
                }

                traitsEditor.literatureData_value = res.data;

                if(typeof cb == 'function'){
                    cb();
                }

            });

        },

        populateLiteratureData: function(){

            var tpl = `<div class="lit-data-half taxon"><div class="l-d-title">Taxon literature data:</div>
                        {{#taxon_data}}
                        <div class="l-d-item" data-link-id="{{id}}" data-id="{{literature_id}}">
                            <div class="l-d-name">{{article}}<br><span class="l-d-created">{{created}}</span></div>                        
                            <div class="l-d-funcs">
                                <!--<div class="l-d-btn l-d-download" data-link-id="{{id}}" data-id="{{literature_id}}"><i class="fa fa-download"></i> files</div>-->
                                <div class="l-d-btn l-d-watch" data-is-taxon="true" data-link-id="{{id}}" data-id="{{literature_id}}" data-valueid="{{taxon_id}}"><i class="fa fa-eye"></i> watch / edit</div>
                            </div>                        
                        </div>                       
                        {{/taxon_data}}
                        </div> 
                        <div class="lit-data-half traits">
                        <div class="l-d-title">Taxon trait values literature data:</div>
                        {{#taxon_values_data}}
                        <div class="l-d-item" data-link-id="{{id}}" data-id="{{literature_id}}">
                            <div class="l-d-name">{{article}}<br><span class="l-d-created">{{created}}</span></div>                        
                            <div class="l-d-funcs">
                                <!--<div class="l-d-btn l-d-download" data-link-id="{{id}}" data-id="{{literature_id}}"><i class="fa fa-download"></i> files</div>-->
                                <div class="l-d-btn l-d-watch" data-is-taxon="false" data-link-id="{{id}}" data-id="{{literature_id}}" data-valueid="{{taxon_trait_value_id}}"><i class="fa fa-eye"></i> watch / edit</div>
                            </div>                        
                        </div>
                        {{/taxon_values_data}}
                        </div>`;

            var mo = {
                taxon_data: [],
                taxon_values_data: []
            };

            for(var i in traitsEditor.literatureData){
                mo.taxon_data.push(traitsEditor.literatureData[i]);
            }
            for(var k in traitsEditor.literatureData_value){
                mo.taxon_values_data.push(traitsEditor.literatureData_value[k]);

	            $(`.tep-litdata[data-id="${traitsEditor.literatureData_value[k].taxon_trait_value_id}"]`).addClass("active");
            }

            formWrapper.find('.form-literature-data-holder').html(Mustache.to_html(tpl, mo));

            traitsEditor.setHandlers();

        },

        getParentTraits: function (cb) {

            var o = {
                command: 'getParentTraits',
                object: 'taxon',
                params: {
                    id: formInstance.activeId
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

        populateParentTraits_OLD: function () {

            // var tpl = '<div class="tep-list-holder row">' +
            //     '{{#params}}<div class="tep-item-holder col-md-4" data-id="{{id}}" data-type="{{trait_type_sysname}}"><div class="parent-trait">' +
            //     '<label>{{name}}:</label><div class="parent-trait-value1-holder">{{value1}}</div>&nbsp;&nbsp;<div class="parent-trait-value2-holder">{{value2}}</div>' +
            //     //'<div class="tep-tod-holder" data-type="{{trait_type_sysname}}" data-value1="{{value1}}" data-value2="{{value2}}"></div>' +
            //     '</div><div class="trait-top-taxon-link" data-id="{{taxon_id}}">{{taxon_name}}</div></div>{{/params}}' +
            //     '</div>';
            //
            // var mo = {
            //     params: []
            // };
            //
            // var mo2 = {
            //     params: []
            // };
            //
            // for(var i in traitsEditor.parentTraits){
            //
            //     mo.params.push({
            //         id: traitsEditor.parentTraits[i].id,
            //         name: traitsEditor.parentTraits[i].name,
            //         trait_type_sysname: traitsEditor.parentTraits[i].trait_type_sysname,
            //         value1: traitsEditor.parentTraits[i].value1,
            //         value2: traitsEditor.parentTraits[i].value2,
            //         taxon_id: traitsEditor.parentTraits[i].taxon_id,
            //         taxon_name: traitsEditor.parentTraits[i].taxon_name
            //     });
            //
            // }
            //
            // for(var i in traitsEditor.ic_parentTraits){
            //
            //     mo2.params.push({
            //         id: traitsEditor.ic_parentTraits[i].id,
            //         name: traitsEditor.ic_parentTraits[i].name,
            //         trait_type_sysname: traitsEditor.ic_parentTraits[i].trait_type_sysname,
            //         value1: traitsEditor.ic_parentTraits[i].value1,
            //         value2: traitsEditor.ic_parentTraits[i].value2,
            //         taxon_id: traitsEditor.ic_parentTraits[i].taxon_id,
            //         taxon_name: traitsEditor.ic_parentTraits[i].taxon_name
            //     });
            //
            // }
            //
            //
            // if(traitsEditor.parentTraits && Object.keys(traitsEditor.parentTraits).length > 0) {
            //     formWrapper.find('.parent-taxon-traits').html(Mustache.to_html(tpl, mo));
            // }
            //
            // if(traitsEditor.ic_parentTraits && Object.keys(traitsEditor.ic_parentTraits).length > 0) {
            //     formWrapper.find('.ic-parent-taxon-traits').html(Mustache.to_html(tpl, mo2));
            // }


        },

        getTraits: function (cb) {

            var o = {
                command: 'getAllTraits',
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
                traitsEditor.traits_with_another_gender_val = res.traits_with_another_gender_val;

                // console.log('getAllTraits', traitsEditor);


                if(typeof cb == 'function'){
                    cb();
                }

            });

        },

        populateGenderTraits: function(){

            var tpl = '<div class="tep-list-holder with_title">' +
                '<div class="tep-title_wrapper"><div class="tep-title">{{category}}</div></div>' +
                '{{#params}}<div class="tep-item-holder" data-isparent="{{isParent}}" data-id="{{id}}" data-triaitid="{{trait_id}}" data-type="{{trait_type_sysname}}">' +
                '{{#isParent}}<div class="is-parent-fader"><div class="fader-text">Inherited: {{taxon_name}}</div></div>{{/isParent}}' +
                '<label>{{name}}</label>' +
                '<div class="tep-tod-holder" data-type="{{trait_type_sysname}}" data-value1="{{value1}}" data-value2="{{value2}}"></div>' +
                // '{{#isSetted}}<div class="tep-remove" data-id="{{id}}"><i class="fa fa-trash-o"></i></div>{{/isSetted}}' +
                // '<div class="tep-description" data-id="{{id}}"><i class="fa fa-question-circle-o"></i></div>' +
                // '<div class="tep-litdata" data-is-taxon="false" data-id="{{id}}"><i class="fa fa-font"></i></div>' +
                '</div>{{/params}}' +
                '</div>';

            var mo = {
                params: []
            };


            let traits = sortByCategoryId(traitsEditor.traits);
            let ic_traits = sortByCategoryId(traitsEditor.ic_traits);

            let traits_html = '';
            traits.forEach(category => {
                traits_html += Mustache.to_html(tpl,category);
            });

            let ic_traits_html = '';
            ic_traits.forEach(category => {
                ic_traits_html += Mustache.to_html(tpl,category);
            });

            var result = {
                traits: traits_html,
                ic: ic_traits_html
            };

            return result;

            // if(traitsEditor.traits && Object.keys(traitsEditor.traits).length > 0) {
            //
            //     formWrapper.find('.taxon-traits').html(traits_html);
            // }else{
            //     formWrapper.find('.taxon-traits').html('No traits.');
            // }
            //
            // if(traitsEditor.ic_traits && Object.keys(traitsEditor.ic_traits).length > 0){
            //     formWrapper.find('.ic-taxon-traits').html(ic_traits_html);
            // }else{
            //     formWrapper.find('.taxon-traits').html('No identification characters.');
            // }

        },

        insertTraitFields: function(holder){

            for(var i=0; i< holder.find('.tep-tod-holder').length;i++){

                var ep = holder.find('.tep-tod-holder').eq(i);
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

                        fld = '<div class="genders-filelds-holder">' +
                            '<div class="genders-block"><label class="gender-label">female</label><div class="female-ep-tod-holder ep-tod-holder" data-id="'+tod_id+'"><input type="text" class="ap-value ap-field-editor" value="'+value1+'"/></div></div>' +
                            '<div class="genders-block"><label class="gender-label">male</label><div class="male-ep-tod-holder ep-tod-holder" data-id="'+tod_id+'"><input type="text" class="ap-value ap-field-editor" value="'+value1+'"/></div></div>' +
                            '<div class="genders-block"><label class="gender-label">larva</label><div class="larva-ep-tod-holder ep-tod-holder" data-id="'+tod_id+'"><input type="text" class="ap-value ap-field-editor" value="'+value1+'"/></div></div>' +
                            '</div>';

                        insert.html(fld);

                        break;

                    case 'INTEGER':

                        fld = '<div class="genders-filelds-holder">' +
                            '<div class="genders-block"><label class="gender-label">female</label><div class="female-ep-tod-holder ep-tod-holder" data-id="'+tod_id+'"><input type="number" class="ap-value ap-field-editor" value="'+value1+'"/></div></div>' +
                            '<div class="genders-block"><label class="gender-label">male</label><div class="male-ep-tod-holder ep-tod-holder" data-id="'+tod_id+'"><input type="number" class="ap-value ap-field-editor" value="'+value1+'"/></div></div>' +
                            '<div class="genders-block"><label class="gender-label">larva</label><div class="larva-ep-tod-holder ep-tod-holder" data-id="'+tod_id+'"><input type="number" class="ap-value ap-field-editor" value="'+value1+'"/></div></div>' +
                            '</div>';

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

                holder.find('.ep-tod-holder .select2-item').select2();

            }

        },

        populateTraits: function () {
	        var tpl = `
	            <div class="tep-list-holder with_title">
		            <div class="tep-title_wrapper">
		                <div class="tep-title">{{category}}</div>
	                </div>
		            {{#params}}
		            <div class="tep-item-holder" data-isparent="{{isParent}}" data-id="{{id}}" data-triaitid="{{trait_id}}" data-type="{{trait_type_sysname}}">
		                {{#isParent}}
		                <div class="is-parent-fader">
		                    <div class="fader-text">Inherited: {{taxon_name}}</div>
	                    </div>
	                    {{/isParent}}
		                <label>{{name}}</label>
		                <div class="tep-tod-holder" data-type="{{trait_type_sysname}}" data-value1="{{value1}}" data-value2="{{value2}}" data-sign="{{meas_unit_sign}}"></div>
		                {{#isSetted}}<div class="tep-remove" data-id="{{id}}"><i class="fa fa-trash-o"></i></div>{{/isSetted}}
		                <div class="tep-genders" data-id="{{id}}"><i class="fa fa-list"></i></div>
	                    <div class="tep-description" data-id="{{id}}"><i class="fa fa-question-circle-o"></i></div>
		                <div class="tep-litdata" data-is-taxon="false" data-id="{{id}}"><i class="fa fa-font"></i></div>
		            </div>
		            {{/params}}
		        </div>
	        `;


	        let traits = sortByCategoryId(traitsEditor.traits || []);
	        let ic_traits = sortByCategoryId(traitsEditor.ic_traits || []);

	        console.log('traits', traits);
	        console.log('ic_traits', ic_traits);

	        let traits_html = '';
	        traits.forEach(category => {
		        traits_html += Mustache.to_html(tpl, category);
	        });

	        let ic_traits_html = '';
	        ic_traits.forEach(category => {
		        ic_traits_html += Mustache.to_html(tpl, category);
	        });

	        if (traitsEditor.traits && Object.keys(traitsEditor.traits).length > 0) {
		        formWrapper.find('.taxon-traits').html(traits_html);
	        } else {
		        formWrapper.find('.taxon-traits').html('No traits.');
	        }

	        if (traitsEditor.ic_traits && Object.keys(traitsEditor.ic_traits).length > 0) {
		        formWrapper.find('.ic-taxon-traits').html(ic_traits_html);
	        } else {
		        formWrapper.find('.ic-taxon-traits').html('No identification characters.');
	        }

	        var tepTodHolderLength = formWrapper.find('.sc_taxon-traits-holder .tep-tod-holder').length;

	        for (var i = 0; i < tepTodHolderLength; i++) {
		        var ep = formWrapper.find('.sc_taxon-traits-holder .tep-tod-holder').eq(i);
		        var epitem = ep.parents('.tep-item-holder');
		        var sign = ep.attr('data-sign');
		        var type = ep.attr('data-type');
		        var $insert = ep;

		        var trait = getTraitById(epitem.attr('data-id'));
		        if (!trait) continue;

		        var value1 = ep.attr('data-value1');
		        var value2 = ep.attr('data-value2');

                MB.TraitFields.insertFieldHTML($insert, trait, type, value1, value2, sign);
	        }

            formWrapper.find('.ep-tod-holder .select2-item').select2();

	        for(let k in traitsEditor.literatureData_value){
		        $(`.tep-litdata[data-id="${traitsEditor.literatureData_value[k].taxon_trait_value_id}"]`).addClass("active");
	        }

	        for(let i in traitsEditor.traits_with_another_gender_val) {
                $(`[data-triaitid="${traitsEditor.traits_with_another_gender_val[i]}"] .tep-genders`).addClass("active");
            }

	        traitsEditor.setHandlers();
        },


        getHabitatTree: function (cb) {
            var o = {
                command: 'getTree',
                object: 'Habitat',
                params: {
                    id: 5
                }
            };

            socketQuery(o, function (res) {
                if(res.code != 0){
                    toastr[res.toastr.type](res.toastr.message);
                    return;
                }

                traitsEditor.habitats_tree = res.tree;

                if(typeof cb === 'function') cb();
            });
        },

        populateHabitatsTree: function () {
            var holder = formWrapper.find('.habitat_tree_holder');

            holder.jstree({
                'core': {
                    'multiple': false,
                    'data': function (node, cb) {
                        if (node.id === "#") {
                            cb(traitsEditor.habitats_tree.core.data);
                        } else {
                            let o = {
                                command: 'getTreeChilds',
                                object: 'Habitat',
                                params: {
                                    id: node.id
                                }
                            };

                            socketQuery(o, function (res) {
                                if (res.code !== 0) {
                                    toastr[res.toastr.type](res.toastr.message);
                                    return false;
                                }

                                cb(res.tree.core.data);
                            });
                        }
                    }
                }
            });

            holder.on('select_node.jstree', function (e, a) {

                traitsEditor.habitats_tree_selected_id = +a.node.id;
            });

            formWrapper.find('.add_habitat').off('click').on('click', function () {
                if (!traitsEditor.habitats_tree_selected_id) {
                    toastr['info']('Please, select habitat from the tree.');
                    return;
                }

                let o = {
                    command: 'get',
                    object: 'taxon_habitat',
                    params: {
                        param_where: {
                            taxon_id: id,
                            habitat_id: traitsEditor.habitats_tree_selected_id
                        },
                        collapseData: false
                    }
                };

                socketQuery(o, (res) => {
                    if (res && res.length) {
                        toastr['error']('Taxon already binded to the habitat.');
                    } else {
                        let o = {
                            command: 'add',
                            object: 'taxon_habitat',
                            params: {
                                taxon_id: id,
                                habitat_id: traitsEditor.habitats_tree_selected_id
                            }
                        };

                        socketQuery(o, (res) => {
                            if (res.code === 0) {
                                for (let t of formInstance.tblInstances) {
                                    if (t.class === 'taxon_habitat') {
                                        t.reload();
                                        break;
                                    }
                                }
                            }
                        });
                    }
                });
            });
        },


        getTree: function (cb) {

            var o = {
                command: 'getTree',
                object: 'Taxon',
                params: {
                    id: formInstance.activeId,
                    selected: true
                }
            };

            socketQuery(o, function (res) {
                if(res.code !== 0){
                    toastr[res.toastr.type](res.toastr.message);
                    return;
                }

                traitsEditor.tree = res.tree;

                // console.log('TREWEEEEEEEE', res.tree);

                if(typeof cb === 'function')
	                cb();
            });

        },

        populateTree: function () {
            var holder = formWrapper.find('.taxon-tree-holder');

            holder.jstree({
                'core': {
                    'multiple': false,
                    'data': function (node, cb) {
                        if (node.id === "#") {
                            cb(traitsEditor.tree.core.data);
                        }
                        else {
                            // debugger;
                            var o = {
                                command: 'getTreeChilds',
                                object: 'taxon',
                                params: {
                                    id: node.id
                                }
                            };

                            socketQuery(o, function (res) {
                                if (res.code !== 0) {
                                    toastr[res.toastr.type](res.toastr.message);
                                    return false;
                                }
                                // console.log('TREE DATA', res.tree.core.data);

                                cb(res.tree.core.data);
                            });
                        }
                    }
                }
            });

            holder.on('open_node.jstree', function (e, a) {
                // console.log('here', a);
            });

            holder.on('select_node.jstree', function (e, a) {
                id = a.node.id;
                formInstance.activeId = id;
                formInstance.tablePKeys['data'][0] = id;

                formInstance.reloadByActiveId(function (newFormInstance) {
                    traitsEditor.reload();
                    formWrapper.find('.name-place').html(formInstance.data.data[0].name);
                });
            });
        },


        getParentPictures: function (cb) {
            var o = {
                command: 'getParentPictures',
                object: 'taxon',
                params: {
                    id: formInstance.activeId
                }
            };

            socketQuery(o, function (res) {
                if (res.code != 0) {
                    toastr[res.toastr.type](res.toastr.message);
                }

	            traitsEditor.parentPictures = res.pictures || [];
	            traitsEditor.parentDIPictures = res.di_pictures || [];

                if (typeof cb == 'function') cb();
            });
        },

        populateParentPictures: function () {
            var tpl, mo;

            if (traitsEditor.parentPictures.length === 0 && traitsEditor.parentDIPictures.length === 0) {
                tpl = '<div class="no-traits col-md-12">No pictures</div>';
            } else {

                tpl = `
                {{#parental_pictures}}
                <div class="pic-block col-md-2" data-id="{{id}}" data-type="{{from}}">
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
                `;

                mo = {
                    parental_pictures: []
                };

                let pics = traitsEditor.parentPictures.concat(traitsEditor.parentDIPictures);

                for (var i in pics) {
                    var p = pics[i];

                    mo.parental_pictures.push({
	                    from: 'data_individual_id' in p ? 'data_individual' : 'taxon',
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
                if (res.code != 0) {
                    toastr[res.toastr.type](res.toastr.message);
                }

	            traitsEditor.taxonPictures = res.pictures || [];
	            traitsEditor.taxonDIPictures = res.di_pictures || [];

                if (typeof cb == 'function') {
                    cb();
                }
            });
        },

        populateTaxonPictures: function () {
            var tpl, mo;

            if (traitsEditor.taxonPictures.length === 0 && traitsEditor.taxonDIPictures.length === 0) {
                tpl = '<div class="no-traits col-md-12">No pictures</div>';
            } else {
                tpl = `
		            {{#taxonPictures}}
		            <div class="pic-block col-md-3" data-id="{{id}}">
				        <div class="pic-holder gallery_image_wrapper">
				            <div class="pic-zoom fa fa-search-plus"></div>
				            <img 
				                src="upload/Taxon_pictures/{{img_mini}}" 
				                class="tax-pic parental-pic gallery_image" 
				                data-id="{{id}}"
				                data-small-src="upload/Taxon_pictures/{{img_small}}" 
				                data-full-src="upload/Taxon_pictures/{{img}}" 
				                data-label="{{label}}" />
                            <div class="pic_button set_as_main remove_image" data-type="{{from}}" data-picid="{{id}}"><i class="fa fa-check-circle-o"></i></div>
						 </div>
				        {{#show_del}}
				        <div class="remove-trait-picture remove_image" data-picid="{{id}}"><i class="fa fa-trash-o"></i></div>
				        {{/show_del}}
				        <div class="pic-is-main-holder">Is main: {{{is_main}}}</div>
				        <div class="pic-published-holder">Published: {{{published}}}</div>
				        {{{inherited_source}}}
				        {{{author}}}
				        {{{copyright}}}
				        {{{pic_source}}}
			        </div>
			        {{/taxonPictures}}
		        `;

                mo = {
                    taxonPictures: []
                };

	            for (var i in traitsEditor.taxonPictures) {
		            var p = traitsEditor.taxonPictures[i];

		            let obj = {
			            from: 'taxon',
			            id: p.id,
			            img: p.name,
			            img_small: p.name_small,
			            img_mini: p.name_mini,
			            inherited_source: p.inherited_source ? `<div class="pic_holder_text"><span class="title">From: </span><span>${p.inherited_source}</span></div>` : '',
			            type: p.type ? `<div class="pic_holder_text"><span class="title">Type: </span><span>${p.type}</span></div>` : '',
			            author: p.author ? `<div class="pic_holder_text"><span class="title">Author: </span><span>${p.author}</span></div>` : '',
			            copyright: p.copyright ? `<div class="pic_holder_text"><span class="title">Copyright: </span><span>${p.copyright}</span></div>` : '',
			            pic_source: p.pic_source ? `<div class="pic_holder_text"><span class="title">Source: </span><span>${p.pic_source}</span></div>` : '',
			            description: p.description ? `<div class="pic_holder_text"><span class="title">Description: </span><span>${p.description}</span></div>` : '',
			            is_main: (p.is_main_picture) ? '<i class="fa fa-check-circle-o"></i>' : '<i class="fa fa-times-circle-o"></i>',
			            published: (p.show_on_site) ? '<i class="fa fa-check-circle-o"></i>' : '<i class="fa fa-times-circle-o"></i>',
			            show_del: true
		            };

		            obj.label = `
							<div class="picture-data-holder-modal">
								${obj.inherited_source}
							    ${obj.author}
							    ${obj.copyright}
							    ${obj.pic_source}
							    ${obj.description}
							    ${obj.type}
                                <br/>
                                <div class="pic-is-main-holder">Is main: ${obj.is_main}</div>
                                <div class="pic-published-holder">Published: ${obj.published}</div>
                            </div>`;

		            mo.taxonPictures.push(obj);
	            }

	            for (var i in traitsEditor.taxonDIPictures) {
		            var p = traitsEditor.taxonDIPictures[i];

		            let obj = {
			            from: 'data_individual',
			            id: p.id,
			            img: p.name,
			            img_small: p.name_small,
			            img_mini: p.name_mini,
			            inherited_source: p.inherited_source ? `<div class="pic_holder_text"><span class="title">From: </span><span>${p.inherited_source}</span></div>` : '',
			            type: p.type ? `<div class="pic_holder_text"><span class="title">Type: </span><span>${p.type}</span></div>` : '',
			            author: p.author ? `<div class="pic_holder_text"><span class="title">Author: </span><span>${p.author}</span></div>` : '',
			            copyright: p.copyright ? `<div class="pic_holder_text"><span class="title">Copyright: </span><span>${p.copyright}</span></div>` : '',
			            pic_source: p.pic_source ? `<div class="pic_holder_text"><span class="title">Source: </span><span>${p.pic_source}</span></div>` : '',
			            description: p.description ? `<div class="pic_holder_text"><span class="title">Description: </span><span>${p.description}</span></div>` : '',
			            is_main: (p.is_main_picture) ? '<i class="fa fa-check-circle-o"></i>' : '<i class="fa fa-times-circle-o"></i>',
			            published: (p.show_on_site) ? '<i class="fa fa-check-circle-o"></i>' : '<i class="fa fa-times-circle-o"></i>',
			            show_del: false
		            };

		            obj.label = `
							<div class="picture-data-holder-modal">
								${obj.inherited_source}
							    ${obj.author}
							    ${obj.copyright}
							    ${obj.pic_source}
							    ${obj.description}
							    ${obj.type}
                                <br/>
                                <div class="pic-is-main-holder">Is main: ${obj.is_main}</div>
                                <div class="pic-published-holder">Published: ${obj.published}</div>
                            </div>`;

		            mo.taxonPictures.push(obj);
	            }
            }

            formWrapper.find('.taxon-pictures').html(Mustache.to_html(tpl, mo));

	        formWrapper.find('.remove-trait-picture').off('click').on('click', function () {

		        var o = {
			        command: 'remove',
			        object: 'taxon_picture',
			        params: {
				        id: $(this).attr('data-picid')
			        }
		        };

		        socketQuery(o, function (res) {
			        if (!res.code == 0) {

				        return false;
			        }

			        traitsEditor.reloadPictures();
		        });

	        });
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
                if (res.code != 0) {
                    toastr[res.toastr.type](res.toastr.message);
                }

	            traitsEditor.sameLevelPictures = res.pictures || [];
	            traitsEditor.sameLevelDIPictures = res.di_pictures || [];

                if (typeof cb == 'function') {
                    cb();
                }
            });
        },

        populateSamePictures: function () {
            var tpl, mo;

            if (traitsEditor.sameLevelPictures.length === 0 && traitsEditor.sameLevelDIPictures.length === 0) {

                tpl = '<div class="no-traits col-md-12">No pictures</div>';

            } else {

                tpl = `
                {{#sameLevelPictures}}
                <div class="pic-block col-md-2" data-id="{{id}}" data-type="{{from}}">
                    <div class="pic-holder gallery_image_wrapper">
				            <img 
				                src="upload/Taxon_pictures/{{img_mini}}" 
				                class="tax-pic parental-pic gallery_image" 
				                data-id="{{id}}"
				                data-small-src="upload/Taxon_pictures/{{img_small}}" 
				                data-full-src="upload/Taxon_pictures/{{img}}"/>
                    </div>
                </div>
                {{/sameLevelPictures}}
                `;

                mo = {
                    sameLevelPictures: []
                };

                let pics = traitsEditor.sameLevelPictures.concat(traitsEditor.sameLevelDIPictures);

                for (var i in pics) {
                    var p = pics[i];

                    mo.sameLevelPictures.push({
	                    from: 'data_individual_id' in p ? 'data_individual' : 'taxon',
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


        getChildTaxonsPictures : function (cb) {
            if (formInstance.data.data[0].level_name == 'species') {
                if (typeof cb === 'function') return cb(null);
                return;
            }

            var o = {
                command: 'getChildPictures',
                object: 'Taxon',
                params: {
                    id: formInstance.activeId
                }

            };

            socketQuery(o, function (res) {
                if (res.code != 0) {
                    toastr[res.toastr.type](res.toastr.message);
                }

	            traitsEditor.childTaxonsPictures = res.pictures || [];
	            traitsEditor.childTaxonsDIPictures = res.di_pictures || [];

                if (typeof cb === 'function') cb(null);
            });
        },

        populateChildTaxonsPictures: function () {
            var tpl, mo;

            formWrapper.find('.child-level-pictures-holder').css('display', 'block');

            if (traitsEditor.childTaxonsPictures.length === 0 && traitsEditor.childTaxonsDIPictures.length === 0) {


                tpl = '<div class="no-traits col-md-12">No pictures</div>';

            } else {
                tpl = `
                {{#childTaxons_pictures}}
                <div class="pic-block col-md-2" data-id="{{id}}" data-type="{{from}}">
                    <div class="pic-holder gallery_image_wrapper">
			            <img 
			                src="upload/Taxon_pictures/{{img_mini}}" 
			                class="tax-pic parental-pic gallery_image" 
			                data-id="{{id}}"
			                data-small-src="upload/Taxon_pictures/{{img_small}}" 
			                data-full-src="upload/Taxon_pictures/{{img}}" />
                        <div class="pic_button set_as_main remove_image" data-type="{{from}}" data-picid="{{id}}"><i class="fa fa-check-circle-o"></i></div>
                    </div>
                </div>{{/childTaxons_pictures}}
                `;


                mo = {
                    childTaxons_pictures: []
                };

                let pics = traitsEditor.childTaxonsPictures.concat(traitsEditor.childTaxonsDIPictures);

                for (var i in pics) {
                    var p = pics[i];

                    mo.childTaxons_pictures.push({
	                    from: 'data_individual_id' in p ? 'data_individual' : 'taxon',
                        id: p.id,
                        img: p.name,
                        img_small: p.name_small,
                        img_mini: p.name_mini,
                        description: p.description || ' '
                    });
                }
            }

            formWrapper.find('.child-level-pictures').html(Mustache.to_html(tpl, mo));
        },


        getSynonymsPictures: function (cb) {
            var o = {
                command: 'getSynonymsPictures',
                object: 'taxon',
                params: {
                    id: formInstance.activeId
                }
            };

            socketQuery(o, function (res) {
                if (res.code != 0) {
                    toastr[res.toastr.type](res.toastr.message);
                }

	            traitsEditor.synonymsPictures = res.pictures || [];
	            traitsEditor.synonymsDIPictures = res.di_pictures || [];

                if (typeof cb == 'function') {
                    cb();
                }
            });
        },

        populateSynonymsPictures: function () {
            var tpl, mo;

            if (traitsEditor.synonymsPictures.length == 0 && traitsEditor.synonymsDIPictures.length === 0) {

                tpl = '<div class="no-traits col-md-12">No pictures</div>';

            } else {
                tpl = `
	                {{#synonymsPictures}}
	                <div class="pic-block col-md-2" data-id="{{id}}" data-type="{{from}}">
	                    <div class="pic-holder gallery_image_wrapper">
				            <img 
				                src="upload/Taxon_pictures/{{img_mini}}" 
				                class="tax-pic parental-pic gallery_image" 
				                data-id="{{id}}"
				                data-small-src="upload/Taxon_pictures/{{img_small}}" 
			                data-full-src="upload/Taxon_pictures/{{img}}"/>
                            <div class="pic_button set_as_main remove_image" data-type="{{from}}" data-picid="{{id}}"><i class="fa fa-check-circle-o"></i></div>
	                    </div>
	                </div>
	                {{/synonymsPictures}}
                `;

                mo = {
                    synonymsPictures: []
                };

                let pics = traitsEditor.synonymsPictures.concat(traitsEditor.synonymsDIPictures);

                for (var i in pics) {
                    var p = pics[i];

                    mo.synonymsPictures.push({
	                    from: 'data_individual_id' in p ? 'data_individual' : 'taxon',
                        id: p.id,
                        img: p.name,
                        img_small: p.name_small,
                        img_mini: p.name_mini,
                        description: p.description || ' '
                    });
                }
            }

            formWrapper.find('.synonyms_pictures').html(Mustache.to_html(tpl, mo));
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
            };

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
                    '<div class="tep-remove" data-id="{{id}}"><i class="fa fa-trash-o"></i></div>' +
                    '<div class="tep-litdata" data-is-taxon="false" data-id="{{id}}"><i class="fa fa-font"></i></div>' +
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

	            for (var i = 0; i < formWrapper.find('.taxon-parameters .tep-tod-holder').length; i++) {
		            var ep = formWrapper.find('.taxon-parameters .tep-tod-holder').eq(i)
		            var type = ep.attr('data-type')
		            var fld
		            var insert = ep
		            var tod_id = type

		            var value1 = ep.attr('data-value1')
		            var value2 = ep.attr('data-value2')

		            switch (type) {

			            case 'SHORT_TEXT':

				            fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><input type="text" class="ap-value ap-field-editor" value="' + value1 + '"/></div>'
				            insert.html(fld)

				            break

			            case 'INTEGER':

				            fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><input type="number" class="ap-value ap-field-editor" value="' + value1 + '"/></div>'
				            insert.html(fld)


				            break

			            case 'INTEGERRANGE':

				            fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><input type="number" class="ap-value ap-value-1 ap-field-editor ap-field-editor-1" value="' + value1 + '"/><input type="number" class="ap-value ap-value-2 ap-field-editor ap-field-editor-2" value="' + value2 + '"/></div>'
				            insert.html(fld)

				            break

			            case 'FLOAT':

				            fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><input type="number" step="0.1" class="ap-value ap-field-editor" value="' + value1 + '"/></div>'
				            insert.html(fld)

				            break

			            case 'FLOATRANGE':

				            fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><input type="number" step="0.1" class="ap-value ap-value-1 ap-field-editor ap-field-editor-1" value="' + value1 + '"/><input type="number" step="0.1" class="ap-value ap-value-2 ap-field-editor ap-field-editor-2" value="' + value2 + '"/></div>'
				            insert.html(fld)

				            break

			            case 'DATE':

				            fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><input type="text" class="ap-field-date ap-field-editor"  value="' + value1 + '"/></div>'
				            insert.html(fld)

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
				            })

				            break

			            case 'DATERANGE':

				            fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><input type="text" class="ap-field-date ap-field-date-1 ap-field-editor ap-field-editor-1"  value="' + value1 + '"/><input type="text" class="ap-field-date ap-field-date-2 ap-field-editor ap-field-editor-2" value="' + value2 + '"></div>'
				            insert.html(fld)

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
				            })

				            break

			            case 'IMAGE':

				            fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><div class="ap-field-editor ap-field-image">' + value1 + '</div></div>'
				            insert.html(fld)

				            break

			            case 'FILE':

				            fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><div class="ap-field-editor ap-field-file">' + value1 + '</div></div>'
				            insert.html(fld)

				            break

			            case 'SELECT':

				            fld = '<div class="ep-tod-holder" data-id="' + tod_id + '" data-type="select">' +
					            '<div class="ap-lov-item-add"><i class="fa fa-plus"></i>&nbsp;&nbsp;Add list item</div>' +
					            '<div class="ap-lov-insert"></div>' +
					            '</div>'

				            insert.html(fld)

				            var sel_insert = insert.find('.ap-lov-insert')

				            insert.find('.ap-lov-item-add').off('click').on('click', function () {

					            sel_insert.append('<div class="ap-lov-item-holder" data-type="multiselect"><label>Set value</label><input type="text" class="ap-lov-item-fld" /><div class="ap-lov-item-set-as-selected">Set as selected</div><div class="ap-lov-remove-item"><i class="fa fa-times"></i>&nbsp;&nbsp;Remove item</div></div>')

					            sel_insert.find('.ap-lov-item-set-as-selected').off('click').on('click', function () {


						            var allp = $(this).parents('.ap-tod-holder')
						            var tp = $(this).parents('.ap-lov-item-holder')

						            allp.find('.ap-lov-item-holder').removeClass('selected')

						            allp.find('.ap-lov-item-set-as-selected').html('Set as selected')

						            tp.toggleClass('selected')

						            if (tp.hasClass('selected')) {
							            $(this).html('Deselect')
						            } else {
							            $(this).html('Set as selected')
						            }


					            })

					            sel_insert.find('.ap-lov-remove-item').off('click').on('click', function () {

						            var tp = $(this).parents('.ap-lov-item-holder')
						            tp.remove()

					            })

				            })


				            break

			            case 'MULTISELECT':

				            fld = '<div class="ep-tod-holder" data-id="' + tod_id + '" data-type="multiselect">' +
					            '<div class="ap-lov-item-add"><i class="fa fa-plus"></i>&nbsp;&nbsp;Add list item</div>' +
					            '<div class="ap-lov-insert"></div>' +
					            '</div>'

				            insert.html(fld)

				            var sel_insert = insert.find('.ap-lov-insert')

				            insert.find('.ap-lov-item-add').off('click').on('click', function () {

					            sel_insert.append('<div class="ap-lov-item-holder" data-type="multiselect"><input type="text" class="ap-lov-item-fld" /><div class="ap-lov-item-set-as-selected">Set as selected</div><div class="ap-lov-remove-item"><i class="fa fa-times"></i>&nbsp;&nbsp;Remove item</div></div>')

					            sel_insert.find('.ap-lov-item-set-as-selected').off('click').on('click', function () {

						            var tp = $(this).parents('.ap-lov-item-holder')
						            tp.toggleClass('selected')

						            if (tp.hasClass('selected')) {
							            $(this).html('Deselect')
						            } else {
							            $(this).html('Set as selected')
						            }


					            })

					            sel_insert.find('.ap-lov-remove-item').off('click').on('click', function () {

						            var tp = $(this).parents('.ap-lov-item-holder')
						            tp.remove()

					            })

				            })

				            break

			            case 'TEXT':

				            fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><textarea class="ap-field-editor ap-field-textarea">' + value1 + '</textarea></div>'
				            insert.html(fld)

				            break

			            default :

				            break

		            }

		            traitsEditor.setHandlers()
	            }

                formWrapper.find('.tep-remove-OLD').off('click').on('click', function () {

                    var id = $(this).attr('data-id');

                    bootbox.dialog({
                        title: 'Delete trait',
                        message: '<label>Are you sure?</label>',
                        buttons: {
                            success: {
                                label: 'Delete',
                                callback: function () {

                                    // console.log('GERE');

                                    var o = {
                                        command: 'remove',
                                        object: 'taxon_avalible_trait',
                                        params: {
                                            id: id
                                        }
                                    };

                                    // console.log('GERE',o);

                                    socketQuery(o, function (res) {

                                        // console.log('GERE');

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
	        // console.log(state);

	        if (state) {
		        formWrapper.find('.save-traits').addClass('enabled');
	        } else {
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
	        var wasChange = false;
	        var found = false;

	        for (var i in traitsEditor.changes) {
		        var ch = traitsEditor.changes[i];


		        if (ch.id == change.id) {
			        if (ch.value1 != change.value1) {
				        ch.value1 = change.value1;
				        wasChange = true;
			        }
			        if (ch.value2 != change.value2) {
				        ch.value2 = change.value2;
				        wasChange = true;
			        }
			        found = true;
		        }
	        }

	        if (!found) {
		        traitsEditor.changes.push({...change})
		        wasChange = true;
	        }

	        traitsEditor.setHightlight(wasChange);

	        // console.log(traitsEditor.changes);
        },

        setHandlers: function () {

	        const flds = formWrapper.find('.tep-item-holder');

            flds.each(function (i, e) {
	            const type = $(e).attr('data-type')
	            const id = +$(e).attr('data-triaitid')
	            const editor = $(e).find('.ap-field-editor')
	            let value_id = +$(e).attr('data-id')

	            if (value_id !== id) {
		            const trait = getTraitById(value_id)
		            if (!trait || trait.taxon_id !== formInstance.activeId)
			            value_id = null
	            } else {
		            value_id = null
	            }

	            const change = {
		            value_id,
		            value2: '',
		            id: id,
		            gender: 'FEMALE'
	            }

	            switch (type) {
		            case 'SHORT_TEXT':
			            editor.off('input').on('input', function () {
				            change.value1 = editor.val()
				            traitsEditor.setChange(change)
			            })
			            break
		            case 'NUMBER':
			            editor.off('input').on('input', function () {
				            change.value1 = editor.val()
				            traitsEditor.setChange(change)
			            })
			            break
		            case 'FLOAT':
			            editor.off('input').on('input', function () {
				            change.value1 = editor.val()
				            traitsEditor.setChange(change)
			            })
			            break
		            case 'TEXT':
			            editor.off('input').on('input', function () {
				            change.value1 = editor.val()
				            traitsEditor.setChange(change)
			            })
			            break
		            case 'BOOLEAN':
			            editor.off('input').on('input', function () {
				            change.value1 = editor.attr('checked') || null
				            traitsEditor.setChange(change)
			            })
			            break
		            default :
			            break
	            }
            });

	        formWrapper.find('#show_map').off('click').on('click', () => {
		        formWrapper.find('#show_map').toggleClass('show');
            });

            formWrapper.find('.save-traits').off('click').on('click', function () {
                traitsEditor.save(traitsEditor.reloadTraits);
            });

            // formWrapper.find('.parent-taxon-traits-toggler').off('click').on('click', function () {
            //
            //     if(formWrapper.find('.parent-taxon-traits').hasClass('collapsed')){
            //
            //         formWrapper.find('.parent-taxon-traits').removeClass('collapsed');
            //         $(this).html('Collapse traits');
            //
            //     }else{
            //
            //         formWrapper.find('.parent-taxon-traits').addClass('collapsed');
            //         $(this).html('Expand traits');
            //
            //     }
            //
            //
            // });

            // formWrapper.find('.pic-zoom').off('click').on('click', function () {
            //
            //     function getTypeById(id){
            //         for(var i in traitsEditor.pic_types){
            //             if(traitsEditor.pic_types[i].id == id){
            //                 return traitsEditor.pic_types[i].name;
            //             }
            //         }
            //     }
            //
            //     var tpl =   '<div class="owl-carousel">'+
            //         '{{#pictures}}' +
            //             '<div>' +
            //                 '<div class="picture-data-holder-modal">' +
            //                     '<div class="pic-desc">Description: {{description}}</div>' +
            //                     '<div class="pic-type">Type: {{type}}</div>' +
            //                     '<div class="pic-is-main-holder">Is main: {{{is_main_picture}}}</div>' +
            //                     '<div class="pic-published-holder">Published: {{{published}}}</div>' +
            //                 '</div>' +
            //                 '<div class="picture-holder"><img class="es-watch-picture-item" src="upload/Taxon_pictures/{{img}}" /></div>' +
            //             '</div>{{/pictures}}'+
            //         '</div>';
            //
            //     //var taxon = es.getTaxonById(taxon_id);
            //
            //     var mo = {
            //         pictures: []
            //     };
            //
            //     for(var i in traitsEditor.taxonPictures){
            //         mo.pictures.push({
            //             img: traitsEditor.taxonPictures[i].name,
            //             description: traitsEditor.taxonPictures[i].description,
            //             type: getTypeById(traitsEditor.taxonPictures[i].picture_type_id),
            //             is_main_picture: (traitsEditor.taxonPictures[i].is_main_picture)? '<i style="color:green;" class="fa fa-check-circle-o"></i>' : '<i style="color:red;" class="fa fa-times-circle-o"></i>',
            //             published: (traitsEditor.taxonPictures[i].show_on_site)? '<i style="color:green;" class="fa fa-check-circle-o"></i>' : '<i style="color:red;" class="fa fa-times-circle-o"></i>',
            //         });
            //     }
            //
            //
            //     traitsEditor.modal(true, Mustache.to_html(tpl,mo), function(){
            //
            //         $('.owl-carousel').owlCarousel({
            //             dots:true,
            //             nav:true,
            //             center: true,
            //             items: 1
            //         });
            //
            //     });
            //
            // });

            formWrapper.find('.add-avail-param-btn').off('click').on('click', function () {
                var tpl = '<div class="row"><div class="add-av-tax-trait-holder col-md-4">' +
                    '<select id="add-tax-av-trait-select">' +
	                '<option value="-1">Choose trait</option>' +
	                '{{#traits}}<option value="{{id}}">{{name}}</option>{{/traits}}' +
	                '</select>' +
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

                        // console.log(id, type, trait);

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
            });


	        formWrapper.find('.set_as_main').off('click').on('click', function () {
		        var o = {
			        command: 'setAsMain',
			        object: 'taxon_picture',
			        params: {
				        taxon_id: id,
				        id: $(this).attr('data-picid'),
				        type: $(this).attr('data-type')
			        }
		        };

		        socketQuery(o, function (res) {
			        if (res.code !== 0)
				        return false;

			        traitsEditor.reloadPictures();
		        });
	        });


            formWrapper.find('.expand-pictures').off('click').on('click', function () {

                // var p = $(this).parents('.any-pictures-holder');
                //
                // if(p.hasClass('collapsed')){
                //     p.removeClass('collapsed');
                //     $(this).html('Collapse pictures');
                // }else{
                //     p.addClass('collapsed');
                //     $(this).html('View all pictures');
                // }


            });

            formWrapper.find('.ep-tod-holder .select2-item').off('select2:select').on('select2:select', function (e) {
	            let p = $(this).parents('.tep-item-holder').eq(0);
	            let id = +p.attr('data-triaitid');
	            let value_id = +p.attr('data-id')
	            let val = e.params.data.id;

	            if (value_id !== id) {
		            const trait = getTraitById(value_id)
		            if (!trait || trait.taxon_id !== formInstance.activeId)
			            value_id = null
	            } else {
		            value_id = null
	            }

                traitsEditor.setChange({
	                value_id,
                    id: id,
                    value1: val,
                    value2: ''
                });
            });

            formWrapper.find('.load-pictures').off('click').on('click', function () {
                MB.PicEditor.showAddingBox('taxon_picture', 'taxon_id', id,
                    ['visible', 'picture_type', 'external_id', 'description'],
                    () => {
                        traitsEditor.getTaxonPictures(function () {
                            traitsEditor.populateTaxonPictures();
                            traitsEditor.addCollapseBtnToPictures('.taxon-pictures');
                            traitsEditor.setHandlers();
                        });
                    });
            });

            formWrapper.find('.modify-pictures-taxon').off('click').on('click', function () {
                MB.PicEditor.showEditor(traitsEditor.taxonPictures, 'taxon_picture',
                    ['visible', 'picture_type', 'external_id', 'description'],
                    () => {
                        traitsEditor.getTaxonPictures(function () {
                            traitsEditor.populateTaxonPictures();
                            traitsEditor.addCollapseBtnToPictures('.taxon-pictures');
                            traitsEditor.setHandlers();
                        });
                    });
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

                var trait = getDataById($(this).attr('data-id'));

                var tpl = `<h2>{{name}}</h2><br/><div class="trait-desc-holder">{{description}}{{#default_unit}}<br/>Measured in {{default_unit}}{{/default_unit}}</div><br/>
                    <div class="trait-pics-holder">
	                    <div class="row gallery_wrapper">
                            {{#pictures}}
                                <div class="trait-pic-item col-md-3">
                                    <img class="gallery_image_wrapper gallery_image" 
                                        data-small-src=\'upload/Taxon_pictures/{{name}}\' data-full-src=\'upload/Taxon_pictures/{{name}}\' 
                                        src="upload/Taxon_pictures/{{name}}" />
                                    <div class="trait-pic-desc">{{description}}</div>
                                </div>
                            {{/pictures}}
	                    </div>
	                </div>
                    <div class="trait-values-desc-holder">
                        {{#values}}
                            <div>
                                <b>{{name}}</b>{{#definition}}:&nbsp;&nbsp;{{definition}}{{/definition}}
                            </div>
                        {{/values}}
                    </div><br/>`;

                var mo = {
                    name: trait.name,
                    description: trait.definition,
                    pictures: trait.pictures,
                    default_unit: trait.default_unit,
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

            formWrapper.find('.tep-litdata, .add-taxon-lit-data, .l-d-watch').off('click').on('click', function(e) {
            	const $target = $(e.currentTarget)
                var is_taxon = $target.attr('data-is-taxon') == 'true';
                var is_watch = $target.hasClass('l-d-watch');

                var row_id;
                var link_row_id = +$target.attr('data-link-id');

                var trait_value_id = is_watch ? +$target.attr('data-valueid') : +$target.attr('data-id');
                let trait = getTraitById(trait_value_id);
                let trait_name = trait ? `Trait: ${trait.name}` : '';

                if ($target.hasClass('tep-litdata') || $target.hasClass('l-d-watch')) {
                    var found = false;

                    for (var k in traitsEditor.literatureData_value) {
                        if (traitsEditor.literatureData_value[k].taxon_trait_value_id === +trait_value_id) {
                            link_row_id = traitsEditor.literatureData_value[k].id;
                            found = true;
                            break;
                        }
                    }

                    if (found) is_watch = true;
                }

                if (is_watch) {
                    var arr = (is_taxon) ? traitsEditor.literatureData : traitsEditor.literatureData_value;

                    var mo = {};

                    for (var i in arr) {
                        if (arr[i]['id'] === link_row_id) {
                            mo = arr[i];
                            row_id = arr[i]['literature_id'];
                            break;
                        }
                    }

                    var o = {
                        command: 'get',
                        object: 'literature_file',
                        params: {
                            param_where: {
                                literature_id: row_id
                            }
                        }
                    };

                    socketQuery(o, function (res) {
                        if (!res.code == 0) {
                            toastr[res.toastr.type](res.toastr.message);
                            return false;
                        }

                        mo.files = [];


                        for (var i in res.data) {
                            var f = res.data[i];

                            var icon = '';
                            switch (f.extension) {
                                case '.jpg':
                                    icon = 'fa-image';
                                    break;
                                case '.png':
                                    icon = 'fa-image';
                                    break;
                                case '.gif':
                                    icon = 'fa-image';
                                    break;
                                case '.doc':
                                    icon = 'fa-file-word';
                                    break;
                                case '.docx':
                                    icon = 'fa-file-word';
                                    break;
                                case '.pdf':
                                    icon = 'fa-file-o';
                                    break;
                                case '.xlsx':
                                    icon = 'fa-file-o';
                                    break;
                                default:
                                    icon = 'fa-file-word';
                                    break;
                            }


                            mo.files.push({
                                id: f.id,
                                uid: f.file_id,
                                icon: icon,
                                nameOrig: f.file + f.extension,
                                description: f.description
                            });
                        }

                        setLitDataHandlers();
                    });
                } else {
                    mo = {
                        type: '',
                        article: '',
                        title: '',
                        author: '',
                        journal: '',
                        volume: '',
                        number: '',
                        pages: '',
                        year: '',
                        publisher: '',
                        weblink: '',
                        bibtex: '',
                        gost: '',
                        apa: '',
                    };

                    setLitDataHandlers();
                }

                function setLitDataHandlers() {
                    let lit_data_obj = new MB.LitData.init(row_id, link_row_id, mo,
                        'taxon', formInstance.activeId,
                        (is_taxon ? null : 'taxon_trait_value'), trait_value_id);

                    let $dialog_lit_data = bootbox.dialog({
                        title: `Literature data of ${formInstance.data.data[0].name}. ${trait_name}`,
                        message: Mustache.to_html(MB.LitData.getTPL(), mo),
                        className: 'lit_modal_wrapper',
                        buttons: {
                            delete: {
                                label: 'Delete',
                                callback: function () {
                                    lit_data_obj.delete((res) => {
                                        if (res.code === 0) {
                                            if (is_taxon) {
                                                $(`.lit-data-half.taxon .l-d-item[data-link-id="${link_row_id}"]`).remove();
                                            } else {
                                                $(`.lit-data-half.traits .l-d-item[data-link-id="${link_row_id}"]`).remove();
                                                $(`.tep-litdata[data-id="${trait_value_id}"]`).removeClass("active");
                                            }
                                        }

                                        traitsEditor.reloadLiteratureData();
                                    });
                                }
                            },
                            success: {
                                label: 'Confirm',
                                callback: function () {
                                    lit_data_obj.save((res) => {
                                        if (res && res.code && res.code !== 0)
                                        	toastr[res.toastr.type](res.toastr.message);

                                        traitsEditor.reloadLiteratureData();
                                    });
                                }
                            },
                            error: {
                                label: 'Cancel',
                                callback: function () {

                                }
                            }
                        }
                    }).on('shown.bs.modal', function() {
                        $dialog_lit_data.removeAttr("tabindex");

                        lit_data_obj.setHandlers($dialog_lit_data);
                    });
                }
            });

            formWrapper.find('.tep-genders').off('click').on('click', function () {
	            let holder = $(this).parents('.tep-item-holder');

	            const trait_name = holder.find('label').text()
	            const taxon_avalible_trait_id = +holder.attr('data-triaitid')
	            const trait_values_ids_for_remove = []
	            const literature_links = []
	            let taxon_trait_values = []
	            let values_type = holder.attr('data-type');
	            let sub_table_name_for_select;
	            let values_html = ''


	            switch (values_type) {
		            case 'FLOAT':
			            values_type = 'taxon_trait_sub_table_float';
			            break;
		            case 'INTEGER':
			            values_type = 'taxon_trait_sub_table_integer';
			            break;
		            case 'SELECT':
			            values_type = 'taxon_trait_sub_table_select';
			            sub_table_name_for_select = holder.find('select').attr('data-get');
			            break;
                    case 'TEXT':
                        values_type = 'taxon_trait_sub_table_text';
                        break;
                    case 'BOOLEAN':
                        values_type = 'taxon_trait_sub_table_boolean';
                        break;
		            default:
			            values_type = 'taxon_trait_sub_table_varchar';
	            }

	            function renderValueHTML(trait_value_id = null, trait_value = null,
	                                     taxon_gender = { id: 6, text: 'not specified' },
	                                     location = { id: '', text: '' },
	                                     replicates, hasLit = false)  {
	            	let html

		            let value = ''
		            let select_value_id = ''
		            let select_value_text = ''

	            	if (trait_value) {
			            if (trait_value.value1)
				            value = trait_value.value1
			            if (trait_value.select_value) {
				            select_value_id = trait_value.select_value.id
				            select_value_text = trait_value.select_value.name
			            }
		            }

	            	let type;
		            if (values_type === 'taxon_trait_sub_table_select') {
		            	type = 'select';
			            html = `<select data-select-class="${sub_table_name_for_select}" 
										data-select-value-id="${select_value_id}" 
										data-select-value-text="${select_value_text}"></select>`;
		            } else if (values_type === 'taxon_trait_sub_table_boolean') {
			            type = 'boolean'
		            	html = `<div class="ep-tod-holder checkbox_holder" data-id="BOOLEAN">
									<input class="ap-field-editor" type="checkbox" ${value ? 'checked' : ''}>
									<i class="fa fa-check"></i>
									<i class="fa fa-times"></i>
								</div>`
		            } else {
			            switch (values_type) {
				            case 'taxon_trait_sub_table_float':
				            case 'taxon_trait_sub_table_integer':
					            type = 'number'
					            value = isNaN(+value) ? '' : +value
					            break;
				            case 'taxon_trait_sub_table_varchar':
				            case 'taxon_trait_sub_table_text':
					            type = 'text'
					            value = value ? value : ''
					            break;
				            default:
					            type = 'text'
					            value = value ? value : ''
			            }

			            html = `<input class="usual_type" type="${type}" value="${value}">`
		            }

		            let lit_bttn = `<div class="tep-button tep-litdata ${hasLit ? 'active' : ''}" data-id="${trait_value_id}"><i class="fa fa-font"></i></div>`

		            return `<div class="gender_trait_wrapper" data-type="${type}" data-trait-value-id="${trait_value_id}">
								<div class="cell value">${html}</div>
								<div class="cell">
									<select 
										data-select-class="taxon_gender" 
										data-select-value-id="${taxon_gender.id}" 
										data-select-value-text="${taxon_gender.text}" 
										data-placeholder="Choose gender..."><option></option></select>
								</div>
								<div class="cell replicates">
									<input class="usual_type" type="number" value="${replicates}">
								</div>
								<div class="cell">
									<select 
										data-select-class="location" 
										data-select-value-id="${location.id}" 
										data-select-value-text="${location.text}" 
										data-placeholder="Choose location..."><option></option></select>
								</div>
								<div class="tep-button tep-remove" data-id="${trait_value_id}"><i class="fa fa-trash-o"></i></div>				
								${trait_value_id ? lit_bttn : ''}	
							</div>`;
	            }

	            function initSelect($select) {
		            let limit = 100;
		            let select_class = $select.attr('data-select-class');
		            let select_return_name = $select.attr('data-select-return-name') || 'name'
		            let select_placeholder = $select.attr('data-select-placeholder') || 'Select value...'

		            const value_id = +$select.attr('data-select-value-id')
		            const value_text = $select.attr('data-select-value-text')
		            const data = [{id: value_id, text: value_text, selected: true}]

		            // console.log('data', data);

		            $select.select2({
			            data: data,
			            placeholder: select_placeholder,
			            ajax: {
				            dataType: 'json',
				            delay: 250,
				            transport: function (params, success, failure) {
					            let o = {
						            command: 'get',
						            object: select_class,
						            params: {
							            limit: limit,
							            page_no: params.data.page || 1,
							            where: []
						            }
					            };

					            if (params.data.term) {
						            o.params.where.push({
							            key: select_return_name,
							            type: 'like',
							            val1: params.data.term
						            })
					            }

					            socketQuery(o, res => {
						            if (res.code === 0) {
							            let data = Object.keys(res.data).map(key => {
							            	const row = res.data[key]

							            	return {
									            id: row.id,
									            text: row[select_return_name]
								            }
							            })

							            success({
								            items: data,
								            size: data.length
							            });
						            } else {
							            failure('failed');
						            }
					            });
				            },
				            processResults: function (data, params) {
				            	// console.log('processResults', data, params);

					            params.page = params.page || 1;

					            return {
						            results: data.items,
						            pagination: {
							            more: data.size === limit
						            }
					            };
				            },
			            }
		            })
	            }

	            function initRowSelects($row) {
		            $row.find('select').each((i, v) => initSelect($(v)))
	            }

	            function initValueSelects($dialog) {
		            $dialog.find('.gender_trait_wrapper').each((i, v) => initRowSelects($(v)))
	            }

	            function initDeleteButton($dialog) {
		            $($dialog).find('.tep-remove').off('click').on('click', function (e) {
			            let id = +$(e.currentTarget).attr('data-id');

			            $(e.currentTarget).parent(`.gender_trait_wrapper`).remove();

			            if (!id) return;

			            trait_values_ids_for_remove.push(id)
		            });
	            }

	            function initLitButton($dialog) {
		            $dialog.find('.tep-litdata').off('click').on('click', function(e) {
		            	const $target = $(e.currentTarget)
			            const trait_value_id =  +$target.attr('data-id')

			            let litLink = null

			            for (const row of literature_links)
				            if (row.taxon_trait_value_id === trait_value_id) {
					            litLink = row
					            break
				            }

			            function setLitDataHandlers() {
				            let lit_data_obj = new MB.LitData.init(litLink.literature_id, litLink.id, litLink,
					            'taxon', formInstance.activeId,
					            'taxon_trait_value', trait_value_id);

				            let $dialog_lit_data = bootbox.dialog({
					            title: `Literature data of ${formInstance.data.data[0].name}. ${`Trait: ${trait_name}`}`,
					            message: Mustache.to_html(MB.LitData.getTPL(), litLink),
					            className: 'lit_modal_wrapper',
					            buttons: {
						            delete: {
							            label: 'Delete',
							            callback: function () {
								            lit_data_obj.delete((res) => {
									            if (res && res.code && res.code !== 0)
										            toastr[res.toastr.type](res.toastr.message);
									            else
										            $target.removeClass("active");
								            });
							            }
						            },
						            success: {
							            label: 'Confirm',
							            callback: function () {
								            lit_data_obj.save((res) => {
									            if (res && res.code && res.code !== 0)
									            	toastr[res.toastr.type](res.toastr.message);
									            else
										            $target.addClass("active");
								            });
							            }
						            },
						            error: {
							            label: 'Cancel',
							            callback: function () {

							            }
						            }
					            }
				            }).on('shown.bs.modal', function() {
					            $dialog_lit_data.removeAttr("tabindex");

					            lit_data_obj.setHandlers($dialog_lit_data);
				            });
			            }

			            if (litLink) {
				            const o = {
					            command: 'get',
					            object: 'literature_file',
					            params: {
						            param_where: {
							            literature_id: litLink.literature_id
						            }
					            }
				            };

				            socketQuery(o, function (res) {
					            if (res.code !== 0) {
						            toastr[res.toastr.type](res.toastr.message);
						            return false;
					            }

					            litLink.files = [];

					            for (const i in res.data) {
						            var f = res.data[i];

						            var icon = '';
						            switch (f.extension) {
							            case '.jpg':
								            icon = 'fa-image';
								            break;
							            case '.png':
								            icon = 'fa-image';
								            break;
							            case '.gif':
								            icon = 'fa-image';
								            break;
							            case '.doc':
								            icon = 'fa-file-word';
								            break;
							            case '.docx':
								            icon = 'fa-file-word';
								            break;
							            case '.pdf':
								            icon = 'fa-file-o';
								            break;
							            case '.xlsx':
								            icon = 'fa-file-o';
								            break;
							            default:
								            icon = 'fa-file-word';
								            break;
						            }


						            litLink.files.push({
							            id: f.id,
							            uid: f.file_id,
							            icon: icon,
							            nameOrig: f.file + f.extension,
							            description: f.description
						            });
					            }

					            setLitDataHandlers();
				            });
			            } else {
				            litLink = {
					            type: '',
					            article: '',
					            title: '',
					            author: '',
					            journal: '',
					            volume: '',
					            number: '',
					            pages: '',
					            year: '',
					            publisher: '',
					            weblink: '',
					            bibtex: '',
					            gost: '',
					            apa: '',
				            };

				            setLitDataHandlers();
			            }
		            });
	            }

	            function removeValues(cb) {
		            if (!trait_values_ids_for_remove.length) return cb(null)

		            async.eachSeries(trait_values_ids_for_remove, (id, cb) => {
			            let o = {
				            command: 'remove',
				            object: 'taxon_trait_value',
				            params: {
					            confirm: true,
					            id: id
				            }
			            };

			            socketQuery(o, () => cb());
		            }, cb)
	            }

	            function afterClose() {
		            traitsEditor.setHightlight(false)
		            traitsEditor.reloadTraits()
		            traitsEditor.reloadLiteratureData()
	            }

	            async.series({
		            getAvailTrait: cb => {
			            let o = {
				            command: 'get',
				            object: 'taxon_trait_value',
				            params: {
					            param_where: {
						            taxon_id: id,
						            taxon_avalible_trait_id: taxon_avalible_trait_id
					            }
				            }
			            };

			            socketQuery(o, (res) => {
				            if (res.code === 0)
				            	taxon_trait_values = Object.keys(res.data).map(key => res.data[key]);

				            cb(null);
			            });
		            },
		            getLiteratureData: cb => {
		            	if (!taxon_trait_values.length) return cb(null)
		            	let o = {
		            	    command: 'get',
		            	    object: 'taxon_trait_value_literature_data_link',
		            	    params: {
		            	    	param_where: {
					                taxon_id: formInstance.activeId
				                },
				                where: [
					                {
					                	key: 'taxon_trait_value_id',
						                type: 'in',
						                val1: taxon_trait_values.map(row => row.id)
					                }
				                ]
			                }
		            	};

			            socketQuery(o, (res) => {
				            if (res.code === 0)
					            Object.keys(res.data).forEach(key => {
					            	const link = res.data[key]

						            literature_links.push(link)

						            for (const value of taxon_trait_values) {
							            if (value.id === link.taxon_trait_value_id) {
								            value.literature_link_id = link.id
								            value.literature_id = link.literature_id
								            break
							            }
						            }
					            })

				            cb(null);
			            });
		            },
		            getTraitSelectValues: cb => {
			            async.eachSeries(taxon_trait_values, (trait, cb) => {
				            if (!trait.trait_type_sub_table_name) return cb(null);

				            values_type = trait.trait_type_sub_table_name;

				            async.series({
					            getTraitValue: cb => {
						            let o = {
							            command: 'get',
							            object: trait.trait_type_sub_table_name,
							            params: {
								            param_where: {
									            taxon_trait_value_id: trait.id
								            }
							            }
						            };

						            socketQuery(o, (res) => {
							            if (res.code === 0) {
								            let value = Object.keys(res.data).map(key => res.data[key]);
								            if (value.length)
									            trait.value = value[0];
							            }

							            cb(null);
						            });
					            },
					            getSelectValue: cb => {
						            if (values_type !== 'taxon_trait_sub_table_select' || !trait.value) return cb(null)

						            let o = {
							            command: 'get',
							            object: trait.sub_table_name_for_select,
							            params: {
								            param_where: {
									            id: trait.value.value1
								            }
							            }
						            }

						            socketQuery(o, (res) => {
							            if (res.code === 0 && res.data[0])
								            trait.value.select_value = res.data[0]

							            cb(null);
						            })
					            }
				            }, cb)
			            }, cb);
		            },
		            renderValues: (cb) => {
			            taxon_trait_values.forEach(row => {
				            const gender = {
					            id: row.taxon_gender_id,
					            text: row.taxon_gender
				            }
				            const location = {
					            id: row.location_id,
					            text: row.location_name
				            }

				            values_html += renderValueHTML(row.id, row.value, gender, location, row.replicates, !!row.literature_id)
			            })

			            cb(null);
		            },
		            renderBox: (cb) => {
			            const html = `
							<div id="trait_per_sex">
								<div class="trait_per_sex_header">
						            <div class="green_bttn_style add_value_by_gender"><i class="fa fa-plus"></i>&nbsp;&nbsp;Add new value</div>
								</div>
								<div class="gender_traits_wrapper">
									<div class="gender_traits_titles">
										<div class="cell">Value</div>
										<div class="cell">Gender</div>
										<div class="cell">Replicates</div>
										<div class="cell">Location</div>
									</div>
									${values_html}
								</div>
		                    </div>`;

			            const $dialog = bootbox.dialog({
				            title: 'Set different traits for different sexes/life stages',
				            message: html,
				            className: 'wide-modal',
				            buttons: {
					            success: {
						            label: 'Save',
						            callback: function () {
							            let values = [];

							            $($dialog).find('.gender_trait_wrapper').each((i, e) => {
								            const trait_value_id = +$(e).attr('data-trait-value-id') || null;
								            const location_id = +$(e).find('select[data-select-class="location"]').val() || null
								            const gender_id = +$(e).find('select[data-select-class="taxon_gender"]').val() || null
								            const replicates = $(e).find('.cell.replicates input').val()
								            const type = $(e).attr('data-type').toLowerCase()

								            let value

								            if (type === 'select') {
									            value = +$(e).find('.cell.value select').val()
								            } else if (type === 'boolean') {
									            value = $(e).find('.cell.value input').attr('checked') === 'checked'
								            } else {
									            value = $(e).find('.cell.value input').val()
								            }

								            // console.log(id, value);
								            if (!isNaN(id) && gender_id)
									            values.push({
										            taxon_id: id,
										            value_id: trait_value_id,
										            value: value,
										            gender_id: gender_id,
										            location_id: location_id,
										            replicates: replicates,
										            id: taxon_avalible_trait_id
									            });
							            });

							            removeValues(() => {
								            if (!values.length) {
								            	if (trait_values_ids_for_remove.length)
										            afterClose()
								            	return
								            }

								            let o = {
									            command: 'setValueByList',
									            object: 'taxon_avalible_trait',
									            params: {
										            list: values
									            }
								            };

								            socketQuery(o, afterClose)
							            })
						            }
					            },
					            error: {
						            label: 'Cancel',
						            callback: function () {

						            }
					            }
				            }
			            }).on('shown.bs.modal', function () {
				            $dialog.removeAttr("tabindex")

				            initValueSelects($dialog)
				            initDeleteButton($dialog)
				            initLitButton($dialog)

				            $('.add_value_by_gender').off('click').on('click', () => {
					            $($dialog).find('.gender_traits_wrapper').append(renderValueHTML())

					            let $row = $($dialog).find('.gender_traits_wrapper > div:last-child')

					            initRowSelects($row)
					            initDeleteButton($row)
					            initLitButton($row)
				            })

				            cb(null);
			            })
		            }
	            }, (err, res) => {
		            // console.log(taxon_trait_values);
		            // console.log(values_type);
	            });
            });

            formWrapper.find('.tep-remove').off('click').on('click', function () {

                var id = $(this).attr('data-id');

                bootbox.dialog({
                    title: 'Delete taxon trait value',
                    message: '<label>Are you sure?</label>',
                    buttons: {
                        success: {
                            label: 'Delete',
                            callback: function () {
                                // console.log('GERE');

                                var o = {
                                    command: 'remove',
                                    object: 'taxon_trait_value',
                                    params: {
                                        confirm:true,
                                        id: id
                                    }
                                };


                                socketQuery(o, function (res) {
                                   traitsEditor.reloadTraits();
                                });
                            }
                        },
                        error: {
                            label: 'Cancel',
                            callback: function () {

                            }
                        }
                    }
                });

            });

            formWrapper.find('#open-gender-traits-editor').off('click').on('click', function(){

                var traits_and_ic = traitsEditor.populateGenderTraits();

                var traits_html = traits_and_ic.traits;
                var ic_html = traits_and_ic.ic;

                var html = '<div id="gender-traits-holder"><div class="col-md-6">' +
                                '<div class="traits-label">Ecological traits</div>' +
                                '<div class="traits-holder">'+traits_html+'</div>' +
                            '</div>' +
                            '<div class="col-md-6">' +
                                '<div class="traits-label">Identification characters</div>' +
                                '<div class="traits-holder">'+ic_html+'</div>' +
                            '</div></div>';

                bootbox.dialog({
                    title: 'Specify traits by gender',
                    message: html,
                    className: 'wide-modal',
                    buttons: {
                        success: {
                            label: 'Save',
                            callback: function(){

                            }
                        },
                        error: {
                            label: 'Cancel',
                            callback: function(){

                            }
                        }
                    }
                });

                traitsEditor.insertTraitFields($('#gender-traits-holder'));

                $('#gender-traits-holder').find('.ep-tod-holder .select2-item').off('select2:opening').on('select2:opening', function (e) {

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

            });

            formWrapper.find('.pdf-opener-habitat_help').off('click').on('click', function () {
               window.open('upload/docs/habitat_help.pdf', '_blank');
            });

            // formWrapper.find('.articles-more').off('click').on('click', function(){
            //
            //
            //     traitsEditor.articlesPage += 10;
            //
            //     traitsEditor.searchArticles(function(html){
            //
            //         formWrapper.find('.articles-more').remove();
            //
            //         formWrapper.find('.articles-data').append(html + '<div class="articles-more">More results</div>');
            //
            //         formWrapper.find('.articles-data a').attr('target','_blank');
            //
            //         traitsEditor.setHandlers();
            //
            //     });
            //
            // });
            //
            // formWrapper.find('.articles-search').off('keyup').on('keyup', function(e){
            //
            //     if(e.keyCode == 13){
            //         formWrapper.find('.articles-search-btn').click();
            //     }
            //
            // });
            //
            // formWrapper.find('.articles-search').off('input').on('input', function(e){
            //
            //     if(e.keyCode != 13){
            //         traitsEditor.articlesPage = 0;
            //     }
            //
            //     traitsEditor.articles_search_keyword = $(this).val();
            //
            //
            // });

	        formWrapper.find('.traits-two-columns .tep-item-holder[data-type="FLOAT"] .ep-tod-holder input, .traits-two-columns .tep-item-holder[data-type="INTEGER"] .ep-tod-holder input')
		        .off('focusout').on('focusout', (e) => {
		        let min = +$(e.currentTarget).attr('min');
		        let max = +$(e.currentTarget).attr('max');
		        let value = +$(e.currentTarget).val();

		        if (Number.isNaN(value)) return;

		        if (!Number.isNaN(max) && value > max)
			        toastr['error']('Maximum is ' + max);
		        else if (!Number.isNaN(min) && value < min)
			        toastr['error']('Minimum is ' + min);
	        });
        },

        save: function (cb) {
        	if (traitsEditor.saving) return

	        traitsEditor.saving = true

	        for (var i in traitsEditor.changes)
		        traitsEditor.changes[i].taxon_id = formInstance.activeId

	        var o = {
		        command: 'setValueByList',
		        object: 'taxon_avalible_trait',
		        params: {
			        list: traitsEditor.changes
		        }
	        };

	        socketQuery(o, function (res) {
		        // console.log(res);

		        traitsEditor.saving = false

		        traitsEditor.changes = []
		        traitsEditor.setHightlight(false);

		        if (typeof cb == 'function')
			        cb()
	        })
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
	        // console.error('formWrapper.find(\'.name-place\')', formWrapper.find('.name-place'));
	        // console.error('formInstance.data.data[0]', formInstance.data.data[0]);
	        formWrapper.find('.name-place').html(formInstance.data.data[0].name);

            if (formInstance.data.data[0].is_gbif) {
                let $field = $('.fn-field[data-column="custom_name"]');
                $field.find('input').remove();
                $field.find('.fn-readonly').remove();
                $field
                    .addClass('fn-readonly-field')
                    .append(`<div class="fn-readonly">${formInstance.data.data[0].custom_name}</div>`);
            }
        },

        getSynonyms: function (cb) {
            var o = {
                command: 'getTaxonSynonyms',
                object: 'taxon',
                params: {
                    id: id
                }
            };

            socketQuery(o, function (res) {
                if (res.code != 0) {
                    toastr[res.toastr.type](res.toastr.message);
                }

                traitsEditor.synonyms = res.synonyms;

                // console.log('getSynonyms', traitsEditor.synonyms);

                if (typeof cb == 'function') {
                    cb();
                }
            })

        },

        populateSynonyms: function () {
            var mo = {
                title: 'Synonyms',
                events: []
            };
            var tpl = `{{title}}: {{#events}}<span class="synonym-item" data-id="{{id}}">{{name}}</span>, {{/events}}`;

            if (formInstance.data.data[0].status_sysname === 'SYNONYM') {
                mo.title = 'Actual taxon';
                mo.events.push({
                    id: formInstance.data.data[0].actual_taxon_id,
                    name: formInstance.data.data[0].actual_taxon
                })
            } else {
                for (var i in traitsEditor.synonyms)
                    mo.events.push(traitsEditor.synonyms[i]);
            }

            if (mo.events.length === 0) tpl += 'Current taxon has no synonyms';

            formWrapper.find('.synonyms-tree-holder').html(Mustache.to_html(tpl, mo).replace(/<\/span>, $/, '</span>'));

            formWrapper.find('.synonym-item').off('click').on('click', function () {
                var id_tmp = $(this).attr('data-id');

                id = id_tmp;
                formInstance.activeId = id_tmp;
                formInstance.tablePKeys['data'][0] = id_tmp;

                formInstance.reloadByActiveId(function (newFormInstance) {
                    // traitsEditor.reload();
                    // formWrapper.find('.name-place').html(formInstance.data.data[0].name);
                });
            });
        }

    };

    formInstance.doNotGetScript = true;
    formInstance.afterReload = function(cb){
        // Можно запихнуть все что нужно вызвать при релоаде без загрузки нового скрипта.
        traitsEditor.reload();
        cb();
    };

    //traitsEditor.getAll();
    traitsEditor.init();


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