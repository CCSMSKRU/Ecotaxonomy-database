(function () {
	let tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

	$(`.ct-environment-wrapper[data-id=${tableInstance.id}]`).find('.ct-btn-create-inline').remove();

	tableInstance.ct_instance.ctxMenuData = [];
}());
