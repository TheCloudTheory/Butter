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
            default: {
                tsconfig: './tsconfig.json',
                src: ['src/*.ts', '!node_modules/**/*.ts']
            }
        },
        env: {
            local: {
                GET_CONTENT_URL: 'http://localhost:7071/api/GetContent',
                GET_CONTENT_KEY: '',
                GET_MAP_URL: 'http://localhost:7071/api/GetMap',
                GET_MAP_KEY: ''
            },
            prod: {
                GET_CONTENT_URL: 'https://butter-prod-euw-functionapp.azurewebsites.net/api/GetContent',
                GET_CONTENT_KEY: 'H7lZjbEzw4Uhzc0d4HjaxwSRP46/oWMMKr8NljsWqoTp6Q03a5hIYw==',
                GET_MAP_URL: 'https://butter-prod-euw-functionapp.azurewebsites.net/api/GetMap',
                GET_MAP_KEY: 'oQ0eFJ8snS4jldja7k1YyjBH09cuKrY3p5LBa4awhD/Wve22blAywg=='
            }
        },
        replace: {
            dist: {
                options: {
                    patterns: [
                        {
                            match: 'GET_CONTENT_URL',
                            replacement: '<%= process.env.GET_CONTENT_URL %>'
                        },
                        {
                            match: 'GET_CONTENT_KEY',
                            replacement: '<%= process.env.GET_CONTENT_KEY %>'
                        },
                        {
                            match: 'GET_MAP_URL',
                            replacement: '<%= process.env.GET_MAP_URL %>'
                        },
                        {
                            match: 'GET_MAP_URL',
                            replacement: '<%= process.env.GET_MAP_URL %>'
                        },
                    ]
                },
                files: [
                    { expand: true, flatten: false, src: ['build/config.js'], dest: '' }
                ]
            }
        }
    });

    // NPM tasks
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-replace');

    // Tak registration
    grunt.registerTask('default', ['env:local', 'default-env']);
    grunt.registerTask('default-env', ['ts', 'replace', 'browserify', 'connect', 'watch']);
    grunt.registerTask('reload', ['ts', 'replace', 'browserify']);
    grunt.registerTask('build', ['env:prod', 'build-env']);
    grunt.registerTask('build-env', ['ts', 'replace', 'browserify']);
};