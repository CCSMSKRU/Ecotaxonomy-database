/**
 * Created by iig on 29.10.2015.
 */
var MyError = require('../error').MyError;
var UserError = require('../error').UserError;
var UserOk = require('../error').UserOk;
var BasicClass = require('./system/BasicClass');
var util = require('util');
var async = require('async');
var rollback = require('../modules/rollback');
var funcs = require('../libs/functions');
var moment = require('moment');
var fs = require('fs');
var ToExcel = require('../libs/ToExcel.js');
var XlsxTemplate = require('xlsx-template');

var Model = function(obj){
    this.name = obj.name;
    this.tableName = obj.name.toLowerCase();

    var basicclass = BasicClass.call(this, obj);
    if (basicclass instanceof MyError) return basicclass;
};
util.inherits(Model, BasicClass);
Model.prototype.getPrototype = Model.prototype.get;
Model.prototype.addPrototype = Model.prototype.add;
Model.prototype.modifyPrototype = Model.prototype.modify;
Model.prototype.removeCascadePrototype = Model.prototype.removeCascade;
Model.prototype.getForSelectPrototype = Model.prototype.getForSelect;
Model.prototype.getTreePrototype_v2 = Model.prototype.getTree_v2;

Model.prototype.init = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    Model.super_.prototype.init.apply(this, [obj , function (err) {
        cb(null);
    }]);
};

Model.prototype.get = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var client_object = _t.client_object || '';

    var coFunction = 'get_' + client_object;
    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb);
    } else {
        if (typeof _t['get_'] === 'function') {
            _t['get_'](obj, cb);
        } else {
            _t.getPrototype(obj, cb);
        }
    }
};

Model.prototype.get_ = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	if (obj.collapseData === false) return _t.getPrototype(obj, cb);


	//Inheritance
	let fields = ['altitude', 'longitude', 'latitude', 'coordinate_uncertainty',
        'plot_id', 'plot', 'storage_id', 'storage', 'location_id', 'location', 'habitat_id', 'habitat', 'datetime_start'];
	function getParent(classname, id, cb) {
		let o = {
		    command: 'getById',
		    object: classname,
		    params: {
			    id: id
		    }
		};

		_t.api(o, (err, res) => {
			if (err) return cb(err);
			cb(res && res[0] ? res[0] : null);
		});
	}
	let parents = {};
	function checkField(classname, parent_id, parent_name, suffix, item, field, ind, cb) {
		parent_id = ind === 0 ? parent_id : 'parent_id';
		suffix = ind === 0 ? suffix : '_parent';
		parent_name = ind === 0 ? parent_name : 'parent_name';

		if (item[field]) {
			cb(item[field], item.name);
		} else if (item[field + suffix]) {
			cb(item[field + suffix], item[parent_name]);
		} else if (parents[classname] && parents[classname].length && ind < parents[classname].length) {
			checkField(classname, parent_id, parent_name, suffix, parents[classname][ind], field, ind + 1, cb);
		} else if (!item[parent_id]) {
			cb(null);
		} else {
			getParent(classname, item[parent_id], (parent) => {
				if (parent) {
					if (!parents[classname])
						parents[classname] = [];
					parents[classname].push(parent);
					return checkField(classname, parent_id, parent_name, suffix, parents[classname][ind], field, ind, cb);
				}

				cb(null);
			});
		}
	}

	let items = [];
	let addData;

	async.series({
		getProto: cb => {
			obj.collapseData = false;
			_t.getPrototype(obj, (err, res, additionalData) => {
				if (err) return cb(err);

				items = res;
				addData = additionalData;

				cb(null);
			});
		},
		operate: cb => {
			async.eachSeries(items, (item, cb) => {
				if (!item.inherited_fields)
					item.inherited_fields = [];

				async.eachSeries(fields, (field, cb) => {
					if (item[field])
						return cb(null);

					async.series({
						checkField_parent: cb => {
							checkField('sampling_event', 'parent_id', 'parent_name', '_parent', item, field, 0, (value, source) => {
								if (value && source) {
									item[field] = value;
									item.inherited_fields.push({
										name: field,
										source: source
									});
								}

								cb(null);
							});
						},
						checkField_plot: cb => {
							if (item[field]) return cb(null);

							checkField('plot', 'plot_id', 'plot', '_plot', item, field, 0, (value, source) => {
								if (value && source) {
									item[field] = value;
									item.inherited_fields.push({
										name: field,
										source: source
									});
								}

								cb(null);
							});
						}
					}, cb);
				}, cb);
			}, cb);
		},
		collapseData: cb => {
			let tmp = funcs.collapseData(items, null, addData.data_columns);

			tmp.extra_data.count = addData.count;
			tmp.extra_data.count_all = addData.count_all;

			cb(null, tmp);
		}
	}, (err, res) => {
		if (err) return cb(err);
		cb(null, res.collapseData);
	});
};

Model.prototype.add = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var client_object = _t.client_object || '';

    var coFunction = 'add_' + client_object;
    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb);
    } else {
        if (typeof _t['add_'] === 'function') {
            _t['add_'](obj, cb);
        } else {
            _t.addPrototype(obj, cb);
        }
    }
};

Model.prototype.add_ = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	var _t = this;

	if (!obj.name || !obj.name.length) return cb(new UserError("Name is required!"));

	var rollback_key = obj.rollback_key || rollback.create();
	var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

	let created_id;
	let objects_to_create_n = +obj.objects_to_create_n;

	async.series({
		getParent: cb => {
			if (!obj.parent_id && !obj.parent_name) return cb(null);

			let params = {
				param_where: {
					id: obj.parent_id,
					name: obj.parent_name
				},
				collapseData: false
			};

			_t.get(params, (err, res) => {
				if (err) return cb(new MyError('Error while getting parent', {params: params, err: err}));

				if (res.length)
					obj.full_name = res[0].full_name + ': ' + obj.name;

				cb(null);
			});
		},
		add: cb => {
			if (!obj.full_name)
				obj.full_name = obj.name;

			//if (creating more than 1 objects) go to addMany()
			if (objects_to_create_n > 0) return cb(null);

			_t.addPrototype(obj, function (err, res) {
				if (err) return cb(new MyError('Error while adding storage', {obj: obj, err: err}));
				cb(null, res);
			});
		},
		addMany: cb => {
			if (!objects_to_create_n) return cb(null);

			//doUntil executing till count === 0
			let count = objects_to_create_n;
			let n = 1;
			async.whilst(() => {
				return count > 0;
			}, cb => {
				let obj_curr = JSON.parse(JSON.stringify(obj));
				obj_curr.name = obj.name + '-' + n;
				obj_curr.full_name = obj.full_name + '-' + n;
				n++;

				async.series({
					check: cb => {
						let params = {
							param_where: {
								name: obj_curr.name
							},
							collapseData: false
						};

						_t.get(params, (err, res) => {
							if (err) return cb(new MyError('Error while getting item', {id: id, err: err}));
							if (res.length) return cb("found");
							cb(null);
						});
					},
					add: cb => {
						_t.addPrototype(obj_curr, function (err, res) {
							if (err) return cb(new MyError('Error while adding', {obj: obj, err: err}));
							if (!created_id)
								created_id = res.id;
							cb(null, res);
						});
					}
				}, (err) => {
					if (err === 'found')
						return cb(null);
					if (err)
						return cb(err);

					count--;
					cb(null);
				});
			}, cb);
		}
	}, function (err, res) {
		if (err) {
			rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
				return cb(err, err2);
			});
		} else {
			if (!doNotSaveRollback) {
				rollback.save({
					rollback_key: rollback_key,
					user: _t.user,
					name: _t.name,
					name_ru: _t.name_ru || _t.name,
					method: 'add_',
					params: obj
				});
			}
			cb(null, new UserOk('Ок', {
				id: created_id ? created_id : (res.add ? res.add.id : null)
			}));
		}
	});
};

Model.prototype.modify = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var client_object = _t.client_object || '';

    var coFunction = 'modify_' + client_object;

    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb);
    } else {
        if (typeof _t['modify_'] === 'function') {
            _t['modify_'](obj, cb);
        } else {
            _t.modifyPrototype(obj, cb);
        }
    }
};

Model.prototype.modify_ = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	let id = obj.id;
	if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}));

	let current_item;

	async.series({
		modify: function (cb) {
			_t.modifyPrototype(obj, cb);
		},
		getCurrent: cb => {
			let params = {
				columns: ['id', 'parent_id', 'full_name', 'name'],
				param_where: {
					id: id
				},
				collapseData: false
			};

			_t.get(params, (err, res) => {
				if (err) return cb(new MyError('Error while getting item', {id: id, err: err}));
				if (!res || !res[0]) return cb(new MyError('Item not found', {id: id}));

				current_item = res[0];

				cb(null);
			});
		},
		updateFullNameOfCurrent: cb => {
			if (!obj.name && !obj.parent_id) return cb(null);

			async.waterfall([
				cb => {
					if (!current_item.parent_id) return cb(null, null);

					let params = {
						columns: ['id', 'full_name'],
						param_where: {
							id: current_item.parent_id
						},
						collapseData: false
					};

					_t.get(params, (err, res) => {
						if (err) return cb(new MyError('Error while getting parent item', {id: current_item.parent_id, err: err}));

						cb(null, res[0]);
					});
				},
				(parent, cb) => {
					if (parent) {
						current_item.full_name = parent.full_name + ': ' + current_item.name;
					} else {
						current_item.full_name = current_item.name;
					}

					cb(null);
				},
				cb => {
					let params = {
						id: current_item.id,
						full_name: current_item.full_name
					};

					_t.modifyPrototype(params, cb);
				}
			], cb);
		},
		updateFullNamesOfChildren: cb => {
			if (!obj.name && !obj.parent_id) return cb(null);

			function updateFullNamesOfChildren(current_item, cb) {
				async.waterfall([
					cb => {
						let params = {
							columns: ['id', 'full_name', 'name'],
							param_where: {
								parent_id: current_item.id
							},
							collapseData: false
						};

						_t.get(params, (err, res) => {
							if (err) return cb(new MyError('Error while getting children', {id: current_item.id, err: err}));

							cb(null, res);
						});
					},
					(items, cb) => {
						async.eachSeries(items, (item, cb) => {
							async.series({
								updateName: cb => {
									item.full_name = current_item.full_name + ': ' + item.name;

									let params = {
										id: item.id,
										full_name: item.full_name
									};

									_t.modifyPrototype(params, cb);
								},
								updateFullNamesOfChildren: cb => {
									updateFullNamesOfChildren(item, cb);
								}
							}, cb);
						}, cb);
					}
				], cb);
			}

			updateFullNamesOfChildren(current_item, cb);
		}
	}, function (err, res) {
		if (err) return cb(err);
		cb(null, res.modify);
	});
};

Model.prototype.removeCascade = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var client_object = _t.client_object || '';

    var coFunction = 'removeCascade_' + client_object;

    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb);
    } else {
        if (typeof _t['removeCascade_'] === 'function') {
            _t['removeCascade_'](obj, cb);
        } else {
            _t.removeCascadePrototype(obj, cb);
        }
    }
};

Model.prototype.getForSelect = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var client_object = _t.client_object || '';

    var coFunction = 'getForSelect_' + client_object;
    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb);
    } else {
        if (typeof _t['getForSelect_'] === 'function') {
            _t['getForSelect_'](obj, cb);
        } else {
            _t.getForSelectPrototype(obj, cb);
        }
    }
};

Model.prototype.getForSelect_byProjectId = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    var project_id = obj.project_id;
    if (isNaN(+project_id)) return cb(new MyError('Не передан project_id', {obj: obj}));

    async.waterfall([
        //getSamplingEvents
        cb => {
            let o = {
                command: 'get',
                object: 'sampling_event',
                params: {
                    param_where: {
                        project_id: project_id
                    },
                    collapseData: false
                }
            };

            _t.api(o, (err, res) => {
                if (err) return cb(new MyError('Не удалось получить sampling events', {params: item, err: err}));

                cb(null, res);
            });
        }
    ], function (err, res) {
        if (err) return cb(new UserError('Events not found'));
	    cb(null, new UserOk('noToastr', {events: res}));
    });
};

Model.prototype.getForSelect_tbl_sampling_eventTEMP = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    // Получить локации проекта (ids)
    // Наложить default_where только по этим id

    var proj_location_ids = [];
    var row;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить row.',{id:id,err:err}));
                row = res[0];
                cb(null);
            });
        },
        getProjLocation:function(cb){
            var o = {
                command:'get',
                object:'project_location',
                params:{
                    param_where:{
                        project_id:row.project_id
                    },
                    columns:['project_id','location_id'],
                    limit:100000000,
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить project_location',{o : o, err : err}));
                for (var i in res) {
                    proj_location_ids.push(res[i].location_id);
                }
                cb(null);
            });
        },
        getForSelect:function(cb){
            if (!proj_location_ids.length) return cb(new UserError('You need fill "Project locations" first.'));
            obj.default_where = [
                {
                    key:'id',
                    type:'in',
                    group:'default_where',
                    val1:proj_location_ids
                }
            ];
            _t.getForSelectPrototype(obj, function(err, res){
                if (err) return cb(err);
                cb(null, res);
            });

        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, res.getForSelect);
    });
};


Model.prototype.getTree_v2 = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	let _t = this;

	let project_id = obj.project_id;
	if (isNaN(+project_id)) return cb(new MyError('Не передан project_id', {obj: obj})); // Not passed to project_id

	let items_ids = [];
	let tree = {
		'core': {
			'data': []
		}
	};
	let project_ids = [project_id];
	async.series({
		getProjectParents: function (cb) {
			let o = {
				command: 'getParentIds',
				object: 'Project',
				params: {
					id: project_id
				}
			};
			_t.api(o, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить Родительские проекты', {o: o, err: err}));
				project_ids = project_ids.concat(res.ids);
				cb(null);
			});
		},
		getItemsByProjectIds: function (cb) {
			let params = {
				where: [
					{
						key: 'project_id',
						type: 'in',
						val1: project_ids
					}
				],
				limit: 100000000,
				collapseData: false
			};
			_t.getPrototype(params, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить items', {params: params, err: err})); // Could not get
				items_ids = res.map(row => row.id);
				cb(null);
			});
		},
		getTree: function (cb) {
			let params = {
				ids: items_ids
			};
			_t.getTreePrototype_v2(params, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить tree', {params: params, err: err})); // Could not get
				tree = res.tree;
				cb(null);
			});
		}
	}, function (err, res) {
		if (err) return cb(err);

		cb(null, new UserOk('noToastr', {tree: tree}));
	});
};


Model.prototype.duplicate = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	let id = obj.id;
	if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}));

	let new_object = {
		objects_to_create_n: 1
	};

	async.series({
		get: cb => {
			_t.getPrototype({
				param_where: {
					id: id
				},
				collapseData: false
			}, (err, res) => {
				if (err) return cb(new MyError('Error while getting item', {id: id, err: err}));
				if (!res || !res[0]) return cb(new MyError('Item not found', {id: id}));

				['name', 'parent_id', 'project_id', 'plot_id',
					'datetime_start', 'datetime_end', 'storage_id',
					'habitat_id', 'location_id',
					'latitude', 'longitude',
					'coordinate_uncertainty', 'samples_size', 'meas_unit_sign'].forEach(row => {
					new_object[row] = res[0][row];
				});

				cb(null);
			});
		},
		add: cb => {
			_t.add(new_object, cb);
		}
	}, function (err, res) {
		if (err) return cb(err);
		cb(null, res.add);
	});
};


Model.prototype.export_from_project_to_excel = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	let _t = this;

	let fields = obj.fields;

	let name = 'sampling_event_' + moment().format('DDMMYYYY_HHmm') + '.xlsx';

	let events;
	async.series({
		getData: function (cb) {
			let params = {
				param_where: {
					project_id: obj.project_id,
				},
				limit: obj.limit,
				use_cache: false,
				collapseData: false
			};
			_t.get_(params, function (err, res) {
				if (err) return cb(new MyError('Error while getting items', {o: o, err: err}));
				if (!res || !res.length) return cb(new MyError('Items not found', {o: o, err: err}));
				events = res;
				cb(null);
			});
		},
		toExcel: function (cb) {
			let excel = new ToExcel({name: name});
			excel.addWorksheet({});

			async.series({
				addColumns: function (cb) {
					let columns = fields.map(row => {
						return {
							header: row.name,
							key: row.field
						}
					});

					excel.setColumns({columns: columns});

					return cb(null);
				},
				addRows: function (cb) {
					let rows = [];

					events.forEach(event => {
						let eventRow = [];

						fields.forEach(row => {
							if (row.type === 'field')
								eventRow.push(event[row.field]);
						});

						rows.push(eventRow);
					});

					excel.worksheet.addRows(rows);

					return cb(null);
				},
				save: function (cb) {
					excel.writeFile({}, cb)
				}
			}, function (err, res) {
				if (err) return cb(err);
				return cb(null, res.save)
			});
		}
	}, function (err, res) {
		if (err) return cb(err);
		cb(null, res.toExcel);
	});
};


Model.prototype.getPictures = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	var _t = this;
	var id = obj.id;
	if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}));

	var pictures;
	var trait;
	async.series({
		get: function (cb) {
			_t.getById({id: id}, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить event.', {id: id, err: err}));
				trait = res[0];
				cb(null);
			});
		},
		getPictures: function (cb) {
			var o = {
				command: 'get',
				object: 'sampling_event_picture',
				params: {
					where: [
						{
							key: 'sampling_event_id',
							val1: trait.id
						}
					],
					collapseData: false
				}
			};
			_t.api(o, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить sampling_event_picture', {o: o, err: err}));
				pictures = res;
				cb(null);
			});
		}
	}, function (err, res) {
		if (err) return cb(err);
		cb(null, new UserOk('noToastr', {pictures: pictures}));
	});
};


// var o = {
// 	command: 'copeSamplesToEvents',
// 	object: 'sampling_event',
// 	params: {
// 	}
// };
// socketQuery(o, function (res) {
// 	console.log(res);
// });
Model.prototype.copeSamplesToEvents = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	let rollback_key = obj.rollback_key || rollback.create();

	let limit = 5;
	let samples;

	async.series({
		get: cb => {
			let o = {
				command: 'get',
				object: 'sample',
				params: {
					limit: limit,
					collapseData: false
				}
			};

			_t.api(o, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить samples', { err: err }));
				samples = res;
				cb(null, res);
			});
		},
		update: cb => {
			async.eachSeries(samples, (sample, cb) => {
				let event;
				let event_id;

				async.series({
					addEvent: cb => {
						let params = {
							name: sample.name,
							parent_id: sample.sampling_event_id,
							plot_id: sample.plot_id,
							project_id: sample.project_id,
							storage_id: sample.default_storage_id,
							rollback_key: rollback_key
						};

						_t.add(params, (err, res) => {
							if (err) return cb(new MyError('Error while adding event', { params: params, err: err }));
							event_id = res.id;
							cb(null);
						});
					},
					get: cb => {
						_t.getById({ id: event_id }, (err, res) => {
							if (err) return cb(new MyError('Error while getting event',{ id: event_id, err: err }));
							event = res[0];
							cb(null);
						});
					},
					addLit: cb => {
						let o = {
							command: 'get',
							object: 'measurement_literature_data_link',
							params: {
								param_where: {
									measurement_id: sample.id
								},
								collapseData: false
							}
						};

						_t.api(o, (err, res) => {
							if (err) return cb(new MyError('Error getting literature', { o: o, err: err }));
							if (res.length) {
								async.eachSeries(res, (lit, cb) => {
									let o = {
										command: 'add',
										object: 'taxon_avalible_trait_literature_data_link',
										params: {
											taxon_avalible_trait_id: event_id,
											literature_id: lit.literature_id,
											rollback_key: rollback_key
										}
									};

									_t.api(o, (err, res) => {
										if (err) return cb(new MyError('Error adding literature', { o: o, err: err }));
										cb(null);
									});
								}, cb);
							} else {
								cb(null);
							}
						});
					},
					copyValues: cb => {
						if (event.trait_type_sysname !== 'SELECT') return cb(null);

						let o = {
							command: 'get',
							object: sample.sub_table_name_for_select,
							params: {
								collapseData: false
							}
						};

						_t.api(o, (err, res) => {
							if (err) return cb(new MyError('Error getting values', { o: o, err: err }));
							if (res.length) {
								async.eachSeries(res, (value, cb) => {
									let o = {
										command: 'add',
										object: event.sub_table_name_for_select,
										params: {
											name: value.name,
											definition: value.definition,
											rollback_key: rollback_key
										}
									};

									_t.api(o, (err, res) => {
										if (err) return cb(new MyError('Error adding values', { o: o, err: err }));
										cb(null);
									});
								}, cb);
							} else {
								cb(null);
							}
						});
					}
				}, cb);
			}, cb);
		}
	}, function (err, res) {
		if (err) {
			rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
				return cb(err, err2);
			});
		} else {
			rollback.save({
				rollback_key: rollback_key,
				user: _t.user,
				name: _t.name,
				name_ru: _t.name_ru || _t.name,
				method: 'copeSamplesToEvents',
				params: obj
			});
			cb(null, new UserOk('Ок'));
		}
	});
};

// var o = {
// 	command: 'generateFullName',
// 	object: 'sampling_event',
// 	params: {
// 	}
// };
// socketQuery(o, function (res) {
// 	console.log(res);
// });
Model.prototype.generateFullName = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	let rollback_key = obj.rollback_key || rollback.create();

	let list;

	//cb(name);
	function getFullName(id, cb) {
		let params = {
			param_where: {
				id: id
			},
			collapseData: false
		};

		_t.get(params, function (err, res) {
			if (err) return cb(new MyError('Error while getting item', { params: params, err: err }));
			if (res[0].full_name) {
				cb(res[0].full_name);
			} else if (!res[0].parent_id) {
				cb(res[0].name);
			} else {
				getFullName(res[0].parent_id, (name) => {
				    cb(`${name}: ${res[0].name}`);
				});
			}
		});
	}

	async.series({
		get: cb => {
			let params = {
				columns: ['id'],
				collapseData: false
			};

			_t.get(params, function (err, res) {
				if (err) return cb(new MyError('Error while getting list', { params: params, err: err }));
				list = res.map(row => {
					return row.id;
				});
				cb(null, res);
			});
		},
		update: cb => {
			async.eachSeries(list, (id, cb) => {
				let full_name;

				async.series({
					getFullName: cb => {
						getFullName(id, (name) => {
							full_name = name;
							cb(null);
						});
					},
					update: cb => {
					    let params = {
					    	id: id,
						    full_name: full_name
					    };

					    _t.modifyPrototype(params, cb);
					}
				}, cb);
			}, cb);
		}
	}, function (err, res) {
		if (err) {
			rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
				return cb(err, err2);
			});
		} else {
			rollback.save({
				rollback_key: rollback_key,
				user: _t.user,
				name: _t.name,
				name_ru: _t.name_ru || _t.name,
				method: 'generateFullName',
				params: obj
			});
			cb(null, new UserOk('Ок'));
		}
	});
};


Model.prototype.printLabels = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	let _t = this;

	var sampling_event_id = obj.sampling_event_id;
	var project_id = obj.project_id;
	if (isNaN(+sampling_event_id) && isNaN(+project_id)) return cb(new MyError('Required parameter not found: sampling_event_id or project_id!', {obj: obj}));
	let fields = obj.fields;
	if (!fields || !fields.length) return cb(new MyError('Не передан fields', {obj: obj}));

	var template, binaryData, filename;
	var name = 'labels.xlsx';
	var name_ru = 'labels_' + moment().format('DDMMYYYY_HHmm') + '.xlsx';
	let excel;
	let organisms;
	let tables = [[], [], [], [], []];
	async.series({
		getOrganisms: cb => {
			let o = {
				command: 'get_tbl_data_individual_collection',
				object: 'data_individual',
				client_object: 'tbl_data_individual_collection',
				params: {
					where: [
						{
							key: 'project_id',
							// type: 'in',
							val1: project_id
						},
						{
							projects: [],
							storages: [],
							plots: [],
							events: sampling_event_id ? [sampling_event_id] : [],
							taxons: []
						}
					],
					fromClient: true,
					collapseData: false
				}
			};

			_t.api(o, (err, res) => {
				if (err) return cb(new MyError('Error while getting items', {o: o, err: err}));
				if (!res.length) return cb(new MyError('Organisms not found.', {o: o, err: err}));
				organisms = res;
				cb(null);
			});

			// let o = {
			// 	command: 'get',
			// 	object: 'data_individual',
			// 	params: {
			// 		param_where: {},
			// 		where: [],
			// 		collapseData: false
			// 	}
			// };
			//
			// if (sampling_event_id)
			// 	o.params.param_where.sampling_event_id = sampling_event_id;
			// if (project_id)
			// 	o.params.param_where.project_id = project_id;
			//
			// _t.api(o, (err, res) => {
			// 	if (err) return cb(new MyError('Error while getting organisms.', {o: o, err: err}));
			// 	if (!res.length) return cb(new MyError('Organisms not found.', {o: o, err: err}));
			// 	organisms = res;
			// 	cb(null);
			// });
		},
		loadPlots: cb => {
			let needPlots = false;
			for (const field of fields) {
				if (field.object === 'plot') {
					needPlots = true;
					break;
				}
			}

			if (!needPlots) return cb(null);

			let o = {
				command: 'get',
				object: 'sampling_event',
				params: {
					where: [
						{
							key: 'id',
							type: 'in',
							val1: organisms.map(row => {
								return row.sampling_event_id
							})
						}
					],
					collapseData: false
				}
			};

			_t.api(o, (err, res) => {
				if (err) return cb(new MyError('Не удалось получить sampling_event.', {id: id, err: err}));
				if (!res.length) return cb(null);

				organisms.forEach(org => {
					for (const sampling_event of res) {
						if (org.sampling_event === sampling_event.id) {
							org.plot_id = sampling_event.plot_id;
							org.plot = sampling_event.plot;
							org.latitude = sampling_event.latitude;
							org.longitude = sampling_event.longitude;
							org.location = sampling_event.location;
							break;
						}
					}
				});

				cb(null);
			});
		},
		renderLabels: cb => {
			let n = 0;
			organisms.forEach((org, i) => {
				let label = '';

				fields.forEach(field => {
					if (org[field.field])
						label += org[field.field] + ' | ';
				});

				tables[n].push({
					label: label
				});
				n = n > 3 ? 0 : n + 1;
			});

			cb(null);
		},
		getTemplate: function (cb) {
			fs.readFile('./templates/' + name, function (err, data) {
				if (err) return cb(new MyError('Не удалось считать файл шаблона test.xlsx.', err));
				template = new XlsxTemplate(data);
				cb(null);
			});
		},
		perform: function (cb) {
			var sheetNumber = 1;
			template.substitute(sheetNumber, {
				t0: tables[0],
				t1: tables[1],
				t2: tables[2],
				t3: tables[3],
				t4: tables[4]
			});
			var dataBuf = template.generate();
			binaryData = new Buffer(dataBuf, 'binary');
			cb(null)
		},
		writeFile: function (cb) {
			// filename = name_ru + '.xlsx' || '_' + name;
			filename = name_ru;
			fs.writeFile('./public/savedFiles/' + filename, binaryData, function (err) {
				if (err) return cb(new MyError('Не удалось записать файл testOutput.xlsx', {err: err}));
				return cb(null, new UserOk('testOutput.xlsx успешно сформирован'));
			});
		},
	}, function (err, res) {
		if (err) return cb(err);
		cb(null, new UserOk('Ок.',{filename:filename,path:'/savedFiles/',name_ru:name_ru}));
	});
};

// var o = {
//     command:'create',
//     object:'Sampling_event',
//     params:{
//         project_id:5,
//         samples:{1:2,2:3}
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// });

/**
 * Метод создает sampling_event и генерит samples для каждого указанного plot
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.create = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    var project_id = obj.project_id;
    if (isNaN(+project_id))
    	return cb(new MyError('Не передан project_id',{obj:obj}));

    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var samples = obj.samples;
    if (typeof samples !=='object' || Array.isArray(samples))
    	return cb(new MyError('Необходимо передать samples - объект, где ключ это plot_id, а значение это количество образцов в данном plot'));


    //cb(name);
	function getFullName(id, cb) {
		let params = {
			param_where: {
				id: id
			},
			collapseData: false
		};

		_t.get(params, function (err, res) {
			if (err) return cb(new MyError('Error while getting item', { params: params, err: err }));
			if (res[0].full_name) {
				cb(res[0].full_name);
			} else if (!res[0].parent_id) {
				cb(res[0].name);
			} else {
				getFullName(res[0].parent_id, (name) => {
					cb(`${name}: ${res[0].name}`);
				});
			}
		});
	}


    var id;
    var plot_obj = {};
    var sampling_event_name = obj.name;
    async.series({
	    getFullName: cb => {
	    	if (!obj.parent_id) {
	    		obj.full_name = obj.name;
	    		cb(null);
		    } else {
			    getFullName(+obj.parent_id, (name) => {
				    obj.full_name = name + ': ' + obj.name;
				    cb(null);
			    });
		    }
	    },
        add:function(cb){
            _t.addPrototype(obj, function(err, res){
               if (err) return cb(err);
               id = res.id;
               cb(null, res);
            });
        },
        getPlots:function(cb){
            if (!Object.keys(samples).length) return cb(null);
                var o = {
                    command:'get',
                    object:'plot',
                    params:{
                        where:[
                            {
                                key:'id',
                                type:'in',
                                val1:Object.keys(samples)
                            }
                        ],
                        collapseData:false
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось plot',{o : o, err : err}));
                    for (var i in res) {
                        plot_obj[res[i].id] = res[i];
                    }
                    cb(null);
                });

        },
        createSamples:function(cb){
            if (!Object.keys(samples).length) return cb(null);

            async.eachSeries(Object.keys(samples), function(key, cb){
                if (isNaN(+samples[key])) return cb(new MyError('Некоректный формат samples',{samples:samples, key:key}));
                samples[key] = +samples[key];
                if (+samples[key] <= 0) return cb(null);

                var arr = [];
                for (var i = 0; i < samples[key]; i++) {
                    arr.push({
                        plot_id:+key,
                        num:i+1
                    });
                }
                async.eachSeries(arr, function(to_add_item, cb){
                    if (!plot_obj[to_add_item.plot_id]) return cb(new MyError('Такого plot нет в системе или у пользователя нет к нему доступа',{plot_id:to_add_item.plot_id}));
                    var o = {
                        command:'add',
                        object:'sample',
                        params:{
                            sampling_event_id:id,
                            name: sampling_event_name + '-' + plot_obj[to_add_item.plot_id]['name'] + '-' + to_add_item.num,
                            plot_id:to_add_item.plot_id,
	                        default_storage_id: obj.storage_id,
                            rollback_key:rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось создать sample',{o : o, err : err}));
                        cb(null);
                    });
                }, cb);
            }, cb);
        }
    },function (err, res) {
        if (err) {
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!doNotSaveRollback){
               rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'create', params:obj});
            }
            cb(null, res.add);
        }
    });
};

Model.prototype.example = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    async.series({

    },function (err, res) {
        if (err) {
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            //if (!doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            //}
            cb(null, new UserOk('Ок'));
        }
    });
};

module.exports = Model;
