module.exports = {
    load: function () {
    },

    unload: function () {
    },

    'fire-hierarchy:open': function () {
        Editor.Panel.open('fire-hierarchy.panel');
    },

    'main-menu:create-entity': function () {
        Editor.sendToMainWindow('engine:create-entity', {
            'options': {
                'select-in-hierarchy': true
            }
        });
        Editor.sendToMainWindow( 'scene:dirty' );
    },

    'main-menu:create-child-entity': function () {
        var activeId = Editor.Selection.activeEntityId;
        Editor.sendToMainWindow('engine:create-entity', {
            'parent-id': activeId,
            'options': {
                'select-in-hierarchy': true
            }
        });
        Editor.sendToMainWindow( 'scene:dirty' );
    },

    'main-menu:create-input-field': function () {
        var activeId = Editor.Selection.activeEntityId;
        Editor.sendToMainWindow('engine:create-input-field', {
            'parent-id': activeId,
            'options': {
                'select-in-hierarchy': true
            }
        });
        Editor.sendToMainWindow( 'scene:dirty' );
    },

    'main-menu:create-particle-system': function () {
        var activeId = Editor.Selection.activeEntityId;
        Editor.sendToMainWindow('engine:create-particle-system', {
            'parent-id': activeId,
            'options': {
                'select-in-hierarchy': true
            }
        });
        Editor.sendToMainWindow( 'scene:dirty' );
    },

    'main-menu:create-text': function () {
        var activeId = Editor.Selection.activeEntityId;
        Editor.sendToMainWindow('engine:create-text', {
            'parent-id': activeId,
            'options': {
                'select-in-hierarchy': true
            }
        });
        Editor.sendToMainWindow( 'scene:dirty' );
    },

    'main-menu:create-sprite-animation': function () {
        var activeId = Editor.Selection.activeEntityId;
        Editor.sendToMainWindow('engine:create-sprite-animation', {
            'parent-id': activeId,
            'options': {
                'select-in-hierarchy': true
            }
        });
        Editor.sendToMainWindow( 'scene:dirty' );
    },
};
