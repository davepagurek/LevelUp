let csv = require('csv');
let fs = require('fs');
let pdf = require('html-pdf');
let css = `
table {
  margin-left:auto;
  margin-right:auto;
  width:auto;
  background-color:#FFF;
  color:#000;
  border-collapse:collapse;
  font-family: sans-serif;
}

tr, td, th {
  padding:20px;
  margin:0;
}

th {
  border-bottom: 3px solid #7f8c8d;
}

td {
  border-right: 1px solid #7f8c8d;
  border-bottom: 1px solid #7f8c8d;
}

tr:last-child td {
  border-bottom:0;
}

tr td:last-child {
  border-right:none;
}

table {
  font-size:12px;
}
tr, td, th {
  padding:11px;
}
`;

class LevelUp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      path: [],
      loading: false,
      codeLength: 6,
      markMaps: {
        "R-": 25,
        "-R": 25,
        "R": 35,
        "R+": 45,
        "+R": 45,
        "1-": 52,
        "-1": 52,
        "1": 55,
        "1+": 58,
        "+1": 58,
        "2-": 62,
        "-2": 62,
        "2": 65,
        "2+": 68,
        "+2": 68,
        "3-": 72,
        "-3": 72,
        "3": 75,
        "3+": 78,
        "+3": 78,
        "4-": 86,
        "-4": 86,
        "4": 94,
        "4+": 100,
        "+4": 100,
        "5": 100,
        "A": "ignore",
        "B": 0
      }
    };

    Dispatcher
      .on('reset', (data)=>this.setState({path: []}))
      .on('back', (data)=>this.setState({path: this.state.slice(0, data.amount+1)}))
      .on('mode_set', (data)=>this.setState({path: this.state.path.concat([data.mode])}))
      .on('error', (data)=>this.setState({error: data.message, loading: false}))
      .on('received_file', (data) => {
        this.setState({loading: true});
        fs.readFile(data.filename, (err, data) => {
          if (err) {
            this.setState({error: "Couldn't read the file selected", loading: false});
          } else {
            data = data.toString('utf8');
            let delim = (data.match(/,/g) || []).length >= (data.match(/;/g) || []).length ? ',' : ';';
            csv.parse(data, {delimeter: delim}, (err, output) => {
              if (err) {
                this.setState({error: `Couldn't parse the file: ${err}`, loading: false});
              } else {
                this.setState({data: output, loading: false});
              }
            });
          }
        })
      });
  }

  chooseFile(defaultFilename, callback) {
    callback = callback || function(){};
    var chooser = document.getElementById('fileDialog');
    chooser.setAttribute('nwsaveas', defaultFilename || '');
    var onChange = function() {
      callback(this.value);
      chooser.removeEventListener('change', onChange);
      this.value = null;
    };
    chooser.addEventListener('change', onChange);

    chooser.click();  
  }

  alert(text) {
    this.setState({alert: text || ""});
  }

  doConversions(options) {
    options = options || {};
    var lines = this.state.data.slice();
    let result = studentGrades(lines, this.state.markMaps);

    if (options.csv) {
      this.setState({loading: true});
      csv.stringify(result, (err, csvText) => {
        if (err) return this.setState({error: `${err}`, loading: false});
        this.chooseFile('converted.csv', (filename) => {
          fs.writeFile(filename, csvText, (error) => {
            if (error) return this.setState({error: `${error}`, loading: false});
            this.setState({loading: false});
            this.alert('File saved successfully.');
            console.log('done');
          })
        });
      });
    } else if (options.pdf) {
      this.setState({loading: true});
      let html = `<style>${css}</style>` +
        '<table class="averages">' +
        result.map((row, i) => {
          return `<tr className=${i==0 ? 'header' : ''}>` +
            row.map((cell) => (i == 0 ?
              `<th>${cell}</th>`
              : `<td>${cell}</td>`
            )).join(' ') +
          '</tr>';
        }).join(' ') +
        '</table>';
      let options = {
        format: 'Letter',
        border: {
          "top": "0.8in",
          "right": "0.5in",
          "bottom": "0.8in",
          "left": "0.5in"
        }
      };
      this.chooseFile('converted.pdf', (filename) => {
        pdf.create(html, options).toFile(filename, (error, res) => {
          if (error) return this.setState({error: `${error}`, loading: false});
          this.setState({loading: false});
          this.alert('File saved successfully.');
        });
      });
    } else {
      this.setState({converted: result}, () => {
        smoothScr.anim('.results');
      });
    }
  }

  generateCodes() {
    var lines = this.state.data.slice();
    let result = makeCodes(lines, this.state.key || '', this.state.codeLength || 6);
    this.setState({codes: result}, () => {
      smoothScr.anim('.results');
    });
  }

  getAppBody() {
    if (this.state.error) {
      return (
        <section className='error'>
          <h2>Oh no!</h2>
          <h3>{this.state.error}</h3>
          <button onClick={()=>this.setState({error: null})}>
            OK
          </button>
        </section>
      );
    } else if (!this.state.data) {
      return (<FileUploader />);
    } else {
      switch (_.last(this.state.path)) {
      case ('convert'):
        return (
          <div>
            <section className='options'>
              <div className='row'>
                <div className='column'>
                  <div className='mappings'>
                    {_.map(
                      _.sortBy(
                        _.toPairs(this.state.markMaps),
                        (pair)=>pair[0].replace(/\W/g, '')
                      ),
                      (pair) => {
                        let [k, v] = pair;
                        return (<div className='markMap'>
                          <div className='info'>
                            <span>{k}</span>
                            <span>&rarr;</span>
                            <span>{v}</span>
                          </div>
                          <button onClick={()=>this.setState((state)=>{
                            delete state.markMaps[k];
                            return state;
                          })}>
                            Remove
                          </button>
                        </div>);
                      }
                    )}
                  </div>
                  <div className='addMapping'>
                    <input onChange={(e)=>this.setState({nextLevel: e.target.value})} type='text' value={this.state.nextLevel} />
                    <span>&rarr;</span>
                    <div className='mappingValue'>
                      <select onChange={(e) => {
                        let shouldIgnore = e.target.options[e.target.selectedIndex].value == 'ignore';
                        this.setState((state) => {
                          if (shouldIgnore) {
                            state.nextPercent = 'ignore';
                          } else {
                            delete state.nextPercent;
                          }
                          return state;
                        });
                      }}>
                        <option selected={this.state.nextPercent=='ignore'} value='ignore'>Ignore</option>
                        <option selected={!this.state.nextPercent || this.state.nextPercent != 'ignore'} value='value'>Value</option>
                      </select>
                      {!this.state.nextPercent || this.state.nextPercent != 'ignore' ?
                        (<input onChange={(e)=>this.setState({nextPercent: e.target.value})} type='number' min='0' max='100' value={this.state.nextPercent} />)
                        : undefined}
                    </div>
                    <button disabled={!this.state.nextLevel || !this.state.nextPercent} onClick={()=>{
                      if (this.state.nextLevel && this.state.nextPercent) {
                        this.setState((state) => {
                          state.markMaps[state.nextLevel] = state.nextPercent;
                          delete state.nextLevel;
                          delete state.nextPercent;
                          return state;
                        });
                      }
                    }}>
                      Add mapping
                    </button>
                  </div>
                </div>
                <div className='column'>
                  <button className='singleLine' onClick={()=>this.doConversions()}>
                    Preview
                  </button>
                  <button className='singleLine' onClick={()=>this.doConversions({csv: true})}>
                    Export CSV
                  </button>
                  <button className='singleLine' onClick={()=>this.doConversions({pdf: true})}>
                    Export PDF
                  </button>
                </div>
              </div>
            </section>
            {this.state.converted ? (
              <section className='results'>
                <table className='averages'>
                {this.state.converted.map((row, i) => {
                  return (<tr className={i==0 ? 'header' : ''}>
                    {row.map((cell) => (i == 0 ?
                      (<th>{cell}</th>)
                      : (<td>{cell}</td>)
                    ))}
                  </tr>);
                })}
                </table>
              </section>
            ) : undefined}
          </div>
        );
      case 'codes':
        return (
          <div>
            <section className='options'>
              <div className='row'>
                <div className='column'>
                  <input
                    type='text'
                    value={this.state.key}
                    onChange={(e)=>this.setState({key: e.target.value})}
                  />
                  <h3>Secret key</h3>
                  <h4>{'Without using a secret key, it is possible (although still impractical) to decode the result. By adding a key that only you know, it is virtually impossible to decode without knowing the key. If this is not a concern, it may be left blank.'}</h4>

                </div>
                <div className='column'>
                  <input
                    type='number'
                    min='1'
                    max='64'
                    value={this.state.codeLength}
                    onChange={(e)=>this.setState({codeLength: e.target.value})}
                  />
                  <h3>Code Length</h3>
                  <button onClick={()=>this.generateCodes()}>
                    Generate codes
                  </button>
                </div>
              </div>
            </section>
            {this.state.codes ? (
              <section className='results'>
                <table className='averages'>
                {this.state.codes.map((row, i) => {
                  return (<tr className={i==0 ? 'header' : ''}>
                    {row.map((cell) => (i == 0 ?
                      (<th>{cell}</th>)
                      : (<td>{cell}</td>)
                    ))}
                  </tr>);
                })}
                </table>
              </section>
            ) : undefined}
          </div>
        );
      default:
        return (
          <div>
            <Menu>
              <MenuItem title='Calculate term averages' mode='convert'>
                {'Convert all levels to percentages and compute weighted term averages'}
              </MenuItem>
              <MenuItem title='Generate report' mode='report'>
                {'Create a chart showing student progress for each assessment'}
              </MenuItem>
              <MenuItem title='Generate codes' mode='codes'>
                {'Create a unique codename for each assessment for each student'}
              </MenuItem>
            </Menu>
            <section className='center'>
              <button onClick={()=>this.setState({data:null})}>
                Pick another file
              </button>
            </section>
          </div>
        );
      }
    }
  }

  render() {
    return (
      <div className='app'>
        {this.state.alert ? 
          (<div className='alert'>
            <p>{this.state.alert}</p>
            <button onClick={()=>this.setState({alert: null})}>
              OK
            </button>
          </div>)
          : undefined
        }
        <div className={`loader ${this.state.loading ? 'open' : ''}`}>
          <h3>Loading...</h3>
        </div>
        <Breadcrumbs title='LevelUp' path={this.state.path} />
        {this.getAppBody()}
      </div>
    );
  }
}
