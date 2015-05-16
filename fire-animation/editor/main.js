var Url = require('fire-url');

module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'fire-animation:open': function () {
        Editor.Panel.open('fire-animation.panel');
    },

    'asset:open': function (detail) {
        var uuid = detail.uuid;
        var url = detail.url;
        var ext = Url.extname(url);

        if ( ['.anim'].indexOf(ext.toLowerCase()) !== -1 ) {
            Editor.Panel.open('fire-animation.panel', {
                uuid: uuid,
            });
        }
    },
};
