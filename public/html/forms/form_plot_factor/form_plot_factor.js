(function() {
	let modal = $('.mw-wrap').last();
	let formID = MB.Forms.justLoadedId;
	let formInstance = MB.Forms.getForm('form_plot_factor', formID);
	let formWrapper = $('#mw-' + formInstance.id);

	let plot_factor_id = formInstance.activeId;

	let pf = {
		tree: [],

		init: function () {
			$(`.hidden_fields`).hide();
			$(`.hidden_fields[data-type='${formInstance.data.data[0].plot_factor_type_sysname}']`).show();
			$(`.hidden_fields[data-type='${['INTEGER', 'FLOAT'].indexOf(formInstance.data.data[0].plot_factor_type_sysname) > -1 ? 'NUMBER' : formInstance.data.data[0].plot_factor_type_sysname}']`).show();

			pf.getTraitValues(function () {
				pf.populateTraitValues();
				pf.setHandlers();
			});
		},

		getTraitValues: function (cb) {

			let o = {
				command: 'get',
				object: formInstance.data.data[0].sub_table_name_for_select,
				params: {}
			};

			socketQuery(o, function (res) {

				if (res.code != 0) {
					toastr[res.toastr.type](res.toastr.message);
					return false;
				}

				pf.values = res.data;

				if (typeof cb == 'function') {
					cb();
				}

			});

		},

		populateTraitValues: function () {

			let holder = formWrapper.find('.trait-select-value-add-holder-content');

			holder.html('');

			let tpl = '{{#vals}}<div class="trait-select-value-add-item row" data-id="{{id}}">' +
				'<div class="col-md-4"><input type="text" class="trait-select-value-add form-control" value="{{name}}" data-id="{{id}}"/></div>' +
				'<div class="col-md-8"><textarea class="trait-select-value-description">{{description}}</textarea></div>' +
				'<span class="trait-select-value-remove fa fa-trash-o"></span>' +
				'</div>{{/vals}}';

			let mo = {
				vals: []
			};

			for (let i in pf.values) {
				mo.vals.push({
					id: pf.values[i].id,
					name: pf.values[i].name,
					description: pf.values[i].definition
				});
			}

			holder.html(Mustache.to_html(tpl, mo));


		},

		setHandlers: function () {
			formWrapper.find('.add-trait-value').off('click').on('click', function () {
				let holder = formWrapper.find('.trait-select-value-add-holder-content');

				holder.append(`<div class="trait-select-value-add-item new-trait-value" data-id="NEW">
                                    <label>Value:</label>
                                    <input type="text" class="trait-select-value-add form-control" data-id="{{id}}"/>
                                    <label>Definition:</label>
                                    <textarea class="trait-select-value-description"></textarea>
                                    <span class="trait-select-value-remove  fa fa-trash-o"></span>
                                </div>`);

				pf.setHandlers();
			});

			formWrapper.find('.trait-select-value-add, .trait-select-value-description').off('change').on('change', function () {

				let p = $(this).parents('.trait-select-value-add-item');
				let id = p.attr('data-id');
				let val = p.find('.trait-select-value-add').val();
				let desc = p.find('.trait-select-value-description').val();

				if (id == 'NEW') {

					let o = {
						command: 'add',
						object: formInstance.data.data[0].sub_table_name_for_select,
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
		}
	};

	pf.init();

	formInstance.doNotGetScript = true;
	formInstance.afterReload = function (cb) {
		// Можно запихнуть все что нужно вызвать при релоаде без загрузки нового скрипта.
		pf.init();
		cb();
	};
}());
