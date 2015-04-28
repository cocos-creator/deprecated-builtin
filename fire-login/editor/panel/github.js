function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (r !== null )
    return unescape(r[2]);

    return null;
}

var access_token = getQueryString('access_token');

var userId = getQueryString('user_id');

if (access_token && userId) {
    Editor.token = access_token;
}

Polymer({

    domReady: function () {
        this.getUserInfo();
    },

    getUserInfo: function () {
        Editor.sendToWindows('github:login',Editor.token,userId);

        var remote = require('remote');
        var browserWindow = remote.getCurrentWindow();
        browserWindow.close();
    },
});
