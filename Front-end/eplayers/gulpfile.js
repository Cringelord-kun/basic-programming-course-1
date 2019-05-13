var env = require('./env.json');
var eslintConfig = require('./eslint.json');

var
    autoprefixer = require('autoprefixer'),
    async = require('async'),
        cssnano = require('cssnano'),
        scsslint = require('gulp-scss-lint'),
        del = require('del'),
        gulp = require('gulp'),
        plugins = require('gulp-load-plugins')(),
        browserSync = require('browser-sync').create();

var runTimestamp = Math.round(Date.now() / 1000),
    fontName = 'iconfont';

var handleError = function(error) {
    plugins.notify.onError({
        message: error.toString()
    })(error);
}


// concat, minify, compress, autoprefix sass files
gulp.task('style', function() {
    var s = plugins.size();
    var pluginsSass = [
        autoprefixer({
            browsers: ['last 10 versions', 'ie 9', 'ie 10']
        })
    ];
    return gulp.src(env.path.source + '/scss/style.scss')
        .pipe(s)
        .pipe(plugins.plumber({
            errorHandler: handleError
        }))
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.sass())
        //.pipe(plugins.postcss(pluginsSass))
        .pipe(plugins.sourcemaps.mapSources(function(sourcePath, file) {
            return './../../../source/scss/' + sourcePath;
        }))
        .pipe(plugins.sourcemaps.write())
        .pipe(gulp.dest(env.path.dist + '/'))
        .pipe(plugins.postcss([cssnano()]))
        .pipe(plugins.rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(env.path.dist + '/'))
        .pipe(browserSync.stream({
            once: true
        }))
        .pipe(plugins.notify({
            onLast: true,
            message: function() {
                return 'Total CSS size ' + s.prettySize;
            }
        }));
});

gulp.task('styleLint', function() {
    return gulp.src([env.path.source + '/scss/**/*.scss', '!' + env.path.source + '/scss/vendors/**.*', '!' + env.path.source + '/scss/base/_normalize.scss'])
        .pipe(scsslint({
            config: 'lint.yml',
            maxBuffer: 30000000 * 1024
        }))
});

// concat and uglify main js file.
gulp.task('js', function() {
    var s = plugins.size();
    return gulp.src(env.path.source + '/js/main/*.js')
        .pipe(s)
        .pipe(plugins.plumber({
            errorHandler: handleError
        }))
        .pipe(plugins.concat('main.js'))
        .pipe(plugins.eslint(eslintConfig))
        .pipe(plugins.eslint.format())
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.babel({
            presets: ['env']
        }))
        .pipe(gulp.dest(env.path.dist + '/assets/js/'))
        .pipe(plugins.uglify())
        .pipe(plugins.rename({
            suffix: '.min'
        }))
        .pipe(plugins.sourcemaps.mapSources(function(sourcePath, file) {
            return './../../../source/js/' + sourcePath;
        }))
        .pipe(plugins.sourcemaps.write('.'))
        .pipe(gulp.dest(env.path.dist + '/assets/js/'))
        .pipe(browserSync.stream({
            once: true
        }))
        .pipe(plugins.notify({
            onLast: true,
            message: function() {
                return 'Total JS (main) size ' + s.prettySize;
            }
        }));
});


// Concat and uglify vendors js file.
gulp.task('vendorsjs', function() {
    var s = plugins.size();
    return gulp.src(env.path.source + '/js/vendors/*.js')
        .pipe(s)
        .pipe(plugins.plumber({
            errorHandler: handleError
        }))
        .pipe(plugins.concat('vendors.js'))
        .pipe(plugins.uglify())
        .pipe(plugins.rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(env.path.dist + '/assets/js/'))
        .pipe(browserSync.stream({
            once: true
        }))
        .pipe(plugins.notify({
            onLast: true,
            message: function() {
                return 'Total JS (vendors) size ' + s.prettySize;
            }
        }));
});


// ajax
gulp.task('ajax', function() {
    var s = plugins.size();
    return gulp.src(env.path.source + '/js/ajax/*.js')
        .pipe(s)
        .pipe(plugins.plumber({
            errorHandler: handleError
        }))
        .pipe(plugins.concat('ajax.js'))
        .pipe(plugins.eslint(eslintConfig))
        .pipe(plugins.eslint.format())
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.babel({
            presets: ['env']
        }))
        .pipe(gulp.dest(env.path.dist + '/assets/js/'))
        .pipe(plugins.uglify())
        .pipe(plugins.rename({
            suffix: '.min'
        }))
        .pipe(plugins.sourcemaps.mapSources(function(sourcePath, file) {
            return './../../../source/js/' + sourcePath;
        }))
        .pipe(plugins.sourcemaps.write('.'))
        .pipe(gulp.dest(env.path.dist + '/assets/js/'))
        .pipe(browserSync.stream({
            once: true
        }))
        .pipe(plugins.notify({
            onLast: true,
            message: function() {
                return 'Total JS (ajax) size ' + s.prettySize;
            }
        }));
});


gulp.task('iconfont', function(done) {
    var iconStream = gulp.src([env.path.source + '/icons/*.svg'])
        .pipe(plugins.iconfont({
            fontName: fontName,
            normalize: true,
            fontHeight: 1001
        }))

    async.parallel([
        function handleGlyphs(cb) {
            iconStream.on('glyphs', function(glyph) {
                gulp.src(env.path.source + '/scss/iconfont/iconfont.css')
                    .pipe(plugins.consolidate('lodash', {
                        fontName: fontName,
                        fontPath: './../../fonts/iconfont/',
                        className: 'icon',
                        glyphs: glyph.map(mapGlyphs)
                    }))
                    .pipe(gulp.dest(env.path.dist + '/assets/css/'))
                    .on('finish', cb);
                console.log(glyph);
            });
        },
        function handleFonts(cb) {
            iconStream
                .pipe(gulp.dest(env.path.dist + '/fonts/iconfont/'))
                .on('finish', cb);
        }
    ], done);
});

function mapGlyphs(glyph) {
    return {
        name: glyph.name,
        codepoint: glyph.unicode[0].charCodeAt(0)
    }
}


gulp.task('imagemin', function() {
    gulp.src(env.path.source + '/img/**/*.*')
        .pipe(plugins.plumber({
            errorHandler: handleError
        }))
        .pipe(plugins.imagemin())
        .pipe(gulp.dest(env.path.dist + '/assets/img/'))
});

gulp.task('clean-img', function(cb) {
    return del(env.path.dist + '/assets/img/', cb);
});


// Watch for file changes and execute various tasks.
gulp.task('watch', function() {
    plugins.watch(
        env.path.source + '/scss/**/*.scss',
        function() {
            gulp.start('style');
            // gulp.start('styleLint');
        }
    );

    plugins.watch(
        env.path.source + '/js/main/*.js',
        function() {
            gulp.start('js');
        }
    );

    plugins.watch(
        env.path.source + '/js/vendors/*.js',
        function() {
            gulp.start('vendorsjs');
        }
    );

    // plugins.watch(
    //     env.path.source + '/js/ajax/*.js',
    //     function() {
    //         gulp.start('ajax');
    //     }
    // );

    plugins.watch(
        env.path.source + '/icons/*.*',
        function() {
            gulp.start('iconfont');
        }
    );

    plugins.watch(
        env.path.source + '/img/**/*.*',
        function() {
            gulp.start('clean-img');
            gulp.start('imagemin');
        }
    );

    plugins.watch(
        env.path.dist + '/**/*.html',
        function() {
            browserSync.reload();
        }
    );
});

// Releaod browser after change
gulp.task('browser-sync', function() {
    browserSync.init({
        proxy: env.host,
        notify: false
    });
});


// default task
gulp.task(
    'default', [
        'style',
        // 'styleLint',
        'js',
        'vendorsjs',
        'imagemin',
        'iconfont',
        'watch',
        'browser-sync'
    ]
);