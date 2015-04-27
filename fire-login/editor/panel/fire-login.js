var Request = require('request');

Polymer({
    account: '',
    password: '',
    rememberPasswd: true,
    canLogin: false,
    waiting: false,
    msg: '',

    observe: {
        'account': 'inputChanged',
        'password': 'inputChanged',
        'rememberPasswd': 'rememberChanged',
    },

    domReady: function () {
        Editor.sendRequestToCore('login:query-info', function ( info ) {
            this.account = info.account;
            this.rememberPasswd = info['remember-passwd'];
            if ( this.rememberPasswd ) {
                this.password = info.password;
            }
            if ( this.account && this.password ) {
                this.loginAction();
            }
        }.bind(this));

        this.loginRequests = {};
    },

    forgetPwd: function () {
        var shell = require('shell');
        shell.openExternal('http://fireball-x.com/user/forgotpassword');
        shell.beep();
    },

    inputChanged: function () {
        if (this.account !== '' && this.password !== ''){
            this.canLogin = true;
        }
        else {
            this.canLogin = false;
        }
    },

    rememberChanged: function () {
        Editor.sendToCore('login:save', {
            'account': this.account,
            'remember-passwd': this.rememberPasswd,
        });
    },

    showLoginAction: function () {
        this.$.login.animate([
            { left: '-400px' },
            { left: '0px' }
        ], {
            duration: 300
        });

        this.$.register.animate([
            { left: '0px' },
            { left: '400px' }
        ],{
            duration: 300
        });
        this.$.login.style.left = '0px';
        this.$.register.style.left = '400px';
    },

    loginAction: function () {
        Editor.sendToCore('login:save', {
            account: this.account,
        });

        this.waiting = true;

        Editor.login( this.account, this.password, function ( err, detail ) {
            this.waiting = false;

            if ( err ) {
                this.msg = err;
                return;
            }

            this.msg = 'Login succeed!';

            var userInfo = detail['user-info'];
            Editor.Metrics.identifyUser(userInfo);

            Editor.sendToCore('login:succeed', {
                'account': this.account,
                'password': this.password,
                'remember-passwd': this.rememberPasswd
            });
        }.bind(this));
    },

    registerPanel: function () {
        this.$.login.animate([
            { left: '0px' },
            { left: '-400px' }
        ], {
            duration: 300
        });

        this.$.register.animate([
            { left: '400px' },
            { left: '0px' }
        ],{
            duration: 300
        });
        this.$.login.style.left = '-400px';
        this.$.register.style.left = '0px';
    },

    githubSign: function () {
        // var remote = require('remote');
        // var BrowserWindow = remote.require('browser-window');
        //
        // var win = new BrowserWindow({ width: 800, height: 600, show: false,'always-on-top': true,title: 'Github Authored' });
        // win.on('closed', function() {
        //   win = null;
        // });
        //
        // win.loadUrl('editor://static/window.html?panelID=github-auth');
        // win.show();
        Fire.warn('Coming soon!');
    },

});
