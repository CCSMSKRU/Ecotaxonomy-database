(function () {
	var formID = MB.Forms.justLoadedId;
	var formInstance = MB.Forms.getForm('form_data_individual_new', formID);
	var formWrapper = $('#mw-' + formInstance.id);

	var id = formInstance.activeId;

	let di = {
		init: () => {
			async.parallel([
				cb => {
					di.getProjectDefaultTaxa((res) => {
						di.populateProjectDefaultTaxa(res);
						cb(null);
					});
				},
				cb => {
					di.getProjectParentalTaxa((res) => {
						di.populateParentalProjectDefaultTaxa(res);
						cb(null);
					});
				},
				cb => {
					di.getAdditionalTaxa((res) => {
						di.populateAdditionalTaxa(res);
						cb(null);
					});
				}
			], () => {
				di.initSelectTaxon();
				di.setHandlers();
			});
		},

		initSelectTaxon: () => {
			let $select_taxon = initCustomSelect({
				selector: formWrapper.find('select[name=taxon]'),
				class_name: 'taxon',
				placeholder: 'Select taxon ...'
			});

			$select_taxon.on('select2:select', (e) => {
				let taxon_id = +e.params.data.id;

				let list = formWrapper.find('.di_taxons_list.additional_taxa li');

				let found = false;

				for (let i = 0; i < list.length; i++) {

					let elem = list.eq(i);

					if (elem.attr('data-id') == taxon_id) {
						found = true;
					}
				}

				if (found) {
					toastr['info']('Taxon is already exist');
					$select_taxon.select2("val", "");
					return false;
				} else {
					let o = {
						command: 'add',
						object: 'event_additional_taxon',
						params: {
							sampling_event_id: id,
							taxon_id: taxon_id
						}
					};

					socketQuery(o, (res) => {
						di.getAdditionalTaxa((res) => {
							di.populateAdditionalTaxa(res);
							di.setHandlers();
						});
					});
				}


			});
		},

		getProjectDefaultTaxa: (cb) => {
			let o = {
				command: 'get',
				object: 'project_available_taxon',
				params: {
					param_where: {
						project_id: formInstance.data.data[0].project_id
					},
					collapseData: false
				}
			};

			socketQuery(o, cb);
		},
		populateProjectDefaultTaxa: (res) => {
			let tpl = `
            {{#list}}
            <li data-id="{{taxon_id}}">{{taxon}}</li>
            {{/list}}
            `;

			formWrapper.find('.project_taxa').html(Mustache.to_html(tpl, {
				list: res
			}))
		},

		getProjectParentalTaxa: (cb) => {
			let o = {
				command: 'getParentTaxon',
				object: 'project',
				params: {
					id: formInstance.data.data[0].project_id
				}
			};

			socketQuery(o, cb);
		},
		populateParentalProjectDefaultTaxa: (res) => {
			let tpl = `
            {{#list}}
            <li data-id="{{taxon_id}}">{{taxon}}</li>
            {{/list}}
            `;

			formWrapper.find('.parental_taxa').html(Mustache.to_html(tpl, {
				list: res.project_available_taxon
			}))
		},

		getAdditionalTaxa: (cb) => {
			let o = {
				command: 'get',
				object: 'event_additional_taxon',
				params: {
					param_where: {
						sampling_event_id: id
					},
					collapseData: false
				}
			};

			socketQuery(o, cb);
		},
		populateAdditionalTaxa: (res) => {
			let tpl = `
            {{#list}}
            <li data-id="{{taxon_id}}">{{taxon}}</li>
            {{/list}}
            `;

			formWrapper.find('.additional_taxa').html(Mustache.to_html(tpl, {
				list: res
			}))
		},

		setHandlers: () => {
			formWrapper.find('.print_labels').off('click').on('click', () => {
				let tce;
				let tpl = `
                    <h4>Select information that is needed on the labels</h4>
                    <div class="two_columns_meas info"></div>
                `;

				let $dialog = bootbox.dialog({
					title: 'Print labels',
					message: tpl,
					buttons: {
						success: {
							label: 'Print',
							callback: function () {
								let o = {
									command: 'printLabels',
									object: 'sampling_event',
									params: {
										project_id: formInstance.data.data[0].project_id,
										sampling_event_id: id,
										fields: tce.getData()
									}
								};

								socketQuery(o, (res) => {
									var linkName = 'my_download_link' + MB.Core.guid();
									$("body").prepend(`<a id="${linkName}" href="${res.path}/${res.filename}" download="labels.xlsx" style="display:none;"></a>`);

									var jqElem = $('#' + linkName);
									jqElem[0].click();
									jqElem.remove();
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
					let fields = [
						{
							field: 'sampling_event_id',
							name: 'Sampling event ID',
							checked: true
						},
						{
							field: 'sampling_event',
							name: 'Sampling event name',
							checked: true
						},
						{
							field: 'sampling_event_datetime_start',
							name: 'Sampling event date start',
							checked: true
						},
						{
							object: 'plot',
							field: 'plot_id',
							name: 'Plot ID',
							checked: true
						},
						{
							object: 'plot',
							field: 'plot',
							name: 'Plot name',
							checked: true
						},
						{
							object: 'plot',
							field: 'location',
							name: 'Location',
							checked: true
						},
						{
							object: 'plot',
							field: 'latitude',
							name: 'Latitude',
							checked: true
						},
						{
							object: 'plot',
							field: 'longitude',
							name: 'Longitude',
							checked: true
						},
						{
							field: 'id',
							name: 'Organism ID',
							checked: true
						},
						{
							object: 'data_individual',
							field: 'name',
							name: 'Organism name',
							checked: true
						},
						{
							field: 'storage',
							name: 'Storage name',
							checked: true
						},
						{
							field: 'taxon',
							name: 'Taxon name',
							checked: true
						},
						{
							field: 'individual_count',
							name: 'Organism count',
							checked: true
						},
						{
							field: 'created_by_user',
							name: 'Added by (firstname)',
							checked: true
						},
						{
							field: 'created_by_user_lastname',
							name: 'Added by (lastname)',
							checked: true
						}
					];

					//todo add measurements to the list

					tce = $dialog.find('.two_columns_meas.info').tce_simple({
						data: fields,
						left_label: 'Available fields',
						right_label: 'Binded fields'
					});
				});
			});

			formWrapper.find('.finish-the-sample').off('click').on('click', () => {

				if (formInstance.changes.length > 0 || formInstance.tblInstances[0].ct_instance.changes.length > 0) {

					if (formInstance.changes.length > 0) {

						formInstance.save(function () {

							formInstance.remove();

						});

					} else if (formInstance.tblInstances[0].ct_instance.changes.length > 0) {

						formInstance.tblInstances[0].save(function () {

							formInstance.remove();

						});

					}


				} else {

					formInstance.remove();

				}


			});

			formWrapper.find('.di_taxons_list li').off('click').on('click', (e) => {
				let taxon_id = $(e.currentTarget).attr("data-id");

				let o = {
					command: 'add',
					object: 'data_individual',
					params: {
						sampling_event_id: formInstance.data.data[0].id,
						project_id: formInstance.data.data[0].project_id,
						taxon_id: taxon_id,
						individual_count: 0,
						storage_id: formInstance.data.data[0].storage_id
					}
				};

				socketQuery(o, (res) => {
					for (const tbl of formInstance.tblInstances) {
						if (tbl.client_object === "tbl_data_individual") {
							tbl.reload();
							break;
						}
					}
				});
			});
		}
	};

	di.init();

}());
