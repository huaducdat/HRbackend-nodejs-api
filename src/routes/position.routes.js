const express = require("express");

const {
  getPositions,
  getPositionById,
  createPosition,
  updatePosition,
  deletePosition
} = require("../controllers/position.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  allowRoles("admin", "hr", "staff"),
  getPositions
);

router.get(
  "/:id",
  allowRoles("admin", "hr", "staff"),
  getPositionById
);

router.post(
  "/",
  allowRoles("admin", "hr"),
  createPosition
);

router.put(
  "/:id",
  allowRoles("admin", "hr"),
  updatePosition
);

router.delete(
  "/:id",
  allowRoles("admin"),
  deletePosition
);

module.exports = router;
