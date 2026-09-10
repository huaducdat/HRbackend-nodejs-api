const express = require("express");

const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require("../controllers/department.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  allowRoles("admin", "hr", "staff"),
  getDepartments
);

router.get(
  "/:id",
  allowRoles("admin", "hr", "staff"),
  getDepartmentById
);

router.post(
  "/",
  allowRoles("admin", "hr"),
  createDepartment
);

router.put(
  "/:id",
  allowRoles("admin", "hr"),
  updateDepartment
);

router.delete(
  "/:id",
  allowRoles("admin"),
  deleteDepartment
);

module.exports = router;