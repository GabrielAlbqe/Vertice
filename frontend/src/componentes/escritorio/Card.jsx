function Card({
  title,
  value,
  description,
  onClick,
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

  const Elemento = onClick ? "button" : "div";
  return (
    <Elemento className={`card${onClick ? " card-interactive" : ""}`} {...(onClick ? { type: "button", onClick, "aria-label": `${title}: ${textoValor}. Abrir detalhes` } : {})}>

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

    </Elemento>
  );
}

export default Card;
