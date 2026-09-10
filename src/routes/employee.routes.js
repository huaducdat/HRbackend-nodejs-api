const express = require("express");

const {
  getEmployees,
  getEmployeeById,
  getMyEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require("../controllers/employee.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  allowRoles("admin", "hr", "staff"),
  getEmployees
);

router.get(
  "/me",
  allowRoles("admin", "hr", "staff"),
  getMyEmployee
);

router.get(
  "/:id",
  allowRoles("admin", "hr", "staff"),
  getEmployeeById
);

router.post(
  "/",
  allowRoles("admin", "hr"),
  createEmployee
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
