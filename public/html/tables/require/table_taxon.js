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
            name: 'loadfromGBIF',
            title: 'Sync with GBIF',
            disabled: function(){
                return false;
            },
            callback: function(){
	            var id = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['id'];

                bootbox.dialog({
                    title: 'Load from GBIF table',
                    message: 'This operation will search the taxon with the same name and rank (level) in GBIF table, update data in taxon table. Then load all parents.',
                    buttons: {
	                    success: {
		                    label: 'Load',
		                    callback: function () {
			                    var o = {
				                    command: 'importFromGBIFThisAndParents',
				                    object: 'Taxon',
				                    params: {
					                    id: id
				                    }
			                    };

			                    socketQuery(o, function (r) {
				                    tableInstance.reload();
			                    });
		                    }
	                    },
	                    importAllByFilter: {
		                    label: 'Sync by filter',
		                    callback: function () {
			                    var o = {
				                    command: 'importFromGBIFThisAndParentsByFilter',
				                    object: 'taxon',
				                    params: {
					                    filterWhere: tableInstance.ct_instance.filterWhere,
					                    infoOptions: {
						                    selector: '#' + tableInstance.wrapper.find('.ct-loader-percent').attr('id')
					                    }
				                    }
			                    };

			                    socketQuery(o, function (r) {
				                    tableInstance.reload();
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
            }
        },
        {
            name: 'updateByParent',
            title: 'Update by parent',
            disabled: function(){
                return false;
            },
            callback: function(){
                var row = tableInstance.ct_instance.selectedRowIndex;

                bootbox.dialog({
                    title: 'Update by parent',
                    message: 'This operation update some fields by parent (kingdom, phylum,...).',
                    buttons:{
                        success: {
                            label: 'Update',
                            callback: function(){

                                var o = {
                                    command:'updateByParent',
                                    object:'Taxon',
                                    params: {
	                                    id: tableInstance.data.data[row].id
                                    }
                                };
                                socketQuery(o, function(r){
	                                tableInstance.reload();
                                });

                            }
                        },
	                    importAllByFilter: {
		                    label: 'Update by filter',
		                    callback: function () {
			                    var o = {
				                    command: 'updateByParentByFilter',
				                    object: 'taxon',
				                    params: {
					                    filterWhere: tableInstance.ct_instance.filterWhere,
					                    infoOptions: {
						                    selector: '#' + tableInstance.wrapper.find('.ct-loader-percent').attr('id')
					                    }
				                    }
			                    };

			                    socketQuery(o, function (r) {
				                    tableInstance.reload();
			                    });
		                    }
	                    },
                        error:{
                            label: 'Cancel',
                            callback: function(){

                            }
                        }
                    }
                })
            }
        },
        {
            name: 'SetAsSynonym',
            title: 'Set as synonym',
            disabled: function(){
                return false;
            },
            callback: function(){
                var row = tableInstance.ct_instance.selectedRowIndex;
                var data = tableInstance.data.data[row];

                var html = '<div class="row">' +
                    '<div class="col-md-12">' +
                    '<div class="">' +
                    '<div class="bootbox-label">Actual taxon:</div>' +
                    '<div  id="choose-synonym" class="deny-select-3-wrapper_"></div>' +
                    '</div>' +
                    '</div>'+
                    '</div>';

                var dialogInstance = bootbox.dialog({
                    title: 'Set taxon "' + data.name + ' (' + data.id + ')" as synonym',
                    message: html,
                    buttons:{
                        success: {
                            label: 'Set as synonym',
                            callback: function(){
                                var actual_taxon_id;
                                if(selInstance){
                                    actual_taxon_id = selInstance.value.id;
                                }
                                if (!actual_taxon_id) {
                                    toastr.info('Please, select actual taxon.');
                                    return false;
                                }
                                var o = {
                                    command:'setAsSynonym',
                                    object:'Taxon',
                                    params:{
                                        id:tableInstance.data.data[row].id,
                                        actual_taxon_id:actual_taxon_id
                                    }
                                };
                                socketQuery(o, function(r){
                                    console.log(r);
                                    tableInstance.reload();
                                });

                            }
                        },
                        error:{
                            label: 'Cancel',
                            callback: function(){

                            }
                        }
                    }
                });

                // Внимание! Если этот код убрать, то поле input будет недоступно в выпадающем списке
                dialogInstance.removeAttr('tabindex');

                var denySelId = MB.Core.guid();

                var selInstance = MB.Core.select3.init({
                    id :                denySelId,
                    wrapper:            $('#choose-synonym'),
                    column_name:        'actual_taxon_id',
                    class:              'taxon',
                    return_id:          'id', // Не прокинуты в select3 (используется данные из профайла колонки)
                    return_name:        'name_with_id', // Не прокинуты в select3 (используется данные из профайла колонки)
                    rowId:              data.id,
                    withSearch:         true,
                    withEmptyValue:     false,
                    absolutePosition:   true,
                    isFilter:           false,
                    value: {},
                    additionalClass:    ''
                });

            }
        }
    ];

    var insert = $('.ct-environment-buttons ul');
    var html = '' +
	// 	'<li style="list-style: none;" class="ct-environment-btn ct-btn-import-from-excel"><div class="nb btn btnDouble blue"><i class="fa fa-upload"></i><div class="btnDoubleInner">Import from Excel</div></div></li>';
	// html += '<li style="list-style: none;" class="ct-environment-btn ct-btn-export-to-excel"><div class="nb btn btnDouble blue"><i class="fa fa-download"></i><div class="btnDoubleInner">Export to Excel</div></div></li>';
	// html += '<li style="list-style: none;" class="ct-environment-btn "><div class="ct-btn-export-traits-to-excel nb btn btnDouble blue"><i class="fa fa-download"></i><div class="btnDoubleInner">Export traits to Excel</div></div></li>';
	// html += '<li style="list-style: none; /*display: none;*/" class="ct-environment-btn ct-btn-import-images"><div class="nb btn btnDouble blue"><i class="fa fa-download"></i><div class="btnDoubleInner">Import images</div></div></li>';
	// html += '<li style="list-style: none;" class="ct-environment-btn ct-btn-import"><div class="nb btn btnDouble blue"><i class="fa fa-download"></i><div class="btnDoubleInner">Import</div></div></li>';
    // html += '<li style="list-style: none;" class="ct-environment-btn ct-btn-stop-import"><div class="nb btn btnDouble blue"><i class="fa fa-ban"></i><div class="btnDoubleInner">Stop import</div></div></li>';
	'<li style="list-style: none;" class="ct-environment-btn ct-btn-open-funcs">' +
		'<div class="nb btn btnDouble blue"><div class="btnDoubleInner">Functions</div><i class="fa fa-chevron-down"></i></div>' +
		'<ul class="ct-btn-table-funcs-list">' +
			'<li style="list-style: none;" class="ct-environment-btn ct-btn-import-from-excel"><div class="nb btn btnDouble blue"><i class="fa fa-upload"></i><div class="btnDoubleInner">Import from Excel</div></div></li>'+
			'<li style="list-style: none;" class="ct-environment-btn ct-btn-export-to-excel"><div class="nb btn btnDouble blue"><i class="fa fa-download"></i><div class="btnDoubleInner">Export to Excel</div></div></li>'+
			'<li style="list-style: none;" class="ct-environment-btn "><div class="ct-btn-export-traits-to-excel nb btn btnDouble blue"><i class="fa fa-download"></i><div class="btnDoubleInner">Export traits to Excel</div></div></li>'+
			'<li style="list-style: none; /*display: none;*/" class="ct-environment-btn ct-btn-import-images"><div class="nb btn btnDouble blue"><i class="fa fa-download"></i><div class="btnDoubleInner">Import images</div></div></li>'+
			'<li style="list-style: none;" class="ct-environment-btn ct-btn-import"><div class="nb btn btnDouble blue"><i class="fa fa-download"></i><div class="btnDoubleInner">Import</div></div></li>'+
			'<li style="list-style: none;" class="ct-environment-btn ct-btn-stop-import"><div class="nb btn btnDouble blue"><i class="fa fa-ban"></i><div class="btnDoubleInner">Stop import</div></div></li>'+
		'</ul>' +
		'</li>';

	insert.prepend(html);
	//Для работы листбокса (скрыть открыть выпадающий список Functions)
	$('.ct-btn-open-funcs').toggleClass('opened');
	$('.ct-btn-table-funcs-list').hide();

	$(".ct-btn-open-funcs").click(function() {
		$('.ct-btn-table-funcs-list').toggle();
	});

	$(document).mouseup(function (e) {
		var container = $('.ct-btn-open-funcs');
		if (container.has(e.target).length === 0){
			$('.ct-btn-table-funcs-list').hide();
		}
	});


	/*
	$(document).mouseup(function (e) {

		var container = $('.ct-btn-open-funcs');
		if (container.has(e.target).length === 0){
			container.toggleClass('opened');
		}
	});
*/

/*
	$(document).on('click', function(e) {
		if (!$(e.target).closest(".ct-btn-open-funcs").length) {
			$('.ct-btn-open-funcs').toggleClass('opened');
		}
		e.stopPropagation();
	});
*/

/*
	$('.ct-btn-open-funcs').click(function() {
		$(this).toggle();
	});
	$(document).on('click', function(e) {
		if (!$(e.target).closest(".parent_block").length) {
			$('.toggled_block').hide();
		}
		e.stopPropagation();
	});*/

/*
	$('.ct-btn-open-funcs').mouseup(function (e) {
		var container = $(this);
		if (container.has(e.target).length === 0){
			container.hide();
		}
	});
*/


    $('.ct-btn-export-to-excel').off('click').on('click', function () {
	    let wheres = MB.Tables.tables[0].ct_instance.filterWhere;

	    let o = {
	        command: 'getTraitsForExport',
	        object: 'taxon',
	        params: {
		        wheres: wheres
	        }
	    };

	    socketQuery(o, (res) => {
		    if (res.code !== 0) {
			    toastr['error']('Something went wrong...');
			    return;
		    }

		    let fields = [
			    {
				    field: 'id',
				    name: 'ID',
				    checked: true,
				    type: 'field'
			    },
			    {
				    field: 'name',
				    name: 'Name',
				    checked: true,
				    type: 'field'
			    },
			    {
				    field: 'gbif_scientificNameAuthorship',
				    name: 'Authorship',
				    checked: true,
				    type: 'field'
			    },
			    {
				    field: 'level_name',
				    name: 'Rank',
				    checked: true,
				    type: 'field'
			    },
			    {
				    field: 'parent_name',
				    name: 'Parent',
				    checked: true,
				    type: 'field'
			    },
			    {
				    field: 'status',
				    name: 'Taxonomic status',
				    checked: true,
				    type: 'field'
			    },
			    {
				    field: 'is_gbif',
				    name: 'GBIF sync',
				    checked: false,
				    type: 'field'
			    },
			    {
				    field: 'has_parameters',
				    name: 'Has parameters',
				    checked: false,
				    type: 'field'
			    },
			    {
				    field: 'approved_by_expert',
				    name: 'Expert approved',
				    checked: false,
				    type: 'field'
			    },
			    {
				    field: 'show_on_site',
				    name: 'Public',
				    checked: false,
				    type: 'field'
			    },
			    {
				    field: 'gbif_synonym',
				    name: 'Synonym',
				    checked: false,
				    type: 'field'
			    },
			    {
				    field: 'gbif_kingdom',
				    name: 'Kingdom',
				    checked: false,
				    type: 'field'
			    },
			    {
				    field: 'gbif_phylum',
				    name: 'Phylum',
				    checked: false,
				    type: 'field'
			    },
			    {
				    field: 'gbif_class',
				    name: 'Class',
				    checked: true,
				    type: 'field'
			    },
			    {
				    field: 'gbif_order',
				    name: 'Order',
				    checked: true,
				    type: 'field'
			    },
			    {
				    field: 'gbif_family',
				    name: 'Family',
				    checked: true,
				    type: 'field'
			    },
			    {
				    field: 'gbif_genus',
				    name: 'Genus',
				    checked: true,
				    type: 'field'
			    },
			    {
				    field: 'created',
				    name: 'Created',
				    checked: false,
				    type: 'field'
			    },
			    {
				    field: 'updated',
				    name: 'Updated',
				    checked: false,
				    type: 'field'
			    },
			    {
				    field: 'msaccess_taxon_id',
				    name: 'msaccess_taxon_id',
				    checked: false,
				    type: 'field'
			    },
			    {
				    field: 'gbif_taxonID',
				    name: 'GBIF_ID',
				    checked: true,
				    type: 'field'
			    },
			    {
				    field: 'actual_taxon',
				    name: 'Actual name',
				    checked: true,
				    type: 'field'
			    },
			    {
				    field: 'similarity_link',
				    name: 'Similarity link',
				    checked: false,
				    type: 'field'
			    },
			    {
				    field: 'custom_name',
				    name: 'Custom name',
				    checked: false,
				    type: 'field'
			    },
			    {
				    field: 'creation_project',
				    name: 'Creation project',
				    checked: false,
				    type: 'field'
			    },
			    {
				    field: 'external_id',
				    name: 'External ID',
				    checked: false,
				    type: 'field'
			    }
		    ];

		    res.traits.forEach(row => {
			    // row.checked = true;
			    row.checked = false;
			    row.type = 'trait';

			    fields.push(row);
		    });

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
			    title: 'Export taxa',
			    message: tpl,
			    buttons: {
				    success: {
					    label: 'Export',
					    callback: function () {
						    let o = {
							    command: 'export_to_excel_table_taxon_v2',
							    object: 'taxon',
							    params: {
								    fields: tce.getData(),
								    limit: +$dialog.find('.number_of_rows').val(),
								    wheres: wheres
							    }
						    };

						    socketQuery(o, (res) => {
							    MB.Tables.tables[0].ct_instance.progress_loading(false);
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
						    MB.Tables.tables[0].ct_instance.progress_loading(false);
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

	    MB.Tables.tables[0].ct_instance.progress_loading(true, 'Export can take up to 10 min.');
    });


	$('.ct-btn-export-traits-to-excel').off('click').on('click', function () {
		let wheres = MB.Tables.tables[0].ct_instance.filterWhere;

		let o = {
			command: 'getTraitsForExport',
			object: 'taxon',
			params: {
				wheres: wheres
			}
		};

		socketQuery(o, (res) => {
			if (res.code !== 0) {
				toastr['error']('Something went wrong...');
				return;
			}

			let fields = [
				{
					field: 'name',
					name: 'Name',
					checked: true,
					type: 'field'
				}
			];

			res.traits.forEach(row => {
				// row.checked = true;
				row.checked = false;
				row.type = 'trait';

				fields.push(row);
			});

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
				title: 'Export taxa',
				message: tpl,
				buttons: {
					success: {
						label: 'Export',
						callback: function () {
							let o = {
								command: 'export_to_excel_table_traits_taxon',
								object: 'taxon',
								params: {
									fields: tce.getData(),
									limit: +$dialog.find('.number_of_rows').val()
								}
							}

							let selected_ids = []

							if (tableInstance.ct_instance.selection2.data)
								selected_ids = tableInstance.ct_instance.selection2.data.map(trait => trait.id)

							if (selected_ids.length > 0)
								o.params.ids = selected_ids
							else
								o.params.wheres = wheres

							socketQuery(o, (res) => {
								MB.Tables.tables[0].ct_instance.progress_loading(false);
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
							MB.Tables.tables[0].ct_instance.progress_loading(false);
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

		MB.Tables.tables[0].ct_instance.progress_loading(true, 'Export can take up to 10 min.');
	});
	// ct-btn-export-traits-to-excel


	$('.ct-btn-import-from-excel').off('click').on('click', function () {

		bootbox.dialog({
			title: 'Import from Excel',
			// message: '<div class="form-group"><label>Taxon ID:</label><input type="number" class="form-control" id="taxon-id-for-import"/></div>',
			// message: 'Необходимо будет выбрать файл соответствующего формата. Нажмите "Select file and start" для начала процесса',
			message: 'You will need to select a file of the appropriate format. Click "Select file and start" to start the process.',
			buttons: {
				success: {
					label: 'Select file and start',
					callback: function () {
						// let tmp_data = JSON.parse(`{"code":0,"toastr":{"message":"Ок","type":"success","title":"Ок"},"errors":[{"message":"\\"Amblyoponinae\\": No such taxa in GBIF, check spelling."},{"message":"\\"Cerapachyinae\\": No such taxa in GBIF, check spelling."},{"message":"\\"Ceraphachys\\": No such taxa in GBIF, check spelling."},{"message":"\\"Dorylinae\\": No such taxa in GBIF, check spelling."}],"new_traits":[{"name":"Test Trait #10.0","categories":["absent","present"]}],"new_taxons":["Stigmatomma","Prionopelta","Aenictus","Dorylus"],"time":57381}`);
						//
						//
						// let tpl;
						//
						// if (tmp_data.errors && tmp_data.errors.length) {
						//     tpl = `<b>The following problems occurred during the upload:</b>`;
						//     tpl += `<ul>`;
						//
						//     tmp_data.errors.forEach(row => {
						//         if ('i' in row) {
						//             tpl += `<li>Cell ${row.j}${row.i}: ${row.message}</li>`;
						//         } else {
						//             tpl += `<li>${row.message}</li>`;
						//         }
						//     });
						//
						//     tpl += `</ul>`;
						// }
						//
						// if (tmp_data.new_taxons.length) {
						//     tpl += `<b>${tmp_data.new_taxons.length} new taxa were successfully added:</b>`;
						//     tpl += `<ul>`;
						//
						//     tmp_data.new_taxons.forEach(row => {
						//         tpl += `<li>${row}</li>`;
						//     });
						//
						//     tpl += `</ul>`;
						// }
						//
						// if (tmp_data.new_traits.length) {
						//     let tc_n = 0;
						//
						//     tmp_data.new_traits.forEach(row => {
						//        tc_n += row.categories.length;
						//     });
						//
						//     tpl += `<b>${tmp_data.new_traits.length} new identification characters and ${tc_n} categories were successfully added:</b>`;
						//     tpl += `<ul>`;
						//
						//     tmp_data.new_traits.forEach(row => {
						//         tpl += `<li><p>${row.name}</p><ul>`;
						//
						//         row.categories.forEach(row2 => {
						//             tpl += `<li>${row2}</li>`;
						//         });
						//
						//         tpl += `</ul></li>`;
						//     });
						//
						//     tpl += `</ul>`;
						// }
						//
						// bootbox.dialog({
						//     title: 'Import from Excel',
						//     message: tpl,
						//     buttons: {
						//         success: {
						//             label: 'Ok',
						//             callback: function () {
						//
						//             }
						//         }
						//     }
						// });

						// if (tmp_data) return;

						var fl = new ImageLoader({
							multiple: false,
							success: function (file) {
								// var pc = this.InProcessCounter;
								console.log(file);
								var o = {
									command: 'importFromExcel_v2',
									object: 'Taxon',
									params: {
										filename: file.dirname + '/' + file.name,
										pic_dir: null,
										do_not_set_diagnosis: true,
										do_not_import_from_gbif: false,
										do_not_sync_with_gbif: false,
										author: null
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

									if (data.new_taxons && data.new_taxons.length) {
										tpl += `<b>${data.new_taxons.length} new taxa were successfully added:</b>`;
										tpl += `<ul>`;

										data.new_taxons.forEach(row => {
											tpl += `<li>${row}</li>`;
										});

										tpl += `</ul>`;
									}

									if (data.new_traits && data.new_traits.length) {
										let tc_n = 0;

										data.new_traits.forEach(row => {
											tc_n += row.categories.length;
										});

										tpl += `<b>${data.new_traits.length} new identification characters and ${tc_n} categories were successfully added:</b>`;
										tpl += `<ul>`;

										data.new_traits.forEach(row => {
											tpl += `<li>${row.name}<ul>`;

											row.categories.forEach(row2 => {
												tpl += `<li>${row2}</li>`;
											});

											tpl += `</ul></li>`;
										});

										tpl += `</ul>`;
									}

									if (!tpl || !tpl.length) {
										if (data.code === 0) {
											tpl = 'Updated successfuly.';
										} else {
											tpl = 'Something went wrong. Contact with administrator.';
										}
									}

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

	$('.ct-btn-import-images').off('click').on('click', function () {

		bootbox.dialog({
			title: 'Import images',
			// message: '<div class="form-group"><label>Taxon ID:</label><input type="number" class="form-control" id="taxon-id-for-import"/></div>',
			// message: 'Необходимо будет выбрать файл соответствующего формата. Нажмите "Select file and start" для начала процесса',
			message: 'Images will be imported from the specified directory',
			buttons: {
				success: {
					label: 'Start',
					callback: function () {
						var o = {
							command: 'importImages',
							object: 'Taxon',
							params: {
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

    $('.ct-btn-import').off('click').on('click', function () {

        bootbox.dialog({
            title: 'Import from Access',
            message: '<div class="form-group"><label>Taxon ID:</label><input type="number" class="form-control" id="taxon-id-for-import"/></div>',
            buttons: {
                success: {
                    label: 'Start import',
                    callback: function () {

                        var id = $('#taxon-id-for-import').val();

                        if(id.length > 0){
                            var o = {
                                command:'msaccessImportNode',
                                object:'Taxon',
                                params:{
                                    msaccess_taxon_id: +id,
                                    collapseData:false
                                }
                            };
                            socketQuery(o, function(res){

                                console.log(res);

                            });

                        }else{

                            toastr['error']('Please, specify the taxon id');

                        }



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

    $('.ct-btn-stop-import').off('click').on('click', function () {

        bootbox.dialog({
            title: 'Stop import?',
            message: 'Are you sure?',
            buttons: {
                success: {
                    label: 'Stop import',
                    callback: function () {


                        var o = {
                            command:'STOPmsaccessImportNode',
                            object:'Taxon',
                            params:{}
                        };
                        socketQuery(o, function(res){

                            console.log(res);

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

}());
