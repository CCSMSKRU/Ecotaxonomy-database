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
var msAccess = require('../libs/msAccessConnect');
var intersect = require('intersect');
var Excel = require('exceljs');
var fs = require('fs');
var ToExcel = require('../libs/ToExcel.js');
var Guid = require('guid');
var parsePath = require('parse-filepath');
const request = require('request');
const fuzzysort = require('fuzzysort');

var moment = require('moment');
var cheerio = require('cheerio');
var config = require('../config');

var Model = function(obj){
    this.name = obj.name;
    this.tableName = obj.name.toLowerCase();
    this.getTree_where = [{
        key:'status_sysname',
        type:'in',
        val1:['ACCEPTED','ADDED_BY_ECOTAX']
    }];

    var basicclass = BasicClass.call(this, obj);
    if (basicclass instanceof MyError) return basicclass;
};
util.inherits(Model, BasicClass);
Model.prototype.getPrototype = Model.prototype.get;
Model.prototype.addPrototype = Model.prototype.add;
Model.prototype.modifyPrototype = Model.prototype.modify;
Model.prototype.removeCascadePrototype = Model.prototype.removeCascade;
Model.prototype.getForSelectPrototype = Model.prototype.getForSelect;
Model.prototype.export_to_excelPrototype = Model.prototype.export_to_excel;

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

Model.prototype.add_ = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    // Если нет родителя, запросим конфирм

    var parent_id = +obj.parent_id;
    if (isNaN(parent_id) && obj.fromClient) return cb(new UserError('Please select a parent.'));
    var parent;
    var id;
    var name = obj.name || obj.custom_name;

    async.series({
        // checkParentId:function(cb){
        //     if (isNaN(parent_id)){
        //         if (String(obj.confirm).toLowerCase() != 'createzerotaxon'){
        //             return cb(new UserError('needConfirm', {message: 'Чтобы подтвердить создание таксона нулевого уровня введите подтверждение.',title:'Создание таксона нулевого уровня',key:1, confirmType:'dialog',responseType:'text'}));
        //         }
        //         return cb(null);
        //     }
        //     return cb(null);
        // },
        // getParent:function(cb){
        //     if (!parent_id) return cb(null);
        //     _t.getById({id:parent_id}, function (err, res) {
        //         if (err) return cb(new MyError('Не удалось получить родительский элемент.',{id:parent_id,err:err}));
        //         parent = res[0];
        //         cb(null);
        //     });
        // },
        // prepareLevel:function(cb){
        //     if (!parent_id) {
        //         obj.level = 0;
        //         obj.level_char = '';
        //         return cb(null);
        //     }
        //     obj.level = ++parent.level;
        //     obj.level_char = (parent.level_char)? parent.level_char + ',' + String(parent.id) : String(parent.id);
        //     return cb(null);
        //     //
        //     // async.series({
        //     //     getLevels:function(cb){
        //     //         // Получим левелы
        //     //
        //     //     }
        //     //
        //     // }, cb);
        // },
        saveNameIfGbif: function(cb) {
          if (obj.is_gbif) {
              name = obj.gbif_canonicalName;
              obj.source = 'GBIF'
          }
          cb(null);
        },
        add:function(cb){
            var obj2 = funcs.cloneObj(obj);
            obj2.status_sysname = obj2.status_sysname || 'ADDED_BY_ECOTAX';
            obj2.name = name;
            obj2.custom_name = name;
            if (!obj.source)
                obj.source = 'Ecotaxonomy'
            _t.addPrototype(obj2, function(err, res) {
                if (err) return cb(new MyError('Error while adding taxon', {o: obj2, err: err}));
                id = res.id;
                cb(null, res);
            });
        },
        updateName: function(cb) {
            if (!id) return cb(null);

            var o = {
                command: 'setNonGbifName',
                object: 'taxon',
                params: {
                    id: id
                }
            };

            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Error while updating name',{o : o, err : err}));
                cb(null, res);
            });
        },
        findMainPicture: cb => {
            let o = {
                command: 'setMainPictures',
                object: 'taxon_picture',
                params: {
                    id: id
                }
            }

            _t.api(o, (err, res) => {
                if (err) return cb(new MyError('Error while findMainPicture',{o: o, err: err}));
                cb(null)
            })
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
            cb(null, new UserOk('Ок', res.add));
        }
    });
};

Model.prototype.modify_ = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}));
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var status_id = +obj.status_id;
    var status_sysname = +obj.status_sysname;

    let objKeys = Object.keys(obj);
    let requiredFileds = ['similarity_link_id', 'external_id', 'creation_project_id', 'custom_name', 'level_id', 'gbif_scientificNameAuthorship'];
    var nameFieldsHasChanged = false;
    for (const requiredFiled of requiredFileds) {
        if (objKeys.indexOf(requiredFiled) > -1) {
            nameFieldsHasChanged = true;
            break;
        }
    }

    var name = obj.name;
    var isGbif;
    if (!obj.fromClient || (!status_id && !status_sysname)) {
        async.series({
            checkGbifSync: function (cb) {
                _t.getById({id: id}, function (err, res) {
	                if (err) return cb(new MyError('Error while getting taxon',{id : id, err : err}));
	                if (!res || !res[0]) return cb(new MyError('Taxon not found',{id : id}));

	                if (res[0].is_gbif && (obj.level_id || obj.gbif_scientificNameAuthorship))
                        return cb(new UserError("Changes to Authorship and Taxon Rank are disallowed for synced taxons"));
                    cb(null);
                });
            },
            syncNameIfGbif: function (cb) {
                _t.getById({id: id}, function (err, res) {
                    isGbif = obj.is_gbif || res[0].is_gbif;
                    if (isGbif || obj.gbif_canonicalName)
                        name = obj.gbif_canonicalName || res[0].gbif_canonicalName;
                    cb(null);
                })
            },
            modifyPrototype: function (cb) {
                var obj2 = funcs.cloneObj(obj);
                if (name) obj2.name = name;
                _t.modifyPrototype(obj2, (err, res) => {
                    cb(err, res);
                });
            },
            syncNameIfNotGbifAndMorph: function (cb) {
                //Если хотя бы один изменен
                if (nameFieldsHasChanged && !isGbif && !obj.doNotCallSetNonGbifName) {
                    _t.setNonGbifName({id: id}, cb)
                } else {
                    cb(null)
                }
            }
        }, function (err, res) {
            if (err) {
                if (err.message == 'notModified') return cb(null, res);
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
                        method: 'modify_',
                        params: obj
                    });
                }
                cb(null, new UserOk('Ок', res.modifyPrototype));
            }
        });
        return;
    }

    var statuses_by_id = {};
    var statuses_by_sysname = {};
    var status;
    async.series({
        getStatuses: function (cb) {
            var o = {
                command: 'get',
                object: 'taxonomic_status',
                params: {
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxonomic_status', {o: o, err: err}));
                for (var i in res) {
                    statuses_by_id[res[i].id] = res[i];
                    statuses_by_sysname[res[i].sysname] = res[i];
                }
                cb(null);
            });
        },
        check: function (cb) {
            status = (status_id) ? statuses_by_id[status_id] : statuses_by_sysname[status_sysname];
            if (!status) return cb(new MyError('Status not found', {obj: obj}));
            if (['SYNONYM'].indexOf(status.sysname) !== -1)
                return cb(new UserError('This status cannot be set. Using a specialized method.', {
                obj: obj,
                status: status
            }));
            obj.status_id = status.id;
            delete obj.status_sysname;
            return cb(null);
        },
        modify: function (cb) {
            var obj2 = funcs.cloneObj(obj);
            _t.modifyPrototype(obj2, cb);
        }
    }, function (err, res) {
        if (err) {
            if (err.message == 'notModified') return cb(null, res.modify);
            rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            // if (!doNotSaveRollback){
            //     rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'modify_', params:obj});
            // }
            cb(null, new UserOk('Ок', res.modify));
        }
    });
};

Model.prototype.getForSelect = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    // if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var parent_columns = ['parent','parent_name'];
    if (parent_columns.indexOf(obj.column_name) === -1 || isNaN(+id)){
        _t.getForSelectPrototype(obj, cb);
        return;
    }


    // Если parent, то фильтруем по ранкам

    var taxon, taxon_level;
    var level_ids;
    async.series({
        get:function(cb){
            if (!id) return cb(null);
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon.',{id:id,err:err}));
                taxon = res[0];
                cb(null);
            });
        },
        getRankSortNo:function(cb){
            if (!taxon || !taxon.level_id) return cb(null);
            var o = {
                command: 'getById',
                object: 'taxon_level',
                params: {
                    id:taxon.level_id
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось taxon_level',{o : o, err : err}));
                taxon_level = res[0];
                cb(null);
            });

        },
        getRanks:function(cb){
            if (!taxon_level) return cb(null);
            var o = {
                command:'get',
                object:'taxon_level',
                params:{
                    where:[
                        {
                            key:'sort_no',
                            type:'>=',
                            val1:taxon_level.sort_no
                        }
                    ],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить ранки. Такойже или выше',{o : o, err : err}));
                for (var i in res) {
                    if (!level_ids) level_ids = [];
                    level_ids.push(res[i].id);
                }
                cb(null);
            });
        },
        getForSelectPrototype:function(cb){
            if (level_ids){
                obj.default_where = obj.default_where || [];
                obj.default_where.push({
                    key:'level_id',
                    type:'in',
                    val1:level_ids,
                    group:'rank_filter'
                });
            }
            _t.getForSelectPrototype(obj, cb);
        }
    },function (err, res) {
        if (err) return cb(err);
        // cb(null, res.getForSelectPrototype[0]);


        cb(null, res.getForSelectPrototype);
    });
};

Model.prototype.getChilds = function (obj, cb) {
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

// var o = {
//     command:'testQuery',
//     object:'Taxon',
//     params:{
//         collapseData:false
//     }
// };
// socketQuery(o, function(res){
//     console.log(res);
// });

Model.prototype.testQuery = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    async.series({
        q:function(cb){
            q = 'select * from User_list';
            msAccess.query({q:q}, function(err, res){
                console.log(err, res);
                cb(err, res);
            })
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
            cb(null, new UserOk('Ок', res.q));
        }
    });
};

// o = {
//     command: 'addSumatera',
//     object: 'taxon',
//     params: {}
// }
//
// socketQuery(o, console.log)
Model.prototype.addSumatera = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	let _t = this;
	let rollback_key = rollback.create();

	const Sumatera_ID_old = 3028;
	const Sumatera_ID = 2453;

	let taxa_ids;
	let already_has = [];
	let n = 0;

	async.series({
		getParentTaxa: cb => {
			let o = {
				command: 'get',
				object: 'taxon',
				params: {
					columns: ['id'],
					where: [
						{
							group: 'name_or',
							comparisonType: 'or',
							key: 'name',
							type: '=',
							val1: 'Araneae'
						},
						{
							group: 'name_or',
							comparisonType: 'or',
							key: 'name',
							type: '=',
							val1: 'Formicidae'
						},
						{
							group: 'name_or',
							comparisonType: 'or',
							key: 'name',
							type: '=',
							val1: 'Mesostigmata'
						}
					],
					collapseData: false
				}
			};

			_t.api(o, (err, res) => {
				if (err) return cb(new MyError('Error while getting taxons',{o : o, err : err}));
				if (!res || !res.length) return cb('Taxons not found');

				taxa_ids = res.map(row => {
					return row.id;
				});

				cb(null);
			});
		},
		getChildren: cb => {
			let params = {
				id: taxa_ids
			};

			_t.getChildIds(params, (err, res) => {
				if (err) return cb(new MyError('Error while getting children',{params : params, err : err}));
				taxa_ids = taxa_ids.concat(res.ids);
				cb(null);
			});
		},
		getTaxa: cb => {
			let params = {
				columns: ['id', 'level_name'],
				where: [
					{
						group: 'level_name_or',
						comparisonType: 'or',
						key: 'level_name',
						type: '=',
						val1: 'species'
					},
					{
						group: 'level_name_or',
						comparisonType: 'or',
						key: 'level_name',
						type: '=',
						val1: 'morphospecies'
					},
					{
						key: 'id',
						type: 'in',
						val1: taxa_ids
					}
				],
				limit: 100000000,
				collapseData: false
			};

			_t.get(params, (err, res) => {
				if (err) return cb(new MyError('Error while getting children',{params : params, err : err}));
				taxa_ids = res.map(row => {
					return row.id;
				});
				cb(null);
			})
		},
		getTaxaWithWrongLocation: cb => {
			let o = {
				command: 'get',
				object: 'taxon_location',
				params: {
					columns: ['id', 'location_id', 'taxon_id'],
					param_where: {
						location_id: Sumatera_ID_old
					},
					where: [
						{
							key: 'taxon_id',
							type: 'in',
							val1: taxa_ids
						}
					],
					collapseData: false
				}
			};

			_t.api(o, (err, res) => {
				if (err) return cb(new MyError('Error while getting locations', {o: o, err: err}));

				if (res.length)
					return async.eachSeries(res, (row, cb) => {
						let o = {
						    command: 'remove',
						    object: 'taxon_location',
						    params: {
						    	id: row.id
						    }
						};

						_t.api(o, (err, res) => {
							if (err) return cb(new MyError('Error while deleting locations', {o: o, err: err}));
							cb(null);
						});
					}, cb);

				cb(null);
			});
		},
		checkLocations: cb => {
			let o = {
				command: 'get',
				object: 'taxon_location',
				params: {
					columns: ['location_id', 'taxon_id'],
					param_where: {
						location_id: Sumatera_ID
					},
					where: [
						{
							key: 'taxon_id',
							type: 'in',
							val1: taxa_ids
						}
					],
					collapseData: false
				}
			};

			_t.api(o, (err, res) => {
				if (err) return cb(new MyError('Error while getting locations', {o: o, err: err}));

				if (res.length)
					already_has = res.map(row => {
						return row.taxon_id;
					});

				cb(null);
			});
		},
		addLocations: cb => {
			async.eachSeries(taxa_ids, (id, cb) => {
				if (already_has.indexOf(id) > -1) return cb(null);

				let o = {
					command: 'add',
					object: 'taxon_location',
					params: {
						taxon_id: id,
						location_id: Sumatera_ID,
						rollback_key: rollback_key,
						doNotSaveRollback: true
					}
				};

				_t.api(o, (err, res) => {
					if (err) return cb(new MyError('Error while adding', {o: o, err: err}));
					if (res.code !== 0) return cb(new MyError('Error while adding', {o: o, err: err, res: res}));
					n++;
					cb(null);
				});
			}, cb);
		}
	}, (err) => {
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
				method: 'addSumatera',
				params: obj
			});
			cb(null, new UserOk('Ок', {n: n}));
		}
	});
};

// o = {
//     command: 'updateBodyLengthOfAraneae',
//     object: 'taxon',
//     params: {}
// }
//
// socketQuery(o, console.log)
Model.prototype.updateBodyLengthOfAraneae = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    let _t = this;
    let rollback_key = rollback.create();

    // const Araneae_ID = 407769;
    // const BodyLengthMax_ID = 6646;
    // const BodyLengthMin_ID = 6645;
    const Araneae_ID = 424669;
    const BodyLengthMax_ID = 6646;
    const BodyLengthMin_ID = 6645;

    let taxons_ids;
    let traits_ids;
    let values;

    async.series({
        getTaxons: cb => {
            let o = {
                command: 'getChildIds',
                object: 'taxon',
                params: {
                    id: Araneae_ID
                }
            };

            _t.api(o, (err, res) => {
                if (err) return cb(new MyError('Error while getting taxons',{o : o, err : err}));

                taxons_ids = res.ids;

                cb(null);
            });
        },
        getTraits: cb => {
            let o = {
                command: 'get',
                object: 'taxon_trait_value',
                params: {
                    columns: ['id', 'taxon_id', 'taxon_avalible_trait_id'],
                    where: [
                        {
                            key: 'taxon_id',
                            type: 'in',
                            val1: taxons_ids
                        },
                        {
                            group: 'taxon_avalible_trait_id',
                            comparisonType: 'or',
                            key: 'taxon_avalible_trait_id',
                            type: '=',
                            val1: BodyLengthMax_ID
                        },
                        {
                            group: 'taxon_avalible_trait_id',
                            comparisonType: 'or',
                            key: 'taxon_avalible_trait_id',
                            type: '=',
                            val1: BodyLengthMin_ID
                        }
                    ],
                    collapseData: false
                }
            };

            _t.api(o, (err, res) => {
                if (err) return cb(new MyError('Error while getting traits',{o : o, err : err}));

                traits_ids = res.map(row => {
                    return row.id
                });

                cb(null);
            });
        },
        getTraitsValues: cb => {
            let o = {
                command: 'get',
                object: 'taxon_trait_sub_table_float',
                params: {
                    columns: ['id', 'taxon_trait_value_id', 'value1'],
                    where: [
                        {
                            key: 'taxon_trait_value_id',
                            type: 'in',
                            val1: traits_ids
                        }
                    ],
                    collapseData: false
                }
            };

            _t.api(o, (err, res) => {
                if (err) return cb(new MyError('Error while getting values',{o : o, err : err}));

                values = res.map(row => {
                    return {
                        id: row.id,
                        value1: row.value1 * 1000
                    }
                });

                cb(null);
            });
        },
        updateValues: cb => {
            async.eachSeries(values, (value, cb) => {
                let o = {
                    command: 'modify',
                    object: 'taxon_trait_sub_table_float',
                    params: {
                        id: value.id,
                        value1: value.value1,
                        rollback_key: rollback_key,
                        doNotSaveRollback: true
                    }
                };

                _t.api(o, cb);
            }, cb);
        }
    }, (err) => {
        if (err) {
            rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                cb(err, {
                    traits_ids: traits_ids,
                    values: values,
                    err2: err2
                });
            });
        } else {
            rollback.save({
                rollback_key: rollback_key,
                user: _t.user,
                name: _t.name,
                name_ru: _t.name_ru || _t.name,
                method: 'updateBodyLengthOfAraneae',
                params: obj
            });
            cb(err, {
                traits_ids: traits_ids,
                values: values
            });
        }
    });
};


// Model.prototype.msaccessImportNode = function (obj, cb) {
//     if (arguments.length == 1) {
//         cb = arguments[0];
//         obj = {};
//     }
//     var _t = this;
//     var msaccess_taxon_id = obj.msaccess_taxon_id;
//     if (isNaN(+msaccess_taxon_id)) return cb(new MyError('Не передан msaccess_taxon_id',{obj:obj}));
//     var rollback_key = obj.rollback_key || rollback.create();
//     var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;
//
//     var top_taxon;
//     var child_taxons;
//     var groups_obj_msaccess = {};
//     var taxon_level_obj_msaccess = {};
//
//     var getTaxonLevel = function(obj, cb){
//         var o = {
//             command:'get',
//             object:'Taxon_level',
//             params:{
//                 collapseData:false,
//                 limit:1000
//             }
//         };
//         _t.api(o, function (err, res) {
//             if (err) return cb(new MyError('Не удалось получить taxon_level',{o : o, err : err}));
//             for (var i in res) {
//                 taxon_level_obj_msaccess[res[i].msaccess_taxon_level_id] = res[i];
//             }
//             cb(null);
//         });
//
//     };
//
//     async.series({
//         getTopTaxon:function(cb){
//             var params = {
//                 param_where:{
//                     msaccess_taxon_id:msaccess_taxon_id
//                 },
//                 collapseData:false
//             };
//             _t.get(params, function (err, res) {
//                 if (err) return cb(new MyError('Не удалось получить таксон по msaccess_taxon_id',{params : params, err : err}));
//                 if (!res.length) return cb(null);
//                 top_taxon = res[0];
//                 cb(null);
//             });
//         },
//         getTaxonLevel:function(cb){
//             getTaxonLevel(null, cb);
//         },
//         importAndGetTopTaxon:function(cb){
//             // Импортируем
//             // Получаем его
//             // ищем кто на него ссылается - проставляем связь
//             var taxon;
//             async.series({
//                 import:function(cb){
//                     if (global.stopImport) return cb(null);
//                     var q = 'select * from `Taxon_system (GBIF)` where taxon_ID = ' + pool.escape(msaccess_taxon_id);
//                     msAccess.query({q:q}, function(err, res){
//                         if (err) return cb(new MyError('Не удалось получить нужный такон из внешней базы',{err:err, q:q}));
//                         if (!res.length) return cb(new UserError('Таксон с id ' + msaccess_taxon_id + ' не найден в MS Access базе.'));
//                         taxon = res[0];
//                         cb(null, res);
//                     });
//                 },
//                 addToSystemAndGet:function(cb){
//                     if (global.stopImport) return cb(null);
//                     if (top_taxon) return cb(null);
//                     var zero_taxon, parent_taxon;
//                     async.series({
//                         getParentTaxon:function(cb){
//                             if (!taxon.parental_taxon) return cb(null);
//                             var params = {
//                                 param_where:{
//                                     msaccess_taxon_id:taxon.parental_taxon
//                                 },
//                                 collapseData:false
//                             };
//                             _t.get(params, function (err, res) {
//                                 if (err) return cb(new MyError('Не удалось получить таксон по parental_taxon',{params : params, err : err}));
//                                 if (res.length > 1) return cb(new MyError('Таксонов с таким parental_taxon слишком много',{params:params, res:res, taxon:taxon}));
//                                 if (!res.length) return cb(null);
//                                 parent_taxon = res[0];
//                                 cb(null);
//                             });
//                         },
//                         getZeroTaxon:function(cb){
//                             if (parent_taxon) return cb(null);
//                             var params = {
//                                 param_where:{
//                                     level:0
//                                 },
//                                 collapseData:false
//                             };
//                             _t.get(params, function (err, res) {
//                                 if (err) return cb(new MyError('Не удалось получить таксон нулевого уровня',{params : params, err : err}));
//                                 if (res.length !== 1) return cb(new MyError('Таксон нулевого уровня не существует или их слишком много',{params:params, res:res}));
//                                 zero_taxon = res[0];
//                                 cb(null);
//                             });
//                         },
//                         checkOrImportTaxonLevel:function(cb){
//                             if (taxon_level_obj_msaccess[taxon.tax_level_ID]) return cb(null);
//                             var o = {
//                                 command:'msaccessImportLevel',
//                                 object:'Taxon_level'
//                             };
//                             _t.api(o, function (err, res) {
//                                 if (err) return cb(new MyError('Не удалось импортировать taxon_level',{o : o, err : err}));
//                                 getTaxonLevel(null, function(err, res){
//                                     if (err) return cb(err);
//                                     if (!taxon_level_obj_msaccess[taxon.tax_level_ID]) {
//                                         return cb(new MyError('В системе нет taxon_level с таким tax_level_ID',{taxon_level_obj_msaccess:taxon_level_obj_msaccess, tax_level_ID:taxon.tax_level_ID}));
//                                     }
//                                     cb(null);
//                                 });
//                             });
//
//                         },
//                         add:function(cb){
//                             if (!zero_taxon && !parent_taxon) return cb(null);
//                             var parent_id = (parent_taxon)? parent_taxon.id : zero_taxon.id;
//                             var params = {
//                                 name:taxon.taxon_name,
//                                 name_full:taxon.Full_taxon_name,
//                                 parent_id:parent_id,
//                                 msaccess_taxon_id:taxon.taxon_ID,
//                                 msaccess_parent_taxon_id:taxon.parental_taxon,
//                                 msaccess_taxon_level_id:taxon.tax_level_ID,
//                                 level_id:taxon_level_obj_msaccess[taxon.tax_level_ID].id,
//                                 doNotSaveRollback:true,
//                                 rollback_key:rollback_key
//                             };
//                             _t.add(params, function (err, res) {
//                                 if (err) return cb(new MyError('Не удалось добавить таксон полученный из msaccess',{params : params, err : err}));
//                                 var id = res.id;
//                                 _t.getById({id:id}, function(err, res){
//                                     if (err) return cb(new MyError('Не удалось получить таксон только что добавленный',{id:id, err:err}));
//                                     top_taxon = res[0];
//                                     cb(null);
//                                 })
//                             });
//                         }
//                     },cb);
//
//                 },
//                 setLinkToHim:function(cb){
//                     if (global.stopImport) return cb(null);
//                     var linked_taxons;
//                     async.series({
//                         getLinked:function(cb){
//                             var params = {
//                                 where:[
//                                     {
//                                         key:'msaccess_parent_taxon_id',
//                                         val1:top_taxon.msaccess_taxon_id
//                                     },
//                                     {
//                                         key:'parent_id',
//                                         type:'isNull'
//                                     }
//                                 ],
//                                 limit:100000,
//                                 collapseData:false
//                             };
//                             _t.get(params, function (err, res) {
//                                 if (err) return cb(new MyError('Не удалось получить зависимые таксоны',{params : params, err : err}));
//                                 linked_taxons = res;
//                                 cb(null);
//                             });
//                         },
//                         setLink:function(cb){
//                             if (!linked_taxons) return cb(null);
//                             async.eachSeries(linked_taxons, function(item, cb){
//                                 var params = {
//                                     id:item.id,
//                                     parent_id:top_taxon.id,
//                                     doNotSaveRollback:true,
//                                     rollback_key:rollback_key
//                                 };
//                                 _t.modify(params, function (err, res) {
//                                     if (err) return cb(new MyError('Не удалось установить parent_id зависимым таксонам',{params : params, err : err}));
//                                     cb(null);
//                                 });
//                             }, cb);
//                         }
//                     },cb);
//
//
//                 },
//                 importTraits:function(cb){
//                     if (obj.doNotImportTrait) return cb(null);
//                     var params = {
//                         id:top_taxon.id,
//                         doNotSaveRollback:true,
//                         rollback_key:rollback_key
//                     };
//                     _t.msaccessImportTrait(params, function(err, res){
//                         if (err) return cb(new MyError('Не удалось импортировать свойства для таксона',{params:params, top_taxon:top_taxon, err:err}));
//                         cb(null);
//                     });
//                 },
//                 getChildsFromMSAccess:function(cb){
//                     if (global.stopImport) return cb(null);
//                     var q = 'select * from `Taxon_system (GBIF)` where parental_taxon = ' + pool.escape(top_taxon.msaccess_taxon_id);
//                     msAccess.query({q:q}, function(err, res){
//                         if (err) return cb(new MyError('Не удалось получить детей таксона из внешней базы',{err:err, q:q, top_taxon:top_taxon}));
//                         child_taxons = res;
//                         cb(null, res);
//                     });
//                 },
//                 addChildsToSystem:function(cb){
//                     if (global.stopImport) return cb(null);
//                     if (!child_taxons) return cb(null);
//                     async.eachSeries(child_taxons, function(item, cb){
//                         if (global.stopImport) return cb(null);
//                         // Если уже есть, то проставляем связь парент_id
//                         // Если нет, добавим
//                         var this_taxon;
//                         async.series({
//                             getAndSetParentId:function(cb){
//                                 var params = {
//                                     param_where:{
//                                         msaccess_taxon_id:item.taxon_ID
//                                     },
//                                     collapseData:false
//                                 };
//                                 _t.get(params, function (err, res) {
//                                     if (err) return cb(new MyError('Не удалось получить таксон',{params : params, err : err}));
//                                     if (res.length > 1) return cb(new MyError('В системе слишком много таксонов с одинаковым msaccess_taxon_id', {params:params, res:res}));
//                                     if (!res.length) return cb(null);
//                                     this_taxon = res[0];
//                                     item.id = this_taxon.id;
//                                     // set parent_id
//                                     var params = {
//                                         id:this_taxon.id,
//                                         parent_id:top_taxon.id,
//                                         doNotSaveRollback:true,
//                                         rollback_key:rollback_key
//                                     };
//                                     _t.modify(params, function (err, res) {
//                                         if (err) return cb(new MyError('Не удалось проставить parent_id для дочернего таксона',{params : params, err : err}));
//                                         cb(null);
//                                     });
//                                 });
//                             },
//                             checkOrImportTaxonLevel:function(cb){
//                                 if (taxon_level_obj_msaccess[item.tax_level_ID]) return cb(null);
//                                 var o = {
//                                     command:'msaccessImportLevel',
//                                     object:'Taxon_level'
//                                 };
//                                 _t.api(o, function (err, res) {
//                                     if (err) return cb(new MyError('Не удалось импортировать taxon_level',{o : o, err : err}));
//                                     getTaxonLevel(null, function(err, res){
//                                         if (err) return cb(err);
//                                         if (!taxon_level_obj_msaccess[item.tax_level_ID]) {
//                                             return cb(new MyError('В системе нет taxon_level с таким tax_level_ID',{taxon_level_obj_msaccess:taxon_level_obj_msaccess, tax_level_ID:item.tax_level_ID}));
//                                         }
//                                         cb(null);
//                                     });
//                                     cb(null);
//                                 });
//
//                             },
//                             add:function(cb){
//                                 if (this_taxon) return cb(null);
//                                 var params = {
//                                     name:item.taxon_name,
//                                     name_full:item.Full_taxon_name,
//                                     parent_id:top_taxon.id,
//                                     msaccess_taxon_id:item.taxon_ID,
//                                     msaccess_parent_taxon_id:item.parental_taxon,
//                                     msaccess_taxon_level_id:item.tax_level_ID,
//                                     level_id:taxon_level_obj_msaccess[item.tax_level_ID].id,
//                                     doNotSaveRollback:true,
//                                     rollback_key:rollback_key
//                                 };
//                                 _t.add(params, function (err, res) {
//                                     if (err) return cb(new MyError('Не удалось добавить таксон полученный из msaccess',{params : params, err : err}));
//                                     item.id = res.id;
//                                     cb(null);
//                                 });
//                             },
//                             importTraits:function(cb){
//                                 var params = {
//                                     id:item.id,
//                                     doNotSaveRollback:true,
//                                     rollback_key:rollback_key
//                                 };
//                                 _t.msaccessImportTrait(params, function(err, res){
//                                     if (err) return cb(new MyError('Не удалось импортировать свойства для таксона',{params:params, item:item, err:err}));
//                                     cb(null);
//                                 });
//                             }
//                         },cb);
//
//                     }, cb);
//                 },
//                 runImportForChilds:function(cb){
//                     if (global.stopImport) return cb(null);
//                     if (!child_taxons) return cb(null);
//                     async.eachSeries(child_taxons, function(item, cb){
//                         if (global.stopImport) return cb(null);
//                         var params = {
//                             msaccess_taxon_id:item.taxon_ID,
//                             doNotImportTrait:true,
//                             rollback_key:rollback_key
//                         };
//                         _t.msaccessImportNode(params, function(err, res){
//                             if (err) return cb(new UserError('Один из дочерних таксонов не смог импортироваться.',{params:params, err:err}));
//                             cb(null);
//                         })
//                     }, cb);
//                 }
//             },cb);
//         }
//     },function (err, res) {
//
//         if (err) {
//             rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
//                 return cb(err, err2);
//             });
//         } else {
//             if (!doNotSaveRollback){
//                 rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'msaccessImportNode', params:obj});
//             }
//             var msg = (global.stopImport)? 'Импорт был остановлен кнопкой' : 'Ok';
//             cb(null, new UserOk(msg));
//         }
//     });
// };

// var o = {
//     command:'msaccessImportNode',
//     object:'Taxon',
//     params:{
//         msaccess_taxon_id:2418,
//         collapseData:false
//     }
// };
// socketQuery(o, function(res){
//     console.log(res);
// });

Model.prototype.msaccessImportNodeOLD = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var msaccess_taxon_id = obj.msaccess_taxon_id;
    if (isNaN(+msaccess_taxon_id)) return cb(new MyError('Не передан msaccess_taxon_id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var top_taxon;
    var child_taxons;
    var groups_obj_msaccess = {};
    var taxon_level_obj_msaccess = {};
    var data_errors = obj.data_errors || [];

    var getTaxonLevel = function(obj, cb){
        var o = {
            command:'get',
            object:'Taxon_level',
            params:{
                collapseData:false,
                limit:1000
            }
        };
        _t.api(o, function (err, res) {
            if (err) return cb(new MyError('Не удалось получить taxon_level',{o : o, err : err}));
            for (var i in res) {
                taxon_level_obj_msaccess[res[i].msaccess_taxon_level_id] = res[i];
            }
            cb(null);
        });

    };

    async.series({
        getTopTaxon:function(cb){
            var params = {
                param_where:{
                    msaccess_taxon_id:msaccess_taxon_id
                },
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить таксон по msaccess_taxon_id',{params : params, err : err}));
                if (!res.length) return cb(null);
                top_taxon = res[0];
                cb(null);
            });
        },
        getTaxonLevel:function(cb){
            getTaxonLevel(null, cb);
        },
        importAndGetTopTaxon:function(cb){
            // Импортируем
            // Получаем его
            // ищем кто на него ссылается - проставляем связь
            var taxon;
            async.series({
                import:function(cb){
                    if (global.stopImport) return cb(null);
                    var q = 'select * from `Taxon_system (GBIF)` where taxon_ID = ' + pool.escape(msaccess_taxon_id);
                    msAccess.query({q:q}, function(err, res){
                        if (err) return cb(new MyError('Не удалось получить нужный такон из внешней базы',{err:err, q:q}));
                        if (!res.length) return cb(new UserError('Таксон с id ' + msaccess_taxon_id + ' не найден в MS Access базе.'));
                        taxon = res[0];
                        cb(null, res);
                    });
                },
                addToSystemAndGet:function(cb){
                    if (global.stopImport) return cb(null);
                    if (top_taxon) return cb(null);
                    var zero_taxon, parent_taxon;
                    async.series({
                        getParentTaxon:function(cb){
                            if (!taxon.parental_taxon) return cb(null);
                            var params = {
                                param_where:{
                                    msaccess_taxon_id:taxon.parental_taxon
                                },
                                collapseData:false
                            };
                            _t.get(params, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить таксон по parental_taxon',{params : params, err : err}));
                                if (res.length > 1) return cb(new MyError('Таксонов с таким parental_taxon слишком много',{params:params, res:res, taxon:taxon}));
                                if (!res.length) return cb(null);
                                parent_taxon = res[0];
                                cb(null);
                            });
                        },
                        getZeroTaxon:function(cb){
                            if (parent_taxon) return cb(null);
                            var params = {
                                param_where:{
                                    level:0
                                },
                                collapseData:false
                            };
                            _t.get(params, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить таксон нулевого уровня',{params : params, err : err}));
                                if (res.length !== 1) return cb(new MyError('Таксон нулевого уровня не существует или их слишком много',{params:params, res:res}));
                                zero_taxon = res[0];
                                cb(null);
                            });
                        },
                        checkOrImportTaxonLevel:function(cb){
                            if (taxon_level_obj_msaccess[taxon.tax_level_ID]) return cb(null);
                            var o = {
                                command:'msaccessImportLevel',
                                object:'Taxon_level'
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось импортировать taxon_level',{o : o, err : err}));
                                getTaxonLevel(null, function(err, res){
                                    if (err) return cb(err);
                                    if (!taxon_level_obj_msaccess[taxon.tax_level_ID]) {
                                        return cb(new MyError('В системе нет taxon_level с таким tax_level_ID',{taxon_level_obj_msaccess:taxon_level_obj_msaccess, tax_level_ID:taxon.tax_level_ID}));
                                    }
                                    cb(null);
                                });
                            });

                        },
                        add:function(cb){
                            if (!zero_taxon && !parent_taxon) return cb(null);
                            var parent_id = (parent_taxon)? parent_taxon.id : zero_taxon.id;
                            var params = {
                                name:taxon.taxon_name,
                                name_full:taxon.Full_taxon_name,
                                parent_id:parent_id,
                                msaccess_taxon_id:taxon.taxon_ID,
                                msaccess_parent_taxon_id:taxon.parental_taxon,
                                msaccess_taxon_level_id:taxon.tax_level_ID,
                                level_id:taxon_level_obj_msaccess[taxon.tax_level_ID].id,
                                doNotSaveRollback:true,
                                rollback_key:rollback_key
                            };
                            _t.add(params, function (err, res) {
                                if (err) return cb(new MyError('Не удалось добавить таксон полученный из msaccess',{params : params, err : err}));
                                var id = res.id;
                                _t.getById({id:id}, function(err, res){
                                    if (err) return cb(new MyError('Не удалось получить таксон только что добавленный',{id:id, err:err}));
                                    top_taxon = res[0];
                                    cb(null);
                                })
                            });
                        }
                    },cb);

                },
                setLinkToHim:function(cb){
                    if (global.stopImport) return cb(null);
                    var linked_taxons;
                    async.series({
                        getLinked:function(cb){
                            var params = {
                                where:[
                                    {
                                        key:'msaccess_parent_taxon_id',
                                        val1:top_taxon.msaccess_taxon_id
                                    },
                                    {
                                        key:'parent_id',
                                        type:'isNull'
                                    }
                                ],
                                limit:100000,
                                collapseData:false
                            };
                            _t.get(params, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить зависимые таксоны',{params : params, err : err}));
                                linked_taxons = res;
                                cb(null);
                            });
                        },
                        setLink:function(cb){
                            if (!linked_taxons) return cb(null);
                            async.eachSeries(linked_taxons, function(item, cb){
                                var params = {
                                    id:item.id,
                                    parent_id:top_taxon.id,
                                    doNotSaveRollback:true,
                                    rollback_key:rollback_key
                                };
                                _t.modify(params, function (err, res) {
                                    if (err) return cb(new MyError('Не удалось установить parent_id зависимым таксонам',{params : params, err : err}));
                                    cb(null);
                                });
                            }, cb);
                        }
                    },cb);


                },
                importTraits:function(cb){
                    if (obj.doNotImportTrait) return cb(null);
                    var params = {
                        id:top_taxon.id,
                        doNotSaveRollback:true,
                        rollback_key:rollback_key
                    };
                    _t.msaccessImportTrait(params, function(err, res){
                        if (err) return cb(new MyError('Не удалось импортировать свойства для таксона',{params:params, top_taxon:top_taxon, err:err}));
                        // data_errors = data_errors.concat(res.data_errors);
                        cb(null);
                    });
                },
                getChildsFromMSAccess:function(cb){
                    if (global.stopImport) return cb(null);
                    var q = 'select * from `Taxon_system (GBIF)` where parental_taxon = ' + pool.escape(top_taxon.msaccess_taxon_id);
                    msAccess.query({q:q}, function(err, res){
                        if (err) return cb(new MyError('Не удалось получить детей таксона из внешней базы',{err:err, q:q, top_taxon:top_taxon}));
                        child_taxons = res;
                        cb(null, res);
                    });
                },
                addChildsToSystem:function(cb){
                    if (global.stopImport) return cb(null);
                    if (!child_taxons) return cb(null);
                    async.eachSeries(child_taxons, function(item, cb){
                        if (global.stopImport) return cb(null);
                        // Вызовем эту же функцию, для каждого ребенка
                        var params = {
                            msaccess_taxon_id:item.taxon_ID//,
                            // data_errors:data_errors
                            //,
                            // doNotSaveRollback:true,
                            // rollback_key:rollback_key
                        };

                        _t.msaccessImportNode(params, function (err, res) {
                            if (err) return cb(new MyError('Не удалось выполнить импорт для дочки',{params : params, err : err}));
                            // data_errors = data_errors.concat(res.data_errors);
                            cb(null);
                        });

                        // // Если уже есть, то проставляем связь парент_id
                        // // Если нет, добавим
                        // var this_taxon;
                        // async.series({
                        //     getAndSetParentId:function(cb){
                        //         var params = {
                        //             param_where:{
                        //                 msaccess_taxon_id:item.taxon_ID
                        //             },
                        //             collapseData:false
                        //         };
                        //         _t.get(params, function (err, res) {
                        //             if (err) return cb(new MyError('Не удалось получить таксон',{params : params, err : err}));
                        //             if (res.length > 1) return cb(new MyError('В системе слишком много таксонов с одинаковым msaccess_taxon_id', {params:params, res:res}));
                        //             if (!res.length) return cb(null);
                        //             this_taxon = res[0];
                        //             item.id = this_taxon.id;
                        //             // set parent_id
                        //             var params = {
                        //                 id:this_taxon.id,
                        //                 parent_id:top_taxon.id,
                        //                 doNotSaveRollback:true,
                        //                 rollback_key:rollback_key
                        //             };
                        //             _t.modify(params, function (err, res) {
                        //                 if (err) return cb(new MyError('Не удалось проставить parent_id для дочернего таксона',{params : params, err : err}));
                        //                 cb(null);
                        //             });
                        //         });
                        //     },
                        //     checkOrImportTaxonLevel:function(cb){
                        //         if (taxon_level_obj_msaccess[item.tax_level_ID]) return cb(null);
                        //         var o = {
                        //             command:'msaccessImportLevel',
                        //             object:'Taxon_level'
                        //         };
                        //         _t.api(o, function (err, res) {
                        //             if (err) return cb(new MyError('Не удалось импортировать taxon_level',{o : o, err : err}));
                        //             getTaxonLevel(null, function(err, res){
                        //                 if (err) return cb(err);
                        //                 if (!taxon_level_obj_msaccess[item.tax_level_ID]) {
                        //                     return cb(new MyError('В системе нет taxon_level с таким tax_level_ID',{taxon_level_obj_msaccess:taxon_level_obj_msaccess, tax_level_ID:item.tax_level_ID}));
                        //                 }
                        //                 cb(null);
                        //             });
                        //             cb(null);
                        //         });
                        //
                        //     },
                        //     add:function(cb){
                        //         if (this_taxon) return cb(null);
                        //         var params = {
                        //             name:item.taxon_name,
                        //             name_full:item.Full_taxon_name,
                        //             parent_id:top_taxon.id,
                        //             msaccess_taxon_id:item.taxon_ID,
                        //             msaccess_parent_taxon_id:item.parental_taxon,
                        //             msaccess_taxon_level_id:item.tax_level_ID,
                        //             level_id:taxon_level_obj_msaccess[item.tax_level_ID].id,
                        //             doNotSaveRollback:true,
                        //             rollback_key:rollback_key
                        //         };
                        //         _t.add(params, function (err, res) {
                        //             if (err) return cb(new MyError('Не удалось добавить таксон полученный из msaccess',{params : params, err : err}));
                        //             item.id = res.id;
                        //             cb(null);
                        //         });
                        //     },
                        //     importTraits:function(cb){
                        //         var params = {
                        //             id:item.id,
                        //             doNotSaveRollback:true,
                        //             rollback_key:rollback_key
                        //         };
                        //         _t.msaccessImportTrait(params, function(err, res){
                        //             if (err) return cb(new MyError('Не удалось импортировать свойства для таксона',{params:params, item:item, err:err}));
                        //             cb(null);
                        //         });
                        //     }
                        // },cb);

                    }, cb);
                }//,
                // runImportForChilds:function(cb){
                //     if (global.stopImport) return cb(null);
                //     if (!child_taxons) return cb(null);
                //     async.eachSeries(child_taxons, function(item, cb){
                //         if (global.stopImport) return cb(null);
                //         var params = {
                //             msaccess_taxon_id:item.taxon_ID,
                //             doNotImportTrait:true,
                //             rollback_key:rollback_key
                //         };
                //         _t.msaccessImportNode(params, function(err, res){
                //             if (err) return cb(new UserError('Один из дочерних таксонов не смог импортироваться.',{params:params, err:err}));
                //             cb(null);
                //         })
                //     }, cb);
                // }
            },cb);
        }
    },function (err, res) {

        if (err) {
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!doNotSaveRollback){
               rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'msaccessImportNode', params:obj});
            }
            var msg = (global.stopImport)? 'Импорт был остановлен кнопкой' : 'Ok';
            cb(null, new UserOk(msg, {data_errors:data_errors}));
        }
    });
};

Model.prototype.msaccessImportNodeOLD2 = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var msaccess_taxon_id = obj.msaccess_taxon_id;
    if (isNaN(+msaccess_taxon_id)) return cb(new MyError('Не передан msaccess_taxon_id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var top_taxon;
    var child_taxons;
    var groups_obj_msaccess = {};
    var taxon_level_obj_msaccess = {};
    var data_errors = obj.data_errors || [];

    var getTaxonLevel = function(obj, cb){
        var o = {
            command:'get',
            object:'Taxon_level',
            params:{
                collapseData:false,
                limit:1000
            }
        };
        _t.api(o, function (err, res) {
            if (err) return cb(new MyError('Не удалось получить taxon_level',{o : o, err : err}));
            for (var i in res) {
                taxon_level_obj_msaccess[res[i].msaccess_taxon_level_id] = res[i];
            }
            cb(null);
        });

    };

    async.series({
        getTopTaxon:function(cb){
            var params = {
                param_where:{
                    msaccess_taxon_id:msaccess_taxon_id
                },
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить таксон по msaccess_taxon_id',{params : params, err : err}));
                if (!res.length) return cb(null);
                top_taxon = res[0];
                cb(null);
            });
        },
        getTaxonLevel:function(cb){
            getTaxonLevel(null, cb);
        },
        importAndGetTopTaxon:function(cb){
            // Импортируем
            // Получаем его
            // ищем кто на него ссылается - проставляем связь
            var taxon;
            async.series({
                import:function(cb){
                    if (global.stopImport) return cb(null);
                    var q = 'select * from `Taxon_system (GBIF)` where taxon_ID = ' + pool.escape(msaccess_taxon_id) + ' and tax_level_ID = 2';
                    msAccess.query({q:q}, function(err, res){
                        if (err) return cb(new MyError('Не удалось получить нужный такон из внешней базы',{err:err, q:q}));
                        if (!res.length) return cb(new UserError('Таксон с id ' + msaccess_taxon_id + ' не найден в MS Access базе.'));
                        taxon = res[0];
                        cb(null, res);
                    });
                },
                addToSystemAndGet:function(cb){
                    if (global.stopImport) return cb(null);
                    if (top_taxon) return cb(null);
                    var zero_taxon, parent_taxon;
                    async.series({
                        getParentTaxon:function(cb){
                            if (!taxon.parental_taxon) return cb(null);
                            var params = {
                                param_where:{
                                    msaccess_taxon_id:taxon.parental_taxon
                                },
                                collapseData:false
                            };
                            _t.get(params, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить таксон по parental_taxon',{params : params, err : err}));
                                if (res.length > 1) return cb(new MyError('Таксонов с таким parental_taxon слишком много',{params:params, res:res, taxon:taxon}));
                                if (!res.length) return cb(null);
                                parent_taxon = res[0];
                                cb(null);
                            });
                        },
                        getZeroTaxon:function(cb){
                            if (parent_taxon) return cb(null);
                            var params = {
                                param_where:{
                                    level:0
                                },
                                collapseData:false
                            };
                            _t.get(params, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить таксон нулевого уровня',{params : params, err : err}));
                                if (res.length !== 1) return cb(new MyError('Таксон нулевого уровня не существует или их слишком много',{params:params, res:res}));
                                zero_taxon = res[0];
                                cb(null);
                            });
                        },
                        checkOrImportTaxonLevel:function(cb){
                            if (taxon_level_obj_msaccess[taxon.tax_level_ID]) return cb(null);
                            var o = {
                                command:'msaccessImportLevel',
                                object:'Taxon_level'
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось импортировать taxon_level',{o : o, err : err}));
                                getTaxonLevel(null, function(err, res){
                                    if (err) return cb(err);
                                    if (!taxon_level_obj_msaccess[taxon.tax_level_ID]) {
                                        return cb(new MyError('В системе нет taxon_level с таким tax_level_ID',{taxon_level_obj_msaccess:taxon_level_obj_msaccess, tax_level_ID:taxon.tax_level_ID}));
                                    }
                                    cb(null);
                                });
                            });

                        },
                        add:function(cb){
                            if (!zero_taxon && !parent_taxon) return cb(null);
                            var parent_id = (parent_taxon)? parent_taxon.id : zero_taxon.id;
                            var params = {
                                name:taxon.taxon_name,
                                name_full:taxon.Full_taxon_name,
                                parent_id:parent_id,
                                msaccess_taxon_id:taxon.taxon_ID,
                                msaccess_parent_taxon_id:taxon.parental_taxon,
                                msaccess_taxon_level_id:taxon.tax_level_ID,
                                level_id:taxon_level_obj_msaccess[taxon.tax_level_ID].id,
                                doNotSaveRollback:true,
                                rollback_key:rollback_key
                            };
                            _t.add(params, function (err, res) {
                                if (err) return cb(new MyError('Не удалось добавить таксон полученный из msaccess',{params : params, err : err}));
                                var id = res.id;
                                _t.getById({id:id}, function(err, res){
                                    if (err) return cb(new MyError('Не удалось получить таксон только что добавленный',{id:id, err:err}));
                                    top_taxon = res[0];
                                    cb(null);
                                })
                            });
                        }
                    },cb);

                },
                setLinkToHim:function(cb){
                    if (global.stopImport) return cb(null);
                    var linked_taxons;
                    async.series({
                        getLinked:function(cb){
                            var params = {
                                where:[
                                    {
                                        key:'msaccess_parent_taxon_id',
                                        val1:top_taxon.msaccess_taxon_id
                                    },
                                    {
                                        key:'parent_id',
                                        type:'isNull'
                                    }
                                ],
                                limit:100000,
                                collapseData:false
                            };
                            _t.get(params, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить зависимые таксоны',{params : params, err : err}));
                                linked_taxons = res;
                                cb(null);
                            });
                        },
                        setLink:function(cb){
                            if (!linked_taxons) return cb(null);
                            async.eachSeries(linked_taxons, function(item, cb){
                                var params = {
                                    id:item.id,
                                    parent_id:top_taxon.id,
                                    doNotSaveRollback:true,
                                    rollback_key:rollback_key
                                };
                                _t.modify(params, function (err, res) {
                                    if (err) return cb(new MyError('Не удалось установить parent_id зависимым таксонам',{params : params, err : err}));
                                    cb(null);
                                });
                            }, cb);
                        }
                    },cb);


                },
                importTraits:function(cb){
                    if (obj.doNotImportTrait) return cb(null);
                    var params = {
                        id:top_taxon.id,
                        doNotSaveRollback:true,
                        rollback_key:rollback_key
                    };
                    _t.msaccessImportTrait(params, function(err, res){
                        if (err) return cb(new MyError('Не удалось импортировать свойства для таксона',{params:params, top_taxon:top_taxon, err:err}));
                        // data_errors = data_errors.concat(res.data_errors);
                        cb(null);
                    });
                },
                getChildsFromMSAccess:function(cb){
                    if (global.stopImport) return cb(null);
                    var q = 'select * from `Taxon_system (GBIF)` where parental_taxon = ' + pool.escape(top_taxon.msaccess_taxon_id);
                    msAccess.query({q:q}, function(err, res){
                        if (err) return cb(new MyError('Не удалось получить детей таксона из внешней базы',{err:err, q:q, top_taxon:top_taxon}));
                        child_taxons = res;
                        cb(null, res);
                    });
                },
                addChildsToSystem:function(cb){
                    if (global.stopImport) return cb(null);
                    if (!child_taxons) return cb(null);
                    async.eachSeries(child_taxons, function(item, cb){
                        if (global.stopImport) return cb(null);
                        // Вызовем эту же функцию, для каждого ребенка
                        var params = {
                            msaccess_taxon_id:item.taxon_ID//,
                            // data_errors:data_errors
                            //,
                            // doNotSaveRollback:true,
                            // rollback_key:rollback_key
                        };

                        _t.msaccessImportNode(params, function (err, res) {
                            if (err) return cb(new MyError('Не удалось выполнить импорт для дочки',{params : params, err : err}));
                            // data_errors = data_errors.concat(res.data_errors);
                            cb(null);
                        });

                        // // Если уже есть, то проставляем связь парент_id
                        // // Если нет, добавим
                        // var this_taxon;
                        // async.series({
                        //     getAndSetParentId:function(cb){
                        //         var params = {
                        //             param_where:{
                        //                 msaccess_taxon_id:item.taxon_ID
                        //             },
                        //             collapseData:false
                        //         };
                        //         _t.get(params, function (err, res) {
                        //             if (err) return cb(new MyError('Не удалось получить таксон',{params : params, err : err}));
                        //             if (res.length > 1) return cb(new MyError('В системе слишком много таксонов с одинаковым msaccess_taxon_id', {params:params, res:res}));
                        //             if (!res.length) return cb(null);
                        //             this_taxon = res[0];
                        //             item.id = this_taxon.id;
                        //             // set parent_id
                        //             var params = {
                        //                 id:this_taxon.id,
                        //                 parent_id:top_taxon.id,
                        //                 doNotSaveRollback:true,
                        //                 rollback_key:rollback_key
                        //             };
                        //             _t.modify(params, function (err, res) {
                        //                 if (err) return cb(new MyError('Не удалось проставить parent_id для дочернего таксона',{params : params, err : err}));
                        //                 cb(null);
                        //             });
                        //         });
                        //     },
                        //     checkOrImportTaxonLevel:function(cb){
                        //         if (taxon_level_obj_msaccess[item.tax_level_ID]) return cb(null);
                        //         var o = {
                        //             command:'msaccessImportLevel',
                        //             object:'Taxon_level'
                        //         };
                        //         _t.api(o, function (err, res) {
                        //             if (err) return cb(new MyError('Не удалось импортировать taxon_level',{o : o, err : err}));
                        //             getTaxonLevel(null, function(err, res){
                        //                 if (err) return cb(err);
                        //                 if (!taxon_level_obj_msaccess[item.tax_level_ID]) {
                        //                     return cb(new MyError('В системе нет taxon_level с таким tax_level_ID',{taxon_level_obj_msaccess:taxon_level_obj_msaccess, tax_level_ID:item.tax_level_ID}));
                        //                 }
                        //                 cb(null);
                        //             });
                        //             cb(null);
                        //         });
                        //
                        //     },
                        //     add:function(cb){
                        //         if (this_taxon) return cb(null);
                        //         var params = {
                        //             name:item.taxon_name,
                        //             name_full:item.Full_taxon_name,
                        //             parent_id:top_taxon.id,
                        //             msaccess_taxon_id:item.taxon_ID,
                        //             msaccess_parent_taxon_id:item.parental_taxon,
                        //             msaccess_taxon_level_id:item.tax_level_ID,
                        //             level_id:taxon_level_obj_msaccess[item.tax_level_ID].id,
                        //             doNotSaveRollback:true,
                        //             rollback_key:rollback_key
                        //         };
                        //         _t.add(params, function (err, res) {
                        //             if (err) return cb(new MyError('Не удалось добавить таксон полученный из msaccess',{params : params, err : err}));
                        //             item.id = res.id;
                        //             cb(null);
                        //         });
                        //     },
                        //     importTraits:function(cb){
                        //         var params = {
                        //             id:item.id,
                        //             doNotSaveRollback:true,
                        //             rollback_key:rollback_key
                        //         };
                        //         _t.msaccessImportTrait(params, function(err, res){
                        //             if (err) return cb(new MyError('Не удалось импортировать свойства для таксона',{params:params, item:item, err:err}));
                        //             cb(null);
                        //         });
                        //     }
                        // },cb);

                    }, cb);
                }//,
                // runImportForChilds:function(cb){
                //     if (global.stopImport) return cb(null);
                //     if (!child_taxons) return cb(null);
                //     async.eachSeries(child_taxons, function(item, cb){
                //         if (global.stopImport) return cb(null);
                //         var params = {
                //             msaccess_taxon_id:item.taxon_ID,
                //             doNotImportTrait:true,
                //             rollback_key:rollback_key
                //         };
                //         _t.msaccessImportNode(params, function(err, res){
                //             if (err) return cb(new UserError('Один из дочерних таксонов не смог импортироваться.',{params:params, err:err}));
                //             cb(null);
                //         })
                //     }, cb);
                // }
            },cb);
        }
    },function (err, res) {

        if (err) {
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'msaccessImportNode', params:obj});
            }
            var msg = (global.stopImport)? 'Импорт был остановлен кнопкой' : 'Ok';
            cb(null, new UserOk(msg, {data_errors:data_errors}));
        }
    });
};

Model.prototype.msaccessImportNode = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var msaccess_taxon_id = obj.msaccess_taxon_id;
    if (isNaN(+msaccess_taxon_id)) return cb(new MyError('Не передан msaccess_taxon_id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var top_taxon;
    var child_taxons;
    var groups_obj_msaccess = {};
    var taxon_level_obj_msaccess = {};
    var data_errors = obj.data_errors || [];

    var getTaxonLevel = function(obj, cb){
        var o = {
            command:'get',
            object:'Taxon_level',
            params:{
                collapseData:false,
                limit:1000
            }
        };
        _t.api(o, function (err, res) {
            if (err) return cb(new MyError('Не удалось получить taxon_level',{o : o, err : err}));
            for (var i in res) {
                taxon_level_obj_msaccess[res[i].msaccess_taxon_level_id] = res[i];
            }
            cb(null);
        });

    };

    async.series({
        getZeroTaxon:function(cb){
            var params = {
                param_where:{
                    level:0
                },
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить таксон нулевого уровня',{params : params, err : err}));
                if (res.length !== 1) return cb(new MyError('Таксон нулевого уровня не существует или их слишком много',{params:params, res:res}));
                top_taxon = res[0];
                cb(null);
            });
        },
        getTaxonLevel:function(cb){
            getTaxonLevel(null, cb);
        },
        importAndGetTopTaxon: function (cb) {
            // Импортируем
            // Получаем его
            // ищем кто на него ссылается - проставляем связь
            var taxons;
            async.series({
                import: function (cb) {
                    if (global.stopImport) return cb(null);
                    var q = 'select * from `Taxon_system (GBIF)` where tax_level_ID = 1';
                    msAccess.query({q: q}, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить нужный такон из внешней базы', {
                            err: err,
                            q: q
                        }));
                        for (var i in res) {
                            res[i].tax_level_ID = 2;
                        }
                        taxons = res;
                        cb(null);
                    });
                },
                addToSystemAndGet: function (cb) {
                    if (global.stopImport) return cb(null);
                    async.eachSeries(taxons, function (taxon, cb) {
                        var imported_taxon;
                        async.series({
                            checkOrImportTaxonLevel: function (cb) {
                                if (taxon_level_obj_msaccess[taxon.tax_level_ID]) return cb(null);
                                var o = {
                                    command: 'msaccessImportLevel',
                                    object: 'Taxon_level'
                                };
                                _t.api(o, function (err, res) {
                                    if (err) return cb(new MyError('Не удалось импортировать taxon_level', {
                                        o: o,
                                        err: err
                                    }));
                                    getTaxonLevel(null, function (err, res) {
                                        if (err) return cb(err);
                                        if (!taxon_level_obj_msaccess[taxon.tax_level_ID]) {
                                            return cb(new MyError('В системе нет taxon_level с таким tax_level_ID', {
                                                taxon_level_obj_msaccess: taxon_level_obj_msaccess,
                                                tax_level_ID: taxon.tax_level_ID
                                            }));
                                        }
                                        cb(null);
                                    });
                                });

                            },
                            add: function (cb) {
                                var params = {
                                    name: taxon.taxon_name,
                                    name_full: taxon.Full_taxon_name,
                                    parent_id:top_taxon.id,
                                    msaccess_taxon_id: taxon.taxon_ID,
                                    msaccess_parent_taxon_id: taxon.parental_taxon,
                                    msaccess_taxon_level_id: taxon.tax_level_ID,
                                    level_id: taxon_level_obj_msaccess[taxon.tax_level_ID].id,
                                    doNotSaveRollback: true,
                                    rollback_key: rollback_key
                                };
                                _t.add(params, function (err, res) {
                                    if (err) {
                                        if (err.message === 'Такая запись уже есть.') return cb(null);
                                        return cb(new MyError('Не удалось добавить таксон полученный из msaccess', {
                                            params: params,
                                            err: err
                                        }));
                                    }
                                    var id = res.id;
                                    _t.getById({id: id}, function (err, res) {
                                        if (err) return cb(new MyError('Не удалось получить таксон только что добавленный', {
                                            id: id,
                                            err: err
                                        }));
                                        imported_taxon = res[0];
                                        cb(null);
                                    })
                                });
                            },
                            importTraits: function (cb) {
                                if (obj.doNotImportTrait) return cb(null);
                                if (!imported_taxon) return cb(null);
                                var params = {
                                    id: imported_taxon.id,
                                    doNotSaveRollback: true,
                                    rollback_key: rollback_key
                                };
                                _t.msaccessImportTrait(params, function (err, res) {
                                    if (err) {
                                        console.log('Не удалось импортировать свойства для таксона',err, params,imported_taxon);
                                        return cb(null);
                                        // return cb(new MyError('Не удалось импортировать свойства для таксона', {
                                        //     params: params,
                                        //     imported_taxon: imported_taxon,
                                        //     err: err
                                        // }));
                                    }
                                    // data_errors = data_errors.concat(res.data_errors);
                                    cb(null);
                                });
                            }
                        }, cb);
                    }, cb);
                }
            }, cb);
        }
    },function (err, res) {

        if (err) {
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            // if (!doNotSaveRollback){
            //     rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'msaccessImportNode', params:obj});
            // }
            var msg = (global.stopImport)? 'Импорт был остановлен кнопкой' : 'Ok';
            cb(null, new UserOk(msg, {data_errors:data_errors}));
        }
    });
};

Model.prototype.STOPmsaccessImportNode = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    global.stopImport = !global.stopImport;
    var msg = (global.stopImport)? 'Импорт остановлен и запускаться не будет.' : 'Запуск импорта снова доступен.';
    cb(null, new UserOk(msg));
};

// var o = {
//     command:'msaccessImportTrait',
//     object:'Taxon',
//     params:{
//         id:2207
//     }
// };
// socketQuery(o, function(res){
//     console.log(res);
// });
Model.prototype.msaccessImportTrait = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var taxon, parents;
    var avalible_traits_obj_msaccess;
    var taxon_avalible_traits = {};
    var groups_obj_msaccess;

    var data_errors = [];

    // var structure = {
    //     "id" : { "type": "bigint", "length": "20", "notNull": true, "autoInc": true, "primary_key": true},
    //     "taxon_id": { "type": "bigint", "length": "20", "parent_key": true, "unique":true},
    //     "taxon_level" : {"type": "bigint", "from_table": "taxon", "keyword": "taxon_id", "return_column": "level", "is_virtual": true},
    //     "msaccess_trait_id" : {"type": "bigint", "length": "20", "visible": true},
    //     "name" : {"type": "varchar", "length": "255", "unique":true},
    //     "name_ru" : {"type": "varchar", "length": "255", "unique":true},
    //     "is_main_filter": { "type": "tinyint", "length": "1"},
    //     "filter_raiting" : {"type": "DECIMAL(50,10)"},
    //     "trait_type_id" : {"type": "bigint", "length": "20", "visible": false},
    //     "trait_type_sysname" : {"type": "varchar", "length": "255", "from_table": "trait_type", "keyword": "trait_type_id", "return_column": "sysname", "is_virtual": true, "visible": false},
    //     "trait_type_sub_table_name" : {"type": "varchar", "length": "255", "from_table": "trait_type", "keyword": "trait_type_id", "return_column": "sub_table_name", "is_virtual": true, "visible": false},
    //     "sub_table_name_for_select" : {"type": "varchar", "length": "255"},
    //     "definition" : {"type": "text"},
    //     "definition_de" : {"type": "text"},
    //     "definition_bahasa" : {"type": "text"},
    //     "sort_no" : {"type": "bigint", "length": "20"},
    //     "fields_ru" : {"type": "text"},
    //     "fields" : {"type": "text"}
    // }


    var getAvalibleTraits = function(obj, cb){
        var o = {
            command:'get',
            object:'taxon_avalible_trait',
            params:{
                columns:['id','taxon_id','taxon_level','msaccess_trait_id','name','name_ru','sub_table_name_for_select'],
                collapseData:false
            }
        };
        _t.api(o, function (err, res) {
            if (err) return cb(new MyError('Не удалось получить taxon_avalible_trait',{o : o, err : err}));
            avalible_traits_obj_msaccess = {};
            for (var i in res) {
                avalible_traits_obj_msaccess[res[i].msaccess_trait_id] = res[i];
            }
            cb(null);
        });
    };
    var getGroups = function(obj, cb){
        var params = {
            param_where:{
                is_group:true
            },
            columns:['id','msaccess_group_id'],
            collapseData:false
        };
        _t.get(params, function (err, res) {
            if (err) return cb(new MyError('Не удалось получить Группы',{params : params, err : err}));
            groups_obj_msaccess = {};
            for (var i in res) {
                groups_obj_msaccess[res[i].msaccess_group_id] = res[i];
            }
            cb(null);
        });
    };


    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon.',{id:id,err:err}));
                taxon = res[0];
                // parents = taxon.level_char.split(',');
                if (!taxon.msaccess_taxon_id) return cb(new UserOk('Такого таксона нет во внешней базе.',{taxon:taxon}));
                cb(null);
            });
        },
        getParents:function(cb){
            _t.getParentIds({id:id}, function(err, res){
                if (err) return cb(err);
                parents = res.ids;
                cb(null, res);
            })
        },
        getGroups:function(cb){
            getGroups(null, cb);
        },
        getAvalibleTraits:function(cb){
            getAvalibleTraits(null, cb);
        },
        syncTraits:function(cb){
            // Получить свойства для таксона
            // Получить свойства из msaccess
            // Смерждить
            var taxon_trait_value_obj_msaccess = {};
            async.series({
                getTraitValue:function(cb){


                    var o = {
                        command:'get',
                        object:'taxon_trait_value',
                        params:{
                            param_where:{
                                taxon_id:taxon.id
                            },
                            columns:['id','taxon_id','name','taxon_avalible_trait_id','taxon_avalible_trait_taxon_id','trait_type_sysname','trait_type_sub_table_name','msaccess_tax_num_id','msaccess_tax_text_id','msaccess_tax_choice_id'],
                            limit:1000000,
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить taxon_trait_value',{o : o, err : err}));

                        for (var i in res) {
                            if (res[i].msaccess_tax_num_id){
                                taxon_trait_value_obj_msaccess['NUM_' + res[i].msaccess_tax_num_id] = res[i];
                            }else if (res[i].msaccess_tax_text_id){
                                taxon_trait_value_obj_msaccess['TEXT_' + res[i].msaccess_tax_text_id] = res[i];
                            }else if (res[i].msaccess_tax_choice_id){
                                taxon_trait_value_obj_msaccess['SELECT_' + res[i].msaccess_tax_choice_id] = res[i];
                            }
                        }
                        cb(null);
                    });
                },
                getMSAccessTraits:function(cb){
                    async.series({
                        getNum:function(cb){
                            var q = 'select * from `Taxon_traits_number` where Taxon_ID = ' + pool.escape(taxon.msaccess_taxon_id);
                            msAccess.query({q:q}, function(err, res){
                                if (err) return cb(new MyError('Не удалось получить список Taxon_traits_number из внешней базы',{err:err, q:q}));
                                for (var i in res) {
                                    if (!taxon_trait_value_obj_msaccess['NUM_' + res[i].Tax_num_ID]) {
                                        taxon_trait_value_obj_msaccess['NUM_' + res[i].Tax_num_ID] = {
                                            msaccess_tax_num_id:res[i].Tax_num_ID,
                                            trait_type_sysname:'INTEGER',
                                            to_add:true
                                        };
                                    }
                                    taxon_trait_value_obj_msaccess['NUM_' + res[i].Tax_num_ID].msaccess_trait_value = res[i];
                                }
                                cb(null, res);
                            });
                        },
                        getText:function(cb){
                            var q = 'select * from `Taxon_traits_text` where Taxon_ID = ' + pool.escape(taxon.msaccess_taxon_id);
                            msAccess.query({q:q}, function(err, res){
                                if (err) return cb(new MyError('Не удалось получить список Taxon_traits_text из внешней базы',{err:err, q:q}));
                                for (var i in res) {
                                    if (!taxon_trait_value_obj_msaccess['TEXT_' + res[i].Tax_text_ID]) {
                                        taxon_trait_value_obj_msaccess['TEXT_' + res[i].Tax_text_ID] = {
                                            msaccess_tax_text_id:res[i].Tax_text_ID,
                                            trait_type_sysname:'TEXT',
                                            to_add:true
                                        };
                                    }
                                    taxon_trait_value_obj_msaccess['TEXT_' + res[i].Tax_text_ID].msaccess_trait_value = res[i];
                                }
                                cb(null, res);
                            });
                        },
                        getChoice:function(cb){
                            var q = 'select * from `Taxon_traits_choice` where Taxon_ID = ' + pool.escape(taxon.msaccess_taxon_id);
                            msAccess.query({q:q}, function(err, res){
                                if (err) return cb(new MyError('Не удалось получить список Taxon_traits_choice из внешней базы',{err:err, q:q}));

                                // async.eachSeries(res, function(one_res, cb){
                                //     if (!taxon_trait_value_obj_msaccess['SELECT_' + one_res.Tax_trait_ID]) {
                                //         taxon_trait_value_obj_msaccess['SELECT_' + one_res.Tax_trait_ID] = {
                                //             msaccess_tax_choice_id:one_res.Tax_trait_ID,
                                //             trait_type_sysname:'SELECT',
                                //             to_add:true
                                //         };
                                //     }
                                //     taxon_trait_value_obj_msaccess['SELECT_' + one_res.Tax_trait_ID].msaccess_trait_value = one_res;
                                //     if (taxon_trait_value_obj_msaccess['SELECT_' + one_res.Tax_trait_ID].to_add) return cb(null);
                                //     console.log('Необходимо запросить данные из справочника.');
                                // }, cb);


                                for (var i in res) {
                                    if (!taxon_trait_value_obj_msaccess['SELECT_' + res[i].Tax_trait_ID]) {
                                        taxon_trait_value_obj_msaccess['SELECT_' + res[i].Tax_trait_ID] = {
                                            msaccess_tax_choice_id:res[i].Tax_trait_ID,
                                            trait_type_sysname:'SELECT',
                                            to_add:true
                                        };
                                    }
                                    taxon_trait_value_obj_msaccess['SELECT_' + res[i].Tax_trait_ID].msaccess_trait_value = res[i];
                                }
                                cb(null, res);
                            });
                        }
                    }, cb);
                },
                addNeededAvalibleTrait:function(cb){
                    async.eachSeries(taxon_trait_value_obj_msaccess, function(item, cb){
                        // Если это свойство уже есть в объекте, то просто возьмем его.
                        // Если у нас нет то загрузим из msaccess (перезагружать объект avalible_traits_obj_msaccess не имеет смысла. Просто присвоим значение к item.taxon_avalible_trait_id)
                        if (avalible_traits_obj_msaccess[item.msaccess_trait_value.Trait_ID]){
                            item.taxon_avalible_trait_id = avalible_traits_obj_msaccess[item.msaccess_trait_value.Trait_ID].id;
                            item.sub_table_name_for_select = avalible_traits_obj_msaccess[item.msaccess_trait_value.Trait_ID].sub_table_name_for_select;
                            return cb(null);
                        }
                        //  Иначе импортируем из msaccess
                        var q = 'select * from `ALL_TRAIT_LIST` where Trait_ID = ' + pool.escape(item.msaccess_trait_value.Trait_ID);
                        msAccess.query({q:q}, function(err, res){
                            if (err) return cb(new MyError('Не удалось получить список ALL_TRAIT_LIST из внешней базы',{err:err, q:q}));
                            if (!res.length) return cb(new MyError('Во внешней базе нет такого TRAIT',{q:q}));
                            var msaccess_trait = res[0];
                            async.series({
                                getOrAddGroup:function(cb){
                                    // return cb(null);
                                    if (groups_obj_msaccess[msaccess_trait.Group_ID]) return cb(null);
                                    // Иначе импортируем из msaccess Group
                                    var q = 'select * from `Groups` where Group_ID = ' + pool.escape(msaccess_trait.Group_ID);
                                    msAccess.query({q:q}, function(err, res){
                                        if (err) return cb(new MyError('Не удалось получить Groups из внешней базы',{err:err, q:q}));
                                        if (!res.length) return cb(new MyError('Во внешней базе нет такой Groups',{q:q}));
                                        var group = res[0];
                                        // Обновим нужный таксон, проставим is_group = true и msaccess_group_id
                                        // перезагрущим groups_obj_msaccess

                                        group.Group_name = 'Life'; // Установим принудительно


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
                                                if (group.Taxon_ID === 1 || group.Group_name === 'Life'){
                                                    delete params.param_where.msaccess_taxon_id;
                                                    params.param_where.level = 0;
                                                }
                                                _t.get(params, function (err, res) {
                                                    if (err) return cb(new MyError('Не удалось получить таксон по msaccess_taxon_id или нулевой',{params : params, err : err}));
                                                    if (res.length > 1) return cb(new MyError('В системе слишком много таксонов с одинаковым msaccess_taxon_id или нулевых', {params:params, res:res}));
                                                    if (!res.length) return cb(new MyError('Таксон с таким msaccess_taxon_id еще не загружен в систему. Или нет нулевого таксона. Возможно надо загрузить ветку более высокого уровня.',{params:params}));
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
                                                _t.modify(params, function (err, res) {
                                                    if (err) return cb(new MyError('Не удалось изменить таксон, проставить msaccess_group_id',{params : params, err : err}));
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
                                            item.taxon_avalible_trait_id = res.id;
                                            avalible_traits_obj_msaccess[item.msaccess_trait_value.Trait_ID] = {id:res.id};
                                            item.taxon_avalible_trait_alias = res.alias;
                                            return cb(null);
                                        });
                                    }else{
                                        // Запросим все значения справочника и нафигачим ими свой справочник
                                        async.series({
                                            addAvailibleTrait:function(cb){
                                                _t.api(o, function (err, res) {
                                                    if (err) return cb(new MyError('Не удалось добавить taxon_avalible_trait',{o : o, err : err}));
                                                    item.taxon_avalible_trait_id = res.id;
                                                    avalible_traits_obj_msaccess[item.msaccess_trait_value.Trait_ID] = {id:res.id};
                                                    item.taxon_avalible_trait_alias = res.alias;
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
                                                            object:item.taxon_avalible_trait_alias,
                                                            params:{
                                                                taxon_avalible_trait_id:item.taxon_avalible_trait_id,
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
                                                            if (!item.msaccess_trait_value.values) item.msaccess_trait_value.values = {};
                                                            item.msaccess_trait_value.values[one_val.Trait_value_ID] = res.id;
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
                        });
                    }, cb);
                },
                addNewTrait:function(cb){
                    var trait_type_obj = {};
                    async.series({
                        getTraitType:function(cb){
                            var o = {
                                command:'get',
                                object:'trait_type',
                                params:{
                                    collapseData:false
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить trait_type',{o : o, err : err}));
                                for (var i in res) {
                                    trait_type_obj[res[i].sysname] = res[i];
                                }
                                cb(null);
                            });
                        },
                        addNew:function(cb){
                            // var arr = [];
                            // for (var i in taxon_trait_value_obj_msaccess) {
                            //     if (taxon_trait_value_obj_msaccess[i].msaccess_tax_choice_id) arr.push(taxon_trait_value_obj_msaccess[i]);
                            // }
                            // console.log(arr);
                            var taxon_id_obj = {};
                            async.eachSeries(taxon_trait_value_obj_msaccess, function(item, cb){
                                if (!item.to_add) return cb(null);
                                if (!taxon_id_obj[taxon.id]) taxon_id_obj[taxon.id] = [];

                                if (taxon_id_obj[taxon.id].indexOf(item.taxon_avalible_trait_id) !== -1) {
                                    data_errors.push({
                                        msg:'Повторяющиеся данные которых не может быть: ' + taxon_id_obj[taxon.id] + ' taxon_avalible_trait_id',
                                        item:item,
                                        taxon_avalible_trait_id:item.taxon_avalible_trait_id
                                    });
                                    console.log('DATA ERROR', 'Повторяющиеся данные которых не может быть', taxon_id_obj[taxon.id], 'taxon_avalible_trait_id' ,item.taxon_avalible_trait_id);
                                    return cb(null);
                                }
                                taxon_id_obj[taxon.id].push(item.taxon_avalible_trait_id);
                                async.series({
                                    getValForSelect:function(cb){
                                        if (item.trait_type_sysname !== 'SELECT') return cb(null);
                                        if (item.msaccess_trait_value.values) return cb(null);

                                        var o = {
                                            command:'get',
                                            object:item.taxon_avalible_trait_alias || item.sub_table_name_for_select,
                                            params:{
                                                collapseData:false
                                            }
                                        };
                                        _t.api(o, function (err, res) {
                                            if (err) {
                                                return cb(new MyError('Не удалось получить значения справочника!',{o : o, err : err}));
                                            }
                                            item.msaccess_trait_value.values = {};
                                            for (var i in res) {
                                                var msaccess_id = +res[i].value2;
                                                if (isNaN(msaccess_id)) continue;
                                                item.msaccess_trait_value.values[msaccess_id] = res[i].id;
                                            }
                                            cb(null);
                                        });

                                    },
                                    add:function(cb){
                                        var o = {
                                            command:'add',
                                            object:'taxon_trait_value',
                                            params:{
                                                taxon_id:taxon.id,
                                                taxon_avalible_trait_id:item.taxon_avalible_trait_id,
                                                msaccess_tax_num_id:item.msaccess_tax_num_id,
                                                msaccess_tax_text_id:item.msaccess_tax_text_id,
                                                msaccess_tax_choice_id:item.msaccess_tax_choice_id,
                                                rollback_key:rollback_key
                                            }
                                        };
                                        _t.api(o, function (err, res) {
                                            if (err) {
                                                // return cb(null);
                                                return cb(new MyError('Не удалось добавить taxon_trait_value',{o : o, err : err}));
                                            }
                                            item.id = res.id;
                                            item.taxon_id = taxon.id;
                                            // Теперь добавим само значение
                                            var o = {
                                                command:'add',
                                                object:trait_type_obj[item.trait_type_sysname].sub_table_name,
                                                params:{
                                                    taxon_trait_value_id:item.id,
                                                    rollback_key:rollback_key
                                                }
                                            };
                                            switch (item.trait_type_sysname){
                                                case "INTEGER":
                                                    o.params.value1 = +item.msaccess_trait_value.Trait_value;
                                                    break;
                                                case "SELECT":
                                                    if (!item.msaccess_trait_value.values) {
                                                        data_errors.push({
                                                            msg:'Свойства ссылается на несуществующий элемент справочника. Нет ни одного значения.',
                                                            item:item,
                                                            msaccess_trait_value:item.msaccess_trait_value
                                                        });
                                                        console.log('DATA ERROR', 'Свойства ссылается на несуществующий элемент справочника. Нет ни одного значения.', item);
                                                        o.params.value1 = null;
                                                    }else if (!item.msaccess_trait_value.values[item.msaccess_trait_value.Trait_value]) {
                                                        data_errors.push({
                                                            msg:'Свойства ссылается на несуществующий элемент справочника. Такого занчения нету.',
                                                            item:item,
                                                            msaccess_trait_value:item.msaccess_trait_value
                                                        });
                                                        console.log('DATA ERROR', 'Свойства ссылается на несуществующий элемент справочника. Такого занчения нету', item);
                                                        o.params.value1 = null;
                                                    }else {
                                                        o.params.value1 = item.msaccess_trait_value.values[item.msaccess_trait_value.Trait_value];
                                                    }
                                                    break;
                                                case "TEXT":
                                                default:
                                                    o.params.value1 = item.msaccess_trait_value.Trait_value;
                                                    break;
                                            }

                                            _t.api(o, function (err, res) {
                                                if (err) return cb(new MyError('Не удалось добавить свойство',{o : o, err : err}));
                                                cb(null);
                                            });
                                        });
                                    }
                                }, cb);



                            }, cb);
                        }
                    }, cb);

                }
            }, cb);
        }

    },function (err, res) {
        // if (err) return cb(err);
        if (err) {
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!doNotSaveRollback){
               rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'msaccessImportTrait', params:obj});
            }
            cb(null, new UserOk('Ок',{data_errors:data_errors}));
        }
    });
};


// var o = {
//     command:'importAll',
//     object:'Taxon'
// };
// socketQuery(o, function(res){
//     console.log(res);
// });
Model.prototype.importAll = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    async.series({
        get:function(cb){
            var params = {
                param_where:{
                    msaccess_taxon_level_id:2
                },
                limit:100000,
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon',{params : params, err : err}));
                async.eachSeries(res, function(item, cb){
                    var params = {
                        id:item.id
                    };
                    _t.msaccessImportTrait(params, function(err, res){
                        if (err) console.log(err);
                        cb(null);
                    });
                }, cb);
            });

        }
    },function (err, res) {
        if (err) {
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!doNotSaveRollback){
               rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'importAll', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });
};

// var o = {
//     command:'getGroups',
//     object:'Taxon',
//     params:{
//         name:''
//     }
// };
// socketQuery(o, function(res){
//     console.log(res);
// });
Model.prototype.getGroups = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    async.series({
        get:function(cb){
            var params = {
                where:[
                    {
                        key:"is_group",
                        val1:true
                    }
                ],
                columns:['id','name','name_full','level'],
                sort:{
                    columns:['level','name'],
                    direction:['ASC','ASC']
                },
                limit:obj.limit || 100,
                page_no:obj.page_no || 1
            };
            if (obj.name){
                params.where.push({
                    key:"name",
                    type:"like",
                    val1:obj.name
                });
            }
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить группы',{params : params, err : err}));
                cb(null, res);
            });
        }

    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr', res.get));
    });
};


Model.prototype.getTaxonAndChildren = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	var _t = this;
	var taxon_id = +obj.taxon_id;
	if (isNaN(taxon_id)) return cb(new UserError('Please, select a group.', {obj: obj}));

	var taxon_ids = [taxon_id];
	var results;

	async.series({
		getChildIds: function (cb) {
			let params = {
				id: taxon_id
			};
			_t.getChildIds(params, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить getChildIds', {o: o, err: err}));
				taxon_ids = taxon_ids.concat(res.ids);
				cb(null);
			});
		},
		get: function (cb) {
			var params = {
                param_where: {
                    show_on_site: true
                },
				columns: ['id', 'name'],
				where: [],
				collapseData: false,
				limit: obj.limit,
				page_no: obj.page_no
			};
			if (taxon_ids) {
				params.where.push({
					key: 'id',
					type: 'in',
					val1: taxon_ids
				});
			}
			if (obj.input) {
				params.where.push({
					key: 'name',
					type: 'like',
					val1: obj.input
				})
			}

			_t.get(params, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить таксоны', {params: params, err: err}));
				results = res;
				cb(null);
			});
		}
	}, function (err, res) {
		if (err) return cb(err);
		cb(null, results);
	});
};

Model.prototype.getStatistic = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	let taxons;
	let morphospecies;
	let projects;
	let taxons_with_params;
	let traits;
	let pictures;

	async.series({
		getTaxons: function (cb) {
			let params = {
				countOnly: true,
				collapseData: false,
				limit: 10000000000,
				count_large: false // Обязательно, так как иначе будет возвращать 60 (ограничение для быстрыты запроса к большим таблицам)
			};

			_t.get(params, function (err, res, additionalData) {
				if (err) return cb(new MyError('Не удалось получить таксоны', {params: params, err: err}));

				taxons = res.count;

				cb(null);
			});
		},
		getMorphos: function (cb) {
			let params = {
				param_where: {
					level_name: 'morphospecies'
				},
				countOnly: true,
				collapseData: false,
				limit: 10000000000,
				count_large: false // Обязательно, так как иначе будет возвращать 60 (ограничение для быстрыты запроса к большим таблицам)
			};

			_t.get(params, function (err, res, additionalData) {
				if (err) return cb(new MyError('Не удалось получить таксоны', {params: params, err: err}));

				morphospecies = res.count;

				cb(null);
			});
		},
		getTaxonsWithParameters: function (cb) {
			let params = {
				param_where: {
					has_parameters: true
				},
				countOnly: true,
				collapseData: false,
				limit: 10000000000,
				count_large: false // Обязательно, так как иначе будет возвращать 60 (ограничение для быстрыты запроса к большим таблицам)
			};

			_t.get(params, function (err, res, additionalData) {
				if (err) return cb(new MyError('Не удалось получить таксоны', {params: params, err: err}));

				taxons_with_params = res.count;

				cb(null);
			});
		},
		getTraits: function (cb) {
			let o = {
				command: 'get',
				object: 'taxon_avalible_trait',
				params: {
					countOnly: true,
					collapseData: false,
					limit: 10000000000,
					count_large: false // Обязательно, так как иначе будет возвращать 60 (ограничение для быстрыты запроса к большим таблицам)
				}
			};

			_t.api(o, function (err, res, additionalData) {
				if (err) return cb(new MyError('Не удалось получить таксоны', {params: params, err: err}));

				traits = res.count;

				cb(null);
			});
		},
		getProjects: function (cb) {
			let o = {
				command: 'get',
				object: 'project',
				params: {
					countOnly: true,
					collapseData: false,
					limit: 10000000000,
					count_large: false // Обязательно, так как иначе будет возвращать 60 (ограничение для быстрыты запроса к большим таблицам)
				}
			};

			_t.api(o, function (err, res, additionalData) {
				if (err) return cb(new MyError('Не удалось получить таксоны', {params: params, err: err}));

				projects = res.count;

				cb(null);
			});
		},
		getTaxonPictures: function (cb) {
			let o = {
				command: 'get',
				object: 'taxon_picture',
				params: {
					countOnly: true,
					collapseData: false,
					limit: 10000000000,
					count_large: false // Обязательно, так как иначе будет возвращать 60 (ограничение для быстрыты запроса к большим таблицам)
				}
			};

			_t.api(o, function (err, res, additionalData) {
				if (err) return cb(new MyError('Не удалось получить таксоны', {params: params, err: err}));

				pictures = res.count;

				cb(null);
			});
		},
		getTraitPictures: function (cb) {
			let o = {
				command: 'get',
				object: 'trait_picture',
				params: {
					countOnly: true,
					collapseData: false,
					limit: 10000000000,
					count_large: false // Обязательно, так как иначе будет возвращать 60 (ограничение для быстрыты запроса к большим таблицам)
				}
			};

			_t.api(o, function (err, res, additionalData) {
				if (err) return cb(new MyError('Не удалось получить таксоны', {params: params, err: err}));

				pictures += res.count;

				cb(null);
			});
		},
		getDIPictures: function (cb) {
			let o = {
				command: 'get',
				object: 'data_individual_picture',
				params: {
					countOnly: true,
					collapseData: false,
					limit: 10000000000,
					count_large: false // Обязательно, так как иначе будет возвращать 60 (ограничение для быстрыты запроса к большим таблицам)
				}
			};

			_t.api(o, function (err, res, additionalData) {
				if (err) return cb(new MyError('Не удалось получить таксоны', {params: params, err: err}));

				pictures += res.count;

				cb(null);
			});
		}
	}, function (err, res) {
		if (err) return cb(err);
		// if (obj.count_only) return cb(null, new UserOk('noToastr', {species_count:species_count}));
		cb(null, new UserOk('noToastr', {
			taxons: taxons,
			taxons_with_params: taxons_with_params,
			traits: traits,
			pictures: pictures,
			morphospecies: morphospecies,
			projects: projects
		}));
	});
};


// var o = {
//     command:'getResults',
//     object:'Taxon',
//     params:{
//         limit:5
//     }
// };
// socketQuery(o, function(res){
//     console.log(res);
// });
Model.prototype.getResults = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    var taxon_id = +obj.taxon_id;
    // if (!taxon_id) return cb(new MyError('Не передан taxon_id'));
    if (isNaN(parseInt(taxon_id))) return cb(new UserError('Please, select a group.', {obj: obj}));
    var main_filters = obj.filters;
    if (main_filters) {
        if (!main_filters.length) main_filters = undefined;
    }
    var main_filters_groups = {};
    var taxon_main_filter_groups = {};
    var rank_filter = obj.rank_filter || 'species';
    rank_filter = rank_filter.split(',');

    // На вход: группа, Zerofilters, MainFilters, CustomFilters
    //
	let taxon_ids_for_check_avil_traits_opts = [];
	let avail_trait_opts = {};

    var taxon_obj = {};
    var traits_info = {}; // Содержит информацию о трейтах, основанную на выбранных фильтрах. Только те, котоорые на что то влияют
    var taxonAddData;
    var taxon_ids = [];
    var main_filter_taxon_ids = [];
    var childs_ids = [taxon_id];
    var location_ids;
    var habitat_ids;
    var traits_ids_with_another_gender_val = [];
    var traits_with_another_gender_val = [];
    var ts = [];
    var t = (label)=>{
        var t1 = moment();
        var diff = ts.length? t1.diff(ts[ts.length - 1]) : 0;
        var f = 'log';
        if (diff > 1000) f = 'warn';
        if (diff > 3000) f = 'error';
        console[f](`Таймер №:${ts.length}. Метка:${label || 'NO'}. Разница: ${diff}`);
        ts.push(t1);
    };
    t('START');
    async.series({
        filterBySelectedGroup: function (cb) {
            _t.getChildIds({id: taxon_id}, function (err, res) {
                if (err) return cb(err);
                childs_ids = childs_ids.concat(res.ids);
                t('Фильтр 1, getChildIds');
                cb(null);
            });
        },
        filterByLocations: function (cb) {
            if (isNaN(parseInt(obj.location_id))) return cb(null); // Location not passed
            var location_id = +obj.location_id;
            // return cb(null); // Временно, пока метод не доделан.
            var filtred_by_location_taxon_ids = [];
            var childs_ids_copy = childs_ids.slice(); // На его основе будем искать, а оригинал обнулим, если вообще передан location_id (ниже)
            async.series({
                getAllLocations: function (cb) {
                    childs_ids = []; // Обнулим res и заполним его только отфильтрованными по локации

                    async.series({
                        get: function (cb) {
                            let o = {
                                command: 'getById',
                                object: 'location',
                                params: {
                                    columns: ['id'],
                                    id: location_id
                                }
                            };
                            _t.api(o, (err, res) => {
                                if (err) {
                                    return cb(new MyError('Не удалось получить переданную локацию', {o: o, err: err}));
                                }
                                location_ids = [res[0].id];
                                cb(null);
                            });
                        },
                        getParents: function (cb) {
                            let o = {
                                command: 'getParentIds',
                                object: 'location',
                                params: {
                                    columns: ['id'],
                                    id: location_id
                                }
                            };
                            _t.api(o, (err, res) => {
                                if (err) return cb(new MyError('Не удалось получить parent locations', {
                                    o: o,
                                    err: err
                                }));
                                location_ids = location_ids.concat(res.ids);
                                cb(null);
                            });
                        },
                        getChilds: function (cb) {
                            let o = {
                                command: 'getChildIds',
                                object: 'location',
                                params: {
                                    id: location_id
                                }
                            };
                            _t.api(o, (err, res) => {
                                if (err) return cb(new MyError('Не удалось получить child locations', {
                                    o: o,
                                    err: err
                                }));
                                location_ids = location_ids.concat(res.ids);
                                cb(null);
                            });
                        }
                    }, cb);
                },
                getTaxonsWithLocation: function (cb) {

                    if (!location_ids) return cb(null);

                    let o = {
                        command: 'get',
                        object: 'taxon_location',
                        params: {
                            columns: ['id', 'location_id', 'taxon_id'],
                            where: [
                                {
                                    key: 'taxon_id',
                                    type: 'in',
                                    val1: childs_ids_copy
                                },
                                {
                                    key: 'location_id',
                                    type: 'in',
                                    val1: location_ids
                                }
                            ],
                            limit: 1000000000,
                            collapseData: false
                        }
                    };

                    _t.api(o, (err, res) => {
                        if (err) return cb(new MyError('Не удалось получить taxon_locations', {o: o, err: err}));

                        for (var i in res) {
                            filtred_by_location_taxon_ids.push(res[i].taxon_id);
                        }
                        cb(null);
                    });
                },
                getChildrenTaxonsForFound: function (cb) {
                    if (!filtred_by_location_taxon_ids.length) return cb(null);

                    funcs.splitByPortion({
                        data: filtred_by_location_taxon_ids,
                        // inPortion:1000,
                        maxProcess: config.get('maxProcess') || 4
                    }, function (items, cb) {
                        async.eachSeries(items, function (taxon_id_item, cb) {
                            if (childs_ids.indexOf(+taxon_id_item) === -1) childs_ids.push(+taxon_id_item);
                            _t.getChildIds({id: taxon_id_item}, function (err, res) {
                                if (err) return cb(err);
                                for (const i in res.ids) {
                                    if (childs_ids.indexOf(+res.ids[i]) === -1) childs_ids.push(+res.ids[i]);
                                }
                                cb(null);
                            });
                        }, cb);
                    }, cb);
                }
            }, cb);
        },
        filterByHabitats: function (cb) {
            t('Фильтр 2, filterByLocations');
            if (!isNaN(parseInt(obj.location_id)) && !childs_ids.length) return cb(null);
            if (isNaN(parseInt(obj.habitat_id))) return cb(null); // Habitat not passed
            var habitat_id = +obj.habitat_id;
            // return cb(null); // Временно, пока метод не доделан.
            var filtred_by_habitat_taxon_ids = [];
            var childs_ids_copy = childs_ids.slice(); // На его основе будем искать, а оригинал обнулим, если вообще передан habitat_id (ниже)
            async.series({
                getAllHabitats: function (cb) {
                    childs_ids = []; // Обнулим res и заполним его только отфильтрованными по локации

                    async.series({
                        get: function (cb) {
                            let o = {
                                command: 'getById',
                                object: 'habitat',
                                params: {
                                    columns: ['id'],
                                    id: habitat_id
                                }
                            };
                            _t.api(o, (err, res) => {
                                if (err) return cb(new MyError('Error while getting habitats', {o: o, err: err}));
                                habitat_ids = [res[0].id];
                                cb(null);
                            });
                        },
                        getParents: function (cb) {
                            let o = {
                                command: 'getParentIds',
                                object: 'habitat',
                                params: {
                                    id: habitat_id
                                }
                            };
                            _t.api(o, (err, res) => {
                                if (err) return cb(new MyError('Error while getting habitats parents', {
                                    o: o,
                                    err: err
                                }));
                                habitat_ids = habitat_ids.concat(res.ids);
                                cb(null);
                            });
                        },
                        getChildren: function (cb) {
                            let o = {
                                command: 'getChildIds',
                                object: 'habitat',
                                params: {
                                    id: habitat_id
                                }
                            };
                            _t.api(o, (err, res) => {
                                if (err) return cb(new MyError('Error while getting habitats children', {
                                    o: o,
                                    err: err
                                }));
                                habitat_ids = habitat_ids.concat(res.ids);
                                cb(null);
                            });
                        }
                    }, cb);
                },
                getTaxonsWithHabitat: function (cb) {
                    if (!habitat_ids) return cb(null);

                    let o = {
                        command: 'get',
                        object: 'taxon_habitat',
                        params: {
                            columns: ['id', 'habitat_id', 'taxon_id'],
                            where: [
                                {
                                    key: 'taxon_id',
                                    type: 'in',
                                    val1: childs_ids_copy
                                },
                                {
                                    key: 'habitat_id',
                                    type: 'in',
                                    val1: habitat_ids
                                }
                            ],
                            limit: 1000000000,
                            collapseData: false
                        }
                    };

                    _t.api(o, (err, res) => {
                        if (err) return cb(new MyError('Error while getting taxon_habitat', {o: o, err: err}));

                        for (var i in res) {
                            filtred_by_habitat_taxon_ids.push(res[i].taxon_id);
                        }
                        cb(null);
                    });
                },
                getChildrenTaxonsForFound: function (cb) {
                    if (!filtred_by_habitat_taxon_ids.length) return cb(null);

                    funcs.splitByPortion({
                        data: filtred_by_habitat_taxon_ids,
                        // inPortion:1000,
                        maxProcess: config.get('maxProcess') || 4
                    }, function (items, cb) {
                        async.eachSeries(items, function (taxon_id_item, cb) {
                            if (childs_ids.indexOf(+taxon_id_item) === -1) childs_ids.push(+taxon_id_item);
                            _t.getChildIds({id: taxon_id_item}, function (err, res) {
                                if (err) return cb(err);
                                for (const i in res.ids) {
                                    if (childs_ids.indexOf(+res.ids[i]) === -1) childs_ids.push(+res.ids[i]);
                                }
                                cb(null);
                            });
                        }, cb);
                    }, cb);
                }
            }, cb);
        },

        getMainFilterTaxonIds: function (cb) {
            t('Фильтр 3, filterByHabitats');
            if (!main_filters) return cb(null);
            var filter_ids = [];
            for (var i in main_filters) {
                filter_ids.push(main_filters[i].id);
                if (typeof main_filters[i].value1 === 'string') main_filters[i].value1 = [main_filters[i].value1];

                // Запишемсколько условий должно выполнится для каждой группы
                // Например bodyLength. приходят два трейта с группой bodylength - bodelength_min >= X и bodelength_max <= X.
                // Оба этих условия должны выполнится чтобы таксон попал в выдачу
                if (main_filters[i].group) {
                    if (!main_filters_groups[main_filters[i].group]) {
                        main_filters_groups[main_filters[i].group] = {
                            count: 0,
                            filter_ids: []
                        };
                    }
                    main_filters_groups[main_filters[i].group].count++;
                    main_filters_groups[main_filters[i].group].filter_ids.push(main_filters[i].id);
                }
            }
            var flat_trait_table = {};
            async.series({
                getFlatTraitTable: function (cb) {
                    // Соберем свойства в плоскую таблицу: таксон1 | цвет | зеленый
                    async.series({
                        getVal: function (cb) {
                            // получим все значения, где taxon_avalible_trait_id из переданных фильтров
                            // Если указаны более высокие фильтры, то их тоже наложем (например ГРУППА)

                            // Результат запишем в объект с ключем id (taxon_trait_value_id)
                            var o = {
                                command: 'get',
                                object: 'Taxon_trait_value',
                                params: {
                                    // columns:['id','taxon_id'],
                                    where: [
                                        {
                                            key: 'taxon_avalible_trait_id',
                                            type: 'in',
                                            val1: filter_ids
                                        }
                                    ],
                                    limit: 100000000,
                                    collapseData: false
                                }
                            };
                            // if (taxon_id){
                            //     o.params.where.push({
                            //         key:'id',
                            //         group:'group_filter',
                            //         type:'in',
                            //         val1:(Array.isArray(taxon_id))? taxon_id : [taxon_id]
                            //     });
                            // }
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить Taxon_trait_value', {
                                    o: o,
                                    err: err
                                }));
                                for (var i in res) {
                                    flat_trait_table[res[i].id] = res[i];
                                }
                                cb(null);
                            });
                        },
                        getChildsForInherit: function (cb) {
                            // Полусим дочерние id таксонов, для кого наследуются свойства
                            async.eachSeries(flat_trait_table, function (item, cb) {
                                if (!item.inherit) return cb(null);
                                var params = {
                                    id: item.taxon_id
                                };
                                _t.getChildIds(params, function (err, res) {
                                    if (err) return cb(new MyError('Не удалось получить дочерние id таксонов, для которых наследуются свойства', {
                                        err: err,
                                        params: params
                                    }));
                                    item.inherit_taxon_ids = res.ids || [];
                                    cb(null);
                                })
                            }, cb);

                        },
                        getRealVal: function (cb) {
                            // Получим конкретные значения и совместим их с flat_trait_table
                            // Для этого разобъем flat_trait_table на группы (INT/TEXT/SELECT)
                            var values_obj_splited = {};
                            for (var i in flat_trait_table) {
                                if (!values_obj_splited[flat_trait_table[i].trait_type_sysname]) values_obj_splited[flat_trait_table[i].trait_type_sysname] = {};
                                values_obj_splited[flat_trait_table[i].trait_type_sysname][i] = flat_trait_table[i];
                            }
                            async.eachSeries(values_obj_splited, function (one_value_obj, cb) {
                                var one_value_obj_keys = Object.keys(one_value_obj);
                                if (!one_value_obj_keys.length) return cb(null);
                                var o = {
                                    command: 'get',
                                    object: one_value_obj[one_value_obj_keys[0]].trait_type_sub_table_name,
                                    params: {
                                        where: [
                                            {
                                                key: 'taxon_trait_value_id',
                                                type: 'in',
                                                val1: one_value_obj_keys
                                            }
                                        ],
                                        limit: 100000000,
                                        collapseData: false
                                    }
                                };
                                _t.api(o, function (err, res) {
                                    if (err) return cb(new MyError('Не удалось получить ' + one_value_obj[one_value_obj_keys[0]].trait_type_sub_table_name, {
                                        o: o,
                                        err: err
                                    }));
                                    for (var i in res) {
                                        flat_trait_table[res[i].taxon_trait_value_id].value1 = res[i].value1;
                                        flat_trait_table[res[i].taxon_trait_value_id].value2 = res[i].value2;
                                    }
                                    cb(null);
                                });
                            }, cb);

                        }
                    }, cb);
                },
                compileMainFilterTaxonIds: function (cb) {
                    var filtred = {};
                    for (var i in flat_trait_table) {
                        var row = flat_trait_table[i];
                        for (var j in main_filters) {
                            var one_filter = main_filters[j];
                            row.finded = false;
                            if (+row.taxon_avalible_trait_id === +one_filter.id) {
                                if (!filtred[one_filter.id]) filtred[one_filter.id] = [];
                                // console.log('11111 filtred[one_filter.id]', one_filter.id, filtred[one_filter.id].join(','));
                                // if(row.value1 == one_filter.value1){
                                switch (one_filter.type) {

                                    case "select":
                                    default:
                                        // Возможно здесь нужно не строгое соответствие
                                        if (one_filter.value1.indexOf(String(row.value1)) !== -1) {
                                            console.log(one_filter.value1.join(','), String(row.value1));
                                            row.finded = true;
                                            // Этот блок теперь ниже. Когда все будет отлажено, коммент ниже можно удалить
                                            // if (filtred[one_filter.id].indexOf(row.taxon_id) === -1) {
                                            //     filtred[one_filter.id].push(row.taxon_id);
                                            //     if (row.inherit_taxon_ids) filtred[one_filter.id] = filtred[one_filter.id].concat(row.inherit_taxon_ids);
                                            //     break;
                                            // }
                                        }
                                        break;
                                    case "=":
                                        if (one_filter.value1[0] === String(row.value1)) row.finded = true;
                                        break;
                                    case ">=":
                                        if (+one_filter.value1[0] >= +row.value1) {
                                            row.finded = true;
                                        }
                                        break;
                                    case "<=":
                                        if (+one_filter.value1[0] <= +row.value1) {
                                            row.finded = true;
                                        }
                                        break;
                                    case ">":
                                        if (+one_filter.value1[0] > +row.value1) row.finded = true;
                                        break;
                                    case "<":
                                        if (+one_filter.value1[0] < +row.value1) row.finded = true;
                                        break;
                                    case "!=":
                                        if (+one_filter.value1[0] !== +row.value1) row.finded = true;
                                        break;
                                }
                                if (row.finded) {
                                    if (!main_filters_groups[one_filter.group]) { // Если это не групповой фильтр, то просто добавим в найденные
                                        if (filtred[one_filter.id].indexOf(row.taxon_id) === -1) {
                                            filtred[one_filter.id].push(row.taxon_id);
                                            if (row.inherit_taxon_ids) filtred[one_filter.id] = filtred[one_filter.id].concat(row.inherit_taxon_ids);
                                            break;
                                        }
                                    } else { // В противном случае сперва посчитаем выполнились все условия
                                        if (!taxon_main_filter_groups[row.taxon_id]) taxon_main_filter_groups[row.taxon_id] = {};
                                        if (!taxon_main_filter_groups[row.taxon_id][one_filter.group]) taxon_main_filter_groups[row.taxon_id][one_filter.group] = 0;
                                        taxon_main_filter_groups[row.taxon_id][one_filter.group]++;
                                        if (taxon_main_filter_groups[row.taxon_id][one_filter.group] === main_filters_groups[one_filter.group].count) {
                                            for (var gr in main_filters_groups[one_filter.group].filter_ids) {
                                                var one_filter_id = main_filters_groups[one_filter.group].filter_ids[gr];
                                                if (filtred[one_filter_id].indexOf(row.taxon_id) === -1) {
                                                    filtred[one_filter_id].push(row.taxon_id);
                                                    if (row.inherit_taxon_ids) filtred[one_filter_id] = filtred[one_filter_id].concat(row.inherit_taxon_ids);
                                                }
                                            }
                                            break;
                                        }
                                    }

                                }

                            }
                        }
                    }
                    if (!filtred) return cb(null);
                    // if (Object.keys(filtred).length === 1){
                    //     main_filter_taxon_ids = filtred[0];
                    //     return cb(null);
                    // }
                    // var filtred_keys = Object.keys(filtred);
                    // var tmp_arr = [];
                    // for (var i in filtred_keys) {
                    //     if (i === filtred_keys.length) break;
                    //     main_filter_taxon_ids = intersect(filtred[filtred_keys[i]],filtred[filtred_keys[i+1]])
                    // }
                    //
                    var multiIntersectObj = function (obj) {
                        var keys = Object.keys(obj);
                        if (keys.length === 0) return [];
                        if (keys.length === 1) return obj[keys[0]];
                        var tmp_arr = intersect(obj[keys[0]], obj[keys[1]]);
                        var new_arr = [tmp_arr];
                        for (var i in obj) {
                            if (i === keys[0] || i === keys[1]) continue;
                            new_arr.push(obj[i]);
                        }
                        return multiIntersectObj(new_arr);
                    };
                    main_filter_taxon_ids = multiIntersectObj(filtred);
                    cb(null);
                    // for (var i in flat_trait_table) {
                    //     var row = flat_trait_table[i];
                    //     for (var j in main_filters) {
                    //         var one_filter = main_filters[j];
                    //         if (+row.taxon_avalible_trait_id === +one_filter.id){
                    //             if(row.value1 == one_filter.value1){
                    //                 // Возможно здесь нужно не строгое соответствие
                    //                 if (main_filter_taxon_ids.indexOf(row.taxon_id) === -1) {
                    //                     main_filter_taxon_ids.push(row.taxon_id);
                    //                     break;
                    //                 }
                    //             }
                    //         }
                    //     }
                    // }
                    // cb(null);
                }
            }, cb);
        },
        get: function (cb) {
            t('Фильтр 4, getMainFilterTaxonIds');
            var species_count = 0, genera_count = 0, families_count = 0;
            var species_families = {};
            var species_genuses = {};
            async.series({
                getSpecies: function (cb) {
                    if (!childs_ids.length) return cb(null);
                    var species_count_only = (rank_filter.indexOf('species') === -1);
                    // let countOnly = obj.count_only || species_count_only;
                    let countOnly = obj.count_only || species_count_only;
                    var params = {
                        param_where: {
                            show_on_site: true,
                            gbif_synonym: false
                        },
                        where: [
                            {
                                group: "morpho_or_species",
                                comparisonType: 'OR',
                                key: 'level_name',
                                val1: 'species'
                            },
                            {
                                group: "morpho_or_species",
                                comparisonType: 'OR',
                                key: 'level_name',
                                val1: 'morphospecies'
                            }
                            // ,
                            // {
                            //     key:'id',
                            //     val1:20445
                            // }
                        ],
                        sort: {
                            columns: ['name', 'name_full']
                        },
                        // countOnly: countOnly,
                        countOnly: false,
                        collapseData: false,
                        limit: (countOnly) ? 10000000000 : obj.limit,
                        count_large: false, // Обязательно, так как иначе будет возвращать 60 (ограничение для быстрыты запроса к большим таблицам)
                        page_no: (countOnly) ? 1 : obj.page_no
                    };
                    if (childs_ids && childs_ids.length) {
                        params.where.push({
                            key: 'id',
                            group: 'group_filter',
                            type: 'in',
                            val1: childs_ids
                        });
                    }
                    if (main_filters) {
                        params.where.push({
                            key: 'id',
                            group: 'main_filter',
                            type: (main_filter_taxon_ids.length) ? 'in' : 'isNull',
                            val1: (main_filter_taxon_ids.length) ? main_filter_taxon_ids : null
                        });
                    }

                    _t.get(params, function (err, res, additionalData) {
                        if (err) return cb(new MyError('Не удалось получить таксоны', {params: params, err: err}));

	                    taxon_ids_for_check_avil_traits_opts = res;

                        species_count = res.count || additionalData.count_all;

                        res.forEach(one_species => {
                            let gbifFamily = one_species.gbif_family || 'UNKNOWN FAMILY';
                            let gbifGenus = one_species.gbif_genus || 'UNKNOWN GENUS';
                            if (!species_families[gbifFamily]) species_families[gbifFamily] = {
                                name: gbifFamily,
                                count: 0
                            };
                            species_families[gbifFamily].count++;
                            // genus
                            if (!species_genuses[gbifGenus]) species_genuses[gbifGenus] = {
                                name: gbifGenus,
                                count: 0
                            };
                            species_genuses[gbifGenus].count++;
                        });

                        Object.keys(species_families).forEach(key =>{
                            species_families[key].percent = Math.round(((species_families[key].count * 100)/ species_count)*100)/100;
                        });
                        Object.keys(species_genuses).forEach(key =>{
                            species_genuses[key].percent = Math.round(((species_genuses[key].count * 100)/ species_count)*100)/100;
                        });

                        if (countOnly) return cb(null);
                        // if (countOnly) {
                        //     species_count = res.count || res.length;
                        //     // taxonAddData = {
                        //     //     count_all : res.count
                        //     // }
                        //     return cb(null);
                        // }
                        for (var i in res) {
                            taxon_obj[res[i].id] = res[i];
                            taxon_obj[res[i].id].pictures = [];
                            taxon_obj[res[i].id].traits = [];
                            // taxon_obj[res[i].id].breadcumbs = ['Life','...',taxon_obj[res[i].id].name];
                            // taxon_obj[res[i].id].breadcrumbs_str = 'Life → ... → ' + taxon_obj[res[i].id].name;
                            taxon_ids.push(res[i].id);
                        }
                        // taxonAddData = additionalData;
                        species_count = additionalData.count_all;
                        // taxonAddData.count_all = res.length;
                        cb(null);
                    });
                },
                getGenera: function (cb) {
                    if (!childs_ids.length) return cb(null);
                    var genera_count_only = (rank_filter.indexOf('genus') === -1);
                    var params = {
                        param_where: {
                            show_on_site: true,
                            gbif_synonym: false
                        },
                        where: [
                            {
                                key: 'level_name',
                                val1: 'genus'
                            }
                            // ,
                            // {
                            //     key:'id',
                            //     val1:20445
                            // }
                        ],
                        sort: {
                            columns: ['name', 'name_full']
                        },
                        countOnly: obj.count_only || genera_count_only,
                        collapseData: false,
                        limit: (obj.count_only || genera_count_only) ? 10000000000 : obj.limit,
                        count_large: false, // Обязательно, так как иначе будет возвращать 60 (ограничение для быстрыты запроса к большим таблицам)
                        page_no: (obj.count_only || genera_count_only) ? 1 : obj.page_no
                    };
                    if (childs_ids && childs_ids.length) {
                        params.where.push({
                            key: 'id',
                            group: 'group_filter',
                            type: 'in',
                            val1: childs_ids
                        });
                    }
                    if (main_filters) {
                        params.where.push({
                            key: 'id',
                            group: 'main_filter',
                            type: (main_filter_taxon_ids.length) ? 'in' : 'isNull',
                            val1: (main_filter_taxon_ids.length) ? main_filter_taxon_ids : null
                        });
                    }

                    _t.get(params, function (err, res, additionalData) {
                        if (err) return cb(new MyError('Не удалось получить таксоны', {params: params, err: err}));
                        if (obj.count_only || genera_count_only) {
                            genera_count = res.count;
                            // taxonAddData = {
                            //     count_all : res.count
                            // }
                            return cb(null);
                        }
                        for (var i in res) {
                            taxon_obj[res[i].id] = res[i];
                            taxon_obj[res[i].id].pictures = [];
                            taxon_obj[res[i].id].traits = [];
                            // taxon_obj[res[i].id].breadcumbs = ['Life','...',taxon_obj[res[i].id].name];
                            // taxon_obj[res[i].id].breadcrumbs_str = 'Life → ... → ' + taxon_obj[res[i].id].name;
                            taxon_ids.push(res[i].id);
                        }
                        // taxonAddData = additionalData;
                        genera_count = additionalData.count_all;
                        // taxonAddData.count_all = res.length;
                        cb(null);
                    });
                },
                getFamilies: function (cb) {
                    if (!childs_ids.length) return cb(null);
                    var families_count_only = (rank_filter.indexOf('family') === -1);
                    var params = {
                        param_where: {
                            show_on_site: true,
                            gbif_synonym: false
                        },
                        where: [
                            {
                                key: 'level_name',
                                val1: 'family'
                            }
                            // ,
                            // {
                            //     key:'id',
                            //     val1:20445
                            // }
                        ],
                        sort: {
                            columns: ['name', 'name_full']
                        },
                        countOnly: obj.count_only || families_count_only,
                        collapseData: false,
                        limit: (obj.count_only || families_count_only) ? 10000000000 : obj.limit,
                        count_large: false, // Обязательно, так как иначе будет возвращать 60 (ограничение для быстрыты запроса к большим таблицам)
                        page_no: (obj.count_only || families_count_only) ? 1 : obj.page_no
                    };
                    if (childs_ids && childs_ids.length) {
                        params.where.push({
                            key: 'id',
                            group: 'group_filter',
                            type: 'in',
                            val1: childs_ids
                        });
                    }
                    if (main_filters) {
                        params.where.push({
                            key: 'id',
                            group: 'main_filter',
                            type: (main_filter_taxon_ids.length) ? 'in' : 'isNull',
                            val1: (main_filter_taxon_ids.length) ? main_filter_taxon_ids : null
                        });
                    }

                    _t.get(params, function (err, res, additionalData) {
                        if (err) return cb(new MyError('Не удалось получить таксоны', {params: params, err: err}));
                        if (obj.count_only || families_count_only) {
                            families_count = res.count;
                            // taxonAddData = {
                            //     count_all : res.count
                            // }
                            return cb(null);
                        }
                        for (var i in res) {
                            taxon_obj[res[i].id] = res[i];
                            taxon_obj[res[i].id].pictures = [];
                            taxon_obj[res[i].id].traits = [];
                            taxon_obj[res[i].id].breadcumbs = ['Life', '...', taxon_obj[res[i].id].name];
                            taxon_obj[res[i].id].breadcrumbs_str = 'Life → ... → ' + taxon_obj[res[i].id].name;
                            taxon_ids.push(res[i].id);
                        }
                        // taxonAddData = additionalData;
                        families_count = additionalData.count_all;
                        // taxonAddData.count_all = res.length;
                        cb(null);
                    });
                }
            }, function (err, res) {
                if (err) return cb(err);
                taxonAddData = {};
                taxonAddData.species_families = species_families;
                taxonAddData.species_genuses = species_genuses;
                taxonAddData.species_count = species_count;
                taxonAddData.genera_count = genera_count;
                taxonAddData.families_count = families_count;
                cb(null);
            });
        },
        getBreadCrumbs: function (cb) {
            // return cb(null);
            // t('Фильтр 5, GET');
            t('Фильтр 60, GET');

            if (obj.count_only) return cb(null);
            if (!taxon_ids.length) return cb(null);

            var parent_ids;
            var parent_ids_obj;
            async.series({
                getParentIds: cb => {
                    _t.getParentIds({ids: taxon_ids}, function (err, res) {
                        if (err) return cb(new MyError('Can`t get parentIds', {ids: taxon_ids}));
                        parent_ids = res.ids;
                        parent_ids_obj = res.parent_ids_obj;
                        cb(null);
                    });
                },
                getNames: cb => {
                    if (!parent_ids) return cb(null);
                    var params = {
                        where: [{
                            key: 'id',
                            type: 'in',
                            val1: parent_ids
                        }],
                        columns: ['id', 'name'],
                        collapseData: false
                    };
                    _t.get(params, function (err, res) {
                        if (err) return cb(new MyError('Could not get taxons name by parentIds', {params: params, err: err})); // Could not get
                        var res_obj = {};
                        for (var i in res) {
                            res_obj[res[i].id] = res[i].name;
                        }

                        Object.keys(taxon_obj).forEach(one_taxon_key => {
                            var one_taxon = taxon_obj[one_taxon_key];
                            var parentNames = [];
                            one_taxon.breadcrumbs_str = '';
                            var parentIds = parent_ids_obj[one_taxon.id];
                            if (!parentIds) return;
                            parentIds = parentIds.reverse();
                            parentIds.forEach(one_p_id =>{
                                parentNames.push(res_obj[one_p_id]);
                                if (one_taxon.breadcrumbs_str)
                                    one_taxon.breadcrumbs_str += ' → ';
                                one_taxon.breadcrumbs_str += res_obj[one_p_id];
                            })

                            one_taxon.breadcumbs = parentNames || ['Live', '...', one_taxon.name];
                        });
                        cb(null);
                    });
                }
            }, cb);
        },

	    checkAvalValues: cb => {
		    if (!obj.count_only) return cb(null);
		    if (!obj.filters_ids || !obj.filters_ids.length) return cb(null);
		    if (!taxon_ids_for_check_avil_traits_opts.length) return cb(null);

		    let trait_values_ids = {};
		    let taxon_ids2 = taxon_ids_for_check_avil_traits_opts.map(row => {
		    	return row.id;
		    });

		    async.series({
			    getParents: cb => {
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
								    val1: obj.filters_ids
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

						    if (!(trait_id in avail_trait_opts)) {
							    avail_trait_opts[trait_id] = new Set();
						    }

						    avail_trait_opts[trait_id].add(row.value1);
					    });

					    for (let value of Object.keys(avail_trait_opts)) {
						    avail_trait_opts[value] = Array.from(avail_trait_opts[value]);
					    }

					    cb(null);
				    });
			    }
		    }, cb);
	    },

        getTraits: function (cb) {
            // return cb(null);
            t('Фильтр 6, getBreadCrumbs');

            // if (obj.count_only) return cb(null);
            if (!taxon_ids.length) return cb(null);
            var traits_list;
            async.series({
                getAll: function (cb) {
                    var params = {
                        id: taxon_id,
                        listOnly: true
                    };
                    _t.getAllTraits(params, function (err, res) {
                        if (err) return cb(err);
                        traits_list = res.characters;
                        cb(null);
                    });
                },
                getPersonal: function (cb) {
	                async.eachSeries(Object.keys(taxon_obj), function (one_taxon_key, cb) {
                        var one_taxon = taxon_obj[one_taxon_key];
                        _t.getAllTraits({id: one_taxon.id, count_only:obj.count_only}, function (err, res) {
                            // one_taxon.traits = res.characters;
                            // return cb(null);
                            if (err) return cb(err);
                            // one_taxon.traits = traits_list;
                            one_taxon.traits = funcs.cloneObj(traits_list);
                            var traits_personal_obj = {};
                            for (var i in res.characters) {
                                traits_personal_obj[res.characters[i].taxon_avalible_trait_id] = res.characters[i];
                            }
                            var used_trait_ids = [];
                            // Укажем значения для конкретного трейта по общему списку
                            for (var j in one_taxon.traits) {
                                if (traits_personal_obj[one_taxon.traits[j].taxon_avalible_trait_id]) {
                                    used_trait_ids.push(one_taxon.traits[j].taxon_avalible_trait_id);
                                    one_taxon.traits[j] = traits_personal_obj[one_taxon.traits[j].taxon_avalible_trait_id];
                                }
                            }
                            // Добавим трейты (в конец) которые специфичны только для конкретного таксона
                            for (var k in traits_personal_obj) {
                                if (used_trait_ids.indexOf(traits_personal_obj[k].taxon_avalible_trait_id) === -1) {
                                    one_taxon.traits.push(traits_personal_obj[k]);
                                }
                            }

                            traits_ids_with_another_gender_val = traits_ids_with_another_gender_val.concat(res.traits_with_another_gender_val);

                            Object.keys(res.flat_trait_table).forEach(one_key => {
                                var one_res = res.flat_trait_table[one_key];
                                if (!traits_info[one_res.taxon_avalible_trait_id]){
                                    traits_info[one_res.taxon_avalible_trait_id] = {
                                        taxon_avalible_trait_id: one_res.taxon_avalible_trait_id,
                                        count:0,
                                        items:{}
                                    }
                                }
                                traits_info[one_res.taxon_avalible_trait_id].count++;
                                if (!traits_info[one_res.taxon_avalible_trait_id].items[one_res.value_id]){
                                    traits_info[one_res.taxon_avalible_trait_id].items[one_res.value_id] = 0;
                                }
                                traits_info[one_res.taxon_avalible_trait_id].items[one_res.value_id]++;
                            });

                            cb(null);
                        });
                    }, cb);
                }
            }, cb);
        },
        prepareTraitGes: cb=>{
            return cb(null);
            var trts = {
                6189:{
                    count:10,
                    items:{
                        99999:8,
                        99997:2,
                    }
                }
            }
        },
        getTraitWithAnotherGenderVal: cb => {
            t('Фильтр 7, getTraits');
            if (!traits_ids_with_another_gender_val || !traits_ids_with_another_gender_val.length) return cb(null);

            let traits_tmp;
            var select_tables_obj = {};

            async.series({
                getTraits: cb => {
                    let o = {
                        command: 'get',
                        object: 'taxon_trait_value',
                        params: {
                            param_where: {
                                taxon_id: obj.id
                            },
                            where: [
                                {
                                    key: 'taxon_avalible_trait_id',
                                    type: 'in',
                                    val1: traits_ids_with_another_gender_val
                                },
                                {
                                    key: "taxon_gender_sysname",
                                    group: "female_or_null",
                                    type:'!in',
                                    val1: ['FEMALE']
                                },
                                {
                                    key: "taxon_gender_sysname",
                                    group: "female_or_null",
                                    type:'!isNull'
                                }
                            ],
                            collapseData: false
                        }
                    };

                    _t.api(o, (err, res) => {
                        if (err) return cb(err);

                        traits_tmp = res;

                        cb(null);
                    });
                },
                getValues: cb => {
                    if (!traits_tmp) return cb(null);

                    async.each(traits_tmp, (trait, cb) => {
                        let o = {
                            command: 'get',
                            object: trait.trait_type_sub_table_name,
                            params: {
                                param_where: {
                                    taxon_trait_value_id: trait.id
                                },
                                collapseData: false
                            }
                        };

                        _t.api(o, (err, res) => {
                            if (err) return cb(err);

                            if (res.length) {
                                trait.value = res[0];
                                traits_with_another_gender_val.push(trait);
                            }

                            if (trait.trait_type_sysname !== 'SELECT') return cb(null);

                            if (!select_tables_obj[trait.sub_table_name_for_select]){
                                select_tables_obj[trait.sub_table_name_for_select] = [];
                            }
                            select_tables_obj[trait.sub_table_name_for_select].push(trait.value.value1);

                            cb(null);
                        });
                    }, cb);
                },
                getSelectValues: cb => {
                    async.each(Object.keys(select_tables_obj), function (select_table_val, cb) {
                        var ids = select_tables_obj[select_table_val];

                        var o = {
                            command: 'get',
                            object: select_table_val,
                            params: {
                                where: [
                                    {
                                        key: 'id',
                                        type: 'in',
                                        val1: ids
                                    }
                                ],
                                collapseData: false
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось получить данные из ' + select_table_val, {o: o, err: err}));

                            for (let row of traits_with_another_gender_val) {
                                if (row.sub_table_name_for_select !== select_table_val) continue;
                                for (var j in res) {
                                    if (row.value.value1 === res[j].id) {
                                        row.value.value1 = res[j].name;
                                        row.value.value_id = res[j].id;
                                        break;
                                    }
                                }

                            }
                            cb(null);
                        });
                    }, cb);
                }
            }, cb);
        },
        getPictures: function (cb) {
            t('Фильтр 8, getTraitWithAnotherGenderVal');
            if (obj.count_only) return cb(null);
            if (!taxon_ids.length) return cb(null);
            var o = {
                command: 'get',
                object: 'Taxon_picture',
                params: {
                    param_where: {
                        show_on_site: true
                    },
                    where: [
                        {
                            key: 'taxon_id',
                            type: 'in',
                            val1: taxon_ids
                        }
                    ],
                    sort: 'is_main_picture',
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось изображения для таксонов', {o: o, err: err}));
                for (var i in res) {
                    var pic = res[i];
                    if (!taxon_obj[pic.taxon_id].pictures) taxon_obj[pic.taxon_id].pictures = [];
                    pic.is_main_picture_code = (pic.is_main_picture) ? 0 : 1;
                    taxon_obj[pic.taxon_id].pictures.push(pic);
                }
                for (var i in taxon_obj) {
                    if (!taxon_obj[i].pictures) continue;
                    taxon_obj[i].pictures.sort(funcs.fieldSorter(['is_main_picture_code']));
                }
                cb(null);
            });
        },
        tmp:cb => {
            t('Фильтр 9, getPictures');
            cb(null);
        }
    }, function (err, res) {
        if (err) return cb(err)
        // if (obj.count_only) return cb(null, new UserOk('noToastr', {species_count:species_count}));
        cb(null, new UserOk('noToastr', {
            species: taxon_obj,
            extra_data: taxonAddData,
            traits_info:traits_info,
            traits_with_another_gender_val: traits_with_another_gender_val,
	        avail_trait_opts: avail_trait_opts
        }));
    });
};

Model.prototype.executeSearch = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	var _t = this;

	var input = obj.input;
	if (!input) return cb(new MyError('Не передан input'));

	var taxon_obj = {};
	var taxonAddData;
	var taxon_ids = [];
    var traits_ids_with_another_gender_val = [];
    var traits_with_another_gender_val = [];
	async.series({
		get: function (cb) {
            var params = {
                param_where: {
                    show_on_site: true
                },
                where: [{
                    key: "name",
                    type: "like",
                    val1: input
                }],
                sort: {
                    columns: ['name', 'name_full']
                },
                collapseData: false,
                limit: obj.limit ? obj.limit : 10000000000,
                page_no: obj.page_no
            };

            _t.get(params, function (err, res, additionalData) {
                if (err) return cb(new MyError('Не удалось получить таксоны', {params: params, err: err}));
                for (var i in res) {
                    taxon_obj[res[i].id] = res[i];
                    taxon_obj[res[i].id].pictures = [];
                    taxon_obj[res[i].id].traits = [];
                    // taxon_obj[res[i].id].breadcumbs = ['Live', '...', taxon_obj[res[i].id].name];
                    // taxon_obj[res[i].id].breadcrumbs_str = 'Life → ... → ' + taxon_obj[res[i].id].name;
                    taxon_ids.push(res[i].id);
                }
                taxonAddData = additionalData;
                taxonAddData.count_all = res.length;
                cb(null);
            });
        },
        getBreadCrumbs: function (cb) {
            if (!taxon_ids.length) return cb(null);

            var parent_ids;
            var parent_ids_obj;
            async.series({
                getParentIds: cb => {
                    _t.getParentIds({ids: taxon_ids}, function (err, res) {
                        if (err) return cb(new MyError('Can`t get parentIds', {ids: taxon_ids}));
                        parent_ids = res.ids;
                        parent_ids_obj = res.parent_ids_obj;
                        cb(null);
                    });
                },
                getNames: cb => {
                    if (!parent_ids) return cb(null);

                    const params = {
                        where: [{
                            key: 'id',
                            type: 'in',
                            val1: parent_ids
                        }],
                        columns: ['id', 'name'],
                        collapseData: false
                    };
                    _t.get(params, function (err, res) {
                        if (err) return cb(new MyError('Could not get taxons name by parentIds', {params: params, err: err})); // Could not get

                        let res_obj = {}

                        for (const i in res)
                            res_obj[res[i].id] = res[i].name

                        Object.keys(taxon_obj).forEach(one_taxon_key => {
                            var one_taxon = taxon_obj[one_taxon_key];
                            var parentNames = [];
                            one_taxon.breadcrumbs_str = '';
                            var parentIds = parent_ids_obj[one_taxon.id];
                            if (!parentIds) return;
                            parentIds = parentIds.reverse();
                            parentIds.forEach(one_p_id =>{
                                parentNames.push(res_obj[one_p_id]);
                                if (one_taxon.breadcrumbs_str)
                                    one_taxon.breadcrumbs_str += ' → ';
                                one_taxon.breadcrumbs_str += res_obj[one_p_id];
                            })

                            one_taxon.breadcumbs = parentNames || ['Live', '...', one_taxon.name];
                        });
                        cb(null);
                    });
                }
            }, cb);
        },
		getTraits: function (cb) {
		    // return cb(null);
			if (!taxon_ids.length) return cb(null);
			var traits_list;
			async.series({
				getPersonal: function (cb) {
					async.eachSeries(Object.keys(taxon_obj), function (one_taxon_key, cb) {
						var one_taxon = taxon_obj[one_taxon_key];
						_t.getAllTraits({id: one_taxon.id, taxon:one_taxon}, function (err, res) {
							// one_taxon.traits = res.characters;
							// return cb(null);
							if (err) return cb(err);
							// one_taxon.traits = traits_list;
							one_taxon.traits = [];
							var traits_personal_obj = {};
							for (var i in res.characters) {
								traits_personal_obj[res.characters[i].taxon_avalible_trait_id] = res.characters[i];
							}
							var used_trait_ids = [];
							// Добавим трейты (в конец) которые специфичны только для конкретного таксона
							for (var k in traits_personal_obj) {
								if (used_trait_ids.indexOf(traits_personal_obj[k].taxon_avalible_trait_id) === -1) {
									one_taxon.traits.push(traits_personal_obj[k]);
								}
							}

                            traits_ids_with_another_gender_val = traits_ids_with_another_gender_val.concat(res.traits_with_another_gender_val);

							cb(null);
						});
					}, cb);
				}
			}, cb);
		},
        getTraitWithAnotherGenderVal: cb => {
            if (!traits_ids_with_another_gender_val || !traits_ids_with_another_gender_val.length) return cb(null);

            let traits_tmp;
            var select_tables_obj = {};

            async.series({
                getTraits: cb => {
                    let o = {
                        command: 'get',
                        object: 'taxon_trait_value',
                        params: {
                            param_where: {
                                taxon_id: obj.id
                            },
                            where: [
                                {
                                    key: 'taxon_avalible_trait_id',
                                    type: 'in',
                                    val1: traits_ids_with_another_gender_val
                                },
                                {
                                    key: "taxon_gender_sysname",
                                    group: "female_or_null",
                                    type:'!in',
                                    val1: ['FEMALE']
                                },
                                {
                                    key: "taxon_gender_sysname",
                                    group: "female_or_null",
                                    type:'!isNull'
                                }
                            ],
                            collapseData: false
                        }
                    };

                    _t.api(o, (err, res) => {
                        if (err) return cb(err);

                        traits_tmp = res;

                        cb(null);
                    });
                },
                getValues: cb => {
                    if (!traits_tmp) return cb(null);

                    async.each(traits_tmp, (trait, cb) => {
                        let o = {
                            command: 'get',
                            object: trait.trait_type_sub_table_name,
                            params: {
                                param_where: {
                                    taxon_trait_value_id: trait.id
                                },
                                collapseData: false
                            }
                        };

                        _t.api(o, (err, res) => {
                            if (err) return cb(err);

                            if (res.length) {
                                trait.value = res[0];
                                traits_with_another_gender_val.push(trait);
                            }

                            if (trait.trait_type_sysname !== 'SELECT') return cb(null);

                            if (!select_tables_obj[trait.sub_table_name_for_select]){
                                select_tables_obj[trait.sub_table_name_for_select] = [];
                            }
                            select_tables_obj[trait.sub_table_name_for_select].push(trait.value.value1);

                            cb(null);
                        });
                    }, cb);
                },
                getSelectValues: cb => {
                    async.each(Object.keys(select_tables_obj), function (select_table_val, cb) {
                        var ids = select_tables_obj[select_table_val];

                        var o = {
                            command: 'get',
                            object: select_table_val,
                            params: {
                                where: [
                                    {
                                        key: 'id',
                                        type: 'in',
                                        val1: ids
                                    }
                                ],
                                collapseData: false
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось получить данные из ' + select_table_val, {o: o, err: err}));

                            for (let row of traits_with_another_gender_val) {
                                if (row.sub_table_name_for_select !== select_table_val) continue;
                                for (var j in res) {
                                    if (row.value.value1 === res[j].id) {
                                        row.value.value1 = res[j].name;
                                        row.value.value2 = res[j].id;
                                        break;
                                    }
                                }

                            }
                            cb(null);
                        });
                    }, cb);
                }
            }, cb);
        },
		getPictures: function (cb) {
            if (!taxon_ids.length) return cb(null);
            var o = {
                command: 'get',
                object: 'Taxon_picture',
                params: {
                    param_where: {
                        show_on_site: true
                    },
                    where: [
                        {
                            key: 'taxon_id',
                            type: 'in',
                            val1: taxon_ids
                        }
                    ],
                    sort: 'is_main_picture',
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось изображения для таксонов', {o: o, err: err}));
                for (var i in res) {
                    var pic = res[i];
                    if (!taxon_obj[pic.taxon_id].pictures) taxon_obj[pic.taxon_id].pictures = [];
                    pic.is_main_picture_code = (pic.is_main_picture) ? 0 : 1;
                    taxon_obj[pic.taxon_id].pictures.push(pic);
                }
                for (var i in taxon_obj) {
                    if (!taxon_obj[i].pictures) continue;
                    taxon_obj[i].pictures.sort(funcs.fieldSorter(['is_main_picture_code']));
                }
                cb(null);
            });
        }
	}, function (err, res) {
        if (err) return cb(err)
		// if (obj.count_only) return cb(null, new UserOk('noToastr', {species_count:species_count}));
		cb(null, new UserOk('noToastr', {
		    species: taxon_obj,
            extra_data: taxonAddData,
            traits_with_another_gender_val: traits_with_another_gender_val
		}));
	});
};

// var o = {
//     command:'getTree',
//     object:'Taxon',
//     params:{
//         id:20060
//     }
// };
// socketQuery(o, function(res){
//     console.log(res);
// });

Model.prototype.getTreeOld = function (obj, cb) {
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
    var taxon;
    var childs;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить таксон.',{id:id,err:err}));
                taxon = res[0];
                cb(null);
            });
        },
        gatChilds:function(cb){
            if (!taxon) return cb(new MyError('Таксона не существует.',{obj:obj}));
            var params = {
                param_where:{
                    parent_id:taxon.id
                },
                sort:{
                    columns:['name'],
                    directions:['ASC']
                },
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить детей таксона',{params : params, err : err}));
                childs = res;
                cb(null);
            });
        },
        compileTree:function(cb){


            // var o = {'core' : {
            //     'data': [
            //         {
            //             "text": "Root node",
            //             "children": [
            //                 {
            //                     "text": "Child node 1"
            //                 },
            //                 {
            //                     "text": "Child node 2",
            //                     "children": [
            //                         {
            //                             "text": "Child node 1"
            //                         },
            //                         {
            //                             "text": "Child node 2"
            //                         }
            //                     ]
            //                 }
            //             ]
            //         }
            //     ]
            // }
            // };


            tree.push({
                id:taxon.id,
                name:taxon.name,
                name_with_id:taxon.name_with_id,
                text:taxon.name,
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
            //     id:taxon.id,
            //     name:taxon.name,
            //     name_with_id:taxon.name_with_id,
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
            if (!taxon.parent_id) return cb(null);
            var params = {
                id:taxon.parent_id,
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


// var o = {
//     command:'getParentTraits',
//     object:'Taxon',
//     params:{
//         id:22623
//     }
// };
// socketQuery(o, function(res){
//     console.log(res);
// });
/**
 * Получить все унаследованные свойства для данного таксона / Get all inherited properties for a given taxon
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.getParentTraits = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    // Получить таксон
    // Получить трейты (со значениями) для его родителей
    // Получить непосредственно значения
    var taxon;
    var traits = [];
    var traits_traits = [];
    var traits_character = [];
    var traits_obj_byTAvailId = {};
    var flat_trait_table = {};
    var trait_ids = [];
    var parents;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить таксон.',{id:id,err:err}));
                taxon = res[0];
                cb(null);
            });
        },
        getParents:function(cb){
            _t.getParentIds({id:id}, function(err, res){
                if (err) return cb(err);
                parents = res.ids;
                cb(null, res);
            })
        },
        getTraits:function(cb){
            if (!parents.length) return cb(null);
            var o = {
                command:'get',
                object:'taxon_trait_value',
                params:{
                    where:[
                        {
                            key:'taxon_id',
                            type:'in',
                            val1:parents
                        },
                        {
                            key:'inherit',
                            val1:true
                        }
                    ],
                    sort:'taxon_level desc', // Обязательно.
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось taxon_trait_value',{o : o, err : err}));

                for (var i in res) {
                    if (!traits_obj_byTAvailId[res[i].taxon_avalible_trait_id]) {
                        traits_obj_byTAvailId[res[i].taxon_avalible_trait_id] = res[i];
                        traits_obj_byTAvailId[res[i].taxon_avalible_trait_id].pictures = [];
                        flat_trait_table[res[i].id] = res[i];
                    }
                    // Если такое свойство уже есть, то ничего не добавляем, так как оно стоит у более давнего предка.
                    if (trait_ids.indexOf(res[i].taxon_avalible_trait_id) === -1) trait_ids.push(res[i].taxon_avalible_trait_id);
                }
                cb(null);
            });
        },
        getPictures:function(cb){
            if (obj.count_only) return cb(null);
            if (!trait_ids.length) return cb(null);
            var o = {
                command:'get',
                object:'Trait_picture',
                params:{
                    where:[
                        {
                            key:'taxon_avalible_trait_id',
                            type:'in',
                            val1:trait_ids
                        }
                    ],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось изображения для трейтов',{o : o, err : err}));
                for (var i in res) {
                    var pic = res[i];
                    // if (!traits_obj_byTAvailId[pic.taxon_avalible_trait_id].pictures) traits_obj_byTAvailId[pic.taxon_avalible_trait_id].pictures = [];
                    traits_obj_byTAvailId[pic.taxon_avalible_trait_id].pictures.push(pic);
                }

                cb(null);
            });

        },
        getValues:function(cb){
            // Получим конкретные значения и совместим их с flat_trait_table
            // Для этого разобъем flat_trait_table на группы (INT/TEXT/SELECT)
            var values_obj_splited = {};
            for (var i in flat_trait_table) {
                if (!values_obj_splited[flat_trait_table[i].trait_type_sysname]) values_obj_splited[flat_trait_table[i].trait_type_sysname] = {};
                values_obj_splited[flat_trait_table[i].trait_type_sysname][i] = flat_trait_table[i];
            }
            async.eachSeries(Object.keys(values_obj_splited), function(one_value_obj_key, cb){
                    var one_value_obj = values_obj_splited[one_value_obj_key];
                    var one_value_obj_keys = Object.keys(one_value_obj);
                    if (!one_value_obj_keys.length) return cb(null);
                    var o = {
                        command:'get',
                        object:one_value_obj[one_value_obj_keys[0]].trait_type_sub_table_name, // Так как в каждой группе все элементы одного типа, берем первый попавшийся
                        params:{
                            where:[
                                {
                                    key:'taxon_trait_value_id',
                                    type:'in',
                                    val1:one_value_obj_keys
                                }
                            ],
                            limit:100000000,
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить ' + one_value_obj.trait_type_sub_table_name,{o : o, err : err}));
                        var select_ids = []; // Использеутся только для SELECT
                        for (var i in res) {
                            flat_trait_table[res[i].taxon_trait_value_id].value1 = res[i].value1;
                            flat_trait_table[res[i].taxon_trait_value_id].value2 = res[i].value2;
                            select_ids.push(res[i].value1);
                        }
                        if (one_value_obj_key !== 'SELECT') return cb(null);

                        // Если SELECT, то дозапросим значение из доп таблицы

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
                                if (err) return cb(new MyError('Не удалось получить данные из ' + select_table_val,{o : o, err : err}));

                                for (var i in flat_trait_table) {
                                    var row = flat_trait_table[i];
                                    if (row.sub_table_name_for_select !== select_table_val) continue;
                                    for (var j in res) {

                                        // if (row.taxon_avalible_trait_id === res[j].taxon_avalible_trait_id){
                                        if (row.value1 === res[j].id){
                                            flat_trait_table[i].value1 = res[j].name;
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
            for (var i in flat_trait_table) {
                var one_trait = flat_trait_table[i];
                if (typeof one_trait.value1 === 'undefined') one_trait.value1 = '';
                traits.push(one_trait);
            }
            for (var j in traits) {
                if (traits[j].is_taxonomic) {
	                traits_traits.push(traits[j]);
                } else {
	                traits_character.push(traits[j]);
                }
            }

            traits_traits.sort(funcs.fieldSorter(['sort_no','name']));
            traits_character.sort(funcs.fieldSorter(['sort_no','name']));

            cb(null);
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{traits:traits_traits,characters:traits_character}));
    });

};

Model.prototype.getTraits = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    // Получить таксон
    // Получить трейты (со значениями) для его родителей
    // Получить непосредственно значения
    var taxon;
    var traits = [];
    var traits_traits = [];
    var traits_character = [];
    var flat_trait_table = {};
    var trait_ids = [];
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить таксон.',{id:id,err:err}));
                taxon = res[0];
                cb(null);
            });
        },
        getTraits:function(cb){
            var o = {
                command:'get',
                object:'taxon_trait_value',
                params:{
                    where:[
                        {
                            key:'taxon_id',
                            val1:taxon.id
                        }
                    ],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось taxon_trait_value',{o : o, err : err}));

                for (var i in res) {
                    flat_trait_table[res[i].id] = res[i];
                    flat_trait_table[res[i].id].pictures = [];
                    if (trait_ids.indexOf(res[i].taxon_avalible_trait_id) === -1) trait_ids.push(res[i].taxon_avalible_trait_id);
                }
                cb(null);
            });
        },
        getPictures:function(cb){
            if (obj.count_only) return cb(null);
            if (!trait_ids.length) return cb(null);
            var o = {
                command:'get',
                object:'Trait_picture',
                params:{
                    where:[
                        {
                            key:'taxon_avalible_trait_id',
                            type:'in',
                            val1:trait_ids
                        }
                    ],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось изображения для трейтов',{o : o, err : err}));
                for (var i in res) {
                    var pic = res[i];
                    for (var j in flat_trait_table) {
                        if (flat_trait_table[j].taxon_avalible_trait_id !== pic.taxon_avalible_trait_id) continue;
                        // if (!flat_trait_table[j].pictures) flat_trait_table[j].pictures = [];
                        flat_trait_table[j].pictures.push(pic);
                    }

                }

                cb(null);
            });

        },
        getValues:function(cb){
            // Получим конкретные значения и совместим их с flat_trait_table
            // Для этого разобъем flat_trait_table на группы (INT/TEXT/SELECT)
            var values_obj_splited = {};
            for (var i in flat_trait_table) {
                if (!values_obj_splited[flat_trait_table[i].trait_type_sysname]) values_obj_splited[flat_trait_table[i].trait_type_sysname] = {};
                values_obj_splited[flat_trait_table[i].trait_type_sysname][i] = flat_trait_table[i];
            }
            async.eachSeries(Object.keys(values_obj_splited), function(one_value_obj_key, cb){
                var one_value_obj = values_obj_splited[one_value_obj_key];
                var one_value_obj_keys = Object.keys(one_value_obj);
                if (!one_value_obj_keys.length) return cb(null);
                var o = {
                    command:'get',
                    object:one_value_obj[one_value_obj_keys[0]].trait_type_sub_table_name, // Так как в каждой группе все элементы одного типа, берем первый попавшийся
                    params:{
                        where:[
                            {
                                key:'taxon_trait_value_id',
                                type:'in',
                                val1:one_value_obj_keys
                            }
                        ],
                        limit:100000000,
                        collapseData:false
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось получить ' + one_value_obj.trait_type_sub_table_name,{o : o, err : err}));
                    var select_ids = []; // Использеутся только для SELECT
                    for (var i in res) {
                        flat_trait_table[res[i].taxon_trait_value_id].value1 = res[i].value1;
                        flat_trait_table[res[i].taxon_trait_value_id].value2 = res[i].value2;
                        select_ids.push(res[i].value1);
                    }
                    if (one_value_obj_key !== 'SELECT') return cb(null);

                    // Если SELECT, то дозапросим значение из доп таблицы

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
                            if (err) return cb(new MyError('Не удалось получить данные из ' + select_table_val,{o : o, err : err}));

                            for (var i in flat_trait_table) {
                                var row = flat_trait_table[i];
                                if (row.sub_table_name_for_select !== select_table_val) continue;
                                for (var j in res) {
                                    // if (row.taxon_avalible_trait_id === res[j].taxon_avalible_trait_id){
                                    if (row.value1 === res[j].id){
                                        flat_trait_table[i].value1 = res[j].name;
                                        flat_trait_table[i].value2 = res[j].id;
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
            for (var i in flat_trait_table) {
                var one_trait = flat_trait_table[i];
                if (typeof one_trait.value1 === 'undefined') one_trait.value1 = '';
                traits.push(one_trait);
            }
            for (var j in traits) {
	            if (traits[j].is_taxonomic) {
		            traits_traits.push(traits[j]);
	            } else {
		            traits_character.push(traits[j]);
	            }
            }

            traits_traits.sort(funcs.fieldSorter(['sort_no','name']));
            traits_character.sort(funcs.fieldSorter(['sort_no','name']));

            cb(null);
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{traits:traits_traits,characters:traits_character}));
    });
};


// var o = {
//     command:'getAllTraits',
//     object:'Taxon',
//     params:{
//         listOnly:true,
//         id:406758
//     }
// };
// socketQuery(o, function(res){
//     console.log(res);
// });
/**
 * Получим все трейты для таксона с наследованием и картинками / Get all the traits for the taxon with inheritance and pictures
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.getAllTraits = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var taxon = obj.taxon;
    var traits = [];
    var taxon_ids = [id];
    var traits_traits = [];
    var traits_character = [];
    var flat_trait_table = {};
    var trait_ids = new Set();
    var traits_with_another_gender_val = new Set();
    var parents;
    var taxon_avalible_trait;
    async.series({
        // get:function(cb){
        //     if (taxon) return cb(null);
        //     _t.getById({id:id}, function (err, res) {
        //         if (err) return cb(new MyError('Не удалось получить таксон.',{id:id,err:err})); // Failed to get taxon
        //         taxon = res[0];
        //         cb(null);
        //     });
        // },
        getParents:function(cb){
            _t.getParentIds({id:id}, function(err, res){
                if (err) return cb(err);
                parents = res.ids;
                taxon_ids = taxon_ids.concat(parents);
                cb(null, res);
            })
        },
        getTraits:function(cb){
            var o = {
                command:'get',
                object:'taxon_trait_value',
                params: {
	                where: [
		                {
			                key: 'taxon_id',
			                val1: id
		                },
                        {
                            key: "taxon_gender_sysname",
                            group: "female_or_null",
                            comparisonType: 'OR',
                            type: 'isNull'
                        },
                        {
                            key: "taxon_gender_sysname",
                            group: "female_or_null",
                            comparisonType: 'OR',
                            val1: 'FEMALE'
                        },
                        // {
                        //     key: "is_ecokeys",
                        //     group: "ecokyes_or_taxonomic",
                        //     comparisonType: 'OR',
                        //     type: true
                        // },
                        // {
                        //     key: "is_taxonomic",
                        //     group: "ecokyes_or_taxonomic",
                        //     comparisonType: 'OR',
                        //     val1: true
                        // }
	                ],
	                collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                // console.log(err, res)
                if (err) return cb(new MyError('Не удалось taxon_trait_value',{o : o, err : err}));

                for (var i in res) {
                	//не добавляем больше одного значения для трейта
	                if (trait_ids.has(res[i].taxon_avalible_trait_id)) {
		                traits_with_another_gender_val.add(res[i].taxon_avalible_trait_id);
	                	continue;
	                }

                    flat_trait_table[res[i].id] = res[i];
                    flat_trait_table[res[i].id].pictures = [];

                   	trait_ids.add(res[i].taxon_avalible_trait_id);
                }

                cb(null);
            });
        },
        getTraitsNotFemale:function(cb){
            var o = {
                command:'get',
                object:'taxon_trait_value',
                params: {
                    columns:['id','taxon_id','taxon_gender_sysname','taxon_avalible_trait_id'],
                    where: [
                        {
                            key: 'taxon_id',
                            val1: id
                        },
                        {
                            key: "taxon_gender_sysname",
                            type:'!in',
                            val1: ['FEMALE']
                        },
                        {
                            key: "taxon_gender_sysname",
                            type:'!isNull'
                        }
                    ],
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                // console.log(err, res)
                if (err) return cb(new MyError('Не удалось taxon_trait_value',{o : o, err : err}));

                for (var i in res)
                	traits_with_another_gender_val.add(res[i].taxon_avalible_trait_id);

                cb(null);
            });
        },
        getTraitsParental:function(cb){
            if (!parents.length) return cb(null);
            var o = {
                command:'get',
                object:'taxon_trait_value',
                params:{
                    where:[
                        {
                            key:'taxon_id',
                            group:'g1',
                            type:'in',
                            val1:parents
                        },
                        {
                            key:'inherit',
                            val1:true
                        },
                        {
                            key: "taxon_gender_sysname",
                            group: "female_or_null",
                            comparisonType: 'OR',
                            type: 'isNull'
                        },
                        {
                            key: "taxon_gender_sysname",
                            group: "female_or_null",
                            comparisonType: 'OR',
                            val1: 'FEMALE'
                        },
                        // {
                        //     key: "is_ecokeys",
                        //     group: "ecokyes_or_taxonomic",
                        //     comparisonType: 'OR',
                        //     type: true
                        // },
                        // {
                        //     key: "is_taxonomic",
                        //     group: "ecokyes_or_taxonomic",
                        //     comparisonType: 'OR',
                        //     val1: true
                        // }
                    ],
                    sort: {
                        columns: ['taxon_level'],
                        directions: ['DESC']
                    }, // Обязательно. Тогда берется имменно ближайший родственник, а не самый верхний. / Required. Then the nearest relative is taken, and not the uppermost.
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                // console.log(err, res)
                if (err) return cb(new MyError('Не удалось taxon_trait_value',{o : o, err : err}));

                for (var i in res) {
	                // не добавляем родительские, если указаны на этом уровне / Do not add parent if specified at this level
	                if (trait_ids.has(res[i].taxon_avalible_trait_id)) continue;

	                flat_trait_table[res[i].id] = res[i];
                    flat_trait_table[res[i].id].isParent = true;
                    flat_trait_table[res[i].id].pictures = [];

	                trait_ids.add(res[i].taxon_avalible_trait_id);
                }

                cb(null);
            });
        },
        getAllAnotherTraits:function(cb) {
	        if (obj.count_only || obj.doNotGetAnother) return cb(null);

	        var o = {
		        command: 'get',
		        object: 'taxon_avalible_trait',
		        params: {
			        where: [
				        // {
				        //     key: "is_ecokeys",
				        //     group: "ecokyes_or_taxonomic",
				        //     comparisonType: 'OR',
				        //     type: true
				        // },
				        // {
				        //     key: "is_taxonomic",
				        //     group: "ecokyes_or_taxonomic",
				        //     comparisonType: 'OR',
				        //     val1: true
				        // }
			        ],
			        collapseData: false
		        }
	        };

	        if (trait_ids.size)
		        o.params.where.push(
			        {
				        key: 'id',
				        type: '!in',
				        val1: Array.from(trait_ids)
			        }
		        )

	        if (taxon_ids.length)
		        o.params.where.push(
			        {
				        key: 'taxon_id',
				        type: 'in',
				        val1: taxon_ids
			        }
		        )

	        _t.api(o, function (err, res) {
		        if (err) return cb(new MyError('Не удалось taxon_avalible_trait', {o: o, err: err}));

		        taxon_avalible_trait = res;

		        for (var i in taxon_avalible_trait) {
			        taxon_avalible_trait[i].pictures = [];
		            trait_ids.add(taxon_avalible_trait[i].id);
		        }

		        cb(null);
	        });
        },
        getPictures:function(cb){
            if (obj.count_only || obj.doNotGetPictures) return cb(null);
            if (!trait_ids.size) return cb(null);
            var o = {
                command: 'get',
                object: 'Trait_picture',
                params: {
                    where: [
                        {
                            key: 'taxon_avalible_trait_id',
                            type: 'in',
                            val1: Array.from(trait_ids)
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
                    for (var j in flat_trait_table) {
                        if (flat_trait_table[j].taxon_avalible_trait_id === pic.taxon_avalible_trait_id) {
                            flat_trait_table[j].pictures.push(pic);
                        }
                    }
                    for (var k in taxon_avalible_trait) {
                        if (taxon_avalible_trait[k].id === pic.taxon_avalible_trait_id) {
                            taxon_avalible_trait[k].pictures.push(pic);
                        }
                    }
                }
                cb(null);
            });

        },
        getValues:function(cb){
            if (obj.listOnly) return cb(null);
            // Получим конкретные значения и совместим их с flat_trait_table
            // Для этого разобъем flat_trait_table на группы (INT/TEXT/SELECT)
            // Get specific values and combine them with flat_trait_table
            // To do this, split the flat_trait_table into groups (INT / TEXT / SELECT)
            var values_obj_splited = {};
            for (var i in flat_trait_table) {
                if (!values_obj_splited[flat_trait_table[i].trait_type_sysname]) values_obj_splited[flat_trait_table[i].trait_type_sysname] = {};
                values_obj_splited[flat_trait_table[i].trait_type_sysname][i] = flat_trait_table[i];
            }
            // async.eachSeries(Object.keys(values_obj_splited), function(one_value_obj_key, cb){
            async.each(Object.keys(values_obj_splited), function(one_value_obj_key, cb){
                var one_value_obj = values_obj_splited[one_value_obj_key];
                var one_value_obj_keys = Object.keys(one_value_obj);
                if (!one_value_obj_keys.length || !one_value_obj[one_value_obj_keys[0]].trait_type_sub_table_name) return cb(null);
                var o = {
                command:'get',                                                              // Since in each group all elements of the same type, we take the first
                    object:one_value_obj[one_value_obj_keys[0]].trait_type_sub_table_name, // Так как в каждой группе все элементы одного типа, берем первый попавшийся
                    params:{
                        where:[
                            {
                                key:'taxon_trait_value_id',
                                type:'in',
                                val1:one_value_obj_keys
                            }
                        ],
                        limit:100000000,
                        collapseData:false
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось получить ' + one_value_obj.trait_type_sub_table_name,{o : o, err : err}));
                    var select_ids = []; // Использеутся только для SELECT / Only used for SELECT
                    for (var i in res) {
                        flat_trait_table[res[i].taxon_trait_value_id].isSetted =  !flat_trait_table[res[i].taxon_trait_value_id].isParent;
                        flat_trait_table[res[i].taxon_trait_value_id].value_id = res[i].id;
                        flat_trait_table[res[i].taxon_trait_value_id].value1 = res[i].value1;
                        flat_trait_table[res[i].taxon_trait_value_id].value2 = res[i].value2;
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

                    // async.eachSeries(Object.keys(select_tables_obj), function(select_table_val, cb){
                    async.each(Object.keys(select_tables_obj), function(select_table_val, cb){
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
                            if (err) return cb(new MyError('Не удалось получить данные из ' + select_table_val,{o : o, err : err}));

                            for (var i in flat_trait_table) {
                                var row = flat_trait_table[i];
                                if (row.sub_table_name_for_select !== select_table_val) continue;
                                for (var j in res) {
                                    // if (row.taxon_avalible_trait_id === res[j].taxon_avalible_trait_id){
                                    if (row.value1 === res[j].id){
                                        flat_trait_table[i].value1 = res[j].name;
                                        flat_trait_table[i].value_id = res[j].id;
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
            for (var i in flat_trait_table) {
                var one_trait = flat_trait_table[i];
                if (typeof one_trait.value1 === 'undefined')
                    one_trait.value1 = '';
                traits.push(one_trait);
            }
            for (var j in traits) {
                if (traits[j].is_ecokeys)
                    traits_character.push(traits[j]);
                else if (traits[j].is_taxonomic && !traits[j].is_ecokeys)
                    traits_traits.push(traits[j]);
            }

            for (var k in taxon_avalible_trait) {
                taxon_avalible_trait[k].taxon_avalible_trait_id = taxon_avalible_trait[k].id;
                // taxon_avalible_trait[k].id = 0;

                if (taxon_avalible_trait[k].is_ecokeys)
                    traits_character.push(taxon_avalible_trait[k]);
                else if (taxon_avalible_trait[k].is_taxonomic && !taxon_avalible_trait[k].is_ecokeys)
                    traits_traits.push(taxon_avalible_trait[k]);
            }

            traits_traits.sort(function(a,b){
                if (a.trait_type_sysname === "TEXT" && b.trait_type_sysname !== "TEXT") return 1;
                else if (a.trait_type_sysname !== "TEXT" && b.trait_type_sysname === "TEXT") return -1;
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
            traits_character.sort(function(a,b){
                if (a.trait_type_sysname === "TEXT" && b.trait_type_sysname !== "TEXT") return 1;
                else if (a.trait_type_sysname !== "TEXT" && b.trait_type_sysname === "TEXT") return -1;
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
            cb(null);
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr', {
            flat_trait_table: flat_trait_table,
            traits: traits_traits,
            characters: traits_character,
            traits_with_another_gender_val: Array.from(traits_with_another_gender_val)
        }));
    });
};


class TraitsValue {
    constructor(source, obj) {
        this.source =  source;
        // this.source =  'assigned directly';
        this.taxon_id = obj.taxon_id
        this.id =  obj.id;
        this.value1 =  undefined;
        this.value2 =  undefined;
        this.value_id =  undefined;
        this.taxon_gender_id =  obj.taxon_gender_id;
        this.taxon_gender_sysname =  obj.taxon_gender_sysname;
        this.taxon_gender =  obj.taxon_gender;
        this.trait_type_sysname =  obj.trait_type_sysname;
        this.trait_type_sub_table_name =  obj.trait_type_sub_table_name;
        this.sub_table_name_for_select =  obj.sub_table_name_for_select;
        this.literature =  [];
        this.count_double_value_by_childs =  0
    }
}

Model.prototype.getAllTraitsForExport = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    if (!obj.ids) return cb(new MyError('Не передан ids',{obj:obj}));
    let taxons = {}
    async.eachSeries(obj.ids, function (id, cb) {
        let traits = {}
        let links_values = {}
        let taxon_ids = [id]
        let parents = []
        taxons[id] = {}
        let taxon_childs_ids = []
        async.series({
            getDataTaxon: cb => {
                let o = {
                    command: 'get',
                    object: 'taxon',
                    params: {
                        param_where: {
                            id: id,
                        },
                        columns: ['id', 'name'],
                        collapseData: false
                    }
                }
                _t.api(o, (err, res) => {
                    if (err) return cb(new MyError('Не удалось получит taxon', {err: err, o: o}))
                    taxons[id].name = res[0].name
                    taxons[id].id = id
                    cb(null)
                })
            },
            getParentsIds: cb => {
                _t.getParentIds({id:id}, function(err, res){
                    if (err) return cb(err);
                    parents = res.ids;
                    taxon_ids = taxon_ids.concat(parents);
                    cb(null, res);
                })
            },
            getTraits: cb => {
                var o = {
                    command:'get',
                    object:'taxon_trait_value',
                    params: {
                        param_where: {
                            taxon_id: id
                        },
                        collapseData: false
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось taxon_trait_value',{o : o, err : err}));
                    for (let i in res) {
                        let trait = res[i]
                        if (!traits[trait.taxon_avalible_trait_id]) {
                            traits[trait.taxon_avalible_trait_id] = {
                                name: trait.name,
                                taxon_avalible_trait_id: trait.taxon_avalible_trait_id,
                                values: {}
                            }
                        }
                        traits[trait.taxon_avalible_trait_id].values[trait.id] = new TraitsValue('assigned directly', trait)
                        // traits[trait.taxon_avalible_trait_id].values[trait.id] = {
                        //     source: 'assigned directly',
                        //     id: trait.id,
                        //     value1: undefined,
                        //     value2: undefined,
                        //     value_id: undefined,
                        //     taxon_gender_id: trait.taxon_gender_id,
                        //     taxon_gender_sysname: trait.taxon_gender_sysname,
                        //     taxon_gender: trait.taxon_gender,
                        //     trait_type_sysname: trait.trait_type_sysname,
                        //     trait_type_sub_table_name: trait.trait_type_sub_table_name,
                        //     sub_table_name_for_select: trait.sub_table_name_for_select,
                        //     literature: [],
                        //     count_double_value_by_childs: 0
                        // }

                    }
                    cb(null);
                });
            },
            getParentialTraits: cb => {
                var o = {
                    command:'get',
                    object:'taxon_trait_value',
                    params:{
                        where:[
                            {
                                key:'taxon_id',
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
                            columns: ['taxon_level'],
                            directions: ['DESC']
                        }, // Обязательно. Тогда берется имменно ближайший родственник, а не самый верхний. / Required. Then the nearest relative is taken, and not the uppermost.
                        collapseData:false
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось taxon_trait_value',{o : o, err : err}));
                    parent_taxons = []
                    for (let i in parents) {
                        parent_taxons[i] = parents[i]
                    }
                    let parent_taxons_buf = {}
                    for (let i in res) {
                        if (!parent_taxons_buf[res[i].taxon_id]) parent_taxons_buf[res[i].taxon_id] = {
                            taxon_id: res[i].taxon_id,
                            traits: []
                        }
                        parent_taxons_buf[res[i].taxon_id].traits.push(res[i])
                        // parent_taxons_buf[res[i].taxon_id].push({
                        //     taxon_id: res[i].taxon_id,
                        //     traits: res[i]
                        // })
                    }
                    for (let i in parent_taxons_buf) {
                        parent_taxons[ parent_taxons.indexOf(parseInt(i, 10)) ] = parent_taxons_buf[i]
                    }


                    for (let i in parent_taxons) {
                        let traits_parent = parent_taxons[i]
                        loopParentalTaxonsTraits: for (let j in traits_parent) {
                            if (!traits_parent.traits) continue loopParentalTaxonsTraits
                            if (Array.isArray(traits_parent.traits)) {
                                for (let gg in traits_parent.traits) {
                                    let parent_trait = traits_parent.traits[gg]

                                    if (!traits[parent_trait.taxon_avalible_trait_id]) { //TODO тут возвонжно в тржйтах ещё надо будет пролгонять цикл
                                        traits[parent_trait.taxon_avalible_trait_id] = {
                                            name: parent_trait.name,
                                            taxon_avalible_trait_id: parent_trait.taxon_avalible_trait_id,
                                            values: {}
                                        }
                                    }
                                    for (let n in traits[parent_trait.taxon_avalible_trait_id]) {
                                        let traits_values = traits[parent_trait.taxon_avalible_trait_id].values
                                        for (let m in traits_values) {
                                            let trait_value = traits_values[m]
                                            if (trait_value.source == 'parent' && trait_value.taxon_id != parent_trait.taxon_id) {
                                                break loopParentalTaxonsTraits
                                            }
                                        }
                                    }
                                    traits[parent_trait.taxon_avalible_trait_id].values[parent_trait.id] = new TraitsValue('parent', parent_trait)
                                }
                            }
                        }
                    }
                    cb(null);
                });
            },
            getValues: cb => {
                if (Object.keys(traits).length == 0) return  cb(null)
                if (obj.listOnly) return cb(null);
                // Получим конкретные значения и совместим их с flat_trait_table
                // Для этого разобъем flat_trait_table на группы (INT/TEXT/SELECT)
                // Get specific values and combine them with flat_trait_table
                // To do this, split the flat_trait_table into groups (INT / TEXT / SELECT)
                // var values_obj_splited = {};
                let values_obj_splited = {}
                // let links_values = {}
                for (let i in traits) {
                    let trait = traits[i]
                    for (let j in trait.values) {
                        if (!values_obj_splited[trait.values[j].trait_type_sysname]) values_obj_splited[trait.values[j].trait_type_sysname] = {}
                        values_obj_splited[trait.values[j].trait_type_sysname][j] = {
                            id: j,
                            trait_type_sub_table_name: trait.values[j].trait_type_sub_table_name,
                            sub_table_name_for_select: trait.values[j].sub_table_name_for_select
                        }
                        links_values[trait.values[j].id] = trait.values[j]
                    }
                }
                // async.eachSeries(Object.keys(values_obj_splited), function(one_value_obj_key, cb){
                async.each(Object.keys(values_obj_splited), function(one_value_obj_key, cb){
                    var one_value_obj = values_obj_splited[one_value_obj_key];
                    var one_value_obj_keys = Object.keys(one_value_obj);
                    if (!one_value_obj_keys.length || !one_value_obj[one_value_obj_keys[0]].trait_type_sub_table_name) return cb(null);
                    var o = {
                        command:'get',                                                              // Since in each group all elements of the same type, we take the first
                        object:one_value_obj[one_value_obj_keys[0]].trait_type_sub_table_name, // Так как в каждой группе все элементы одного типа, берем первый попавшийся
                        params:{
                            where:[
                                {
                                    key:'taxon_trait_value_id',
                                    type:'in',
                                    val1:one_value_obj_keys
                                }
                            ],
                            limit:100000000,
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить ' + one_value_obj.trait_type_sub_table_name,{o : o, err : err}));
                        // var select_ids = []; // Использеутся только для SELECT / Only used for SELECT
                        let select_links_values = []
                        if (one_value_obj_key !== 'SELECT') {
                            for (let i in res) {
                                links_values[res[i].taxon_trait_value_id].value1 = res[i].value1.toString()
                                links_values[res[i].taxon_trait_value_id].value2 = res[i].value2.toString()
                                links_values[res[i].taxon_trait_value_id].value_id = res[i].id
                            }
                        } else {
                            for (let i in res) {
                                links_values[res[i].taxon_trait_value_id].value_id = res[i].value1
                                select_links_values.push(links_values[res[i].taxon_trait_value_id])
                            }
                        }
                        if (one_value_obj_key !== 'SELECT') return cb(null);
                        async.each(select_links_values, function(select_link_value, cb){
                            var o = {
                                command:'get',
                                object: select_link_value.sub_table_name_for_select,
                                params:{
                                    where:[
                                        {
                                            key:'id',
                                            type:'in',
                                            val1: [select_link_value.value_id]
                                        }
                                    ],
                                    collapseData:false
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить данные из ' + select_table_val,{o : o, err : err}));
                                if (res.length)
                                    links_values[select_link_value.id].value_name = res[0].name
                                cb(null);
                            });
                        }, cb);
                    });
                }, cb);
            },
            getReferenceLiterature: cb => {
                if (Object.keys(links_values).length == 0) return  cb(null)

                let o = {
                    command: 'get',
                    object: 'taxon_trait_value_literature_data_link',
                    params: {
                        where: [{
                            key: 'taxon_trait_value_id',
                            type: 'in',
                            val1: Object.keys(links_values)
                        }],
                        collapseData:false
                    }
                }
                _t.api(o, (err, res) => {
                    if (err) return cb(new MyError('Не удалось получить литературу на трэйты taxon_trait_value_literature_data_link',{o : o, err : err}));
                    for (let i in res) {
                        links_values[res[i].taxon_trait_value_id].literature.push({
                            author: res[i].author,
                            year: res[i].year
                        })
                    }
                    cb(null)
                })
            },
            getChildIds: cb => {
                if (Object.keys(links_values).length == 0) return  cb(null)
                _t.getChildIds({
                    id: id
                }, (err, res) => {
                    if (err) return cb(new MyError('Не удалось получить дочерние такхоны', {err: err, obj: {id: id}}))
                    taxon_childs_ids = res.ids;
                    cb(null)
                })
            },
            countChildsReplicates: cb => {
                if (Object.keys(links_values).length == 0) return  cb(null)
                //итерируем по трейтам
                async.eachSeries(Object.keys(traits), function(trait_id, cb){
                    let trait_values = traits[trait_id].values;
                    //итерируем внутри трейта во значениям (у трейта одного таксона может быть несколько значений, зависит от пола)
                    async.eachSeries(Object.keys(trait_values), function(trait_value_id, cb){
                        let trait_value = trait_values[trait_value_id]
                        // let count_double = 0
                        //итерируем все дочерние таксоны
                        async.eachSeries(taxon_childs_ids, function(taxon_id, cb) {
                            let finded_trait_value = undefined
                            async.series({
                                getTrait: cb => {
                                    var o = {
                                        command:'get',
                                        object:'taxon_trait_value',
                                        params: {
                                            param_where: {
                                                taxon_id: taxon_id,
                                                taxon_gender_id: trait_value.taxon_gender_id,
                                                taxon_avalible_trait_id: trait_id
                                            },
                                            collapseData: false
                                        }
                                    };
                                    _t.api(o, function (err, res) {
                                        if (err) return cb(new MyError('Не удалось taxon_trait_value',{o : o, err : err}));
                                        if (res.length > 1) return cb(new MyError('Что то пошло не так, загрузилось два значения taxon_trait_value, такого не может быть', {o: o, err: err, res: res}))
                                        if (res.length == 1) {
                                            finded_trait_value = {
                                                // taxon_trait_value_id: res[0].taxon_trait_value_id,
                                                taxon_trait_value_id: res[0].id,
                                                value1: undefined,
                                                value2: undefined,
                                                value_id: undefined,
                                                value_name: undefined,
                                                taxon_gender_id: res[0].taxon_gender_id,
                                                taxon_gender_sysname: res[0].taxon_gender_sysname,
                                                taxon_gender: res[0].taxon_gender,
                                                trait_type_sysname: res[0].trait_type_sysname,
                                                trait_type_sub_table_name: res[0].trait_type_sub_table_name,
                                                sub_table_name_for_select: res[0].sub_table_name_for_select,
                                            }
                                        }
                                        cb(null);
                                    });
                                },
                                getValue: cb => {
                                    if (!finded_trait_value) return cb(null)
                                    var o = {
                                        command:'get',                                                              // Since in each group all elements of the same type, we take the first
                                        object: finded_trait_value.trait_type_sub_table_name, // Так как в каждой группе все элементы одного типа, берем первый попавшийся
                                        params:{
                                            where:[
                                                {
                                                    key:'taxon_trait_value_id',
                                                    type:'in',
                                                    val1: finded_trait_value.taxon_trait_value_id
                                                }
                                            ],
                                            limit:100000000,
                                            collapseData:false
                                        }
                                    };
                                    _t.api(o, function (err, res) {
                                        if (err) return cb(new MyError('Не удалось получить ' + finded_trait_value.trait_type_sub_table_name + ' ',{o : o, err : err}));
                                        if (Object.keys(res).length != 1) return cb(new MyError('Не удалось получить ' + finded_trait_value.trait_type_sub_table_name + ', что то пошло не так....',{o : o, err : err}));
                                        res = res[0]
                                        finded_trait_value.value1 = res.value1
                                        finded_trait_value.value2 = res.value2
                                        finded_trait_value.value_id = res.id
                                        cb(null)
                                    });
                                },
                                matching: cb => {
                                    if (!finded_trait_value) return cb(null)
                                    if (trait_value.trait_type_sysname == 'SELECT') {
                                        if (trait_value.value_id == finded_trait_value.value1)
                                        	trait_value.count_double_value_by_childs++
                                    } else {
                                        if (trait_value.value1 != finded_trait_value.value1)
                                        	return cb(null)
                                        if (trait_value.value2 != finded_trait_value.value2)
                                        	return cb(null)

                                        trait_value.count_double_value_by_childs++
                                    }
                                    cb(null)
                                }
                            }, cb)
                        }, cb)
                    }, cb)
                }, cb)
            }
        }, (err, res) => {
            if (err) return cb(err)
            taxons[id].traits = traits
            cb(null)
        })
    }, (err, res) => {
        if (err) return cb(err)
        cb(null, new UserOk('noToastr', {
            taxons: taxons
        }));
    })
};

Model.prototype.export_to_excel_all_traits_taxon = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (!obj.ids) return cb(new MyError('Не передан ids',{obj:obj}));

    let _t = this;

    let fields = obj.fields;

    let name = 'traits_taxon_' + moment().format('DDMMYYYY_HHmm') + '.xlsx';

    // let taxons_ids;
    let taxons;
    // let traits_with_values_set = new Set();
    async.series({
        getData: function (cb) {
            _t.getAllTraitsForExport({
                ids: obj.ids
            }, (err, res) => {
                if (err) return cb(err)
                taxons = res.taxons
                cb(null)
            })
        },
        toExcel: function (cb) {
            let excel = new ToExcel({name: name});
            excel.addWorksheet({});

            async.series({
                addColumns: function (cb) {
                    // let columns = [];
                    //
                    // fields.forEach(row => {
                    //     if (row.type === 'field') {
                    //         columns.push({
                    //             header: row.name,
                    //             key: row.field
                    //         })
                    //     } else if (row.type === 'trait' && traits_with_values.indexOf(row.trait_id) > -1) {
                    //         columns.push({
                    //             header: row.name
                    //         })
                    //     }
                    // });
                    //
                    // excel.setColumns({columns: columns});

                    return cb(null);
                },
                addRows: function (cb) {
                    let rows = [];

                    // taxons.forEach(taxon => {
                    //     let newRow = [];
                    //
                    //     fields.forEach(row => {
                    //         if (row.type === 'field') {
                    //             newRow.push(taxon[row.field]);
                    //         } else if (row.type === 'trait' && traits_with_values.indexOf(row.trait_id) > -1) {
                    //             newRow.push(taxon.values[row.trait_id] ? taxon.values[row.trait_id].value1 : '');
                    //         }
                    //     });
                    //
                    //     rows.push(newRow);
                    // });
                    //
                    // excel.worksheet.addRows(rows);

                    return cb(null);
                },
                save: function (cb) {
                    excel.writeFile({}, cb)
                }
            }, function (err, res) {
                if (err) return cb(err);
                return cb(null, res.save)
            });
        }
    }, function (err, res) {
        if (err) return cb(err);
        cb(null, res.toExcel);
    });
};




Model.prototype.export_to_excel_table_traits_taxon = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    let _t = this;

    let name = 'taxon_' + moment().format('DDMMYYYY_HHmm') + '.xlsx';

    let taxons_ids = obj.ids ? obj.ids : null;
    let taxons;
    let traits_row = []
    async.series({
        getData: function (cb) {
            async.series({
                getTaxonsIdsIfEmpty: cb => {
                    if (taxons_ids) return cb(null)

                    let params = {
                        where: obj.where,
                        limit: obj.limit,
                        use_cache: false,
                        collapseData: false
                    };
                    _t.get(params, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить данные', {params: params, err: err}));
                        if (!res || !res.length) return cb(new MyError('Taxa not found', {params: params, err: err}));
                        taxons_ids = res.map(item => item.id);
                        cb(null);
                    });
                },
                getData: cb => {
                    let params = {
                        ids: taxons_ids
                    }
                    _t.getAllTraitsForExport(params, (err, res) => {
                        if (err) return cb(new MyError('Не удалось получить данные', {params: params, err: err}));
                        taxons = res.taxons
                        cb(null)
                    })
                },
                prepareDataTaxons: cb => {
                    for (let i in taxons) {
                        let taxon = taxons[i]

                        for (let j in taxon.traits) {
                            let taxon_trait = taxon.traits[j]

                            for (let n in taxon_trait.values) {
                                let taxon_trait_value = taxon_trait.values[n]

                                let reference = ''
                                for (let k in taxon_trait_value.literature)
                                    reference += '( author: ' + taxon_trait_value.literature[k].author
                                        + ', year: ' + taxon_trait_value.literature[k].year + ')'

                                traits_row.push({
                                    taxon: taxon.name,
                                    name: taxon_trait.name,
	                                value: taxon_trait_value.value_name
                                        ? taxon_trait_value.value_name
                                        : (taxon_trait_value.value2
                                            ? (taxon_trait_value.value1 + '-' +taxon_trait_value.value2)
                                            : taxon_trait_value.value1),
	                                sex: taxon_trait_value.taxon_gender,
	                                replicates: taxon_trait_value.replicates,
	                                location_name: taxon_trait_value.location_name,
	                                source: taxon_trait_value.source,
	                                reference: reference,
                                })
                            }
                        }
                    }

                    cb(null)
                }
            }, cb)
        },
        toExcel: function (cb) {
            if (!traits_row.length)
                return cb(new UserError('Selected taxa doesn\'t have traits'))

            let excel = new ToExcel({name: name});

            excel.addWorksheet({});
            async.series({
                addColumns: function (cb) {
                    let columns = [
                        {key: 'taxon', header: 'Taxon'},
                        {key: 'trait', header: 'Trait'},
                        {key: 'value', header: 'Value'},
	                    {key: 'sex', header: 'Stage/sex'},
	                    {key: 'replicates', header: 'Replicates'},
	                    {key: 'location_name', header: 'Location'},
	                    {key: 'source', header: 'Source'},
                        {key: 'reference', header: 'Reference'},
                        // {key: 'updated', header: 'Last modified by'},
                        // {key: 'taxon', header: 'Last modified on'},
                    ];
                    excel.setColumns({columns: columns});
                    return cb(null);
                },
                addRows: function (cb) {
                    let rows = [];
                    traits_row.forEach(trait => {
                        let newRow = [];
                        for (let j in trait) {
                            newRow.push(trait[j])
                        }
                        rows.push(newRow);
                    });
                    excel.worksheet.addRows(rows);
                    return cb(null);
                },
                save: function (cb) {
                    excel.writeFile({}, cb)
                }
            }, function (err, res) {
                if (err) return cb(err);
                return cb(null, res.save)
            });
        }
    }, function (err, res) {
        if (err) return cb(err);
        cb(null, res.toExcel);
    });
};
// var o = {
//     command:'setTraitValue',
//     object:'Taxon',
//     params:{
//         id:1,
//         taxon_avalible_trait_id:1,
//         value1:'',
//         value2:'',
//         collapseData:false
//     }
// };
/**
 * Зададть значение для трейта (данные будут записаны в соответствующие таблицы) / Set the value for the trait (the data will be written to the corresponding tables)
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.setTraitValue = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.taxon_id;

    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var taxon_avalible_trait_id = obj.taxon_avalible_trait_id;

    if (isNaN(+taxon_avalible_trait_id)) return cb(new MyError('Не передан taxon_avalible_trait_id',{obj:obj}));

    if (typeof obj.value1 === 'undefined') return cb(new MyError('Не передано значение.',{obj:obj}));

    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var taxon_trait;
    async.series({
        getTaxonTrait:function(cb){
            var o = {
                command:'get',
                object:'taxon_trait_value',
                params:{
                    param_where:{
                        taxon_id:id,
                        taxon_avalible_trait_id:taxon_avalible_trait_id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon_trait_value',{o : o, err : err}));
                if (!res.length) return cb(null); // Значение еще не было установлено
                taxon_trait = res[0];
                cb(null);
            });
        },
        createValueAndGet:function(cb){
            if (taxon_trait) return cb(null); // Уже существует
            var taxon_trait_value_id;
            async.series({
                create:function(cb){
                    var o = {
                        command:'add',
                        object:'taxon_trait_value',
                        params:{
                            taxon_id:id,
                            taxon_avalible_trait_id:taxon_avalible_trait_id,
                            rollback_key:rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось создать taxon_trait_value',{o : o, err : err}));
                        taxon_trait_value_id = res.id;
                        cb(null);
                    });
                },
                get:function(cb){
                    var o = {
                        command:'getById',
                        object:'taxon_trait_value',
                        params:{
                            id:taxon_trait_value_id,
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить только что созданный taxon_trait_value',{o : o, err : err}));
                        taxon_trait = res[0];
                        cb(null);
                    });
                }
            }, cb);
        },
        setValue:function(cb){
            //trait_type_sub_table_name
            var sub_table_row;
            async.series({
                getAndSetToSubTable:function(cb){
                    async.series({
                        get:function(cb){
                            var o = {
                                command:'get',
                                object:taxon_trait.trait_type_sub_table_name,
                                params:{
                                    param_where:{
                                        taxon_trait_value_id:taxon_trait.id
                                    },
                                    collapseData:false
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить значение из sub таблицы',{o : o, err : err}));
                                if (res.length > 1) return cb(new MyError('Слишком много значений.'));
                                if (!res.length) return cb(null); // Надо будет создать
                                sub_table_row = res[0];
                                cb(null);
                            });
                        },
                        update:function(cb){
                            if (!sub_table_row) return cb(null); // Будем создавать в следующей функции.
                            var o = {
                                command:'modify',
                                object:taxon_trait.trait_type_sub_table_name,
                                params:{
                                    id:sub_table_row.id,
                                    // taxon_trait_value_id:taxon_trait.id,
                                    value1:obj.value1,
                                    value2:obj.value2,
                                    rollback_key:rollback_key
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось установить значение в sub table',{o : o, err : err}));
                                cb(null);
                            });
                        },
                        createAndSet:function(cb){
                            if (sub_table_row) return cb(null); // Уже все сделано.
                            var o = {
                                command:'add',
                                object:taxon_trait.trait_type_sub_table_name,
                                params:{
                                    taxon_trait_value_id:taxon_trait.id,
                                    value1:obj.value1,
                                    value2:obj.value2,
                                    rollback_key:rollback_key
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось добавить значение в sub table',{o : o, err : err}));
                                cb(null);
                            });
                        }
                    }, cb);
                }
            }, cb);
        }
    },function (err, res) {
        if (err) {
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!doNotSaveRollback){
               rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'setTraitValue', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });
};


/**
 * Получить изображение родительских таксонов / Get image of parent taxa
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.getParentPictures = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var pictures;
    var taxon;
    var parents;
	let di_ids;
	let di_pictures;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить таксон.',{id:id,err:err}));
                taxon = res[0];
                cb(null);
            });
        },
        // getParents:function(cb){
        //     _t.getParentIds({id:id}, function(err, res){
        //         if (err) return cb(err);
        //         parents = res.ids;
        //         cb(null, res);
        //     })
        // },
        getPictures:function(cb){
            // if (!parents.length) return cb(null);
            var o = {
                command:'get',
                object:'taxon_picture',
                params:{
                	param_where: {
                		is_main_picture: true,
		                taxon_id: taxon.parent_id
	                },
                    // where:[
                    //     {
                    //         key:'taxon_id',
                    //         type:'in',
                    //         val1:parents
                    //     }
                    // ],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon_pictures',{o : o, err : err}));
                pictures = res;
                cb(null);
            });
        },
	    getIndividuals: cb => {
		    let o = {
			    command: 'get',
			    object: 'data_individual',
			    params: {
				    columns: ['id', 'taxon_id'],
				    param_where: {
					    taxon_id: taxon.parent_id
				    },
				    collapseData: false
			    }
		    };

		    _t.api(o, function (err, res) {
			    if (err) return cb(new MyError('Не удалось получить taxon_pictures',{o : o, err : err}));
			    di_ids = res.map(row => {
				    return row.id
			    });
			    cb(null);
		    });
	    },
	    getDIPictures: cb => {
		    if (!di_ids || !di_ids.length) return cb(null);

		    let o = {
			    command: 'get',
			    object: 'data_individual_picture',
			    params: {
				    where: [
					    {
						    key: 'data_individual_id',
						    type: 'in',
						    val1: di_ids
					    }
				    ],
				    collapseData: false
			    }
		    };

		    _t.api(o, function (err, res) {
			    if (err) return cb(new MyError('Не удалось получить taxon_pictures',{o : o, err : err}));
			    di_pictures = res;
			    cb(null);
		    });
	    }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{
        	pictures: pictures,
	        di_pictures: di_pictures
        }));
    });
};

/**
 * Получим изображения для таксона / We obtain images for the taxon
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.getPictures = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var pictures;
    var taxon;
    let di;
    let di_pictures = []
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить таксон.',{id:id,err:err}));
                taxon = res[0];
                cb(null);
            });
        },
        getPictures:function(cb){
            var o = {
                command:'get',
                object:'taxon_picture',
                params:{
                    param_where: {},
                    where:[
                        {
                            key:'taxon_id',
                            val1:taxon.id
                        }
                    ],
	                sort: {
		                columns: ['is_main_picture'],
		                directions: ['DESC']
	                },
                    collapseData:false
                }
            };
            if (obj.show_on_site)
                o.params.param_where.show_on_site = true;
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon_pictures',{o : o, err : err}));
                pictures = res;
                cb(null);
            });
        },
	    getIndividuals: cb => {
	        let o = {
	            command: 'get',
	            object: 'data_individual',
	            params: {
	            	columns: ['id', 'taxon_id', 'project'],
		            param_where: {
			            taxon_id: taxon.id
		            },
		            collapseData: false
	            }
	        };

		    _t.api(o, function (err, res) {
			    if (err) return cb(new MyError('Не удалось получить taxon_pictures',{o : o, err : err}));
			    di = res
			    cb(null);
		    });
	    },
	    getDIPictures: cb => {
        	if (!di || !di.length) return cb(null);

	        let o = {
	            command: 'get',
	            object: 'data_individual_picture',
	            params: {
	                where: [
		                {
		                	key: 'data_individual_id',
			                type: 'in',
			                val1: di.map(row => row.id)
		                }
	                ],
		            collapseData: false
	            }
	        };

		    _t.api(o, function (err, res) {
			    if (err) return cb(new MyError('Не удалось получить taxon_pictures',{o : o, err : err}));
                res.forEach(pic => {
                    for (const organism of di)
                        if (organism.id === pic.data_individual_id) {
                            pic.inherited_source = organism.project + ', individual ' + organism.id
                            di_pictures.push(pic)
                        }
                })
			    cb(null);
		    });
	    }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{
        	pictures: pictures,
	        di_pictures: di_pictures
        }));
    });
};

/**
 * Получим изображения для таксонов того же уровня / We obtain images for taxa of the same level
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.getSameLevelPictures = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var pictures = [];
    var taxon;
    var taxon_ids = [];
	let di_ids;
	let di_pictures;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить таксон.',{id:id,err:err}));
                taxon = res[0];
                cb(null);
            });
        },
        getAnotherTaxons:function(cb){
            var params = {
                where:[
                    {
                        key:'id',
                        type:'!in',
                        val1:[taxon.id]
                    },
                    // {
                    //     key:'level_char',
                    //     val1:taxon.level_char
                    // }
                    {
                        key:'parent_id',
                        val1:taxon.parent_id
                    }
                ],
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить таксоны того же уровня',{params : params, err : err}));
                for (var i in res) {
                    taxon_ids.push(res[i].id);
                }
                cb(null);
            });

        },
        getPictures:function(cb){
            if (!taxon_ids.length) return cb(null);
            var o = {
                command:'get',
                object:'taxon_picture',
                params:{
                	param_where: {
                		is_main_picture: true
	                },
                    where:[
                        {
                            key:'taxon_id',
                            type:'in',
                            val1:taxon_ids
                        }
                    ],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon_pictures',{o : o, err : err}));
                pictures = res;
                cb(null);
            });
        },
	    getIndividuals: cb => {
		    if (!taxon_ids.length) return cb(null);

		    let o = {
			    command: 'get',
			    object: 'data_individual',
			    params: {
				    columns: ['id', 'taxon_id'],
				    where: [
					    {
						    key: 'taxon_id',
						    type: 'in',
						    val1: taxon_ids
					    }
				    ],
				    collapseData: false
			    }
		    };

		    _t.api(o, function (err, res) {
			    if (err) return cb(new MyError('Не удалось получить taxon_pictures',{o : o, err : err}));
			    di_ids = res.map(row => {
				    return row.id
			    });
			    cb(null);
		    });
	    },
	    getDIPictures: cb => {
		    if (!di_ids || !di_ids.length) return cb(null);

		    let o = {
			    command: 'get',
			    object: 'data_individual_picture',
			    params: {
				    where: [
					    {
						    key: 'data_individual_id',
						    type: 'in',
						    val1: di_ids
					    }
				    ],
				    collapseData: false
			    }
		    };


		    _t.api(o, function (err, res) {
			    if (err) return cb(new MyError('Не удалось получить taxon_pictures',{o : o, err : err}));
			    di_pictures = res;
			    cb(null);
		    });
	    }
    },function (err, res) {
        if (err) return cb(err);
	    cb(null, new UserOk('noToastr',{
		    pictures: pictures,
		    di_pictures: di_pictures
	    }));
    });
};





// var o = {
//     command:'importFromGBIF',
//     object:'Taxon',
//     params:{
//         gbif_parentKey:54
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// });
/**
 * Импортируем из GBIF / We import from GBIF
 * @param obj
 * @param cb
 */
Model.prototype.importFromGBIF = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;
    global.gbif_counter = global.gbif_counter || 0;
    var gbif_keys = obj.gbif_keys || [];
    var gbif_offset = obj.gbif_offset || 0;
    // if(gbif_keys.length && obj.gbif_parentKey === 54){
    //     debugger;
    // }
    // if(obj.gbif_parentKey === 54){
    //     debugger;
    // }
    var taxons = [];
    var taxons_obj_ById = {};
    var taxons_obj_ByKey = {};
    var taxons_obj_ByName = {};
    var taxons_obj_ByParentName = {};
    var gbif_taxons = [];

    var limitPortion;
    var portion_count = 0;

    var endOfRecords;
    var getPortion = function(obj2, cb){
        if (arguments.length == 1) {
            cb = arguments[0];
            obj2 = {};
        }
        var params = {
            gbif_parentKey:obj2.gbif_parentKey || obj.gbif_parentKey,
            limit:8000,
            offset:gbif_offset
        };
        _t.requestGBIF(params, function(err, res){
            if (err) {
                console.log('ERROR','При попытке получить данные из GBIF возникла ош.',{params:params, err:err});
                setTimeout(function(){
                    _t.importFromGBIF(obj, cb);
                },30000);
                return;
                // return cb(new MyError('При попытке получить данные из GBIF возникла ош.',{params:params, err:err}));
            }
            for (var i in res.results) {
                if (gbif_keys.indexOf(res.results[i].key) === -1){
                    gbif_taxons.push(res.results[i])
                    // console.log('res.results[i].key',res.results[i].key);
                }
            }
            // var tmp = [];
            // for (var i2 in gbif_taxons) {
            //     tmp.push(gbif_taxons[i2].key);
            // }
            // if (tmp.length){
            //     console.log('res.results[i].key',tmp.join(','));
            // }

            // gbif_taxons = gbif_taxons.concat(res.results);
            portion_count++;
            console.log('Порция:', portion_count, 'Получено записей:', res.results.length, 'Всего получено:', gbif_taxons.length);
            global.gbif_counter += res.results.length;
            console.log('global.gbif_counter',global.gbif_counter);
            endOfRecords = res.endOfRecords;
            if (gbif_taxons.length >= 8000 && !endOfRecords){
                 limitPortion = true;
                return cb(null);
            }
            if (!endOfRecords) return getPortion(cb);
            return cb(null);
        });
    };

    var t1 = moment();
    async.series({
        getThisAndCheckImport:function(cb){
            var this_taxon;
            async.series({
                get:function(cb){
                    if (global.taxons_obj_ByKey){
                        this_taxon = global.taxons_obj_ByKey[obj.gbif_parentKey];
                    }
                    if (this_taxon) return cb(null);
                    var params = {
                        param_where:{
                            gbif_key:obj.gbif_parentKey
                        },
                        columns:['id','is_gbif_child_imported','gbif_key','gbif_nubKey','gbif_nameKey','gbif_taxonID','gbif_sourceTaxonKey','gbif_kingdom','gbif_phylum','gbif_family','gbif_kingdomKey',
                            'gbif_phylumKey','gbif_classKey','gbif_familyKey','gbif_datasetKey','gbif_constituentKey','gbif_parentKey','gbif_parent','gbif_parent','gbif_scientificName',
                            'gbif_canonicalName','gbif_authorship','gbif_nameType','gbif_rank','gbif_origin','gbif_taxonomicStatus','gbif_nomenclaturalStatus','gbif_remarks',
                            'gbif_numDescendants','gbif_lastCrawled','gbif_lastInterpreted','gbif_issues','gbif_synonym'],
                        collapseData:false
                    };
                    _t.get(params, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить this_taxon',{params : params, err : err}));
                        this_taxon = res[0];
                        cb(null);
                    });
                },
                check:function(cb){
                    if (!this_taxon) return cb(null);
                    if (this_taxon.is_gbif_child_imported) return cb('return');
                    return cb(null);
                    // for (var i in this_taxon) {
                    //     if (!this_taxon[i].is_gbif_child_imported) {
                    //         return cb(null);
                    //     }
                    // }
                    // return cb('return');
                }
            }, cb);


        },
        getGBIF:function(cb){
            getPortion(function(err, res){
                if (err) return cb(err);
                console.log('Все данные получены.', 'Время:', moment().diff(t1));
                cb(null);
            });
        },
        get:function(cb){
            // return cb(null);
            if (global.taxons) {
                taxons = global.taxons;
                for (var i in taxons) {
                    taxons_obj_ById[taxons[i].id] = taxons[i];
                    taxons_obj_ByKey[taxons[i].gbif_key] = taxons[i];
                    taxons_obj_ByName[taxons[i].name] = taxons[i];
                    taxons_obj_ByParentName[taxons[i].parent_name] = taxons[i];
                }
                return cb(null);
            }
            if (!gbif_taxons.length) return cb('return');
            var params = {
                collapseData:false,
                columns:['id','name','parent_id','is_gbif_child_imported','gbif_key','gbif_nubKey','gbif_nameKey','gbif_taxonID','gbif_sourceTaxonKey','gbif_kingdom','gbif_phylum','gbif_family','gbif_kingdomKey',
                    'gbif_phylumKey','gbif_classKey','gbif_familyKey','gbif_datasetKey','gbif_constituentKey','gbif_parentKey','gbif_parent','gbif_parent','gbif_scientificName',
                    'gbif_canonicalName','gbif_authorship','gbif_nameType','gbif_rank','gbif_origin','gbif_taxonomicStatus','gbif_nomenclaturalStatus','gbif_remarks',
                    'gbif_numDescendants','gbif_lastCrawled','gbif_lastInterpreted','gbif_issues','gbif_synonym'],
                limit:100000000
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить таксоны',{params : params, err : err}));

                taxons = res;
                global.taxons = taxons;
                for (var i in taxons) {
                    taxons_obj_ById[taxons[i].id] = taxons[i];
                    taxons_obj_ByKey[taxons[i].gbif_key] = taxons[i];
                    taxons_obj_ByName[taxons[i].name] = taxons[i];
                    taxons_obj_ByParentName[taxons[i].parent_name] = taxons[i];
                }
                global.taxons_obj_ByKey = taxons_obj_ByKey;
                cb(null);
            });
        },


        sort:function(cb){
            // return cb(null);
            gbif_taxons.sort(funcs.fieldSorter(['parentKey', 'key']));
            return cb(null);
        },
        merge:function(cb){
            // return cb(null);
            // Ищем по gbif_key
            //// Если находим, то мерджим поля и проверяем парент, Устанавливаем (при необходимости меняем) парент
            //// Если не нашли, ищем по имени
            //// Если нашли, мерджим поля, проставляем парент
            //// Если не нашли, создаем

            for (var i in gbif_taxons) {
                var gbif_taxon = gbif_taxons[i];


                // Здесь попробуем установить parent_id. Он не найдется для тех элементов, чей парент еще только предстоит
                // добавить в систему. Однако он найдется при повторном вызове (его выполним по завершению первой итерации)
                var parent_taxon = taxons_obj_ByKey[gbif_taxon.parentKey] || taxons_obj_ByParentName[gbif_taxon.parent];
                if (parent_taxon) gbif_taxon.parent_id = parent_taxon.id;

                var finded_taxon = funcs.cloneObj(taxons_obj_ByKey[gbif_taxon.key]);// || funcs.cloneObj(taxons_obj_ByName[gbif_taxon.canonicalName]);

                if (!finded_taxon || (finded_taxon.gbif_key && finded_taxon.gbif_key !== gbif_taxon.key)) {
                    // Если не нашелся, то помечаем на добавление и идем дальше
                    gbif_taxon.to_add = true;
                    continue;
                }
                taxons_obj_ById[finded_taxon.id].finded_in_gbif = true; // Возможно потом буду использовать для пометки тех, кто изчез из gbif

                var fieldsToMerge = ['key','nubKey','nameKey','taxonID','sourceTaxonKey','kingdom','phylum','family','kingdomKey',
                'phylumKey','classKey','familyKey','datasetKey','constituentKey','parentKey','parent','parent','scientificName',
                'canonicalName','authorship','nameType','rank','origin','taxonomicStatus','nomenclaturalStatus','remarks',
                'numDescendants','lastCrawled','lastInterpreted','issues','synonym'];
                // Если нашли, мерждим поля
                gbif_taxon.id = finded_taxon.id;
                var stringifyFields = ['nomenclaturalStatus','issues'];
                var dataTimeFormatFields = ['lastCrawled','lastInterpreted'];
                for (var j in gbif_taxon) {
                    if (fieldsToMerge.indexOf(j) === -1) continue;
                    if (stringifyFields.indexOf(j)!==-1) gbif_taxon[j] = JSON.stringify(gbif_taxon[j]);
                    if (dataTimeFormatFields.indexOf(j)!==-1) gbif_taxon[j] = moment(gbif_taxon[j]).format('YYYY-MM-DD HH:mm:ss');
                    if (dataTimeFormatFields.indexOf(j)!==-1) {
                        finded_taxon['gbif_' + j] = moment(finded_taxon['gbif_' + j],'DD.MM.YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
                    }
                    if (finded_taxon['gbif_' + j] != gbif_taxon[j]){ // Здесь обязательно не строгое сравнение.
                        if (!gbif_taxon.to_modify) gbif_taxon.to_modify = [];
                        gbif_taxon.to_modify.push(j);
                        // if (dataTimeFormatFields.indexOf(j)!==-1) {
                        //     finded_taxon['gbif_' + j] = moment(finded_taxon['gbif_' + j],'YYYY-MM-DD HH:mm:ss').format('DD.MM.YYYY HH:mm:ss');
                        // }
                    }
                }
            }
            var dt = funcs.getDateTimeMySQL();
            async.series({
                add:function(cb){
                    // gbif_taxons.sort(funcs.fieldSorter(['key']));
                    // console.log('test');

                    // for (var i in gbif_taxons) {
                    //     if (gbif_taxons[i].to_add) console.log('to_add');
                    // }
                    // return cb(null);

                    var counter = 0;
                    funcs.splitByPortion({
                        data: funcs.cloneObj(gbif_taxons),
                        // inPortion:1000,
                        maxProcess:8
                    }, function (items, cb) {

                        async.eachSeries(items, function (gbif_taxon_item, cb) {
                            counter++;
                            if (!gbif_taxon_item.to_add) return cb(null);

                            if (taxons_obj_ByKey[gbif_taxon_item.key]) return cb(null);
                            var params = {
                                name: gbif_taxon_item.canonicalName,
                                custom_name: gbif_taxon_item.canonicalName,
                                parent_id: gbif_taxon_item.parent_id,
                                is_gbif: true,
                                is_gbif_datatime: dt,
                                is_gbif_datatime_updated: dt,
                                gbif_key: gbif_taxon_item.key,
                                gbif_nubKey: gbif_taxon_item.nubKey,
                                gbif_nameKey: gbif_taxon_item.nameKey,
                                gbif_classKey: gbif_taxon_item.classKey,
                                gbif_taxonID: gbif_taxon_item.taxonID,
                                gbif_sourceTaxonKey: gbif_taxon_item.sourceTaxonKey,
                                gbif_kingdom: gbif_taxon_item.kingdom,
                                gbif_phylum: gbif_taxon_item.phylum,
                                gbif_family: gbif_taxon_item.family,
                                gbif_kingdomKey: gbif_taxon_item.kingdomKey,
                                gbif_phylumKey: gbif_taxon_item.phylumKey,
                                gbif_familyKey: gbif_taxon_item.familyKey,
                                gbif_datasetKey: gbif_taxon_item.datasetKey,
                                gbif_constituentKey: gbif_taxon_item.constituentKey,
                                gbif_parentKey: gbif_taxon_item.parentKey,
                                gbif_parent: gbif_taxon_item.parent,
                                gbif_scientificName: gbif_taxon_item.scientificName,
                                gbif_canonicalName: gbif_taxon_item.canonicalName,
                                gbif_authorship: gbif_taxon_item.authorship,
                                gbif_nameType: gbif_taxon_item.nameType,
                                gbif_rank: gbif_taxon_item.rank,
                                gbif_origin: gbif_taxon_item.origin,
                                gbif_taxonomicStatus: gbif_taxon_item.taxonomicStatus,
                                gbif_nomenclaturalStatus: JSON.stringify(gbif_taxon_item.nomenclaturalStatus),
                                gbif_remarks: gbif_taxon_item.remarks,
                                gbif_numDescendants: gbif_taxon_item.numDescendants,
                                gbif_lastCrawled: moment(gbif_taxon_item.lastCrawled).format('YYYY-MM-DD HH:mm:ss'),
                                // gbif_lastCrawled:funcs.getDateTimeMySQL(gbif_taxon_item.lastCrawled),
                                gbif_lastInterpreted: moment(gbif_taxon_item.lastInterpreted).format('YYYY-MM-DD HH:mm:ss'),
                                // gbif_lastInterpreted:funcs.getDateTimeMySQL(gbif_taxon_item.lastInterpreted),
                                gbif_issues: JSON.stringify(gbif_taxon_item.issues),
                                gbif_synonym: gbif_taxon_item.synonym,
                                rollback_key: rollback_key,
                                doNotClearCache: true
                            };
                            console.log('Добавим', gbif_taxon_item.scientificName);
                            _t.add(params, function (err, res) {
                                if (err) return cb(new MyError('Не удалось добавить таксон импортированный из GBIF', {
                                    params: params,
                                    err: err
                                }));
                                params.id = res.id;
                                taxons.push(params);
                                taxons_obj_ById[params.id] = params;
                                taxons_obj_ByKey[params.gbif_key] = params;
                                taxons_obj_ByName[params.name] = params;
                                taxons_obj_ByParentName[params.parent_name] = params;

                                global.taxons_obj_ByKey[params.gbif_key] = params;

                                global.taxons.push(params);
                                if (gbif_keys[params.gbif_key] === -1) gbif_keys.push(params.gbif_key);

                                cb(null);
                            });
                        }, function (err) {
                            cb(err);
                        });

                    }, function (err) {
                        console.log('ИТОГО', counter, gbif_taxons.length);
                        cb(err);
                    });


                    // async.eachSeries(gbif_taxons, function(gbif_taxon_item, cb){
                    //     if (!gbif_taxon_item.to_add) return cb(null);
                    //
                    //     if (taxons_obj_ByKey[gbif_taxon_item.key]) return cb(null);
                    //     var params = {
                    //         name:gbif_taxon_item.canonicalName,
                    //         parent_id:gbif_taxon_item.parent_id,
                    //         is_gbif:true,
                    //         is_gbif_datatime:dt,
                    //         is_gbif_datatime_updated:dt,
                    //         gbif_key:gbif_taxon_item.key,
                    //         gbif_nubKey:gbif_taxon_item.nubKey,
                    //         gbif_nameKey:gbif_taxon_item.nameKey,
                    //         gbif_classKey:gbif_taxon_item.classKey,
                    //         gbif_taxonID:gbif_taxon_item.taxonID,
                    //         gbif_sourceTaxonKey:gbif_taxon_item.sourceTaxonKey,
                    //         gbif_kingdom:gbif_taxon_item.kingdom,
                    //         gbif_phylum:gbif_taxon_item.phylum,
                    //         gbif_family:gbif_taxon_item.family,
                    //         gbif_kingdomKey:gbif_taxon_item.kingdomKey,
                    //         gbif_phylumKey:gbif_taxon_item.phylumKey,
                    //         gbif_familyKey:gbif_taxon_item.familyKey,
                    //         gbif_datasetKey:gbif_taxon_item.datasetKey,
                    //         gbif_constituentKey:gbif_taxon_item.constituentKey,
                    //         gbif_parentKey:gbif_taxon_item.parentKey,
                    //         gbif_parent:gbif_taxon_item.parent,
                    //         gbif_scientificName:gbif_taxon_item.scientificName,
                    //         gbif_canonicalName:gbif_taxon_item.canonicalName,
                    //         gbif_authorship:gbif_taxon_item.authorship,
                    //         gbif_nameType:gbif_taxon_item.nameType,
                    //         gbif_rank:gbif_taxon_item.rank,
                    //         gbif_origin:gbif_taxon_item.origin,
                    //         gbif_taxonomicStatus:gbif_taxon_item.taxonomicStatus,
                    //         gbif_nomenclaturalStatus:JSON.stringify(gbif_taxon_item.nomenclaturalStatus),
                    //         gbif_remarks:gbif_taxon_item.remarks,
                    //         gbif_numDescendants:gbif_taxon_item.numDescendants,
                    //         gbif_lastCrawled:moment(gbif_taxon_item.lastCrawled).format('YYYY-MM-DD HH:mm:ss'),
                    //         // gbif_lastCrawled:funcs.getDateTimeMySQL(gbif_taxon_item.lastCrawled),
                    //         gbif_lastInterpreted:moment(gbif_taxon_item.lastInterpreted).format('YYYY-MM-DD HH:mm:ss'),
                    //         // gbif_lastInterpreted:funcs.getDateTimeMySQL(gbif_taxon_item.lastInterpreted),
                    //         gbif_issues:JSON.stringify(gbif_taxon_item.issues),
                    //         gbif_synonym:gbif_taxon_item.synonym,
                    //         rollback_key:rollback_key,
                    //         doNotClearCache:true
                    //     };
                    //     console.log('Добавим', gbif_taxon_item.scientificName);
                    //     _t.add(params, function (err, res) {
                    //         if (err) return cb(new MyError('Не удалось добавить таксон импортированный из GBIF',{params : params, err : err}));
                    //         params.id = res.id;
                    //         taxons.push(params);
                    //         taxons_obj_ById[params.id] = params;
                    //         taxons_obj_ByKey[params.gbif_key] = params;
                    //         taxons_obj_ByName[params.name] = params;
                    //         taxons_obj_ByParentName[params.parent_name] = params;
                    //
                    //         global.taxons_obj_ByKey[params.gbif_key] = params;
                    //
                    //         global.taxons.push(params);
                    //         if (gbif_keys[params.gbif_key] === -1) gbif_keys.push(params.gbif_key);
                    //
                    //         cb(null);
                    //     });
                    // }, cb);
                },
                modify:function(cb){
                    async.eachSeries(gbif_taxons, function(gbif_taxon_item, cb){
                        if (!gbif_taxon_item.to_modify) return cb(null);
                        // Обновим
                        var params = {
                            id:gbif_taxon_item.id,
                            is_gbif_datatime_updated:dt,
                            rollback_key:rollback_key,
                            doNotClearCache:true
                        };
                        for (var i in gbif_taxon_item.to_modify) {
                            params['gbif_' + gbif_taxon_item.to_modify[i]] = gbif_taxon_item[gbif_taxon_item.to_modify[i]];
                        }


                        console.log('Изменим', gbif_taxon_item.scientificName, params);
                        _t.modify(params, function (err, res) {
                            if (err) {
                                if (err.message == 'notModified') return cb(null);
                                return cb(new MyError('Не удалось обновить таксон импортированный из GBIF',{params : params, err : err}));
                            }
                            cb(null);
                        });
                    }, cb);
                },
                set_removed_from_gbif:function(cb){
                    return cb(null); // Пока не делаем этого
                    async.eachSeries(taxons_obj_ById, function(one_taxon, cb){
                        if (one_taxon.finded_in_gbif) return cb(null);
                        if (!one_taxon.is_gbif) return cb(null); // Не был импортирован из gbif
                        var params = {
                            id:one_taxon.id,
                            is_gbif_datatime_updated:dt,
                            removed_from_gbif:true,
                            rollback_key:rollback_key
                        };
                        console.log('Отметим как removed_from_gbif', params);
                        _t.modify(params, function (err, res) {
                            if (err) return cb(new MyError('Не удалось установить removed_from_gbif таксону',{params : params, err : err}));
                            cb(null);
                        });
                    }, cb);
                }
            }, cb);
        },
        getChilds:function(cb){
            // return cb(null);
            async.eachSeries(gbif_taxons, function(item, cb){
                var params = {
                    gbif_parentKey:item.key
                };
                _t.importFromGBIF(params, cb);
                // getPortion(params ,function(err, res){
                //     if (err) return cb(err);
                //     console.log('Все данные получены2.', 'Время:', moment().diff(t1));
                //     cb(null);
                // })
            }, cb);
        },
        runIfLimit:function(cb){
            if (!limitPortion) return cb(null);
            var gbif_keys_tmp = [];
            for (var i in gbif_taxons) {
                gbif_keys_tmp.push(gbif_taxons[i].key);
            }
            var params = {
                gbif_keys:gbif_keys_tmp,
                gbif_offset:gbif_offset + gbif_keys_tmp.length,
                gbif_parentKey:obj.gbif_parentKey
            };
            _t.importFromGBIF(params, cb);
        },
        runSecondary:function(cb){
            return cb(null);
            // Вызовем функцию повторно, чтобы проставить все изменения для вновь добавленных и ссылающихся на них.
            if (obj.is_secondary) return cb(null);
            console.log('Вызовем повторно');
            obj.is_secondary = true;
            _t.importFromGBIF(obj, cb);
        }
    },function (err, res) {

        if (err === 'return') return cb(null);
        if (err) {
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            // Обновим is_gbif_child_imported



            var this_taxon;
            async.series({
                get:function(cb){
                    this_taxon = taxons_obj_ByKey[obj.gbif_parentKey];
                    cb(null);
                },
                modify:function(cb){
                    if (!this_taxon /*&& !endOfRecords*/) return cb(null);
                    var params = {
                        id: this_taxon.id,
                        is_gbif_child_imported:true,
                        rollback_key: rollback_key,
                        doNotClearCache:true
                    };
                    _t.modify(params, function (err, res) {
                        if (err) {
                            if (err.message == 'notModified') return cb(null);
                            return cb(new MyError('Не удалось изменить установить is_gbif_child_imported',{params : params, err : err, this_taxon:this_taxon}));
                        }
                        cb(null);
                    });
                }
            }, function(err){
                if (err) {
                    if (err.message == 'notModified') return cb(null);
                    return cb(err);
                }
                if (!doNotSaveRollback){
                    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'importFromGBIF', params:obj});
                }
                cb(null, new UserOk('Ок',{gbif_counter:global.gbif_counter}));
            });

        }
    });
};


// var o = {
//     command:'importFromGBIFThisAndParents',
//     object:'Taxon',
//     params:{
//         id:20112
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// });
Model.prototype.importFromGBIFThisAndParents = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    // Ищем в taxon_gbif по имени и ранку
    // Обновляем текущий таксон
    // Загружаем родительские (importToMainTable из Taxon_gbif)

    var taxon, taxon_gbif, parent;
    var parent_gbif;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon.',{id:id,err:err}));
                taxon = res[0];
                cb(null);
            });
        },
        getFromTaxon_gbif:function(cb){
            async.series({
                if_taxon_gbif_id:function(cb){
                    if (!+taxon.taxon_gbif_id) return cb(null);
                    var o = {
                        command:'getById',
                        object:'taxon_gbif',
                        params:{
                            id:taxon.taxon_gbif_id,
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить taxon_gbif по ID',{o : o, err : err}));
                        taxon_gbif = res[0];
                        cb(null);
                    });
                },
                ifNot_taxon_gbif_id:function(cb){
                    if (+taxon.taxon_gbif_id) return cb(null);
                    var o = {
                        command:'get',
                        object:'taxon_gbif',
                        params:{
                            param_where:{
                                gbif_canonicalName:taxon.name,
                                gbif_taxonRank:taxon.level_name
                            },
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить taxon_gbif',{o : o, err : err}));
                        if (!res.length) {
                            return cb(new UserError('Taxon with the same name in imported gbif table (with the same rank) not found',{o:o, taxon:taxon}));
                        }
                        taxon_gbif = res[0];
                        cb(null);
                    });
                }
            }, cb);

        },
        getParent:function(cb){
            if (!taxon_gbif.gbif_parentNameUsageID) return cb(null);
            var params = {
                param_where:{
                    gbif_taxonID:taxon_gbif.gbif_parentNameUsageID
                },
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить parent',{params : params, err : err}));
                if (!res.length) return cb(null);
                parent = res[0];
                cb(null);
            });

        },
        sync:function(cb){
            var dt = funcs.getDateTimeMySQL();
            var modifyFields = ['gbif_taxonID','gbif_parentNameUsageID','gbif_scientificName','gbif_scientificNameAuthorship','gbif_canonicalName','gbif_genericName','gbif_specificEpithet',
                'gbif_infraspecificEpithet','gbif_taxonRank','gbif_nameAccordingTo','gbif_namePublishedIn','gbif_taxonomicStatus','gbif_nomenclaturalStatus','gbif_taxonRemarks',
                'gbif_kingdom','gbif_phylum','gbif_class','gbif_order','gbif_family','gbif_genus'];
            var params = {
                id:taxon.id,
                taxon_gbif_id:taxon_gbif.id,
                is_gbif: true,
                is_gbif_datatime: dt,
                is_gbif_datatime_updated: dt,
                rollback_key:rollback_key
            };
            if (parent){
                params.parent_id = parent.id;
            }
            var to_modify_counter = 0;
            for (var i in taxon_gbif) {
                if (modifyFields.indexOf(i) === -1) continue;
                if (taxon[i] === taxon_gbif[i]) continue;
                to_modify_counter++;
                params[i] = taxon_gbif[i];
                taxon[i] = taxon_gbif[i];
            }
            if (!to_modify_counter) return cb(null);
            _t.modify(params, function (err, res) {
                console.log('MODIFY', params);
                if (err) return cb(new MyError('Не удалось изменить taxon',{params : params, err : err}));
                cb(null);
            });
        },
        importParents:function(cb){
            async.series({
                ifParent:function(cb){
                    if (!parent) return cb(null);
                    // Вызовем ту же функцию только для парента
                    var params = {
                        id:parent.id,
                        rollback_key:rollback_key,
                        doNotSaveRollback:true
                    };
                    _t.importFromGBIFThisAndParents(params, cb);
                },
                ifNotParent:function(cb){
                    if (parent) return cb(null);
                    // Вызовем importToMainTable из Taxon_gbif

                    var imported_id;
                    async.series({
                        getParentFromGBIF:function(cb){
                            if (!taxon_gbif.gbif_parentNameUsageID) return cb(null)
                            var o = {
                                command:'get',
                                object:'taxon_gbif',
                                params:{
                                    param_where:{
                                        gbif_taxonID:taxon_gbif.gbif_parentNameUsageID
                                    },
                                    collapseData:false
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) {
                                    return cb(new MyError('Не удалось получить parent_gbif',{o : o, err : err}));
                                }
                                if (!res.length) return cb(null);
                                parent_gbif = res[0];
                                cb(null);
                            });
                        },
                        import:function(cb){
                            if (!parent_gbif) return cb(null);
                            var o = {
                                command:'importToMainTable',
                                object:'taxon_gbif',
                                params:{
                                    id:parent_gbif.id,
                                    rollback_key:rollback_key,
                                    doNotSaveRollback:true
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось importToMainTable',{o : o, err : err}));
                                imported_id = res.imported_id;
                                cb(null);
                            });
                        },
                        updateParentId:function(cb){
                            if (!imported_id) return cb(null);
                            var params = {
                                id:taxon.id,
                                parent_id:imported_id,
                                rollback_key:rollback_key
                            };
                            _t.modify(params, function (err, res) {
                                if (err) {
                                    return cb(new MyError('Не удалось установить parent_id',{
                                        params: params,
                                        taxon: taxon,
                                        taxon_gbif: taxon_gbif,
                                        parent_gbif: parent_gbif,
                                        err: err
                                    }));
                                }
                                cb(null);
                            });
                        },
                        RunForNew:function(cb){
                            if (!imported_id) return cb(null);
                            // Вызовем ту же функцию только для парента
                            var params = {
                                id:imported_id,
                                rollback_key:rollback_key,
                                doNotSaveRollback:true
                            };
                            _t.importFromGBIFThisAndParents(params, cb);
                        }
                    }, cb);
                }
            }, cb);
        }
    },function (err, res) {
        if (err) {
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!doNotSaveRollback){
               rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'importFromGBIFThisAndParents', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });
};

Model.prototype.importFromGBIFThisAndParentsByFilter = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }

    let _t = this

    let rollback_key = obj.rollback_key || rollback.create()
    let doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key

    const filterWhere = obj.filterWhere
    if (!filterWhere) return cb(new MyError('filterWhere not passed'))
    if (!filterWhere.length) return cb(new UserError('No one filter applied'))

    const infoOptions = obj.infoOptions || {}

    let taxons_ids
    const errors = []

    async.series({
        get: function (cb) {
            let params = {
                where: filterWhere,
                collapseData: false,
                limit: 1000000000
            }

            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Error while getting by filters.', {params, err: err}))
                taxons_ids = res.map(one => one.id)
                cb(null)
            })
        },
        doImport: cb => {
            let cnt = 0
            const cnt_all = taxons_ids.length

            async.eachSeries(taxons_ids, (one_id, cb) => {
                cnt++

                const rollback_key = rollback.create()

                let params = {
                    id: one_id,
                    doNotClearCache: true,
                    rollback_key
                }

                _t.importFromGBIFThisAndParents(params, (err, res) => {
                    if (err) {
                        errors.push(new MyError('Не удалось importFromGBIFThisAndParents ', {params: params, err: err}))

                        if (infoOptions.selector) {
                            _t.user.socket.emit('percent', {
                                selector: infoOptions.selector,
                                html: `Error while importing an element...`,
                                console: errors[errors.length - 1]
                            })
                        }

                        rollback.rollback({obj: params, rollback_key: rollback_key, user: _t.user}, function (err2) {
                            return cb(null)
                        })

                        return
                    }

                    if (infoOptions.selector) {
                        _t.user.socket.emit('percent', {
                            selector: infoOptions.selector,
                            html: `Sync by filters: ${cnt} of ${cnt_all}`
                        })
                    }

                    cb(null)
                })
            }, cb)
        }
    }, function (err) {
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
//     command:'importFromGBIFThisAndParentsALL',
//     object:'Taxon'
// };
// socketQuery(o, function(r){
//     console.log(r);
// });
Model.prototype.importFromGBIFThisAndParentsALL = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var taxons;
    async.series({
        getAll:function(cb){
            var params = {
                param_where:{
                    level_name:'species'
                },
                limit:10000000,
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить таксоны',{params : params, err : err}));
                taxons = res;
                cb(null);
            });
        },
        run:function(cb){
            if (!taxons) return cb(null);
            async.eachSeries(taxons, function(item, cb){
                var params = {
                    id:item.id,
                    rollback_key:rollback_key,
                    doNotSaveRollback:true
                };
                _t.importFromGBIFThisAndParents(params, function(err){
                    // return cb(err);
                    if (err){
                        if (err instanceof UserError){
                            console.log('Error','Import failed', params, err);
                            return cb(null);
                        }
                        return cb(err);
                    }
                    cb(null);
                })
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

Model.prototype.search_articles = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var ggl = 'https://scholar.google.ru/scholar?hl=en&as_sdt=0%2C5&q=';
    var ggl2 = '&btnG=';

    if(obj.page > 0){
        ggl2 += '&start='+obj.page;
    }

    var sk = obj.search_keyword;
    var str = ggl + sk + ggl2;

    var google_res;
    var google_body;
    var google_results;

    async.series({

        getData: function(cb){

            request({
                url: str,
                json: true
            }, function(error, res, body) {

                if (!error && res.statusCode == 200) {

                    google_res = res;
                    google_body = body;

                    cb(null);

                } else {

                    console.log(error);

                    cb(new MyError('Error while getting data from google, search string = ' + str, error));
                }


            });

        },
        parseData: function(cb){

            var $ = cheerio.load(google_body);

            google_results = $('#gs_res_ccl_mid').html();

            cb(null);

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

            console.log('HEREEEE', str, google_results, google_body);

            cb(null, new UserOk('Ок', {body: google_body}));
        }
    });
};

// var o = {
//     command:'updateParent',
//     object:'Taxon',
//     params:{
//         id:405510
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// });
/**
 * Ищет родителя по части имени среди genus, если не находит, то ищет в GBIG. Проставляет родителя.
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.updateParent = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var cbTop = cb;
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var taxon, parent_taxon, gbif_taxon;
    var taxon_name;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon.',{id:id,err:err}));
                taxon = res[0];
                if (taxon.level_name !== 'species') return cb(new UserError('This taxon is not SPECIES',{taxon:taxon}));
                if (taxon.parent_id) return cb(0); // Уже установлен
                if (!taxon.name) return cb(new UserError('Name is not defined',{taxon:taxon}));
                var taxon_name_arr = taxon.name.match(/^\S+\s/,'');
                if (!taxon_name_arr) return cb(new UserError('The name must consist of at least two words',{}));
                taxon_name = taxon_name_arr[0];
                cb(null);
            });
        },
        searchInTaxons:function(cb){



            var params = {
                where:[
                    {
                        key:'name',
                        val1:taxon_name
                    },
                    {
                        key:'level_name',
                        val1:'genus'
                    },
                    {
                        key:'status_sysname',
                        type:'in',
                        val1:['ACCEPTED','DOUBTFUL']
                    }
                ],
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить таксон по имени',{params : params, err : err}));
                if (!res.length) return cb(null);
                if (res.length > 1) return cb(new UserError('Too many taxa with name ' + taxon_name + ', ACCEPTED/DOUBTFUL and with rank GENUS'));

                parent_taxon = res[0];
                cb(null);
            });
        },
        searchParentInGbiftableAndImport:function(cb){
            if (parent_taxon) return cb(null);
            var o = {
                command:'get',
                object:'taxon_gbif',
                params:{
                    where:[
                        {
                            key:'gbif_canonicalName',
                            val1:taxon_name
                        },
                        {
                            key:'gbif_taxonRank',
                            val1:'genus'
                        },
                        {
                            key:'gbif_taxonomicStatus',
                            type:'in',
                            val1:['accepted','doubtful']
                        }
                    ],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить таксон по имени',{o : o, err : err}));
                if (!res.length) return cb(null);
                if (res.length > 1) return cb(new UserError('Too many taxa in GBIF table with name ' + taxon_name + ', accepted/doubtful and with gbif_taxonRank genus'));
                var o = {
                    command:'importToMainTable',
                    object:'taxon_gbif',
                    params:{
                        id:res[0].id,
                        doNotSaveRollback:true,
                        rollback_key:rollback_key
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось importToMainTable',{o : o, err : err}));
                    _t.updateParent(obj, cbTop);
                });

            });

        },
        updateTaxon:function(cb){
            if (!parent_taxon) return cb(new UserError('Parent taxon not found',{taxon:taxon}));

            var fieldsToUpdate = ['gbif_kingdom','gbif_kingdomKey','gbif_phylum','gbif_phylumKey','gbif_class','gbif_classKey',
                'gbif_order','gbif_family','gbif_familyKey','gbif_genus'];
            var update;

            var params = {
                id:taxon.id,
                rollback_key:rollback_key
            };

            if (taxon.parent_id !== parent_taxon.id){
                params.parent_id = parent_taxon.id;
                update = true;
            }

            for (var i in fieldsToUpdate) {
                if (taxon[fieldsToUpdate[i]] !== parent_taxon[fieldsToUpdate[i]] && parent_taxon[fieldsToUpdate[i]]){
                    params[fieldsToUpdate[i]] = parent_taxon[fieldsToUpdate[i]];
                    update = true;
                }
            }
            if (!update) return cb(null); // Ничего обновлять не надо
            _t.modify(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось обновить таксон',{params : params, err : err}));

                cb(null);
            });
        }
    },function (err, res) {
        console.log('parent_taxon',parent_taxon);
        if (err === 0) return cb(null, new UserOk('Ok'));
        if (err) {
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!doNotSaveRollback){
               rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'updateParent', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });
};


// var o = {
//     command:'updateAllParent',
//     object:'Taxon',
//     params:{
//
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// })

Model.prototype.updateAllParent = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    var taxons;
    var errors = [];
    var success = 0;
    async.series({
        getAll:function(cb){
            var params = {
                where:[
                    {
                        key:'level_name',
                        val1:'species'
                    },
                    {
                        key:'parent_id',
                        type:'isNull'
                    }
                ],
                columns:['id','level_name','parent_id'],
                limit:obj.limit || 1000000000000,
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить таксоны',{params : params, err : err}));
                if (!res.length) return cb(null);
                taxons = res;
                cb(null);
            });
        },
        update:function(cb){
            if (!taxons) return cb(null);
            async.eachSeries(taxons, function(taxon, cb){
                var params = {
                    id:taxon.id
                };
                _t.updateParent(params, function(err, res){
                    if (err){
                        console.log('Во время updateParent произошла ош.',err);
                        errors.push(err);
                        return cb(null);
                    }
                    success++;
                    cb(null);
                })
            }, cb);
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('Ок',{success:success, errors:errors}));
    });
};

// var o = {
//     command:'updateByParent',
//     object:'Taxon',
//     params:{
//         id:1
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// })

/**
 * Проставляет kingdom/Phylum/Class/... беря его из родителя
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.updateByParent = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var cbTop = cb;
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var taxon, parent_taxon, gbif_taxon;
    var taxon_name;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon.',{id:id,err:err}));
                taxon = res[0];
                if (!taxon.parent_id) return cb(new UserError('Parent is not defined',{taxon:taxon}));
                cb(null);
            });
        },
        getParent:function(cb){
            _t.getById({id:taxon.parent_id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить parent taxon.',{id:id,err:err}));
                parent_taxon = res[0];
                cb(null);
            });
        },
        updateTaxon:function(cb){
            if (!parent_taxon) return cb(new UserError('Parent taxon not found',{taxon:taxon}));

            var fieldsToUpdate = ['gbif_kingdom','gbif_kingdomKey','gbif_phylum','gbif_phylumKey','gbif_class','gbif_classKey',
                'gbif_order','gbif_family','gbif_familyKey','gbif_genus'];
            var update;

            var params = {
                id:taxon.id,
                rollback_key:rollback_key
            };
            if (taxon.level_name){
                if (taxon.level_name === 'kingdom') {
                    parent_taxon.gbif_kingdom = taxon.name;
                }
                if (taxon.level_name === 'phylum') {
                    parent_taxon.gbif_phylum = taxon.name;
                }
                if (taxon.level_name === 'class') {
                    parent_taxon.gbif_class = taxon.name;
                }
                if (taxon.level_name === 'order') {
                    parent_taxon.gbif_order = taxon.name;
                }
                if (taxon.level_name === 'family') {
                    parent_taxon.gbif_family = taxon.name;
                }
                if (taxon.level_name === 'genus') {
                    parent_taxon.gbif_genus = taxon.name;
                }
            }


            for (var i in fieldsToUpdate) {
                if (taxon[fieldsToUpdate[i]] !== parent_taxon[fieldsToUpdate[i]] && parent_taxon[fieldsToUpdate[i]]){
                    params[fieldsToUpdate[i]] = parent_taxon[fieldsToUpdate[i]];
                    update = true;
                }
            }
            if (!update) return cb(null); // Ничего обновлять не надо
            _t.modify(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось обновить таксон',{params : params, err : err}));

                cb(null);
            });
        }
    },function (err, res) {
        if (err === 0) return cb(null, new UserOk('Ok'));
        if (err) {
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            // if (!doNotSaveRollback){
            //     rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'updateByParent', params:obj});
            // }
            cb(null, new UserOk('Ок'));
        }
    });
};

// var o = {
//     command:'updateAllByParent',
//     object:'Taxon',
//     params:{
//
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// })

/**
 * Последовательно вызывает updateByParent всем таксонам у которых отсутствует Kingdom и есть parent_id. Начиная с верних ранков
 * @param obj
 * @param cb
 */
Model.prototype.updateAllByParent = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    var taxons;
    var errors = [];
    var success = 0;
    var ranks = ['phylum','class','order','family','genus','species'];
    async.series({
        updateAll:function(cb){
            async.eachSeries(ranks, function(rank, cb){
                async.series({
                    getAll:function(cb){
                        var params = {
                            where:[
                                {
                                    key:'level_name',
                                    val1:rank
                                },
                                {
                                    key:'parent_id',
                                    type:'!isNull'
                                },
                                {
                                    key:'gbif_kingdom',
                                    type:'isNull'
                                }
                            ],
                            columns:['id','level_name','parent_id'],
                            limit:obj.limit || 1000000000000,
                            collapseData:false
                        };
                        _t.get(params, function (err, res) {
                            if (err) return cb(new MyError('Не удалось получить таксоны',{params : params, err : err}));
                            if (!res.length) return cb(null);
                            taxons = res;
                            cb(null);
                        });
                    },
                    update:function(cb){
                        if (!taxons) return cb(null);
                        async.eachSeries(taxons, function(taxon, cb){
                            var params = {
                                id:taxon.id
                            };
                            _t.updateByParent(params, function(err, res){
                                if (err){
                                    console.log('Во время updateByParent произошла ош.',err);
                                    errors.push(err);
                                    return cb(null);
                                }
                                success++;
                                cb(null);
                            })
                        }, cb);
                    }
                }, cb);
            }, cb);
        }

    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('Ок',{success:success, errors:errors}));
    });
};

Model.prototype.updateByParentByFilter = function(obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }

    let _t = this

    let rollback_key = obj.rollback_key || rollback.create()
    let doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key

    const filterWhere = obj.filterWhere
    if (!filterWhere) return cb(new MyError('filterWhere not passed'))
    if (!filterWhere.length) return cb(new UserError('No one filter applied'))

    const infoOptions = obj.infoOptions || {}

    let taxons_ids
    const errors = []

    async.series({
        get: function (cb) {
            let params = {
                where: filterWhere,
                collapseData: false,
                limit: 1000000000
            }

            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Error while getting by filters.', {params, err: err}))
                taxons_ids = res.map(one => one.id)
                cb(null)
            })
        },
        doImport: cb => {
            let cnt = 0
            const cnt_all = taxons_ids.length

            async.eachSeries(taxons_ids, (one_id, cb) => {
                cnt++

                const rollback_key = rollback.create()

                let params = {
                    id: one_id,
                    doNotClearCache: true,
                    rollback_key
                }

                _t.updateByParent(params, (err, res) => {
                    if (err) {
                        errors.push(new MyError('Не удалось updateByParent ', {params: params, err: err}))

                        if (infoOptions.selector) {
                            _t.user.socket.emit('percent', {
                                selector: infoOptions.selector,
                                html: `Error while updating an element...`,
                                console: errors[errors.length - 1]
                            })
                        }

                        rollback.rollback({obj: params, rollback_key: rollback_key, user: _t.user}, function (err2) {
                            return cb(null)
                        })

                        return
                    }

                    if (infoOptions.selector) {
                        _t.user.socket.emit('percent', {
                            selector: infoOptions.selector,
                            html: `Update by filters: ${cnt} of ${cnt_all}`
                        })
                    }

                    cb(null)
                })
            }, cb)
        }
    }, function (err) {
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
//     command:'importFromExcel',
//     object:'Taxon',
//     params:{
//         filename:'./DB/excel/Spider_Species_totransfer.xlsx',
//         pic_dir:null,
//         do_not_set_diagnosis:false,
//         do_not_import_from_gbif:false,
//         do_not_sync_with_gbif:false,
//         author:'Eckhard Schulz'
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// });

// Импорт из excel / Import from excel
Model.prototype.importFromExcel = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;
    var filename = obj.filename; // || './DB/excel/Meso_Species_totransfer2.xlsx';
    var pic_dir = obj.pic_dir; // || './DB/excel/Pictures_Mesostigmata';

    if (!filename) return cb(new UserError('Filename not passed',{obj:obj}));
    // Считать файл
    // Создание объекта genus_obj
    // Запрос из taxon_gbif -> на импорт
    // Кого нет в gbif - создать в taxon
    // Дальше посмотрим

    var genus_obj = {};
    var family_obj = {};
    var species_obj = {};
    var parent_obj = {};

    var errors = [];
    async.series({
        read_excel:function(cb){
            // read from a file
            var workbook = new Excel.Workbook();
            var options = {
                map: function(value, index) {
                    switch(index) {
                        case 0:
                            // column 1 is string
                            return String(value);
                        default:
                            // the rest are numbers
                            return String(value);
                    }
                }
            };
            workbook.xlsx.readFile(filename, options)
                .then(function(err) {
                    // use workbook
                    var ws = workbook._worksheets[1];
                    for (var i in ws._rows) {
                        var row = ws._rows[i];
                        if (i === "0") continue;

                        // var num = funcs.guidShort();

                        if (!row._cells[1]){
                            console.log('Отсутствует наименование. строка', i, row);
                            errors.push({
                                msg:'Отсутствует наименование. строка ' + i,
                                row:i
                            });
                            continue;
                        }
                        if (!row._cells[1]._value.model.value){
                            console.log('Отсутствует наименование. строка', i, row);
                            errors.push({
                                msg:'Отсутствует наименование. строка ' + i,
                                row:i
                            });
                            continue;
                        }

                        // var num = '000' + row._cells[0]._value.model.value;
                        var row_ = {
                            num:(row._cells[1])? row._cells[0]._value.model.value : funcs.guidShort(),
                            name:row._cells[1]._value.model.value,
                            genus:(row._cells[2])? row._cells[2]._value.model.value : '',
                            family:(row._cells[3])? row._cells[3]._value.model.value : '',
                            approved_by_exp:(row._cells[4])?row._cells[4]._value.model.value : false,
                            diagnosis:(row._cells[5])? row._cells[5]._value.model.value : null
                        }

                        row_.num = (isNaN(+row_.num))? row_.num.trim() : (function(){
                            var n = '000' + row_.num;
                            n = n.substr(n.length - 3);
                            return n;
                        })();
                        row_.name = (typeof row_.name === 'string')? row_.name.trim() : row_.name;
                        row_.genus = (typeof row_.genus === 'string')? row_.genus.trim() : row_.genus;
                        row_.family = (typeof row_.family === 'string')? row_.family.trim() : row_.family;
                        row_.diagnosis = (typeof row_.diagnosis === 'string')? row_.diagnosis.trim() : row_.diagnosis;

                        var alias = row_.name + '_' + row_.genus + '_' + row_.family;

                        // num = num.substr(num.length - 3);
                        // var num = row._cells[0]._value.model.value;
                        // num = num.substr(num.length - 3);
                        species_obj[alias] = {
                            num:row_.num,
                            name:row_.name,
                            genus:row_.genus,
                            family:row_.family,
                            approved_by_exp:row_.approved_by_exp,
                            diagnosis:row_.diagnosis
                        };

                        if (!row_.genus) {
                            if (!family_obj[row_.family]){
                                family_obj[row_.family] = {
                                    name:row_.family
                                }
                            }
                        }else{
                            if (!genus_obj[row_.genus]){
                                genus_obj[row_.genus] = {
                                    name:row_.genus
                                }
                            }
                        }



                    }
                    cb(null);
                });

        },
        genus:function(cb){
            if (obj.do_not_import_from_gbif) return cb(null);
            async.series({
                getGenusesFromGbifTbl:function(cb){
                    if (!Object.keys(genus_obj).length) return cb(new MyError('Ни одного genus',{genus_obj:genus_obj}));
                    var o = {
                        command:'get',
                        object:'taxon_gbif',
                        params:{
                            where:[
                                {
                                    key:'gbif_canonicalName',
                                    type:'in',
                                    val1:Object.keys(genus_obj)
                                },
                                {
                                    key:'gbif_taxonRank',
                                    val1:'genus'
                                },
                                {
                                    key:'gbif_taxonomicStatus',
                                    val1:'accepted'
                                }
                            ],
                            limit:1000000,
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить taxon_gbif',{o : o, err : err}));
                        for (var i in res) {
                            if (genus_obj[res[i].gbif_canonicalName]) {
                                genus_obj[res[i].gbif_canonicalName].gbif_taxon_id = res[i].id;
                                genus_obj[res[i].gbif_canonicalName].action = 'to_import';
                            }
                        }
                        cb(null);
                    });

                },
                importGenusToMain:function(cb){
                    async.eachSeries(genus_obj, function(item, cb){
                        if (item.action !== 'to_import') return cb(null);
                        var o = {
                            command:'importToMainTable',
                            object:'taxon_gbif',
                            params:{
                                id:item.gbif_taxon_id,
                                import_childs:obj.import_childs,
                                import_childs_childs:obj.import_childs_childs
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) {
                                return cb(new MyError('Не удалось importToMainTable',{o : o, err : err, genus_obj:genus_obj}));
                            }
                            item.id = res.imported_id;
                            cb(null);
                        });
                    }, cb);
                }
            }, cb);
        },
        family:function(cb){
            if (obj.do_not_import_from_gbif) return cb(null);
            async.series({
                getFamiliesFromGbifTbl:function(cb){
                    if (!Object.keys(family_obj).length) return cb(null);
                    var o = {
                        command:'get',
                        object:'taxon_gbif',
                        params:{
                            where:[
                                {
                                    key:'gbif_canonicalName',
                                    type:'in',
                                    val1:Object.keys(family_obj)
                                },
                                {
                                    key:'gbif_taxonRank',
                                    val1:'family'
                                },
                                {
                                    key:'gbif_taxonomicStatus',
                                    val1:'accepted'
                                }
                            ],
                            limit:1000000,
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить taxon_gbif',{o : o, err : err}));
                        for (var i in res) {
                            if (family_obj[res[i].gbif_canonicalName]) {
                                family_obj[res[i].gbif_canonicalName].gbif_taxon_id = res[i].id;
                                family_obj[res[i].gbif_canonicalName].action = 'to_import';
                            }
                        }
                        cb(null);
                    });

                },
                importFamilyToMain:function(cb){
                    async.eachSeries(family_obj, function(item, cb){
                        if (item.action !== 'to_import') return cb(null);
                        var o = {
                            command:'importToMainTable',
                            object:'taxon_gbif',
                            params:{
                                id:item.gbif_taxon_id,
                                import_childs:obj.import_childs,
                                import_childs_childs:obj.import_childs_childs
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось importToMainTable',{o : o, err : err}));
                            item.id = res.imported_id;
                            cb(null);
                        });
                    }, cb);
                }
            }, cb);
        },
        getSpeciesFromTaxonTbl:function(cb){

            var names = [];
            for (var i in species_obj) {
                names.push(species_obj[i].name);
            }
            var params = {
                where:[
                    {
                        key:'name',
                        type:'in',
                        val1:names
                    },
                    {
                        key:'level_name',
                        val1:'species'
                    }
                ],
                limit:10000000,
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon',{params : params, err : err}));
                for (var i in res) {
                    var alias = res[i].name + '_' + (res[i].gbif_genus || '') + '_' + (res[i].gbif_family || '');
                    if (species_obj[alias]) {
                        species_obj[alias].id = res[i].id;
                    }
                }
                cb(null);
            });
        },
        mergeParentAndUpdate:function(cb){
            async.eachSeries(species_obj, function(item, cb){
                if (!item.id) return cb(null);
                // getParent
                async.series({
                    getParent:function(cb){
                        var params = {
                            where:[
                                {
                                    key:'name',
                                    val1:item.genus || item.family
                                },
                                {
                                    key:'level_name',
                                    group:'level_name',
                                    comparisonType:'OR',
                                    val1:(item.genus)? 'genus' : 'family'
                                },
                                {
                                    key:'level_name',
                                    group:'level_name',
                                    comparisonType:'OR',
                                    val1:(item.genus)? 'genus' : 'order'
                                },
                                {
                                    key:'status_sysname',
                                    type:'in',
                                    val1:['ACCEPTED','ACCEPTED_BY_ECOTAX','ADDED_BY_ECOTAX','DOUBTFUL']
                                }
                            ],
                            collapseData:false
                        };
                        // TODO ускорить. ограничить число запрашиваемых колонок, оставить только нужные.
                        _t.get(params, function (err, res) {
                            if (err) return cb(new MyError('Не удалось получить парент таксон',{params : params, err : err}));
                            if (!res.length) {
                                item.error = {
                                    msg:'Не удалось найти парент таксон',
                                    params:params,
                                    res:res
                                };
                                return cb(null);
                            }
                            if (res.length > 1) {
                                item.error = {
                                    msg:'Найдено слишком много парентов',
                                    params:params,
                                    res:res
                                };
                                return cb(null);
                            }
                            parent_obj[res[0].id] = res[0];
                            if (item.parent_id !== res[0].id){
                                item.parent_id = res[0].id;
                                item.parent = res[0];
                                item.to_update = true;
                            }

                            cb(null);
                        });
                    },
                    update:function(cb){
                        if (!item.id) return cb(null);
                        if (!item.parent_id) return cb(null);
                        if (!item.to_update) return cb(null);
                        var params = {
                            id:item.id,
                            parent_id:item.parent_id,
                            gbif_kingdom:item.parent.gbif_kingdom,
                            gbif_phylum:item.parent.gbif_phylum,
                            gbif_class:item.parent.gbif_class,
                            gbif_order:item.parent.gbif_order,
                            gbif_family:item.family,
                            gbif_genus:item.genus,
                            approved_by_expert:!!item.approved_by_exp,
                            level_name:'species',
                            rollback_key:rollback_key
                        };
                        _t.modify(params, function (err, res) {
                            if (err) return cb(new MyError('Не удалось изменить таксон',{params : params, err : err}));
                            cb(null);
                        });
                    }
                }, cb);
            }, cb);
        },
        addNew:function(cb){
            async.eachSeries(species_obj, function(item, cb){
                if (item.id) return cb(null);
                // getParent
                async.series({
                    getParent:function(cb){
                        var params = {
                            where:[
                                {
                                    key:'name',
                                    val1:item.genus || item.family
                                },
                                {
                                    key:'level_name',
                                    group:'level_name',
                                    comparisonType:'OR',
                                    val1:(item.genus)? 'genus' : 'family'
                                },
                                {
                                    key:'level_name',
                                    group:'level_name',
                                    comparisonType:'OR',
                                    val1:(item.genus)? 'genus' : 'order'
                                },
                                {
                                    key:'status_sysname',
                                    type:'in',
                                    val1:['ACCEPTED','ACCEPTED_BY_ECOTAX','ADDED_BY_ECOTAX','DOUBTFUL']
                                }
                            ],
                            collapseData:false
                        };
                        _t.get(params, function (err, res) {
                            if (err) return cb(new MyError('Не удалось получить парент таксон',{params : params, err : err}));
                            if (!res.length) {
                                item.error = {
                                    msg:'Не удалось найти парент таксон',
                                    params:params,
                                    res:res
                                };
                                return cb(null);
                            }
                            if (res.length > 1) {
                                item.error = {
                                    msg:'Найдено слишком много парентов',
                                    params:params,
                                    res:res
                                };
                                return cb(null);
                            }
                            item.parent_id = res[0].id;
                            item.parent = res[0];
                            parent_obj[res[0].id] = res[0];
                            cb(null);
                        });
                    },
                    add:function(cb){
                        if (!item.parent_id) return cb(null);
                        var params = {
                            name:item.name,
                            parent_id:item.parent_id,
                            gbif_kingdom:item.parent.gbif_kingdom,
                            gbif_phylum:item.parent.gbif_phylum,
                            gbif_class:item.parent.gbif_class,
                            gbif_order:item.parent.gbif_order,
                            gbif_family:item.family,
                            gbif_genus:item.genus,
                            status_sysname:'ADDED_BY_ECOTAX',
                            approved_by_expert:!!item.approved_by_exp,
                            level_name:'species',
                            rollback_key:rollback_key
                        };
                        _t.add(params, function (err, res) {
                            if (err) return cb(new MyError('Не удалось добавить таксон',{params : params, err : err}));
                            item.id = res.id;
                            if (obj.do_not_sync_with_gbif){
                                return cb(null);
                            }
                            var params = {
                                id:item.id
                            };
                            _t.importFromGBIFThisAndParents(params,function(err, res){
                                if (err){
                                    item.error = {
                                        msg2:'Не удалось синхронизировать с gbjf после добавления',
                                        params2:params,
                                        err:err
                                    };
                                }
                                return cb(null);
                            })

                        });
                    }
                }, cb);
            }, cb);
        },
        updateParent:function(cb){
            async.eachSeries(parent_obj, function(item, cb){
                var params = {
                    id:item.id
                };
                _t.importFromGBIFThisAndParents(params, function(err, res){
                    if (err) {
                        console.log('Ошибка во время импорта из GBIF, вероятно его просто нет в GBIF',{params:params, err:err});
                        return cb(null);
                    }
                    cb(null);
                });
            }, cb);

        },
        addDiagnosis:function(cb){
            if (obj.do_not_set_diagnosis) return cb(null);
            var trait;
            async.series({
                getTraitId:function(cb){
                    var o = {
                        command:'get',
                        object:'taxon_avalible_trait',
                        params:{
                            param_where:{
                                name:'Taxonomic diagnosis'
                            },
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось Taxonomic diagnosis id',{o : o, err : err}));
                        if (!res.length) return cb(new MyError('Не найден такой трейт',{o:o, res:res}));
                        if (res.length > 1) return cb(new MyError('Слишком много таких трейтов',{o:o, res:res}));
                        trait = res[0];
                        cb(null);
                    });
                },
                setValue:function(cb){
                    async.eachSeries(species_obj, function(item, cb){
                        if (!item.id) return cb(null);
                        if (!item.diagnosis) return cb(null);

                        var o = {
                            command:'setValueByList',
                            object:'taxon_avalible_trait',
                            params: {
                                list: [
                                    {
                                        id: trait.id,
                                        taxon_id:item.id,
                                        value1:item.diagnosis,
                                        value2:''
                                    }
                                ]
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось установить Taxonomic diagnosis',{o : o, err : err}));

                            cb(null);
                        });

                    }, cb);
                }
            }, cb);
        },
        addPictures:function(cb){
            var pictures_obj = {};
            var species_obj_by_id = {};

            var getDescription = function(s){
                if (typeof s !=='string') return '';
                var ss = s.replace(/\W/ig,'');
                var o = {
                    'am':'Adult male',
                    'af':'Adult female',
                    'amaf':'Adult male and female',
                    'dn':'Juvenile, deutonymph',
                    'pn':'Juvenile, protonymph',
                    'l':'Juvenile, larva'
                }
                return o[ss] || '';
            }
            var getView = function(s){
                if (typeof s !=='string') return '';
                var ss = s.replace(/\W/ig,'');
                var o = {
                    'dorsal':'dorsal view',
                    'ventral':'ventral view'
                }
                return o[ss] || 'character photo';
            }
            var getViewSysname = function(s){
                if (typeof s !=='string') return '';
                var ss = s.replace(/\W/ig,'');
                var o = {
                    'dorsal':'DORSAL',
                    'ventral':'VENTRAL'
                }
                return o[ss] || 'CHARACTER';
            }

            async.series({
                getFilelist:function(cb){
                    if (!pic_dir){
                        console.log('Директория изображений не передана. Загружена не будет. Пример: pic_dir:"./DB/excel/Pictures_Mesostigmata"');
                        errors.push({
                            msg:'Директория изображений не передана. Загружена не будет. Пример: pic_dir:"./DB/excel/Pictures_Mesostigmata"',
                            obj:obj
                        });
                        return cb(null);
                    }
                    var dir = pic_dir; // './DB/excel/Pictures_Mesostigmata';
                    fs.readdir(dir, function(err, files){
                        if (err) {
                            console.log('Не удалось считать файлы из директории с изображениями. Пример: pic_dir:"./DB/excel/Pictures_Mesostigmata"', {err:err,dir:dir});
                            errors.push({
                                msg:'Не удалось считать файлы из директории с изображениями',
                                err:err,
                                obj:obj
                            });
                            return cb(null);
                        }
                        for (var i in files) {
                            var file = files[i];
                            // В названии каждой картинки есть некоторая информация разделенная на блоки "_", которую надо перенести в описание картинки. Например:
                            // 002_af_gnathosoma+tritosternum_040.jpg

                            var pic_data = file.split('_');

                            if (!pic_data[0]) continue; // Первый блок = ID вида, он соответствует колонке "ID" в таблице эксель. По нему прикрепляются картинки к видам.

                            pic_data[1] = (typeof pic_data[1] !== 'undefined')? pic_data[1] : '';
                            //  Второй блок добавляется в описание картинки (description) в текстовой расшифровке:
                            // am/am-1/am-2/... = Adult male
                            // af/af-1/af-2/... = Adult female
                            // am+af = Adult male and female
                            // dn = Juvenile, deutonymph
                            // pn = Juvenile, protonymph
                            // l  = Juvenile, larva

                            pic_data[2] = (typeof pic_data[2] !== 'undefined')? pic_data[2] : '';
                            // Третий блок влияет на тип картинки и тоже добавляется в описание (добавляется как есть, полностью, отделено ";" от первого блока, В данном случае описание будет: Adult female; gnathosoma+tritosternum).
                            // Типы картинок:
                            // dorsal  = dorsal view
                            // ventral = ventral view
                            // все остальное = character photo (genital-shield, dorsal-shield, setae...)

                            pic_data[3] = (typeof pic_data[3] !== 'undefined')? pic_data[3] : false;
                            // Четвертый блок это увеличение на котором была снята фотография. Оно есть не у всех картинок, у некоторых написано "bk". Это значит нет информации, пустое поле.
                            // Для всех остальных картинок надо добавить число умноженное на 10 (то есть в данном случае 40*10 = 400) как новое свойство (колонку) к картинкам.
                            // Новое свойство называется "Magnification", это цифровое значение, которое может принимать любые целые и не-целые значение больше нуля.
                            // В названии фото так же может быть приписка "m", ее игнорировать. Например 005m = просто 5.

                            var picture = {
                                key: +pic_data[0],
                                name: file,
                                description_alias: pic_data[1],
                                view_alias: pic_data[2],
                                magnification_alias: pic_data[3]
                            };

                            // Если в последнем блоке bk, автор = Bernhard Klarner (я уже добавил его в список)
                            // Если в последнем блоке цифры, автор = Eckhard Schulz (есть в списке)
                            picture.author = (picture.magnification_alias === 'bk')? 'Bernhard Klarner' : obj.author;

                            picture.view = getView(picture.view_alias);
                            picture.view_sysname = getViewSysname(picture.view);
                            picture.description = getDescription(picture.description_alias);
                            picture.description_full = picture.description + '; ' + picture.view;
                            if (picture.magnification_alias){
                                var ma = +picture.magnification_alias.replace(/[^0-9]/ig,'');
                                if (!isNaN(+ma)){
                                    picture.magnification = ma*10;
                                }
                            }
                            var key = picture.key;
                            if (!pictures_obj[key]) pictures_obj[key] = {};
                            if (!pictures_obj[key][picture.name]) pictures_obj[key][picture.name] = picture;
                        }
                        cb(null);
                    });
                },
                getPictures:function(cb){

                    for (var i in species_obj) {
                        if (!species_obj[i].id) continue;
                        if (!species_obj_by_id[species_obj[i].id]) {
                            species_obj_by_id[species_obj[i].id] = species_obj[i];
                            species_obj_by_id[species_obj[i].id].pictures = {};
                        }
                    }
                    var o = {
                        command:'get',
                        object:'taxon_picture',
                        params:{
                            where:[
                                {
                                    key:'taxon_id',
                                    type:'in',
                                    val1:Object.keys(species_obj_by_id)
                                }
                            ],
                            limit:1000000,
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить taxon_pictures',{o : o, err : err}));
                        for (var i in res) {
                            // if (!species_obj_by_id[res[i].taxon_id].pictures) species_obj_byНе удалось установить статистику_id[res[i].taxon_id].pictures = [];
                            if (!species_obj_by_id[res[i].taxon_id].pictures[res[i].name]) species_obj_by_id[res[i].taxon_id].pictures[res[i].name] = res[i];
                        }
                        cb(null);
                    });

                },
                addPictures:function(cb){
                    async.eachSeries(species_obj_by_id, function(item, cb){

                        if (!pictures_obj[item.num]) return cb(null);

                        item.to_add_pictures = [];
                        for (var i in pictures_obj[item.num]) {
                            // if (item.pictures.indexOf(pictures_obj[item.num][i]) === -1) item.to_add_pictures.push(pictures_obj[item.num][i]);
                            var one_pic = pictures_obj[item.num][i]; // one_pic.name === i
                            if (!item.pictures[one_pic.name]) item.to_add_pictures.push(one_pic);
                        }

                        if (!item.to_add_pictures.length) return cb(null);
                        // console.log(item.num, item.to_add_pictures);
                        var o = {
                            command:'addByList',
                            object:'taxon_picture',
                            params:{
                                taxon_id:item.id,
                                pictures:[]
                            }
                        };
                        for (var j in item.to_add_pictures) {
                            o.params.pictures.push({
                                taxon_id:item.id,
                                name:item.to_add_pictures[j].name,
                                description:item.to_add_pictures[j].description,
                                picture_type_sysname:item.to_add_pictures[j].view_sysname,
                                magnification:item.to_add_pictures[j].magnification,
                                author:item.to_add_pictures[j].author
                            });
                        }
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось добавить изображения списком',{o : o, err : err}));

                            cb(null);
                        });
                    }, cb);
                }
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

            for (var i in species_obj) {
                if (species_obj[i].error) errors.push(species_obj[i]);
            }
            cb(null, new UserOk('Ок',{errors:errors}));
        }
    });
};

Model.prototype.importFromExcel_v2 = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    let _t = this;

    let rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    let filename = obj.filename; // || './DB/excel/Meso_Species_totransfer2.xlsx';
    let pic_dir = obj.pic_dir; // || './DB/excel/Pictures_Mesostigmata';

    if (!filename) return cb(new UserError('Filename not passed', {obj: obj}));

    // Считать файл
    // Создание объекта genus_obj
    // Запрос из taxon_gbif -> на импорт
    // Кого нет в gbif - создать в taxon
    // Дальше посмотрим

    let taxons = [];

    let errors = [];
    let hasTraitsError = false;

    let taxon_name_ind = 0;
    let taxon_level_ind = 1;
    let parent_name_ind = 2;
    let group_ind = 3;
    let external_id_ind = 4;
    let project_ind = 5;
    let link_ind = 6;
    let authorship_ind = 7;
    let traits_start_ind = 8;

    let new_taxons = [];
    let new_traits = [];

    let traits = {};
    let projects = {};
    let links = {};

    let group_id;
    let life_id;

    function getTaxonId(obj, cb) {
        let id;
        let gbif_taxon;
        let notFound = false;
        async.series({
            findTaxonInGBIF: cb => {
                let o = {
                    command: 'get',
                    object: 'taxon_gbif',
                    params: {
                        columns: ['id', 'gbif_canonicalName', 'gbif_taxonomicStatus', 'gbif_taxonRank'],
                        where: [
                            {
                                key: 'gbif_canonicalName',
                                type: 'in',
                                val1: obj.name
                            },
                            {
                                key: 'gbif_taxonomicStatus',
                                val1: 'accepted'
                            }
                        ],
                        limit: 1000000,
                        collapseData: false
                    }
                };

                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Error while getting taxon_gbif', {o: o, err: err}));

                    if (res.length) {
                        for (let tmp of res) {
                            if (tmp.gbif_canonicalName === obj.name) {
                                gbif_taxon = tmp;
                                break;
                            }
                        }
                    } else {
                        notFound = true;
                    }

                    cb(null);
                });
            },
            addTaxon: cb => {
                if (!gbif_taxon || notFound) return cb(null);

                let params = {
                    taxon_gbif_id: gbif_taxon.id,
                    level_name: gbif_taxon.gbif_taxonRank,
                    rollback_key: rollback_key,
                    doNotSaveRollback: true
                };

                _t.add(params, function (err, res) {
                    if (err) return cb(new MyError('Error while adding taxon', {params: params, err: err}));

                    id = res.id;

                    cb(null);
                });
            },
            importFromGBIF: cb => {
                if (!id || notFound) return cb(null);

                let o = {
                    command: 'importFromGBIFThisAndParents',
                    object: 'taxon',
                    params: {
                        id: id,
                        rollback_key: rollback_key,
                        doNotSaveRollback: true
                    }
                };

                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось importFromGBIFThisAndParents', {o: o, err: err}));

                    cb(null);
                });
            },
            addNotFoundTaxon: cb => {
                if (!notFound) return cb(null);

                let params = obj;
                params.custom_name = params.custom_name || params.name;

                params.rollback_key = rollback_key;
                params.doNotSaveRollback = true;

                _t.add(params, function (err, res) {
                    if (err) return cb(new MyError('Error while adding new parent', {
                        params: params,
                        err: err
                    }));

                    id = res.id;

                    cb(null);
                });
            },
            updateName: cb => {
                if (!id) return cb(null);

                _t.setNonGbifName({
                    id: id
                }, cb);
            }
        }, (err) => {
            if (id) {
                cb(null, id);
            } else {
                cb('Error while getting taxon id');
            }
        });
    }

    async.series({
        readExcel: cb => {
            let A_code = 'A'.charCodeAt(0);

            let workbook = new Excel.Workbook();
            let options = {
                map: function (value, index) {
                    switch (index) {
                        case 0:
                            // column 1 is string
                            return String(value);
                        default:
                            // the rest are numbers
                            return String(value);
                    }
                }
            };
            workbook.xlsx.readFile(filename, options)
                .then(() => {
                    let ws;

                    workbook.eachSheet(function(worksheet, sheetId) {
                        if (!ws && worksheet) {
                            ws = worksheet;
                            return false;
                        }
                    });

                    if (!ws) return cb('Worksheet not found!');

                    for (let i in ws._rows) {
                        let row = ws._rows[i];
                        i = +i;

                        if (i === 0) {
                            for (let j in row._cells) {
                                let cell = row._cells[j];
                                let cell_value = cell._value.model.value;
                                j = +j;

                                if (j >= traits_start_ind && cell_value) {
                                    traits[j] = {
                                        name: cell_value,
                                        values: new Set()
                                    };
                                }
                            }
                        } else {
                            let taxon = {
                                traits: []
                            };
                            let error = false;

                            for (let j in row._cells) {
                                let cell = row._cells[j];
                                let cell_value = cell._value.model.value;
                                cell_value =
                                    cell_value ? (
                                            typeof cell_value === 'string' ? (
                                                    cell_value.trim().length ?
                                                        cell_value.trim() :
                                                        null) :
                                                cell_value) :
                                        null;

                                if (cell_value && typeof cell_value === 'object' && 'richText' in cell_value) {
                                    let text_tmp = '';
                                    for (const ind in cell_value['richText']) {
                                        text_tmp += cell_value['richText'][ind].text || '';
                                    }
                                    cell_value = text_tmp;
                                }

                                j = +j;

                                switch (j) {
                                    case taxon_name_ind:
                                        if (cell_value) {
                                            taxon.name = cell_value;
                                        } else {
                                            error = true;
                                            errors.push({
                                                i: i + 1,
                                                j: String.fromCharCode(A_code + j),
                                                message: "Taxon name is empty."
                                            });
                                        }
                                        break;
                                    case taxon_level_ind:
                                        taxon.level_name = cell_value;
                                        break;
                                    case parent_name_ind:
                                        taxon.parent_name = cell_value;
                                        break;
                                    case group_ind:
                                        taxon.group_name = cell_value;
                                        break;
                                    case external_id_ind:
                                        taxon.external_id = cell_value;
                                        break;
                                    case project_ind:
                                        taxon.project = cell_value;
                                        break;
                                    case link_ind:
                                        taxon.link = cell_value;
                                        break;
                                    case authorship_ind:
                                        taxon.authorship = cell_value;
                                        break;
                                    default:
                                        if (cell_value) {
                                            if (traits[j]) {
                                                let values = cell_value.split('|');

                                                values.forEach(row => {
                                                    let value = row.match(/(.*?)\[/i);
                                                    let gender = row.match(/\[(.*?)\]/i);

                                                    if (!value)
                                                        value = row;
                                                    else if (value.length > 1)
                                                        value = value[1];

                                                    if (gender && gender.length > 1)
                                                        gender = gender[1];
                                                    else
                                                        gender = 'FEMALE';

                                                    traits[j].values.add(value);
                                                    taxon.traits.push({
                                                        trait_ind: j,
                                                        trait_value: value,
                                                        gender: gender.toUpperCase()
                                                    });
                                                });
                                            } else {
                                                error = true;
                                                errors.push({
                                                    i: i + 1,
                                                    j: String.fromCharCode(A_code + j),
                                                    message: "Trait name is empty."
                                                });
                                            }
                                        }
                                }
                            }

                            if (!taxon.level_name) taxon.level_name = 'morphospecies';
                            if (!taxon.parent_name) taxon.parent_name = 'Life';

                            if (!error && taxon.name) taxons.push(taxon);
                        }
                    }

                    cb(null);
                });
        },
        getLifeID: cb => {
            let o = {
                command: 'get',
                object: 'taxon',
                params: {
                    param_where: {
                        name: 'Life'
                    },
                    collapseData: false
                }
            };

            _t.api(o, (err, res) => {
                if (err) return cb(new MyError('Error while getting Life.', {o: o, err: err}));
                if (!res.length) return cb(new MyError('Life not found.', {o: o, err: err}));

                life_id = res[0].id;

                cb(null);
            });
        },
        addTaxon: cb => {
            async.eachSeries(taxons, (taxon, cb) => {
                async.series({
                    getProjectId: cb => {
                        if (!taxon.project) return cb(null);

                        if (projects[taxon.project]) {
                            taxon.project_id = projects[taxon.project];

                            cb(null);
                        } else {
                            let o = {
                                command: 'get',
                                object: 'project',
                                params: {
                                    columns: ['id', 'name'],
                                    param_where: {
                                        name: taxon.project
                                    },
                                    collapseData: false
                                }
                            };

                            _t.api(o, (err, res) => {
                                if (err) return cb(new MyError('Error while getting project.', {o: o, err: err}));

                                if (res.length) {
                                    taxon.project_id = res[0].id;
                                    projects[taxon.project] = taxon.project_id;
                                } else {
                                    errors.push({
                                        message: `Project "${taxon.project}": not found.`
                                    });
                                }

                                cb(null);
                            });
                        }
                    },
                    getGroupId: cb => {
                        if (!taxon.group_name) return cb(null);

                        let o = {
                            command: 'get',
                            object: 'taxon',
                            params: {
                                columns: ['id', 'custom_name', 'gbif_kingdom', 'gbif_phylum', 'gbif_class', 'gbif_order'],
                                param_where: {
                                    custom_name: taxon.group_name
                                },
                                collapseData: false
                            }
                        };

                        _t.api(o, (err, res) => {
                            if (err) return cb(new MyError('Error while getting taxon group.', {o: o, err: err}));

                            if (res.length) {
                                taxon.group_id = res[0].id;
                                if (!group_id) group_id = taxon.group_id;
                            }

                            cb(null);
                        });
                    },
                    getLinkId: cb => {
                        if (!taxon.link) return cb(null);

                        if (links[taxon.link]) {
                            taxon.link_id = links[taxon.link];

                            cb(null);
                        } else {
                            async.series({
                                checkTaxon: cb => {
                                    let o = {
                                        command: 'get',
                                        object: 'taxon',
                                        params: {
                                            columns: ['id', 'custom_name'],
                                            param_where: {
                                                custom_name: taxon.link
                                            },
                                            collapseData: false
                                        }
                                    };

                                    _t.api(o, (err, res) => {
                                        if (err) return cb(new MyError('Error while getting taxon.', {o: o, err: err}));

                                        if (res.length) {
                                            taxon.link_id = res[0].id;
                                            links[taxon.link] = taxon.link_id;
                                        }

                                        cb(null);
                                    });
                                },
                                addTaxon: cb => {
                                    if (taxon.link_id) return cb(null);

                                    getTaxonId({
                                        name: taxon.link,
                                        parent_id: taxon.group_id || life_id,
                                        level_name: 'morphospecies'
                                    }, (err, id) => {
                                        taxon.link_id = id;
                                        links[taxon.link] = taxon.link_id;
                                        new_taxons.push(taxon.link);

                                        cb(err);
                                    })
                                }
                            }, cb);
                        }
                    },
                    addTaxon_morphospecies: cb => {
                        if (taxon.level_name !== 'morphospecies') return cb(null);

                        async.series({
                            checkTaxon: cb => {
                                let o = {
                                    command: 'get',
                                    object: 'taxon',
                                    params: {
                                        columns: ['id', 'custom_name', 'level_name', 'parent_name'],
                                        param_where: {
                                            custom_name: taxon.name,
                                            level_name: taxon.level_name,
                                            // parent_name: taxon.parent_name
                                        },
                                        where: [],
                                        collapseData: false
                                    }
                                };

                                _t.api(o, (err, res) => {
                                    if (err) return cb(new MyError('Error while getting taxon.', {o: o, err: err}));

                                    if (res.length)
                                        taxon.id = res[0].id;

                                    cb(null);
                                });
                            },
                            getParentId: cb => {
                                if (taxon.id) return cb(null);

                                let o = {
                                    command: 'get',
                                    object: 'taxon',
                                    params: {
                                        columns: ['id', 'custom_name', 'gbif_kingdom', 'gbif_phylum', 'gbif_class', 'gbif_order'],
                                        param_where: {
                                            custom_name: taxon.parent_name
                                        },
                                        collapseData: false
                                    }
                                };

                                _t.api(o, (err, res) => {
                                    if (err) return cb(new MyError('Error while getting taxon.', {
                                        o: o,
                                        err: err
                                    }));

                                    if (res.length) {
                                        taxon.parent = res[0];
                                        taxon.parent_id = taxon.parent.id;
                                    }

                                    cb(null);
                                });
                            },
                            addParentTaxon: cb => {
                                if (taxon.id) return cb(null);
                                if (!taxon.parent_name || taxon.parent) return cb(null);

                                getTaxonId({
                                    name: taxon.parent_name,
                                    parent_id: taxon.group_id || life_id,
                                    level_name: 'morphospecies'
                                }, (err, id) => {
                                    taxon.parent_id = id;
                                    new_taxons.push(taxon.parent_name);
                                    cb(err);
                                });
                            },
                            getParentAfterImportFromGBIF: cb => {
                                if (taxon.id) return cb(null);
                                if (!taxon.parent_name || !taxon.parent_id) return cb(null);

                                let o = {
                                    command: 'get',
                                    object: 'taxon',
                                    params: {
                                        columns: ['id', 'gbif_kingdom', 'gbif_phylum', 'gbif_class', 'gbif_order'],
                                        param_where: {
                                            id: taxon.parent_id
                                        },
                                        collapseData: false
                                    }
                                };

                                _t.api(o, (err, res) => {
                                    if (err) return cb(new MyError('Error while getting taxon.', {
                                        o: o,
                                        err: err
                                    }));

                                    if (res.length) {
                                        taxon.parent = res[0];
                                        taxon.parent_id = taxon.parent.id;
                                    } else {
                                        errors.push({
                                            message: `"${taxon.parent_name}": not found after import from GBIF`
                                        });
                                    }

                                    cb(null);
                                });
                            },
                            updateTaxonData: cb => {
                                if (!taxon.id) return cb(null);

                                let params = {
                                    id: taxon.id,
                                    creation_project_id: taxon.project_id,
                                    external_id: taxon.external_id,
                                    similarity_link_id: taxon.link_id,
                                    rollback_key: rollback_key,
                                    doNotSaveRollback: true
                                };

                                _t.modify(params, (err, res) => {
                                    if (err) return cb(new MyError('Error while updating taxon', {
                                        params: params,
                                        err: err
                                    }));

                                    cb(null);
                                });
                            },
                            addTaxon: cb => {
                                if (taxon.id) return cb(null);
                                if (!taxon.parent) return cb(null);

                                let params = {
                                    name: taxon.name,
                                    custom_name: taxon.name,
                                    level_name: taxon.level_name,
                                    parent_id: life_id,
                                    creation_project_id: taxon.project_id,
                                    external_id: taxon.external_id,
                                    similarity_link_id: taxon.link_id,
                                    gbif_scientificNameAuthorship: taxon.authorship,
                                    rollback_key: rollback_key,
                                    doNotSaveRollback: true
                                };

                                params.parent_id = taxon.parent_id || taxon.group_id;

                                if (taxon.parent) {
                                    params.gbif_kingdom = taxon.parent.gbif_kingdom;
                                    params.gbif_phylum = taxon.parent.gbif_phylum;
                                    params.gbif_class = taxon.parent.gbif_class;
                                    params.gbif_order = taxon.parent.gbif_order;
                                }

                                _t.add(params, function (err, res) {
                                    if (err) return cb(new MyError('Error while adding taxon', {
                                        params: params,
                                        err: err
                                    }));

                                    taxon.id = res.id;
                                    new_taxons.push(taxon.name);

                                    cb(null);
                                });
                            },
                            updateName: cb => {
                                if (!taxon.id) return cb(null);

                                _t.setNonGbifName({
                                    id: taxon.id,
                                    external_id: taxon.external_id
                                }, cb);
                            }
                        }, cb);
                    },
                    addTaxon_not_morphospecies: cb => {
                        if (taxon.level_name === 'morphospecies') return cb(null);

                        let noParent = false;
                        let updateParent = false;
                        async.series({
                            getParentGroupIds: cb => {
                                if (!taxon.group_id) return cb(null);

                                let o = {
                                    command: 'getChildIds',
                                    object: 'taxon',
                                    params: {
                                        id: taxon.group_id
                                    }
                                };

                                _t.api(o, (err, res) => {
                                    if (err) return cb(new MyError('Error while getting group childs.', {
                                        o: o,
                                        err: err
                                    }));

                                    taxon.groups_ids = res.ids || [];
                                    taxon.groups_ids.push(taxon.group_id);

                                    cb(null);
                                });
                            },
                            checkTaxon: cb => {
                                if (!taxon.groups_ids || !taxon.groups_ids.length) return cb(null);

                                let o = {
                                    command: 'get',
                                    object: 'taxon',
                                    params: {
                                        columns: ['id', 'parent_id', 'custom_name', 'level_name'],
                                        param_where: {
                                            custom_name: taxon.name,
                                            level_name: taxon.level_name
                                        },
                                        where: [],
                                        collapseData: false
                                    }
                                };

                                o.params.where.push({
                                    key: 'parent_id',
                                    type: 'in',
                                    val1: taxon.groups_ids
                                });

                                _t.api(o, (err, res) => {
                                    if (err) return cb(new MyError('Error while getting taxon.', {o: o, err: err}));

                                    if (res.length)
                                        taxon.id = res[0].id;

                                    cb(null);
                                });
                            },
                            updateTaxonData: cb => {
                                if (!taxon.id) return cb(null);

                                let params = {
                                    id: taxon.id,
                                    creation_project_id: taxon.project_id,
                                    external_id: taxon.external_id,
                                    similarity_link_id: taxon.link_id,
                                    rollback_key: rollback_key,
                                    doNotSaveRollback: true
                                };

                                _t.modify(params, (err, res) => {
                                    if (err) return cb(new MyError('Error while updating taxon', {
                                        params: params,
                                        err: err
                                    }));

                                    cb(null);
                                });
                            },
                            addTaxon: cb => {
                                if (taxon.id) return cb(null);

                                let params = {
                                    name: taxon.name,
                                    custom_name: taxon.name,
                                    level_name: taxon.level_name,
                                    creation_project_id: taxon.project_id,
                                    external_id: taxon.external_id,
                                    similarity_link_id: taxon.link_id,
                                    gbif_scientificNameAuthorship: taxon.authorship
                                };

                                getTaxonId(params, (err, id) => {
                                    taxon.id = id;
                                    new_taxons.push(taxon.name);
                                    cb(err);
                                });
                            },
                            getTaxonAfterAdding: cb => {
                                if (!taxon.id) return cb(null);

                                let o = {
                                    command: 'get',
                                    object: 'taxon',
                                    params: {
                                        columns: ['id', 'parent_id'],
                                        param_where: {
                                            id: taxon.id
                                        },
                                        collapseData: false
                                    }
                                };

                                _t.api(o, (err, res) => {
                                    if (err) return cb(new MyError('Error while getting taxon after adding.', {
                                        o: o,
                                        err: err
                                    }));

                                    if (res[0].parent_id) {
                                        taxon.parent_id = res[0].parent_id;
                                    } else {
                                        noParent = true;
                                    }

                                    cb(null);
                                });
                            },
                            getParentId: cb => {
                                if (!taxon.parent_name) return cb(null);

                                let o = {
                                    command: 'get',
                                    object: 'taxon',
                                    params: {
                                        columns: ['id', 'parent_id', 'custom_name'],
                                        where: [],
                                        param_where: {
                                            custom_name: taxon.parent_name
                                        },
                                        collapseData: false
                                    }
                                };

                                // if (taxon.groups_ids && taxon.groups_ids.length)
                                // 	o.params.where.push({
                                // 		key: 'parent_id',
                                // 		type: 'in',
                                // 		val1: taxon.groups_ids
                                // 	});

                                _t.api(o, (err, res) => {
                                    if (err) return cb(new MyError('Error while getting taxon.', {
                                        o: o,
                                        err: err
                                    }));

                                    if (res.length) {
                                        taxon.parent_id = res[0].id;
                                        updateParent = true;
                                    }

                                    cb(null);
                                });
                            },
                            addParentTaxon: cb => {
                                if (!noParent) return cb(null);
                                if (!taxon.parent_name || taxon.parent_id) return cb(null);

                                getTaxonId({
                                    name: taxon.parent_name,
                                    parent_id: taxon.group_id || life_id,
                                    level_name: 'morphospecies'
                                }, (err, id) => {
                                    taxon.parent_id = id;
                                    new_taxons.push(taxon.parent_name);
                                    cb(err);
                                });
                            },
                            setParent: cb => {
                                if (!noParent && !updateParent) return cb(null);
                                if (!taxon.parent_id && !taxon.group_id) return cb(null);

                                let o = {
                                    command: 'modify',
                                    object: 'taxon',
                                    params: {
                                        id: taxon.id,
                                        parent_id: updateParent ? taxon.parent_id : (taxon.parent_id || taxon.group_id)
                                    }
                                };

                                _t.api(o, (err, res) => {
                                    if (err) return cb(new MyError('Error while modifing taxon.', {
                                        o: o,
                                        err: err
                                    }));

                                    cb(null);
                                });
                            }
                        }, cb);
                    }
                }, cb);
            }, (err) => {
                if (err) return cb(err);

                cb(null);
            });
        },
        checkTraits: cb => {
            async.eachSeries(traits, (trait, cb) => {
                trait.values = Array.from(trait.values);

                async.series({
                    getTraitId: cb => {
                        let o = {
                            command: 'get',
                            object: 'taxon_avalible_trait',
                            params: {
                                param_where: {
                                    name: trait.name
                                },
                                collapseData: false
                            }
                        };

                        _t.api(o, (err, res) => {
                            if (err) {
                                hasTraitsError = true;
                                errors.push({
                                    message: `Error while searching for trait ${trait.name}.`
                                });

                                return cb(new MyError('Error while searching for trait.', {o: o, err: err}));
                            }

                            if (res.length === 1) {
                                let trait_tmp = res[0];

                                trait.id = trait_tmp.id;
                                trait.trait_type_sysname = trait_tmp.trait_type_sysname;
                                trait.sub_table_name_for_select = trait_tmp.sub_table_name_for_select;
                            }

                            cb(null);
                        });
                    },
                    addTrait: cb => {
                        if (trait.id) return cb(null);

                        if (trait.values.size > 20) {
                            trait.error = true;
                            hasTraitsError = true;
                            errors.push({
                                message: `Record name "${trait.name}": The maximum of 20 categories of each character is allowed, check spelling.`
                            });

                            return cb(null);
                        }

                        let o = {
                            command: 'add',
                            object: 'taxon_avalible_trait',
                            params: {
                                name: trait.name,
                                taxon_id: group_id || life_id,
                                trait_type_sysname: 'SELECT',
                                is_ecokeys: true,
                                rollback_key: rollback_key,
                                doNotSaveRollback: true
                            }
                        };

                        _t.api(o, (err, res) => {
                            if (err) return cb(new MyError('Error while adding new trait.', {o: o, err: err}));

                            trait.id = res.id;
                            trait.trait_type_sysname = 'SELECT';
                            trait.sub_table_name_for_select = res.alias;

                            let new_trait = {
                                name: trait.name,
                                categories: []
                            };

                            new_traits.push(new_trait);

                            async.eachSeries(Array.from(trait.values), (value, cb) => {
                                let o = {
                                    command: 'add',
                                    object: res.alias,
                                    params: {
                                        name: value,
                                        rollback_key: rollback_key,
                                        doNotSaveRollback: true
                                    }
                                };

                                _t.api(o, (err, res) => {
                                    if (err) return cb(new MyError('Error while adding new trait value.', {
                                        o: o,
                                        err: err
                                    }));

                                    new_trait.categories.push(value);

                                    cb(null);
                                });
                            }, cb);
                        });
                    },
                    getTraitCategoriesIds: cb => {
                        if (trait.trait_type_sysname !== 'SELECT') return cb(null);

                        trait.values_ids = {};

                        let o = {
                            command: 'get',
                            object: trait.sub_table_name_for_select,
                            params: {
                                collapseData: false
                            }
                        };

                        _t.api(o, (err, res) => {
                            if (err) {
                                hasTraitsError = true;
                                errors.push({
                                    message: `Error while searching for trait categories ${trait.name}.`
                                });

                                return cb(new MyError('Error while searching for trait values.', {o: o, err: err}));
                            }

                            let selects = res;
                            let values = selects.map(row => {
                                return row.name;
                            });
                            trait.error = false;

                            for (const i in trait.values) {
                                let value = trait.values[i];
                                let ind = values.indexOf(value.toString());
                                if (ind === -1) {
                                    trait.error = true;
                                    hasTraitsError = true;
                                    errors.push({
                                        message: `Record name "${trait.name}": Wrong select value - "${value}, check spelling."`
                                    });

                                    break;
                                } else {
                                    trait.values_ids[value] = selects[ind].id;
                                }
                            }

                            cb(null);
                        });
                    }
                }, cb);
            }, cb);
        },
        addTraitValues: cb => {
            if (hasTraitsError) return cb(null);

            async.eachSeries(taxons, (taxon, cb) => {
                if (!taxon.id) return cb(null);

                let list = [];

                for (const trait of taxon.traits) {
                    if (trait.error) continue;

                    list.push({
                        id: traits[trait.trait_ind].id,
                        taxon_id: taxon.id,
                        value1: traits[trait.trait_ind].trait_type_sysname === 'SELECT' ? traits[trait.trait_ind].values_ids[trait.trait_value] : trait.trait_value,
                        value2: '',
                        gender: trait.gender
                    });
                }

                let o = {
                    command: 'setValueByList',
                    object: 'taxon_avalible_trait',
                    params: {
                        list: list,
                        rollback_key: rollback_key,
                        doNotSaveRollback: true
                    }
                };
                _t.api(o, function (err, res) {
                    if (err)
                        return cb(new MyError('Error while adding trait values', {o: o, err: err}));

                    cb(null);
                });
            }, (err) => {
                if (err) return cb(err);

                cb(null);
            });
        }
    }, (err, res) => {
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
                method: 'importFromExcel_v2',
                params: obj
            });

            cb(null, new UserOk('Ок', {
                errors: errors,
                new_traits: new_traits,
                new_taxons: new_taxons,
                rollback_key: rollback_key
            }));
        }
    });
};

Model.prototype.updateActualTaxon = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0]
        obj = {}
    }

    const _t = this

    let rollback_key = obj.rollback_key || rollback.create();

    const limit = 100000000
    let taxa = []
    let taxa_to_modify = []
    let actual_taxa = {}
    async.series({
        getTaxaWithoutActualTaxon: cb => {
            let o = {
                command: 'get',
                object: 'taxon',
                params: {
                    columns: ['id', 'gbif_taxonID', 'actual_taxon_id', 'source'],
                    param_where: {
                        // source: 'Collembola.org in Species 2000 & ITIS Catalogue of Life: 2020-05-28'
                    },
                    where: [
                        {
                            key: 'actual_taxon_id',
                            type: 'isNull'
                        },
                        {
                            key: 'gbif_taxonID',
                            type: 'isNotNull'
                        }
                    ],
                    limit: limit,
                    collapseData: false
                }
            }

            _t.api(o, (err, res) => {
                if (err) return cb(new MyError('Error while getting taxa.', { o: o, err: err }))
                taxa = res
                cb(null)
            })
        },
        getTaxaHavingActualTaxonFromSource: cb => {
            if (!taxa.length) return cb(null)

            let o = {
                command: 'get',
                object: 'taxon_gbif',
                params: {
                    columns: ['gbif_taxonID', 'gbif_acceptedNameUsageID', 'source'],
                    where: [
                        {
                            key: 'gbif_taxonID',
                            type: 'in',
                            val1: taxa.map(row => row.gbif_taxonID)
                        },
                        {
                            key: 'gbif_acceptedNameUsageID',
                            type: 'isNotNull'
                        }
                    ],
                    limit: limit,
                    collapseData: false
                }
            }

            _t.api(o, (err, res) => {
                if (err) return cb(new MyError('Error while getting taxa from source.', { o: o, err: err }))
                let taxa_from_source = res.reduce((acc, row) => {
                    acc[row.gbif_taxonID] = row
                    return acc
                }, {})
                taxa.forEach(row => {
                    if (taxa_from_source[row.gbif_taxonID] && taxa_from_source[row.gbif_taxonID]['source'] === row.source)
                        taxa_to_modify.push({
                            id: row.id,
                            actual_taxon_gbif_taxon_id: taxa_from_source[row.gbif_taxonID]['gbif_acceptedNameUsageID']
                        })
                })
                cb(null)
            })
        },
        updateTaxa: cb => {
            if (!taxa_to_modify.length) return cb(null)

            async.eachSeries(taxa_to_modify, (taxon, cb) => {
                async.series({
                    getActualTaxon: cb => {
                        if (actual_taxa[taxon['actual_taxon_gbif_taxon_id']]) return cb(null)

                        let o = {
                            command: 'get',
                            object: 'taxon',
                            params: {
                                columns: ['id', 'gbif_taxonID'],
                                param_where: {
                                    gbif_taxonID: taxon.actual_taxon_gbif_taxon_id
                                },
                                collapseData: false
                            }
                        }

                        _t.api(o, (err, res) => {
                            if (err) return cb(new MyError('Error while updating', { o: o, err: err }))
                            if (res.length)
                                actual_taxa[taxon['actual_taxon_gbif_taxon_id']] = res[0]
                            cb(null)
                        })
                    },
                    update: cb => {
                        if (!actual_taxa[taxon.actual_taxon_gbif_taxon_id]) return cb(null)

                        let o = {
                            command: 'modify',
                            object: 'taxon',
                            params: {
                                id: taxon.id,
                                actual_taxon_id: actual_taxa[taxon.actual_taxon_gbif_taxon_id].id,
                                rollback_key: rollback_key,
                                doNotSaveRollback: true
                            }
                        }

                        _t.api(o, (err, res) => {
                            if (err) return cb(new MyError('Error while updating', { o: o, err: err }))
                            cb(null)
                        })
                    }
                }, cb)
            }, cb)
        },
    }, (err, res) => {
        if (err) {
            rollback.rollback({ obj: obj, rollback_key: rollback_key, user: _t.user }, function (err2) {
                return cb(err, err2)
            })
        } else {
            rollback.save({
                rollback_key: rollback_key,
                user: _t.user,
                name: _t.name,
                name_ru: _t.name_ru || _t.name,
                method: 'updateActualTaxon',
                params: obj
            })

            cb(null, new UserOk('Ок', { data: { taxa, taxa_to_modify, actual_taxa } }))
        }
    })
};

Model.prototype.checkNamesViaGBIF = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    const _t = this

    let data = {
        columns: [],
        rows: []
    };

    let filename = obj.filename; // || './DB/excel/Meso_Species_totransfer2.xlsx';

    if ('data' in obj)
        data = obj.data;

    if (!filename && !data.columns.length)
        return cb(new UserError('Filename not passed', {obj: obj}));


    let url = 'https://api.gbif.org/v1/species/match?';
    let editable_fields = ['scientificName'];
    let api_fields = ['matchType', 'confidence', 'scientificName', 'status',
        'rank', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'];
    let api_fields_style = {
        'kingdom': 'style="color: #09c;\"',
        'phylum': 'style="color: #09c;\"',
        'class': 'style="color: #09c;\"',
        'order': 'style="color: #09c;\"',
        'family': 'style="color: #09c;\"',
        'genus': 'style="color: #09c;\"',
        'species': 'style="color: #09c;\"'
    };

    let scientificName_id = null;
    let kingdom_id = null;

    async.series({
        readExcel: cb => {
            if (!filename) return cb(null);
            let workbook = new Excel.Workbook();
            workbook.xlsx.readFile(filename)
                .then(() => {
                    let ws;

                    workbook.eachSheet(function(worksheet, sheetId) {
                        if (!ws && worksheet) {
                            ws = worksheet;
                            return false;
                        }
                    });

                    if (!ws) return cb('Worksheet not found!');

                    let excluded_columns = [];
                    for (let i in ws._rows) {
                        let row = ws._rows[i];
                        i = +i;

                        let row_tmp = [];
                        for (let j in row._cells) {
                            let value = row._cells[j]._value.model.value;
                            value = typeof value === 'string' ? value.trim() : '';

                            if (i === 0) {
                                if (value.toLowerCase() === 'scientificName'.toLowerCase()) {
                                    scientificName_id = j;
                                    if (value)
                                        value = 'verbatim' + value[0].toUpperCase() + value.substr(1);
                                }
                                if (value.toLowerCase() === 'kingdom') {
                                    kingdom_id = j;
                                    if (value)
                                        value = 'preferredKingdom';
                                }

                                if (api_fields.indexOf(value) > -1) {
                                    excluded_columns.push(j);
                                } else {
                                    data.columns.push({
                                        title: value
                                    });
                                }
                            } else {
                                while (row_tmp.length < j)
                                    row_tmp.push({
                                        value: null
                                    });

                                if (row_tmp.length < data.columns.length)
                                    row_tmp.push({
                                        value: value
                                    });
                            }
                        }

                        if (i !== 0) {
                            while (row_tmp.length < data.columns.length)
                                row_tmp.push({
                                    value: null
                                });

                            data.rows.push(row_tmp);
                        }
                    }

                    cb(null);
                });
        },
        findScientificName_id: cb => {
            if (filename) return cb(null);

            for (const i in data.columns) {
                if (kingdom_id !== null && scientificName_id !== null)
                    break;

                if (data.columns[i].title === 'scientificName') {
                    data.columns[i].title = 'verbatim' + data.columns[i].title[0].toUpperCase() + data.columns[i].title.substr(1);
                    scientificName_id = i;
                }
                if (data.columns[i].title === 'kingdom')
                    kingdom_id = i;
            }

            cb(null);
        },
        parse: cb => {
            if (scientificName_id === null) return cb(null);

            api_fields.forEach(row => {
                data.columns.push({
                    title: row,
                    editable: false
                });
            });

            async.eachSeries(data.rows, (columns, cb) => {
                const name = columns[scientificName_id].value.replace(/[^\x00-\x7F]/g, "?")

                if (!name.length)
                    return cb(null);

                let found = null
                async.series({
                    checkInEco: cb => {
                        let params = {
                            param_where: {
                                name: name
                            },
                            collapseData: false
                        }

                        _t.get(params, (err, res) => {
                            if (err) return cb(new MyError('Error while getting taxa.', { o: o, err: err }))
                            if (res.length)
                                found = res[0]
                            cb(null)
                        })
                    },
                    checkInGBIF: cb => {
                        if (found) return cb(null)

                        let url_params = `name=${name}&verbose=true`

                        if (kingdom_id && kingdom_id >= 0 && columns[kingdom_id].value)
                            url_params += `&kingdom=${columns[kingdom_id].value}`

                        request({
                            url: url + url_params,
                            json: true
                        }, function (error, res, body) {
                            api_fields.forEach(field => {
                                let value = body && body[field] || null;
                                let valueHTML;

                                if (field.toLowerCase() === 'matchType'.toLowerCase()) {
                                    if (value === 'HIGHERRANK')
                                        valueHTML = `<span class="badge badge--warning">HIGHERRANK</span>`;
                                    if (value === 'EXACT')
                                        valueHTML = `<span class="badge badge--approved">EXACT</span>`;
                                    if (value === 'FUZZY')
                                        valueHTML = `<span class="badge badge--warning">FUZZY</span>`;
                                    if (value === 'NONE')
                                        valueHTML = `<span class="badge badge--error">NONE</span>`;
                                }

                                let obj_tmp = {
                                    value: value,
                                    valueHTML: valueHTML,
                                    style: api_fields_style[field]
                                };

                                if (field === 'scientificName')
                                    obj_tmp.alternatives = body && body['alternatives'] || [];

                                columns.push(obj_tmp);
                            })

                            cb(null);
                        });
                    }
                }, (err, res) => {
                    if (found) {
                        api_fields.forEach(field => {
                            let value = found[field] || null;
                            let valueHTML;

                            switch (field) {
                                case 'matchType':
                                    valueHTML = `<span class="badge badge--approved">EXACT</span>`
                                    break
                                case 'confidence':
                                    value = 100
                                    break
                                case 'rank':
                                    value = found['level_name']
                                    break
                                case 'scientificName':
                                    value = found['name']
                                    break
                                case 'kingdom':
                                case 'phylum':
                                case 'class':
                                case 'order':
                                case 'family':
                                case 'genus':
                                    value = found['gbif_' + field]
                                    break
                            }

                            let obj_tmp = {
                                value: value,
                                valueHTML: valueHTML,
                                style: api_fields_style[field]
                            }

                            if (field === 'scientificName')
                                obj_tmp.alternatives = []

                            columns.push(obj_tmp);
                        })
                    }

                    cb(null)
                })
            }, cb);
        },
        checkColumns: cb => {
            data.columns.forEach(row => {
                row.editable = editable_fields.indexOf(row.title) > -1;
            });

            cb(null);
        }
    }, (err, res) => {
        cb(err, new UserOk('Ок', {
            data: data
        }));
    });
};

Model.prototype.checkNamesViaGBIF_downloadFile = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    let _t = this;

    let data = obj.data;

    if (!data)
        return cb(new UserError('Data not passed', {obj: obj}));

    let name = 'names_' + moment().format('DDMMYYYY_HHmm');
    let excel = new ToExcel({name: name + '.xlsx'});
    excel.addWorksheet({});

    async.series({
        addColumns: function (cb) {
            let columns = data.columns.map(row => {
                return {
                    header: row.title
                }
            });

            excel.setColumns({columns: columns});

            return cb(null);
        },
        addRows: function (cb) {
            let rows = [];

            data.rows.forEach(row => {
                let columns = [];

                row.forEach(cell => {
                    columns.push(cell.value || '');
                });

                rows.push(columns);
            });

            excel.worksheet.addRows(rows);

            return cb(null);
        },
        save: function (cb) {
            excel.writeFile({}, cb)
        }
    }, function (err, res) {
        if (err) return cb(err);

        res.save.linkName = name + funcs.guid();

        cb(null, res.save)
    });
};


// var o = {
//     command:'fuzzyDBSearch',
//     object:'Taxon',
//     params:{
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// })
Model.prototype.fuzzyDBSearch = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	let level = +obj.level || 1;
	let max_depth = +obj.max_depth || 4;
	let text = obj.text;
	let field = obj.field || 'name';

	if (!text || !text.length) return cb(new MyError('text is required and not empty', {obj: obj}));
	if (level === max_depth) return cb(null);

	let options;

	if (text.length < 3) {
		let params = {
			param_where: {}
		};

		params.param_where[field] = text;

		_t.get(params, function (err, res) {
			if (err) return cb(new MyError('Error while getting list', {params: params, err: err}));
			options = res;
			cb(null);
		});

		return;
	}

	function getSimilarWords(words, firstLvl) {
		let words_new = new Set();

		function add_cs(word) {
			if (!word.length) return;

			if (word[0] === '_')
				word = word.substring(1);

			if (word[word.length - 1 === '_'])
				word = word.substring(0, word.length - 2);

			words_new.add(word);
		}

		words.map(word => {
			for (let i = 0; i < word.length; i++) {
				//удаление
				if (firstLvl || word[i + 1] !== '_')
					add_cs(word.substring(0, i) + word.substring(i + 1));
				//вставка
				if (firstLvl
					|| (i > 0 && (word[0] !== '_' || i > 1)
						&& i < word.length - 1 && (word[word.length - 1] !== '_' || i < word.length - 2)))
					add_cs(word.substring(0, i) + "_" + word.substring(i + 1));
				//замена
				if (firstLvl
					|| (i > 0 && (word[0] !== '_' || i > 1)
						&& i < word.length - 1 && (word[word.length - 1] !== '_' || i < word.length - 2)
						&& word[i + 1] !== '_'))
					add_cs(word.substring(0, i) + "_" + word.substring(i));
			}
		});

		return Array.from(words_new);
	}

	let words = [text];

	if (text.indexOf(' ') > -1)
		words = words.concat(text.split(' '));

	for (let i = 0; i < level; i++)
		words = getSimilarWords(words, level === 1);

	let where = words.map(word => {
		return {
			group: 'or_vishe_gor',
			comparisonType: 'or',
			key: field,
			type: 'LIKE',
			val1: word
		}
	});

	async.series({
		get: cb => {
			let params = {
				where: where,
				columns: ['id', field],
				limit: obj.limit || 100000,
				collapseData: false
			};
			_t.get(params, function (err, res) {
				if (err) return cb(new MyError('Error while getting options', {params: params, err: err}));
				options = res;
				cb(null);
			});
		},
		update: cb => {
			if (options.length) return cb(null);

			let params = {
				level: level + 1,
				max_depth: max_depth,
				text: text,
				field: field
			};
			_t.fuzzyDBSearch(params, function (err, res) {
				if (err) return cb(new MyError('Error while search', {params: params, err: err}));
				options = res.options;
				level = res.level;
				cb(null);
			});
		}
	}, (err, res) => {
		if (err) return cb(err);
		cb(null, new UserOk('Ок', {
			level: level,
			options: options
		}));
	});
};

Model.prototype.importFromExcel_forChecker = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	let _t = this;

	let filename = obj.filename; // || './DB/excel/Meso_Species_totransfer2.xlsx';

	if (!filename) return cb(new UserError('Filename not passed', {obj: obj}));


	let api_fields = ['matchType', 'scientificName', 'status',
		'rank', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'];

	let data = {
		columns: [],
		rows: []
	};

	let scientificName_id = null;
	let kingdom_id = null;

	async.series({
		readExcel: cb => {
			let workbook = new Excel.Workbook();
			workbook.xlsx.readFile(filename)
				.then(() => {
					let ws;

					workbook.eachSheet(function(worksheet, sheetId) {
						if (!ws && worksheet) {
							ws = worksheet;
							return false;
						}
					});

					if (!ws) return cb('Worksheet not found!');

					let excluded_columns = [];
					for (let i in ws._rows) {
						let row = ws._rows[i];
						i = +i;

						let row_tmp = [];
						for (let j in row._cells) {
							let value = row._cells[j]._value.model.value;
							value = typeof value === 'string' ? value.trim() : '';

							if (i === 0) {
								if (value.toLowerCase() === 'scientificName'.toLowerCase()) {
									scientificName_id = j;
									if (value)
										value = 'verbatim' + value[0].toUpperCase() + value.substr(1);
								}
								if (value.toLowerCase() === 'kingdom') {
									kingdom_id = j;
									if (value)
										value = 'preferredKingdom';
								}

								if (api_fields.indexOf(value) > -1) {
									excluded_columns.push(j);
								} else {
									data.columns.push({
										title: value
									});
								}
							} else {
								while (row_tmp.length < j)
									row_tmp.push({
										value: null
									});

								if (row_tmp.length < data.columns.length)
									row_tmp.push({
										value: value
									});
							}
						}

						if (i !== 0) {
							while (row_tmp.length < data.columns.length)
								row_tmp.push({
									value: null
								});

							data.rows.push(row_tmp);
						}
					}

					cb(null);
				});
		},
		parse: cb => {
			if (scientificName_id === null) return cb(null);

			api_fields.forEach(row => {
				data.columns.push({
					title: row
				});
			});

			async.eachSeries(data.rows, (columns, cb) => {
				let name;

				if (columns[scientificName_id].value)
					name = columns[scientificName_id].value;

				if (!name || !name.length)
					return cb(null);


				let params = {
					text: name
				};
				_t.fuzzyDBSearch(params, (err, res) => {
					if (err) return cb(err);
					
					let equalOpt;

					for (const option of res.options) {
						if (option.name === name) {
							equalOpt = option;
							break;
						}
					}

					if (equalOpt) {
						columns.push({
							value: equalOpt.name
						});
					} else {
						let fuzzy_res = fuzzysort.go(name, res.options, {key: 'name'});

						if (fuzzy_res.length)
							columns.push({
								value: fuzzy_res[0].target
							});
					}

					cb(null);
				});
			}, cb);
		}
	}, (err, res) => {
		cb(err, new UserOk('Ок', {
			data: data
		}));
	});
};


Model.prototype.checkDataForTableStn = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    let _t = this;

    // let filename = './DB/excel/Example_communityMatrix.xlsx';
    let filename = obj.filename;
    if (!filename) return cb(new UserError('Filename not passed', {obj: obj}));

    let properties = ["eventID", "parentEventID", "samplingProtocol", "sampleSizeValue", "sampleSizeUnit", "samplingEffort", "eventDate", "eventTime", "startDayOfYear", "endDayOfYear", "year", "month", "day", "verbatimEventDate", "habitat", "fieldNumber", "fieldNotes", "eventRemarks", "geologicalContextID", "earliestEonOrLowestEonothem", "latestEonOrHighestEonothem", "earliestEraOrLowestErathem", "latestEraOrHighestErathem", "earliestPeriodOrLowestSystem", "latestPeriodOrHighestSystem", "earliestEpochOrLowestSeries", "latestEpochOrHighestSeries", "earliestAgeOrLowestStage", "latestAgeOrHighestStage", "lowestBiostratigraphicZone", "highestBiostratigraphicZone", "lithostratigraphicTerms", "group", "formation", "member", "bed", "locationID", "higherGeographyID", "higherGeography", "continent", "waterBody", "islandGroup", "island", "country", "countryCode", "stateProvince", "county", "municipality", "locality", "verbatimLocality", "verbatimElevation", "minimumElevationInMeters", "maximumElevationInMeters", "verbatimDepth", "minimumDepthInMeters", "maximumDepthInMeters", "minimumDistanceAboveSurfaceInMeters", "maximumDistanceAboveSurfaceInMeters", "locationAccordingTo", "locationRemarks", "verbatimCoordinates", "verbatimLatitude", "verbatimLongitude", "verbatimCoordinateSystem", "verbatimSRS", "decimalLatitude", "decimalLongitude", "geodeticDatum", "coordinateUncertaintyInMeters", "coordinatePrecision", "pointRadiusSpatialFit", "footprintWKT", "footprintSRS", "footprintSpatialFit", "georeferencedBy", "georeferencedDate", "georeferenceProtocol", "georeferenceSources", "georeferenceVerificationStatus", "georeferenceRemarks", "type", "modified", "language", "license", "rightsHolder", "accessRights", "bibliographicCitation", "references", "institutionID", "datasetID", "institutionCode", "datasetName", "ownerInstitutionCode", "informationWithheld", "dataGeneralizations", "dynamicProperties", "recordedBy", "basisOfRecord"];
    // let properties = obj.properties;
    // if (!properties) return cb(new UserError('Properties not passed', {obj: obj}));

    let url = 'https://api.gbif.org/v1/species/match?';
    let data = {
        columns: [],
        rows: []
    };

    async.series({
        readExcel: cb => {
            let workbook = new Excel.Workbook();
            workbook.xlsx.readFile(filename)
                .then(() => {
                    let ws;

                    workbook.eachSheet(function(worksheet, sheetId) {
                        if (!ws && worksheet) {
                            ws = worksheet;
                            return false;
                        }
                    });

                    if (!ws)
                        return cb('Worksheet not found!');

                    let excluded_columns = [];
                    for (let i in ws._rows) {
                        let row = ws._rows[i];
                        i = +i;

                        let row_tmp = [];
                        for (let j in row._cells) {
                            let value = row._cells[j]._value.model.value;

                            if (value && typeof value === 'object' && typeof value.getDate === 'function') {
                                try {
                                    value = moment(value).format('YYYY-MM-DD');
                                } catch (e) {
                                    console.error(e);
                                }
                            }

                            if (i === 0) {
                                data.columns.push({
                                    title: value
                                });
                            } else {
                                while (row_tmp.length < j)
                                    row_tmp.push({
                                        value: null
                                    });

                                while (data.columns.length <= row_tmp.length)
                                    data.columns.push({
                                        title: null
                                    });

                                row_tmp.push({
                                        value: value
                                    });
                            }
                        }

                        if (i !== 0) {
                            while (row_tmp.length < data.columns.length)
                                row_tmp.push({
                                    value: null
                                });

                            data.rows.push(row_tmp);
                        }
                    }

                    cb(null);
                });
        },
        compareWithProperties: cb => {
            for (const column of data.columns) {
                if (!column.title)
                    continue;
                let columnsCompare = fuzzysort.go(column.title, properties);
                if (columnsCompare.length)
                    column.columnsCompare = columnsCompare;
            }

            for (const row of data.rows) {
                if (row.length < data.columns.length)
                    row.push({
                        value: null
                    });
            }

            cb(null);
        },
        compareWithGBIF: cb => {
            async.eachSeries(data.columns, (column, cb) => {
                if (column.columnsCompare && column.columnsCompare.length ||
                    !column.title || typeof column.title !== 'string') return cb(null);

                let url_params = `name=${column.title.replace(/[^\x00-\x7F]/g, "?")}&verbose=true`;

                request({
                    url: url + url_params,
                    json: true
                }, function (error, res, body) {
                    column.gbifCompare = body;
                    // api_fields.forEach(field => {
                    //     let value = body && body[field] || null;
                    //     let valueHTML;
                    //
                    //     if (field.toLowerCase() === 'matchType'.toLowerCase()) {
                    //         if (value === 'HIGHERRANK')
                    //             valueHTML = `<span class="badge badge--warning">HIGHERRANK</span>`;
                    //         if (value === 'EXACT')
                    //             valueHTML = `<span class="badge badge--approved">EXACT</span>`;
                    //         if (value === 'FUZZY')
                    //             valueHTML = `<span class="badge badge--warning">FUZZY</span>`;
                    //         if (value === 'NONE')
                    //             valueHTML = `<span class="badge badge--error">NONE</span>`;
                    //     }
                    //
                    //     let obj_tmp = {
                    //         value: value,
                    //         valueHTML: valueHTML,
                    //         style: api_fields_style[field]
                    //     };
                    //
                    //     if (field === 'scientificName')
                    //         obj_tmp.alternatives = body && body['alternatives'] || [];
                    //
                    //
                    //     columns.push(obj_tmp);
                    // });

                    cb(null);
                });
            }, cb);
        }
    }, (err, res) => {
        cb(err, new UserOk('Ок', {
            data: data
        }));
    });
};

Model.prototype.compareColumnsForTableStn = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    let _t = this;

    let query = obj.query;
    if (!query || !query.trim()) return cb(new UserError('Filename not passed', {obj: obj}));

    let properties = obj.properties;
    if (!properties) return cb(new UserError('Properties not passed', {obj: obj}));

    let options = fuzzysort.go(query, properties);

    cb(null, new UserOk('noToastr', {
        options: options
    }));
};

Model.prototype.getTransformedTableFile = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    let data = obj.data;

    if (!data)
        return cb(new UserError('Data not passed', {obj: obj}));

    let name = 'DarwinEvent_' + moment().format('DDMMYYYY') + '_occurrences';
    let excel = new ToExcel({name: name + '.xlsx'});
    excel.addWorksheet({});

    async.series({
        transform: cb => {
            let columns = data.columns.filter(column => {
                return !column.is_taxon;
            }).map(row => row.title);

            let rows = [];

            for (let i = 0; i < data.columns.length; i++) {
                if (!!data.columns[i].is_taxon) {
                    let title = data.columns[i].title;
                    title = title && title.length ? title : data.columns[i].title_init;

                    data.rows.forEach(cells => {
                        let row = [];
                        let count = [];
                        for (let j in cells) {
                            let cell = cells[j];
                            if (!data.columns[j].is_taxon)
                                row.push(cell.value);
                            else if (j == i)
                                count = cell.value;
                        }
                        row.push(title);
                        row.push(count);
                        rows.push(row);
                    });
                }
            }

            columns.push("Taxon");
            columns.push("Count");

            data = {
                columns: columns,
                rows: rows
            };

            return cb(null);
        },
        addColumns: function (cb) {
            let columns = data.columns.map(row => {
                return {
                    // header: row.title
                    header: row
                }
            });

            excel.setColumns({columns: columns});

            return cb(null);
        },
        addRows: function (cb) {
            let rows = [];

            data.rows.forEach(row => {
                let columns = [];

                row.forEach(cell => {
                    // columns.push(cell.value || '');
                    columns.push(cell);
                });

                rows.push(columns);
            });

            excel.worksheet.addRows(rows);

            return cb(null);
        },
        save: function (cb) {
            excel.writeFile({}, cb)
        }
    }, function (err, res) {
        if (err) return cb(err);

        res.save.linkName = name + funcs.guid();

        cb(null, res.save)
    });
};


Model.prototype.importImages = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	var _t = this;
	var rollback_key = obj.rollback_key || rollback.create();
	var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

	let author_id = 43;
	let source_id = 1;
	let copyright_id = 1;

	let pic_dir = obj.pic_dir || './DB/excel/Pictures_Ants_Z02_test';

	let dirs;
	let pictures = [];
	let external_ids = {};
	let external_ids_set = new Set();
	let picture_source_name_arr = [];

	let added = [];
	let errors = [];
	let infos = [];
	let added_taxon_ids = new Set();
	const import_time = moment().format('DDMMYYYY_HHmmss');

	//Pictures_spiders_Z01.zip
	// let getDataForSpiders = (file, dir) => {
	// 	let error = false;
	// 	let data = {
	// 		dir: dir,
	// 		name: file
	// 	};
	//
	// 	let tmp = file.split('_');
	// 	let tmp2 = tmp[1].split('.');
	//
	// 	data.external_id = tmp[0];
	// 	external_ids[data.external_id] = null;
	//
	// 	if (['f', 'm'].indexOf(tmp2[0]) > -1) {
	// 		data.description = tmp2[0] === 'f' ? 'Female' : 'Male';
	// 	} else {
	// 		error = true;
	// 		errors.push({
	// 			message: `Wrong 1st parameter in ${dir}/${file}`
	// 		});
	// 	}
	//
	// 	if (['dv', 'vv', 'lv'].indexOf(tmp2[1]) > -1) {
	// 		data.picture_type_id = tmp2[1] === 'dv' ? 1 : (tmp2[1] === 'vv' ? 2 : 3);
	// 	} else {
	// 		error = true;
	// 		errors.push({
	// 			message: `Wrong 2nd parameter in ${dir}/${file}`
	// 		});
	// 	}
	//
	// 	return error ? false : data;
	// };

	//Pictures_Ants_Z02.zip
	// let getDataForSpiders = (file, dir) => {
	// 	let error = false;
	// 	let data = {
	// 		dir: dir,
	// 		name: file
	// 	};
    //
	// 	let tmp = file.split('_');
	// 	if (tmp.length<3) return {code: -1, ...data, msg:'Format is incorrect'};
	// 	let tmp2 = tmp[2].toLowerCase();
    //
	// 	data.external_id = tmp[1];
	// 	external_ids[data.external_id] = null;
    //
	// 	if (tmp2.indexOf('top') >- 1) {
	// 		data.picture_type_id = 1;
	// 	} else if (tmp2.indexOf('front') >- 1) {
	// 		data.picture_type_id = '4';
	// 	} else if (tmp2.indexOf('side') >- 1) {
	// 		data.picture_type_id = '3';
	// 	}
    //
	// 	return error ? false : data;
	// };

    let o = {taxon_trait_value: [{key:'taxon_gender_sysname', val1:'FAMALE'}]}

    let getDataForSpiders = (file, dir) => {
        let error = false;
        let data = {
            dir: dir,
            name: file
        };
        //Dolichoderus.cf.affinis_Z02.HymFrm108.rn_FrontNormal1c.jpg
        // 1) Все, что до первого "_" это название морфовида, но мы это игнорируем.
        // 2) после первого разделителя "_" и до второго разделителя "_" стоит код морфовида. По нему мы крепим картинки к таксонам, сопоставляя с колонкой "External_ID"
        // 3) после второго разделителя "_"  находится набор символов, который начинается либо на "Top..." либо на "Front..." "Side...". Если "Top..."  то поставить тип картинки (picture type) = "Dorsal view". Если "Front..."  то поставить тип картинки (picture type) = "Character photo".  Если "Side..."  то поставить тип картинки (picture type) = "Lateral view". Если что-то другое то пропустить.
        // Все остальное игнорить.



        if (file.match(/_/ig) && file.match(/_/ig).length === 1 && file.match(/rn\.(Front|Top|Side)/ig) && file.match(/rn\.(Front|Top|Side)/ig).length === 1){
            file = file.replace(/rn\.(Front|Top|Side)/ig, '.rn_$1')
        }
        let tmp = file.split('_');
        if (tmp.length<3) return {code: -1, ...data, msg:'Wrong format.'};
        let tmp2 = tmp[2].toLowerCase();

        data.external_id = tmp[1];
        external_ids[data.external_id] = null;

        if (tmp2.indexOf('top') >- 1) {
            data.picture_type_id = 1;
        } else if (tmp2.indexOf('front') >- 1) {
            data.picture_type_id = '4';
        } else if (tmp2.indexOf('side') >- 1) {
            data.picture_type_id = '3';
        }

        return error ? false : data;
    };

	async.series({
		getDirsList: cb => {
			if (!pic_dir) {
				console.log('Директория изображений не передана. Загружена не будет. Пример: pic_dir:"./DB/excel/Pictures_Mesostigmata"');
				errors.push({
					msg: 'Директория изображений не передана. Загружена не будет. Пример: pic_dir:"./DB/excel/Pictures_Mesostigmata"',
					obj: obj
				});
				return cb(null);
			}

			fs.readdir(pic_dir, function (err, dirs_) {
				if (err) return cb(new MyError('Error while reading directories.', {
					err: err
				}));

				dirs = dirs_;

				cb(null);
			});
		},
		getFilesFromDirs: cb => {
			if (!dirs || !dirs.length) return cb(new MyError('Directories not found.'));

			async.eachSeries(dirs, (dir, cb) => {
				fs.readdir(pic_dir + '/' + dir, function (err, files) {
					if (!dirs || !dirs.length) return cb(new MyError('Error while reading directory.'));
					if (!files){
                        errors.push({
                            message: `Is not directory: ${dir}. Files must be placed in a subdirectory.`
                        });
                        return  cb(null);
                    }

					files.forEach(file => {
						if (file === 'Thumbs.db') return;

						try {
							let data = getDataForSpiders(file, dir);

							if (data) {
							    if (data.code){
                                    errors.push(data);
                                }else{
							        pictures.push(data);
                                }
                            }
						} catch (e) {
							errors.push({
								message: `Error while extracting info of ${dir}/${file}`
							});
						}
					});

					cb(null);
				});
			}, cb);
		},
		getTaxa: cb => {
		    if (!Object.keys(external_ids).length) return cb(new UserError('No parsed files were found. See the logs.',{errors, infos}));
			let o = {
				command: 'get',
				object: 'taxon',
				params: {
					columns: ['id', 'external_id'],
					where: [
						{
							key: 'external_id',
							type: 'in',
							val1: Object.keys(external_ids)
						}
					],
                    limit:1000000000,
					collapseData: false
				}
			};

			_t.api(o, (err, res) => {
				if (err) return cb(new MyError('Error while getting taxa.', {
					o: o,
					err: err
				}));

				res.forEach(row => {
					external_ids[row.external_id.toLowerCase()] = row.id;
					external_ids_set.add(row.id);
				});

				cb(null);
			});
		},
		getTaxonPicture: cb => {
		    if (!external_ids_set.size) return cb(null);
			let o = {
			    command: 'get',
			    object: 'taxon_picture',
			    params: {
				    columns: ['taxon_id','source_file_name'],
				    where: [
					    {
						    key: 'taxon_id',
						    type: 'in',
						    val1: Array.from(external_ids_set)
					    }
				    ],
                    limit:1000000000,
				    // groupBy: ['taxon_id'],
				    collapseData: false
			    }
			};

			_t.api(o, (err, res) => {
				if (err) return cb(new MyError('Error while getting taxa pictures.', {
					o: o,
					err: err
				}));

				let ids = [];
                for (let i in res) {
                    if (ids.indexOf(res[i].taxon_id)=== -1) ids.push(res[i].taxon_id);
                    if (picture_source_name_arr.indexOf(res[i].source_file_name)=== -1) picture_source_name_arr.push(res[i].source_file_name);
                }

				// let ids = res.map(row => {
				// 	return row.taxon_id;
				// });

				// for (const external_id of Object.keys(external_ids)) {
				// 	if (ids.indexOf(external_ids[external_id]) > -1) {
				// 		external_ids[external_id] = null;
				// 	}
                //
				// 	if (!external_ids[external_id])
				// 		delete external_ids[external_id]
				// }

				cb(null);
			});
		},
		copePicture: cb => {
			// let name;
			async.eachSeries(pictures, (pic, cb) => {
				if (!external_ids[pic.external_id.toLowerCase()]) {
					errors.push({
						message: `Taxon not found of pict ${pic.dir}/${pic.name}`
					});
					return cb(null);
				}

				if (picture_source_name_arr.indexOf(pic.name) !== -1){
                    infos.push({
                        message: `Picture already uploaded`,
                        dir: pic.dir,
                        taxon_id: external_ids[pic.external_id.toLowerCase()],
                        name: pic.new_name,
                        source_file_name: pic.name
                    });
                    return cb(null);
                }

				// if (name && name !== pic.external_id) return cb(null);
				// name = pic.external_id;

				let file_ext = parsePath(pic.name).extname;
				let new_name = Guid.create().value;
				pic.new_name = new_name + file_ext;

				async.series({
					copyFile: cb => {
						// let sourceFile = `./DB/excel/Pictures_Ants_Z02/${pic.dir}/${pic.name}`;
						let sourceFile = `${pic_dir}/${pic.dir}/${pic.name}`;
						let destinationFile = `./public/upload/Taxon_pictures/${pic.new_name}`;

						fs.readFile(sourceFile, function (err, data) {
							if (err) {
							    return cb(new MyError('Файл не загружен', {
                                    err: err,
                                    sourceFile: sourceFile
                                }));
                            }

							fs.writeFile(destinationFile, data, function (err) {
								if (err) return cb(new MyError('Не удалось записать файл', {
									err: err,
									sourceFile: sourceFile,
									destinationFile: destinationFile
								}));

								return cb(null);
							});
						});

						// fs.access(sourceFile, function (err) {
						// 	if (err) return cb(new MyError('Файл не загружен'), {
						// 		err: err,
						// 		sourceFile: sourceFile
						// 	});
						// 	fs.copyFile(sourceFile, destinationFile, function (err) {
						// 		if (err) return cb(new MyError('Не удалось записать файл', {
						// 			err: err,
						// 			sourceFile: sourceFile,
						// 			destinationFile: destinationFile
						// 		}));
						//
						// 		return cb(null);
						// 	});
						// });
					},
					addTaxonPicutre: cb => {
						let o = {
							command: 'add',
							object: 'taxon_picture',
							params: {
								taxon_id: external_ids[pic.external_id.toLowerCase()],
								name: pic.new_name,
                                source_file_name: pic.name,
								description: pic.description,
								picture_type_id: pic.picture_type_id,
								author_id: author_id,
								pic_source_id: source_id,
								copyright_id: copyright_id,
								rollback_key: rollback_key,
								doNotSaveRollback: true
							}
						};

						_t.api(o, (err, res) => {
							if (err) return cb(new MyError('Error while adding pic.', {
								o: o,
								err: err
							}));
							added.push({
                                id:res.id,
                                taxon_id: o.taxon_id,
                                name: o.name,
                                source_file_name: o.source_file_name
                            });

							pic.id = res.id;
							added_taxon_ids.add(external_ids[pic.external_id.toLowerCase()])

							cb(null);
						});
					},
					resizeAndSetText: cb => {
						let o = {
							command: 'resizeAndSetText',
							object: 'taxon_picture',
							params: {
								id: pic.id
							}
						};

						_t.api(o, (err, res) => {
							if (err) {
								let o = {
								    command: 'remove',
								    object: 'taxon_picture',
								    params: {
								        id: pic.id
								    }
								};

								_t.api(o, (err, res) => {
									// if (err) return cb(new MyError('Error while deleting pic.', {
									// 	o: o,
									// 	err: err
									// }));

									cb(null);
								});
							} else {
								cb(null);
							}
						});
					}
				}, cb);
			}, cb);
		},
		saveErrors: cb => {
			fs.writeFile(`./DB/excel/logs/errors_${import_time}.json`, JSON.stringify(errors), 'utf8', cb);
		},
        saveInfos: cb => {
            fs.writeFile(`./DB/excel/logs/infos_${import_time}.json`, JSON.stringify(infos), 'utf8', cb);
        },
        saveAdded: cb => {
            fs.writeFile(`./DB/excel/logs/added_${import_time}.json`, JSON.stringify(added), 'utf8', cb);
        }
	}, (err, res) => {
		if (err) {
			cb(err);
			// rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
			// 	return cb(err, err2);
			// });
		} else {
			// rollback.save({
			// 	rollback_key: rollback_key,
			// 	user: _t.user,
			// 	name: _t.name,
			// 	name_ru: _t.name_ru || _t.name,
			// 	method: 'importImages',
			// 	params: obj
			// });

			cb(null, new UserOk('Ок', {
				pictures: pictures,
				added_taxon_ids: added_taxon_ids,
				errors: errors,
                infos:infos,
                added:added
			}));
		}
	});
};

Model.prototype.importLocationsFromExcel = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    let _t = this;

    let rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;
    let filename = './public/upload/data_for_import/data.xlsx';

    // Считать файл
    // Создание объекта genus_obj
    // Запрос из taxon_gbif -> на импорт
    // Кого нет в gbif - создать в taxon
    // Дальше посмотрим

    let taxons = [];

    let errors = [];

    let msaccess_taxon_id  = 0;
    let l_code = 1;

    async.series({
        readExcel: cb => {
            let A_code = 'A'.charCodeAt(0);

            let workbook = new Excel.Workbook();
            let options = {
                map: function (value, index) {
                    switch (index) {
                        case 0:
                            // column 1 is string
                            return String(value);
                        default:
                            // the rest are numbers
                            return String(value);
                    }
                }
            };
            workbook.xlsx.readFile(filename, options)
                .then(() => {
                    let ws = workbook._worksheets[1];

                    for (let i in ws._rows) {
                        let row = ws._rows[i];
                        i = +i;
                        if (i === 0) continue;

                        let taxon = {};
                        let error = false;

                        for (let j in row._cells) {
                            let cell = row._cells[j];
                            let cell_value = cell._value.model.value;
                            cell_value =
                                cell_value ? (
                                        typeof cell_value === 'string' ? (
                                                cell_value.trim().length ?
                                                    cell_value.trim() :
                                                    null) :
                                            cell_value) :
                                    null;
                            j = +j;

                            switch (j) {
                                case msaccess_taxon_id :
                                    if (cell_value) {
                                        taxon.msaccess_taxon_id = cell_value;
                                    } else {
                                        error = true;
                                        errors.push({
                                            i: i + 1,
                                            j: String.fromCharCode(A_code + j),
                                            message: "msaccess_taxon_id is empty."
                                        });
                                    }
                                    break;
                                case l_code:
                                    if (cell_value) {
                                        taxon.l_code = cell_value;
                                    } else {
                                        error = true;
                                        errors.push({
                                            i: i + 1,
                                            j: String.fromCharCode(A_code + j),
                                            message: "l_code is empty."
                                        });
                                    }
                                    break;
                            }
                        }

                        if (!error) taxons.push(taxon);
                    }

                    cb(null);
                });
        },
        getIds: cb => {
            async.eachSeries(taxons, (taxon, cb) => {
                async.series({
                    getTaxonId: cb => {
                        let o = {
                            command: 'get',
                            object: 'taxon',
                            params: {
                                columns: ['id'],
                                param_where: {
                                    msaccess_taxon_id: taxon.msaccess_taxon_id
                                },
                                collapseData: false
                            }
                        };

                        _t.api(o, (err, res) => {
                            if (err) return cb(new MyError('Error while getting msaccess_taxon_id.', {o: o, err: err}));
                            if (!res.length) {
                                errors.push({
                                    message: `msaccess_taxon_id: "${taxon.msaccess_taxon_id} not found"`
                                });

                                // return cb(new MyError(`msaccess_taxon_id: "${taxon.msaccess_taxon_id} not found"`, {o: o, err: err}));

                                return cb(null);
                            }

                            taxon.taxon_id = res[0].id;

                            cb(null);
                        });
                    },
                    getLocationId: cb => {
                        let o = {
                            command: 'get',
                            object: 'location',
                            params: {
                                columns: ['id'],
                                param_where: {
                                    L_code: taxon.l_code
                                },
                                collapseData: false
                            }
                        };

                        _t.api(o, (err, res) => {
                            if (err) return cb(new MyError('Error while getting location_id.', {o: o, err: err}));
                            if (!res.length) {
                                errors.push({
                                    message: `l_code: "${taxon.l_code} not found"`
                                });

                                // return cb(new MyError(`l_code: "${taxon.l_code} not found"`, {o: o, err: err}));

                                return cb(null);
                            }

                            taxon.location_id = res[0].id;

                            cb(null);
                        });
                    }
                }, cb);
            }, (err) => {
                cb(null);
            });
        },
        saveTaxonLocations: cb => {
            async.eachSeries(taxons, (taxon, cb) => {
                if (!taxon.taxon_id || !taxon.location_id) return cb(null);

                let o = {
                    command: 'add',
                    object: 'taxon_location',
                    params: {
                        taxon_id: taxon.taxon_id,
                        location_id: taxon.location_id,
                        rollback_key: rollback_key
                    }
                };

                _t.api(o, function (err) {
                    if (err) return cb(new MyError('Error while adding location', {params: params, err: err}));

                    cb(null);
                });
            }, cb);
        }
    }, (err, res) => {
        // console.log(taxons);
        // console.log(traits);
        console.log(errors);

        if (err) {
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            cb(null, new UserOk('Ок', {errors: errors}));
        }
    });
};

/**
 * Метод сделает данный таксон синонимом. При этом у него появится ссылка на актуальный таксон.
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.setAsSynonym = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var actual_taxon_id = obj.actual_taxon_id;
    if (isNaN(+actual_taxon_id)) return cb(new MyError('Не передан actual_taxon_id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    // Проверить существование actual_taxon_id (получить)
    // Проверить его соответствию условиям (если нужно)
    // Установить статус и actual_taxon_id

    var taxon, actual_taxon;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить .',{id:id,err:err}));
                taxon = res[0];
                if (taxon.status_sysname === 'SYNONYM') return cb(new UserError('This taxon already SYNONYM'));
                cb(null);
            });
        },
        getActualTaxonId:function(cb){
            _t.getById({id:actual_taxon_id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить actual_taxon.',{id:actual_taxon_id,err:err}));
                actual_taxon = res[0];
                cb(null);
            });
        },
        check:function(cb){
            if (taxon.level_id !== actual_taxon.level_id){
                if (obj.confirm){
                    // Пользователь подтвердил
                    return cb(null);
                }else{
                    return cb(new UserError('needConfirm', {confirmType:'dialog',message: 'The chosen synonym has another rank. Proceed anyway?'}));
                }
            }
            return cb(null);
        },
        set:function(cb){
            var params = {
                id:id,
                actual_taxon_id:actual_taxon_id,
                status_sysname:'SYNONYM',
                rollback_key:rollback_key
            };
            _t.modify(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось изменить taxon (установить его синонимом)',{params : params, err : err}));
                cb(null);
            });

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

Model.prototype.getTaxonSynonyms = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var params = {
        param_where: {
            actual_taxon_id: id,
            status_sysname: 'SYNONYM'
        },
        columns: ['id', 'name', 'status_id', 'status', 'status_sysname'],
        collapseData: false
    };

    var synonyms;
    _t.get(params, function (err, res) {
       if (err) return cb(new MyError("Не удалось получить синонимы таксона", {params: params, err: err}));

       synonyms = res;
       cb(null, new UserOk('noToastr', { synonyms: synonyms }));
    });
};

// var o = {
//     command:'getChildPictures',
//     object:'Taxon',
//     params:{
//         id:406758
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// });

Model.prototype.getChildPictures = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	var _t = this;
	var id = obj.id;
	if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}));

	let taxon_ids = [];
	let pictures = [];
	let di_ids;
	let di_pictures;
	async.series({
		getChldIds: function (cb) {
			var params = {
				id: id
			};
			_t.getChildIds(params, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить getChildIds', {params: params, err: err}));
				taxon_ids = taxon_ids.concat(res.ids);
				cb(null, new UserOk('Ok', taxon_ids));
			});

		},
		getPictures: function (cb) {
			if (!taxon_ids.length) return cb(null);
			let o = {
				command: 'get',
				object: 'taxon_picture',
				params: {
					where: [
						{
							key: 'taxon_id',
							type: 'in',
							val1: taxon_ids
						},
						{
							key: 'is_main_picture',
							type: '=',
							val1: true
						}
					],
					collapseData: false
				}
			};
			_t.api(o, (err, res) => {
				if (err) return cb(new MyError('Не удалось получить изображение', {o: o, err: err}));
				if (res.length <= 10) {
					pictures = res;
				} else {
					let ids = new Set();
					while (ids.size < 10) {
						ids.add(funcs.getRandomInt(0, res.length));
					}
					for (let id of ids)
						pictures.push(res[id]);
				}
				cb(null);
			})

		},
		getIndividuals: cb => {
			if (!taxon_ids.length) return cb(null);

			let o = {
				command: 'get',
				object: 'data_individual',
				params: {
					columns: ['id', 'taxon_id'],
					where: [
						{
							key: 'taxon_id',
							type: 'in',
							val1: taxon_ids
						}
					],
					collapseData: false
				}
			};

			_t.api(o, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить taxon_pictures',{o : o, err : err}));
				di_ids = res.map(row => {
					return row.id
				});
				cb(null);
			});
		},
		getDIPictures: cb => {
			if (!di_ids || !di_ids.length) return cb(null);

			let o = {
				command: 'get',
				object: 'data_individual_picture',
				params: {
					where: [
						{
							key: 'data_individual_id',
							type: 'in',
							val1: di_ids
						}
					],
					collapseData: false
				}
			};


			_t.api(o, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить taxon_pictures',{o : o, err : err}));
				di_pictures = res;
				cb(null);
			});
		}
	}, function (err) {
		if (err) return cb(err);
		cb(null, new UserOk('noToastr', {
			pictures: pictures,
			di_pictures: di_pictures
		}));
	});
};

Model.prototype.getSynonymsPictures = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}));

    let taxon_ids = [];
    let pictures;
	let di_ids;
	let di_pictures;
    async.series({
        getSynonymsIds: function (cb) {
            var params = {
                columns: ['id', 'actual_taxon_id'],
                param_where: {
                    actual_taxon_id: id
                },
                collapseData: false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Error while getting synonyms ids', {params: params, err: err}));
                taxon_ids = res.map(row => {
                    return row.id;
                });
                cb(null);
            });
        },
        getPictures: function (cb) {
            if (!taxon_ids.length) return cb(null);
            var o = {
                command: 'get',
                object: 'taxon_picture',
                params: {
                    where: [
                        {
                            key: 'taxon_id',
                            type: 'in',
                            val1: taxon_ids
                        },
                        {
                            key: 'is_main_picture',
                            type: '=',
                            val1: true
                        }
                    ],

                    collapseData: false
                }
            };
            _t.api(o, (err, res) => {
                if (err) return cb(new MyError('Не удалось получить изображение', {o: o, err: err}));
                pictures = res;
                cb(null);
            })

        },
	    getIndividuals: cb => {
        	if (!taxon_ids.length) return cb(null);

		    let o = {
			    command: 'get',
			    object: 'data_individual',
			    params: {
				    columns: ['id', 'taxon_id'],
				    where: [
					    {
					    	key: 'taxon_id',
						    type: 'in',
						    val1: taxon_ids
					    }
				    ],
				    collapseData: false
			    }
		    };

		    _t.api(o, function (err, res) {
			    if (err) return cb(new MyError('Не удалось получить taxon_pictures',{o : o, err : err}));
			    di_ids = res.map(row => {
				    return row.id
			    });
			    cb(null);
		    });
	    },
	    getDIPictures: cb => {
		    if (!di_ids || !di_ids.length) return cb(null);

		    let o = {
			    command: 'get',
			    object: 'data_individual_picture',
			    params: {
				    where: [
					    {
						    key: 'data_individual_id',
						    type: 'in',
						    val1: di_ids
					    }
				    ],
				    collapseData: false
			    }
		    };


		    _t.api(o, function (err, res) {
			    if (err) return cb(new MyError('Не удалось получить taxon_pictures',{o : o, err : err}));
			    di_pictures = res;
			    cb(null);
		    });
	    }
    }, function (err) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr', {
        	pictures: pictures,
	        di_pictures: di_pictures
        }));
    });
};

/**
 * Переписывает базовый метод. Помимо таксонов экспортируются еще и их трейты
 * @param obj
 * @param cb
 */
Model.prototype.export_to_excel_table_taxon = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var name = (((_t.class_profile.name_ru)? _t.class_profile.name_ru.substr(0,20) : _t.class_profile.name.substr(0,20)) || 'file')+'_'+moment().format('DDMMYYYY_HHmm')+'.xlsx';
    var fileName = 'savedFiles/'+name;
    //var fileName = config.root_public+'reports/' + file_name + '.json';

    var data, data_columns, extra_data;
    var excel;
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



Model.prototype.getTraitsForExport = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	let _t = this;

    let fields = obj.fields
	let wheres = obj.wheres

	let traits;
	let taxon_ids;
	async.series({
		getData_noWhere: function (cb) {
			if (wheres.length > 0) return cb(null);

			let o = {
				command: 'get',
				object: 'taxon_avalible_trait',
				params: {
					columns: ['id', 'name'],
					collapseData: false
				}
			};

			_t.api(o, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить taxon_avalible_trait', {o: o, err: err}));
				traits = res.map(row => {
					return {
						trait_id: row.id,
						name: row.name
					}
				});
				cb(null);
			});
		},

		getData_taxon: function (cb) {
			if (wheres.length === 0) return cb(null);

			let params = {
				where: wheres,
				collapseData: false
			};

			_t.get(params, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить taxon_avalible_trait', {params: params, err: err}));
				taxon_ids = res.map(row => {
					return row.id;
				});
				cb(null);
			});
		},
		getData_traits: function (cb) {
			if (wheres.length === 0 || taxon_ids.length === 0) return cb(null);

			let params = {
				id: taxon_ids[0],
				taxon_ids: taxon_ids
			};

			_t.getAllTraits(params, function (err, res) {
				if (err) return cb(new MyError('Не удалось getAllTraits', {err: err, params: params}));

				if (res) {
					traits = res.characters.concat(res.traits).map(row => {
						return {
							trait_id: row.id,
							name: row.name
						}
					});
				}

				cb(null);
			});
		}
	}, function (err, res) {
		if (err) return cb(err);
		cb(null, new UserOk('ok', {
			traits: traits
		}));
	});
};

Model.prototype.export_to_excel_table_taxon_v2 = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	let _t = this;

	let fields = obj.fields;

	let name = 'taxon_' + moment().format('DDMMYYYY_HHmm') + '.xlsx';

	let taxons;
	let traits_with_values_set = new Set();
	async.series({
		getData: function (cb) {
			let params = {
				where: obj.wheres,
				limit: obj.limit,
				use_cache: false,
				collapseData: false
			};
			_t.get(params, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить данные', {params: params, err: err}));
				if (!res || !res.length) return cb(new MyError('Taxa not found', {params: params, err: err}));
				taxons = res;
				cb(null);
			});
		},
		getTraits: function (cb) {
			let traits_ids = fields.filter(row => {
				return row.type === 'trait'
			}).map(row => {
				return row.trait_id;
			});

			if (!traits_ids.length) return cb(null);

			async.eachSeries(taxons, function (taxon, cb) {
				let params = {
					doNotGetPictures: true,
					id: taxon.id,
					traits_ids: traits_ids
				};
				_t.getAllTraits(params, function (err, res) {
					if (err) return cb(new MyError('Не удалось getAllTraits', {err: err, params: params}));

					taxon.values = {};

					for (const i in res.flat_trait_table) {
						let row = res.flat_trait_table[i];

						taxon.values[row.taxon_avalible_trait_id] = row;

						traits_with_values_set.add(row.taxon_avalible_trait_id);
					}

					cb(null);
				})
			}, cb);
		},
		toExcel: function (cb) {
			let traits_with_values = Array.from(traits_with_values_set);

			let excel = new ToExcel({name: name});
			excel.addWorksheet({});

			async.series({
				addColumns: function (cb) {
					let columns = [];

					fields.forEach(row => {
						if (row.type === 'field') {
							columns.push({
								header: row.name,
								key: row.field
							})
						} else if (row.type === 'trait' && traits_with_values.indexOf(row.trait_id) > -1) {
							columns.push({
								header: row.name
							})
						}
					});

					excel.setColumns({columns: columns});

					return cb(null);
				},
				addRows: function (cb) {
					let rows = [];

					taxons.forEach(taxon => {
						let newRow = [];

						fields.forEach(row => {
							if (row.type === 'field') {
								newRow.push(taxon[row.field]);
							} else if (row.type === 'trait' && traits_with_values.indexOf(row.trait_id) > -1) {
								newRow.push(taxon.values[row.trait_id] ? taxon.values[row.trait_id].value1 : '');
							}
						});

						rows.push(newRow);
					});

					excel.worksheet.addRows(rows);

					return cb(null);
				},
				save: function (cb) {
					excel.writeFile({}, cb)
				}
			}, function (err, res) {
				if (err) return cb(err);
				return cb(null, res.save)
			});
		}
	}, function (err, res) {
		if (err) return cb(err);
		cb(null, res.toExcel);
		// cb(null, {
		// 	taxons: taxons
		// });
	});
};


Model.prototype.update = function (obj, cb) {
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

// var o = {
//     command:'test1',
//     object:'taxon',
//     params:{
//
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// })

Model.prototype.test1 = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    var  t_ids = [406143,406758];
    var taxa;
    var result = {};
    async.series({
        clearCache:(cb)=>{
            _t.clearCache({},cb);
        },
        get1000:function(cb){
            // return cb(null);
            var params = {
                columns:['id'],
                offset:300,
                limit:20000,
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить ',{params : params, err : err}));
                taxa = res;
                for (const i in res) {
                    t_ids.push(res[i].id);
                }
                cb(null);
            });
            // var o = {
            //     command:'getParentIds',
            //     object:'project',
            //     params:{
            //         id:18
            //     }
            // };
            // socketQuery(o, (r)=>{
            //     console.log(r);
            // })


        },
        getParents:function(cb){
            _t.getParentIds({ids:t_ids}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить ',{ids : t_ids, err : err}));
                // console.log('getParentIds',res.ids, 'parent_ids_obj', res.parent_ids_obj, _t.parent_ids.items);
                result = res;
                cb(null);
            });
        }
    },function (err, res) {
        if (err) return cb(err);

        cb(null, new UserOk('Ок',result));
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

Model.prototype.setNonGbifName = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}));

    var name;

    _t.getById({id: id}, function (err, res) {
        if (err) return cb(new MyError('Taxon not found!!!', {id: id, err: err, res}));

        var level_name = res[0].level_name;
        var custom_name = res[0].custom_name || res[0].name;
        var creation_project = res[0].creation_project;
        var similarity_link = res[0].similarity_link;
        var external_id = res[0].external_id;

        if (level_name === 'morphospecies') {
            let parts = [];

            if (creation_project)
                parts.push(`[${creation_project}]`);
            if (external_id)
                parts.push(`[${external_id}]`);
            parts.push(custom_name);
            if (similarity_link)
                parts.push(`cf. ${similarity_link}`);
            parts.push(`(${id})`);

            name = parts.join(' ');
        } else {
            name = custom_name;
        }

        var o = {
            command: 'modify',
            object: 'taxon',
            params: {
                id: id,
                name: name.trim(),
	            doNotCallSetNonGbifName: true
            }
        };

        if (!obj.external_id) o.params.external_id = obj.external_id;
        if (!res[0].custom_name) o.params.custom_name = o.params.name;

        _t.api(o, function (err, res) {
            if (err) return cb(new MyError('Не удалось установить имя', {o: o, err: err}));
            cb(null, res);
        });
    })
};

module.exports = Model;
