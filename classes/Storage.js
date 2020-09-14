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
Model.prototype.getTreePrototype = Model.prototype.getTree;
Model.prototype.getTreePrototype_v2 = Model.prototype.getTree_v2;
Model.prototype.getTreeChildsPrototype = Model.prototype.getTreeChilds;

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
	let fields = ['address', 'place', 'contact_person', 'contact_phone', 'contact_email',
		'project_id', 'project', 'organization_id', 'organization'];
	function getParent(id, cb) {
		_t.getById({id:id}, (err, res) => {
			if (err) return cb(err);
			cb(res && res[0] ? res[0] : null);
		});
	}
	function checkField(item, field, ind, cb) {
		if (item[field + '_parent']) {
			cb(item[field + '_parent'], item.parent_name);
		} else if (parents.length && ind < parents.length) {
			checkField(parents[ind], field, ind + 1, cb);
		} else if (!item.parent_id) {
			cb(null);
		} else {
			getParent(item.parent_id, (parent) => {
				if (parent) {
					parents.push(parent);
					return checkField(parents[ind], field, ind, cb);
				}

				cb(null);
			});
		}
	}
	let parents = [];

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

					checkField(item, field, 0, (value, source) => {
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

Model.prototype.getTaxon = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var result_obj = {
        storage_taxon:[]
    };

    var storage;
    var used_taxon_ids = [];
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить storage.',{id:id,err:err}));
                storage = res[0];
                cb(null);
            });
        },
        getTaxons:function(cb){
            var o = {
                command:'get',
                object:'data_individual',
                params:{
                    param_where:{
                        storage_id:storage.id
                    },
                    sort:'taxon',
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить data_individual',{o : o, err : err}));
                // result_obj.project_taxon = res;
                for (var i in res) {
                    if (used_taxon_ids.indexOf(res[i].taxon_id) !== -1) continue;
                    used_taxon_ids.push(res[i].taxon_id);
                    result_obj.storage_taxon.push({
                        id:res[i].taxon_id,
                        name:res[i].taxon
                    });
                }
                cb(null);
            });

        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{data:result_obj}));
    });
};

Model.prototype.getTreeOLD = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;

    if (!obj.project_id) {
        _t.getTreePrototype(obj, cb);
        return;
    }

    var storage;
    var srorage_ids = [];
    var tree;
    async.series({
        // get:function(cb){
        //     _t.getById({id:id}, function (err, res) {
        //         if (err) return cb(new MyError('Не удалось получить storage.',{id:id,err:err}));
        //         storage = res[0];
        //         cb(null);
        //     });
        // },
        getStorages:function(cb){
            var o = {
                command:'get',
                object:'storage',
                params:{
                    param_where:{
                        project_id:obj.project_id
                    },
                    collapseData:false,
                    limit:100000000
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить storage все',{o : o, err : err}));
                for (var i in res) {
                    if (!res[i].id) continue;
                    if (srorage_ids.indexOf(res[i].id) === -1) srorage_ids.push(res[i].id);
                }
                cb(null);
            });
        },
        getTree:function(cb){
            if (!srorage_ids) return cb(new UserError('No Storages in this project'));
            // srorage_ids = [406760];
            var o = {
                command:'getTree',
                object:'storage',
                params:{
                    id:id,
                    only_ids:srorage_ids

                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить storage tree',{o : o, err : err}));
                tree = res.tree;
                cb(null);
            });
        }

    },function (err, res) {
        if (err) return cb(err);
        // var resTree = {
        //     'core': {
        //         'data': tree
        //     }
        // };
        cb(null, new UserOk('noToastr',{tree:tree}));
    });
};

Model.prototype.getTree = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	var _t = this;
	var project_id = obj.project_id;
	var id = obj.id;

	if (!isNaN(+id)) {
		_t.getTreePrototype(obj, cb);
		return;
	}

	if (isNaN(+project_id)) return cb(new MyError('Не передан project_id', {obj: obj})); // Not passed to project_id

    var storage_ids = [];
	var storages;
	var tree = {
		'core': {
			'data': []
		}
	};
	var all_project_ids = [project_id];
	async.series({
		getProjectParents: function (cb) {
			var o = {
				command: 'getParentIds',
				object: 'Project',
				params: {
					id: project_id
				}
			};
			_t.api(o, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить Родительские проекты', {o: o, err: err}));
				all_project_ids = all_project_ids.concat(res.ids);
				cb(null);
			});
		},
		getStoragesAll: function (cb) {
			async.eachSeries(all_project_ids, function (proj_id, cb) {
				async.series({
					getStorages: function (cb) {
						var params = {
							param_where: {
								project_id: proj_id
							},
							limit: 100000000,
							collapseData: false
						};
						_t.get(params, function (err, res) {
							if (err) return cb(new MyError('Не удалось получить plot', {params: params, err: err})); // Could not get
							storages = res;
							cb(null);
						});
					},
					getParents: function (cb) {
						if (!storages.length) return cb(null);

						for (var i in storages) {
                            storage_ids.push(storages[i].id);
						}
                        _t.getParentIds({ids:storage_ids}, function (err, res) {
                            if (err) return cb(new MyError('Не удалось получить parent_ids.',{ids: storage_ids,err: err})); // Could not get
                            storage_ids = storage_ids.concat(res.ids);
							cb(null);
						});
					}
				}, cb);
			}, cb);
		},
		getTree: function (cb) {
            if (!storage_ids.length) return cb(null);

			var params = {
                ids: storage_ids,
                only_ids: storage_ids,
				getTreeCSSClassesFunction: function (item) {
					if (item.project_id === project_id) return ['this_project'];
					return [];
				}
			};
			_t.getTreePrototype(params, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить storage tree', {params: params, err: err})); // Could not get
				tree = res.tree;
				cb(null);
			});
		}
	}, function (err, res) {
		if (err) return cb(err);

		cb(null, new UserOk('noToastr', {tree: tree}));
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
			_t.get(params, function (err, res) {
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

Model.prototype.getTreeChilds = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	var _t = this;

	if (!obj.project_id) {
		_t.getTreeChildsPrototype(obj, cb);
		return;
	}

	var taxon_id = obj.taxon_id;

	var taxon_avalible_trait;
	var srorage_ids = [];
	var tree;
	async.series({
		// get:function(cb){
		//     _t.getById({id:id}, function (err, res) {
		//         if (err) return cb(new MyError('Не удалось получить taxon_avalible_trait.',{id:id,err:err}));
		//         taxon_avalible_trait = res[0];
		//         cb(null);
		//     });
		// },
		getStorages: function (cb) {
			var o = {
				command: 'get',
				object: 'storage',
				params: {
					param_where: {
						project_id: obj.project_id
					},
					collapseData: false,
					limit: 100000000
				}
			};
			_t.api(o, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить storage все', {o: o, err: err}));
				for (var i in res) {
					if (!res[i].id) continue;
					if (srorage_ids.indexOf(res[i].id) === -1) srorage_ids.push(res[i].id);
				}
				cb(null);
			});
		},
		getTreeChild: function (cb) {
			if (!srorage_ids) return cb(new UserError('No storage'));
			var o = {
				command: 'getTreeChilds',
				object: 'storage',
				params: {
					id: +obj.id,
					only_ids: srorage_ids

				}
			};
			_t.api(o, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить стораджы', {o: o, err: err}));
				tree = res.tree;
				cb(null);
			});
		}

	}, function (err, res) {
		if (err) return cb(err);
		// var resTree = {
		//     'core': {
		//         'data': tree
		//     }
		// };
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

				['name', 'parent_id', 'project_id', 'organization_id',
					'contact_email', 'contact_person', 'contact_phone',
					'address', 'place'].forEach(row => {
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


// var o = {
// 	command: 'generateFullName',
// 	object: 'storage',
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


Model.prototype.getForSelect_byProjectId = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    var project_id = obj.project_id;
    if (isNaN(+project_id)) return cb(new MyError('Не передан project_id', {obj: obj}));

    let params = {
        param_where: {
            project_id: project_id
        },
        collapseData: false
    };

    _t.get(params, (err, res) => {
        if (err) return cb(new UserError('Storages not found'));
        cb(null, {
            storages: res
        });
    });
};

Model.prototype.getParentProjectStorages = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	let _t = this;

	let index = obj.where.findIndex(item => item.key == 'project_id');
	let project_id = obj.where[index].val1;

	let all_project_ids = [project_id];
	let storages;

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
				all_project_ids = all_project_ids.concat(res.ids);
				cb(null);
			});
		},
		getAllStorages: function (cb) {
			let params = {
				where: [
					{
						key: 'project_id',
						type: 'in',
						val1: all_project_ids
					}
				],
				limit: 1000000,
				collapseData: false
			}

			obj.where.filter(row => row.key !== 'project_id').forEach(row => {
				params.where.push(row);
			});

			_t.get(params, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить storage', {params: params, err: err})); // Could not get
				storages = res;
				cb(null);
			});
		},
	}, function (err, res) {
		if (err) return cb(err);
		cb(null, storages);
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