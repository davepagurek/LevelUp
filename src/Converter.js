function setConverterReducers(Dispatcher) {
  Dispatcher.reduce("ConverterToggleSummaries", (state, action) => {
    const allSelected = _.every(state.summary);
    state.summary = state.summary.map(()=>!allSelected);
    return state;
  }).reduce("ConverterToggleSummary", (state, action) => {
    state.summary[action.index] = !state.summary[action.index];
    return state;
  });
};

function Converter(props) {
  return (
    <div>
      <section className='options'>
        <div className='row'>
          <MarkMappingCreator
            markMaps={props.markMaps}
          />
          <div className='column'>
            <div className='row'>
              <button onClick={()=>Dispatcher.emit("LoadMapping")}>
                Load Mappings from File
              </button>
              <button onClick={()=>Dispatcher.emit("SaveMapping")}>
                Save Mappings to File
              </button>
            </div>
            <div className="row">
              <button className='primary' onClick={()=>Dispatcher.emit("DoConversions")}>
                Preview
              </button>
            </div>
            <div className="row">
              <button onClick={()=>Dispatcher.emit("DoConversions", {csv: true})}>
                Export CSV
              </button>
              <button onClick={()=>Dispatcher.emit("DoConversions", {pdf: true})}>
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </section>
      {props.converted && (
        <section className='results'>
          <table className='averages'><tbody>
          {props.converted.map((row, i) => {
            return (<tr key={i} className={i==0 ? 'header' : ''}>
              {row.map((cell,j) => (i == 0 ?
                (<th key={j}>{cell}</th>)
                : (<td key={j}>{cell}</td>)
              ))}
              {i == 0 ?
                (
                  [
                    <th>
                      <span>Include summary</span>
                      <input
                        type='checkbox'
                        checked={_.every(props.summary)}
                        onChange={() => Dispatcher.emit("ConverterToggleSummaries")}
                      />
                    </th>,
                    <th>
                    </th>
                  ]
                ) :
                (
                  [
                    <td>
                      <input
                        type='checkbox'
                        checked={props.summary[i-1]}
                        onChange={() => Dispatcher.emit('ConverterToggleSummary', {index: i-1})}
                      />
                    </td>,
                    <td>
                      <button onClick={()=>Dispatcher.emit("GenerateIndividualReport", {studentIndex: i-1})}>
                      Individual report
                      </button>
                    </td>
                  ]
                )
              }
            </tr>);
          })}
          </tbody></table>
        </section>
      )}
    </div>
  );
}
