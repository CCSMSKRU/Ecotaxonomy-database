
function getFieldsValues(selector) {
	let type = $(selector).attr('data-type');
	let name = $(selector).attr('data-column');

	switch (type) {
		case 'wysiwyg':
			tinyMCE.triggerSave();
			return {
				name: name,
				value: $(selector).find('textarea').val()
			};
		case 'textarea':
		case 'plain_text':
			return {
				name: name,
				value: $(selector).find('textarea').val()
			};
		case 'number':
		case 'float2':
			return {
				name: name,
				value: +$(selector).find('input').val()
			};
		case 'text':
			return {
				name: name,
				value: $(selector).find('input').val()
			};
		case 'checkbox':
			return {
				name: name,
				value: $(selector).find('.checkbox-wrapper').hasClass('checked')
			};
		case 'datetime':
			return {
				name: name,
				value: $(selector).find('input').val()
			};
		case 'date':
			return {
				name: name,
				value: $(selector).find('input').val()
			};
		case 'time':
			return {
				name: name,
				value: $(selector).find('input').val()
			};
		case 'select2':
		case 'select2withEmptyValue':
			return {
				name: $(selector).find('select').attr('data-keyword'),
				value: +$(selector).find('select').val()
			};
	}
}

function renderField(field, addVertOrient) {
	let html;

	field.required = field.required ? 'required' : '';

	switch (field.type_of_editor) {
		case 'textarea':
		case 'plain_text':
			html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<textarea class="fn-control" data-column="${field.column_name}"></textarea>
						</div>`;
			break;
		case 'wysiwyg':
			html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<textarea rows="10" class="fn-control wysiwyg-wrapper" data-column="${field.column_name}" data-id="${MB.Core.guid()}"></textarea>
						</div>`;
			break;
		case 'number':
			html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<input type="number" class="fn-control" data-column="${field.column_name}" />
						</div>`;
			break;
		case 'float2':
			html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<input type="number" step="0.01" class="fn-control" data-column="${field.column_name}" />
						</div>`;
			break;
		case 'text':
			html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<input type="text" class="fn-control" data-column="${field.column_name}" />
						</div>`;
			break;
		case 'checkbox':
			html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label class="fn-checkbox-label">${field.name}: <span class="required-star">*</span></label>
							<div data-id="${MB.Core.guid()}" data-type="inline" class="fn-control checkbox-wrapper" data-column="${field.column_name}"></div>
						</div>`;
			break;
		case 'datetime':
			html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<input type="text" class="fn-control fn-datetime-wrapper" data-column="${field.column_name}" data-date-format="dd.mm.yyyy hh:ii:ss">
						</div>`;
			break;
		case 'date':
			html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<input type="text" class="fn-control fn-date-wrapper" data-column="${field.column_name}" data-date-format="dd.mm.yyyy">
						</div>`;
			break;
		case 'time':
			html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<input type="text" class="fn-control fn-time-wrapper" data-column="${field.column_name}" data-date-format="hh:ii:ss">
						</div>`;
			break;
		case 'select2':
		case 'select2withEmptyValue':
			html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<select data-select-type="select2" data-column="${field.column_name}" class="fn-control" 
							data-select-return-name="${field.select_return_name}" data-select-class="${field.select_class}" data-keyword="${field.keyword}"></select>
						</div>`;
			break;
		default:
			html = `<div data-type="${field.type_of_editor}" class="fn-field" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<input type="text" class="fn-control" data-column="${field.name}" /></div>`;
	}

	if (addVertOrient)
		return `<div class="vert-orient" data-type="${field.type_of_editor}">${html}</div>`;

	return html;
}

function initFields(selector) {
	$(selector).find('.fn-field').each((i, e) => {
		let elem = $(e);
		let type = elem.attr('data-type');

		switch (type) {
			case 'checkbox':
				elem.find('.checkbox-wrapper').checkboxIt();
				break;
			case 'datetime':
				elem.find('input[type="text"]').datetimepicker({
					autoclose: true,
					todayHighlight: true,
					minuteStep: 10,
					keyboardNavigation: false,
					todayBtn: true,
					firstDay: 1,
					weekStart: 1,
					language: "en"
				});
				break;
			case 'date':
				elem.find('input[type="text"]').datetimepicker({
					autoclose: true,
					todayHighlight: true,
					minuteStep: 10,
					keyboardNavigation: false,
					todayBtn: true,
					firstDay: 1,
					weekStart: 1,
					language: "en",
					minView: 2,
					maxView: 2,
					pickTime: false,
					format: 'dd.mm.yyyy'
				});
				break;
			case 'time':
				let fldDate = elem.find('input[type="text"]');
				fldDate.clockpicker({
					align: 'top',
					placement: 'top',
					donetext: 'Select',
					autoclose: true,
					afterDone: function () {
						let val = fldDate.val();
						if (val.length === 5) fldDate.val(val + ':00');
					}
				});
				break;
			case 'select2':
			case 'select2withEmptyValue':
				let limit = 100;
				let select = elem.find('select');
				let select_class = select.attr('data-select-class');
				let select_return_name = select.attr('data-select-return-name');

				select.select2({
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
									collapseData: false,
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
				});
				break;
			case 'wysiwyg':
				let field_id = elem.find('textarea').attr('data-id');

				tinymce.init({
					selector: `.wysiwyg-wrapper[data-id="${field_id}"]`,
					height: 150
				});

				break;
		}
	});
}

function initFields2(selector, object, instance, use_parent_key_arr) {

	selector.find('.fn-field').each((i, e) => {
		let elem = $(e);
		let type = elem.attr('data-type');
		let column_name = elem.attr('data-column');

		// console.log(object, column_name, type);

		switch (type) {
			case 'textarea':
			case 'plain_text':
				elem.find('textarea').val(object[column_name]).off('input').on('input', function (e) {
					instance.addChange({
						object: object,
						column_name: column_name,
						type: type,
						value: {
							value: $(e.target).val(),
							selValue: ''
						}
					});
				});
				break;
			case 'number':
			case 'float2':
			case 'text':
				elem.find('input').val(object[column_name]).off('input').on('input', function (e) {
					instance.addChange({
						object: object,
						column_name: column_name,
						type: type,
						value: {
							value: $(e.target).val(),
							selValue: ''
						}
					});
				});
				break;
			case 'checkbox':
				elem.find('.checkbox-wrapper').checkboxIt();
				break;
			case 'datetime':
				elem.find('input[type="text"]').val(object[column_name]).datetimepicker({
					autoclose: true,
					todayHighlight: true,
					minuteStep: 10,
					keyboardNavigation: false,
					todayBtn: true,
					firstDay: 1,
					weekStart: 1
				}).on("changeDate", function(e) {
					instance.addChange({
						object: object,
						column_name: column_name,
						type: type,
						value: {
							value: $(e.target).val(),
							selValue: ''
						}
					});
				});

				elem.find('input').off('input').on('input', function (e) {
					instance.addChange({
						object: object,
						column_name: column_name,
						type: type,
						value: {
							value: $(e.target).val(),
							selValue: ''
						}
					});
				});
				break;
			case 'date':
				elem.find('input[type="text"]').val(object[column_name]).datetimepicker({
					autoclose: true,
					todayHighlight: true,
					minuteStep: 10,
					keyboardNavigation: false,
					todayBtn: true,
					firstDay: 1,
					weekStart: 1,
					// minView: 2,
					// maxView: 2,
					pickTime: false,
					format: 'dd.mm.yyyy'
				}).on("changeDate", function(e) {
					instance.addChange({
						object: object,
						column_name: column_name,
						type: type,
						value: {
							value: $(e.target).val(),
							selValue: ''
						}
					});
				});

				elem.find('input').off('input').on('input', function (e) {
					instance.addChange({
						object: object,
						column_name: column_name,
						type: type,
						value: {
							value: $(e.target).val(),
							selValue: ''
						}
					});
				});
				break;
			case 'time':
				let fldDate = elem.find('input[type="text"]');
				fldDate.clockpicker({
					align: 'top',
					placement: 'top',
					donetext: 'Select',
					autoclose: true,
					afterDone: function () {
						let val = fldDate.val();
						if (val.length === 5) fldDate.val(val + ':00');
					}
				});
				break;
			case 'select2':
			case 'select2withEmptyValue':
				let limit = 100;
				let select = elem.find('select');
				let select_class = select.attr('data-select-class');
				let select_return_name = select.attr('data-select-return-name');
				let select_data_keyword = select.attr('data-keyword');

				// console.log(object, select_data_keyword);

				select.select2({
					data: [{
						id: object[select_data_keyword],
						text: object[column_name],
						selected: true
					}],
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
									collapseData: false,
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


                            if(use_parent_key_arr && use_parent_key_arr.indexOf(column_name) > -1 && instance.parent_ids_key && instance.parent_ids_type && instance.parent_ids_value){

                                o.params.where.push({
                                    key: instance.parent_ids_key,
                                    type: instance.parent_ids_type,
                                    val1: instance.parent_ids_value
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
				}).on('select2:select', function (e) {
					let data = e.params.data;

					instance.addChange({
						object: object,
						column_name: select_data_keyword,
						type: type,
						value: {
							value: data.id,
							selValue: ''
						}
					});
				}).on('select2:unselect', function () {
					instance.addChange({
						object: object,
						column_name: select_data_keyword,
						type: type,
						value: {
							value: null,
							selValue: ''
						}
					});
				});
				break;
			case 'wysiwyg':
				let field_id = elem.find('textarea').attr('data-id');

				elem.find('textarea').val(object[column_name]);
				tinymce.init({
					selector: `.wysiwyg-wrapper[data-id="${field_id}"]`,
					height: 150,
					setup: function (ed) {
						ed.on('change', function (e) {

							instance.addChange({
								object: object,
								column_name: column_name,
								type: type,
								value: {
									value: ed.getContent(),
									selValue: ''
								}
							});
						});
					}
				});
				break;
		}
	});
}

//Используется в form_project.js
function getFieldsForRendering(class_name, fields, cb) {
	// console.log('getFieldsForRendering', class_name, fields);

	if (!class_name) return;
	if (!fields) return;

	let class_id;

	let select_class;
	let select_return_name;

	let select_class_id;
	let select_autocomplete_columns;

	let columns_data = [];

	let fields_html = '';

	async.series({
		// getClassId: cb => {
		// 	// let o = {
		// 	// 	command: 'get',
		// 	// 	object: 'class_profile',
		// 	// 	params: {
		// 	// 		param_where: {
		// 	// 			name: class_name
		// 	// 		},
		// 	// 		collapseData: false
		// 	// 	}
		// 	// };
        //
         //    let o = {
         //        command: 'getProfile',
         //        object: class_name,
         //        params: {
         //            // param_where: {
         //            //     name: class_name
         //            // },
         //            // collapseData: false
         //        }
         //    };
        //
		// 	socketQuery(o, function (res) {
		// 		if (res && res.length) {
		//
		// 			class_id = res[0].id;
        //
		// 			cb(null);
		// 		} else {
		// 			cb('Class not found');
		// 		}
		// 	});
		// },
		// getFieldsProfile: cb => {
		// 	let o = {
		// 		command: 'get',
		// 		object: 'class_fields_profile',
		// 		params: {
		// 			param_where: {
		// 				class_id: class_id
		// 			},
		// 			where: [
		// 				{
		// 					key: 'column_name',
		// 					type: 'in',
		// 					val1: fields
		// 				}
		// 			],
		// 			sort: 'sort_no',
		// 			collapseData: false
		// 		}
		// 	};
		// 	socketQuery(o, function (res) {
		// 		if (res && res.length) {
		// 			fields.forEach(column_name => {
		// 				for (const column of res) {
		// 					if (column.column_name === column_name) {
		// 						columns_data.push({
		// 							class: column.class,
		// 							select_class: column.select_class,
		// 							select_class_id: column.select_class_id,
		// 							select_return_name: column.return_name || column.return_column,
		// 							keyword: column.keyword,
		// 							name: column.name,
		// 							column_name: column.column_name,
		// 							type_of_editor: column.type_of_editor,
		// 							type_of_editor_id: column.type_of_editor_id,
		// 							type: column.type,
		// 							required: column.required
		// 						});
		// 						break;
		// 					}
		// 				}
		// 			});
        //
		// 			cb(null);
		// 		} else {
		// 			cb('Class not found');
		// 		}
		// 	});
		// },
        getProfile: (cb) => {
            let o = {
                command: 'getProfile',
                object: class_name,
                params: {}
            };
            socketQuery(o, (res) => {
                if (res.code) return cb(new MyError(res))
                Object.values(res.data).forEach(column => {
                    if (fields.indexOf(column.column_name) === -1) return
                    columns_data.push({
                        class: column.class,
                        select_class: column.select_class,
                        select_class_id: column.select_class_id,
                        select_return_name: column.return_name || column.return_column,
                        keyword: column.keyword,
                        name: column.name,
                        column_name: column.column_name,
                        type_of_editor: column.type_of_editor,
                        type_of_editor_id: column.type_of_editor_id,
                        type: column.type,
                        required: column.required
                    });
                })
                console.log('columns_data', columns_data);
                cb(null)

            })

        },
		renderFields: cb => {
			columns_data.forEach(row => {
				fields_html += renderField(row, true);
			});

			cb(null);
		}
	}, (err, res) => {
		// console.log('getFieldsForRendering', err, res);

		cb({
			html: fields_html,
			select_class: select_class,
			select_return_name: select_return_name
		});
	})
}

function getFieldsForAdding(class_name, field_name, cb) {
	// console.log('getFieldsForAdding', class_name, field_name);

	if (!class_name) return;
	if (!field_name) return;

	let class_id;

	let select_class;
	let select_return_name;

	let select_class_id;
	let select_autocomplete_columns;

	let columns_data = [];

	let fields_html = '';

	async.series({
		getClassId: cb => {
			let o = {
				command: 'get',
				object: 'class_profile',
				params: {
					param_where: {
						name: class_name
					},
					collapseData: false
				}
			};
			socketQuery(o, function (res) {
				if (res && res.length) {
					class_id = res[0].id;

					cb(null);
				} else {
					cb('Class not found');
				}
			});
		},
		getFields: cb => {
			let o = {
				command: 'get',
				object: 'class_fields_profile',
				params: {
					param_where: {
						class_id: class_id,
						column_name: field_name
					},
					collapseData: false
				}
			};
			socketQuery(o, function (res) {
				if (res && res.length) {
					let profile = res[0];

					select_class = profile.select_class;
					select_return_name = profile.return_name || profile.return_column;

					select_class_id = profile.select_class_id;
					select_autocomplete_columns = profile.select_autocomplete_columns.split(',').map(row => {
						return row ? row.trim() : '';
					});

					cb(null);
				} else {
					cb('Class not found');
				}
			});
		},
		getFieldsProfile: cb => {
			let o = {
				command: 'get',
				object: 'class_fields_profile',
				params: {
					param_where: {
						class_id: select_class_id
					},
					where: [
						{
							key: 'column_name',
							type: 'in',
							val1: select_autocomplete_columns
						}
					],
					sort: 'sort_no',
					collapseData: false
				}
			};
			socketQuery(o, function (res) {
				if (res && res.length) {
					res.forEach(row => {
						columns_data.push({
							class: row.class,
							select_class: row.select_class,
							select_class_id: row.select_class_id,
							select_return_name: row.return_name || row.return_column,
							keyword: row.keyword,
							name: row.name,
							column_name: row.column_name,
							type_of_editor: row.type_of_editor,
							type_of_editor_id: row.type_of_editor_id,
							type: row.type,
							required: row.required
						})
					});

					cb(null);
				} else {
					cb('Class not found');
				}
			});
		},
		renderFields: cb => {
			columns_data.forEach(row => {
				fields_html += renderField(row);
			});

			cb(null);
		}
	}, (err, res) => {
		// console.log('getFieldsForAdding', err, res);

		cb({
			html: fields_html,
			select_class: select_class,
			select_return_name: select_return_name
		});
	})
}

function initSelect2WithAdding(selector, data, class_name, field_name, g_cb) {
	let loaded_for_adding = false;
	let select_class;
	let select_return_name;
	let fields_html;
	let adding_form_id = MB.Core.guid();

	$(selector).select2({
		data: data || [],
		placeholder: 'Select value...',
		allowClear: true,
		tags: true,
		createTag: function (params) {
			let term = $.trim(params.term);

			if (term === '') {
				return null;
			}

			return {
				id: term,
				text: term + ": click here to add new",
				newTag: true // add additional parameters
			}
		},
		insertTag: function (data, tag) {
			data.push(tag);
		}
	}).on('select2:select', function (e) {
		let data = e.params.data;
		// console.log('select', data);

		if (data.newTag) {
			async.series({
				loadForAdding: cb => {
					if (loaded_for_adding) return cb(null);

					getFieldsForAdding(class_name, field_name, (obj) => {
						select_return_name = obj.select_return_name;
						select_class = obj.select_class;
						fields_html = obj.html;

						loaded_for_adding = true;

						cb(fields_html ? null : 'Error while generating HTML');
					});
				},
				showBootBox: cb => {
					let dialog = bootbox.dialog({
						title: 'Adding new option',
						message: `<div class="adding_new_option" data-id="${adding_form_id}">${fields_html}</div>`,
						className: 'wide-modal',
						buttons: {
							success: {
								label: 'Save',
								className: 'modal-save-button',
								callback: function () {
									let values = [];

									$(`.adding_new_option[data-id="${adding_form_id}"] .fn-field`).each((i, e) => {
										values.push(getFieldsValues(e));
									});

									// console.error(`.adding_new_option[data-id="${adding_form_id}"] .fn-field`, values, select_return_name);

									let o = {
										command: 'add',
										object: select_class,
										params: {}
									};

									let n = 0;
									let value;

									values.forEach(row => {
										if (row.name && row.value != undefined) {
											o.params[row.name] = row.value;
											n++;

											if (row.name === select_return_name) value = row.value;
										}
									});

									if (n && value) {
										socketQuery(o, (res) => {
											// console.error(res);

											if (res && res.id) {
												let newOption = new Option(value, res.id, false, true);
												$(selector).append(newOption).trigger('change');
											}
										});
									} else {
										// console.error(n, value);
									}

									$(selector).find('option[data-select2-tag="true"]').remove();
								}
							},
							error: {
								label: 'Exit',
								callback: function () {
									$(selector).find('option[data-select2-tag="true"]').remove();
								}
							}
						}
					}).on('shown.bs.modal', function () {
						initFields(dialog);

						if (typeof g_cb === 'function') g_cb(dialog);
					});

					cb(null);
				}
			}, (err, res) => {
				// console.log('initSelect2WithAdding', err, res);
			});
		} else {

		}
	});
}

// Used for custom filtering
// @param obj = { selector, class_name, return_field }
// @param obj.params - ref select2 docs (multiple, minimumInputLength etc...)
function initCustomSelect(obj) {
	const {
		selector,
		class_name,
		select_params,
		parent_id,
        filters_holder,
		dependant_field,
		dependant_fields,
		placeholder = select_params && select_params.multiple ? 'Select values...' : 'Select value...',
		class_method = 'get',
		return_field = 'name'
	} = obj;

	selector.select2({
		allowClear: true,
		placeholder,
		...select_params,
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
                        o.params.where.push({
							key: field.name,
							type: 'in',
							val1: filters_holder[field.values].map(data => data.id)
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
							data.push({
								id: record.id,
								text: record[return_field]
							})
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
	});

	return selector;
}

(function () {

	function box_AddDelete(id, dialog, cb) {
		// console.error('box_AddDelete', id, dialog);

		$(dialog).find('.box_wrapper').append(`<div class="delete_factor green_bttn_style red big" style=""><i class="fa fa-trash-o"></i>&nbsp;&nbsp;Delete</div>`);

		$(dialog).find('.delete_factor').off('click').on('click', () => {
			let o = {
				command: 'remove',
				object: 'plot_factor',
				params: {
					id: id
				}
			};

			socketQuery(o, () => {
				if (cb) cb();
				$(dialog).modal('hide');
			})
		});
	}

	function box_renderField(field) {
		let html;

		field.required = field.required ? 'required' : '';

		switch (field.type_of_editor) {
			case 'textarea':
			case 'plain_text':
				html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<textarea class="fn-control" data-column="${field.column_name}"></textarea>
						</div>`;
				break;
			case 'wysiwyg':
				html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<textarea rows="10" class="fn-control wysiwyg-wrapper" data-column="${field.column_name}" data-id="${MB.Core.guid()}"></textarea>
						</div>`;
				break;
			case 'number':
				html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<input type="number" class="fn-control" data-column="${field.column_name}" />
						</div>`;
				break;
			case 'float2':
				html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<input type="number" step="0.01" class="fn-control" data-column="${field.column_name}" />
						</div>`;
				break;
			case 'text':
				html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<input type="text" class="fn-control" data-column="${field.column_name}" />
						</div>`;
				break;
			case 'checkbox':
				html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label class="fn-checkbox-label">${field.name}: <span class="required-star">*</span></label>
							<div data-id="${MB.Core.guid()}" data-type="inline" class="fn-control checkbox-wrapper" data-column="${field.column_name}"></div>
						</div>`;
				break;
			case 'datetime':
				html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<input type="text" class="fn-control fn-datetime-wrapper" data-column="${field.column_name}" data-date-format="dd.mm.yyyy hh:ii:ss">
						</div>`;
				break;
			case 'date':
				html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<input type="text" class="fn-control fn-date-wrapper" data-column="${field.column_name}" data-date-format="dd.mm.yyyy">
						</div>`;
				break;
			case 'time':
				html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<input type="text" class="fn-control fn-time-wrapper" data-column="${field.column_name}" data-date-format="hh:ii:ss">
						</div>`;
				break;
			case 'select2':
			case 'select2withEmptyValue':
				html = `<div data-type="${field.type_of_editor}" class="fn-field ${field.required}" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<select data-select-type="select2" data-column="${field.column_name}" class="fn-control" 
							data-select-return-name="${field.select_return_name}" data-select-class="${field.select_class}" data-keyword="${field.select_keyword}"></select>
						</div>`;
				break;
			default:
				html = `<div data-type="${field.type_of_editor}" class="fn-field" data-column="${field.column_name}">
							<label>${field.name}: <span class="required-star">*</span></label>
							<input type="text" class="fn-control" data-column="${field.name}" /></div>`;
		}

		return html;
	}

	function box_initFields(form_id, field) {
		let value = field.value;
		let data = field.data;

		let elem = $(`.adding_new_option[data-id='${form_id}'] .fn-field[data-column='${data.column_name}']`);

		switch (data.type_of_editor) {
			case 'textarea':
			case 'plain_text':
				elem.find('textarea').val(value);
				break;
			case 'text':
			case 'float2':
			case 'number':
				elem.find('input').val(value);
				break;
			case 'checkbox':
				elem.find('.checkbox-wrapper').checkboxIt();
				break;
			case 'datetime':
				elem.find('input').val(value);
				elem.find('input[type="text"]').datetimepicker({
					autoclose: true,
					todayHighlight: true,
					minuteStep: 10,
					keyboardNavigation: false,
					todayBtn: true,
					firstDay: 1,
					weekStart: 1,
					language: "en"
				});
				break;
			case 'date':
				elem.find('input').val(value);
				elem.find('input[type="text"]').datetimepicker({
					autoclose: true,
					todayHighlight: true,
					minuteStep: 10,
					keyboardNavigation: false,
					todayBtn: true,
					firstDay: 1,
					weekStart: 1,
					language: "en",
					minView: 2,
					maxView: 2,
					pickTime: false,
					format: 'dd.mm.yyyy'
				});
				break;
			case 'time':
				elem.find('input').val(value);
				let fldDate = elem.find('input[type="text"]');
				fldDate.clockpicker({
					align: 'top',
					placement: 'top',
					donetext: 'Select',
					autoclose: true,
					afterDone: function () {
						let val = fldDate.val();
						if (val.length === 5) fldDate.val(val + ':00');
					}
				});
				break;
			case 'select2':
			case 'select2withEmptyValue':
				let limit = 100;
				let select = elem.find('select');
				let select_class = select.attr('data-select-class');
				let select_return_name = select.attr('data-select-return-name');

				let data = [];

				if (value) {
					data.push({
						id: value.id,
						text: value.text,
						selected: true
					})
				}

				select.select2({
					data: data,
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
									where: [],
									limit: limit,
									page_no: params.data.page || 1,
									collapseData: false
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
				});
				break;
			case 'wysiwyg':
				let field_id = elem.find('textarea').attr('data-id');

				elem.find('textarea').val(value);
				tinymce.init({
					selector: `.wysiwyg-wrapper[data-id="${field_id}"]`,
					height: 150
				});

				break;
		}
	}

	function box_getFieldsValues(selector) {
		let type = $(selector).attr('data-type');
		let name = $(selector).attr('data-column');

		switch (type) {
			case 'wysiwyg':
				tinyMCE.triggerSave();
				return {
					name: name,
					value: $(selector).find('textarea').val()
				};
			case 'textarea':
			case 'plain_text':
				return {
					name: name,
					value: $(selector).find('textarea').val()
				};
			case 'number':
			case 'float2':
				return {
					name: name,
					value: +$(selector).find('input').val()
				};
			case 'text':
				return {
					name: name,
					value: $(selector).find('input').val()
				};
			case 'checkbox':
				return {
					name: name,
					value: $(selector).find('.checkbox-wrapper').hasClass('checked')
				};
			case 'datetime':
				return {
					name: name,
					value: $(selector).find('input').val()
				};
			case 'date':
				return {
					name: name,
					value: $(selector).find('input').val()
				};
			case 'time':
				return {
					name: name,
					value: $(selector).find('input').val()
				};
			case 'select2':
			case 'select2withEmptyValue':
				return {
					name: $(selector).find('select').attr('data-keyword'),
					value: +$(selector).find('select').val()
				};
		}
	}

	MB.Box = function (params) {
		let id = params.id;
		let box_title = params.box_title;
		let class_name = params.class_name;
		let fields = params.fields;
		let with_delete = params.with_delete;

		let cb_final = params.cb_final;
		let cb_box_inited = params.cb_box_inited;
		let cb_deleted = params.cb_deleted;

		if (!class_name) return;
		if (!fields) return;

		let form_id = MB.Core.guid();

		let fields_html = '';

		async.series({
			getFieldsData: cb => {
				let class_id;

				async.series({
					getClassId: cb => {
						let o = {
							command: 'get',
							object: 'class_profile',
							params: {
								param_where: {
									name: class_name
								},
								collapseData: false
							}
						};
						socketQuery(o, function (res) {
							if (res && res.length) {
								class_id = res[0].id;

								cb(null);
							} else {
								cb('Class not found');
							}
						});
					},
					getFieldsProfile: cb => {
						let o = {
							command: 'get',
							object: 'class_fields_profile',
							params: {
								param_where: {
									class_id: class_id
								},
								where: [
									{
										key: 'column_name',
										type: 'in',
										val1: fields.map(row => {
											return row.name
										})
									}
								],
								collapseData: false
							}
						};
						socketQuery(o, function (res) {
							if (res && res.length) {
								res.forEach(row => {

									for (let field of fields) {
										if (field.name === row.column_name) {
											field.data = {
												class: row.class,

												name: row.name,
												column_name: row.column_name,
												type_of_editor: row.type_of_editor,
												type_of_editor_id: row.type_of_editor_id,
												type: row.type,
												required: row.required,

												select_class: row.select_class,
												select_class_id: row.select_class_id,
												select_keyword: row.keyword,
												select_return_name: row.return_name || row.return_column
											};
										}
									}
								});

								cb(null);
							} else {
								cb('Class not found');
							}
						});
					}
				}, (err, res) => {
					// console.log(fields);

					cb(err);
				})
			},
			renderFields: cb => {
				fields.forEach(field => {
					if (field.data) fields_html += box_renderField(field.data);
				});

				cb(null);
			},
			renderBootBox: cb => {
				let dialog = bootbox.dialog({
					title: box_title,
					message: `<div class="adding_new_option box_wrapper" data-id="${form_id}">${fields_html}</div>`,
					className: 'wide-modal',
					buttons: {
						cancel: {
							label: 'Exit',
							callback: function () {
								if (cb_final) cb_final(false);
							}
						},
						ok: {
							label: 'Save',
							callback: function () {
								let values = [];

								$(`.adding_new_option[data-id="${form_id}"] .fn-field`).each((i, e) => {
									values.push(box_getFieldsValues(e));
								});

								let o = {
									command: isNaN(+id) ? 'add' : 'modify',
									object: class_name,
									params: {}
								};

								if (o.command === 'modify') o.params.id = +id;

								let n = 0;

								values.forEach(row => {
									if (row.name && row.value != undefined) {
										o.params[row.name] = row.value;
										n++;
									}
								});

								if (n) {
									socketQuery(o, (res) => {
										if (cb_final) cb_final(true, res.id);
									});
								} else {
									if (cb_final) cb_final(false);
								}

							}
						}
					}
				}).on('shown.bs.modal', function () {
					dialog.removeAttr("tabindex");

					fields.forEach(field => {
						if (field.data) fields_html += box_initFields(form_id, field);
					});

					if (id && with_delete) box_AddDelete(id, dialog, cb_deleted);

					if (cb_box_inited) cb_box_inited(dialog);

					cb(null);
				});
			}
		}, () => {

		});
	};

}());


(function () {
	MB.LitData = {
		getTPL: () => {
			let tpl = `
				<div class="lit-holder">
					<div class="lit_content">
						<div class="lit_left lit_content_column">
							<div class="select_wrapper"></div>                         
							<textarea class="form-control" id="lit-input">{{bibtex}}</textarea>
							<div class="lit-data-output-holder">
								<div contenteditable="true" class="lit-data-output">{{apa}}</div>
							</div>
						</div>
						<div class="lit-fields lit_content_column">
							<div class="lit-fld" data-type="type"><div class="lit-fld-name">Type:</div><input type="text" class="lit-fld-value form-control" value="{{type}}"/></div>                            
							<div class="lit-fld" data-type="article"><div class="lit-fld-name">Short name:</div><input type="text" class="lit-fld-value form-control" value="{{article}}"/></div>                            
							<div class="lit-fld" data-type="title"><div class="lit-fld-name">title:</div><input type="text" class="lit-fld-value form-control" value="{{title}}"/></div>                            
							<div class="lit-fld" data-type="author"><div class="lit-fld-name">author:</div><input type="text" class="lit-fld-value form-control" value="{{author}}"/></div>                            
							<div class="lit-fld" data-type="journal"><div class="lit-fld-name">journal:</div><input type="text" class="lit-fld-value form-control" value="{{journal}}"/></div>                                          
							<div class="lit-fld" data-type="volume"><div class="lit-fld-name">volume:</div><input type="text" class="lit-fld-value form-control " value="{{volume}}"/></div>                            
							<div class="lit-fld" data-type="number"><div class="lit-fld-name">number:</div><input type="text" class="lit-fld-value form-control " value="{{number}}"/></div>                            
							<div class="lit-fld" data-type="pages"><div class="lit-fld-name">pages:</div><input type="text" class="lit-fld-value form-control " value="{{pages}}"/></div>                            
							<div class="lit-fld" data-type="year"><div class="lit-fld-name">year:</div><input type="text" class="lit-fld-value form-control " value="{{year}}"/></div>                            
							<div class="lit-fld" data-type="publisher"><div class="lit-fld-name">publisher:</div><input type="text" class="lit-fld-value form-control " value="{{publisher}}"/></div>                            
							<div class="lit-fld" data-type="weblink"><div class="lit-fld-name">weblink:</div><input type="text" class="lit-fld-value form-control " value="{{weblink}}"/></div>                            
						</div>
					</div>
					<div class="lit-add-file"><i class="fa fa-paperclip">&nbsp;&nbsp;</i>Attach files</div> 
					<div class="lit-file-add-progress">
					{{#files}}
						<div class="lit-file-holder loaded-file" data-uid="{{uid}}" data-id="{{id}}">
							<div class="lit-file-icon-holder"><i class="fa {{icon}}"></i></div>
							<div class="lit-file-name">{{nameOrig}}</div>
							<div class="lit-file-desc-holder"><textarea class="lit-file-desc" data-uid="{{uid}}">{{description}}</textarea></div>
							<div class="lit-download-file" data-uid="{{uid}}" ><i class="fa fa-download"></i></div>
							<div class="lit-delete-file" data-id="{{id}}" ><i class="fa fa-trash"></i></div>
						</div>
					{{/files}}
					</div>                        
				</div>`;

			return tpl;
		},

		init: function (id, link_id, mo, object, object_id, object2, object2_id) {
			this.id = id;
			this.link_id = link_id;
			this.object = object;
			this.object_id = object_id;
			this.object2 = object2;
			this.object2_id = object2_id;
			this.mo = mo;
			this.$wrapper = null;
			this.$save = null;
			this.files = [];


			if (this.mo.apa)
				this.mo.apa = this.mo.apa.replaceAll('&amp;', '&');

			this.hl_active = false;

			this.checkValue = (value) => {
				return value && value.trim().length ? value.trim() : '';
			};
			this.formatToAPA = (format_data) => {
				let author = format_data.author;
				if (author && author.lastIndexOf('and') > 0) {
					author = author.substr(0, author.lastIndexOf('and')) + "&" + author.substr(author.lastIndexOf('and') + 3);
					author = author.replaceAll(' and ', ', ');

					format_data.author = author;
				}

				let mo = {
					part1: (author ? author : '') + (format_data.year ? ((author ? ' ' : '') + `(${format_data.year})`) : '') + (author || format_data.year ? '. ' : ''),
					part2: format_data.title ? format_data.title + '. ' : '',
					part3: format_data.journal ? format_data.journal + (format_data.volume || format_data.number || format_data.pages ? ', ' : '.') : '',
					part4: (format_data.volume ? format_data.volume : '') + (format_data.number ? `(${format_data.number})` : ''),
					part5: format_data.pages ? (format_data.volume || format_data.number ? ', ' : '') + format_data.pages + '.' : (format_data.volume || format_data.number ? '.' : '')
				};

				let format_tpl = `{{part1}}{{part2}}{{part3}}{{part4}}{{part5}}`;
				// let format_tpl = `{{author}} ({{year}}). {{title}}. {{journal}}, {{volume}}({{number}}), {{pages}}.`;

				if (this.$wrapper.find('#lit-input').val().length > 1)
					this.$wrapper.find('.lit-data-output').html(Mustache.to_html(format_tpl, mo));

				this.setHightlight(true);
			};

			this.getFiles = (cb) => {
				let o = {
					command: 'get',
					object: 'literature_file',
					params: {
						param_where: {
							literature_id: this.id
						}
					}
				};

				socketQuery(o, function (res) {
					if (res.code !== 0) {
						toastr[res.toastr.type](res.toastr.message);
						return false;
					}

					let files = [];


					for (let i in res.data) {
						let f = res.data[i];

						let icon = '';
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


						files.push({
							id: f.id,
							uid: f.file_id,
							icon: icon,
							nameOrig: f.file + f.extension,
							description: f.description
						});
					}

					cb(files);
				});
			};

			this.activateHighLighting = ($save) => {
				this.$save = $save;
				this.hl_active = true;
			};
			this.setHightlight = (state) => {
				if (!this.hl_active) return;

				if (state) {
					this.$save.addClass('enabled');
				} else {
					this.$save.removeClass('enabled');
				}
			};

			this.save = cb => {
				let _t = this;

				async.series({
					addNewLitData: cb => {
						if (_t.id) return cb(null);

						let o = {
							command: 'add',
							object: 'literature',
							params: {
								type: _t.$wrapper.find('.lit-fld[data-type="type"] input').val(),
								article: _t.$wrapper.find('.lit-fld[data-type="article"] input').val(),
								title: _t.$wrapper.find('.lit-fld[data-type="title"] input').val(),
								author: _t.$wrapper.find('.lit-fld[data-type="author"] input').val(),
								journal: _t.$wrapper.find('.lit-fld[data-type="journal"] input').val(),
								volume: _t.$wrapper.find('.lit-fld[data-type="volume"] input').val(),
								number: _t.$wrapper.find('.lit-fld[data-type="number"] input').val(),
								pages: _t.$wrapper.find('.lit-fld[data-type="pages"] input').val(),
								year: _t.$wrapper.find('.lit-fld[data-type="year"] input').val(),
								publisher: _t.$wrapper.find('.lit-fld[data-type="publisher"] input').val(),
								weblink: _t.$wrapper.find('.lit-fld[data-type="weblink"] input').val(),
								bibtex: _t.$wrapper.find('#lit-input').val(),
								apa: _t.$wrapper.find('.lit-data-output').html()
							}
						};

						socketQuery(o, function (res) {
							if (res.code !== 0) return cb(res);

							_t.id = res.id;

							cb(null);
						});
					},
					addNewLitDataLink: cb => {
						if (_t.link_id || !_t.object) return cb(null);

						let o = {
							command: 'add',
							object: (_t.object2 || _t.object) + '_literature_data_link',
							params: {
								literature_id: _t.id
							}
						};

						o.params[`${_t.object}_id`] = _t.object_id;
						if (_t.object2) o.params[`${_t.object2}_id`] = _t.object2_id;

						socketQuery(o, function (res) {
							if (res.code !== 0) return cb(res);

							_t.link_id = res.id;

							cb(null);
						});
					},
					modifyLitData: cb => {
						if (!_t.id) return cb(null);

						let o = {
							command: 'modify',
							object: 'literature',
							params: {
								id: _t.id,
								type: _t.$wrapper.find('.lit-fld[data-type="type"] input').val(),
								article: _t.$wrapper.find('.lit-fld[data-type="article"] input').val(),
								title: _t.$wrapper.find('.lit-fld[data-type="title"] input').val(),
								author: _t.$wrapper.find('.lit-fld[data-type="author"] input').val(),
								journal: _t.$wrapper.find('.lit-fld[data-type="journal"] input').val(),
								volume: _t.$wrapper.find('.lit-fld[data-type="volume"] input').val(),
								number: _t.$wrapper.find('.lit-fld[data-type="number"] input').val(),
								pages: _t.$wrapper.find('.lit-fld[data-type="pages"] input').val(),
								year: _t.$wrapper.find('.lit-fld[data-type="year"] input').val(),
								publisher: _t.$wrapper.find('.lit-fld[data-type="publisher"] input').val(),
								weblink: _t.$wrapper.find('.lit-fld[data-type="weblink"] input').val(),
								bibtex: _t.$wrapper.find('#lit-input').val(),
								apa: _t.$wrapper.find('.lit-data-output').html()
							}
						};

						socketQuery(o, function (res) {
							if (res.code !== 0) return cb(res);

							cb(null);
						});
					},
					addLitDataFiles: cb => {
						if (!_t.files.length) return cb(null);

						async.eachSeries(_t.files, (file, cb) => {
							let o = {
								command: 'add',
								object: 'literature_file',
								params: {
									literature_id: _t.id,
									filename: file.name,
									description: _t.$wrapper.find('.lit-file-desc[data-uid="' + file.uid + '"]').val()
								}
							};

							socketQuery(o, function (res) {
								if (res.code !== 0) return cb(res);

								cb(null);
							});
						}, cb);
					},
					modifyLitDataFiles: cb => {
						if (!_t.$wrapper.find('.lit-file-holder.loaded-file.changed-file').length) return cb(null);

						let files_tmp = [];

						_t.$wrapper.find('.lit-file-holder.loaded-file.changed-file').each((i, e) => {
							files_tmp.push($(e));
						});

						async.eachSeries(files_tmp, (file, cb) => {
							let desc = file.find('.lit-file-desc').val();
							let fid = file.attr('data-id');

							let o = {
								command: 'modify',
								object: 'literature_file',
								params: {
									id: fid,
									description: desc
								}
							};

							socketQuery(o, function (res) {
								if (res.code !== 0) return cb(res);

								cb(null);
							});
						}, cb);
					}
				}, cb);

				_t.setHightlight(false);
			};

			this.delete = cb => {
				let _t = this;

				bootbox.dialog({
					title: 'Deleting literature data',
					message: 'Are you sure?',
					buttons: {
						confirm: {
							label: 'Yes',
							className: 'btn-success',
							callback: () => {
								let o = {
									command: 'remove',
									object: (_t.object2 || _t.object) + '_literature_data_link',
									params: {
										id: _t.link_id
									}
								};

								socketQuery(o, cb);
							}
						},
						cancel: {
							label: 'No',
							className: 'btn-danger'
						}
					}
				});
			};


			this.setHandlers = ($wrapper, withoutSelect) => {
				let _t = this;

				_t.$wrapper = $wrapper;

				//Adding file to LitData
				_t.$wrapper.find('.lit-add-file').off('click').on('click', () => {
					let prgr = _t.$wrapper.find('.lit-file-add-progress');

					let file_tpl = `<div class="lit-file-holder" data-uid="{{uid}}">
                                    <div class="lit-file-icon-holder"><i class="fa {{icon}}"></i></div>
                                    <div class="lit-file-name">{{nameOrig}}</div>
                                    <div class="lit-file-desc-holder"><textarea class="lit-file-desc" data-uid="{{uid}}"></textarea></div>
                                    </div>`;

					let fl = new ImageLoader({
						dir: 'upload/Taxon_pictures/',
						success: function (file) {
							let pc = this.InProcessCounter;
							let icon = '';
							switch (file.extname) {
								case '.jpg':
								case '.png':
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

							file.icon = icon;

							if (pc > 0) {
								_t.files.push(file);
								prgr.append(Mustache.to_html(file_tpl, file));
							} else {
								_t.files.push(file);
								prgr.append(Mustache.to_html(file_tpl, file));
							}

							_t.setHightlight(true);
						}
					});

					fl.start({
						params: {
							max_size: 1048576 * 5,
							not_public: true
						}
					});
				});

				//Mark edited file
				_t.$wrapper.find('.lit-file-holder.loaded-file .lit-file-desc').off('change').on('change', function () {
					$(this).parents('.lit-file-holder').addClass('changed-file');

					_t.setHightlight(true);
				});

				//Split BibTeX to fields
				_t.$wrapper.find('#lit-input').on('input', (e) => {
					let data = $(e.currentTarget).val();

					data = replaceAncientSymbols(data);

					let type = data.substr(data.indexOf('@') + 1, data.indexOf('{') - (data.indexOf('@') + 1));
					let article = data.substr(data.indexOf('{') + 1, data.indexOf(',') - (data.indexOf('{') + 1));
					let title = (data.indexOf('title={') != -1) ? data.substr(data.indexOf('title={') + 'title={'.length, data.substr(data.indexOf('title={') + 'title={'.length).indexOf('}')) : '';
					let author = (data.indexOf('author={') != -1) ? data.substr(data.indexOf('author={') + 'author={'.length, data.substr(data.indexOf('author={') + 'author={'.length).indexOf('}')) : '';
					let journal = (data.indexOf('journal={') != -1) ? data.substr(data.indexOf('journal={') + 'journal={'.length, data.substr(data.indexOf('journal={') + 'journal={'.length).indexOf('}')) : '';
					let volume = (data.indexOf('volume={') != -1) ? data.substr(data.indexOf('volume={') + 'volume={'.length, data.substr(data.indexOf('volume={') + 'volume={'.length).indexOf('}')) : '';
					let number = (data.indexOf('number={') != -1) ? data.substr(data.indexOf('number={') + 'number={'.length, data.substr(data.indexOf('number={') + 'number={'.length).indexOf('}')) : '';
					let pages = (data.indexOf('pages={') != -1) ? data.substr(data.indexOf('pages={') + 'pages={'.length, data.substr(data.indexOf('pages={') + 'pages={'.length).indexOf('}')) : '';
					let year = (data.indexOf('year={') != -1) ? data.substr(data.indexOf('year={') + 'year={'.length, data.substr(data.indexOf('year={') + 'year={'.length).indexOf('}')) : '';
					let publisher = (data.indexOf('publisher={') != -1) ? data.substr(data.indexOf('publisher={') + 'publisher={'.length, data.substr(data.indexOf('publisher={') + 'publisher={'.length).indexOf('}')) : '';

					pages = pages.replace('--', '-');

					_t.$wrapper.find('.lit-fld[data-type="type"] input').val(type);
					_t.$wrapper.find('.lit-fld[data-type="article"] input').val(article);
					_t.$wrapper.find('.lit-fld[data-type="title"] input').val(title);
					_t.$wrapper.find('.lit-fld[data-type="author"] input').val(author);
					_t.$wrapper.find('.lit-fld[data-type="journal"] input').val(journal);
					_t.$wrapper.find('.lit-fld[data-type="volume"] input').val(volume);
					_t.$wrapper.find('.lit-fld[data-type="number"] input').val(number);
					_t.$wrapper.find('.lit-fld[data-type="pages"] input').val(pages);
					_t.$wrapper.find('.lit-fld[data-type="year"] input').val(year);
					_t.$wrapper.find('.lit-fld[data-type="publisher"] input').val(publisher);

					_t.formatToAPA({
						author: author,
						title: title,
						journal: journal,
						year: year,
						volume: volume,
						number: number,
						pages: pages
					});
				});

				//Join fields ti BibTeX
				_t.$wrapper.find('.lit-fields .lit-fld').on('input', () => {
					let type = _t.checkValue(_t.$wrapper.find('.lit-fld[data-type="type"] input').val());
					let article = _t.checkValue(_t.$wrapper.find('.lit-fld[data-type="article"] input').val());
					let title = _t.checkValue(_t.$wrapper.find('.lit-fld[data-type="title"] input').val());
					let author = _t.checkValue(_t.$wrapper.find('.lit-fld[data-type="author"] input').val())
					let journal = _t.checkValue(_t.$wrapper.find('.lit-fld[data-type="journal"] input').val());
					let volume = _t.checkValue(_t.$wrapper.find('.lit-fld[data-type="volume"] input').val());
					let number = _t.checkValue(_t.$wrapper.find('.lit-fld[data-type="number"] input').val());
					let pages = _t.checkValue(_t.$wrapper.find('.lit-fld[data-type="pages"] input').val());
					let year = _t.checkValue(_t.$wrapper.find('.lit-fld[data-type="year"] input').val());
					let publisher = _t.checkValue(_t.$wrapper.find('.lit-fld[data-type="publisher"] input').val());

					_t.$wrapper.find('#lit-input').val(`@${type}{${article + (title ? `,\n  title={${title}}` : '') +
					(author ? `,\n  author={${author}}` : '') + (journal ? `,\n  journal={${journal}}` : '') +
					(volume ? `,\n  volume={${volume}}` : '') + (number ? `,\n  number={${number}}` : '') +
					(pages ? `,\n  pages={${pages}}` : '') + (year ? `,\n  year={${year}}` : '') +
					(publisher ? `,\n  publisher={${publisher}}` : '')}\n}`);

					_t.formatToAPA({
						author: author,
						title: title,
						journal: journal,
						year: year,
						volume: volume,
						number: number,
						pages: pages
					});
				});

				//Download file
				_t.$wrapper.find('.lit-download-file').off('click').on('click', function () {
					let uid = $(this).attr('data-uid');

					let document_name = $(this).parents('.lit-file-holder').find('.lit-file-name').html();

					let o = {
						command: 'download',
						object: 'File',
						params: {
							id: uid
						}
					};

					socketQuery(o, function (res) {
						let linkName = 'my_download_link' + MB.Core.guid();
						$("body").prepend(`<a 
							id="${linkName}" 
							href="${res.path}?filename=${res.filename}" 
							download="${document_name + res.extension}" 
							style="display:none;"></a>`);

						let jqElem = $('#' + linkName);
						jqElem[0].click();
						jqElem.remove();
						$("#my_download_link").remove();
					});
				});

				//Delete file
				_t.$wrapper.find('.lit-delete-file').off('click').on('click', function () {
					bootbox.dialog({
						title: 'Deleting file',
						message: 'Are you sure?',
						buttons: {
							confirm: {
								label: 'Yes',
								className: 'btn-success',
								callback: () => {
									let id = $(this).attr('data-id');

									let o = {
										command: 'remove',
										object: 'literature_file',
										params: {
											id: id
										}
									};

									socketQuery(o, function (res) {
										if (res && res.code && res.code !== 0) return toastr[res.toastr.type](res.toastr.message);

										_t.$wrapper.find(`.lit-file-holder[data-id="${id}"]`).remove();

										_t.setHightlight(true);
									});
								}
							},
							cancel: {
								label: 'No',
								className: 'btn-danger'
							}
						}
					});
				});

				//Select
				if (!withoutSelect) {
					_t.$wrapper.find('.select_wrapper').html(`
						<div id="init_lit_data_select" class="bttn_n_label">
							<select id="add_existing_lit_data"></select>
						</div>
						<div class="lit-title" style="margin: 15px 0;">or Insert here the "BibTeX" data:</div>`);

					_t.$wrapper.find('#add_existing_lit_data').select2({
						allowClear: true,
						dropdownParent: _t.$wrapper.find('#init_lit_data_select'),
						placeholder: 'Select from existing...',
						ajax: {
							dataType: 'json',
							delay: 250,
							transport: function (params, success, failure) {
								let o = {
									command: 'get',
									object: 'literature',
									params: {
										columns: ['id', 'apa', 'bibtex'],
										where: [],
										limit: 500
									}
								};

								if (params.data.term) o.params.where.push({
									key: 'apa',
									type: 'like',
									val1: params.data.term
								});

								socketQuery(o, res => {
									if (res && res.code === 0) {
										success(res.data);
									} else {
										failure();
									}
								});
							},
							processResults: function (data, params) {
								let results = [];

								for (let i in data) {
									let row = data[i];

									results.push({
										id: row.id,
										text: row.apa,
										bibtex: row.bibtex
									});
								}

								return {
									results: results,
									totals: results.length
								};
							}
						}
					}).on('change', (e) => {
						let row = $(e.currentTarget).select2('data')[0];

						_t.id = null;
						if (row) {
							_t.id = +row.id;
							_t.$wrapper.find('#lit-input').val(row.bibtex).trigger('input');
						}
					});
				}
			};

			return this;
		}
	};
}());


(function () {
	MB.PicEditor = {
		getUser: cb => {
			let o = {
				command: 'get_me',
				object: 'User',
				params: {}
			};

			socketQuery(o, (res) => {
				let curr_user = res && res.user ? res.user : null;

				if (curr_user) {
					cb(curr_user);
				} else {
					toastr['error']('Error while getting user');
					cb(null);
				}
			});
		},

		getTpl: (fields) => {
			return `
				<div class="pics-desc-holder taxon_pics_holder">
					${MB.PicEditor.getCommonTpl()}
					${MB.PicEditor.getCustomTpl(fields)}
				</div>`;
		},
		getCommonTpl: () => {
			return `
				<div class="pics-desc-holder_common_info">
					<div class="posRel pic-desc-item_select_wrapper">
						<label class="pic-type-label">Author:</label>
						<select style="width: 100%;" class="pic-author"><option></option></select>
					</div>
					<div class="posRel pic-desc-item_select_wrapper">
						<label class="pic-type-label">Source:</label>
						<select style="width: 100%;" class="pic-source"><option></option></select>
					</div>
					<div class="posRel pic-desc-item_select_wrapper">
						<label class="pic-type-label">License:</label>
						<select style="width: 100%;" class="pic-copyright"><option></option></select>
					</div>	
				</div>
		    `;
		},
		getCustomTpl: (fields) => {
			let tpl_dsc = `
				<div class="posRel">
					<label class="pic-type-label">Description:</label>
					<textarea rows="2" class="pic-desc-textarea" data-name="{{name}}">{{description}}</textarea>
				</div>`;

			let tpl_ext = `
				<div class="posRel">
					<label class="pic-type-label">External ID:</label>
					<input class="fn-control pic-external_id" type="text" data-name="{{name}}" val="{{external_id}}"/>
				</div>`;

			let tpl_type = `
				<div class="posRel flex_row">
					<div class="posRel no_margin">
						<input type="checkbox" class="main-picture" {{is_main_picture}} />
						<label class="pic-type-label">Main picture</label>
					</div>
					<div class="posRel no_margin">
						<input type="checkbox" class="visible-on-site" {{published}} />
						<label class="pic-type-label">Visible on site</label>
					</div>
				</div>`;

			let tpl_main_visible = `
				<div class="posRel">
					<label class="pic-type-label">Choose picture type:</label>
					<select style="width: 100%;" class="pic-type" data-name="{{type}}"><option></option></select>
				</div>`;

			return `
		    	<div class="row">
					<div class="pic-desc-item col-md-3"></div>
					{{#pics}}
					<div class="pic-desc-item col-md-3 vert-orient" data-id="{{id}}" data-name="{{name}}">
						<div class="pic-img-holder">
							<div class="pic-name-holder">{{nameOrig}}</div>
							<img src="upload/Taxon_pictures/{{name}}" />
						</div>
						<div class="pic-desc-editor fn-field">
							${fields.indexOf('description') > -1 ? tpl_dsc : ''}
							${fields.indexOf('external_id') > -1 ? tpl_ext : ''}
							${fields.indexOf('picture_type') > -1 ? tpl_type : ''}
							${fields.indexOf('visible') > -1 ? tpl_main_visible : ''}
						</div>
					</div>
					{{/pics}}
				</div>
		    `;
		},
		showAddingBox: (object, object_field, object_id, fields, cb) => {
			// console.error(types, authors, licenses, sources, object, object_field, object_id, fields);
			let pics = [];

			let types, authors, licenses, sources;
			let curr_user;

			MB.PicEditor.getTopData((res) => {
				authors = res.pic_authors;
				licenses = res.pic_copyrights;
				sources = res.pic_sources;
				types = res.pic_types;

				MB.PicEditor.getUser((res) => {
					if (!res) return;

					curr_user = res;
					fl.start();
				});
			}, true);

			let fl = new ImageLoader({
				dir: 'upload/Taxon_pictures/',
				success: function (file) {
					let pc = this.InProcessCounter;

					if (pc > 0) {
						pics.push(file);
						return;
					} else {
						pics.push(file);

						let tpl = MB.PicEditor.getTpl(fields);

						let mo = {
							pics: pics
						};

						let pic_types;
						if (types)
							pic_types = MB.PicEditor.getTypesForPic(types, null, null);
						let pic_authors = MB.PicEditor.getAuthorsForPic(authors, curr_user.fio);
						let pic_copyrights = MB.PicEditor.getCopyrightForPic(licenses, 'CC-BY');
						let pic_sources = MB.PicEditor.getSourceForPic(sources, 'Ecotaxonomy');

						let $dialog = bootbox.dialog({
							title: 'Set pictures definitions',
							message: Mustache.to_html(tpl, mo),
							className: 'wide-modal',
							buttons: {
								success: {
									label: 'Save',
									callback: function () {
										let o = {
											command: 'addByList',
											object: object,
											params: {
												pictures: []
											}
										};

										o.params[object_field] = object_id;

										let $info = $dialog.find('.pics-desc-holder_common_info');
										let author_id = $info.find('.pic-author').val();
										let pic_source_text = $info.find('.pic-source-text').val();
										let pic_source_id = $info.find('.pic-source').val();
										let copyright_id = $info.find('.pic-copyright').val();

										for (let pic of pics) {
											let data = MB.PicEditor.getPicDataByName(fields, $dialog, pic.name, false);

											data[object_field] = object_id;
											data.name = pic.name;
											data.author_id = author_id;
											data.pic_source_text = pic_source_text;
											data.pic_source_id = pic_source_id;
											data.copyright_id = copyright_id;

											o.params.pictures.push(data);
										}

										socketQuery(o, cb);
									}
								},
								error: {
									label: 'Cancel',
									callback: function () {
										cb(false);
									}
								}

							}
						}).on('shown.bs.modal', function () {
							$dialog.removeAttr("tabindex");

							initSelect2WithAdding($dialog.find(`.pics-desc-holder_common_info select.pic-author`), pic_authors, object, 'author', ($dialog) => {
								if (curr_user) {
									$($dialog).find('[data-column="firstname"]').val(curr_user.firstname);
									$($dialog).find('[data-column="lastname"]').val(curr_user.lastname);
									$($dialog).find('[data-column="midname"]').val(curr_user.midname);
								}
							});

							initSelect2WithAdding($dialog.find(`.pics-desc-holder_common_info select.pic-source`), pic_sources, object, 'pic_source');

							initSelect2WithAdding($dialog.find(`.pics-desc-holder_common_info select.pic-copyright`), pic_copyrights, object, 'copyright');

							if (types)
								for (let i in mo.pics) {
									let row = mo.pics[i];

									initSelect2WithAdding($dialog.find(`.pic-desc-item[data-name='${row.name}'] select.pic-type`), pic_types, 'taxon_picture', 'picture_type');
								}
						});

						$dialog.find('input[type="checkbox"].main-picture').off('change').on('change', function () {
							$dialog.find('input[type="checkbox"].main-picture').removeAttr('checked');
							$(this).attr('checked', 'checked');
						});
						$dialog.find('.visible-on-site, .main-picture').checkboxIt();
					}
				}
			});
		},

		getTplEditor: (fields) => {
			let tpl_dsc = `
				<div class="posRel">
					<label class="pic-type-label">Description:</label>
					<textarea rows="2" class="pic-desc-textarea" data-name="{{name}}">{{description}}</textarea>
				</div>`;

			let tpl_ext = `
				<div class="posRel">
					<label class="pic-type-label">External ID:</label>
					<input class="fn-control pic-external_id" type="text" data-name="{{name}}" value="{{external_id}}"/>
				</div>`;

			let tpl_type = `
				<div class="posRel flex_row">
					<div class="posRel no_margin">
						<input type="checkbox" class="main-picture" {{is_main_picture}} />
						<label class="pic-type-label">Main picture</label>
					</div>
					<div class="posRel no_margin">
						<input type="checkbox" class="visible-on-site" {{published}} />
						<label class="pic-type-label">Visible on site</label>
					</div>
				</div>`;

			let tpl_main_visible = `
				<div class="posRel">
					<label class="pic-type-label">Choose picture type:</label>
					<select style="width: 100%;" class="pic-type" data-name="{{type}}"><option></option></select>
				</div>`;

			return `
				<div class="pics-desc-holder taxon_pics_holder">
		            <div class="row">
		                {{#pics}}
		                <div class="pic-desc-item col-md-3 vert-orient" data-id="{{id}}" data-name="{{name}}">
		                    <div class="pic-img-holder">
		                        <div class="pic-name-holder">{{nameOrig}}</div>
		                        <img src="upload/Taxon_pictures/{{name}}" />
	                        </div>
		                    <div class="pic-desc-editor fn-field">
								${fields.indexOf('description') > -1 ? tpl_dsc : ''}
								${fields.indexOf('external_id') > -1 ? tpl_ext : ''}
								${fields.indexOf('picture_type') > -1 ? tpl_type : ''}
								${fields.indexOf('visible') > -1 ? tpl_main_visible : ''}
				                <div class="posRel">
				                    <label class="pic-type-label">Author:</label>
		                            <select style="width: 100%;" class="pic-author" data-name="{{author}}"><option></option></select>
	                            </div>
		                        <div class="posRel">
		                            <label class="pic-type-label">Source:</label>
		                            <select style="width: 100%;" class="pic-source" data-name="{{author}}"><option></option></select>
	                            </div>
				                <div class="posRel">
				                    <label class="pic-type-label">License:</label>
		                            <select style="width: 100%;" class="pic-copyright" data-name="{{copyright}}"><option></option></select>
	                            </div>	
			                </div>
		                </div>
		                {{/pics}}
	                </div>
                </div>`;
		},
		getMOEditor: (pictures, pic_types, pic_authors, pic_copyrights, pic_sources) => {
			return {
				pics: pictures.map(pic => {
					if (pic_types) pic.types = MB.PicEditor.getTypesForPic(pic_types, null, pic.picture_type_id);
					pic.authors = MB.PicEditor.getAuthorsForPic(pic_authors, null, pic.author_id);
					pic.copyrights = MB.PicEditor.getCopyrightForPic(pic_copyrights, null, pic.copyright_id);
					pic.sources = MB.PicEditor.getSourceForPic(pic_sources, null, pic.pic_source_id);

					pic.is_main_picture = (pic.is_main_picture) ? 'checked' : '';
					pic.published = (pic.show_on_site) ? 'checked' : '';

					return pic;
				})
			};
		},
		showEditor: (pictures, object, fields, cb) => {
			MB.PicEditor.getTopData((res) => {
				let types, authors, licenses, sources;

				authors = res.pic_authors;
				licenses = res.pic_copyrights;
				sources = res.pic_sources;
				types = res.pic_types;

				let tpl = MB.PicEditor.getTplEditor(fields);
				let mo = MB.PicEditor.getMOEditor(pictures, types, authors, licenses, sources);

				let $dialog = bootbox.dialog({
					title: 'Pictures data modification interface',
					message: Mustache.to_html(tpl, mo),
					className: 'wide-modal',
					buttons: {
						success: {
							label: 'Save',
							className: 'modal-save-button',
							callback: function () {
								let o = {
									command: 'modifyByList',
									object: object,
									params: {
										pictures: []
									}
								};

								for (let pic of pictures) {
									let data = MB.PicEditor.getPicDataByName(fields, $dialog, pic.name, true);

									data.id = pic.id;

									o.params.pictures.push(data);
								}

								socketQuery(o, cb);
							}
						},
						error: {
							label: 'Exit',
							callback: function () {
								cb(false);
							}
						}
					}
				}).on('shown.bs.modal', function () {
					$dialog.removeAttr("tabindex");

					for (let pic of mo.pics) {
						if (types) initSelect2WithAdding($dialog.find(`.pic-desc-item[data-id='${pic.id}'] select.pic-type`), pic.types, object, 'picture_type');

						initSelect2WithAdding($dialog.find(`.pic-desc-item[data-id='${pic.id}'] select.pic-author`), pic.authors, object, 'author');

						initSelect2WithAdding($dialog.find(`.pic-desc-item[data-id='${pic.id}'] select.pic-source`), pic.sources, object, 'pic_source');

						initSelect2WithAdding($dialog.find(`.pic-desc-item[data-id='${pic.id}'] select.pic-copyright`), pic.copyrights, object, 'copyright');
					}

					$dialog.find('input[type="checkbox"].main-picture').off('change').on('change', function () {
						$dialog.find('input[type="checkbox"].main-picture').removeAttr('checked');
						$(this).attr('checked', 'checked');
					});
					$dialog.find('.visible-on-site, .main-picture').checkboxIt();
				});
			}, true);
		},

		getPicDataByName: (fields, $dialog, name, getCommonData) => {
			let items = $dialog.find('.pic-desc-item');

			for (let i = 0; i < items.length; i++) {
				let t = items.eq(i);

				if (t.attr('data-name') === name) {
					let data = {
						description: t.find('.pic-desc-textarea').val(),
						external_id: t.find('.pic-external_id').val()
					};

					if (getCommonData) {
						data.author_id = t.find('.pic-author').val();
						data.pic_source_id = t.find('.pic-source').val();
						data.copyright_id = t.find('.pic-copyright').val();
					}

					if (fields.indexOf('visible') > -1) {
						data.is_main_picture = t.find('.main-picture')[0].checked;
						data.show_on_site = t.find('.visible-on-site')[0].checked;
					}

					if (fields.indexOf('picture_type') > -1) {
						data.picture_type_id = t.find('.pic-type').val();
					}

					return data;
				}
			}
		},

		getTopData: (cb, needTypes) => {
			async.parallel({
				getAuthors: cb => {
					MB.PicEditor.getAuthors(cb);
				},
				getCopyright: cb => {
					MB.PicEditor.getCopyright(cb);
				},
				getSource: cb => {
					MB.PicEditor.getSource(cb);
				},
				getTypes: cb => {
					if (!needTypes) return cb(null);
					MB.PicEditor.getTypes(cb);
				}
			}, (err, res) => {
				cb({
					pic_authors: res.getAuthors,
					pic_copyrights: res.getCopyright,
					pic_sources: res.getSource,
					pic_types: res.getTypes
				});
			});
		},
		getAuthors: cb => {
			let o = {
				command: 'get',
				object: 'author',
				params: {}
			};

			socketQuery(o, function (res) {
				if (res.code !== 0) {
					toastr[res.toastr.type](res.toastr.message);
					cb(null)
				}

				let arr = Object.keys(res.data).map(row => {
					return res.data[row]
				});

				cb(null, arr);
			});
		},
		getCopyright: cb => {
			let o = {
				command: 'get',
				object: 'copyright',
				params: {}
			};

			socketQuery(o, function (res) {
				if (res.code !== 0) {
					toastr[res.toastr.type](res.toastr.message);
					cb(null)
				}

				let arr = Object.keys(res.data).map(row => {
					return res.data[row]
				});

				cb(null, arr);
			});
		},
		getSource: cb => {
			let o = {
				command: 'get',
				object: 'pic_source',
				params: {}
			};

			socketQuery(o, function (res) {
				if (res.code !== 0) {
					toastr[res.toastr.type](res.toastr.message);
					cb(null)
				}

				let arr = Object.keys(res.data).map(row => {
					return res.data[row]
				});

				cb(null, arr);
			});
		},
		getTypes: cb => {
			let o = {
				command: 'get',
				object: 'picture_type',
				params: {}
			};

			socketQuery(o, function (res) {
				if (res.code !== 0) {
					toastr[res.toastr.type](res.toastr.message);
					cb(null)
				}

				let arr = Object.keys(res.data).map(row => {
					return res.data[row]
				});

				cb(null, arr);
			});
		},

		getAuthorsForPic: (authors, value, value_id) => {
			return authors.map(author => {
				return {
					id: author.id,
					text: author.fio,
					selected: value ? author.fio === value : author.id === value_id
				}
			});
		},
		getCopyrightForPic: (copyrights, value, value_id) => {
			return copyrights.map(copyright => {
				return {
					id: copyright.id,
					text: copyright.name + ` (${copyright.sysname})`,
					selected: value ? copyright.sysname === value : copyright.id === value_id
				}
			});
		},
		getSourceForPic: (sources, value, value_id) => {
			return sources.map(source => {
				return {
					id: source.id,
					text: source.name,
					selected: value ? source.name === value : source.id === value_id
				}
			});
		},
		getTypesForPic: (types, value, value_id) => {
			return types.map(type => {
				return {
					id: type.id,
					text: type.name,
					selected: value ? type.name === value : type.id === value_id
				}
			});
		}
	};
}());


(function () {
	MB.TraitFields = {
		insertFieldHTML: ($wrapper, trait, type, value1, value2, sign) => {
			// console.error(type, value1, value2, sign);
			let html;

			switch (type) {
				case 'SHORT_TEXT':
					html = `
						<div class="ep-tod-holder" data-id="${type}">
							<input type="text" class="ap-value ap-field-editor" value="${value1}" ${trait.max_characters ? 'maxlength="' + trait.max_characters + '"' : ''}/>
						</div>`;
					$wrapper.html(html);
					break;
				case 'INTEGER':
					html = `
						<div class="ep-tod-holder" data-id="${type}">
							<input type="number" class="ap-value ap-field-editor" value="${value1}" 
							${typeof trait.min_value === 'number' ? ('min="' + trait.min_value + '"') : ''} 
							${typeof trait.max_value === 'number' ? ('max="' + trait.max_value + '"') : ''} />
							<div class="sign_in_input">${sign}</div>
						</div>`;
					$wrapper.html(html);
					break;
				case 'INTEGERRANGE':
					html = `
						<div class="ep-tod-holder" data-id="${type}">
							<input type="number" class="ap-value ap-value-1 ap-field-editor ap-field-editor-1" value="${value1}"/>
							<input type="number" class="ap-value ap-value-2 ap-field-editor ap-field-editor-2" value="${value2}"/>
						</div>`;
					$wrapper.html(html);
					break;
				case 'FLOAT':
					html = `
						<div class="ep-tod-holder" data-id="${type}">
							<input type="number" class="ap-value ap-field-editor" value="${value1}" step="0.1" 
							${typeof trait.min_value === 'number' ? ('min="' + trait.min_value + '"') : ''} 
							${typeof trait.max_value === 'number' ? ('max="' + trait.max_value + '"') : ''} />
							<div class="sign_in_input">${sign}</div>
						</div>`;
					$wrapper.html(html);
					break;
				case 'FLOATRANGE':
					html = `
						<div class="ep-tod-holder" data-id="${type}">
							<input type="number" step="0.1" class="ap-value ap-value-1 ap-field-editor ap-field-editor-1" value="${value1}"/>
							<input type="number" step="0.1" class="ap-value ap-value-2 ap-field-editor ap-field-editor-2" value="${value2}"/>
						</div>`;
					$wrapper.html(html);
					break;
				case 'DATE':
					html = `
						<div class="ep-tod-holder" data-id="${type}">
							<input type="text" class="ap-field-date ap-field-editor"  value="${value1}"/>
						</div>`;
					$wrapper.html(html);
					$wrapper.find('.ap-field-date').datepicker({
						autoclose: true,
						todayHighlight: true,
						keyboardNavigation: false,
						todayBtn: true,
						firstDay: 1,
						format: 'dd.mm.yyyy',
						weekStart: 1,
						language: "en"
					});
					break;
				case 'DATERANGE':
					html = `
						<div class="ep-tod-holder" data-id="${type}">
							<input type="text" class="ap-field-date ap-field-date-1 ap-field-editor ap-field-editor-1"  value="${value1}"/>
							<input type="text" class="ap-field-date ap-field-date-2 ap-field-editor ap-field-editor-2" value="${value2}">
						</div>`;
					$wrapper.html(html);
					$wrapper.find('.ap-field-date').datepicker({
						autoclose: true,
						todayHighlight: true,
						keyboardNavigation: false,
						todayBtn: true,
						firstDay: 1,
						format: 'dd.mm.yyyy',
						weekStart: 1,
						language: "en"
					});
					break;
				case 'IMAGE':
					html = `
						<div class="ep-tod-holder" data-id="${type}">
							<div class="ap-field-editor ap-field-image">${value1}</div>
						</div>`;
					$wrapper.html(html);
					break;
				case 'FILE':
					html = `
						<div class="ep-tod-holder" data-id="${type}">
							<div class="ap-field-editor ap-field-file">${value1}</div>
						</div>`;
					$wrapper.html(html);
					break;
				case 'SELECT':
					html = `
						<div class="ep-tod-holder" data-id="${type}" data-type="select" data-get="${trait.sub_table_name_for_select}">
							<select class="select2-item" data-get="${trait.sub_table_name_for_select}"><option value="${value2}" selected>${value1}</option></select>
						</div>`;
					$wrapper.html(html);
					break;
				case 'MULTISELECT':
					html = `
						<div class="ep-tod-holder" data-id="${type}" data-type="multiselect">
							<div class="ap-lov-item-add"><i class="fa fa-plus"></i>&nbsp;&nbsp;Add list item</div>
							<div class="ap-lov-insert"></div>
						</div>`;
					$wrapper.html(html);

					let sel_insert = $wrapper.find('.ap-lov-insert');
					$wrapper.find('.ap-lov-item-add').off('click').on('click', function () {
						sel_insert.append(`
							<div class="ap-lov-item-holder" data-type="multiselect">
								<input type="text" class="ap-lov-item-fld" />
								<div class="ap-lov-item-set-as-selected">Set as selected</div>
								<div class="ap-lov-remove-item"><i class="fa fa-times"></i>&nbsp;&nbsp;Remove item</div>
							</div>`);
						sel_insert.find('.ap-lov-item-set-as-selected').off('click').on('click', function () {
							let tp = $(this).parents('.ap-lov-item-holder');
							tp.toggleClass('selected');

							if (tp.hasClass('selected')) {
								$(this).html('Deselect');
							} else {
								$(this).html('Set as selected');
							}
						});

						sel_insert.find('.ap-lov-remove-item').off('click').on('click', function () {
							let tp = $(this).parents('.ap-lov-item-holder');
							tp.remove();
						});
					});
					break;
				case 'TEXT':
					html = `
						<div class="ep-tod-holder" data-id="${type}">
							<textarea class="ap-field-editor ap-field-textarea" ${trait.max_characters ? 'maxlength="' + trait.max_characters + '"' : ''}>${value1}</textarea>
						</div>`;
					$wrapper.html(html);
					break;
				case 'BOOLEAN':
					html = `
						<div class="ep-tod-holder checkbox_holder" data-id="${type}">
							<input class="ap-field-editor" type="checkbox" ${value1 ? 'checked' : ''} />
							<i class="fa fa-check"></i>
							<i class="fa fa-times"></i>
						</div>`;
					$wrapper.html(html);
					break;
				default :
					break;
			}
		}
	};
}());


(function () {
	MB.CHTable = {
		getTpl: () => {
			return `
				<div class="ch_wrapper">
					<div class="ch_header">
						<div class="ch_button" id="ch_upload_file">
							<div class="title">Select file</div>
						</div>
						<div class="ct-pagination-wrapper">
							<div class="ct-pagination-item ct-pagination-prev">
								<i class="fa fa-angle-left"></i>
							</div>
							<div class="ct-pagination-current">
								<input type="text" class="ct-pagination-current-input" value="1">
							</div>
							<div class="ct-pagination-item ct-pagination-next">
								<i class="fa fa-angle-right"></i>
							</div>
							<div class="ct-pagination-pagesCount"></div>
						</div>
					</div>
					<div class="ch_table">
						<table>
							<thead>
							</thead>
							<tbody>
							</tbody>
						</table>
					</div>
				</div>`
		},

		init: function (project_id, data_class, file, saveData_cb) {
			//todo switcher
			let page = 0;
			let n_per_page = 10;
			let pages_n = 1;
			let sort_field_id = null;
			let sort_dir = null;

			let $dialog = null;

			let fields = [];
			let columns = [];
			let rows = [];

			let start = (res) => {
				clear();

				fields = res.fields;
				rows = res.data.rows;
				columns = res.data.columns;
				pages_n = Math.ceil(rows.length / n_per_page);

				if ($dialog) {
					render();
				} else {
					$dialog = bootbox.dialog({
						title: 'Prepare data',
						message: MB.CHTable.getTpl(),
						className: 'max-wide-modal',
						buttons: {
							success: {
								label: 'Import',
								className: 'modal-save-button',
								callback: function () {
									importFromExcel_saveData();

									// return false;
								}
							},
							check: {
								label: 'Check data',
								className: 'modal-check-button',
								callback: function () {
									importFromExcel_checkData();

									return false;
								}
							},
							error: {
								label: 'Exit',
								callback: function () {
								}
							}
						}
					}).on('shown.bs.modal', () => {
						$dialog.removeAttr("tabindex");

						render();
					});
				}
			};

			let clear = () => {
				sort_dir = null;
				sort_field_id = null;

				columns = [];
				rows = [];


				if ($dialog) {
					$dialog.find('.ch_table thead').empty();
					clearBody();
				}
			};
			let clearBody = () => {
				$dialog.find('.ch_table tbody').empty();
			};
			let render = () => {
				renderHeader();
				switchToPage(0);
				importFromExcel_checkData(true);
				setHandlers();

				$('.ct-pagination-pagesCount').html(`Pages: ${pages_n}`);
			};
			let renderHeader = () => {
				let tpl = `
						<tr class="ch_titles_row">
							<th class="ch_h_title">FIELDS FROM EXCEL:</th>
							{{#columns}}
					        <th>
					            <div class="th_content ch_sortable" data-id="{{col_id}}" data-name="{{title}}">
						            <div class="title">{{title}}</div>
						            {{#editable}}
						            <div class="status">(ред.)</div>
						            {{/editable}}
						            {{#dir_asc}}
						            <div class="direction">▲</div>
						            {{/dir_asc}}
						            {{#dir_desc}}
						            <div class="direction">▼</div>
						            {{/dir_desc}}
								</div>
							</th>
							{{/columns}}
						</tr>
						<tr>
							<th class="ch_h_title">FIELDS FROM CLASS:</th>
							{{#columns}}
					        <th>
					            <div class="th_content ch_selectable" data-id="{{col_id}}" data-name="{{title}}">
						            <select></select>
								</div>
							</th>
							{{/columns}}
						</tr>
						<tr><th style="height: 20px;"></th></tr>
				    `;

				let m = {
					columns: columns.map((row, i) => {
						row.dir_asc = sort_field_id === i && sort_dir === 'asc';
						row.dir_desc = sort_field_id === i && sort_dir === 'desc';
						return row;
					})
				};

				$dialog.find('.ch_table thead').html(Mustache.to_html(tpl, m));

				setColumnsHandlers();
				setSelect2();
			};
			let updateHeader = () => {
				let tpl = `
						<th class="ch_h_title">FIELDS FROM EXCEL:</th>
						{{#columns}}
				        <th>
				            <div class="th_content ch_sortable" data-id="{{col_id}}" data-name="{{title}}">
					            <div class="title">{{title}}</div>
					            {{#editable}}
					            <div class="status">(ред.)</div>
					            {{/editable}}
					            {{#dir_asc}}
					            <div class="direction">▲</div>
					            {{/dir_asc}}
					            {{#dir_desc}}
					            <div class="direction">▼</div>
					            {{/dir_desc}}
							</div>
						</th>
						{{/columns}}
				    `;

				let m = {
					columns: columns.map((row, i) => {
						row.dir_asc = sort_field_id === i && sort_dir === 'asc';
						row.dir_desc = sort_field_id === i && sort_dir === 'desc';
						return row;
					})
				};

				$dialog.find('.ch_table thead .ch_titles_row').html(Mustache.to_html(tpl, m));

				setColumnsHandlers();
			};
			let renderBody = (page) => {
				let tpl = `
					{{#rows}}
					<tr data-ind="{{ind}}">
						<td>
							<div class="td_content td_buttons">
								<div class="td_button delete"><i class="fa fa-trash-o"></i></div>
								<div class="td_button edit"><i class="fa fa-edit"></i></div>
								<div class="td_button save editing"><i class="fa fa-save"></i></div>
							</div>
						</td>
						{{#columns}}
						<td data-ind="{{col_id}}">
							<div class="td_content">
								<div class="value" title="{{value}}" {{{style}}}>{{{value}}}</div>
								<div class="message" title="{{_status}}">{{{_status}}}</div>
							</div>
						</td>
						{{/columns}}
					</tr>
					{{/rows}}
			    `;

				let m = {
					rows: rows.slice(page * n_per_page, (page + 1) * n_per_page).map((columns, id) => {
						return {
							ind: columns.length ? columns[0].row_id : null,
							columns: columns
						}
					})
				};

				$dialog.find('.ch_table tbody').html(Mustache.to_html(tpl, m));

				setBodyHandlers();
			};
			let renderRow = (row_id) => {
				let tpl = `
					<td>
						<div class="td_content td_buttons">
							<div class="td_button delete"><i class="fa fa-trash-o"></i></div>
							<div class="td_button edit"><i class="fa fa-edit"></i></div>
							<div class="td_button save editing"><i class="fa fa-save"></i></div>
						</div>
					</td>
					{{#columns}}
					<td data-ind="{{col_id}}">
						<div class="td_content">
							<div class="value" title="{{value}}" {{{style}}}>{{{value}}}</div>
							<div class="message" title="{{_status}}">{{{_status}}}</div>
						</div>
					</td>
					{{/columns}}
			    `;

				let m =  {
					columns: rows.filter(row => row[0].row_id === row_id)[0]
				};

				$dialog.find(`.ch_table tbody tr[data-ind="${row_id}"]`).html(Mustache.to_html(tpl, m));

				setBodyHandlers();
			};

			let switchToPage = (n) => {
				page = n;
				clearBody();
				renderBody(page);

				$dialog.find('.ct-pagination-current-input').val(page + 1);
			};

			let sort = () => {
				function compare(a, b) {
					// Use toUpperCase() to ignore character casing
					let bandA;
					let bandB;

					for (let i = 0; i < a.length; i++) {
						if (i === sort_field_id) {
							bandA = a[i].value;
							break;
						}
					}

					for (let i = 0; i < b.length; i++) {
						if (i === sort_field_id) {
							bandB = b[i].value;
							break;
						}
					}

					bandA = bandA ? bandA : '';
					bandB = bandB ? bandB : '';

					if (sort_dir === 'asc') {
						let tmp = bandA;
						bandA = bandB;
						bandB = tmp;
					}

					let comparison = 0;

					if (bandA > bandB) {
						comparison = 1;
					} else if (bandA < bandB) {
						comparison = -1;
					}

					return comparison;
				}

				rows.sort(compare);

				updateHeader();
				switchToPage(0);

				// console.log('MB.CHTable', MB.CHTable);
			};

			let getColumnsIds = () => {
				let nonDynamicFieldsIds = fields.filter(row => !row.isDynamic).map(row => row.id);
				return  columns.map(row => {
					let id = +$dialog.find(`.ch_selectable[data-id="${row.col_id}"] select`).val();
					return nonDynamicFieldsIds.indexOf(id) > -1 ? id : 0;
				});
			};

			let importFromExcel_forChecker = (file) => {
				let o = {
					command: 'importFromExcel_getFields',
					object: 'project',
					params: {
						id: project_id,
						data_class: data_class,
						filename: file.dirname + '/' + file.name
					}
				};

				let timeOut = toastr.options.timeOut;
				let extendedTimeOut = toastr.options.extendedTimeOut;
				toastr.options.timeOut = 1000000;
				toastr.options.extendedTimeOut = 100;
				let info = toastr.info('The import process is in progress...');
				toastr.options.timeOut = timeOut;
				toastr.options.extendedTimeOut = extendedTimeOut;

				socketQuery(o, res => {
					info.fadeOut(100);

					if (!res.data || !res.fields) return;

					start(res);
				});
			};
			let importFromExcel_checkData = (doNotShowError = false) => {
				const columns_ids = getColumnsIds()
				if (!columns_ids.length) {
					if (!doNotShowError)
						toastr['error']('First select class fields')
					return
				}

				let o = {
					command: 'importFromExcel_checkData',
					object: 'project',
					params: {
						id: project_id,
						columns_ids: columns_ids,
						rows: rows,
						data_class: data_class
					}
				};

				let timeOut = toastr.options.timeOut;
				let extendedTimeOut = toastr.options.extendedTimeOut;
				toastr.options.timeOut = 1000000;
				toastr.options.extendedTimeOut = 100;
				let info = toastr.info('The checking process is in progress...');
				toastr.options.timeOut = timeOut;
				toastr.options.extendedTimeOut = extendedTimeOut;

				socketQuery(o, res => {
					info.fadeOut(100);

					if (res.code === 0) {
						rows = res.rows;
						renderBody(page);
					}

					console.error('importFromExcel_checkData', res);
				});
			};
			let importFromExcel_saveData = () => {
				let dynamicFieldsIds = {};
				fields.filter(row => row.isDynamic).map(row => dynamicFieldsIds[row.id] = row.column_name);
				let columnsToFields = columns.map(row => {
					let id = +$dialog.find(`.ch_selectable[data-id="${row.col_id}"] select`).val();
					return dynamicFieldsIds[id] ? {
						isDynamic: true,
						column_name: dynamicFieldsIds[id]
					} : {
						isDynamic: false,
						id: id
					};
				});

				let o = {
					command: 'importFromExcel_saveData',
					object: 'project',
					params: {
						id: project_id,
						columnsToFields: columnsToFields,
						rows: rows,
						data_class: data_class
					}
				};

				let timeOut = toastr.options.timeOut;
				let extendedTimeOut = toastr.options.extendedTimeOut;
				toastr.options.timeOut = 1000000;
				toastr.options.extendedTimeOut = 100;
				let info = toastr.info('The saving process is in progress...');
				toastr.options.timeOut = timeOut;
				toastr.options.extendedTimeOut = extendedTimeOut;

				socketQuery(o, res => {
					info.fadeOut(100);

					if (saveData_cb)
						saveData_cb(res);
				});
			};

			let setColumnsHandlers = () => {
				$dialog.find('#ch_upload_file').off('click').on('click', () => {
					let fl = new ImageLoader({
						multiple: false,
						success: file => {
							importFromExcel_forChecker(file);
						}
					});

					fl.start({
						params: {
							max_size: 1048576 * 1,
							formats: ['csv'],
							not_public: true
						}
					});
				});

				$dialog.find('.ch_table thead .ch_sortable').off('click').on('click', (e) => {
					let name = $(e.currentTarget).attr('data-name');

					for (let i = 0; i < columns.length; i++) {
						if (columns[i].title === name) {
							sort_dir = !sort_dir || sort_dir === 'asc' || sort_field_id !== i ? 'desc' : 'asc';
							sort_field_id = i;
							break;
						}
					}

					sort();
				});

				// $('.ch_wrapper').click(() => {
				// 	console.log('columns', columns);
				// 	console.log('fields', fields);
				// });

				$('.ct-pagination-pagesCount').click(() => {
					console.log('columns', columns);
					console.log('fields', fields);
					console.log('rows', rows);
				});
			};
			let setSelect2 = () => {
				$dialog.find('.ch_table thead .ch_selectable').each((i, v) => {
					let col_id = +$(v).attr('data-id');
					let value;

					for (const column of columns) {
						if (column.col_id === col_id && column.fields && column.fields.length) {
							value = column.fields[0].obj.id;
							break;
						}
					}

					$(v).find('select')
						.select2({
							data: fields.map(row => {
								return {
									id: row.id,
									text: row.name
								}
							}),
							placeholder: 'Select field'
						})
						.val(value).trigger('change')
				});
			};
			let setBodyHandlers = () => {
				$dialog.find('.td_button.edit').off('click').on('click', (e) => {
					let $parent = $(e.currentTarget).parents('tr');
					if (!$parent || !$parent.length) return;
					let row_id = +$parent.attr('data-ind');
					if (!Number.isInteger(row_id)) return;

					// console.log(row_id, fields, rows);

					$parent.addClass('editing');

					rows.filter(row => row[0].row_id === row_id)[0].forEach(column => {
						$parent.find(`td[data-ind=${column.col_id}] .td_content`)
							.html(`<input type="text" class="td_input" value="${column.value}" />`);
					});
				});

				$dialog.find('.td_button.save').off('click').on('click', (e) => {
					let $parent = $(e.currentTarget).parents('tr');
					if (!$parent || !$parent.length) return;
					let row_id = +$parent.attr('data-ind');
					if (!Number.isInteger(row_id)) return;

					// console.log(row_id, fields, rows);

					$parent.find(`td`).each((i, v) => {
						let col_id = +$(v).attr('data-ind');
						if (col_id)
							for (let column of rows[row_id]) {
								if (column.col_id === col_id) {
									column.value = $(v).find('input').val();
									column.value = column.value ? column.value.trim() : null;
									break;
								}
							}
					});

					$parent.removeClass('editing');

					renderRow(row_id);
				});

				$dialog.find('.td_button.delete').off('click').on('click', (e) => {
					let $parent = $(e.currentTarget).parents('tr');
					if (!$parent || !$parent.length) return;
					let row_id = +$parent.attr('data-ind');
					if (row_id < 0) return;

					// console.log(row_id, fields, rows);

					for (let i in rows) {
						let columns = rows[i];
						if (columns.length && columns[0].row_id === row_id) {
							rows.splice(i, 1);
							break;
						}
					}

					switchToPage(page);
				});
			};
			let setHandlers = () => {
				$dialog.find('.ct-pagination-prev').off('click').on('click', () => {
					if (page > 0)
						switchToPage(page - 1);
				});

				$dialog.find('.ct-pagination-next').off('click').on('click', () => {
					if (page < pages_n - 1)
						switchToPage(page + 1);
				});

				$dialog.find('.ct-pagination-current-input').off('change').on('change', (e) => {
					let page_tmp = +$(e.currentTarget).val() - 1;

					if (page_tmp >= 0 && page_tmp < pages_n && page_tmp !== page) {
						switchToPage(page_tmp);
					} else {
						$dialog.find('.ct-pagination-current-input').val(page + 1);
					}
				});
			};


			importFromExcel_forChecker(file);
		}
	};
}());