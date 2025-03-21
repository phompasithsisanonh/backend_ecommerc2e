module.exports.response = (res, status, data) => {
  return res.status(status).json({
    message: data.message,
    data: data,
  });
};
