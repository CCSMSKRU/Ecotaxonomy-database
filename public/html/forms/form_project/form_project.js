(function() {
    var modal = $('.mw-wrap').last();
    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_project', formID);
    var formWrapper = $('#mw-'+formInstance.id);

    var id = formInstance.activeId;

    var se_tbl = formInstance.tblInstances[0];

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

    function getFactorById(id){

        var traitsFound = false;
        var res = undefined;

        for(var i in projectEditor.plot_factors){
            if(projectEditor.plot_factors[i].id == id){
                traitsFound = true;
                res = projectEditor.plot_factors[i];
            }
        }

        return res;

    }


    var projectEditor = {
	    factor_changes: [],
	    plot_changes: [],
        traits: [],
        ic_traits: [],
        trait_selects: [],
        tree: [],
        parentTraits: [],
        ic_parentTraits: [],
        parentPictures: [],
        taxonPictures: [],
        sameLevelPictures: [],
        pictureTypes: [],
        articlesPage: 0,
        articles_search_keyword: '',

        plot: [],
        current_plot: null,
        parent_plot: [],
        plots_tree: null,

        parentATaxon: [],
        parentMembers: [],

        plot_factors: [],

        init: function () {
            projectEditor.getTree(function () {
                projectEditor.populateTree();
            });

	        // projectEditor.getParentalLocations(function(){
		    //     projectEditor.populateParentalLocations();
	        // });

            projectEditor.getParentalATaxon(function(){
                projectEditor.populateParentalATaxon();
            });

	        projectEditor.getMembers(function(){
		        projectEditor.populateMembers();
	        });

	        projectEditor.getParentalMembers(function(){
		        projectEditor.populateParentalMembers();
	        });

			projectEditor.getParentalPlots(function(){return});

            projectEditor.getPlotsTree(function(){
               projectEditor.populatePlotsTree();
            });

	        projectEditor.getFactors(id, function () {
		        projectEditor.populateFactors();
	        });

	        projectEditor.init2c_meas();
	        projectEditor.init2c_factors();
	        projectEditor.init2c_taxa();
	        projectEditor.init2c_organizations();

            projectEditor.setHandlers();

	        document.addEventListener('accessListRefreshed', function (e) {
		        console.error('accessListRefreshed', e.detail);
		        if (e.detail && +e.detail.id === +id) {
			        projectEditor.getMembers(function(){
				        projectEditor.populateMembers();
			        });
		        }
	        }, false);
        },

        reload: function(cb){
	        // projectEditor.getParentalLocations(function(){
		    //     projectEditor.populateParentalLocations();
	        // });

            projectEditor.getParentalATaxon(function(){
                projectEditor.populateParentalATaxon();
            });

	        projectEditor.getMembers(function(){
		        projectEditor.populateMembers();
	        });

            projectEditor.getParentalMembers(function(){
                projectEditor.populateParentalMembers();
            });

            projectEditor.getPlotsTree(function () {
                projectEditor.populatePlotsTree();
            });

	        projectEditor.getFactors(id, function () {
		        projectEditor.populateFactors();
	        });

            projectEditor.init2c_meas();
            projectEditor.init2c_factors();
            projectEditor.init2c_taxa();
            projectEditor.init2c_organizations();

            projectEditor.setHandlers();

            if (typeof cb === 'function') cb();
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

                if (res.code != 0) {
                    toastr[res.toastr.type](res.toastr.message);
                    return;
                }

                projectEditor.tree = res.tree;

                if (typeof cb == 'function') {
                    cb();
                }

            });

        },

        /*populateTree: function () {

            var holder = formWrapper.find('.proj-tree-holder');

            holder.jstree(projectEditor.tree);

            holder.on('select_node.jstree', function (e,a) {
                var id = a.node.id;

                formInstance.activeId = id;
                formInstance.tablePKeys['data'][0] = id;

                projectEditor.reload();

                formInstance.reloadByActiveId(function(){
                    formWrapper.find('.name-place').html(formInstance.data.data[0].name);
                });
            });

        },*/
        populateTree: function () {
            var holder = formWrapper.find('.proj-tree-holder');

            holder.jstree({
                'core':{
                    'multiple' : false,
                    'data': function(node, cb){
                        if(node.id === "#") {
                            cb(projectEditor.tree.core.data);
                        }
                        else {
                            var o = {
                                command:'getTreeChilds',
                                object:'Project',
                                params:{
                                    id: node.id
                                }
                            };

                            socketQuery(o, function(res){

                                if(!res.code == 0){
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

            holder.on('open_node.jstree', function (e,a) {
                console.log('here', a);
            });

            holder.on('select_node.jstree', function (e,a) {
                var selected_id = +a.node.id;
                id = selected_id;
                formInstance.activeId = selected_id;
                formInstance.tablePKeys['data'][0] = selected_id;

                formInstance.reloadByActiveId(function(newFormInstance){
                    projectEditor.reload();
                    storageEditor.reload();
                    se.reload();
                    formWrapper.find('.name-place').html(formInstance.data.data[0].name);
                });
            });
        },


	    init2c_meas: () => {
		    var tceWrapper2 = formWrapper.find('.two_columns_meas.measurements');
            tceWrapper2.html('');
		    tceWrapper2.tce({
			    parent_id: formInstance.activeId,
			    parent_key: 'project_id',

			    left_pk: 'trait_id',
			    right_pk: 'id',

			    left_id: 'id',
			    right_id: 'id',

			    define_id: 'trait_id',

			    left_name: 'name',
			    right_name: 'name_with_project',
				right_concat_name: 'project',

				command_left: 'getMeasurementIntoTCE',
				get_left: 'taxon_avalible_trait',
				get_left_params:[
				    {
					    key: 'is_individual',
					    value: true
				    }
			    ],
				exclude_left_field: 'trait_id',
			    command_right: 'getWithParentalForTCE',
			    get_right: 'project_trait',
			    get_right_params:[
				    {
					    key: 'project_id',
					    value: formInstance.activeId
				    }
			    ],

			    lu_command: 'project_trait',

			    add_params: [
				    {
					    key: 'trait_id',
					    value: 'GET_ROW_ID'
				    },
				    {
					    key: 'project_id',
					    value: formInstance.activeId
				    }
			    ],

			    left_label: 'Available measurements',
			    right_label: 'Binded measurements',
			    search_label: 'Search for measurements',

			    back_button: false
		    });
	    },
	    init2c_factors: () => {
		    var tceWrapper2 = formWrapper.find('.two_columns_meas.factors');
            tceWrapper2.html('');
		    tceWrapper2.tce({
			    parent_id: formInstance.activeId,
			    parent_key: 'project_id',

			    left_pk: 'sample_factor_id',
			    right_pk: 'id',

			    left_id: 'id',
			    right_id: 'id',

			    define_id: 'sample_factor_id',

			    left_name: 'name',
			    right_name: 'name',
				right_concat_name: 'project',

			    get_left: 'sample_factor',
			    exclude_left_field: 'sample_factor_id',
			    command_right: 'getWithParentalForTCE',
			    get_right: 'project_sample_factor',
			    get_right_params:[
				    {
					    key: 'project_id',
					    value: formInstance.activeId
				    }
			    ],

			    lu_command: 'project_sample_factor',

			    add_params: [
				    {
					    key: 'sample_factor_id',
					    value: 'GET_ROW_ID'
				    },
				    {
					    key: 'project_id',
					    value: formInstance.activeId
				    }
			    ],

			    left_label: 'Available factors',
			    right_label: 'Binded factors',
			    search_label: 'Search for factors',

			    back_button: false
		    });
	    },
	    init2c_taxa: () => {
		    var tceWrapper2 = formWrapper.find('.two_columns_meas.taxa');
            tceWrapper2.html('');
		    tceWrapper2.tce({
			    parent_id: formInstance.activeId,
			    parent_key: 'project_id',

			    left_pk: 'taxon_id',
			    right_pk: 'id',

			    left_id: 'id',
			    right_id: 'id',

			    define_id: 'taxon_id',

			    left_name: ['id', 'name'],
			    right_name: ['taxon_id', 'taxon'],

				left_server_search:true,

			    get_left: 'taxon',
			    exclude_left_field: 'taxon_id',
			    command_right: 'get',
			    get_right: 'project_available_taxon',
			    get_right_params:[
				    {
					    key: 'project_id',
					    value: formInstance.activeId
				    }
			    ],

			    lu_command: 'project_available_taxon',

			    add_params: [
				    {
					    key: 'taxon_id',
					    value: 'GET_ROW_ID'
				    },
				    {
					    key: 'project_id',
					    value: formInstance.activeId
				    }
			    ],

			    left_label: 'Available taxa',
			    right_label: 'Binded taxa',
			    search_label: 'Search for taxa',

			    back_button: false
		    });
	    },
		init2c_organizations: () => {
			var tceWrapper2 = formWrapper.find('.two_columns_meas.organizations');
			tceWrapper2.html('');
			tceWrapper2.tce({
				parent_id: formInstance.activeId,
				parent_key: 'project_id',

				left_pk: 'organization_id',
				right_pk: 'id',

				left_id: 'id',
				right_id: 'id',

				define_id: 'orgnization_id',

				left_name: 'name',
				right_name: 'organization',

				get_left: 'organization',
				exclude_left_field: 'organization_id',
				command_right: 'get',
				get_right: 'project_organization',
				get_right_params:[
					{
						key: 'project_id',
						value: formInstance.activeId
					}
				],

				lu_command: 'project_organization',

				add_params: [
					{
						key: 'organization_id',
						value: 'GET_ROW_ID'
					},
					{
						key: 'project_id',
						value: formInstance.activeId
					}
				],

				left_label: 'Available organizations',
				right_label: 'Binded organizations',
				search_label: 'Search for organizations',

				back_button: false
			});
		},


	    getParentalLocations: function(cb){

		    var o = {
			    command: 'getParentLocations',
			    object: 'project',
			    params: {
				    id: formInstance.activeId
			    }
		    };

		    socketQuery(o, function (res) {

			    if (res.code != 0) {
				    toastr[res.toastr.type](res.toastr.message);
				    return;
			    }

			    projectEditor.parent_location = res.location;

			    if (typeof cb == 'function') {
				    cb();
			    }

		    });
	    },

	    populateParentalLocations: function() {
		    var tpl = '{{#locations}}<div class="parental-location" data-id="{{id}}">{{location}}</div>{{/locations}}';
		    var mo = {
			    locations: projectEditor.parent_location
		    };

		    formWrapper.find('.form-parental-locations-holder').html(Mustache.to_html(tpl, mo));

	    },


        getParentalPlotsOLD: function(cb){
            console.error('getParentalPlots is deprecated');
            if (typeof cb == 'function') {
                cb();
            }
            return;
            var o = {
                command: 'getParentPlots',
                object: 'project',
                params: {
                    id: formInstance.activeId
                }
            };

            socketQuery(o, function (res) {

                if (res.code != 0) {
                    toastr[res.toastr.type](res.toastr.message);
                    return;
                }

                projectEditor.parent_plot = res.plot;

                if (typeof cb == 'function') {
                    cb();
                }

            });
        },

        getParentalATaxon: function(cb){

            var o = {
                command: 'getParentTaxon',
                object: 'project',
                params: {
                    id: formInstance.activeId
                }
            };

            socketQuery(o, function (res) {

                if (res.code != 0) {
                    toastr[res.toastr.type](res.toastr.message);
                    return;
                }

                projectEditor.parentATaxon = res.project_available_taxon;

                if (typeof cb == 'function') {
                    cb();
                }

            });
        },

        populateParentalATaxon: function(){
            var tpl = '{{#pataxon}}<div class="pataxon" data-id="{{id}}">{{taxon}}</div>{{/pataxon}}';
            var mo = {
                pataxon: projectEditor.parentATaxon
            };

            formWrapper.find('.parental-available-taxon-holder').html(Mustache.to_html(tpl,mo));
        },

	    getParentalMembers: function(cb){
		    var o = {
			    command: 'getParentMembers',
			    object: 'project',
			    params: {
				    id: formInstance.activeId
			    }
		    };

		    socketQuery(o, function (res) {
			    if (res.code != 0) {
				    toastr[res.toastr.type](res.toastr.message);
				    return;
			    }

                projectEditor.parentMembers = res.member;

			    if (typeof cb == 'function') {
				    cb();
			    }
		    });
	    },

	    populateParentalMembers: function(){
		    var tpl = '{{#pataxon}}<div class="pataxon" data-id="{{id}}">{{firstname}} {{lastname}} ({{operations_str}})</div>{{/pataxon}}';
		    var mo = {
			    pataxon: projectEditor.parentMembers
		    };

		    formWrapper.find('.parental-members-holder').html(Mustache.to_html(tpl,mo));
	    },

	    getMembers: function(cb){
		    var o = {
			    command: 'getMembers',
			    object: 'project',
			    params: {
				    id: formInstance.activeId
			    }
		    };

		    socketQuery(o, function (res) {
			    if (res.code != 0) {
				    toastr[res.toastr.type](res.toastr.message);
				    return;
			    }

			    projectEditor.members = res.member;

			    if (typeof cb == 'function') {
				    cb();
			    }
		    });
	    },

	    populateMembers: function(){
		    var tpl = '{{#pataxon}}<div class="pataxon" data-id="{{id}}">{{firstname}} {{lastname}} ({{operations_str}})</div>{{/pataxon}}';
		    var mo = {
			    pataxon: projectEditor.members
		    };

		    formWrapper.find('.project-members-holder').html(Mustache.to_html(tpl,mo));
	    },

        getPlotsTree: function(cb){
            var o = {
                command: 'getTree_v2',
                object: 'plot',
                params: {
                    project_id: formInstance.activeId
                }
            };

            socketQuery(o, function (res) {
                if (res.code !== 0) {
                    toastr[res.toastr.type](res.toastr.message);
                    return;
                }

                projectEditor.plots_tree = res.tree;

                if (typeof cb == 'function')
	                cb();
            });
        },

        populatePlotsTree: function () {
	        let holder = formWrapper.find('.plots-tree-holder');
	        if (!projectEditor.plots_tree.core.data) return;
	        holder
		        .html('')
		        .jstree('destroy')
		        .jstree({
			        'core': {
				        'multiple': false,
				        "plugins": ["contextmenu"],
				        'data': function (node, cb) {
					        if (node.id === "#") {
						        cb(projectEditor.plots_tree.core.data);
					        } else {
						        var o = {
							        command: 'getTreeChilds',
							        object: 'plot',
							        params: {
								        id: node.id,
								        project_id: formInstance.activeId
							        }
						        };

						        socketQuery(o, function (res) {
							        if (!res.code == 0) {
								        toastr[res.toastr.type](res.toastr.message);
								        return false;
							        }

							        cb(res.tree.core.data);
						        });
					        }
				        }
			        }
		        });

	        holder.on('open_node.jstree', function (e, a) {
		        console.log('here', a);
	        });

	        holder.on('select_node.jstree', function (e, a) {
		        console.log('Here reload');

		        var id = a.node.id;

		        // This plot is from this project
		        if (a.node.original.item.project_id == formInstance.activeId) {
			        projectEditor.selectPlot(id);
			        formWrapper.find('.plot-data-holder').html('');
		        } else {
			        projectEditor.selectPlot(id);
			        formWrapper.find('.plot-data-holder').html('This plot is from parental project - ' + a.node.original.item.project_name + '(' + a.node.original.item.project_id + ').');
		        }
	        });
        },

	    selectPlot: (plot_id) => {
		    formWrapper.find('.plot-data-holder').html('');
		    formWrapper.find('.plot_controls .add-factor').show();
		    formWrapper.find('.plot_controls .copy_node').show();
		    formWrapper.find('.plot_controls .add_child_node').show();
		    formWrapper.find('.save-plot').show();

		    projectEditor.getPlot(plot_id, function () {
		    	if (projectEditor.current_plot.project_id === id)
				    formWrapper.find('.plot_controls .remove_node').show();
		    	else
				    formWrapper.find('.plot_controls .remove_node').hide();

			    projectEditor.populateCurrentPlot();
		    });
	    },

	    unselectPlot: () => {
		    projectEditor.current_plot = null;
		    projectEditor.factor_changes = [];
		    projectEditor.plot_changes = [];
		    formWrapper.find('.plot_controls .remove_node').hide();
		    formWrapper.find('.plot_controls .add_child_node').hide();
		    formWrapper.find('.plot_controls .copy_node').hide();
			formWrapper.find('.save-plot').hide();
			formWrapper.find('.plot-data-holder').html('');
		    formWrapper.find('.current-plot-holder').html('<div class="plots-placeholder">Please, select a plot from plots tree.</div>');
		    formWrapper.find('.plot-factors-holder').html('');
	    },

	    refreshPlotsTree: () => {
		    projectEditor.getPlotsTree(function(){
			    projectEditor.populatePlotsTree();
			    projectEditor.unselectPlot();
		    });
	    },

        getPlot: function(id, cb){

            var o = {
                command: 'get',
                object: 'plot',
                params: {
                    param_where:{
                        id: id
                    }
                }
            };

            socketQuery(o, function(res){
                if (res.code != 0) {
                    toastr[res.toastr.type](res.toastr.message);
                    return;
                }

                projectEditor.current_plot = res.data[0];

                if(typeof cb == 'function'){
                    cb();
                }
            });

        },

	    populateCurrentPlot: function(){
		    getFieldsForRendering('plot',
			    ['name', 'parent_name', 'location', 'habitat',
				    'longitude', 'latitude', 'altitude', 'notes'], (obj) => {
				const currentPlotSelector = formWrapper.find('.current-plot-holder');
			    currentPlotSelector.html(obj.html);

			    initFields2(formWrapper.find('.current-plot-holder'), projectEditor.current_plot, projectEditor);

				const plotSelect = currentPlotSelector.find('.fn-field[data-column="parent_name"] > select');

				plotSelect.select2('destroy');
				initCustomSelect({
					selector: plotSelect,
					class_name: 'plot',
					class_method: 'getParentProjectPlots',
					placeholder: 'Select plot...',
					dependant_field: {
						name: 'project_id',
						value: formInstance.activeId
					}
				}).off('select2:select').on('select2:select', function (e) {
					var data = e.params.data;

					projectEditor.addChange({
						object: projectEditor.current_plot,
						column_name: 'parent_id',
						type: 'select2withEmptyValue',
						value: {
							value: data.id,
							selValue: ''
						}
					});
				});


			    if (projectEditor.current_plot.inherited_fields)
				    projectEditor.current_plot.inherited_fields.forEach(field => {
					    currentPlotSelector.find(`.fn-field[data-column=${field.name}]`)
						    .addClass('inherited_value')
						    .append(`
								<div class="is-parent-fader">
				                    <div class="fader-text">Inherited: ${field.source}</div>
			                    </div>
							`);
				    });

			    const isParental = formInstance.activeId === projectEditor.current_plot.project_id;

			    if (!isParental)
			    	projectEditor.disableFields(currentPlotSelector);
		    });


		    // formWrapper.find('.current-plot-holder').html(tpl);

		    // for(var i=0; i < formWrapper.find('.current-plot-holder select').length; i++){
		    //     var elem = formWrapper.find('.current-plot-holder select').eq(i);
		    //     var get = elem.attr('data-get');
		    //
		    //     elem.select2({
		    //         ajax: {
		    //             dataType: 'json',
		    //             delay: 250,
		    //             transport: function (params, success, failure) {
		    //                 // console.error('transport params', params);
		    //
		    //                 var _t = this;
		    //                 console.log(_t);
		    //
		    //                 let o = {
		    //                     command: 'get',
		    //                     object: get,
		    //                     params: {
		    //                         // input: 1,
		    //                         // taxon_id: 1,
		    //                         // limit: 1,
		    //                         // page_no: 1
		    //                     }
		    //                 };
		    //
		    //                 socketQuery(o, res => {
		    //                     if (res) {
		    //                         let data = [];
		    //
		    //                         res.forEach(row => {
		    //                             data.push({
		    //                                 id: row.id,
		    //                                 text: row.name
		    //                             })
		    //                         });
		    //
		    //                         success({
		    //                             items: data,
		    //                             size: data.length
		    //                         });
		    //                     } else {
		    //                         failure('failed');
		    //                     }
		    //                 });
		    //             },
		    //             processResults: function (data, params) {
		    //                 // console.log('processResults', data, params);
		    //
		    //                 params.page = params.page || 1;
		    //
		    //                 return {
		    //                     results: data.items,
		    //                     pagination: {
		    //                         more: data.size === limit
		    //                     }
		    //                 };
		    //             },
		    //         }
		    //
		    //     });
		    // }
	    },

		disableFields: function(wrapper) {
        	if (!wrapper) return;

        	wrapper.find('select.fn-control').prop('disabled', true);
			wrapper.find('input.fn-control').prop('disabled', true);

			const mceId = wrapper.find('.wysiwyg-wrapper').attr('id');
			if (mceId) tinyMCE.get(mceId).setMode('readonly');
		},

	    populateCurrentSEvent: function(event){


		    getFieldsForRendering('sampling_event',
			    ['name', 'parent_name', 'location', 'habitat', 'storage',
                    'longitude', 'latitude', 'altitude', 'datetime_start', 'datetime_end',
                    'samples_size', 'meas_unit', 'plot', 'description'], (obj) => {

			    // select_return_name = obj.select_return_name;
			    // select_class = obj.select_class;
			    // fields_html = obj.html;

			    formWrapper.find('.current_event_wrapper').html(obj.html);

			    let parent_projects_ids = [];

                let parent_projects = {
                    command: 'getParentProjectsList',
                    object: 'project',
                    params: {
                        id: formInstance.activeId
                    }
                }

                socketQuery(parent_projects, function(res) {
	                if (!res.code) {
		                parent_projects_ids = res.parent_ids;


		                //Добавим id текущего проекта к массиву id родителей.
		                parent_projects_ids.push(formInstance.activeId);


		                se.parent_ids_key = 'project_id';
		                se.parent_ids_type = 'in';
		                se.parent_ids_value = parent_projects_ids;
	                }

	                initFields2(formWrapper.find('.current_event_wrapper'), event, se, ['storage', 'plot']);

	                if (event.inherited_fields)
		                event.inherited_fields.forEach(field => {
			                formWrapper.find('.current_event_wrapper').find(`.fn-field[data-column=${field.name}]`)
				                .addClass('inherited_value')
				                .append(`<div class="is-parent-fader">
					                        <div class="fader-text">Inherited: ${field.source}</div>
				                        </div>`);
		                });
                })
		    });

		    // formWrapper.find('.current-plot-holder').html(tpl);

		    // for(var i=0; i < formWrapper.find('.current-plot-holder select').length; i++){
		    //     var elem = formWrapper.find('.current-plot-holder select').eq(i);
		    //     var get = elem.attr('data-get');
		    //
		    //     elem.select2({
		    //         ajax: {
		    //             dataType: 'json',
		    //             delay: 250,
		    //             transport: function (params, success, failure) {
		    //                 // console.error('transport params', params);
		    //
		    //                 var _t = this;
		    //                 console.log(_t);
		    //
		    //                 let o = {
		    //                     command: 'get',
		    //                     object: get,
		    //                     params: {
		    //                         // input: 1,
		    //                         // taxon_id: 1,
		    //                         // limit: 1,
		    //                         // page_no: 1
		    //                     }
		    //                 };
		    //
		    //                 socketQuery(o, res => {
		    //                     if (res) {
		    //                         let data = [];
		    //
		    //                         res.forEach(row => {
		    //                             data.push({
		    //                                 id: row.id,
		    //                                 text: row.name
		    //                             })
		    //                         });
		    //
		    //                         success({
		    //                             items: data,
		    //                             size: data.length
		    //                         });
		    //                     } else {
		    //                         failure('failed');
		    //                     }
		    //                 });
		    //             },
		    //             processResults: function (data, params) {
		    //                 // console.log('processResults', data, params);
		    //
		    //                 params.page = params.page || 1;
		    //
		    //                 return {
		    //                     results: data.items,
		    //                     pagination: {
		    //                         more: data.size === limit
		    //                     }
		    //                 };
		    //             },
		    //         }
		    //
		    //     });
		    // }
	    },

        getPlots: function(cb){

            var o = {
                command: 'getAllPlots',
                object: 'project',
                params: {
                    id: formInstance.activeId
                }
            };

            socketQuery(o, function (res) {

                if (res.code != 0) {
                    toastr[res.toastr.type](res.toastr.message);
                    return;
                }

                projectEditor.plot = res.plot;
                projectEditor.parent_plot = res.parent_plot;

                if (typeof cb == 'function') {
                    cb();
                }

            });
        },

		getParentalPlots: function(cb) {
			var o = {
				command: 'getParentPlots',
				object: 'project',
				params: {
					id: formInstance.activeId
				}
			};

			socketQuery(o, function (res) {

				if (res.code != 0) {
					toastr[res.toastr.type](res.toastr.message);
					return;
				}

				projectEditor.parentalPlots = res.plot;

				if (typeof cb == 'function') {
					cb();
				}
			});
		},

        getFactors: function (plot_id, cb) {
            var o = {
                command: 'getAllFactors',
                object: 'Plot',
                params: {
                    // project_id: formInstance.activeId,
                    // plot_id: +plot_id
                    id: +plot_id
                }
            };

            socketQuery(o, function (res) {
                if(res.code !== 0) {
	                toastr[res.toastr.type](res.toastr.message);
	                return;
                }

                projectEditor.plot_factors = res.plot_factors;

                if(typeof cb == 'function') cb();
            });
        },

        populateFactors: function () {
            var tpl = '<div class="tep-list-holder with_title">' +
                '<div class="tep-title_wrapper"><div class="tep-title">{{category}}</div></div>' +
                '{{#params}}<div class="tep-item-holder" data-isparent="{{isParent}}" data-id="{{id}}" data-plot_factor_id="{{plot_factor_id}}" data-type="{{plot_factor_type_sysname}}">' +
                '{{#isParent}}<div class="is-parent-fader"><div class="fader-text">Inherited: {{plot_name}} ({{plot_id}})</div></div>{{/isParent}}' +
                '<label>{{name}}</label>' +
                '<div class="tep-tod-holder" data-type="{{plot_factor_type_sysname}}" data-value1="{{value1}}" data-value2="{{value2}}" data-sign="{{meas_unit_sign}}"></div>' +
                '{{#isSetted}}<div class="tep-remove" data-id="{{id}}"><i class="fa fa-trash-o"></i></div>{{/isSetted}}' +
                '<div class="tep-genders tep_edit_bttn" data-id="{{id}}"><i class="fa fa-pencil"></i></div>' +
                // '<div class="tep-description" data-id="{{id}}"><i class="fa fa-question-circle-o"></i></div>' +
                // '<div class="tep-litdata" data-is-taxon="false" data-id="{{id}}"><i class="fa fa-font"></i></div>' +
                '</div>{{/params}}' +
                '</div>';


            var mo = {
                params: []
            };

            let plot_factors = projectEditor.plot_factors;

            for(var k in plot_factors){
                mo.params.push(plot_factors[k]);
            }

            if (projectEditor.plot_factors && Object.keys(projectEditor.plot_factors).length > 0) {
                formWrapper.find('.plot-factors-holder').html(Mustache.to_html(tpl, mo));
            } else {
                formWrapper.find('.plot-factors-holder').html('');
            }

            for (var i = 0; i < formWrapper.find('.plot-factors-holder .tep-tod-holder').length; i++) {
                var ep = formWrapper.find('.plot-factors-holder .tep-tod-holder').eq(i);
                var epitem = ep.parents('.tep-item-holder');
                var sign = ep.attr('data-sign');
                var type = ep.attr('data-type');
                var fld;
                var insert = ep;
                var tod_id = type;

                var trait = getFactorById(epitem.attr('data-id'));
                var sub_table_name_for_select = trait.sub_table_name_for_select;

                var value1 = ep.attr('data-value1');
                var value2 = ep.attr('data-value2');

                switch (type) {
                    case 'SHORT_TEXT':
                        fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><input type="text" class="ap-value ap-field-editor" value="' + value1 + '"/></div>';
                        insert.html(fld);
                        break;
                    case 'INTEGER':
                        fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><input type="number" class="ap-value ap-field-editor" value="' + value1 + '"/><div class="sign_in_input">' + sign + '</div></div>';
                        insert.html(fld);
                        break;
                    case 'INTEGERRANGE':
                        fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><input type="number" class="ap-value ap-value-1 ap-field-editor ap-field-editor-1" value="' + value1 + '"/><input type="number" class="ap-value ap-value-2 ap-field-editor ap-field-editor-2" value="' + value2 + '"/></div>';
                        insert.html(fld);
                        break;
                    case 'FLOAT':
                        fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><input type="number" step="0.1" class="ap-value ap-field-editor" value="' + value1 + '"/><div class="sign_in_input">' + sign + '</div></div>';
                        insert.html(fld);
                        break;
                    case 'FLOATRANGE':
                        fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><input type="number" step="0.1" class="ap-value ap-value-1 ap-field-editor ap-field-editor-1" value="' + value1 + '"/><input type="number" step="0.1" class="ap-value ap-value-2 ap-field-editor ap-field-editor-2" value="' + value2 + '"/></div>';
                        insert.html(fld);
                        break;
                    case 'DATE':
                        fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><input type="text" class="ap-field-date ap-field-editor"  value="' + value1 + '"/></div>';
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
                        fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><input type="text" class="ap-field-date ap-field-date-1 ap-field-editor ap-field-editor-1"  value="' + value1 + '"/><input type="text" class="ap-field-date ap-field-date-2 ap-field-editor ap-field-editor-2" value="' + value2 + '"></div>';
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
                        fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><div class="ap-field-editor ap-field-image">' + value1 + '</div></div>';
                        insert.html(fld);
                        break;
                    case 'FILE':
                        fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><div class="ap-field-editor ap-field-file">' + value1 + '</div></div>';
                        insert.html(fld);
                        break;
                    case 'SELECT':
                        fld = `<div class="ep-tod-holder" data-id="${tod_id}" data-type="select" data-get="${sub_table_name_for_select}">
									<select class="select2-item" data-get="${sub_table_name_for_select}">
										<option value="${value2}" selected>${value1}</option>
									</select>
								</div>`;
                        insert.html(fld);
                        break;
                    case 'MULTISELECT':
                        fld = '<div class="ep-tod-holder" data-id="' + tod_id + '" data-type="multiselect">' +
                            '<div class="ap-lov-item-add"><i class="fa fa-plus"></i>&nbsp;&nbsp;Add list item</div>' +
                            '<div class="ap-lov-insert"></div>' +
                            '</div>';

                        insert.html(fld);

                        var sel_insert = insert.find('.ap-lov-insert');

                        insert.find('.ap-lov-item-add').off('click').on('click', function () {

                            sel_insert.append('<div class="ap-lov-item-holder" data-type="multiselect"><input type="text" class="ap-lov-item-fld" /><div class="ap-lov-item-set-as-selected">Set as selected</div><div class="ap-lov-remove-item"><i class="fa fa-times"></i>&nbsp;&nbsp;Remove item</div></div>');

                            sel_insert.find('.ap-lov-item-set-as-selected').off('click').on('click', function () {

                                var tp = $(this).parents('.ap-lov-item-holder');
                                tp.toggleClass('selected');

                                if (tp.hasClass('selected')) {
                                    $(this).html('Deselect');
                                } else {
                                    $(this).html('Set as selected');
                                }


                            });

                            sel_insert.find('.ap-lov-remove-item').off('click').on('click', function () {

                                var tp = $(this).parents('.ap-lov-item-holder');
                                tp.remove();

                            });

                        });

                        break;
                    case 'TEXT':
                        fld = '<div class="ep-tod-holder" data-id="' + tod_id + '"><textarea class="ap-field-editor ap-field-textarea">' + value1 + '</textarea></div>';
                        insert.html(fld);
                        break;
                    default :
                        break;
                }
            }

            formWrapper.find('.ep-tod-holder .select2-item').each((i, e) => {
            	let limit = 100;
            	let select_class = $(e).attr('data-get');
            	let select_return_name = 'name';

            	$(e).select2({
		            // data: [{
			         //    id: object[select_data_keyword],
			         //    text: object[column_name],
			         //    selected: true
		            // }],
		            allowClear: true,
		            placeholder: 'Select value...',
		            ajax: {
			            dataType: 'json',
			            delay: 250,
			            transport: function (params, success, failure) {
				            // console.error('transport params', params);

				            let o = {
					            command: 'get',
					            object: select_class,
					            params: {
						            limit: limit,
						            page_no: params.data.page || 1,
						            collapseData: false
					            }
				            };

				            if (params.data.term) {
					            params.where.push({
						            key: select_return_name,
						            type: 'like',
						            val1: params.data.term
					            })
				            }

				            socketQuery(o, res => {
					            if (res) {
						            let data = [];

						            res.forEach(row => {
							            data.push({
								            id: row.id,
								            text: row[select_return_name]
							            })
						            });

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
            });

            projectEditor.setHandlers();
        },

        setChange: function (change) {
            //change = {
            //    id: 123,
            //    value1: 1,
            //    value2: 2
            //};

            var wasChange = false;
            var found = false;

            for(var i in projectEditor.factor_changes){
                var ch = projectEditor.factor_changes[i];

                //if(projectEditor.getTraitById(change.id).value1 == change.value1 && projectEditor.getTraitById(change.id).value2 == change.value2){
                //
                //    for(var l in projectEditor.factor_changes){
                //        var chl = projectEditor.factor_changes[l];
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

                projectEditor.factor_changes.push(change);
                wasChange = true;

            }


            projectEditor.setHighlight(wasChange);
        },

	    //Plot's changes
	    addChange: function (change) {
		    let wasChange = false;
		    let found = false;

		    for (let i in projectEditor.plot_changes) {
			    let ch = projectEditor.plot_changes[i];

			    if (ch.column_name == change.column_name) {
				    if (ch.value.value != change.value.value) {
					    ch.value.value = change.value.value;
					    wasChange = true;
				    }
				    found = true;
			    }
		    }

		    if (!found) {
			    projectEditor.plot_changes.push(change);
			    wasChange = true;
		    }

		    projectEditor.setHighlight(wasChange, '.save-plot');
	    },

	    editFactor: (id) => {
		    if (isNaN(+id)) return;

		    let plot_factor_id;
		    for (let factor of projectEditor.plot_factors) {
			    if (factor.id === +id) {
				    plot_factor_id = factor.plot_factor_id;
				    break;
			    }
		    }


		    let o = {
			    command: 'get',
			    object: 'plot_factor',
			    params: {
				    param_where: {
					    id: plot_factor_id
				    },
				    collapseData: false
			    }
		    };

		    socketQuery(o, (res) => {
			    if (!(res && res.length)) return;

			    let curr_factor = res[0];

			    function getValues(sub_table_name_for_select, cb) {
				    let o = {
					    command: 'get',
					    object: sub_table_name_for_select,
					    params: {}
				    };

				    socketQuery(o, function (res) {
					    if (res.code != 0) {
						    toastr[res.toastr.type](res.toastr.message);
						    cb(false);
					    }

					    cb(res.data);
				    });
			    }

			    function setSelectValuesHandlers(plot_factor, dialog) {
				    $(dialog).find('.trait-select-value-remove').off('click').on('click', function () {
					    let p = $(this).parents('.trait-select-value-add-item');
					    let id = p.attr('data-id');

					    console.error('remove', id);

					    if (!isNaN(+id)) {
						    bootbox.confirm('Please, confirm operation.', function (res) {
							    if (res) {
								    let o = {
									    command: 'remove',
									    object: plot_factor.sub_table_name_for_select,
									    params: {
										    id: id,
										    needConfirm: true
									    }
								    };

								    // toastr['warning']('This function is only allowed to administrator.');
								    // return false;

								    socketQuery(o, function (res) {

									    if (res.code != 0) {
										    toastr[res.toastr.type](res.toastr.message);
										    return false;
									    }

									    toastr['success']('Value removed');

									    p.remove();

								    });
							    } else {
								    toastr['warning']('Operation cancelled');
							    }
						    });
					    } else {
						    p.remove();
					    }
				    });

				    $(dialog).find('.add-trait-value').off('click').on('click', function () {
					    let holder = $(dialog).find('.trait-select-value-add-holder-content');

					    holder.append(`<div class="trait-select-value-add-item new-trait-value" data-id="NEW">
							                                    <label>Value:</label>
							                                    <input type="text" class="trait-select-value-add form-control" data-id="{{id}}" />
							                                    <label>Definition:</label>
							                                    <textarea class="trait-select-value-description"></textarea>
							                                    <span class="trait-select-value-remove  fa fa-trash-o"></span>
							                                </div>`);

					    setSelectValuesHandlers(plot_factor, dialog);
				    });

				    $(dialog).find('.trait-select-value-add, .trait-select-value-description').off('change').on('change', function () {
					    let p = $(this).parents('.trait-select-value-add-item');
					    let id = p.attr('data-id');
					    let val = p.find('.trait-select-value-add').val();
					    let desc = p.find('.trait-select-value-description').val();

					    console.error('change', id);

					    if (id == 'NEW') {
						    let o = {
							    command: 'add',
							    object: plot_factor.sub_table_name_for_select,
							    params: {
								    name: val,
								    definition: desc,
								    plot_factor_id: plot_factor_id
							    }
						    };

						    socketQuery(o, function (res) {

							    if (res.code != 0) {
								    toastr[res.toastr.type](res.toastr.message);
								    return false;
							    }

							    toastr['success']('New values added');

							    p.attr('data-id', res.id);

						    });
					    } else {
						    let o = {
							    command: 'modify',
							    object: plot_factor.sub_table_name_for_select,
							    params: {
								    id: id,
								    name: val,
								    definition: desc
							    }
						    };

						    socketQuery(o, function (res) {

							    if (res.code != 0) {
								    toastr[res.toastr.type](res.toastr.message);
								    return false;
							    }

							    toastr['success']('Value modified');

						    });
					    }

				    });
			    }

			    function toggleFields(dialog, plot_factor) {
				    let type = ['INTEGER', 'FLOAT'].indexOf(plot_factor.plot_factor_type_sysname) > -1 ? 'NUMBER' : plot_factor.plot_factor_type_sysname;

				    if (type === 'NUMBER') {
					    $(dialog).find('.fn-field[data-column="meas_unit"]').show();
					    $(dialog).find('.fn-field[data-column="min_value"]').show();
					    $(dialog).find('.fn-field[data-column="max_value"]').show();

					    $(dialog).find('.select_values_holder').hide();
				    } else {
					    $(dialog).find('.fn-field[data-column="meas_unit"]').hide();
					    $(dialog).find('.fn-field[data-column="min_value"]').hide();
					    $(dialog).find('.fn-field[data-column="max_value"]').hide();

					    if (type === 'SELECT') {
						    $(dialog).find('.select_values_holder').show();

						    getValues(plot_factor.sub_table_name_for_select, (values) => {
							    let tpl = '{{#vals}}<div class="trait-select-value-add-item row" data-id="{{id}}">' +
								    '<div class="col-md-4"><input type="text" class="trait-select-value-add form-control" value="{{name}}" data-id="{{id}}"/></div>' +
								    '<div class="col-md-8"><textarea class="trait-select-value-description">{{description}}</textarea></div>' +
								    '<span class="trait-select-value-remove fa fa-trash-o"></span>' +
								    '</div>{{/vals}}';

							    let mo = {
								    vals: []
							    };

							    for (let i in values) {
								    mo.vals.push({
									    id: values[i].id,
									    name: values[i].name,
									    description: values[i].definition
								    });
							    }

							    $(dialog).find('.fn-field[data-column="plot_factor_type"]').append(`
										<div class="select_values_holder">
											<div class="add-trait-value green_bttn_style"><i class="fa fa-plus"></i>&nbsp;&nbsp;Add value</div>
											<div class="trait-select-value-add-holder-content">${Mustache.to_html(tpl, mo)}</div>
										</div>`);

							    setSelectValuesHandlers(plot_factor, dialog);
						    });
					    } else {
						    $(dialog).find('.select_values_holder').hide();
					    }
				    }
			    }

			    new MB.Box({
				    id: curr_factor.id,
				    box_title: `Plot factor: ${curr_factor.name}`,
				    class_name: 'plot_factor',
				    with_delete: true,
				    fields: [
					    {
						    name: 'plot',
						    value: {
							    id: curr_factor.plot_id,
							    text: curr_factor.plot
						    }
					    },
					    {
						    name: 'name',
						    value: curr_factor.name
					    },
					    {
						    name: 'plot_factor_type',
						    value: {
							    id: curr_factor.plot_factor_type_id,
							    text: curr_factor.plot_factor_type
						    }
					    },
					    {
						    name: 'definition',
						    value: curr_factor.definition
					    },
					    // {
						 //    name: 'definition_de',
						 //    value: curr_factor.definition_de
					    // },
					    // {
						 //    name: 'definition_bahasa',
						 //    value: curr_factor.definition_bahasa
					    // },
					    {
						    name: 'meas_unit',
						    value: {
							    id: curr_factor.meas_unit_id,
							    text: curr_factor.meas_unit
						    }
					    },
					    {
						    name: 'min_value',
						    value: curr_factor.min_value
					    },
					    {
						    name: 'max_value',
						    value: curr_factor.max_value
					    }
				    ],
				    cb_final: (result, id) => {
					    if (result) {
						    projectEditor.getFactors(projectEditor.current_plot.id, function () {
							    projectEditor.populateFactors();
						    });
					    }
				    },
				    cb_box_inited: (dialog) => {
					    console.error(dialog);

					    toggleFields(dialog, curr_factor);
				    },
				    cb_deleted: () => {
					    projectEditor.getFactors(projectEditor.current_plotid, function () {
						    projectEditor.populateFactors();
					    });
				    }
			    });
		    });
	    },

        saveFactors: function (cb) {

	        for (var i in projectEditor.factor_changes) {
		        projectEditor.factor_changes[i].plot_id = projectEditor.current_plot.id;
	        }

	        var o = {
		        command: 'setValueByList',
		        object: 'plot_factor',
		        params: {
			        list: projectEditor.factor_changes
		        }
	        };

	        socketQuery(o, function (res) {

		        if (res.code === 0) projectEditor.factor_changes = [];

		        projectEditor.setHighlight(false);

		        if (typeof cb == 'function') {
			        cb();
		        }
	        });
        },

	    savePlotChanges: function (cb) {
		    let o = {
			    command: 'modify',
			    object: 'plot',
			    params: {}
		    };

		    projectEditor.plot_changes.forEach(change => {
				o.params[change.column_name] = change.value.value;
		    });

		    if (Object.keys(o.params).length != 0) {
				o.params.id = projectEditor.current_plot.id;

				socketQuery(o, function (res) {
					if (res.code === 0) projectEditor.plot_changes = [];

					projectEditor.setHighlight(false, '.save-plot');

					if (typeof cb == 'function') {
						cb();
					}

				});
			}
	    },

        setHighlight: function (state, selector) {
	        selector = selector || '.save-traits';

	        if (state) {
		        formWrapper.find(selector).addClass('enabled');
	        } else {
		        formWrapper.find(selector).removeClass('enabled');
	        }
        },

        setHandlers: function () {
        	formWrapper.off('click', '.import_data').on('click', '.import_data', () => {
		        let $dialog = bootbox.dialog({
			        title: 'Import from Excel',
			        message: '<div class="form-group"><label>What are you importing?</label><select></select></div>',
			        buttons: {
				        success: {
					        label: 'Import',
					        callback: function () {
						        let fl = new ImageLoader({
							        multiple: false,
							        success: function (file) {
								        new MB.CHTable.init(id, $dialog.find('select').val(), file, (res) => {
									        formInstance.reload();
								        });
							        }
						        });

						        fl.start({
							        params: {
								        max_size: 1048576 * 1,
								        formats: ['csv'],
								        not_public: true
							        }
						        });
					        }
				        },
				        error: {
					        label: 'Cancel',
					        callback: function () {

					        }
				        }
			        }
		        }).on('shown.bs.modal', () => {
			        $dialog.removeAttr("tabindex");
			        $dialog.find('select').select2({
				        data: [
					        {
						        id: 'data_individual',
						        text: 'Organisms'
					        },
					        {
						        id: 'sampling_event',
						        text: 'Sampling events'
					        },
					        {
						        id: 'storage',
						        text: 'Storages'
					        },
					        {
						        id: 'plot',
						        text: 'Plots'
					        }
				        ]
			        });
		        });
        	});

	        formWrapper.find('.import_organims').off('click').on('click', function () {
		        bootbox.dialog({
			        title: 'Import from Excel',
			        // message: '<div class="form-group"><label>Taxon ID:</label><input type="number" class="form-control" id="taxon-id-for-import"/></div>',
			        // message: 'Необходимо будет выбрать файл соответствующего формата. Нажмите "Select file and start" для начала процесса',
			        message: 'You will need to select a file of the appropriate format. Click "Select file and start" to start the process.',
			        buttons: {
				        success: {
					        label: 'Select file and start',
					        callback: function () {
						        var fl = new ImageLoader({
							        multiple: false,
							        success: function (file) {
								        console.log(file);
								        var o = {
									        command: 'importFromExcel',
									        object: 'Project',
									        params: {
										        project_id: id,
										        filename: file.dirname + '/' + file.name
									        }
								        };
								        var timeOut = toastr.options.timeOut;
								        var extendedTimeOut = toastr.options.extendedTimeOut;
								        toastr.options.timeOut = 1000000;
								        toastr.options.extendedTimeOut = 100;
								        var info = toastr.info('The import process is in progress...');
								        toastr.options.timeOut = timeOut;
								        toastr.options.extendedTimeOut = extendedTimeOut;
								        socketQuery(o, function (data) {
									        info.fadeOut(100);
									        if (!data) return;

									        let tpl = '';

									        if (data.errors && data.errors.length) {
										        tpl = `<b>The following problems occurred during the upload:</b>`;
										        tpl += `<ul>`;

										        data.errors.forEach(row => {
											        if ('i' in row) {
												        tpl += `<li>Cell ${row.j}${row.i}: ${row.message}</li>`;
											        } else {
												        tpl += `<li>${row.message}</li>`;
											        }
										        });

										        tpl += `</ul>`;
									        }

									        if (data.new_organisms && data.new_organisms.length) {
										        tpl += `<b>${data.new_organisms.length} new organisms were successfully added:</b>`;
										        tpl += `<ul>`;

										        data.new_organisms.forEach(row => {
											        tpl += `<li>${row}</li>`;
										        });

										        tpl += `</ul>`;
									        }

									        if (!tpl || !tpl.length) tpl = 'Something went wrong. Contact with administrator.';

									        bootbox.dialog({
										        title: 'Import from Excel',
										        message: tpl,
										        buttons: {
											        success: {
												        label: 'Confirm the upload',
												        callback: function () {

												        }
											        },
											        error: {
												        label: 'Rollback the upload',
												        callback: function () {
													        let o = {
														        command: 'get',
														        object: 'rollback_backup',
														        params: {
															        param_where: {
																        rollbackKey: data.rollback_key
															        },
															        collapseData: false
														        }
													        };

													        socketQuery(o, (res) => {
														        if (res && res.length === 1) {
															        bootbox.dialog({
																        title: 'Are you sure?',
																        message: 'Rollback changes?<br>',
																        buttons: {
																	        confirm: {
																		        label: 'Yes I confirm',
																		        callback: function () {
																			        let o = {
																				        command: 'rollback',
																				        object: 'rollback_backup',
																				        params: {
																					        id: res[0].id,
																					        confirm: true
																				        }
																			        };

																			        socketQuery(o, function (res) {
																				        console.log(res);
																			        });
																		        }
																	        },
																	        cancel: {
																		        label: 'Cancel',
																		        callback: function () {

																		        }
																	        }
																        }
															        });
														        } else {
															        toastr['error']('Saving not found or found more than one. Report this error to the administrator.');
														        }
													        });
												        }
											        }
										        }
									        });
								        });
							        }
						        });

						        fl.start({
							        params: {
								        max_size: 1048576 * 1,
								        formats: ['xls', 'xlsx'],
								        not_public: true
							        }
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

	        $(document).off('click', '.plots-placeholder').on('click', '.plots-placeholder', function () {

		        let id;

		        if (projectEditor.plots_tree && projectEditor.plots_tree.core.data) {
			        for (let row of projectEditor.plots_tree.core.data) {
				        if (row.item.project_id === formInstance.activeId) {
					        id = row.id;
					        break;
				        } else {
					        for (let row2 of row.children) {
						        if (row2.item.project_id === formInstance.activeId) {
							        id = row2.id;
							        break;
						        }
					        }
				        }
			        }
		        }

		        console.log(projectEditor.plots_tree.core.data, id);

		        if (id) {
			        projectEditor.selectPlot(id);
			        formWrapper.find('.plots-tree-holder').jstree("deselect_all").jstree('select_node', id);
		        }

	        });

	        // formWrapper.find('.add_sampling_event').off('click').on('click', (e) => {
		     //    new MB.Box({
			 //        box_title: 'New sampling event',
			 //        class_name: 'sampling_event',
			 //        fields: [
				//         {
				// 	        name: 'project_name',
				// 	        value: {
				// 		        id: id,
				// 		        text: formInstance.data.data[0].name
				// 	        }
				//         },
				//         {
				// 	        name: 'name'
				//         },
				//         {
				// 	        name: 'datetime'
				//         },
				//         {
				// 	        name: 'datetime_start'
				//         },
				//         {
				// 	        name: 'datetime_end'
				//         },
				//         {
				// 	        name: 'description'
				//         }
			 //        ],
			 //        cb_final: (result) => {
				//         if (result) se.getEvents(function () {
				// 	        se.populateEvents();
				//         });
			 //        }
		     //    });
	        // });

	        formWrapper.find('.add_sampling_event').off('click').on('click', function () {

		        projectEditor.getPlots(function () {

			        var tpl = `
                        <div class="form-group">
                            <label>Name:</label>
                            <input class="form-control" type="text" id="event-name" />
                        </div>
                        <div class="form-group">
                            <label>Method description:</label>
                            <textarea class="event-desc" id="event-desc" ></textarea>
                        </div class="form-group">
                        <div class="form-group">
                            <label>Event date start</label>
                            <input type="text" class="form-control" id="event-datetime-start" />
                        </div>
                        <div class="form-group">
                            <label>Event date end</label>
                            <input type="text" class="form-control" id="event-datetime-end" />
                        </div>
                        <div class="form-group">
                            <label>Default storage</label>
                            <select id="storage"></select>
                        </div>
                        <div>
                            <h1 class="plots-title">Samples:</h1>
                            <div class="plots-title">Parent plots:</div>
                            {{#parent_plots}}
                            <div class="plot p-plot" data-id="{{id}}">
                                <div class="plot-name">{{name}}</div>
                                <div class="plot-count">
                                    <input type="number" value="0"/>
                                </div>
                            </div>
                            {{/parent_plots}}
                        </div>
                        <div>
                            <div class="plots-title">Plots:</div>
                            {{#plots}}
                            <div class="plot p-plot" data-id="{{id}}">
                                <div class="plot-name">{{name}}</div>
                                <div class="plot-count">
                                    <input type="number" value="0"/>
                                </div>
                            </div>
                            {{/plots}}
                        </div>
			        `;


			        var mo = {
				        plots: projectEditor.plot,
				        parent_plots: projectEditor.parent_plot
			        };

			        let $dialog = bootbox.dialog({
				        title: 'Create sampling event',
				        message: Mustache.to_html(tpl, mo),
				        buttons: {
					        success: {
						        label: 'Create',
						        callback: function () {
							        var o = {
								        command: 'create',
								        object: 'Sampling_event',
								        params: {
									        project_id: formInstance.activeId,
									        datetime_start: $('#event-datetime-start').val(),
									        datetime_end: $('#event-datetime-end').val(),
									        name: $('#event-name').val(),
                                            description: $('#event-desc').val(),
                                            storage_id: +$('#storage').val(),
									        samples: {}
								        }
							        };

							        for (var i = 0; i < $('.plot').length; i++) {

								        var p = $('.plot').eq(i);

								        o.params.samples[p.attr('data-id')] = p.find('.plot-count input').val()

							        }

							        socketQuery(o, function (res) {

								        if (res.code != 0) {
									        toastr[res.toastr.type](res.toastr.message);
									        return;
								        }

								        se.init();

								        console.log('CERATE RES', res);
							        });
						        }
					        },
					        error: {
						        label: 'Cancel',
						        callback: function () {

						        }
					        }
				        }
			        }).on('shown.bs.modal', function () {
                        $dialog.find('#event-datetime-start').datepicker({
                            autoclose: true,
                            todayHighlight: true,
                            keyboardNavigation: false,
                            todayBtn: true,
                            firstDay: 1,
                            format: 'dd.mm.yyyy',
                            // startDate: '-infinity',
                            weekStart: 1,
                            language: "en"
                        });

                        $dialog.find('#event-datetime-end').datepicker({
                            autoclose: true,
                            todayHighlight: true,
                            keyboardNavigation: false,
                            todayBtn: true,
                            firstDay: 1,
                            format: 'dd.mm.yyyy',
                            // startDate: '-infinity',
                            weekStart: 1,
                            language: "en"
                        });

                        initCustomSelect({
                            selector: $dialog.find('#storage'),
                            class_name: 'storage',
                            placeholder: 'Select storage ...'
                        });

                        $('.bootbox.modal.fade.in').removeAttr('tabindex');

                    });
		        });

	        });

			formWrapper.find('.add-child-project').off('click').on('click', function () {

				bootbox.dialog({
					title: 'New project',
					message: '<div class="form-group"><label>Name:</label><input type="text" class="form-control" id="new-proj-name"></div>',
					buttons: {
						success: {
							label: 'Create',
							callback: function () {

								var o = {
									command: 'add',
									object: 'project',
									params: {
										parent_id: formInstance.activeId,
										name: $('#new-proj-name').val()
									}
								};

								socketQuery(o, function (res) {

									if (!res.code == 0) {
										toastr[res.toastr.type](res.toastr.message);
										return false;
									}

									var newid = res.id;

									var formId = MB.Core.guid();

									var form = new MB.FormN({
										id: formId,
										name: 'form_project',
										class: 'project',
										client_object: 'form_project',
										type: 'form',
										ids: [newid],
										position: 'center'
									});
									form.create(function () {

									});

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

			formWrapper.find('.add_new_organisms').off('click').on('click', function () {
				let tpl = `
					<div class="form-group">
						<label>Sampling event:</label><select name="event"></select>
					</div>
				`;

				function initSEventsSelect2($dialog) {
					let o = {
						command: 'getForSelect_byProjectId',
						object: 'sampling_event',
						params: {
							project_id: formInstance.activeId,
						}
					};

					socketQuery(o, function (res) {
						if (res.code !== 0) return;

						$dialog.find('select[name="event"]')
							.select2({
								data: res && res.events ? res.events.map(row => {
								    return {
								    	id: row.id,
										text: row.full_name
									}
								}) : []
							});
					});
				}

				let $dialog = bootbox.dialog({
					title: 'New organisms',
					message: tpl,
					buttons: {
						success: {
							label: 'Add organisms',
							callback: function () {
								let event_id = $('select[name="event"]').select2('data');
								event_id = event_id.length ? event_id[0].id : null;

								if (!event_id) {
									toastr['error']('Sampling event is required');
									return false;
								} else {
									let formId = MB.Core.guid();

									let form = new MB.FormN({
										id: formId,
										name: 'form_data_individual_new',
										class: 'sampling_event',
										client_object: 'form_data_individual_new',
										type: 'form',
										ids: [event_id],
										position: 'center',
										params: {
											project_id: id
										}
                                        // ,
                                        // additional_params: {
                                        //     parent_id: id
                                        // }

									});

                                    // child_tbls_parent_key: [{
                                    //     tbl_data_individual: id
                                    // }]

									form.create(function () {

									    // return

										const filterWhere = [
                                            {
                                                key: 'project_id',
                                                val1: id
                                            },
											{
												projects: [id],
												events: [event_id]
											}
										];
										const interval = setInterval(() => {
											const tbl = form.tblInstances.find(tbl => tbl.client_object === "tbl_data_individual");
											if (!tbl) return;

											console.error('filterWhere', filterWhere);
											tbl.ct_instance.filterWhere = filterWhere;
											tbl.reload();
											clearInterval(interval);
										}, 500)
									});
								}
							}
						},
						error: {
							label: 'Cancel',
							callback: function () {

							}
						}
					}

				}).on('shown.bs.modal', function () {
                    initSEventsSelect2($dialog);
				});
			});

			formWrapper.find('.import_organims').off('click').on('click', function () {
				bootbox.dialog({
					title: 'Import from Excel',
					// message: '<div class="form-group"><label>Taxon ID:</label><input type="number" class="form-control" id="taxon-id-for-import"/></div>',
					// message: 'Необходимо будет выбрать файл соответствующего формата. Нажмите "Select file and start" для начала процесса',
					message: 'You will need to select a file of the appropriate format. Click "Select file and start" to start the process.',
					buttons: {
						success: {
							label: 'Select file and start',
							callback: function () {
								var fl = new ImageLoader({
									multiple: false,
									success: function (file) {
										console.log(file);
										var o = {
											command: 'importFromExcel',
											object: 'Project',
											params: {
												project_id: id,
												filename: file.dirname + '/' + file.name
											}
										};
										var timeOut = toastr.options.timeOut;
										var extendedTimeOut = toastr.options.extendedTimeOut;
										toastr.options.timeOut = 1000000;
										toastr.options.extendedTimeOut = 100;
										var info = toastr.info('The import process is in progress...');
										toastr.options.timeOut = timeOut;
										toastr.options.extendedTimeOut = extendedTimeOut;
										socketQuery(o, function (data) {
											info.fadeOut(100);
											if (!data) return;

											let tpl = '';

											if (data.errors && data.errors.length) {
												tpl = `<b>The following problems occurred during the upload:</b>`;
												tpl += `<ul>`;

												data.errors.forEach(row => {
													if ('i' in row) {
														tpl += `<li>Cell ${row.j}${row.i}: ${row.message}</li>`;
													} else {
														tpl += `<li>${row.message}</li>`;
													}
												});

												tpl += `</ul>`;
											}

											if (data.new_organisms && data.new_organisms.length) {
												tpl += `<b>${data.new_organisms.length} new organisms were successfully added:</b>`;
												tpl += `<ul>`;

												data.new_organisms.forEach(row => {
													tpl += `<li>${row}</li>`;
												});

												tpl += `</ul>`;
											}

											if (!tpl || !tpl.length) tpl = 'Something went wrong. Contact with administrator.';

											bootbox.dialog({
												title: 'Import from Excel',
												message: tpl,
												buttons: {
													success: {
														label: 'Confirm the upload',
														callback: function () {

														}
													},
													error: {
														label: 'Rollback the upload',
														callback: function () {
															let o = {
																command: 'get',
																object: 'rollback_backup',
																params: {
																	param_where: {
																		rollbackKey: data.rollback_key
																	},
																	collapseData: false
																}
															};

															socketQuery(o, (res) => {
																if (res && res.length === 1) {
																	bootbox.dialog({
																		title: 'Are you sure?',
																		message: 'Rollback changes?<br>',
																		buttons: {
																			confirm: {
																				label: 'Yes I confirm',
																				callback: function () {
																					let o = {
																						command: 'rollback',
																						object: 'rollback_backup',
																						params: {
																							id: res[0].id,
																							confirm: true
																						}
																					};

																					socketQuery(o, function (res) {
																						console.log(res);
																					});
																				}
																			},
																			cancel: {
																				label: 'Cancel',
																				callback: function () {

																				}
																			}
																		}
																	});
																} else {
																	toastr['error']('Saving not found or found more than one. Report this error to the administrator.');
																}
															});
														}
													}
												}
											});
										});
									}
								});

								fl.start({
									params: {
										max_size: 1048576 * 1,
										formats: ['xls', 'xlsx'],
										not_public: true
									}
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

// 	        formWrapper.find('.add-factor').off('click').on('click', function () {
//
// 		        var tpl = '';
//
//
// 		        var formId = MB.Core.guid();
// 		        var save_trigger = MB.Core.guid();
//
// 		        var form = new MB.FormN({
// 			        id: formId,
// 			        name: 'form_factor',
// 			        class: 'plot_factor',
// 			        client_object: 'form_factor',
// 			        type: 'form',
// 			        ids: ['new'],
// 			        // dont_open_after_add: true,
// 			        after_save_trigger: save_trigger,
// 			        add_params: {
// 				        // project_id: formInstance.activeId,
// 				        plot_id: 1
// 			        },
// 			        position: 'center'
// 		        });
// 		        form.create(function () {
// 			        var modal = MB.Core.modalWindows.windows.getWindow(formId);
//
// 			        $(modal).on('close', function () {
// //					console.log('modal closing trigger');
// //                         _t.reload();
// 			        });
//
// 			        $(form).on('update', function () {
// //					console.log('form update trigger');
// //                         _t.reload();
// 			        });
//
// 		        });
//
// 		        $(document).on(save_trigger, function (e, a, b) {
//
// 			        console.log(e, a, b);
//
// 			        projectEditor.getFactors(a.id, function () {
//
// 				        console.log('FACTORS', projectEditor.plot_factors);
//
// 				        projectEditor.populateFactors();
// 			        });
//
// 		        });
//
//
// 	        });

	        var flds = formWrapper.find('.tep-item-holder');

	        flds.each(function (i, e) {

		        var type = $(e).attr('data-type');
		        //var id = $(e).attr('data-id');
		        var id = $(e).attr('data-plot_factor_id');
		        var editor = $(e).find('.ap-field-editor');

		        switch (type) {

			        case 'SHORT_TEXT':

				        editor.off('input').on('input', function () {

					        projectEditor.setChange({
						        id: id,
						        value1: editor.val(),
						        value2: ''
					        });

				        });

				        break;

			        case 'NUMBER':

				        editor.off('input').on('input', function () {

					        projectEditor.setChange({
						        id: id,
						        value1: editor.val(),
						        value2: ''
					        });
				        });

				        break;

			        case 'INTEGER':

				        editor.off('input').on('input', function () {

					        projectEditor.setChange({
						        id: id,
						        value1: editor.val(),
						        value2: ''
					        });
				        });

				        break;

			        case 'FLOAT':
				        editor.off('input').on('input', function () {
					        projectEditor.setChange({
						        id: id,
						        value1: editor.val(),
						        value2: ''
					        });
				        });

				        break;

			        case 'TEXT':
				        editor.off('input').on('input', function () {
					        projectEditor.setChange({
						        id: id,
						        value1: editor.val(),
						        value2: ''
					        });
				        });

				        break;

			        default :

				        break;

		        }

	        });

	        formWrapper.find('.ep-tod-holder .select2-item').off('select2:select').on('select2:select', function (e) {
		        console.log('SEL EEE', e);

		        var p = $(this).parents('.tep-item-holder').eq(0);
		        var id = p.attr('data-plot_factor_id');
		        var val = e.params.data.id;

		        projectEditor.setChange({
			        id: id,
			        value1: val,
			        value2: ''
		        });

	        });

	        // Plot buttons handlers
	        formWrapper.find('.plot_controls .remove_node').off('click').on('click', (e) => {
		        if (!projectEditor.current_plot) return;

		        bootbox.dialog({
			        title: `Deleting plot '${projectEditor.current_plot.name}'`,
			        message: `Are you sure?`,
			        className: 'wide-modal',
			        buttons: {
				        success: {
					        label: 'Delete',
					        callback: function () {
						        let o = {
							        command: 'remove',
							        object: 'plot',
							        params: {
								        id: projectEditor.current_plot.id
							        }
						        };

						        socketQuery(o, (res) => {
							        projectEditor.refreshPlotsTree();
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

	        formWrapper.find('.plot_controls .add_node').off('click').on('click', (e) => {

		        console.log('IDIDIDI', formInstance.activeId);

		        new MB.Box({
			        box_title: 'New plot',
			        class_name: 'plot',
			        fields: [
				        {
					        name: 'project_name',
					        value: {
						        id: formInstance.data.data[0].id,
						        text: formInstance.data.data[0].name
					        }
				        },
				        {
					        name: 'name'
				        },
				        {
					        name: 'parent_name'
				        },
				        {
					        name: 'longitude'
				        },
				        {
					        name: 'latitude'
				        },
				        {
					        name: 'location'
				        },
				        {
					        name: 'notes'
				        }
			        ],
			        cb_final: (result) => {
				        if (result)
					        projectEditor.refreshPlotsTree();
			        },
			        cb_box_inited: ($dialog) => {
				        const plotSelect = $dialog.find('.fn-field[data-column="parent_name"] > select');

				        plotSelect.select2('destroy');

				        initCustomSelect({
					        selector: plotSelect,
					        class_name: 'plot',
					        class_method: 'getParentProjectPlots',
					        placeholder: 'Select plot...',
					        dependant_field: {
						        name: 'project_id',
						        value: formInstance.activeId
					        }
				        });

				        let tpl = `
							<div data-type="text" class="fn-field" data-column="objects_to_create_n">
								<label>Number of created entities (from 1 to 99):</label>
								<input type="text" class="fn-control" data-column="objects_to_create_n">
							</div>						
						`;
				        $dialog.find('.adding_new_option').prepend(tpl);
			        }
		        });
	        });

	        formWrapper.find('.plot_controls .copy_node').off('click').on('click', (e) => {
		        if (!projectEditor.current_plot) return;

		        console.log(projectEditor.current_plot);
		        new MB.Box({
			        box_title: 'New plot',
			        class_name: 'plot',
			        fields: [
				        {
					        name: 'project_name',
					        value: {
						        id: projectEditor.current_plot.project_id,
						        text: projectEditor.current_plot.project_name
					        }
				        },
				        {
					        name: 'name',
					        value: projectEditor.current_plot.name
				        },
				        {
					        name: 'parent_name',
					        value: {
						        id: projectEditor.current_plot.parent_id,
						        text: projectEditor.current_plot.parent_name
					        }
				        },
				        {
					        name: 'longitude',
					        value: projectEditor.current_plot.longitude
				        },
				        {
					        name: 'latitude',
					        value: projectEditor.current_plot.latitude
				        },
				        {
					        name: 'location',
					        value: {
						        id: projectEditor.current_plot.location_id,
						        text: projectEditor.current_plot.location
					        }
				        },
				        {
					        name: 'notes',
					        value: projectEditor.current_plot.notes
				        }
			        ],
			        cb_final: (result) => {
				        if (result) projectEditor.refreshPlotsTree();
			        },
			        cb_box_inited: (dialog) => {
				        const plotSelect = dialog.find('.fn-field[data-column="parent_name"] > select');

				        plotSelect.select2('destroy');
				        initCustomSelect({
					        selector: plotSelect,
					        class_name: 'plot',
					        class_method: 'getParentProjectPlots',
					        placeholder: 'Select plot...',
					        dependant_field: {
						        name: 'project_id',
						        value: formInstance.activeId
					        }
				        })
			        }
		        });
	        });

	        formWrapper.find('.plot_controls .add_child_node').off('click').on('click', (e) => {
		        if (!projectEditor.current_plot) return;

		        new MB.Box({
			        box_title: 'New plot',
			        class_name: 'plot',
			        fields: [
				        {
					        name: 'project_name',
					        value: {
						        id: formInstance.data.data[0].id,
						        text: formInstance.data.data[0].name
					        }
				        },
				        {
					        name: 'name'
				        },
				        {
					        name: 'parent_name',
					        value: {
						        id: projectEditor.current_plot.id,
						        text: projectEditor.current_plot.name
					        }
				        },
				        {
					        name: 'longitude',
					        value: projectEditor.current_plot.longitude
				        },
				        {
					        name: 'latitude',
					        value: projectEditor.current_plot.latitude
				        },
				        {
					        name: 'location',
					        value: {
						        id: projectEditor.current_plot.location_id,
						        text: projectEditor.current_plot.location
					        }
				        },
				        {
					        name: 'notes'
				        }
			        ],
			        cb_final: (result) => {
				        if (result) projectEditor.refreshPlotsTree();
			        },
			        cb_box_inited: (dialog) => {
				        const plotSelect = dialog.find('.fn-field[data-column="parent_name"] > select');

				        plotSelect.select2('destroy');
				        initCustomSelect({
					        selector: plotSelect,
					        class_name: 'plot',
					        class_method: 'getParentProjectPlots',
					        placeholder: 'Select plot...',
					        dependant_field: {
						        name: 'project_id',
						        value: formInstance.activeId
					        }
				        })
			        }
		        });
	        });

	        // Event buttons handlers
	        formWrapper.find('.events_controls .remove_node').off('click').on('click', (e) => {
		        if (!se.current) return;

		        bootbox.dialog({
			        title: `Deleting event '${se.current.name}'`,
			        message: `Are you sure?`,
			        className: 'wide-modal',
			        buttons: {
				        success: {
					        label: 'Delete',
					        callback: function () {
						        let o = {
							        command: 'remove',
							        object: 'sampling_event',
							        params: {
								        id: se.current.id
							        }
						        };

						        socketQuery(o, (res) => {
							        se.reload();
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

	        formWrapper.find('.events_controls .add_node').off('click').on('click', (e) => {
		        new MB.Box({
			        box_title: 'New sampling event',
			        class_name: 'sampling_event',
			        fields: [
				        {
					        name: 'project_name',
					        value: {
						        id: formInstance.data.data[0].id,
						        text: formInstance.data.data[0].name
					        }
				        },
				        {
					        name: 'name'
				        },
				        {
					        name: 'parent_name'
				        },
				        {
					        name: 'plot'
				        },
				        {
					        name: 'storage'
				        },
				        {
					        name: 'latitude'
				        },
				        {
					        name: 'longitude'
				        },
				        {
					        name: 'location'
				        },
				        {
					        name: 'habitat'
				        },
				        {
					        name: 'datetime_start'
				        },
				        {
					        name: 'datetime_end'
				        }
			        ],
			        cb_final: (result) => {
				        if (result)
					        se.reload();
			        },
			        cb_box_inited: ($dialog) => {
				        let tpl = `
							<div data-type="text" class="fn-field" data-column="objects_to_create_n">
								<label>Number of created entities (from 1 to 99):</label>
								<input type="text" class="fn-control" data-column="objects_to_create_n">
							</div>						
						`;
				        $dialog.find('.adding_new_option').prepend(tpl);
			        }
		        });
	        });

	        formWrapper.find('.events_controls .copy_node').off('click').on('click', (e) => {
		        if (!se.current) return;

		        new MB.Box({
			        box_title: 'New sampling event',
			        class_name: 'sampling_event',
			        fields: [
				        {
					        name: 'project_name',
					        value: {
						        id: se.current.project_id,
						        text: se.current.project_name
					        }
				        },
				        {
					        name: 'name'
				        },
				        {
					        name: 'parent_name',
					        value: {
						        id: se.current.parent_id,
						        text: se.current.parent_name
					        }
				        },
				        {
					        name: 'plot',
					        value: {
						        id: se.current.plot_id,
						        text: se.current.plot
					        }
				        },
				        {
					        name: 'storage',
					        value: {
						        id: se.current.storage_id,
						        text: se.current.storage
					        }
				        },
				        {
					        name: 'longitude',
					        value: se.current.longitude
				        },
				        {
					        name: 'latitude',
					        value: se.current.latitude
				        },
				        {
					        name: 'location',
					        value: {
						        id: se.current.location_id,
						        text: se.current.location
					        }
				        },
				        {
					        name: 'habitat',
					        value: {
						        id: se.current.habitat_id,
						        text: se.current.habitat
					        }
				        },
				        {
					        name: 'datetime_start',
					        value: se.current.datetime_start
				        },
				        {
					        name: 'datetime_end',
					        value: se.current.datetime_end
				        }
			        ],
			        cb_final: (result) => {
				        if (result)
					        se.reload();
			        },
			        cb_box_inited: (dialog) => {
			        }
		        });
	        });

	        formWrapper.find('.events_controls .add_child_node').off('click').on('click', (e) => {
		        if (!se.current) return;

		        new MB.Box({
			        box_title: 'New sampling event',
			        class_name: 'sampling_event',
			        fields: [
				        {
					        name: 'project_name',
					        value: {
						        id: formInstance.data.data[0].id,
						        text: formInstance.data.data[0].name
					        }
				        },
				        {
					        name: 'name'
				        },
				        {
					        name: 'parent_name',
					        value: {
						        id: se.current.id,
						        text: se.current.name
					        }
				        },
				        {
					        name: 'plot',
					        value: {
						        id: se.current.plot_id,
						        text: se.current.plot
					        }
				        },
				        {
					        name: 'storage',
					        value: {
						        id: se.current.storage_id,
						        text: se.current.storage
					        }
				        },
				        {
					        name: 'longitude',
					        value: se.current.longitude
				        },
				        {
					        name: 'latitude',
					        value: se.current.latitude
				        },
				        {
					        name: 'location',
					        value: {
						        id: se.current.location_id,
						        text: se.current.location
					        }
				        },
				        {
					        name: 'habitat',
					        value: {
						        id: se.current.habitat_id,
						        text: se.current.habitat
					        }
				        },
				        {
					        name: 'datetime_start',
					        value: se.current.datetime_start
				        },
				        {
					        name: 'datetime_end',
					        value: se.current.datetime_end
				        }
			        ],
			        cb_final: (result) => {
				        if (result)
					        se.reload();
			        },
			        cb_box_inited: (dialog) => {
			        }
		        });
	        });

	        //Organization button handlers
            formWrapper.find('.add_organization').off('click').on('click', (e) => {
                new MB.Box({
                    box_title: 'New organization',
                    class_name: 'organization',
                    fields: [
                        {
                            name: 'name'
                        },
                        {
                            name: 'address'
                        },
                        {
                            name: 'country'
                        },
                        {
                            name: 'website'
                        }
                    ],
                    cb_final: (result) => {
                        if (result) projectEditor.init2c_organizations()
                    },
                    cb_box_inited: ($dialog) => {

                        let tpl = '<p>Before adding a new organisation, try to find it among existing ones using short ' +
                            'selected keyword. While creating, please follow the format ‘Small institution, large institution’,' +
                            ' without personalities. Examples: “Institute of Philosophy, University of Everything”, ' +
                            '“Monkey Research Center, Primate Research Consortium“, “Institute of Knowledge, Academy of Unknown” ' +
                            'or just ‘Institute of Individuality’.</p>';


                        // const organizationSelect = dialog.find('.fn-field[data-column="organization"] > select');
                        // const storageSelect = dialog.find('.fn-field[data-column="parent_name"] > select');

                        $dialog.find('.adding_new_option').prepend(tpl);

                        // storageSelect.select2('destroy');
                        // initCustomSelect({
                        //     selector: storageSelect,
                        //     class_name: 'storage',
                        //     class_method: 'getParentProjectStorages',
                        //     placeholder: 'Select storage...',
                        //     dependant_field: {
                        //         name: 'project_id',
                        //         value: formInstance.activeId
                        //     }
                        // });
                        //
                        // organizationSelect.select2('destroy');
                        // initCustomSelect({
                        //     selector: organizationSelect,
                        //     class_name: 'organization',
                        //     class_method: 'get',
                        //     placeholder: 'Select organization...',
                        //     // dependant_field: {
                        //     // 	name: 'project_id',
                        //     // 	value: formInstance.activeId
                        //     // }
                        // });
                    }
                });
            });


	        //Storage buttons handlers
			formWrapper.find('.remove_storage').off('click').on('click', (e) => {
				if (!storageEditor.current) return;

				bootbox.dialog({
					title: `Deleting storage '${storageEditor.current.name}'`,
					message: `Are you sure?`,
					className: 'wide-modal',
					buttons: {
						success: {
							label: 'Delete',
							callback: function () {
								let o = {
									command: 'remove',
									object: 'storage',
									params: {
										id: storageEditor.current.id
									}
								};

								socketQuery(o, (res) => {
									storageEditor.clear();
									storageEditor.reload();
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

			formWrapper.find('.add_storage').off('click').on('click', (e) => {
				new MB.Box({
					box_title: 'New storage',
					class_name: 'storage',
					fields: [
						{
							name: 'project',
							value: {
								id: formInstance.data.data[0].id,
								text: formInstance.data.data[0].name
							}
						},
						{
							name: 'name'
						},
						{
							name: 'parent_name'
						},
						{
							name: 'organization'
						},
						{
							name: 'address'
						},
						{
							name: 'place'
						},
						{
							name: 'contact_person'
						},
						{
							name: 'contact_phone'
						},
						{
							name: 'contact_email'
						}
					],
					cb_final: (result) => {
						if (result) storageEditor.reload();
					},
					cb_box_inited: (dialog) => {
						const organizationSelect = dialog.find('.fn-field[data-column="organization"] > select');
						const storageSelect = dialog.find('.fn-field[data-column="parent_name"] > select');

						storageSelect.select2('destroy');
						initCustomSelect({
							selector: storageSelect,
							class_name: 'storage',
							class_method: 'getParentProjectStorages',
							placeholder: 'Select storage...',
							dependant_field: {
								name: 'project_id',
								value: formInstance.activeId
							}
						});

						organizationSelect.select2('destroy');
						initCustomSelect({
							selector: organizationSelect,
							class_name: 'organization',
							class_method: 'get',
							placeholder: 'Select organization...',
							// dependant_field: {
							// 	name: 'project_id',
							// 	value: formInstance.activeId
							// }
						});
					}
				});
			});

			formWrapper.find('.copy_storage').off('click').on('click', (e) => {
				if (!storageEditor.current) return;

				new MB.Box({
					box_title: 'New storage',
					class_name: 'storage',
					fields: [
						{
							name: 'project',
							value: {
								id: storageEditor.current.project_id,
								text: storageEditor.current.project
							}
						},
						{
							name: 'name',
							value: storageEditor.current.name
						},
						{
							name: 'parent_name',
							value: {
								id: storageEditor.current.parent_id,
								text: storageEditor.current.parent_name
							}
						},
						{
							name: 'organization',
							value: {
								id: storageEditor.current.organization_id,
								text: storageEditor.current.organization
							}
						},
						{
							name: 'address',
							value: storageEditor.current.address
						},
						{
							name: 'place',
							value: storageEditor.current.place
						},
						{
							name: 'contact_person',
							value: storageEditor.current.contact_person
						},
						{
							name: 'contact_phone',
							value: storageEditor.current.contact_phone
						},
						{
							name: 'contact_email',
							value: storageEditor.current.contact_email
						}
					],
					cb_final: (result) => {
						if (result) storageEditor.reload();
					},
					cb_box_inited: (dialog) => {
						const organizationSelect = dialog.find('.fn-field[data-column="organization"] > select');
						const storageSelect = dialog.find('.fn-field[data-column="parent_name"] > select');

						storageSelect.select2('destroy');
						initCustomSelect({
							selector: storageSelect,
							class_name: 'storage',
							class_method: 'getParentProjectStorages',
							placeholder: 'Select storage...',
							dependant_field: {
								name: 'project_id',
								value: formInstance.activeId
							}
						});

						organizationSelect.select2('destroy');
						initCustomSelect({
							selector: organizationSelect,
							class_name: 'organization',
							class_method: 'getByProject',
							placeholder: 'Select organization...',
							return_field: 'organization',
							dependant_field: {
								name: 'project_id',
								value: formInstance.activeId
							}
						});
					}
				});
			});

			formWrapper.find('.add_child_storage').off('click').on('click', (e) => {
				if (!storageEditor.current) return;

				new MB.Box({
					box_title: 'New storage',
					class_name: 'storage',
					fields: [
						{
							name: 'project',
							value: {
								id: formInstance.data.data[0].id,
								text: formInstance.data.data[0].name
							}
						},
						{
							name: 'name'
						},
						{
							name: 'parent_name',
							value: {
								id: storageEditor.current.id,
								text: storageEditor.current.name
							}
						},
						{
							name: 'organization',
							value: {
								id: storageEditor.current.organization_id,
								text: storageEditor.current.organization
							}
						},
						{
							name: 'address',
							value: storageEditor.current.address
						},
						{
							name: 'place',
							value: storageEditor.current.place
						},
						{
							name: 'contact_person',
							value: storageEditor.current.contact_person
						},
						{
							name: 'contact_phone',
							value: storageEditor.current.contact_phone
						},
						{
							name: 'conact_email',
							value: storageEditor.current.contact_email
						}
					],
					cb_final: (result) => {
						if (result) storageEditor.reload();
					},
					cb_box_inited: (dialog) => {
						const organizationSelect = dialog.find('.fn-field[data-column="organization"] > select');
						const storageSelect = dialog.find('.fn-field[data-column="parent_name"] > select');

						storageSelect.select2('destroy');
						initCustomSelect({
							selector: storageSelect,
							class_name: 'storage',
							class_method: 'getParentProjectStorages',
							placeholder: 'Select storage...',
							dependant_field: {
								name: 'project_id',
								value: formInstance.activeId
							}
						});

						organizationSelect.select2('destroy');
						initCustomSelect({
							selector: organizationSelect,
							class_name: 'organization',
							class_method: 'getByProject',
							placeholder: 'Select organization...',
							return_field: 'organization',
							dependant_field: {
								name: 'project_id',
								value: formInstance.activeId
							}
						});
					}
				});
			});


	        formWrapper.find('.add-factor').off('click').on('click', function () {
	        	if (!projectEditor.current_plot) return;

		        new MB.Box({
			        box_title: 'New plot factor',
			        class_name: 'plot_factor',
			        fields: [
				        {
					        name: 'plot',
					        value: {
						        id: projectEditor.current_plot.id,
						        text: projectEditor.current_plot.name
					        }
				        },
				        {
					        name: 'name'
				        },
				        {
					        name: 'plot_factor_type'
				        },
				        {
					        name: 'definition'
				        }
			        ],
			        cb_final: (result, id) => {
				        if (result) {
					        projectEditor.getFactors(projectEditor.current_plot.id, function () {
                                projectEditor.editFactor(id);
                                projectEditor.populateFactors();
					        });


				        }
			        }
		        });
	        });

	        formWrapper.find('.save-plot').off('click').on('click', function(){

				if (projectEditor.plot_changes.length)
				        projectEditor.savePlotChanges();
			});

            formWrapper.find('.save-storage').off('click').on('click', function(){
                if (storageEditor.changes.length)
                    storageEditor.saveStorageChanges();
            });

            formWrapper.find('.save-sampling-event').off('click').on('click', function(){
                if (se.changes.length)
                    se.saveSeChanges();

            });

	        $(document).off('click', '.tep_edit_bttn').on('click', '.tep_edit_bttn', (e) => {
	        	let id = $(e.currentTarget).parent('.tep-item-holder').attr('data-id');

	        	projectEditor.editFactor(id);
	        });


	        // formWrapper.find('.save-traits').off('click').on('click', function () {
			//
		    //     if (projectEditor.factor_changes.length)
			//         projectEditor.saveFactors(function () {
			// 	        // formInstance.reload();
			//
			//         });
			//
		    //     if (projectEditor.plot_changes.length)
			//         projectEditor.savePlotChanges(function () {
			// 	        // formInstance.reload();
			//         });
			//
	        // });

	        formWrapper.find('.edit-project-members').off('click').on('click', function(){


                MB.Core.accessForm({
                    object: formInstance.class,
                    id: formInstance.activeId,
                    class_id: formInstance.profile.extra_data.object_profile.class_id,
                    name: formInstance.data.data[0].name,
					afterClose: function () {
						formInstance.reload();
                    }
                });


	        });
        }
    };

    //projectEditor.getAll();

    formInstance.doNotGetScript = true;
    formInstance.afterReload = function(cb){
        // Можно запихнуть все что нужно вызвать при релоаде без загрузки нового скрипта.

        se.reload();
	    filtersEditor.init();

        if (typeof cb === 'function') cb();
    };
    projectEditor.init();
	formInstance.beforeReload = function(cb) {
		se.clear();
		storageEditor.clear();
		projectEditor.unselectPlot();

		if (typeof cb === 'function') cb();
	}

    formWrapper.find('.itt_option').off('click').on('click', (e) => {
	    let $parent = $(e.currentTarget).parents('.in_tab_tabs_wrapper');
	    let type = $(e.currentTarget).attr('data-tab');
	    $parent.find('.itt_tab').removeClass('active');
	    $parent.find('.itt_option').removeClass('active');
	    $parent.find(`.itt_tab[data-tab=${type}]`).addClass('active');
	    $(e.currentTarget).addClass('active');
    });



	var se = {
		current: null,
		events_tree: [],
        changes: [],

		addChange: function (change) {
			let wasChange = false;
			let found = false;

			for (let i in se.changes) {
				let ch = se.changes[i];

				if (ch.column_name == change.column_name) {
					if (ch.value.value != change.value.value) {
						ch.value.value = change.value.value;
						wasChange = true;
					}
					found = true;
				}
			}

			if (!found) {
                se.changes.push(change);
				wasChange = true;
			}

			se.setHighlight(wasChange);
		},
		saveSeChanges: function (cb) {
			let o = {
				command: 'modify',
				object: 'sampling_event',
				params: {}
			};

            se.changes.forEach(change => {
				o.params[change.column_name] = change.value.value;
			});

			if (Object.keys(o.params).length != 0) {
				o.params.id = se.current.id;

				socketQuery(o, function (res) {
					if (res.code === 0) se.changes = [];

					se.setHighlight(false);

                    se.selectEvent(se.current.id)

					if (typeof cb == 'function') {
						cb();
					}
				});
			}
		},
		init: function () {
			se.getEvents(function () {
				se.unselectEvent();
				se.populateEventsTree();
				se.setHandlers();
			});
		},
        clear: function() {
            se.current = null;
            se.events_tree = [];
            se.changes = [];

            formWrapper.find('.se-switcher-holder').html('');
            formWrapper.find('.current_event_wrapper').html('');
            formWrapper.find('.sample-tbls-holder').html('');
        },
        reload: function () {
            se.getEvents(function() {
	            se.unselectEvent();
                se.populateEventsTree();
                se.setHandlers();
            })
        },
		getEvents: function (cb) {
			var o = {
				command: 'getTree_v2',
				object: 'sampling_event',
				params: {
					project_id: formInstance.activeId
				}
			};

			socketQuery(o, function (res) {
				if (res.code !== 0) {
					toastr[res.toastr.type](res.toastr.message);
					return;
				}

				projectEditor.events_tree = res.tree;

				if (typeof cb == 'function') cb();
			});
		},
		populateEventsTree: function () {
			let holder = formWrapper.find('.events-tree-holder');
			if (!projectEditor.events_tree.core.data) return;
			holder
				.html('')
				.jstree('destroy')
				.jstree({
					'core': {
						'multiple': false,
						"plugins": ["contextmenu"],
						'data': function (node, cb) {
							if (node.id === "#") {
								cb(projectEditor.events_tree.core.data);
							} else {
								var o = {
									command: 'getTreeChilds',
									object: 'sampling_event',
									params: {
										id: node.id,
										project_id: formInstance.activeId
									}
								};

								socketQuery(o, function (res) {
									if (!res.code == 0) {
										toastr[res.toastr.type](res.toastr.message);
										return false;
									}

									cb(res.tree.core.data);
								});
							}
						}
					}
				});

			holder.on('open_node.jstree', function (e, a) {
				console.log('here', a);
			});

			holder.on('select_node.jstree', function (e, a) {
				let id = a.node.id;

				// This plot is from this project
				if (a.node.original.item.project_id == formInstance.activeId) {
					se.selectEvent(id);
					formWrapper.find('.event-data-holder').html('');
				} else {
					se.selectEvent(id);
					formWrapper.find('.event-data-holder').html('This event is from parental project - ' + a.node.original.item.project_name + '(' + a.node.original.item.project_id + ').');
				}
			});
		},
		selectEvent: (event_id) => {
			formWrapper.find('.event-data-holder').html('');
			formWrapper.find('.events_controls .add-factor').show();
			formWrapper.find('.events_controls .copy_node').show();
			formWrapper.find('.events_controls .add_child_node').show();
			formWrapper.find('.save-sampling-event').show();

			se.getEvent(event_id, function () {
				if (se.current.project_id === id)
					formWrapper.find('.events_controls .remove_node').show();
				else
					formWrapper.find('.events_controls .remove_node').hide();

				se.populateEvent();

				formWrapper.attr('data-selected-event-id', event_id);
			});
		},
		unselectEvent: () => {
			se.current = null;
			formWrapper.find('.events_controls .remove_node').hide();
			formWrapper.find('.events_controls .add_child_node').hide();
			formWrapper.find('.events_controls .copy_node').hide();
			formWrapper.find('.save-sampling-event').hide();
			formWrapper.find('.event-data-holder').html('');
			formWrapper.find('.current_event_wrapper')
				.html('<div class="plots-placeholder">Please, select a event from events tree.</div>');
		},
		getEvent: function(id, cb) {
		    

			var o = {
				command: 'get',
				object: 'sampling_event',
				params: {
					param_where: {
						id: id
					}
				}
			};


			socketQuery(o, function (res) {
				if (res.code !== 0) {
					toastr[res.toastr.type](res.toastr.message);
					return;
				}


				se.current = res.data[0];

				if (typeof cb == 'function')
					cb();
			});
		},
		populateEvent: () => {
			projectEditor.populateCurrentSEvent(se.current);

			const holder = formWrapper.find('.sample-tbls-holder');
			const names = holder.attr('data-tbls-lazyLoad');

			formInstance.createOneChildTbls({parent_id: event.id, destroy_on_reload:true}, holder, names, function (err, res) {
				if (err) console.log('Failed to render subtable in Sampling events tab', err);
			})
		},
		setHandlers: function () {
			formWrapper.find('.custom-list-item').off('click').on('click', function () {
				var id = $(this).attr('data-id');

				for (let event of se.events_tree) {
					if (event.id === +id) {
						se.populateEvent(event);
						break;
					}
				}
			});
		},
        setHighlight: function(state) {
		    projectEditor.setHighlight(state, '.save-sampling-event')
        }
	};

	se.init();

	var storageEditor = {
	    current: null,
        changes: [],
        tree: null,

        init: function() {
	        storageEditor.getStoragesTree(() => storageEditor.populateStoragesTree());
        },
        clear: function() {
            storageEditor.current = null;
            storageEditor.changes = [];
            storageEditor.tree = null;

            storageEditor.unselectStorage();

            formWrapper.find('.storage-data-holder').html('');
            formWrapper.find('.current-storage-holder').html('<div class="storage-placeholder">Please, select a storage from plots tree.</div>');
        },
        reload: function() {
	        storageEditor.getStoragesTree(() => storageEditor.populateStoragesTree());
        },
        getStoragesTree: function(cb) {
            var o = {
                command: 'getTree_v2',
                object: 'storage',
                params:{
                    project_id: formInstance.activeId
                }
            };

            socketQuery(o, function (res) {
                if (res.code != 0) {
                    toastr[res.toastr.type](res.toastr.message);
                    return;
                }

                storageEditor.tree = res.tree;

                if (typeof cb == 'function') {
                    cb();
                }
            });

        },
        getStorage: function(id, cb) {
            var o = {
                command:'get',
                object:'storage',
                params:{
                    param_where: {
                        id
                    }//,
					// collapseData:false // Не понятно нужно или нет, у меня было но не запушено оставлю пока закоменченым
                }
            };

            socketQuery(o, function(res) {
                if (res.code != 0) {
                    toastr[res.toastr.type](res.toastr.message)
                    return
                }

                storageEditor.current = res.data[0];

                if (typeof cb === 'function') cb()
            })
        },
        populateStoragesTree: function (cb) {
            var holder = formWrapper.find('.storages-tree-holder');

            if (!storageEditor.tree.core.data) return;
            holder
                .html('')
                .jstree('destroy')
                .jstree({
                    'core': {
                        'multiple': false,
                        "plugins": ["contextmenu"],
                        'data': function (node, cb) {
                            if (node.id === "#") {
                                cb(storageEditor.tree.core.data);
                            }
                            else {
                                var o = {
                                    command: 'getTreeChilds',
                                    object: 'storage',
                                    params: {
                                        id: node.id,
                                        project_id: formInstance.activeId
                                    }
                                };

                                socketQuery(o, function (res) {
                                    if (!res.code == 0) {
                                        toastr[res.toastr.type](res.toastr.message);
                                        return false;
                                    }

                                    cb(res.tree.core.data);
                                });
                            }
                        }
                    }
                });

            holder.on('open_node.jstree', function (e, a) {
            });

            holder.on('select_node.jstree', function (e, a) {
                id = a.node.id;

                if (a.node.original.item.project_id === formInstance.activeId) {
                    storageEditor.selectStorage(id);
                    formWrapper.find('.storage-data-holder').html('');
                } else {
                    storageEditor.selectStorage(id);
                    formWrapper.find('.storage-data-holder').html('This storage is from parental project - ' + a.node.original.item.project + '(' + a.node.original.item.project_id + ').');
                }
            });
        },
        populateCurrentStorage: function () {
            getFieldsForRendering('storage', ['name', 'parent_name', 'project', 'organization','address', 'place', 'contact_person', 'contact_phone', 'contact_email'], (obj) => {
				const currentStorageSelector = formWrapper.find('.current-storage-holder');
            	currentStorageSelector.html(obj.html);

                initFields2(currentStorageSelector, storageEditor.current, storageEditor);

				const organizationSelect = currentStorageSelector.find('.fn-field[data-column="organization"] > select');

				organizationSelect.select2('destroy');
				initCustomSelect({
					selector: organizationSelect,
					class_name: 'organization',
					class_method: 'getByProject',
					placeholder: 'Select organization...',
					return_field: 'organization',
					dependant_field: {
						name: 'project_id',
						value: formInstance.activeId
					}
				}).off('select2:select').on('select2:select', function (e) {
					var data = e.params.data;

					storageEditor.addChange({
						object: storageEditor.current,
						column_name: 'organization_id',
						type: 'select2',
						value: {
							value: data.id,
							selValue: ''
						}
					});
				});

				const storageSelect = currentStorageSelector.find('.fn-field[data-column="parent_name"] > select');

				storageSelect.select2('destroy');
				initCustomSelect({
					selector: storageSelect,
					class_name: 'storage',
					class_method: 'getParentProjectStorages',
					placeholder: 'Select storage...',
					dependant_field: {
						name: 'project_id',
						value: formInstance.activeId
					}
				}).off('select2:select').on('select2:select', function (e) {
					var data = e.params.data;

					projectEditor.addChange({
						object: storageEditor.current,
						column_name: 'parent_id',
						type: 'select2',
						value: {
							value: data.id,
							selValue: ''
						}
					});
				});


	            if (storageEditor.current.inherited_fields)
		            storageEditor.current.inherited_fields.forEach(field => {
			            currentStorageSelector.find(`.fn-field[data-column=${field.name}]`)
				            .addClass('inherited_value')
				            .append(`
								<div class="is-parent-fader">
				                    <div class="fader-text">Inherited: ${field.source}</div>
			                    </div>
							`);
		            });

				const isParental = formInstance.activeId === storageEditor.current.project_id;

                if(!isParental)
                	projectEditor.disableFields(currentStorageSelector);
            })
        },
        selectStorage: function (storage_id) {
            formWrapper.find('.storage-data-holder').html('');
            formWrapper.find('.copy_storage').show();
            formWrapper.find('.add_child_storage').show();
            formWrapper.find('.save-storage').show();

            storageEditor.getStorage(storage_id, function () {
	            if (storageEditor.current.project_id === id)
		            formWrapper.find('.remove_storage').show();
	            else
		            formWrapper.find('.remove_storage').hide();

	            storageEditor.populateCurrentStorage();
            });
        },
        unselectStorage: () => {
            storageEditor.current = null;
            storageEditor.changes = [];
            storageEditor.setHighlight(false);
            formWrapper.find('.remove_storage').hide();
            formWrapper.find('.add_child_storage').hide();
            formWrapper.find('.copy_storage').hide();
            formWrapper.find('.save-storage').hide();
            formWrapper.find('.current-storage-holder').html('<div class="storage-placeholder">Please, select a storage from storages tree.</div>');
        },
	    addChange: function (change) {
            let wasChange = false;
            let found = false;

            for (let ch of storageEditor.changes) {
                if (ch.column_name == change.column_name) {
                    if (ch.value.value != change.value.value) {
                        ch.value.value = change.value.value;
                        wasChange = true;
                    }
                    found = true;
                }
            }

            if (!found) {
                storageEditor.changes.push(change);
                wasChange = true;
            }

            storageEditor.setHighlight(wasChange);
        },
        saveStorageChanges: function (cb) {
            let o = {
                command: 'modify',
                object: 'storage',
                params: {}
            };

            storageEditor.changes.forEach(change => {
                o.params[change.column_name] = change.value.value;
            });

            if (Object.keys(o.params).length != 0) {
                o.params.id = storageEditor.current.id;

                socketQuery(o, function (res) {
                    if (res.code === 0) storageEditor.changes = [];

                    storageEditor.setHighlight(false);

                    if (typeof cb == 'function') {
                        cb();
                    }

                });
            }
        },
        setHighlight: (state) => {
	        projectEditor.setHighlight(state, '.save-storage');
        }
    };

    storageEditor.init();

	var filtersEditor = {
		filters: {
			parentProjectsIds: [],
			projects: [],
			storages: [],
			plots: [],
			events: [],
			taxons: [],
		},

		init: function() {
			filtersEditor.filters = {
				parentProjectsIds: [],
				projects: [],
				storages: [],
				plots: [],
				events: [],
				taxons: [],
			};

			formWrapper.find('.edit_project_collection').off('click').on('click', filtersEditor.editCollectionFiltering);

			formWrapper.find('.export_project').off('click').on('click', filtersEditor.exportProject);

			formWrapper.find('.export_sampling_events').off('click').on('click', filtersEditor.exportEvents);

			formWrapper.find('.open-sequence-collection').off('click').on('click', () => filtersEditor.openSequenceCollection(id))
		},

		exportEvents: () => {
			let o = {
			    command: 'get',
			    object: 'project_sample_factor',
			    params: {
			        param_where: {
			        	project_id: id
			        }
			    }
			};

			socketQuery(o, (res) => {
			   if (res.code !== 0) return;

				let fields = [
					{
						field: 'name',
						name: 'Name',
						checked: true,
						type: 'field'
					},
					{
						field: 'datetime_end',
						name: 'Date end',
						checked: true,
						type: 'field'
					},
					{
						field: 'samples_size',
						name: 'Sample size',
						checked: true,
						type: 'field'
					},
					{
						field: 'meas_unit_sign',
						name: 'Sample size units',
						checked: true,
						type: 'field'
					},
					{
						field: 'description',
						name: 'Description',
						checked: true,
						type: 'field'
					},
					{
						field: 'storage',
						name: 'Default storage',
						checked: false,
						type: 'field'
					},
					{
						field: 'name',
						name: 'Name',
						checked: true,
						type: 'sampling_event'
					},
					{
						field: 'plot',
						name: 'Plot',
						checked: true,
						type: 'sampling_event'
					},
					{
						field: 'latitude',
						name: 'Latitude',
						checked: true,
						type: 'sampling_event'
					},
					{
						field: 'longitude',
						name: 'Longitude',
						checked: true,
						type: 'sampling_event'
					},
					{
						field: 'location',
						name: 'Location',
						checked: true,
						type: 'sampling_event'
					}
				];

				for (const i in res.data) {
					fields.push({
						factor_id: res.data[i].id,
						name: res.data[i].name,
						checked: true,
						type: 'factor'
					});
				}

				let tce;
				let tpl = `
					<div class="fn-field">
						<label>Max number of rows</label>
						<input type="number" class="fn-control number_of_rows" value="100" />
					</div>
                    <h4>Select information that is needed to export</h4>
                    <div class="two_columns_meas info"></div>
                `;

				let $dialog = bootbox.dialog({
					title: 'Export events',
					message: tpl,
					buttons: {
						success: {
							label: 'Export',
							callback: function () {
								let o = {
									command: 'export_from_project_to_excel',
									object: 'sampling_event',
									params: {
										project_id: id,
										fields: tce.getData(),
										limit: +$dialog.find('.number_of_rows').val()
									}
								};

								socketQuery(o, (res) => {
									var linkName = 'my_download_link' + MB.Core.guid();
									$("body").prepend(`<a id="${linkName}" href="${res.path}/${res.filename}" download="${res.filename}" style="display:none;"></a>`);

									var jqElem = $('#' + linkName);
									jqElem[0].click();
									jqElem.remove();
								});
							}
						},
						error: {
							label: 'Cancel',
							callback: function () {
							}
						}
					}

				}).on('shown.bs.modal', function () {
					tce = $dialog.find('.two_columns_meas.info').tce_simple({
						data: fields,
						left_label: 'Available fields',
						right_label: 'Binded fields'
					});
				});
			});
		},

		clearFilters: function() {
			filtersEditor.filters.storages = [];
			filtersEditor.filters.plots = [];
			filtersEditor.filters.events = [];
		},

		disableFilters: function(selectors) {
			selectors.forEach(selector => {
				selector.prop('disabled', true);
			})
		},

		enableFitlers: function(selectors) {
			selectors.forEach(selector => {
				selector.prop('disabled', false);
			})
		},

		clearSelection: function(selectors) {
			selectors.forEach(selector => {
				selector.val(null).trigger('change.select2');
			})
		},

		editCollectionFiltering: function(event, fi) {

			function initSelect(obj) {
				const {
					selector,
					class_name,
					parent_id,
					dependant_fields,
                    dependant_field,
					minimumInputLength = 0,
					class_method = 'get',
					return_field = 'name',
					return_id = 'id'
				} = obj;

				selector.select2({
					multiple: true,
					allowClear: false,
					placeholder: 'Select values...',
					minimumInputLength,
					ajax: {
						dataType: 'json',
						delay: 250,
						transport: function (params, success, failure) {
							const o = {
								command: class_method,
								object: class_name,
								params: {
									limit: 100,
									page_no: params.data.page || 1,
									collapseData: false,
									where: []
								}
							};

							if (parent_id) {
								o.params.where.push({
									key: 'id',
									type: '=',
									val1: parent_id
								})
							}

                            if (dependant_field) {
                                o.params.where.push({
                                    key: dependant_field.name,
                                    type: '=',
                                    val1: dependant_field.value
                                })
                            }

							if (dependant_fields) {
								dependant_fields.forEach((field) => {
									let values;

									if (field.additional_values) {
										values = [
											...filtersEditor.filters[field.values].map(data => data.id),
											...filtersEditor.filters[field.additional_values]
										];
									} else {
										values = filtersEditor.filters[field.values].map(data => data.id);
									}

									if (values.length == 0) {
										if (field.name != 'project_id') return;
										values.push(id);
									}

									o.params.where.push({
										key: field.name,
										type: 'in',
										val1: values
									})
								})
							}

							if (params.data.term) {
								o.params.where.push({
									key: return_field,
									type: 'like',
									val1: params.data.term
								})
							}

							socketQuery(o, res => {
								if (res) {
									const data = [];

									res.forEach(record => {
										const item = {
											id: record[return_id],
											text: record[return_field]
										}

										if (record.project_id) item.project_id = record.project_id;
										if (record.plot_id) item.plot_id = record.plot_id;
										if (record.sampling_event_id) item.sampling_event_id = record.sampling_event_id;

										data.push(item);
									});

									success({
										items: data,
										size: data.length
									})
								} else {
									failure('failed')
								}
							})
						},
						processResults: function (data, params) {
							params.page = params.page || 1;

							return {
								results: data.items,
								pagination: {
									more: data.size === 100
								}
							}
						}
					}
				})
				return selector;
			}

			function selectHandler(filterName, e) {
				const data = e.params.data;
				const index = filtersEditor.filters[filterName].findIndex(item => item.id == data.id);

				if (index == -1) filtersEditor.filters[filterName].push(data)
			}

			function unselectHandler(filterName, e) {
				const data = e.params.data;
				const index = filtersEditor.filters[filterName].findIndex(item => item.id == data.id);

				filtersEditor.filters[filterName].splice(index, 1);

				e.params.originalEvent.stopPropagation();
			}

			function reloadSelect(select, filterName, fieldName, e) {

				const id = e.params.data.id;
				const unselectIds = [];
				const newSelected = []

				filtersEditor.filters[filterName].forEach(item => {
					if (item[fieldName] != id) {
						newSelected.push(item);
					} else {
						unselectIds.push(item.id);
					}
				})

				if (unselectIds.length != 0) {
					unselectIds.forEach(id => {
						const option = select.find('option[value="'+ id +'"]');
						option.prop('selected', false);
					});

					select.trigger('change.select2');
					filtersEditor.filters[filterName] = newSelected;
				}
			}

			function reloadSelectDecorator(array, e) {
				array.forEach(item => {
					reloadSelect(item.select, item.filterName, item.fieldName, e);
				})
			}

			if (filtersEditor.filters.parentProjectsIds.length === 0) {
				const o = {
					command: 'getParentIds',
					object: 'project',
					params: {
						id: id,
						collapseData: false
					}
				};

				socketQuery(o, function(res) {
					filtersEditor.filters.parentProjectsIds = [id, ...res.ids];
				})
			}

			fi = fi === undefined ? formInstance : fi;

			const tpl = `
	        		<div class="fn-field" id="project-filter">
						<label>Choose projects</label>
						<select class="fn-control"></select>
					</div>
					<div class="fn-field" id="storage-filter">
						<label>Choose storages</label>
						<select class="fn-control"></select>
					</div>
					<div class="fn-field" id="plot-filter">
						<label>Choose plots</label>
						<select class="fn-control"></select>
					</div>
					<div class="fn-field" id="event-filter">
						<label>Choose sampling events</label>
						<select class="fn-control"></select>
					</div>
					<div class="fn-field" id="taxon-filter">
						<label>Choose taxa</label>
						<select class="fn-control"></select>
					</div>
	        	`;


			const formProjectParams = {
				title: 'Project collection filter settings',
				message: tpl,
				buttons: {
					success: {
						label: 'Show collection',
						callback: function () {
							let formId = MB.Core.guid();

							let form = new MB.FormN({
								id: formId,
								name: 'form_data_individual_collection',
								class: 'project',
								client_object: 'form_data_individual_collection',
								type: 'form',
								ids: [id],
								position: 'center',
								params: {filtersEditor}
							});

							form.create(function () {
								const filterWhere = [{
									projects: filtersEditor.filters.projects.map(item => item.id),
									storages: filtersEditor.filters.storages.map(item => item.id),
									plots: filtersEditor.filters.plots.map(item => item.id),
									events: filtersEditor.filters.events.map(item => item.id),
									taxons: filtersEditor.filters.taxons.map(item => item.id)
								}];
								const interval = setInterval(() => {
									const tbl = form.tblInstances.find(tbl => tbl.client_object === "tbl_data_individual_collection");
									if (!tbl) return;

									console.error('filterWhere', filterWhere);
									tbl.ct_instance.filterWhere = filterWhere;
									tbl.reload();
									clearInterval(interval);
								}, 500)
							});
						}
					},
					error: {
						label: 'Close',
						callback: function () {}
					}
				}
			};

			const formDIParams = {
				title: 'Project collection filter settings',
				message: tpl,
				buttons: {
					success: {
						label: 'Apply filters',
						callback: function () {
							const filterWhere = [
								{
									projects: filtersEditor.filters.projects.map(item => item.id),
									storages: filtersEditor.filters.storages.map(item => item.id),
									plots: filtersEditor.filters.plots.map(item => item.id),
									events: filtersEditor.filters.events.map(item => item.id),
									taxons: filtersEditor.filters.taxons.map(item => item.id)
								}
							];

							const tbl = fi.tblInstances.find(tbl => tbl.client_object === "tbl_data_individual_collection");
							if (!tbl) return;

							tbl.ct_instance.filterWhere = filterWhere;
							tbl.reload();
						}
					},
					error: {
						label: 'Close',
						callback: function () {

						}
					}
				}
			};


			const params = fi.name === 'form_project' ? formProjectParams : formDIParams;

			const box = bootbox.dialog(params);

			const projectSelect = initSelect({
				selector: box.find('#project-filter').find('select'),
				class_name: 'project',
				class_method: 'getProjectWithChilds',
				parent_id: formInstance.activeId,
			});

			projectSelect.on('select2:select', selectHandler.bind(undefined, 'projects'));

			projectSelect.on('select2:unselect', function(e) {
				unselectHandler('projects', e);
				reloadSelectDecorator([
					{
						select: storageSelect,
						filterName: 'storages',
						fieldName: 'project_id'
					},
					{
						select: plotSelect,
						filterName: 'plots',
						fieldName: 'project_id'
					},
					{
						select: eventSelect,
						filterName: 'events',
						fieldName: 'project_id'
					}
				], e);
			});

			const storageSelect = initSelect({
				selector: box.find('#storage-filter').find('select'),
				class_name: 'storage',
                dependant_fields: [
                	{
						name: 'project_id',
						values: 'projects',
						additional_values: 'parentProjectsIds'
                	}
                ]
			});

			storageSelect.on('select2:select', selectHandler.bind(undefined, 'storages'));

			storageSelect.on('select2:unselect', unselectHandler.bind(undefined, 'storages'));

			const plotSelect = initSelect({
				selector: box.find('#plot-filter').find('select'),
				class_name: 'plot',
				dependant_fields: [
					{
						name: 'project_id',
						values: 'projects',
						additional_values: 'parentProjectsIds'
					}
				]
			});

			plotSelect.on('select2:select', selectHandler.bind(undefined, 'plots'));

			plotSelect.on('select2:unselect', function(e) {
				unselectHandler('plots', e);
			});

			const eventSelect = initSelect({
				selector: box.find('#event-filter').find('select'),
				class_name: 'sampling_event',
				dependant_fields: [
					{
						name: 'project_id',
						values: 'projects',
					}
				]
			});

			eventSelect.on('select2:select', selectHandler.bind(undefined, 'events'));

			eventSelect.on('select2:unselect', function(e) {
				unselectHandler('events', e);
			});

			const taxonSelect = initSelect({
				selector: box.find('#taxon-filter').find('select'),
				class_name: 'data_individual',
				class_method: 'getAttachedTaxons',
				return_field: 'taxon',
				dependant_field: {
					name: 'project_id',
					value: formInstance.activeId
				}
			});

			taxonSelect.on('select2:select', selectHandler.bind(this, 'taxons'));

			taxonSelect.on('select2:unselect', unselectHandler.bind(this, 'taxons'));

			const addExisting = (select, filterName) => {
				if (filtersEditor.filters[filterName].length != 0) {
					filtersEditor.filters[filterName].forEach(item => {
						const option = new Option(item.text, item.id, true, true);
						select.append(option).trigger('change');
						select.trigger({
							type: 'select2:select',
							params: {
								data: item
							}
						})
					})
				}
			};

			[
				{
					selector: projectSelect, filterName: 'projects'
				},
				{
					selector: storageSelect, filterName: 'storages'
				},
				{
					selector: plotSelect, filterName: 'plots'
				},
				{
					selector: eventSelect, filterName: 'events'
				},
				{
					selector: taxonSelect, filterName: 'taxons'
				}
			].forEach(item => addExisting(item.selector, item.filterName))

		},

		exportProject: () => {
		    let o = {
		        command: 'export_to_excel',
		        object: 'project',
		        params: {
		            id: id
		        }
		    };

		    socketQuery(o, (res) => {
		    });
		},

		openSequenceCollection: function(project_id) {
			let formId = MB.Core.guid();
			let form = new MB.FormN({
				id: formId,
				name: 'form_sequence_collection',
				class: 'sequence',
				client_object: 'form_sequence_collection',
				type: 'form',
				ids: [id],
				position: 'center',
				params: {
					project_id: project_id
				}
			});

			form.create(function () {
				const interval = setInterval(() => {
					const tbl = form.tblInstances.find(tbl => tbl.client_object === "tbl_sequence_collection")
					if (!tbl) return
					tbl.ct_instance.filterWhere.push({
						key: 'data_individual_id',
						type: 'in',
						val1: ids,
						comparisonType: 'OR',
						group: 'data_individual_id'
					})
					tbl.reload()
					clearInterval(interval)
				}, 1000)
			});
		}
	};

	filtersEditor.init();
}());
