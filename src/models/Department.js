const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên phòng ban không được để trống"],
      trim: true
    },

    code: {
      type: String,
      required: [true, "Mã phòng ban không được để trống"],
      unique: true,
      trim: true,
      uppercase: true
    },

    description: {
      type: String,
      trim: true,
      default: ""
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

module.exports = mongoose.model("Department", departmentSchema);