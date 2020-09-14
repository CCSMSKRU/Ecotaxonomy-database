(function () {

	var modal = $('.mw-wrap').last();
	var formID = MB.Forms.justLoadedId;
	var formInstance = MB.Forms.getForm('form_plot', formID);
	var formWrapper = $('#mw-' + formInstance.id);

	var id = formInstance.activeId;

	var plotEditor = {
		changes: [],
		tree: [],

		init: function () {
			plotEditor.getTree(plotEditor.populateTree);

			plotEditor.showInherited();
			plotEditor.setHandlers();
		},
		reload: function () {
			plotEditor.showInherited();
			plotEditor.setHandlers();
		},

		getTree: function (cb) {

			var o = {
				command: 'getTree',
				object: 'Plot',
				params: {
					id: formInstance.activeId
				}
			};

			socketQuery(o, function (res) {

				if (res.code != 0) {
					toastr[res.toastr.type](res.toastr.message);
					return;
				}

				plotEditor.tree = res.tree;


				if (typeof cb == 'function') {
					cb();
				}

			});

		},


		showInherited: () => {
			formWrapper.find(`.fn-field`).removeClass('inherited_value');
			formWrapper.find('.is-parent-fader').remove();

			if (!formInstance.data.data[0].inherited_fields) return;

			formInstance.data.data[0].inherited_fields.forEach(field => {
				formWrapper.find(`.fn-field[data-column=${field.name}]`)
					.addClass('inherited_value')
					.append(`
						<div class="is-parent-fader">
		                    <div class="fader-text">Inherited: ${field.source}</div>
	                    </div>
					`);
			});
		},


		populateTree: function () {
			var holder = formWrapper.find('.plot-tree-holder');

			holder.jstree({
				'core': {
					'multiple': false,
					'data': function (node, cb) {
						if (node.id === "#") {
							cb(plotEditor.tree.core.data);
						} else {
							// debugger;
							var o = {
								command: 'getTreeChilds',
								object: 'Plot',
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

				console.log('open_node.jstree', a);

			});

			holder.on('select_node.jstree', function (e, a) {
				id = a.node.id;
				formInstance.activeId = id;
				formInstance.tablePKeys['data'][0] = id;

				formInstance.reloadByActiveId(function (newFormInstance) {
					plotEditor.reload();
					formWrapper.find('.name-place').html(formInstance.data.data[0].name);
				});
			});

		},

		setHandlers: function () {


		}
	};

	plotEditor.init();

	formInstance.doNotGetScript = true;
	formInstance.afterReload = function (cb) {
		// Можно запихнуть все что нужно вызвать при релоаде без загрузки нового скрипта.
		plotEditor.reload();
		cb();
	};


}());