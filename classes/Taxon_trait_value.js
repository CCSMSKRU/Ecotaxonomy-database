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
Model.prototype.removePrototype = Model.prototype.remove;


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
        add:function(cb){
            obj.rollback_key = rollback_key;
            _t.addPrototype(obj, function(err, res){
                if (err) return cb(err);
                id = res.id;
                cb(null, res);
            });
        },
        setHasParameters:function(cb){
            // set to true
            var o = {
                command:'modify',
                object:'Taxon',
                params:{
                    id:obj.taxon_id,
                    has_parameters:true,
                    rollback_key:rollback_key
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось установить has_parameters',{o : o, err : err})); //  Could not set
                cb(null);
            });
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, res.add);
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
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    let trait;

    async.series({
        modify: function (cb) {
            obj.rollback_key = rollback_key;
            _t.modifyPrototype(obj, cb);
        },
        setHasParameters: function (cb) {
            _t.setHasParameters({id: id, rollback_key: rollback_key}, function (err, res) {
                if (err) return cb(new MyError('Не удалось установить статистику.', {err: err, id: id})); // Could not set statistic
                cb(null);
            });
        }
    }, function (err, res) {
        if (err) return cb(err);
        cb(null, res.modify);
    });
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

Model.prototype.remove_ = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;

    if (isNaN(+id)) {
        return cb(new MyError('Не передан id (removeCascade_ Taxon_trait_value)',{obj:obj}));
    }
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var t_value;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить Taxon_trait_value.',{id:id,err:err}));  // Could not get
                t_value = res[0];
                cb(null);
            });
        },
        remove:function(cb){
            obj.rollback_key = rollback_key;
            _t.removePrototype(obj, cb);
        },
        setHasParameters:function(cb){
            _t.setHasParameters({taxon_id:t_value.taxon_id, rollback_key:rollback_key}, function(err, res){
                if (err) return cb(new MyError('Не удалось установить статистику.',{err:err, taxon_id:t_value.taxon_id})); // Could not set statistic
                cb(null);
            });
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, res.removeCascade);
    });
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


/**
 * Считает есть ли значения для указаного таксона в таблице значений. Если есть, то устанавливает парамерт has_parameters для таксона, иначе снимает
 * Does it count for the indicated taxon in the value table. If there is, then sets the has_parameters parameter for the taxon, otherwise removes
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.setHasParameters = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    var taxon_id = obj.taxon_id;
    if (isNaN(+id) && isNaN(+taxon_id)) return cb(new MyError('Не передан taxon_id or id',{obj:obj})); // Not passed to id
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var t_value, taxon;
    var cnt = 0;
    var t_values;
    async.series({
        get:function(cb){
            if (taxon_id) return cb(null);
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить Taxon_trait_value.',{id:id,err:err}));  // Could not get
                t_value = res[0];
                cb(null);
            });
        },
        getTaxon:function(cb){
            var o = {
                command:'get',
                object:'Taxon',
                params:{
                    id:taxon_id || t_value.taxon_id
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить Taxon.',{o : o, err : err})); // Could not get
                if (!res.length) return cb(null);// Вероятно таксон удален
                taxon = res[0];
                cb(null);
            });
        },
        getCount: function(cb){
            if (taxon) return cb(null);
            // Здесь не надо ставить условие по taxon_gender_sysname, так как мы смотрим есть ли вообще какие либо параметры.
            // There is no need to set the taxon_gender_sysname condition, since we are looking at whether there are any parameters at all.
            var params = {
                param_where:{
                    taxon_id:taxon_id || t_value.taxon_id
                },
                limit:1000000000,
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить Taxon_trait_value',{params : params, err : err})); // Could not count
                t_values = res;
                cb(null);
            });
        },
        getSettedValues:function(cb){
            if (taxon) return cb(null);
            if (!t_values.length) return cb(null);
            // Split By types and get all setted values
            var trait_type_sub_table_name_obj = {};
            for (var i in t_values) {
                if (!trait_type_sub_table_name_obj[t_values[i].trait_type_sub_table_name]) trait_type_sub_table_name_obj[t_values[i].trait_type_sub_table_name] = [];
                trait_type_sub_table_name_obj[t_values[i].trait_type_sub_table_name].push(t_values[i].id);
            }
            async.eachSeries(Object.keys(trait_type_sub_table_name_obj), function(sub_table_name, cb){
                if (cnt) return cb(null); // Мы уже знаем что значение есть / We already know that the value is
                var o = {
                    command:'getCount',
                    object:sub_table_name,
                    params:{
                        where:[
                            {
                                key:'taxon_trait_value_id',
                                type:'in',
                                val1:trait_type_sub_table_name_obj[sub_table_name]
                            }
                        ]
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось посчитать реальные значения',{o : o, err : err})); // Failed to calculate real values
                    cnt += res.count;
                    cb(null);
                });
            }, cb);
        },
        setFlag:function(cb){
            if (!taxon) return cb(null);
            if (!!cnt === taxon.has_parameters) return cb(null); // Уже установлен / Already setted
            var o = {
                command:'modify',
                object:'Taxon',
                params:{
                    id:taxon.id,
                    has_parameters:!!cnt,
                    rollback_key:rollback_key
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось установить has_parameters',{o : o, err : err})); //  Could not set
                cb(null);
            });

        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
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


// var o = {
//     command:'setHasParametersToAll',
//     object:'taxon_trait_value',
// };
// socketQuery(o, function(r){
//     console.log(r);
// });
/**
 * Set has_parameters to ALL
 * @param obj
 * @param cb
 */
Model.prototype.setHasParametersToAll = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var t_values;
    async.series({
        getAll:function(cb){
            var params = {
                limit:10000000000,
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon_trait_value all',{params : params, err : err})); //Could not get
                t_values = res;
                cb(null);
            });
        },
        set:function(cb){
            if (!t_values) return cb(null);
            async.eachSeries(t_values, function(item, cb){
                _t.setHasParameters({id:item.id},function(err, res){
                    if (err){
                        console.log('could not set hasParam to taxon', err);
                        return cb(null); // Ignore err
                    }
                    cb(null);
                })
            }, cb);
        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
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
            if (err.message == 'needConfirm') return cb(err);
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