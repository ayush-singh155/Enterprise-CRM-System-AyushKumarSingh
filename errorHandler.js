export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Internal server error';
  if (error.code === 11000) {
    statusCode = 409;
    message = 'A record with that value already exists';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid record identifier';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
  }

  if (statusCode >= 500) {
    console.error(error);
    if (process.env.NODE_ENV === 'production') message = 'Internal server error';
  }
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: error.stack } : {})
  });
}
