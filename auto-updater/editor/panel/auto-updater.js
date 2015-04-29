var Remote = require('remote');
var App = Remote.require('app');
//var AutoUpdater = Remote.require('auto-updater');

Polymer({
    version: '',
    newVersion: '',
    playing: false,
    status: "normal",
    progressAnimate: false,
    statusTip: "",
    hasNewVersion: false,
    confirmLabel: "Yes",
    cancelLabel: "No",
    //ignoreDialog: false,
    //winUpdate: false,
    //updateUrl: "",
    showConfirm: false,
    showClose: false,

    created: function () {
        this.version = App.getVersion();
    },

    'panel:open': function ( argv ) {
        this.status = argv.status;
        Editor.sendToCore( 'auto-updater:opened', {status: this.status});
    },

    'auto-updater:status-changed': function (opts) {
        console.log("status changed: " + JSON.stringify(opts));
        this.status = opts.status;
        switch( opts.status ) {
            case "checking":
                console.log("checking");
                this.playAnimation();
                this.statusTip = "Checking for update...";
                this.showClose = false;
                break;
            case "not-available":
                this.progressAnimate = false;
                this.playing = false;
                this.showConfirm = false;
                this.showClose = true;
                this.statusTip = "Update not available...";
                break;
            case "confirm-download":
                this.playing = false;
                this.showConfirm = true;
                this.showClose = false;
                this.hasNewVersion = true;
                this.newVersion = opts.newVersion;
                this.confirmLabel = "Download";
                this.cancelLabel = "Cancel";
                this.statusTip = "New version found! Should start downloading " + opts.filename + "?";
                break;
            case "downloading":
                this.progressAnimate = true;
                this.playing = true;
                this.showConfirm = false;
                this.showClose = false;
                this.statusTip = "Start downloading in the background... this window is closing in 3 seconds";
                break;
            case "confirm-replace":
                this.progressAnimate = false;
                this.playing = false;
                this.showConfirm = true;
                this.showClose = false;
                this.confirmLabel = "Close App and Update";
                this.cancelLabel = "Cancel";
                this.statusTip = "Download latest Fireball complete, should we CLOSE the app and go to the new version location?";
                break;

            //case "error":
            //    this.playing = false;
            //    this.statusTip = "Error: install faild,please quite and check update again!";
            //    break;
            //
            //case "downloaded":
            //    this.playing = false;
            //    this.statusTip = "Download success,ready to install...";
            //    if (!this.ignoreDialog) {
            //        var dialog = Remote.require('dialog');
            //        var result = dialog.showMessageBox( Remote.getCurrentWindow(), {
            //            type: "warning",
            //            buttons: ["Quite and install now","Later"],
            //            title: "Install Update",
            //            message: "install update now?",
            //            detail: "If you choose \"Later\", Fireball will update itself after you quit the app."
            //        } );
            //
            //        if (result === 0) {
            //            //AutoUpdater.quitAndInstall();
            //        }
            //        // else if (result === 1) {
            //        // TODO: send ipc to MainWindow, so that if MainWindow close, it should call autoUpdater.quitAndInstall();
            //        // }
            //    }
            //    break;
        }
    },

    //darwinCheckUpdate: function () {
    //    Editor.sendToCore( 'auto-updater:start');
    //    this.playAnimation();
    //},
    //
    //windowsCheckUpdate: function () {
    //    this.playAnimation();
    //    Fire._JsonLoader('http://fireball-x.com/api/checkupdate?version=v'+ app.getVersion(), function (err,json) {
    //        this.progressAnimate = true;
    //        Fire.log("Checking for update!");
    //        this.statusTip = "Checking for update...";
    //        if (err) {
    //            this.statusTip = "Update not available...";
    //            Fire.warn("Update not available...");
    //            this.progressAnimate = false;
    //        }
    //        else {
    //            this.statusTip = "New version for update!";
    //            Fire.info("New version for update! You should open this url to download: '" + json.url + "'");
    //            this.winUpdate = true;
    //            this.updateUrl = json.winurl;
    //        }
    //    }.bind(this));
    //},
    //
    //ipcStatusChanged: function ( event ) {
    //    this.status = event.detail.status;
    //    this.ignoreDialog = event.detail.ignoreDialog;
    //},

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

    //install: function () {
        //AutoUpdater.quitAndInstall();
    //},

    //goToUpdateUrl: function () {
    //    var shell = Remote.require('shell');
    //    shell.openExternal(this.updateUrl);
    //},

    confirm: function () {
        //console.log('click confirm');
        Editor.sendToCore( 'auto-updater:on-confirm', {status: this.status});
    },
    cancel: function () {
        //console.log('click cancel');
        Editor.sendToCore( 'auto-updater:on-cancel', {status: this.status});
    }
});
