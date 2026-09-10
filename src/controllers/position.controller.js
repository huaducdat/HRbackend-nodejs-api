const mongoose = require("mongoose");

const Employee = require("../models/Employee");
const Position = require("../models/Position");

async function getPositions(req, res, next) {
  try {
    const positions = await Position.find().sort({
      createdAt: -1
    });

    res.json({
      message: "Lấy danh sách chức vụ thành công",
      data: positions
    });
  } catch (error) {
    next(error);
  }
}

async function getPositionById(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "ID chức vụ không hợp lệ"
      });
    }

    const position = await Position.findById(req.params.id);

    if (!position) {
      return res.status(404).json({
        message: "Không tìm thấy chức vụ"
      });
    }

    res.json({
      message: "Lấy chi tiết chức vụ thành công",
      data: position
    });
  } catch (error) {
    next(error);
  }
}

async function createPosition(req, res, next) {
  try {
    const { name, code, description, baseSalary, status } = req.body;

    const existingPosition = await Position.findOne({
      code: code?.toUpperCase()
    });

    if (existingPosition) {
      return res.status(409).json({
        message: "Mã chức vụ đã tồn tại"
      });
    }

    const position = await Position.create({
      name,
      code,
      description,
      baseSalary,
      status
    });

    res.status(201).json({
      message: "Thêm chức vụ thành công",
      data: position
    });
  } catch (error) {
    next(error);
  }
}

async function updatePosition(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "ID chức vụ không hợp lệ"
      });
    }

    const position = await Position.findById(req.params.id);

    if (!position) {
      return res.status(404).json({
        message: "Không tìm thấy chức vụ"
      });
    }

    if (req.body.code) {
      const duplicateCode = await Position.findOne({
        code: req.body.code.toUpperCase(),
        _id: { $ne: req.params.id }
      });

      if (duplicateCode) {
        return res.status(409).json({
          message: "Mã chức vụ đã tồn tại"
        });
      }
    }

    const allowedFields = [
      "name",
      "code",
      "description",
      "baseSalary",
      "status"
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        position[field] = req.body[field];
      }
    }

    await position.save();

    res.json({
      message: "Cập nhật chức vụ thành công",
      data: position
    });
  } catch (error) {
    next(error);
  }
}

async function deletePosition(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "ID chức vụ không hợp lệ"
      });
    }

    const position = await Position.findById(req.params.id);

    if (!position) {
      return res.status(404).json({
        message: "Không tìm thấy chức vụ"
      });
    }

    const activeEmployeeCount = await Employee.countDocuments({
      positionId: req.params.id,
      status: { $in: ["probation", "active"] }
    });

    if (activeEmployeeCount > 0) {
      return res.status(409).json({
        message: "Không thể xóa mềm chức vụ đang được nhân viên sử dụng"
      });
    }

    position.status = "inactive";
    await position.save();

    res.json({
      message: "Xóa mềm chức vụ thành công",
      data: position
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPositions,
  getPositionById,
  createPosition,
  updatePosition,
  deletePosition
};
