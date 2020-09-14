function logout (e, el) {
    if (e.ctrlKey){
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
    }else{
        var o = {
            command: 'logout',
            object: 'User'
        };

        socketQuery(o, function(res){
            document.location.href = "login.html";
        });
    }
}