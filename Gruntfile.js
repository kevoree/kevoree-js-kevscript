'use strict';

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    browserify: {
      main: {
        options: {
          external: ['kevoree-library', 'tiny-conf', 'kevoree-validator'],
          browserifyOptions: {
            standalone: 'KevoreeKevscript'
          }
        },
        src: '<%= pkg.main %>',
        dest: 'browser/<%= pkg.name %>.js'
      },
      test: {
        src: 'test/browser/test.js',
        dest: 'browser/test.js'
      }
    },

    uglify: {
      main: {
        files: {
          'browser/<%= pkg.name %>.js': 'browser/<%= pkg.name %>.js'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['browserify:main', 'uglify']);
  grunt.registerTask('test', ['browserify:test']);
};
