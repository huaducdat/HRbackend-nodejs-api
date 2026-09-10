const User = require("../models/User");
const generateToken = require("../utils/generateToken");

async function register(req, res, next) {
  try {
    const { fullName, email, password } = req.body;

    const existingUser = await User.findOne({
      email: email?.toLowerCase()
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email đã được sử dụng"
      });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role: "staff",
      status: "active"
    });

    res.status(201).json({
      message: "Đăng ký tài khoản thành công",
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Vui lòng nhập email và mật khẩu"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không chính xác"
      });
    }

    const passwordCorrect = await user.comparePassword(password);

    if (!passwordCorrect) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không chính xác"
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa"
      });
    }

    const token = generateToken(user);

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res) {
  res.json({
    message: "Lấy thông tin tài khoản thành công",
    data: req.user
  });
}

module.exports = {
  register,
  login,
  getMe
};