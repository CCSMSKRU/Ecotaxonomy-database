/**
 * Created by iig on 29.10.2015.
 */
var MyError = require('../error').MyError;
var UserError = require('../error').UserError;
var UserOk = require('../error').UserOk;
var BasicClass = require('./system/BasicClass');
var util = require('util');
var async = require('async');
var fs = require('fs');
var rollback = require('../modules/rollback');
var funcs = require('../libs/functions');
var moment = require('moment');
var ToExcel = require('../libs/ToExcel.js');
var XlsxTemplate = require('xlsx-template');

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

Model.prototype.getForSelect_tbl_sampleTEMP = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    // Получить локации проекта (ids)
    // Наложить default_where только по этим id

    var proj_location_ids = [];
    var row;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить row.',{id:id,err:err}));
                row = res[0];
                cb(null);
            });
        },
        getProjLocation:function(cb){
            var o = {
                command:'get',
                object:'project_location',
                params:{
                    param_where:{
                        project_id:row.project_id
                    },
                    columns:['project_id','location_id'],
                    limit:100000000,
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить project_location',{o : o, err : err}));
                for (var i in res) {
                    proj_location_ids.push(res[i].location_id);
                }
                cb(null);
            });
        },
        getForSelect:function(cb){
            if (proj_location_ids.length){
                obj.default_where = [
                    {
                        key:'id',
                        type:'in',
                        group:'default_where',
                        val1:proj_location_ids
                    }
                ]
            }
            _t.getForSelectPrototype(obj, function(err, res){
                if (err) return cb(err);
                cb(null, res);
            });

        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, res.getForSelect);
    });
};

Model.prototype.getForSelect_byProjectId = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    var event_id = obj.event_id;
    if (isNaN(+event_id)) return cb(new MyError('Не передан event_id', {obj: obj}));

    async.waterfall([
        //getSamples
        (cb) => {
            let params = {
                param_where: {
                    sampling_event_id: event_id
                },
                collapseData: false
            };

            _t.get(params, (err, res) => {
                if (err) return cb(new MyError('Не удалось получить samples', {params: params, err: err}));

                cb(null, res);
            });
        }
    ],function (err, res) {
        if (err) return cb(new UserError('Samples not found'));
        cb(null, {
            samples: res
        });
    });
};

// var o = {
//     command:'syncDataIndividual',
//     object:'Sample',
//     params:{
//         collapseData:false
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// });
/**
 * Создает или удаляет Data_individual в зависимости от указанного количества
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.syncDataIndividual = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    // Получить
    // Запросить count
    // Для каждого найти data_individual
    // Посчитать
    // Если их меньше, то добавить
    // Если больше, то удалить те которые не изменялись (updated is null). Иначе выдать ошибку
    // Изменить статус

    var sample;
    var sample_taxon_count;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить sample.',{id:id,err:err}));
                sample = res[0];
                cb(null);
            });
        },
        getCounts:function(cb){
            var o = {
                command:'get',
                object:'sample_taxon_count',
                params:{
                    param_where:{
                        sample_id:id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить sample_taxon_count',{o : o, err : err}));
                sample_taxon_count = res;
                cb(null);
            });
        },
        forEachCount:function(cb){
            async.eachSeries(sample_taxon_count, function(one_count, cb){
                var data_individual;
                var status_sysname, err_msg;
                async.series({
                    getDataIndividual:function(cb){
                        var o = {
                            command:'get',
                            object:'data_individual',
                            params:{
                                param_where:{
                                    sample_taxon_count_id:one_count.id
                                },
                                collapseData:false
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось получить data_individual',{o : o, err : err}));
                            data_individual = res;
                            cb(null);
                        });
                    },
                    add:function(cb){
                        if (data_individual.length >= one_count.individual_count) return cb(null); // Не надо ничего добавлять
                        var to_add_arr = [];
                        for (var i = data_individual.length; i < one_count.individual_count; i++){
                            to_add_arr.push(0);
                        }
                        async.eachSeries(to_add_arr, function(item, cb){

                            var name = funcs.guidShort();
                            var o = {
                                command:'add',
                                object:'data_individual',
                                params:{
                                    sample_taxon_count_id:one_count.id,
                                    name:name,
                                    name_ru:name,
                                    taxon_id:one_count.taxon_id,
                                    storage_id:one_count.storage_id,
                                    rollback_key:rollback_key
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось добавить data_individual',{o : o, err : err}));
                                status_sysname = 'SYNC_SUCCESS';
                                cb(null);
                            });

                        }, cb);
                    },
                    remove:function(cb){
                        if (data_individual.length <= one_count.individual_count) return cb(null); // Не надо ничего удалять
                        var to_remove_count = data_individual.length - one_count.individual_count;
                        var to_remove_arr = [];
                        for (var i in data_individual) {
                            if (to_remove_arr.length === to_remove_count) break;
                            if (data_individual[i].updated) continue; // Этот экземпляр уже модифицировался, его нельзя удалять
                            to_remove_arr.push(data_individual[i]);
                        }
                        if (to_remove_arr.length !== to_remove_count){
                            status_sysname = 'SYNC_ERROR';
                            err_msg = 'Not enough unmodified "Data Individual" to delete.'; // недостаточно неизмененных экземпляров для удаления
                            return cb(null);
                        }
                        async.eachSeries(to_remove_arr, function(item, cb){
                            var o = {
                                command:'removeCascade',
                                object:'data_individual',
                                params:{
                                    id:item.id,
                                    rollback_key:rollback_key
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось удалить data_individual',{o : o, err : err}));
                                cb(null);
                            });
                        }, function(err, res){
                            if (err) return cb(err);
                            status_sysname = 'SYNC_SUCCESS';
                            cb(null);
                        });
                    },
                    changeStatus:function(cb){
                        if (!status_sysname || one_count.status_sysname === status_sysname) return cb(null);
                        var o = {
                            command:'modify',
                            object:'sample_taxon_count',
                            params:{
                                id:one_count.id,
                                status_sysname:status_sysname,
                                error_msg:err_msg,
                                rollback_key:rollback_key
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось изменить статус sample_taxon_count',{o : o, err : err}));
                            cb(null);
                        });
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
            if (!doNotSaveRollback){
               rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'syncDataIndividual', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });
};

// var o = {
//     command:'test',
//     object:'Sample',
//     params:{
//         id:5
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// });

Model.prototype.test = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;
    var result_obj = {};
    async.series({
        prepare:function(cb){
            result_obj = {
                project_taxon:[
                    {
                        id:154,
                        name:'Жуки навозники',
                        groups:[
                            {
                                name:'main',
                                id:0,
                                count:0
                            },
                            {
                                name:'жуки навозники класса А',
                                isLink:true,
                                id:15,
                                count:5
                            },
                            {
                                name:'жуки навозники класса А',
                                isLink:true,
                                id:15,
                                count:5
                            },
                            {
                                name:'жуки навозники класса А',
                                isLink:true,
                                id:15,
                                count:5
                            },
                            {
                                name:'жуки навозники класса А',
                                isLink:true,
                                id:15,
                                count:5
                            },
                            {
                                name:'жуки навозники класса А',
                                isLink:true,
                                id:15,
                                count:5
                            },
                            {
                                name:'жуки навозники класса А',
                                isLink:true,
                                id:15,
                                count:5
                            },
                            {
                                name:'жуки навозники класса А',
                                isLink:true,
                                id:15,
                                count:5
                            },
                            {
                                name:'жуки навозники класса А',
                                isLink:true,
                                id:15,
                                count:5
                            },
                            {
                                name:'жуки навозники класса А',
                                isLink:true,
                                id:15,
                                count:5
                            },
                            {
                                name:'жуки навозники класса А',
                                isLink:true,
                                id:15,
                                count:5
                            },
                            {
                                name:'жуки навозники класса А',
                                isLink:true,
                                id:15,
                                count:5
                            }
                        ]
                    },
                    {
                        id:154,
                        name:'Жуки майские',
                        groups:[
                            {
                                name:'main',
                                id:0,
                                count:0
                            },
                            {
                                name:'жуки майские класса А',
                                isLink:true,
                                id:11,
                                count:1
                            }
                        ]
                    },
                    {
                        id:154,
                        name:'Жуки майские',
                        groups:[
                            {
                                name:'main',
                                id:0,
                                count:0
                            },
                            {
                                name:'жуки майские класса А',
                                isLink:true,
                                id:11,
                                count:1
                            },
                            {
                                name:'жуки майские класса А',
                                isLink:true,
                                id:11,
                                count:1
                            },
                            {
                                name:'жуки майские класса А',
                                isLink:true,
                                id:11,
                                count:1
                            }
                        ]
                    },
                    {
                        id:154,
                        name:'Жуки майские',
                        groups:[
                            {
                                name:'main',
                                id:0,
                                count:0
                            },
                            {
                                name:'жуки майские класса А',
                                isLink:true,
                                id:11,
                                count:1
                            },
                            {
                                name:'жуки майские класса А',
                                isLink:true,
                                id:11,
                                count:1
                            }
                        ]
                    },
                    {
                        id:154,
                        name:'Жуки майские',
                        groups:[
                            {
                                name:'main',
                                id:0,
                                count:0
                            },
                            {
                                name:'жуки майские класса А',
                                isLink:true,
                                id:11,
                                count:1
                            }
                        ]
                    },
                    {
                        id:154,
                        name:'Жуки майские',
                        groups:[
                            {
                                name:'main',
                                id:0,
                                count:0
                            },
                            {
                                name:'жуки майские класса А',
                                isLink:true,
                                id:11,
                                count:1
                            }
                        ]
                    },
                    {
                        id:154,
                        name:'Жуки майские',
                        groups:[
                            {
                                name:'main',
                                id:0,
                                count:0
                            },
                            {
                                name:'жуки майские класса А',
                                isLink:true,
                                id:11,
                                count:1
                            }
                        ]
                    },
                    {
                        id:154,
                        name:'Жуки майские',
                        groups:[
                            {
                                name:'main',
                                id:0,
                                count:0
                            },
                            {
                                name:'жуки майские класса А',
                                isLink:true,
                                id:11,
                                count:1
                            }
                        ]
                    }
                ],
                parent_taxon:[
                    {
                        id:10,
                        name:'Жуки',
                        groups:[
                            {
                                name:'main',
                                id:0,
                                count:0
                            },
                            {
                                name:'какие то жуки',
                                isLink:true,
                                id:18,
                                count:2
                            }
                        ]
                    }
                ],
                defined_taxon:[
                    {
                        id:15415,
                        name:'Жуки навозники (Вид №:1581)',
                        groups:[
                            {
                                name:'жук 1581',
                                isLink:true,
                                id:15145,
                                count:8
                            }
                        ]
                    }
                ]
            };
            cb(null);
        },
        exampleToSync:function(cb){
            cb(null);
            var o = {
                command: 'sadas',
                object: 'asda',
                params: {
                    id: sampleId,
                    data: {
                        exist_data_individual: {
                            11: 2, // id data_individual : новое количество
                            15145: 8
                        },
                        new_data_individual:{
                            10: 5 // id taxon_id : количество
                        }
                    }
                }
            }
            var data = {
                exist_data_individual: {
                    11: 2, // id data_individual : новое количество
                    15145: 8
                },
                new_data_individual:{
                    10: 5 // id taxon_id : количество
                }

            }
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{data:result_obj}));
    });
};

Model.prototype.getSplitedSampleObj = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var result_obj = {
        project_taxon:[],
        parent_taxon:[],
        defined_taxon:[]
    };

    var sample;
    var used_taxon_ids = [];
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить sample.',{id:id,err:err}));
                sample = res[0];
                cb(null);
            });
        },
        getProjectTaxon:function(cb){
            var o = {
                command:'get',
                object:'project_available_taxon',
                params:{
                    param_where:{
                        project_id:sample.project_id
                    },
                    sort:'taxon',
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить project_available_taxon',{o : o, err : err}));
                // result_obj.project_taxon = res;
                for (var i in res) {
                    used_taxon_ids.push(res[i].taxon_id);
                    result_obj.project_taxon.push({
                        id:res[i].taxon_id,
                        name:res[i].taxon
                    });
                }
                cb(null);
            });

        },
        getParentTaxon:function(cb){

            var o = {
                command:'getParentTaxon',
                object:'Project',
                params:{
                    sort:'taxon',
                    id:sample.project_id
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить getParentTaxon',{o : o, err : err}));
                var resReal = res.project_available_taxon;
                // result_obj.parent_taxon = resReal;
                for (var i in resReal) {
                    used_taxon_ids.push(resReal[i].taxon_id);
                    result_obj.parent_taxon.push({
                        id:resReal[i].taxon_id,
                        name:resReal[i].taxon
                    });
                }

                cb(null);
            });
        },
        getDefinedTaxon:function(cb){
            var needed_taxon_ids = [];
            async.series({
                getDataIndividual:function(cb){
                    var o = {
                        command:'get',
                        object:'data_individual',
                        columns:['id','taxon_id'],
                        params:{
                            where:[
                                {
                                    key:'sample_id',
                                    val1:id
                                }
                            ],
                            collapseData:false
                        }
                    };
                    if (used_taxon_ids.length){
                        o.params.where.push(
                            {
                                key:'taxon_id',
                                type:'!in',
                                val1:used_taxon_ids
                            }
                        );
                    }
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить data_individual',{o : o, err : err}));
                        for (var i in res) {
                            needed_taxon_ids.push(res[i].taxon_id);
                        }
                        cb(null);
                    });
                },
                getTaxons:function(cb){
                    if (!needed_taxon_ids.length) return cb(null);
                    var o = {
                        command:'get',
                        object:'taxon',
                        params:{
                            where:[
                                {
                                    key:'id',
                                    type:'in',
                                    val1:needed_taxon_ids
                                }
                            ],
                            sort:'name',
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить taxon',{o : o, err : err}));
                        for (var i in res) {
                            result_obj.defined_taxon.push({
                                id:res[i].id,
                                name:res[i].name
                            });
                        }
                        cb(null);
                    });
                }
            }, cb);
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{data:result_obj}));
    });
};

// Model.prototype.applySplitedSampleObj = function (obj, cb) {
//     if (arguments.length == 1) {
//         cb = arguments[0];
//         obj = {};
//     }
//     var _t = this;
//     var id = obj.id;
//     if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
//     var data = obj.data;
//     if (!data) return cb(new MyError('Не передана data',{obj:obj}));
//     var rollback_key = obj.rollback_key || rollback.create();
//     var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;
//
//     async.series({
//         createNew:function(cb){
//             if (!data.new_data_individual) return cb(null);
//             async.eachSeries(Object.keys(data.new_data_individual), function(taxon_id, cb){
//                 if (+data.exist_data_individual[taxon_id].individual_count <= 0) return cb(null);
//                 var o = {
//                     command:'add',
//                     object:'data_individual',
//                     params:{
//                         sample_id:id,
//                         name:data.new_data_individual[taxon_id].name || funcs.guidShort(),
//                         taxon_id:taxon_id,
//                         individual_count:+data.exist_data_individual[taxon_id].individual_count,
//                         rollback_key:rollback_key
//                     }
//                 };
//                 // o.params.name = data.new_data_individual[taxon_id].name || funcs.guidShort();
//                 // o.params.individual_count = +data.new_data_individual[taxon_id].individual_count;
//
//                 var excludeFields = ['name', 'individual_count'];
//
//                 for (var i in data.new_data_individual[taxon_id]) {
//                     if (excludeFields.indexOf(i)!== -1) continue;
//                     o.params[i] = data.new_data_individual[taxon_id][i];
//                 }
//                 _t.api(o, function (err, res) {
//                     if (err) return cb(new MyError('Не удалось добавить data_individual',{o : o, err : err}));
//
//                     cb(null);
//                 });
//
//             }, cb);
//         },
//         updateExist:function(cb){
//             if (!data.exist_data_individual) return cb(null);
//             async.eachSeries(Object.keys(data.exist_data_individual), function(data_individual_id, cb){
//                 if (+data.exist_data_individual[data_individual_id].individual_count <= 0) data.exist_data_individual[data_individual_id].individual_count = 0;
//                 var o = {
//                     command:'modify',
//                     object:'data_individual',
//                     params:{
//                         id:data_individual_id,
//                         individual_count:+data.exist_data_individual[data_individual_id].individual_count,
//                         rollback_key:rollback_key
//                     }
//                 };
//
//                 var excludeFields = ['name', 'individual_count'];
//
//                 for (var i in data.new_data_individual[data_individual_id]) {
//                     if (excludeFields.indexOf(i)!== -1) continue;
//                     o.params[i] = data.new_data_individual[data_individual_id][i];
//                 }
//
//                 _t.api(o, function (err, res) {
//                     if (err) return cb(new MyError('Не удалось изменить data_individual',{o : o, err : err}));
//
//                     cb(null);
//                 });
//
//             }, cb);
//         }
//     },function (err, res) {
//         if (err) {
//             rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
//                 return cb(err, err2);
//             });
//         } else {
//             if (!doNotSaveRollback){
//                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'applySplitedSampleObj', params:obj});
//             }
//             cb(null, new UserOk('Ок'));
//         }
//     });
// };

Model.prototype.addToIndividual = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var taxon_id = obj.taxon_id;

    if (isNaN(+taxon_id)) return cb(new UserError('Please, select the taxon',{obj:obj}));

    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var individual_count = +obj.individual_count;

    if (isNaN(individual_count)) return cb(new UserError('Count of individual is incorrect'));

    if (individual_count <= 0) return cb(new UserError('Count of individual can only positiv value!'));

    var storage_id = obj.storage_id;

    if (!storage_id) return cb(new UserError('Please, select the storage'));

    async.series({
        add:function(cb){
            var o = {
                command:'add',
                object:'data_individual',
                params:{
                    sample_id:id,
                    name:obj.name || funcs.guidShort(),
                    taxon_id:taxon_id,
                    individual_count:individual_count,
                    storage_id:storage_id,
                    rollback_key:rollback_key
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось добавить data_individual',{o : o, err : err}));
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
               rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'addToIndividual', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });
};


Model.prototype.addToIndividualMass = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    async.eachSeries(obj.data, function(item, cb){
        if (item.individual_count <= 0) return cb(null);
        var params = {
            doNotSaveRollback:true,
            rollback_key:rollback_key,
            individual_count: item.individual_count,
            taxon_id: item.taxon_id,
            storage_id: item.storage_id,
            id: id,
            name: item.name
        };

        _t.addToIndividual(params, cb);


    },function (err, res) {
        if (err) {
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'addToIndividualMass', params:obj});
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