function SuccessNotice({ message }) {
  if (!message) return null;
  return (
    <div className="notice success" role="status">
      {message}
    </div>
  );
}

export default SuccessNotice;
