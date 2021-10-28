const browserify = require("browserify")
const fs = require('fs')
browserify("./xhr.js", {
  debug : true,
  standalone: "util"
}).transform(['babelify', { compact: false }], {
  global: true,
  ignore: [/\/node_modules\/(?!@vizuaalog\/)/],
  presets: [
    "@babel/preset-env",
    "@babel/preset-react"]
  }).bundle().on('error', function (err) {
    console.log(err);
  }).pipe(fs.createWriteStream('package.js')).on('end', function(){
    console.log( 'finished writing the browserify file' );
  });
