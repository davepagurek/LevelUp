function Breadcrumbs(props) {
  return(
    <nav>
      <h1>
        <a onClick={()=>Dispatcher.emit('reset')}>
          {props.title}
        </a>
      </h1>
      {props.path.map((mode, i) => {
        return(
          <a onClick={()=>Dispatcher.emit('back', {amount: i})}>
            {mode}
          </a>
        );
      })}
    </nav>
  );
}
