function Table({
  columns = [],
  data = [],
}) {
  function obterKey(
    item,
    index
  ) {
    return (
      item?.id_obra ??
      item?.id_equipe ??
      item?.id_usuario ??
      item?.id_insumo ??
      item?.id_maquinario ??
      item?.id ??
      `linha-${index}`
    );
  }

  return (
    <div className="table-container">

      <table className="table">

        <thead>
          <tr>
            {columns.map(
              (column) => (
                <th
                  key={
                    `coluna-${column.key}`
                  }
                >
                  {column.label}
                </th>
              )
            )}
          </tr>
        </thead>

        <tbody>

          {data.map(
            (item, index) => (

              <tr
                key={
                  `linha-${obterKey(
                    item,
                    index
                  )}`
                }
              >

                {columns.map(
                  (column) => (

                    <td
                      key={
                        `${obterKey(
                          item,
                          index
                        )}-${column.key}`
                      }
                    >
                      {item[
                        column.key
                      ]}
                    </td>

                  )
                )}

              </tr>

            )
          )}

        </tbody>

      </table>

    </div>
  );
}

export default Table;