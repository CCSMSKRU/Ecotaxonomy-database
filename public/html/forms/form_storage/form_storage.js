(function () {
	var modal = $('.mw-wrap').last();
	var formID = MB.Forms.justLoadedId;
	var formInstance = MB.Forms.getForm('form_storage', formID);
	var formWrapper = $('#mw-' + formInstance.id);

	var id = formInstance.activeId;

	var traitsEditor = {
		tree: [],

		tpl: `{{#items}}<div class="sample-item" data-id="{{id}}">
                <!--<div class="sample-add-holder">-->
                    <div class="sample-name">{{name}}</div>
                    <!--<div class="sample-funcs">-->
                        <!--<div class="add-label">Add:</div>-->
                        <!--<div class="add-name-holder"><input type="text" class="add-name-input" placeholder="Name"></div>-->
                        <!--<div class="select-storage-holder" data-selected-id="" data-selected-name=""><div class="s-value"><span class="unselected">Select storage</span></div><div class="s-dd"></div></div>-->
                        <!--<div class="quantity-big">-->
                            <!--<input type="number" min="0" class="to-add-count" value="0"/>-->
                        <!--</div>-->
                        <!--<div class="add-apply" data-id="{{id}}">Apply</div>                    -->
                    <!--</div>-->
                <!--</div>-->
                <div class="storage-taxon-table-holder" data-id="{{id}}"></div>
                </div>{{/items}}`,

		init: function () {
			traitsEditor.getTree(function () {
				traitsEditor.populateTree();
				traitsEditor.showInherited();
			});
		},

		reload: () => {
			traitsEditor.showInherited();
		},

		showInherited: () => {
			formWrapper.find(`.fn-field`).removeClass('inherited_value');
			formWrapper.find('.is-parent-fader').remove();

			if (!formInstance.data.data[0].inherited_fields) return;

			formInstance.data.data[0].inherited_fields.forEach(field => {
				$(`.fn-field[data-column=${field.name}]`)
					.addClass('inherited_value')
					.append(`
						<div class="is-parent-fader">
		                    <div class="fader-text">Inherited: ${field.source}</div>
	                    </div>
					`);
			});
		},

		getTree: function (cb) {
			var o = {
				command: 'getTree',
				object: 'Storage',
				params: {
					id: formInstance.activeId,
					project_id: formInstance.project_id
				}
			};

			socketQuery(o, function (res) {

				if (res.code != 0) {
					toastr[res.toastr.type](res.toastr.message);
					return;
				}

				traitsEditor.tree = res.tree;

				console.log('TREWEEEEEEEE', res.tree);

				if (typeof cb == 'function') {
					cb();
				}

			});

		},

		populateTree: function () {

			var holder = formWrapper.find('.taxon-tree-holder');

			var jstree_instance = holder.jstree({
				'core': {
					'data': function (node, cb) {
						if (node.id === "#") {
							// cb([{"text" : "Root", "id" : "7", "children" : true}]);
							cb(traitsEditor.tree.core.data);
						} else {
							var o = {
								command: 'getTreeChilds',
								object: 'storage',
								params: {
									id: node.id
								}
							};

							socketQuery(o, function (res) {

								if (!res.code == 0) {
									toastr[res.toastr.type](res.toastr.message);
									return false;
								}
								console.log('TREE DATA', res.tree.core.data);
								cb(res.tree.core.data)
							});
							// cb(["Child"]);
							// cb([{"text" : "Root2", "id" : "2", "children" : true}]);
						}
					}
				}
			});


			holder.on('select_node.jstree', function (e, a) {
				var id = a.node.id;

				formInstance.activeId = id;
				formInstance.tablePKeys['data'][0] = id;

				formInstance.reloadByActiveId(function (newFormInstance) {
					traitsEditor.reload();
					formWrapper.find('.name-place').html(formInstance.data.data[0].name);

				});

			});


		}
	};


	traitsEditor.init();

	formInstance.doNotGetScript = true;
	formInstance.afterReload = function (cb) {
		// Можно запихнуть все что нужно вызвать при релоаде без загрузки нового скрипта.
		traitsEditor.reload();
		cb();
	};
}());