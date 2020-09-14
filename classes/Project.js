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
var Excel = require('exceljs');
var fuzzysort = require('fuzzysort');
var moment = require('moment');

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

/**
 * После создания проекта, добавим создателя в access-list
 * After creating the project, add the creator to the access-list
 * @param obj
 * @param cb
 * @private
 */
Model.prototype.add_ = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var id;
    async.series({
        inheritFoundationFromParent: function(cb) {
            if (obj.parent_id) {
                _t.getById({id: obj.parent_id}, function (err, res) {
                    if (err) return cb(new MyError(err.message));

                    obj.foundation = res[0].foundation;
	                obj.full_name = res[0].full_name + ': ' + obj.name;

                    cb(null);
                })
            } else {
                cb(null);
            }
        },
        add:function(cb){
            obj.rollback_key = rollback_key;
            _t.addPrototype(obj, function(err, res){
                if (err) return cb(err);
                id = res.id;
                cb(null, res);
            });
        },
        AddToAccessList:function(cb){
            var class_operation;
            async.series({
                getClassOperation:function(cb){
                    var o = {
                        command:'get',
                        object:'class_operation',
                        params:{
                            param_where:{
                                class:'project',
                                name:'*'
                            },
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить class_operation',{o : o, err : err})); // Could not get class_operation
                        if (!res.length) return cb(new MyError('Class "Project" not found',{o:o}));
                        if (res.length > 1) return cb(new MyError('Too many class "Project" records',{o:o}));
                        class_operation = res[0];
                        cb(null);
                    });

                },
                addToAL:function(cb){
                    var o = {
                        command:'add',
                        object:'list_of_access',
                        params:{
                            class_operation_id:class_operation.id,
                            record_id:id,
                            user_id:_t.user.user_data.id,
                            rollback_key:rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось добавить запись в список доступа',{o : o, err : err})); // Failed to add entry to access list
                        cb(null);
                    });
                }
            }, cb);
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, res.add);
    });
};

Model.prototype.getTree = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;




    var tree = [];
    var child_tree = obj.child_tree;
    var project;
    var childs;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить проект.',{id:id,err:err}));
                project = res[0];
                cb(null);
            });
        },
        gatChilds:function(cb){
            if (!project) return cb(new MyError('проект не существует.',{obj:obj}));
            var params = {
                param_where:{
                    parent_id:project.id
                },
                sort:{
                    columns:['name'],
                    directions:['ASC']
                },
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить детей проекта',{params : params, err : err}));
                childs = res;
                cb(null);
            });
        },
        compileTree:function(cb){

            tree.push({
                id:project.id,
                name:project.name,
                name_with_id:project.name_with_id,
                text:project.name,
                children:[],
                count:0,
                expanded:true,
                state:{
                    opened:true,
                    selected:!obj.child_tree
                }
            });
            var tree_index = tree.length -1;
            for (var i in childs) {
                tree[tree_index].children.push({
                    id:childs[i].id,
                    name:childs[i].name,
                    name_with_id:childs[i].name_with_id,
                    text:childs[i].name,
                    children:[],
                    count:0
                });
                tree[tree_index].count++;
            }

            if (child_tree){
                console.log('child_node', child_tree);
                for (var i in tree[0].children) {
                    var child_node = tree[0].children[i];
                    if (+child_node.id === +child_tree[0].id){
                        tree[0].children[i] = child_tree[0];
                    }
                }
            }
            cb(null);


            // tree.push({
            //     id:project.id,
            //     name:project.name,
            //     name_with_id:project.name_with_id,
            //     nodes:[],
            //     count:0,
            //     expanded:true
            // });
            // var tree_index = tree.length -1;
            // for (var i in childs) {
            //     tree[tree_index].nodes.push({
            //         id:childs[i].id,
            //         name:childs[i].name,
            //         name_with_id:childs[i].name_with_id,
            //         nodes:[],
            //         count:0
            //     });
            //     tree[tree_index].count++;
            // }
            //
            // if (child_tree){
            //     console.log('child_node', child_tree);
            //     for (var i in tree[0].nodes) {
            //         var child_node = tree[0].nodes[i];
            //         if (+child_node.id === +child_tree[0].id){
            //             tree[0].nodes[i] = child_tree[0];
            //         }
            //     }
            // }
            // cb(null);
        },
        getParent:function(cb){
            if (!project.parent_id) return cb(null);
            var params = {
                id:project.parent_id,
                child_tree:tree
            };
            _t.getTree(params, function(err, res){
                if (err) return cb(err);
                tree = res.tree;
                cb(null);
            })
        }
    },function (err, res) {
        if (err) return cb(err);
        var resTree = tree;
        if (!obj.child_tree){
            resTree = {
                'core': {
                    'data': tree
                }
            };
        }


        cb(null, new UserOk('noToastr',{tree:resTree}));

    });
};

/**
 * Метод возвращает plots этого проекта
 * @param obj
 * @param cb
 * @returns plot:[]
 */
Model.prototype.getPlots = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var plot;
    async.series({
        getPlot:function(cb){
            var o = {
                command:'get',
                object:'plot',
                params:{
                    param_where:{
                        project_id:id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить plot',{o : o, err : err}));
                plot = res;
                cb(null);
            });
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{plot:plot}));
    });
};

/**
 * Метод возвращает plots родительских проектов
 * @param obj
 * @param cb
 * @returns plot:[]
 */
Model.prototype.getParentPlots = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var parent_ids;
    var parent_plot = [];
    async.series({
        getParentIds:function(cb){
            _t.getParentIds({id:id}, function(err, res){
                if (err) return cb(err);
                parent_ids = res.ids;
                cb(null, res);
            })
        },
        getPlot:function(cb){
            if (!parent_ids.length) return cb(null);
            var o = {
                command:'get',
                object:'plot',
                params:{
                    where:[
                        {
                            key:'project_id',
                            type:'in',
                            val1:parent_ids
                        }
                    ],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить parent_plot',{o : o, err : err}));
                parent_plot = res;
                cb(null);
            });
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{plot:parent_plot}));
    });
};

Model.prototype.getAllPlotFactorsOLD = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj})); // No passed to id



    var project;
    var plot_factors = [];
    var project_ids = [id];
    var res_plot_factors = [];
    var traits_character = [];
    var flat_plot_factor_table = {};
    var plot_factor_ids = [];
    var parents;
    var project_plot_factor;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить проект.',{id:id,err:err})); // Failed to get project
                project = res[0];
                cb(null);
            });
        },

        getParents:function(cb){
            _t.getParentIds({id:id}, function(err, res){
                if (err) return cb(err);
                parents = res.ids;
                project_ids = project_ids.concat(parents);
                cb(null, res);
            })
        },
        getFactors:function(cb){
            var o = {
                command:'get',
                object:'plot_factor_value',
                params:{
                    where:[
                        {
                            key:'project_id',
                            val1:project.id
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
                    if (plot_factor_ids.indexOf(res[i].project_plot_factor_id) === -1) plot_factor_ids.push(res[i].project_plot_factor_id);
                }
                cb(null);
            });
        },
        getFactorsParental:function(cb){
            if (!parents.length) return cb(null);

            var o = {
                command:'get',
                object:'plot_factor_value',
                params:{
                    where:[
                        {
                            key:'project_id',
                            group:'g1',
                            type:'in',
                            val1:parents
                        },
                        {
                            key:'inherit',
                            val1:true
                        }
                    ],
                    sort: {
                        columns: ['node_deep'],
                        directions: ['DESC']
                    }, // Обязательно. Тогда берется имменно ближайший родственник, а не самый верхний. / Required. Then the nearest relative is taken, and not the uppermost.
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось plot_factor_value',{o : o, err : err}));

                for (var i in res) {
                    if (plot_factor_ids.indexOf(res[i].project_plot_factor_id) !== -1) continue; // не добавляем родительские, если указаны на этом уровне
                    flat_plot_factor_table[res[i].id] = res[i];
                    flat_plot_factor_table[res[i].id].isParent = true;
                    flat_plot_factor_table[res[i].id].pictures = [];
                    plot_factor_ids.push(res[i].project_plot_factor_id);
                }
                cb(null);
            });
        },

        getAllAnotherFactors:function(cb){
            var o = {
                command:'get',
                object:'project_plot_factor',
                params:{
                    where:[
                        // {
                        //     key:'id',
                        //     type:'!in',
                        //     val1:plot_factor_ids
                        // }
                    ],
                    collapseData:false
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
            if (project_ids.length){
                o.params.where.push(
                    {
                        key:'project_id',
                        type:'in',
                        val1:project_ids
                    }
                )
            }
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось project_plot_factor',{o : o, err : err}));


                project_plot_factor = res;
                for (var i in project_plot_factor) {
                    project_plot_factor[i].pictures = [];
                    if (plot_factor_ids.indexOf(project_plot_factor[i].id) === -1) plot_factor_ids.push(project_plot_factor[i].id);
                }

                cb(null);
            });
        },
        getPictures:function(cb){
            return cb(null); // Пока нет изображений у plot_factors / No images yet for plot_factors


            if (obj.count_only) return cb(null);
            if (!plot_factor_ids.length) return cb(null);
            var o = {
                command: 'get',
                object: 'Trait_picture',
                params: {
                    where: [
                        {
                            key: 'project_plot_factor_id',
                            type: 'in',
                            val1: plot_factor_ids
                        }
                    ],
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось изображения для трейтов', {o: o, err: err}));
                for (var i in res) {
                    var pic = res[i];
                    //
                    for (var j in flat_plot_factor_table) {
                        if (flat_plot_factor_table[j].project_plot_factor_id === pic.project_plot_factor_id) {
                            flat_plot_factor_table[j].pictures.push(pic);
                        }
                    }
                    for (var k in project_plot_factor) {
                        if (project_plot_factor[k].id === pic.project_plot_factor_id) {
                            project_plot_factor[k].pictures.push(pic);
                        }
                    }
                }
                cb(null);
            });

        },
        getValues:function(cb){
            if (obj.listOnly) return cb(null);
            // Получим конкретные значения и совместим их с flat_plot_factor_table
            // Для этого разобъем flat_plot_factor_table на группы (INT/TEXT/SELECT)
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
                                    // if (row.project_plot_factor_id === res[j].project_plot_factor_id){
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



            for (var k in project_plot_factor) {
                project_plot_factor[k].project_plot_factor_id = project_plot_factor[k].id;
                res_plot_factors.push(project_plot_factor[k]);
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
        cb(null, new UserOk('noToastr',{plot_factors:res_plot_factors}));
    });
};

/**
 * Метод возвращает locations родительских проектов
 * @param obj
 * @param cb
 * @returns location:[]
 */
Model.prototype.getParentLocations = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	var _t = this;
	var id = obj.id;
	if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}));

	var parent_ids;
	var parent_location = [];
	async.series({
		getParentIds: function (cb) {
			_t.getParentIds({id: id}, function (err, res) {
				if (err) return cb(err);
				parent_ids = res.ids;
				cb(null, res);
			})
		},
		getLocation: function (cb) {
			if (!parent_ids.length) return cb(null);
			var o = {
				command: 'get',
				object: 'project_location',
				params: {
					where: [
						{
							key: 'project_id',
							type: 'in',
							val1: parent_ids
						}
					],
					collapseData: false
				}
			};
			_t.api(o, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить parent_location', {o: o, err: err}));
				parent_location = res;
				cb(null);
			});
		}
	}, function (err, res) {
		if (err) return cb(err);
		cb(null, new UserOk('noToastr', {location: parent_location}));
	});
};

/**
 * Метод возвращает plots этого проекта и plots его родительских проектов
 * @param obj
 * @param cb
 * @returns plot:[],parent_plot:[]
 */
Model.prototype.getAllPlots = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var plot, parent_plot;
    async.series({
        getPlot:function(cb){
            _t.getPlots(obj, function(err, res){
                if (err) return cb(err);
                plot = res.plot;
                cb(null);
            });
        },
        getParentPlot:function(cb){
            _t.getParentPlots(obj, function(err, res){
                if (err) return cb(err);
                parent_plot = res.plot;
                cb(null);
            });
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{plot:plot,parent_plot:parent_plot}));
    });
};


// var o = {
// 	command: 'generateFullName',
// 	object: 'project',
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


/**
 * Метод возвращает project_available_taxon этого проекта
 * @param obj
 * @param cb
 * @returns project_available_taxon:[]
 */
Model.prototype.getTaxon = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var project_available_taxon;
    async.series({
        getTaxon:function(cb){
            var o = {
                command:'get',
                object:'project_available_taxon',
                params:{
                    param_where:{
                        project_id:id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить project_available_taxon',{o : o, err : err}));
                project_available_taxon = res;
                cb(null);
            });
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{project_available_taxon:project_available_taxon}));
    });
};

/**
 * Метод возвращает project_available_taxon родительских проектов
 * @param obj
 * @param cb
 * @returns project_available_taxon:[]
 */
Model.prototype.getParentTaxon = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var parent_ids;
    var parent_project_available_taxon = [];
    async.series({
        getParentIds:function(cb){
            _t.getParentIds({id:id}, function(err, res){
                if (err) return cb(err);
                parent_ids = res.ids;
                cb(null, res);
            })
        },
        getTaxon:function(cb){
            if (!parent_ids.length) return cb(null);
            var o = {
                command:'get',
                object:'project_available_taxon',
                params:{
                    columns:obj.columns,
                    where:[
                        {
                            key:'project_id',
                            type:'in',
                            val1:parent_ids
                        }
                    ],
                    sort:obj.sort,
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить parent_project_available_taxon',{o : o, err : err}));
                parent_project_available_taxon = res;
                cb(null);
            });
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{project_available_taxon:parent_project_available_taxon}));
    });
};


/**
 * Метод возвращает project_available_taxon этого проекта и project_available_taxon его родительских проектов
 * @param obj
 * @param cb
 * @returns project_available_taxon:[],parent_project_available_taxon:[]
 */
Model.prototype.getAllTaxon = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var project_available_taxon, parent_project_available_taxon;
    async.series({
        getTaxon:function(cb){
            _t.getTaxons(obj, function(err, res){
                if (err) return cb(err);
                project_available_taxon = res.project_available_taxon;
                cb(null);
            });
        },
        getParentTaxon:function(cb){
            _t.getParentTaxons(obj, function(err, res){
                if (err) return cb(err);
                parent_project_available_taxon = res.project_available_taxon;
                cb(null);
            });
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{project_available_taxon:project_available_taxon,parent_project_available_taxon:parent_project_available_taxon}));
    });
};

/**
 * Метод возвращает members этого проекта. То есть тех пользователей, которые имеют какой либо доступ к нему
 * The method returns the members of this project. That is, those users who have any access to it
 * @param obj
 * @param cb
 * @returns member:[]
 */
Model.prototype.getMembers = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var members = [];
    var class_operation_ids = [];
    var member_obj_by_user_id = {};
    async.series({
        getClassOperation:function(cb){
            var o = {
                command:'get',
                object:'class_operation',
                params:{
                    param_where:{
                        class:'project'
                        // ,
                        // name:'*'
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить class_operation',{o : o, err : err})); // Could not get class_operation
                if (!res.length) return cb(new MyError('Class "Project" not found',{o:o}));
                for (var i in res) {
                    class_operation_ids.push(res[i].id);
                }
                cb(null);
            });

        },
        getMember:function(cb){
            if (!class_operation_ids.length) return cb(null);
            var o = {
                command:'get',
                object:'list_of_access',
                params:{
                    where:[
                        {
                            key:'record_id',
                            val1:id
                        },
                        {
                            key:'class_operation_id',
                            type:'in',
                            val1:class_operation_ids
                        }
                    ],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить project_member',{o : o, err : err}));

                for (var i in res) {
                    if (!member_obj_by_user_id[res[i].user_id]) member_obj_by_user_id[res[i].user_id] = {
                        id: res[i].id,
                        class_operation_id: res[i].class_operation_id,
                        class_operation_name: res[i].class_operation_name,
                        user_id: res[i].user_id,
                        firstname: res[i].firstname,
                        lastname: res[i].lastname,
                        midname: res[i].midname,
                        fio: res[i].fio,
                        record_id: res[i].record_id,
                        items: [],
                        operations: [],
                    };
                    member_obj_by_user_id[res[i].user_id].items.push(res[i]);
                    if (member_obj_by_user_id[res[i].user_id].operations.indexOf(res[i].class_operation_name) === -1){
                        member_obj_by_user_id[res[i].user_id].operations.push(res[i].class_operation_name);
                    }
                }
                cb(null);
            });
        },
        prepare:function(cb){
            for (var i in member_obj_by_user_id) {
                member_obj_by_user_id[i].operations_str = member_obj_by_user_id[i].operations.join(', ');
                members.push(member_obj_by_user_id[i]);
            }
            cb(null);
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{member:members}));
    });
};

/**
 * Метод возвращает members родительских проектов
 * members проектов, это те пользователи, которые имеют какой-либо доступ
 * The method returns members of the parent projects
 * members of projects, these are those users who have any access
 * @param obj
 * @param cb
 * @returns member:[]
 */
Model.prototype.getParentMembers = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var parent_ids;
    var parent_member = [];
    var class_operation_ids = [];
    var parent_member_obj_by_user_id = {};
    async.series({
        getParentIds:function(cb){
            _t.getParentIds({id:id}, function(err, res){
                if (err) return cb(err);
                parent_ids = res.ids;
                cb(null, res);
            })
        },
        getClassOperation:function(cb){
            var o = {
                command:'get',
                object:'class_operation',
                params:{
                    param_where:{
                        class:'project'
                        // ,
                        // name:'*'
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить class_operation',{o : o, err : err})); // Could not get class_operation
                if (!res.length) return cb(new MyError('Class "Project" not found',{o:o}));
                for (var i in res) {
                    class_operation_ids.push(res[i].id);
                }
                cb(null);
            });

        },
        getMember:function(cb){
            if (!parent_ids.length) return cb(null);
            if (!class_operation_ids.length) return cb(null);
            var o = {
                command:'get',
                object:'list_of_access',
                params:{
                    where:[
                        {
                            key:'record_id',
                            type:'in',
                            val1:parent_ids
                        },
                        {
                            key:'class_operation_id',
                            type:'in',
                            val1:class_operation_ids
                        }
                    ],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить project_member',{o : o, err : err}));

                for (var i in res) {
                    if (!parent_member_obj_by_user_id[res[i].user_id]) parent_member_obj_by_user_id[res[i].user_id] = {
                        id: res[i].id,
                        class_operation_id: res[i].class_operation_id,
                        class_operation_name: res[i].class_operation_name,
                        user_id: res[i].user_id,
                        firstname: res[i].firstname,
                        lastname: res[i].lastname,
                        midname: res[i].midname,
                        fio: res[i].fio,
                        record_id: res[i].record_id,
                        items: [],
                        operations: [],
                    };
                    parent_member_obj_by_user_id[res[i].user_id].items.push(res[i]);
                    if (parent_member_obj_by_user_id[res[i].user_id].operations.indexOf(res[i].class_operation_name) === -1){
                        parent_member_obj_by_user_id[res[i].user_id].operations.push(res[i].class_operation_name);
                    }
                }
                cb(null);
            });
        },
        prepare:function(cb){
            for (var i in parent_member_obj_by_user_id) {
                parent_member_obj_by_user_id[i].operations_str = parent_member_obj_by_user_id[i].operations.join(', ');
                parent_member.push(parent_member_obj_by_user_id[i]);
            }
            cb(null);
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{member:parent_member}));
    });
};


/**
 * Метод возвращает members этого проекта и members его родительских проектов
 * @param obj
 * @param cb
 * @returns member:[],parent_member:[]
 */
Model.prototype.getAllMembers = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var member, parent_member;
    async.series({
        getMember:function(cb){
            _t.getMember(obj, function(err, res){
                if (err) return cb(err);
                member = res.member;
                cb(null);
            });
        },
        getParentMember:function(cb){
            _t.getParentMembers(obj, function(err, res){
                if (err) return cb(err);
                parent_member = res.member;
                cb(null);
            });
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{member:member,parent_member:parent_member}));
    });
};

/*Measurements are deprecated*/
// Model.prototype.importFromExcel = function (obj, cb) {
//     if (arguments.length == 1) {
//         cb = arguments[0];
//         obj = {};
//     }
//     let _t = this;
//
//     let rollback_key = obj.rollback_key || rollback.create();
//     var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;
//
//     let project_id = +obj.project_id;
//     if (isNaN(project_id)) return cb(new MyError('Не передан project_id',{obj:obj}));
//
//     let filename = obj.filename; // || './DB/excel/Meso_Species_totransfer2.xlsx';
//     if (!filename) return cb(new UserError('Filename not passed', {obj: obj}));
//
//     let storage_ind = 0;
//     let sampling_event_ind = 1;
//     let sample_ind = 2;
//     let plot_ind = 3;
//     let taxon_ind = 4;
//     let count_ind = 5;
//     let name_ind = 6;
//     let measurements_start_ind = 7;
//
//     let organisms = [];
//     let new_organisms = [];
//
//     let storages = {};
//     let sampling_events = {};
//     let samples = {};
//     let plots = {};
//     let taxa = {};
//     let measurements = {};
//
//     let errors = [];
//
//     let sampling_events_map = [];
//
//     let storages_set = new Set();
//     let sampling_events_set = new Set();
//     let samples_set = new Set();
//     let plots_set = new Set();
//     let taxon_set = new Set();
//
//     async.series({
//         readExcel: cb => {
//             let A_code = 'A'.charCodeAt(0);
//
//             let workbook = new Excel.Workbook();
//             let options = {
//                 map: function (value, index) {
//                     switch (index) {
//                         case 0:
//                             // column 1 is string
//                             return String(value);
//                         default:
//                             // the rest are numbers
//                             return String(value);
//                     }
//                 }
//             };
//             workbook.xlsx.readFile(filename, options)
//                 .then(() => {
//                     let ws = workbook._worksheets[1];
//
//                     for (let i in ws._rows) {
//                         let row = ws._rows[i];
//                         i = +i;
//
//                         if (i === 0) {
//                             for (let j in row._cells) {
//                                 let cell = row._cells[j];
//                                 let cell_value = cell._value.model.value;
//                                 j = +j;
//
//                                 if (j >= measurements_start_ind) {
//                                     measurements[j] = {
//                                         name: cell_value,
//                                         values: [],
//                                         values_set: new Set()
//                                     };
//                                 }
//                             }
//                         } else {
//                             let organism = {
//                                 measurements: []
//                             };
//                             let error = false;
//
//                             let sampling_event_cur;
//                             let sample_cur;
//
//                             for (let j = 0; j < row._cells.length; j++) {
//                                 let cell = row._cells[j];
//                                 let cell_value = cell ? cell._value.model.value : null;
//                                 cell_value =
//                                     cell_value ? (
//                                             typeof cell_value === 'string' ? (
//                                                     cell_value.trim().length ?
//                                                         cell_value.trim() :
//                                                         null) :
//                                                 cell_value) :
//                                         null;
//
//                                 switch (j) {
//                                     case storage_ind:
//                                         if (cell_value) {
//                                             organism.storage = cell_value;
//                                             storages_set.add(cell_value);
//                                         } else {
//                                             error = true;
//                                             errors.push({
//                                                 i: i + 1,
//                                                 j: String.fromCharCode(A_code + j),
//                                                 message: "Storage is empty."
//                                             });
//                                         }
//                                         break;
//                                     case sampling_event_ind:
//                                         if (cell_value) {
//                                             organism.sampling_event = cell_value;
//                                             sampling_events_set.add(cell_value);
//
//                                             for (const event of sampling_events_map) {
//                                                 if (event.name === cell_value) {
//                                                     sampling_event_cur = event;
//                                                     break;
//                                                 }
//                                             }
//
//                                             if (!sampling_event_cur) {
//                                                 sampling_events_map.push({
//                                                     name: cell_value,
//                                                     samples: []
//                                                 });
//                                                 sampling_event_cur = sampling_events_map[sampling_events_map.length - 1];
//                                             }
//                                         } else {
//                                             error = true;
//                                             errors.push({
//                                                 i: i + 1,
//                                                 j: String.fromCharCode(A_code + j),
//                                                 message: "Sampling event is empty."
//                                             });
//                                         }
//                                         break;
//                                     case sample_ind:
//                                         if (cell_value) {
//                                             organism.samle = cell_value;
//                                             samples_set.add(cell_value);
//
//                                             if (!sampling_event_cur) continue;
//                                             for (const sample of sampling_event_cur.samples) {
//                                                 if (sample.name === cell_value) {
//                                                     sample_cur = sample;
//                                                     break;
//                                                 }
//                                             }
//
//                                             if (!sample_cur) {
//                                                 sampling_event_cur.samples.push({
//                                                     name: cell_value,
//                                                     plots: []
//                                                 });
//                                                 sample_cur = sampling_event_cur.samples[sampling_event_cur.samples.length - 1];
//                                             }
//                                         } else {
//                                             error = true;
//                                             errors.push({
//                                                 i: i + 1,
//                                                 j: String.fromCharCode(A_code + j),
//                                                 message: "Sample is empty."
//                                             });
//                                         }
//                                         break;
//                                     case plot_ind:
//                                         if (cell_value) {
//                                             organism.plot = cell_value;
//                                             plots_set.add(cell_value);
//
//                                             if (!sample_cur) continue;
//                                             sample_cur.plot = cell_value;
//                                         } else {
//                                             error = true;
//                                             errors.push({
//                                                 i: i + 1,
//                                                 j: String.fromCharCode(A_code + j),
//                                                 message: "Plot is empty."
//                                             });
//                                         }
//                                         break;
//                                     case taxon_ind:
//                                         if (cell_value) {
//                                             organism.taxon = cell_value;
//                                             taxon_set.add(cell_value);
//                                         } else {
//                                             error = true;
//                                             errors.push({
//                                                 i: i + 1,
//                                                 j: String.fromCharCode(A_code + j),
//                                                 message: "Taxon is empty."
//                                             });
//                                         }
//                                         break;
//                                     case count_ind:
//                                         if (cell_value) {
//                                             organism.count = cell_value;
//                                         } else {
//                                             error = true;
//                                             errors.push({
//                                                 i: i + 1,
//                                                 j: String.fromCharCode(A_code + j),
//                                                 message: "Count is empty."
//                                             });
//                                         }
//                                         break;
//                                     case name_ind:
//                                         if (cell_value) {
//                                             organism.name = cell_value;
//                                         } else {
//                                             error = true;
//                                             errors.push({
//                                                 i: i + 1,
//                                                 j: String.fromCharCode(A_code + j),
//                                                 message: "Name is empty."
//                                             });
//                                         }
//                                         break;
//                                     default:
//                                         if (cell_value)
//                                             if (measurements[j]) {
//                                                 measurements[j].values_set.add(cell_value);
//                                                 organism.measurements.push({
//                                                     measurement_ind: j,
//                                                     value: cell_value
//                                                 });
//                                             } else {
//                                                 error = true;
//                                                 errors.push({
//                                                     i: i + 1,
//                                                     j: String.fromCharCode(A_code + j),
//                                                     message: "Measurement name is empty."
//                                                 });
//                                             }
//                                 }
//                             }
//
//                             if (!error) organisms.push(organism);
//                         }
//                     }
//
//                     cb(null);
//                 });
//         },
//         checkData: cb => {
//             if (errors.length) return cb(null);
//
//             async.series({
//                 checkMeasurements: cb => {
//                     async.eachSeries(Object.keys(measurements), (key, cb) => {
//                         let measurement = measurements[key];
//
//                         async.series({
//                             getMeas: cb => {
//                                 let o = {
//                                     command: 'get',
//                                     object: 'measurement',
//                                     params: {
//                                         param_where: {
//                                             name: measurement.name
//                                         },
//                                         collapseData: false
//                                     }
//                                 };
//
//                                 _t.api(o, (err, res) => {
//                                     if (err) return cb(new MyError('Error while getting measurement',{o : o, err : err}));
//
//                                     if (res.length) {
//                                         measurement.id = res[0].id;
//                                         measurement.type_sysname = res[0].type_sysname;
//                                         measurement.sub_table_name_for_select = res[0].sub_table_name_for_select;
//                                         measurement.type_sub_table_name = res[0].type_sub_table_name;
//                                     } else {
//                                         errors.push({
//                                             message: `Measurement "${measurement.name}" not found.`
//                                         });
//                                     }
//
//                                     cb(null);
//                                 });
//                             },
//                             getSelectValues: cb => {
//                                 if (!measurement.id || measurement.type_sysname !== 'SELECT') return cb(null);
//
//                                 let o = {
//                                     command: 'get',
//                                     object: measurement.sub_table_name_for_select,
//                                     params: {
//                                         collapseData: false
//                                     }
//                                 };
//
//                                 _t.api(o, (err, res) => {
//                                     if (err) return cb(new MyError('Error while getting measurement values',{o : o, err : err}));
//
//                                     if (res.length) {
//                                         Array.from(measurement.values_set).forEach(row => {
//                                             let found = false;
//                                             for (const value of res) {
//                                                 if (value.name === row) {
//                                                     measurement.values.push({
//                                                         id: value.id,
//                                                         name: row
//                                                     });
//                                                     found = true;
//                                                     break;
//                                                 }
//                                             }
//
//                                             if (!found)
//                                                 errors.push({
//                                                     message: `Value "${row}" of measurement "${measurement.name}" not found.`
//                                                 });
//                                         });
//                                     } else {
//                                         errors.push({
//                                             message: `Values of "${measurement.name}" not found.`
//                                         });
//                                     }
//
//                                     cb(null);
//                                 });
//                             }
//                         }, cb);
//                     }, cb);
//                 },
//                 checkStorages: cb => {
//                     async.eachSeries(Array.from(storages_set), (storage, cb) => {
//                         let o = {
//                             command: 'get',
//                             object: 'storage',
//                             params: {
//                                 param_where: {
//                                     name: storage
//                                 },
//                                 collapseData: false
//                             }
//                         };
//
//                         _t.api(o, (err, res) => {
//                             if (err) return cb(new MyError('Error while getting storage',{o : o, err : err}));
//
//                             if (res.length) {
//                                 storages[storage] = res[0].id;
//                             } else {
//                                 errors.push({
//                                     message: `Storage "${storage}" not found.`
//                                 });
//                             }
//
//                             cb(null);
//                         });
//                     }, cb);
//                 },
//                 checkSamplingEvents: cb => {
//                     async.eachSeries(Array.from(sampling_events_set), (event, cb) => {
//                         let o = {
//                             command: 'get',
//                             object: 'sampling_event',
//                             params: {
//                                 param_where: {
//                                     name: event
//                                 },
//                                 collapseData: false
//                             }
//                         };
//
//                         _t.api(o, (err, res) => {
//                             if (err) return cb(new MyError('Error while getting sampling event',{o : o, err : err}));
//
//                             if (res.length) {
//                                 sampling_events[event] = res[0].id;
//                             } else {
//                                 errors.push({
//                                     message: `Sampling event "${event}" not found.`
//                                 });
//                             }
//
//                             cb(null);
//                         });
//                     }, cb);
//                 },
//                 checkPlots: cb => {
//                     async.eachSeries(Array.from(plots_set), (plot, cb) => {
//                         let o = {
//                             command: 'get',
//                             object: 'plot',
//                             params: {
//                                 param_where: {
//                                     name: plot
//                                 },
//                                 collapseData: false
//                             }
//                         };
//
//                         _t.api(o, (err, res) => {
//                             if (err) return cb(new MyError('Error while getting plot',{o : o, err : err}));
//
//                             if (res.length) {
//                                 plots[plot] = res[0].id;
//                             } else {
//                                 errors.push({
//                                     message: `Plot "${plot}" not found.`
//                                 });
//                             }
//
//                             cb(null);
//                         });
//                     }, cb);
//                 },
//                 checkSample: cb => {
//                     async.eachSeries(sampling_events_map, (event, cb) => {
//                         event.id = sampling_events[event.name];
//                         if (!event.id) return cb(null);
//
//                         async.eachSeries(event.samples, (sample, cb) => {
//                             sample.plot_id = plots[sample.plot];
//                             if (!sample.plot_id) return cb(null);
//
//                             let o = {
//                                 command: 'get',
//                                 object: 'sample',
//                                 params: {
//                                     param_where: {
//                                         name: sample.name,
//                                         sampling_event_id: event.id,
//                                         plot_id: sample.plot_id
//                                     },
//                                     collapseData: false
//                                 }
//                             };
//
//                             _t.api(o, (err, res) => {
//                                 if (err) return cb(new MyError('Error while getting sample',{o : o, err : err}));
//
//                                 if (res.length) {
//                                     samples[sample.name] = res[0].id;
//                                 } else {
//                                     errors.push({
//                                         message: `Sample "${sample.name}" not found.`
//                                     });
//                                 }
//
//                                 cb(null);
//                             });
//                         }, cb);
//                     }, cb);
//                 },
//                 checkTaxa: cb => {
//                     async.eachSeries(Array.from(taxon_set), (taxon, cb) => {
//                         let gbif_taxon;
//
//                         async.series({
//                             getTaxon: cb => {
//                                 let o = {
//                                     command: 'get',
//                                     object: 'taxon',
//                                     params: {
//                                         param_where: {
//                                             name: taxon
//                                         },
//                                         collapseData: false
//                                     }
//                                 };
//
//                                 _t.api(o, (err, res) => {
//                                     if (err) return cb(new MyError('Error while getting taxon',{o : o, err : err}));
//
//                                     if (res.length) taxa[taxon] = res[0].id;
//
//                                     cb(null);
//                                 });
//                             },
//                             findTaxonInGBIF: cb => {
//                                 if (taxa[taxon]) return cb(null);
//
//                                 let o = {
//                                     command: 'get',
//                                     object: 'taxon_gbif',
//                                     params: {
//                                         where: [
//                                             {
//                                                 key: 'gbif_canonicalName',
//                                                 type: 'in',
//                                                 val1: taxon
//                                             },
//                                             {
//                                                 key: 'gbif_taxonomicStatus',
//                                                 val1: 'accepted'
//                                             }
//                                         ],
//                                         limit: 1000000,
//                                         collapseData: false
//                                     }
//                                 };
//
//                                 _t.api(o, function (err, res) {
//                                     if (err) return cb(new MyError('Error while checking GBIF', {o: o, err: err}));
//
//                                     if (res.length) {
//                                         for (let obj of res) {
//                                             if (obj.gbif_canonicalName === taxon) {
//                                                 gbif_taxon = obj;
//                                                 break;
//                                             }
//                                         }
//                                     } else {
//                                         errors.push({
//                                             message: `"${taxon}": No such taxa in GBIF, check spelling.`
//                                         });
//                                     }
//
//                                     cb(null);
//                                 });
//                             },
//                             addTaxon: cb => {
//                                 if (!gbif_taxon) return cb(null);
//
//                                 let o = {
//                                     command: 'add',
//                                     object: 'taxon',
//                                     params: {
//                                         taxon_gbif_id: gbif_taxon.id,
//                                         level_name: gbif_taxon.gbif_taxonRank,
//                                         rollback_key: rollback_key,
//                                         doNotSaveRollback: true
//                                     }
//                                 };
//
//                                 _t.api(o, function (err, res) {
//                                     if (err) return cb(new MyError('Error while adding taxon', {o: o, err: err}));
//
//                                     taxa[taxon] = res.id;
//
//                                     cb(null);
//                                 });
//                             },
//                             importFromGBIF: cb => {
//                                 if (!gbif_taxon || !taxa[taxon]) return cb(null);
//
//                                 let o = {
//                                     command: 'importFromGBIFThisAndParents',
//                                     object: 'taxon',
//                                     params: {
//                                         id: taxa[taxon],
//                                         rollback_key: rollback_key,
//                                         doNotSaveRollback: true
//                                     }
//                                 };
//
//                                 _t.api(o, function (err, res) {
//                                     if (err) return cb(new MyError('Error while importing taxon from GBIF', {o: o, err: err}));
//
//                                     taxa[taxon] = res.imported_id;
//
//                                     cb(null);
//                                 });
//                             }
//                         }, cb);
//                     }, cb);
//                 }
//             }, cb);
//         },
//         addOrganisms: cb => {
//             if (errors.length) return cb(null);
//
//             async.eachSeries(organisms, (organism, cb) => {
//                 async.series({
//                     addOrganism: cb => {
//                         let o = {
//                             command: 'add',
//                             object: 'data_individual',
//                             params: {
//                                 name: organism.name,
//                                 individual_count: organism.count,
//                                 sample_id: samples[organism.sample],
//                                 sampling_event_id: sampling_events[organism.sampling_event],
//                                 taxon_id: taxa[organism.taxon],
//                                 storage_id: storages[organism.storage],
//                                 rollback_key: rollback_key,
//                                 doNotSaveRollback: true
//                             }
//                         };
//
//                         _t.api(o, function (err, res) {
//                             if (err) return cb(new MyError('Error while adding organism', {o: o, err: err}));
//
//                             organism.id = res.id;
//                             new_organisms.push(organism.name);
//
//                             cb(null);
//                         });
//                     },
//                     addMeasurements: cb => {
//                         async.eachSeries(organism.measurements, (measurement, cb) => {
//                             let meas_obj = measurements[measurement.measurement_ind];
//
//                             measurement.id = meas_obj.id;
//                             measurement.type_sysname = meas_obj.type_sysname;
//                             measurement.type_sub_table_name = meas_obj.type_sub_table_name;
//                             measurement.values = meas_obj.values;
//
//                             async.series({
//                                 addValue: cb => {
//                                     let o = {
//                                         command: 'add',
//                                         object: 'measurement_value',
//                                         params: {
//                                             measurement_id: measurement.id,
//                                             data_individual_id: organism.id,
//                                             rollback_key: rollback_key,
//                                             doNotSaveRollback: true
//                                         }
//                                     };
//
//                                     _t.api(o, function (err, res) {
//                                         if (err) return cb(new MyError('Error while adding measurement value', {o: o, err: err}));
//
//                                         measurement.value_id = res.id;
//
//                                         cb(null);
//                                     });
//                                 },
//                                 addValueValue: cb => {
//                                     let value = measurement.value;
//
//                                     if (measurement.type_sysname === 'SELECT')
//                                         for (const value_tmp of measurement.values) {
//                                             if (value_tmp.name === value) {
//                                                 value = value_tmp.id;
//                                                 break;
//                                             }
//                                         }
//
//                                     let o = {
//                                         command: 'add',
//                                         object: measurement.type_sub_table_name,
//                                         params: {
//                                             measurement_value_id: measurement.value_id,
//                                             value1: value,
//                                             rollback_key: rollback_key,
//                                             doNotSaveRollback: true
//                                         }
//                                     };
//
//                                     _t.api(o, function (err, res) {
//                                         if (err) return cb(new MyError('Error while adding measurement value value', {o: o, err: err}));
//
//                                         measurement.value_value_id = res.id;
//
//                                         cb(null);
//                                     });
//                                 }
//                             }, cb);
//                         }, cb);
//                     }
//                 }, cb);
//             }, cb);
//         }
//     }, (err, res) => {
//         // console.log(errors);
//
//         if (err) {
//             if (doNotSaveRollback) return cb(err);
//             rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
//                 return cb(err, err2);
//             });
//         } else {
//             if (!doNotSaveRollback){
//                 rollback.save({rollback_key: rollback_key, user: _t.user, name: _t.name, name_ru: _t.name_ru || _t.name, method: 'importFromExcel', params: obj});
//             }
//             cb(null, new UserOk('Ок', {errors: errors, new_organisms: new_organisms, rollback_key: rollback_key}));
//         }
//     });
// };


Model.prototype.importFromExcel_getFields = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	let id = obj.id;
	if (!id) return cb(new UserError('Project ID not passed', {obj: obj}));
	let filename = obj.filename;
	if (!filename) return cb(new UserError('Filename not passed', {obj: obj}));
	let data_class = obj.data_class;
	if (!data_class) return cb(new UserError('Class not passed', {obj: obj}));


	let fields = [];
	let fields_ids = [];
	let data = {
		columns: [],
		rows: []
	};

	function getUniqueId(id) {
		if (fields_ids.indexOf(id) > -1)
			return getUniqueId(id + 1);

		fields_ids.push(id);
		return id;
	}

	async.series({
		getFields: cb => {
			if (data_class === 'data_individual')
				return cb(null)

			let o = {
				command: 'get',
				object: 'class_fields_profile',
				params: {
					columns: ['id', 'class', 'name', 'visible'],
					param_where: {
						class: data_class
					},
					collapseData: false
				}
			}

			_t.api(o, (err, res) => {
				if (err) return cb(new MyError('Error while getting fields', {o: o, err: err}))
				if (!res.length) return cb(new MyError('Fields not found', {o: o, err: err}))
				fields = res.filter(row => row.visible).map(row => {
					fields_ids.push(row.id)

					return {
						id: row.id,
						name: row.name,
						isDynamic: false
					}
				})
				cb(null)
			})
		},
		getDynamicFields: cb => {
			if (data_class !== 'data_individual')
				return cb(null);

			let project_trait_ids = [];

			async.series({
				getProjectTraits: cb => {
				    let o = {
				        command: 'get',
				        object: 'project_trait',
				        params: {
				            param_where: {
				            	project_id: id
				            },
					        collapseData: false
				        }
				    };

					_t.api(o, (err, res) => {
						if (err) return cb(new MyError('Error while getting fields',{o : o, err : err}));
						project_trait_ids = res.map(row => row.trait_id);
						cb(null);
					});
				},
				getProfile: cb => {
					let client_objects = {
						'data_individual': 'tbl_data_individual_collection'
					};

					//Достаем профайл таблицы, чтобы получить нормальные имена динамически прикрепленных факторов и measurements.
					//Факторы и measurements крепятся к проекту, так что передаем project_id
					let o = {
						command: 'getProfile',
						object: data_class,
						client_object: client_objects[data_class],
						params: {
							collapseData: false
						}
					};

					_t.api(o, (err, res) => {
						if (err) return cb(new MyError('Error while getting profile', {o: o, err: err}));

						Object.keys(res.data).forEach(row => {
							const field = res.data[row]
							if (field.visible) {
								const field_dto = {
									id: field.id,
									name: res.data[row].name,
									isDynamic: false
								}

								if (project_trait_ids.indexOf(res.data[row].id_from_source) > -1) {
									field_dto.id = getUniqueId(res.data[row].id_from_source)
									field_dto.column_name = res.data[row].column_name
									field_dto.isDynamic = true
								}

								fields.push(field_dto)
							}
						});

						cb(null);
					});
				}
			}, cb);
		},
		readExcel: cb => {
			let A_code = 'A'.charCodeAt(0);

			let workbook = new Excel.Workbook();

			workbook.csv.readFile(filename)
				.then(() => {
					let ws = workbook._worksheets[1];

					for (let i in ws._rows) {
						let row = ws._rows[i];
						i = +i;

						if (i === 0) {
							for (let j in row._cells) {
								let cell = row._cells[j];
								let cell_value = cell ? cell._value.model.value : null;

								let fields_sorted = fuzzysort.go(cell_value, fields, {key: 'name'});

								data.columns.push({
									row_id: +i - 1,
									col_id: +j,
									title: cell_value,
									fields: fields_sorted
								});
							}
						} else {
							let row_tmp = [];

							for (let j in row._cells) {
								let cell = row._cells[j];
								let cell_value = cell ? cell._value.model.value : null;

								row_tmp.push({
									row_id: +i - 1,
									col_id: +j,
									value: cell_value
								});
							}

							data.rows.push(row_tmp);
						}
					}

					cb(null);
				});
		}
	}, (err, res) => {
		if (err) {
			cb(err);
		} else {
			cb(null, new UserOk('noToastr', {
				fields: fields,
				data: data
			}));
		}
	});
};

Model.prototype.importFromExcel_saveData = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	let rollback_key = obj.rollback_key || rollback.create();
	let doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

	let columnsToFields = obj.columnsToFields;
	if (!columnsToFields) return cb(new UserError('Columns ids not passed', {obj: obj}));
	let rows = obj.rows;
	if (!rows) return cb(new UserError('Rows not passed', {obj: obj}));
	let data_class = obj.data_class;
	if (!data_class) return cb(new UserError('Class not passed', {obj: obj}));
	let id = obj.id;
	if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}));

	let fields = [];
	let virtual_values = {};
	let parents_ids = [id];

	async.series({
		getFields: cb => {
			let o = {
				command: 'get',
				object: 'class_fields_profile',
				params: {
					columns: ['id', 'name', 'column_name', 'is_virtual', 'from_table', 'keyword', 'return_column'],
					where: [
						{
							key: 'id',
							type: 'in',
							val1: columnsToFields.filter(row => !row.isDynamic).map(row => row.id)
						}
					],
					collapseData: false
				}
			};

			_t.api(o, (err, res) => {
				if (err) return cb(new MyError('Error while getting fields',{o : o, err : err}));
				if (!res.length) return cb(new MyError('Fields not found',{o : o, err : err}));
				columnsToFields.forEach(row => {
					if (row.isDynamic) {
						fields.push(row)
					} else {
						let found = false;
						for (const field of res) {
							if (field.id === row.id) {
								fields.push(field);
								found = true;
								break;
							}
						}
						if (!found)
							fields.push(null);
					}
				});
				cb(null);
			});
		},
		getParentProjectsList: cb => {
			_t.getParentIds({id: id}, function (err, res) {
				if (err) return cb(err);
				parents_ids = parents_ids.concat(res.ids);
				cb(null, res);
			});
		},
		getVirtualValues: cb => {
			let profiles = {};

			async.eachSeries(rows, (row, cb) => {
				async.eachSeries(row, (cell, cb) => {
					let ind = row.indexOf(cell);
					let field = fields[ind];
					if (!field || !field.is_virtual && field.column_name !== 'name' || field.isDynamic)
						return cb(null);

					if (!field.is_virtual && field.column_name === 'name') {
						field.from_table = data_class;
						field.return_column = 'name';
					}

					let value = cell.value;
					if (!virtual_values[ind])
						virtual_values[ind] = {};
					if (value in virtual_values[ind]) {
						cell.value_id = virtual_values[ind][value];
						return cb(null);
					}

					async.series({
						getProfile: cb => {
							if (field.from_table in profiles) return cb(null);

							profiles[field.from_table] = false;

							let o = {
								command: 'getProfile',
								object: field.from_table,
								params: {
									collapseData: false
								}
							};

							_t.api(o, (err, res) => {
								if (err) return cb(new MyError('Error while getting profile', {o: o, err: err}));
								for (const key in res.data) {
									let field_profile = res.data[key];
									if (field_profile.column_name === 'project_id') {
										profiles[field.from_table] = true;
										break;
									}
								}
								cb(null);
							});
						},
						get: cb => {
							let return_column = field.return_column === 'full_name' ? 'name' : field.return_column;

							let o = {
						        command: 'get',
						        object: field.from_table,
						        params: {
						        	where: [],
						        	param_where: {},
						        	collapseData: false
						        }
						    };

						    o.params.param_where[return_column] = value;

							if (profiles[field.from_table])
								o.params.where.push({
									key: 'project_id',
									type: 'in',
									val1: parents_ids
								});

							_t.api(o, (err, res) => {
								if (err) return cb(new MyError('Error while getting value',{o : o, err : err}));
								if (res.length) {
									cell.value_id = res[0].id;
									return cb('found');
								}
								cb(null);
							});
						},
						add: cb => {
							if (!field.is_virtual) return cb(null);

							let return_column = field.return_column === 'full_name' ? 'name' : field.return_column;

							let o = {
								command: 'add',
								object: field.from_table,
								params: {
									rollback_key: rollback_key,
									doNotSaveRollback: true
								}
							};

							o.params[return_column] = value;

							if (profiles[field.from_table])
								o.params.project_id = id;

							_t.api(o, (err, res) => {
								if (err) return cb(new MyError('Error while adding value',{o : o, err : err}));
								cell.value_id = res.id;
								cb(null);
							});
						}
					}, (err, res) => {
						if (!err || err === 'found') {
							virtual_values[ind][value] = cell.value_id;
							cb(null);
						} else {
							cb(err, res);
						}
					});
				}, cb);
			}, cb);
		},
		add: cb => {
			async.eachSeries(rows, (row, cb) => {
				let o = {
					command: 'add_',
					object: data_class,
					params: {
						created_by_user_id: 25,
						rollback_key: rollback_key,
						doNotSaveRollback: true
					}
				};

				let hasDynamic = false;
				let o_modify = {
					command: 'modify',
					object: data_class,
					client_object: 'tbl_data_individual_collection',
					params: {
						fromClient: true,
						rollback_key: rollback_key,
						doNotSaveRollback: true
					}
				};

				let object_id;

				for (const i in fields) {
					let field = fields[i];
					let cell = row[i];

					if (!(field && cell && cell.value)) continue;

					if (field.isDynamic) {
						o_modify.params[field.column_name] = cell.value;
						hasDynamic = true;
						continue;
					}

					if (!field.is_virtual && field.from_table === data_class)
						object_id = cell.value_id;

					if ('value_id' in cell)
						o.params[field.keyword] = cell.value_id;
					else
						o.params[field.column_name] = cell.value;
				}

				if (object_id) {
					o.command = 'modify';
					o.params.id = object_id;
				}

				_t.api(o, (err, res) => {
					if (err) return cb(new MyError('Error while adding', {o: o, err: err}));

					if (hasDynamic) {
						o_modify.params.id = res.id;

						_t.api(o_modify, (err, res) => {
							if (err) return cb(new MyError('Error while modifying', {o: o_modify, err: err}));
							cb(null);
						});
					} else
						cb(null);
				});
			}, cb);
		}
	}, (err, res) => {
		if (err) {
			if (doNotSaveRollback) return cb(err);
			rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
				return cb(err, err2);
			});
		} else {
			if (!doNotSaveRollback){
				rollback.save({rollback_key: rollback_key, user: _t.user, name: _t.name, name_ru: _t.name_ru || _t.name, method: 'importFromExcel', params: obj});
			}

			cb(null, new UserOk('Ок', {
				fields: fields
			}));
		}
	});
};

Model.prototype.importFromExcel_checkData = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	let rollback_key = obj.rollback_key || rollback.create();
	let doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

	let columns_ids = obj.columns_ids;
	if (!columns_ids || !columns_ids.length) return cb(new UserError('Columns ids not passed', {obj: obj}));
	let rows = obj.rows;
	if (!rows) return cb(new UserError('Rows not passed', {obj: obj}));
	let data_class = obj.data_class;
	if (!data_class) return cb(new UserError('Class not passed', {obj: obj}));
	let id = obj.id;
	if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}));

	let fields = [];
	let virtual_values = {};
	let virtual_values_not_found = {};
	let parents_ids = [id];

	async.series({
		getFields: cb => {
			let o = {
				command: 'get',
				object: 'class_fields_profile',
				params: {
					columns: ['id', 'name', 'column_name', 'is_virtual', 'from_table', 'keyword', 'return_column'],
					where: [
						{
							key: 'id',
							type: 'in',
							val1: columns_ids
						}
					],
					collapseData: false
				}
			};

			_t.api(o, (err, res) => {
				if (err) return cb(new MyError('Error while getting fields', {o: o, err: err}));
				if (!res.length) return cb(new MyError('Fields not found', {o: o, err: err}));
				columns_ids.forEach(id => {
					if (!id) {
						fields.push(null);
						return false;
					}

					for (const field of res) {
						if (field.id === id) {
							fields.push(field);
							break;
						}
					}
				});
				cb(null);
			});
		},
		getParentProjectsList: cb => {
			_t.getParentIds({id: id}, function (err, res) {
				if (err) return cb(err);
				parents_ids = parents_ids.concat(res.ids);
				cb(null, res);
			});
		},
		getVirtualValues: cb => {
			let profiles = {};

			async.eachSeries(rows, (row, cb) => {
				async.eachSeries(row, (cell, cb) => {
					cell._status = null;
					cell._status_sysname = null;

					let ind = row.indexOf(cell);
					let field = fields[ind];
					if (!field || !field.is_virtual && field.column_name !== 'name')
						return cb(null);

					if (!field.is_virtual && field.column_name === 'name') {
						field.from_table = data_class;
						field.return_column = 'name';
					}

					let value = cell.value;
					if (!virtual_values[ind])
						virtual_values[ind] = [];
					if (!virtual_values_not_found[ind])
						virtual_values_not_found[ind] = [];

					async.series({
						filter: cb => {
							if (virtual_values[ind].indexOf(value) > -1)
								return cb('found');
							if (virtual_values_not_found[ind].indexOf(value) > -1)
								return cb('not_found');

							cb(null);
						},
						getProfile: cb => {
							if (field.from_table in profiles) return cb(null);

							profiles[field.from_table] = false;

							let o = {
								command: 'getProfile',
								object: field.from_table,
								params: {
									collapseData: false
								}
							};

							_t.api(o, (err, res) => {
								if (err) return cb(new MyError('Error while getting profile', {o: o, err: err}));
								for (const key in res.data) {
									let field_profile = res.data[key];
									if (field_profile.column_name === 'project_id') {
										profiles[field.from_table] = true;
										break;
									}
								}
								cb(null);
							});
						},
						get: cb => {
							let return_column = field.return_column === 'full_name' ? 'name' : field.return_column;

							let o = {
								command: 'get',
								object: field.from_table,
								params: {
									where: [],
									param_where: {},
									collapseData: false
								}
							};

							o.params.param_where[return_column] = value;

							if (profiles[field.from_table])
								o.params.where.push({
									key: 'project_id',
									type: 'in',
									val1: parents_ids
								});

							_t.api(o, (err, res) => {
								if (err) return cb(new MyError('Error while getting value',{o : o, err : err}));
								cb(res.length ? 'found' : 'not_found');
							});
						}
					}, (err, res) => {
						if (!err || err === 'found' || err === 'not_found') {
							if (err === 'found') {
								if (!field.is_virtual && field.from_table === data_class) {
									cell._status = 'Found';
									cell._status_sysname = 'FOUND';
								}

								if (virtual_values[ind].indexOf(value) === -1)
									virtual_values[ind].push(value);
							}

							if (err === 'not_found') {
								if (field.is_virtual || field.from_table !== data_class) {
									cell._status = 'Not found';
									cell._status_sysname = 'NOT_FOUND';
								}

								if (virtual_values_not_found[ind].indexOf(value) === -1)
									virtual_values_not_found[ind].push(value);
							}

							cb(null);
						} else {
							cb(err, res);
						}
					});
				}, cb);
			}, cb);
		}
	}, (err, res) => {
		if (err) {
			if (doNotSaveRollback) return cb(err);
			rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
				return cb(err, err2);
			});
		} else {
			if (!doNotSaveRollback){
				rollback.save({rollback_key: rollback_key, user: _t.user, name: _t.name, name_ru: _t.name_ru || _t.name, method: 'importFromExcel', params: obj});
			}

			cb(null, new UserOk('noToastr', {
				rows: rows
			}));
		}
	});
};


Model.prototype.export_to_excel = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

	var name = (((_t.class_profile.name_ru) ? _t.class_profile.name_ru.substr(0, 20) : _t.class_profile.name.substr(0, 20)) || 'file') + '_' + moment().format('DDMMYYYY_HHmm') + '.xlsx';
    var offset = (!isNaN(+obj.start_no))? obj.start_no - 1 : 0;

    var taxons;
    var class_fields_profile = funcs.cloneObj(_t.class_fields_profile);
    var taxon_ids = [];
    var id_key_index;
    async.series({
        getData:function(cb){
            var params = {
                where:obj.where,
                sort:obj.sort,
                offset:offset,
                limit:obj.limit,
                use_cache:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить данные',{params : params, err : err}));
                taxons = res;
                id_key_index = taxons.data_columns.indexOf('id');
                for (const i in taxons.data) {
                    taxon_ids.push(taxons.data[i][id_key_index]);
                }
                // data_columns = res.data_columns;
                // extra_data = res.extra_data;
                // data = funcs.jsonToObj(res);

                cb(null);
            });
        },
        getTrairs:function(cb){
            async.eachSeries(taxon_ids, function(taxon_id, cb){
                var params = {
                    doNotGetPictures:true,
                    id:taxon_id
                };
                _t.getAllTraits(params, function(err, res){
                    if (err) return cb(new MyError('Не удалось getAllTraits',{err:err, params:params}));
                    var alias,alias2;
                    var data_columns_pos, data_columns_pos2;

                    var pushFunc = (one_trait) => {
                        alias = one_trait.name + '__' + funcs.hashCode(one_trait.name);
                        alias2 = alias + '_isInherit';
                        if (!class_fields_profile[alias]) {
                            class_fields_profile[alias] = {
                                visible: true,
                                name: one_trait.name
                            }
                            class_fields_profile[alias2] = {
                                visible: true,
                                name: 'Inherited'
                            }
                        }

                        for (const i in taxons.data) {
                            if (taxons.data[i][id_key_index] === taxon_id){
                                if (taxons.data_columns.indexOf(alias) === -1){
                                    taxons.data_columns.push(alias);
                                    taxons.data_columns.push(alias2);
                                }
                                data_columns_pos = taxons.data_columns.indexOf(alias);
                                data_columns_pos2 = taxons.data_columns.indexOf(alias2);
                                taxons.data[i][data_columns_pos] = one_trait.value1 || '';
                                // taxons.data[i][data_columns_pos2] = (one_trait.value1)? one_trait.inherit : null;
                                taxons.data[i][data_columns_pos2] = !!one_trait.isParent;
                                break;
                            }
                        }
                    }

                    for (const c in res.characters) {
                        let one_trait = res.characters[c];
                        pushFunc(one_trait);
                        // alias = one_trait.name + '__' + funcs.hashCode(one_trait.name);
                        // alias2 = alias + '_isInherit';
                        // if (!class_fields_profile[alias]) {
                        //     class_fields_profile[alias] = {
                        //         visible: true,
                        //         name: one_trait.name
                        //     }
                        //     class_fields_profile[alias2] = {
                        //         visible: true,
                        //         name: 'Inh'
                        //     }
                        // }
                        //
                        // for (const i in taxons.data) {
                        //     if (taxons.data[i][id_key_index] === taxon_id){
                        //         if (taxons.data_columns.indexOf(alias) === -1){
                        //             taxons.data_columns.push(alias);
                        //             taxons.data_columns.push(alias2);
                        //         }
                        //         data_columns_pos = taxons.data_columns.indexOf(alias);
                        //         data_columns_pos2 = taxons.data_columns.indexOf(alias2);
                        //         taxons.data[i][data_columns_pos] = one_trait.value1 || '';
                        //         taxons.data[i][data_columns_pos2] = one_trait.inherit;
                        //         break;
                        //     }
                        // }
                    }
                    for (const t in res.traits) {
                        let one_trait = res.traits[t];
                        pushFunc(one_trait);
                        // alias = one_trait.name + '__' + funcs.hashCode(one_trait.name);
                        // alias2 = alias + '_isInherit';
                        // if (!class_fields_profile[alias]) {
                        //     class_fields_profile[alias] = {
                        //         visible: true,
                        //         name: one_trait.name
                        //     }
                        //     class_fields_profile[alias2] = {
                        //         visible: true,
                        //         name: 'Inh'
                        //     }
                        // }
                        //
                        // for (const i in taxons.data) {
                        //     if (taxons.data[i][id_key_index] === taxon_id){
                        //         if (taxons.data_columns.indexOf(alias) === -1){
                        //             taxons.data_columns.push(alias);
                        //             data_columns_pos = Object.keys(taxons.data[i]).length;
                        //         }else{
                        //             data_columns_pos = taxons.data_columns.indexOf(alias);
                        //         }
                        //         taxons.data[i][data_columns_pos] = one_trait.value1 || '';
                        //         break;
                        //     }
                        // }
                    }
                    cb(null);
                })
            }, cb);
        },
        toExcel:function(cb){
            obj.data = taxons;
            obj.class_fields_profile = class_fields_profile;
            _t.export_to_excelPrototype(obj, function(err, res){
                if (err) return cb(new MyError('Во время вызова export_to_excelPrototype произошла ошибка',{err:err, obj:obj}));
                return cb(null, res);
            })
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, res.toExcel);
    });
};


/**
 * Метод возвращает storages этого проекта
 * @param obj
 * @param cb
 * @returns storages:[]
 */
Model.prototype.getStorages = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var storage;
    async.series({
        getMember:function(cb){
            var o = {
                command:'get',
                object:'storage',
                params:{
                    param_where:{
                        project_id:id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить storage',{o : o, err : err}));
                storage = res;
                cb(null);
            });
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{storage:storage}));
    });
};

/**
 * Метод возвращает storage родительских проектов
 * @param obj
 * @param cb
 * @returns storage:[]
 */
Model.prototype.getParentStorages = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var parent_ids;
    var parent_storage = [];
    async.series({
        getParentIds:function(cb){
            _t.getParentIds({id:id}, function(err, res){
                if (err) return cb(err);
                parent_ids = res.ids;
                cb(null, res);
            })
        },
        getStorage:function(cb){
            if (!parent_ids.length) return cb(null);
            var o = {
                command:'get',
                object:'storage',
                params:{
                    where:[
                        {
                            key:'project_id',
                            type:'in',
                            val1:parent_ids
                        }
                    ],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить storage',{o : o, err : err}));
                parent_storage = res;
                cb(null);
            });
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{storage:parent_storage}));
    });
};

/**
 * Метод возвращает storages этого проекта и storages его родительских проектов
 * @param obj
 * @param cb
 * @returns storage:[],parent_storage:[]
 */
Model.prototype.getAllStorages = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var storage, parent_storage;
    async.series({
        getStorage:function(cb){
            _t.getStorages(obj, function(err, res){
                if (err) return cb(err);
                storage = res.storage;
                cb(null);
            });
        },
        getParentStorage:function(cb){
            _t.getParentStorages(obj, function(err, res){
                if (err) return cb(err);
                parent_storage = res.storage;
                cb(null);
            });
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{storage:storage,parent_storage:parent_storage}));
    });
};

Model.prototype.getProjectWithChilds = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.where.find(elem => elem.key == 'id').val1;
    var name = obj.where.find(elem => elem.key == 'name');

    var projectIds = [id];

    async.series({
        getChildIds: function(cb){
            _t.getChildIds({ id: id }, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить child проекты.',{ id: id, err: err}));
                projectIds = projectIds.concat(res.ids);
                cb(null);
            });
        },
        getChilds: function(cb){
            var params = {
                where: [
                    {
                        key: 'id',
                        type: 'in',
                        val1: projectIds
                    }
                ],
                collapseData: false
            };

            if (name) params.where.push(name);

            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить детей проекта',{params : params, err : err}));
                cb(null, res);
            });
        }
    }, function (err, res) {
        if (err) return cb(err);

        cb(null, res.getChilds);
    })

};

Model.prototype.getSequences = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	if (!obj.id) return cb(new MyError('Не передан id', {obj: obj}));

	let ids = [obj.id];
	let organisms_ids = [];
	let sequences_ids = [];

	async.series({
		getChildIds: cb => {
			let o = {
				id: obj.id
			}
			_t.getChildIds(o, (err, res) => {
				if (err) return cb(new MyError('Error while getting children', {obj: o, err: err}));
				ids = ids.concat(res.ids);
				cb(null)
			})
		},
		getOrganisms: cb => {
			let o = {
				command: 'get',
				object: 'data_individual',
				params: {
					columns: ['id', 'project_id'],
					where: [{
						key: 'project_id',
						type: 'in',
						val1: ids
					}],
					collapseData: false
				}
			}
			_t.api(o, (err, res) => {
				if (err) return cb(new MyError('Error while getting organisms', {obj: o, err: err}));
				organisms_ids = res.map(row => row.id);
				cb(null)
			})
		},
		getIdFirstSequence: cb => {
			if (!organisms_ids.length) return cb(null);

			let o = {
				command: 'get',
				object: 'sequence',
				params: {
					where: [{
						key: 'data_individual_id',
						type: 'in',
						val1: organisms_ids
					}],
					collapseData: false
				}
			}
			_t.api(o, (err, res) => {
				if (err) return cb(new MyError('Error while getting organisms', {obj: o, err: err}));
				sequences_ids = res.map(row => row.id);
				cb(null)
			})
		}
	}, (err, res) => {
		if (err) return cb(err)
		cb(null, new UserOk('noToastr', {sequences_ids: sequences_ids}))
	})
};

/** Метод собирает цепочку родителей проекта*/
Model.prototype.getParentProjectsList = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	var _t = this;
	var id = obj.id;
	if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}));

	var parent_ids;

	async.series({
		getProjectIds: function (cb) {
			_t.getParentIds({id: id}, function (err, res) {
				if (err) return cb(err);
				parent_ids = res.ids;
				cb(null, res);
			})
		}
	}, function (err, res) {
		if (err) return cb(err);
		cb(null, new UserOk('noToastr', {parent_ids}));
	});
};



// _t.getParentIds({id:id}, function(err, res){


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
