// Simple, dependency-free validator: returns 400 with first failure.
export const validate = (schema) => (req, res, next) => {
  const { value, error } = schema.validate(req.body, { abortEarly: true });
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  req.body = value;
  next();
};