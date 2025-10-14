const errorHandler = (err, req, res, next) => {
  // لو مفيش status code ندي 500
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message || 'Something went wrong!',
  });
};

module.exports = errorHandler;
