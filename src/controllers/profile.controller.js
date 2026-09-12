const User = require("../models/User");

function isValidAvatarUrl(value) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate(
        "employeeId",
        "employeeCode fullName email phone departmentId positionId status"
      );

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản"
      });
    }

    res.json({
      message: "Lấy hồ sơ cá nhân thành công",
      data: user
    });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { fullName, phone, address, avatarUrl } = req.body;

    if (
      avatarUrl !== undefined &&
      !isValidAvatarUrl(avatarUrl)
    ) {
      return res.status(400).json({
        message: "avatarUrl phải là đường dẫn HTTP hoặc HTTPS hợp lệ"
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản"
      });
    }

    if (fullName !== undefined) {
      if (!fullName.trim()) {
        return res.status(400).json({
          message: "Họ tên không được để trống"
        });
      }

      user.fullName = fullName.trim();
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    if (address !== undefined) {
      user.address = address.trim();
    }

    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl.trim();
    }

    /*
     * Không cập nhật role, status, email hoặc password ở API này,
     * kể cả khi client cố tình gửi lên.
     */
    await user.save();

    res.json({
      message: "Cập nhật hồ sơ cá nhân thành công",
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Vui lòng nhập mật khẩu cũ và mật khẩu mới"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu mới phải có ít nhất 6 ký tự"
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        message: "Mật khẩu mới phải khác mật khẩu cũ"
      });
    }

    const user = await User.findById(req.user._id).select(
      "+password"
    );

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản"
      });
    }

    const passwordCorrect =
      await user.comparePassword(oldPassword);

    if (!passwordCorrect) {
      return res.status(400).json({
        message: "Mật khẩu cũ không chính xác"
      });
    }

    user.password = newPassword;

    /*
     * pre("save") trong User model sẽ tự hash password mới.
     */
    await user.save();

    res.json({
      message: "Đổi mật khẩu thành công"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};