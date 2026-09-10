function errorMiddleware(error, req, res, next) {
  console.error(error);

  if (error.statusCode === 404) {
    return res.status(404).json({
      message: error.message || "Route not found"
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0];

    return res.status(409).json({
      message: `${field || "Dữ liệu"} đã tồn tại`
    });
  }

  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map(
      (item) => item.message
    );

    return res.status(400).json({
      message: "Dữ liệu không hợp lệ",
      errors
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      message: "ID hoặc dữ liệu không hợp lệ"
    });
  }

  res.status(error.statusCode || 500).json({
    message: error.message || "Lỗi máy chủ"
  });
}

module.exports = errorMiddleware;
