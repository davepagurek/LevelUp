let md5 = require('js-md5');
let makeCodes = function(lines, key, length) {
  var header = lines.shift();
  while (header[0] != 'Type') {
    header = lines.shift();
    if (!header || !header.length || header.length<0) return Dispatcher.emit('error', {message: "Either \"Type\" is missing from the header row or the CSV uses the wrong deliminator."});
  }

  header = _.uniq(header);

  return [header].concat(lines.map(
    (row => header.map((cell, i) => {
      if (i<2) {
        return row[i];
      } else {
        return md5(`${row[0]}${row[1]}${cell}${key || ''}`)
          .substr(0, length)
          .replace(/^(\d+)e(\d+)$/ig, (match, begin, end) => `${begin}f${end}`);
      }
    }))));
}
