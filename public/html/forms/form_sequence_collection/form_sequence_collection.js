(function(){

    var modal = $('.mw-wrap').last();
    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_sequence_collection', formID);
    var formWrapper = $('#mw-'+formInstance.id);
    var id = formInstance.activeId;
    var se_tbl = formInstance.tblInstances[0];





    class ImportSequences {
        constructor() {
            this.storage = {
                wrapper: {},
                data: {}
            }
            this.storage.data.project_id = formInstance.params.project_id
            this.storage.data.parent_project_ids = undefined
            this.storage.wrapper = {}


            this.renderBootBox()
            this.initSelectSamplingEvent()
        }
        async socketQuery(o) {
            return new Promise((res, rej) => {
                socketQuery(o, resQ => {
                    res(resQ)
                })
            })
        }
        reloadTableSequencesCollection(ids) {
            const _t = this
            formInstance.tblInstances.forEach(tbl => {
                if (tbl.class == 'sequence') {
                    tbl.ct_instance.filterWhere.push({
                        key: 'data_individual_id',
                        type: 'in',
                        val1: ids,
                        comparisonType:'OR',
                        group: 'data_individual_id'
                    });
                    tbl.reload()
                }
            })
        }
        renderBootBox() {
            let _t = this
            this.bootbox_sequence = bootbox.dialog({
                message: '<select class="select-sampling-event-bootbox"></select>',
                title: "Import sequences",
                buttons: {
                    success: {
                        label: "OK",
                        callback: () => {
                            var fl = new ImageLoader({
                                dir: 'upload/',
                                success: async function (file) {
                                    let o = {
                                        object: 'sequence',
                                        command: 'importSequencesFromFile',
                                        params: {
                                            sampling_event_id: _t.storage.data.sampling_event_id,
                                            project_id: formInstance.params.project_id,
                                            file_name: file.name
                                        }
                                    }
                                    let res_import = await _t.socketQuery(o)
                                    // console.log(res_import.data.data_individuals_ids[i].id)
                                    // debugger

                                    _t.reloadTableSequencesCollection(res_import.data.data_individuals_ids.map(data => data.id))
                                }
                            });
                            fl.start();


                        }
                    },
                    danger: {
                        label: "Cancel",
                        callback: () => {}
                    },
                }
            });
            this.storage.wrapper.select_sampling_event = this.bootbox_sequence.find('select.select-sampling-event-bootbox')
        }
        async getParentsProjectIds() {
            const _t = this
            // getParentIds
            _t.storage.data.parent_project_ids = await _t.socketQuery({
                object: 'project',
                command: 'getParentIds',
                params: {
                    id: _t.storage.data.project_id
                }
            });
            _t.storage.data.parent_project_ids = [_t.storage.data.project_id].concat(_t.storage.data.parent_project_ids.ids)

        }
        async initSelectSamplingEvent() {
            const _t = this
            await _t.getParentsProjectIds()
            const selector = _t.storage.wrapper.select_sampling_event;
            const selectParams = {
                class_name: 'sampling_event',
                placeholder: 'Choose sampling event...',
                dependant_field: {
                    name: 'project_id',
                    value: _t.storage.data.project_id
                },
                selector
            }
            initCustomSelect(selectParams);

            selector.on('select2:select', function(e) {
                _t.storage.data.sampling_event_id = e.params.data.id
            });
            selector.on('select2:unselecting', function() {
                selector.data('unselecting', true);
            });
            selector.on('select2:opening', function(e) {})
            selector.on('select2:unselect', function(e) {
                _t.storage.data.sampling_event_id = undefined
            });
        }
    }

    class AddSequences {
        constructor(obj) {
            const _t = this
            _t.storage.data.project_id = obj.project_id
            _t.init()
        }
        storage = {
            template: {
                individuals: `{{#.}}
                    <div class="individual-item-bootbox-add-sequnce">
                        <div class="individual-item-bootbox-add-sequnce-name">
                            <div >ID: {{id}}</div>
                            <div >Taxon: {{taxon}}</div>
                            <div >Organism: {{name}}</div>
                        </div>
                        <input class="individual-item-bootbox-add-sequnce-checkbox" data-id="{{id}}" type="checkbox">
                    </div>
                {{/.}}`

            },
            data: {
                project_id: undefined,
                sampling_event_id: undefined,
                individuals: []
            },
            wrapper: {
                boot_box_main: undefined,
                select_sampling_event: undefined,
                list_checkbox_individual: undefined, //wrapper for individuals
                items_checkbox_individual: undefined
            }
        }
        async socketQuery(o) {
            return new Promise((res, rej) => {
                socketQuery(o, resQ => {
                    res(resQ)
                })
            })
        }
        async getIndividuals() {
            const _t = this
            let res_query_data_individual = await _t.socketQuery({
                object: 'data_individual',
                command: 'get',
                params: {
                    columns: ['id', 'name', 'taxon'],
                    param_where: {
                        sampling_event_id: _t.storage.data.sampling_event_id
                    }
                }
            });
            _t.storage.data.individuals = Object.values(res_query_data_individual.data)
        }
        async initListIndividuals() {
            const _t = this
            await _t.getIndividuals()
            _t.renderIndividuals()
            _t.setHandlersIndividuals()
        }
        renderBootBoxMain() {
            const _t = this
            _t.storage.wrapper.boot_box_main = bootbox.dialog({
                message: '<select class="select-sampling-event-bootbox"></select><div class="list-checkbox-individual-bootbox"></div>',
                title: "Add sequnces",
                buttons: {
                    success: {
                        label: "OK",
                        callback: () => {
                            _t.addNewSequences().then(() => {
                                _t.reloadTableSequencesCollection()
                            })
                        }
                    },
                    danger: {
                        label: "Cancel",
                        callback: () => {}
                    },
                }
            });
            _t.storage.wrapper.select_sampling_event = _t.storage.wrapper.boot_box_main.find('.select-sampling-event-bootbox')
            _t.storage.wrapper.list_checkbox_individual = _t.storage.wrapper.boot_box_main.find('.list-checkbox-individual-bootbox')
        }
        renderIndividuals() {
            const _t = this
            _t.storage.wrapper.items_checkbox_individual = _t.storage.wrapper.list_checkbox_individual.html(Mustache.to_html(_t.storage.template.individuals, _t.storage.data.individuals)).children()

        }
        clearListIndividuals(){
            const _t = this
            _t.storage.data.individuals = []
            _t.renderIndividuals()
        }
        setHandlersIndividuals() {
            const _t = this
            _t.storage.wrapper.items_checkbox_individual.find('input[type="checkbox"]').off('change').on('change', function (event) {
                _t.clickOnCheckboxIndivid($(this))
            })
        }
        clickOnCheckboxIndivid(checkbox) {
            const _t = this
            if (checkbox.attr('checked') == 'checked') {
                _t.storage.data.individuals.forEach(individ => {
                    if (individ.id == checkbox.data('id')) {
                        checkbox.parent().addClass('select')
                        individ.select = true
                    }
                })
            } else if (!checkbox.attr('checked')) {
                _t.storage.data.individuals.forEach(individ => {
                    if (individ.id == checkbox.data('id')) {
                        checkbox.parent().removeClass('select')
                        individ.select = false
                    }
                })
            }
        }
        initSelectSamplingEvent() {
            const _t = this

            const selector = _t.storage.wrapper.select_sampling_event;
            const selectParams = {
                class_name: 'sampling_event',
                placeholder: 'Choose sampling event...',
                dependant_field: {
                    name: 'project_id',
                    value: _t.storage.data.project_id
                },
                selector
            }

            initCustomSelect(selectParams);

            selector.on('select2:select', function(e) {
                _t.storage.data.sampling_event_id = e.params.data.id
                _t.initListIndividuals()
            });
            selector.on('select2:unselecting', function() {
                selector.data('unselecting', true);
            });
            selector.on('select2:opening', function(e) {})
            selector.on('select2:unselect', function(e) {
                _t.clearListIndividuals()
            });
        }
        reloadTableSequencesCollection() {
            const _t = this
            formInstance.tblInstances.forEach(tbl => {
                if (tbl.class == 'sequence') tbl.reload()
            })

        }
        async addNewSequences() {
            const _t = this
            await _t.socketQuery({
                object: 'sequence',
                command: 'addForIndividual',
                params: {
                    individual_ids: _t.storage.data.individuals.filter(individ => individ.select)
                }
            })
        }
        init() {
            const _t = this
            _t.renderBootBoxMain()
            _t.initSelectSamplingEvent()
        }
    }
    class ExtractionMethodsEdit {
        constructor() {
            const _t = this
            _t.init()
        }
        storage = {
            template: {
                extraction_methods: `{{#.}}
                    <div class="extraction-method-item-bootbox">
                        <div class="extraction-method-item-bootbox-name"><strong>Name method:</strong> {{name}}</div>
                        <br>
                        <div class="extraction-method-item-bootbox-weblink"><strong>Weblink:</strong> {{weblink}}</div>
                        <input class="extraction-method-item-bootbox-weblink-checkbox" data-id="{{id}}" type="checkbox">
                    </div>
                {{/.}}`
            },
            data: {
                extraction_methods: []
            },
            wrapper: {
                boot_box_main: undefined,
                wrapper_items_extraction_methods: undefined,
                items_extraction_methods: undefined,
                button_edit_name_extraction_methods: undefined,
                button_edit_weblink_extraction_methods: undefined,
            }
        }
        async socketQuery(o) {
            return new Promise((res, rej) => {
                socketQuery(o, resQ => {
                    res(resQ)
                })
            })
        }
        async getExtractionMethods() {
            const _t = this
            let extraction_methods = await _t.socketQuery({
                object: 'extraction_method',
                command: 'get',
                params: {
                    columns: ['id', 'name', 'weblink'],
                }
            });
            _t.storage.data.extraction_methods = Object.values(extraction_methods.data)
        }
        renderBootBoxMain() {
            const _t = this
            _t.storage.wrapper.boot_box_main = bootbox.dialog({
                message: '' +
                    '<div class="ct-environment-buttons">' +
                    '<ul>' +
                    '<li class="ct-environment-btn ct-btn-edit-name-extraction-methods-inline">' +
                    '<div class="nb btn btnDouble green">' +
                    '<i class="fa fa-plus"></i>'+
                    '<div class="btnDoubleInner">Edit selected names</div>' +
                    '</div>' +
                    '</li>' +
                    '<li class="ct-environment-btn ct-btn-edit-weblink-extraction-methods-inline">' +
                    '<div class="nb btn btnDouble green">' +
                    '<i class="fa fa-plus"></i>'+
                    '<div class="btnDoubleInner">Edit selected weblinks</div>' +
                    '</div>' +
                    '</li>' +
                    '</ul>' +
                    '</div>' +
                    '<div class="list-checkbox-extraction-methods-bootbox"></div>',
                title: "Edit extraction methods",
                buttons: {
                    success: {
                        label: "OK",
                        callback: () => {
                            _t.editExtractionMethods().then(() => {
                                _t.reloadTableSequencesCollection()
                            })
                        }
                    },
                    danger: {
                        label: "Cancel",
                        callback: () => {}
                    },
                }
            });
            _t.storage.wrapper.wrapper_items_extraction_methods = _t.storage.wrapper.boot_box_main.find('.list-checkbox-extraction-methods-bootbox')
            _t.storage.wrapper.button_edit_name_extraction_methods = _t.storage.wrapper.boot_box_main.find('.ct-btn-edit-name-extraction-methods-inline')
            _t.storage.wrapper.button_edit_weblink_extraction_methods = _t.storage.wrapper.boot_box_main.find('.ct-btn-edit-weblink-extraction-methods-inline')
        }
        renderExtractionMethods() {
            const _t = this
            _t.storage.wrapper.items_extraction_methods = _t.storage.wrapper.wrapper_items_extraction_methods.html(Mustache.to_html(_t.storage.template.extraction_methods, _t.storage.data.extraction_methods)).children()

        }
        setHandlersExtractionMethods() {
            const _t = this
            _t.storage.wrapper.items_extraction_methods.find('input[type="checkbox"]').off('change').on('change', function (event) {
                _t.clickOnCheckboxIndivid($(this))
            })
        }
        clickOnCheckboxIndivid(checkbox) {
            const _t = this
            if (checkbox.attr('checked') == 'checked') {
                _t.storage.data.extraction_methods.forEach(individ => {
                    if (individ.id == checkbox.data('id')) {
                        checkbox.parent().addClass('select')
                        individ.select = true
                    }
                })
            } else if (!checkbox.attr('checked')) {
                _t.storage.data.extraction_methods.forEach(individ => {
                    if (individ.id == checkbox.data('id')) {
                        checkbox.parent().removeClass('select')
                        individ.select = false
                    }
                })
            }
        }
        clickEditName() {
            const _t = this
            let bootbox_edit_name = bootbox.dialog({
                message:
                    '<div class="row-new-name-ext-methods">' +
                    '<div class="label-for-new-name">New name:</div>' +
                    '<input class="input-for-new-name-selected-methods" type="text">' +
                    '</div>',
                title: "New name for selected methods",
                buttons: {
                    success: {
                        label: "OK",
                        callback: () => {
                            for (let i in _t.storage.data.extraction_methods) {
                                if (_t.storage.data.extraction_methods[i].select) {
                                    _t.editNameExtractionMethods(bootbox_edit_name.find('input.input-for-new-name-selected-methods').val()).then(() => {
                                        _t.initListExtractionMethods()
                                        _t.reloadTableSequencesCollection()
                                    })
                                    break
                                }
                            }
                        }
                    },
                    danger: {
                        label: "Cancel",
                        callback: () => {}
                    },
                }
            });
        }
        clickEditWebLink() {
            const _t = this
            let bootbox_edit_name = bootbox.dialog({
                message:
                    '<div class="row-new-name-ext-methods">' +
                    '<div class="label-for-new-name">New weblink:</div>' +
                    '<input class="input-for-new-name-selected-methods" type="text">' +
                    '</div>',
                title: "New weblink for selected methods",
                buttons: {
                    success: {
                        label: "OK",
                        callback: () => {
                            for (let i in _t.storage.data.extraction_methods) {
                                if (_t.storage.data.extraction_methods[i].select) {
                                    _t.editWeblinkExtractionMethods(bootbox_edit_name.find('input.input-for-new-name-selected-methods').val()).then(() => {
                                        _t.initListExtractionMethods()
                                        _t.reloadTableSequencesCollection()
                                    })
                                    break
                                }
                            }
                        }
                    },
                    danger: {
                        label: "Cancel",
                        callback: () => {}
                    },
                }
            });
        }
        async editNameExtractionMethods(name) {
            const _t = this
            await _t.socketQuery({
                object: 'extraction_method',
                command: 'massiveEditName',
                params: {
                    name: name,
                    extraction_method_ids: _t.storage.data.extraction_methods.filter(extraction_method => extraction_method.select).map(extraction_method => extraction_method.id)
                }
            })
        }
        async editWeblinkExtractionMethods(weblink) {
            const _t = this
            await _t.socketQuery({
                object: 'extraction_method',
                command: 'massiveEditWeblink',
                params: {
                    weblink: weblink,
                    extraction_method_ids: _t.storage.data.extraction_methods.filter(extraction_method => extraction_method.select).map(extraction_method => extraction_method.id)
                }
            })
        }
        setHandlersButtons() {
            const _t = this
            _t.storage.wrapper.button_edit_name_extraction_methods.off('click').on('click', function (event) {
                _t.clickEditName()
            })
            _t.storage.wrapper.button_edit_weblink_extraction_methods.off('click').on('click', function (event) {
                _t.clickEditWebLink()
            })
        }
        reloadTableSequencesCollection() {
            const _t = this
            formInstance.tblInstances.forEach(tbl => {
                if (tbl.class == 'sequence') tbl.reload()
            })

        }
        async initListExtractionMethods() {
            const _t = this
            await _t.getExtractionMethods()
            _t.renderExtractionMethods()
            _t.setHandlersExtractionMethods()
            _t.setHandlersButtons()
        }
        init() {
            const _t = this
            _t.renderBootBoxMain()
            _t.initListExtractionMethods()
        }
    }
    class SequenceInterface {
        constructor(obj) {
            const _t = this
            _t.storage.data.project_id = obj.project_id
            _t.init();
        }
        storage = {
            template: {},
            data: {
                project_id: undefined
            },
            wrapper: {
                additional_btn_extraction_methods: undefined,
                additional_btn_primers: undefined,
                additional_btn_add_sequence: undefined,
                additional_btn_import_sequences_and_link_them: undefined,
                boot_box_add_sequences: undefined
            }
        }
        async socketQuery(o) {
            return new Promise((res, rej) => {
                socketQuery(o, resQ => {
                    res(resQ)
                })
            })
        }
        //дополнительные кнопки (над таблицей "коллекция ")
        renderAddtionalButtonOnSequenceCollection() {
            const _t = this
            _t.storage.wrapper.additional_btn_extraction_methods = $(formWrapper.find('.ct-environment-buttons').find('ul').prepend('<li class="ct-environment-btn ct-btn-extraction-methods-inline"><div class="nb btn btnDouble green"><i class="fa fa-plus"></i><div class="btnDoubleInner">Extraction methods</div></div></li>').children()[0])
            _t.storage.wrapper.additional_btn_primers = $(formWrapper.find('.ct-environment-buttons').find('ul').prepend('<li class="ct-environment-btn ct-btn-primers-inline"><div class="nb btn btnDouble green"><i class="fa fa-plus"></i><div class="btnDoubleInner">Primers</div></div></li>').children()[0])
            _t.storage.wrapper.additional_btn_add_sequence = $(formWrapper.find('.ct-environment-buttons').find('ul').prepend('<li class="ct-environment-btn ct-btn-add-sequence-inline"><div class="nb btn btnDouble green"><i class="fa fa-plus"></i><div class="btnDoubleInner">Add sequences</div></div></li>').children()[0])
            _t.storage.wrapper.additional_btn_import_sequences_and_link_them = $(formWrapper.find('.ct-environment-buttons').find('ul').prepend('<li class="ct-environment-btn ct-btn-import-sequences-and-link-them-inline"><div class="nb btn btnDouble green"><i class="fa fa-plus"></i><div class="btnDoubleInner">Import sequences and link them</div></div></li>').children()[0])
        }
        //обработчики дополнительных кнопок (над таблицей "коллекция ")
        setHandlersAdditionalButtons() {
            const _t = this
            _t.storage.wrapper.additional_btn_extraction_methods.off('click').on('click', () => {
                _t.handlerExtractionMethodsEdit()
            });
            _t.storage.wrapper.additional_btn_primers.off('click').on('click', () => {
                _t.handlerPrimers()

            });
            _t.storage.wrapper.additional_btn_add_sequence.off('click').on('click', () => {
                _t.handlerAddSequences()
            });
            _t.storage.wrapper.additional_btn_import_sequences_and_link_them.off('click').on('click', () => {
                _t.handlerImportSequencesAndLinkThem()
            });
        }
        handlerAddSequences() {
            const _t = this
            new AddSequences({
                project_id: _t.storage.data.project_id
            })
        }
        handlerImportSequencesAndLinkThem() {
            const _t = this


            new ImportSequences()


        }
        async handlerPrimers() {
            const _t = this

            let res = await _t.socketQuery({
                object: 'primer_pair',
                command: 'get',
                params: {
                    limit: 1
                }
            }).then((res) => {
                return res.data[0]
            })

            let formId = MB.Core.guid();
            let form = new MB.FormN({
                id: formId,
                name: 'form_primer_pair',
                class: 'primer_pair',
                client_object: 'form_primer_pair',
                type: 'form',
                ids: [res.id],
                params: {},
                position: 'center'
            });

            form.create(function () {

            });
        }
        handlerExtractionMethodsEdit() {
            const _t = this
            new ExtractionMethodsEdit()
        }
        async init()  {
            const _t = this
            _t.renderAddtionalButtonOnSequenceCollection()
            _t.setHandlersAdditionalButtons()
        }
    }

    new SequenceInterface({
        project_id: formInstance.params.project_id
    });


    formInstance.doNotGetScript = true;
    formInstance.afterReload = function(cb){
        // Можно запихнуть все что нужно вызвать при релоаде без загрузки нового скрипта.
        // exampleEditor.reload();
        cb();
    };
    // exampleEditor.init();



}());
