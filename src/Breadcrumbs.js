function Breadcrumbs(props) {
  return(
    <nav>
      {props.path.length ? (
        [<a className='back' onClick={()=>Dispatcher.emit('reset')}>
          Back
        </a>,
        <h1>
          {props.path[props.path.length-1]}
        </h1>]
      ) : (
        <h1>
          <a onClick={()=>Dispatcher.emit('reset')}>
            {props.title}
          </a>
        </h1>
      )}
    </nav>
  );
}
