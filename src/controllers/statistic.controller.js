
const Employee = require("../models/Employee");
const Department = require("../models/Department");
const Position = require("../models/Position");

async function getOverview(req, res, next) {
  try {
    const [
      totalEmployees,
      activeEmployees,
      probationEmployees,
      resignedEmployees,
      totalDepartments,
      totalPositions
    ] = await Promise.all([
      // Không tính nhân viên đã xóa mềm
      Employee.countDocuments({
        status: { $ne: "inactive" }
      }),

      Employee.countDocuments({
        status: "active"
      }),

      Employee.countDocuments({
        status: "probation"
      }),

      Employee.countDocuments({
        status: "resigned"
      }),

      Department.countDocuments({
        status: "active"
      }),

      Position.countDocuments({
        status: "active"
      })
    ]);

    res.json({
      message: "Lấy thống kê tổng quan thành công",
      data: {
        totalEmployees,
        activeEmployees,
        probationEmployees,
        resignedEmployees,
        totalDepartments,
        totalPositions
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getDepartmentStatistics(req, res, next) {
  try {
    const data = await Employee.aggregate([
      {
        $match: {
          status: { $ne: "inactive" }
        }
      },
      {
        $group: {
          _id: "$departmentId",
          employeeCount: { $sum: 1 },
          totalSalary: { $sum: "$salary" }
        }
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "department"
        }
      },
      {
        $unwind: "$department"
      },
      {
        $match: {
          "department.status": "active"
        }
      },
      {
        $project: {
          _id: 0,
          departmentId: "$department._id",
          name: "$department.name",
          code: "$department.code",
          employeeCount: 1,
          totalSalary: 1
        }
      },
      {
        $sort: {
          employeeCount: -1,
          name: 1
        }
      }
    ]);

    res.json({
      message: "Lấy thống kê nhân viên theo phòng ban thành công",
      data
    });
  } catch (error) {
    next(error);
  }
}

async function getPositionStatistics(req, res, next) {
  try {
    const data = await Employee.aggregate([
      {
        $match: {
          status: { $ne: "inactive" }
        }
      },
      {
        $group: {
          _id: "$positionId",
          employeeCount: { $sum: 1 },
          totalSalary: { $sum: "$salary" }
        }
      },
      {
        $lookup: {
          from: "positions",
          localField: "_id",
          foreignField: "_id",
          as: "position"
        }
      },
      {
        $unwind: "$position"
      },
      {
        $match: {
          "position.status": "active"
        }
      },
      {
        $project: {
          _id: 0,
          positionId: "$position._id",
          name: "$position.name",
          code: "$position.code",
          employeeCount: 1,
          totalSalary: 1
        }
      },
      {
        $sort: {
          employeeCount: -1,
          name: 1
        }
      }
    ]);

    res.json({
      message: "Lấy thống kê nhân viên theo chức vụ thành công",
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOverview,
  getDepartmentStatistics,
  getPositionStatistics
};