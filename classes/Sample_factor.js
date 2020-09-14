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
Model.prototype.removePrototype = Model.prototype.remove;
Model.prototype.getForSelectPrototype = Model.prototype.getForSelect;

Model.prototype.init = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb'); // The method is not passed to cb
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj')); // The method is not passed to obj
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

    var type_sysname = obj.type_sysname;
    if (!type_sysname && !obj.type_id) return cb(new MyError('Не передан тип (type_sysname)', {obj:obj}));

    if (!obj.name) return cb(new UserError('Sample factor name is not defined'));
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
    var alias = 'sample_factor_sub_table_select_' + name_cut;

    var id;
    async.series({
        getTypeSysname:function(cb){
            if (type_sysname) return cb(null); // Уже передан /already passed
            var o = {
                command:'getById',
                object:'sample_factor_type',
                params:{
                    id:obj.type_id,
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить sample_factor_type',{o : o, err : err}));
                type_sysname = res[0].sysname;
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
                        checkUnique:function(cb){
                            var params = {
                                param_where:{
                                    name:obj.name
                                }
                            };
                            _t.getCount(params, function (err, res) {
                                if (err) return cb(new MyError('Не удалось проверить уникальность параметра',{params : params, err : err}));
                                if (res.count) return cb(new UserError('Sample factor with this name already exist for this taxon.',{params:params}));
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
                            server_parent_table:'sample_factor',
                            server_parent_key:'sample_factor_id'
                        },
                        structure:{
                            id : { type: "bigint", length: "20", notNull: true, autoInc: true, primary_key: true, "quick_search_field":true},
                            sample_factor_id: { type: "bigint", length: "20", "quick_search_field":true},
                            sample_id : {type: "bigint", length: "20", from_table: "sample_factor_value", keyword: "sample_factor_id", return_column: "sample_id", is_virtual: true, visible: false, "quick_search_field":true},
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
                            var filePath = './models/system/' + another_tables_name + '/sample_factor_sub_table_select.json';
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
                                        menu_item:'sample_factor_selects'
                                    },
                                    fromClient:false,
                                    collapseData:false
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err){
                                    console.log('Не удалось создать пункт меню. Ошибка при получении menu menu_item=sample_factor_selects',err);
                                    return cb(null);
                                }
                                if (!res.length){
                                    console.log('Не удалось создать пункт меню. В системе не заведено родительское меню menu_item=sample_factor_selects');
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
                                    menu_item:'sample_factor_' + alias,
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
            _t.addPrototype(obj, function(err, res) {
                id = res.id;
                cb(null, res)
            });
        },
        linkFactorWithProject: function(cb){
            var o = {
                command: 'add',
                object: 'project_sample_factor',
                params: {
                    project_id: obj.project_for_create_id,
                    sample_factor_id: id
                }
            };

            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось создать новую project_sample_factor запись',{o : o, err : err}));
                cb(null);
            });
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

    var sample_factor;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить sample_factor.',{id:id,err:err}));
                sample_factor = res[0];
                if (sample_factor.type_sysname !== 'SELECT') return cb(new MyError('Метод доступен только для селектов'));
                cb(null);
            });
        },
        getValues:function(cb){
            var o = {
                command:'get',
                object:sample_factor.sub_table_name_for_select,
                params:{
                    // param_where:{
                    //     measurement_id:sample_factor.id
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

Model.prototype.getPictures = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}));

    var pictures;
    var sample_factor;
    async.series({
        get: function (cb) {
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить sample factor.', {id: id, err: err}));
                sample_factor = res[0];
                cb(null);
            });
        },
        getPictures: function (cb) {
            var o = {
                command: 'get',
                object: 'sample_factor_picture',
                params: {
                    where: [
                        {
                            key: 'sample_factor_id',
                            val1: sample_factor.id
                        }
                    ],
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить sample_factor_picture', {o: o, err: err}));
                pictures = res;
                cb(null);
            });
        }
    }, function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr', {pictures: pictures}));
    });
};

Model.prototype.exampleGet = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj})); // Not passed to id

    async.series({

    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{data:data}));
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