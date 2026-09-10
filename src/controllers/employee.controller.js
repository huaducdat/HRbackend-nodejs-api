const mongoose = require("mongoose");

const Employee = require("../models/Employee");
const Department = require("../models/Department");
const Position = require("../models/Position");

async function validateReferences({
  departmentId,
  positionId,
  managerId,
  employeeId
}) {
  if (departmentId) {
    if (!mongoose.isValidObjectId(departmentId)) {
      return "ID phòng ban không hợp lệ";
    }

    const department = await Department.findById(departmentId);

    if (!department || department.status !== "active") {
      return "Phòng ban không tồn tại hoặc đã ngừng hoạt động";
    }
  }

  if (positionId) {
    if (!mongoose.isValidObjectId(positionId)) {
      return "ID chức vụ không hợp lệ";
    }

    const position = await Position.findById(positionId);

    if (!position || position.status !== "active") {
      return "Chức vụ không tồn tại hoặc đã ngừng hoạt động";
    }
  }

  if (managerId) {
    if (!mongoose.isValidObjectId(managerId)) {
      return "ID quản lý không hợp lệ";
    }

    if (employeeId && managerId.toString() === employeeId.toString()) {
      return "Nhân viên không thể tự quản lý chính mình";
    }

    const manager = await Employee.findById(managerId);

    if (!manager || manager.status === "inactive") {
      return "Quản lý không tồn tại hoặc đã ngừng hoạt động";
    }
  }

  return null;
}

async function getEmployees(req, res, next) {
  try {
    let {
      page = 1,
      limit = 10,
      keyword,
      departmentId,
      positionId,
      status,
      gender,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    page = Math.max(Number.parseInt(page, 10) || 1, 1);
    limit = Math.min(
      Math.max(Number.parseInt(limit, 10) || 10, 1),
      100
    );

    const filter = {};

    if (keyword) {
      const safeKeyword = keyword.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { employeeCode: { $regex: safeKeyword, $options: "i" } },
        { fullName: { $regex: safeKeyword, $options: "i" } },
        { email: { $regex: safeKeyword, $options: "i" } },
        { phone: { $regex: safeKeyword, $options: "i" } }
      ];
    }

    if (departmentId) {
      if (!mongoose.isValidObjectId(departmentId)) {
        return res.status(400).json({
          message: "ID phòng ban không hợp lệ"
        });
      }

      filter.departmentId = departmentId;
    }

    if (positionId) {
      if (!mongoose.isValidObjectId(positionId)) {
        return res.status(400).json({
          message: "ID chức vụ không hợp lệ"
        });
      }

      filter.positionId = positionId;
    }

    if (status) {
      const allowedStatuses = [
        "probation",
        "active",
        "inactive",
        "resigned"
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Trạng thái không hợp lệ"
        });
      }

      filter.status = status;
    }

    if (gender) {
      const allowedGenders = ["male", "female", "other"];

      if (!allowedGenders.includes(gender)) {
        return res.status(400).json({
          message: "Giới tính không hợp lệ"
        });
      }

      filter.gender = gender;
    }

    const allowedSortFields = [
      "fullName",
      "salary",
      "startDate",
      "createdAt"
    ];

    if (!allowedSortFields.includes(sortBy)) {
      sortBy = "createdAt";
    }

    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;

    const [employees, totalItems] = await Promise.all([
      Employee.find(filter)
        .populate("departmentId", "name code status")
        .populate("positionId", "name code baseSalary status")
        .populate("managerId", "employeeCode fullName email")
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit),

      Employee.countDocuments(filter)
    ]);

    res.json({
      message: "Lấy danh sách nhân viên thành công",
      data: employees,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getEmployeeById(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "ID nhân viên không hợp lệ"
      });
    }

    const employee = await Employee.findById(req.params.id)
      .populate("departmentId", "name code description status")
      .populate("positionId", "name code description baseSalary status")
      .populate("managerId", "employeeCode fullName email phone");

    if (!employee) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên"
      });
    }

    res.json({
      message: "Lấy chi tiết nhân viên thành công",
      data: employee
    });
  } catch (error) {
    next(error);
  }
}

async function getMyEmployee(req, res, next) {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({
        message: "Tài khoản chưa được liên kết với nhân viên"
      });
    }

    const employee = await Employee.findById(req.user.employeeId)
      .populate("departmentId", "name code description status")
      .populate("positionId", "name code description baseSalary status")
      .populate("managerId", "employeeCode fullName email phone");

    if (!employee) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên"
      });
    }

    res.json({
      message: "Lấy thông tin nhân viên cá nhân thành công",
      data: employee
    });
  } catch (error) {
    next(error);
  }
}

async function createEmployee(req, res, next) {
  try {
    const {
      employeeCode,
      fullName,
      email,
      phone,
      gender,
      dateOfBirth,
      address,
      departmentId,
      positionId,
      managerId,
      salary,
      startDate,
      status
    } = req.body;

    const duplicate = await Employee.findOne({
      $or: [
        { employeeCode: employeeCode?.toUpperCase() },
        { email: email?.toLowerCase() }
      ]
    });

    if (duplicate) {
      return res.status(409).json({
        message:
          duplicate.employeeCode === employeeCode?.toUpperCase()
            ? "Mã nhân viên đã tồn tại"
            : "Email nhân viên đã tồn tại"
      });
    }

    const referenceError = await validateReferences({
      departmentId,
      positionId,
      managerId
    });

    if (referenceError) {
      return res.status(400).json({
        message: referenceError
      });
    }

    const employee = await Employee.create({
      employeeCode,
      fullName,
      email,
      phone,
      gender,
      dateOfBirth,
      address,
      departmentId,
      positionId,
      managerId: managerId || null,
      salary,
      startDate,
      status
    });

    const populatedEmployee = await Employee.findById(employee._id)
      .populate("departmentId", "name code")
      .populate("positionId", "name code")
      .populate("managerId", "employeeCode fullName");

    res.status(201).json({
      message: "Thêm nhân viên thành công",
      data: populatedEmployee
    });
  } catch (error) {
    next(error);
  }
}

async function updateEmployee(req, res, next) {
  try {
    const employeeId = req.params.id;

    if (!mongoose.isValidObjectId(employeeId)) {
      return res.status(400).json({
        message: "ID nhân viên không hợp lệ"
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên"
      });
    }

    if (req.body.employeeCode) {
      const existingCode = await Employee.findOne({
        employeeCode: req.body.employeeCode.toUpperCase(),
        _id: { $ne: employeeId }
      });

      if (existingCode) {
        return res.status(409).json({
          message: "Mã nhân viên đã tồn tại"
        });
      }
    }

    if (req.body.email) {
      const existingEmail = await Employee.findOne({
        email: req.body.email.toLowerCase(),
        _id: { $ne: employeeId }
      });

      if (existingEmail) {
        return res.status(409).json({
          message: "Email nhân viên đã tồn tại"
        });
      }
    }

    const referenceError = await validateReferences({
      departmentId: req.body.departmentId,
      positionId: req.body.positionId,
      managerId: req.body.managerId,
      employeeId
    });

    if (referenceError) {
      return res.status(400).json({
        message: referenceError
      });
    }

    const allowedFields = [
      "employeeCode",
      "fullName",
      "email",
      "phone",
      "gender",
      "dateOfBirth",
      "address",
      "departmentId",
      "positionId",
      "managerId",
      "salary",
      "startDate",
      "status"
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        employee[field] = req.body[field];
      }
    }

    await employee.save();

    const updatedEmployee = await Employee.findById(employee._id)
      .populate("departmentId", "name code")
      .populate("positionId", "name code")
      .populate("managerId", "employeeCode fullName");

    res.json({
      message: "Cập nhật nhân viên thành công",
      data: updatedEmployee
    });
  } catch (error) {
    next(error);
  }
}

async function deleteEmployee(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "ID nhân viên không hợp lệ"
      });
    }

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên"
      });
    }

    employee.status = "inactive";
    await employee.save();

    res.json({
      message: "Xóa mềm nhân viên thành công",
      data: employee
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEmployees,
  getEmployeeById,
  getMyEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
