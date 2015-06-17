var Url = require('fire-url');

module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'build-settings:open': function () {
        Editor.Panel.open('build-settings.panel');
    },

    'build-settings:query-scenes': function () {
        var results = [];
        for ( var p in Editor.AssetDB._pathToUuid ) {
            var url = Editor.AssetDB._url(p);
            if (Url.extname(url) === ".fire") {
                results.push({ url: url, uuid: Editor.AssetDB._pathToUuid[p] });
            }
        }
        Editor.sendToPanel( 'build-settings.panel', 'build-settings:query-scenes-results', {
            results: results
        });
    },
};
