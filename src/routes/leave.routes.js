const express = require("express");

const {
  createLeave,
  getLeaves,
  getMyLeaves,
  getLeaveById,
  approveLeave,
  rejectLeave
} = require("../controllers/leave.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  allowRoles("admin", "hr", "staff"),
  createLeave
);

router.get(
  "/me",
  allowRoles("admin", "hr", "staff"),
  getMyLeaves
);

router.get(
  "/",
  allowRoles("admin", "hr"),
  getLeaves
);

router.patch(
  "/:id/approve",
  allowRoles("admin", "hr"),
  approveLeave
);

router.patch(
  "/:id/reject",
  allowRoles("admin", "hr"),
  rejectLeave
);

router.get(
  "/:id",
  allowRoles("admin", "hr", "staff"),
  getLeaveById
);

module.exports = router;