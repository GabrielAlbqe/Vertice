module.exports = (req, res, next) => {
  const send = res.send.bind(res);
  res.send = function(body) {
    if (typeof body === 'string' && !res.getHeader('Content-Type')) return res.json({ message: body });
    return send(body);
  };
  const json = res.json.bind(res);
  res.json = function(body) {
    if (res.statusCode >= 400) {
      const message = res.statusCode >= 500 ? 'Erro ao processar requisição.' :
        (body && (body.message || body.error)) || 'Requisi??o inválida.';
      return json({ message: typeof message === 'string' ? message : 'Requisi??o inválida.' });
    }
    return json(body);
  };
  next();
};
