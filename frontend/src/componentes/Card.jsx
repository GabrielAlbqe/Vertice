function Card({ title, value, description }) {
  return (
    <div className="card">
      <h3>{title}</h3>

      <div className="card-value">
        {value}
      </div>

      {description && (
        <p>{description}</p>
      )}
    </div>
  );
}

export default Card;