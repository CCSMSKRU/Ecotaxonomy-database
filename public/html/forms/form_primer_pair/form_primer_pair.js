(function(){


    var modal = $('.mw-wrap').last();
    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_primer_pair', formID);

    var formWrapper = $('#mw-'+formInstance.id);

    // var id = formInstance.activeId;

    var primer_factor_editor = {
        storage: {
            pairs: [],
            primer_taxons: [],
            changes_primer_taxons: {},
            template: {
                pairs: `{{#.}}
                    <div class="custom-list-item" data-id="{{id}}">
                        {{name}}
<!--                        <div class="primer-funcs">-->
<!--                            <i class="button-fa-primer-form remove fa fa-trash-o" data-id="{{id}}"></i>-->
<!--                        </div>-->
                        <br/>
                    </div>
                {{/.}}`,
                primer_taxons: `
                    {{#.}}<div class="trait-select-value-add-item flex" data-id="{{id}}">
                            <input type="text" class="form-control primer-taxon-annealing"  value="{{annealing}}"  data-id="{{id}}"/>
                            <div class="holder-select3-taxon" data-id="{{id}}" data-taxon-id="{{taxon_id}}" data-name="{{taxon}}"></div>
                            <i class="fa fa-trash-o remove-interface-primer-taxon" data-id="{{id}}"></i>
                        </div>
                    {{/.}}
                `
            },
            select_pair_id: undefined,
            filters: {
                molecule_type_id: undefined,
                sequencing_method_id: undefined,
                sequence_id: undefined,
                name: undefined
            },
        },
        init: function (cb) {
            async.series({
                initListPrimers: cb => {
                    this.initListPrimers((err, res) => {
                        cb(err)
                    })
                },
            }, (err, res) => {
                this.moleculeTypeFilterInit();
                this.sequencingMethodFilterInit();
                this.nameFilterInit();
                this.sequenceFilterInit();
                this.setHandlerAddNewPrimer();
                this.setHandlerNewPrimerTaxon();
                // this.setHandlerFormationInterfacePrimerTaxon()
                // this.setHandlerRemovePrimer()
                if (formInstance.params.sequence_id) {
                    formWrapper.find("select.sequence-filter")
                        .append(new Option(formInstance.params.sequence_name, formInstance.params.sequence_id, false, true))
                        .trigger('change')
                        .trigger('select2:select');
                }
                if (formInstance.activeId) {
                    this.selectPair(formInstance.activeId)
                }
                if (err) return cb(err);
                cb(null)
            })
        },
        reload: function(cb){
            primer_factor_editor.setHandlers();
            primer_factor_editor.initListPrimers();
        },
        initListPrimers: function(cb) {
            let _t = this;
            async.series({
                getPrimers: cb => {
                    _t.getPrimers((err, res) => {
                        cb(err)
                    })
                },
                renderPrimers: cb => {
                    _t.renderPrimers((err, res) => {
                        cb(err)
                    })
                },
                selectPair: cb => {
                    for (let i in _t.storage.pairs) {
                        if (_t.storage.pairs[i].id == _t.storage.select_pair_id) {
                            _t.selectPair(_t.storage.select_pair_id)
                        }
                    }
                    cb(null)
                },
                setHandlersPairs: cb => {
                    _t.setHandlersPairs((err, res) => {
                        cb(null)
                    })
                }
            }, (err, res) => {
                if (err) return cb(err);
                if (cb) cb(null)
            })
        },
        getPrimers: function(cb) {
            let _t = this;
            let o = {
                command: 'get',
                object: 'primer_pair',
                params: {
                    columns: ['id', 'name'],
                    param_where: {},
                    where: []
                }
            };

            if (_t.storage.filters.molecule_type_id) o.params.param_where.target_gene_type_id = _t.storage.filters.molecule_type_id;
            if (_t.storage.filters.sequencing_method_id) o.params.param_where.sequencing_method_id = _t.storage.filters.sequencing_method_id;
            if (_t.storage.filters.sequence_id) o.params.param_where.sequence_id = _t.storage.filters.sequence_id;
            if (_t.storage.filters.name) o.params.where.push({key: 'name', type: 'LIKE', val1: _t.storage.filters.name});

            socketQuery(o, res => {
                if (res.code == 0) {
                    _t.storage.pairs = Object.values(res.data);
                    return cb (null)
                } else {
                    return cb(res.code)
                }
            })
        },
        renderPrimers: function(cb) {
            let _t = this;
            formWrapper.find('.primer_switcher_holder').html(   Mustache.to_html(_t.storage.template.pairs, _t.storage.pairs)     );
            cb(null)
        },
        setHandlersPairs: function(cb) {
            let _t = this;
            formWrapper.find('.primer_switcher_holder').find('.custom-list-item').off('click').on('click', function () {
                _t.selectPair($(this).attr('data-id'));
                _t.loadFormEditPair()
            });
            cb(null)
        },
        selectPair: function(id, cb) {
            let _t = this;

            async.series({
                // "подсвечивает" выбранный primer
                magicHtml: cb => {
                    let before_select_pair_id = _t.storage.select_pair_id;
                    _t.storage.select_pair_id = id;
                    formWrapper.find('.custom-list-item').removeClass('custom-list-item-selected');
                    formWrapper.find('.custom-list-item[data-id="' + _t.storage.select_pair_id + '"]').toggleClass('custom-list-item-selected');
                    cb(null)
                },
                interfacePrimerTaxon: cb => {
                    async.series({
                        getPrimerTaxons: cb => {
                            _t.getPrimerTaxons(err => {
                                cb(err)
                            })
                        },
                        clear: cb => {
                            _t.clearChangesInterface();
                            cb(null)
                        },
                        render: cb => {
                            _t.renderPrimerTaxons();
                            cb(null)
                        },
                        initOneSelect3: cb => {
                            _t.initSelect3PrimerRaxons((err, res) => {
                                cb(err)
                            })
                        },
                        setHandlers: cb => {
                            _t.setHandlersPrimerTaxon();
                            cb(null)
                        }
                    }, (err, res) => {
                        if (err) return cb(err);
                        cb(null)
                    })
                }
            }, (err, res) => {
                if (cb) {
                    if (err)
                        return cb(err);
                    cb(null)
                }
            })
        },
        clearChangesInterface: function() {
            this.setChangeInterfacePrimerTaxon();
            // this.storage.changes_primer_taxons = {}
        },
        loadFormEditPair: function(cb) {
            var id = this.storage.select_pair_id;
            formInstance.activeId = id;
            formInstance.tablePKeys['data'][0] = id;
            formInstance.reload((err, res) => {
                formWrapper.find('.name-place').html(formInstance.data.data[0].name);
                if (cb) cb(err)
            });
        },
        sequenceFilterInit: function() {
            let _t = this;
            const selector = formWrapper.find('select.sequence-filter');
            const selectParams = {
                class_name: 'sequence',
                placeholder: 'Choose sequence type...',
                selector
            };

            initCustomSelect(selectParams);

            selector.on('select2:select', function(e) {
                if (e.params) {
                    _t.storage.filters.sequence_id = e.params.data.id;
                    _t.initListPrimers((res, err) => {})
                } else {
                    _t.storage.filters.sequence_id = formInstance.params.sequence_id;
                    _t.initListPrimers((res, err) => {})
                }

            });

            selector.on('select2:unselecting', function() {
                selector.data('unselecting', true);
            });

            selector.on('select2:opening', function(e) {
            });

            selector.on('select2:unselect', function(e) {
                _t.storage.filters.sequence_id = undefined;
                _t.initListPrimers((res, err) => {})
            });
        },
        moleculeTypeFilterInit: function () {
            let _t = this;
            const selector = formWrapper.find('select.molecule-type-filter');
            const selectParams = {
                class_name: 'target_gene_type',
                placeholder: 'Choose molecule type...',
                selector
            };

            initCustomSelect(selectParams);

            selector.on('select2:select', function(e) {
                _t.storage.filters.molecule_type_id = e.params.data.id;
                _t.initListPrimers((res, err) => {})
            });

            selector.on('select2:unselecting', function() {
                selector.data('unselecting', true);
            });

            selector.on('select2:opening', function(e) {
            });

            selector.on('select2:unselect', function(e) {
                _t.storage.filters.molecule_type_id = undefined;
                _t.initListPrimers((res, err) => {})
            });
        },
        sequencingMethodFilterInit: function () {
            let _t = this;
            const selector = formWrapper.find('select.sequencing-method-filter');
            const selectParams = {
                class_name: 'sequencing_method',
                placeholder: 'Choose sequencing method type...',
                selector
            };

            initCustomSelect(selectParams);

            selector.on('select2:select', function(e) {
                _t.storage.filters.sequencing_method_id = e.params.data.id;
                _t.initListPrimers((res, err) => {})
            });

            selector.on('select2:unselecting', function() {
                selector.data('unselecting', true);
            });

            selector.on('select2:opening', function(e) {
            });

            selector.on('select2:unselect', function(e) {
                _t.storage.filters.sequencing_method_id = undefined;
                _t.initListPrimers((res, err) => {})
            });
        },
        nameFilterInit: function() {
            let _t = this;
            formWrapper.find('input.name-filter').off('input').on('input', function() {
                let text = $(this).val();
                if (text.length == 0) _t.storage.filters.name = undefined;
                if (text.length > 0) _t.storage.filters.name = text;
                _t.initListPrimers((res, err) => {})
            })
        },
        addNewPrimer: function() {
            const _t = this;
            async.series({
                createPrimer: cb => {
                    socketQuery({
                        command: 'add',
                        object: 'primer_pair',
                        params: {
                            name: 'new Primer'
                        }
                    }, res => {
                        if (res.code != 0) return cb(res.code);
                        cb(null)
                    })
                },
                reloadListPrimers: cb => {
                    _t.initListPrimers(err => {
                        cb(err)
                    })
                }
            }, (err, res) => {
                if (cb) cb(err)
            })
        },
        // removePrimer: function(id, cb) {
        //     const _t = this;
        //     async.series({
        //         remove: cb => {
        //             socketQuery({
        //                 object: 'primer_pair',
        //                 command: 'remove',
        //                 params: {
        //                     id: id
        //                 }
        //             }, res => {
        //                 if (res.code != 0) return cb(res.code)
        //                 cb(null)
        //             })
        //         },
        //         reload: cb => {
        //             _t.initListPrimers(res => {
        //                 cb(res)
        //             })
        //         }
        //     }, (err, res) => {
        //         if (cb) {
        //             if (err) return cb(err)
        //             cb(null)
        //         }
        //     })
        // },
        getPrimerTaxons: function(cb) {
            const _t = this;

            socketQuery({
                command: 'get',
                object: 'interface_primer_taxon',
                params: {
                    param_where: {
                        primer_pair_id: _t.storage.select_pair_id
                    }
                }
            }, res => {
                if (res.code != 0)
                    if (cb)
                        return cb(res.code);
                _t.storage.primer_taxons = [];
                for (let i in res.data)
                    _t.storage.primer_taxons.push({
                        id: res.data[i].id,
                        taxon_id: res.data[i].taxon_id,
                        taxon: res.data[i].taxon,
                        primer_pair_id: res.data[i].primer_pair_id,
                        primer_pair: res.data[i].primer_pair,
                        annealing: res.data[i].annealing
                    })


                if (cb) cb(null)
            })
        },
        renderPrimerTaxons: function(obj) {
            formWrapper.find('.interface-primer-taxon')[obj ? 'append' : 'html'](Mustache.to_html(this.storage.template.primer_taxons, obj ? [obj] : this.storage.primer_taxons))
        },
        initSelect3PrimerRaxons: function(obj, cb) {
            const _t = this;

            if (arguments.length == 0) {}
            if (arguments.length == 1) {
                if (typeof arguments[0] === 'object') {
                    obj = arguments[0];
                    cb = undefined
                } else if (typeof arguments[0] === 'function') {
                    cb = arguments[0];
                    obj = undefined
                }
            }



            let select3_elements = formWrapper.find('.holder-select3-taxon' + (obj ? '[data-id="' + obj.id + '"]' : '')).toArray();
            async.eachSeries(select3_elements, (select3_el, cb) => {
                console.log(select3_el);
                selInstance = MB.Core.select3.init({
                    id :                MB.Core.guid(),
                    wrapper:            $(select3_el),
                    column_name:        'id',
                    class:              'taxon',
                    client_object:      'taxon',
                    return_id:          'id',
                    return_name:        'name',
                    withSearch:         true,
                    withEmptyValue:     true,
                    absolutePosition:   true,
                    isFilter:           false,
                    parentObject:       {},
                    value: {
                        id: $(select3_el).data('taxon-id'),
                        name: $(select3_el).data('name')
                    },
                    additionalClass:    ''
                }, () => {
                    cb(null)
                });

                $(selInstance).on('changeVal', (event, param1, param2) =>{

                    _t.setChangeInterfacePrimerTaxon({
                        id: $(select3_el).parent().data('id'),
                        value: {
                            taxon_id: param2.id,
                        }
                    })
                })
            }, (err, res) => {
                if (cb) {
                    if (err) return cb(err);
                    cb(null)
                }
            })
        },
        setHandlersPrimerTaxon: function(obj) {
            const _t = this;

            let input = formWrapper.find('.primer-taxon-annealing' + (obj ? '[data-id="' + obj.id + '"]' : ''));
            input.inputmask("decimal", { min: -1800, max: 1800, allowMinus: true });
            input.keyup(function (event) {
                _t.setChangeInterfacePrimerTaxon({
                    id: $(event.target).data('id'),
                    value: {
                        annealing: event.currentTarget.value
                    }
                })
            });

            let remove_btn = formWrapper.find('.remove-interface-primer-taxon' + (obj ? '[data-id="' + obj.id + '"]' : ''));
            remove_btn.off('click').on('click', function () {
                // console.log($(this).data('id'))
                _t.removeInterfacePrimerTaxon($(this).data('id'), () => {})
            })
        },
        setHandlerNewPrimerTaxon: function(cb) {
            const _t = this;
            formWrapper.find('.formation-interface-primer-taxon').off('click').on('click', function () {
                _t.addNewPrimerTaxon(res => {})
            })
        },
        addNewPrimerTaxon: function(cb) {
            const _t = this;
            let last_id;
            let last_primer_taxon;
            async.series({
                addNewPrimerTaxon: cb => {
                    socketQuery({
                        command: 'add',
                        object: 'interface_primer_taxon',
                        params: {
                            primer_pair_id: _t.storage.select_pair_id
                        }
                    }, res => {
                        if (res.code != 0) return cb(res.code);
                        last_id = res.id;
                        cb(null)
                    })
                },
                getNewPrimerTaxon: cb => {
                    socketQuery({
                        command: 'get',
                        object: 'interface_primer_taxon',
                        params: {
                            param_where: {
                                id: last_id
                            }
                        }
                    }, res => {
                        if (res.code != 0) return cb(res.code);
                        last_primer_taxon = {
                            id: res.data[0].id,
                            taxon_id: res.data[0].taxon_id,
                            taxon: res.data[0].taxon,
                            primer_pair_id: res.data[0].primer_pair_id,
                            primer_pair: res.data[0].primer_pair,
                            annealing: res.data[0].annealing
                        };
                        _t.storage.primer_taxons.push(last_primer_taxon);
                        cb(null)
                    })
                },
                renderOnePrimerTaxons: cb => {
                    _t.renderPrimerTaxons(last_primer_taxon);
                    cb(null)
                },
                initOneSelect3PrimerRaxons: cb => {
                    _t.initSelect3PrimerRaxons(last_primer_taxon, (err, res) => {
                        cb(err)
                    })
                },
                setHandlersOnePrimerTaxon: cb => {
                    _t.setHandlersPrimerTaxon(last_primer_taxon);
                    cb(null)
                }
            }, (err, res) => {
                if (cb) {
                    if (err) return cb(err);
                    cb(null)
                }
            })
        },
        setHandlerAddNewPrimer: function() {
            const _t = this;
            formWrapper.find('.add-new-primer').off('click').on('click', function () {
                _t.addNewPrimer()
            })
        },
        // setHandlerRemovePrimer: function() {
        //     const _t = this
        //     formWrapper.find('.remove').off('click').on('click', function (event) {
        //         event.stopPropagation();
        //         // _t.removePrimer(id)
        //     })
        // },
        setHandlers: function () {},

        applyChangesInterfacePrimerTaxons: function(cb) {
            const _t = this;
            async.eachSeries(_t.storage.changes_primer_taxons, (change, cb) => {
                let o = {
                    command: 'modify',
                    object: 'interface_primer_taxon',
                    params: {
                        id: change.id,
                        annealing: change.setValue.annealing,
                        taxon_id: change.setValue.taxon_id
                    }
                };
                socketQuery(o, res => {
                    if (res.code != 0) return cb(res.code);
                    cb(null)
                })
            }, (err, res) => {
                if (!err) {
                    _t.clearChangesInterface();
                    if (cb) cb(null)
                }
            })
        },

        setChangeInterfacePrimerTaxon: function (obj) {
            const _t = this;

            if (!obj) {
                _t.storage.changes_primer_taxons = {};
                formWrapper.find('.changes-btn-interface').removeClass('active-save-button-changes-interface-primer-taxon');
                formWrapper.find('.changes-btn-interface').off('click');
                return
            }

            // console.log(JSON.stringify(_t.storage.changes_primer_taxons))
            if (!_t.storage.changes_primer_taxons[obj.id]) {
                _t.storage.changes_primer_taxons[obj.id] = {
                    id: obj.id,
                    value: {},
                    setValue: {}
                };
                for (let i in _t.storage.primer_taxons) {
                    if (_t.storage.primer_taxons[i].id = obj.id) {
                        for (let j in obj.value) {
                            _t.storage.changes_primer_taxons[obj.id].value[j] = _t.storage.primer_taxons[i][j];
                            _t.storage.changes_primer_taxons[obj.id].setValue[j] = obj.value[j]
                        }
                    }
                }
            } else if (_t.storage.changes_primer_taxons[obj.id]) {
                for (let i in obj.value) {
                    if (!_t.storage.changes_primer_taxons[obj.id].value[i]) {
                        for (let j in _t.storage.primer_taxons) {
                            if (_t.storage.primer_taxons[j].id == obj.id) {
                                _t.storage.changes_primer_taxons[obj.id].value[i] = _t.storage.primer_taxons[j][i];
                                _t.storage.changes_primer_taxons[obj.id].setValue[i] = obj.value[i]
                            }
                        }
                    } else if (_t.storage.changes_primer_taxons[obj.id].value[i]) {
                        _t.storage.changes_primer_taxons[obj.id].setValue[i] = obj.value[i]
                    }
                }
            }
            formWrapper.find('.changes-btn-interface').addClass('active-save-button-changes-interface-primer-taxon');
            formWrapper.find('.changes-btn-interface').off('click').on('click', function () {
                _t.applyChangesInterfacePrimerTaxons()
            })
            // console.log(JSON.stringify(_t.storage.changes_primer_taxons))

        },

        removeInterfacePrimerTaxon: function (id, cb) {
            const _t = this;

            async.series({
                removeRemote: cb => {
                    let o = {
                        command: 'remove',
                        object: 'interface_primer_taxon',
                        params: {
                            id: id
                        }
                    };
                    socketQuery(o, res => {
                        if (res.code != 0) {
                            cb(err)
                        } else {
                            cb(null)
                        }
                    })
                },
                removeFromState: cb => {
                    if (_t.storage.changes_primer_taxons[id]) {
                        delete _t.storage.changes_primer_taxons[id]
                    }
                    cb(null)
                },
                removeFromDom: cb => {
                    formWrapper.find('.trait-select-value-add-item[data-id="' + id + '"]').remove();
                    cb(null)
                }
            }, (err, res) => {
                if (err) return cb(err);

                cb(null)
            })

        },
    };
    formInstance.doNotGetScript = true;
    formInstance.afterReload = function(cb){
        // alert(1123)
        // primer_factor_editor.reload();
        // cb();
        primer_factor_editor.initListPrimers()
    };
    primer_factor_editor.init((err, res) => {

    });

}());
