/**
 * onload.js - complex cloud solutions, LLC
 *
 * document.ready functions
 */

$('document').ready(function(){

    //parse url
    (function(){
        var href = document.location.href;

        var vars = getUrlVars(href);

        switch (vars.command) {
            case 'openModifyTaxon':

                var formId = MB.Core.guid();

                var o = {
                    class: "taxon",
                    client_object: "form_taxon",
                    ids :[vars.taxon_id],
                    name: "form_taxon",
                    position: "center",
                    tablePKeys: {
                        data: [vars.taxon_id],
                        data_columns: ['id'],
                    },
                    type: 'form'
                };

                var form = new MB.FormN(o);
                form.create(function () {
                });

                break;

            default:
                break;
        }
    }());


    /**
     * Opon form_user, top right user block.
     */
    $('#user-block-holder').off('click').on('click', function(){

        var formId = MB.Core.guid();
        var user_id = $(this).attr('data-id');


        var o = {
            class: "user",
            client_object: "form_user",
            ids :[user_id],
            name: "form_user",
            position: "center",
            tablePKeys: {
                data: [user_id],
                data_columns: ['id'],
            },
            type: 'form'
        };

        var form = new MB.FormN(o);
        form.create(function () {

        });


    });


    /**
     * set user data to top right user block
     */
    (function(){

        var o = {
            command:'get_me',
            object:'User'
        };



        socketQuery(o, function(res){
            var user = res.user;

            // console.log(user);

            $('#user-name').html(user.fio);
            $('#user-position').html(user.company_name);
            $('#user-block-holder img').attr('src', 'upload/'+user.image);
            $('#user-block-holder').attr('data-id', user.id);

        });

    }());




});
