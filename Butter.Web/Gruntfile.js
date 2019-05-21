module.exports = function (grunt) {

    // Main Grunt configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            server: {
                options: {
                    port: 12334,
                    hostname: 'localhost',
                    open: true,
                    livereload: true,
                    middleware: function (connect, options, middlewares) {
                        var modRewrite = require('connect-modrewrite');

                        // enable Angular's HTML5 mode
                        middlewares.unshift(modRewrite(['!/api|\\.html|\\.js|\\.svg|\\.css|\\.png|\\.mst|/$ /index.html [L]',]));

                        return middlewares;
                    }
                }
            }
        },
        browserify: {
            dist: {
                files: {
                    'dist/app.js': ['build/*.js']
                }
            }
        },
        watch: {
            scripts: {
                files: ['src/**/*.ts', '**/*.mst'],
                tasks: ['reload'],
                options: {
                    spawn: false,
                    livereload: true
                },
            }
        },
        ts: {
            default : {
                tsconfig: './tsconfig.json',
                src: ['src/*.ts', '!node_modules/**/*.ts']
            }
        }
    });

    // NPM tasks
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks("grunt-ts");

    // Tak registration
    grunt.registerTask('default', ['ts', 'browserify', 'connect', 'watch']);
    grunt.registerTask('reload', ['ts', 'browserify']);
};