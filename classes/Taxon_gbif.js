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

var fs = require('fs')
var readline = require('readline')
var stream = require('stream')
var request = require('request')

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


// var o = {
//     command:'requestGBIF',
//     object:'Taxon_gbif',
//     params:{
//         gbif_parentKey:54
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// });
Model.prototype.requestGBIF = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    var _t = this
    var gbif_parentKey = obj.gbif_parentKey
    var gbif_taxonID = obj.gbif_taxonID

    var result
    async.series({
        request: function(cb) {
            var o = {
                method: 'get',
                json: true,
                uri: 'http://api.gbif.org/v1/species'
            }
            if (gbif_parentKey) {
                o.uri += '/' + gbif_parentKey + '/children'
            } else if (gbif_taxonID) {
                o.uri += '/' + gbif_taxonID
            }
            o.uri += '?offset=' + (obj.offset || 0) + '&limit=' + (obj.limit || 100)
            request(o,
                function(error, response, body) {
                    if (error) {
                        return cb(new MyError('Ошибка при выполнении requestGBIF:', {
                            err: error,
                            o: JSON.stringify(o)
                        }))
                    }
                    if (response.statusCode !== 200) {
                        return cb(new MyError('requestGBIF вернул нестандартный код: ' + response.statusCode, {
                            err: error,
                            o: JSON.stringify(o)
                        }))
                    }
                    if (typeof body !== 'object') return cb(new MyError('Сервер вернул не JSON', {body: body}))
                    result = body
                    return cb(null, result)
                })
        }
    }, function(err, res) {
        if (err) return cb(err)
        cb(null, result)
    })
}


// var o = {
//     command:'importFile',
//     object:'Taxon_gbif',
//     params:{}
// };
// socketQuery(o, function(r){
//     console.log(r);
// });
Model.prototype.importFile = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    var _t = this
    // var id = obj.id;
    // if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create()
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key
    var filename = obj.filename || 'Taxon.tsv'
    var path = obj.path || './DB/gbif/'

    var lineNr = 0
    var globCounter = 0
    var lines = []


    var insertPortion = function(obj, cb) {
        if (arguments.length == 1) {
            cb = arguments[0]
            obj = {}
        }
        var data = obj.data
        if (!data) return cb(new MyError('Не корректно переданы данные', {obj: obj}))
        var data_columns = obj.data_columns
        if (!data_columns) {
            return cb(new MyError('Не корректно переданы данные data_columns', {obj: obj}))
        }
        // for (var i in data) {
        //     console.log(data[i]);
        // }

        console.log('Пришло данных', data.length)

        var lines = {}

        var exist_ids = []
        var ids = []

        async.series({
            parse: function(cb) {
                for (var i in data) {
                    var line = data[i].split('\t')
                    lines[line[0]] = line
                    ids.push(line[0])
                }
                cb(null)
            },
            getIds: function(cb) {
                var params = {
                    where: [
                        {
                            key: 'gbif_taxonID',
                            type: 'in',
                            val1: ids
                        }
                    ],
                    columns: ['id', 'gbif_taxonID'],
                    limit: 100000000,
                    collapseData: false
                }
                _t.get(params, function(err, res) {
                    if (err) return cb(new MyError('Не удалось получить Taxon_gbif', {params: params, err: err}))
                    var deleted = 0
                    for (var i in res) {
                        delete lines[res[i].gbif_taxonID]
                        deleted++
                    }
                    console.log('Удалено', deleted)
                    cb(null)
                })
            },
            insertNew: function(cb) {
                var lines_arr = []
                for (var i in lines) {
                    lines_arr.push(lines[i])
                }
                funcs.splitByPortion({
                    data: funcs.cloneObj(lines_arr),
                    // inPortion:1000,
                    maxProcess: 8
                }, function(items, cb) {

                    async.eachSeries(items, function(gbif_taxon_item, cb) {
                        var params = {
                            rollback_key: rollback_key
                        }
                        for (var i in data_columns) {
                            params['gbif_' + data_columns[i]] = gbif_taxon_item[i]
                        }
                        console.log('Добавим')
                        _t.add(params, function(err, res) {
                            if (err) return cb(new MyError('Не удалось добавить таксон импортированный из GBIF файла', {
                                params: params,
                                err: err
                            }))
                            cb(null)
                        })
                    }, cb)

                }, function(err) {
                    globCounter += data.length
                    console.log('Всего обработано', globCounter)
                    cb(err)
                })
            }
        }, cb)
    }

    async.series({
        all: function(cb) {
            var instream = fs.createReadStream(path + filename)
            var outstream = new stream
            var rl = readline.createInterface(instream, outstream)
            var data_columns
            rl.on('line', function(line) {
                lineNr++
                if (lineNr === 1) {
                    data_columns = line.split('\t')
                    return
                }
                lines.push(line)
                if (lines.length === 200000) {
                    rl.pause()
                    var o = {
                        data_columns: data_columns,
                        data: lines.splice(0, 200000)
                    }
                    // lines = [];
                    insertPortion(o, function(err) {
                        if (err) return cb(err)

                        rl.resume()
                    })
                }
                // process line here


            })

            rl.on('close', function() {
                // do something on finish here
                var o = {
                    data_columns: data_columns,
                    data: lines
                }
                insertPortion(o, function(err) {
                    if (err) return cb(err)
                    cb(null)
                })
                // return cb(null);
            })
            rl.on('error', function() {
                return cb(err)
            })
        }
    }, function(err, res) {
        if (err) {
            rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function(err2) {
                return cb(err, err2)
            })
        } else {
            //if (!doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            //}
            console.log('Готово', 'Всего считано', lineNr)
            console.log('Готово', 'Всего обработано', globCounter)
            cb(null, new UserOk('Ок'))
        }
    })
}

// var o = {
//     command:'importToMainTable',
//     object:'taxon_gbif',
//     params:{
//         id:179551,
//         import_childs:true,
//         import_childs_childs:true,
//         collapseData:false
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// });
Model.prototype.importToMainTable = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    var _t = this
    var id = obj.id
    if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}))
    var rollback_key = obj.rollback_key || rollback.create()
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key
    const doNotClearCache = obj.doNotClearCache

    var taxon_gbif
    var taxon
    var imported_id
    async.series({
        get: function(cb) {
            _t.getById({id: id}, function(err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon_gbif.', {id: id, err: err}))
                taxon_gbif = res[0]
                cb(null)
            })
        },
        getFromMainTable: function(cb) {
            var o = {
                command: 'get',
                object: 'taxon',
                params: {
                    param_where: {
                        taxon_gbif_id: taxon_gbif.id
                    },
                    columns: ['id', 'taxon_gbif_id', 'parent_id', 'gbif_kingdom', 'gbif_kingdomKey', 'gbif_phylum', 'gbif_phylumKey', 'gbif_class', 'gbif_classKey',
                        'gbif_order', 'gbif_family', 'gbif_familyKey', 'gbif_genus'],
                    collapseData: false
                }
            }
            _t.api(o, function(err, res) {
                if (err) return cb(new MyError('Не удалось получить таксон', {o: o, err: err}))
                if (res.length > 1) return cb(new MyError('Слишком много записей в таблице таксон с одинаковым taxon_gbif_id', {
                    o: o,
                    res: res
                }))
                if (!res.length) return cb(null)
                taxon = res[0]
                cb(null)
            })
        },
        getOrAddTaxonomicStatus: function(cb) {
            if (!taxon_gbif.gbif_taxonomicStatus) taxon_gbif.gbif_taxonomicStatus = 'UNDEFINED'
            var o = {
                command: 'get',
                object: 'taxonomic_status',
                columns: ['id', 'sysname'],
                params: {
                    param_where: {
                        sysname: taxon_gbif.gbif_taxonomicStatus.toUpperCase().replace(/\s/ig, '_')
                    },
                    collapseData: false
                }
            }
            _t.api(o, function(err, res) {
                if (err) return cb(new MyError('Не удалось получить taxonomic_status', {o: o, err: err}))
                if (!res.length) {
                    // Добавим
                    var o = {
                        command: 'add',
                        object: 'taxonomic_status',
                        params: {
                            name: taxon_gbif.gbif_taxonomicStatus,
                            sysname: taxon_gbif.gbif_taxonomicStatus.toUpperCase().replace(/\s/ig, '_'),
                            rollback_key: rollback_key,
                            doNotSaveRollback: true
                        }
                    }
                    _t.api(o, function(err, res) {
                        if (err) return cb(new MyError('Не удалось добавить taxonomic_status', {o: o, err: err}))
                        taxon_gbif.taxonomic_status_id = res.id
                        cb(null)
                    })

                    return
                }
                taxon_gbif.taxonomic_status_id = res[0].id
                cb(null)
            })
        },
        import: function(cb) {
            // Найдем родителя или прикрепим к верхнему уровню

            var parent
            async.series({
                getParent: function(cb) {
                    async.series({
                        getByTaxonGBIFId: function(cb) {
                            var o = {
                                command: 'get',
                                object: 'taxon',
                                params: {
                                    param_where: {
                                        gbif_taxonID: taxon_gbif.gbif_parentNameUsageID || -1
                                    },
                                    // columns:['id','gbif_taxonID'],
                                    columns: ['id', 'gbif_taxonID', 'parent_id', 'gbif_kingdom', 'gbif_kingdomKey', 'gbif_phylum', 'gbif_phylumKey', 'gbif_class', 'gbif_classKey',
                                        'gbif_order', 'gbif_family', 'gbif_familyKey', 'gbif_genus'],
                                    collapseData: false
                                }
                            }
                            _t.api(o, function(err, res) {
                                if (err) return cb(new MyError('Не удалось получить парент таксон', {o: o, err: err}))
                                if (res.length > 1) {
                                    return cb(new MyError('Слишком много записей с одинаковым gbif_taxonID', {
                                        o: o,
                                        taxon_gbif,
                                        res: res
                                    }))
                                }
                                if (!res.length) return cb(null)
                                parent = res[0]
                                cb(null)
                            })
                        },
                        getByParentName: function(cb) {
                            if (parent) return cb(null)
                            if (!taxon_gbif.gbif_parentNameUsageID) return cb(null)
                            var parent_gbif
                            async.series({
                                getParent: function(cb) {
                                    var params = {
                                        param_where: {
                                            id: taxon_gbif.gbif_parentNameUsageID,
                                            source: taxon_gbif.source
                                        },
                                        doNotCheckList: true,
                                        collapseData: false
                                    }

                                    _t.get(params, function(err, res) {
                                        if (err) {
                                            return cb(new MyError('Не удалось получить parent_gbif.', {
                                                id: taxon_gbif.gbif_parentNameUsageID,
                                                err: err
                                            }))
                                        }
                                        if (res.length > 1) return cb(new MyError('Слишком много записей с одинаковым gbif_parentNameUsageID', {
                                            o: o,
                                            res: res
                                        }))
                                        if (!res.length) return cb(null)
                                        parent_gbif = res[0]
                                        cb(null)
                                    })
                                },
                                getTaxon: function(cb) {
                                    if (!parent_gbif) return cb(null)
                                    var o = {
                                        command: 'get',
                                        object: 'taxon',
                                        params: {
                                            param_where: {
                                                gbif_canonicalName: taxon_gbif.gbif_canonicalName
                                            },
                                            doNotCheckList: true,
                                            // columns:['id','gbif_canonicalName'],
                                            columns: ['id', 'gbif_canonicalName', 'gbif_taxonID', 'parent_id', 'gbif_kingdom', 'gbif_kingdomKey', 'gbif_phylum', 'gbif_phylumKey', 'gbif_class', 'gbif_classKey',
                                                'gbif_order', 'gbif_family', 'gbif_familyKey', 'gbif_genus'],
                                            collapseData: false
                                        }
                                    }
                                    _t.api(o, function(err, res) {
                                        if (err) return cb(new MyError('Не удалось получить парент таксон по имени', {
                                            o: o,
                                            err: err
                                        }))
                                        if (res.length > 1) return cb(new MyError('Слишком много записей с одинаковым именем', {
                                            o: o,
                                            res: res
                                        }))
                                        if (!res.length) return cb(null)
                                        parent = res[0]
                                        cb(null)
                                    })
                                }
                            }, cb)
                        },
                        getTopTaxon: function(cb) {
                            if (parent) return cb(null)
                            var o = {
                                command: 'get',
                                object: 'taxon',
                                params: {
                                    param_where: {
                                        is_top: true
                                        // name:'All groups'
                                    },
                                    doNotCheckList: true,
                                    // columns:['id','name'],
                                    columns: ['id', 'name', 'gbif_taxonID', 'parent_id', 'gbif_kingdom', 'gbif_kingdomKey', 'gbif_phylum', 'gbif_phylumKey', 'gbif_class', 'gbif_classKey',
                                        'gbif_order', 'gbif_family', 'gbif_familyKey', 'gbif_genus'],
                                    collapseData: false
                                }
                            }
                            _t.api(o, function(err, res) {
                                if (err) return cb(new MyError('Не удалось получить верхний таксон', {o: o, err: err}))
                                if (res.length > 1) return cb(new MyError('Слишком много записей с именем All groups', {
                                    o: o,
                                    res: res
                                }))
                                if (!res.length) return cb(new MyError('Не найдена запись с именем All groups', {
                                    o: o,
                                    res: res
                                }))
                                parent = res[0]
                                cb(null)
                            })
                        }
                    }, cb)
                },
                addNew: function(cb) {
                    if (taxon) return cb(null) // Уже импортирован
                    var dt = funcs.getDateTimeMySQL()
                    var o = {
                        command: 'add',
                        object: 'taxon',
                        params: {
                            taxon_gbif_id: taxon_gbif.id,
                            name: taxon_gbif.gbif_canonicalName,
                            level_name: taxon_gbif.gbif_taxonRank,
                            source: taxon_gbif.source,
                            parent_id: parent.id,
                            is_gbif: true,
                            status_id: taxon_gbif.taxonomic_status_id,
                            is_gbif_datatime: dt,
                            is_gbif_datatime_updated: dt,
                            rollback_key: rollback_key,
                            doNotSaveRollback: true,
                            doNotClearCache
                        }
                    }
                    var addFields = ['gbif_taxonID', 'gbif_parentNameUsageID', 'gbif_scientificName', 'gbif_scientificNameAuthorship', 'gbif_canonicalName', 'gbif_genericName', 'gbif_specificEpithet',
                        'gbif_infraspecificEpithet', 'gbif_taxonRank', 'gbif_nameAccordingTo', 'gbif_namePublishedIn', 'gbif_taxonomicStatus', 'gbif_nomenclaturalStatus', 'gbif_taxonRemarks',
                        'gbif_kingdom', 'gbif_phylum', 'gbif_class', 'gbif_order', 'gbif_family', 'gbif_genus']
                    for (var i in taxon_gbif) {
                        if (addFields.indexOf(i) === -1) continue
                        o.params[i] = taxon_gbif[i]
                    }
                    _t.api(o, function(err, res) {
                        if (err) return cb(new MyError('Не удалось добавить таксон (импорт из gbif)', {
                            o: o,
                            err: err
                        }))
                        imported_id = res.id
                        cb(null)
                    })
                },
                updateTaxon: function(cb) {
                    if (!taxon) return cb(null) // был добавлен, не требует обновления

                    var fieldsToUpdate = ['gbif_kingdom', 'gbif_kingdomKey', 'gbif_phylum', 'gbif_phylumKey', 'gbif_class', 'gbif_classKey',
                        'gbif_order', 'gbif_family', 'gbif_familyKey', 'gbif_genus']
                    var update

                    var o = {
                        command: 'modify',
                        object: 'taxon',
                        params: {
                            id: taxon.id,
                            rollback_key: rollback_key,
                            doNotSaveRollback: true,
                            doNotClearCache
                        }
                    }

                    if (taxon.parent_id !== parent.id && taxon.id !== parent.id) {  // Для life они равны
                        o.params.parent_id = parent.id
                        update = true
                    }

                    // Обновим на основе gbif таксона
                    for (var i in fieldsToUpdate) {
                        if (taxon[fieldsToUpdate[i]] !== taxon_gbif[fieldsToUpdate[i]] && taxon_gbif[fieldsToUpdate[i]]) {
                            o.params[fieldsToUpdate[i]] = taxon_gbif[fieldsToUpdate[i]]
                            taxon[fieldsToUpdate[i]] = taxon_gbif[fieldsToUpdate[i]]
                            update = true
                        }
                    }

                    // Обновим на основе родителя
                    for (var i in fieldsToUpdate) {
                        if (taxon[fieldsToUpdate[i]] !== parent[fieldsToUpdate[i]] && parent[fieldsToUpdate[i]]) {
                            o.params[fieldsToUpdate[i]] = parent[fieldsToUpdate[i]]
                            update = true
                        }
                    }
                    imported_id = taxon.id
                    if (!update) return cb(null) // Ничего обновлять не надо
                    _t.api(o, function(err, res) {
                        if (err) {
                            return cb(new MyError('Не удалось обновить таксон', {o: o, err: err}))
                        }

                        cb(null)
                    })
                }
            }, cb)
        },
        importChilds: function(cb) {
            if (!obj.import_childs) return cb(null)
            // Получить всех детей
            // Запустить эту же функцию
            var childs
            async.series({
                getChilds: function(cb) {
                    var params = {
                        param_where: {
                            gbif_parentNameUsageID: taxon_gbif.gbif_taxonID,
                            source: taxon_gbif.source
                        },
                        columns: ['id', 'gbif_taxonID', 'gbif_parentNameUsageID'],
                        limit: 100000000,
                        collapseData: false,
                        doNotCheckList: true
                    }
                    _t.get(params, function(err, res) {
                        if (err) return cb(new MyError('Не удалось получить детей taxon_gbif', {
                            params: params,
                            err: err
                        }))
                        childs = res
                        cb(null)
                    })
                },
                start: function(cb) {
                    if (!childs) return cb(null)
                    if (!childs.length) return cb(null)

                    funcs.splitByPortion({
                        data: funcs.cloneObj(childs),
                        // inPortion:1000,
                        maxProcess: 4
                    }, function(items, cb) {

                        async.eachSeries(items, function(item, cb) {
                            var params = {
                                id: item.id,
                                import_childs: obj.import_childs_childs,
                                doNotSaveRollback: true,
                                doNotClearCache,
                                rollback_key
                            }
                            _t.importToMainTable(params, cb)
                        }, function(err) {
                            if (err) {
                                console.log('ОШИБКА при импорте детей:', err)

                            }
                            return cb(null)
                        })

                    }, function(err) {
                        console.log('Все дети обработаны', JSON.stringify(taxon_gbif))
                        cb(err)
                    })
                }
            }, cb)
        }
    }, function(err, res) {
        if (err) {
            rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function(err2) {
                return cb(err, err2)
            })
        } else {
            if (!doNotSaveRollback) {
                rollback.save({
                    rollback_key: rollback_key,
                    user: _t.user,
                    name: _t.name,
                    name_ru: _t.name_ru || _t.name,
                    method: 'importToMainTable',
                    params: obj
                })
            }
            cb(null, new UserOk('Ок', {imported_id: imported_id}))
        }
    })
};

Model.prototype.importToMainTableByFilter = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    var _t = this
    var id = obj.id
    if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}))
    var rollback_key = obj.rollback_key || rollback.create()
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key

    const filterWhere = obj.filterWhere
    if (!filterWhere) return cb(new MyError('filterWhere not passed'))
    if (!filterWhere.length) return cb(new UserError('No one filter applied'))

    const infoOptions = obj.infoOptions || {}

    const rollbacks = []

    var taxon_gbif_ids
    var taxon
    var imported_id
    const errors = []
    async.series({
        get: function(cb) {
            let params = {
                where: filterWhere,
                columns: ['id'],
                collapseData: false,
                limit: 1000000000
            }

            _t.get(params, function(err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon_gbif по фильтрам.', {params, err: err}))
                taxon_gbif_ids = res.map(one => one.id)
                cb(null)
            })
        },
        doImport: cb => {
            console.log(taxon_gbif_ids.length, taxon_gbif_ids)


            let cnt = 0
            const cnt_all = taxon_gbif_ids.length
            async.eachSeries(taxon_gbif_ids, (one_id, cb) => {
                cnt++
                const rollback_key = rollback.create()
                let params = {
                    id: one_id,
                    import_childs: obj.import_childs,
                    doNotClearCache: true,
                    rollback_key
                }


                _t.importToMainTable(params, (err, res) => {
                    if (err) {
                        errors.push(new MyError('Не удалось importToMainTable ', {params: params, err: err}))
                        if (infoOptions.selector) {
                            _t.user.socket.emit('percent', {
                                selector: infoOptions.selector,
                                html: `Error while import one element...`,
                                console: errors[errors.length - 1]
                            })
                        }
                        // return cb(err)
                        rollback.rollback({obj: params, rollback_key: rollback_key, user: _t.user}, function(err2) {
                            return cb(null)
                        })
                        return
                    }
                    if (infoOptions.selector) {
                        _t.user.socket.emit('percent', {
                            selector: infoOptions.selector,
                            html: `Import to main by filters: ${cnt} of ${cnt_all}`
                        })
                    }
                    cb(null)
                })
            }, cb)
        }
    }, function(err) {
        if (infoOptions.selector) {
            setTimeout(() => {
                _t.user.socket.emit('percent', {
                    selector: infoOptions.selector,
                    html: ``
                })
            }, infoOptions.timeout || 5000)

        }
        let o = {
            command: '_clearCacheAll',
            object: 'Taxon',
            params: {}
        }
        _t.api(o, (errClear, res) => {
            if (errClear) console.error('errClear', errClear)
            if (err) {
                return cb(err)
            } else {
                const msg = errors.length ? 'Some elements has error. See console' : 'Ok'
                cb(null, new UserOk(msg, {errors: errors}))
            }
        })

    })
};


// var o = {
//     command:'updateByGBIF_API',
//     object:'taxon_gbif',
//     params:{
//         id:3011698
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// });
Model.prototype.updateByGBIF_API = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    var _t = this
    var id = obj.id
    if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}))
    var rollback_key = obj.rollback_key || rollback.create()
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key

    var taxon_gbif
    var result
    async.series({
        get: function(cb) {
            _t.getById({id: id}, function(err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon_gbif.', {id: id, err: err}))
                taxon_gbif = res[0]
                cb(null)
            })
        },
        getDataFormGBIFAPI: function(cb) {
            _t.requestGBIF({gbif_taxonID: taxon_gbif.gbif_taxonID}, function(err, res) {
                if (err) return cb(err)
                result = res
                cb(null)
            })
        },
        mergeAndUpdate: function(cb) {
            var fieldsToUpdate = ['kingdom', 'phylum', 'class',
                'order', 'family', 'genus']
            var update

            var params = {
                id: taxon_gbif.id,
                rollback_key: rollback_key
            }

            for (var i in fieldsToUpdate) {
                if (taxon_gbif['gbif_' + fieldsToUpdate[i]] !== result[fieldsToUpdate[i]] && result[fieldsToUpdate[i]]) {
                    params['gbif_' + fieldsToUpdate[i]] = result[fieldsToUpdate[i]]
                    update = true
                }
            }
            if (!update) return cb(null) // Ничего обновлять не надо
            _t.modify(params, function(err, res) {
                if (err) return cb(new MyError('Не удалось обновить taxon_gbif', {params: params, err: err}))

                cb(null)
            })
        }
    }, function(err, res) {
        if (err) {
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
//     command:'updateByGBIF_API_ALL',
//     object:'taxon_gbif',
//     params:{
//         last_id:4655097
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// });
Model.prototype.updateByGBIF_API_ALL = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }
    var _t = this

    var gbif_taxons
    var errors = []
    var success = 0
    async.series({
        getAll: function(cb) {
            var params = {
                where: [
                    {
                        key: 'updated',
                        type: '<',
                        val1: '29.04.2018 19:22:17',
                        comparisonType: 'OR'
                    },
                    {
                        key: 'updated',
                        type: 'isNull',
                        comparisonType: 'OR'
                    }
                ],
                columns: ['id', 'updated'],
                limit: obj.limit || 1000000000000,
                collapseData: false
            }
            if (obj.last_id) {
                params.where.push({
                    key: 'id',
                    type: '>',
                    val1: obj.last_id,
                    group: 'last_id'
                })
            }
            _t.get(params, function(err, res) {
                if (err) return cb(new MyError('Не удалось получить таксоны', {params: params, err: err}))
                if (!res.length) return cb(null)
                gbif_taxons = res
                cb(null)
            })
        },
        update: function(cb) {
            if (!gbif_taxons) return cb(null)
            async.eachSeries(gbif_taxons, function(taxon, cb) {
                var params = {
                    id: taxon.id
                }
                _t.updateByGBIF_API(params, function(err, res) {
                    if (err) {
                        console.log('Во время updateByGBIF_API произошла ош.', err)
                        errors.push(err)
                        return cb(null)
                    }
                    success++
                    cb(null)
                })
            }, cb)
        }
    }, function(err, res) {
        if (err) return cb(err)
        cb(null, new UserOk('Ок', {success: success, errors: errors}))
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
