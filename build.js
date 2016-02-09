var rollup = require( 'rollup' );

rollup.rollup({
  entry: 'src/app.js'
}).then( function ( bundle ) {
  bundle.write({
    dest: 'dist/lib/app.js',
    exports: 'named',
    moduleName: 'LevelUp',
    exclude: ['fs', 'csv']
  });
});
