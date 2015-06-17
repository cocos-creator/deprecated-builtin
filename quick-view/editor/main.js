module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'quick-view:open': function (detail) {
        Editor.Panel.open('quick-view.panel', detail);
    },
};
