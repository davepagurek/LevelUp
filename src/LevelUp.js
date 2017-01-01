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
  border: 1px solid #7f8c8d;
}
table.report th {
  font-size:0.8em;
  white-space: nowrap;
}
table.report tr td:first-child {
  page-break-inside: avoid;
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
  padding:5px;
  margin: 0;
}
`;

class LevelUp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      path: [],
      loading: false,
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
      .on("ChooseFile", (action) => {
        this.chooseFile(action.name, action.callback);
      })
      .on("BeginLoading", () => this.setState({loading: true}))
      .reduce("ConversionsComplete", _.identity, (action) => {
        if (!action.pdf && !action.csv) {
          smoothScr.anim('.results');
        } else {
          this.alert("File saved successfully!");
        }
      }).reduce("ReportComplete", _.identity, (action) => {
        this.alert("File saved successfully!");
      }).reduce('GenerateCodesComplete', _.identity, (action) => {
        if (!action.pdf && !action.csv) {
          smoothScr.anim('.results');
        } else {
          this.alert("File saved successfully!");
        }
      }).reduce("MarkMapLoadComplete", _.identity, (action) => {
        this.alert("File loaded successfully!");
      }).reduce("MarkMapSaveComplete", _.identity, (action) => {
        this.alert("File saved successfully!");
      });

    setConverterReducers(Dispatcher);
    setMarkMappingCreatorReducers(Dispatcher);
    setCodesReducers(Dispatcher);
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
            data={this.state.data}
            students={this.state.students}
            markMaps={this.state.markMaps}
            summary={this.state.summary}
            converted={this.state.converted}
          />
        );
      case 'codes':
        return (
          <Codes
            codes={this.state.codes}
            data={this.state.data}
          />
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
