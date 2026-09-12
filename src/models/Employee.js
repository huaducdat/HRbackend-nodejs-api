const mongoose = require("mongoose");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const employeeSchema = new mongoose.Schema(
    {
        employeeCode: {
            type: String,
            required: [true, "Mã nhân viên không được để trống"],
            unique: true,
            trim: true,
            uppercase: true
        },

        fullName: {
            type: String,
            required: [true, "Họ tên không được để trống"],
            trim: true
        },

        email: {
            type: String,
            required: [true, "Email không được để trống"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [emailRegex, "Email không đúng định dạng"]
        },

        phone: {
            type: String,
            required: [true, "Số điện thoại không được để trống"],
            trim: true
        },

        gender: {
            type: String,
            enum: {
                values: ["male", "female", "other"],
                message: "Giới tính không hợp lệ"
            },
            required: true
        },

        dateOfBirth: {
            type: Date
        },

        address: {
            type: String,
            trim: true,
            default: ""
        },

        departmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            required: [true, "Phòng ban không được để trống"]
        },

        positionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Position",
            required: [true, "Chức vụ không được để trống"]
        },

        managerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            default: null
        },

        salary: {
            type: Number,
            required: [true, "Lương không được để trống"],
            min: [0, "Lương phải lớn hơn hoặc bằng 0"]
        },

        startDate: {
            type: Date,
            required: [true, "Ngày bắt đầu không được để trống"]
        },
        avatarUrl: {
            type: String,
            trim: true,
            default: ""
        },

        note: {
            type: String,
            trim: true,
            default: ""
        },
        status: {
            type: String,
            enum: {
                values: ["probation", "active", "inactive", "resigned"],
                message: "Trạng thái nhân viên không hợp lệ"
            },
            default: "probation"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Employee", employeeSchema);