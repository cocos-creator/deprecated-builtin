var Request = require('request');

Polymer({
    loginConfig: {
        account: '',
        password: '',
    },

    rememberPasswd: true,
    lockLogin: true,
    waiting: false,
    msg: '',

    observe: {
        'loginConfig.account': 'inputChanged',
        'loginConfig.password': 'inputChanged'
    },

    domReady: function () {
    },

    forgetPwd: function () {
        var shell = require('shell');
        shell.openExternal('http://fireball-x.com/user/forgotpassword');
        shell.beep();
    },

    inputChanged: function () {
        if (this.loginConfig.account !== '' && this.loginConfig.password !== ''){
            this.lockLogin = false;
        }
        else {
            this.lockLogin = true;
        }
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
        this.waiting = true;
        var isEmail = this.verifyEmail(this.loginConfig.account);

        var formData = {
            username: isEmail ? '':this.loginConfig.account,
            email: isEmail ? this.loginConfig.account : '',
            password: this.loginConfig.password,
        };

        var options = {
            url: 'https://accounts.fireball-x.com/login',
            form: formData,
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
            }
        };

        Request.post(options,function (err,httpResponse,body) {
            if (!err) {
                if (httpResponse.statusCode === 200) {
                    var token = JSON.parse(body).id;
                    var userid = JSON.parse(body).userId;
                    console.log('token:' + token);
                    console.log('userID:' + userid);
                    this.msg = 'Login succeed!';
                    // TODO: 这里拿到了token和userid 应该赋值类似Editor.token 这样的API来操作

                    Editor.sendToCore('login:succeed', {
                        account: this.loginConfig.account,
                        password: this.loginConfig.password,
                    });
                }
                else {
                    this.msg = JSON.parse(body).error.message;
                }
            }
            else {
                this.msg = err;
            }

            this.waiting = false;
        }.bind(this));

    },

    verifyEmail: function (value) {
        var reg = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/;
        return reg.test(value);
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
