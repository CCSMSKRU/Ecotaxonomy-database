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

var config = require('../config');

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
Model.prototype.removePrototype = Model.prototype.remove;
Model.prototype.export_to_excelPrototype = Model.prototype.export_to_excel;
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

Model.prototype.get_ = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    if (!obj.taxon_id){
        _t.getPrototype(obj, cb);
        return;
    }

    var exclude_trait_ids = [];
    async.series({
        getwithVal:function(cb){
            var o = {
                command:'get',
                object:'taxon_trait_value',
                params:{
                    param_where:{
                        taxon_id:+obj.taxon_id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon_trait_value',{o : o, err : err}));
                for (var i in res) {
                    if (exclude_trait_ids.indexOf(res[i].taxon_avalible_trait_id) === -1) exclude_trait_ids.push(res[i].taxon_avalible_trait_id);
                }
                cb(null);
            });
        },
        getProto:function(cb){

            if (exclude_trait_ids.length){
                if (!obj.where) obj.where = [];
                obj.where.push(
                    {
                        key:'id',
                        type:'!in',
                        val1:exclude_trait_ids
                    }
                );
            }
            _t.getPrototype(obj, function(err, res){
                if (err) return cb(err);
                cb(null, res);
            })
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, res.getProto);
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
    var taxon_id = +obj.taxon_id;
    if (isNaN(+taxon_id)) return cb(new UserError('Не передан taxon_id',{obj:obj}));

    var trait_type_sysname = obj.trait_type_sysname;
    if (!trait_type_sysname && !obj.trait_type_id) return cb(new UserError('Please, select trait type', {obj:obj}));

    if (!obj.name) return cb(new UserError('Trait name is not defined'));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    // Если тип = select, то необходимо сформировать уникальный альяс, создать таблицу в базе синхронизировать класс, записать в sub_table_name альяс


    obj.rollback_key = rollback_key;

    /*Проверяет по существующим трейтам*/
    // var getUniqueAlias = function(obj, cb){
    // if (typeof obj === 'string') {
    // 	obj = {
    // 		alias:obj
    // 	};
    // }
    // var alias = obj.alias;
    // var alias_orig = obj.alias_orig || alias;
    // var params = {
    // 	param_where:{
    // 		sub_table_name_for_select:alias
    // 	}
    // };
    // _t.getCount(params, function (err, res) {
    // 	if (err) return cb(new MyError('Не удалось получить количество свойств с sub_table_name = ' + alias,{params : params, err : err}));
    // 	if (!res.count) return cb(null, alias);
    // 	var o = {
    // 		alias:alias_orig + funcs.guidShort(),
    // 		alias_orig:alias_orig
    // 	};
    // 	getUniqueAlias(o, cb);
    // });
    // };
    /*Проверяет по существующим классам*/
    let getUniqueAlias = function(obj, cb) {
        if (typeof obj === 'string') {
            obj = {
                alias: obj
            };
        }
        let alias = obj.alias;
        let alias_orig = obj.alias_orig || alias;
        let o = {
            command: 'getCount',
            object: 'class_profile',
            params: {
                param_where: {
                    name: alias
                }
            }
        };

        _t.api(o, function (err, res) {
            if (err) return cb(new MyError('Не удалось получить количество свойств с sub_table_name = ' + alias, { o: o, err: err }));
            if (!res.count) return cb(null, alias);
            let o = {
                alias: alias_orig + funcs.guidShort(),
                alias_orig: alias_orig
            };
            getUniqueAlias(o, cb);
        });
    };

    var name_cut = obj.name.replace(/\W/ig,'_').substr(0,21).toLowerCase();
    var alias = 'trait_sub_table_select_' + name_cut;
    var trait_type;


    async.series({
        checkName: cb => {
            let params = {
                param_where: {
                    name: obj.name
                }
            };

            _t.get(params, (err, res) => {
                if (err) return cb(new MyError('Error while checking name',{params : params, err : err}));
                if (res.extra_data.count > 0) return cb(new UserError('A trait with that name already exists.',{params : params, err : err}));
                cb(null);
            });
        },
        getTraitTypeSysname:function(cb){
            if (trait_type_sysname) return cb(null); // Уже передан
            var o = {
                command:'getById',
                object:'trait_type',
                params:{
                    id: obj.trait_type_id
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить trait_type',{o : o, err : err}));
                trait_type = res[0];
                trait_type_sysname = trait_type.sysname;
                cb(null);
            });

        },
        ifSelectCreateStructure:function(cb){
            if (trait_type_sysname !== 'SELECT') return cb(null);

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
                                if (res.count) return cb(new UserError('Trait with this name already exist for this taxon.',{params:params}));
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
                            server_parent_table:'taxon_avalible_trait',
                            server_parent_key:'taxon_avalible_trait_id'
                        },
                        structure:{
                            id : { type: "bigint", length: "20", notNull: true, autoInc: true, primary_key: true, "quick_search_field":true},
                            taxon_avalible_trait_id: { type: "bigint", length: "20", "quick_search_field":true},
                            taxon_id : {type: "bigint", length: "20", from_table: "taxon_trait_value", keyword: "taxon_avalible_trait_id", return_column: "taxon_id", is_virtual: true, visible: false, "quick_search_field":true},
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
                            var filePath = './models/system/' + another_tables_name + '/taxon_trait_sub_table_select.json';
                            var tables;
                            async.series({
                                readFile:function(cb){
                                    fs.open(filePath, 'r', function(err, fd){
                                        if (err) {
                                            if (err.code === 'ENOENT') {
                                                return cb(null);
                                            }

                                            return cb(new MyError('не удалось считать файл json',{filePath:filePath})); // could not read json file
                                        }
                                        fs.readFile(fd, function(err, data){
                                            if (err) return cb(new MyError('Не удалось считать структуры таблиц из файла.', {err:err, file:filePath})); // Failed to read table structures from file
                                            var tablesJSON = data.toString();
                                            try {
                                                tables = JSON.parse(tablesJSON);
                                            } catch (e) {
                                                return cb(new MyError('Информация по таблицам имеет неверный формат.', {err:err})); // Information on the tables has an incorrect format
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
                                        menu_item:'selects'
                                    },
                                    fromClient:false,
                                    collapseData:false
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err){
                                    console.log('Не удалось создать пункт меню. Ошибка при получении menu menu_item=selects',err);
                                    return cb(null);
                                }
                                if (!res.length){
                                    console.log('Не удалось создать пункт меню. В системе не заведено родительское меню menu_item=selects');
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
                                    menu_item:'trait_directories_' + alias,
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
            // if (!doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'add_', params:obj});
            // }
            res.add.alias = alias;
            cb(null, new UserOk('Ок', res.add));
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
    var _t = this;

    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;
    obj.rollback_key = rollback_key;

    let trait;

    let getUniqueAlias = function (obj, cb) {
        if (typeof obj === 'string') {
            obj = {
                alias: obj
            };
        }
        var alias = obj.alias;
        var alias_orig = obj.alias_orig || alias;
        var params = {
            param_where: {
                sub_table_name_for_select: alias
            }
        };
        _t.getCount(params, function (err, res) {
            if (err) return cb(new MyError('Не удалось получить количество свойств с sub_table_name = ' + alias, {
                params: params,
                err: err
            }));
            if (!res.count) return cb(null, alias);
            var o = {
                alias: alias_orig + funcs.guidShort(),
                alias_orig: alias_orig
            };
            getUniqueAlias(o, cb);
        });
    };

    let name_cut;
    let alias;

    async.series({
        getTrait: cb => {
            let params = {
                param_where: {
                    id: obj.id
                },
                columns: ['id', 'name', 'taxon_id', 'sub_table_name_for_select', 'max_value', 'min_value'],
                collapseData: false
            };

            _t.get(params, (err, res) => {
                if (err) return cb(new MyError('Не удалось получить trait', {params: params, err: err}));
                if (!res.length) return cb(new MyError('Не удалось получить trait с таким ID', {o: o, err: err}));

                trait = res[0];

                cb(null);
            })
        },
        checkTrait: function (cb) {
            if (!('name' in obj) || obj.name === trait.name) return cb(null);

            let params = {
                param_where: {
                    name: obj.name,
                    taxon_id: trait.taxon_id
                }
            };
            _t.getCount(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось проверить уникальность параметра', {
                    params: params,
                    err: err
                }));
                if (res.count) return cb(new UserError('Trait with this name already exist for this taxon.', {params: params}));
                cb(null);
            });
        },
        getTraitTypeSysname: cb => {
            if (!obj.trait_type_id) return cb(null);

            let o = {
                command: 'get',
                object: 'trait_type',
                params: {
                    param_where: {
                        id: obj.trait_type_id
                    },
                    columns: ['sysname'],
                    collapseData: false
                }
            };

            _t.api(o, (err, res) => {
                if (err) return cb(new MyError('Не удалось получить trait', {o: o, err: err}));

                obj.trait_type_sysname = res[0].sysname;

                cb(null);
            });
        },
        ifSelectCreateStructure: function (cb) {
            if (!(obj.trait_type_sysname === 'SELECT' && !trait.sub_table_name_for_select)) return cb(null);

            let another_tables_name = 'another_tables';

            name_cut = trait.name.replace(/\W/ig, '_').substr(0, 21).toLowerCase();
            alias = 'trait_sub_table_select_' + name_cut;

            async.series({
                createAlias: function (cb) {
                    getUniqueAlias(alias, function (err, res) {
                        if (err) return cb(err);
                        alias = res.toLowerCase();
                        obj.sub_table_name_for_select = alias;
                        cb(null);
                    });
                },
                checkExist: function (cb) {
                    var o = {
                        command: 'getCount',
                        object: 'class_profile',
                        params: {
                            param_where: {
                                name: alias
                            }
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось посчитать записи в class_profile', {
                            o: o,
                            err: err
                        }));
                        if (res.count) return cb(new UserError('Class with name ' + alias + ' already exist.', {
                            o: o,
                            res: res
                        }));
                        cb(null);
                    });
                },

                createTable: function (cb) {
                    var json = {};
                    json[alias] = {
                        profile: {
                            name: alias,
                            name_ru: alias,
                            ending: '',
                            server_parent_table: 'taxon_avalible_trait',
                            server_parent_key: 'taxon_avalible_trait_id'
                        },
                        structure: {
                            id: {
                                type: "bigint",
                                length: "20",
                                notNull: true,
                                autoInc: true,
                                primary_key: true,
                                "quick_search_field": true
                            },
                            taxon_avalible_trait_id: {type: "bigint", length: "20", "quick_search_field": true},
                            taxon_id: {
                                type: "bigint",
                                length: "20",
                                from_table: "taxon_trait_value",
                                keyword: "taxon_avalible_trait_id",
                                return_column: "taxon_id",
                                is_virtual: true,
                                visible: false,
                                "quick_search_field": true
                            },
                            name: {type: "varchar", length: "255", "quick_search_field": true},
                            definition: {type: "text", "quick_search_field": true},
                            definition_de: {type: "text", "quick_search_field": true},
                            definition_bahasa: {type: "text", "quick_search_field": true},
                            value2: {type: "varchar", length: "255"},
                            msaccess_value_id: {type: "varchar", length: "255", "quick_search_field": true},
                            sysname: {type: "varchar", length: "255"}
                        }
                    };

                    async.series({
                        addToJSONFile: function (cb) {
                            var filePath = './models/system/' + another_tables_name + '/taxon_trait_sub_table_select.json';
                            var tables;
                            async.series({
                                readFile: function (cb) {
                                    fs.open(filePath, 'r', function (err, fd) {
                                        if (err) {
                                            if (err.code === 'ENOENT') {
                                                return cb(null);
                                            }

                                            return cb(new MyError('не удалось считать файл json', {filePath: filePath})); // could not read json file
                                        }
                                        fs.readFile(fd, function (err, data) {
                                            if (err) return cb(new MyError('Не удалось считать структуры таблиц из файла.', {
                                                err: err,
                                                file: filePath
                                            })); // Failed to read table structures from file
                                            var tablesJSON = data.toString();
                                            try {
                                                tables = JSON.parse(tablesJSON);
                                            } catch (e) {
                                                return cb(new MyError('Информация по таблицам имеет неверный формат.', {err: err})); // Information on the tables has an incorrect format
                                            }
                                            return cb(null);
                                        })
                                    })
                                },
                                addToFile: function (cb) {
                                    tables = tables || {};
                                    for (var i in json) {
                                        tables[i] = json[i];
                                    }
                                    var obj = {
                                        fileName: filePath,
                                        data: JSON.stringify(tables),
                                        error: true,
                                        flags: 'w'
                                    };
                                    toFile(obj, function (err, res) {
                                        if (err) return cb(new MyError('не удалось записать данные в json файл', {
                                            err: err,
                                            obj: obj
                                        }));
                                        cb(null);
                                    });
                                }
                            }, cb);
                        },
                        createClassRow: function (cb) {
                            var o = {
                                command: 'add',
                                object: 'Class_profile',
                                params: {
                                    name: alias,
                                    rollback_key: rollback_key
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось создать Class_profile для ' + alias, {
                                    o: o,
                                    err: err
                                }));
                                cb(null);
                            });
                        },
                        syncWithTableJson: function (cb) {
                            var o = {
                                command: 'syncWithTableJson',
                                object: 'Table',
                                params: {
                                    name: alias
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось создать таблицу в базе', {o: o, err: err}));
                                cb(null);
                            });
                        }
                    }, cb);
                },
                addToMenu: function (cb) {
                    // return cb(null);
                    var menu;
                    var item_exist = false;
                    async.series({
                        getMenuID: function (cb) {
                            if (item_exist) return cb(null);
                            var o = {
                                command: 'get',
                                object: 'menu',
                                params: {
                                    param_where: {
                                        menu_item: 'selects'
                                    },
                                    fromClient: false,
                                    collapseData: false
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) {
                                    console.log('Не удалось создать пункт меню. Ошибка при получении menu menu_item=selects', err);
                                    return cb(null);
                                }
                                if (!res.length) {
                                    console.log('Не удалось создать пункт меню. В системе не заведено родительское меню menu_item=selects');
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
                                command: 'add',
                                object: 'menu',
                                params: {
                                    class_id: _t.class_id,
                                    menu_item: 'trait_directories_' + alias,
                                    name: trait.name,
                                    class_name: alias,
                                    parent_id: menu.id,
                                    menu_type: 'item',
                                    is_visible: true
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) {
                                    console.log('Не удалось создать пункт меню. Ошибка при добавлении.', err);
                                    return cb(null);
                                }
                                cb(null);
                            })
                        }
                    }, cb);
                }
            }, cb);
        },
        modify: function (cb) {
            _t.modifyPrototype(obj, cb);
        }
    }, (err, res) => {
        if (err) {
            rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            // if (!doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'add_', params:obj});
            // }
            cb(null, new UserOk('Ок', res.modify));
        }
    })
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

Model.prototype.export_to_excel = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var client_object = _t.client_object || '';

    var coFunction = 'export_to_excel_' + client_object;
    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb);
    } else {
        if (typeof _t['export_to_excel_'] === 'function') {
            _t['export_to_excel_'](obj, cb);
        } else {
            _t.export_to_excelPrototype(obj, cb);
        }
    }
};

Model.prototype.remove = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var client_object = _t.client_object || '';

    var coFunction = 'remove_' + client_object;

    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb);
    } else {
        if (typeof _t['remove_'] === 'function') {
            _t['remove_'](obj, cb);
        } else {
            _t.removePrototype(obj, cb);
        }
    }
};

/**
 * УСТАРЕЛО (вроде)
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.getAll = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var taxon_id = +obj.taxon_id;
    if (isNaN(+taxon_id)) return cb(new MyError('Не передан taxon_id',{obj:obj}));

    // получить все по taxon_id
    // Для каждого получить значения в зависимости от типа
    var taxon_avalible_traits;
    var taxon_avalible_traits_addDATA;
    async.series({
        get:function(cb){
            var params = {
                param_where:{
                    taxon_id:taxon_id
                },
                collapseData:false
            };
            _t.get(params, function(err, res, additionalData){
                if (err) return cb(new MyError('Не удалось получить taxon_avalible_trait',{params:params, err:err}));
                taxon_avalible_traits = res;
                taxon_avalible_traits_addDATA = additionalData;
                cb(null);
            });
        },
        getValues:function(cb){
            if (!taxon_avalible_traits) return cb(null);
            async.eachSeries(taxon_avalible_traits, function(item, cb){
                var o = {
                    command:'get',
                    object:'taxon_trait_value',
                    params:{
                        param_where:{
                            taxon_id:item.taxon_id,
                            taxon_avalible_trait_id:item.id
                        },
                        collapseData:false
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось taxon_trait_value',{o : o, err : err}));
                    if (res.length > 1) return cb(new MyError('Слишком много пар значений для taxon_trait_value', {o:o}));
                    if (!res.length) return cb(null);
                    item.taxon_trait_value_id = res[0].id;
                    cb(null);
                });
            },cb);
        },
        getRealValues:function(cb){
            // from sub tables
            if (!taxon_avalible_traits) return cb(null);
            async.eachSeries(taxon_avalible_traits, function(item, cb){
                if (!item.taxon_trait_value_id) return cb(null);
                var o = {
                    command:'get',
                    object:item.trait_type_sub_table_name,
                    params:{
                        param_where:{
                            taxon_trait_value_id:item.taxon_trait_value_id
                        },
                        collapseData:false
                    }
                };
                _t.api(o, function (err, res, additionalData) {
                    if (err) return cb(new MyError('Не удалось ' + item.trait_type_sub_table_name,{o : o, err : err}));
                    for (var i in res[0]) {
                        if (['id','taxon_trait_value_id'].indexOf(i) !== -1) continue;
                        item[i] = res[0][i];
                    }
                    cb(null);
                });
            },cb);
        },
        prepareRes:function(cb){

            // Надо чтобы у всех элементов было одинаковое число полей / It is necessary that all elements have the same number of fields
            // для этого добавим недостающие / for this we add the missing
            // Иначе collapseData будет работать не корректно ( data_columns берется по нулевому элементу) / Otherwise, collapseData will not work correctly (data_columns is taken on the zero element)
            var fields = [];
            for (var i in taxon_avalible_traits) {
                for (var i1 in taxon_avalible_traits[i]) {
                    if (fields.indexOf(i1) === -1) fields.push(i1);
                }

            }
            for (var i2 in taxon_avalible_traits) {
                for (var i3 in fields) {
                    if (typeof taxon_avalible_traits[i2][fields[i3]] === 'undefined') taxon_avalible_traits[i2][fields[i3]] = null;
                }
            }


            var res = funcs.collapseData(taxon_avalible_traits, {
                count: taxon_avalible_traits_addDATA.count,
                count_all: taxon_avalible_traits_addDATA.count_all
            }, taxon_avalible_traits_addDATA.data_columns);
            cb(null, res);
        }

    },function (err, res) {
        if (err) return cb(err);
        cb(null, res.prepareRes);
    });
};

Model.prototype.get_form_taxon_avalible_traitsOLD = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (!id){
        if (obj.where){
            for (var i in obj.where) {
                if (obj.where[i].key === 'id'){
                    id = obj.where[i].val1;
                    break;
                }
            }
        }
    }
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    // Получить первичный таксон
    // Получить всех у кого есть value, взять верхний
    var taxon_ids = [];
    var top_taxon;
    var get_res;
    async.series({
        getAllWithVal:function(cb){
            var o = {
                command:'get',
                object:'taxon_trait_value',
                params:{
                    param_where:{
                        taxon_avalible_trait_id:id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon_trait_value',{o : o, err : err}));
                for (var i in res) {
                    if (taxon_ids.indexOf(res[i].taxon_id) === -1) taxon_ids.push(res[i].taxon_id);
                }
                cb(null);
            });
        },
        getTopTaxon:function(cb){
            if (!taxon_ids.length) return cb(null);
            var o = {
                command:'get',
                object:'taxon',
                params:{
                    where:[
                        {
                            key:'id',
                            type:'in',
                            val1:taxon_ids
                        }
                    ],
                    collapseData:false,
                    sort:{
                        columns:['level'],
                        directions:['asc']
                    },
                    limit:1
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить top_taxon',{o : o, err : err}));
                top_taxon = res[0];
                cb(null);
            });

        },
        getPrototype:function(cb){
            _t.getPrototype(obj, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить данные',{obj : obj, err : err}));
                res.top_taxon = top_taxon;
                cb(null, res);
            });
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, res.getPrototype);
    });
};

Model.prototype.getTopTaxon = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (!id){
        if (obj.where){
            for (var i in obj.where) {
                if (obj.where[i].key === 'id'){
                    id = obj.where[i].val1;
                    break;
                }
            }
        }
    }
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    // Получить первичный таксон
    // Получить всех у кого есть value, взять верхний
    var taxon_ids = [];
    var top_taxon;
    var get_res;
    async.series({
        getAllWithVal:function(cb){
            var o = {
                command:'get',
                object:'taxon_trait_value',
                params:{
                    param_where:{
                        taxon_avalible_trait_id:id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon_trait_value',{o : o, err : err}));
                for (var i in res) {
                    if (taxon_ids.indexOf(res[i].taxon_id) === -1) taxon_ids.push(res[i].taxon_id);
                }
                cb(null);
            });
        },
        getTopTaxon:function(cb){
            if (!taxon_ids.length) return cb(null);
            var o = {
                command:'get',
                object:'taxon',
                params:{
                    where:[
                        {
                            key:'id',
                            type:'in',
                            val1:taxon_ids
                        }
                    ],
                    collapseData:false,
                    sort:{
                        columns:['level'],
                        directions:['asc']
                    },
                    limit:1
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить top_taxon',{o : o, err : err}));
                top_taxon = res[0];
                cb(null);
            });

        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{top_taxon:top_taxon}));
    });
};

Model.prototype.add_form_taxon_avalible_characters = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    obj.is_ecokeys = true;

    _t.add_(obj, cb);
};

Model.prototype.add_form_taxon_avalible_traits = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    obj.is_taxonomic = true;

    _t.add_(obj, cb);
};

Model.prototype.setValueByList = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    //var id = obj.id;

    //if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    //var taxon_avalible_trait, taxon_trait_value, trait_type;
    //var sub_table_record;
    if (!Array.isArray(obj.list)) return cb(new MyError('Не передан list',{obj:obj}));

    async.eachSeries(obj.list, function (item, cb) {
        var params = {
            id: item.id,
            taxon_id: item.taxon_id,
            value_id: item.value_id,
            value1: item.value || item.value1,
            value2: item.value2,
            rollback_key: rollback_key
        };

        if (typeof item.gender !== 'undefined')
            params.gender = item.gender
        if (typeof item.gender_id !== 'undefined')
            params.gender_id = item.gender_id
        if (typeof item.location_id !== 'undefined')
            params.location_id = item.location_id
        if (typeof item.replicates !== 'undefined')
            params.replicates = item.replicates

        _t.setValue_multi(params, cb);
    }, function (err) {
        if (err) return cb(err);
        cb(null, new UserOk('Ok'));
    });

};

Model.prototype.setValue = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var taxon_avalible_trait, taxon_trait_value, trait_type;
    var sub_table_record;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon_avalible_trait.',{id:id,err:err}));
                taxon_avalible_trait = res[0];
                cb(null);
            });
        },
        getOrCreate:function(cb){
            var o = {
                command:'get',
                object:'taxon_trait_value',
                params:{
                    param_where:{
                        taxon_avalible_trait_id:id,
                        taxon_id:+obj.taxon_id || taxon_avalible_trait.taxon_id,
                        taxon_gender_sysname:obj.gender || 'FEMALE',
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon_trait_value',{o : o, err : err}));
                if (res.length > 1) return cb(new UserError('Слишком много значений для данного свойства и для данного таксона',{o:o, res:res}));
                taxon_trait_value = res[0];
                if (!taxon_trait_value) {
                    // create and get value
                    var o = {
                        command:'add',
                        object:'taxon_trait_value',
                        params:{
                            taxon_avalible_trait_id:id,
                            taxon_id:+obj.taxon_id || taxon_avalible_trait.taxon_id,
                            taxon_gender_sysname:obj.gender || 'FEMALE',
                            rollback_key:rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось создать taxon_trait_value',{o : o, err : err}));
                        var o = {
                            command:'getById',
                            object:'taxon_trait_value',
                            params:{
                                id:res.id,
                                collapseData:false
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось получить только что созданный taxon_trait_value',{o : o, err : err}));
                            taxon_trait_value = res[0];
                            cb(null);
                        });
                    });
                }else{
                    return cb(null);
                }
            });

        },
        getTraitType:function(cb){
            var o = {
                command:'getById',
                object:'trait_type',
                params:{
                    id:taxon_avalible_trait.trait_type_id,
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить trait_type',{o : o, err : err}));
                trait_type = res[0];
                cb(null);
            });
        },
        getOrCreateSubTableRecord:function(cb){
            if (!trait_type.sub_table_name) return cb(new MyError('Для данного trait_type не указан sub_table_name', {trait_type:trait_type}));
            var o = {
                command:'get',
                object:trait_type.sub_table_name,
                params:{
                    param_where:{
                        taxon_trait_value_id:taxon_trait_value.id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить ' + trait_type.sub_table_name,{o : o, err : err}));
                if (res.length > 1) return cb(new UserError('Слишком много значений ' + trait_type.sub_table_name + 'для данного taxon_trait_value_id',{o:o, res:res}));
                sub_table_record = res[0];
                if (!sub_table_record) {
                    // create and get
                    var o = {
                        command:'add',
                        object:trait_type.sub_table_name,
                        params:{
                            taxon_trait_value_id:taxon_trait_value.id,
                            rollback_key:rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось создать ' + trait_type.sub_table_name,{o : o, err : err}));
                        var o = {
                            command:'getById',
                            object:trait_type.sub_table_name,
                            params:{
                                id:res.id,
                                collapseData:false
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось получить только что созданный ' + trait_type.sub_table_name,{o : o, err : err}));
                            sub_table_record = res[0];
                            cb(null);
                        });
                    });
                }else{
                    return cb(null);
                }
            });

        },
        ifNumberCheckRange: cb => {
            if (['INTEGER', 'FLOAT'].indexOf(taxon_avalible_trait.trait_type_sysname) === -1) return cb(null);
            if (!('value1' in obj) || obj.value1 === '') return cb(null);

            let min = isNaN(+taxon_avalible_trait.min_value) || taxon_avalible_trait.min_value === '' ? null : +taxon_avalible_trait.min_value;
            let max = isNaN(+taxon_avalible_trait.max_value) || taxon_avalible_trait.max_value === '' ? null : +taxon_avalible_trait.max_value;

            if (min !== null && +obj.value1 < min)
                return cb(new UserError('Minimum is ' + min));
            else if (max !== null && +obj.value1 > max)
                return cb(new UserError('Maximum is ' + max));

            cb(null);
        },
        set:function(cb){
            var o = {
                command:'modify',
                object:trait_type.sub_table_name,
                params:{
                    id:sub_table_record.id,
                    rollback_key:rollback_key
                }
            };
            if (typeof obj.value !== 'undefined')  o.params.value = obj.value;
            if (typeof obj.value1 !== 'undefined') o.params.value1 = obj.value1;
            if (typeof obj.value2 !== 'undefined') o.params.value2 = obj.value2;
            if (typeof obj.value3 !== 'undefined') o.params.value3 = obj.value3;
            if (typeof obj.value4 !== 'undefined') o.params.value4 = obj.value4;
            if (typeof obj.value5 !== 'undefined') o.params.value5 = obj.value5;
            if (typeof obj.value6 !== 'undefined') o.params.value6 = obj.value6;
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось установить значение для trait_type.sub_table_name',{o : o, err : err}));

                cb(null);
            });

        }
    },function (err, res) {
        if (err) {
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            // if (!doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'setValue', params:obj});
            // }
            cb(null, new UserOk('Ок'));
        }
    });
};

Model.prototype.setValue_multi = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    
    let _t = this;
    
    let id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}));

    let value_id = obj.value_id
    let taxon_id = +obj.taxon_id
    if (isNaN(+taxon_id)) return cb(new MyError('Не передан taxon_id', {obj: obj}));
    
    let rollback_key = obj.rollback_key || rollback.create()
    let doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key

    let taxon_avalible_trait, taxon_trait_value, trait_type;
    let sub_table_record;
    
    async.series({
        get: function (cb) {
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon_avalible_trait.', {id: id, err: err}));
                taxon_avalible_trait = res[0];
                cb(null);
            });
        },
        checkForDuplicate: function (cb) {
            let taxon_trait_values;
            let duplicates = []

            function isEmpty(value) {
                if (typeof value === 'undefined' || value === '')
                    return null
                else
                    return value
            }

            async.series({
                getTraitValue: cb => {
                    let o = {
                        command: 'get',
                        object: 'taxon_trait_value',
                        params: {
                            param_where: {
                                taxon_avalible_trait_id: id,
                                taxon_id: taxon_id
                            },
                            where: [],
                            collapseData: false
                        }
                    };

                    if (value_id)
                        o.params.where.push({
                            key: 'id',
                            type: '!=',
                            val1: value_id
                        })

                    if (obj.gender_id)
                        o.params.param_where.taxon_gender_id = obj.gender_id
                    else if (obj.gender)
                        o.params.param_where.taxon_gender_sysname = obj.gender_id
                    else
                        o.params.param_where.taxon_gender_sysname = 'FEMALE'

                    if (obj.location_id)
                        o.params.param_where.location_id = obj.location_id

                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Error while getting taxon_trait_value', {o: o, err: err}));
                        if (res.length)
                            taxon_trait_values = res.map(row => {
                                return {
                                    id: row.id,
                                    location_id: row.location_id
                                }
                            })
                        cb(null);
                    });
                },
                checkTraits: cb => {
                    obj.value1 = isEmpty(obj.value1)
                    obj.value2 = isEmpty(obj.value2)
                    obj.location_id = isEmpty(obj.location_id)

                    duplicates.push({
                        id: value_id,
                        value1: obj.value1,
                        value2: obj.value2,
                        location_id: obj.location_id
                    })

                    async.eachSeries(taxon_trait_values, (trait_value, cb) => {
                        let value1 = null, value2 = null

                        async.series({
                            getValue: cb => {
                                let o = {
                                    command: 'get',
                                    object: taxon_avalible_trait.trait_type_sub_table_name,
                                    params: {
                                        param_where: {
                                            taxon_trait_value_id: trait_value.id
                                        },
                                        collapseData: false
                                    }
                                };
                                _t.api(o, function (err, res) {
                                    if (err)
                                        return cb(new MyError('Error while getting ' + taxon_avalible_trait.trait_type_sub_table_name, {o: o, err: err}));
                                    if (res.length > 1)
                                        return cb(new UserError('Слишком много значений ' + taxon_avalible_trait.trait_type_sub_table_name + 'для данного taxon_trait_value_id', {
                                            o: o,
                                            res: res
                                        }));
                                    if (res.length) {
                                        value1 = res[0].value1;
                                        value2 = res[0].value2;
                                    }
                                    cb(null);
                                });
                            },
                            removeIfDuplicate: cb => {
                                value1 = isEmpty(value1)
                                value2 = isEmpty(value2)
                                trait_value.location_id = isEmpty(trait_value.location_id)

                                if (value1 == obj.value1 && value2 == obj.value2 && trait_value.location_id == obj.location_id)
                                    duplicates.push({
                                        id: trait_value.id,
                                        value1: value1,
                                        value2: value2,
                                        location_id: trait_value.location_id
                                    })

                                cb(null)
                            }
                        }, cb)
                    }, cb)
                },
                getLiterature: cb => {
                    if (duplicates.length === 1) return cb(null)

                    let o = {
                        command: 'get',
                        object: 'taxon_trait_value_literature_data_link',
                        params: {
                            param_where: {
                                taxon_id: taxon_id
                            },
                            where: [
                                {
                                    key: 'taxon_trait_value_id',
                                    type: 'in',
                                    val1: duplicates.map(row => row.id)
                                }
                            ],
                            collapseData: false
                        }
                    }

                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Error while getting literature', {o: o, err: err}));

                        if (!res.length)
                            return cb(new UserError('Duplicate value'))

                        const literature = new Set()

                        for (const row of res) {
                            if (literature.has(literature[row.literature_id]))
                                return cb(new UserError('Duplicate value'))

                            literature.add(literature[row.literature_id])
                        }

                        //Has 2 or more nulls
                        if (literature.size <= res.length - 2)
                            return cb(new UserError('Duplicate value'))

                        cb(null);
                    });
                }
            }, cb)
        },
        createValue: function (cb) {
            if (value_id) return cb(null);

            let o = {
                command: 'add',
                object: 'taxon_trait_value',
                params: {
                    taxon_avalible_trait_id: id,
                    taxon_id: taxon_id,
                    rollback_key: rollback_key
                }
            };

            if (obj.gender_id)
                o.params.taxon_gender_id = obj.gender_id
            else if (obj.gender)
                o.params.taxon_gender_sysname = obj.gender_id
            else
                o.params.taxon_gender_sysname = 'FEMALE'

            if (obj.location_id)
                o.params.location_id = obj.location_id

            if (obj.replicates)
                o.params.replicates = obj.replicates

            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось создать taxon_trait_value', {o: o, err: err}));
                value_id = res.id;
                cb(null);
            });
        },
        getValue: function (cb) {
            if (!value_id) return cb('Value not found');

            let o = {
                command: 'get',
                object: 'taxon_trait_value',
                params: {
                    param_where: {
                        id: value_id
                    },
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon_trait_value', {o: o, err: err}));
                if (res.length)
                    taxon_trait_value = res[0];
                cb(null);
            });
        },
        getSubTableRecord: function (cb) {
            if (!taxon_avalible_trait.trait_type_sub_table_name)
                return cb(new MyError('Для данного trait_type не указан sub_table_name', {trait_type: trait_type}));

            let o = {
                command: 'get',
                object: taxon_avalible_trait.trait_type_sub_table_name,
                params: {
                    param_where: {
                        taxon_trait_value_id: taxon_trait_value.id
                    },
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err)
                    return cb(new MyError('Error while getting ' + taxon_avalible_trait.trait_type_sub_table_name, {o: o, err: err}));
                if (res.length > 1)
                    return cb(new UserError('Слишком много значений ' + taxon_avalible_trait.trait_type_sub_table_name + 'для данного taxon_trait_value_id', {
                    o: o,
                    res: res
                }));
                if (res.length)
                    sub_table_record = res[0];
                cb(null);
            });
        },
        createSubTableRecord: function (cb) {
            if (sub_table_record) return cb(null);

            let o = {
                command: 'add',
                object: taxon_avalible_trait.trait_type_sub_table_name,
                params: {
                    taxon_trait_value_id: taxon_trait_value.id,
                    rollback_key: rollback_key
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Error while creating ' + taxon_avalible_trait.trait_type_sub_table_name, {
                    o: o,
                    err: err
                }));

                let o = {
                    command: 'getById',
                    object: taxon_avalible_trait.trait_type_sub_table_name,
                    params: {
                        id: res.id,
                        collapseData: false
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Error while getting just created record ' + taxon_avalible_trait.trait_type_sub_table_name, {o: o, err: err}));
                    sub_table_record = res[0];
                    cb(null);
                });
            });
        },
        ifNumberCheckRange: cb => {
            if (['INTEGER', 'FLOAT'].indexOf(taxon_avalible_trait.trait_type_sysname) === -1) return cb(null);
            if (!('value1' in obj) || obj.value1 === '') return cb(null);

            let min = parseInt(taxon_avalible_trait.min_value);
            let max = parseInt(taxon_avalible_trait.max_value);

            if (!isNaN(min) && +obj.value1 < min)
                return cb(new UserError('Minimum is ' + min));
            else if (!isNaN(max) && +obj.value1 > max)
                return cb(new UserError('Maximum is ' + max));

            cb(null);
        },
        updateValue: cb => {
            let genderNotChanged = !('gender_id' in obj || 'gender' in obj)
                || obj.gender === taxon_trait_value.taxon_gender_sysname
                || obj.gender_id === taxon_trait_value.taxon_gender_id
            let locationNotChanged = !('location_id' in obj)
                || obj.location_id === taxon_trait_value.location_id
            let replicatesNotChanged = !('replicates' in obj)
                || obj.replicates === taxon_trait_value.replicates

            if (genderNotChanged && locationNotChanged && replicatesNotChanged)
                return cb(null)
            
            let o = {
                command: 'modify',
                object: 'taxon_trait_value',
                params: {
                    id: value_id
                }
            };

            if (!genderNotChanged)
                if ('gender_id' in obj)
                    o.params.taxon_gender_id = obj.gender_id
                else if ('gender' in obj)
                    o.params.taxon_gender_sysname = obj.gender

            if (!locationNotChanged && 'location_id' in obj)
                o.params.location_id = obj.location_id

            if (!replicatesNotChanged && 'replicates' in obj)
                o.params.replicates = obj.replicates

            _t.api(o, function (err, res) {
                if (err) return cb(new MyError(`Error while updating trait value`, {
                    o: o,
                    err: err
                }));

                cb(null);
            });
        },
        set: function (cb) {
            let o = {
                command: 'modify',
                object: taxon_avalible_trait.trait_type_sub_table_name,
                params: {
                    id: sub_table_record.id,
                    rollback_key: rollback_key
                }
            };
            if (typeof obj.value !== 'undefined') o.params.value = obj.value;
            if (typeof obj.value1 !== 'undefined') o.params.value1 = obj.value1;
            if (typeof obj.value2 !== 'undefined') o.params.value2 = obj.value2;
            if (typeof obj.value3 !== 'undefined') o.params.value3 = obj.value3;
            if (typeof obj.value4 !== 'undefined') o.params.value4 = obj.value4;
            if (typeof obj.value5 !== 'undefined') o.params.value5 = obj.value5;
            if (typeof obj.value6 !== 'undefined') o.params.value6 = obj.value6;
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError(`Не удалось установить значение для ${taxon_avalible_trait.trait_type_sub_table_name}`, {
                    o: o,
                    err: err
                }));

                cb(null);
            });

        }
    }, function (err, res) {
        // && err.message !== 'Duplicate value'
        if (err) {
            rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            // if (!doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'setValue', params:obj});
            // }
            cb(null, new UserOk('Ок'));
        }
    });
};

// var o = {
//     command:'getCustomFilter',
//     object:'Taxon_avalible_trait',
//     params:{}
// };
// socketQuery(o, function(res){
//     console.log(res);
// });
Model.prototype.getCustomFilterTEST = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    // получить все свойства с is_main

    async.series({
        get_aval:function(cb){
            var params = {
                param_where:{
                    is_main_filter:true
                },
                columns:['id','name','definition']
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить  is_main_filter taxon_avalible_trait',{params : params, err : err}));
                cb(null, res);
            });
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('Ок', res.get_aval));
    });
};


// var o = {
//     command:'getMainFilter',
//     object:'Taxon_avalible_trait',
//     params:{
//         taxon_id:1
//     }
// };
// socketQuery(o, function(res){
//     console.log(res);
// });
/*Used on the site*/
Model.prototype.getMainFilter = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	var _t = this;

	var taxon_id = +obj.taxon_id;
	if (isNaN(taxon_id)) return cb(new UserError('Please, select a group.', {obj: obj}));

	// получить все свойства с is_main и типом CHAR
	var taxon_ids = [taxon_id];
	var results = [], resultsExtraData = {count: 0, count_all: 0};
	var species_count, genera_count, families_count;
	let values = {};

	async.series({
		getAvailTaxonIds: function (cb) {
			async.series({
				getSpeciesChildIds: function (cb) {
					var o = {
						command: 'getChildIds',
						object: 'Taxon',
						params: {
							id: taxon_id,
							columns: ['level_id', 'level_name'],
							count_only_with_where: [
								{
									key: 'level_name',
									values: ['species','morphospecies']
								}
							]
						}
					};
					_t.api(o, function (err, res) {
						if (err) return cb(new MyError('Не удалось получить getChildIds', {o: o, err: err}));

						taxon_ids = taxon_ids.concat(res.ids);
						species_count = res.ids.length;

						// console.log(res.ids.join(','));
						cb(null);
					});
				},
				getGeneraChildIds: function (cb) {
					var o = {
						command: 'getChildIds',
						object: 'Taxon',
						params: {
							id: taxon_id,
							columns: ['level_id', 'level_name'],
							count_only_with_where: [
								{
									key: 'level_name',
									values: ['genus']
								}
							]
						}
					};
					_t.api(o, function (err, res) {
						if (err) return cb(new MyError('Не удалось получить getChildIds', {o: o, err: err}));

						// taxon_ids = taxon_ids.concat(res.ids);
						genera_count = res.ids.length;

						// console.log(res.ids.join(','));
						cb(null);
					});
				},
				getFamiliesChildIds: function (cb) {
					var o = {
						command: 'getChildIds',
						object: 'Taxon',
						params: {
							id: taxon_id,
							columns: ['level_id', 'level_name'],
							count_only_with_where: [
								{
									key: 'level_name',
									values: ['family']
								}
							]
						}
					};
					_t.api(o, function (err, res) {
						if (err) return cb(new MyError('Не удалось получить getChildIds', {o: o, err: err}));

						// taxon_ids = taxon_ids.concat(res.ids);
						families_count = res.ids.length;

						// console.log(res.ids.join(','));
						cb(null);
					});
				}
			}, cb);
		},
		get_aval: function (cb) {
			if (!taxon_ids.length) return cb(null);

			if (obj.add_characters && obj.add_characters.length)
				taxon_ids = taxon_ids.concat(obj.add_characters);

			var params = {
				where: [
					{
						key: 'is_ecokeys',
						val1: true
					},
					{
						key: 'taxon_id',
						type: 'in',
						val1: taxon_ids
					},
					{
						key: 'trait_type_sysname',
						type: 'in',
						val1: ['SELECT']
					}
				],
				columns: ['id', 'taxon_id', 'taxon', 'name', 'definition', 'trait_type_sysname', 'is_ecokeys',
					'trait_expert_level_sysname', 'character_category_id', 'character_category', 'character_category_sysname'],
				collapseData: false
			};

			if (obj.levels)
				params.where.push({
					key: 'trait_expert_level_sysname',
					type: 'in',
					val1: obj.levels
				});

			if (obj.parts)
				params.where.push({
					key: 'character_category_sysname',
					type: 'in',
					val1: obj.parts
				});

			if (obj.page === 0) {
				params.limit = 20;
			} else {
				params.offset = 20;
			}

			if (obj.with_values)
				params.collapseData = false;

			_t.get(params, function (err, res, addData) {
				if (err) return cb(new MyError('Не удалось получить taxon_avalible_trait', {
					params: params,
					err: err
				}));
				results = res;
				resultsExtraData = addData;
				cb(null, res);
			});
		},
		checkAvalValues: cb => {
			if (!results.length) return cb(null);

			let trait_values_ids = {};
			let taxon_ids2 = taxon_ids;

			async.series({
				getParents: function (cb) {
					let o = {
						command: 'getParentIds',
						object: 'taxon',
						params: {
							ids: taxon_ids2
						}
					};

					_t.api(o, (err, res) => {
						if (err) return cb(err);
						taxon_ids2 = taxon_ids2.concat(res.ids);
						cb(null);
					})
				},
				getValuesIds: cb => {
					let o = {
						command: 'get',
						object: 'taxon_trait_value',
						params: {
							columns: ['id', 'taxon_id', 'taxon_avalible_trait_id'],
							where: [
								{
									key: 'taxon_id',
									type: 'in',
									val1: taxon_ids2
								},
								{
									key: 'taxon_avalible_trait_id',
									type: 'in',
									val1: results.map(row => {
										return row.id;
									})
								},
							],
							limit: 1000000000,
							collapseData: false
						}
					};

					_t.api(o, function (err, res) {
						if (err) return cb(new MyError('Error while getting taxon_trait_value', {o: o, err: err}));
						res.forEach(row => {
							trait_values_ids[row.id] = row.taxon_avalible_trait_id;
						});
						cb(null);
					});
				},
				getValues: cb => {
					if (!Object.keys(trait_values_ids).length) return cb(null);

					let o = {
						command: 'get',
						object: 'taxon_trait_sub_table_select',
						params: {
							columns: ['taxon_trait_value_id', 'value1'],
							where: [
								{
									key: 'taxon_trait_value_id',
									type: 'in',
									val1: Object.keys(trait_values_ids)
								}
							],
							limit: 1000000000,
							collapseData: false
						}
					};

					_t.api(o, function (err, res) {
						if (err) return cb(new MyError('Error while getting taxon_trait_value', {o: o, err: err}));

						res.forEach(row => {
							let trait_id = trait_values_ids[row.taxon_trait_value_id];

							if (!(trait_id in values)) {
								values[trait_id] = new Set();
							}

							values[trait_id].add(row.value1);
						});

						for (let value of Object.keys(values)) {
							values[value] = Array.from(values[value]);
						}

						cb(null);
					});
				}
			}, cb);
		},
		getValuesForSelects: function (cb) {
			if (!obj.with_values) return cb(null);

			async.eachSeries(results, function (one_res, cb) {
				if (one_res.trait_type_sysname !== 'SELECT') return cb(null);
				// Запросим значения
				var params = {
					id: one_res.id,
					collapseData: false
				};
				_t.getSelect(params, function (err, res) {
					if (err) {
						console.warn('Не удалось получить знасчения для селекта', {params: params, err: err});
						// return cb(new MyError('Не удалось получить знасчения для селекта',{params : params, err : err}));
						one_res.values = [];
						return cb(null);
					}
					one_res.values = [];
					for (var i in res) {
						if (typeof res[i] !== 'object') continue;
						one_res.values.push(res[i])
					}
					cb(null);
				});
			}, function (err, res) {
				if (err) return cb(err);
				// results = funcs.collapseData(results, {
				//     count: resultsExtraData.count,
				//     count_all: resultsExtraData.count_all,
				//     species_count_all: species_count,
				//     genera_count_all: genera_count,
				//     families_count_all: families_count,
				//     species_count: species_count,
				//     genera_count: genera_count,
				//     families_count: families_count
				// }, resultsExtraData.data_columns);
				cb(null);
			});
		}
	}, function (err, res) {
		if (err) return cb(err);
		cb(null, new UserOk('noToastr', {
			results: results,
			count: resultsExtraData.count,
			count_all: resultsExtraData.count_all,
			species_count_all: species_count,
			genera_count_all: genera_count,
			families_count_all: families_count,
			species_count: species_count,
			genera_count: genera_count,
			families_count: families_count,
			values: values
		}));
	});
};


// var o = {
// 	command: 'setNewFields',
// 	object: 'taxon_avalible_trait',
// 	params: {
// 	}
// };
// socketQuery(o, function (res) {
// 	console.log(res);
// });
Model.prototype.setNewFields = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	let rollback_key = obj.rollback_key || rollback.create();

	let traits;

	async.series({
		get: cb => {
			_t.get({
				collapseData: false
			}, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить taxon_avalible_traits', {
					err: err
				}));
				traits = res;
				cb(null, res);
			});
		},
		update: cb => {
			async.eachSeries(traits, (trait, cb) => {
				let params = {
					id: trait.id,
					is_ecokeys: trait.trait_type2_sysname === 'CHARACTER',
					is_taxonomic: trait.trait_type2_sysname === 'TRAIT',
					is_individual: false,
					rollback_key:rollback_key
				};

				_t.modify(params, cb);
			}, cb);
		}
	}, function (err, res) {
		if (err) return cb(err);
		cb(null, new UserOk('OK!'));
	});
};

// var o = {
// 	command: 'copeMeasurementsToTraits',
// 	object: 'taxon_avalible_trait',
// 	params: {
// 	}
// };
// socketQuery(o, function (res) {
// 	console.log(res);
// });
Model.prototype.copeMeasurementsToTraits = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	let rollback_key = obj.rollback_key || rollback.create();

	let limit = 800000000;
	let measurements;

	async.series({
		get: cb => {
			let o = {
				command: 'get',
				object: 'measurement',
				params: {
					// param_where: {
					// 	id: 69
					// },
					limit: limit,
					collapseData: false
				}
			};

			_t.api(o, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить measurements', { err: err }));
				measurements = res;
				cb(null, res);
			});
		},
		update: cb => {
			async.eachSeries(measurements, (meas, cb) => {
				let trait;
				let trait_id;

				async.series({
					check: cb => {
						let params = {
							param_where: {
								name: meas.name
							},
							collapseData: false
						};

						_t.get(params, (err, res) => {
							if (err) return cb(new MyError('Error while adding', { params: params, err: err }));
							if (res.length) meas.name += ' (measurement)';
							cb(null);
						});
					},
					addTrait: cb => {
						let params = {
							project_id: meas.project_id,
							taxon_id: meas.taxon_id,
							name: meas.name,
							name_ru: meas.name_ru,
							measurement_protocol: meas.measurement_protocol,
							trait_type_sysname: meas.type_sysname,
							definition: meas.definition,
							definition_de: meas.definition_de,
							definition_bahasa: meas.definition_bahasa,
							inherit: meas.inherit,
							min_value: meas.min_value1,
							max_value: meas.max_value1,
							default_unit_id: meas.default_unit_id,
							source: meas.source,
							external_id: meas.external_id,
							max_characters: meas.max_characters,
							is_individual: true,
							rollback_key: rollback_key
						};

						_t.add(params, (err, res) => {
							if (err) return cb(new MyError('Error while adding', { params: params, err: err }));
							trait_id = res.id;
							cb(null);
						});
					},
					get: cb => {
					  _t.getById({ id: trait_id }, (err, res) => {
						  if (err) return cb(new MyError('Не удалось получить таксон только что добавленный',{ id: id, err: err }));
						  trait = res[0];
						  cb(null);
					  });
					},
					addLit: cb => {
					    let o = {
					        command: 'get',
					        object: 'measurement_literature_data_link',
					        params: {
					            param_where: {
						            measurement_id: meas.id
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
									        taxon_avalible_trait_id: trait_id,
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
					    if (trait.trait_type_sysname !== 'SELECT') return cb(null);

						let o = {
							command: 'get',
							object: meas.sub_table_name_for_select,
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
										object: trait.sub_table_name_for_select,
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
				method: 'copeMeasurementsToTraits',
				params: obj
			});
			cb(null, new UserOk('Ок'));
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

    var trait;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon_avalible_trait.',{id:id,err:err}));
                trait = res[0];
                if (trait.trait_type_sysname !== 'SELECT') return cb(new MyError('Метод доступен только для селектов'));
                cb(null);
            });
        },
        getValues:function(cb){
            var o = {
                command:'get',
                object:trait.sub_table_name_for_select,
                params:{
                    // param_where:{
                    //     taxon_avalible_trait_id:trait.id
                    // },
                    collapseData:obj.collapseData,
                    limit:obj.limit,
                    page_no:obj.page_no
                }
            };
            _t.api(o, function (err, res) {
                if (err) {
                    return cb(new MyError('Не удалось получить значения для селекта (getSelect)',{o : o, err : err}));
                }

                cb(null, res);
            });

        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('Ок', res.getValues));
    });
};

// var o = {
//     command:'getTree',
//     object:'taxon_avalible_trait',
//     params:{
//         id:6680
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// });
Model.prototype.getTreeOld = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    // if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    // Получить все пары trait-taxon (taxon_trait_value)
    // Получить таксоны (только уникальные taxon_id)
    // Отсортировать
    // Создать дерево

    var traits, parents_trait;
    var taxon_ids = [];
    var taxons;
    var tree = [];
    async.series({

        getTraits:function(cb){
            // var o = {
            //     command:'get',
            //     object:'taxon_trait_value',
            //     params:{
            //
            //         collapseData:false,
            //         limit:100000000
            //     }
            // };
            // _t.api(o, function (err, res) {
            //     if (err) return cb(new MyError('Не удалось получить трейты со значениями',{o : o, err : err}));
            //     for (var i in res) {
            //         if (taxon_ids.indexOf(res[i].taxon_id) === -1) taxon_ids.push(res[i].taxon_id);
            //     }
            //     cb(null);
            // });
            var params = {
                limit:1000000,
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить трейты',{params : params, err : err}));
                    for (var i in res) {
                        if (taxon_ids.indexOf(res[i].taxon_id) === -1) taxon_ids.push(res[i].taxon_id);
                    }
                cb(null);
            });

        },
        getTaxons:function(cb){
            // taxon_ids = [22620,22622,22623,22624];
            var o = {
                command:'get',
                object:'taxon',
                params:{
                    where:[
                        {
                            key:'id',
                            type:'in',
                            val1:taxon_ids
                        }
                    ],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить таксоны',{o : o, err : err}));
                taxons = res;
                cb(null);
            });
        },
        createTree:function(cb){
            taxons.sort(funcs.fieldSorter(['level','id']));
            var child_tree = [];


            var getTreeIndexes = function (tree, id) {
                var indexes = [];
                for (var i in tree) {
                    if (tree[i].id === id) {
                        indexes.push(i);
                        return indexes;
                    }
                }
                for (var i2 in tree) {
                    if (!tree[i2].children.length) continue;
                    for (var j in tree[i2].children) {
                        var tmp_indexes = getTreeIndexes(tree[i2].children, id);
                        if (tmp_indexes) {
                            indexes = [i2].concat(tmp_indexes);
                            return indexes;
                        }
                    }
                }
                return false;
            };

            for (var i in taxons) {
                var taxon = taxons[i];
                var indexes = getTreeIndexes(tree, taxon.parent_id);
                if (!indexes){
                    tree.push(
                        {
                            id:taxon.id,
                            name:taxon.name,
                            name_with_id:taxon.name_with_id,
                            text:taxon.name_with_id,
                            children:[],
                            count:0,
                            expanded:true,
                            state:{
                                opened:true,
                                selected:false
                            }
                        }
                    );
                    continue;
                }
                var tree_ = tree;
                for (var i in indexes) {
                    tree_ = tree_[indexes[i]].children;
                }
                tree_.push(
                    {
                        id:taxon.id,
                        name:taxon.name,
                        name_with_id:taxon.name_with_id,
                        text:taxon.name_with_id,
                        children:[],
                        count:0,
                        expanded:true,
                        state:{
                            opened:true,
                            selected:false
                        }
                    }
                );
            }
            console.log('готово');
            cb(null);
        }

    },function (err, res) {
        if (err) return cb(err);
        var resTree = {
            'core': {
                'data': tree
            }
        };
        cb(null, new UserOk('noToastr',{tree:resTree}));
    });
};

Model.prototype.getTree = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;

    var taxon_avalible_trait;
    var taxon_ids = [];
    var tree;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon_avalible_trait.',{id:id,err:err}));
                taxon_avalible_trait = res[0];
                cb(null);
            });
        },
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
        getTree:function(cb){
            if (!taxon_ids) return cb(new UserError('No traits linked to taxon'));
            // taxon_ids = [406760];
            var o = {
                command:'getTree',
                object:'taxon',
                params:{
                    id:taxon_avalible_trait.taxon_id,
                    only_ids:taxon_ids

                }
            };
            _t.api(o, function (err, res) {
                // if (err) return cb(new MyError('Не удалось получить таксоны',{o : o, err : err}));
                if (err) return cb(err);
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

//Used on the site
Model.prototype.getTaxaWithTraits = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    var taxons = [];
    async.series({
        getTraits: function (cb) {
            var o = {
                command: 'get',
                object: 'taxon_avalible_trait',
                params: {
                    param_where: {},
                    columns: ['taxon', 'taxon_id'],
                    groupBy: ['taxon_id'],
                    collapseData: false,
                    limit: 100000000
                }
            };

            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Error while getting traits', {o: o, err: err}));

                taxons = res.map(row => {
                	return {
                        id: row.taxon_id,
                        name: row.taxon
                    }
                })

                cb(null);
            });
        }
    }, function (err, res) {
        if (err) return cb(err);
        cb(null, taxons);
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

Model.prototype.getByTaxonID = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var taxon_id = +obj.taxon_id;
    if (isNaN(+taxon_id)) return cb(new MyError('Не передан taxon_id',{obj:obj}));

    // Получить все пары trait-taxon (taxon_trait_value)
    // Получить таксоны (только уникальные taxon_id)
    // Отсортировать
    // Создать дерево

    var traits = [];
    async.series({
        getTraits:function(cb){

            var params = {
                param_where:{
                    taxon_id:taxon_id
                },
                limit:1000000,
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить трейты',{params : params, err : err}));
                traits = res;
                cb(null);
            });

        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{traits:traits}));
    });
};

Model.prototype.getPictures = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var pictures;
    var trait;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить трейт.',{id:id,err:err}));
                trait = res[0];
                cb(null);
            });
        },
        getPictures:function(cb){
            var o = {
                command:'get',
                object:'trait_picture',
                params:{
                    where:[
                        {
                            key:'taxon_avalible_trait_id',
                            val1:trait.id
                        }
                    ],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить trait_pictures',{o : o, err : err}));
                pictures = res;
                cb(null);
            });
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{pictures:pictures}));
    });
};

Model.prototype.getTraitInfo = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}));

    var pictures;
    var trait;
    var values;
    let lit_data;
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
                object: 'trait_picture',
                params: {
                    where: [
                        {
                            key: 'taxon_avalible_trait_id',
                            val1: trait.id
                        }
                    ],
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить trait_pictures', {o: o, err: err}));
                pictures = res;
                cb(null);
            });
        },
        getValues: function (cb) {
            if (trait.trait_type_sysname == 'SELECT') {

                let o = {
                    command: 'get',
                    object: trait.sub_table_name_for_select,
                    params: {
                        collapseData: false
                    }
                };

                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось получить trait values', {o: o, err: err}));
                    values = res;
                    cb(null);
                });

            } else {
                values = [];
                cb(null);
            }
        },
        getLitData: cb => {
            if (!obj.get_lit) return cb(null);

            var o = {
                command: 'get',
                object: 'taxon_avalible_trait_literature_data_link',
                params: {
                    param_where: {
                        taxon_avalible_trait_id: trait.id
                    },
                    collapseData: false
                }
            };

            _t.api(o, function (err, res) {
                if (err) return cb(err);

                lit_data = res;

                cb(null);
            });
        }
    }, function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr', {
            pictures: pictures,
            trait: trait,
            values: values,
            lit_data: lit_data
        }));
    });
};


Model.prototype.getForSelect = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    let _t = this;

    if (obj.column_name === 'taxon') {
        async.series({
            getForSelectPrototype: function (cb) {
                obj.return_names = ['id', obj.return_name];
                _t.getForSelectPrototype(obj, cb);
            }
        }, function (err, res) {
            if (err) return cb(err);
            cb(null, res.getForSelectPrototype);
        });
    } else {
        _t.getForSelectPrototype(obj, cb);
    }
};


// var o = {
//     command:'msaccessSyncFields',
//     object:'taxon_avalible_trait'
// };
// socketQuery(o, function(r){
//     console.log(r);
// });
/*trait_type2_sysname is deprecated*/
Model.prototype.msaccessSyncFields = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    // Получить все из msaccess
    // Получить все у нас
    // Смерджить
    // Изменить

    var groups_obj_msaccess;
    var getGroups = function(obj, cb){
        var o = {
            command:'get',
            object:'Taxon',
            params:{
                param_where:{
                    is_group:true
                },
                columns:['id','msaccess_group_id'],
                collapseData:false
            }
        };
        _t.api(o, function (err, res) {
            if (err) return cb(new MyError('Не удалось  получить Группы',{o : o, err : err}));
            groups_obj_msaccess = {};
            for (var i in res) {
                groups_obj_msaccess[res[i].msaccess_group_id] = res[i];
            }
            cb(null);
        });
    };




    var msaccess_traits_obj = {};
    var traits = [];
    async.series({
        getMSAccess:function(cb){
            var q = 'select * from `ALL_TRAIT_LIST` order by Trait_ID';
            msAccess.query({q:q}, function(err, res) {
                if (err) return cb(new MyError('Не удалось получить список ALL_TRAIT_LIST из внешней базы', {err: err, q: q}));
                if (!res.length) return cb(new MyError('Во внешней базе нет такого TRAIT', {q: q}));
                for (var i in res) {
                    res[i].Trait_type_name = (res[i].Trait_type_ID === 1)? 'TRAIT' : 'CHARACTER';
                    msaccess_traits_obj[res[i].Trait_ID] = res[i];
                }
                cb(null);
            });
        },
        get:function(cb){
            var params = {
                limit:100000,
                sort:'msaccess_trait_id',
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить трейты',{params : params, err : err}));
                for (var i in res) {
                    if (msaccess_traits_obj[res[i].msaccess_trait_id]) msaccess_traits_obj[res[i].msaccess_trait_id].is_exist = true;
                    res[i].msaccess_trait = msaccess_traits_obj[res[i].msaccess_trait_id];
                    traits.push(res[i]);
                }
                cb(null);
            });
        },
        merge:function(cb){
            var merge_obj = {
                definition:'definition',
                definition_de:'Definition_german',
                definition_bahasa:'Definition_bahasa',
                trait_type2_sysname:'Trait_type_name',
                trait_order:'order'
            };
            for (var i in traits) {
                var trait = traits[i];
                if (!trait.msaccess_trait) continue;
                for (var j in merge_obj) {
                    if (trait[j] !== trait.msaccess_trait[merge_obj[j]] && trait.msaccess_trait[merge_obj[j]] !== null){ // Здесь ВАЖНО не строгое сравнение/ А может и нет)
                        if (!trait.to_modify) trait.to_modify = {};
                        trait.to_modify[j] = trait.msaccess_trait[merge_obj[j]];
                    }
                }
            }
            cb(null);
        },
        modify:function(cb){
            async.eachSeries(traits, function(item, cb){
                if (!item.to_modify) return cb(null);
                var params = {
                    id:item.id,
                    rollback_key:rollback_key
                };
                for (var i in item.to_modify) {
                    params[i] = item.to_modify[i];
                }
                _t.modify(params, function (err, res) {
                    if (err) return cb(new MyError('Не удалось изменить трейт',{params : params, err : err, item:item}));
                    cb(null);
                });
            }, cb);
        },
        getGroups:function(cb){
            getGroups(null, cb);
        },
        addNew:function(cb){
            async.eachSeries(Object.keys(msaccess_traits_obj), function(key, cb){
                var msaccess_trait = msaccess_traits_obj[key];
                if (msaccess_trait.is_exist) return cb(null);
                async.series({
                    getOrAddGroup:function(cb){
                        if (groups_obj_msaccess[msaccess_trait.Group_ID]) return cb(null);
                        // Иначе импортируем из msaccess Group
                        var q = 'select * from `Groups` where Group_ID = ' + pool.escape(msaccess_trait.Group_ID);
                        msAccess.query({q:q}, function(err, res){
                            if (err) return cb(new MyError('Не удалось получить Groups из внешней базы',{err:err, q:q}));
                            if (!res.length) return cb(new MyError('Во внешней базе нет такой Groups',{q:q}));
                            var group = res[0];
                            // Обновим нужный таксон, проставим is_group = true и msaccess_group_id
                            // перезагрущим groups_obj_msaccess
                            var group_taxon;
                            async.series({
                                getTaxon:function(cb){
                                    var params = {
                                        param_where:{
                                            msaccess_taxon_id:group.Taxon_ID
                                        },
                                        columns:['id','msaccess_group_id'],
                                        collapseData:false
                                    };
                                    var o = {
                                        command:'get',
                                        object:'Taxon',
                                        params:{
                                            param_where:{
                                                msaccess_taxon_id:group.Taxon_ID
                                            },
                                            columns:['id','msaccess_group_id'],
                                            collapseData:false
                                        }
                                    };

                                    if (group.Taxon_ID === 1 || group.Group_name === 'Life'){
                                        delete o.params.param_where.msaccess_taxon_id;
                                        o.params.param_where.level = 0;
                                    }
                                    _t.api(o, function (err, res) {
                                        if (err) return cb(new MyError('Не удалось получить таксон по msaccess_taxon_id или нулевой',{o : o, err : err}));
                                        if (res.length > 1) return cb(new MyError('В системе слишком много таксонов с одинаковым msaccess_taxon_id или нулевых', {o:o, res:res}));
                                        if (!res.length) return cb(new MyError('Таксон с таким msaccess_taxon_id еще не загружен в систему. Или нет нулевого таксона. Возможно надо загрузить ветку более высокого уровня.',{o:o}));
                                        group_taxon = res[0];
                                        cb(null);
                                    });
                                },
                                setIsGroupToTaxon:function(cb){
                                    var params = {
                                        id:group_taxon.id,
                                        is_group:true,
                                        msaccess_group_id:group.Group_ID,
                                        msaccess_group_name:group.Group_name,
                                        rollback_key:rollback_key
                                    };
                                    var o = {
                                        command:'modify',
                                        object:'Taxon',
                                        params:{
                                            id:group_taxon.id,
                                            is_group:true,
                                            msaccess_group_id:group.Group_ID,
                                            msaccess_group_name:group.Group_name,
                                            rollback_key:rollback_key
                                        }
                                    };

                                    _t.api(o, function (err, res) {
                                        if (err) return cb(new MyError('Не удалось изменить таксон, проставить msaccess_group_id',{o : o, err : err}));
                                        getGroups(null, cb);
                                    });
                                }
                            }, cb);
                        });
                    },
                    addTrait:function(cb){

                        var o = {
                            command:'add',
                            object:'taxon_avalible_trait',
                            params:{
                                taxon_id:groups_obj_msaccess[msaccess_trait.Group_ID].id,
                                msaccess_trait_id:msaccess_trait.Trait_ID,
                                name:msaccess_trait.Trait_name,
                                definition:msaccess_trait.definition,
                                definition_de:msaccess_trait.Definition_german,
                                definition_bahasa:msaccess_trait.Definition_bahasa,
                                trait_type2_sysname:msaccess_trait.Trait_type_name,
                                trait_order:msaccess_trait.order,
                                sort_no:msaccess_trait.order,
                                rollback_key:rollback_key
                            }
                        };
                        switch (msaccess_trait.Data_type){
                            case "num":
                                o.params.trait_type_sysname = 'INTEGER';
                                break;
                            case "text":
                                o.params.trait_type_sysname = 'TEXT';
                                break;
                            case "choice":
                                o.params.trait_type_sysname = 'SELECT';
                                break;
                            default:
                                return cb(null);
                                break;
                        }
                        if (o.params.trait_type_sysname !== 'SELECT'){
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось добавить taxon_avalible_trait',{o : o, err : err}));
                                msaccess_trait.taxon_avalible_trait_id = res.id;
                                // avalible_traits_obj_msaccess[msaccess_trait.msaccess_trait_value.Trait_ID] = {id:res.id};
                                msaccess_trait.taxon_avalible_trait_alias = res.alias;
                                return cb(null);
                            });
                        }else{
                            // Запросим все значения справочника и нафигачим ими свой справочник
                            async.series({
                                addAvailibleTrait:function(cb){
                                    _t.api(o, function (err, res) {
                                        if (err) return cb(new MyError('Не удалось добавить taxon_avalible_trait',{o : o, err : err}));
                                        msaccess_trait.taxon_avalible_trait_id = res.id;
                                        // avalible_traits_obj_msaccess[item.msaccess_trait_value.Trait_ID] = {id:res.id};
                                        msaccess_trait.taxon_avalible_trait_alias = res.alias;
                                        cb(null);
                                    });
                                },
                                getListOfValues:function(cb){
                                    var q = 'select * from `ALL_TRAIT_VALUES` where Trait_ID = ' + pool.escape(msaccess_trait.Trait_ID);
                                    msAccess.query({q:q}, function(err, res){
                                        if (err) return cb(new MyError('Не удалось получить список ALL_TRAIT_VALUES из внешней базы',{err:err, q:q}));
                                        async.eachSeries(res, function(one_val, cb){
                                            var o = {
                                                command:'add',
                                                object:msaccess_trait.taxon_avalible_trait_alias,
                                                params:{
                                                    taxon_avalible_trait_id:msaccess_trait.taxon_avalible_trait_id,
                                                    msaccess_value_id:one_val.Trait_value,
                                                    name:one_val.Trait_value_name,
                                                    value2:one_val.Trait_value_ID,
                                                    definition:one_val.definition,
                                                    definition_de:one_val.definition_german,
                                                    definition_bahasa:one_val.definition_bahasa,
                                                    rollback_key:rollback_key
                                                }
                                            };
                                            _t.api(o, function (err, res) {
                                                if (err) return cb(new MyError('Не удалось добавить значение в справочник',{o : o, err : err}));
                                                // Запишем все добавленные элементы списка в массив valuse с ключем по Trait_value_ID (msaccess)
                                                // if (!item.msaccess_trait_value.values) item.msaccess_trait_value.values = {};
                                                // item.msaccess_trait_value.values[one_val.Trait_value_ID] = res.id;
                                                // if (item.msaccess_trait_value.Trait_value === one_val.Trait_value_ID){
                                                //     item.msaccess_trait_value.value_id = res.id;
                                                // }
                                                cb(null);
                                            });
                                        }, cb);
                                    });
                                }
                            }, cb);

                        }

                    }
                }, cb);
            }, cb);
        }
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

/**
 * Возвращает только те trait которые применимы для переданного списка таксонов
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.getActiveForTaxa = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    async.series({

    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{traits:traits}));
    });
};


Model.prototype.getMeasurementIntoTCE = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    // console.log('obj', obj);
    // process.exit()
    _t.get({...obj, fromClient:false}, cb)
};

Model.prototype.exampleGet = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    async.series({

    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{traits:traits}));
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
