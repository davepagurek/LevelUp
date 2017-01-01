function setMarkMappingCreatorReducers(Dispatcher) {
  Dispatcher.on("MarkMapLoad", () => {
    Dispatcher.emit('ChooseFile', {name: null, callback: (filename) => {
      fs.readFile(filename, (error, data) => {
        if (error) return showError(`${error}`);
        beginLoading();
        try {
          const parsed = JSON.parse(""+data);
          defer(() => Dispatcher.emit('MarkMapLoadComplete', {markMaps: parsed}));
        } catch (error) {
          return showError(`${error}`);
        }
      });
    }});
  });

  Dispatcher.on("MarkMapSave", (data) => {
    Dispatcher.emit('ChooseFile', {name: 'mark_mappings.json', callback: (filename) => {
      beginLoading();
      fs.writeFile(filename, JSON.stringify(data.markMaps), (error) => {
        if (error) return showError(`${error}`);
        defer(() => Dispatcher.emit('MarkMapSaveComplete'));
      });
    }});
  });

  Dispatcher.reduce("MarkMapDelete", (state, action) => {
    delete state.markMaps[action.index];
    return state;
  }).reduce("MarkMapCreate", (state, action) => {
    state.markMaps[action.level] = action.percent;
    return state;
  }).reduce("MarkMapLoadComplete", (state, action) => {
    state.loading = false;
    state.markMaps = action.markMaps;
    return state;
  }).reduce("MarkMapSaveComplete", (state, action) => {
    state.loading = false;
    return state;
  });
};

class MarkMappingCreator extends React.Component {
  state = {};

  nextLevelChange = (e) => {
    let shouldIgnore = e.target.options[e.target.selectedIndex].value == 'ignore';
    this.setState((state) => {
      if (shouldIgnore) {
        state.nextPercent = 'ignore';
      } else {
        delete state.nextPercent;
      }
      return state;
    });
  };

  createMapping = () => {
    if (!this.state.nextLevel || !this.state.nextPercent) return;
    Dispatcher.emit("MarkMapCreate", {
      level: this.state.nextLevel,
      percent: this.state.nextPercent == 'ignore' ?
        this.state.nextPercent :
        parseFloat(this.state.nextPercent)
    });
    this.setState((state) => {
      delete state.nextLevel;
      delete state.nextPercent;
      return state;
    });
  };

  loadMarkMaps = () => Dispatcher.emit("MarkMapLoad");

  saveMarkMaps = () => Dispatcher.emit("MarkMapSave", {markMaps: this.props.markMaps});

  render() {
    return (
      <div className='column'>
        <div className='mappings'>
          {_.map(
            _.sortBy(
              _.toPairs(this.props.markMaps),
              (pair)=>pair[0].replace(/\W/g, '')
            ),
            (pair) => {
              const [k, v] = pair;
              return (<div className='markMap'>
                <div className='info'>
                  <span>{k}</span>
                  <span>&rarr;</span>
                  <span>{v}</span>
                </div>
                <button onClick={()=>Dispatcher.emit("MarkMapDelete", {index: k})}>
                  Remove
                </button>
              </div>);
            }
          )}
        </div>
        <div className='addMapping'>
          <input onChange={(e)=>this.setState({nextLevel: e.target.value})} type='text' value={this.state.nextLevel || ''} />
          <span>&rarr;</span>
          <div className='mappingValue double'>
            <select onChange={this.nextLevelChange}>
              <option selected={this.state.nextPercent=='ignore'} value='ignore'>Ignore</option>
              <option selected={!this.state.nextPercent || this.state.nextPercent != 'ignore'} value='value'>Value</option>
            </select>
            {(!this.state.nextPercent || this.state.nextPercent != 'ignore') &&
              (<input onChange={(e)=>this.setState({nextPercent: e.target.value})} type='number' min='0' max='100' value={this.state.nextPercent} />)
            }
          </div>
          <button disabled={!this.state.nextLevel || !this.state.nextPercent} onClick={this.createMapping}>
            Add mapping
          </button>
        </div>
        <div className='row'>
          <button onClick={this.loadMarkMaps}>
            Load from File
          </button>
          <button onClick={this.saveMarkMaps}>
            Save to File
          </button>
        </div>
      </div>
    );
  }
}
