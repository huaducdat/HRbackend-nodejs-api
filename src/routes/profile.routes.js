const express = require("express");

const {
  getProfile,
  updateProfile,
  changePassword
} = require("../controllers/profile.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

const router = express.Router();

router.use(authMiddleware);
router.use(allowRoles("admin", "hr", "staff"));

router.get("/", getProfile);
router.put("/", updateProfile);
router.patch("/change-password", changePassword);

module.exports = router;