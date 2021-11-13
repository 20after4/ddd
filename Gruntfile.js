module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    "svgstore": {
      "options": {
        "prefix" : "icon-"
      },
      "default": {
        "files": {
          "www/static/icons.svg": ["www/src/icons/*.svg"]
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-svgstore');
  grunt.registerTask('default', ['svgstore']);
}
