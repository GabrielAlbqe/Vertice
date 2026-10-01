function Card({
  title,
  value,
  description,
}) {
  const textoValor =
    String(
      value ?? ""
    );

  let classeValor =
    "card-value";

  if (
    textoValor.length >= 18
  ) {
    classeValor +=
      " card-value--muito-longo";
  } else if (
    textoValor.length >= 13
  ) {
    classeValor +=
      " card-value--longo";
  }

  return (
    <div className="card">

      <h3>
        {title}
      </h3>

      <div
        className={
          classeValor
        }
        title={
          textoValor
        }
      >
        {value}
      </div>

      {description && (
        <p>
          {description}
        </p>
      )}

    </div>
  );
}

export default Card;
