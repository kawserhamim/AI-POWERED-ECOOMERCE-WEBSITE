export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || "Internal Server Error";
  let details;

  // Mongoose validation
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
  }
  // Cast errors (bad ObjectId, bad number, etc.)
  else if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for field '${err.path}'`;
  }
  // Duplicate key (unique index)
  else if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value for '${field}'`;
  }
  // JWT errors
  else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Invalid or expired token";
  }

  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    details = { stack: err.stack };
  }

  console.error(`[Error] ${req.method} ${req.originalUrl} -> ${statusCode}: ${message}`);
  if (!isProd) console.error(err.stack);

  res.status(statusCode).json({ message, ...(details && { error: details }) });
};
