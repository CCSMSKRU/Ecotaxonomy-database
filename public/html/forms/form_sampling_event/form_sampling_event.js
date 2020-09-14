(function () {

	var modal = $('.mw-wrap').last();
	var formID = MB.Forms.justLoadedId;
	var formInstance = MB.Forms.getForm('form_sampling_event', formID);
	var formWrapper = $('#mw-' + formInstance.id);

	var id = formInstance.activeId;


	var se = {
		events: [],

		pictures: [],

		init: function () {
			se.getEvents(function () {
				se.populateEvents();
				se.setHandlers();
			});

			se.reloadPictures();
			se.showInherited();
		},

		reload: function () {
			se.getEvents(function () {
				se.populateEvents();
				se.setHandlers();
			});

			se.reloadPictures();
			se.showInherited();
		},

		getEvents: function (cb) {

			var o = {
				command: 'get',
				object: 'sampling_event',
				params: {
					param_where: {
						project_id: formInstance.data.data[0].project_id
					}
				}
			};

			socketQuery(o, function (res) {
				if (!res.code == 0) {
					toastr[res.toastr.type](res.toastr.message);
					return false;
				}

				se.events = res.data;

				if (typeof cb == 'function') {
					cb();
				}

			});


		},
		populateEvents: function () {

			var tpl = `{{#events}}<div class="custom-list-item" data-id="{{id}}">{{name}}<br/><span class="s-event-dates">{{datetime_start}} - {{datetime_end}}</span></div>{{/events}}`;

			var mo = {
				events: []
			};

			for (var i in se.events) {
				var e = se.events[i];

				e.datetime_start = e.datetime_start.substr(0, 10);
				e.datetime_end = e.datetime_end.substr(0, 10);

				mo.events.push(e);
			}

			formWrapper.find('.se-switcher-holder').html(Mustache.to_html(tpl, mo));

		},

		reloadPictures: () => {
			se.getPictures(se.populatePictures);
		},
		getPictures: cb => {
			let o = {
				command: 'getPictures',
				object: 'sampling_event',
				params: {
					id: formInstance.activeId
				}
			};

			socketQuery(o, res => {
				if (res.code !== 0) toastr[res.toastr.type](res.toastr.message);

				se.pictures = res.pictures || [];

				if (typeof cb === 'function') cb();
			});
		},
		populatePictures: function () {
			let tpl, mo;

			if (se.pictures && se.pictures.length === 0) {
				tpl = '<div class="no-traits col-md-12">No pictures</div>';
			} else {
				tpl = `
		            {{#pics_list}}
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
			        {{/pics_list}}
		        `;

				mo = {
					pics_list: []
				};

				for (let i in se.pictures) {
					let p = se.pictures[i];

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

					mo.pics_list.push(obj);
				}
			}


			formWrapper.find('.taxon-pictures').html(Mustache.to_html(tpl, mo));

			formWrapper.find('.remove-trait-picture').off('click').on('click', function () {
				let o = {
					command: 'remove',
					object: 'sampling_event_picture',
					params: {
						id: $(this).attr('data-picid')
					}
				};

				socketQuery(o, function (res) {
					if (res.code !== 0) return false;

					se.reloadPictures();
				});
			});
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

		setHandlers: function () {

			formWrapper.find('.custom-list-item').off('click').on('click', function () {
				id = $(this).attr('data-id');

				formInstance.activeId = id;
				formInstance.tablePKeys['data'][0] = id;

				formInstance.reloadByActiveId(function () {
					se.reload();
					formWrapper.find('.name-place').html('Sampling event: ' + formInstance.data.data[0].name);
				});
			});


			formWrapper.find('.load-pictures').off('click').on('click', function () {
				MB.PicEditor.showAddingBox('sampling_event_picture', 'sampling_event_id', id,
					['external_id', 'description'],
					() => {
						se.reloadPictures();
					});
			});

			formWrapper.find('.modify-pictures-trait').off('click').on('click', function () {
				MB.PicEditor.showEditor(se.pictures, 'sampling_event_picture',
					['external_id', 'description'],
					() => {
						se.reloadPictures();
					});
			});
		}
	};

	se.init();

}());