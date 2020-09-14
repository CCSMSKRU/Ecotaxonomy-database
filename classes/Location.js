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


// var o = {
//     command:'msaccessImportLocation',
//     object:'Location'
// };
// socketQuery(o, function(res){
//     console.log(res);
// });
Model.prototype.msaccessImportLocation = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

    // Загрузить существующие (по msaccess_location_id)
    // загрузить статусы (по sysname)
    // загрузить уровни (по msaccess_location_level_id)
    // Загрузить локации из внешней базы
    // Смерджить, кого на добавление по msaccess_location_id
    // Добавить


    var location_obj_msaccess = {};
    var location_status_obj_sysname = {};
    var location_level_obj_msaccess = {};

    async.series({
        get:function(cb){
            var params = {
                limit:100000000,
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить Location',{params : params, err : err}));
                for (var i in res) {
                    location_obj_msaccess[res[i].msaccess_location_id] = res[i];
                }
                cb(null);
            });
        },
        getStatuses:function(cb){
            var o = {
                command:'get',
                object:'Location_status',
                params:{
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось Location_status',{o : o, err : err}));
                for (var i in res) {
                    location_status_obj_sysname[res[i].sysname] = res[i];
                }
                cb(null);
            });
        },
        getLevels:function(cb){
            var o = {
                command:'get',
                object:'Location_level',
                params:{
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось Location_level',{o : o, err : err}));
                for (var i in res) {
                    location_level_obj_msaccess[res[i].msaccess_location_level_id] = res[i];
                }
                cb(null);
            });
        },
        getExternal:function(cb){
            var q = 'select * from `Location_system (TDWG)` order by Location_level_ID';
            msAccess.query({q:q}, function(err, res){
                if (err) return cb(new MyError('Не удалось получить location из внешней базы',{err:err, q:q}));
                for (var i in res) {
                    if (!location_obj_msaccess[res[i].Location_ID]) {
                        location_obj_msaccess[res[i].Location_ID] = {
                            to_add:true
                        }
                    }
                    location_obj_msaccess[res[i].Location_ID].msaccess_location = res[i];

                    // Если найдем, проставим парент (если еще не проставлен)
                    if (location_obj_msaccess[res[i].Location_ID].parent_id) continue;
                    if (location_obj_msaccess[res[i].Parental_location_ID]){
                        location_obj_msaccess[res[i].Location_ID].parent_id = location_obj_msaccess[res[i].Parental_location_ID].id;
                        if (!location_obj_msaccess[res[i].Location_ID].to_add){
                            location_obj_msaccess[res[i].Location_ID].to_modify = true;
                        }
                    }
                }
                cb(err, res);
            })
        },
        add:function(cb){
            async.eachSeries(location_obj_msaccess, function(item, cb){
                if (!item.to_add) return cb(null);
                var params = {
                    msaccess_location_id:item.msaccess_location.Location_ID,
                    name:item.msaccess_location.Location_name,
                    parent_id:item.parent_id,
                    status_id:(location_status_obj_sysname[item.msaccess_location.status])? location_status_obj_sysname[item.msaccess_location.status].id : null,
                    level_id:(location_level_obj_msaccess[item.msaccess_location.Location_level_ID])? location_level_obj_msaccess[item.msaccess_location.Location_level_ID].id : null,
                    L_code:item.msaccess_location.L_code,
                    ISOCode:item.msaccess_location.ISOCode,
                    notes:item.msaccess_location.Notes,
                    rollback_key:rollback_key
                };
                _t.add(params, function (err, res) {
                    if (err) return cb(new MyError('Не удалось добавить Location',{params : params, err : err}));
                    cb(null);
                });
            }, cb);
        },
        modify:function(cb){
            async.eachSeries(location_obj_msaccess, function(item, cb){
                if (!item.to_modify) return cb(null);
                var params = {
                    id:item.id,
                    parent_id:item.parent_id,
                    rollback_key:rollback_key
                };
                _t.modify(params, function (err, res) {
                    if (err) return cb(new MyError('Не удалось изменить Location (установить parent_id)',{params : params, err : err}));
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
            //if (!doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'msaccessImportLocation', params:obj});
            //}
            cb(null, new UserOk('Ок'));
        }
    });
};


Model.prototype.serachForSelect = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}
	var _t = this;

	var results;

	async.series({
		get: function (cb) {
			var params = {
				columns: ['id', 'name'],
				where: [],
				collapseData: false,
				limit: obj.limit,
				page_no: obj.page_no
			};
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
    var location;
    var childs;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить локацию.',{id:id,err:err}));
                location = res[0];
                cb(null);
            });
        },
        gatChilds:function(cb){
            if (!location) return cb(new MyError('локации не существует.',{obj:obj}));
            var params = {
                param_where:{
                    parent_id:location.id
                },
                sort:{
                    columns:['name'],
                    directions:['ASC']
                },
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить детей локации',{params : params, err : err}));
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
                id:location.id,
                name:location.name,
                name_with_id:location.name_with_id,
                text:location.name,
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
            //     id:location.id,
            //     name:location.name,
            //     name_with_id:location.name_with_id,
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
            if (!location.parent_id) return cb(null);
            var params = {
                id:location.parent_id,
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