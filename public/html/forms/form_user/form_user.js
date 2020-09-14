(function(){

    var modal = $('.mw-wrap').last();
    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_user', formID);
    var formWrapper = $('#mw-' + formInstance.id);

    var id = formInstance.activeId;

    var display_on_web_page; //переменная в которую записывается значение display_on_web_page текущего объекта user
    var user_type;

    var user = {
        init: function () {
            const _t = this;

            user.setHandlers();
        },

        reload: function (cb) {
            user.setHandlers();
        },

        getDisplay: function(cb) {
            const _t = this
            async.series({
                getDisplay: cb => {
                    let o = {
                        command: 'get',
                        object: 'user',
                        params: {
                            param_where: {
                                id: formInstance.activeId
                            }
                        }
                    }
                    socketQuery(o, res => {
                        display_on_web_page = res.data[0].display_on_web_page,
                            cb(null)
                    });
                }
            }, cb)
        },

        toggleDisplayOnWebPage: function(cb){

            let o = {
                command: 'toggleDisplayOnWebPage',
                object: 'user',
                params: {
                    id: id
                }
            };

            socketQuery(o, function (res) {

                if(!res.code){
                    formInstance.reload();
                }

                if(typeof cb == 'function'){
                    cb();
                }

            });

        },

        getMe: function(cb) {
            const _t = this
            async.series({
                getDisplay: cb => {
                    let o = {
                        command: 'get_me',
                        object: 'User'
                    }
                    socketQuery(o, res => {
                        user_type = res.data[0].user_type_sysname,
                            cb(null)
                    });
                }
            }, cb)
        },

        renderDisplay: function(){
            const _t = this
            //debugger
            //formWrapper.find('.display_on_web_page').html('<input class="display_on_web_page" type="checkbox" ' + display_on_web_page ?  'checked' : ''  + '>')
            formWrapper.find('.display_on_web_page').html('<input type="checkbox" ' + display_on_web_page ?  'checked' : ''  + '>')
        },

        setHandlers: function () {
            const _t = this;


            formWrapper.find('.set-display-on-web-page').off('click').on('click', function () {

                user.toggleDisplayOnWebPage(function () {

                });

            });

            formWrapper.find('.change-password').off('click').on('click', function(){

                var html =
                    '<p>Attention! On all devices where you are now authorized, it is possible to continue working despite changing the password. We recommend after the change, log out and log in again.</p>' +
                    '<p>Logout occurs on all devices where you are authorized.</p>' +
                    '<div class="form-group">' +
                    '<label for="pwd">Your current password:</label>' +
                    '<input type="password" class="form-control" id="old_psw">' +
                    '</div>' +
                    '<div class="form-group">' +
                    '<label for="pwd">New password:</label>' +
                    '<input type="password" class="form-control" id="new_psw1">' +
                    '</div>' +
                    '<div class="form-group">' +
                    '<label for="pwd">Confirm new password:</label>' +
                    '<input type="password" class="form-control" id="new_psw2">' +
                    '</div>';
                var dialog = bootbox.dialog({
                    title: 'Change Password',
                    message: html,
                    buttons: {
                        toggleLog: {
                            label: 'On/Off log',
                            closeButton:true,
                            callback: function(){

                                var o = {
                                    command:'toggleConsoleLog',
                                    object:'User',
                                    params:{
                                    }
                                };
                                socketQuery(o, function(r){
                                    // console.log(r);
                                });
                            }
                        },
                        success: {
                            label: 'Set new password.',
                            closeButton:false,
                            callback: function(){
                                var old_psw = $('#old_psw').val();
                                var new_psw1 = $('#new_psw1').val();
                                var new_psw2 = $('#new_psw2').val();
                                if (!old_psw || !new_psw1){
                                    return toastr.error('Fill in all the fields.');
                                }
                                if (new_psw1 !== new_psw2){
                                    return toastr.error('Passwords do not match.');
                                }
                                var o = {
                                    command: 'changePassword',
                                    object: 'User',
                                    params:{
                                        password:old_psw,
                                        new_password:new_psw1
                                    }
                                };

                                socketQuery(o, function(res){
                                    console.log(res);
                                });
                            }
                        },
                        cancel: {
                            label: 'Cancel',
                            callback: function(){

                            }
                        }
                    }
                });

            })

        },
    };

    user.init();

}());
