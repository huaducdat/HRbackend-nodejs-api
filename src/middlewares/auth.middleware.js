const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Bạn chưa cung cấp token"
      });
    }

    const token = authorization.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user || user.status !== "active") {
      return res.status(401).json({
        message: "Tài khoản không tồn tại hoặc đã bị khóa"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token không hợp lệ hoặc đã hết hạn"
    });
  }
}

module.exports = authMiddleware;