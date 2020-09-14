

class Comment {
    isClientCheck (){
        let client_roles = ['COMPANY_EMPLOYEE','COMPANY_ADMIN'];
        let isClient = false;
        for(let i in MB.User.user_role){
            let r = MB.User.user_role[i];
            if(client_roles.indexOf(r.firstname_role) > -1){
                isClient = true;
            }
        }

        return isClient;
    }
    constructor (obj, cb) {
        this.date = obj.date;
        this.user = obj.user;
        this.visible_client = obj.visible_client;
        this.comment = {
            text: obj.comment.text,
            files: obj.comment.files,
            // br: obj.comment.text.search('<br>') > 0 ? true : false,
        }
        // this.comment.br = this.comment.text
        // + ( text.search('<br>') > 0 ? `<br>` : ``) +
        this.template = `<div class="item-comment">
                <div class="tangibles-tabs-title">
                    <span class="tangibles-tabs-visile-client">{{{visible_client}}}</span>
                    <span class="tangibles-tabs-title-name">{{user}}</span>
                    <span class="tangibles-tabs-title-time">{{date}}</span>
                </div>
                <div class="tangibles-tabs-title-message">
                    {{text}}
                </div>
                <div class="wrapper-attach-files-comment"></div>
            </div>`;

        this.commentDom = {
            wrapper: obj.wrapper,
            comment: undefined,
            file_handler: undefined
        };


        this.init(cb)
    }
    renderComment (cb) {
        let _t = this;
        async.series({
            renderComment: cb => {

                let isClient = _t.isClientCheck();

                let data = {
                    user: _t.user,
                    visible_client: (_t.visible_client)? (isClient)? '' : '<i class="fa fa-eye"></i>' : '',
                    date: _t.date,
                    text: _t.comment.text
                };


                // console.log('dATA---_--', _t, data.visible_client, data);

                _t.commentDom.comment = _t.commentDom.wrapper.append(Mustache.to_html(_t.template, data)).children().last();
                _t.commentDom.file_handler = _t.commentDom.comment.find('.wrapper-attach-files-comment');
                if (!data.text) _t.commentDom.comment.find('.tangibles-tabs-title-message').remove();



                cb(null)
            }
        }, (err, res) => {
            if (cb) cb(null)
        })
    }
    renderFiles (cb) {
        let _t = this;
        let fileHandler = new FileHandler({
            files: _t.comment.files,
            wrapper: _t.commentDom.file_handler,
            params: {
                download: true,
                notification_non_files: false
            }
        }, res => {
            cb(null)
        });
    }
    init (cb) {
        let _t = this;
        async.series({
            renderComment: cb => {
                _t.renderComment(res => {
                    cb(null)
                })
            },
            renderFiles: cb => {
                _t.renderFiles(res => {
                    cb(null)
                })
            }
        }, (err, res) => {
            cb(null)
        })
    }
}

class CommentHandler {
    constructor (obj, cb) {
        let _t = this;
        this.table = obj.table;
        this.id = obj.id;
        this.name_method_get = obj.name_method_get;
        this.name_method_set = obj.name_method_set;
        this.comments = {
            items:[],
            add: (obj, cb) => {
                let comment;
                async.series({
                    initComment: cb => {
                        comment = new Comment({
                            date: obj.date,
                            user: obj.user,
                            visible_client: obj.visible_client,
                            comment: {
                                text: obj.text,
                                files: obj.files,
                            },
                            wrapper: obj.wrapper
                        }, res => {
                            cb(null)
                        })



                    },
                    pushComment: cb => {
                        _t.comments.items.push(comment);
                        cb(null)
                    }
                }, (err, res) => {
                    if (cb) cb(comment)
                })

            }
        };
        this.only_read = obj.only_read || false,
        this.data = obj.data || [];
        this.new_comment = {
            text: '',
            attach_files: []
        };
        this.attach_file_handler = obj.attach_file_handler || undefined;

        this.before_selected_files = []


        this.commentsDom = {
            wrapper: obj.wrapper,
            wrapper_comments_list: undefined,
            wrapper_handler: undefined,
            textarea_new_comment: undefined,
            wrapper_buttons_handler: undefined,
            buttons_handler: {
                attach_file: undefined,
                upload_comment: undefined
            },
            boot_box_attach_file: undefined,
            count_attach_file: undefined,
            non_comments: undefined
        };
        this.template = {
            non_comments: `<div class="non-comments">Комментариев пока нет.</div>`,
            wrapper_comments_list: `<div class="history-comments"></div>`,
            wrapper_handler: `<div class="wrapper-handler-comments"></div>`,
            textarea_new_comment: `<textarea placeholder="Напишите комментарий..." class="new-comment-field" rows="10"></textarea>`,
            wrapper_buttons_handler: `<div class="tangibles-tabs-btns"></div>`,
            visible_client_handler: `<div class="visible-client-check-holder"><label><input type="checkbox" checked="checked" class="visible-client-check"/>Скрыть от клиента</label></div>`,
            button_attach_files: `<div class="attach-file-new-object">
                    <div class="count-attach-files">0</div>
                    <button class="new-comment-file-upload"><i class="fa fa-paperclip"></i></button>
            </div>`,
            button_upload_comment: `<button class="new-comment-upload"><i class="fa fa-send"></i><div class="ctrl_enter">Ctrl + Enter</div></button>`,
            boot_box_attach_file: `<div class="attach-loaded-files"></div>
                <hr>
            <div class="upload-new-file"></div>`,
            comments_day_hr: `<div class="tangibles-tabs-when">
                <div class="tangibles-tabs-when-w">
                    <span>{{day}}</span>
                </div>
            </div>`


        }
        this.init(cb)
    }
    isClientCheck (){
        let client_roles = ['COMPANY_EMPLOYEE','COMPANY_ADMIN'];
        let isClient = false;
        for(let i in MB.User.user_role){
            let r = MB.User.user_role[i];
            if(client_roles.indexOf(r.firstname_role) > -1){
                isClient = true;
            }
        }

        return isClient;
    }
    renderNotificationNonComments (cb) {
        let _t = this;
        async.series({
            renderNotificationNonComments: cb => {
                _t.commentsDom.non_comments = _t.commentsDom.wrapper.append(Mustache.to_html(_t.template.non_comments)).children().last();
                cb(null)
            }
        }, (err, res) => {
            if (cb) cb(null)
        })
    }
    renderWrapperCommentsList (cb) {
        let _t = this;
        async.series({
            renderWrapperCommentsList: cb => {
                _t.commentsDom.wrapper_comments_list = _t.commentsDom.wrapper.append(Mustache.to_html(_t.template.wrapper_comments_list)).children().last();
                cb(null)
            }
        }, (err, res) => {
            if (cb) cb(null)
        })
    }
    renderWrapperHandler (cb) {
        let _t = this;
        async.series({
            renderWrapperHandler: cb => {
                _t.commentsDom.wrapper_handler = _t.commentsDom.wrapper.append(Mustache.to_html(_t.template.wrapper_handler)).children().last();
                cb(null)
            }
        }, (err, res) => {
            if (cb) cb(null)
        })
    }
    renderWrapperButtonsHandler (cb) {
        let _t = this;
        async.series({
            renderWrapperButtonsHandler: cb => {
                _t.commentsDom.wrapper_buttons_handler = _t.commentsDom.wrapper_handler.append(Mustache.to_html(_t.template.wrapper_buttons_handler)).children().last();
                cb(null)
            }
        }, (err, res) => {
            if (cb) cb(null)
        })
    }
    renderTextareaNewComment (cb) {
        let _t = this;
        async.series({
            renderTextareaNewComment: cb => {
                _t.commentsDom.textarea_new_comment = _t.commentsDom.wrapper_handler.append(Mustache.to_html(_t.template.textarea_new_comment)).children().last();
                cb(null)
            }
        }, (err, res) => {
            if (cb) cb(null)
        })
    }
    renderButtonAttachFiles (cb) {
        let _t = this;
        async.series({
            renderButtonAttachFiles: cb => {
                _t.commentsDom.buttons_handler.attach_file = _t.commentsDom.wrapper_buttons_handler.append(Mustache.to_html(_t.template.button_attach_files)).children().last();
                _t.commentsDom.count_attach_file = _t.commentsDom.buttons_handler.attach_file.find('.count-attach-files')
                _t.commentsDom.count_attach_file.hide()
                cb(null)
            }
        }, (err, res) => {
            if (cb) cb(null)
        })
    }
    renderButtonUploadComment (cb) {
        let _t = this;
        async.series({
            renderButtonUploadComment: cb => {



                let isClient = _t.isClientCheck();

                console.log('HERE', isClient, 11 );

                if(isClient){
                    _t.commentsDom.buttons_handler.upload_comment = _t.commentsDom.wrapper_buttons_handler.append(Mustache.to_html(_t.template.button_upload_comment)).children().last();
                }else{

                    _t.commentsDom.buttons_handler.upload_comment = _t.commentsDom.wrapper_buttons_handler.append(Mustache.to_html(_t.template.visible_client_handler + _t.template.button_upload_comment)).children().last();
                }



                _t.commentsDom.visible_client = _t.commentsDom.wrapper_buttons_handler.find('input.visible-client-check');
                cb(null)
            }
        }, (err, res) => {
            if (cb) cb(null)
        })
    }
    renderComment (obj, cb) {
        let _t = this
        _t.comments.add({
            wrapper: obj.wrapper,
            date: obj.date,
            user: obj.user,
            visible_client: obj.visible_client,
            text: obj.text,
            files: obj.files || []
        }, res => {
            if (cb) cb(null)
        })
    }
    renderHrDayComment (day) {
        let _t = this;
        let today = moment().format('YYYY-MM-DD');
        let yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD')

        if (today == day) return _t.commentsDom.wrapper_comments_list.append(Mustache.to_html(_t.template.comments_day_hr, { day: 'Сегодня'}))

        if (yesterday == day) return _t.commentsDom.wrapper_comments_list.append(Mustache.to_html(_t.template.comments_day_hr, { day: 'Вчера'}))

        _t.commentsDom.wrapper_comments_list.append(Mustache.to_html(_t.template.comments_day_hr, { day: day }))
    }

    getComments (cb) {
        let _t = this;
        async.series({
            getComments: cb => {

                let isClient = _t.isClientCheck();

                let o = {
                    command: _t.name_method_get,
                    object: _t.table,
                    params: {
                        id: _t.id
                    }
                };

                if(isClient){
                    o.params.isClient = true;
                }


                socketQuery(o, res => {
                    if (res.code) {
                        console.warn('В getComments ошибка получения данных');
                        return cb(null);
                    }

                    _t.data = Object.values(res.data).reverse();


                    if (_t.data.length > 0) _t.commentsDom.non_comments.remove()
                    cb(null);
                })
            }
        }, (err, res) => {
            cb(null)
        })
    }
    getLastComment (from) {
        let _t = this;
        let comment = undefined
        if (from == 'local' || !from) {
            for (let i in _t.comments.items) {
                if (!comment) {
                    comment = _t.comments.items[i]
                    continue
                }
                let int_day_prev_comment = moment(comment.date, 'DD.MM.YYYY HH:mm:ss').format('YYYYMMDD')
                let int_day_this_comment = moment(_t.comments.items[i].date, 'DD.MM.YYYY HH:mm:ss').format('YYYYMMDD')
                if (int_day_this_comment > int_day_prev_comment) comment = _t.comments.items[i]
            }
        }
        return comment
        // if (from = 'remote') {}
    }

    uploadComment (cb) {
        let _t = this;
        if (_t.new_comment.text || _t.new_comment.attach_files.length > 0) {
            let new_comment = undefined;

            let isClient = _t.isClientCheck();

            async.series({
                setComment: cb => {
                    let o = {
                        command: _t.name_method_set,
                        object: _t.table,
                        params: {
                            id: _t.id,
                            text: _t.new_comment.text,
                            visible_client: (isClient)? true : !(_t.commentsDom.visible_client.attr('checked') == 'checked'),
                            attach_files: _t.new_comment.attach_files
                        }
                    };

                    // if (_t.attach_files.length > 0) o.params.attach_files = _t.attach_files
                    socketQuery(o, res => {
                        _t.new_comment = {
                            text: undefined,
                            attach_files: undefined
                        }
                        new_comment = res.data[0]
                        _t.commentsDom.textarea_new_comment.val('');
                        _t.session_attach_new_files_id = undefined;
                        _t.before_selected_files = [];
                        cb(null);
                    })
                },
                render: cb => {
                    new_comment.wrapper = _t.commentsDom.wrapper_comments_list;
                    new_comment.date = new_comment.created;
                    new_comment.user = new_comment.created_by_user;

                    if (_t.commentsDom.non_comments) _t.commentsDom.non_comments.remove()

                    let last_comment = _t.getLastComment('local') ? _t.getLastComment('local').date : '00.00.0000 00:00:00';

                    let day_prev_comment = moment(last_comment, 'DD.MM.YYYY HH:mm:ss').format('YYYY-MM-DD')
                    let day_new_comment = moment(new_comment.date, 'DD.MM.YYYY HH:mm:ss').format('YYYY-MM-DD')
                    if (day_prev_comment != day_new_comment) _t.renderHrDayComment(day_new_comment);
                    _t.renderComment(new_comment, res => {
                        _t.scrollEnd()
                        cb(null)
                    })
                    _t.commentsDom.count_attach_file.html('')
                    _t.commentsDom.count_attach_file.hide();
                }
            }, (err, res) => {
                if (cb) cb(null)
            })
        }
    }

    scrollEnd() {
        let _t = this;
        if (_t.commentsDom.wrapper_comments_list[0]) {
            _t.commentsDom.wrapper_comments_list[0].scroll(0, _t.commentsDom.wrapper_comments_list[0].scrollHeight)
        }

    }
    //handlers
    handlerButtonAttachFiles (){
            let _t = this;
            _t.commentsDom.boot_box_attach_file = bootbox.dialog({
                title: 'Прикрепить файлы',
                message: _t.template.boot_box_attach_file,
                buttons: {
                    confirm: {
                        label: 'Прикрепить',
                        callback: function() {
                            // console.log(fileHandlerAttachLoadedFiles.files())
                            let concat = []
                            if (fileHandlerAttachLoadedFiles) {
                                let attach_files_loaded = fileHandlerAttachLoadedFiles.getSelectedFiles().map(function (file) {
                                    return file.data
                                })
                                _t.before_selected_files = fileHandlerAttachLoadedFiles.getSelectedFiles().map(function (file) {
                                    return file.data.file_id;
                                })
                                concat = concat.concat(attach_files_loaded)
                            }
                            if (fileHandlerAttachNewFiles) {
                                let attach_new_files =  fileHandlerAttachNewFiles.files.items.map(function (file) {
                                    return file.data
                                });
                                concat = concat.concat(attach_new_files)
                            }
                            _t.new_comment.attach_files = concat
                            if (concat.length > 0) {
                                _t.commentsDom.count_attach_file.html(concat.length);
                                _t.commentsDom.count_attach_file.show()
                            } else {
                                _t.commentsDom.count_attach_file.hide()
                            }
                            console.log(_t.new_comment.attach_files)
                            // debugger
                        }
                    },
                    cancel: {
                        label: 'Отмена',
                        callback: function(){
                            _t.new_comment.attach_files = []
                            _t.before_selected_files = [];
                            _t.session_attach_new_files_id = undefined
                            _t.commentsDom.count_attach_file.hide()
                        }
                    }
                }
            });
            let fileHandlerAttachLoadedFiles = undefined;
            let fileHandlerAttachNewFiles = undefined;
            if (_t.attach_file_handler.attach_loaded_files) {
                fileHandlerAttachLoadedFiles = new FileHandler({
                    id: _t.id,
                    table: _t.attach_file_handler.attach_loaded_files.table,
                    name_method_get: _t.attach_file_handler.attach_loaded_files.name_method_get,
                    wrapper: $(_t.commentsDom.boot_box_attach_file).find('.attach-loaded-files'),
                    params: {
                        open: true,
                        download: true,
                        select: true,
                        before_selected_files: _t.before_selected_files,
                        notification_non_files: false
                    }
                });
            }
            if (_t.attach_file_handler.attach_new_files) {
                let bootbox_loading = undefined
                let constructor = {
                    // id: res.id,
                    table: 'session_attach_files',
                    name_method_get: 'getFiles',
                    name_method_set: 'uploadFile',
                    name_method_remove: 'removeFile',
                    wrapper: $(_t.commentsDom.boot_box_attach_file).find('.upload-new-file'),
                    params: {
                        open: true,
                        upload: true,
                        remove: true,
                        notification_non_files: false
                    },
                    label: {
                        button_new_file: 'Загрузить с компьютера'
                    },
                    uploadingNewFile: function () {
                        if (!bootbox_loading) {
                            bootbox_loading = bootbox.dialog({
                                message: '<div class="text-center"><i class="fa fa-spin fa-spinner"></i> Загрузка...</div>',
                                closeButton: false
                            })
                        }
                    },
                    successUploadNewFile: function () {
                        bootbox_loading.modal('hide')
                        bootbox_loading = undefined;
                    }
                }

                if (!_t.session_attach_new_files_id) {
                    socketQuery({
                        command: 'createSessid',
                        object: 'session_attach',
                    }, res => {
                        _t.session_attach_new_files_id = res.id;
                        constructor.id = _t.session_attach_new_files_id
                        fileHandlerAttachNewFiles = new FileHandler(constructor)
                    })
                } else {
                    constructor.id = _t.session_attach_new_files_id
                    fileHandlerAttachNewFiles = new FileHandler(constructor)
                }
            }
    }
    initComments (cb) {
        let _t = this;
        let promises_arr = []
        for (let i in _t.data) {
            // console.log(_t.data[i])
            // debugger
            let day_this_comment = moment( _t.data[i].created, 'DD.MM.YYYY HH:mm:ss').format('YYYY-MM-DD')
            if (i == 0) _t.renderHrDayComment(day_this_comment);
            if (i > 0) {
                let before_comment_day = moment( _t.data[i - 1].created, 'DD.MM.YYYY HH:mm:ss').format('YYYY-MM-DD');
                if (day_this_comment != before_comment_day) _t.renderHrDayComment(day_this_comment)
            }
            promises_arr.push(
                new Promise((resolve, reject) => {
                    let iter = i;
                    let obj = {
                        wrapper: _t.commentsDom.wrapper_comments_list,
                        date: _t.data[i].created,
                        user: _t.data[i].created_by_user,
                        text: _t.data[i].text,
                        visible_client: _t.data[i].visible_client,
                        files: _t.data[i].files || []
                    }


                    _t.renderComment(obj, res => {
                        resolve(null)
                    })
                })
            )
        }
        Promise.all(promises_arr).then(function(){
            cb(null)
        });
    }
    init (cb) {
        let _t = this;
        _t.commentsDom.wrapper.html('');
        async.series({
            renderWrappers: cb => {
                async.series({
                    renderNotificationNonComments: cb => {
                        _t.renderNotificationNonComments(res => {
                            cb(res)
                        })
                    },
                    renderWrapperCommentsList: cb => {
                        _t.renderWrapperCommentsList(res => {
                            cb(res)
                        })
                    },
                    renderWrapperHandler: cb => {
                        if (_t.only_read === true) return cb(null)
                        _t.renderWrapperHandler(res => {
                            cb(res)
                        })
                    },
                    renderTextareaNewComment: cb => {
                        if (_t.only_read === true) return cb(null)
                        _t.renderTextareaNewComment(res => {
                            cb(res)
                        })
                    },
                    renderWrapperButtonsHandler: cb => {
                        if (_t.only_read === true) return cb(null)
                        _t.renderWrapperButtonsHandler(res => {
                            //render buttons
                            async.series({
                                renderButtonAttachFiles: cb => {
                                    _t.renderButtonAttachFiles(res => {
                                        cb(null)
                                    })
                                },
                                renderButtonUploadComment: cb => {
                                    _t.renderButtonUploadComment(res => {
                                        cb(null)
                                    })
                                }
                            }, (err, res) => {
                                cb(null)
                            })
                        })
                    },
                }, (err, res) => {
                    if (_t.only_read === true) {
                        _t.commentsDom.wrapper_comments_list.css('max-height', '620px')
                    }
                    cb(null)
                })
            },
            comment: cb => {
                async.series({
                    getComments: cb => {
                        if (_t.data.length > 0) {
                            _t.commentsDom.non_comments.remove()
                            cb(null)
                        } else {
                            _t.getComments(res => {
                                cb(null)
                            })
                        }
                    },
                    initComments: cb => {
                        _t.initComments(res => {
                            _t.scrollEnd()
                            cb(null)
                        })
                    }
                }, (err, res) => {
                    cb(null)
                })
            },
            setHandlers: cb => {
                if (_t.only_read === true) return cb(null)
                _t.commentsDom.buttons_handler.attach_file.off().on('click', function (elem) {
                    _t.handlerButtonAttachFiles()
                })
                _t.commentsDom.textarea_new_comment.off().on('change keyup paste', function(elem) {
                    _t.new_comment.text = $(this).val().replace(/^\s+|\s+$/g,'')
                    if (elem.key === 'Enter' && elem.ctrlKey) {
                        _t.uploadComment();
                    }
                })
                _t.commentsDom.buttons_handler.upload_comment.off().on('click', function (elem) {
                    _t.uploadComment();
                })



                cb(null)
            }
        }, (err, res) => {
            cb(null)
        })
    }
}
