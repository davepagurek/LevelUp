let csv = require('csv');
let fs = require('fs');class LevelUp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      path: [],
      loading: false
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
      //case ('convert'):
        //return (<Converter data={this.state.data} />);
      default:
        return (
          <Menu>
            <MenuItem title='Calculate term averages' mode='convert'>
              'Convert all levels to percentages and compute weighted term averages'
            </MenuItem>
            <MenuItem title='Generate report' mode='report'>
              'Create a chart showing student progress for each assessment'
            </MenuItem>
            <MenuItem title='Generate codes' mode='codes'>
              'Create a unique codename for each assessment for each student'
            </MenuItem>
          </Menu>
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
