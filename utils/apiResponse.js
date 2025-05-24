// utils/apiResponse.js

function success(res, message, code, data = {}) {
  return res.status(code).json({ message, data });
}

function error(res, message, code = 400) {
  return res.status(code).json({ message });
}

module.exports = {
  success,
  error,
};
