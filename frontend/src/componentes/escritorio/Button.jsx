function Button({ children, type = "primary", onClick }) {
  return (
    <button
      className={`button button-${type}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;