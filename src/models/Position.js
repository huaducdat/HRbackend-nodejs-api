const mongoose = require("mongoose");

const positionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên chức vụ không được để trống"],
      trim: true
    },

    code: {
      type: String,
      required: [true, "Mã chức vụ không được để trống"],
      unique: true,
      trim: true,
      uppercase: true
    },

    description: {
      type: String,
      trim: true,
      default: ""
    },

    baseSalary: {
      type: Number,
      default: 0,
      min: [0, "Lương cơ bản phải lớn hơn hoặc bằng 0"]
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Position", positionSchema);
