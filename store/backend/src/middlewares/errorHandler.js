function errorHandler(err, req, res, _next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Formato JSON inválido' });
  }

  if (err.statusCode && err.statusCode < 500) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  return res.status(500).json({ message: 'Error interno del servidor' });
}

module.exports = errorHandler;