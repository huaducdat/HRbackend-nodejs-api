const express = require("express");

const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeBirthdays,
  getProbationEnding,
  exportEmployees
} = require("../controllers/employee.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

const router = express.Router();

router.use(authMiddleware);

// Route cụ thể phải đặt trước /:id
router.get(
  "/birthdays",
  allowRoles("admin", "hr"),
  getEmployeeBirthdays
);

router.get(
  "/probation-ending",
  allowRoles("admin", "hr"),
  getProbationEnding
);

router.get(
  "/export",
  allowRoles("admin", "hr"),
  exportEmployees
);

router.get(
  "/",
  allowRoles("admin", "hr", "staff"),
  getEmployees
);

router.post(
  "/",
  allowRoles("admin", "hr"),
  createEmployee
);

router.get(
  "/:id",
  allowRoles("admin", "hr", "staff"),
  getEmployeeById
);

router.put(
  "/:id",
  allowRoles("admin", "hr"),
  updateEmployee
);

router.delete(
  "/:id",
  allowRoles("admin"),
  deleteEmployee
);

module.exports = router;