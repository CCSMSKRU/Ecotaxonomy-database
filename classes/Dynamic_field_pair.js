/**
 * Created by iig on 29.10.2015.
 */
var MyError = require('../error').MyError
var UserError = require('../error').UserError
var UserOk = require('../error').UserOk
var BasicClass = require('./system/BasicClass')
var util = require('util')
var async = require('async')
var rollback = require('../modules/rollback')
var funcs = require('../libs/functions')

var Model = function(obj) {
    this.name = obj.name
    this.tableName = obj.name.toLowerCase()

    var basicclass = BasicClass.call(this, obj)
    if (basicclass instanceof MyError) return basicclass
}
util.inherits(Model, BasicClass)
Model.prototype.getPrototype = Model.prototype.get
Model.prototype.addPrototype = Model.prototype.add
Model.prototype.modifyPrototype = Model.prototype.modify
Model.prototype.removeCascadePrototype = Model.prototype.removeCascade
Model.prototype.getForSelectPrototype = Model.prototype.getForSelect

Model.prototype.init = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb')
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'))
    var _t = this
    Model.super_.prototype.init.apply(this, [obj, function(err) {
        cb(null)
    }])
}

Model.prototype.get = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    var _t = this
    var client_object = _t.client_object || ''

    var coFunction = 'get_' + client_object
    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb)
    } else {
        if (typeof _t['get_'] === 'function') {
            _t['get_'](obj, cb)
        } else {
            _t.getPrototype(obj, cb)
        }
    }
}

Model.prototype.add = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    var _t = this
    var client_object = _t.client_object || ''

    var coFunction = 'add_' + client_object
    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb)
    } else {
        if (typeof _t['add_'] === 'function') {
            _t['add_'](obj, cb)
        } else {
            _t.addPrototype(obj, cb)
        }
    }
}

Model.prototype.modify = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    var _t = this
    var client_object = _t.client_object || ''

    var coFunction = 'modify_' + client_object

    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb)
    } else {
        if (typeof _t['modify_'] === 'function') {
            _t['modify_'](obj, cb)
        } else {
            _t.modifyPrototype(obj, cb)
        }
    }
}

Model.prototype.removeCascade = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    var _t = this
    var client_object = _t.client_object || ''

    var coFunction = 'removeCascade_' + client_object

    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb)
    } else {
        if (typeof _t['removeCascade_'] === 'function') {
            _t['removeCascade_'](obj, cb)
        } else {
            _t.removeCascadePrototype(obj, cb)
        }
    }
}

Model.prototype.getForSelect = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    var _t = this
    var client_object = _t.client_object || ''

    var coFunction = 'getForSelect_' + client_object
    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb)
    } else {
        if (typeof _t['getForSelect_'] === 'function') {
            _t['getForSelect_'](obj, cb)
        } else {
            _t.getForSelectPrototype(obj, cb)
        }
    }
}


Model.prototype.add_ = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    var _t = this
    var source_class_id = obj.source_class_id
    if (isNaN(+source_class_id)) return cb(new UserError('Необходимо выбрать класс', {obj: obj}))
    var target_client_object_id = obj.target_client_object_id
    if (isNaN(+target_client_object_id)) return cb(new UserError('Необходимо выбрать клиентский объект', {obj: obj}))
    var rollback_key = obj.rollback_key || rollback.create()
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key

    var class_profile, client_object_profile
    async.series({
        getClass: function(cb) {
            var o = {
                command: 'getById',
                object: 'class_profile',
                params: {
                    id: source_class_id,
                    collapseData: false
                }
            }
            _t.api(o, function(err, res) {
                if (err) return cb(new MyError('Не удалось получить class_profile для получения имени класса ', {
                    o: o,
                    err: err
                }))
                class_profile = res[0]
                cb(null)
            })
        },
        getCO: function(cb) {
            var o = {
                command: 'getById',
                object: 'client_object_profile',
                params: {
                    id: target_client_object_id,
                    collapseData: false
                }
            }
            _t.api(o, function(err, res) {
                if (err) return cb(new MyError('Не удалось получить client_object_profile для получения имени класса ', {
                    o: o,
                    err: err
                }))
                client_object_profile = res[0]
                cb(null)
            })
        },
        add: function(cb) {
            obj.rollback_key = rollback_key
            obj.name = obj.name || class_profile.name + ' <==> ' + client_object_profile.name
            _t.addPrototype(obj, function(err, res) {
                return cb(err, res)
            })
        }
    }, function(err, res) {
        if (err) return cb(err)
        cb(null, new UserOk('Ок', res.add))
    })
}

Model.prototype.removeCascade_ = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    var _t = this
    var id = obj.id
    if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}))
    var rollback_key = obj.rollback_key || rollback.create()
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key

    // Удалить, очистить кеш
    var row
    async.series({
        get: (cb) => {
            _t.getById({id: id}, function(err, res) {
                if (err) return cb(new MyError('Не удалось получить .', {id: id, err: err}))
                row = res[0]
                cb(null)
            })
        },
        remove: (cb) => {
            _t.removeCascadePrototype(obj, cb)
        },
        clear: (cb) => {
            var name = String(row.source_class)
            name = name.charAt(0).toUpperCase() + name.substr(1)
            for (var j in global.classes) {
                if (j.substr(0, name.length + 3) === name + '_-_') {
                    delete global.classes[j]
                }
            }
            cb(null)
        }
    }, function(err, res) {
        if (err) {
            rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function(err2) {
                return cb(err, err2)
            })
        } else {
            // if (!doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'removeCascade', params:obj});
            // }
            cb(null, new UserOk('Ок'))
        }
    })
}

// var o = {
//     command:'sync',
//     object:'Dynamic_field_pair',
//     params:{
//         id:4
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// });
Model.prototype.sync = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    var _t = this
    var id = obj.id
    if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}))
    var source_id = obj.source_id
    if (isNaN(+source_id)) return cb(new MyError('Не передан source_id', {obj: obj}))
    var rollback_key = obj.rollback_key || rollback.create()
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key
    var doNotClearCache = obj.doNotClearCache

    const classesToClearCache = []

    var dynamic_field_pair
    var source_row
    var dynamic_field
    let isModified
    let modified_fields = []
    async.series({
        get: function(cb) {
            _t.getById({id: id}, function(err, res) {
                if (err) return cb(new MyError('Не удалось получить dynamic_field_pair.', {id: id, err: err}))
                dynamic_field_pair = res[0]
                cb(null)
            })
        },
        getSourceRow: function(cb) {
            var o = {
                command: 'getById',
                object: dynamic_field_pair.source_class,
                params: {
                    id: source_id
                }
            }
            _t.api(o, function(err, res) {
                if (err) return cb(new MyError('Не удалось получить source_class: ' + dynamic_field_pair.source_class, {
                    o: o,
                    err: err
                }))
                source_row = res[0]
                cb(null)
            })
        },
        getDynamicField: function(cb) {
            if (!source_row) return cb(new MyError('source_row is not found', {obj: obj}))
            var o = {
                command: 'get',
                object: 'dynamic_field',
                params: {
                    param_where: {
                        id_from_source: source_row.id,
                        dynamic_field_pair_id: dynamic_field_pair.id
                    },
                    collapseData: false
                }
            }
            _t.api(o, function(err, res) {
                if (err) return cb(new MyError('Не удалось получить dynamic_field', {o: o, err: err}))
                if (!res.length) return cb(null)
                dynamic_field = res[0]
                cb(null)
            })
        },
        modify: function(cb) {
            if (!dynamic_field) return cb(null)
            var fieldsToModify = ['name', 'min_value1', 'max_value1', 'value1_step', 'min_value2', 'max_value2', 'value2_step']
            var o = {
                command: 'modify',
                object: 'dynamic_field',
                params: {
                    id: dynamic_field.id,
                    rollback_key: rollback_key,
                    doNotClearCache: true
                }
            }
            // var anotherFieldKeys = {};
            // if (dynamic_field_pair.field_type_sysname_key){
            //     anotherFieldKeys['type_sysname'] = dynamic_field_pair.field_type_sysname_key;
            // }
            for (var i in fieldsToModify) {
                if (typeof source_row[fieldsToModify[i]] === 'undefined') continue
                if (dynamic_field[fieldsToModify[i]] == source_row[fieldsToModify[i]]) continue
                o.params[fieldsToModify[i]] = source_row[fieldsToModify[i]]
                modified_fields.push(fieldsToModify[i])
            }
            // if (Object.keys(o.params).length === 2) return cb(null)
            if (!modified_fields.length) return cb(null)
            _t.api(o, function(err, res) {
                if (err) return cb(new MyError('Не удалось изменить dynamic_field', {o: o, err: err}))
                modified_fields.forEach(one => {
                    dynamic_field[one] = o.params[one]
                })

                isModified = true
                cb(null)
            })
        },
        add: function(cb) {
            if (dynamic_field) return cb(null)
            var o = {
                command: 'add',
                object: 'dynamic_field',
                params: {
                    dynamic_field_pair_id: dynamic_field_pair.id,
                    id_from_source: source_row.id,
                    name: source_row.name,
                    type_sysname: source_row[dynamic_field_pair.field_type_sysname_key] || obj.type_sysname || source_row.type_sysname || ((obj.type_sysname_key) ? source_row[obj.type_sysname_key] : undefined),
                    rollback_key: rollback_key
                }
            }
            _t.api(o, function(err, res) {
                if (err) return cb(new MyError('Не удалось добавить dynamic_field', {o: o, err: err}))
                dynamic_field = {
                    id: res.id,
                    isNotLoaded:true
                }
                isModified = true
                cb(null)
            })
        },
        sync: function(cb) {
            if (!isModified) return cb(null)
            var o = {
                command: 'sync',
                object: 'dynamic_field',
                params: {
                    id: dynamic_field.id,
                    dynamic_field:dynamic_field.isNotLoaded? null : dynamic_field,
                    source_row,
                    modified_fields: modified_fields.length ? modified_fields : null,
                    doNotClearCache: true
                }
            }
            _t.api(o, function(err, res) {
                if (err) return cb(new MyError('Не удалось синхронизировать dynamic_field', {o: o, err: err}))
                if (res.classToClearCache) classesToClearCache.push(res.classToClearCache)
                cb(null)
            })
        },
        removeNotUsed: function(cb) {
            _t.removeNotUsed({}, cb)
        },
        clearCache: cb => {
            cb(null)
            if (doNotClearCache) return
            _t.clearCache({}, () => {
            })
        }
    }, function(err, res) {
        if (err) {
            if (doNotSaveRollback) return cb(err)
            rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function(err2) {
                return cb(err, err2)
            })
        } else {
            //if (!doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            //}
            cb(null, new UserOk('Ок', classesToClearCache))
        }
    })
}

Model.prototype.syncForSourceByList = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    var _t = this
    var source_id = obj.source_id
    if (isNaN(+source_id)) return cb(new MyError('Не передан source_id', {obj: obj}))
    var rollback_key = obj.rollback_key || rollback.create()
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key

    const list = obj.list
    if (!list) return cb(new MyError('Не передан list', {obj: obj}))
    let classesToClearCache


    async.series({
        do: cb => {
            async.eachSeries(list, (id, cb) => {
                let params = {
                    source_id,
                    id: id,
                    rollback_key,
                    doNotSaveRollback: true,
                    doNotClearCache: true
                }
                _t.sync(params, (err, res) => {
                    if (err) return cb(err)
                    classesToClearCache = res.classesToClearCache
                    cb(null)
                })
            }, cb)
        },
        clearCaches: cb => {
            cb(null)
            if (Array.isArray(classesToClearCache)) {
                classesToClearCache.forEach(one => {
                    var o = {
                        command: '_clearCache',
                        object: one,
                        params: {}
                    }
                    _t.api(o, cb)
                })
            }
            _t.clearCache({}, null)
        }
    }, function(err, res) {
        if (err) {
            if (doNotSaveRollback) return cb(err)
            rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function(err2) {
                return cb(err, err2)
            })
        } else {
            //if (!doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            //}
            cb(null, new UserOk('Ок'))
        }
    })
}


// var o = {
//     command:'removeNotUsed',
//     object:'Dynamic_field_pair',
//     params:{}
// };
// socketQuery(o, function(r){
//     console.log(r);
// });

Model.prototype.removeNotUsed = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    var _t = this
    var rollback_key = obj.rollback_key || rollback.create()
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key
    var all_dynamic_field_ids = []
    var to_remove_CO_fields_ids = []

    async.series({
        removeUnusedFields: function(cb) {
            async.series({
                getAllDynFields: function(cb) {
                    var o = {
                        command: 'get',
                        object: 'dynamic_field',
                        params: {
                            collapseData: false,
                            limit: 100000000,
                        }
                    }
                    _t.api(o, function(err, res) {
                        if (err) return cb(new MyError('Не удалось получить dynamic_field', {o: o, err: err}))
                        for (var i in res) {
                            all_dynamic_field_ids.push(res[i].id)
                        }
                        cb(null)
                    })
                },
                getCOFProfile: function(cb) {
                    if (!all_dynamic_field_ids.length) return cb(null)
                    var o = {
                        command: 'get',
                        object: 'client_object_fields_profile',
                        params: {
                            where: [
                                {
                                    key: 'dynamic_field_id',
                                    type: '!isNull'
                                },

                                {
                                    key: 'dynamic_field_id',
                                    type: '!in',
                                    val1: all_dynamic_field_ids
                                }
                            ],
                            limit: 100000,
                            collapseData: false
                        }
                    }
                    _t.api(o, function(err, res) {
                        if (err) return cb(new MyError('Не удалось получить поля КО динамические, но не используемые.', {
                            o: o,
                            err: err
                        }))
                        for (var i in res) {
                            to_remove_CO_fields_ids.push(res[i].id)
                        }
                        cb(null)
                    })
                },
                getCOFProfile2: function(cb) {
                    if (!all_dynamic_field_ids.length) return cb(null)
                    var o = {
                        command: 'get',
                        object: 'client_object_fields_profile',
                        params: {
                            where: [
                                {
                                    key: 'source_class_id',
                                    type: '!isNull'
                                },
                                {
                                    key: 'dynamic_field_id',
                                    type: 'isNull'
                                },
                            ],
                            limit: 100000,
                            collapseData: false
                        }
                    }
                    _t.api(o, function(err, res) {
                        if (err) return cb(new MyError('Не удалось получить поля КО динамические, но не используемые2.', {
                            o: o,
                            err: err
                        }))
                        for (var i in res) {
                            to_remove_CO_fields_ids.push(res[i].id)
                        }
                        cb(null)
                    })
                },
                removeAllNotUsed: function(cb) {
                    if (!to_remove_CO_fields_ids.length) return cb(null)
                    async.eachSeries(to_remove_CO_fields_ids, function(one_id, cb) {
                        var o = {
                            command: 'remove',
                            object: 'client_object_fields_profile',
                            params: {
                                id: one_id,
                                physical: true,
                                rollback_key: rollback_key
                            }
                        }
                        _t.api(o, function(err, res) {
                            if (err) return cb(new MyError('Не удалось удалить client_object_fields_profile неиспользуемые', {
                                o: o,
                                err: err
                            }))
                            cb(null)
                        })
                    }, cb)
                }
            }, cb)
        }
    }, function(err, res) {
        if (err) {
            if (doNotSaveRollback) return cb(err)
            rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function(err2) {
                return cb(err, err2)
            })
        } else {
            //if (!doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            //}
            cb(null, new UserOk('Ок'))
        }
    })
}

Model.prototype.sync_all = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    var _t = this
    var id = obj.id
    if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}))
    var rollback_key = obj.rollback_key || rollback.create()
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key

    var pair
    var source_ids
    async.series({
        get: cb => {
            _t.getById({id: id}, function(err, res) {
                if (err) return cb(new MyError('Не удалось получить пару.', {id: id, err: err}))
                pair = res[0]
                cb(null)
            })
        },
        getAllSourceRows: cb => {
            if (!pair) return cb(null)
            var o = {
                command: 'get',
                object: pair.source_class,
                params: {
                    columns: ['id'],
                    limit: 1000000000,
                    collapseData: false
                }
            }
            _t.api(o, (err, res) => {
                if (err) return cb(new MyError('Не удалось получить id записей источника (свойств)', {o: o, err: err}))
                source_ids = res.map(one => one.id)
                cb(null)
            })

        },
        sync: cb => {
            if (!source_ids) return cb(null)
            async.eachSeries(source_ids, function(one_id, cb) {
                var o = {
                    command: 'sync',
                    object: 'dynamic_field_pair',
                    params: {
                        source_id: one_id,
                        id: pair.id
                    }
                }
                _t.api(o, function(err, res) {
                    if (err) return cb(new MyError('Не удалось синхронизировать поле с парой динамических полей', {
                        o: o,
                        pair: pair,
                        err: err
                    })) // Could not sync added field with a pair of dynamic fields
                    cb(null)
                })
            }, cb)
        }
    }, function(err, res) {
        if (err) {
            if (doNotSaveRollback) return cb(err)
            rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function(err2) {
                return cb(err, err2)
            })
        } else {
            //if (!doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            //}
            cb(null, new UserOk('Ок'))
        }
    })
}


Model.prototype.example = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    var _t = this
    var id = obj.id
    if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}))
    var rollback_key = obj.rollback_key || rollback.create()
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key

    async.series({}, function(err, res) {
        if (err) {
            if (doNotSaveRollback) return cb(err)
            rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function(err2) {
                return cb(err, err2)
            })
        } else {
            //if (!doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            //}
            cb(null, new UserOk('Ок'))
        }
    })
}

module.exports = Model
