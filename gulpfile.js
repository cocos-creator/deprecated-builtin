var gulp = require('gulp');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var stylus = require('gulp-stylus');
var rename = require('gulp-rename');
var vulcanize = require('gulp-vulcanize');
var del = require('del');
var minifyCSS = require('gulp-minify-css');

var path = require('path');
var es = require('event-stream');
var stylish = require('jshint-stylish');

var header = require('gulp-header');

// clean
gulp.task('clean', function() {
    del('bin/');
});

/////////////////////////////////////////////////////////////////////////////
// build
/////////////////////////////////////////////////////////////////////////////

function wrapScope () {
    var header = new Buffer("(function () {\n");
    var footer = new Buffer("})();\n");
    return es.through(function (file) {
        file.contents = Buffer.concat([header, file.contents, footer]);
        this.emit('data', file);
    });
}

var task_copy_deps = [];
var task_min_deps = [];
var task_dev_deps = [];
var package_wartchers = [];

var task_package = function ( name ) {
    var basePath = name + '/';
    var destBinPath = 'bin/' + name + '/';

    var task_copy = 'package-' + name + '-copy';

    task_copy_deps.push(task_copy);
    task_min_deps.push(task_copy);
    task_dev_deps.push(task_copy);

    var watcher = {
        all: { files: basePath + '**/*', tasks: [task_copy] },
    };
    package_wartchers.push(watcher);

    // copy
    gulp.task(task_copy, function() {
        return gulp.src( watcher.all.files, {base: basePath} )
        .pipe(gulp.dest(destBinPath))
        ;
    });
};

/////////////////////////////////////////////////////////////////////////////
// commands
/////////////////////////////////////////////////////////////////////////////

// task panels
var builtins = [
    "asset-db-debugger",
    "atlas",
    "auto-updater",
    "build-settings",
    "code-editor",
    "fire-about",

    "sprite-animation",
];
builtins.forEach(function(name) {
    task_package(name);
});

// tasks
gulp.task('copy', task_copy_deps );
gulp.task('dev', task_dev_deps );
gulp.task('default', task_min_deps );

// watch
gulp.task('watch', function() {
    for ( var i = 0; i < package_wartchers.length; ++i ) {
        var watcher = package_wartchers[i];
        gulp.watch( watcher.all.files, watcher.all.tasks ).on ( 'error', gutil.log );
    }
});

gulp.task('export-api-syntax', function (done) {

    // 默认所有 builtin 模块都在 Fire 下面
    var DefaultModuleHeader = "/**\n" +
                              " * @module Fire\n" +
                              " * @class Fire\n" +
                              " */\n";

    var src = ['./**/*.js', '!./*/bin/**/*', '!./*/editor/ext/**/*'];
    var dest = '../utils/api/builtin';
    del(dest + '/**/*', { force: true }, function (err) {
        if (err) {
            done(err);
            return;
        }

        gulp.src(src)
            .pipe(header(DefaultModuleHeader))
            .pipe(gulp.dest(dest))
            .on('end', done);
    });
});
