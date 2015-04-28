var Path = require('path');
var downloadLocation = '';

var Updater = {
    checkUpdateFireball: checkUpdate,
    downloadFireball: downloadFireball,
    quitAndLocateNew: quitAndLocateNew
};

//test

function checkUpdate(callback) {
    var app = require('app');
    var request = require('request');
    //var currentVersion = app.getVersion();
    var currentVersion = '0.1.7'; // for testing, use app.getVersion for production
    request('http://fireball-x.com/api/checkupdate?version=v' + currentVersion,
        function(err, res, body) {
        if (!err && res.statusCode === 200) {
            //console.log(body);
            var download = JSON.parse(body);
            var downloadUrl = Fire.isDarwin ? download.url : download.winurl;
            var arr = downloadUrl.split('/');
            var filename = arr[arr.length - 1];
            //TODO: insert confirmation dialog
            Fire.log('Found new version, downloading ' + filename);
            console.log(filename);
            console.log(downloadUrl);
            return callback({
                downloadUrl: downloadUrl,
                filename: filename
            });
            //downloadFireball(downloadUrl, filename);
        } else if (err) {
          console.log(err);
            return callback({error: err});
        } else if (res.statusCode === 204){
            Fire.log('You got latest Fireball, no need to update.');
            console.log("Got error: " + err);
            return callback({error: err});
        }
    });
}

function downloadFireball(downloadUrl, filename, callback) {
    //var child = require('child_process').spawn('');
    var Download = require('download');
    var os = require('os');
    var Del = require('del');
    var Fs = require('fire-fs');
    console.log("prepare download...");

    var startDownload = function() {
        console.log('start downloading new version.');
        new Download({mode: '755'})
            .get(downloadUrl)
            .dest(cacheDir)
            .run(function(err) {
                if (err) {
                    console.log(err);
                    return callback({error:err});
                } else {
                    Fire.log('Download new version successful, extracting...');
                    if (Fire.isDarwin) {
                      var spawn = require('child_process').spawn;
                      var child = spawn('unzip', [Path.join(cacheDir, filename), '-d', cacheDir]);
                      child.stdout.on('data', function (data) {
                          console.log(data.toString());
                      });
                      child.stderr.on('data', function (data) {
                          console.log('stderr: ' + data);
                      });
                      child.on('close', function() {
                          extractComplete(callback);
                      });
                    } else {
                      var exec = require('child_process').exec;
                      var cli = Path.join(Editor.cwd, 'tools', 'unzip') + ' ' + Path.join(cacheDir, filename) + ' -d ' + cacheDir;
                      console.log(cli);
                      var proc = exec( cli );
                      proc.stdout.on('data', function(data) {
                          console.log(data.toString());
                      });
                      proc.stderr.on('data', function(data) {
                          console.log(data.toString());
                      });
                      proc.on('close', function() {
                          extractComplete(callback);
                          // console.log('Gulp task dependency installed successful! \n Please run "gulp bootstrap" to setup development environment.');
                      });
                    }
                }
            });
    };

    var extractComplete = function(callback) {
      //TODO: insert confirmation dialog
      Fire.log( filename + ' extracted successful, now quiting app and taking you to the new version location.');
      Del(Path.join(cacheDir, filename), {force: true}, function(err) {
          if (err) {
              console.log(err);
          }
      });
      return callback({complete: 'true'});
    };

    var cacheDir = Path.join(os.tmpdir(), 'update-fireball');
    downloadLocation = cacheDir;
    if (Fs.isDirSync(cacheDir)) {
        var spawn = require('child_process').spawn;
        var child = spawn('rm', ['-rf', Path.join(cacheDir)]);
        child.stdout.on('data', function (data) {
            console.log(data.toString());
        });
        child.stderr.on('data', function (data) {
            console.log('stderr: ' + data);
        });
        child.on('close', function() {
            console.log('delete complete.');
            startDownload();
        });
    } else {
        startDownload();
    }
}

function quitAndLocateNew() {
    var Shell = require('shell');
    var finalTarget = Fire.isDarwin ? 'Fireball.app' : 'fireball.exe';
    Shell.showItemInFolder(Path.join(downloadLocation, finalTarget));
    Editor.quit();
}

module.exports = Updater;
