/**
 * Standard API Response Utilities
 */

export const success = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const error = (res, message = "Error", statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

export const created = (res, data, message = "Resource created successfully") => {
  return success(res, data, message, 201);
};

export const badRequest = (res, message = "Bad request", errors = null) => {
  return error(res, message, 400, errors);
};

export const unauthorized = (res, message = "Unauthorized") => {
  return error(res, message, 401);
};

export const forbidden = (res, message = "Access denied") => {
  return error(res, message, 403);
};

export const notFound = (res, message = "Resource not found") => {
  return error(res, message, 404);
};
