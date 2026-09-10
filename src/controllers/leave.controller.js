const mongoose = require("mongoose");

const Leave = require("../models/Leave");
const Employee = require("../models/Employee");

async function createLeave(req, res, next) {
  try {
    const {
      employeeId: bodyEmployeeId,
      leaveType,
      startDate,
      endDate,
      reason
    } = req.body;

    const employeeId =
      req.user.role === "staff"
        ? req.user.employeeId
        : bodyEmployeeId || req.user.employeeId;

    if (!employeeId) {
      return res.status(400).json({
        message: "Tài khoản chưa được liên kết với nhân viên"
      });
    }

    if (!mongoose.isValidObjectId(employeeId)) {
      return res.status(400).json({
        message: "ID nhân viên không hợp lệ"
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee || employee.status === "inactive") {
      return res.status(404).json({
        message: "Nhân viên không tồn tại hoặc đã ngừng hoạt động"
      });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (
      Number.isNaN(parsedStartDate.getTime()) ||
      Number.isNaN(parsedEndDate.getTime())
    ) {
      return res.status(400).json({
        message: "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ"
      });
    }

    if (parsedStartDate > parsedEndDate) {
      return res.status(400).json({
        message:
          "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc"
      });
    }

    const leave = await Leave.create({
      employeeId,
      leaveType,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      reason,
      status: "pending"
    });

    res.status(201).json({
      message: "Gửi đơn nghỉ phép thành công",
      data: leave
    });
  } catch (error) {
    next(error);
  }
}

async function getLeaves(req, res, next) {
  try {
    let {
      employeeId,
      status,
      leaveType,
      page = 1,
      limit = 10
    } = req.query;

    page = Math.max(Number.parseInt(page, 10) || 1, 1);
    limit = Math.min(
      Math.max(Number.parseInt(limit, 10) || 10, 1),
      100
    );

    const filter = {};

    if (employeeId) {
      if (!mongoose.isValidObjectId(employeeId)) {
        return res.status(400).json({
          message: "ID nhân viên không hợp lệ"
        });
      }

      filter.employeeId = employeeId;
    }

    if (status) {
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({
          message: "Trạng thái đơn nghỉ không hợp lệ"
        });
      }

      filter.status = status;
    }

    if (leaveType) {
      if (!["annual", "sick", "unpaid"].includes(leaveType)) {
        return res.status(400).json({
          message: "Loại nghỉ phép không hợp lệ"
        });
      }

      filter.leaveType = leaveType;
    }

    const skip = (page - 1) * limit;

    const [leaves, totalItems] = await Promise.all([
      Leave.find(filter)
        .populate(
          "employeeId",
          "employeeCode fullName email departmentId positionId"
        )
        .populate("processedBy", "fullName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Leave.countDocuments(filter)
    ]);

    res.json({
      message: "Lấy danh sách nghỉ phép thành công",
      data: leaves,
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

async function getMyLeaves(req, res, next) {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({
        message: "Tài khoản chưa được liên kết với nhân viên"
      });
    }

    const leaves = await Leave.find({
      employeeId: req.user.employeeId
    })
      .populate("employeeId", "employeeCode fullName email")
      .populate("processedBy", "fullName email role")
      .sort({ createdAt: -1 });

    res.json({
      message: "Lấy đơn nghỉ cá nhân thành công",
      data: leaves
    });
  } catch (error) {
    next(error);
  }
}

async function getLeaveById(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "ID đơn nghỉ không hợp lệ"
      });
    }

    const leave = await Leave.findById(req.params.id)
      .populate("employeeId", "employeeCode fullName email")
      .populate("processedBy", "fullName email role");

    if (!leave) {
      return res.status(404).json({
        message: "Không tìm thấy đơn nghỉ phép"
      });
    }

    const isOwner =
      req.user.employeeId &&
      leave.employeeId._id.toString() ===
        req.user.employeeId.toString();

    const canViewAll = ["admin", "hr"].includes(req.user.role);

    if (!isOwner && !canViewAll) {
      return res.status(403).json({
        message: "Bạn không có quyền xem đơn nghỉ này"
      });
    }

    res.json({
      message: "Lấy chi tiết đơn nghỉ thành công",
      data: leave
    });
  } catch (error) {
    next(error);
  }
}

async function processLeave(req, res, next, newStatus) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "ID đơn nghỉ không hợp lệ"
      });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        message: "Không tìm thấy đơn nghỉ phép"
      });
    }

    if (leave.status !== "pending") {
      return res.status(409).json({
        message: "Đơn nghỉ phép này đã được xử lý"
      });
    }

    leave.status = newStatus;
    leave.processedBy = req.user._id;
    leave.processedAt = new Date();

    await leave.save();

    res.json({
      message:
        newStatus === "approved"
          ? "Duyệt đơn nghỉ phép thành công"
          : "Từ chối đơn nghỉ phép thành công",
      data: leave
    });
  } catch (error) {
    next(error);
  }
}

async function approveLeave(req, res, next) {
  return processLeave(req, res, next, "approved");
}

async function rejectLeave(req, res, next) {
  return processLeave(req, res, next, "rejected");
}

module.exports = {
  createLeave,
  getLeaves,
  getMyLeaves,
  getLeaveById,
  approveLeave,
  rejectLeave
};