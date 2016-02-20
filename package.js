var NwBuilder = require('nw-builder');
var nw = new NwBuilder({
  files: ['index.html', './package.json', './dist/**/*', './node_modules/**/*', './bower_components/**/*', './css/**/*', '!./node_modules/nw-builder/**/*', '!./node_modules/nw/**/*'], // use the glob format
  platforms: ['osx64'],
  version: '0.12.3',
  buildDir: './build',
  zip: false
});

//Log stuff you want

nw.on('log',  console.log);

// Build returns a promise
nw.build().then(function () {
   console.log('all done!');
}).catch(function (error) {
    console.error(error);
});
