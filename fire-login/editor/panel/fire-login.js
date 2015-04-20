var Request = require('request');

Polymer({
    loginConfig: {
        account: "",
        password: "",
    },

    domReady: function () {
        this.$.register.parent = this;
    },

    forgetPwd: function () {
        var shell = require('shell');
        shell.openExternal('http://fireball-x.com/user/forgotpassword');
        shell.beep();
    },

    loginAction: function () {
        var isEmail = this.verifyEmail(this.loginConfig.account);

        var formData = {
            username: isEmail ? "":this.loginConfig.account,
            email: isEmail ? this.loginConfig.account : "",
            password: this.loginConfig.password,
        };

        var options = {
            url:"https://accounts.fireball-x.com/login",
            form: formData,
            headers: {
                "accept": 'application/json',
                "content-type": "application/json",
            }
        };

        Request.post(options,function (err,httpResponse,body) {
            if (!err) {
                if (httpResponse.statusCode === 200) {
                    var token = JSON.parse(body).id;
                    var userid = JSON.parse(body).userId;
                    console.log('token:' + token);
                    console.log('userID:' + userid);
                }
                else {
                    console.log(JSON.parse(body).error.message);
                }
            }
            else {
                console.log(err);
            }
        });

    },

    verifyEmail: function (value) {
        var reg = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/;
        return reg.test(value);
    },

    registerPanel: function () {
        this.$.login.animate([
            { left: "0px" },
            { left: "-400px" }
        ], {
            duration: 300
        });

        this.$.register.animate([
            { left: "400px" },
            { left: "0px" }
        ],{
            duration: 300
        });
        this.$.login.style.left = "-400px";
        this.$.register.style.left = "0px";
    },

    loginPanel: function () {
        this.$.login.animate([
            { left: "-400px" },
            { left: "0px" }
        ], {
            duration: 300
        });

        this.$.register.animate([
            { left: "0px" },
            { left: "400px" }
        ],{
            duration: 300
        });
        this.$.login.style.left = "0px";
        this.$.register.style.left = "400px";
    },

});
