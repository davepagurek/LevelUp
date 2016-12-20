let csv = require('csv');
let fs = require('fs');
let pdf = require('html-pdf');
let css = `
html {
  zoom: 0.68;
}
body {
  background-color:#FFF;
  color:#000;
  font-family: sans-serif;
}
table {
  margin-left:auto;
  margin-right:auto;
  width:auto;
  border-collapse:collapse;
}
table.report th {
  font-size:0.8em;
  white-space: nowrap;
}
table.report tr td:first-child {
  page-break-inside: avoid;
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

td.level {
  padding: 5px;
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
      .setRootStateComponent(this)
      .on('reset', (data)=>this.setState({path: []}))
      .on('back', (data)=>this.setState({path: this.state.slice(0, data.amount+1)}))
      .on('mode_set', (data)=>this.setState({path: this.state.path.concat([data.mode])}))
      .on('error', (data)=>this.setState({error: data.message, loading: false}))
      .on('received_file', (data) => {
        this.setState({loading: true});
        fs.readFile(data.filename, (err, data) => {
          data = "" + data;
          if (err) {
            this.setState({error: "Couldn't read the file selected", loading: false});
          } else {
            data = data.toString('utf8');
            let delim = (data.match(/,/g) || []).length >= (data.match(/;/g) || []).length ? ',' : ';';
            csv.parse(data, {delimiter: delim}, (err, output) => {
              if (err) {
                this.setState({error: `Couldn't parse the file: ${err}`, loading: false});
              } else {
                this.setState({data: output, loading: false});
              }
            });
          }
        })
      })
      .on("LoadMapping", this.loadMappings)
      .on("SaveMapping", this.saveMappings)
      .on("DoConversions", (data) => this.doConversions(data));

    setConverterReducers(Dispatcher);
    setMarkMappingCreatorReducers(Dispatcher);
  }

  chooseFile(defaultFilename, callback) {
    callback = callback || function(){};
    var chooser = document.getElementById('fileDialog');
    if (defaultFilename === null) {
      chooser.removeAttribute('nwsaveas');
    } else {
      chooser.setAttribute('nwsaveas', defaultFilename || '');
    }
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

  individualReport(i) {
    if (!this.state.students || !this.state.students[i] || Object.keys(this.state.students[i].evaluationCategories).length == 0) {
      return this.setState({error: 'No evaluation categories present.'});
    }

    let student = this.state.students[i];

    let categorizedMarks = {};
    Object.keys(student.categories).forEach((code) => {
      categorizedMarks[code] = {name: student.categories[code], marks: []};
    });

    student.termLevels.forEach((mark, i) => {
      let cat = student.evaluationCategories[i];
      categorizedMarks[cat].marks.push(mark)
    });
    for (let c in categorizedMarks) {
      if (categorizedMarks[c].marks.length == 0) {
        delete categorizedMarks[c];
      }
    }

    let sortedCategories = Object.keys(categorizedMarks)
      .sort((a,b) => (parseInt(a) - parseInt(b)));
    let sortedLevels = _.toPairs(this.state.markMaps)
      .filter((pair) => pair[1] != 'ignore')
      .sort((a, b) => {
        if (a[1] < b[1]) {
          return -1;
        } else if (a[1] > b[1]) {
          return 1;
        } else {
          let aName = a[0].replace(/\W/g, '');
          let bName = b[0].replace(/\W/g, '');
          if (aName < bName) {
            return -1;
          } else if (aName > bName) {
            return 1;
          } else {
            return 0;
          }
        }
        (pair)=>pair[1]
      })
    .reduce((pairs, next) => {
      if (pairs.length == 0 || pairs[pairs.length-1][1] != next[1]) {
        pairs.push(next);
      }
      return pairs;
    }, []);

    let html = `<body><style>${css}</style>` +
      `<h1>${student.firstName} ${student.lastName}</h1>` +
      '<table class="report"><tbody>' +
      `<tr><th>Category</th>` +
      sortedLevels.map((level) => `<th>${level[0]}</th>`).join('') +
      `</tr>` +
      sortedCategories.map((cat) => categorizedMarks[cat].marks.map((mark, i) => {
        return `<tr>` +
          (i == 0 ?
           `<td rowspan='${categorizedMarks[cat].marks.length}'>${categorizedMarks[cat].name}</td>` : '') +
          sortedLevels.map((level) => `<td class='level'>${mark.percent == level[1] ? mark.name : ''}</td>`).join('') +
          `</tr>`;
      }).join('')).join('') +
      `</tbody></table>`;

    if (this.state.summary[i]) {
      html +=
        '<div>' +
        `<p><strong>Overall term:</strong> ${student.term == 'ignore' ? '---' : student.term.toFixed(2) + '%'}</p>` +
        `<p><strong>Summative:</strong> ${student.summative == 'ignore' ? '---' : student.summative.toFixed(2) + '%'}</p>` +
        `<p><strong>Exam:</strong> ${student.exam == 'ignore' ? '---' : student.exam.toFixed(2) + '%'}</p>` +
        '</div>';
    }
    html += '</body>'

    let options = {
      format: 'Letter',
      border: {
        "top": "0.8in",
        "right": "0.5in",
        "bottom": "0.8in",
        "left": "0.5in"
      }
    };
    this.chooseFile(`${student.lastName}, ${student.firstName} - report.pdf`, (filename) => {
      this.setState({loading: true});
      pdf.create(html, options).toFile(filename, (error, res) => {
        if (error) return this.setState({error: `${error}`, loading: false});
        this.setState({loading: false});
        this.alert('File saved successfully.');
      });
    });
  }

  doConversions(options) {
    options = options || {};
    var lines = this.state.data.slice();
    let students = convert(lines, this.state.markMaps);
    let result = grades(students);

    if (options.csv) {
      csv.stringify(result, {quotedString: true}, (err, csvText) => {
        if (err) return this.setState({error: `${err}`, loading: false});
        this.chooseFile('converted.csv', (filename) => {
          this.setState({loading: true});
          fs.writeFile(filename, csvText, (error) => {
            if (error) return this.setState({error: `${error}`, loading: false});
            this.setState({loading: false});
            this.alert('File saved successfully.');
            console.log('done');
          });
        });
      });
    } else if (options.pdf) {
      let html = `<style>${css}</style>` +
        '<body><table class="averages"><tbody>' +
        result.map((row, i) => {
          return `<tr class="${i==0 ? 'header' : ''}">` +
            row.map((cell) => (i == 0 ?
              `<th>${cell}</th>`
              : `<td>${cell}</td>`
            )).join(' ') +
          '</tr>';
        }).join(' ') +
        '</tbody></table></body>';
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
        this.setState({loading: true});
        pdf.create(html, options).toFile(filename, (error, res) => {
          if (error) return this.setState({error: `${error}`, loading: false});
          this.setState({loading: false});
          this.alert('File saved successfully.');
        });
      });
    } else {
      this.setState({students: students, converted: result, summary: students.map(()=>false)}, () => {
        smoothScr.anim('.results');
      });
    }
  }

  saveMappings() {
    this.chooseFile('mark_mappings.json', (filename) => {
      this.setState({loading: true});
      fs.writeFile(filename, JSON.stringify(this.state.markMaps), (error) => {
        if (error) return this.setState({error: `${error}`, loading: false});
        this.setState({loading: false});
        this.alert('File saved successfully.');
        console.log('done');
      });
    });
  }

  loadMappings() {
    this.chooseFile(null, (filename) => {
      this.setState({loading: true});
      fs.readFile(filename, (error, data) => {
        if (error) return this.setState({error: `${error}`, loading: false});
        this.setState({loading: false, markMaps: JSON.parse(""+data)});
        this.alert('File loaded successfully.');
        console.log('done');
      });
    });
  }

  generateCodes(options) {
    var lines = this.state.data.slice();
    let result = makeCodes(lines, this.state.key || '', this.state.codeLength || 6);
    if (options.csv) {
      csv.stringify(result, {quotedString: true}, (err, csvText) => {
        this.setState({loading: true});
        if (err) return this.setState({error: `${err}`, loading: false});
        this.chooseFile('codes.csv', (filename) => {
          fs.writeFile(filename, csvText, (error) => {
            if (error) return this.setState({error: `${error}`, loading: false});
            this.setState({loading: false});
            this.alert('File saved successfully.');
            console.log('done');
          })
        });
      });
    } else if (options.pdf) {
      this.chooseFile('codes.pdf', (filename) => {
        this.setState({loading: true});
        let html = `<body><style>${css}</style>` +
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
        let options = {
          format: 'Letter',
          border: {
            "top": "0.8in",
            "right": "0.5in",
            "bottom": "0.8in",
            "left": "0.5in"
          }
        };
        pdf.create(html, options).toFile(filename, (error, res) => {
          if (error) return this.setState({error: `${error}`, loading: false});
          this.setState({loading: false, codes: result});
          this.alert('File saved successfully.');
        });
      });
    } else {
      this.setState({codes: result}, () => {
        smoothScr.anim('.results');
      });
    }
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
          <Converter
            markMaps={this.state.markMaps}
            summary={this.state.summary}
            converted={this.state.converted}
          />
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
                  <button onClick={()=>this.generateCodes({})}>
                    Preview
                  </button>
                  <button onClick={()=>this.generateCodes({csv: true})}>
                    Export CSV
                  </button>
                  <button onClick={()=>this.generateCodes({pdf: true})}>
                    Export PDF
                  </button>
                </div>
              </div>
            </section>
            {this.state.codes ? (
              <section className='results'>
                <table className='averages'><tbody>
                {this.state.codes.map((row, i) => {
                  return (<tr key={i} className={i==0 ? 'header' : ''}>
                    {row.map((cell, j) => (i == 0 ?
                      (<th key={j}>{cell}</th>)
                      : (<td key={j}>{cell}</td>)
                    ))}
                  </tr>);
                })}
                </tbody></table>
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
              <MenuItem title='Generate codes' mode='codes'>
                {'Create a unique codename for each assessment for each student'}
              </MenuItem>
            </Menu>
            <section className='center'>
              <button onClick={()=>this.setState({data:null, converted: null, students: null, summary: null})}>
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
        {this.state.alert &&
          (<div className='alert'>
            <p>{this.state.alert}</p>
            <button onClick={()=>this.setState({alert: null})}>
              OK
            </button>
          </div>)
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
