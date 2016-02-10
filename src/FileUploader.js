class FileUploader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {over: false};
    this.dragEvent = this.dragEvent.bind(this);
    this.dragLeaveEvent = this.dragLeaveEvent.bind(this);
    this.loadFile = this.loadFile.bind(this);
  }
  componentDidMount() {
    this.element = ReactDOM.findDOMNode(this);
    this.element.addEventListener("dragenter", this.dragEvent);
    this.element.addEventListener("dragover", this.dragEvent);
    this.element.addEventListener("drop", this.dragEvent);
    this.element.addEventListener("dragleave", this.dragLeaveEvent);
    this.element.querySelector('.file_input').addEventListener("change", this.loadFile);
  }
  componentWillUnmount() {
    this.element = ReactDOM.findDOMNode(this);
    this.element.removeEventListener("dragenter", this.dragEvent);
    this.element.removeEventListener("dragover", this.dragEvent);
    this.element.removeEventListener("drop", this.dragEvent);
    this.element.removeEventListener("dragleave", this.dragLeaveEvent);
    this.element.querySelector('.file_input').removeEventListener("change", this.loadFile);
  }
  dragEvent(event) {
    event.stopPropagation();
    event.preventDefault();

    //If a file has been dropped and it is a CSV file, read the file
    if (event.type == "drop") {
      this.setState({over:false});
      if (event.dataTransfer.files[0].name.indexOf(".csv") != -1) {
        Dispatcher.emit('received_file', {filename: event.dataTransfer.files[0].path});
      } else {
        Dispatcher.emit('error', {message: 'Only upload .csv files, please!'});
      }
    } else {
      this.setState({over:true});
    }
  }
  loadFile() {
    let files = event.target.files;
    if (files.length > 0) {
      if (files[0].name.indexOf(".csv") != -1) {
        Dispatcher.emit('received_file', {filename: files[0].path});
      } else {
        Dispatcher.emit('error', {message: 'Only upload .csv files, please!'});
      }
    }
  }
  dragLeaveEvent(event) {
    this.setState({over:false});
  }
  render() {
    return(
      <div className='start'>
        <div className={`drop_target ${this.state.over ? 'over' : ''}`}>
          <span>
            'Drag and drop a .csv file here or click here to browse for one'
          </span>
          <form id='file_form'>
            <input type='file' accept='.csv' className='file_input' />
          </form>
        </div>
      </div>
    );
  }
}
