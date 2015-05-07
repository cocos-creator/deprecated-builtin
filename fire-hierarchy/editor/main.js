module.exports = {
    load: function (plugin) {
        plugin.on('fire-hierarchy:open', function () {
            plugin.openPanel('default');
        });

        plugin.on('main-menu:create-entity', function () {
            Editor.sendToMainWindow('engine:create-entity', {
                'options': {
                    'select-in-hierarchy': true
                }
            });
            Editor.sendToMainWindow( 'scene:dirty' );
        });

        plugin.on('main-menu:create-child-entity', function () {
            var activeId = Editor.Selection.activeEntityId;
            Editor.sendToMainWindow('engine:create-entity', {
                'parent-id': activeId,
                'options': {
                    'select-in-hierarchy': true
                }
            });
            Editor.sendToMainWindow( 'scene:dirty' );
        });

        plugin.on('main-menu:create-input-field', function () {
            var activeId = Editor.Selection.activeEntityId;
            Editor.sendToMainWindow('engine:create-input-field', {
                'parent-id': activeId,
                'options': {
                    'select-in-hierarchy': true
                }
            });
            Editor.sendToMainWindow( 'scene:dirty' );
        });
    },
    unload: function (plugin) {
    },
};
