/**
 * Create an error with status code and message
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {Error} Error object with status code and message
 */
const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = statusCode >= 500 ? 'error' : 'fail';
  error.isOperational = true;
  return error;
};

/**
 * Wraps an async function to catch errors and pass them to error handling middleware
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function that catches errors
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      error: {
        statusCode: err.statusCode,
        status: err.status,
        message: err.message,
        stack: err.stack
      }
    });
  } else {
    res.status(err.statusCode).json({
      success: false,
      error: {
        statusCode: err.statusCode,
        message: err.isOperational ? err.message : 'Something went wrong!'
      }
    });
  }
};

/**
 * Not found error handler middleware
 */
const notFoundHandler = (req, res, next) => {
  const err = createError(404, `Can't find ${req.originalUrl} on this server!`);
  next(err);
};

module.exports = {
  createError,
  catchAsync,
  errorHandler,
  notFoundHandler
};