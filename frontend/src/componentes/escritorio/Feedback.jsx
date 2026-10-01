function Feedback({ type, message }) {
  return (
    <div className={`feedback feedback-${type}`}>
      {message}
    </div>
  );
}

export default Feedback;