var Url = require('fire-url');

module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'asset:open': function (detail) {
        var uuid = detail.uuid;
        var url = detail.url;
        var ext = Url.extname(url);

        if ( ['.atlas'].indexOf(ext.toLowerCase()) !== -1 ) {
            Editor.Panel.open('atlas-editor.panel', {
                uuid: uuid,
            });
        }
    },
};
