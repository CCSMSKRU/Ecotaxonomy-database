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
var fs = require('fs');
var toFile = require('../modules/saveToFile').toFile;
var msAccess = require('../libs/msAccessConnect');

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

Model.prototype.add_ = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var taxon_id = obj.taxon_id;
    if (isNaN(+taxon_id)) return cb(new MyError('Не передан taxon_id',{obj:obj}));

    var type_sysname = obj.type_sysname;
    if (!type_sysname && !obj.type_id) return cb(new MyError('Не передан тип (type_sysname)', {obj:obj}));

    if (!obj.name) return cb(new UserError('Measurement name is not defined'));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    // Если тип = select, то необходимо сформировать уникальный альяс, создать таблицу в базе синхронизировать класс, записать в sub_table_name альяс


    obj.rollback_key = rollback_key;

    var getUniqueAlias = function(obj, cb){
        if (typeof obj === 'string') {
            obj = {
                alias:obj
            };
        }
        var alias = obj.alias;
        var alias_orig = obj.alias_orig || alias;
        var params = {
            param_where:{
                sub_table_name_for_select:alias
            }
        };
        _t.getCount(params, function (err, res) {
            if (err) return cb(new MyError('Не удалось получить количество свойств с sub_table_name = ' + alias,{params : params, err : err}));
            if (!res.count) return cb(null, alias);
            var o = {
                alias:alias_orig + funcs.guidShort(),
                alias_orig:alias_orig
            };
            getUniqueAlias(o, cb);
        });
    };

    var name_cut = obj.name.replace(/\W/ig,'_').substr(0,21).toLowerCase();
    var alias = 'measurement_sub_table_select_' + name_cut;
    var measurement_type;


    async.series({
        getTraitTypeSysname:function(cb){
            if (type_sysname) return cb(null); // Уже передан
            var o = {
                command:'getById',
                object:'measurement_type',
                params:{
                    id:obj.type_id,
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить measurement_type',{o : o, err : err}));
                measurement_type = res[0];
                type_sysname = measurement_type.sysname;
                cb(null);
            });

        },
        ifSelectCreateStructure:function(cb){
            if (type_sysname !== 'SELECT') return cb(null);

            var another_tables_name = 'another_tables';


            async.series({
                createAlias:function(cb){
                    getUniqueAlias(alias, function(err, res){
                        if (err) return cb(err);
                        alias = res.toLowerCase();
                        obj.sub_table_name_for_select = alias;
                        cb(null);
                    });
                },
                checkExist:function(cb){
                    async.series({
                        checkTrait:function(cb){
                            var params = {
                                param_where:{
                                    name:obj.name,
                                    taxon_id:taxon_id
                                }
                            };
                            _t.getCount(params, function (err, res) {
                                if (err) return cb(new MyError('Не удалось проверить уникальность параметра',{params : params, err : err}));
                                if (res.count) return cb(new UserError('Measurement with this name already exist for this taxon.',{params:params}));
                                cb(null);
                            });
                        },
                        checkClass:function(cb){
                            var o = {
                                command:'getCount',
                                object:'class_profile',
                                params:{
                                    param_where:{
                                        name:alias
                                    }
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось посчитать записи в class_profile',{o : o, err : err}));
                                if (res.count) return cb(new UserError('Class with name ' + alias + ' already exist.',{o:o, res:res}));
                                cb(null);
                            });

                        }
                    }, cb);

                },

                createTable:function(cb){
                    var json = {};
                    json[alias] = {
                        profile:{
                            name:alias,
                            name_ru:alias,
                            ending:'',
                            server_parent_table:'measurement',
                            server_parent_key:'measurement_id'
                        },
                        structure:{
                            id : { type: "bigint", length: "20", notNull: true, autoInc: true, primary_key: true, "quick_search_field":true},
                            measurement_id: { type: "bigint", length: "20", "quick_search_field":true},
                            data_individual_id : {type: "bigint", length: "20", from_table: "measurement_value", keyword: "measurement_id", return_column: "data_individual_id", is_virtual: true, visible: false, "quick_search_field":true},
                            name : {type: "varchar", length:"255", "quick_search_field":true},
                            definition : {type: "text", "quick_search_field":true},
                            definition_de : {type: "text", "quick_search_field":true},
                            definition_bahasa : {type: "text", "quick_search_field":true},
                            value2 : {type: "varchar", length:"255"},
                            msaccess_value_id : {type: "varchar", length:"255", "quick_search_field":true},
                            sysname : {type: "varchar", length: "255"}
                        }
                    };

                    async.series({
                        addToJSONFile:function(cb){
                            var filePath = './models/system/' + another_tables_name + '/measurement_sub_table_select.json';
                            var tables;
                            async.series({
                                readFile:function(cb){
                                    fs.open(filePath, 'r', function(err, fd){
                                        if (err) {
                                            if (err.code === 'ENOENT') {
                                                return cb(null);
                                            }

                                            return cb(new MyError('не удалось считать файл json',{filePath:filePath}));
                                        }
                                        fs.readFile(fd, function(err, data){
                                            if (err) return cb(new MyError('Не удалось считать структуры таблиц из файла.', {err:err, file:filePath}));
                                            var tablesJSON = data.toString();
                                            try {
                                                tables = JSON.parse(tablesJSON);
                                            } catch (e) {
                                                return cb(new MyError('Информация по таблцам имеет не верный формат.', {err:err}));
                                            }
                                            return cb(null);

                                        })
                                    })
                                },
                                addToFile:function(cb){
                                    tables = tables || {};
                                    for (var i in json) {
                                        tables[i] = json[i];
                                    }
                                    var obj = {fileName: filePath, data: JSON.stringify(tables), error: true, flags:'w'};
                                    toFile(obj, function(err, res){
                                        if (err) return cb(new MyError('не удалось записать данные в json файл',{err:err, obj:obj}));
                                        cb(null);
                                    });
                                }
                            }, cb);
                        },
                        createClassRow:function(cb){
                            var o = {
                                command:'add',
                                object:'Class_profile',
                                params:{
                                    name:alias,
                                    rollback_key:rollback_key
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось создать Class_profile для ' + alias,{o : o, err : err}));
                                cb(null);
                            });

                        },
                        syncWithTableJson:function(cb){
                            var o = {
                                command:'syncWithTableJson',
                                object:'Table',
                                params:{
                                    name:alias
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось создать таблицу в базе',{o : o, err : err}));
                                cb(null);
                            });
                        }
                    }, cb);
                },
                addToMenu:function(cb){
                    // return cb(null);
                    var menu;
                    var item_exist = false;
                    async.series({
                        getMenuID: function (cb) {
                            if (item_exist) return cb(null);
                            var o = {
                                command:'get',
                                object:'menu',
                                params:{
                                    param_where:{
                                        menu_item:'measurement_selects'
                                    },
                                    fromClient:false,
                                    collapseData:false
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err){
                                    console.log('Не удалось создать пункт меню. Ошибка при получении menu menu_item=measurement_selects',err);
                                    return cb(null);
                                }
                                if (!res.length){
                                    console.log('Не удалось создать пункт меню. В системе не заведено родительское меню menu_item=measurement_selects');
                                    return cb(null);
                                }
                                menu = res[0];
                                return cb(null);
                            });
                        },
                        addElement: function (cb) {
                            if (item_exist) return cb(null);
                            if (!menu) return cb(null);
                            var o = {
                                command:'add',
                                object:'menu',
                                params:{
                                    class_id:_t.class_id,
                                    menu_item:'measurement_' + alias,
                                    name:obj.name,
                                    class_name:alias,
                                    parent_id:menu.id,
                                    menu_type:'item',
                                    is_visible:true
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) {
                                    console.log('Не удалось создать пункт меню. Ошибка при добавлении.',err);
                                    return cb(null);
                                }
                                cb(null);
                            })
                        }
                    },cb);
                }
            }, cb);
        },
        add:function(cb){
            _t.addPrototype(obj, cb);
        }
    },function (err, res) {
        if (err) {
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'add_', params:obj});
            }
            res.add.alias = alias;
            cb(null, new UserOk('Ок', res.add));
        }
    });
};

Model.prototype.getSelect = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var measurement;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить measurement.',{id:id,err:err}));
                measurement = res[0];
                if (measurement.type_sysname !== 'SELECT') return cb(new MyError('Метод доступен только для селектов'));
                cb(null);
            });
        },
        getValues:function(cb){
            var o = {
                command:'get',
                object:measurement.sub_table_name_for_select,
                params:{
                    // param_where:{
                    //     measurement_id:measurement.id
                    // },
                    collapseData:obj.collapseData,
                    limit:obj.limit,
                    page_no:obj.page_no
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось значения для селекта',{o : o, err : err}));

                cb(null, res);
            });

        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('Ок', res.getValues));
    });
};

Model.prototype.getTreeChilds = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	var _t = this;
	var taxon_id = +obj.taxon_id;

	var taxon_avalible_trait;
	var taxon_ids = [];
	var tree;
	async.series({
		// get:function(cb){
		//     _t.getById({id:id}, function (err, res) {
		//         if (err) return cb(new MyError('Не удалось получить taxon_avalible_trait.',{id:id,err:err}));
		//         taxon_avalible_trait = res[0];
		//         cb(null);
		//     });
		// },
		getTraits:function(cb){
			var o = {
				command:'get',
				object:'taxon_avalible_trait',
				params:{
					collapseData:false,
					limit:100000000
				}
			};
			_t.api(o, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить taxon_avalible_trait все',{o : o, err : err}));
				for (var i in res) {
					if (!res[i].taxon_id) continue;
					if (taxon_ids.indexOf(res[i].taxon_id) === -1) taxon_ids.push(res[i].taxon_id);
				}
				cb(null);
			});


		},
		getTreeChild:function(cb){
			if (!taxon_ids) return cb(new UserError('No traits linked to taxon'));
			// taxon_ids = [406760];
			var o = {
				command:'getTreeChilds',
				object:'taxon',
				params:{
					id:taxon_id,
					only_ids:taxon_ids

				}
			};
			_t.api(o, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить таксоны',{o : o, err : err}));
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
    var id = obj.id;

    var measurement;
    var taxon_ids = [];
    var tree;

    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить measurement.',{id:id,err:err}));
                measurement = res[0];
                cb(null);
            });
        },
        getTraits:function(cb){
            var o = {
                command:'get',
                object:'measurement',
                params:{
                    collapseData:false,
                    limit:100000000
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить measurement все',{o : o, err : err}));
                for (var i in res) {
                    if (!res[i].taxon_id) continue;
                    if (taxon_ids.indexOf(res[i].taxon_id) === -1) taxon_ids.push(res[i].taxon_id);
                }
                cb(null);
            });


        },
        getTree:function(cb){
            if (!taxon_ids) return cb(new UserError('No traits linked to taxon'));
            // taxon_ids = [406760];
            var o = {
                command:'getTree',
                object:'taxon',
                params:{
                    id:measurement.taxon_id,
                    only_ids:taxon_ids

                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить таксоны',{o : o, err : err}));
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
				if (err) return cb(new MyError('Не удалось получить трейт.', {id: id, err: err}));
				trait = res[0];
				cb(null);
			});
		},
		getPictures: function (cb) {
			var o = {
				command: 'get',
				object: 'measurement_picture',
				params: {
					where: [
						{
							key: 'measurement_id',
							val1: trait.id
						}
					],
					collapseData: false
				}
			};
			_t.api(o, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить measurement_pictures', {o: o, err: err}));
				pictures = res;
				cb(null);
			});
		}
	}, function (err, res) {
		if (err) return cb(err);
		cb(null, new UserOk('noToastr', {pictures: pictures}));
	});
};

/*Measurements are deprecated*/
// Model.prototype.getTaxaWithMeas = function (obj, cb) {
//     if (arguments.length == 1) {
//         cb = arguments[0];
//         obj = {};
//     }
//     var _t = this;
//
//     var taxons = [];
//     async.series({
//         getMeas: function (cb) {
//             var o = {
//                 command: 'get',
//                 object: 'measurement',
//                 params: {
//                     columns: ['taxon', 'taxon_id'],
//                     groupBy: ['taxon_id'],
//                     collapseData: false,
//                     limit: 100000000
//                 }
//             };
//
//             _t.api(o, function (err, res) {
//                 if (err) return cb(new MyError('Error while getting measurements', {o: o, err: err}));
//                 for (var i in res) {
//                     if (!res[i].taxon_id) continue;
//                     taxons.push({
//                         id: res[i].taxon_id,
//                         name: res[i].taxon
//                     });
//                 }
//                 cb(null);
//             });
//         }
//     }, function (err, res) {
//         if (err) return cb(err);
//         cb(null, taxons);
//     });
// };

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