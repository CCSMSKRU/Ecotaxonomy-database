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
var jimp = require('jimp');

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
	let _t = this;

	// If there are no author, copyright or source, set default
	if (!obj.author_id) obj.author_id = 1;
	if (!obj.copyright_id) obj.copyright_id = 1;
	if (!obj.pic_source_id) obj.pic_source_id = 1;

	_t.addPrototype(obj, cb);
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

Model.prototype.addByList = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    var _t = this;
    var id = obj.taxon_avalible_trait_id;
    var pictures = obj.pictures;

    if (!pictures || pictures.length == 0) return cb(new MyError('Не переданы изображения',{obj:obj}));
    if (isNaN(+id)) return cb(new MyError('Не передан taxon_avalible_trait_id',{obj:obj}));

    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

	async.eachSeries(pictures, function (item, cb) {
		async.waterfall([
			// addPicture
			cb => {
				_t.add_(item, (err, res) => {
					if (err) return cb(new MyError('Не удалось получить trait_picture', {params: params, err: err}));
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
		cb(err, new UserOk("Saved"));
	});
};

Model.prototype.modifyByList = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    obj.object = 'trait_picture';

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

    obj.object = 'trait_picture';

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

// var o = {
//     command:'msaccessImportPicture',
//     object:'Trait_picture'
// };
// socketQuery(o, function(res){
//     console.log(res);
// });

Model.prototype.msaccessImportPicture = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    var trait_picture_obj_msaccess = {};
    var picture_type_obj_msaccess = {};
    var trait_obj_msaccess = {};
    var errors = [];
    var e_obj;
    async.series({
        get:function(cb){
            var params = {
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить trait_picture',{params : params, err : err}));
                for (var i in res) {
                    trait_picture_obj_msaccess[res[i].msaccess_trait_picture_id] = res[i];
                }
                cb(null);
            });
        },
        getPictureType:function(cb){
            var o = {
                command:'get',
                object:'Picture_type',
                params:{
                    collapseData:false,
                    limit:10000
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить picture_type',{o : o, err : err}));
                for (var i in res) {
                    if(!picture_type_obj_msaccess[res[i].msaccess_picture_type_id]) picture_type_obj_msaccess[res[i].msaccess_picture_type_id] = res[i];
                }
                cb(null);
            });

        },
        getTraits:function(cb){
            var o = {
                command:'get',
                object:'Taxon_avalible_trait',
                params:{
                    collapseData:false,
                    limit:1000000000
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить traits',{o : o, err : err}));
                for (var i in res) {
                    if(!trait_obj_msaccess[res[i].msaccess_trait_id]) trait_obj_msaccess[res[i].msaccess_trait_id] = res[i];
                }
                cb(null);
            });
        },
        getMSAccess:function(cb){
            var q = 'select * from `Trait_pictures`';
            msAccess.query({q:q}, function(err, res){
                if (err) return cb(new MyError('Не удалось получить trait_picture из внешней базы',{err:err, q:q}));
                for (var i in res) {
                    if (!trait_picture_obj_msaccess[res[i].Traitpicture_ID]) {
                        trait_picture_obj_msaccess[res[i].Traitpicture_ID] = {
                            to_add:true
                        }
                    }
                    trait_picture_obj_msaccess[res[i].Traitpicture_ID].msaccess_trait_picture = res[i];
                }
                cb(err, res);
            })
        },
        add:function(cb){
            async.eachSeries(trait_picture_obj_msaccess, function(item, cb){
                if (!item.to_add) return cb(null);
                if (!picture_type_obj_msaccess[item.msaccess_trait_picture.Picture_type_ID]) {
                    e_obj = {
                        msg:'Для этого изображения нет типа (в справочнике).',
                        picture:item.msaccess_trait_picture
                    };
                    console.log(e_obj);
                    errors.push(e_obj);
                    return cb(null);

                }
                if (!trait_obj_msaccess[item.msaccess_trait_picture.Trait_ID]) {
                    e_obj = {
                        msg:'Для этого изображения нет трейта. Не будет импортировано',
                        picture:item.msaccess_trait_picture
                    };
                    console.log(e_obj);
                    errors.push(e_obj);
                    return cb(null);
                }
                var params = {
                    taxon_avalible_trait_id:trait_obj_msaccess[item.msaccess_trait_picture.Trait_ID].id,
                    name:item.msaccess_trait_picture.Traitpicture_name,
                    msaccess_trait_picture_id:item.msaccess_trait_picture.Traitpicture_ID,
                    description:item.msaccess_trait_picture.Picture_description,
                    picture_type_id:picture_type_obj_msaccess[item.msaccess_trait_picture.Picture_type_ID].id,
                    rollback_key:rollback_key
                };
                _t.add(params, function (err, res) {
                    if (err) return cb(new MyError('Не удалось добавить trait_picture',{params : params, err : err}));
                    cb(null);
                });

            }, cb);
        }
    },function (err, res) {
        if (err) {
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'msaccessImportPicture', params:obj});
            }
            var msg = (errors.length)? 'Готово. Некоторые изображения не были импортированы' : 'Готово';
            cb(null, new UserOk(msg, {errors:errors}));
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