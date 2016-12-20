const md5 = require('js-md5');
const makeCodes = function(lines, key, length) {
  let header = lines.shift();
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
          // Replace strings that look like exponents to Excel
          .replace(/^(\d+)e(\d+)$/ig, (match, begin, end) => `${begin}f${end}`);
      }
    }))
  ));
};

function setCodesReducers(Dispatcher) {
  Dispatcher.on('GenerateCodes', (options) => {
    options = options || {};
    let lines = options.data.slice();
    const result = makeCodes(lines, options.key || '', options.codeLength || 6);

    if (options.csv) {
      csv.stringify(result, {quotedString: true}, (err, csvText) => {
        if (err) return error(`${err}`);
        Dispatcher.emit('ChooseFile', {name: 'codes.csv', callback: (filename) => {
          fs.writeFile(filename, csvText, (error) => {
            if (error) return error(`${error}`);
            Dispatcher.emit('GenerateCodesComplete', {...options, codes: result});
          })
        }});
      });
    } else if (options.pdf) {
      Dispatcher.emit('ChooseFile', {name: 'codes.pdf', callback: (filename) => {
        const html = `<body><style>${css}</style>` +
          '<table class="codes"><tbody>' +
          result.map((row, i) => {
            return `<tr className=${i==0 ? 'header' : ''}>` +
              row.map((cell) => (i == 0 ?
                `<th>${cell}</th>`
                : `<td>${cell}</td>`
              )).join(' ') +
            '</tr>';
          }).join(' ') +
          '</tbody></table></body>';
        const pdfOptions = {
          format: 'Letter',
          orientation: 'landscape',
          border: {
            "top": "0.8in",
            "right": "0.5in",
            "bottom": "0.8in",
            "left": "0.5in"
          }
        };
        pdf.create(html, pdfOptions).toFile(filename, (error, res) => {
          if (error) return error(`${error}`);
          Dispatcher.emit('GenerateCodesComplete', {...options, codes: result});
        });
      }});
    } else {
      defer(() => Dispatcher.emit('GenerateCodesComplete', {...options, codes: result}));
    }
  });

  Dispatcher.reduce('GenerateCodes', (state, action) => {
    state.loading = true;
    return state;
  }).reduce('GenerateCodesComplete', (state, action) => {
    state.loading = false;
    state.codes = action.codes;
    return state;
  });
}

class Codes extends React.Component {
  state = {key: '', codeLength: 6};

  changeCodeLength = (e) => this.setState({codeLength: e.target.value});

  changeKey = (e) => this.setState({key: e.target.value});

  generateCodes = () => Dispatcher.emit('GenerateCodes', {...this.state, data: this.props.data});
  generateCSVCodes = () => Dispatcher.emit('GenerateCodes', {...this.state, data: this.props.data, csv: true});
  generatePDFCodes = () => Dispatcher.emit('GenerateCodes', {...this.state, data: this.props.data, pdf: true});

  headingFor(cell, j) {
    if (j === 0) {
      return "Last name";
    } else if (j === 1) {
      return "First name";
    } else {
      return cell;
    }
  }

  render() {
    return (
      <div>
        <section className='options'>
          <div className='row'>
            <div className='column'>
              <input
                type='text'
                value={this.state.key}
                onChange={this.changeKey}
              />
              <h3>Secret key</h3>
              <p>{'Without using a secret key, it is possible (although still impractical) to decode the result. By adding a key that only you know, it is virtually impossible to decode without knowing the key. If this is not a concern, it may be left blank.'}</p>
            </div>
            <div className='column'>
              <input
                type='number'
                min='1'
                max='64'
                value={this.state.codeLength}
                onChange={this.changeCodeLength}
              />
              <h3>Code Length</h3>
              <button onClick={this.generateCodes}>
                Preview
              </button>
              <button onClick={this.generateCSVCodes}>
                Export CSV
              </button>
              <button onClick={this.generatePDFCodes}>
                Export PDF
              </button>
            </div>
          </div>
        </section>
        {this.props.codes && (
          <section className='results'>
            <table className='averages'><tbody>
            {this.props.codes.map((row, i) => {
              return (<tr key={i} className={i==0 ? 'header' : ''}>
                {row.map((cell, j) => (i == 0 ?
                  (<th key={j}>{this.headingFor(cell, j)}</th>)
                  : (<td key={j}>{cell}</td>)
                ))}
              </tr>);
            })}
            </tbody></table>
          </section>
        )}
      </div>
    );
  }
};
