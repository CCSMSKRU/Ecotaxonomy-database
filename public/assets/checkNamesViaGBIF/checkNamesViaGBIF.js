$('document').ready(function () {

	let CHTable = {
		page: 0,
		n_per_page: 25,
		sort_field_id: null,
		sort_dir: null,

		matchType_id: null,

		columns: [],
		rows: [],

		init: () => {
			CHTable.sort_field_id = null;
			CHTable.sort_dir = null;
			CHTable.pages_n = Math.ceil(CHTable.rows.length / CHTable.n_per_page);
			CHTable.setHandlers();
			CHTable.switchToPage(0);
		},
		initDefault: () => {
			let data = JSON.parse(`{"columns":[{"title":"verbatimScientificName","editable":false,"dir_asc":false,"dir_desc":false},{"title":"preferredKingdom","editable":false,"dir_asc":false,"dir_desc":false},{"title":"matchType","editable":false,"dir_asc":false,"dir_desc":false},{"title":"confidence","editable":false,"dir_asc":false,"dir_desc":false},{"title":"scientificName","editable":true,"dir_asc":false,"dir_desc":false},{"title":"status","editable":false,"dir_asc":false,"dir_desc":false},{"title":"rank","editable":false,"dir_asc":false,"dir_desc":false},{"title":"kingdom","editable":false,"dir_asc":false,"dir_desc":false},{"title":"phylum","editable":false,"dir_asc":false,"dir_desc":false},{"title":"class","editable":false,"dir_asc":false,"dir_desc":false},{"title":"order","editable":false,"dir_asc":false,"dir_desc":false},{"title":"family","editable":false,"dir_asc":false,"dir_desc":false},{"title":"genus","editable":false,"dir_asc":false,"dir_desc":false},{"title":"species","editable":false,"dir_asc":false,"dir_desc":false}],"rows":[[{"value":"Collembola"},{"value":null},{"value":"EXACT","valueHTML":"<span class=\\"badge badge--approved\\">EXACT</span>"},{"value":94},{"value":"Collembola","alternatives":[]},{"value":"ACCEPTED"},{"value":"ORDER"},{"value":"Animalia","style":"style=\\"color: #09c;\\""},{"value":"Arthropoda","style":"style=\\"color: #09c;\\""},{"value":"Entognatha","style":"style=\\"color: #09c;\\""},{"value":"Collembola","style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""}],[{"value":"Colembola"},{"value":null},{"value":"NONE","valueHTML":"<span class=\\"badge badge--error\\">NONE</span>"},{"value":100},{"value":null,"alternatives":[{"usageKey":546,"scientificName":"Collembola","canonicalName":"Collembola","rank":"ORDER","status":"ACCEPTED","confidence":79,"note":"Similarity: name=75; authorship=0; classification=-2; rank=0; status=1; singleMatch=5","matchType":"FUZZY","kingdom":"Animalia","phylum":"Arthropoda","order":"Collembola","kingdomKey":1,"phylumKey":54,"classKey":290,"orderKey":546,"synonym":false,"class":"Entognatha"}]},{"value":null},{"value":null},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""}],[{"value":"Calembala"},{"value":null},{"value":"NONE","valueHTML":"<span class=\\"badge badge--error\\">NONE</span>"},{"value":100},{"value":null,"alternatives":[]},{"value":null},{"value":null},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""}],[{"value":"Collembala"},{"value":null},{"value":"NONE","valueHTML":"<span class=\\"badge badge--error\\">NONE</span>"},{"value":100},{"value":null,"alternatives":[{"usageKey":546,"scientificName":"Collembola","canonicalName":"Collembola","rank":"ORDER","status":"ACCEPTED","confidence":79,"note":"Similarity: name=75; authorship=0; classification=-2; rank=0; status=1; singleMatch=5","matchType":"FUZZY","kingdom":"Animalia","phylum":"Arthropoda","order":"Collembola","kingdomKey":1,"phylumKey":54,"classKey":290,"orderKey":546,"synonym":false,"class":"Entognatha"}]},{"value":null},{"value":null},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""}],[{"value":"Araneidae"},{"value":null},{"value":"EXACT","valueHTML":"<span class=\\"badge badge--approved\\">EXACT</span>"},{"value":94},{"value":"Araneidae","alternatives":[{"usageKey":6515955,"scientificName":"Areneidae","canonicalName":"Areneidae","rank":"FAMILY","status":"ACCEPTED","confidence":74,"note":"Similarity: name=75; authorship=0; classification=-2; rank=0; status=1","matchType":"FUZZY","kingdom":"Animalia","phylum":"Mollusca","order":"Trochida","family":"Areneidae","kingdomKey":1,"phylumKey":52,"classKey":225,"orderKey":9715180,"familyKey":6515955,"synonym":false,"class":"Gastropoda"}]},{"value":"ACCEPTED"},{"value":"FAMILY"},{"value":"Animalia","style":"style=\\"color: #09c;\\""},{"value":"Arthropoda","style":"style=\\"color: #09c;\\""},{"value":"Arachnida","style":"style=\\"color: #09c;\\""},{"value":"Araneae","style":"style=\\"color: #09c;\\""},{"value":"Araneidae","style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""}],[{"value":"Araeidae"},{"value":null},{"value":"NONE","valueHTML":"<span class=\\"badge badge--error\\">NONE</span>"},{"value":100},{"value":null,"alternatives":[{"usageKey":7877,"scientificName":"Aradidae","canonicalName":"Aradidae","rank":"FAMILY","status":"ACCEPTED","confidence":74,"note":"Similarity: name=75; authorship=0; classification=-2; rank=0; status=1","matchType":"FUZZY","kingdom":"Animalia","phylum":"Arthropoda","order":"Hemiptera","family":"Aradidae","kingdomKey":1,"phylumKey":54,"classKey":216,"orderKey":809,"familyKey":7877,"synonym":false,"class":"Insecta"},{"usageKey":7514,"scientificName":"Aramidae","canonicalName":"Aramidae","rank":"FAMILY","status":"ACCEPTED","confidence":74,"note":"Similarity: name=75; authorship=0; classification=-2; rank=0; status=1","matchType":"FUZZY","kingdom":"Animalia","phylum":"Chordata","order":"Gruiformes","family":"Aramidae","kingdomKey":1,"phylumKey":44,"classKey":212,"orderKey":1493,"familyKey":7514,"synonym":false,"class":"Aves"},{"usageKey":7359,"scientificName":"Araneidae","canonicalName":"Araneidae","rank":"FAMILY","status":"ACCEPTED","confidence":74,"note":"Similarity: name=75; authorship=0; classification=-2; rank=0; status=1","matchType":"FUZZY","kingdom":"Animalia","phylum":"Arthropoda","order":"Araneae","family":"Araneidae","kingdomKey":1,"phylumKey":54,"classKey":367,"orderKey":1496,"familyKey":7359,"synonym":false,"class":"Arachnida"},{"usageKey":3685,"scientificName":"Ardeidae","canonicalName":"Ardeidae","rank":"FAMILY","status":"ACCEPTED","confidence":74,"note":"Similarity: name=75; authorship=0; classification=-2; rank=0; status=1","matchType":"FUZZY","kingdom":"Animalia","phylum":"Chordata","order":"Pelecaniformes","family":"Ardeidae","kingdomKey":1,"phylumKey":44,"classKey":212,"orderKey":7190953,"familyKey":3685,"synonym":false,"class":"Aves"},{"usageKey":4707618,"scientificName":"Acraeidae","canonicalName":"Acraeidae","rank":"FAMILY","status":"ACCEPTED","confidence":-6,"note":"Similarity: name=-5; authorship=0; classification=-2; rank=0; status=1","matchType":"FUZZY","kingdom":"Animalia","phylum":"Arthropoda","order":"Lepidoptera","family":"Acraeidae","kingdomKey":1,"phylumKey":54,"classKey":216,"orderKey":797,"familyKey":4707618,"synonym":false,"class":"Insecta"}]},{"value":null},{"value":null},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""}],[{"value":"Arasidae"},{"value":null},{"value":"NONE","valueHTML":"<span class=\\"badge badge--error\\">NONE</span>"},{"value":100},{"value":null,"alternatives":[{"usageKey":7877,"scientificName":"Aradidae","canonicalName":"Aradidae","rank":"FAMILY","status":"ACCEPTED","confidence":74,"note":"Similarity: name=75; authorship=0; classification=-2; rank=0; status=1","matchType":"FUZZY","kingdom":"Animalia","phylum":"Arthropoda","order":"Hemiptera","family":"Aradidae","kingdomKey":1,"phylumKey":54,"classKey":216,"orderKey":809,"familyKey":7877,"synonym":false,"class":"Insecta"},{"usageKey":7514,"scientificName":"Aramidae","canonicalName":"Aramidae","rank":"FAMILY","status":"ACCEPTED","confidence":74,"note":"Similarity: name=75; authorship=0; classification=-2; rank=0; status=1","matchType":"FUZZY","kingdom":"Animalia","phylum":"Chordata","order":"Gruiformes","family":"Aramidae","kingdomKey":1,"phylumKey":44,"classKey":212,"orderKey":1493,"familyKey":7514,"synonym":false,"class":"Aves"},{"usageKey":9168,"scientificName":"Argasidae","canonicalName":"Argasidae","rank":"FAMILY","status":"ACCEPTED","confidence":-6,"note":"Similarity: name=-5; authorship=0; classification=-2; rank=0; status=1","matchType":"FUZZY","kingdom":"Animalia","phylum":"Arthropoda","order":"Ixodida","family":"Argasidae","kingdomKey":1,"phylumKey":54,"classKey":367,"orderKey":1425,"familyKey":9168,"synonym":false,"class":"Arachnida"},{"usageKey":4920632,"acceptedUsageKey":7713,"scientificName":"Acrasidae","canonicalName":"Acrasidae","rank":"FAMILY","status":"SYNONYM","confidence":-7,"note":"Similarity: name=-5; authorship=0; classification=-2; rank=0; status=0","matchType":"FUZZY","kingdom":"Protozoa","phylum":"Percolozoa","order":"Acrasida","family":"Acrasiaceae","kingdomKey":7,"phylumKey":72,"classKey":265,"orderKey":515,"familyKey":7713,"synonym":true,"class":"Heterolobosea"}]},{"value":null},{"value":null},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""}],[{"value":"puma concolor"},{"value":null},{"value":"EXACT","valueHTML":"<span class=\\"badge badge--approved\\">EXACT</span>"},{"value":98},{"value":"Puma concolor (Linnaeus, 1771)","alternatives":[]},{"value":"ACCEPTED"},{"value":"SPECIES"},{"value":"Animalia","style":"style=\\"color: #09c;\\""},{"value":"Chordata","style":"style=\\"color: #09c;\\""},{"value":"Mammalia","style":"style=\\"color: #09c;\\""},{"value":"Carnivora","style":"style=\\"color: #09c;\\""},{"value":"Felidae","style":"style=\\"color: #09c;\\""},{"value":"Puma","style":"style=\\"color: #09c;\\""},{"value":"Puma concolor","style":"style=\\"color: #09c;\\""}],[{"value":"abies alba"},{"value":"Plantae"},{"value":"EXACT","valueHTML":"<span class=\\"badge badge--approved\\">EXACT</span>"},{"value":97},{"value":"Abies alba Mill.","alternatives":[{"usageKey":7906030,"acceptedUsageKey":5284745,"scientificName":"Abies alba (Münchh.) Michx.","canonicalName":"Abies alba","rank":"SPECIES","status":"SYNONYM","confidence":97,"note":"Similarity: name=110; authorship=0; classification=-2; rank=5; status=0","matchType":"EXACT","kingdom":"Plantae","phylum":"Tracheophyta","order":"Pinales","family":"Pinaceae","genus":"Picea","species":"Picea glauca","kingdomKey":6,"phylumKey":7707728,"classKey":194,"orderKey":640,"familyKey":3925,"genusKey":7606064,"speciesKey":5284745,"synonym":true,"class":"Pinopsida"}]},{"value":"ACCEPTED"},{"value":"SPECIES"},{"value":"Plantae","style":"style=\\"color: #09c;\\""},{"value":"Tracheophyta","style":"style=\\"color: #09c;\\""},{"value":"Pinopsida","style":"style=\\"color: #09c;\\""},{"value":"Pinales","style":"style=\\"color: #09c;\\""},{"value":"Pinaceae","style":"style=\\"color: #09c;\\""},{"value":"Abies","style":"style=\\"color: #09c;\\""},{"value":"Abies alba","style":"style=\\"color: #09c;\\""}],[{"value":"Neoprotophthiracarus equisetosus"},{"value":null},{"value":"HIGHERRANK","valueHTML":"<span class=\\"badge badge--warning\\">HIGHERRANK</span>"},{"value":94},{"value":"Neoprotophthiracarus Mahunka, 1980","alternatives":[]},{"value":"SYNONYM"},{"value":"GENUS"},{"value":"Animalia","style":"style=\\"color: #09c;\\""},{"value":"Arthropoda","style":"style=\\"color: #09c;\\""},{"value":"Arachnida","style":"style=\\"color: #09c;\\""},{"value":"Sarcoptiformes","style":"style=\\"color: #09c;\\""},{"value":"Phthiracaridae","style":"style=\\"color: #09c;\\""},{"value":"Phthiracarus","style":"style=\\"color: #09c;\\""},{"value":null,"style":"style=\\"color: #09c;\\""}]]}`);
			console.log(data);
			CHTable.rows = data.rows;
			CHTable.columns = data.columns;
			CHTable.init();
		},

		clear: () => {
			CHTable.sort_dir = null;
			CHTable.sort_field_id = null;

			CHTable.columns = [];
			CHTable.rows = [];

			CHTable.clearHTML();
		},
		clearHTML: () => {
			$('.ch_table tbody').empty();
			$('.ch_table thead').empty();
		},
		render: (page) => {
			CHTable.renderHeader();
			CHTable.renderBody(page);
		},
		renderHeader: () => {
			let tpl = `
				<tr>
					{{#columns}}
			        <th>
			            <div class="th_content" data-name="{{title}}">
				            <div class="title">{{title}}</div>
				            {{#editable}}
				            <div class="status">(ред.)</div>
				            {{/editable}}
				            {{#dir_asc}}
				            <div class="direction">▲</div>
				            {{/dir_asc}}
				            {{#dir_desc}}
				            <div class="direction">▼</div>
				            {{/dir_desc}}
						</div>
					</th>
					{{/columns}}
				</tr>
		    `;

			let m = {
				columns: CHTable.columns.map((row, i) => {
					if (row.title === 'matchType')
						CHTable.matchType_id = +i;

					row.dir_asc = CHTable.sort_field_id === i && CHTable.sort_dir === 'asc';
					row.dir_desc = CHTable.sort_field_id === i && CHTable.sort_dir === 'desc';
					return row;
				})
			};

			$('.ch_table thead').html(Mustache.render(tpl, m));

			$('.ct-pagination-pagesCount').html(`Страницы: ${CHTable.pages_n}`);

			CHTable.setColumnsHandlers();
		},
		renderBody: (page) => {
			page = page || CHTable.page;

			let tpl = `
				{{#rows}}
				<tr>
					{{#columns}}
					<td>
						<div class="td_content {{editable}}" data-row-id="{{i}}" data-column-id="{{j}}">
							<div class="value" title="{{value}}" {{{style}}}>{{{value}}}</div>
						</div>
					</td>
					{{/columns}}
				</tr>
				{{/rows}}
		    `;

			let m = {
				rows: CHTable.rows.slice(page * CHTable.n_per_page, (page + 1) * CHTable.n_per_page).map((row, i) => {
					return {
						columns: row.map((row2, j) => {
							return {
								i: page * CHTable.n_per_page + i,
								j: j,
								editable: CHTable.columns[j].editable ? 'editable' : '',
								style: row2.style,
								value: row2.valueHTML || row2.value
							}
						})
				}
				})
			};

			$('.ch_table tbody').html(Mustache.render(tpl, m));

			CHTable.setBodyHandlers();
		},

		switchToPage: (n) => {
			CHTable.page = n;
			CHTable.clearHTML();
			CHTable.render(CHTable.page);

			$('.ct-pagination-current-input').val(n + 1);
		},

		sort: () => {
			function compare(a, b) {
				// Use toUpperCase() to ignore character casing
				let bandA;
				let bandB;

				for (let i = 0; i < a.length; i++) {
					if (i === CHTable.sort_field_id) {
						bandA = a[i].value;
						break;
					}
				}

				for (let i = 0; i < a.length; i++) {
					if (i === CHTable.sort_field_id) {
						bandB = b[i].value;
						break;
					}
				}

				bandA = bandA ? bandA : '';
				bandB = bandB ? bandB : '';

				if (CHTable.sort_dir === 'asc') {
					let tmp = bandA;
					bandA = bandB;
					bandB = tmp;
				}

				let comparison = 0;

				if (bandA > bandB) {
					comparison = 1;
				} else if (bandA < bandB) {
					comparison = -1;
				}

				return comparison;
			}

			CHTable.rows.sort(compare);
			CHTable.switchToPage(0);

			// console.log('CHTable', CHTable);
		},

		setColumnsHandlers: () => {
			$('.th_content').off('click').on('click', (e) => {
				let name = $(e.currentTarget).attr('data-name');

				for (let i = 0; i < CHTable.columns.length; i++) {
					if (CHTable.columns[i].title === name) {
						CHTable.sort_dir = !CHTable.sort_dir || CHTable.sort_dir === 'asc' || CHTable.sort_field_id !== i ? 'desc' : 'asc';
						CHTable.sort_field_id = i;
						break;
					}
				}

				CHTable.sort();
			});
		},
		setBodyHandlers: () => {
			$('.td_content.editable').off('click').on('click', (e) => {
				let $e = $(e.currentTarget);
				let i = $e.attr('data-row-id');
				let j = $e.attr('data-column-id');

				if (CHTable.columns.length <= j || !CHTable.columns[j].editable) return;
				if (CHTable.rows.length <= i) return;

				let cell = CHTable.rows[i][j];

				// console.log(cell);

				CHBox.init(cell.value, cell.alternatives, (name) => {
					if (!name && !cell.value || cell.value === name) return;

					cell.value = name;

					CHTable.rows[i][CHTable.matchType_id].value = 'EDITED';
					CHTable.rows[i][CHTable.matchType_id].valueHTML = '<span class="badge badge--edited">EDITED</span>';

					CHTable.renderBody();
				});
			});
		},
		setHandlers: () => {
			$('.ct-pagination-prev').off('click').on('click', () => {
				if (CHTable.page > 0)
					CHTable.switchToPage(CHTable.page - 1);
			});

			$('.ct-pagination-next').off('click').on('click', () => {
				if (CHTable.page < CHTable.pages_n - 1)
					CHTable.switchToPage(CHTable.page + 1);
			});

			$('.ct-pagination-current-input').off('change').on('change', (e) => {
				let page_tmp = +$(e.currentTarget).val() - 1;

				if (page_tmp >= 0 && page_tmp < CHTable.pages_n && page_tmp !== CHTable.page) {
					CHTable.switchToPage(page_tmp);
				} else {
					$('.ct-pagination-current-input').val(CHTable.page + 1);
				}
			});
		},

		api_fields: ['matchType', 'confidence', 'scientificName', 'status',
			'rank', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species']
	};

	// CHTable.initDefault();

	let CHBox = {
		cb: null,
		inputTimeout: null,

		alternatives: [],

		order: ['kingdom', 'phylum', 'class', 'order', 'family', 'genus'],
		order_ru: ['Царство', 'Тип', 'Класс', 'Отряд', 'Семейство', 'Род'],

		init: (name, alternatives, cb) => {
			CHBox.cb = typeof cb === "function" ? cb : null;
			CHBox.alternatives = alternatives;

			$('.ch_box .header').html(name || '');
			$('.ch_box input').val('');
			$('.ch_box ul').html('');
			$('.ch_box_wrapper').removeClass('hidden');

			CHBox.renderAlternatives(alternatives);
			CHBox.setHandlers();
		},
		destroy: () => {
			clearTimeout(CHTable.inputTimeout);
			CHBox.cb = null;
			CHBox.alternatives = [];
			$('.ch_box .header').html('');
			$('.ch_box input').val('');
			$('.ch_box ul').html('');
			$('.ch_box_wrapper').addClass('hidden');
		},

		renderAlternatives: (list) => {
			list = list && list.length ? list : CHBox.alternatives;

			let tpl = `
				{{#rows}}
				<li>
					<div class="name_wrapper">
						<span class="name">{{name}}</span>
						<span class="type">{{type_ru}}</span>
					</div>
					<div class="classification">
						{{#types}}
						<span>{{.}}</span>
						{{/types}}
					</div>
				</li>
				{{/rows}}
			`;

			let m = {
				rows: list.map(row => {
					let type_ru;
					let types = [];

					for (const i in CHBox.order) {
						let type = CHBox.order[i];
						if (type in row) {
							types.push(row[type]);
							type_ru = CHBox.order_ru[i];
						}
					}

					return {
						name: row.canonicalName,
						type_ru, types
					}
				})
			};

			$('.ch_box ul').html(Mustache.render(tpl, m));

			CHBox.setListHandlers();
		},

		getAlternatives: (query) => {
			$.ajax({
				url: 'https://api.gbif.org/v1/species/suggest?limit=10&q=' + query,
				method: 'GET',
				dataType: 'json',
				error: function (err) {
					console.error('err', err);

					CHBox.renderAlternatives([]);
				},
				success: function (res) {
					console.log('res', res);

					CHBox.renderAlternatives(res);
				}
			});
		},

		setHandlers: () => {
			$('#ch_box_cancel').off('click').on('click', () => {
				$('.ch_box_wrapper').addClass('hidden');
			});

			$('#ch_box_apply').off('click').on('click', () => {
				if (CHBox.cb)
					CHBox.cb($('#ch_box_input').val().trim());

				CHBox.destroy();
			});

			$('#ch_box_input').off('keydown').on('keydown', (e) => {
				clearTimeout(CHTable.inputTimeout);
				CHTable.inputTimeout = setTimeout(() => {
					let query = $(e.currentTarget).val();
					if (query.trim().length)
						CHBox.getAlternatives(query.trim());
					else
						CHBox.renderAlternatives([]);
				}, 500);
			});
		},
		setListHandlers: () => {
			$('.ch_box ul li').off('click').on('click', (e) => {
			    if (CHBox.cb)
			    	CHBox.cb($(e.currentTarget).find('.name').text());

			    CHBox.destroy();
			});
		}
	};


	// let server = 'http://127.0.0.1:86';
	let server = 'http://ecotaxonomy.org:443';

	let customQuery = function (host, data, callback, do_auth) {
		$.ajax({
			url: host,
			method: 'POST',
			dataType: 'json',
			xhrFields: { withCredentials: true },
			...data,
			error: function (err) {
				console.error('err', err);

				$('.ch_loader').addClass('hidden');
				$('.ch_status_message').html('Сервер временно недоступен.');

				return callback({code: -1, type: 'error', message: 'Сервер временно недоступен.', err:err});
			},
			success: function (res) {
				if (!do_auth && res.message === "noAuth") {
					$.ajax({
						url: server + '/api',
						method: 'POST',
						dataType: 'json',
						xhrFields: { withCredentials: true },
						data: {
							command: 'login',
							object: 'User',
							params: JSON.stringify({
								login: 'UNSECURE_API',
								password: '123'
							})
						},
						error: function (err) {
							console.error('error', err);
						},
						success: function (res) {
							console.log('success', res);
							if (res.code) return callback(res);

							return customQuery(host, data, callback, true);
						}
					});
				} else
					callback(null, res);
			}
		});
	};


	$('#ch_upload_file_input').off('change').on('change', (e) => {
		let files = document.getElementById('ch_upload_file_input').files;
		// console.log(files[0]);

		if (!files.length) return;

		$('.ch_status, .ch_loader').removeClass('hidden');
		$('.ch_status_message').html('Обработка...');

		let fd = new FormData;

		fd.append('file', files[0]);

		customQuery(server + '/checkNamesViaGBIF', {
			processData: false,
			contentType: false,
			data: fd
		}, (err, res) => {
			console.log('err', err);
			console.log('res', res);

			if (!err) {
				$('.ch_status, .ch_loader').addClass('hidden');

				if (!res.data) return;

				CHTable.rows = res.data.rows;
				CHTable.columns = res.data.columns;

				CHTable.init();
			}

			$(e.currentTarget).val(null);
		}, false);
	});

	$('#download_file').off('click').on('click', () => {
		if (!CHTable.rows.length) {
			$('.ch_loader').addClass('hidden');
			$('.ch_status').removeClass('hidden');
			$('.ch_status_message').html('Нет данных для скачивания.');
			return;
		}

		customQuery(server + '/api', {
			data: {
				command: 'checkNamesViaGBIF_downloadFile',
				object: 'taxon',
				params: JSON.stringify({
					data: {
						rows: CHTable.rows,
						columns: CHTable.columns
					}
				})
			}
		}, (err, res) => {
			console.log('err', err);
			console.log('res', res);

			if (!err) {
				$("body").prepend(`<a class="temporary_download_link" id="${res.linkName}" href="${server + res.path + res.filename}" download="${res.filename}"></a>`);

				let jqElem = $('#' + res.linkName);
				jqElem[0].click();
				jqElem.remove();
			}
		}, false);
	});

	$('#check_again').off('click').on('click', () => {
		if (!CHTable.columns.length) {
			$('.ch_loader').addClass('hidden');
			$('.ch_status').removeClass('hidden');
			$('.ch_status_message').html('Нет данных для проверки.');
			return;
		}

		$('.ch_status, .ch_loader').removeClass('hidden');
		$('.ch_status_message').html('Обработка...');

		let verbatimScientificName_id = null;
		let scientificName_id = null;

		for (const i in CHTable.columns) {
			if (verbatimScientificName_id !== null && scientificName_id !== null)
				break;

			if (CHTable.columns[i].title === 'verbatimScientificName')
				verbatimScientificName_id = +i;
			if (CHTable.columns[i].title === 'scientificName')
				scientificName_id = +i;
		}

		let columns = [];
		let rows = [];
		let rows_ids = [];

		CHTable.columns.forEach((row, i) => {
			if (CHTable.api_fields.indexOf(row.title) === -1) {
				if (i === verbatimScientificName_id)
					row.title = 'scientificName';

				columns.push(row);
				rows_ids.push(i);
			}
		});

		CHTable.rows.forEach(row => {
			if (row[scientificName_id].value)
				row[verbatimScientificName_id].value = row[scientificName_id].value;

			rows.push(row.filter((cell, i) => {
				return rows_ids.indexOf(i) > -1;
			}));
		});

		// console.log(columns);
		// console.log(rows);

		customQuery(server + '/api', {
			data: {
				command: 'checkNamesViaGBIF',
				object: 'taxon',
				params: JSON.stringify({
					data: {
						columns: columns,
						rows: rows
					}
				})
			}
		}, (err, res) => {
			console.log('err', err);
			console.log('res', res);

			if (!err) {
				$('.ch_status, .ch_loader').addClass('hidden');

				if (!res.data) return;

				CHTable.rows = res.data.rows;
				CHTable.columns = res.data.columns;

				CHTable.init();
			}
		}, false);
	});
});