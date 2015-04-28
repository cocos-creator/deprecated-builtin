var Request = require('request');
var Ipc = require('ipc');
Polymer({
    account: '',
    password: '',
    rememberPasswd: true,
    canLogin: false,
    waiting: false,
    cancelGithub: false,
    msg: '',
    loginId: -1,

    observe: {
        'account': 'inputChanged',
        'password': 'inputChanged',
        'rememberPasswd': 'rememberChanged',
    },

    domReady: function () {

        this.$.password.addEventListener('keypress',function (event) {
            if (event.keyCode !== 13) {
                return;
            }
            if (this.canLogin && this.waiting === false) {
                this.loginAction();
            }
        }.bind(this));

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
        if ( this.waiting ) {
            this.cancelLogin();
            return;
        }

        Editor.sendToCore('login:save', {
            account: this.account,
        });

        this.waiting = true;

        this.loginId = Editor.login( this.account, this.password, function ( err, detail ) {
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

    cancelLogin: function () {
        this.cancelGithub = true;
        Editor.cancelLogin(this.loginId);
        this.waiting = false;
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
        var remote = require('remote');
        var BrowserWindow = remote.require('browser-window');
        this.cancelLogin();
        this.cancelGithub = false;
        Ipc.on('github:login',function (token,userId) {
            this.waiting = true;
            Editor.tokenLogin(token,userId,function (res) {
                if (this.cancelGithub) {
                    this.cancelGithub = false;
                    return;
                }

                if ( typeof(res) === 'object' ) {
                    this.msg = 'Login succeed!';
                    Editor.sendToCore( 'login:succeed', {
                        'account': '',
                        'password': '',
                        'remember-passwd': false
                    });
                }
                else {
                    this.msg = 'github login fault!';
                }

                this.waiting = false;
            }.bind(this));
        }.bind(this));

        var win = new BrowserWindow({ width: 800, height: 600, show: false,"always-on-top": true,title: "Github Authored" });
        win.loadUrl('https://accounts.fireball-x.com/auth/github?callback=fire://static/github.html');
        win.show();
    },
});
