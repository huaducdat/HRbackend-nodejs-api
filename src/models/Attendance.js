const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    checkIn: {
      type: Date,
      required: true
    },

    checkOut: {
      type: Date,
      default: null
    },

    workingHours: {
      type: Number,
      default: 0,
      min: 0
    },

    status: {
      type: String,
      enum: ["present", "late", "absent", "leave"],
      default: "present"
    }
  },
  {
    timestamps: true
  }
);

// Một nhân viên chỉ có một bản chấm công mỗi ngày
attendanceSchema.index(
  { employeeId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);