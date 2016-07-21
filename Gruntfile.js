'use strict';

module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    browserify: {
      main: {
        options: {
          external: ['kevoree-library'],
          standalone: 'KevoreeKevscript'
        },
        src: '<%= pkg.name %>',
        dest: 'browser/<%= pkg.name %>.js'
      },
      test: {
        src: 'test/browser/test.js',
        dest: 'browser/test.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('default', 'browserify:main');
  grunt.registerTask('test', ['browserify:test']);
};
