const mongoose = require("mongoose");

const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");

function getStartOfDay(date = new Date()) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

async function checkIn(req, res, next) {
  try {
    const employeeId =
      req.user.role === "staff"
        ? req.user.employeeId
        : req.body.employeeId || req.user.employeeId;

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

    const now = new Date();
    const attendanceDate = getStartOfDay(now);

    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: attendanceDate
    });

    if (existingAttendance) {
      return res.status(409).json({
        message: "Nhân viên đã check-in trong ngày hôm nay"
      });
    }

    // Quy ước sau 08:00 là đi muộn
    const lateTime = new Date(now);
    lateTime.setHours(8, 0, 0, 0);

    const attendance = await Attendance.create({
      employeeId,
      date: attendanceDate,
      checkIn: now,
      status: now > lateTime ? "late" : "present"
    });

    res.status(201).json({
      message: "Check-in thành công",
      data: attendance
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Nhân viên đã check-in trong ngày hôm nay"
      });
    }

    next(error);
  }
}

async function checkOut(req, res, next) {
  try {
    const employeeId =
      req.user.role === "staff"
        ? req.user.employeeId
        : req.body.employeeId || req.user.employeeId;

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

    const attendanceDate = getStartOfDay();

    const attendance = await Attendance.findOne({
      employeeId,
      date: attendanceDate
    });

    if (!attendance) {
      return res.status(400).json({
        message: "Bạn chưa check-in trong ngày hôm nay"
      });
    }

    if (attendance.checkOut) {
      return res.status(409).json({
        message: "Bạn đã check-out trong ngày hôm nay"
      });
    }

    const checkOutTime = new Date();

    if (checkOutTime <= attendance.checkIn) {
      return res.status(400).json({
        message: "Thời gian check-out không hợp lệ"
      });
    }

    const milliseconds =
      checkOutTime.getTime() - attendance.checkIn.getTime();

    attendance.checkOut = checkOutTime;
    attendance.workingHours =
      Math.round((milliseconds / (1000 * 60 * 60)) * 100) / 100;

    await attendance.save();

    res.json({
      message: "Check-out thành công",
      data: attendance
    });
  } catch (error) {
    next(error);
  }
}

async function getAttendances(req, res, next) {
  try {
    let {
      employeeId,
      fromDate,
      toDate,
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

    if (fromDate || toDate) {
      filter.date = {};

      if (fromDate) {
        const parsedFromDate = new Date(fromDate);

        if (Number.isNaN(parsedFromDate.getTime())) {
          return res.status(400).json({
            message: "fromDate không hợp lệ"
          });
        }

        filter.date.$gte = getStartOfDay(parsedFromDate);
      }

      if (toDate) {
        const parsedToDate = new Date(toDate);

        if (Number.isNaN(parsedToDate.getTime())) {
          return res.status(400).json({
            message: "toDate không hợp lệ"
          });
        }

        parsedToDate.setHours(23, 59, 59, 999);
        filter.date.$lte = parsedToDate;
      }
    }

    const skip = (page - 1) * limit;

    const [attendances, totalItems] = await Promise.all([
      Attendance.find(filter)
        .populate(
          "employeeId",
          "employeeCode fullName email departmentId positionId"
        )
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),

      Attendance.countDocuments(filter)
    ]);

    res.json({
      message: "Lấy danh sách chấm công thành công",
      data: attendances,
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

async function getMyAttendances(req, res, next) {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({
        message: "Tài khoản chưa được liên kết với nhân viên"
      });
    }

    const attendances = await Attendance.find({
      employeeId: req.user.employeeId
    })
      .populate("employeeId", "employeeCode fullName email")
      .sort({ date: -1 });

    res.json({
      message: "Lấy chấm công cá nhân thành công",
      data: attendances
    });
  } catch (error) {
    next(error);
  }
}

async function getAttendanceByEmployee(req, res, next) {
  try {
    const { employeeId } = req.params;

    if (!mongoose.isValidObjectId(employeeId)) {
      return res.status(400).json({
        message: "ID nhân viên không hợp lệ"
      });
    }

    const attendances = await Attendance.find({
      employeeId
    })
      .populate("employeeId", "employeeCode fullName email")
      .sort({ date: -1 });

    res.json({
      message: "Lấy chấm công nhân viên thành công",
      data: attendances
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  checkIn,
  checkOut,
  getAttendances,
  getMyAttendances,
  getAttendanceByEmployee
};
