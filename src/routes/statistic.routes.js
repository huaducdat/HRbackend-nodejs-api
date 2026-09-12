const express = require("express");

const {
  getOverview,
  getDepartmentStatistics,
  getPositionStatistics
} = require("../controllers/statistic.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const allowRoles = require("../middlewares/role.middleware");

const router = express.Router();

router.use(authMiddleware);
router.use(allowRoles("admin", "hr"));

router.get("/overview", getOverview);
router.get("/departments", getDepartmentStatistics);
router.get("/positions", getPositionStatistics);

module.exports = router;