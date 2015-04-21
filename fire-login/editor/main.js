module.exports = {
    load: function (plugin) {
        plugin.on('fire-login:open', function () {
            plugin.openPanel('default');
        });
    },
    unload: function (plugin) {
    },
};
