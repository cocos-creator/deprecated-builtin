var Url = require('fire-url');
var App = require('app');
console.log(__dirname);
var Updater = require('./updater');
//var AutoUpdater = require('auto-updater');

var status = 'normal';
var ignoreDialog = false;
var downloadUrl = '';
var filename = '';

module.exports = {
    load: function () {
        //if ( Editor.isDev ) {
        //    plugin.on('auto-updater:open', function () {
        //        Fire.warn('auto-updater only works in release version.');
        //    });
        //    return;
        //}

        //AutoUpdater.on('checking-for-update', function() {
        //    status = 'checking';
        //    Fire.log("Checking for update, current version: " + App.getVersion());
        //    plugin.sendToPanel('default', 'auto-updater:status-changed', {
        //        status: status
        //    });
        //});

        //AutoUpdater.on('update-available', function(notes) {
        //    status = 'downloading';
        //    Fire.log('Downloading...');
        //    plugin.sendToPanel('default', 'auto-updater:status-changed', {
        //        status: status
        //    });
        //});

        //AutoUpdater.on('update-not-available', function() {
        //    status = 'not-available';
        //    plugin.sendToPanel('default', 'auto-updater:status-changed', {
        //        status: status
        //    });
        //    Fire.info('You are in latest version.');
        //});

        //AutoUpdater.on('update-downloaded', function() {
        //    status = 'downloaded';
        //    Fire.info('Download success, ready to install');
        //
        //    var dialog = require('dialog');
        //    var result = dialog.showMessageBox({
        //        type: "warning",
        //        buttons: ["Quite and install now","later"],
        //        title: "Install Update",
        //        message: "install update now?",
        //        detail: "If you choose \"later\", Fireball will update itself after you quit the app."
        //    });
        //
        //    if (result === 0) {
        //        AutoUpdater.quitAndInstall();
        //    }
        //    else if (result === 1) {
        //        //TODO: 发IPC给MainWindow,让MainWindow在关闭的时候调用AutoUpdater.quitAndInstall();
        //    }
        //    ignoreDialog = true;
        //
        //    plugin.sendToPanel('default', 'auto-updater:status-changed', {
        //        status: status,
        //        ignoreDialog: ignoreDialog
        //    });
        //});
        //
        //AutoUpdater.on('error', function () {
        //    Fire.error(arguments[1]);
        //    status = "error";
        //    plugin.openPanel('default', {
        //        status: status
        //    });
        //    plugin.sendToPanel('default', 'auto-updater:status-changed', {
        //        status: status,
        //    });
        //});
        //AutoUpdater.setFeedUrl('http://fireball-x.com/api/checkupdate?version=v' + App.getVersion());

    },

    unload: function () {
        //AutoUpdater.removeAllListeners();
    },

    'auto-updater:open': function () {
        ignoreDialog = false;
        Editor.Panel.open('auto-updater.panel', {
            status: 'normal'
        });

    },

    'auto-updater:opened': function(opts) {
        switch(opts.status) {
            case 'normal':
                Editor.sendToPanel('auto-updater.panel', 'auto-updater:status-changed', {
                    status: 'checking'
                });
                Updater.checkUpdateFireball(function(result) {
                    if (result.error) {
                        Editor.sendToPanel('auto-updater.panel', 'auto-updater:status-changed', {
                            status: 'not-available'
                        });
                    } else if (result.downloadUrl && result.filename) {
                        downloadUrl = result.downloadUrl;
                        filename = result.filename;
                        console.log('found new version');
                        status = 'confirm-download';
                        Editor.sendToPanel('auto-updater.panel', 'auto-updater:status-changed', {
                            status: 'confirm-download',
                            filename: result.filename,
                            newVersion: /-(v\d+\.\d+\.\d+)-/ig.exec(result.filename)[1]
                        });
                    } else {
                        Editor.Panel.sendToPanel('auto-updater.panel', 'auto-updater:status-changed', {
                            status: 'not-available'
                        });
                    }
                });
                break;
            case 'download-complete':
                Editor.Panel.sendToPanel('auto-updater.panel', 'auto-updater:status-changed', {
                    status: 'confirm-replace'
                });
                break;
        }
    },

    'auto-updater:on-confirm': function (opts) {
        console.log('confirm status: ' + opts.status);
        switch(opts.status) {
            case 'confirm-download':
                console.log("state change to downloading");
                Editor.Panel.sendToPanel('auto-updater.panel', 'auto-updater:status-changed', {
                    status: 'downloading'
                });
                Updater.downloadFireball(downloadUrl, filename, function(result) {
                    if (result.error) {
                        Fire.warn('Download new Fireball version failed, please check your connection and retry.');
                    } else {
                        Editor.Panel.openPanel('auto-updater.panel', {
                            status: 'download-complete'
                        });
                    }
                });
                setTimeout(function() {
                    console.log('closing auto-updater');
                    Editor.Panel.close('auto-updater.auto-updater.panel');
                    Fire.info('Downloading new Fireball version in the background, updater will popup when new version is ready.');
                }, 3000);
                break;
            case 'confirm-replace':
                console.log("state change to confirm-replace");
                Updater.quitAndLocateNew();
        }
    },

    'auto-updater:on-cancel': function (opts) {
        console.log('cancel status: ' + opts.status);
        Editor.Panel.close('auto-updater.auto-updater.panel');
        //AutoUpdater.checkForUpdates();
    },

    'auto-updater:ignore-dialog': function () {
        ignoreDialog = true;
    },
};
