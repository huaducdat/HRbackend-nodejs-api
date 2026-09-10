const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
    {
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

        password: {
            type: String,
            required: [true, "Mật khẩu không được để trống"],
            minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"],
            select: false
        },

        role: {
            type: String,
            enum: {
                values: ["admin", "hr", "staff"],
                message: "Vai trò không hợp lệ"
            },
            default: "staff"
        },

        status: {
            type: String,
            enum: {
                values: ["active", "inactive"],
                message: "Trạng thái không hợp lệ"
            },
            default: "active"
        },
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            default: null
        }
    },
    {
        timestamps: true
    }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);