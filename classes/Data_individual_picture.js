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

Model.prototype.add_ = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    let _t = this;

    // If there are no author, copyright or source, set default

    async.parallel({
        add: cb => {
            if (!obj.author_id) obj.author_id = 1;
            if (!obj.copyright_id) obj.copyright_id = 1;
            if (!obj.pic_source_id) obj.pic_source_id = 1;

            _t.addPrototype(obj, cb);
        },
        setHasPicture: cb => {
            let o = {
                command: 'modify',
                object: 'data_individual',
                params: {
                    id: obj.data_individual_id,
                    has_pictures: true
                }
            };

            _t.api(o, (err, res) => {
                if (err) return cb(new MyError('Error while saving "Has pictures', {o: o, err: err}));

                cb(null);
            });
        }
    }, (err, res) => {
        if (err) return err;

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
    let _t = this;

    let data_individual_id;
    async.series({
        get: cb => {
            let o = {
                command: 'get',
                object: 'data_individual_picture',
                params: {
                    columns: ['id', 'data_individual_id'],
                    param_where: {
                        id: obj.id
                    },
                    collapseData: false
                }
            };

            _t.api(o, (err, res) => {
                if (err) return cb(new MyError('Error while getting pictures', {o: o, err: err}));

                if (res.length)
                    data_individual_id = res[0].data_individual_id;

                cb(null);
            });
        },
        remove: cb => {
            _t.removePrototype(obj, cb);
        },
        getPicsCount: cb => {
            if (!data_individual_id) return cb(null);

            let o = {
                command: 'get',
                object: 'data_individual_picture',
                params: {
                    param_where: {
                        data_individual_id: data_individual_id
                    },
                    countOnly: true,
                    collapseData: false
                }
            };

            _t.api(o, (err, res) => {
                if (err) return cb(new MyError('Error while getting pictures', {o: o, err: err}));

                if (res.count === 0) {
                    let o = {
                        command: 'modify',
                        object: 'data_individual',
                        params: {
                            id: data_individual_id,
                            has_pictures: false
                        }
                    };

                    _t.api(o, (err, res) => {
                        if (err) return cb(new MyError('Error while saving "Has pictures', {o: o, err: err}));

                        cb(null);
                    });
                } else {
                    cb(null);
                }
            });
        }
    }, (err, res) => {
        if (err) return cb(err);

        cb(null, res.remove);
    });
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

Model.prototype.addByList = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    var _t = this;
    var id = obj.data_individual_id;
    var pictures = obj.pictures;

    if (!pictures || pictures.length == 0) return cb(new MyError('Не переданы изображения',{obj:obj}));
    if (isNaN(+id)) return cb(new MyError('Не передан taxon_avalible_trait_id',{obj:obj}));

    async.eachSeries(pictures, function (item, cb) {
        async.waterfall([
            // addPicture
            cb => {
                _t.add_(item, (err, res) => {
                    if (err) return cb(new MyError('Не удалось получить data_individual_picture', {params: params, err: err}));
                    cb(null, res.id);
                });
            },
            // setText:
            (pic_id, cb) => {
                let params = {
                    id: pic_id
                };

                _t.resizeAndSetText(params, cb);
            }
        ], cb);
    }, (err, res) => {
        if (err) return err;

        cb(null, new UserOk('Saved!'));
    });
};

Model.prototype.modifyByList = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    obj.object = 'data_individual_picture';

    let o = {
        command: 'modifyByList',
        object: 'taxon_picture',
        params: obj
    };

    let _t = this;

    _t.api(o, (err, res) => {
	    cb(err, new UserOk("Saved"));
    });
};

Model.prototype.resizeAndSetText = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    obj.object = 'data_individual_picture';

    let o = {
        command: 'resizeAndSetText',
        object: 'taxon_picture',
        params: obj
    };

    let _t = this;

    _t.api(o, (err, res) => {
	    cb(err, new UserOk("Saved"));
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