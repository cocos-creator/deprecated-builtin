var Request = require('request');

Polymer({
    account: '',
    password: '',
    rememberPasswd: true,
    canLogin: false,
    waiting: false,
    msg: '',
    loginId: -1,

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
        Fire.warn('Coming soon!');
    },

});
