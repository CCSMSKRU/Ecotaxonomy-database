(function(){
    let formID = MB.Forms.justLoadedId;
    let formInstance = MB.Forms.getForm('form_literature', formID);
    let formWrapper = $('#mw-'+formInstance.id);

    let id = formInstance.activeId;

    let tr = {
        mo: formInstance.data.data[0],
        instance: null,

        init: () => {
            tr.instance = new MB.LitData.init(id, null, tr.mo);

            tr.getLitDataFiles(() => {
                formWrapper.find('.lit_wrapper').html(Mustache.to_html(MB.LitData.getTPL(), tr.mo));

                tr.instance.setHandlers(formWrapper.find('.lit_wrapper'), true);
                tr.instance.activateHighLighting(formWrapper.find('.save-traits'));
                tr.setHandlers();
            });
        },

        getLitDataFiles: cb => {
            tr.instance.getFiles((files) => {
                tr.mo.files = files;

                cb();
            });
        },

        setHandlers: () => {
            formWrapper.find('.save-traits').off('click').on('click', (e) => {
                if (!$(e.currentTarget).hasClass('enabled')) return;

                tr.instance.save((res) => {
                    if (res && res.code && res.code !== 0) toastr[res.toastr.type](res.toastr.message);
                });
            });
        }
    };

    tr.init();
}());
