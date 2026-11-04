module.exports = async function executeSql(connection, sql) {
  let delimiter = ";", buffer = "";
  for (const line of sql.split(/\r?\n/)) {
    const directive = line.match(/^\s*DELIMITER\s+(\S+)\s*$/i);
    if (directive) { delimiter = directive[1]; continue; }
    buffer += line + "\n";
    if (buffer.trimEnd().endsWith(delimiter)) {
      const statement = buffer.trimEnd().slice(0, -delimiter.length).trim();
      if (statement) await connection.query(statement);
      buffer = "";
    }
  }
  if (buffer.replace(/--[^\n]*/g, "").trim()) await connection.query(buffer);
};
