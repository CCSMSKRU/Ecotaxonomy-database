(function() {

    var modal = $('.mw-wrap').last();
    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_sample', formID);
    var formWrapper = $('#mw-' + formInstance.id);

    var id = formInstance.activeId;


    var samples = {
        taxon: [],
        paTaxon: [],
        defined: [],
        saved_values: [],

        tpl:    `{{#is_defined}}
                <div class="defined-add-block">
                    <div class="add-label">Add:</div>
                        <div class="quantity-big">
                            <input type="number" min="0" class="to-add-count" value="0" data-unique="defined"/>
                        </div>
                        <div class="select-storage-holder" data-selected-id="" data-selected-name=""><div class="s-value"><span class="unselected">Select storage</span></div><div class="s-dd"></div></div>
                        <div class="select-taxon-holder-label">Taxon: </div><div id="select-taxon-holder"><select></select></div>
                        <div class="add-name-holder"><input type="text" class="add-name-input" placeholder="Name"></div>                                                                       
                        <div class="add-apply apply-defined" data-id="{{id}}">Apply</div>
                    </div>
                {{/is_defined}}{{#items}}<div class="sample-item sample-empty-table" data-id="{{id}}">
                <div class="sample-add-holder">
                    <div class="sample-name">{{name}}</div>
                    <div class="sample-funcs" data-id="{{id}}">
                        <div class="add-label">Add:</div>
                        <div class="quantity-big">
                            <input type="number" min="0" class="to-add-count" value="0"  data-unique="{{id}}"/>
                        </div>
                        <div class="select-storage-holder" data-selected-id="" data-selected-name=""><div class="s-value"><span class="unselected">Select storage</span></div><div class="s-dd"></div></div>
                        <div class="add-name-holder"><input type="text" class="add-name-input" placeholder="Name"></div>                                               
                        <!--<div class="add-apply" data-id="{{id}}">Apply</div>                    -->
                    </div>
                </div>
                <div class="light-table-holder-{{type}} light-table-holder-uni" data-id="{{id}}"></div>
                </div>{{/items}}`,

        init: function(cb){
            samples.getData(function(){

                samples.populateTaxon();
                samples.populateParentalTaxon();
                samples.populateDefinedTaxon();

                samples.setHandlers();
            });

        },

        getData: function(cb){

            var o = {
                command: 'getSplitedSampleObj',
                object: 'sample',
                params: {
                    id: formInstance.activeId
                }
            }

            socketQuery(o, function(res){
                if(res.code != 0){
                    toastr[res.toastr.type](res.toastr.message);
                    return;
                }

                samples.taxon = res.data.project_taxon;
                samples.paTaxon = res.data.parent_taxon;
                samples.defined = res.data.defined_taxon;

                if(typeof cb == 'function'){
                    cb();
                }

            });

        },

        populateTaxon: function(){

            var mo = {
                items: []
            }

            console.log('SAVED', samples.saved_values);

            for(var i in samples.taxon){
                var sd = samples.taxon[i]
                sd.type = 'taxon';
                mo.items.push(sd);
            }


            formWrapper.find('.project-taxon-holder').html(Mustache.to_html(samples.tpl, mo));

            var all_arr = formWrapper.find('.light-table-holder-taxon');
            var all_len = all_arr.length;
            var loaded = 0;

            function rec(wrapper){

                if(loaded < all_len){
                    var item = formWrapper.find('.light-table-holder-taxon').eq(loaded);
                    var taxon_id = item.attr('data-id');


                    var light_table = new MB.TableN({
                        name: 'some name',
                        client_object: 'sample_data_individual',
                        class: 'data_individual',
                        id: MB.Core.guid(),
                        // doNotUseCache:true, // Настроено в клиентском объекте
                        virtual_data: {
                            virtual_where: 'project_taxon',
                            taxon_id: taxon_id,
                            sample_id: formInstance.activeId
                        }
                    });

                    light_table.create(wrapper, function () {

                        if(Object.keys(light_table.data.data).length > 0){

                            formWrapper.find('.sample-item[data-id="'+taxon_id+'"]').removeClass('sample-empty-table');
                        }else{
                            formWrapper.find('.sample-item[data-id="'+taxon_id+'"]').addClass('sample-empty-table');
                        }

                        loaded++;


                        rec($('.light-table-holder-taxon').eq(loaded));
                    });
                }else{

                }
            }

            rec(formWrapper.find('.light-table-holder-taxon').eq(0));


        },

        populateParentalTaxon: function(){

            var mo = {
                items: []
            }

            for(var i in samples.paTaxon){
                var sd = samples.paTaxon[i]
                sd.type = 'parental-taxon';
                mo.items.push(sd);
            }




            // (function(){
            //     var formId = MB.Core.guid();
            //     var id = 23;
            //
            //     var openInModalO = {
            //         id: formId,
            //         name: 'form_sample',
            //         class: 'sample',
            //         client_object: 'form_sample',
            //         type: 'form',
            //         ids: [id],
            //         position: 'center',
            //         tablePKeys: {data_columns: ["id"], data: [id]}
            //     };
            //
            //     var form = new MB.FormN(openInModalO);
            //     form.create(function () {
            //
            //     });
            // }())




            formWrapper.find('.parental-project-taxon-holder').html(Mustache.to_html(samples.tpl, mo));


            var all_arr = formWrapper.find('.light-table-holder-parental-taxon');
            var all_len = all_arr.length;
            var loaded = 0;

            function rec(wrapper){

                if(loaded < all_len){
                    var item = formWrapper.find('.light-table-holder-parental-taxon').eq(loaded);
                    var taxon_id = item.attr('data-id');

                    var light_table = new MB.TableN({
                        name: 'some name',
                        client_object: 'sample_data_individual',
                        class: 'data_individual',
                        id: MB.Core.guid(),
                        doNotUseCache:true,
                        virtual_data: {
                            virtual_where: 'parent_taxon',
                            taxon_id: taxon_id,
                            sample_id: formInstance.activeId
                        }
                    });

                    light_table.create(wrapper, function () {
                        console.log('new table rendered');

                        if(Object.keys(light_table.data.data).length > 0){

                            formWrapper.find('.sample-item[data-id="'+taxon_id+'"]').removeClass('sample-empty-table');
                        }else{
                            formWrapper.find('.sample-item[data-id="'+taxon_id+'"]').addClass('sample-empty-table');
                        }

                        loaded++;


                        rec($('.light-table-holder-parental-taxon').eq(loaded));
                    });
                }else{

                }

            }

            rec(formWrapper.find('.light-table-holder-parental-taxon').eq(0));



        },

        populateDefinedTaxon: function(){

            var mo = {
                items: [],
                is_defined: true
            }

            for(var i in samples.defined){
                var sd = samples.defined[i]
                sd.type = 'defined-taxon';
                mo.items.push(sd);
            }


            formWrapper.find('.defined-taxon-holder').html(Mustache.to_html(samples.tpl, mo));

            var all_arr = formWrapper.find('.light-table-holder-defined-taxon');
            var all_len = all_arr.length;
            var loaded = 0;

            function rec(wrapper){

                if(loaded < all_len){
                    var item = formWrapper.find('.light-table-holder-defined-taxon').eq(loaded);
                    var taxon_id = item.attr('data-id');

                    var light_table = new MB.TableN({
                        name: 'some name',
                        client_object: 'sample_data_individual',
                        class: 'data_individual',
                        id: MB.Core.guid(),
                        doNotUseCache:true,
                        virtual_data: {
                            virtual_where: 'defined_taxon',
                            taxon_id: taxon_id,
                            sample_id: formInstance.activeId
                        }
                    });

                    light_table.create(wrapper, function () {
                        console.log('new table rendered');

                        if(Object.keys(light_table.data.data).length > 0){
                            formWrapper.find('.sample-item[data-id="'+taxon_id+'"]').removeClass('sample-empty-table');
                        }else{
                            formWrapper.find('.sample-item[data-id="'+taxon_id+'"]').addClass('sample-empty-table');
                        }

                        loaded++;


                        rec($('.light-table-holder-defined-taxon').eq(loaded));
                    });
                }else{

                }

            }

            rec(formWrapper.find('.light-table-holder-defined-taxon').eq(0));

            let limit = 25;
            let select_class = 'taxon';
            let select_return_name = 'name';
	        formWrapper.find('#select-taxon-holder select').select2({
		        // data: [{
		        //    id: object[select_data_keyword],
		        //    text: object[column_name],
		        //    selected: true
		        // }],
		        allowClear: true,
		        placeholder: 'Select value...',
		        ajax: {
			        dataType: 'json',
			        delay: 250,
			        transport: function (params, success, failure) {
				        // console.error('transport params', params);

				        let o = {
					        command: 'get',
					        object: select_class,
					        params: {
						        limit: limit,
						        page_no: params.data.page || 1,
						        collapseData: false
					        }
				        };

				        if (params.data.term) {
					        params.where.push({
						        key: select_return_name,
						        type: 'like',
						        val1: params.data.term
					        })
				        }

				        socketQuery(o, res => {
					        if (res) {
						        let data = [];

						        res.forEach(row => {
							        data.push({
								        id: row.id,
								        text: row[select_return_name]
							        })
						        });

						        success({
							        items: data,
							        size: data.length
						        });
					        } else {
						        failure('failed');
					        }
				        });
			        },
			        processResults: function (data, params) {
				        // console.log('processResults', data, params);

				        params.page = params.page || 1;

				        return {
					        results: data.items,
					        pagination: {
						        more: data.size === limit
					        }
				        };
			        },
		        }
	        })

	        // var sel_id = MB.Core.guid();
	        //
	        // formWrapper.find('#select-taxon-holder').attr('data-selid', sel_id);
	        //
            // var selInstance = MB.Core.select3.init({
            //     id :                sel_id,
            //     wrapper:            formWrapper.find('#select-taxon-holder'),
            //     column_name:        'id',
            //     class:              'taxon',
            //     client_object:      'taxon',
            //     return_id:          'id',
            //     return_name:        'name',
            //     withSearch:         true,
            //     withEmptyValue:     true,
            //     absolutePosition:   true,
            //     isFilter:           false,
            //     parentObject:       {},
            //     value: {},
            //     additionalClass:    ''
            // });


        },

        setHandlers: function(){

            formWrapper.find('.execute-sample').off('click').on('click', function(){


                var o = {
                    command:'applySplitedSampleObj',
                    object:'Sample',
                    params:{
                        id:formInstance.activeId,
                        data: {
                            exist_data_individual: {},
                            new_data_individual: {}
                        }
                    }
                };

                for(var i =0; i < formWrapper.find('.sample-grp').length; i++){

                    var g = formWrapper.find('.sample-grp').eq(i);

                    var id = g.attr('data-id');
                    var taxon_id = g.parents('.sample-item').attr('data-id');
                    var val = g.find('input').val();
                    var storage_id = g.find('.select-storage-holder').attr('data-selected-id');


                    if(id == 0){
                        o.params.data.new_data_individual[taxon_id] = {individual_count: val, storage_id: storage_id};
                    }else{
                        o.params.data.exist_data_individual[id] = {individual_count: val, storage_id: storage_id};
                    }
                }

                console.log(o);

                socketQuery(o, function(res){


                    if(!res.code == 0){
                        toastr[res.toastr.type](res.toastr.message);
                        return;
                    }

                    formInstance.reload();

                    console.log('GOOOO', res);

                });

            });

            formWrapper.find('.individual-link').off('click').on('click', function(){

                var formId = MB.Core.guid();
                var id = $(this).attr('data-id');

                var openInModalO = {
                    id: formId,
                    name: 'form_data_individual',
                    class: 'data_individual',
                    client_object: 'form_data_individual',
                    type: 'form',
                    ids: [id],
                    position: 'center',
                    tablePKeys: {data_columns: ["id"], data: [id]}
                };

                var form = new MB.FormN(openInModalO);

                form.create(function () {

                });

            });

            formWrapper.find('.select-storage-holder .s-value').off('click').on('click', function(){

                var holder = $(this).parents('.select-storage-holder');

                var o  = {
                    command: 'getAllStorages',
                    object: 'project',
                    params: {
                        id: formInstance.data.data[0].project_id
                    }
                };

                socketQuery(o ,function(res){

                    if(!res.code == 0){
                        toastr[res.toastr.type](res.toastr.message);
                        return false;
                    }

                    var sdata = {
                        results: [{
                            text: "Parental storages",
                            children: []
                        },{
                            text: "Storages",
                            children: []
                        }]
                    };

                    for(var i in res.parent_storage){
                        sdata.results[0].children.push({
                            id: res.parent_storage[i].id,
                            text: res.parent_storage[i].name
                        });
                    }

                    for(var k in res.storage){
                        sdata.results[1].children.push({
                            id: res.storage[k].id,
                            text: res.storage[k].name
                        })
                    }

                    console.log(sdata);

                    var tpl = `{{#results}}<div>
                                <div class="grp-name">{{text}}</div>
                                <div class="grp-list">
                                    {{#children}}<div class="grp-item" data-id="{{id}}">{{text}}</div>{{/children}}
                                </div>
                                </div>{{/results}}`;

                    holder.find('.s-dd').html(Mustache.to_html(tpl, sdata));
                    holder.find('.s-dd').css('display','block');

                    if(holder.attr('data-selected-id') != ''){
                        for(var i=0; i< holder.find('.grp-item').length ; i ++){
                            var elem = holder.find('.grp-item').eq(i);
                            if(elem.attr('data-id') == holder.attr('data-selected-id')){
                                elem.addClass('selected');
                            }
                        }
                    }


                    holder.find('.grp-item').off('click').on('click', function(){

                        var seled = $(this).attr('data-id');
                        var name = $(this).html();

                        if($(this).hasClass('selected')){

                            holder.attr('data-selected-id', '');
                            holder.attr('data-selected-name', '');
                            holder.find('.s-value').html('<span class="unselected">Select storage</span>');

                        }else{

                            holder.attr('data-selected-id', seled);
                            holder.attr('data-selected-name', name);
                            holder.find('.s-value').html(name);
                        }



                        holder.find('.s-dd').html('');
                        holder.find('.s-dd').css('display','none');

                    });

                });

                $('html, body').on('click', function(e){

                    if($(e.target).parents('.select-storage-holder').length == 0){
                        holder.find('.s-dd').html('');
                        holder.find('.s-dd').css('display','none');
                    }

                });

            });

            formWrapper.find('.quantity-big').each(function(i, elem){


                var holder = $(elem);


                $('<div class="quantity-button quantity-up">+</div>').insertAfter(holder.find('input'));
                $('<div class="quantity-button quantity-down">-</div>').insertBefore(holder.find('input'));

                // holder.find('.quantity-big').each(function() {
                    var spinner = holder,//$(this),
                        input = spinner.find('input[type="number"]'),
                        btnUp = spinner.find('.quantity-up'),
                        btnDown = spinner.find('.quantity-down'),
                        min = input.attr('min'),
                        max = input.attr('max');

                    btnUp.click(function() {
                        var oldValue = parseFloat(input.val());
                        if (oldValue >= max) {
                            var newVal = oldValue;
                        } else {
                            var newVal = oldValue + 1;
                        }
                        spinner.find("input").val(newVal);
                        spinner.find("input").trigger("input");
                    });

                    btnDown.click(function() {
                        var oldValue = parseFloat(input.val());
                        if (oldValue <= min) {
                            var newVal = oldValue;
                        } else {
                            var newVal = oldValue - 1;
                        }
                        spinner.find("input").val(newVal);
                        spinner.find("input").trigger("input");
                    });

                // });
            });

            formWrapper.find('.apply-all-samples').off('click').on('click', function(){

                if($(this).hasClass('apply-defined')){
                    return false;
                }
                if(!$(this).hasClass('enabled')){
                    return false;
                }

                // var t_id = $(this).attr('data-id');
                // var p = $(this).parents('.sample-add-holder');

                var blocks = formWrapper.find('.sample-funcs');

                var data = [];

                for(var i =0; i< blocks.length; i++){
                    var b = blocks.eq(i);
                    var id = b.attr('data-id');

                    var count = b.find('.to-add-count').val();
                    var storage = b.find('.select-storage-holder').attr('data-selected-id');
                    var name = b.find('.add-name-input').val();

                    data.push({
                        taxon_id: id,
                        individual_count: count,
                        storage_id: storage,
                        name: name
                    });
                }


                var o = {
                    command: 'addToIndividualMass',
                    object: 'sample',
                    params: {
                        id: formInstance.activeId,
                        data: data
                    }
                };


                socketQuery(o, function(res){

                    if(!res.code == 0){
                        toastr[res.toastr.type](res.toastr.message);
                        return false;
                    }

                    var tbls_saves = formWrapper.find('.ct-options-save.active');
                    var count = tbls_saves.length;
                    var saved = 0;

                    function tryReload(){

                        console.log(saved, count);

                        if(saved == count){
                            formInstance.reload();
                        }else{
                            console.log('Рано');
                        }

                    }

                    if(count > 0){
                        for(var i =0; i < tbls_saves.length; i++){

                            var s = tbls_saves.eq(i);
                            var id = s.parents('.classicTableWrap').attr('data-id');

                            MB.Tables.getTable(id).save(function () {
                                MB.Tables.getTable(id).reload(function(){
                                    saved++;
                                    tryReload()
                                });
                            });

                        }

                    }else{
                        formInstance.reload();
                    }



                    // formInstance.reload();
                });

            });

            formWrapper.find('.add-apply.apply-defined').off('click').on('click', function(){

                var taxon_select = formWrapper.find('#select-taxon-holder');
                var taxon_select_id = taxon_select.attr('data-selid');
                var sel2 =  MB.Core.select3.list.getSelect(taxon_select_id);
                var sel_val = +formWrapper.find('#select-taxon-holder select').val();//sel2.value.id;

                var p = $(this).parents('.defined-taxon-holder');

                var count = p.find('.to-add-count').val();
                var storage = p.find('.select-storage-holder').attr('data-selected-id');
                var name = p.find('.add-name-input').val();


                var o = {
                    command: 'addToIndividual',
                    object: 'sample',
                    params: {
                        taxon_id: sel_val,
                        id: formInstance.activeId,
                        individual_count: count,
                        storage_id: storage,
                        name: name
                    }
                };

                socketQuery(o, function(res){
                    if(!res.code == 0){
                        toastr[res.toastr.type](res.toastr.message);
                        return false;
                    }
                    // toastr[res.toastr.type](res.toastr.message);

                    formInstance.reload();

                });

            });


        }

    };

    samples.init();




}());