(function () {

	let tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
	let tableInstance = MB.Tables.getTable(tableNId);

	tableInstance.ct_instance.ctxMenuData = [
		{
			name: 'option1',
			title: 'Open',
			disabled: function () {
				return false;
			},
			callback: function () {
				tableInstance.openRowInModal();
			}
		},
		{
			name: 'option2',
			title: 'Duplicate',
			disabled: function () {
				return false;
			},
			callback: function () {
				let row = tableInstance.ct_instance.selectedRowIndex;
				let id = tableInstance.data.data[row].id;

				let o = {
					command: 'duplicate',
					object: 'storage',
					params: {
						id: id
					}
				};

				socketQuery(o, res => {
					if (!res.id) return;

					let formId = MB.Core.guid();

					let openInModalO = {
						id: formId,
						name: 'form_storage',
						class: 'storage',
						client_object: 'form_storage',
						type: 'form',
						ids: [res.id],
						position: 'center',

						tablePKeys: {data_columns: ["id"], data: [res.id]}
					};

					let form = new MB.FormN(openInModalO);
					form.create(function () {
					});


					tableInstance.reload();
				});
			}
		}
	];

}());