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
Model.prototype.removeCascadePrototype = Model.prototype.removeCascade;
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
    var plot_id = +obj.plot_id;
    if (isNaN(+plot_id)) return cb(new MyError('Не передан plot_id',{obj:obj}));

    var plot_factor_type_sysname = obj.plot_factor_type_sysname;
    if (!plot_factor_type_sysname && !obj.plot_factor_type_id) return cb(new UserError('Please, select factor type', {obj:obj}));

    if (!obj.name) return cb(new UserError('Factor name is not defined'));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    // Если тип = select, то необходимо сформировать уникальный альяс, создать таблицу в базе синхронизировать класс, записать в sub_table_name альяс
    // If type = select, then it is necessary to create a unique alias, create a table in the database, synchronize the class, write to sub_table_name alias


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
            if (err) return cb(new MyError('Не удалось получить количество свойств с sub_table_name = ' + alias,{params : params, err : err})); // Failed to get the number of properties with sub_table_name =
            if (!res.count) return cb(null, alias);
            var o = {
                alias:alias_orig + funcs.guidShort(),
                alias_orig:alias_orig
            };
            getUniqueAlias(o, cb);
        });
    };

    var name_cut = obj.name.replace(/\W/ig,'_').substr(0,21).toLowerCase();
    var alias = 'plot_factor_sub_table_select_' + name_cut;
    var plot_factor_type;


    async.series({
        getPlotFactorTypeSysname:function(cb){
            if (plot_factor_type_sysname) return cb(null); // Уже передан / Already transferred
            var o = {
                command:'getById',
                object:'plot_factor_type',
                params:{
                    id:obj.plot_factor_type_id,
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить plot_factor_type',{o : o, err : err})); // Could not get
                plot_factor_type = res[0];
                plot_factor_type_sysname = plot_factor_type.sysname;
                cb(null);
            });

        },
        ifSelectCreateStructure:function(cb){
            if (plot_factor_type_sysname !== 'SELECT') return cb(null);

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
                        checkPlotFactor:function(cb){
                            var params = {
                                param_where:{
                                    name:obj.name,
                                    plot_id:plot_id
                                }
                            };
                            _t.getCount(params, function (err, res) {
                                if (err) return cb(new MyError('Не удалось проверить уникальность параметра',{params : params, err : err})); // Unable to verify the uniqueness of the parameter
                                if (res.count) return cb(new UserError('Plot factor with this name already exist for this plot.',{params:params}));
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
                                if (err) return cb(new MyError('Не удалось посчитать записи в class_profile',{o : o, err : err})); // Could not count records in class_profile
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
                            server_parent_table:'plot_factor',
                            server_parent_key:'plot_factor_id'
                        },
                        structure:{
                            id : { type: "bigint", length: "20", notNull: true, autoInc: true, primary_key: true, "quick_search_field":true},
                            plot_factor_id: { type: "bigint", length: "20", "quick_search_field":true, "required":true},
                            plot_id : {type: "bigint", length: "20", from_table: "plot_factor_value", keyword: "plot_factor_id", return_column: "plot_id", is_virtual: true, visible: false, "quick_search_field":true},
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
                            var filePath = './models/system/' + another_tables_name + '/plot_factor_sub_table_select.json';
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
                                        if (err) return cb(new MyError('не удалось записать данные в json файл',{err:err, obj:obj})); // could not write data to json file
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
                                if (err) return cb(new MyError('Не удалось создать Class_profile для ' + alias,{o : o, err : err})); // Could not create Class_profile for
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
                                if (err) return cb(new MyError('Не удалось создать таблицу в базе',{o : o, err : err})); // Could not create table in database
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
                                        menu_item:'plot_factor_selects'
                                    },
                                    fromClient:false,
                                    collapseData:false
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err){
                                    console.log('Не удалось создать пункт меню. Ошибка при получении menu menu_item=plot_factor_selects',err); // Could not create menu item. Error getting menu menu_item = plot_factor_selects
                                    return cb(null);
                                }
                                if (!res.length){
                                    console.log('Не удалось создать пункт меню. В системе не заведено родительское меню menu_item=plot_factor_selects'); // Could not create menu item. The system does not have a parent menu menu_item = plot_factor_selects
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
                                    menu_item:'plot_factor_' + alias,
                                    name:obj.name,
                                    class_name:alias,
                                    parent_id:menu.id,
                                    menu_type:'item',
                                    is_visible:true
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) {
                                    console.log('Не удалось создать пункт меню. Ошибка при добавлении.',err); // Could not create menu item. Error while adding.
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

Model.prototype.setValue = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj})); // Not passed to id
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var plot_factor, plot_factor_value, plot_factor_type;
    var sub_table_record;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить plot_factor.',{id:id,err:err})); // Could not get
                plot_factor = res[0];
                cb(null);
            });
        },
        getOrCreate:function(cb){
            var o = {
                command:'get',
                object:'plot_factor_value',
                params:{
                    param_where:{
                        plot_factor_id:id,
                        plot_id:+obj.plot_id || plot_factor.plot_id
                    },
                    limit:100000000,
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить plot_factor_value',{o : o, err : err})); // Could not get plot_factor_value
                if (res.length > 1) return cb(new UserError('Слишком много значений для данного свойства и для данного плота',{o:o, res:res})); // Too many values for this property and for this plot
                plot_factor_value = res[0];
                if (!plot_factor_value) {
                    // create and get value
                    var o = {
                        command:'add',
                        object:'plot_factor_value',
                        params:{
                            plot_factor_id:id,
                            plot_id:+obj.plot_id || plot_factor.plot_id,
                            rollback_key:rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось создать plot_factor_value',{o : o, err : err})); // Could not create plot_factor_value
                        var o = {
                            command:'getById',
                            object:'plot_factor_value',
                            params:{
                                id:res.id,
                                collapseData:false
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось получить только что созданный plot_factor_value',{o : o, err : err})); // Could not get the just created plot_factor_value
                            plot_factor_value = res[0];
                            cb(null);
                        });
                    });
                }else{
                    return cb(null);
                }
            });

        },
        getType:function(cb){
            var o = {
                command:'getById',
                object:'plot_factor_type',
                params:{
                    id:plot_factor.plot_factor_type_id,
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить plot_factor_type',{o : o, err : err})); // Could not get
                plot_factor_type = res[0];
                cb(null);
            });
        },
        getOrCreateSubTableRecord:function(cb){
            if (!plot_factor_type.sub_table_name) return cb(new MyError('Для данного plot_factor_type не указан sub_table_name', {trait_type:plot_factor_type})); // For this plot_factor_type, sub_table_name is not specified
            var o = {
                command:'get',
                object:plot_factor_type.sub_table_name,
                params:{
                    param_where:{
                        plot_factor_value_id:plot_factor_value.id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить ' + plot_factor_type.sub_table_name,{o : o, err : err})); // Could not get
                if (res.length > 1) return cb(new UserError('Слишком много значений ' + taxon_trait_sub_table_integer + 'для данного plot_factor_value_id',{o:o, res:res}));  // Too many values
                sub_table_record = res[0];
                if (!sub_table_record) {
                    // create and get
                    var o = {
                        command:'add',
                        object:plot_factor_type.sub_table_name,
                        params:{
                            plot_factor_value_id:plot_factor_value.id,
                            rollback_key:rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось создать ' + plot_factor_type.sub_table_name,{o : o, err : err})); // Could not create
                        var o = {
                            command:'getById',
                            object:plot_factor_type.sub_table_name,
                            params:{
                                id:res.id,
                                collapseData:false
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось получить только что созданный ' + plot_factor_type.sub_table_name,{o : o, err : err})); // Could not get the newly created
                            sub_table_record = res[0];
                            cb(null);
                        });
                    });
                }else{
                    return cb(null);
                }
            });

        },
        set:function(cb){
            var o = {
                command:'modify',
                object:plot_factor_type.sub_table_name,
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
                if (err) return cb(new MyError('Не удалось установить значение для plot_factor_type.sub_table_name',{o : o, err : err})); // Could not set value for

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
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'setValue', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });
};

Model.prototype.setValueByList = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    async.eachSeries(obj.list, function (item, cb) {

        var params = {
            id: item.id,
            plot_id: item.plot_id,
            value1: item.value1,
            value2: item.value2
        };

        _t.setValue(params, cb);

    }, function (err) {
        if (err) return cb(err);
        cb(null, new UserOk('Ok'));
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