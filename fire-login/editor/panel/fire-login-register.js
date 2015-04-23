var Request = require('request');

Polymer({
    registerConfig: {
        email: '',
        username: '',
        password: '',
        fullname: '',
    },
    recheckPwd: '',

    verifyEmail: false,
    verifyUserName: false,
    verifyPwd: false,

    parent: null,
    waiting: false,
    hideMask: true,
    svgTip: 'Wating...',
    tipText: 'Wating...',
    done: false,

    domReady: function () {
    },

    observe: {
        'registerConfig.email': 'emailChanged',
        'registerConfig.username': 'userNameChanged',
        'registerConfig.password': 'passwordChanged',
    },

    emailChanged: function () {
        var reg = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/;

        if (reg.test(this.registerConfig.email)) {
            this.$.email.removeAttribute('class','err');
            this.verifyEmail = true;
        }
        else {
            this.$.email.setAttribute('class','err');
            this.verifyEmail = false;
        }
    },

    userNameChanged: function () {
        var reg = /[^a-zA-Z0-9]/g;

        if(!reg.test(this.registerConfig.username) && this.registerConfig.username.length >= 3 && this.registerConfig.username.length < 25) {
            this.$.userName.removeAttribute('class','err');
            this.verifyUserName = true;
        }
        else{
            this.$.userName.setAttribute('class','err');
            this.verifyUserName = false;
        }
    },

    passwordChanged: function () {
        if (this.registerConfig.password.length > 5 && this.registerConfig.password.length < 26) {
            this.$.password.removeAttribute('class','err');
        }
        else {
            this.$.password.setAttribute('class','err');
        }
    },

    recheckPwdChanged: function () {
        if (this.recheckPwd === this.registerConfig.password) {
            this.$.recheckPassword.removeAttribute('class','err');
            this.verifyPwd = true;
        }
        else {
            this.$.recheckPassword.setAttribute('class','err');
            this.verifyPwd = false;
        }
    },

    returnLogin: function () {
        this.parent.loginPanel();
    },

    registerAction: function () {
        this.waiting = true;
        this.hideMask = false;
        var options = {
            url:'https://accounts.fireball-x.com/signup',
            form: this.registerConfig,
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
            }
        };

        Request.post(options,function (err,httpResponse,body) {
            if (!err) {
                if (httpResponse.statusCode === 201) {
                    this.doneAction();
                }else {
                    this.waiting = false;
                    this.$.svgForStroke.style.strokeDasharray = '300%,300%';
                    this.$.svgForStroke.style.stroke = 'red';
                    this.svgTip = 'Mistake...';
                    this.tipText = JSON.parse(body).error.message;
                }

            }
            else {
                this.waiting = false;
                this.$.svgForStroke.style.strokeDasharray = '300%,300%';
                this.$.svgForStroke.style.stroke = 'red';
                this.svgTip = 'Mistake...';
                this.tipText = err;
            }
            this.done = true;
        }.bind(this));
    },

    doneAction: function () {
        this.waiting = false;
        this.$.svgForStroke.style.strokeDasharray = '300%,300%';
        this.$.svgForStroke.style.stroke = '#66FF27';
        this.svgTip = 'Succeed...';
        this.tipText = 'Signup successful, please verify your email address and login.';
    },

    resetMask: function () {
        this.hideMask = true;
        this.svgTip = 'Wating...';
        this.tipText = 'Wating...';
        this.$.svgForStroke.style.strokeDasharray = '1%,300%';
        this.$.svgForStroke.style.stroke = '#FF8127';
        this.done = false;
    },
});
