﻿var gulp = require('gulp');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var stylus = require('gulp-stylus');
var vulcanize = require('gulp-vulcanize');
var del = require('del');
var stylish = require('jshint-stylish');
var gulpSequence = require('gulp-sequence');

var header = require('gulp-header');
var fb = require('gulp-fb');

var fs = require('fs');

// clean
gulp.task('clean', function(cb) {
    del('bin/', cb);
});

// package tasks
var task_copy_deps = [];
var task_min_deps = [];
var task_dev_deps = [];
var task_dist_deps = [];
var task_dist_trim_deps = [];
var package_wartchers = [];

var task_package = function ( name ) {
    var basePath = name + '/';
    var destBinPath = 'bin/' + name + '/';

    var task_copy = 'package-' + name + '-copy';
    var task_copy_ext = 'package-' + name + '-copy-ext';
    var task_js = 'package-' + name + '-js';
    var task_styl = 'package-' + name + '-styl';
    var task_dist = 'package-' + name + '-dist';
    var task_dist_trim = 'package-' + name + '-dist-trim';

    task_copy_deps.push(task_copy, task_copy_ext);
    task_min_deps.push(task_copy, task_copy_ext, task_js, task_styl);
    task_dev_deps.push(task_copy, task_copy_ext, task_js, task_styl);
    task_dist_deps.push(task_dist);
    task_dist_trim_deps.push(task_dist_trim);

    var copy_files = [
        basePath + '**/*',
        '!' + basePath + '**/*.js',
        '!' + basePath + '**/*.styl',
        '!' + basePath + '**/ext/**/*',
    ];

    var ext_files = [
        basePath + '**/ext/**/*',
    ];

    var js_files = [
        basePath + '**/*.js',
        '!' + basePath + '**/ext/**/*'
    ];

    var styl_files = [
        basePath + '**/*.styl',
        '!' + basePath + '**/ext/**/*'
    ];

    var watcher = {
        copy: { files: copy_files, tasks: [task_copy] },
        ext: { files: ext_files, tasks: [task_copy_ext] },
        js: { files: js_files, tasks: [task_js] },
        styl: { files: styl_files, tasks: [task_styl]}
    };
    package_wartchers.push(watcher);

    // copy
    gulp.task(task_copy, function() {
        return gulp.src( watcher.copy.files, {base: basePath} )
        .pipe(gulp.dest(destBinPath))
        ;
    });

    gulp.task(task_copy_ext, function() {
        return gulp.src( watcher.ext.files, {base: basePath} )
        .pipe(gulp.dest(destBinPath))
        ;
    });

    // js
    gulp.task(task_js, function() {
        return gulp.src(js_files)
        .pipe(fb.wrapScope())
        .pipe(jshint({
            multistr: true,
            smarttabs: false,
            loopfunc: true,
            esnext: true,
        }))
        .pipe(jshint.reporter(stylish))
        .pipe(gulp.dest(destBinPath))
        ;
    });

    // styl
    gulp.task( task_styl, function() {
        return gulp.src(styl_files)
        .pipe(stylus({
            compress: false,
        }))
        .pipe(gulp.dest(destBinPath));
    });

    // html
    var build_html = function () {
        var htmlmin = require('gulp-htmlmin');
        var gulpif = require('gulp-if');
        var htmlName = require('./' + name + '/package.json').name;
        return function () {
            return gulp.src('bin/' + name + '/editor/panel/' + htmlName + '.html')
                .pipe(gulpif(name !== 'code-editor', vulcanize({
                    dest: 'bin/' + name + '/editor/panel/',
                    inline: true,
                    strip: true
                })))
                .pipe(gulpif(name !== 'code-editor', htmlmin({
                    removeComments: true,
                    collapseWhitespace: true
                })))
                .pipe(gulp.dest(destBinPath + 'editor/panel'))
                ;
        };
    };

    gulp.task(task_dist, build_html());

    gulp.task(task_dist_trim, function(cb) {
        if (name === 'code-editor') {
            return;
        }
        var htmlName = require('./' + name + '/package.json').name;
        var trimList = [
            'bin/' + name + '/editor/panel/*.*',
            '!bin/' + name + '/editor/panel/' + htmlName + '.html'
        ];
        del(trimList, cb);
    });
};

/////////////////////////////////////////////////////////////////////////////
// commands
/////////////////////////////////////////////////////////////////////////////

// task packages
fs.readdirSync('./').forEach(function(name) {
    if ( name === 'bin' ||
         name[0] === '.' ||
         fs.statSync(name).isDirectory() === false )
    {
        return;
    }
    task_package(name);
});

// tasks
gulp.task('copy', task_copy_deps );
gulp.task('dev', task_dev_deps );
gulp.task('min', task_min_deps );
gulp.task('build-dist', task_dist_deps);
gulp.task('dist-trim', task_dist_trim_deps);
gulp.task('default', gulpSequence('min', 'build-dist', 'dist-trim'));

// watch
gulp.task('watch', function() {
    for ( var i = 0; i < package_wartchers.length; ++i ) {
        var watcher = package_wartchers[i];
        gulp.watch( watcher.copy.files, watcher.copy.tasks ).on ( 'error', gutil.log );
        gulp.watch( watcher.ext.files, watcher.ext.tasks ).on ( 'error', gutil.log );
        gulp.watch( watcher.js.files, watcher.js.tasks ).on ( 'error', gutil.log );
        gulp.watch( watcher.styl.files, watcher.styl.tasks ).on ( 'error', gutil.log );
    }
});

gulp.task('export-api-syntax', function (done) {

    // 默认所有 builtin 模块都在 Fire 下面
    var DefaultModuleHeader = "/**\n" +
                              " * @module Fire\n" +
                              " */\n";

    var src = ['./**/*.js', '!./bin/**/*', '!./*/bin/**/*', '!./*/editor/ext/**/*'];
    var dest = '../../utils/api/builtin';
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
