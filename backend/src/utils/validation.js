function positiveInt(value, field, { max } = {}) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    const error = new Error(`${field} must be a positive integer`);
    error.status = 400;
    throw error;
  }
  if (max && number > max) {
    const error = new Error(`${field} must be ${max} or less`);
    error.status = 400;
    throw error;
  }
  return number;
}

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    const error = new Error(`${field} must be a number`);
    error.status = 400;
    throw error;
  }
  return number;
}

function sendError(res, err) {
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Server error' });
}

module.exports = { positiveInt, finiteNumber, sendError };
