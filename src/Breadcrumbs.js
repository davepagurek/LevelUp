function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function Breadcrumbs(props) {
  return(
    <nav>
      {props.path.length ? (
        [<a className='back' onClick={()=>Dispatcher.emit('reset')}>
          &times;
        </a>,
        <h1>
          {capitalizeFirstLetter(props.path[props.path.length-1])}
        </h1>,
        <div className='placeholder'></div>]
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
