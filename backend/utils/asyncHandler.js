// Wrap an async route so any thrown / rejected error flows into next()
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);