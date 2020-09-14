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
var ToExcel = require('../libs/ToExcel.js');

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

// Model.prototype.get_ = function (obj, cb) {
// 	if (arguments.length == 1) {
// 		cb = arguments[0];
// 		obj = {};
// 	}
// 	let _t = this;
//
// 	if (obj.collapseData === false) return _t.getPrototype(obj, cb);
//
// 	let fields = ['altitude', 'longitude', 'latitude', 'coordinate_uncertainty',
// 		'location_id', 'location', 'habitat_id', 'habitat', 'collection_date'];
//
// 	function getParent(id, cb) {
// 		_t.getById({id:id}, (err, res) => {
// 			if (err) return cb(err);
// 			cb(res && res[0] ? res[0] : null);
// 		});
// 	}
//
// 	function checkField(item, field, ind, cb) {
// 		if (item[field + '_parent']) {
// 			cb(item[field + '_parent'], item.parent_name);
// 		} else if (parents.length && ind < parents.length) {
// 			checkField(parents[ind], field, ind + 1, cb);
// 		} else if (!item.parent_id) {
// 			cb(null);
// 		} else {
// 			getParent(item.parent_id, (parent) => {
// 				if (parent) {
// 					parents.push(parent);
// 					return checkField(parents[ind], field, ind, cb);
// 				}
//
// 				cb(null);
// 			});
// 		}
// 	}
//
// 	let parents = [];
//
// 	let items = [];
// 	let addData;
//
// 	async.series({
// 		getProto: cb => {
// 			obj.collapseData = false;
// 			_t.getPrototype(obj, (err, res, additionalData) => {
// 				if (err) return cb(err);
//
// 				items = res;
// 				addData = additionalData;
//
// 				cb(null);
// 			});
// 		},
// 		operate: cb => {
// 			async.eachSeries(items, (item, cb) => {
// 				if (!item.inherited_fields) item.inherited_fields = [];
//
// 				async.eachSeries(fields, (field, cb) => {
// 					if (item[field])
// 						return cb(null);
//
// 					checkField(item, field, 0, (value, inherited) => {
// 						if (value && inherited) {
// 							item[field] = value;
// 							item.inherited_fields.push({
// 								name: field,
// 								source: inherited
// 							});
// 						}
//
// 						cb(null);
// 					});
// 				}, cb);
// 			}, cb);
// 		},
// 		collapseData: cb => {
// 			let tmp = funcs.collapseData(items, null, addData.data_columns);
//
// 			tmp.extra_data.count = addData.count;
// 			tmp.extra_data.count_all = addData.count_all;
//
// 			cb(null, tmp);
// 		}
// 	}, (err, res) => {
// 		if (err) return cb(err);
// 		cb(null, res.collapseData);
// 	});
// };

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
	if (arguments.length < 2) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;
	let count = 0;

	let sampling_event_id = +obj.sampling_event_id;
	let sampling_event = obj.sampling_event;

	async.series({
		checkName: function (cb) {
			async.series({
				getMaxCount: function (cb) {
					if (!sampling_event_id && !sampling_event) return cb(null);

					var params = {
						specColumns: {
							max: 'MAX(name_counter)'
						},
						param_where: {},
						collapseData: false
					};

					if (sampling_event_id)
						params.param_where['sampling_event_id'] = sampling_event_id;
					else
						params.param_where['sampling_event'] = sampling_event;

					_t.get(params, function (err, res) {
						if (err) return cb(new MyError('Error while counting', {params: params, err: err}));
						count = +res[0].max;
						cb(null);
					})
				},
				generateName: function (cb) {
					if (!obj.name)
						obj.name = 'DI-' + (++count);

					if (/_/.test(obj.name))
						return cb(null);

					obj.name_counter = count;
					cb(null);
				}
			}, cb);
		},
		getProjectId: cb => {
			if ((obj.project_id || obj.project) && (obj.storage_id || obj.storage)) return cb(null);
			if (!sampling_event_id && !sampling_event) return cb(null);

			let o = {
				command: 'get',
				object: 'sampling_event',
				params: {
					param_where: {},
					collapseData: false
				}
			};

			if (sampling_event_id)
				o.params.param_where['id'] = sampling_event_id;
			else
				o.params.param_where['name'] = sampling_event;

			_t.get(o, (err, res) => {
				if (err) return cb(new MyError('Error while getting sampling_event', {o: o, err: err}));
				if (res[0])
					sampling_event = res[0];
				cb(null);
			})
		},
		addPrototype: function (cb) {
			if (!obj.project_id && !obj.project && sampling_event)
				obj.project_id = sampling_event.project_id;

			if (!obj.storage_id && !obj.storage && sampling_event)
				obj.storage_id = sampling_event.storage_id;

			_t.addPrototype(obj, cb);
		}
	}, function (err, res) {
		if (err) return cb(err);

		cb(null, new UserOk('Data individual successfully added', res.addPrototype));
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
	if (arguments.length < 2) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	let id = obj.id;
	if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}));

	//1. Наследуем project_id из sampling_event
	//2. Prototype

	let sampling_event_id = +obj.sampling_event_id;
	let project_id = +obj.project_id;
	let plot_id = +obj.plot_id;

	let inheritProjectId = project_id === 0;
	let inheritPlotId = plot_id === 0;

	async.series({
		get: cb => {
			if (!inheritProjectId && !inheritPlotId && ((plot_id && project_id) || !sampling_event_id)) return cb(null);

			const o = {
				id: id,
				columns:['id', 'sampling_event_id', 'project_id', 'plot_id'],
				collapseData: false
			}
			_t.getById(o, (err, res) => {
				if (err) return cb(new MyError('Error while getting organism', {o: o, err: err}));
				if (res[0] && res[0].sampling_event_id) {
					inheritProjectId = !res[0].project_id || inheritProjectId;
					inheritPlotId = !res[0].plot_id || inheritPlotId;

					if (inheritProjectId || inheritPlotId)
						sampling_event_id = res[0].sampling_event_id;
				}
				cb(null);
			});
		},
		getProjectId: cb => {
			if (!(inheritProjectId || inheritPlotId)) return cb(null);

			let o = {
				command: 'get',
				object: 'sampling_event',
				params: {
					param_where: {
						id: sampling_event_id
					},
					collapseData: false
				}
			};

			_t.api(o, (err, res) => {
				if (err) return cb(new MyError('Error while getting sampling_event', {o: o, err: err}));
				if (res[0]) {
					if (inheritProjectId)
						obj.project_id = res[0].project_id;
					if (inheritPlotId)
						obj.plot_id = res[0].plot_id;
				}
				cb(null);
			})
		},
		modifyPrototype: cb => {
			_t.modifyPrototype(obj, cb);
		}
	}, (err, res) => {
		if (err) return cb(err);

		cb(null, new UserOk('Data individual successfully changed', res.modifyPrototype));
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

Model.prototype.getForSelect_tbl_data_individual_collection = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	if (obj.column_name === 'storage') {
		let data_individual;
		let project;
		let parent_ids;
		let child_ids;

		async.series({
			getMe: function (cb) {
				let o = {
					command: 'get',
					object: 'data_individual',
					params: {
						where: [{
							key: 'id',
							val1: obj.id
						}],
						collapseData: false
					}
				}

				_t.api(o, function (err, res) {

					if (err) return cb(new MyError('Не удалось получить запись data_individual', err))

					data_individual = res[0];

					cb(null)
				})
			},
			getProject: function (cb) {

				let o = {
					command: 'get',
					object: 'project',
					params: {
						where: [{
							key: 'id',
							val1: data_individual.project_id
						}],
						collapseData: false
					}
				}

				_t.api(o, function (err, res) {

					if (err) return cb(new MyError('Не удалось получить запись project', err))

					project = res[0];

					cb(null)
				})


			},
			getParentProjects: function (cb) {

				let o = {
					command: 'getParentIds',
					object: 'project',
					params: {
						id: project.id
					}
				}

				_t.api(o, function (err, res) {
					if (err) return cb(err);
					parent_ids = res.ids;
					cb(null, res);
				})

			},
			getChildProjects: function (cb) {

				let o = {
					command: 'getChildIds',
					object: 'project',
					params: {
						id: project.id
					}
				}

				_t.api(o, function (err, res) {
					if (err) return cb(err);
					child_ids = res.ids;
					cb(null, res);
				})


			},
			addWhere: function (cb) {

				let ids = parent_ids.concat(child_ids)
				ids.push(project.id);

				obj.default_where = [{
					key: 'project_id',
					type: 'in',
					val1: ids
				}];

				cb(null)
			}
		}, function (err, res) {
			_t.getForSelectPrototype(obj, cb);
		})
	} else
		_t.getForSelectPrototype(obj, cb);
};


/*Samples are deprecated*/
// Model.prototype.get_sample_data_individual = function (obj, cb) {
//     if (arguments.length == 1) {
//         cb = arguments[0];
//         obj = {};
//     }
//     var _t = this;
//
//     if (!obj.fromClient) {
//         _t.getPrototype(obj, cb);
//         return;
//     }
//
//     var taxon_id = obj.taxon_id;
//     var sample_id = obj.sample_id;
//     if (isNaN(+sample_id)) return cb(new MyError('Не передан sample_id',{obj:obj}));
//     var virtual_where = obj.virtual_where;
//     if (['project_taxon','parent_taxon','defined_taxon'].indexOf(virtual_where) === -1) return cb(new MyError('Неизвестный тип virtual_where',{virtual_where:virtual_where, obj:obj}));
//
//     var rollback_key = obj.rollback_key || rollback.create();
//     var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;
//
//     var used_taxon_ids = [];
//     var sample;
//     async.series({
//         getSample:function(cb){
//             var o = {
//                 command:'getById',
//                 object:'Sample',
//                 params:{
//                     id:sample_id
//                 }
//             };
//             _t.api(o, function (err, res) {
//                 if (err) return cb(new MyError('Не удалось получить Sample',{o : o, err : err}));
//                 sample = res[0];
//                 cb(null);
//             });
//         },
//         getUsed_taxon_ids:function(cb){
//             if (virtual_where !== 'defined_taxon') return cb(null);
//             async.series({
//                 getProjAvailTaxon:function(cb){
//                     var o = {
//                         command:'get',
//                         object:'project_available_taxon',
//                         columns:['id','taxon_id'],
//                         params:{
//                             param_where:{
//                                 project_id:sample.project_id
//                             },
//                             collapseData:false
//                         }
//                     };
//                     _t.api(o, function (err, res) {
//                         if (err) return cb(new MyError('Не удалось получить project_available_taxon',{o : o, err : err}));
//                         for (var i in res) {
//                             used_taxon_ids.push(res[i].taxon_id);
//                         }
//
//                         cb(null);
//                     });
//                 },
//                 getProjParentAvailTaxon:function(cb){
//                     var o = {
//                         command:'getParentTaxon',
//                         object:'Project',
//                         columns:['id','taxon_id'],
//                         params:{
//                             id:sample.project_id
//                         }
//                     };
//                     _t.api(o, function (err, res) {
//                         if (err) return cb(new MyError('Не удалось получить getParentTaxon',{o : o, err : err}));
//                         var resReal = res.project_available_taxon;
//                         for (var i in resReal) {
//                             used_taxon_ids.push(resReal[i].taxon_id);
//                         }
//
//                         cb(null);
//                     });
//                 }
//             }, cb);
//         },
//         get:function(cb){
//             if (used_taxon_ids.length){
//                 obj.where.push({
//                     group:'used_taxon_ids',
//                     key:'taxon_id',
//                     type:'!in',
//                     val1:used_taxon_ids
//                 });
//             }
//             if (taxon_id){
//                 obj.where.push({
//                     group:'parent_keys',
//                     key:'taxon_id',
//                     val1:taxon_id
//                 });
//             }
//             obj.where.push({
//                 group:'parent_keys',
//                 key:'sample_id',
//                 val1:sample_id
//             });
//
//             _t.getPrototype(obj, function(err, res){
//                 cb(err, res);
//             });
//         }
//     },function (err, res) {
//         if (err) return cb(err);
//         cb(null, res.get);
//     });
// };


// var o = {
// 	command: 'updateOrganisms',
// 	object: 'data_individual',
// 	params: {
// 	}
// };
// socketQuery(o, function (res) {
// 	console.log(res);
// });
Model.prototype.updateOrganisms = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	let rollback_key = obj.rollback_key || rollback.create();

	let list;

	async.series({
		get: cb => {
			let params = {
				columns: ['id', 'sampling_event_id'],
				where: [
					{
						key: 'sampling_event_id',
						type: 'ISNOTNULL'
					}
				],
				collapseData: false
			};

			_t.get(params, function (err, res) {
				if (err) return cb(new MyError('Error while getting list', { params: params, err: err }));
				list = res;
				cb(null, res);
			});
		},
		update: cb => {
			async.eachSeries(list, (item, cb) => {
				async.series({
					// getProjects: cb => {
					// 	let o = {
					// 	    command: 'get',
					// 	    object: 'sampling_event',
					// 	    params: {
					// 	        param_where: {
					// 		        id: item.sampling_event_id
					// 	        },
					// 		    collapseData: false
					// 	    }
					// 	};
					//
					// 	_t.api(o, function (err, res) {
					// 		if (err) return cb(new MyError('Error while getting events', { o: o, err: err }));
					// 		if (res.length && res[0].project_id)
					// 			item.project_id = res[0].project_id;
					// 		cb(null, res);
					// 	});
					// },
					update: cb => {
						// if (!item.project_id) return cb(null);

						let params = {
							id: item.id,
							plot_id: 0,
							// rollback_key: rollback_key
						};

						_t.modify_(params, cb);
					}
				}, cb);
			}, cb);
		},
	}, function (err, res) {
		cb(err, new UserOk('Ок'));
		// if (err) {
		// 	rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
		// 		return cb(err, err2);
		// 	});
		// } else {
		// 	rollback.save({
		// 		rollback_key: rollback_key,
		// 		user: _t.user,
		// 		name: _t.name,
		// 		name_ru: _t.name_ru || _t.name,
		// 		method: 'setProjectId',
		// 		params: obj
		// 	});
		// 	cb(null, new UserOk('Ок'));
		// }
	});
};


Model.prototype.get_storage_data_individual = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    if (!obj.fromClient) {
        _t.getPrototype(obj, cb);
        return;
    }

    var storage_id = obj.storage_id;
    if (isNaN(+storage_id)) return cb(new MyError('Не передан storage_id',{obj:obj}));
    var taxon_id = obj.taxon_id;
    if (isNaN(+taxon_id)) return cb(new MyError('Не передан taxon_id',{obj:obj}));

    async.series({
        get:function(cb){
            if (storage_id){
                obj.where.push({
                    key:'storage_id',
                    val1:storage_id
                });
            }
            if (taxon_id){
                obj.where.push({
                    key:'taxon_id',
                    val1:taxon_id
                });
            }
            _t.getPrototype(obj, function(err, res){
                cb(err, res);
            });
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, res.get);
    });
};

Model.prototype.get_tbl_data_individual_collection = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	if (obj.where.length < 2)
		return cb(null, new UserOk('noToastr'));

	let _t = this;

	let id;
	let project_id;
	let projects = [], storages = [], plots = [], events = [], taxons = [];
	let extra_wheres = []

	//Передается как sampling_event_id, но это project_id lol
	// let {val1: project_id} = obj.where.find(item => item.key === 'sampling_event_id');

	obj.where.forEach(row => {
		if (row.key === 'project_id')
			project_id = row.val1
		else if (row.hasOwnProperty('projects'))
			({projects, storages, plots, events, taxons} = row)
		else if (row.key === 'id')
			id = row.val1
		else if (row.group === 'fast_search')
			extra_wheres.push(row)
	});

	let parentIds = [];

	//Inheritance
	let fields = ['plot_id', 'plot', 'altitude', 'longitude', 'latitude', 'coordinate_uncertainty',
		'location_id', 'location', 'habitat_id', 'habitat', 'collection_date', 'storage_id', 'storage'];
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
		getProjects: function (cb) {
			if (id) return cb(null);

			async.series({
				getProjects: function (cb) {
					async.parallel({
						getParentIds: function (cb) {
							var o = {
								command: 'getParentIds',
								object: 'project',
								params: {
									id: project_id,
									collapseData: false
								}
							};

							_t.api(o, function (err, res) {
								if (err) return cb(new MyError('Не удалось getParentIds', {o, err}));
								parentIds = [project_id, ...res.ids];
								cb(null);
							})
						},
						getChildIds: function (cb) {
							if (projects.length !== 0) return cb(null);

							var o = {
								command: 'getChildIds',
								object: 'project',
								params: {
									id: project_id,
									collapseData: false
								}
							};

							_t.api(o, function (err, res) {
								if (err) return cb(new MyError('Не удалось getChildIds', {o, err}));

								projects = [project_id, ...res.ids];
								cb(null);
							})
						}
					}, function (err, res) {
						if (err) return cb(new MyError('Не удалось получить projects', {err}));

						cb(null);
					});
				},
				getStorages: function (cb) {
					if (storages.length > 0) return cb(null);

					var o = {
						command: 'get',
						object: 'storage',
						params: {
							where: [
								{
									key: 'project_id',
									type: 'in',
									val1: [...parentIds, ...projects]
								}
							],
							collapseData: false
						}
					};

					_t.api(o, function (err, res) {
						if (err) return cb(new MyError('Не удалось получить storages', {o: o, err: err}));

						storages = res.map(storage => storage.id);

						cb(null);
					});
				},
				getPlots: function (cb) {
					if (plots.length > 0) return cb(null);

					var o = {
						command: 'get',
						object: 'plot',
						params: {
							where: [
								{
									key: 'project_id',
									type: 'in',
									val1: [...parentIds, ...projects]
								}
							],
							collapseData: false
						}
					};

					_t.api(o, function (err, res) {
						if (err) return cb(new MyError('Не удалось получить plots', {o: o, err: err}));

						plots = res.map(plot => plot.id);

						cb(null);
					});
				},
				getSamplingEvents: function (cb) {
					if (events.length > 0) return cb(null);

					var o = {
						command: 'get',
						object: 'sampling_event',
						params: {
							where: [
								{
									key: 'project_id',
									type: 'in',
									val1: projects
								}
							],
							collapseData: false
						}
					};

					_t.api(o, function (err, res) {
						if (err) return cb(err);

						events = res.map(event => event.id);

						cb(null);
					})
				},
			}, cb);
		},
		getIndividuals: function (cb) {
			const addWhere = (key, values, is_null) => {
				if (!is_null) {
					params.where.push({
						type: 'in',
						val1: values,
						key
					});
				} else {
				    values.push(0);
					params.where.push({
						type: 'in',
						val1: values,
						group: 'DATA_INDIVIDUAL_' + key,
						comparisonType: 'OR',
						key
					});
                    params.where.push({
                        type: 'isNull',
                        group: 'DATA_INDIVIDUAL_' + key,
                        comparisonType: 'OR',
                        key
                    });
				}
			};

			let params = {...obj, where: [...extra_wheres], collapseData: false}

			if ([...parentIds, ...projects].length > 0)
				addWhere('project_id', [...parentIds, ...projects]);

			if (id) {
				params.where.push({
					key: 'id',
					type: '=',
					val1: id
				})
			} else {
				if (events.length > 0)
					addWhere('sampling_event_id', events);
				if (storages.length > 0)
					addWhere('storage_id', storages, true);
				if (taxons.length > 0)
					addWhere('taxon_id', taxons);
			}

			_t.getPrototype(params, (err, res, additionalData) => {
                if (err) return cb(new MyError('Ne udalos` poluchit` organizmy`', {params, err}));

				items = res;
				addData = additionalData;

				cb(null, res);
			});
		},
		operate: cb => {
			if (obj.doNotInheritFields) return cb(null);

			async.eachSeries(items, (item, cb) => {
				if (!item.inherited_fields)
					item.inherited_fields = [];

				async.series({
					checkByEvent: cb => {
						async.eachSeries(fields, (field, cb) => {
							if (item[field])
								return cb(null);

							checkField('sampling_event', 'sampling_event_id', 'sampling_event', '_event', item, field, 0, (value, source) => {
								if (value && source) {
									item[field] = value;
									item.inherited_fields.push({
										name: field,
										source: source
									});
								}

								cb(null);
							});
						}, cb);
					},
					checkByPlot: cb => {
						async.eachSeries(fields, (field, cb) => {
							if (item[field])
								return cb(null);


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
						}, cb);
					}
				}, cb);
			}, cb);
		},
		collapseData: cb => {
			if (obj.collapseData === false) return cb(null, items);

			let tmp = funcs.collapseData(items, null, addData.data_columns);

			tmp.extra_data.count = addData.count;
			tmp.extra_data.count_all = addData.count_all;

			cb(null, tmp);
		}
	}, function (err, res) {
		if (err) return cb(err);
		cb(null, res.collapseData);
	});
};

Model.prototype.get_tbl_data_individual = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	if (obj.where.length < 2)
		return cb(null, new UserOk('noToastr'));

	let _t = this

	let project_id;
	let extra_wheres = []
	let projects = [], events = []

	obj.where.forEach(row => {
		if (row.key === 'project_id')
			project_id = row.val1
		else if (row.hasOwnProperty('projects'))
			({projects, events} = row)
		else if (row.key === 'id')
			id = row.val1
		else if (row.group === 'fast_search')
			extra_wheres.push(row)
	});

	let parentIds = [];

	//Inheritance
	let fields = ['plot_id', 'plot', 'altitude', 'longitude', 'latitude', 'coordinate_uncertainty',
		'location_id', 'location', 'habitat_id', 'habitat', 'collection_date', 'storage_id', 'storage'];
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
		getProjects: function (cb) {
			async.parallel({
				getParentIds: function (cb) {
					var o = {
						command: 'getParentIds',
						object: 'project',
						params: {
							id: project_id,
							collapseData: false
						}
					};

					_t.api(o, function (err, res) {
						if (err) return cb(new MyError('Не удалось getParentIds', {o, err}));
						parentIds = [project_id, ...res.ids];
						cb(null);
					})
				},
				getChildIds: function (cb) {
					if (projects.length !== 0) return cb(null);

					var o = {
						command: 'getChildIds',
						object: 'project',
						params: {
							id: project_id,
							collapseData: false
						}
					};

					_t.api(o, function (err, res) {
						if (err) return cb(new MyError('Не удалось getChildIds', {o, err}));

						projects = [project_id, ...res.ids];
						cb(null);
					})
				}
			}, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить projects', {err}));

				cb(null);
			});
		},
		getSamplingEvents: function (cb) {
			if (events.length > 0) return cb(null);

			var o = {
				command: 'get',
				object: 'sampling_event',
				params: {
					where: [
						{
							key: 'project_id',
							type: 'in',
							val1: projects
						}
					],
					collapseData: false
				}
			};

			_t.api(o, function (err, res) {
				if (err) return cb(err);

				events = res.map(event => event.id);

				cb(null);
			})
		},
		getIndividuals: function (cb) {
			// const addWhere = (key, values) => {
			//     params.where.push({
			//         type: 'in',
			//         val1: values,
			//         key
			//     })
			// };

			const addWhere = (key, values, is_null) => {
				params.where.push({
					type: 'in',
					val1: values,
					key
				});
			};

			var params = {...obj, where: [...extra_wheres], collapseData: false}

			if ([...parentIds, ...projects].length > 0)
				addWhere('project_id', [...parentIds, ...projects]);
			if (events.length > 0)
				addWhere('sampling_event_id', events, true);

			_t.getPrototype(params, (err, res, additionalData) => {
				if (err) return cb(new MyError('Не удалось получить организмы', {params, err}));

				items = res;
				addData = additionalData;

				cb(null, res);
			});

			// let o = {
			// 	command:'get',
			// 	object:_t.name,
			// 	params
			// };
			// _t.api(o, (err, res, additionalData) => {
			// 	if (err) return cb(new MyError('Не удалось получить организмы', {params, err}));
			//
			// 	items = res;
			// 	addData = additionalData;
			//
			// 	cb(null, res);
			// });
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
							checkField('sampling_event', 'sampling_event_id', 'sampling_event', '_event', item, field, 0, (value, source) => {
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
	}, function (err, res) {
		if (err) return cb(err);
		cb(null, res.collapseData);
	});
};

Model.prototype.getAttachedTaxons = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    var _t = this;
    var id = +obj.where[0].val1;
    var projectIds = [id];
    var eventIds = [];
    var taxonFilter = obj.where[1];

    async.series({
        getProjectIds: function(cb) {
            var o = {
                command: 'getChildIds',
                object: 'project',
                params: {
                    id: id,
                    collapseData: false
                }
            };

            _t.api(o, function(err, res) {
                if (err) return cb(err);

                projectIds = projectIds.concat(res.ids);

                cb(null);
            })
        },
        getEvents: function(cb) {
            var o = {
                command: 'get',
                object: 'sampling_event',
                params: {
                    where: [
                        {
                            key: 'project_id',
                            type: 'in',
                            val1: projectIds
                        }
                    ],
                    collapseData: false
                }
            };

            _t.api(o, function(err, res) {
                if (err) return cb(err);

                eventIds = res.map(event => event.id);

                cb(null);
            });
        },
        getTaxons: function(cb) {
            if (!eventIds.length) return cb(null, []);

            var params = {
                groupBy: ['taxon_id'],
                where: [
                    {
                        key: 'sampling_event_id',
                        type: 'in',
                        val1: eventIds
                    }
                ],
                collapseData: false
            };

            if (taxonFilter) params.where.push(taxonFilter);

            _t.get(params, function(err, res) {
                if (err) return cb(err);

                cb(null, res.filter(row => {
                    return row.taxon;
                }).map(row => {
                    return {
                        id: row.taxon_id,
                        taxon: row.taxon
                    }
                }));
            });
        }
    }, function(err, res) {
        if (err) return cb(err);

        cb(null, res.getTaxons)
    });
};


Model.prototype.getColumnsForExport = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	let fields = [];

	async.series({
		getProfile: cb => {
			let o = {
				command: 'getProfile',
				object: 'data_individual',
				params: {
					collapseData: false
				}
			};

			_t.api(o, function (err, res) {
				if (err) return cb(err);

				for (const key in res.data) {
					if (!res.data[key].visible) continue;

					let row = res.data[key];
					fields.push({
						field: row.column_name,
						name: row.name,
						checked: true,
						type: 'field'
					})
				}

				cb(null);
			})
		},
		getFactorsFields: function (cb) {
			let o = {
				command: 'get',
				object: 'project_sample_factor',
				params: {
					param_where: {
						project_id: obj.project_id
					},
					collapseData: false
				}
			};

			_t.api(o, function (err, res) {
				if (err) return cb(err);

				res.forEach(row => {
					fields.push({
						factor_id: row.id,
						name: row.name,
						checked: true,
						type: 'factor'
					});
				});

				cb(null);
			})
		},
		getTraitFields: function (cb) {
			let o = {
				command: 'get',
				object: 'project_trait',
				params: {
					param_where: {
						project_id: obj.project_id
					},
					collapseData: false
				}
			};

			_t.api(o, function (err, res) {
				if (err) return cb(err);

				res.forEach(row => {
					fields.push({
						trait_id: row.id,
						name: row.name,
						checked: true,
						type: 'taxon_avalible_trait'
					});
				});

				cb(null);
			})
		}
	}, function (err, res) {
		if (err) return cb(err);

		cb(null, new UserOk('noToastr', {fields: fields}));
	});
};

Model.prototype.export_from_project_to_excel = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	let _t = this;

	let fields = obj.fields;

	let name = 'organisms_' + moment().format('DDMMYYYY_HHmm') + '.xlsx';

	let organisms;
	let di_profile = {};
	async.series({
		getProfile: cb => {
			//Достаем профайл таблицы, чтобы получить нормальные имена динамически прикрепленных факторов и трейты.
			//Факторы и трейты крепятся к проекту, так что передаем project_id
			let o = {
				command: 'getProfile',
				object: 'data_individual',
				client_object: 'tbl_data_individual_collection',
				params: {
					parent_class___: "project",
					parent_id___: obj.project_id,
					collapseData: false
				}
			};

			_t.api(o, (err, res) => {
				if (err) return cb(new MyError('Error while getting profile', {o: o, err: err}));
				for (const i in res.data) {
					let row = res.data[i];
					if (row.visible && row.dynamic_field_pair_id)
						di_profile[row.name] = row.column_name;
				}
				cb(null);
			});
		},
		get: cb => {
			// obj.collapseData = false;
			let o = {
				command: 'get_tbl_data_individual_collection',
				object: 'data_individual',
				client_object: 'tbl_data_individual_collection',
				params: {
					...obj,
					fromClient: false,
					collapseData: false
				}
			};

			_t.api(o, (err, res) => {
				if (err) return cb(new MyError('Error while getting items', {o: o, err: err}));
				organisms = res;
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

					organisms.forEach(event => {
						let eventRow = [];

						fields.forEach(field => {
							if (field.type === 'field') {
								eventRow.push(event[field.field]);
							} else if (field.type === 'factor' || field.type === 'taxon_avalible_trait') {
								eventRow.push(di_profile[field.name] ? event[di_profile[field.name]] : null);
							}
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
		if (err) return cb(err, organisms);
		cb(null, res.toExcel);
		// cb(null, {
		// 	taxons: taxons
		// });
	});
};


Model.prototype.split = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    let _t = this;

	let id = obj.id;
	if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}));

	let project_id = obj.project_id;
	if (isNaN(+project_id)) return cb(new MyError('Не передан project_id', {obj: obj}));

    let count = +obj.count;
    if (isNaN(count)) return cb(new MyError('Не передан count', {obj: obj}));

    let rollback_key = obj.rollback_key || rollback.create();
    let doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    let id_new;
    let source_row, new_row_params, new_source_name;
    let dynamicFields = {};

    async.series({
        get: function (cb) {
	        let o = {
		        command: 'get_tbl_data_individual_collection',
		        object: 'data_individual',
		        client_object: 'tbl_data_individual_collection',
		        params: {
			        where: [
				        {
					        key: 'project_id',
					        val1: project_id
				        },
				        {
					        key: 'id',
					        type: '=',
					        val1: id
				        }
			        ],
			        page_no: 1,
			        limit: 1,
			        fromClient: true,
			        collapseData: false,
			        doNotInheritFields: true
		        }
	        };

	        _t.api(o, (err, res) => {
		        if (err) return cb(new MyError('Error while getting', {o, err}));
		        if (!res.length) return cb(new MyError('Organism not found.', {o: o, err: err}));
		        source_row = res[0];
		        cb(null);
	        });
        },
        check: function (cb) {
            if (source_row.individual_count <= count)
            	return cb(new UserError('Count is incorrect'));

            cb(null);
        },
        copy: function (cb) {
            new_row_params = JSON.parse(JSON.stringify(source_row));
            new_row_params.rollback_key = rollback_key;

            Object.keys(new_row_params).forEach(row => {
            	if (row.endsWith('_real_value'))
            		dynamicFields[row] = new_row_params[row];
            });

            cb(null);
        },
        changeName: function (cb) {
            let name = source_row.name;
            let regEx = /([-\w\d\s]+)_([0-9]+)$/;
            let res = regEx.exec(name);

            if (res) {
                new_row_params.name = res[1] + '_';

                let params = {
                    where: [
                        {
                            key: 'name',
                            type: 'like',
                            val1: (res[1] + '_')
                        }
                    ],
                    collapseData: false
                };

                _t.get(params, function (err, res) {
                    if (err) return cb(new MyError("ошибка при получении highestCount", {err, params}));
                    let max = 0;

                    res.forEach(ind => {
                        let count = +(/_([0-9]+)$/.exec(ind.name)[1]);
                        max = max > count ? max : count;
                    });

                    new_row_params.name += (+max + 1);
                    cb(null);
                })
            } else {
                new_row_params.name = name + '_2';
                new_source_name = name + '_1';
                cb(null);
            }
        },
        add: function (cb) {
            new_row_params['individual_count'] = count;

            _t.add(new_row_params, function (err, res) {
                if (err) return cb(new MyError('Не удалось добавить data_individual', {new_row_params, err}));
	            id_new = res.id;
                cb(null);
            });

        },
	    addDynamicFieldsValues: cb => {
		    let o = {
			    command: 'modify',
			    object: 'data_individual',
			    client_object: 'tbl_data_individual_collection',
			    params: {
			    	id: id_new,
				    rollback_key: rollback_key,
				    doNotSaveRollback: true
			    }
		    };

		    Object.keys(dynamicFields).forEach(row => {
		    	o.params[row] = dynamicFields[row];
		    });

		    _t.api(o, (err, res) => {
			    if (err) return cb(new MyError('Error while modifying', {o: o, err: err}));
			    cb(null);
		    });
	    },
        modifySource: function (cb) {
            let params = {
                individual_count: source_row.individual_count - count,
                id: id,
                rollback_key: rollback_key
            };

            if (new_source_name)
            	params.name = new_source_name;

            _t.modify(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось изменить data_individual', {params: params, err: err}));
                cb(null);
            });
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
                    method: 'split',
                    params: obj
                });
            }
            cb(null, new UserOk('Ок'));
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
