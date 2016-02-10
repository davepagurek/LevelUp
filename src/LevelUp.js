let csv = require('csv');
let fs = require('fs');class LevelUp extends React.Component {
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

  doConversions() {
    var lines = this.state.data.slice();
    let result = studentGrades(lines, this.state.markMaps);
    this.setState({converted: result});
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
                  <button onClick={()=>this.doConversions()}>
                    Convert
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
        <div className={`loader ${this.state.loading ? 'open' : ''}`}>
          <h3>Loading...</h3>
        </div>
        <Breadcrumbs title='LevelUp' path={this.state.path} />
        {this.getAppBody()}
      </div>
    );
  }
}