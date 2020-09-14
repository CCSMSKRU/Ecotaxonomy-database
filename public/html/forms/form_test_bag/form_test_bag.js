(function(){

    var modal = $('.mw-wrap').last();
    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_test_bag', formID);
    var formWrapper = $('#mw-'+formInstance.id);

    var id = formInstance.activeId;

    var se_tbl = formInstance.tblInstances[0];



    var test_bag = {

        testFunc: function() {
            console.log(this)
        },

        testFuncAr: cb => {
            console.log(this)
        },

        ///Тут идет описание таблицы личинок, которая входит в форму жука

        storage: {
            template: {
                larva: `{{#.}} <!-- так задается начало шаблона-->
                    <div class="larva-item" style="background-color: {{color}}" data-id="{{id}}">
                        <span>id: {{id}}, </span>   
                        <span>Name: {{name}}, </span>
                        <span>Size: {{size}}, </span>
                        <span>Weight: {{weight}}, </span>
                        <span>Color: {{color}}, </span>
                    </div>
                {{/.}}` // конец
            },
            data: {
                larva: []
            },
        },
/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        addLarva: function(obj, cb) {
            async
                addLarvaRemote,
                getLarva,
                renderLarva
        }
*/

        addLarvaRemote: function(obj, cb){
            const _t = this
            obj.test_bag_id = formInstance.activeId
            async.series({
                addLarva: cb => {
                    let o = {
                        object: 'test_larva',
                        command: 'add',
                        params: {...obj}
                        // params: {
                        //     name: obj.name,
                        //     size: obj.size,
                        //     width: obj.width,
                        //     color: obj.color,
                        // }
                    }
                    socketQuery(o, res => {
                        console.log(res)
                        if (res.code != 0) return cb(res.code)  //проверка если ошибка то выходит
                        cb(null)
                    })
                }
            }, cb)
        },

        //getLarvaById: function!!!!!!!!!!!!!!!!
        //renderOneLarva: function(id)!!!!!!!!!!!!!!!!!

        getLarva: function(cb) {
            const _t = this
            async.series({
                getLarva: cb => {
                    //запрос на сервер (ядро)
                    let o = {
                        object: 'test_larva',
                        command: 'get',
                        params: {
                            param_where: {
                                test_bag_id: formInstance.activeId //тут мы получаем id жука
                            }
                        }
                    }
                    socketQuery(o, res => {
                        if (res.code != 0) return cb(res.code)  //проверка если ошибка то выходит
                        _t.storage.data.larva = Object.assign([], res.data) //запись в массив larva
                        cb(null)
                    })
                }
            }, cb)
        },

        renderLarvae: function(){
            const _t = this

                // let data = {
                //     lara_arr:  _t.storage.data.larva
                // }

                //document.getElementsByClassName('entry-title')[]

                //formWrapper - DOM html форма данной сущьности (листа..)
            // find('.holder-larvae') находит их html документа элемент класса holder-larvae в formWrapper
            // html - записываем в элемент holder-larvae результат того что в скобках
            // Mustache.to_html соединяет шаблон (_t.storage.template.larva)  и данные (_t.storage.data.larva)
                formWrapper.find('.holder-larvae').html(Mustache.to_html(_t.storage.template.larva, _t.storage.data.larva))
        },

        setHandlers: function() {
            const _t = this
            formWrapper.find('.add-new-larva').off('click').on('click', (e) => {
                _t.addLarvaRemote({
                    name: formWrapper.find('.new-larva-name').val(), //берем из html элемента класса new-larva-name данные
                    size: formWrapper.find('.new-larva-size').val(),
                    width: formWrapper.find('.new-larva-width').val(),
                    color: formWrapper.find('.new-larva-color').val()

                }, (res) => {})
                // let size = formWrapper.find('.size-input').val()
            });
        },

        init: function () {
            const _t = this

            // obj = {
            //
            // }
            //
            // array = []

            // (cb) => {
            //     return _t.getLarva (cb)
            // }

            async.series({
                getLarva: cb => _t.getLarva(cb),
                renderLarvae: cb => {
                    _t.renderLarvae()
                    cb(null)
                },
            }, (err, res) => {
                _t.setHandlers()
            })
        },

        reload: function () {

        }

    }

    debugger
    test_bag.testFunc()
    test_bag.testFuncAr();


/*
    formWrapper.find('.itt_option').off('click').on('click', (e) => {
        let size = formWrapper.find('.size-input').val()

    });

*/

    // let Larva = function(name) {
    //     this.name = name
    // }
    //
    // Larva.prototype.getName = function() {
    //     return this.name
    // }
    //
    //

    // class Larva {
    //     constructor(name) {
    //         this.name = name;
    //     }
    //
    //     getName() {
    //         return this.name
    //     }
    // }


    // let larva_0 = new Larva('Il')

    formInstance.doNotGetScript = true;
    formInstance.afterReload = function(cb){};
    test_bag.init(); //тут вызываем метод инит



}());
