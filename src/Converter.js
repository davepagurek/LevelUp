function setConverterReducers(Dispatcher) {
  Dispatcher.on("DoConversions", (options) => {
    let lines = options.data.slice();
    const students = convert(lines, options.markMaps);
    const result = grades(students);

    if (options.csv) {
      csv.stringify(result, {quotedString: true}, (err, csvText) => {
        if (err) return Dispatcher.emit('error', {message: `${err}`});
        Dispatcher.emit("ChooseFile", {name: 'converted.csv', callback: (filename) => {
          fs.writeFile(filename, csvText, (error) => {
            if (error) return Dispatcher.emit('error', {message: `${error}`});
            Dispatcher.emit('ConversionsComplete', {...options, students: students, converted: result});
          });
        }});
      });
    } else if (options.pdf) {
      const html = `<style>${css}</style>` +
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
      const pdfOptions = {
        format: 'Letter',
        border: {
          "top": "0.8in",
          "right": "0.5in",
          "bottom": "0.8in",
          "left": "0.5in"
        }
      };
      Dispatcher.emit("ChooseFile", {name: 'converted.pdf', callback: (filename) => {
        pdf.create(html, pdfOptions).toFile(filename, (error, res) => {
          if (error) return Dispatcher.emit('error', {message: `${error}`});
          Dispatcher.emit('ConversionsComplete', {...options, students: students, converted: result});
        });
      }});
    } else {
      async(() => Dispatcher.emit('ConversionsComplete', {...options, students: students, converted: result}));
    }
  });

  Dispatcher.on("GenerateIndividualReport", (data) => {
    if (!data.student || Object.keys(data.student.evaluationCategories).length === 0) {
      return async(() => Dispatcher.emit('error', {message: 'No evaluation categories present.'}));
    }

    const {student} = data;

    const categorizedMarks = {};
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

    // Sort numerically rather than the default string sort
    const sortedCategories = Object.keys(categorizedMarks)
      .sort((a,b) => (parseInt(a) - parseInt(b)));

    // Sort [level, percent] pairs by their value
    const sortedLevels = _.toPairs(data.markMaps)
      // Remove ignored marks
      .filter((pair) => pair[1] != 'ignore')
      // Sort by level value
      .sort((a, b) => {
        // Sort by percent first
        if (a[1] < b[1]) {
          return -1;
        } else if (a[1] > b[1]) {
          return 1;

        // If we are comparing e.g. 4+ and +4, sort by level name alphabetically
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
      })
      // Build up a new list with +1, 1+, etc merged into one
      .reduce((pairs, next) => {
        // Only add the next pair to the list if the previous isn't the same value
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

    if (data.summary) {
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
    Dispatcher.emit('ChooseFile', {name: `${student.lastName}, ${student.firstName} - report.pdf`, callback: (filename) => {
      pdf.create(html, options).toFile(filename, (error, res) => {
        if (error) return Dispatcher.emit('error', {message: `${error}`});
        Dispatcher.emit('ReportComplete');
      });
    }});
  });

  Dispatcher.reduce("ConverterToggleSummaries", (state, action) => {
    const allSelected = _.every(state.summary);
    state.summary = state.summary.map(()=>!allSelected);
    return state;
  }).reduce("ConverterToggleSummary", (state, action) => {
    state.summary[action.index] = !state.summary[action.index];
    return state;
  }).reduce("DoConversions", (state, action) => {
    state.loading = true;
    return state;
  }).reduce("ConversionsComplete", (state, action) => {
    state.loading = false;
    state.students = action.students;
    state.converted = action.converted;
    state.summary = action.students.map(() => false);
    return state;
  }).reduce("GenerateIndividualReport", (state, action) => {
    state.loading = true;
    return state;
  }).reduce("ReportComplete", (state, action) => {
    state.loading = false;
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
              <button className='primary' onClick={()=>Dispatcher.emit("DoConversions", {data: props.data, markMaps: props.markMaps})}>
                Convert
              </button>
            </div>
            <div className="row">
              <button onClick={()=>Dispatcher.emit("DoConversions", {data: props.data, markMaps: props.markMaps, csv: true})}>
                Export CSV
              </button>
              <button onClick={()=>Dispatcher.emit("DoConversions", {data: props.data, markMaps: props.markMaps, pdf: true})}>
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
                      <button onClick={()=>Dispatcher.emit("GenerateIndividualReport", {
                        student: props.students[i-1],
                        summary: props.summary[i-1],
                        markMaps: props.markMaps
                      })}>
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
