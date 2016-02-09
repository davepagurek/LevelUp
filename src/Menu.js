function Menu(props) {
  return(
    <section className='menu'>
      {props.children}
    </section>
  );
}

function MenuItem(props) {
  return(
    <a onClick={()=>Dispatcher.emit('mode_set', {mode: props.mode})}>
      <h2>{props.title}</h2>
      <h3>{props.children}</h3>
    </a>
  );
}
