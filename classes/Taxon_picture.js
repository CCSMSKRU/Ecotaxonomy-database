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
var sharp = require('sharp');
// First install python 3
// Если не достаточно, то вероятно Visual Studio и прочее
// To install on Win64 (https://github.com/nodejs/node-gyp#installation)
// https://github.com/felixrieseberg/windows-build-tools



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

    var rollback_key = obj.rollback_key || rollback.create();
    var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

	// If there are no author, copyright or source, set default
    // if (!obj.author_id) obj.author_id = 1;
	// if (!obj.copyright_id) obj.copyright_id = 1;
	// if (!obj.pic_source_id) obj.pic_source_id = 1;

    var author_obj = (obj.author)? (function(){
        var a = obj.author.split(' ');
        return {
            firstname:a[0] || '',
            lastname:a[1] || '',
            midname:a[2] || '',
        }
    })() : null;

    async.series({
        author:function(cb){
            if (obj.author_id) return cb(null);
            // Получить автора по user_id или создать и получить
            async.series({
                getbyFIO:function(cb){
                    if (!author_obj) return cb(null);

                    var o = {
                        command:'get',
                        object:'author',
                        params:{
                            param_where:{
                                firstname:author_obj.firstname,
                                lastname:author_obj.lastname,
                                midname:author_obj.midname
                            },
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить автора по fio',{o : o, err : err}));
                        if (!res.length) return cb(null);
                        if (res.length > 1){
                            console.warn('WARNING', 'Количество авторов привязанных к одному и тому же fio более одного',{o:o, res:res});
                        }
                        obj.author_id = res[0].id;
                        cb(null);
                    });
                },
                getbyUserId:function(cb){
                    if (obj.author_id || author_obj) return cb(null);
                    var o = {
                        command:'get',
                        object:'author',
                        params:{
                            param_where:{
                                user_id:_t.user.user_data.id
                            },
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить автора по user_id',{o : o, err : err}));
                        if (!res.length) return cb(null);
                        if (res.length > 1){
                            console.warn('WARNING', 'Количество авторов привязанных к одному и тому же пользователю более одного',{o:o, res:res});
                        }
                        obj.author_id = res[0].id;
                        cb(null);
                    });
                },
                createIfNotExist:function(cb) {
                    if (obj.author_id) return cb(null);

                    var o = {
                        command: 'add',
                        object: 'author',
                        params: {
                            user_id: (author_obj) ? null : _t.user.user_data.id,
                            firstname: (author_obj) ? author_obj.firstname : _t.user.user_data.firstname,
                            lastname: (author_obj) ? author_obj.lastname : _t.user.user_data.lastname,
                            midname: (author_obj) ? author_obj.midname : _t.user.user_data.midname,
                            description: 'Created automatically when create the taxon picture.',
                            rollback_key: rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось создать автора на основе текущего пользователя', {o: o,err: err}));
                        obj.author_id = res.id;
                        cb(null);
                    });
                }
            }, cb);
        },
        copyright:function(cb){
            if (obj.copyright_id) return cb(null);
            async.series({
                getDefault:function(cb){
                    var o = {
                        command:'getDefault',
                        object:'Copyright',
                        params:{}
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new UserError('Failed to get default entry for "Copyright"',{o : o, err : err}));
                        obj.copyright_id = res.id;
                        cb(null);
                    });
                }
            }, cb);

        },
        pic_source:function(cb){
            if (obj.pic_source_id) return cb(null);
            async.series({
                getDefault:function(cb){
                    var o = {
                        command:'getDefault',
                        object:'pic_source',
                        params:{}
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new UserError('Failed to get default entry for "Picture source"',{o : o, err : err}));
                        obj.pic_source_id = res.id;
                        cb(null);
                    });
                }
            }, cb);

        },
        addProto:function(cb){
            _t.addPrototype(obj, function(err, res){
                if (err) return cb(new MyError('addPrototype вызвало ош. ', {name:_t.name, obj:obj, err:err}));
                obj.id = res.id;
                cb(null, res);
            });
        },
	    ifIsMain: cb => {
        	if (!obj.is_main_picture) return cb(null);

        	let params = {
        		taxon_id: obj.taxon_id,
		        id: obj.id,
		        type: 'taxon'
	        };

		    _t.setAsMain(params, function(err, res){
			    if (err) return cb(new MyError('Error while setAsMain', {params, err}));
			    cb(null, res);
		    });
	    },
    }, function(err, res){
        if (err) {
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            //if (!doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            //}
            cb(null, res.addProto);
        }
    });
};

// var o = {
//     command:'updateAuthors',
//     object:'Taxon_picture',
//     params:{
//     }
// };
// socketQuery(o, function(res){
//     console.log(res);
// });
Model.prototype.updateAuthors = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	let rollback_key = obj.rollback_key || rollback.create();

	let taxon_ids;
	let locations_ids;
	let pics_ids;

	async.series({
		getTaxonChildIds: function (cb) {
			let taxon_id_tmp = 434624;

			let o = {
			    command: 'getChildIds',
			    object: 'taxon',
			    params: {
				    id: taxon_id_tmp // Collembola
			    }
			};

			_t.api(o, function (err, res) {
				if (err) return cb(new MyError('Error while getting taxon children ids', {o, err}));
				taxon_ids = [taxon_id_tmp].concat(res.ids);
				cb(null);
			});
		},
		getLocationsChildrenIds: cb => {
			let locations_ids_tmp = [2091, 2085];

			let o = {
			    command: 'getChildIds',
			    object: 'location',
			    params: {
				    id: locations_ids_tmp //Northern America, Europe
			    }
			};

			_t.api(o, function (err, res) {
				if (err) return cb(new MyError('Error while getting location children ids', {o, err}));
				locations_ids = locations_ids_tmp.concat(res.ids);
				cb(null);
			});
		},
		getTaxonWithLocations: cb => {
			let o = {
			    command: 'get',
			    object: 'taxon_location',
			    params: {
			        where: [
				        {
				        	key: 'taxon_id',
					        type: 'in',
					        val1: taxon_ids
				        },
				        {
				        	key: 'location_id',
					        type: 'in',
					        val1: locations_ids
				        }
			        ],
				    collapseData: false
			    }
			};

			_t.api(o, function (err, res) {
				if (err) return cb(new MyError('Error while getting taxons locations', {o, err}));
				taxon_ids = res.map(row => row.taxon_id);
				cb(null);
			});
		},
		getPics: function (cb) {
			let params = {
				param_where: {
					author_id: 16 // Anton
				},
				where: [
					{
						key: 'id',
						type: 'in',
						val1: taxon_ids
					}
				],
				collapseData: false,
				limit: 1000000
			};

			_t.get(params, function (err, res) {
				if (err) return cb(new MyError('Error while getting', {params: params, err: err}));
				pics_ids = res.map(row => row.id);
				cb(null);
			});
		},
		update: cb => {
			async.eachSeries(pics_ids, (id, cb) => {
				let params = {
					rollback_key,
					id,
					author_id: 9 // Laura Jeane-Leonard
				};

				_t.modifyPrototype(params, (err, res) => {
					if (err) return cb(new MyError('Error while updating', {params: params, err: err}));
					cb(null);
				});
			}, cb);
		}
	}, function (err, res) {
		if (err) return cb(err);
		rollback.save({rollback_key: rollback_key, user: _t.user, name: _t.name, name_ru: _t.name_ru || _t.name, method: 'updateAuthors', params: obj});
		cb(null, new UserOk('ok', { pics_ids }));
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

Model.prototype.removeCascade = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    let _t = this

	let picture

	async.series({
		get: cb => {
			_t.getById({ id: obj.id }, (err, res) => {
				if (err) return cb(new MyError('Error while getById', { id: obj.id, err: err }))
				if (res[0])
					picture = res[0]
				cb(null)
			})
		},
		removeCascadePrototype: cb => {
			_t.removeCascadePrototype(obj, function (err, res) {
				if (err) return cb(new MyError('Error while removeCascadePrototype', { name: _t.name, obj: obj, err: err }))
				cb(null)
			})
		},
		ifIsMain: cb => {
			let newMain

			async.series({
				isAnotherMain: cb => {
					let o = {
						command: 'get',
						object: 'taxon_picture',
						params: {
							param_where: {
								taxon_id: picture.taxon_id,
								is_main_picture: true
							},
							collapseData: false
						}
					}

					_t.api(o, (err, res) => {
						if (err) return cb(new MyError('Error while checking',{o: o, err: err}));

						if (res.length)
							return cb('another_main')

						cb(null)
					})
				},
				getAnotherPic: cb => {
					let o = {
						command: 'get',
						object: 'taxon_picture',
						params: {
							param_where: {
								taxon_id: picture.taxon_id,
							},
							collapseData: false
						}
					}

					_t.api(o, (err, res) => {
						if (err) return cb(new MyError('Error while getting others',{o: o, err: err}));
						if (res.length)
							newMain = res[0]
						cb(null)
					})
				},
				setNewMain: cb => {
					if (!newMain) return cb(null)

					let o = {
						command: 'modify',
						object: 'taxon_picture',
						params: {
							id: newMain.id,
							is_main_picture: true
						}
					}

					_t.api(o, (err, res) => {
						if (err) return cb(new MyError('Error while saving new main',{o: o, err: err}));
						cb(null)
					})
				},
				findMainPicture: cb => {
					let o = {
						command: 'setMainPictures',
						object: 'taxon_picture',
						params: {
							id: picture.taxon_id
						}
					}

					_t.api(o, (err, res) => {
						if (err) return cb(new MyError('Error while findMainPicture',{o: o, err: err}));
						cb(null)
					})
				}
			}, (err) => {
				if (err && err !== 'another_main')
					return cb(err)
				cb(null)
			})
		},
	}, function (err, res) {
		if (err) return cb(err)
		return cb(null, new UserOk('noToastr'))
	});
};

// var o = {
//     command:'setMainPictures',
//     object:'Taxon_picture',
//     params:{
//     }
// };
// socketQuery(o, function(res){
//     console.log(res);
// });
Model.prototype.setMainPictures = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	let rollback_key = obj.rollback_key || rollback.create();

	let pics = {};

	let ids_no_pics;
	let ids;
	let n = 0
	async.series({
		getTaxaWithPics: cb => {
			let o = {
				command: 'get',
				object: 'taxon_picture',
				params: {
					columns: ['taxon_id'],
					groupBy: ['taxon_id'],
					limit: 10000000000,
					collapseData: false
				}
			};

			_t.api(o, (err, res) => {
				if (err) return cb(err);
				ids_no_pics = res.map(row => {
					return row.taxon_id;
				});
				cb(null);
			});
		},
		getTaxaWithoutPics: cb => {
			let o = {
				command: 'get',
				object: 'taxon',
				params: {
					columns: ['id'],
					where: [
						{
							key: 'id',
							type: 'notIn',
							val1: ids_no_pics
						}
					],
					limit: 10000000000,
					collapseData: false
				}
			};

			if (obj.id)
				o.params.param_where = { id: obj.id }

			_t.api(o, (err, res) => {
				if (err) return cb(err);
				ids = res.map(row => {
					return row.id;
				});
				cb(null);
			});
		},
		findPics: cb => {
			async.eachSeries(ids, (id, cb) => {
				let sy_ids;
				let ch_ids;
				let found = false;
				async.series({
					getSynonymsIds: function (cb) {
						let o = {
							command: 'get',
							object: 'taxon',
							params: {
								columns: ['id', 'actual_taxon_id'],
								param_where: {
									actual_taxon_id: id
								},
								collapseData: false
							}
						};

						_t.api(o, function (err, res) {
							if (err) return cb(new MyError('Error while getting synonyms ids', {params: params, err: err}));
							sy_ids = res.map(row => {
								return row.id;
							});
							cb(null);
						});
					},
					getPictures: function (cb) {
						if (!sy_ids || !sy_ids.length) return cb(null);

						let o = {
							command: 'get',
							object: 'taxon_picture',
							params: {
								where: [
									{
										key: 'taxon_id',
										type: 'in',
										val1: sy_ids
									},
									{
										key: 'is_main_picture',
										type: '=',
										val1: true
									}
								],
								limit: 1,
								collapseData: false
							}
						};

						_t.api(o, (err, res) => {
							if (err) return cb(new MyError('Не удалось получить изображение', {o: o, err: err}));
							if (res.length) {
								pics[id] = res[0];
								found = true;
							}
							cb(null);
						});

					},
					getChildrenIds: function (cb) {
						if (found) return cb(null);

						let o = {
							command: 'getChildIds',
							object: 'taxon',
							params: {
								id: id
							}
						};

						_t.api(o, function (err, res) {
							if (err) return cb(new MyError('Не удалось получить getChildIds', {params: params, err: err}));
							ch_ids = res.ids;
							cb(null);
						});
					},
					getPictures2: function (cb) {
						if (!ch_ids || !ch_ids.length) return cb(null);

						let o = {
							command: 'get',
							object: 'taxon_picture',
							params: {
								where: [
									{
										key: 'taxon_id',
										type: 'in',
										val1: ch_ids
									},
									{
										key: 'is_main_picture',
										type: '=',
										val1: true
									}
								],
								limit: 1,
								collapseData: false
							}
						};

						_t.api(o, (err, res) => {
							if (err) return cb(new MyError('Не удалось получить изображение', {o: o, err: err}));
							if (res.length) {
								pics[id] = res[0];
							}
							cb(null);
						})
					}
				}, cb);
			}, () => {
				cb(null);
			});
		},
		addPics: cb => {
			async.eachSeries(Object.keys(pics), (taxon_id, cb) => {
				let pic = pics[taxon_id];

				let o = {
					command: 'add',
					object: 'taxon_picture',
					params: {
						rollback_key,
						taxon_id: taxon_id,
						is_main_picture: true,
						author_id: pic.author_id,
						copyright_id: pic.copyright_id,
						description: pic.description,
						external_id: pic.external_id,
						name: pic.name,
						name_mini: pic.name_mini,
						name_original: pic.name_original,
						name_small: pic.name_small,
						picture_type_id: pic.picture_type_id,
						pic_source_id: pic.pic_source_id,
						show_on_site: true
					}
				};

				_t.api(o, (err, res) => {
					if (err) return cb(err);
					n++
					cb(null);
				});
			}, cb);
		}
	}, (err, res) => {
		rollback.save({rollback_key: rollback_key, user: _t.user, name: _t.name, name_ru: _t.name_ru || _t.name, method: 'setMainPictures', params: obj});
		cb(err, new UserOk('ok', n));
	});
};

Model.prototype.setAsMain = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	let _t = this;

	var rollback_key = obj.rollback_key || rollback.create();
	var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

	var taxon_id = +obj.taxon_id;
	var pic_id = +obj.id;
	var type = obj.type;

	if (!type) return cb(new MyError('Not found "type"', {obj: obj}));
	if (isNaN(+taxon_id)) return cb(new MyError('Not found "taxon_id"', {obj: obj}));
	if (isNaN(+pic_id)) return cb(new MyError('Not found "id"', {obj: obj}));

	let taxon_pics_ids;
	let pic;

	async.series({
		getPic: cb => {
		    let o = {
		        command: 'get',
		        object: type + '_picture',
		        params: {
		        	param_where: {
				        id: pic_id
			        },
			        collapseData: false
		        }
		    };

			_t.api(o, (err, res) => {
				if (err) return cb(err);
				if (res.length) {
					pic = res[0];
					cb(null);
				} else {
					cb(new UserError('Picture not found'));
				}
			});
		},
		getTaxonPics: cb => {
			let o = {
				command: 'get',
				object: 'taxon_picture',
				params: {
					columns: ['id', 'taxon_id', 'is_main_picture'],
					param_where: {
						taxon_id: taxon_id,
						is_main_picture: true
					},
					collapseData: false
				}
			};

			_t.api(o, (err, res) => {
				if (err) return cb(err);
				taxon_pics_ids = res.map(row => {
					return row.id;
				});
				cb(null);
			});
		},
		makePicsNotMain: cb => {
			async.eachSeries(taxon_pics_ids, (id, cb) => {
				let o = {
				    command: 'modify',
				    object: 'taxon_picture',
				    params: {
				        id: id,
					    is_main_picture: false,
					    rollback_key
				    }
				};

				_t.api(o, cb);
			}, cb);
		},
		setMainPic_myPic: cb => {
		    if (!pic || !(type === 'taxon' && pic.taxon_id === taxon_id)) return cb(null);

		    let o = {
		        command: 'modify',
		        object: 'taxon_picture',
		        params: {
		            id: pic.id,
			        is_main_picture: true,
			        rollback_key
		        }
		    };

			_t.api(o, (err, res) => {
			    pic = null;
			    cb(err, res);
			});
		},
		setMainPic_notMy: cb => {
			if (!pic) return cb(null);

			let o = {
				command: 'add',
				object: 'taxon_picture',
				params: {
					taxon_id: taxon_id,
					is_main_picture: true,
					author_id: pic.author_id,
					copyright_id: pic.copyright_id,
					description: pic.description,
					external_id: pic.external_id,
					name: pic.name,
					name_mini: pic.name_mini,
					name_original: pic.name_original,
					name_small: pic.name_small,
					picture_type_id: pic.picture_type_id,
					pic_source_id: pic.pic_source_id,
					show_on_site: true,
					rollback_key
				}
			};

			_t.api(o, cb);
		}
	}, (err, res) => {
		if (err) {
			rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
				return cb(err, err2);
			});
		} else {
			//if (!doNotSaveRollback){
			//    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
			//}
			return cb(null, new UserOk('noToastr'));
		}
	});
};

Model.prototype.addByList = function (obj, cb) {
	if (arguments.length == 1) {
		cb = arguments[0];
		obj = {};
	}

	var _t = this;
	var id = obj.taxon_id;
	var pictures = obj.pictures;

	if (!pictures || pictures.length == 0) return cb(new MyError('Не переданы изображения', {obj: obj}));
	if (isNaN(+id)) return cb(new MyError('Не передан taxon_id', {obj: obj}));

	var rollback_key = obj.rollback_key || rollback.create();
	var doNotSaveRollback = obj.doNotSaveRollback || !!obj.rollback_key;

	async.eachSeries(pictures, function (item, cb) {
		item.author_id = (!isNaN(+item.author_id)) ? +item.author_id : null

		let another_main

		async.series({
			addPicture: cb => {
				_t.add_(item, (err, res) => {
					if (err) return cb(new MyError('Не удалось получить taxon_picture', { params: item, err: err }))
					item.id = res.id
					cb(null)
				})
			},
			setText: (cb) => {
				let params = {
					id: item.id
				}

				_t.resizeAndSetText(params, cb)
			},
			getItem_ifIsMain: cb => {
				if (!item.is_main_picture) return cb(null)

				let o = {
					command: 'get',
					object: 'taxon_picture',
					params: {
						param_where: {
							taxon_id: item.taxon_id,
							is_main_picture: true
						},
						where: [{
							key: 'id',
							type: '!=',
							val1: [item.id]
						}],
						collapseData: false
					}
				}

				_t.api(o, (err, res) => {
					if (err) return cb(new MyError('Error while getting others',{o: o, err: err}));
					if (res.length)
						another_main = res[0]
					cb(null)
				})
			},
			fireMain_ifIsMain: cb=> {
				if (!another_main) return cb(null)

				let o = {
					command: 'modify',
					object: 'taxon_picture',
					params: {
						id: another_main.id,
						is_main_picture: false
					}
				}

				_t.api(o, (err, res) => {
					if (err) return cb(new MyError('Error while firing main',{o: o, err: err}));
					cb(null)
				})
			},
			ifIsNotMain: cb => {
				if (item.is_main_picture) return cb(null)

				async.series({
					isAnotherMain: cb => {
						let o = {
							command: 'get',
							object: 'taxon_picture',
							params: {
								param_where: {
									taxon_id: item.taxon_id,
									is_main_picture: true
								},
								collapseData: false
							}
						}

						_t.api(o, (err, res) => {
							if (err) return cb(new MyError('Error while checking',{o: o, err: err}));

							if (res.length)
								return cb('another_main')

							cb(null)
						})
					},
					setNewMain: cb => {
						let o = {
							command: 'modify',
							object: 'taxon_picture',
							params: {
								id: item.id,
								is_main_picture: true
							}
						}

						_t.api(o, (err, res) => {
							if (err) return cb(new MyError('Error while saving new main',{o: o, err: err}));
							cb(null)
						})
					}
				}, (err) => {
					if (err && err !== 'another_main')
						return cb(err)
					cb(null)
				})
			}
		}, cb)
	}, function(err, res){
		if (err) return cb(err);
		return cb(null, new UserOk('noToastr'));
	});
};

Model.prototype.modifyByList = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    var _t = this;
    var pictures = obj.pictures;

    if (!pictures || pictures.length === 0) return cb(new MyError('Не переданы изображения',{obj:obj}));

    async.eachSeries(pictures, function (item, cb) {
        let picture;
	    let hasChanges = false
	    let itWasMain = false
	    let itIsMain = false

        async.series({
            getPic: cb => {
                let o = {
                    command: 'get',
                    object: obj.object || 'taxon_picture',
                    params: {
                        param_where: {
                            id: item.id
                        },
                        collapseData: false
                    }
                };

                _t.api(o, (err, res) => {
                    if (err || !res.length) return cb(new MyError('Error while getting image',{o: o, err: err}));

                    picture = res[0];

	                if (picture.author_id !== +item.author_id) hasChanges = true
	                if (picture.copyright_id !== +item.copyright_id) hasChanges = true
	                if (picture.pic_source_id !== +item.pic_source_id) hasChanges = true
	                if (picture.is_main_picture && !item.is_main_picture) itWasMain = true
	                if (item.is_main_picture && !picture.is_main_picture) itIsMain = true

                    cb(null);
                });
            },
            modify: cb => {
                let o = {
                    command: 'modifyPrototype',
                    object: obj.object || 'taxon_picture',
                    params: item
                };

                _t.api(o, cb);
            },
            updateTextOnPic: cb => {
                if (!hasChanges) return cb(null);

                _t.setText({
                    pic_name: picture.name_original,
                    pic_name_save: picture.name,
                    author: picture.author,
                    pic_source: picture.pic_source,
                    copyright_sys: picture.copyright_sys
                }, cb);
            },
	        updateIfItWasMain: cb => {
            	if (obj.object && obj.object !== 'taxon_picture') return cb(null)

            	let newMain
		        let another_main

            	async.series({
		            isAnotherMain: cb => {
		                let o = {
			                command: 'get',
			                object: obj.object || 'taxon_picture',
		                    params: {
		                        param_where: {
			                        taxon_id: picture.taxon_id,
			                        is_main_picture: true
		                        },
			                    collapseData: false
		                    }
		                }

		                _t.api(o, (err, res) => {
			                if (err) return cb(new MyError('Error while checking',{o: o, err: err}));

			                if (res.length)
			                	if (itWasMain)
					                return cb('another_main')
			                    else
			                    	another_main = res[0]

			                cb(null)
		                })
		            },
		            getAnotherPic: cb => {
		            	if (itIsMain) return cb(null)

			            let o = {
				            command: 'get',
				            object: 'taxon_picture',
				            params: {
				            	param_where: {
						            taxon_id: picture.taxon_id,
					            },
					            where: [{
						            key: 'id',
						            type: '!=',
						            val1: [picture.id]
					            }],
					            collapseData: false
				            }
			            }

			            _t.api(o, (err, res) => {
				            if (err) return cb(new MyError('Error while getting others',{o: o, err: err}));
				            if (res.length)
				            	newMain = res[0]
				            cb(null)
			            })
		            },
		            setNewMain_ifWasMain: cb => {
		                if (!newMain) return cb(null)

			            let o = {
			                command: 'modify',
				            object: obj.object || 'taxon_picture',
			                params: {
			                    id: newMain.id,
				                is_main_picture: true
			                }
			            }

			            _t.api(o, (err, res) => {
				            if (err) return cb(new MyError('Error while saving new main',{o: o, err: err}));
				            cb(null)
			            })
		            },
		            fireMain_ifAnotherMain: cb => {
			            if (!another_main) return cb(null)

			            let o = {
				            command: 'modify',
				            object: obj.object || 'taxon_picture',
				            params: {
					            id: another_main.id,
					            is_main_picture: false
				            }
			            }

			            _t.api(o, (err, res) => {
				            if (err) return cb(new MyError('Error while firing main',{o: o, err: err}));
				            cb(null)
			            })
		            }
	            }, (err) => {
            		if (err && err !== 'another_main')
            			return cb(err)
		            cb(null)
	            })
	        }
        }, cb);
    }, function (err) {
	    if (err) return cb(err)
	    return cb(null, new UserOk('noToastr'))
    });
};

Model.prototype.setText = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    let pic_name_get = obj.pic_name;
    if (!pic_name_get) return cb(new MyError('Не передан pic_name',{obj:obj}));
    let pic_name_save = obj.pic_name_save || pic_name_get;
    let author = obj.author;
    if (!author) return cb(new MyError('Не передан author',{obj:obj}));
    let pic_source = obj.pic_source;
    if (!pic_source) return cb(new MyError('Не передан pic_source',{obj:obj}));
    let copyright_sys = obj.copyright_sys;
    if (!copyright_sys) return cb(new MyError('Не передан copyright_sys',{obj:obj}));

    let save_dest = './public/upload/Taxon_pictures/';

    try {
	    jimp.read(save_dest + pic_name_get).then(org_image => {
		    let org_width = org_image.bitmap.width;
		    let org_height = org_image.bitmap.height;

		    let textData = {
			    maxWidth: org_width,
			    maxHeight: 500,
			    placementX: 10,
			    placementY: 5,
			    font: 'FONT_SANS_16_BLACK',
			    lines: []
		    };

		    if (org_width <= 300) {
			    textData.maxWidth = 300;
			    textData.font = 'FONT_SANS_12_BLACK'
		    } else if (org_width > 1920) {
			    textData.font = 'FONT_SANS_32_BLACK'
		    }

		    if (author && author.trim().length > 0)
			    textData.lines.push({ text: 'Author: ' + author });

		    if (pic_source && pic_source.trim().length > 0)
			    textData.lines.push({ text: 'Source: ' + pic_source });

		    if (copyright_sys && copyright_sys.trim().length > 0)
			    textData.lines.push({ text: 'License: ' + copyright_sys });

		    let new_org_width = textData.maxWidth;
		    let new_org_height;

		    async.series({
			    countHeight: cb => {
			    	if (textData.lines.length) {
					    jimp.loadFont(jimp[textData.font])
						    .then((font) => {
							    let y = 0;

							    textData.lines.forEach(row => {
								    let height = jimp.measureTextHeight(font, row.text,
									    textData.maxWidth - textData.placementX * 2);

								    row.height = height + textData.placementY;
								    y += row.height;
							    });

							    textData.maxHeight = y + textData.placementX;
							    new_org_height = org_height + textData.maxHeight;

							    cb(null);
						    })
						    .catch(err => {
							    console.error('Error', err);

							    cb(err);
						    });
				    } else
				    	new_org_height = org_height;
			    },
			    draw: cb => {
				    new jimp(new_org_width, new_org_height, '#ffffff', (err, new_image) => {
					    new jimp(textData.maxWidth, textData.maxHeight, '#FFFFFF', (err, label) => {
						    jimp.loadFont(jimp[textData.font])
							    .then(font => {
								    let y = 0;

								    textData.lines.forEach(row => {
									    label.print(font, textData.placementX, y + textData.placementY, {
										    text: row.text,
										    alignmentX: jimp.HORIZONTAL_ALIGN_LEFT,
										    alignmentY: jimp.VERTICAL_ALIGN_TOP
									    }, textData.maxWidth, textData.maxHeight);

									    y += row.height;
								    });

								    new_image.composite(label, 0, 0);
								    return new_image
							    })
							    .then(new_image => {
								    let left = new_org_width > org_width ? Math.floor((new_org_width - org_width) / 2) : 0;

								    new_image
									    .composite(org_image, left, textData.maxHeight)
									    .quality(100)
									    .write(save_dest + pic_name_save);

								    cb(null);
							    })
							    .catch(err => {
								    console.error('Error', err);

								    cb(err);
							    });
					    });
				    });
			    }
		    }, cb);
	    });
    } catch (e) {
	    cb(e);
    }
};

Model.prototype.resizeAndSetText = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    let _t = this;

    let id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    let picture;

    let photo;
    let save_dest = './public/upload/Taxon_pictures/';
    let size_for_view = 1200;
    let size_for_list = 500;
    let sizes_for_view = [];
    let sizes_for_list = [];

    async.series({
        getImageName: cb => {
            let o = {
                command: 'get',
                object: obj.object || 'taxon_picture',
                params: {
                    param_where: {
                        id: id
                    },
                    collapseData: false
                }
            };

            _t.api(o, (err, res) => {
                if (err) return cb(new MyError('Error while getting picture', {o: o, err: err}));

                if (res && res.length) picture = res[0];

                cb(null);
            });
        },
        resize: cb => {
            let name = picture.name;
            let ext_dot = name.lastIndexOf('.');
            let image_name = name.substr(0, ext_dot);
            let image_ext = name.substr(ext_dot + 1);

            try {
	            let sharp_image = sharp(save_dest + name);
	            photo = {
		            name: image_name + '_upload.' + image_ext,
		            name_small: image_name + '_view.' + image_ext,
		            name_mini: image_name + '_list.' + image_ext
	            };

	            async.series({
		            getSizes: cb => {
			            sharp_image
				            .metadata()
				            .then(info => {
					            if (info && info.width > 0 && info.height > 0) {
						            if (info.width > size_for_view || info.height > size_for_view) {
							            let isWidthWider = info.width > info.height;
							            let k = (isWidthWider ? info.width : info.height) / size_for_view;
							            sizes_for_view.push(parseInt(info.width / k));
							            sizes_for_view.push(parseInt(info.height / k));
						            }
						            if (info.width > size_for_list || info.height > size_for_list) {
							            let isWidthWider = info.width > info.height;
							            let k = (isWidthWider ? info.width : info.height) / size_for_list;
							            sizes_for_list.push(parseInt(info.width / k));
							            sizes_for_list.push(parseInt(info.height / k));
						            }

						            cb(null);
					            } else {
						            return cb(new MyError('Неверные размеры фото', {info: info}));
					            }
				            })
				            .catch((err) => {
					            console.error(err);
					            return cb(err);
				            });
		            },
		            saveForUpload: cb => {
			            sharp_image
				            .toFile(save_dest + photo.name, (err) => {
					            return cb(err);
				            });
		            },
		            cutForView: cb => {
			            if (!sizes_for_view.length) {
				            photo.name_small = picture.name;
				            return cb(null);
			            }

			            sharp_image
				            .resize(sizes_for_view[0], sizes_for_view[1])
				            .toFile(save_dest + photo.name_small, (err) => {
					            return cb(err);
				            });
		            },
		            cutForList: cb => {
			            if (!sizes_for_list.length) {
				            photo.name_mini = photo.name_small;
				            return cb(null);
			            }

			            sharp_image
				            .resize(sizes_for_list[0], sizes_for_list[1])
				            .toFile(save_dest + photo.name_mini, (err) => {
					            return cb(err);

				            });
		            }
	            }, (err) => {
		            cb(err);
	            });
            } catch (e) {
	            return cb(e);
            }
        },
        setTextOnImage_original: cb => {
            _t.setText({
                pic_name: photo.name,
                author: picture.author,
                pic_source: picture.pic_source,
                copyright_sys: picture.copyright_sys
            }, cb);
        },
        update: cb => {
            let o = {
                command: 'modify',
                object: obj.object || 'taxon_picture',
                params: {
                    id: id,
                    name: photo.name,
                    name_small: photo.name_small,
                    name_mini: photo.name_mini,
                    name_original: picture.name
                }
            };

            _t.api(o, cb);
        }
    }, (err, res) => {
        cb(err, {
            picture: picture.name
        });
    });
};

Model.prototype.resize = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    let _t = this;

    let id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    let picture;

    let photo;
    let save_dest = './public/upload/Taxon_pictures/';
    let size_for_view = 1200;
    let size_for_list = 500;
    let sizes_for_view = [];
    let sizes_for_list = [];

    let wasError = null;

    async.series({
        getImageName: cb => {
            let o = {
                command: 'get',
                object: obj.object || 'taxon_picture',
                params: {
                    param_where: {
                        id: id
                    },
                    collapseData: false
                }
            };

            _t.api(o, (err, res) => {
                if (err) return cb(new MyError('Error while getting picture', {o: o, err: err}));

                if (res && res.length) picture = res[0];

                cb(null);
            });
        },
        resize: cb => {
            let name = picture.name;
            let ext_dot = name.lastIndexOf('.');
            let image_name = name.substr(0, ext_dot);
            let image_ext = name.substr(ext_dot + 1);

            try {
	            let sharp_image = sharp(save_dest + name);
	            photo = {
		            name: image_name + '_upload.' + image_ext,
		            name_small: image_name + '_view.' + image_ext,
		            name_mini: image_name + '_list.' + image_ext
	            };

	            async.series({
		            getSizes: cb => {
			            sharp_image
				            .metadata()
				            .then(info => {
					            if (info && info.width > 0 && info.height > 0) {
						            if (info.width > size_for_view || info.height > size_for_view) {
							            let isWidthWider = info.width > info.height;
							            let k = (isWidthWider ? info.width : info.height) / size_for_view;
							            sizes_for_view.push(parseInt(info.width / k));
							            sizes_for_view.push(parseInt(info.height / k));
						            }
						            if (info.width > size_for_list || info.height > size_for_list) {
							            let isWidthWider = info.width > info.height;
							            let k = (isWidthWider ? info.width : info.height) / size_for_list;
							            sizes_for_list.push(parseInt(info.width / k));
							            sizes_for_list.push(parseInt(info.height / k));
						            }

						            cb(null);
					            } else {
						            return cb({
							            msg: 'Неверные размеры фото',
							            info: info
						            });
					            }
				            })
				            .catch((err) => {
					            return cb({
						            msg: 'catch',
						            err: err
					            });
				            });
		            },
		            saveForUpload: cb => {
			            sharp_image
				            .toFile(save_dest + photo.name, (err) => {
					            return cb(err);
				            });
		            },
		            cutForView: cb => {
			            if (!sizes_for_view.length) {
				            photo.name_small = photo.name;
				            return cb(null);
			            }

			            sharp_image
				            .resize(sizes_for_view[0], sizes_for_view[1])
				            .toFile(save_dest + photo.name_small, (err) => {
					            if (err) return cb({
						            msg: 'cutForView',
						            err: err
					            });

					            return cb(null);
				            });
		            },
		            cutForList: cb => {
			            if (!sizes_for_list.length) {
				            photo.name_mini = photo.name_small;
				            return cb(null);
			            }

			            sharp_image
				            .resize(sizes_for_list[0], sizes_for_list[1])
				            .toFile(save_dest + photo.name_mini, (err) => {
					            if (err) return cb({
						            msg: 'cutForList',
						            err: err
					            });

					            return cb(null);
				            });
		            }
	            }, (err) => {
		            wasError = err;
		            cb(null);
	            });
            } catch (e) {
	            return cb(e);
            }
        },
        update: cb => {
            let o;
            if (wasError) {
                o = {
                    command: 'modify',
                    object: obj.object || 'taxon_picture',
                    params: {
                        id: id,
                        pic_source_text: 'error'
                    }
                };
            } else {
                o = {
                    command: 'modify',
                    object: obj.object || 'taxon_picture',
                    params: {
                        id: id,
                        name: photo.name,
                        name_small: photo.name_small,
                        name_mini: photo.name_mini,
                        name_original: picture.name,
                        pic_source_text: 'cut'
                    }
                };
            }

            _t.api(o, cb);
        }
    }, (err, res) => {
        cb(err, {
            picture: picture.name
        });
    });
};

Model.prototype.resizeAll = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    let _t = this;

    let o = {
        command: 'get',
        object: obj.object || 'taxon_picture',
        params: {
            where: [
                {
                    group: "null_or_error",
                    comparisonType: 'OR',
                    key: 'pic_source_text',
                    type: 'isNull'
                }
                // ,
                // {
                //     group: "null_or_error",
                //     comparisonType: 'OR',
                //     key: 'pic_source_text',
                //     type: '<>',
                //     val1: 'error'
                // }
            ],
            sort: 'id',
            limit: 10000,
            columns: ['id'],
            collapseData: false
        }
    };

    _t.api(o, (err, res) => {
        if (err) return cb(err);

        async.eachSeries(res, (pic, cb) => {
            _t.resize({
                id: pic.id,
                object: obj.object
            }, (err) => {
                cb(err);
            })
        }, (err) => {
            cb(err, res);
        });
    });
};

// var o = {
//     command:'msaccessImportPicture',
//     object:'Taxon_picture'
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

    var taxon_picture_obj_msaccess = {};
    var picture_type_obj_msaccess = {};
    var taxon_obj_msaccess = {};
    var errors = [];
    var e_obj;
    async.series({
        get:function(cb){
            var params = {
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить taxon_picture',{params : params, err : err}));
                for (var i in res) {
                    taxon_picture_obj_msaccess[res[i].msaccess_taxon_picture_id] = res[i];
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
        getTaxons:function(cb){
            var o = {
                command:'get',
                object:'Taxon',
                params:{
                    collapseData:false,
                    limit:1000000000
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить Taxon',{o : o, err : err}));
                for (var i in res) {
                    if(!taxon_obj_msaccess[res[i].msaccess_taxon_id]) taxon_obj_msaccess[res[i].msaccess_taxon_id] = res[i];
                }
                cb(null);
            });
        },
        getMSAccess:function(cb){
            var q = 'select * from `Taxon_pictures`';
            msAccess.query({q:q}, function(err, res){
                if (err) return cb(new MyError('Не удалось получить taxon_picture из внешней базы',{err:err, q:q}));
                for (var i in res) {
                    if (!taxon_picture_obj_msaccess[res[i].Taxpicture_ID]) {
                        taxon_picture_obj_msaccess[res[i].Taxpicture_ID] = {
                            to_add:true
                        }
                    }
                    taxon_picture_obj_msaccess[res[i].Taxpicture_ID].msaccess_taxon_picture = res[i];
                }
                cb(err, res);
            })
        },
        add:function(cb){
            async.eachSeries(taxon_picture_obj_msaccess, function(item, cb){
                if (!item.to_add) return cb(null);
                if (!picture_type_obj_msaccess[item.msaccess_taxon_picture.Picture_type_ID]) {
                    e_obj = {
                        msg:'Для этого изображения нет типа (в справочнике).',
                        picture:item.msaccess_taxon_picture
                    };
                    console.log(e_obj);
                    errors.push(e_obj);
                    return cb(null);

                }
                if (!taxon_obj_msaccess[item.msaccess_taxon_picture.Taxon_ID]) {
                    e_obj = {
                        msg:'Для этого изображения нет таксона. Не будет импортировано',
                        picture:item.msaccess_taxon_picture
                    };
                    console.log(e_obj);
                    errors.push(e_obj);
                    return cb(null);
                }
                var params = {
                    taxon_id:taxon_obj_msaccess[item.msaccess_taxon_picture.Taxon_ID].id,
                    name:item.msaccess_taxon_picture.Taxpicture_name,
                    msaccess_taxon_picture_id:item.msaccess_taxon_picture.Taxpicture_ID,
                    description:item.msaccess_taxon_picture.Picture_description,
                    picture_type_id:picture_type_obj_msaccess[item.msaccess_taxon_picture.Picture_type_ID].id,
                    rollback_key:rollback_key
                };
                _t.add(params, function (err, res) {
                    if (err) return cb(new MyError('Не удалось добавить taxon_picture',{params : params, err : err}));
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
            // if (!doNotSaveRollback){
            //     rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'msaccessImportPicture', params:obj});
            // }
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
