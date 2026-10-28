const attempts = new Map();
module.exports = (req, res, next) => {
  if (req.method !== 'POST') return next();
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  const key = req.ip;
  const item = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
  attempts.set(key, item);
  if (++item.count > 30) {
    res.set('Retry-After', String(Math.ceil((item.until - now) / 1000)));
    return res.status(429).json({ message: 'Muitas tentativas. Aguarde e tente novamente.' });
  }
  next();
};
