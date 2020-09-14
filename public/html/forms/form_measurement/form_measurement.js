(function () {

	var modal = $('.mw-wrap').last();
	var formID = MB.Forms.justLoadedId;
	var formInstance = MB.Forms.getForm('form_measurement', formID);
	var formWrapper = $('#mw-' + formInstance.id);

	var id = formInstance.activeId;


	var tr = {
		tree: [],
		values: [],
		top_taxon: undefined,
		pictures: [],
		tree_traits: [],
		tree_holder: undefined,

		init: function () {
			formWrapper.find(`.hidden_fields`).hide();
			formWrapper.find(`.hidden_fields[data-type='${['INTEGER', 'FLOAT'].indexOf(formInstance.data.data[0].type_sysname) > -1 ? 'NUMBER' : formInstance.data.data[0].type_sysname}']`).show();
            formWrapper.find(`.hidden_fields[data-type='${formInstance.data.data[0].type_sysname}']`).show();

			formWrapper.find('.name-place').html(formInstance.data.data[0].name);

			tr.getTree(function () {
				tr.populateTree();
			});

			if (formInstance.data.data[0].sub_table_name_for_select != '') {
				tr.getTraitValues(function () {
					tr.populateTraitValues();

					tr.setHandlers();

				});
			}

			tr.getPictures(function () {
				tr.populatePictures();
			});

			tr.getLiteratureData(function () {
				tr.populateLiteratureData();

				tr.setHandlers();
			});

			if (formInstance.data.data[0].trait_type_sysname != 'SELECT') {
				formWrapper.find('.trait-select-value-add-holder-content').html('');
			}


			MB.PicEditor.getTopData((res) => {
				tr.pic_authors = res.pic_authors;
				tr.pic_copyrights = res.pic_copyrights;
				tr.pic_sources = res.pic_sources;
			});
		},


		reloadLiteratureData: function (cb) {
			tr.getLiteratureData(function () {
				tr.populateLiteratureData();

				if (typeof cb == 'function') cb();
			});
		},

		getLiteratureData: function (cb) {
			var o = {
				command: 'get',
				object: 'measurement_literature_data_link',
				params: {
					param_where: {
						measurement_id: formInstance.activeId
					}
				}
			};

			socketQuery(o, function (res) {
				if (res.code != 0) {
					toastr[res.toastr.type](res.toastr.message);
				}

				tr.literatureData = res.data;

				if (typeof cb == 'function') cb();
			});
		},

		populateLiteratureData: function () {
			var tpl = `<div class="lit-data-half"><div class="l-d-title">Taxon literature data:</div>
                        {{#taxon_data}}
                        <div class="l-d-item" data-link-id="{{id}}" data-id="{{literature_id}}">
                            <div class="l-d-name">{{article}}<br><span class="l-d-created">{{created}}</span></div>                        
                            <div class="l-d-funcs">
                                <!--<div class="l-d-btn l-d-download" data-link-id="{{id}}" data-id="{{literature_id}}"><i class="fa fa-download"></i> files</div>-->
                                <div class="l-d-btn l-d-watch" data-is-taxon="true" data-link-id="{{id}}" data-id="{{literature_id}}" data-valueid="{{taxon_id}}"><i class="fa fa-eye"></i> watch / edit</div>
                            </div>                        
                        </div>                       
                        {{/taxon_data}}
                        </div>`;

			var mo = {
				taxon_data: []
			};

			for (var i in tr.literatureData) {
				mo.taxon_data.push(tr.literatureData[i]);
			}

			formWrapper.find('.form-literature-data-holder').html(Mustache.to_html(tpl, mo));

			tr.setHandlers();
		},


		reloadPictures: () => {
			tr.getPictures(tr.populatePictures);
		},

		picturesEditor: function () {

			function getDataByName(name) {

				var items = $('.pic-desc-item');

				for (var i = 0; i < items.length; i++) {
					var t = items.eq(i);
					var tname = t.attr('data-name');

					if (tname == name) {

						var res = {
							desc: t.find('.pic-desc-textarea').val(),
							author_id: t.find('.pic-author').val(),
							pic_source_id: t.find('.pic-source').val(),
							copyright_id: t.find('.pic-copyright').val()
						};
						return res;

					}
				}

			}

			let tpl = MB.PicEditor.getTplEditor(['external_id', 'description']);
			let mo = MB.PicEditor.getMOEditor(tr.pictures,
				null, tr.pic_authors, tr.pic_copyrights, tr.pic_sources);

			let dialog = bootbox.dialog({
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
								object: 'measurement_picture',
								params: {
									id: formInstance.activeId,
									pictures: []
								}
							};

							for (var k in tr.pictures) {
								var p = tr.pictures[k];

								var name = p.name;
								var pic_id = p.id;

								var desc = getDataByName(name).desc;

								var author_id = getDataByName(name).author_id;
								var pic_source_id = getDataByName(name).pic_source_id;
								var copyright_id = getDataByName(name).copyright_id;

								o.params.pictures.push({
									id: pic_id,
									measurement_id: formInstance.activeId,
									description: (desc) ? desc : '',

									author_id: author_id,
									pic_source_id: pic_source_id,
									copyright_id: copyright_id
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
			}).on('shown.bs.modal', function () {
				dialog.removeAttr("tabindex");

				for (let i in tr.pictures) {
					let row = tr.pictures[i];

					initSelect2WithAdding(`.pic-desc-item[data-id='${row.id}'] select.pic-author`, row.authors, 'measurement_picture', 'author');

					initSelect2WithAdding(`.pic-desc-item[data-id='${row.id}'] select.pic-source`, row.sources, 'measurement_picture', 'pic_source');

					initSelect2WithAdding(`.pic-desc-item[data-id='${row.id}'] select.pic-copyright`, row.copyrights, 'measurement_picture', 'copyright');
				}
			});

		},

		getPictures: function (cb) {
			var o = {
				command: 'getPictures',
				object: 'measurement',
				params: {
					id: formInstance.activeId
				}
			};

			socketQuery(o, function (res) {
				if (res.code != 0) {
					toastr[res.toastr.type](res.toastr.message);
				}

				tr.pictures = res.pictures || [];

				if (typeof cb == 'function') {
					cb();
				}
			});
		},

		populatePictures: function () {
			var tpl, mo;

			if (tr.pictures && tr.pictures.length == 0) {

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
				        </div>
				        <div class="remove-trait-picture remove_image" data-picid="{{id}}"><i class="fa fa-trash-o"></i></div>
				        {{{author}}}
				        {{{copyright}}}
				        {{{pic_source}}}
			        </div>
			        {{/taxonPictures}}
		        `;

				mo = {
					taxonPictures: []
				};

				for (var i in tr.pictures) {
					var p = tr.pictures[i];

					let obj = {
						id: p.id,
						img: p.name,
						img_small: p.name_small,
						img_mini: p.name_mini,
						author: p.author ? `<div class="pic_holder_text"><span class="title">Author: </span><span>${p.author}</span></div>` : '',
						copyright: p.copyright ? `<div class="pic_holder_text"><span class="title">Copyright: </span><span>${p.copyright}</span></div>` : '',
						pic_source: p.pic_source ? `<div class="pic_holder_text"><span class="title">Source: </span><span>${p.pic_source}</span></div>` : '',
						description: p.description ? `<div class="pic_holder_text"><span class="title">Description: </span><span>${p.description}</span></div>` : '',
					};

					obj.label = `
							<div class="picture-data-holder-modal">
							    ${obj.author}
							    ${obj.copyright}
							    ${obj.pic_source}
							    ${obj.description}
                            </div>`;

					mo.taxonPictures.push(obj);
				}
			}


			formWrapper.find('.taxon-pictures').html(Mustache.to_html(tpl, mo));

			formWrapper.find('.remove-trait-picture').off('click').on('click', function () {

				var o = {
					command: 'remove',
					object: 'measurement_picture',
					params: {
						id: $(this).attr('data-picid')
					}
				};

				socketQuery(o, function (res) {
					tr.reloadPictures();
				});

			});
		},


		setParentalTaxon: function () {

			var o = {
				command: 'getTopTaxon',
				object: 'Taxon_avalible_trait',
				params: {
					id: formInstance.activeId
				}
			};

			socketQuery(o, function (res) {

				if (res.code != 0) {
					toastr[res.toastr.type](res.toastr.message);
					return;
				}

				tr.top_taxon = res.top_taxon;

				if (tr.top_taxon) {

					var holder = formWrapper.find('.top-taxon-holder');

					var tpl = '<div class="top-taxon-link" data-id="' + tr.top_taxon.id + '">' + tr.top_taxon.name + '</div>';

					holder.html(tpl);
				}

			});


			return;

			var pid = (formInstance.data.extra_data.top_taxon) ? formInstance.data.extra_data.top_taxon : 'NO_TOP_TAXON';

			if (pid != 'NO_TOP_TAXON') {


			}


		},


		getTree: function (cb) {

			var o = {
				command: 'getTree',
				object: 'measurement',
				params: {
					id: formInstance.activeId
				}
			};

			socketQuery(o, function (res) {

				if (res.code != 0) {
					toastr[res.toastr.type](res.toastr.message);
					return;
				}

				tr.tree = res.tree;

				if (typeof cb == 'function') {
					cb();
				}

			});


		},

		populateTree: function () {


			var holder = formWrapper.find('.traits-tree-holder');

			holder.jstree({
				'core': {
					'multiple': false,
					'data': function (node, cb) {
						if (node.id === "#") {
							cb(tr.tree.core.data);
						}
						else {
							// debugger;
							var o = {
								command: 'getTreeChilds',
								object: 'measurement',
								params: {
									taxon_id: node.id
								}
							};

							socketQuery(o, function (res) {

								if (!res.code == 0) {
									toastr[res.toastr.type](res.toastr.message);
									return false;
								}
								console.log('TREE DATA', res.tree.core.data);

								cb(res.tree.core.data);
							});
						}
					}
				}
			});


			holder.on('select_node.jstree', function (e, a) {
				// var id = a.node.id;
				// formInstance.activeId = id;
				// formInstance.tablePKeys['data'][0] = id;
				//
				// formInstance.reloadByActiveId(function(newFormInstance){
				//     tr.reload();
				//     formWrapper.find('.name-place').html(formInstance.data.data[0].name);
				//
				// });
			});

			// return;


			// tr.tree_holder = formWrapper.find('.traits-tree-holder');
			//
			// tr.tree_holder.jstree(tr.tree);

			tr.setHandlers();

			holder.off('select_node.jstree').on('select_node.jstree', function (e, node) {

				var id = node.node.id;

				var o = {
					command: 'get',
					object: 'measurement',
					params: {
						param_where: {
							taxon_id: id
						}
					}
				};

				socketQuery(o, function (res) {

					if (res.code != 0) {
						toastr[res.toastr.type](res.toastr.message);
						return;
					}

					tr.tree_traits = res.data;

					tr.populateTreeTraits();

					console.log('INNER NODE', res);

				});

			});
			//holder.on('select_node.jstree', function (e) {
			//
			//    console.log('NODE', e);
			//
			//
			//});

		},


		getTraitValues: function (cb) {

			var o = {
				command: 'get',
				object: formInstance.data.data[0].sub_table_name_for_select,
				params: {}
			};

			socketQuery(o, function (res) {

				if (res.code != 0) {
					toastr[res.toastr.type](res.toastr.message);
					return false;
				}

				tr.values = res.data;

				if (typeof cb == 'function') {
					cb();
				}

			});

		},

		populateTraitValues: function () {

			var holder = formWrapper.find('.trait-select-value-add-holder-content');

			holder.html('');

			var tpl = '{{#vals}}<div class="trait-select-value-add-item row" data-id="{{id}}">' +
				'<div class="col-md-4"><input type="text" class="trait-select-value-add form-control" value="{{name}}" data-id="{{id}}"/></div>' +
				'<div class="col-md-8"><textarea class="trait-select-value-description">{{description}}</textarea></div>' +
				'<span class="trait-select-value-remove fa fa-trash-o"></span>' +
				'</div>{{/vals}}';

			var mo = {
				vals: []
			};

			for (var i in tr.values) {
				mo.vals.push({
					id: tr.values[i].id,
					name: tr.values[i].name,
					description: tr.values[i].definition
				});
			}

			holder.html(Mustache.to_html(tpl, mo));


		},

		populateTreeTraits: function () {

			var tpl = '<h3>Taxon traits/characters:</h3><div class="tree-traits-list">{{#traits}}<div class="tree-trait-item" data-id="{{id}}">{{name}}</div>{{/traits}}</div>';

			var mo = {
				traits: []
			};

			for (var i in tr.tree_traits) {
				var tt = tr.tree_traits[i];
				mo.traits.push({
					id: tt.id,
					name: tt.name
				});
			}

			formWrapper.find('.tree-traits-holder').html(Mustache.to_html(tpl, mo));

			tr.setHandlers();

		},

		setHandlers: function () {

			formWrapper.find('.add-trait-value').off('click').on('click', function () {

				var holder = formWrapper.find('.trait-select-value-add-holder-content');

				holder.append(`<div class="trait-select-value-add-item new-trait-value" data-id="NEW">
                                    <label>Value:</label>
                                    <input type="text" class="trait-select-value-add form-control" data-id="{{id}}"/>
                                    <label>Definition:</label>
                                    <textarea class="trait-select-value-description"></textarea>
                                    <span class="trait-select-value-remove  fa fa-trash-o"></span>
                                </div>`);

				tr.setHandlers();

			});

			formWrapper.find('.trait-select-value-add, .trait-select-value-description').off('change').on('change', function () {

				var p = $(this).parents('.trait-select-value-add-item');
				var id = p.attr('data-id');
				var val = p.find('.trait-select-value-add').val();
				var desc = p.find('.trait-select-value-description').val();

				if (id == 'NEW') {

					var o = {
						command: 'add',
						object: formInstance.data.data[0].sub_table_name_for_select,
						params: {
							name: val,
							definition: desc
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

					var o = {
						command: 'modify',
						object: formInstance.data.data[0].sub_table_name_for_select,
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

			formWrapper.find('.trait-select-value-remove').off('click').on('click', function () {

				var p = $(this).parents('.trait-select-value-add-item');
				var id = p.attr('data-id');

				bootbox.confirm('Please, confirm operation.', function (res) {

					if (res) {
						var o = {
							command: 'remove',
							object: formInstance.data.data[0].sub_table_name_for_select,
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


			});

			formWrapper.find('.load-pictures').off('click').on('click', function () {
				var pics = [];


				let curr_user;

				let o = {
					command: 'get_me',
					object: 'User'
				};

				socketQuery(o, (res) => {
					curr_user = res && res.user ? res.user : null;

					fl.start();
				});


				function getDataByName(name) {

					var items = $('.pic-desc-item');

					for (var i = 0; i < items.length; i++) {
						var t = items.eq(i);
						var tname = t.attr('data-name');

						if (tname == name) {

							var res = {
								description: t.find('.pic-desc-textarea').val()
							};
							res.description = res.description ? res.description : '';
							return res;

						}
					}

				}


				var fl = new ImageLoader({
					dir: 'upload/Taxon_pictures/',
					success: function (file) {

						var pc = this.InProcessCounter;

						if (pc > 0) {

							pics.push(file);

							return;

						} else {

							pics.push(file);

							var tpl = MB.PicEditor.getTpl(['external_id', 'description']);

							var mo = {
								pics: pics
							};

							let pic_authors = MB.PicEditor.getAuthorsForPic(tr.pic_authors, curr_user.fio);
							let pic_copyrights = MB.PicEditor.getCopyrightForPic(tr.pic_copyrights, 'CC-BY');
							let pic_sources = MB.PicEditor.getSourceForPic(tr.pic_sources, 'Ecotaxonomy');

							let dialog = bootbox.dialog({
								title: 'Set pictures definitions',
								message: Mustache.to_html(tpl, mo),
								className: 'wide-modal',
								buttons: {
									success: {
										label: 'Save',
										callback: function () {

											var o = {
												command: 'addByList',
												object: 'measurement_picture',
												params: {
													measurement_id: formInstance.activeId,
													pictures: []
												}
											};

											let author_id = $('.pics-desc-holder_common_info').find('.pic-author').val();
											let pic_source_text = $('.pics-desc-holder_common_info').find('.pic-source-text').val();
											let pic_source_id = $('.pics-desc-holder_common_info').find('.pic-source').val();
											let copyright_id = $('.pics-desc-holder_common_info').find('.pic-copyright').val();

											for (var k in pics) {
												var p = pics[k];
												var name = p.name;

												let data = getDataByName(name);
												data.measurement_id = formInstance.activeId;
												data.name = p.name;
												data.author_id = author_id;
												data.pic_source_text = pic_source_text;
												data.pic_source_id = pic_source_id;
												data.copyright_id = copyright_id;

												o.params.pictures.push(data);
											}


											socketQuery(o, function (res) {
												tr.reloadPictures();
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
								dialog.removeAttr("tabindex");

								initSelect2WithAdding(`.pics-desc-holder_common_info select.pic-author`, pic_authors, 'measurement_picture', 'author', (dialog) => {
									if (curr_user) {
										$(dialog).find('[data-column="firstname"]').val(curr_user.firstname);
										$(dialog).find('[data-column="lastname"]').val(curr_user.lastname);
										$(dialog).find('[data-column="midname"]').val(curr_user.midname);
									}
								});

								initSelect2WithAdding(`.pics-desc-holder_common_info select.pic-source`, pic_sources, 'measurement_picture', 'pic_source');

								initSelect2WithAdding(`.pics-desc-holder_common_info select.pic-copyright`, pic_copyrights, 'measurement_picture', 'copyright');
							});

							//END


						}

					}
				});

			});

			formWrapper.find('.modify-pictures-trait').off('click').on('click', function () {

				tr.picturesEditor();

			});


			formWrapper.find('.tree-trait-item').off('click').on('click', function () {
				var id_tmp = $(this).attr('data-id');
				var namePlace = formWrapper.find('.name-place').eq(0);


				formWrapper.find('.trait-select-value-add-holder-content').html('');

				id = id_tmp;
				formInstance.activeId = +id_tmp;
				formInstance.tablePKeys.data[0] = +id_tmp;

				formInstance.reloadByActiveId(function (newFormInstance) {
					// traitsEditor.reload();
					// formWrapper.find('.name-place').html(formInstance.data.data[0].name);
				});

				// formInstance.reloadByActiveId(function(){
				//     formInstance.reload();
				//         // if(formInstance.data.data[0].sub_table_name_for_select != ''){
				//         //     tr.getTraitValues(function () {
				//         //         tr.populateTraitValues();
				//         //
				//         //         tr.setHandlers();
				//         //
				//         //     });
				//         // }
				//     formWrapper.find('.name-place').html(formInstance.data.data[0].name);
				//
				// });

				// formInstance.reload(function () {
				// 	formWrapper.find('.name-place').html(formInstance.data.data[0].name);
				//
				// });


				// formInstance.reload(function () {
				//
				//     console.log('HERE!', formInstance.data.data[0].name, formWrapper.find('.name-place'));
				//
				//     setTimeout(function () {
				//         formWrapper.find('.name-place').html(formInstance.data.data[0].name);
				//     }, 300);
				//     // if(formInstance.data.data[0].sub_table_name_for_select != ''){
				//     //     tr.getTraitValues(function () {
				//     //         tr.populateTraitValues();
				//     //
				//     //         tr.setHandlers();
				//     //
				//     //     });
				//     // }
				//
				//
				// });

			});


			formWrapper.find('.tep-litdata, .add-taxon-lit-data, .l-d-watch').off('click').on('click', function () {
				var is_watch = $(this).hasClass('l-d-watch');

				var row_id;
				var link_row_id = +$(this).attr('data-link-id');

				if (is_watch) {
					var arr = tr.literatureData;

					var mo = {};

					for (var i in arr) {
						if (arr[i]['id'] === link_row_id) {
							mo = arr[i];
							row_id = arr[i].literature_id;
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

						afterImagesLoaded();
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

					afterImagesLoaded();
				}

				function afterImagesLoaded() {
					let lit_data_obj = new MB.LitData.init(row_id, link_row_id, mo,
						'measurement', formInstance.activeId);

					let $dialog_lit_data = bootbox.dialog({
						title: `Literature data of ${formInstance.data.data[0].name}.`,
						message: Mustache.to_html(MB.LitData.getTPL(), mo),
						className: 'lit_modal_wrapper',
						buttons: {
							delete: {
								label: 'Delete',
								callback: function () {
									lit_data_obj.delete((res) => {
										if (res.code === 0) $(`.l-d-item[data-link-id="${link_row_id}"]`).remove();

										tr.reloadLiteratureData();
									});
								}
							},
							success: {
								label: 'Confirm',
								callback: function () {
									lit_data_obj.save((res) => {
										if (res && res.code && res.code !== 0) toastr[res.toastr.type](res.toastr.message);

										tr.reloadLiteratureData();
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
		}

	};

	formInstance.doNotGetScript = true;
	formInstance.afterReload = function (cb) {
		// Можно запихнуть все что нужно вызвать при релоаде без загрузки нового скрипта.
		tr.init();
		cb();
	};

	tr.init();

}());