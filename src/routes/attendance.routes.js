const express = require("express");

const {
  checkIn,
  checkOut,
  getAttendances,
  getMyAttendances,
  getAttendanceByEmployee
} = require("../controllers/attendance.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/check-in",
  allowRoles("admin", "hr", "staff"),
  checkIn
);

router.post(
  "/check-out",
  allowRoles("admin", "hr", "staff"),
  checkOut
);

// /me phải đặt trước /employee/:employeeId
router.get(
  "/me",
  allowRoles("admin", "hr", "staff"),
  getMyAttendances
);

router.get(
  "/employee/:employeeId",
  allowRoles("admin", "hr"),
  getAttendanceByEmployee
);

router.get(
  "/",
  allowRoles("admin", "hr"),
  getAttendances
);

module.exports = router;