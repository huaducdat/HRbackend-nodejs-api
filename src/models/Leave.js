const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },

    leaveType: {
      type: String,
      enum: {
        values: ["annual", "sick", "unpaid"],
        message: "Loại nghỉ phép không hợp lệ"
      },
      required: true
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    reason: {
      type: String,
      required: [true, "Lý do nghỉ không được để trống"],
      trim: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    processedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

leaveSchema.pre("validate", function () {
  if (
    this.startDate &&
    this.endDate &&
    this.startDate > this.endDate
  ) {
    throw new Error(
      "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc"
    );
  }
});

module.exports = mongoose.model("Leave", leaveSchema);