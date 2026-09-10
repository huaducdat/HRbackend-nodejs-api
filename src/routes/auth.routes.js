const express = require("express");

const {
  register,
  login,
  getMe
} = require("../controllers/auth.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// Hai route này là public
router.post("/register", register);
router.post("/login", login);

// Chỉ /me mới cần đăng nhập
router.get("/me", authMiddleware, getMe);

module.exports = router;