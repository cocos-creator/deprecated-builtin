Polymer({
    publish: {
        type: 'log',
        text: '',
        selected: {
            value: false,
            reflect: true
        },
        count: 0,
    },

    attached: function () {
        this.fire('item-added');
    },

    toShortText: function ( value ) {
        var shortText = value.split('\n');
        shortText = shortText.length > 0 ? shortText[0] : shortText;
        return shortText;
    },

    toIconClass: function ( value ) {
        switch ( value ) {
            case "log": return "fa-info";
            case "info": return "fa-info";
            case "warn": return "fa-warning";
            case "error": return "fa-times-circle";
        }
    },
});
