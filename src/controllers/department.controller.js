const mongoose = require("mongoose");
const Department = require("../models/Department");
const Employee = require("../models/Employee");

async function getDepartments(req, res, next) {
  try {
    const departments = await Department.find().sort({
      createdAt: -1
    });

    res.json({
      message: "Lấy danh sách phòng ban thành công",
      data: departments
    });
  } catch (error) {
    next(error);
  }
}

async function getDepartmentById(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "ID phòng ban không hợp lệ"
      });
    }

    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: "Không tìm thấy phòng ban"
      });
    }

    res.json({
      message: "Lấy chi tiết phòng ban thành công",
      data: department
    });
  } catch (error) {
    next(error);
  }
}

async function createDepartment(req, res, next) {
  try {
    const { name, code, description, status } = req.body;

    const existingDepartment = await Department.findOne({
      code: code?.toUpperCase()
    });

    if (existingDepartment) {
      return res.status(409).json({
        message: "Mã phòng ban đã tồn tại"
      });
    }

    const department = await Department.create({
      name,
      code,
      description,
      status
    });

    res.status(201).json({
      message: "Thêm phòng ban thành công",
      data: department
    });
  } catch (error) {
    next(error);
  }
}

async function updateDepartment(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "ID phòng ban không hợp lệ"
      });
    }

    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: "Không tìm thấy phòng ban"
      });
    }

    if (req.body.code) {
      const duplicateCode = await Department.findOne({
        code: req.body.code.toUpperCase(),
        _id: { $ne: req.params.id }
      });

      if (duplicateCode) {
        return res.status(409).json({
          message: "Mã phòng ban đã tồn tại"
        });
      }
    }

    const allowedFields = [
      "name",
      "code",
      "description",
      "status"
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        department[field] = req.body[field];
      }
    }

    await department.save();

    res.json({
      message: "Cập nhật phòng ban thành công",
      data: department
    });
  } catch (error) {
    next(error);
  }
}

async function deleteDepartment(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "ID phòng ban không hợp lệ"
      });
    }

    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: "Không tìm thấy phòng ban"
      });
    }

    const activeEmployeeCount = await Employee.countDocuments({
      departmentId: req.params.id,
      status: "active"
    });

    if (activeEmployeeCount > 0) {
      return res.status(409).json({
        message: "Không thể xóa mềm phòng ban còn nhân viên active"
      });
    }

    department.status = "inactive";
    await department.save();

    res.json({
      message: "Xóa mềm phòng ban thành công",
      data: department
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
