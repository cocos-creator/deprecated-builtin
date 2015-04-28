var Remote = require('remote');
var App = Remote.require('app');
//var AutoUpdater = Remote.require('auto-updater');

Polymer({
    version: '',
    playing: false,
    status: "normal",
    progressAnimate: false,
    statusTip: "",
    ignoreDialog: false,
    winUpdate: false,
    updateUrl: "",
    showConfirm: false,

    created: function () {
        this.version = App.getVersion();
    },

    domReady: function () {
        Editor.sendToCore( 'auto-updater:opened');
        //this.status = this.argv.status;
        //this.ignoreDialog = this.argv.ignoreDialog;
        //if (!Fire.isDarwin) {
        //    this.windowsCheckUpdate();
        //}
        //else {
        //    if (this.status === "normal") {
        //        this.darwinCheckUpdate();
        //    }
        //}
    },

    'auto-updater:status-changed': function (opts) {
        console.log("status changed: " + JSON.stringify(opts));
        this.status = opts.status;
        switch( opts.status ) {
            case "checking":
                console.log("checking");
                this.playAnimation();
                this.statusTip = "Checking for update...";
                break;
            case "not-available":
                this.progressAnimate = true;
                this.playing = false;
                this.showConfirm = false;
                this.statusTip = "Update not available...";
                break;
            case "confirm-download":
                this.playing = false;
                this.showConfirm = true;
                this.statusTip = "New version found! Should start downloading " + opts.filename + "?";
                break;
            case "downloading":
                this.progressAnimate = true;
                this.statusTip = "Downloading... (You can close this window)";
                break;

            case "error":
                this.playing = false;
                this.statusTip = "Error: install faild,please quite and check update again!";
                break;

            case "downloaded":
                this.playing = false;
                this.statusTip = "Download success,ready to install...";
                if (!this.ignoreDialog) {
                    var dialog = Remote.require('dialog');
                    var result = dialog.showMessageBox( Remote.getCurrentWindow(), {
                        type: "warning",
                        buttons: ["Quite and install now","Later"],
                        title: "Install Update",
                        message: "install update now?",
                        detail: "If you choose \"Later\", Fireball will update itself after you quit the app."
                    } );

                    if (result === 0) {
                        //AutoUpdater.quitAndInstall();
                    }
                    // else if (result === 1) {
                    // TODO: send ipc to MainWindow, so that if MainWindow close, it should call autoUpdater.quitAndInstall();
                    // }
                }
                break;
        }
    },

    darwinCheckUpdate: function () {
        Editor.sendToCore( 'auto-updater:start');
        this.playAnimation();
    },

    windowsCheckUpdate: function () {
        this.playAnimation();
        Fire._JsonLoader('http://fireball-x.com/api/checkupdate?version=v'+ app.getVersion(), function (err,json) {
            this.progressAnimate = true;
            Fire.log("Checking for update!");
            this.statusTip = "Checking for update...";
            if (err) {
                this.statusTip = "Update not available...";
                Fire.warn("Update not available...");
                this.progressAnimate = false;
            }
            else {
                this.statusTip = "New version for update!";
                Fire.info("New version for update! You should open this url to download: '" + json.url + "'");
                this.winUpdate = true;
                this.updateUrl = json.winurl;
            }
        }.bind(this));
    },

    ipcStatusChanged: function ( event ) {
        this.status = event.detail.status;
        this.ignoreDialog = event.detail.ignoreDialog;
    },

    playAnimation: function () {
        this.playing = true;
        this.$.logo.animate([
            { width: "45px" },
            { width: "40px" },
        ], {
            duration: 200
        });

        this.$.logo.style.width = "40px";
    },

    install: function () {
        //AutoUpdater.quitAndInstall();
    },

    goToUpdateUrl: function () {
        var shell = Remote.require('shell');
        shell.openExternal(this.updateUrl);
    },

    confirm: function () {
        console.log('click confirm');
        Editor.sendToCore( 'auto-updater:on-confirm', {status: this.status});
    },
    cancel: function () {
        console.log('click cancel');
        Editor.sendToCore( 'auto-updater:on-cancel', {status: this.status});
    }
});
