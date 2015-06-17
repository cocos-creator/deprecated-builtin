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

        if ( ['.js', '.json', '.xml', '.html', '.css','.styl','.htm'].indexOf(ext.toLowerCase()) !== -1 ) {
            Editor.Panel.open('code-editor.panel', {
                uuid: uuid,
            });
        }
    },
};
