(function () {
	let formID = MB.Forms.justLoadedId;
	let formInstance = MB.Forms.getForm('form_storage', formID);
	let formWrapper = $('#mw-' + formInstance.id);

	setTimeout(() => {
		formWrapper.find("input[data-column='objects_to_create_n']").off('change').on('change', function () {
			let max = parseInt($(this).attr('max'));
			let min = parseInt($(this).attr('min'));

			if ($(this).val() > max) {
				$(this).val(max);
			} else if ($(this).val() < min) {
				$(this).val(min);
			}
		});
	}, 1000)
}());