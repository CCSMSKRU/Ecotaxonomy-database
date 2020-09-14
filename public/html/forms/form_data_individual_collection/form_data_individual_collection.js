(function () {
	var formID = MB.Forms.justLoadedId;
	var formInstance = MB.Forms.getForm('form_data_individual_collection', formID);
	var formWrapper = $('#mw-' + formInstance.id);

	var id = formInstance.activeId;

	const filtersEditor = formInstance.params.filtersEditor;

	const editCollectionFilteringDecorator = function (event) {
		filtersEditor.editCollectionFiltering(event, formInstance);
	};

	const di = {
		init: () => {
			di.setHandlers();
		},

		exportCollection: () => {
			let o = {
				command: 'getColumnsForExport',
				object: 'data_individual',
				params: {
					project_id: id
				}
			};

			socketQuery(o, (res) => {
				if (res.code !== 0) return;

				let fields = [];

				fields = fields.concat(res.fields);

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
					title: 'Export collection',
					message: tpl,
					buttons: {
						success: {
							label: 'Export',
							callback: function () {
								let o = {
									command: 'export_from_project_to_excel',
									object: 'data_individual',
									params: {
										project_id: id,
										where: [
											{
												key: 'project_id',
												val1: id
											},
											filtersEditor.filters
										],
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
										project_id: id,
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
							name: 'Plot Longitude',
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

					tce = $dialog.find('.two_columns_meas.info').tce_simple({
						data: fields,
						left_label: 'Available fields',
						right_label: 'Binded fields'
					});
				});
			});

			formWrapper.find('.edit_project_collection').off('click').on('click', editCollectionFilteringDecorator);

			formWrapper.find('.export_project_collection').off('click').on('click', di.exportCollection);
		}
	};

	di.init();

}());