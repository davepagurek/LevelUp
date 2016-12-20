function setMarkMappingCreatorReducers(Dispatcher) {
  Dispatcher.reduce("MarkMapDelete", (state, action) => {
    delete state.markMaps[action.index];
    return state;
  }).reduce("MarkMapCreate", (state, action) => {
    state.markMaps[action.level] = action.percent;
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
              let [k, v] = pair;
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
      </div>
    );
  }
}
