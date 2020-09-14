(function () {

	let tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId)

	// tableInstance.parent_id = tableInstance.parentObject.params.project_id;

	// tableInstance.reload({}, function(){
	tableInstance.ct_instance.ctxMenuData = [
		{
			name: 'option0',
			title: 'Split',
			disabled: function () {

				var row = tableInstance.ct_instance.selectedRowIndex
				var count = tableInstance.data.data[row].individual_count

				return count <= 1

			},
			callback: function () {
				var row_ind = tableInstance.ct_instance.selectedRowIndex
				var row = tableInstance.data.data[row_ind]
				var current_count = tableInstance.data.data[row_ind].individual_count

				var tpl = `<div id="split-individual-holder">
                            <div class="form-group">
                                <label>Set count:</label>
                                <input type="number" id="split-individual-count" class="form-control" value="0" min="0" max="${current_count - 1}"/>                      
                            </div>
                            </div>`

				var box = bootbox.dialog({
					title: 'Split',
					message: tpl,
					buttons: {
						success: {
							label: 'Confirm',
							callback: function () {

								var count = $('#split-individual-count').val()

								if (+count >= +current_count || +count <= 0) {
									toastr['info']('Count must be more than 0 and lower then ' + current_count)
								} else {

									var o = {
										command: 'split',
										object: 'data_individual',
										params: {
											count: count,
											id: row.id,
											project_id: row.project_id
										}
									}

									socketQuery(o, function (res) {
										if (!res.code == 0) {
											toastr[res.toastr.type](res.toastr.message)
											return false
										}

										tableInstance.reload()

									})

								}

							}
						},
						error: {
							label: 'Cancel',
							callback: function () {

							}
						}
					}
				})

				box.find('#split-individual-count').off('input').on('input', function (event) {
					if (!this.checkValidity()) {
						this.reportValidity()
						return
					}
				})
			}
		}
	]

	let Gallery = {
		id: null,

		pictures: [],

		getImages: cb => {
			let o = {
				command: 'get',
				object: 'data_individual_picture',
				params: {
					param_where: {
						data_individual_id: Gallery.id
					},
					collapseData: false
				}
			}

			socketQuery(o, cb)
		},
		loadImages: ($dialog) => {
			Gallery.getImages((res) => {
				Gallery.populateImages($dialog, res, () => {

					Gallery.setHandlers($dialog)
				})
			})
		},
		populateImages: ($dialog, res, cb) => {
			Gallery.pictures = res

			console.log('gallery pictures', res)

			let tpl = `
                {{#images}}
                <div class="pic-block" data-id="{{id}}">
                    <div class="pic-holder gallery_image_wrapper">
                        <div class="pic-zoom fa fa-search-plus"></div>
                        <div class="pic-del fa fa-trash-o remove remove_image" data-id="{{id}}"></div>
                        <img 
                            src="upload/Taxon_pictures/{{name}}" 
                            class="tax-pic parental-pic gallery_image" 
                            data-id="{{id}}"
                            data-small-src="upload/Taxon_pictures/{{name_small}}" 
                            data-full-src="upload/Taxon_pictures/{{name}}"
                            data-label="{{label}}" />   
                    </div>
                    <div class="pic-published-holder">Published: {{{published_lbl}}}</div>
                    {{{author_lbl}}}
                    {{{copyright_lbl}}}
                    {{{pic_source_lbl}}}
                </div>
                {{/images}}
                `

			$dialog.find('.gallery_wrapper').html(Mustache.to_html(tpl, {
				images: Gallery.pictures.map(row => {
					row.author_lbl = row.author ? `<div class="pic_holder_text"><span class="title">Author: </span><span>${row.author}</span></div>` : ''
					row.copyright_lbl = row.copyright ? `<div class="pic_holder_text"><span class="title">Copyright: </span><span>${row.copyright}</span></div>` : ''
					row.pic_source_lbl = row.pic_source ? `<div class="pic_holder_text"><span class="title">Source: </span><span>${row.pic_source}</span></div>` : ''
					row.description_lbl = row.description ? `<div class="pic_holder_text"><span class="title">Description: </span><span>${row.description}</span></div>` : ''
					row.type_lbl = row.type ? `<div class="pic_holder_text"><span class="title">Type: </span><span>${row.type}</span></div>` : ''
					row.published_lbl = row.show_on_site ? '<i class="fa fa-check-circle-o"></i>' : '<i class="fa fa-times-circle-o"></i>'

					row.label = `
							<div class="picture-data-holder-modal">
							    ${row.author_lbl}
							    ${row.copyright_lbl}
							    ${row.pic_source_lbl}
							    ${row.description_lbl}
							    ${row.type_lbl}
                                <br/>
                                <div class="pic-published-holder">Published: ${row.published_lbl}</div>
                            </div>`

					return row
				})
			}))

			if (cb) cb()
		},

		setHandlers: ($dialog) => {
			$dialog.find('.pic-del').off('click').on('click', function () {
				let o = {
					command: 'remove',
					object: 'data_individual_picture',
					params: {
						id: $(this).attr('data-id')
					}
				}

				socketQuery(o, function (res) {
					if (res.code !== 0) return false

					Gallery.loadImages($dialog)
				})
			})
		}
	}


	tableInstance.ct_instance.customButtons = [
		{
			id: 1,
			buttons: [
				{
					id: 'cb11',
					icon: 'fa-image',
					placeholder: 'Gallery',
					callback: function (row) {
						let id = row.id
						Gallery.id = id

						let tpl = `
                            <div class="di_gallery_wrapper">
                                <div class="di_g_header">
                                    <div class="load-pictures di_g_load"><i class="fa fa-upload"></i>&nbsp;&nbsp;Load pictures</div>
                                    <div class="load-pictures di_g_edit"><i class="fa fa-edit"></i>&nbsp;&nbsp;Modify pictures</div>
                                </div>
                                <div class="gallery_wrapper"></div>
                            </div>
                        `

						let $dialog = bootbox.dialog({
							title: 'Organism: ' + row.name,
							message: tpl,
							className: 'wide-modal',
							buttons: {
								success: {
									label: 'Save',
									callback: function () {
										tableInstance.reload()
									}
								},
								reload: {
									label: 'Refresh',
									callback: function () {
										Gallery.loadImages($dialog)
										return false
									}
								},
								error: {
									label: 'Cancel',
									callback: function () {
									}
								}
							}
						}).on('shown.bs.modal', function () {
							Gallery.loadImages($dialog)

							$dialog.find('.di_g_load').off('click').on('click', function () {
								MB.PicEditor.showAddingBox('data_individual_picture', 'data_individual_id', Gallery.id,
									['visible', 'picture_type', 'external_id', 'description'],
									() => {
										Gallery.loadImages($dialog)
									})
							})

							$dialog.find('.di_g_edit').off('click').on('click', () => {
								MB.PicEditor.showEditor(Gallery.pictures, 'data_individual_picture',
									['visible', 'picture_type', 'external_id', 'description'],
									() => {
										Gallery.loadImages($dialog)
									})
							})
						})
					}
				}
			]
		}
	]
	// });


}())
