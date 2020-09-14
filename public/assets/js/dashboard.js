// "user_favorite_document": {
//     "profile": {"name": "user_favorite_document", "name_ru": "Избранные документы пользователя", "ending": ""},
//     "structure": {
//         "id": {"type": "bigint", "length": "20", "notNull": true, "autoInc": true, "primary_key": true},
//         "file_object_id": {"type": "bigint", "length": "20", "visible": false},
//         "user_id": {"type": "bigint", "length": "20", "visible": false}
//     }
// },

(function(){

    let checkRoleAccess = function (roleAccess) {

            let rolesList = MB.User.user_role;
            let rolesFlat = [];
            let access = false;

            for(let i in rolesList){
                let item = rolesList[i];
                rolesFlat.push(item.firstname_role);
            }

            for(let cl in roleAccess){
                let cl_item = roleAccess[cl];

                if(rolesFlat.indexOf(cl_item) > -1 || rolesFlat.indexOf('SUPERADMIN') > -1){
                    access = true;
                }
            }

            console.log('access',rolesList, access);
            return access;

    };

    let dashboard = {
        parentBlock: undefined,
        dashboardTpl: `<div class="dbrd-container">
                        <div class="row-fluid">
                            <div class="dbrd-favorites-container"></div>                  
                        </div>
                        <div class="row">
                            <div class="dbrd-news-container col-md-2"></div>
                            <div class="dbrd-requests-container col-md-10"></div>
                        </div>
                       </div>`,
        news: {},
        newsTpl: `<div class="dbrd-block"><div class="dbrd-title">Новости</div>
                    {{#items}}<div class="dbrd-item dbrd-news" data-id="{{id}}">
                                <div class="dbrd-item-title" data-id="{{id}}">{{header}}</div>
                                <div class="dbrd-item-content">
                                    <div class="dbrd-item-img-holder"><img class="dbrd-item-img" src="upload/{{image}}" /></div>
                                    <div class="dbrd-item-desc">{{news}}</div>                                    
                                </div>
                                <div class="dbrd-item-date">{{published}}</div>
                            </div>
                    {{/items}}</div>`,
        favorites: {},
        favoritesTpl: `<div class="dbrd-block"><div class="dbrd-title">Избранное</div>
                       <div class="dbrd-items-list">{{#items}}<div class="dbrd-item dbrd-favorite {{className}} {{disabled}}" data-id="{{id}}">
                                <div class="dbrd-item-icon-holder"><i class="fa {{icon}}"></i></div>
                                <div class="dbrd-item-title" data-id="{{id}}">{{title}}</div>
                                <div class="dbrd-item-content">
                                    <div class="dbrd-item-desc">{{desc}}</div>
                                </div>
                            </div>
                    {{/items}}</div></div>`,

        init: function(cb){

            dashboard.clear();
            dashboard.prePopulate();
            dashboard.populateRequests();

            dashboard.getData(function () {

                dashboard.populate();
                dashboard.setHandlers();

                if(typeof cb == 'function'){
                    cb();
                }

            });

        },
        getData: function(cb){

            let o_news = {
                command: 'get',
                object: 'news',
                params: {
                    limit: 3
                }
            };

            socketQuery(o_news, function(res){

                console.log('Dashboard -->', res);
                dashboard.news.items = [];

                for(var i in res.data){
                    dashboard.news.items.push(res.data[i]);
                }

                var o = {
                    command:'get_me',
                    object:'User',
                    params:{
                        getRoles:true
                    }
                };

                socketQuery(o, function(res) {

                    MB.User = res.user;

                    //init user data to top panel

                    let user = MB.User;

                    $('#user-name').html(user.fio);
                    $('#user-position').html(user.company_name);
                    $('#user-block-holder img').attr('src', 'upload/'+user.image);
                    $('#user-block-holder').attr('data-id', user.id);

                    ///end init user


                    let toAddRoles = ['GENERAL_DIRECTOR', 'FACILITY_MANAGER', 'RENT_MANAGER', 'LEAD_ENGINEER', 'SECRETARY', 'ENGINEER', 'COMPANY_ADMIN', 'COMPANY_EMPLOYEE'];

                    dashboard.favorites = {
                        items: [{
                            id: 15,
                            icon: 'fa-plus',
                            className: 'blue_db_btn',
                            title: 'Создать заявку',
                            desc: 'Быстрый доступ',
                            disabled: (checkRoleAccess(toAddRoles))? '' : 'disabled',
                            callback: function(){

                                if(this.disabled){
                                    toastr['info']('У Вашей роли нет прав для создания заявки.');
                                    return;
                                }

                                var formId = MB.Core.guid();
                                var form = new MB.FormN({
                                    id: formId,
                                    name: 'form_request_work',
                                    class: 'request_work',
                                    client_object: 'form_request_work',
                                    type: 'form',
                                    ids: ['new'],
                                    position: 'center'
                                });
                                form.create(function () {
                                    var modal = MB.Core.modalWindows.windows.getWindow(formId);

                                });
                            }
                        },{
                            id: 1,
                            title: 'Менеджер заявок',
                            desc: 'Управление',
                            callback: function(){

                                // hell kolhz

                                let o = {
                                    command: 'get',
                                    object: 'request_work',
                                    params: {
                                        limit: 1
                                    }
                                };

                                socketQuery(o, function(res) {
                                    if (!Object.keys(res.data).length) {
                                        toastr.info('Еще нет ни одной заявки.');
                                        return;
                                    }
                                    let any_id = res.data[0].id;

                                    var formId = MB.Core.guid();
                                    var form = new MB.FormN({
                                        id: formId,
                                        name: 'form_all_request_manager',
                                        class: 'request_work',
                                        client_object: "form_all_request_manager",
                                        type: 'form',
                                        ids: [any_id],
                                        position: 'center'
                                    });
                                    form.create(function () {
                                        var modal = MB.Core.modalWindows.windows.getWindow(formId);
                                        $(modal).on('close', function () {});
                                        $(form).on('update', function () {});
                                    });

                                });



                            }
                        },{
                            id: 1,
                            title: 'Оформить пропуск',
                            desc: 'с 9:00 до 21:00',
                            callback: function(){
                                toastr['success']('Выполнить операцию', 'Оформить пропуск');
                            }
                        },{
                            id: 2,
                            title: 'Оформить пропуск А/М',
                            desc: 'Оформляйте заранее!',
                            callback: function(){

                                toastr['success']('Выполнить операцию', 'Оформить пропуск А/М');

                            }
                        }]
                    };


                    if(typeof cb == 'function'){
                        cb();
                    }
                });
            });
        },
        populateRequests: function(cb){

            let req_holder = dashboard.parentBlock.find('.dbrd-requests-container');

            let req_table = new MB.TableN({
                name: 'Заявки',
                client_object: 'table_request_work_dashboard',
                class: 'request_work',
                id: MB.Core.guid(),
                externalWhere: []
            });



            req_table.create(req_holder, function () {
                console.log('bashboard table rendered');
            });

        },

        prePopulate: function(){

            MB.Core.$pageswrap.append(dashboard.dashboardTpl);
            dashboard.parentBlock = $('.dbrd-container');

        },

        populate: function(){

            let fav_holder = dashboard.parentBlock.find('.dbrd-favorites-container');
            let news_holder = dashboard.parentBlock.find('.dbrd-news-container');


            fav_holder.html(Mustache.to_html(dashboard.favoritesTpl, dashboard.favorites));

            console.log(dashboard.news);

            news_holder.html(Mustache.to_html(dashboard.newsTpl, dashboard.news));


        },

        setHandlers: function(){

            dashboard.parentBlock.find('.dbrd-favorite').off('click').on('click', function(){

                let id = $(this).attr('data-id');
                let fav = dashboard.getFavoriteById(id);

                fav.callback();

            });

            dashboard.parentBlock.find('.dbrd-news-container .dbrd-item-title').off('click').on('click', function(){


                let id = $(this).attr('data-id');
                let single_news = dashboard.getNewsById(id);

                bootbox.dialog({
                    title: single_news.header,
                    message: '<div class="in-dialog-news-image-holder"><img src="upload/'+single_news.image+'"></div>' + single_news.news + '<br/><br/>' + single_news.published,
                    buttons: {}
                });


            });

        },

        getFavoriteById: function(id){

            for(let i in dashboard.favorites.items){

                if(dashboard.favorites.items[i].id == id){
                    return dashboard.favorites.items[i];
                }

            }

            return false;

        },

        getNewsById: function(id){

            for(let i in dashboard.news.items){

                if(dashboard.news.items[i].id == id){
                    return dashboard.news.items[i];
                }

            }

            return false;

        },

        clear: function(){
            MB.Core.$pageswrap.html('');
        },

        devOnLoadOpenForm: function(){
            var formId = MB.Core.guid();

            var openInModalO = {
                id: formId,
                name: 'form_tangibles',
                class: 'tangibles',
                client_object: 'form_tangibles',
                type: 'form',
                ids: [39],
                position: 'center',
                tablePKeys: []
            };

            var form = new MB.FormN(openInModalO);

            form.create(function () {});
        }

        
    };
    
    dashboard.init(function(){

        // dashboard.devOnLoadOpenForm();

    });

    MB.Core.dashboard = dashboard;

}());
