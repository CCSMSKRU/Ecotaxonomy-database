(function(){
    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_page', formID);
    var formWrapper = $('#mw-'+formInstance.id);


    var id = formInstance.activeId;



    var page = {
        events: null,
        values: null,

        init: function(){

            page.getPages(function () {
                page.populateSidebar();
                page.setHandlers();
            })


        },
        getPages: function (cb) {

            var o = {
                command: 'get',
                object: 'page',
                params: {
                    collapseData: false
                }
            };

            socketQuery(o, function (res) {
                if (!res.code == 0) {
                    toastr[res.toastr.type](res.toastr.message);
                    return false;
                }

                page.pages = res || [];

                if (typeof cb == 'function') {
                    cb();
                }

            });

        },

        populateSidebar: function (events) {
            // console.log('events ', events);

            var tpl = `{{#pages}}<div class="custom-list-item" data-id="{{id}}">{{title}}</div>{{/pages}}`;

            var mo = {
                pages: page.pages
            };

            formWrapper.find('.sf_switcher_holder').html('').html(Mustache.to_html(tpl, mo));

        },

        setHandlers: function () {
            let _t = this;


            formWrapper.find('.custom-list-item').off('click').on('click', function () {

                var id = $(this).attr('data-id');

                formInstance.activeId = id;
                formInstance.tablePKeys['data'][0] = id;

                formInstance.reload(function () {
                    formWrapper.find('.name-place').html('Page: ' + formInstance.data.data[0].title);
                });

            });
        }

    }


    formInstance.doNotGetScript = true;
    formInstance.afterReload = function (cb) {
        // Можно запихнуть все что нужно вызвать при релоаде без загрузки нового скрипта.
        page.init();
        cb();
    };

    page.init();

}());
