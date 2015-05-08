module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'quick-view:open': function (detail) {
        Editor.Panel.openPanel('quick-view.panel', detail);
    },
};
