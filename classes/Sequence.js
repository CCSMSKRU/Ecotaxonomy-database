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

	let _t = this;

	let id = obj.id;

	async.series({
		getByProject: function (cb) {
			if (_t.client_object !== 'tbl_sequence_collection') return cb(null);
			if (!id) return cb(null);

			let organism_id;
			let project_id;
			async.series({
				getOrganismID: function (cb) {
					let o = {
						command: 'get',
						object: 'sequence',
						params: {
							columns: ['id', 'data_individual_id'],
							param_where: {
								id: id
							},
							collapseData: false
						}
					};

					_t.api(o, function (err, res) {
						if (err) return cb(new MyError('Error while getting sequence',{o : o, err : err}));
						if (res.length && res[0].data_individual_id)
							organism_id = res[0].data_individual_id;
						cb(null);
					});
				},
				getProjectID: function (cb) {
					if (!organism_id) return cb(null);

					let o = {
					    command: 'get',
					    object: 'data_individual',
					    params: {
					    	columns: ['id', 'project_id'],
					        param_where: {
					        	id: organism_id
					        },
						    collapseData: false
					    }
					};

					_t.api(o, function (err, res) {
						if (err) return cb(new MyError('Error while getting organism',{o : o, err : err}));
						if (res.length && res[0].project_id)
							project_id = res[0].project_id;
						cb(null);
					});
				},
				getProjectChildren: function (cb) {
					if (!project_id) return cb(null);

					let o = {
						command: 'getChildsRecursion',
						object: 'project',
						params: {
							id: project_id
						}
					};

					_t.api(o, function (err, res) {
						if (err || res.code !== 0) return cb(new MyError('Error while getting project children',{o : o, err : err}));
						cb(null);
					});
				}
			}, function (err, res) {
				if (err) return cb(err);
				cb(null, res.getForSelectPrototype);
			});
		},
		getForSelectPrototype: function (cb) {
			_t.getForSelectPrototype(obj, cb);
		}
	}, function (err, res) {
		if (err) return cb(err);
		cb(null, res.getForSelectPrototype);
	});
};

Model.prototype.addForIndividual = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    let ids = []
    var _t = this;
    if (!obj.individual_ids) return cb(new MyError('Не передан individual_ids',{obj:obj}));
    async.series({
        addSequences: cb => {
            async.eachSeries(obj.individual_ids,(individ, cb) => {
                let o = {
                    data_individual_id: individ.id,
                    name: individ.name + '_sequence',
                }
                _t.addPrototype(o, (err, res) => {
                    console.log(o, err, res)
                    if (err) return cb(new MyError('Не удалось добавить sequence для individual', {obj: o, err: err}))
                    cb(null, res)
                })
            }, (err, res) => {
                if (err) return cb(err)
                cb(null, res)
            })
        }
    },cb)
};

Model.prototype.importSequencesFromFile = function (obj, cb) {
    const fs = require('fs');

    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    let ids = []
    var _t = this;
    if (!obj.project_id || !obj.file_name) return cb(new MyError('Не все параметры переданы ',{obj:obj}));
    let file
    let sequnces_parse = []
    let main_res = []
    let data_individuals_ids = []
    async.series({
        openFile: cb => {
            fs.exists('./public/upload/' + obj.file_name, function (exists) {
                if (!exists) return cb('Файл не существует ' + filename);
                file = fs.readFileSync('./public/upload/' + obj.file_name, {encoding: 'utf-8'});
                cb(null);
            });
        },
        parseFile: cb => {
            sequnces_parse = file.split('>').filter(seq => seq != "")
            sequnces_parse = sequnces_parse.map(sequnce => {
                let seq = sequnce.split('\r\n')
                return {
                    name: seq[0],
                    sequence: seq[1]
                }
            })
            cb(null)
        },
        addSequences: cb => {
            async.eachSeries(sequnces_parse, (sequence, cb) =>{
                let new_data_individual_id
                async.series({
                    addDataIndividual: cb => {
                        let o = {
                            command: 'add',
                            object: 'data_individual',
                            params: {
                                name: sequence.name.split(' ')[0],
                                project_id: obj.project_id,
                                sampling_event_id: obj.sampling_event_id
                            }
                        }
                        _t.api(o, (err, res) => {
                            if (err) cb(new MyError('Не удалось добавить новый организм', {err: err, o: o}))
                            sequence.data_individual_id = res.id
                            data_individuals_ids.push(res)
                            cb(null)
                            console.log(err, res)
                        })
                    },
                    addSequence: cb => {
                        let params = {
                            name: sequence.name,
                            sequence: sequence.sequence,
                            data_individual_id: sequence.data_individual_id
                        }
                        _t.addPrototype(params, (err, res) => {
                            if (err) return cb(new MyError('Не удалось добавить сиквенс', {err: err, obj: params}))
                            main_res.push(res)
                            cb(null)
                        })
                    }
                }, cb)
            }, cb)
        }
    }, (err, res) => {
        if (err) cb(err)
        cb(null, new UserOk('noToastr',{data: {
                sequences_ids: main_res,
                data_individuals_ids: data_individuals_ids
            }}));
    })
}


Model.prototype.exampleGet = function (obj, cb) {
    if (arguments.length === 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj})); // Not passed to id

    let data;
    async.series({

    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{data:data}));
    });
};

Model.prototype.example = function (obj, cb) {
    if (arguments.length === 1) {
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
            if (doNotSaveRollback) return cb(err);
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
