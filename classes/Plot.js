/**
 * Created by iig on 29.10.2015.
 */
var MyError = require('../error').MyError;
var UserError = require('../error').UserError;
var UserOk = require('../error').UserOk;
var BasicClass = require('./system/BasicClass');
var util = require('util');
var async = require('async');
var funcs = require('../libs/functions');
var rollback = require('../modules/rollback');

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
	let fields = ['altitude', 'longitude', 'latitude', 'coordinate_uncertainty',
		'location_id', 'location', 'habitat_id', 'habitat'];
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
        add: function (cb) {
        	if (!obj.full_name)
		        obj.full_name = obj.name;

	        //if (creating more than 1 objects) go to addMany()
	        if (objects_to_create_n > 0) return cb(null);

            _t.addPrototype(obj, function (err, res) {
                if (err) return cb(new MyError('Error while adding plot', {obj: obj, err: err}));
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

Model.prototype.getTree = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	var _t = this;
	var project_id = obj.project_id;
	var id = obj.id;

	if (!isNaN(+id)){
		_t.getTreePrototype(obj, cb);
		return;
	}

	if (isNaN(+project_id)) return cb(new MyError('Не передан project_id',{obj:obj})); // Not passed to project_id

	var parent_ids = [];
	var plot_ids = [];
	var only_ids = [];
	var plots;
	var tree = {
		'core': {
			'data': []
		}
	};
	var all_project_ids = [project_id];
	async.series({
		getProjectParentS:function(cb){
			var o = {
				command:'getParentIds',
				object:'Project',
				params:{
					id:project_id
				}
			};
			_t.api(o, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить Родительские проекты',{o : o, err : err}));
				all_project_ids = all_project_ids.concat(res.ids);
				cb(null);
			});
		},
		getPlotsAll:function(cb){

			async.eachSeries(all_project_ids, function(proj_id, cb){
				async.series({
					getPlots:function(cb){
						var params = {
							param_where:{
								project_id:proj_id
							},
							limit:100000000,
							collapseData:false
						};
						_t.get(params, function (err, res) {
							if (err) return cb(new MyError('Не удалось получить plot',{params : params, err : err})); // Could not get
							plots = res;
							cb(null);
						});
					},
					getParents:function(cb){
						// if (!plots) return cb(new UserError('No plot linked to project'));
						if (!plots.length) return cb(null);

						for (var i in plots) {
							plot_ids.push(plots[i].id);
						}
						_t.getParentIds({ids:plot_ids}, function (err, res) {
							if (err) return cb(new MyError('Не удалось получить parent_ids.',{ids:plot_ids,err:err})); // Could not get
							plot_ids = plot_ids.concat(res.ids);
							cb(null);
						});
					}
				}, cb);
			}, cb);
		},
		getTree:function(cb){
			if (!plot_ids.length) return cb(null);
			// var only_ids = plot_ids.concat(parent_ids);

			var params = {
				ids:plot_ids,
				// only_ids:only_ids,
				only_ids:plot_ids,
				getTreeCSSClassesFunction:function(item){
					if (item.project_id === project_id) return ['this_project'];
					return [];
				}
			};
			_t.getTreePrototype(params, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить plot tree',{params : params, err : err})); // Could not get
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

Model.prototype.getTreeChilds = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = +obj.id;
    var project_id = obj.project_id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj})); // Not passed to id
    if (isNaN(+project_id)) return cb(new MyError('Не передан project_id',{obj:obj})); // Not passed to project_id

    var plot_ids = [];
    var tree;
    async.series({
        getPlots:function(cb){
            var params = {
                param_where:{
                    project_id:project_id
                },
                limit:100000000,
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить plot',{params : params, err : err})); // Could not get
                for (var i in res) {
                    plot_ids.push(res[i].id);
                }
                cb(null);
            });
        },
        getTreeChild:function(cb){
            if (!plot_ids.length) return cb(new MyError('Нету plot для этого проекта'));

            var params = {
                id: id,
                only_ids: plot_ids,
                getTreeCSSClassesFunction: function (item) {
                    if (item.project_id === project_id) return ['this_project'];
                    return [];
                }
            };
            _t.getTreeChildsPrototype(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить plot tree childs',{params : params, err : err})); // Could not get
                tree = res.tree;
                cb(null);
            });
        }

    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{tree:tree}));
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

	let new_plot = {
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

				['name', 'parent_id', 'project_id',
					'habitat_id', 'location_id',
					'latitude', 'longitude',
					'coordinate_uncertainty', 'notes'].forEach(row => {
					new_plot[row] = res[0][row];
				});

				cb(null);
			});
		},
		add: cb => {
			_t.add(new_plot, cb);
		}
	}, function (err, res) {
		if (err) return cb(err);
		cb(null, res.add);
	});
};


// var o = {
// 	command: 'generateFullName',
// 	object: 'plot',
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


Model.prototype.getAllFactors = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj})); // No passed to id



    var plot, plots;
    var plot_factors = [];
    var plot_ids = [id];
    var res_plot_factors = [];
    var traits_character = [];
    var flat_plot_factor_table = {};
    var plot_factor_ids = [];
    var parent_ids;
    var plot_factors_without_val;
    async.series({
        get:function(cb){
	        let o = {
		        param_where: {
			        id:id
		        },
		        collapseData: false
	        };
            _t.get(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить plot.',{id:id,err:err})); // Failed to get plot
                plot = res[0];
                cb(null);
            });
        },
        // getPlots:function(cb){
        //     var params = {
        //         param_where:{
        //             project_id:plot.project_id
        //         },
        //         limit:100000000,
        //         collapseData:false
        //     };
        //     _t.get(params, function (err, res) {
        //         if (err) return cb(new MyError('Не удалось получить plot',{params : params, err : err})); // Could not get
        //         plots = res;
        //
        //         cb(null);
        //     });
        // },
        getParents:function(cb){
            _t.getParentIds({id:id}, function(err, res){
                if (err) return cb(err);
                parent_ids = res.ids;
                plot_ids = plot_ids.concat(parent_ids);
                cb(null, res);
            })
        },
        getFactors:function(cb){
        	if (!plot) return cb(null);
            var o = {
                command:'get',
                object:'plot_factor_value',
                params:{
                    where:[
                        {
                            key:'plot_id',
                            val1:plot.id
                        }
                    ],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось plot_factor_value',{o : o, err : err})); // Could not plot_factor_value

                for (var i in res) {
                    flat_plot_factor_table[res[i].id] = res[i];
                    flat_plot_factor_table[res[i].id].pictures = [];
                    if (plot_factor_ids.indexOf(res[i].plot_factor_id) === -1) plot_factor_ids.push(res[i].plot_factor_id);
                }
                cb(null);
            });
        },
        getFactorsParental:function(cb){
            if (!parent_ids.length) return cb(null);

            var o = {
                command:'get',
                object:'plot_factor_value',
                params:{
                    where:[
                        {
                            key:'plot_id',
                            group:'g1',
                            type:'in',
                            comparisonType:'OR',
                            val1:parent_ids
                        },
                        {
                            key:'plot_id',
                            group:'g1',
                            comparisonType:'OR',
                            type:'isNull'
                        },
                        {
                            key:'inherit',
                            val1:true
                        }
                    ],
                    sort: {
                        columns: ['plot_node_deep'],
                        directions: ['DESC']
                    }, // Обязательно. Тогда берется имменно ближайший родственник, а не самый верхний. / Required. Then the nearest relative is taken, and not the uppermost.
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось plot_factor_value',{o : o, err : err}));

                for (var i in res) {
                    if (plot_factor_ids.indexOf(res[i].plot_factor_id) !== -1) continue; // не добавляем родительские, если указаны на этом уровне
                    flat_plot_factor_table[res[i].id] = res[i];
                    flat_plot_factor_table[res[i].id].isParent = true;
                    flat_plot_factor_table[res[i].id].pictures = [];
                    plot_factor_ids.push(res[i].plot_factor_id);
                }
                cb(null);
            });
        },

        getAllAnotherFactors:function(cb){
            var o = {
                command:'get',
                object:'plot_factor',
                params:{
                    where:[],
                    collapseData:false,
                    limit:100000000,
                }
            };
            if (plot_factor_ids.length){
                o.params.where.push(
                    {
                        key:'id',
                        type:'!in',
                        val1:plot_factor_ids
                    }
                )
            }
            if (plot_ids.length){
                o.params.where.push(
                    {
                        key:'plot_id',
                        type:'in',
                        group:'g1',
                        comparisonType:'OR',
                        val1:plot_ids
                    }
                );
                o.params.where.push(
                    {
                        key:'plot_id',
                        type:'isNull',
                        group:'g1',
                        comparisonType:'OR'
                    }
                );
            }
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить plot_factor',{o : o, err : err}));


                plot_factors_without_val = res;
                for (var i in plot_factors_without_val) {
                    plot_factors_without_val[i].pictures = [];
                    if (plot_factor_ids.indexOf(plot_factors_without_val[i].id) === -1) plot_factor_ids.push(plot_factors_without_val[i].id);
                }

                cb(null);
            });
        },
        getPictures:function(cb){
            return cb(null); // Пока нет изображений у plot_factors / No images yet for plot_factors


            // if (obj.count_only) return cb(null);
            // if (!plot_factor_ids.length) return cb(null);
            // var o = {
            //     command: 'get',
            //     object: 'Trait_picture',
            //     params: {
            //         where: [
            //             {
            //                 key: 'plot_id',
            //                 type: 'in',
            //                 val1: plot_factor_ids
            //             }
            //         ],
            //         collapseData: false
            //     }
            // };
            // _t.api(o, function (err, res) {
            //     if (err) return cb(new MyError('Не удалось изображения для трейтов', {o: o, err: err}));
            //     for (var i in res) {
            //         var pic = res[i];
            //         //
            //         for (var j in flat_plot_factor_table) {
            //             if (flat_plot_factor_table[j].plot_factor_id === pic.plot_factor_id) {
            //                 flat_plot_factor_table[j].pictures.push(pic);
            //             }
            //         }
            //         for (var k in plot_factors_without_val) {
            //             if (plot_factors_without_val[k].id === pic.plot_factor_id) {
            //                 plot_factors_without_val[k].pictures.push(pic);
            //             }
            //         }
            //     }
            //     cb(null);
            // });

        },
        getValues:function(cb){
            if (obj.listOnly) return cb(null);
            // Получим конкретные значения и совместим их с flat_plot_factor_table
            // Для этого разобъем flat_plot_factor_table на группы (INT/TEXT/SELECT)
            // Get specific values and combine them with flat_plot_factor_table
            // To do this, break flat_plot_factor_table into groups (INT / TEXT / SELECT)

            var values_obj_splited = {};
            for (var i in flat_plot_factor_table) {
                if (!values_obj_splited[flat_plot_factor_table[i].plot_factor_type_sysname]) values_obj_splited[flat_plot_factor_table[i].plot_factor_type_sysname] = {};
                values_obj_splited[flat_plot_factor_table[i].plot_factor_type_sysname][i] = flat_plot_factor_table[i];
            }
            async.eachSeries(Object.keys(values_obj_splited), function(one_value_obj_key, cb){
                var one_value_obj = values_obj_splited[one_value_obj_key];
                var one_value_obj_keys = Object.keys(one_value_obj);
                if (!one_value_obj_keys.length) return cb(null);
                var o = {
                    command:'get',
                    object:one_value_obj[one_value_obj_keys[0]].plot_factor_type_sub_table_name, // Так как в каждой группе все элементы одного типа, берем первый попавшийся / Since in each group all elements of the same type, we take the first
                    params:{
                        where:[
                            {
                                key:'plot_factor_value_id',
                                type:'in',
                                val1:one_value_obj_keys
                            }
                        ],
                        limit:100000000,
                        collapseData:false
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось получить ' + one_value_obj.plot_factor_type_sub_table_name,{o : o, err : err}));
                    var select_ids = []; // Использеутся только для SELECT / Only used for SELECT
                    for (var i in res) {
                        flat_plot_factor_table[res[i].plot_factor_value_id].isSetted =  !flat_plot_factor_table[res[i].plot_factor_value_id].isParent;
                        flat_plot_factor_table[res[i].plot_factor_value_id].value1 = res[i].value1;
                        flat_plot_factor_table[res[i].plot_factor_value_id].value2 = res[i].value2;
                        select_ids.push(res[i].value1);
                    }
                    if (one_value_obj_key !== 'SELECT') return cb(null);

                    // Если SELECT, то дозапросим значение из доп таблицы / If SELECT, then we'll question the value from the additional table

                    var select_tables_obj = {};
                    for (var i in one_value_obj) {
                        if (!select_tables_obj[one_value_obj[i].sub_table_name_for_select]){
                            select_tables_obj[one_value_obj[i].sub_table_name_for_select] = [];
                        }
                        select_tables_obj[one_value_obj[i].sub_table_name_for_select].push(one_value_obj[i].value1);
                    }

                    async.eachSeries(Object.keys(select_tables_obj), function(select_table_val, cb){
                        var ids = select_tables_obj[select_table_val];
                        var o = {
                            command:'get',
                            object:select_table_val,
                            params:{
                                where:[
                                    {
                                        key:'id',
                                        type:'in',
                                        val1:ids
                                    }
                                ],
                                collapseData:false
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось получить данные из ' + select_table_val,{o : o, err : err})); // Could not retrieve data from...

                            for (var i in flat_plot_factor_table) {
                                var row = flat_plot_factor_table[i];
                                if (row.sub_table_name_for_select !== select_table_val) continue;
                                for (var j in res) {
                                    if (row.value1 === res[j].id){
                                        flat_plot_factor_table[i].value1 = res[j].name;
                                        flat_plot_factor_table[i].value2 = res[j].id;
                                        break;
                                    }
                                }

                            }
                            cb(null);
                        });
                    }, cb);
                });
            }, cb);

        },
        prepareRes:function(cb){
            // if (obj.listOnly) return cb(null);
            for (var i in flat_plot_factor_table) {
                var one_factor = flat_plot_factor_table[i];
                if (typeof one_factor.value1 === 'undefined') one_factor.value1 = '';
                plot_factors.push(one_factor);
            }
            for (var j in plot_factors) {
                res_plot_factors.push(plot_factors[j]);
            }



            for (var k in plot_factors_without_val) {
                plot_factors_without_val[k].plot_factor_id = plot_factors_without_val[k].id;
                res_plot_factors.push(plot_factors_without_val[k]);
            }

            res_plot_factors.sort(function(a,b){
                if (a.plot_factor_type_sysname === "TEXT" && b.plot_factor_type_sysname !== "TEXT") return 1;
                else if (a.plot_factor_type_sysname !== "TEXT" && b.plot_factor_type_sysname === "TEXT") return -1;
                else {
                    if (a.sort_no > b.sort_no) return 1;
                    else if (a.sort_no < b.sort_no) return -1;
                    else {
                        if (a.name > b.name) return 1;
                        else if (a.name < b.name) return -1;
                        else return 0;
                    }
                }
            });

            // res_plot_factors.sort(funcs.fieldSorter(['sort_no','name']));

            cb(null);
        }
    },function (err, res) {
	    if (err) return cb(err);
	    cb(null, new UserOk('noToastr', {
		    plot_factors: res_plot_factors
	    }));
    });
};

Model.prototype.getParentProjectPlots = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    var index = obj.where.findIndex(item => item.key == 'project_id');
    var project_id = obj.where[index].val1;

    var all_project_ids = [project_id];
    var plots;

    async.series({
        getProjectParents: function(cb){
            var o = {
                command:'getParentIds',
                object:'Project',
                params:{
                    id: project_id
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить Родительские проекты',{o : o, err : err}));
                all_project_ids = all_project_ids.concat(res.ids);
                cb(null);
            });
        },
        getAllPlots: function(cb){
            var params = {
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
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить plot',{params : params, err : err})); // Could not get
                plots = res;
                cb(null);
            });
        },
    }, function (err, res) {
        if (err) return cb(err);
        cb(null, plots);
    });
};

Model.prototype.example = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj})); // Not passed to id
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