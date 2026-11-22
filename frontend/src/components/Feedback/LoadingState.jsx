function LoadingState({ message = "Cargando..." }) {
  return (
    <p className="muted loading-state" role="status">
      {message}
    </p>
  );
}

export default LoadingState;
