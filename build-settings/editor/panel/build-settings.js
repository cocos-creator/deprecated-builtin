var Remote = require('remote');
var Url = require('fire-url');
var Fs = require('fire-fs');
var Path = require('fire-path');
var Shell = require('shell');

Polymer({
    platformList: [
        { name: 'Web Mobile', value: 'web-mobile' },
        { name: 'Web Desktop', value: 'web-desktop' },
    ],

    observe: {
        'profiles.project.projectName': 'projectNameChanged',
        'profiles.project.defaultScene': 'defaultSceneChanged',
        'profiles.project.platform': 'platformChanged',
        'profiles.project.isDebug': 'isDebugChanged',
        'profiles.project.buildPath': 'buildPathChanged',
    },

    isProjectNameValid: true,
    isBuildPathValid: true,
    hoverBuildButton: false,
    finderOrExplorer: Fire.isDarwin ? 'Finder':'Explorer',

    domReady: function () {
        Editor.sendToCore('build-settings:query-scenes');
    },

    'panel:open': function ( event ) {
        var projectPath = Remote.getGlobal('Editor').projectPath;
        var projectName = Path.basename(projectPath);

        var profile = this.profiles.project;
        if ( profile.projectName === '' ) {
            profile.projectName = projectName;
        }
        if ( profile.buildPath === '' ) {
            profile.buildPath = Path.join(projectPath, 'mobile-' + projectName);
        }
    },

    'build-settings:query-scenes-results': function ( event ) {
        var results = event.detail.results;

        var profile = this.profiles.project;
        profile.sceneList = results.map( function ( item ) {
            return { name: item.url, value: item.uuid, checked: true };
        });

        if ( profile.sceneList.indexOf(profile.defaultScene) === -1 ) {
            if (profile.sceneList.length === 0) {
                this.$.tip.style.display = "block";
                this.$.tip.innerHTML = 'Please create a new scene,then you can to build!';
                Fire.warn('Please create a new scene,then you can to build!');
                return;
            }

            profile.defaultScene = profile.sceneList[0].value;
        }
        profile.save();
    },

    defaultSceneChanged: function () {
        var profile = this.profiles.project;
        for (var i = 0; i < profile.sceneList.length; ++i) {
            if (profile.sceneList[i].value === profile.defaultScene) {
                profile.sceneList[i].checked = true;
            }
        }
        profile.save();
    },

    buildPathChanged: function () {
        var profile = this.profiles.project;
        profile.save();
        if ( profile.buildPath ) {
            this.isBuildPathValid = true;
            return;
        }
        this.isBuildPathValid = false;
    },

    projectNameChanged: function () {
        var profile = this.profiles.project;
        profile.save();
        if ( profile.projectName ) {
            this.isProjectNameValid = true;
            return;
        }

        this.isProjectNameValid = false;
    },

    platformChanged: function () {
        var profile = this.profiles.project;
        var projectPath = Remote.getGlobal('Editor').projectPath;
        if ( profile.platform === "web-mobile" ) {
            profile.buildPath = Path.join(projectPath, "/mobile-" + profile.projectName);
        }
        else {
            profile.buildPath = Path.join(projectPath, "/desktop-" + profile.projectName);
        }
        profile.save();
    },

    isDebugChanged: function () {
        var profile = this.profiles.project;
        profile.save();
    },

    chooseDistPath: function () {
        var dialog = Remote.require('dialog');
        var projectPath = Remote.getGlobal('Editor').projectPath;

        dialog.showOpenDialog({ defaultPath: projectPath, properties: ['openDirectory']},function (res) {
            var profile = this.profiles.project;
            if (res) {
                if (profile.platform === 'web-mobile') {
                    profile.buildPath = res + '/mobile-' + Path.basename(projectPath);
                }
                else {
                    profile.buildPath = res + '/desktop-' + Path.basename(projectPath);
                }
            }
        }.bind(this));
    },

    buildAction: function () {
        if ( this.isProjectNameValid && this.isBuildPathValid ) {
            this.$.tip.style.display = 'none';

            var profile = this.profiles.project;
            var buildUuidList = profile.sceneList.filter( function (item) {
                return item.checked;
            }).map(function (item) {
                return item.value;
            });

            // move default scene to first
            var firstSceneIndex = buildUuidList.indexOf(profile.defaultScene);
            var toSwap = buildUuidList[0];
            buildUuidList[0] = buildUuidList[firstSceneIndex];
            buildUuidList[firstSceneIndex] = toSwap;

            Editor.sendToCore('build-project', profile.platform, profile.buildPath, buildUuidList, profile);
        }
        else {
            this.$.tip.style.display = 'block';
            this.$.tip.animate([
                { color: 'white' },
                { color: 'red' },
                { color: 'white' },
                { color: 'red' },
            ], {
                duration: 300
            });
        }
    },

    buildButtonHoverInAction: function (event) {
        this.hoverBuildButton = true;
    },

    buildButtonHoverOutAction: function () {
        this.hoverBuildButton = false;
    },

    previewAction: function () {
        Shell.openExternal('http://localhost:7456');
        Shell.beep();
    },

    showInFinder: function () {
        var profile = this.profiles.project;
        if (!Fs.existsSync(profile.buildPath)) {
            Fire.warn( '%s not exists!', profile.buildPath);
            return;
        }
        Shell.showItemInFolder(Path.normalize(profile.buildPath));
        Shell.beep();
    },

    closeAction: function () {
        window.close();
    },
});
